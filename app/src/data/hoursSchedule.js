// Formato interno de horário de funcionamento, por dia da semana:
// { mon: [{open:"11:00", close:"22:00"}], tue: [...], ..., sun: [...] }
// Array vazio (ou dia ausente) = fechado nesse dia. Mais de um período no
// mesmo dia cobre casos tipo almoço/jantar separados (fecha à tarde).

export const DAY_KEYS = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];
export const DAY_LABELS = { mon: 'Segunda', tue: 'Terça', wed: 'Quarta', thu: 'Quinta', fri: 'Sexta', sat: 'Sábado', sun: 'Domingo' };
export const DAY_LABELS_SHORT = { mon: 'Seg', tue: 'Ter', wed: 'Qua', thu: 'Qui', fri: 'Sex', sat: 'Sáb', sun: 'Dom' };

export function emptySchedule() {
  return { mon: [], tue: [], wed: [], thu: [], fri: [], sat: [], sun: [] };
}

// "11:00" -> "11h", "11:30" -> "11h30" — mesma convenção enxuta usada no
// resto do app pra horário (ver "6h", "12h" nos cards de atividade).
function formatTime(hhmm) {
  const [h, m] = hhmm.split(':');
  const hour = String(Number(h));
  return m === '00' ? `${hour}h` : `${hour}h${m}`;
}

function formatPeriods(periods) {
  if (!periods || periods.length === 0) return 'Fechado';
  return periods.map((p) => `${formatTime(p.open)}–${formatTime(p.close)}`).join(', ');
}

// Mesmo dia conta como "igual" a outro se tiver exatamente os mesmos
// períodos (quantidade, abre e fecha) — comparado como string pra não
// precisar de deep-equal próprio.
function periodsKey(periods) {
  return (periods || []).map((p) => `${p.open}-${p.close}`).join('|');
}

// Agrupa dias consecutivos (na ordem mon..sun) com o mesmo horário numa
// única faixa — mesmo padrão que o Google Maps usa pra exibir horário
// (ex: "Segunda a Sexta: 11h–22h" em vez de repetir a linha 5x). Retorna
// um array de { label, value } pronto pra renderizar, já na ordem da semana.
export function summarizeSchedule(schedule) {
  if (!schedule) return [];

  const groups = [];
  for (const dayKey of DAY_KEYS) {
    const periods = schedule[dayKey] || [];
    const key = periodsKey(periods);
    const last = groups[groups.length - 1];
    if (last && last.key === key) {
      last.days.push(dayKey);
    } else {
      groups.push({ key, days: [dayKey], periods });
    }
  }

  return groups.map((g) => ({
    label: g.days.length === 1
      ? DAY_LABELS_SHORT[g.days[0]]
      : `${DAY_LABELS_SHORT[g.days[0]]} a ${DAY_LABELS_SHORT[g.days[g.days.length - 1]]}`,
    value: formatPeriods(g.periods),
  }));
}

// Linha única resumida pra mostrar fora do acordeão (ex: no InfoCard de
// Horário) — o horário de hoje, já formatado.
export function todaySummary(schedule) {
  if (!schedule) return null;
  const todayKey = DAY_KEYS[(new Date().getDay() + 6) % 7]; // getDay(): 0=dom..6=sáb → mon..sun
  return formatPeriods(schedule[todayKey] || []);
}

export function allDaysList(schedule) {
  return DAY_KEYS.map((dayKey) => ({
    key: dayKey,
    label: DAY_LABELS[dayKey],
    value: formatPeriods(schedule[dayKey] || []),
  }));
}
