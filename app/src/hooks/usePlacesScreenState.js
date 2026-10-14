import { readCache, writeCache } from './persistentCache.js';

// Estado da tela de Lugares (filtros + posição de scroll) guardado fora do
// React, num objeto de módulo — sobrevive à desmontagem do componente quando
// se navega para a tela de detalhes e volta (a rota troca a key do elemento
// no App.jsx, então o React destrói e recria PlacesScreen do zero). Sem isso,
// cada visita à tela de detalhes reseta filtros e a posição de leitura.
const state = {
  category: null, // null = usa o valor padrão do componente na 1ª visita
  subcategory: '',
  onlyInItinerary: false,
  onlyFavorite: false,
  search: '',
  scrollTop: 0,
};

export function getPlacesScreenState() {
  return state;
}

export function savePlacesScreenState(patch) {
  Object.assign(state, patch);
}

// Cache da lista de lugares: primeiro tenta o localStorage (sobrevive a
// fechar o app/aba e reabrir dias depois — abre instantâneo mesmo numa
// sessão nova), com um espelho em memória de módulo pra não reler o disco a
// cada remontagem da tela dentro da mesma sessão.
let cachedPlaces = readCache('places');

export function getCachedPlaces() {
  return cachedPlaces;
}

export function setCachedPlaces(places) {
  cachedPlaces = places;
  writeCache('places', places);
}

// Cache por lugar individual (chave própria, não depende de a lista inteira
// já ter sido carregada) — necessário para a tela de detalhes abrir
// instantânea mesmo em deep link direto (ex: link de favorito/compartilhado),
// quando a tela de Lugares nunca foi visitada nesta sessão/aparelho.
const cachedPlaceById = new Map();

export function getCachedPlace(id) {
  if (cachedPlaceById.has(id)) return cachedPlaceById.get(id);
  const fromDisk = readCache(`place:${id}`);
  cachedPlaceById.set(id, fromDisk);
  return fromDisk;
}

export function setCachedPlace(id, place) {
  cachedPlaceById.set(id, place);
  writeCache(`place:${id}`, place);
}
