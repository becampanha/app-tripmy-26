import { useEffect, useState } from 'react';

const CACHE_TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30 dias — mesmo TTL do useGeocode

// Mesma chave/formato de cache do useGeocode (`geo:${address}`), para que um
// endereço já geocodificado numa tela (ex: PlaceDetailScreen) seja
// reaproveitado aqui sem nova chamada à API, e vice-versa.
function cacheGet(address) {
  try {
    const raw = localStorage.getItem(`geo:${address}`);
    if (!raw) return null;
    const { value, expiresAt } = JSON.parse(raw);
    if (Date.now() > expiresAt) return null;
    return value;
  } catch {
    return null;
  }
}

function cacheSet(address, value) {
  try {
    localStorage.setItem(`geo:${address}`, JSON.stringify({ value, expiresAt: Date.now() + CACHE_TTL_MS }));
  } catch {
    // localStorage indisponível/cheio — segue sem cache
  }
}

// Geocodifica uma lista de endereços em paralelo (um fetch por endereço não
// cacheado), para plotar vários pontos de uma vez no mapa do dia — diferente
// do useGeocode, que resolve um endereço só. Retorna um Map endereço -> coords
// (entradas que falharam simplesmente não aparecem no Map).
export function useAddressesLocations(addresses) {
  const key = addresses.join('|');
  const [byAddress, setByAddress] = useState(() => {
    const initial = new Map();
    for (const address of addresses) {
      const cached = cacheGet(address);
      if (cached) initial.set(address, cached);
    }
    return initial;
  });
  const [loading, setLoading] = useState(() => addresses.some((address) => !cacheGet(address)));

  useEffect(() => {
    if (addresses.length === 0) {
      setByAddress(new Map());
      return;
    }

    const next = new Map();
    const pending = [];
    for (const address of addresses) {
      const cached = cacheGet(address);
      if (cached) next.set(address, cached);
      else pending.push(address);
    }
    setByAddress(next);

    if (pending.length === 0) return;

    let cancelled = false;
    setLoading(true);
    Promise.all(
      pending.map((address) =>
        fetch(`/api/places/google?action=geocode&address=${encodeURIComponent(address)}`)
          .then((res) => (res.ok ? res.json() : null))
          .then((coords) => ({ address, coords }))
          .catch(() => ({ address, coords: null }))
      )
    ).then((results) => {
      if (cancelled) return;
      setByAddress((prev) => {
        const merged = new Map(prev);
        for (const { address, coords } of results) {
          if (coords) {
            cacheSet(address, coords);
            merged.set(address, coords);
          }
        }
        return merged;
      });
      setLoading(false);
    });

    return () => {
      cancelled = true;
    };
  }, [key]);

  return { byAddress, loading };
}
