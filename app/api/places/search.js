// Vercel Function — proxy protegido para o Google Places API (New).
// A chave fica só em process.env.GOOGLE_PLACES_API_KEY, nunca chega ao client.

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const apiKey = process.env.GOOGLE_PLACES_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'GOOGLE_PLACES_API_KEY não configurada' });
  }

  const query = req.query.q;
  if (!query || typeof query !== 'string') {
    return res.status(400).json({ error: 'Parâmetro "q" é obrigatório' });
  }

  try {
    const body = { textQuery: query, languageCode: 'pt-BR' };

    // Viés geográfico para a região de Orlando — evita que nomes genéricos
    // (ex: "Castle Park") retornem resultados de outras cidades/estados.
    const lat = req.query.lat ? Number(req.query.lat) : 28.4;
    const lng = req.query.lng ? Number(req.query.lng) : -81.5;
    const radiusMeters = req.query.radius ? Number(req.query.radius) : 50000;
    if (!Number.isNaN(lat) && !Number.isNaN(lng) && !Number.isNaN(radiusMeters)) {
      body.locationBias = {
        circle: { center: { latitude: lat, longitude: lng }, radius: radiusMeters },
      };
    }

    const response = await fetch('https://places.googleapis.com/v1/places:searchText', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': apiKey,
        'X-Goog-FieldMask': [
          'places.id',
          'places.displayName',
          'places.formattedAddress',
          'places.types',
          'places.photos',
          'places.rating',
          'places.userRatingCount',
          'places.googleMapsUri',
        ].join(','),
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      return res.status(response.status).json({ error: 'Erro na Places API', details: errorBody });
    }

    const data = await response.json();
    return res.status(200).json(data);
  } catch (err) {
    return res.status(500).json({ error: 'Falha ao consultar Places API', details: err.message });
  }
}
