import { getSql } from '../_db.js';
import { FIELD_MAP } from './_fields.js';

// PUT /api/places/:id — edita campos de um lugar
// DELETE /api/places/:id — remove um lugar (desvincula de atividades que o referenciam)
export default async function handler(req, res) {
  const sql = getSql();
  const { id } = req.query;

  if (req.method === 'PUT') {
    const body = req.body || {};
    const fields = [];
    const values = [];
    let i = 1;

    for (const [key, column] of Object.entries(FIELD_MAP)) {
      if (body[key] === undefined) continue;
      fields.push(`${column} = $${i++}`);
      values.push(key === 'dishPhotos' ? JSON.stringify(body[key]) : body[key]);
    }

    if (fields.length === 0) {
      return res.status(400).json({ error: 'Nenhum campo para atualizar' });
    }

    values.push(id);
    await sql.query(`UPDATE places SET ${fields.join(', ')} WHERE id = $${i}`, values);
    return res.status(200).json({ ok: true });
  }

  if (req.method === 'DELETE') {
    await sql.query('DELETE FROM places WHERE id = $1', [id]);
    return res.status(200).json({ ok: true });
  }

  res.setHeader('Allow', 'PUT, DELETE');
  return res.status(405).json({ error: 'Method not allowed' });
}
