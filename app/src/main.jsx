import React from 'react';
import ReactDOM from 'react-dom/client';
import { registerSW } from 'virtual:pwa-register';
import App from './App.jsx';
import './index.css';

// Checa por uma versão nova a cada 60s e, assim que encontrar, atualiza o
// service worker e recarrega a página sozinho — sem depender do timing
// padrão do navegador (que só troca o SW quando todas as abas antigas
// fecham) nem exigir hard-refresh manual do usuário.
registerSW({
  immediate: true,
  onRegisteredSW(swUrl, registration) {
    if (!registration) return;
    setInterval(() => {
      registration.update();
    }, 60 * 1000);
  },
});

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
