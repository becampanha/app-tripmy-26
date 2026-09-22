// Popula o banco Neon a partir de src/data/places.json e src/data/itinerary.json.
// Rodar uma única vez (ou após reset) via: node db/migrate.js

const { neon } = require('@neondatabase/serverless');
const fs = require('fs');
const path = require('path');

const sql = neon(process.env.DATABASE_URL);

const places = JSON.parse(fs.readFileSync(path.join(__dirname, '../src/data/places.json'), 'utf-8'));
const itinerary = JSON.parse(fs.readFileSync(path.join(__dirname, '../src/data/itinerary.json'), 'utf-8'));

// Índice de lugares por endereço, para tentar vincular atividades do roteiro
// que já tinham um campo "address" verificado ao lugar correspondente do catálogo.
const placeByAddress = new Map();
for (const p of places) {
  if (p.address) placeByAddress.set(p.address, p.id);
}

// Alguns registros da planilha original trouxeram distância como texto ("5 km")
// em vez de número — extrai o valor numérico.
function toNumber(value) {
  if (value == null) return null;
  if (typeof value === 'number') return value;
  const match = String(value).match(/[\d.]+/);
  return match ? parseFloat(match[0]) : null;
}

async function main() {
  await sql.query('TRUNCATE activities, days, places RESTART IDENTITY CASCADE');

  for (const p of places) {
    await sql.query(
      `INSERT INTO places (id, name, category, tag, address, rating, google_maps_uri, photo, dish_photos, cost, hours, distance_from_hotel, menu_label, review_label, recommendation)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15)`,
      [
        p.id, p.name, p.category, p.tag || null, p.address || null, p.rating ?? null,
        p.googleMapsUri || null, p.photo || null, JSON.stringify(p.dishPhotos || []),
        toNumber(p.cost), p.hours || null, toNumber(p.distanceFromHotel),
        p.menuLabel || null, p.reviewLabel || null, p.recommendation || null,
      ]
    );
  }
  console.log(`places: ${places.length} inseridos`);

  let dayOrder = 0;
  let activityCount = 0;
  for (const day of itinerary) {
    const [dayRow] = await sql.query(
      `INSERT INTO days (date, weekday, theme, sort_order) VALUES ($1,$2,$3,$4) RETURNING id`,
      [day.date, day.weekday, day.theme, dayOrder]
    );
    dayOrder += 1;

    let actOrder = 0;
    for (const act of day.activities) {
      const placeId = act.address ? placeByAddress.get(act.address) || null : null;
      await sql.query(
        `INSERT INTO activities (day_id, time, title, subtitle, address, place_id, sort_order)
         VALUES ($1,$2,$3,$4,$5,$6,$7)`,
        [dayRow.id, act.time, act.title, act.subtitle || '', act.address || null, placeId, actOrder]
      );
      actOrder += 1;
      activityCount += 1;
    }
  }
  console.log(`days: ${itinerary.length} inseridos`);
  console.log(`activities: ${activityCount} inseridos`);
}

main()
  .then(() => { console.log('Migração concluída.'); process.exit(0); })
  .catch((e) => { console.error(e); process.exit(1); });
