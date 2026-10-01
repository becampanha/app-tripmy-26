import { useEffect, useState } from 'react';

let loadingPromise = null;

// Carrega o script da Maps JavaScript API sob demanda (só quando o mapa com
// pinos soltos é aberto, nunca no load inicial do app) — diferente do
// Embed API (iframe) usado no MapFullscreen/DayMap em modo rota, que não
// precisa de script algum. Cacheado em módulo: a segunda tela que montar o
// mapa reaproveita a mesma promise, sem reinserir a tag <script>.
function loadGoogleMapsScript() {
  if (window.google?.maps) return Promise.resolve(window.google.maps);
  if (loadingPromise) return loadingPromise;

  loadingPromise = new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${import.meta.env.VITE_GOOGLE_MAPS_EMBED_KEY}&libraries=marker,geometry`;
    script.async = true;
    script.onload = () => resolve(window.google.maps);
    script.onerror = () => {
      loadingPromise = null;
      reject(new Error('Falha ao carregar Google Maps'));
    };
    document.head.appendChild(script);
  });

  return loadingPromise;
}

// Retorna o namespace `google.maps` assim que o script carregar (null
// enquanto carrega ou se falhar).
export function useGoogleMaps() {
  const [maps, setMaps] = useState(() => window.google?.maps || null);

  useEffect(() => {
    if (maps) return;
    let cancelled = false;
    loadGoogleMapsScript()
      .then((g) => {
        if (!cancelled) setMaps(g);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [maps]);

  return maps;
}
