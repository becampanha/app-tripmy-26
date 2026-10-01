import { useEffect, useState } from 'react';

// Localização atual real do dispositivo via navigator.geolocation — usado
// no mapa do dia (DayMap) pro pino "você está aqui" e pro botão de
// recentralizar. `position` fica null enquanto não resolve (permissão
// pendente) ou se falhar — `error` distingue os dois casos (código do
// GeolocationPositionError: 1 = permissão negada, 2 = indisponível, 3 =
// timeout) pra quem usa poder mostrar algo diferente de "nunca carrega".
export function useGeolocation() {
  const [position, setPosition] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!('geolocation' in navigator)) {
      setError({ code: 0, message: 'Geolocalização não suportada neste navegador' });
      return;
    }

    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        setError(null);
        setPosition({ lat: pos.coords.latitude, lng: pos.coords.longitude });
      },
      (err) => {
        setPosition(null);
        setError({ code: err.code, message: err.message });
      },
      { enableHighAccuracy: true }
    );

    return () => navigator.geolocation.clearWatch(watchId);
  }, []);

  return { position, error };
}
