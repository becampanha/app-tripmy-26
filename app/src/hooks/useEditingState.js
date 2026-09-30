import { useEffect, useSyncExternalStore } from 'react';

// Estado global simples (fora do React) que avisa o Shell (App.jsx) quando
// alguma tela raiz está em modo de edição, pra esconder a BottomTabBar e dar
// lugar à EditActionBar — as duas vivem em componentes irmãos, sem
// relação de pai/filho, daí não dá pra resolver isso só com props.
let editing = false;
const listeners = new Set();

export function setGlobalEditing(value) {
  if (editing === value) return;
  editing = value;
  listeners.forEach((l) => l());
}

function subscribe(listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function getSnapshot() {
  return editing;
}

export function useIsEditingAnywhere() {
  return useSyncExternalStore(subscribe, getSnapshot);
}

// Mesmo mecanismo, só que para modais fullscreen renderizados por cima do
// Shell (tela de Welcome, mapa de Atrações) — sem isso a BottomTabBar
// continuava montada (e clicável) por baixo desses overlays, mesmo tendo
// z-index menor: um <button> com position:fixed ainda recebe toques mesmo
// coberto visualmente por outro elemento fixed irmão, dependendo de como o
// navegador resolve o hit-testing entre stacking contexts distintos.
let fullscreenOverlayCount = 0;
const overlayListeners = new Set();

function notifyOverlayListeners() {
  overlayListeners.forEach((l) => l());
}

function subscribeOverlay(listener) {
  overlayListeners.add(listener);
  return () => overlayListeners.delete(listener);
}

function getOverlaySnapshot() {
  return fullscreenOverlayCount > 0;
}

// Chamar no efeito de montagem de qualquer modal fullscreen que deva
// esconder a tab bar enquanto estiver aberto (ver useHidesTabBar abaixo).
export function useHidesTabBar(active) {
  useEffect(() => {
    if (!active) return;
    fullscreenOverlayCount += 1;
    notifyOverlayListeners();
    return () => {
      fullscreenOverlayCount -= 1;
      notifyOverlayListeners();
    };
  }, [active]);
}

export function useIsFullscreenOverlayOpen() {
  return useSyncExternalStore(subscribeOverlay, getOverlaySnapshot);
}
