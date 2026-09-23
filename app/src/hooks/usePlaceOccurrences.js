import { useEffect, useState } from 'react';
import { fetchItinerary } from '../api/itineraryApi.js';
import { readCache, writeCache } from './persistentCache.js';

// Retorna as ocorrências de um lugar no roteiro: [{ date, weekday, time, title }].
// Stale-while-revalidate: se já houver um valor salvo de uma visita anterior
// (mesmo em outra sessão/aba), mostra ele na hora — sem skeleton — e
// atualiza em segundo plano assim que a rede responder. Só fica null (e
// mostra skeleton) na primeiríssima vez que esse lugar é aberto.
export function usePlaceOccurrences(placeId) {
  const [occurrences, setOccurrences] = useState(() => (placeId ? readCache(`occurrences:${placeId}`) : null));

  useEffect(() => {
    if (!placeId) {
      setOccurrences(null);
      return;
    }
    setOccurrences(readCache(`occurrences:${placeId}`));

    let cancelled = false;
    fetchItinerary()
      .then((days) => {
        if (cancelled) return;
        const found = [];
        for (const day of days) {
          for (const act of day.activities) {
            if (act.place && act.place.id === placeId) {
              found.push({ date: day.date, weekday: day.weekday, time: act.time, title: act.title });
            }
          }
        }
        setOccurrences(found);
        writeCache(`occurrences:${placeId}`, found);
      })
      .catch(() => {
        if (!cancelled) setOccurrences((prev) => prev ?? []);
      });

    return () => {
      cancelled = true;
    };
  }, [placeId]);

  return occurrences;
}
