// Estado da tela de Dicas (modo de visualização escolhido) guardado fora do
// React, num objeto de módulo — sobrevive à desmontagem do componente
// quando se navega para outra tela e volta (a rota troca a key do elemento
// no App.jsx, então o React destrói e recria RecommendationsScreen do
// zero). Sem isso, toda visita voltava sempre pro modo padrão. Mesmo padrão
// já usado em usePlacesScreenState.js/useAttractionsScreenState.js.
const state = {
  viewMode: 'cards', // padrão: carrossel — só vira 'list' se o usuário trocar
  category: null, // null = usa o valor padrão do componente na 1ª visita
};

export function getRecommendationsScreenState() {
  return state;
}

export function saveRecommendationsScreenState(patch) {
  Object.assign(state, patch);
}
