// "Quem sou eu neste aparelho" — sem login, persiste só via localStorage.
// Definido pela primeira vez na etapa obrigatória "Quem é você?" do
// onboarding (ver WelcomeScreen.jsx/WhoAreYouStep.jsx, só aparece se ainda
// não há identidade salva) ou, como reforço, na primeira abertura da aba
// Compras (ver ShoppingScreen.jsx/WhoAreYouContent) — e sobrevive a
// fechar/reabrir o app; só se perde se o usuário desinstalar o PWA ou
// limpar os dados do site. Depois de definida, pode ser trocada a qualquer
// momento pelo select no header da tela Mais (ver MoreScreen.jsx) — esse
// select e o getTravelerIdentity() daqui são a mesma fonte de verdade, então
// Compras já reflete a troca na próxima vez que for aberta. Já o dropdown de
// viajante dentro da própria tela de Compras é diferente: troca só a
// VISUALIZAÇÃO (ver outra lista sem virar ela), não mexe nesta identidade.
const KEY = 'travelerIdentity';

export function getTravelerIdentity() {
  try {
    return localStorage.getItem(KEY);
  } catch {
    return null;
  }
}

export function setTravelerIdentity(name) {
  try {
    localStorage.setItem(KEY, name);
  } catch {
    // localStorage indisponível — pior caso é perguntar de novo na próxima vez
  }
}
