import { getSql } from './_db.js';

// GET    /api/shopping?traveler=... — lista os itens de um viajante
// POST   /api/shopping — cria um item novo
// PUT    /api/shopping?id=... — edita um item
// DELETE /api/shopping?id=... — remove um item
export default async function handler(req, res) {
  const sql = getSql();

  if (req.method === 'GET') {
    const { traveler } = req.query;
    if (!traveler || typeof traveler !== 'string') {
      return res.status(400).json({ error: 'Parâmetro "traveler" é obrigatório' });
    }

    const rows = await sql.query(
      'SELECT * FROM shopping_items WHERE traveler = $1 ORDER BY created_at DESC',
      [traveler]
    );

    const items = rows.map((r) => ({
      id: r.id,
      traveler: r.traveler,
      category: r.category,
      name: r.name,
      brand: r.brand,
      link: r.link,
      price: r.price,
      notes: r.notes,
      photo: r.photo,
      createdAt: r.created_at,
    }));

    return res.status(200).json(items);
  }

  if (req.method === 'POST') {
    const { traveler, category, name, brand, link, price, notes, photo } = req.body || {};
    if (!traveler || !category || !name) {
      return res.status(400).json({ error: 'Campos "traveler", "category" e "name" são obrigatórios' });
    }

    const rows = await sql.query(
      `INSERT INTO shopping_items (traveler, category, name, brand, link, price, notes, photo)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
      [traveler, category, name, brand || null, link || null, price ?? null, notes || null, photo || null]
    );

    const r = rows[0];
    return res.status(201).json({
      id: r.id,
      traveler: r.traveler,
      category: r.category,
      name: r.name,
      brand: r.brand,
      link: r.link,
      price: r.price,
      notes: r.notes,
      photo: r.photo,
      createdAt: r.created_at,
    });
  }

  if (req.method === 'PUT') {
    const { id } = req.query;
    if (!id) {
      return res.status(400).json({ error: 'Parâmetro "id" é obrigatório' });
    }

    const { category, name, brand, link, price, notes, photo } = req.body || {};
    if (!category || !name) {
      return res.status(400).json({ error: 'Campos "category" e "name" são obrigatórios' });
    }

    await sql.query(
      'UPDATE shopping_items SET category = $1, name = $2, brand = $3, link = $4, price = $5, notes = $6, photo = $7 WHERE id = $8',
      [category, name, brand || null, link || null, price ?? null, notes || null, photo || null, id]
    );
    return res.status(200).json({ ok: true });
  }

  if (req.method === 'DELETE') {
    const { id } = req.query;
    if (!id) {
      return res.status(400).json({ error: 'Parâmetro "id" é obrigatório' });
    }
    await sql.query('DELETE FROM shopping_items WHERE id = $1', [id]);
    return res.status(200).json({ ok: true });
  }

  res.setHeader('Allow', 'GET, POST, PUT, DELETE');
  return res.status(405).json({ error: 'Method not allowed' });
}
