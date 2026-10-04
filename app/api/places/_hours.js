// Converte regularOpeningHours.periods (Places API New) pro formato interno
// { mon: [{open,close}], tue: [...], ..., sun: [...] } — usado tanto na
// importação de um lugar novo quanto na reimportação manual de horários
// (ver google.js, actions `details`/`importPhotos`).
//
// A API do Google numera os dias 0=domingo..6=sábado (mesmo padrão de
// Date.getDay()); aqui usamos chaves nomeadas (mon..sun) pra não depender
// de memorizar esse índice em nenhum outro lugar do código.
const GOOGLE_DAY_INDEX_TO_KEY = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];

function pad2(n) {
  return String(n).padStart(2, '0');
}

export function periodsToHoursSchedule(periods) {
  if (!Array.isArray(periods) || periods.length === 0) return null;

  const schedule = { mon: [], tue: [], wed: [], thu: [], fri: [], sat: [], sun: [] };

  for (const period of periods) {
    const open = period.open;
    const close = period.close;
    if (!open) continue;

    const dayKey = GOOGLE_DAY_INDEX_TO_KEY[open.day];
    if (!dayKey) continue;

    const openStr = `${pad2(open.hour ?? 0)}:${pad2(open.minute ?? 0)}`;
    // Alguns lugares ficam abertos 24h e o Google não manda `close` — ou o
    // período atravessa a meia-noite (close.day != open.day); em ambos os
    // casos registramos como "até 23:59" nesse dia em vez de tentar
    // representar um horário que cruza dois dias na mesma entrada.
    const closeStr = !close
      ? '23:59'
      : close.day !== open.day
        ? '23:59'
        : `${pad2(close.hour ?? 0)}:${pad2(close.minute ?? 0)}`;

    schedule[dayKey].push({ open: openStr, close: closeStr });
  }

  return schedule;
}
