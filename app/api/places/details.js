// Vercel Function — proxy protegido para Place Details (New) por place_id.
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

  const placeId = req.query.id;
  if (!placeId || typeof placeId !== 'string') {
    return res.status(400).json({ error: 'Parâmetro "id" é obrigatório' });
  }

  try {
    const response = await fetch(`https://places.googleapis.com/v1/places/${placeId}`, {
      method: 'GET',
      headers: {
        'X-Goog-Api-Key': apiKey,
        'X-Goog-FieldMask': [
          'id',
          'displayName',
          'types',
          'primaryType',
          'primaryTypeDisplayName',
          'photos',
        ].join(','),
      },
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
