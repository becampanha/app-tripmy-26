import { execSync } from 'node:child_process';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

// Identificador de build para a tela "Mais" (hash curto do commit + hora do
// build) — gerado sozinho a cada deploy, nunca editado manualmente. Usa as
// env vars que a Vercel já injeta no ambiente de build; cai pro git local
// (via execSync) só em dev, quando essas vars não existem.
function resolveCommitSha() {
  if (process.env.VERCEL_GIT_COMMIT_SHA) return process.env.VERCEL_GIT_COMMIT_SHA.slice(0, 7);
  try {
    return execSync('git rev-parse --short HEAD').toString().trim();
  } catch {
    return 'dev';
  }
}

const BUILD_INFO = {
  commit: resolveCommitSha(),
  builtAt: new Date().toISOString(),
};

export default defineConfig({
  define: {
    __BUILD_INFO__: JSON.stringify(BUILD_INFO),
  },
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icons/icon-192.png', 'icons/icon-512.png'],
      devOptions: { enabled: true, type: 'module' },
      workbox: {
        cleanupOutdatedCaches: true,
        runtimeCaching: [
          {
            // Fotos dos lugares (fachada/pratos), servidas como estáticos em
            // /places/: uma vez baixadas quase nunca mudam, então serve
            // direto do cache assim que a primeira visita as baixar — não
            // pré-carrega todas de uma vez, só as que você realmente abrir.
            urlPattern: ({ url }) => url.pathname.startsWith('/places/'),
            handler: 'CacheFirst',
            options: {
              cacheName: 'place-photos',
              expiration: { maxEntries: 500, maxAgeSeconds: 60 * 60 * 24 * 90 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
          {
            // Dados do roteiro/lugares: tenta buscar atualizado na rede,
            // mas cai pro cache instantaneamente se a rede estiver lenta ou
            // offline, e sempre guarda a última resposta boa.
            urlPattern: ({ url }) => url.pathname.startsWith('/api/'),
            handler: 'NetworkFirst',
            options: {
              cacheName: 'api-data',
              networkTimeoutSeconds: 4,
              expiration: { maxEntries: 200, maxAgeSeconds: 60 * 60 * 24 * 30 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
        ],
      },
      manifest: {
        name: 'Cronograma de Viagem',
        short_name: 'Cronograma',
        description: 'Cronograma de atividades do dia para a viagem a Orlando',
        start_url: '/',
        display: 'standalone',
        background_color: '#151210',
        theme_color: '#151210',
        icons: [
          { src: 'icons/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
    }),
  ],
});
