// Vercel Function — proxy protegido para fotos do Google Places API (New).
// Recebe o "name" de uma foto (ex: places/XXX/photos/YYY) e retorna o binário da imagem.

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const apiKey = process.env.GOOGLE_PLACES_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'GOOGLE_PLACES_API_KEY não configurada' });
  }

  const photoName = req.query.name;
  if (!photoName || typeof photoName !== 'string') {
    return res.status(400).json({ error: 'Parâmetro "name" é obrigatório' });
  }

  const maxWidthPx = req.query.maxWidthPx || '800';

  try {
    const url = `https://places.googleapis.com/v1/${photoName}/media?maxWidthPx=${encodeURIComponent(maxWidthPx)}&key=${apiKey}`;
    const response = await fetch(url, { redirect: 'follow' });

    if (!response.ok) {
      const errorBody = await response.text();
      return res.status(response.status).json({ error: 'Erro ao buscar foto', details: errorBody });
    }

    const contentType = response.headers.get('content-type') || 'image/jpeg';
    const arrayBuffer = await response.arrayBuffer();

    res.setHeader('Content-Type', contentType);
    res.setHeader('Cache-Control', 'public, max-age=86400');
    return res.status(200).send(Buffer.from(arrayBuffer));
  } catch (err) {
    return res.status(500).json({ error: 'Falha ao buscar foto', details: err.message });
  }
}
