// Mapeamento de WMO Weather Interpretation Codes (usado pela Open-Meteo) para
// emoji — cobre as faixas de código documentadas em open-meteo.com/en/docs.
const RANGES = [
  { max: 0, emoji: '☀️' },   // céu limpo
  { max: 1, emoji: '🌤️' },   // principalmente limpo
  { max: 2, emoji: '⛅' },   // parcialmente nublado
  { max: 3, emoji: '☁️' },   // nublado
  { max: 48, emoji: '🌫️' },  // neblina
  { max: 57, emoji: '🌦️' },  // garoa
  { max: 67, emoji: '🌧️' },  // chuva
  { max: 77, emoji: '🌨️' },  // neve
  { max: 82, emoji: '🌧️' },  // pancadas de chuva
  { max: 86, emoji: '🌨️' },  // pancadas de neve
  { max: 99, emoji: '⛈️' },  // trovoada
];

export function weatherEmoji(code) {
  if (code == null) return '🌡️';
  const match = RANGES.find((r) => code <= r.max);
  return match ? match.emoji : '🌡️';
}
