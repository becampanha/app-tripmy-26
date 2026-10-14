import { getSql } from '../_db.js';
import { FIELD_MAP } from './_fields.js';

// PUT /api/places/:id — edita campos de um lugar
// PUT /api/places/:id?action=toggleFavorite — body: { traveler, favorite }
//     marca/desmarca o favorito de UM viajante (favoritos são por pessoa,
//     ver tabela place_favorites — vários viajantes podem favoritar o mesmo
//     lugar, cada marcação é independente das outras)
// DELETE /api/places/:id — remove um lugar (desvincula de atividades que o referenciam)
export default async function handler(req, res) {
  const sql = getSql();
  const { id, action } = req.query;

  if (req.method === 'PUT' && action === 'toggleFavorite') {
    const { traveler, favorite } = req.body || {};
    if (!traveler) {
      return res.status(400).json({ error: 'Parâmetro "traveler" é obrigatório' });
    }
    if (favorite) {
      await sql.query(
        'INSERT INTO place_favorites (place_id, traveler) VALUES ($1, $2) ON CONFLICT DO NOTHING',
        [id, traveler]
      );
    } else {
      await sql.query('DELETE FROM place_favorites WHERE place_id = $1 AND traveler = $2', [id, traveler]);
    }
    return res.status(200).json({ ok: true });
  }

  if (req.method === 'PUT') {
    const body = req.body || {};
    const fields = [];
    const values = [];
    let i = 1;

    for (const [key, column] of Object.entries(FIELD_MAP)) {
      if (body[key] === undefined) continue;
      fields.push(`${column} = $${i++}`);
      values.push(key === 'dishPhotos' || key === 'hoursSchedule' ? JSON.stringify(body[key]) : body[key]);
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
