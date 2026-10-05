// "Quem sou eu neste aparelho" — sem login, persiste só via localStorage.
// Definido uma vez (tela de boas-vindas da aba Compras) e sobrevive a
// fechar/reabrir o app; só se perde se o usuário desinstalar o PWA ou
// limpar os dados do site. Trocar de viajante no dropdown da tela de
// Compras (pra navegar na lista de outra pessoa) NÃO mexe nisso — é uma
// troca de visualização temporária, não redefine a identidade do aparelho.
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
