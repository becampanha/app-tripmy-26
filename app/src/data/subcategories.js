import { readCache } from '../hooks/persistentCache.js';

// "Áreas" por categoria-mãe — hoje vêm do banco (tabela place_areas, editável
// em Configurações > Áreas de lugares), não mais hardcoded aqui. Mantido
// síncrono (lookup num cache de módulo, igual useAttractionsData.js) pra não
// mudar a assinatura usada pelos 3 call-sites existentes (PlacesScreen,
// PlaceDetailScreen, PlaceSelectorModal) — useAreasData() é quem preenche
// esse cache a partir da API; até a primeira resposta chegar (ou se não
// houver cache em disco ainda), retorna o fallback abaixo.
//
// Fallback só cobre o estado anterior à feature de áreas editáveis (mesmo
// vocabulário que já existia hardcoded) — nunca mais é escrito depois disso;
// existe só pra não deixar a tela sem nenhuma opção na primeiríssima visita
// offline, sem cache em disco.
const FALLBACK_GEO_AREAS = [
  'Orlando',
  'Hotéis Disney',
  'Disney Springs',
  'Magic Kingdom',
  'Epcot',
  'Hollywood Studios',
  'Animal Kingdom',
  'Universal Studios',
  'Islands of Adventure',
  'Universal CityWalk',
  'Miami',
  'Winter Garden',
  'Winter Park',
];
const FALLBACK_BY_CATEGORY = {
  Restaurante: FALLBACK_GEO_AREAS,
  Mercado: FALLBACK_GEO_AREAS,
  Centros: FALLBACK_GEO_AREAS,
  Outlets: FALLBACK_GEO_AREAS,
  Shopping: FALLBACK_GEO_AREAS,
  Loja: FALLBACK_GEO_AREAS,
  Parque: ['Universal', 'Disney'],
  Hotel: FALLBACK_GEO_AREAS,
  Aeroporto: FALLBACK_GEO_AREAS,
  Outro: FALLBACK_GEO_AREAS,
};

// Espelho em memória de módulo — ver useAreasData.js, que é quem busca da API
// e mantém isto (e o localStorage por trás) em sincronia.
export let cachedAreasByCategory = readCache('placeAreas');

export function setCachedAreasByCategory(byCategory) {
  cachedAreasByCategory = byCategory;
}

export function subcategoriesFor(category) {
  const fromCache = cachedAreasByCategory?.[category];
  if (fromCache) return fromCache.map((a) => a.name);
  return FALLBACK_BY_CATEGORY[category] || [];
}
