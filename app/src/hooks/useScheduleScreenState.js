// Estado da tela de Roteiro (dia selecionado + posição de scroll) guardado
// fora do React, num objeto de módulo — sobrevive à desmontagem do
// componente quando se navega para outra tela e volta (a rota troca a key
// do elemento no App.jsx, então o React destrói e recria ScheduleScreen do
// zero). Sem isso, toda visita voltava sempre pro primeiro dia. Mesmo
// padrão já usado em usePlacesScreenState.js.
const state = {
  selectedDay: null, // null = usa o valor padrão do componente na 1ª visita
  scrollTop: 0,
};

export function getScheduleScreenState() {
  return state;
}

export function saveScheduleScreenState(patch) {
  Object.assign(state, patch);
}
