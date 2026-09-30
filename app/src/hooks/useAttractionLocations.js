import { useEffect, useState } from 'react';
import { fetchAttractionLocations } from '../api/itineraryApi.js';

const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24h — layout do parque não muda de um dia pro outro

// Mesma normalização usada no backend (api/attractions.js).
function normalizeName(name) {
  return name
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]/gi, '')
    .toLowerCase();
}

function cacheGet(parkId) {
  try {
    const raw = localStorage.getItem(`attractionLocations:${parkId}`);
    if (!raw) return null;
    const { value, expiresAt } = JSON.parse(raw);
    if (Date.now() > expiresAt) return null;
    return value;
  } catch {
    return null;
  }
}

function cacheSet(parkId, value) {
  try {
    localStorage.setItem(`attractionLocations:${parkId}`, JSON.stringify({ value, expiresAt: Date.now() + CACHE_TTL_MS }));
  } catch {
    // localStorage indisponível/cheio — segue sem cache
  }
}

// Busca coordenadas das atrações de um parque sob demanda (só quando o mapa
// é aberto, não a cada visita à tela de Atrações). parkId null/undefined
// mantém o hook parado, sem chamar a API.
export function useAttractionLocations(parkId) {
  const [byName, setByName] = useState(() => (parkId ? cacheGet(parkId) : null));
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!parkId) return;
    const cached = cacheGet(parkId);
    if (cached) {
      setByName(cached);
      return;
    }

    let cancelled = false;
    setLoading(true);
    fetchAttractionLocations(parkId)
      .then((data) => {
        if (cancelled) return;
        setByName(data);
        cacheSet(parkId, data);
      })
      .catch(() => {
        if (!cancelled) setByName({});
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [parkId]);

  function getLocation(attractionName) {
    if (!byName) return null;
    return byName[normalizeName(attractionName)] || null;
  }

  return { getLocation, loading, ready: byName !== null };
}
