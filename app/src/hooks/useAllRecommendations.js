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

  const addRecommendation = (created) => {
    setRecommendations((prev) => {
      const next = [created, ...(prev || [])];
      writeCache('recommendations:all', next);
      return next;
    });
  };

  const patchRecommendation = (id, fields) => {
    setRecommendations((prev) => {
      const next = (prev || []).map((r) => (r.id === id ? { ...r, ...fields } : r));
      writeCache('recommendations:all', next);
      return next;
    });
  };

  const removeRecommendation = (id) => {
    setRecommendations((prev) => {
      const next = (prev || []).filter((r) => r.id !== id);
      writeCache('recommendations:all', next);
      return next;
    });
  };

  return { recommendations, addRecommendation, patchRecommendation, removeRecommendation };
}
