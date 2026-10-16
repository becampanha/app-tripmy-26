import { getSql } from '../_db.js';
import { FIELD_MAP } from './_fields.js';

// GET    /api/places?resource=areas — lista todas as áreas, agrupadas por
//        categoria: { "Restaurante": [{id,name}, ...], "Mercado": [...], ... }
// POST   /api/places?resource=areas — cria uma área. Body: { category, name }
// PUT    /api/places?resource=areas&id=... — renomeia uma área. Body: { name }
//        — propaga o novo nome para places.subcategory em cascata (mesma
//        category + subcategory = nome antigo)
// DELETE /api/places?resource=areas&id=... — remove uma área; bloqueia com
//        409 se algum lugar ainda estiver usando essa área
// (consolidado aqui, não em rota própria, por causa do limite de 12
// Serverless Functions do plano Hobby da Vercel — ver api/places/google.js)
async function areasHandler(req, res) {
  const sql = getSql();

  if (req.method === 'GET') {
    const rows = await sql.query('SELECT id, category, name FROM place_areas ORDER BY category, position, name');
    const byCategory = {};
    for (const r of rows) {
      if (!byCategory[r.category]) byCategory[r.category] = [];
      byCategory[r.category].push({ id: r.id, name: r.name });
    }
    return res.status(200).json(byCategory);
  }

  if (req.method === 'POST') {
    const { category, name } = req.body || {};
    if (!category || !name) {
      return res.status(400).json({ error: 'Campos "category" e "name" são obrigatórios' });
    }

    const [{ next_position }] = await sql.query(
      'SELECT COALESCE(MAX(position) + 1, 0) AS next_position FROM place_areas WHERE category = $1',
      [category]
    );

    try {
      const rows = await sql.query(
        'INSERT INTO place_areas (category, name, position) VALUES ($1, $2, $3) RETURNING id',
        [category, name.trim(), next_position]
      );
      return res.status(201).json({ id: rows[0].id, category, name: name.trim() });
    } catch (err) {
      if (err.code === '23505') {
        return res.status(409).json({ error: 'Essa área já existe nessa categoria' });
      }
      throw err;
    }
  }

  const { id } = req.query;
  if (!id) {
    return res.status(400).json({ error: 'Parâmetro "id" é obrigatório' });
  }

  if (req.method === 'PUT') {
    const { name } = req.body || {};
    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'Campo "name" é obrigatório' });
    }

    const existing = await sql.query('SELECT category, name FROM place_areas WHERE id = $1', [id]);
    if (existing.length === 0) {
      return res.status(404).json({ error: 'Área não encontrada' });
    }
    const { category, name: oldName } = existing[0];
    const newName = name.trim();

    try {
      await sql.query('UPDATE place_areas SET name = $1 WHERE id = $2', [newName, id]);
    } catch (err) {
      if (err.code === '23505') {
        return res.status(409).json({ error: 'Essa área já existe nessa categoria' });
      }
      throw err;
    }

    if (newName !== oldName) {
      await sql.query(
        'UPDATE places SET subcategory = $1 WHERE category = $2 AND subcategory = $3',
        [newName, category, oldName]
      );
    }

    return res.status(200).json({ ok: true });
  }

  if (req.method === 'DELETE') {
    const existing = await sql.query('SELECT category, name FROM place_areas WHERE id = $1', [id]);
    if (existing.length === 0) {
      return res.status(404).json({ error: 'Área não encontrada' });
    }
    const { category, name } = existing[0];

    const [{ count }] = await sql.query(
      'SELECT COUNT(*) AS count FROM places WHERE category = $1 AND subcategory = $2',
      [category, name]
    );
    if (Number(count) > 0) {
      return res.status(409).json({ error: `${count} lugar(es) ainda usam essa área. Reatribua antes de remover.` });
    }

    await sql.query('DELETE FROM place_areas WHERE id = $1', [id]);
    return res.status(200).json({ ok: true });
  }

  res.setHeader('Allow', 'GET, POST, PUT, DELETE');
  return res.status(405).json({ error: 'Method not allowed' });
}

// POST /api/places — cria um novo lugar. Espera { id, name, category, ... }
// (mesmos campos aceitos pelo PUT de edição) — id é o place_id do Google.
async function create(req, res) {
  const sql = getSql();
  const body = req.body || {};
  const { id } = body;

  if (!id || !body.name || !body.category) {
    return res.status(400).json({ error: 'Campos "id", "name" e "category" são obrigatórios' });
  }

  const columns = ['id'];
  const placeholders = ['$1'];
  const values = [id];
  let i = 2;

  for (const [key, column] of Object.entries(FIELD_MAP)) {
    if (body[key] === undefined) continue;
    columns.push(column);
    placeholders.push(`$${i++}`);
    values.push(key === 'dishPhotos' || key === 'hoursSchedule' ? JSON.stringify(body[key]) : body[key]);
  }

  await sql.query(`INSERT INTO places (${columns.join(', ')}) VALUES (${placeholders.join(', ')})`, values);
  return res.status(201).json({ id });
}

export default async function handler(req, res) {
  if (req.query.resource === 'areas') {
    return areasHandler(req, res);
  }

  if (req.method === 'POST') {
    return create(req, res);
  }

  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET, POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const sql = getSql();
  const rows = await sql.query('SELECT * FROM places ORDER BY name');

  // Favoritos são por viajante (ver place_favorites) — um lugar pode ter
  // vários favoritos (um de cada pessoa que marcou). Buscado à parte, em
  // lote, em vez de JOIN na query principal (evitaria duplicar linha de
  // lugar por favorito); agrupado aqui em memória por place_id.
  const favoriteRows = await sql.query('SELECT place_id, traveler FROM place_favorites');
  const favoritesByPlace = new Map();
  for (const f of favoriteRows) {
    if (!favoritesByPlace.has(f.place_id)) favoritesByPlace.set(f.place_id, []);
    favoritesByPlace.get(f.place_id).push(f.traveler);
  }

  // Fotos de dica (place_recommendations.photo) substituem as fotos de
  // prato/produto (dish_photos) no card da lista de Lugares — mesmo padrão
  // de busca em lote do favoritesByPlace acima. Só as dicas que têm foto
  // (uma dica pode ser só texto) e que estão vinculadas a um lugar entram
  // aqui; mais recentes primeiro, igual à ordenação já usada em
  // /api/places/recommendations.
  const recommendationPhotoRows = await sql.query(
    `SELECT place_id, photo FROM place_recommendations
     WHERE place_id IS NOT NULL AND photo IS NOT NULL
     ORDER BY created_at DESC`
  );
  const recommendationPhotosByPlace = new Map();
  for (const r of recommendationPhotoRows) {
    if (!recommendationPhotosByPlace.has(r.place_id)) recommendationPhotosByPlace.set(r.place_id, []);
    recommendationPhotosByPlace.get(r.place_id).push(r.photo);
  }

  const places = rows.map((r) => ({
    id: r.id,
    name: r.name,
    category: r.category,
    subcategory: r.subcategory,
    tag: r.tag,
    address: r.address,
    rating: r.rating,
    googleMapsUri: r.google_maps_uri,
    photo: r.photo,
    dishPhotos: r.dish_photos || [],
    recommendationPhotos: recommendationPhotosByPlace.get(r.id) || [],
    cost: r.cost,
    hours: r.hours,
    hoursSchedule: r.hours_schedule,
    menuLabel: r.menu_label,
    reviewLabel: r.review_label,
    recommendation: r.recommendation,
    menuUri: r.menu_uri,
    favoritedBy: favoritesByPlace.get(r.id) || [],
  }));

  return res.status(200).json(places);
}
