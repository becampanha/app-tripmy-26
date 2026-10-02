import { getSql } from '../_db.js';

// PUT /api/days/:id — edita campos de um dia (hoje só o tema/título)
//
// POST /api/days/swap?action=swap — body: { dayIdA, dayIdB }
// Troca o CONTEÚDO de dois dias (tema + todas as atividades vinculadas),
// mantendo date/weekday/sort_order intocados nos dois — ou seja, as
// posições "Dia 3" e "Dia 7" continuam nos mesmos lugares da viagem, só o
// que está programado em cada uma migra de um lado pro outro. Dividido via
// ?action (não um arquivo próprio) porque o plano Hobby da Vercel limita a
// 12 serverless functions por deployment.
async function swapDays(req, res, sql) {
  const { dayIdA, dayIdB } = req.body || {};
  if (!dayIdA || !dayIdB || dayIdA === dayIdB) {
    return res.status(400).json({ error: '"dayIdA" e "dayIdB" são obrigatórios e devem ser diferentes' });
  }

  const days = await sql.query('SELECT id, theme FROM days WHERE id = $1 OR id = $2', [dayIdA, dayIdB]);
  const dayA = days.find((d) => d.id === dayIdA);
  const dayB = days.find((d) => d.id === dayIdB);
  if (!dayA || !dayB) {
    return res.status(404).json({ error: 'Um dos dias informados não existe' });
  }

  await sql.transaction([
    sql.query('UPDATE days SET theme = $1 WHERE id = $2', [dayB.theme, dayIdA]),
    sql.query('UPDATE days SET theme = $1 WHERE id = $2', [dayA.theme, dayIdB]),
    // CASE numa única instrução (não duas UPDATEs separados) porque day_id
    // tem foreign key pra days — um valor intermediário temporário (ex: id
    // negativo) violaria a constraint antes da segunda instrução rodar.
    sql.query(
      'UPDATE activities SET day_id = CASE WHEN day_id = $1 THEN $2 ELSE $1 END WHERE day_id IN ($1, $2)',
      [dayIdA, dayIdB]
    ),
  ]);

  return res.status(200).json({ ok: true });
}

export default async function handler(req, res) {
  const sql = getSql();

  if (req.method === 'POST' && req.query.action === 'swap') {
    return swapDays(req, res, sql);
  }

  const { id } = req.query;

  if (req.method === 'PUT') {
    const { theme } = req.body || {};

    if (theme === undefined) {
      return res.status(400).json({ error: 'Nenhum campo para atualizar' });
    }

    await sql.query('UPDATE days SET theme = $1 WHERE id = $2', [theme, id]);
    return res.status(200).json({ ok: true });
  }

  res.setHeader('Allow', 'PUT, POST');
  return res.status(405).json({ error: 'Method not allowed' });
}
