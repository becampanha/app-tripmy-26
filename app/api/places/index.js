import { getSql } from '../_db.js';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const sql = getSql();
  const rows = await sql.query('SELECT * FROM places ORDER BY name');

  const places = rows.map((r) => ({
    id: r.id,
    name: r.name,
    category: r.category,
    tag: r.tag,
    address: r.address,
    rating: r.rating,
    googleMapsUri: r.google_maps_uri,
    photo: r.photo,
    dishPhotos: r.dish_photos || [],
    cost: r.cost,
    hours: r.hours,
    distanceFromHotel: r.distance_from_hotel,
    menuLabel: r.menu_label,
    reviewLabel: r.review_label,
    recommendation: r.recommendation,
  }));

  return res.status(200).json(places);
}
