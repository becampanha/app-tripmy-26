import { getSql } from './_db.js';

// GET /api/attractions — retorna todas as atrações agrupadas por parque e
// área, já ordenadas (park_sort_order, area_sort_order, sort_order — a
// mesma ordem em que apareciam na planilha original).
export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const sql = getSql();
  const rows = await sql.query(`
    SELECT * FROM attractions
    ORDER BY park_sort_order, area_sort_order, sort_order
  `);

  const parksById = new Map();
  for (const r of rows) {
    if (!parksById.has(r.park_id)) {
      parksById.set(r.park_id, { id: r.park_id, name: r.park_name, emoji: r.park_emoji, areas: [] });
    }
    const park = parksById.get(r.park_id);
    let area = park.areas.find((a) => a.name === r.area);
    if (!area) {
      area = { name: r.area, attractions: [] };
      park.areas.push(area);
    }
    area.attractions.push({
      id: r.id,
      name: r.name,
      required: r.required,
      type: r.type,
      duration: r.duration,
      queue: r.queue_time,
      bestTime: r.best_time,
      restrictions: r.restrictions,
      parentSwap: r.parent_swap,
      intensity: r.intensity,
      photo: r.photo,
    });
  }

  return res.status(200).json(Array.from(parksById.values()));
}
