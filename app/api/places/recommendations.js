import { getSql } from '../_db.js';

// GET  /api/places/recommendations?placeId=... — lista as recomendações de um lugar
// POST /api/places/recommendations — cria uma nova recomendação
export default async function handler(req, res) {
  const sql = getSql();

  if (req.method === 'GET') {
    const { placeId } = req.query;
    if (!placeId || typeof placeId !== 'string') {
      return res.status(400).json({ error: 'Parâmetro "placeId" é obrigatório' });
    }

    const rows = await sql.query(
      'SELECT * FROM place_recommendations WHERE place_id = $1 ORDER BY created_at DESC',
      [placeId]
    );

    const recommendations = rows.map((r) => ({
      id: r.id,
      description: r.description,
      photo: r.photo,
      createdAt: r.created_at,
    }));

    return res.status(200).json(recommendations);
  }

  if (req.method === 'POST') {
    const { placeId, description, photo } = req.body || {};
    if (!placeId || !description) {
      return res.status(400).json({ error: 'Campos "placeId" e "description" são obrigatórios' });
    }

    const rows = await sql.query(
      `INSERT INTO place_recommendations (place_id, description, photo)
       VALUES ($1, $2, $3)
       RETURNING *`,
      [placeId, description, photo || null]
    );

    const r = rows[0];
    return res.status(201).json({
      id: r.id,
      description: r.description,
      photo: r.photo,
      createdAt: r.created_at,
    });
  }

  res.setHeader('Allow', 'GET, POST');
  return res.status(405).json({ error: 'Method not allowed' });
}
