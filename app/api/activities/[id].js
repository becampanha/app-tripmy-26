import { getSql } from '../_db.js';

// PUT /api/activities/:id — edita campos de uma atividade (inclui vincular/desvincular lugar)
// DELETE /api/activities/:id — remove uma atividade
export default async function handler(req, res) {
  const sql = getSql();
  const { id } = req.query;

  if (req.method === 'PUT') {
    const { time, title, subtitle, address, placeId, attractionId, dayId, sortOrder, parentActivityId } = req.body || {};

    const fields = [];
    const values = [];
    let i = 1;

    if (time !== undefined) { fields.push(`time = $${i++}`); values.push(time); }
    if (title !== undefined) { fields.push(`title = $${i++}`); values.push(title); }
    if (subtitle !== undefined) { fields.push(`subtitle = $${i++}`); values.push(subtitle); }
    if (address !== undefined) { fields.push(`address = $${i++}`); values.push(address); }
    // Lugar e atração são mutuamente exclusivos — vincular um zera o outro.
    // Os dois ifs abaixo nunca podem gerar dois `SET` pra mesma coluna
    // (Postgres rejeita com "multiple assignments to same column"): cada
    // coluna só ganha uma entrada em `fields`, decidida por um único if/else
    // por campo recebido, não dois ifs independentes como antes.
    if (placeId !== undefined) {
      fields.push(`place_id = $${i++}`); values.push(placeId);
      if (placeId && attractionId === undefined) { fields.push(`attraction_id = $${i++}`); values.push(null); }
    }
    if (attractionId !== undefined) {
      fields.push(`attraction_id = $${i++}`); values.push(attractionId);
      if (attractionId && placeId === undefined) { fields.push(`place_id = $${i++}`); values.push(null); }
    }
    // dayId: usado ao mover uma atividade de um dia pra outro (ver
    // ScheduleScreen.jsx, handleMoveToDay) — sortOrder junto pra já cair no
    // fim da lista do dia de destino, sem precisar de um reorder separado.
    if (dayId !== undefined) { fields.push(`day_id = $${i++}`); values.push(dayId); }
    if (sortOrder !== undefined) { fields.push(`sort_order = $${i++}`); values.push(sortOrder); }
    // parentActivityId: reatribui o card pai de um subitem (ex: reorder
    // movendo entre nível raiz e dentro de um card, ou entre dois cards).
    if (parentActivityId !== undefined) { fields.push(`parent_activity_id = $${i++}`); values.push(parentActivityId); }

    if (fields.length === 0) {
      return res.status(400).json({ error: 'Nenhum campo para atualizar' });
    }

    values.push(id);
    await sql.query(`UPDATE activities SET ${fields.join(', ')} WHERE id = $${i}`, values);

    // Mover um card de roteiro ('itinerary') pra outro dia precisa arrastar
    // os subitens junto — eles não têm existência própria fora do pai (ver
    // ON DELETE CASCADE em parent_activity_id). O front sempre move só o
    // card (um único PUT), nunca sabe/precisa saber dos subitens.
    if (dayId !== undefined) {
      await sql.query('UPDATE activities SET day_id = $1 WHERE parent_activity_id = $2', [dayId, id]);
    }

    return res.status(200).json({ ok: true });
  }

  if (req.method === 'DELETE') {
    await sql.query('DELETE FROM activities WHERE id = $1', [id]);
    return res.status(200).json({ ok: true });
  }

  res.setHeader('Allow', 'PUT, DELETE');
  return res.status(405).json({ error: 'Method not allowed' });
}
