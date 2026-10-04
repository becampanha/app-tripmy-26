import { execSync } from 'node:child_process';
import { defineConfig, loadEnv } from 'vite';
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

export default defineConfig(({ mode }) => {
  // process.env (populado pela Vercel em build/produção) não inclui o
  // .env.local em dev — `vercel dev` roda este arquivo como processo Node
  // puro, sem injetar o .env.local nele (só nas functions de api/). loadEnv
  // lê esse arquivo direto do disco, cobrindo os dois ambientes.
  const env = { ...process.env, ...loadEnv(mode, process.cwd(), '') };

  return {
    define: {
      __BUILD_INFO__: JSON.stringify(BUILD_INFO),
      // Mesma var usada no servidor (ver api/_push.js) — só a chave PÚBLICA
      // VAPID é exposta ao bundle do cliente, a privada nunca sai da function.
      'import.meta.env.VITE_VAPID_PUBLIC_KEY': JSON.stringify(env.VAPID_PUBLIC_KEY || ''),
    },
    plugins: [
      react(),
      VitePWA({
        strategies: 'injectManifest',
        srcDir: 'src',
        filename: 'sw.js',
        registerType: 'autoUpdate',
        includeAssets: ['icons/icon-192.png', 'icons/icon-512.png'],
        devOptions: { enabled: true, type: 'module' },
        // O cache (CacheFirst/NetworkFirst) agora é escrito à mão dentro do
        // próprio src/sw.js — precisou virar um SW customizado (em vez do
        // generateSW anterior) só pra poder ouvir o evento 'push' de Web Push.
        manifest: {
          name: 'Family Trip',
          short_name: 'Family Trip',
          description: 'Roteiro, dicas, lugares e atrações da viagem em família a Orlando.',
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
  };
});
