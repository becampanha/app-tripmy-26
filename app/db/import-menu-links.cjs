// Importa o websiteUri do Google Places (New) como ponto de partida do link
// do menu de cada restaurante já cadastrado, salvando em places.menu_uri —
// a Places API não tem campo dedicado "menu", então o site do estabelecimento
// é a melhor aproximação disponível (nem sempre é exatamente a página do
// cardápio, requer revisão manual depois). Só preenche quem ainda não tem
// menu_uri (idempotente, seguro rodar de novo). Rodar uma vez: node db/import-menu-links.cjs

const fs = require('fs');
const path = require('path');
const { neon } = require('@neondatabase/serverless');

const env = fs.readFileSync(path.join(__dirname, '../.env.local'), 'utf-8');
const dbUrlMatch = env.match(/^DATABASE_URL="(.+)"$/m);
const apiKeyMatch = env.match(/^GOOGLE_PLACES_API_KEY="(.+)"$/m);

const sql = neon(dbUrlMatch[1]);
const apiKey = apiKeyMatch[1];

async function fetchWebsiteUri(placeId) {
  const response = await fetch(`https://places.googleapis.com/v1/places/${placeId}`, {
    method: 'GET',
    headers: {
      'X-Goog-Api-Key': apiKey,
      'X-Goog-FieldMask': 'websiteUri',
    },
  });
  if (!response.ok) return null;
  const data = await response.json();
  return data.websiteUri || null;
}

async function main() {
  const restaurants = await sql.query(
    "SELECT id, name FROM places WHERE category = 'Restaurante' AND menu_uri IS NULL ORDER BY name"
  );
  console.log(`${restaurants.length} restaurantes sem menu_uri (de um total na categoria).`);

  let updated = 0;
  let skipped = 0;
  for (const place of restaurants) {
    try {
      const websiteUri = await fetchWebsiteUri(place.id);
      if (websiteUri) {
        await sql.query('UPDATE places SET menu_uri = $1 WHERE id = $2', [websiteUri, place.id]);
        updated++;
        console.log(`✓ ${place.name} -> ${websiteUri}`);
      } else {
        skipped++;
        console.log(`  ${place.name} -> sem website cadastrado no Google`);
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
