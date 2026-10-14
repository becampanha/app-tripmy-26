import { getSql } from '../_db.js';
import { sendPushToAll } from '../_push.js';

// GET    /api/places/recommendations?placeId=... — lista as recomendações de um lugar
// GET    /api/places/recommendations (sem placeId) — lista TODAS as recomendações,
//        de todos os lugares, cada uma já com os dados do lugar (nome/foto/tag/endereço)
// POST   /api/places/recommendations — cria uma nova recomendação (dispara push pra quem
//        se inscreveu, ver sendPushToAll)
// PUT    /api/places/recommendations?id=... — edita título/autor/descrição de uma recomendação
// DELETE /api/places/recommendations?id=... — remove uma recomendação
// POST   /api/places/recommendations?action=subscribe — salva uma inscrição de Web Push
// POST   /api/places/recommendations?action=unsubscribe — remove uma inscrição de Web Push
//        (tudo consolidado aqui, não em rotas próprias, por causa do limite de 12
//        Serverless Functions do plano Hobby da Vercel — ver api/places/google.js)
export default async function handler(req, res) {
  const sql = getSql();
  const { action } = req.query;

  if (req.method === 'POST' && action === 'subscribe') {
    const { endpoint, keys } = req.body || {};
    if (!endpoint || !keys?.p256dh || !keys?.auth) {
      return res.status(400).json({ error: 'Inscrição de push inválida' });
    }
    await sql.query(
      `INSERT INTO push_subscriptions (endpoint, p256dh, auth)
       VALUES ($1, $2, $3)
       ON CONFLICT (endpoint) DO UPDATE SET p256dh = $2, auth = $3`,
      [endpoint, keys.p256dh, keys.auth]
    );
    return res.status(201).json({ ok: true });
  }

  if (req.method === 'POST' && action === 'unsubscribe') {
    const { endpoint } = req.body || {};
    if (!endpoint) {
      return res.status(400).json({ error: 'Parâmetro "endpoint" é obrigatório' });
    }
    await sql.query('DELETE FROM push_subscriptions WHERE endpoint = $1', [endpoint]);
    return res.status(200).json({ ok: true });
  }

  if (req.method === 'GET') {
    const { placeId } = req.query;

    if (!placeId) {
      const rows = await sql.query(
        `SELECT r.*, p.name AS place_name, p.photo AS place_photo, p.tag AS place_tag, p.address AS place_address, p.subcategory AS place_subcategory
         FROM place_recommendations r
         LEFT JOIN places p ON p.id = r.place_id
         ORDER BY r.created_at DESC`
      );

      const recommendations = rows.map((r) => ({
        id: r.id,
        title: r.title,
        author: r.author,
        description: r.description,
        photo: r.photo,
        category: r.category,
        youtubeVideoId: r.youtube_video_id,
        createdAt: r.created_at,
        place: r.place_id ? {
          id: r.place_id,
          name: r.place_name,
          photo: r.place_photo,
          tag: r.place_tag,
          address: r.place_address,
          subcategory: r.place_subcategory,
        } : null,
      }));

      return res.status(200).json(recommendations);
    }

    if (typeof placeId !== 'string') {
      return res.status(400).json({ error: 'Parâmetro "placeId" inválido' });
    }

    const rows = await sql.query(
      'SELECT * FROM place_recommendations WHERE place_id = $1 ORDER BY created_at DESC',
      [placeId]
    );

    const recommendations = rows.map((r) => ({
      id: r.id,
      title: r.title,
      author: r.author,
      description: r.description,
      photo: r.photo,
      category: r.category,
      youtubeVideoId: r.youtube_video_id,
      createdAt: r.created_at,
    }));

    return res.status(200).json(recommendations);
  }

  if (req.method === 'POST') {
    const { placeId, title, author, description, photo, category, youtubeVideoId } = req.body || {};
    if (!title && !author && !description) {
      return res.status(400).json({ error: 'Preencha ao menos título, descrição ou autor' });
    }

    const rows = await sql.query(
      `INSERT INTO place_recommendations (place_id, title, author, description, photo, category, youtube_video_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [placeId || null, title || null, author || null, description || null, photo || null, category || 'Outro', youtubeVideoId || null]
    );

    const r = rows[0];

    // Precisa de await aqui, mesmo não afetando a resposta: a Serverless
    // Function pode ser congelada assim que a resposta é enviada, matando
    // qualquer promise "fire-and-forget" ainda pendente antes dela terminar
    // de enviar os pushes.
    await sendPushToAll({
      title: 'Nova dica no Family Trip',
      body: title || description || 'Alguém acabou de adicionar uma nova dica.',
      url: '/dicas',
    }).catch(() => {});

    return res.status(201).json({
      id: r.id,
      title: r.title,
      author: r.author,
      description: r.description,
      photo: r.photo,
      category: r.category,
      youtubeVideoId: r.youtube_video_id,
      createdAt: r.created_at,
    });
  }

  if (req.method === 'PUT') {
    const { id } = req.query;
    if (!id) {
      return res.status(400).json({ error: 'Parâmetro "id" é obrigatório' });
    }

    const { title, author, description, photo, placeId, category, youtubeVideoId } = req.body || {};
    if (!title && !author && !description) {
      return res.status(400).json({ error: 'Preencha ao menos título, descrição ou autor' });
    }

    await sql.query(
      'UPDATE place_recommendations SET title = $1, author = $2, description = $3, photo = $4, place_id = $5, category = $6, youtube_video_id = $7 WHERE id = $8',
      [title || null, author || null, description || null, photo || null, placeId || null, category || 'Outro', youtubeVideoId || null, id]
    );
    return res.status(200).json({ ok: true });
  }

  if (req.method === 'DELETE') {
    const { id } = req.query;
    if (!id) {
      return res.status(400).json({ error: 'Parâmetro "id" é obrigatório' });
    }
    await sql.query('DELETE FROM place_recommendations WHERE id = $1', [id]);
    return res.status(200).json({ ok: true });
  }

  res.setHeader('Allow', 'GET, POST, PUT, DELETE');
  return res.status(405).json({ error: 'Method not allowed' });
}
