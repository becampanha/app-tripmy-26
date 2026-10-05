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

// Processa até BATCH_SIZE fetches por vez, não todos de uma vez — telas com
// muitos endereços não cacheados (ex: mapa de Lugares, 100+ restaurantes de
// uma categoria) disparando uma rajada enorme de requisições simultâneas
// trava o servidor de dev local (vercel dev) e deixa a Promise.all inteira
// pendurada pra sempre, sem nunca resolver nem rejeitar — sintoma observado:
// "Carregando mapa..." eterno, mesmo com a API respondendo bem quando
// testada isoladamente via curl.
const BATCH_SIZE = 16;

async function geocodeInBatches(addresses, onBatchDone) {
  for (let i = 0; i < addresses.length; i += BATCH_SIZE) {
    const batch = addresses.slice(i, i + BATCH_SIZE);
    const results = await Promise.all(
      batch.map((address) =>
        fetch(`/api/places/google?action=geocode&address=${encodeURIComponent(address)}`)
          .then((res) => (res.ok ? res.json() : null))
          .then((coords) => ({ address, coords }))
          .catch(() => ({ address, coords: null }))
      )
    );
    onBatchDone(results);
  }
}

// Geocodifica uma lista de endereços em lotes (não todos de uma vez — ver
// geocodeInBatches), para plotar vários pontos de uma vez num mapa —
// diferente do useGeocode, que resolve um endereço só. Retorna um Map
// endereço -> coords (entradas que falharam simplesmente não aparecem no
// Map); atualiza incrementalmente a cada lote, então pinos já cacheados ou
// resolvidos cedo aparecem no mapa antes dos demais terminarem.
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

    geocodeInBatches(pending, (results) => {
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
    }).then(() => {
      if (!cancelled) setLoading(false);
    });

    return () => {
      cancelled = true;
    };
  }, [key]);

  return { byAddress, loading };
}
