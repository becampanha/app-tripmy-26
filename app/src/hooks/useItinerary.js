import { useCallback, useEffect, useState } from 'react';

export function useItinerary() {
  const [days, setDays] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // silent=true evita voltar ao estado de skeleton em recargas depois de uma
  // edição — só o loading inicial (days === null) deve mostrar o skeleton.
  const reload = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const res = await fetch('/api/itinerary');
      if (!res.ok) throw new Error('Falha ao carregar roteiro');
      const data = await res.json();
      setDays(data);
      setError(null);
    } catch (e) {
      setError(e.message);
    } finally {
      if (!silent) setLoading(false);
    }
  }, []);

  useEffect(() => {
    reload();
  }, [reload]);

  return { days, loading, error, reload };
}
