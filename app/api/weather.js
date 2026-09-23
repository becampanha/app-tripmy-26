// GET /api/weather?date=YYYY-MM-DD&lat=..&lng=..
//
// Se a data estiver dentro da janela de previsão real (Open-Meteo cobre até
// ~16 dias à frente), retorna a previsão real daquele dia. Caso contrário
// (datas distantes, ex: viagem meses no futuro), retorna a MÉDIA HISTÓRICA
// de min/max para aquele dia-do-ano, calculada a partir dos últimos 5 anos
// via o endpoint de arquivo histórico — com `isHistoricalAverage: true` pra
// o client sinalizar que é estimativa, não previsão real.

const HISTORY_YEARS = 5;
const FORECAST_WINDOW_DAYS = 16;

function daysBetween(a, b) {
  return Math.round((b - a) / 86400000);
}

async function fetchForecast(lat, lng, dateStr) {
  const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&daily=temperature_2m_max,temperature_2m_min,weathercode&timezone=auto&start_date=${dateStr}&end_date=${dateStr}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Forecast API respondeu ${res.status}`);
  const data = await res.json();
  const i = data.daily.time.indexOf(dateStr);
  if (i === -1) return null;
  return {
    max: data.daily.temperature_2m_max[i],
    min: data.daily.temperature_2m_min[i],
    code: data.daily.weathercode[i],
  };
}

async function fetchHistoricalYear(lat, lng, year, month, day) {
  const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  const url = `https://archive-api.open-meteo.com/v1/archive?latitude=${lat}&longitude=${lng}&start_date=${dateStr}&end_date=${dateStr}&daily=temperature_2m_max,temperature_2m_min,weathercode&timezone=auto`;
  const res = await fetch(url);
  if (!res.ok) return null;
  const data = await res.json();
  if (!data.daily || data.daily.time.length === 0) return null;
  return {
    max: data.daily.temperature_2m_max[0],
    min: data.daily.temperature_2m_min[0],
    code: data.daily.weathercode[0],
  };
}

function average(nums) {
  const valid = nums.filter((n) => n != null);
  if (valid.length === 0) return null;
  return valid.reduce((a, b) => a + b, 0) / valid.length;
}

function mostCommonCode(codes) {
  const valid = codes.filter((c) => c != null);
  if (valid.length === 0) return null;
  const counts = {};
  for (const c of valid) counts[c] = (counts[c] || 0) + 1;
  return Number(Object.entries(counts).sort((a, b) => b[1] - a[1])[0][0]);
}

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { date, lat, lng } = req.query;
  if (!date || !lat || !lng) {
    return res.status(400).json({ error: 'Parâmetros "date", "lat" e "lng" são obrigatórios' });
  }

  const target = new Date(`${date}T00:00:00Z`);
  if (Number.isNaN(target.getTime())) {
    return res.status(400).json({ error: 'Parâmetro "date" inválido, use YYYY-MM-DD' });
  }

  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);
  const diffDays = daysBetween(today, target);

  try {
    if (diffDays >= 0 && diffDays <= FORECAST_WINDOW_DAYS) {
      const forecast = await fetchForecast(lat, lng, date);
      if (forecast) {
        return res.status(200).json({ ...forecast, isHistoricalAverage: false });
      }
    }

    const [, month, day] = date.split('-').map(Number);
    const currentYear = today.getUTCFullYear();
    const years = Array.from({ length: HISTORY_YEARS }, (_, i) => currentYear - 1 - i);

    const results = await Promise.all(
      years.map((y) => fetchHistoricalYear(lat, lng, y, month, day).catch(() => null))
    );

    const max = average(results.map((r) => r && r.max));
    const min = average(results.map((r) => r && r.min));
    const code = mostCommonCode(results.map((r) => r && r.code));

    if (max == null || min == null) {
      return res.status(502).json({ error: 'Não foi possível obter dados climáticos' });
    }

    return res.status(200).json({
      max: Math.round(max * 10) / 10,
      min: Math.round(min * 10) / 10,
      code,
      isHistoricalAverage: true,
    });
  } catch (err) {
    return res.status(500).json({ error: 'Falha ao buscar clima', details: err.message });
  }
}
