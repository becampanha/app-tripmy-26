// Importa o youtubeVideoId de atrações, a partir de um JSON pré-validado
// (ver /tmp/video-results-validated.json) — cada ID já foi checado via
// YouTube oEmbed antes de rodar isso, pra garantir que o vídeo existe de
// verdade. Rodar uma vez: node db/import-attraction-videos.cjs <path-to-json>

const fs = require('fs');
const path = require('path');
const { neon } = require('@neondatabase/serverless');

const env = fs.readFileSync(path.join(__dirname, '../.env.local'), 'utf-8');
const dbUrlMatch = env.match(/^DATABASE_URL="(.+)"$/m);
const sql = neon(dbUrlMatch[1]);

async function main() {
  const jsonPath = process.argv[2];
  if (!jsonPath) {
    console.error('Uso: node import-attraction-videos.cjs <path-to-json>');
    process.exit(1);
  }
  const items = JSON.parse(fs.readFileSync(jsonPath, 'utf-8'));

  let updated = 0;
  for (const item of items) {
    await sql.query('UPDATE attractions SET youtube_video_id = $1 WHERE id = $2', [item.youtubeVideoId, item.id]);
    updated++;
    console.log(`✓ [${item.id}] ${item.name} -> ${item.youtubeVideoId}`);
  }

  console.log(`\nConcluído: ${updated} atualizados.`);
}

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
