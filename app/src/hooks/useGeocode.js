import { useEffect, useState } from 'react';

const CACHE_TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30 dias — endereço não muda

function cacheGet(key) {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    const { value, expiresAt } = JSON.parse(raw);
    if (Date.now() > expiresAt) return null;
    return value;
  } catch {
    return null;
  }
}

function cacheSet(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify({ value, expiresAt: Date.now() + CACHE_TTL_MS }));
  } catch {
    // localStorage indisponível/cheio — segue sem cache
  }
}

// Resolve um endereço em texto para { lat, lng }, com cache em localStorage.
// Retorna null enquanto carrega ou se o endereço não puder ser resolvido.
export function useGeocode(address) {
  const [coords, setCoords] = useState(null);

  useEffect(() => {
    setCoords(null);
    if (!address) return;

    const cacheKey = `geo:${address}`;
    const cached = cacheGet(cacheKey);
    if (cached) {
      setCoords(cached);
      return;
    }

    let cancelled = false;
    fetch(`/api/places/google?action=geocode&address=${encodeURIComponent(address)}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (cancelled || !data) return;
        cacheSet(cacheKey, data);
        setCoords(data);
      })
      .catch(() => {});

    return () => {
      cancelled = true;
    };
  }, [address]);

  return coords;
}
