import { getSql } from '../_db.js';

// POST /api/activities — cria uma nova atividade no fim do dia informado
export default async function handler(req, res) {
  const sql = getSql();

  if (req.method === 'POST') {
    const { dayId, time, title, subtitle, address, placeId } = req.body || {};
    if (!dayId || !time || !title) {
      return res.status(400).json({ error: 'dayId, time e title são obrigatórios' });
    }

    const [{ next_order }] = await sql.query(
      'SELECT COALESCE(MAX(sort_order), -1) + 1 AS next_order FROM activities WHERE day_id = $1',
      [dayId]
    );

    const [row] = await sql.query(
      `INSERT INTO activities (day_id, time, title, subtitle, address, place_id, sort_order)
       VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING id`,
      [dayId, time, title, subtitle || '', address || null, placeId || null, next_order]
    );

    return res.status(201).json({ id: row.id });
  }

  res.setHeader('Allow', 'POST');
  return res.status(405).json({ error: 'Method not allowed' });
}
