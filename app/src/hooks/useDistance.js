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
export function useDistance(originId, originCoords, destId, destCoords) {
  const [result, setResult] = useState(null);

  useEffect(() => {
    setResult(null);
    if (!originId || !destId || !originCoords || !destCoords) return;

    const cacheKey = `distance:${originId}:${destId}`;
    const cached = cacheGet(cacheKey);
    if (cached) {
      setResult(cached);
      return;
    }

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
        if (cancelled || !data) return;
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
