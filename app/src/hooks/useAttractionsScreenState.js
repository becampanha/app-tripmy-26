// Estado da tela de Atrações (parque/filtros selecionados + posição de
// scroll) guardado fora do React, num objeto de módulo — sobrevive à
// desmontagem do componente quando se navega para outra tela e volta (a
// rota troca a key do elemento no App.jsx, então o React destrói e recria
// AttractionsScreen do zero). Sem isso, toda visita voltava sempre pro
// topo da lista, no primeiro parque. Mesmo padrão já usado em
// usePlacesScreenState.js/useScheduleScreenState.js.
const state = {
  parkIndex: null, // null = usa o valor padrão do componente na 1ª visita
  search: '',
  onlyInItinerary: false,
  scrollTop: 0,
};

export function getAttractionsScreenState() {
  return state;
}

export function saveAttractionsScreenState(patch) {
  Object.assign(state, patch);
}
