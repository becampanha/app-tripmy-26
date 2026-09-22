import { getSql } from '../_db.js';

// POST /api/activities/reorder — body: { items: [{ id, dayId, sortOrder }] }
// Atualiza sort_order (e opcionalmente day_id, para mover entre dias) em lote.
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const sql = getSql();
  const { items } = req.body || {};
  if (!Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ error: 'items é obrigatório e deve ser um array não vazio' });
  }

  for (const item of items) {
    await sql.query(
      'UPDATE activities SET sort_order = $1, day_id = $2 WHERE id = $3',
      [item.sortOrder, item.dayId, item.id]
    );
  }

  return res.status(200).json({ ok: true });
}
