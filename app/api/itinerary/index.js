import { getSql } from '../_db.js';

function mapPlace(row) {
  if (!row.place_id) return null;
  return {
    id: row.place_id,
    name: row.place_name,
    category: row.place_category,
    tag: row.place_tag,
    address: row.place_address,
    rating: row.place_rating,
    googleMapsUri: row.place_google_maps_uri,
    photo: row.place_photo,
    dishPhotos: row.place_dish_photos || [],
    cost: row.place_cost,
    hours: row.place_hours,
    menuLabel: row.place_menu_label,
    reviewLabel: row.place_review_label,
    recommendation: row.place_recommendation,
  };
}

function mapAttraction(row) {
  if (!row.attraction_id) return null;
  return {
    id: row.attraction_id,
    name: row.attraction_name,
    parkName: row.attraction_park_name,
    parkEmoji: row.attraction_park_emoji,
    area: row.attraction_area,
    type: row.attraction_type,
    duration: row.attraction_duration,
    queue: row.attraction_queue_time,
    bestTime: row.attraction_best_time,
    restrictions: row.attraction_restrictions,
    parentSwap: row.attraction_parent_swap,
    intensity: row.attraction_intensity,
    photo: row.attraction_photo,
  };
}

export default async function handler(req, res) {
  const sql = getSql();

  if (req.method === 'GET') {
    const rows = await sql.query(`
      SELECT
        d.id AS day_id, d.date, d.weekday, d.theme, d.sort_order AS day_sort_order,
        a.id AS activity_id, a.time, a.title, a.subtitle, a.address, a.sort_order AS activity_sort_order,
        p.id AS place_id, p.name AS place_name, p.category AS place_category, p.tag AS place_tag,
        p.address AS place_address, p.rating AS place_rating, p.google_maps_uri AS place_google_maps_uri,
        p.photo AS place_photo, p.dish_photos AS place_dish_photos, p.cost AS place_cost,
        p.hours AS place_hours,
        p.menu_label AS place_menu_label, p.review_label AS place_review_label,
        p.recommendation AS place_recommendation,
        att.id AS attraction_id, att.name AS attraction_name, att.park_name AS attraction_park_name,
        att.park_emoji AS attraction_park_emoji, att.area AS attraction_area, att.type AS attraction_type,
        att.duration AS attraction_duration, att.queue_time AS attraction_queue_time,
        att.best_time AS attraction_best_time, att.restrictions AS attraction_restrictions,
        att.parent_swap AS attraction_parent_swap, att.intensity AS attraction_intensity,
        att.photo AS attraction_photo
      FROM days d
      LEFT JOIN activities a ON a.day_id = d.id
      LEFT JOIN places p ON p.id = a.place_id
      LEFT JOIN attractions att ON att.id = a.attraction_id
      ORDER BY d.sort_order, a.sort_order
    `);

    const daysMap = new Map();
    for (const row of rows) {
      if (!daysMap.has(row.day_id)) {
        daysMap.set(row.day_id, {
          id: row.day_id,
          date: row.date,
          weekday: row.weekday,
          theme: row.theme,
          activities: [],
        });
      }
      if (row.activity_id) {
        daysMap.get(row.day_id).activities.push({
          id: row.activity_id,
          time: row.time,
          title: row.title,
          subtitle: row.subtitle,
          address: row.address,
          place: mapPlace(row),
          attraction: mapAttraction(row),
        });
      }
    }

    return res.status(200).json(Array.from(daysMap.values()));
  }

  res.setHeader('Allow', 'GET');
  return res.status(405).json({ error: 'Method not allowed' });
}
