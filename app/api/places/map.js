// GET /api/places/map?lat=..&lng=..&width=..&height=.. — proxy protegido para
// o Google Static Maps API, retorna o binário da imagem do mapa centrado nas
// coordenadas informadas.

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const apiKey = process.env.GOOGLE_PLACES_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'GOOGLE_PLACES_API_KEY não configurada' });
  }

  const { lat, lng } = req.query;
  if (!lat || !lng) {
    return res.status(400).json({ error: 'Parâmetros "lat" e "lng" são obrigatórios' });
  }

  const width = req.query.width || '600';
  const height = req.query.height || '300';
  const zoom = req.query.zoom || '15';

  try {
    const url = `https://maps.googleapis.com/maps/api/staticmap?center=${lat},${lng}&zoom=${zoom}&size=${width}x${height}&scale=2&style=feature:poi|visibility:off&key=${apiKey}`;
    const response = await fetch(url);

    if (!response.ok) {
      const errorBody = await response.text();
      return res.status(response.status).json({ error: 'Erro ao buscar mapa', details: errorBody });
    }

    const contentType = response.headers.get('content-type') || 'image/png';
    const arrayBuffer = await response.arrayBuffer();

    res.setHeader('Content-Type', contentType);
    res.setHeader('Cache-Control', 'public, max-age=86400');
    return res.status(200).send(Buffer.from(arrayBuffer));
  } catch (err) {
    return res.status(500).json({ error: 'Falha ao buscar mapa', details: err.message });
  }
}
