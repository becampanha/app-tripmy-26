import { useEffect, useState } from 'react';
import { fetchItinerary } from '../api/itineraryApi.js';

// Retorna as ocorrências de um lugar no roteiro: [{ date, weekday, time, title }],
// ou null enquanto carrega.
export function usePlaceOccurrences(placeId) {
  const [occurrences, setOccurrences] = useState(null);

  useEffect(() => {
    setOccurrences(null);
    if (!placeId) return;

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
      })
      .catch(() => {
        if (!cancelled) setOccurrences([]);
      });

    return () => {
      cancelled = true;
    };
  }, [placeId]);

  return occurrences;
}
