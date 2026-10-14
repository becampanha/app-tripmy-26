import { readCache, writeCache } from './persistentCache.js';

// Cache da lista de compras por viajante: primeiro tenta o localStorage
// (sobrevive a fechar o app/aba e reabrir dias depois, mesmo sem internet),
// com um espelho em memória de módulo pra não reler o disco a cada
// remontagem da tela dentro da mesma sessão. Mesmo padrão de
// usePlacesScreenState.js/useAttractionsData.js, com chave por viajante
// porque cada pessoa tem sua própria lista.
const cachedItemsByIdentity = new Map();

export function getCachedShoppingItems(identity) {
  if (!identity) return null;
  if (cachedItemsByIdentity.has(identity)) return cachedItemsByIdentity.get(identity);
  const fromDisk = readCache(`shopping:${identity}`);
  cachedItemsByIdentity.set(identity, fromDisk);
  return fromDisk;
}

export function setCachedShoppingItems(identity, items) {
  if (!identity) return;
  cachedItemsByIdentity.set(identity, items);
  writeCache(`shopping:${identity}`, items);
}
