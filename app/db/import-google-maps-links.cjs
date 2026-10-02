// Importa o googleMapsUri do Google Places (New) pra todo lugar que ainda
// não tem — o botão "Ver no Google Maps" na tela de detalhes já é
// condicionado a esse campo existir (place.googleMapsUri &&), então lugares
// sem o dado simplesmente não mostravam o botão, em qualquer categoria. Só
// preenche quem ainda não tem google_maps_uri (idempotente, seguro rodar de
// novo). Rodar uma vez: node db/import-google-maps-links.cjs

const fs = require('fs');
const path = require('path');
const { neon } = require('@neondatabase/serverless');

const env = fs.readFileSync(path.join(__dirname, '../.env.local'), 'utf-8');
const dbUrlMatch = env.match(/^DATABASE_URL="(.+)"$/m);
const apiKeyMatch = env.match(/^GOOGLE_PLACES_API_KEY="(.+)"$/m);

const sql = neon(dbUrlMatch[1]);
const apiKey = apiKeyMatch[1];

async function fetchGoogleMapsUri(placeId) {
  const response = await fetch(`https://places.googleapis.com/v1/places/${placeId}`, {
    method: 'GET',
    headers: {
      'X-Goog-Api-Key': apiKey,
      'X-Goog-FieldMask': 'googleMapsUri',
    },
  });
  if (!response.ok) return null;
  const data = await response.json();
  return data.googleMapsUri || null;
}

async function main() {
  const places = await sql.query(
    "SELECT id, name, category FROM places WHERE google_maps_uri IS NULL ORDER BY category, name"
  );
  console.log(`${places.length} lugares sem google_maps_uri.`);

  let updated = 0;
  let skipped = 0;
  for (const place of places) {
    try {
      const googleMapsUri = await fetchGoogleMapsUri(place.id);
      if (googleMapsUri) {
        await sql.query('UPDATE places SET google_maps_uri = $1 WHERE id = $2', [googleMapsUri, place.id]);
        updated++;
        console.log(`✓ [${place.category}] ${place.name} -> ${googleMapsUri}`);
      } else {
        skipped++;
        console.log(`  [${place.category}] ${place.name} -> sem resultado no Google`);
      }
    } catch (e) {
      skipped++;
      console.log(`✗ [${place.category}] ${place.name} -> erro: ${e.message}`);
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
