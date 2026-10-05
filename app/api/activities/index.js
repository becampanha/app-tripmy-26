import { getSql } from '../_db.js';

// POST /api/activities — cria uma nova atividade no fim do dia informado
// POST /api/activities?action=reorder — body: { items: [{ id, dayId, sortOrder }] }
//      atualiza sort_order (e opcionalmente day_id, para mover entre dias) em lote
//      (consolidada aqui, não em reorder.js, por causa do limite de 12
//      Serverless Functions do plano Hobby da Vercel — ver api/places/google.js)
export default async function handler(req, res) {
  const sql = getSql();

  if (req.method === 'POST' && req.query.action === 'reorder') {
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

  if (req.method === 'POST') {
    const { dayId, time, title, subtitle, address, placeId } = req.body || {};
    if (!dayId) {
      return res.status(400).json({ error: 'dayId é obrigatório' });
    }

    const [{ next_order }] = await sql.query(
      'SELECT COALESCE(MAX(sort_order), -1) + 1 AS next_order FROM activities WHERE day_id = $1',
      [dayId]
    );

    const [row] = await sql.query(
      `INSERT INTO activities (day_id, time, title, subtitle, address, place_id, sort_order)
       VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING id`,
      [dayId, time || '', title || '', subtitle || '', address || null, placeId || null, next_order]
    );

    return res.status(201).json({ id: row.id });
  }

  res.setHeader('Allow', 'POST');
  return res.status(405).json({ error: 'Method not allowed' });
}
