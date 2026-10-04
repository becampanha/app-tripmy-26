// Importa o horário de funcionamento (regularOpeningHours) do Google Places
// (New) para cada lugar já cadastrado, salvando em places.hours_schedule —
// mesmo formato estruturado por dia usado em api/places/_hours.js (duplicado
// aqui porque aquele é ES module e este script roda em CommonJS). Só
// preenche quem ainda não tem hours_schedule (idempotente, seguro rodar de
// novo). Rodar uma vez: node db/import-hours.cjs

const fs = require('fs');
const path = require('path');
const { neon } = require('@neondatabase/serverless');

const env = fs.readFileSync(path.join(__dirname, '../.env.local'), 'utf-8');
const dbUrlMatch = env.match(/^DATABASE_URL="(.+)"$/m);
const apiKeyMatch = env.match(/^GOOGLE_PLACES_API_KEY="(.+)"$/m);

const sql = neon(dbUrlMatch[1]);
const apiKey = apiKeyMatch[1];

const GOOGLE_DAY_INDEX_TO_KEY = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];

function pad2(n) {
  return String(n).padStart(2, '0');
}

function periodsToHoursSchedule(periods) {
  if (!Array.isArray(periods) || periods.length === 0) return null;

  const schedule = { mon: [], tue: [], wed: [], thu: [], fri: [], sat: [], sun: [] };

  for (const period of periods) {
    const open = period.open;
    const close = period.close;
    if (!open) continue;

    const dayKey = GOOGLE_DAY_INDEX_TO_KEY[open.day];
    if (!dayKey) continue;

    const openStr = `${pad2(open.hour ?? 0)}:${pad2(open.minute ?? 0)}`;
    const closeStr = !close
      ? '23:59'
      : close.day !== open.day
        ? '23:59'
        : `${pad2(close.hour ?? 0)}:${pad2(close.minute ?? 0)}`;

    schedule[dayKey].push({ open: openStr, close: closeStr });
  }

  return schedule;
}

async function fetchOpeningHours(placeId) {
  const response = await fetch(`https://places.googleapis.com/v1/places/${placeId}`, {
    method: 'GET',
    headers: {
      'X-Goog-Api-Key': apiKey,
      'X-Goog-FieldMask': 'regularOpeningHours',
    },
  });
  if (!response.ok) return null;
  const data = await response.json();
  return periodsToHoursSchedule(data.regularOpeningHours?.periods);
}

// place_id "de verdade" do Google começa com "ChIJ" — os fallbacks da
// planilha original usam "xlsx-<slug>" e nunca existiram no Google, então
// tentar consultá-los só gastaria chamadas de API pra sempre dar 404.
function looksLikeGooglePlaceId(id) {
  return !id.startsWith('xlsx-');
}

async function main() {
  const places = await sql.query(
    'SELECT id, name FROM places WHERE hours_schedule IS NULL ORDER BY name'
  );
  const candidates = places.filter((p) => looksLikeGooglePlaceId(p.id));
  console.log(`${candidates.length} lugares sem hours_schedule e com place_id do Google (de ${places.length} sem hours_schedule no total).`);

  let updated = 0;
  let skipped = 0;
  for (const place of candidates) {
    try {
      const schedule = await fetchOpeningHours(place.id);
      if (schedule) {
        await sql.query('UPDATE places SET hours_schedule = $1 WHERE id = $2', [JSON.stringify(schedule), place.id]);
        updated++;
        console.log(`✓ ${place.name}`);
      } else {
        skipped++;
        console.log(`  ${place.name} -> sem horário cadastrado no Google`);
      }
    } catch (e) {
      skipped++;
      console.log(`✗ ${place.name} -> erro: ${e.message}`);
    }
  }

  console.log(`\nConcluído: ${updated} atualizados, ${skipped} sem dado.`);
}

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
