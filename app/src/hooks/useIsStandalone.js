// Detecta se o app está rodando "instalado" (ícone salvo na tela de início,
// sem a barra do Safari) ou dentro do navegador normal.
// navigator.standalone é específico do WebKit/iOS — não existe em outros
// navegadores. display-mode: standalone é o equivalente padrão (Android/
// Chrome e também suportado pelo iOS em versões recentes) — checamos os
// dois porque nenhum sozinho cobre 100% dos casos.
export function isStandalone() {
  if (typeof window === 'undefined') return true;
  return window.navigator.standalone === true || window.matchMedia('(display-mode: standalone)').matches;
}

// iOS/iPadOS é quem tem o fluxo manual de "Adicionar à Tela de Início" via
// Safari — Android já oferece o prompt nativo do Chrome, e desktop não tem
// esse conceito de tela de início.
export function isIOS() {
  if (typeof navigator === 'undefined') return false;
  return /iphone|ipad|ipod/i.test(navigator.userAgent);
}
