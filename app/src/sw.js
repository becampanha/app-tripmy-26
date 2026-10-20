import { cleanupOutdatedCaches, precacheAndRoute } from 'workbox-precaching';
import { registerRoute, NavigationRoute } from 'workbox-routing';
import { CacheFirst, NetworkFirst } from 'workbox-strategies';
import { ExpirationPlugin } from 'workbox-expiration';
import { CacheableResponsePlugin } from 'workbox-cacheable-response';

// self.__WB_MANIFEST é substituído em build time pela lista de arquivos do
// precache (injectManifest) — precisa desse SW customizado (em vez do
// generateSW anterior) só pra poder ouvir o evento 'push' abaixo; o resto
// do comportamento de cache é o mesmo de antes, só reescrito nos termos do
// Workbox em vez da config declarativa do vite-plugin-pwa.
precacheAndRoute(self.__WB_MANIFEST);
cleanupOutdatedCaches();

// Navegação (abrir/recarregar o app) sempre tenta a rede primeiro, com
// fallback pro precache só se estiver offline de verdade — nunca serve um
// index.html velho do precache enquanto a rede está disponível. Sem isso, um
// usuário com uma versão antiga do SW ainda ativo (porque nunca viu/clicou
// no banner de atualização, ver useSwUpdate.js) podia ficar servindo um
// index.html desatualizado via precache por tempo indefinido, mesmo com uma
// versão nova publicada e acessível — o app ficava preso na tela de boot
// pra sempre, pois esse HTML velho referenciava um bundle JS que o SW velho
// também tinha em cache, mas cujo conteúdo real não bate mais com o que o
// restante do app (API, outras abas) espera.
registerRoute(
  new NavigationRoute(
    new NetworkFirst({
      cacheName: 'app-shell',
      networkTimeoutSeconds: 4,
      plugins: [new CacheableResponsePlugin({ statuses: [0, 200] })],
    })
  )
);

registerRoute(
  ({ url }) => url.pathname.startsWith('/places/'),
  new CacheFirst({
    cacheName: 'place-photos',
    plugins: [
      new ExpirationPlugin({ maxEntries: 500, maxAgeSeconds: 60 * 60 * 24 * 90 }),
      new CacheableResponsePlugin({ statuses: [0, 200] }),
    ],
  })
);

registerRoute(
  ({ url }) => url.pathname.startsWith('/api/'),
  new NetworkFirst({
    cacheName: 'api-data',
    networkTimeoutSeconds: 4,
    plugins: [
      new ExpirationPlugin({ maxEntries: 200, maxAgeSeconds: 60 * 60 * 24 * 30 }),
      new CacheableResponsePlugin({ statuses: [0, 200] }),
    ],
  })
);

self.addEventListener('push', (event) => {
  if (!event.data) return;
  const payload = event.data.json();
  event.waitUntil(
    self.registration.showNotification(payload.title, {
      body: payload.body,
      icon: '/icons/icon-192.png',
      badge: '/icons/icon-192.png',
      data: { url: payload.url || '/' },
    })
  );
});

// Clica na notificação: foca uma aba já aberta do app se existir, senão
// abre uma nova na URL enviada no payload do push.
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const targetUrl = event.notification.data?.url || '/';
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clients) => {
      const existing = clients.find((c) => 'focus' in c);
      if (existing) return existing.focus();
      return self.clients.openWindow(targetUrl);
    })
  );
});

self.addEventListener('message', (event) => {
  if (event.data?.type === 'SKIP_WAITING') self.skipWaiting();
});
