import { useEffect, useState } from 'react';

// Cache permanente (sem TTL) em localStorage: a distância/tempo de carro
// entre dois lugares fixos não muda — uma vez calculado, nunca precisa
// buscar de novo, mesmo se o roteiro for reordenado depois.
function cacheGet(key) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function cacheSet(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // localStorage indisponível/cheio — segue sem cache
  }
}

// Calcula distância (km) e tempo de carro (min) entre dois lugares, a partir
// das coordenadas já resolvidas de cada um (ver useGeocode). Retorna null
// enquanto carrega ou se algum dos dois lugares não tiver coordenadas ainda.
function readCachedDistance(originId, destId) {
  if (!originId || !destId) return null;
  const cached = cacheGet(`distance:${originId}:${destId}`);
  if (cached && typeof cached.distanceKm === 'number' && typeof cached.durationMin === 'number') return cached;
  return null;
}

export function useDistance(originId, originCoords, destId, destCoords) {
  // Lazy initializer: lê o cache de forma síncrona antes da primeira
  // pintura — sem isso, DistanceBetween simplesmente não renderizava nada
  // (return null) por um instante em toda montagem, mesmo com a distância
  // já calculada de uma visita anterior (cache é permanente, sem TTL).
  const [result, setResult] = useState(() => readCachedDistance(originId, destId));

  useEffect(() => {
    if (!originId || !destId || !originCoords || !destCoords) {
      setResult(null);
      return;
    }

    const cacheKey = `distance:${originId}:${destId}`;
    const cached = cacheGet(cacheKey);
    // Ignora cache malformado (ex: salvo antes de uma correção de bug —
    // como o caso de origem = destino que antes gerava distanceKm: null).
    if (cached && typeof cached.distanceKm === 'number' && typeof cached.durationMin === 'number') {
      setResult(cached);
      return;
    }
    setResult(null);

    let cancelled = false;
    const params = new URLSearchParams({
      action: 'distance',
      originLat: originCoords.lat,
      originLng: originCoords.lng,
      destLat: destCoords.lat,
      destLng: destCoords.lng,
    });
    fetch(`/api/places/google?${params}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        // Não cacheia nem seta resultado em caso de falha (res não-ok, ou
        // corpo sem os campos esperados) — assim, na próxima montagem deste
        // par (ex: reabrir o dia), tenta de novo em vez de ficar "vazio"
        // permanentemente por causa de uma falha de rede passageira.
        if (cancelled || !data || typeof data.distanceKm !== 'number' || typeof data.durationMin !== 'number') return;
        cacheSet(cacheKey, data);
        setResult(data);
      })
      .catch(() => {});

    return () => {
      cancelled = true;
    };
  }, [originId, destId, originCoords?.lat, originCoords?.lng, destCoords?.lat, destCoords?.lng]);

  return result;
}
