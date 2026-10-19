import { getSql } from '../_db.js';

// POST /api/activities — cria uma nova atividade no fim do dia informado (ou
// no fim dos subitens de um card, se parentActivityId for informado)
// POST /api/activities?action=reorder — body: { items: [{ id, dayId, sortOrder, parentActivityId }] }
//      atualiza sort_order, day_id e parent_activity_id em lote (move entre
//      dias ou entre nível raiz/dentro de um card — ver ItineraryCardItem)
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
        'UPDATE activities SET sort_order = $1, day_id = $2, parent_activity_id = $3 WHERE id = $4',
        [item.sortOrder, item.dayId, item.parentActivityId ?? null, item.id]
      );
    }

    return res.status(200).json({ ok: true });
  }

  if (req.method === 'POST') {
    const { dayId, time, title, subtitle, address, placeId, attractionId, type, parentActivityId } = req.body || {};
    if (!dayId) {
      return res.status(400).json({ error: 'dayId é obrigatório' });
    }

    const activityType = type === 'itinerary' || type === 'itinerary_item' ? type : 'simple';
    // Um card 'itinerary' nunca tem pai (sem aninhamento de 2 níveis); um
    // subitem SEMPRE precisa de pai. Horário não existe pra subitem — a
    // ordem entre irmãos (sort_order) é o único "quando" que importa.
    if (activityType === 'itinerary' && parentActivityId) {
      return res.status(400).json({ error: 'Um card de roteiro não pode ter parentActivityId' });
    }
    if (activityType === 'itinerary_item' && !parentActivityId) {
      return res.status(400).json({ error: 'parentActivityId é obrigatório para um subitem de roteiro' });
    }

    // next_order é escopado ao mesmo "grupo de irmãos": o dia inteiro para
    // atividades/cards de nível raiz, ou só os subitens do mesmo card pai.
    const [{ next_order }] = await sql.query(
      parentActivityId
        ? 'SELECT COALESCE(MAX(sort_order), -1) + 1 AS next_order FROM activities WHERE parent_activity_id = $1'
        : 'SELECT COALESCE(MAX(sort_order), -1) + 1 AS next_order FROM activities WHERE day_id = $1 AND parent_activity_id IS NULL',
      [parentActivityId || dayId]
    );

    // Lugar e atração são mutuamente exclusivos — vincular um implica
    // deixar o outro vazio, nunca os dois ao mesmo tempo (ver ActivityItem.jsx).
    const [row] = await sql.query(
      `INSERT INTO activities (day_id, time, title, subtitle, address, place_id, attraction_id, sort_order, type, parent_activity_id)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING id`,
      [
        dayId,
        activityType === 'itinerary_item' ? '' : (time || ''),
        title || '',
        subtitle || '',
        address || null,
        attractionId ? null : (placeId || null),
        attractionId || null,
        next_order,
        activityType,
        parentActivityId || null,
      ]
    );

    return res.status(201).json({ id: row.id });
  }

  res.setHeader('Allow', 'POST');
  return res.status(405).json({ error: 'Method not allowed' });
}
