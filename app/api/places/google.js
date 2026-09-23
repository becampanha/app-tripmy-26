import { put } from '@vercel/blob';

// Proxy consolidado para as APIs do Google usadas no app — mantido num único
// arquivo (roteado por ?action=) para caber no limite de 12 Serverless
// Functions do plano Hobby da Vercel. Consolida o que antes eram os
// endpoints places/search, places/photo, places/details, places/map e
// /api/geocode. A chave fica só em process.env.GOOGLE_PLACES_API_KEY.

async function search(req, res, apiKey) {
  const query = req.query.q;
  if (!query || typeof query !== 'string') {
    return res.status(400).json({ error: 'Parâmetro "q" é obrigatório' });
  }

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
}

async function details(req, res, apiKey) {
  const placeId = req.query.id;
  if (!placeId || typeof placeId !== 'string') {
    return res.status(400).json({ error: 'Parâmetro "id" é obrigatório' });
  }

  const response = await fetch(`https://places.googleapis.com/v1/places/${placeId}`, {
    method: 'GET',
    headers: {
      'X-Goog-Api-Key': apiKey,
      'X-Goog-FieldMask': ['id', 'displayName', 'types', 'primaryType', 'primaryTypeDisplayName', 'photos'].join(','),
    },
  });

  if (!response.ok) {
    const errorBody = await response.text();
    return res.status(response.status).json({ error: 'Erro na Places API', details: errorBody });
  }

  const data = await response.json();
  return res.status(200).json(data);
}

async function photo(req, res, apiKey) {
  const photoName = req.query.name;
  if (!photoName || typeof photoName !== 'string') {
    return res.status(400).json({ error: 'Parâmetro "name" é obrigatório' });
  }

  const maxWidthPx = req.query.maxWidthPx || '800';
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
}

async function map(req, res, apiKey) {
  const { lat, lng } = req.query;
  if (!lat || !lng) {
    return res.status(400).json({ error: 'Parâmetros "lat" e "lng" são obrigatórios' });
  }

  const width = req.query.width || '600';
  const height = req.query.height || '300';
  const zoom = req.query.zoom || '15';
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
}

async function geocode(req, res, apiKey) {
  const address = req.query.address;
  if (!address || typeof address !== 'string') {
    return res.status(400).json({ error: 'Parâmetro "address" é obrigatório' });
  }

  const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${apiKey}`;
  const response = await fetch(url);
  const data = await response.json();

  if (data.status !== 'OK' || !data.results?.[0]) {
    return res.status(404).json({ error: 'Endereço não encontrado', status: data.status });
  }

  const { lat, lng } = data.results[0].geometry.location;
  res.setHeader('Cache-Control', 'public, max-age=2592000');
  return res.status(200).json({ lat, lng });
}

async function distance(req, res, apiKey) {
  const { originLat, originLng, destLat, destLng } = req.query;
  if (!originLat || !originLng || !destLat || !destLng) {
    return res.status(400).json({ error: 'Parâmetros "originLat", "originLng", "destLat" e "destLng" são obrigatórios' });
  }

  const response = await fetch('https://routes.googleapis.com/directions/v2:computeRoutes', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Goog-Api-Key': apiKey,
      'X-Goog-FieldMask': 'routes.duration,routes.distanceMeters',
    },
    body: JSON.stringify({
      origin: { location: { latLng: { latitude: Number(originLat), longitude: Number(originLng) } } },
      destination: { location: { latLng: { latitude: Number(destLat), longitude: Number(destLng) } } },
      travelMode: 'DRIVE',
    }),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    return res.status(response.status).json({ error: 'Erro na Routes API', details: errorBody });
  }

  const data = await response.json();
  const route = data.routes?.[0];
  if (!route) {
    return res.status(404).json({ error: 'Rota não encontrada' });
  }

  res.setHeader('Cache-Control', 'public, max-age=2592000');
  return res.status(200).json({
    distanceKm: route.distanceMeters / 1000,
    durationMin: Math.round(parseInt(route.duration, 10) / 60),
  });
}

// Busca até 3 fotos de um lugar no Google Places (a 1ª vira a foto principal,
// as próximas 2 viram fotos-vitrine) e sobe cada uma pro Vercel Blob, já que
// Functions são serverless (sem filesystem gravável persistente) — não dá
// pra salvar em public/places/ como os lugares inseridos manualmente antes
// do deploy. Usado pela tela de criar lugar, para popular fotos sem exigir
// escolha manual do usuário.
async function importPhotos(req, res, apiKey) {
  const placeId = req.query.placeId;
  if (!placeId || typeof placeId !== 'string') {
    return res.status(400).json({ error: 'Parâmetro "placeId" é obrigatório' });
  }

  const detailsResponse = await fetch(`https://places.googleapis.com/v1/places/${placeId}?languageCode=pt-BR`, {
    method: 'GET',
    headers: {
      'X-Goog-Api-Key': apiKey,
      'X-Goog-FieldMask': 'photos,editorialSummary',
    },
  });

  if (!detailsResponse.ok) {
    const errorBody = await detailsResponse.text();
    return res.status(detailsResponse.status).json({ error: 'Erro ao buscar fotos do lugar', details: errorBody });
  }

  const detailsData = await detailsResponse.json();
  const recommendation = detailsData.editorialSummary?.text || null;
  const photoRefs = (detailsData.photos || []).slice(0, 3);
  if (photoRefs.length === 0) {
    return res.status(200).json({ photo: null, dishPhotos: [], recommendation });
  }

  const uploaded = [];
  for (const ref of photoRefs) {
    const photoUrl = `https://places.googleapis.com/v1/${ref.name}/media?maxWidthPx=800&key=${apiKey}`;
    const photoResponse = await fetch(photoUrl, { redirect: 'follow' });
    if (!photoResponse.ok) continue; // pula fotos individuais que falharem, sem derrubar o import inteiro

    const contentType = photoResponse.headers.get('content-type') || 'image/jpeg';
    const buffer = Buffer.from(await photoResponse.arrayBuffer());
    const ext = contentType.includes('png') ? 'png' : 'jpg';

    const blob = await put(`places/${placeId}-${Date.now()}-${uploaded.length}.${ext}`, buffer, {
      access: 'public',
      contentType,
      token: process.env.BLOB_READ_WRITE_TOKEN,
    });
    uploaded.push(blob.url);
  }

  return res.status(200).json({
    photo: uploaded[0] || null,
    dishPhotos: uploaded.slice(1),
    recommendation,
  });
}

const ACTIONS = { search, details, photo, map, geocode, distance, importPhotos };

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const apiKey = process.env.GOOGLE_PLACES_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'GOOGLE_PLACES_API_KEY não configurada' });
  }

  const action = ACTIONS[req.query.action];
  if (!action) {
    return res.status(400).json({ error: 'Parâmetro "action" inválido ou ausente', valid: Object.keys(ACTIONS) });
  }

  try {
    return await action(req, res, apiKey);
  } catch (err) {
    return res.status(500).json({ error: 'Falha ao consultar Google', details: err.message });
  }
}
