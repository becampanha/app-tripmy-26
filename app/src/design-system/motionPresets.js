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

// EXPERIMENTO: mesma cascata de STAGGER_CONTAINER, mas só começa depois que
// a animação de entrada da PRÓPRIA tela termina (delayChildren igual à
// duração do WIPE_TRANSITION em App.jsx) — usado pela tela /mais, cujo
// efeito de entrada (a tela "descendo" por cima) precisa terminar antes do
// conteúdo começar a aparecer, em vez de animar simultaneamente.
export const WIPE_STAGGER_CONTAINER = {
  hidden: {},
  show: { transition: { staggerChildren: 0.09, delayChildren: 0.36 } },
};

// EXPERIMENTO: mesma ideia de WIPE_STAGGER_CONTAINER, mas pro delay da
// transição lateral padrão (TRANSITION em App.jsx, duration 0.32) — usado
// pelas telas de "detalhe de lista" (PlaceDetailScreen, AttractionDetailScreen):
// a tela desliza da direita só com o fundo, sem conteúdo visível, e o
// conteúdo só aparece em cascata depois que o slide termina.
export const LIST_DETAIL_STAGGER_CONTAINER = {
  hidden: {},
  show: { transition: { staggerChildren: 0.09, delayChildren: 0.32 } },
};
