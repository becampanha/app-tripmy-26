// Entrada em cascata do corpo de uma tela (inspirado no exemplo "Hero
// Stagger" do site do Motion) — cada bloco de conteúdo (header de seção,
// card, lista) aparece com um pequeno atraso em relação ao anterior, em vez
// de tudo de uma vez. Usado tanto no primeiro carregamento de uma tela com
// abas (Roteiro, Lugares, Atrações, Dicas, Compras...) quanto, trocando a
// `key` do container de STAGGER_CONTAINER pela aba ativa, toda vez que o
// usuário troca de aba — reanimando o conteúdo novo, como o efeito de trocar
// de story no Instagram.
//
// staggerChildren no container se aplica à ordem dos FILHOS DIRETOS; cada
// filho só precisa declarar `variants={STAGGER_ITEM}` e herda o momento de
// entrada do pai — não precisa de transition própria.
export const STAGGER_CONTAINER = {
  hidden: {},
  show: { transition: { staggerChildren: 0.09, delayChildren: 0.05 } },
};

export const STAGGER_ITEM = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 300, damping: 26 } },
};
