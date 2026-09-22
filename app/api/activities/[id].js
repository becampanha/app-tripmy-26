import { getSql } from '../_db.js';

// PUT /api/activities/:id — edita campos de uma atividade (inclui vincular/desvincular lugar)
// DELETE /api/activities/:id — remove uma atividade
export default async function handler(req, res) {
  const sql = getSql();
  const { id } = req.query;

  if (req.method === 'PUT') {
    const { time, title, subtitle, address, placeId } = req.body || {};

    const fields = [];
    const values = [];
    let i = 1;

    if (time !== undefined) { fields.push(`time = $${i++}`); values.push(time); }
    if (title !== undefined) { fields.push(`title = $${i++}`); values.push(title); }
    if (subtitle !== undefined) { fields.push(`subtitle = $${i++}`); values.push(subtitle); }
    if (address !== undefined) { fields.push(`address = $${i++}`); values.push(address); }
    if (placeId !== undefined) { fields.push(`place_id = $${i++}`); values.push(placeId); }

    if (fields.length === 0) {
      return res.status(400).json({ error: 'Nenhum campo para atualizar' });
    }

    values.push(id);
    await sql.query(`UPDATE activities SET ${fields.join(', ')} WHERE id = $${i}`, values);
    return res.status(200).json({ ok: true });
  }

  if (req.method === 'DELETE') {
    await sql.query('DELETE FROM activities WHERE id = $1', [id]);
    return res.status(200).json({ ok: true });
  }

  res.setHeader('Allow', 'PUT, DELETE');
  return res.status(405).json({ error: 'Method not allowed' });
}
