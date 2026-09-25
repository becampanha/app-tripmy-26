import { useSyncExternalStore } from 'react';

// Estado global simples (mesmo padrão de useEditingState.js): qualquer
// componente pode disparar um toast chamando showToast(), sem precisar
// passar callbacks/contexto por toda a árvore. O <ToastHost /> (montado uma
// única vez em App.jsx) é o único que efetivamente lê e renderiza.
const DURATION_MS = 3000;

let toasts = [];
let nextId = 1;
const listeners = new Set();

function notify() {
  listeners.forEach((l) => l());
}

function subscribe(listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function getSnapshot() {
  return toasts;
}

function dismiss(id) {
  toasts = toasts.filter((t) => t.id !== id);
  notify();
}

export function showToast(message, type = 'success') {
  const id = nextId++;
  toasts = [...toasts, { id, message, type }];
  notify();
  setTimeout(() => dismiss(id), DURATION_MS);
}

// Extrai uma mensagem legível de um erro vindo da API. itineraryApi.js já
// propaga error.message com o texto retornado pelo backend, mas uma falha
// de rede pura (sem internet, wifi caiu) chega como TypeError nativo do
// fetch ("Failed to fetch") — técnico demais para mostrar ao usuário, então
// nesse caso preferimos sempre a mensagem de fallback amigável.
export function showErrorToast(err, fallback = 'Algo deu errado. Tente novamente.') {
  const message = err instanceof TypeError ? fallback : err?.message || fallback;
  showToast(message, 'error');
}

export function useToasts() {
  return useSyncExternalStore(subscribe, getSnapshot);
}

export function dismissToast(id) {
  dismiss(id);
}
