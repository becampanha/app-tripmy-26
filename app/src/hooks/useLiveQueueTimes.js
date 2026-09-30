import { useEffect, useState } from 'react';
import { fetchLiveQueueTimes } from '../api/itineraryApi.js';

const CACHE_KEY = 'liveQueueTimes';
const CACHE_TTL_MS = 5 * 60 * 1000; // 5min — mesma cadência da fonte (ThemeParks.wiki)

// Mesma normalização usada no backend (api/attractions.js) — precisa ficar
// idêntica dos dois lados pra "Space Mountain" do banco casar com o que a
// API externa chama de "Space Mountain®", por exemplo.
function normalizeName(name) {
  return name
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]/gi, '')
    .toLowerCase();
}

function cacheGet() {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const { value, expiresAt } = JSON.parse(raw);
    if (Date.now() > expiresAt) return null;
    return value;
  } catch {
    return null;
  }
}

function cacheSet(value) {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify({ value, expiresAt: Date.now() + CACHE_TTL_MS }));
  } catch {
    // localStorage indisponível/cheio — segue sem cache
  }
}

// Busca a fila em tempo real de todos os parques (ThemeParks.wiki) e expõe
// um helper pra consultar por nome de atração. Retorna null enquanto ainda
// não há dado nenhum (nem cache) — quem usa deve tratar isso como "sem
// informação ao vivo, mostra o valor estático da planilha".
export function useLiveQueueTimes() {
  const [byName, setByName] = useState(() => cacheGet());

  useEffect(() => {
    let cancelled = false;
    fetchLiveQueueTimes()
      .then((data) => {
        if (cancelled) return;
        setByName(data);
        cacheSet(data);
      })
      .catch(() => {
        // Sem conexão ou API externa fora do ar — mantém o que já tinha em
        // cache (se houver); o app não deve quebrar por causa disso.
      });
    return () => {
      cancelled = true;
    };
  }, []);

  function getLiveQueue(attractionName) {
    if (!byName) return null;
    const entry = byName[normalizeName(attractionName)];
    if (!entry || entry.status !== 'OPERATING' || entry.waitTime === null) return null;
    return entry.waitTime;
  }

  return { getLiveQueue };
}
