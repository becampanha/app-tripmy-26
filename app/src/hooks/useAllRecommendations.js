import { useEffect, useState } from 'react';
import { fetchAllRecommendations } from '../api/itineraryApi.js';
import { readCache, writeCache } from './persistentCache.js';

// Todas as recomendações do app, de todos os lugares, mais recentes primeiro —
// mesmo padrão stale-while-revalidate dos outros hooks: mostra o cache na
// hora, revalida em segundo plano.
export function useAllRecommendations() {
  const [recommendations, setRecommendations] = useState(() => readCache('recommendations:all'));

  useEffect(() => {
    let cancelled = false;
    fetchAllRecommendations()
      .then((data) => {
        if (cancelled) return;
        setRecommendations(data);
        writeCache('recommendations:all', data);
      })
      .catch(() => {
        if (!cancelled) setRecommendations((prev) => prev ?? []);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return { recommendations };
}
