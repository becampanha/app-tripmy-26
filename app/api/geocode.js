// GET /api/geocode?address=... — resolve um endereço em texto para lat/lng
// via Google Geocoding API, usando a mesma API key do Google Places.

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const apiKey = process.env.GOOGLE_PLACES_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'GOOGLE_PLACES_API_KEY não configurada' });
  }

  const address = req.query.address;
  if (!address || typeof address !== 'string') {
    return res.status(400).json({ error: 'Parâmetro "address" é obrigatório' });
  }

  try {
    const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${apiKey}`;
    const response = await fetch(url);
    const data = await response.json();

    if (data.status !== 'OK' || !data.results?.[0]) {
      return res.status(404).json({ error: 'Endereço não encontrado', status: data.status });
    }

    const { lat, lng } = data.results[0].geometry.location;
    res.setHeader('Cache-Control', 'public, max-age=2592000');
    return res.status(200).json({ lat, lng });
  } catch (err) {
    return res.status(500).json({ error: 'Falha ao geocodificar', details: err.message });
  }
}
