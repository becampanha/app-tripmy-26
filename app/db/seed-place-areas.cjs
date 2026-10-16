// Cria a tabela place_areas (se não existir) e popula com as áreas que já
// estavam hardcoded em src/data/subcategories.js, preservando exatamente o
// que já estava em uso em produção. Idempotente (ON CONFLICT DO NOTHING) —
// seguro rodar de novo. Rodar uma vez: node db/seed-place-areas.cjs

const fs = require('fs');
const path = require('path');
const { neon } = require('@neondatabase/serverless');

const env = fs.readFileSync(path.join(__dirname, '../.env.local'), 'utf-8');
const dbUrlMatch = env.match(/^DATABASE_URL="(.+)"$/m);

const sql = neon(dbUrlMatch[1]);

const GEO_AREAS = [
  'Orlando',
  'Hotéis Disney',
  'Disney Springs',
  'Magic Kingdom',
  'Epcot',
  'Hollywood Studios',
  'Animal Kingdom',
  'Universal Studios',
  'Islands of Adventure',
  'Universal CityWalk',
  'Miami',
  'Winter Garden',
  'Winter Park',
];

const AREAS_BY_CATEGORY = {
  Restaurante: GEO_AREAS,
  Mercado: GEO_AREAS,
  Centros: GEO_AREAS,
  Outlets: GEO_AREAS,
  Shopping: GEO_AREAS,
  Loja: GEO_AREAS,
  Parque: ['Universal', 'Disney'],
  Hotel: GEO_AREAS,
  Aeroporto: GEO_AREAS,
  Outro: GEO_AREAS,
};

async function main() {
  await sql.query(`
    CREATE TABLE IF NOT EXISTS place_areas (
      id SERIAL PRIMARY KEY,
      category TEXT NOT NULL,
      name TEXT NOT NULL,
      position INTEGER NOT NULL DEFAULT 0,
      UNIQUE (category, name)
    )
  `);
  await sql.query('CREATE INDEX IF NOT EXISTS idx_place_areas_category ON place_areas(category)');

  let inserted = 0;
  for (const [category, areas] of Object.entries(AREAS_BY_CATEGORY)) {
    for (let i = 0; i < areas.length; i++) {
      const result = await sql.query(
        `INSERT INTO place_areas (category, name, position) VALUES ($1, $2, $3)
         ON CONFLICT (category, name) DO NOTHING RETURNING id`,
        [category, areas[i], i]
      );
      if (result.length > 0) inserted++;
    }
  }

  console.log(`Seed concluído. ${inserted} área(s) inserida(s).`);
}

main().then(() => process.exit(0)).catch((err) => {
  console.error(err);
  process.exit(1);
});
