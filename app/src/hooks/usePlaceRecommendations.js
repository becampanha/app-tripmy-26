import { useEffect, useState } from 'react';
import { fetchRecommendations } from '../api/itineraryApi.js';
import { readCache, writeCache } from './persistentCache.js';

// Recomendações publicadas para um lugar, com stale-while-revalidate: mostra
// o que já estiver salvo em localStorage na hora (sem skeleton), revalida em
// segundo plano. Expõe addRecommendation para inserir localmente + persistir
// assim que uma nova recomendação é publicada, sem esperar o próximo fetch.
export function usePlaceRecommendations(placeId) {
  const [recommendations, setRecommendations] = useState(() => (placeId ? readCache(`recommendations:${placeId}`) : null));

  useEffect(() => {
    if (!placeId) {
      setRecommendations(null);
      return;
    }
    setRecommendations(readCache(`recommendations:${placeId}`));

    let cancelled = false;
    fetchRecommendations(placeId)
      .then((data) => {
        if (cancelled) return;
        setRecommendations(data);
        writeCache(`recommendations:${placeId}`, data);
      })
      .catch(() => {
        if (!cancelled) setRecommendations((prev) => prev ?? []);
      });

    return () => {
      cancelled = true;
    };
  }, [placeId]);

  const addRecommendation = (created) => {
    setRecommendations((prev) => {
      const next = [created, ...(prev || [])];
      writeCache(`recommendations:${placeId}`, next);
      return next;
    });
  };

  return { recommendations, addRecommendation };
}
