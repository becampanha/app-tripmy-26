import { useSyncExternalStore } from 'react';

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
