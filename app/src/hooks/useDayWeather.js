import { useEffect, useState } from 'react';

const ORLANDO = { lat: 28.3852, lng: -81.5639 }; // fallback quando não há endereço no dia
const CACHE_TTL_MS = 6 * 60 * 60 * 1000; // 6h

function cacheGet(key) {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    const { value, expiresAt } = JSON.parse(raw);
    if (Date.now() > expiresAt) return null;
    return value;
  } catch {
    return null;
  }
}

function cacheSet(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify({ value, expiresAt: Date.now() + CACHE_TTL_MS }));
  } catch {
    // localStorage indisponível/cheio — segue sem cache
  }
}

// Resolve "DD/MM" para uma data ISO real, assumindo que o roteiro pode cruzar
// a virada de ano: começa no ano corrente (ou no ano seguinte, se a data já
// passou há muito tempo) e incrementa o ano sempre que a sequência de datas
// "voltar" (ex: de 31/12 para 01/01).
function resolveYear(dateStrs) {
  const today = new Date();
  let year = today.getFullYear();
  const first = dateStrs[0];
  const [firstDay, firstMonth] = first.split('/').map(Number);
  const firstAsDate = new Date(year, firstMonth - 1, firstDay);
  // Se a primeira data do roteiro já ficou mais de 30 dias no passado, assume
  // que é do ano que vem (roteiro futuro, não um já ocorrido).
  if (today - firstAsDate > 30 * 86400000) year += 1;

  const resolved = [];
  let prevMonth = -1;
  for (const ds of dateStrs) {
    const [day, month] = ds.split('/').map(Number);
    if (prevMonth !== -1 && month < prevMonth) year += 1;
    prevMonth = month;
    resolved.push(`${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`);
  }
  return resolved;
}

// dayAddress: melhor endereço disponível no primeiro item do dia (ou null)
async function resolveCoords(dayAddress) {
  if (!dayAddress) return ORLANDO;

  const cacheKey = `geo:${dayAddress}`;
  const cached = cacheGet(cacheKey);
  if (cached) return cached;

  try {
    const res = await fetch(`/api/places/google?action=geocode&address=${encodeURIComponent(dayAddress)}`);
    if (!res.ok) return ORLANDO;
    const coords = await res.json();
    cacheSet(cacheKey, coords);
    return coords;
  } catch {
    return ORLANDO;
  }
}

async function resolveWeather(isoDate, coords) {
  const cacheKey = `weather:${isoDate}:${coords.lat.toFixed(2)},${coords.lng.toFixed(2)}`;
  const cached = cacheGet(cacheKey);
  if (cached) return cached;

  const res = await fetch(`/api/weather?date=${isoDate}&lat=${coords.lat}&lng=${coords.lng}`);
  if (!res.ok) return null;
  const data = await res.json();
  cacheSet(cacheKey, data);
  return data;
}

function firstAddress(day) {
  for (const act of day.activities) {
    if (act.address) return act.address;
    if (act.place?.address) return act.place.address;
  }
  return null;
}

// Retorna { [dayId]: { max, min, code, isHistoricalAverage } | undefined } —
// undefined enquanto carrega, objeto quando resolvido.
export function useDayWeather(days) {
  const [weatherByDay, setWeatherByDay] = useState({});

  useEffect(() => {
    if (!days || days.length === 0) return;

    const isoDates = resolveYear(days.map((d) => d.date));

    let cancelled = false;
    (async () => {
      for (let i = 0; i < days.length; i++) {
        if (cancelled) return;
        const day = days[i];
        const address = firstAddress(day);
        const coords = await resolveCoords(address);
        const weather = await resolveWeather(isoDates[i], coords);
        if (!cancelled) {
          setWeatherByDay((prev) => ({ ...prev, [day.id]: weather }));
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [days]);

  return weatherByDay;
}
