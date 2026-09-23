import { useCallback, useEffect, useState } from 'react';
import { readCache, writeCache } from './persistentCache.js';

// Primeiro tenta o localStorage (sobrevive a fechar o app/aba e reabrir dias
// depois — abre instantâneo mesmo numa sessão nova), com um espelho em
// memória de módulo pra não reler o disco a cada remontagem da tela de
// Roteiro dentro da mesma sessão (ela é recriada do zero a cada navegação,
// ver App.jsx).
let cachedDays = readCache('itinerary');

export function useItinerary() {
  const [days, setDays] = useState(cachedDays);
  const [loading, setLoading] = useState(cachedDays === null);
  const [error, setError] = useState(null);

  // silent=true evita voltar ao estado de skeleton em recargas depois de uma
  // edição, ou quando já existe um cache em memória de uma visita anterior —
  // só o loading realmente inicial (nenhum dado em memória ainda) deve
  // mostrar o skeleton.
  const reload = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const res = await fetch('/api/itinerary');
      if (!res.ok) throw new Error('Falha ao carregar roteiro');
      const data = await res.json();
      cachedDays = data;
      writeCache('itinerary', data);
      setDays(data);
      setError(null);
    } catch (e) {
      setError(e.message);
    } finally {
      if (!silent) setLoading(false);
    }
  }, []);

  useEffect(() => {
    reload(cachedDays !== null);
  }, [reload]);

  return { days, loading, error, reload };
}
