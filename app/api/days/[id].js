import { getSql } from '../_db.js';

// PUT /api/days/:id — edita campos de um dia (hoje só o tema/título)
export default async function handler(req, res) {
  const sql = getSql();
  const { id } = req.query;

  if (req.method === 'PUT') {
    const { theme } = req.body || {};

    if (theme === undefined) {
      return res.status(400).json({ error: 'Nenhum campo para atualizar' });
    }

    await sql.query('UPDATE days SET theme = $1 WHERE id = $2', [theme, id]);
    return res.status(200).json({ ok: true });
  }

  res.setHeader('Allow', 'PUT');
  return res.status(405).json({ error: 'Method not allowed' });
}
