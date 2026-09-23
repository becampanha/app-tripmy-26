import { getSql } from '../_db.js';
import { FIELD_MAP } from './_fields.js';

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
    values.push(key === 'dishPhotos' ? JSON.stringify(body[key]) : body[key]);
  }

  await sql.query(`INSERT INTO places (${columns.join(', ')}) VALUES (${placeholders.join(', ')})`, values);
  return res.status(201).json({ id });
}

export default async function handler(req, res) {
  if (req.method === 'POST') {
    return create(req, res);
  }

  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET, POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const sql = getSql();
  const rows = await sql.query('SELECT * FROM places ORDER BY name');

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
    cost: r.cost,
    hours: r.hours,
    menuLabel: r.menu_label,
    reviewLabel: r.review_label,
    recommendation: r.recommendation,
  }));

  return res.status(200).json(places);
}
