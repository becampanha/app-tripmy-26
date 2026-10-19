// Adiciona suporte a "cards de Roteiro" (mini-roteiro dentro de um dia, com
// subitens) na tabela activities existente: coluna `type` ('simple' |
// 'itinerary' | 'itinerary_item') e auto-relacionamento `parent_activity_id`
// (subitem -> card pai). DEFAULT 'simple' e parent_activity_id nullable
// preservam 100% das atividades já cadastradas, sem backfill necessário.
// Idempotente (IF NOT EXISTS). Rodar uma vez: node db/add-itinerary-cards.cjs

const fs = require('fs');
const path = require('path');
const { neon } = require('@neondatabase/serverless');

const env = fs.readFileSync(path.join(__dirname, '../.env.local'), 'utf-8');
const dbUrlMatch = env.match(/^DATABASE_URL="(.+)"$/m);

const sql = neon(dbUrlMatch[1]);

async function main() {
  await sql.query(`
    ALTER TABLE activities
      ADD COLUMN IF NOT EXISTS type TEXT NOT NULL DEFAULT 'simple',
      ADD COLUMN IF NOT EXISTS parent_activity_id INTEGER REFERENCES activities(id) ON DELETE CASCADE
  `);
  await sql.query('CREATE INDEX IF NOT EXISTS idx_activities_parent_activity_id ON activities(parent_activity_id)');

  console.log('Migração concluída: activities.type e activities.parent_activity_id prontos.');
}

main().then(() => process.exit(0)).catch((err) => {
  console.error(err);
  process.exit(1);
});
