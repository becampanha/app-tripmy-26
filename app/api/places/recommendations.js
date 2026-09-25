import { getSql } from '../_db.js';

// GET    /api/places/recommendations?placeId=... — lista as recomendações de um lugar
// GET    /api/places/recommendations (sem placeId) — lista TODAS as recomendações,
//        de todos os lugares, cada uma já com os dados do lugar (nome/foto/tag/endereço)
// POST   /api/places/recommendations — cria uma nova recomendação
// PUT    /api/places/recommendations?id=... — edita título/autor/descrição de uma recomendação
// DELETE /api/places/recommendations?id=... — remove uma recomendação
//        (rota consolidada aqui, não em [id].js, por causa do limite de 12
//        Serverless Functions do plano Hobby da Vercel — ver api/places/google.js)
export default async function handler(req, res) {
  const sql = getSql();

  if (req.method === 'GET') {
    const { placeId } = req.query;

    if (!placeId) {
      const rows = await sql.query(
        `SELECT r.*, p.name AS place_name, p.photo AS place_photo, p.tag AS place_tag, p.address AS place_address
         FROM place_recommendations r
         JOIN places p ON p.id = r.place_id
         ORDER BY r.created_at DESC`
      );

      const recommendations = rows.map((r) => ({
        id: r.id,
        title: r.title,
        author: r.author,
        description: r.description,
        photo: r.photo,
        createdAt: r.created_at,
        place: {
          id: r.place_id,
          name: r.place_name,
          photo: r.place_photo,
          tag: r.place_tag,
          address: r.place_address,
        },
      }));

      return res.status(200).json(recommendations);
    }

    if (typeof placeId !== 'string') {
      return res.status(400).json({ error: 'Parâmetro "placeId" inválido' });
    }

    const rows = await sql.query(
      'SELECT * FROM place_recommendations WHERE place_id = $1 ORDER BY created_at DESC',
      [placeId]
    );

    const recommendations = rows.map((r) => ({
      id: r.id,
      title: r.title,
      author: r.author,
      description: r.description,
      photo: r.photo,
      createdAt: r.created_at,
    }));

    return res.status(200).json(recommendations);
  }

  if (req.method === 'POST') {
    const { placeId, title, author, description, photo } = req.body || {};
    if (!placeId || !description) {
      return res.status(400).json({ error: 'Campos "placeId" e "description" são obrigatórios' });
    }

    const rows = await sql.query(
      `INSERT INTO place_recommendations (place_id, title, author, description, photo)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [placeId, title || null, author || null, description, photo || null]
    );

    const r = rows[0];
    return res.status(201).json({
      id: r.id,
      title: r.title,
      author: r.author,
      description: r.description,
      photo: r.photo,
      createdAt: r.created_at,
    });
  }

  if (req.method === 'PUT') {
    const { id } = req.query;
    if (!id) {
      return res.status(400).json({ error: 'Parâmetro "id" é obrigatório' });
    }

    const { title, author, description, photo } = req.body || {};
    if (!description) {
      return res.status(400).json({ error: 'Campo "description" é obrigatório' });
    }

    await sql.query(
      'UPDATE place_recommendations SET title = $1, author = $2, description = $3, photo = $4 WHERE id = $5',
      [title || null, author || null, description, photo || null, id]
    );
    return res.status(200).json({ ok: true });
  }

  if (req.method === 'DELETE') {
    const { id } = req.query;
    if (!id) {
      return res.status(400).json({ error: 'Parâmetro "id" é obrigatório' });
    }
    await sql.query('DELETE FROM place_recommendations WHERE id = $1', [id]);
    return res.status(200).json({ ok: true });
  }

  res.setHeader('Allow', 'GET, POST, PUT, DELETE');
  return res.status(405).json({ error: 'Method not allowed' });
}
