import { useEffect, useState } from 'react';
import { fetchItinerary } from '../api/itineraryApi.js';

// Retorna um Set com os IDs de todos os lugares vinculados a alguma atividade
// do roteiro, ou null enquanto carrega.
export function usePlacesInItinerary() {
  const [ids, setIds] = useState(null);

  useEffect(() => {
    let cancelled = false;
    fetchItinerary()
      .then((days) => {
        if (cancelled) return;
        const set = new Set();
        for (const day of days) {
          for (const act of day.activities) {
            if (act.place) set.add(act.place.id);
          }
        }
        setIds(set);
      })
      .catch(() => {
        if (!cancelled) setIds(new Set());
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return ids;
}
