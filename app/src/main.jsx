import React from 'react';
import ReactDOM from 'react-dom/client';
import { registerSW } from 'virtual:pwa-register';
import App from './App.jsx';
import { notifyUpdateAvailable } from './hooks/useSwUpdate.js';
import './index.css';
import 'leaflet/dist/leaflet.css';

// Checa por uma versão nova a cada 60s. Quando o Workbox termina de baixar e
// instalar um service worker novo, ele fica "esperando" (waiting) — sem
// skipWaiting + reload ele nunca assume sozinho, então o app parecia nunca
// se atualizar mesmo tendo detectado a versão nova. onNeedRefresh avisa esse
// momento; updateSW(true) (passado como applyUpdate) é quem de fato ativa o
// novo SW e recarrega. O aviso vira um card flutante (ver UpdateBanner.jsx)
// em vez de recarregar sozinho — o usuário decide a hora.
const updateSW = registerSW({
  immediate: true,
  onRegisteredSW(swUrl, registration) {
    if (!registration) return;
    setInterval(() => {
      registration.update();
    }, 60 * 1000);
  },
  onNeedRefresh() {
    notifyUpdateAvailable(() => updateSW(true));
  },
});

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
