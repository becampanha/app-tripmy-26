// Tokens visuais do Family Trip — extraídos dos padrões já em uso no app
// (ver SESSION_LOG.md e /design-system para o catálogo vivo).
// Qualquer cor/raio/tipografia nova deve nascer aqui, não inline num componente.

export const color = {
  // Neutros
  dark: '#1c1a17', // texto principal, fundo ativo (tabs/chips/badges), botão preenchido
  muted: '#9a9186', // texto secundário, label, item inativo
  mutedDeep: '#6b6459', // texto de chip de categoria inativo
  faint: '#b6ae9f', // texto de estado vazio
  faintIcon: '#b3ab9c', // ícone secundário (lupa, seta)
  white: '#ffffff',

  // Fundos
  bg: '#ffffff', // fundo de tela
  bgApp: '#e7e2da', // fundo fora do card mobile (shell)
  surfaceMuted: '#f9f7f2', // fundo claro secundário: chip/bubble inativo, skeleton, botão circular claro
  imagePlaceholder: '#eee9df', // placeholder de imagem vazia (sem foto carregada)
  border: '#ececec', // borda de card/input com contorno
  borderFaint: '#f2efe9', // divisor sutil (linha de ficha técnica)
  dashedBorder: '#dcd6ca', // borda tracejada de área de upload

  // Semânticas
  success: '#3fa35a', // verde: botão salvar, "está no roteiro", switch ligado
  successIcon: '#4d8a5c', // verde de ícone pequeno (toast, ocorrência "sim")
  successOnDark: '#6fd98a', // verde claro sobre foto/fundo escuro (Parent Swap)
  danger: '#b3453f', // vermelho: intensidade alta, remover/excluir
  dangerLight: '#e0736a', // vermelho de ícone (toast erro)
  warning: '#c98a3a', // âmbar: intensidade média
  accent: '#f4c65a', // dourado: destaque de badge (estrela "obrigatória")
  toggleOff: '#e2ddd2', // fundo de switch desligado / botão desabilitado

  // Categorias de lugar (ícone do chip quando inativo)
  category: {
    restaurante: '#c9704a',
    mercado: '#7a9e7e',
    centros: '#b3708f',
    outlets: '#c96a6a',
    shopping: '#4a9e8f',
    loja: '#5f8fc9',
    parque: '#c9985c',
    hotel: '#a9714a',
    aeroporto: '#5c8ab3',
    outro: '#8f5aa3',
  },
};

// Overlays/translúcidos derivados das cores acima — mantidos como strings
// prontas porque o valor de opacidade importa tanto quanto a cor base.
export const overlay = {
  badgeOnPhoto: 'rgba(28,26,23,0.72)', // fundo de badge/pill sobre foto
  shadowSoft: 'rgba(28,26,23,0.18)', // sombra padrão de elemento flutuante
  shadowStrong: 'rgba(28,26,23,0.35)', // sombra de elemento escuro ativo/destacado
  glassBg: 'rgba(255,255,255,0.35)', // fundo "vidro" da barra flutuante inferior
  onPhotoControl: 'rgba(255,255,255,0.22)', // botão translúcido claro sobre foto
  textShadowOnPhoto: '0 1px 4px rgba(0,0,0,0.35)', // sombra de texto branco sobre foto
  modalScrim: 'rgba(0,0,0,0.5)', // overlay escuro atrás de bottom-sheet
};

// Gradiente padrão de card com foto de fundo (referência: PlaceCard).
// 2-stop, de baixo pra cima, cobrindo ~55% da altura do card.
export const cardPhotoGradient = 'linear-gradient(to top, rgba(0,0,0,0.72) 0%, rgba(0,0,0,0) 100%)';
export const cardPhotoGradientHeight = '55%';
// Altura padrão de todo card com foto de fundo em lista (PlaceCard,
// AttractionCard, RecommendationCard) — todos do mesmo tamanho por padrão.
export const cardPhotoHeight = 300;

export const radius = {
  pill: 7, // badge pill compacta (ex: "Obrigatória")
  badge: 8, // badge/pill pequena (tag, custo)
  input: 12, // input/pill de busca, botão circular médio (~34px)
  chip: 14, // chip de tab horizontal (categoria/parque), card médio
  button: 16, // painel/card secundário, botão grande (CTA)
  card: 18, // card/bubble padrão (ActivityItem, AttractionCard antes da unificação, InfoCard)
  cardPhoto: 20, // card com foto de fundo (padrão: PlaceCard)
  circleButton: 19, // botão circular de ação (~38px, raio = metade)
  sheetTop: 24, // canto de bottom-sheet / moldura subindo sobre foto
  pillBar: 34, // cápsula da barra flutuante inferior (tab bar / EditActionBar)
  pillBarButton: 26, // cápsula de botão dentro da barra flutuante
};

// Escala de espaçamento — base 4/2, os únicos valores que devem aparecer em
// padding/margin/gap no app. Nomeada por tamanho (não por uso), pra servir
// tanto espaçamento interno (padding) quanto externo (margin/gap entre blocos).
// Regra prática: escolher o nível pela ESCALA da relação entre os elementos,
// não pelo valor em px — dois elementos "intimamente relacionados" (ícone +
// seu label) usam xs/sm; dois "blocos independentes na mesma tela" usam lg/xl.
export const space = {
  none: 0,
  xxs: 2,  // ajuste fino (ex: top de um ícone alinhado ao texto)
  xs: 4,   // gap mínimo: ícone-texto colado, linha de badge
  sm: 6,   // gap pequeno: itens dentro de um chip/badge
  md: 8,   // gap padrão entre elementos de uma mesma linha
  lg: 10,  // gap padrão entre itens de uma lista/grid curta
  xl: 14,  // padding interno de card/container padrão (cardPadding)
  xxl: 16, // separação entre um controle e o próximo bloco (ex: campo de busca → filtros)
  xxxl: 20,// respiro maior entre seções dentro do corpo de uma tela
  screenGutter: 22, // padding lateral padrão de tela — não usar 20/24 "quase igual"
};

// Aliases por papel — usar estes nos componentes em vez do nível cru sempre
// que o nome comunicar melhor a intenção (facilita trocar a escala depois).
export const spacing = {
  screenGutter: space.screenGutter,
  gapXs: space.xs,
  gapSm: space.sm,
  gapMd: space.md,
  gapLg: space.lg,
  cardPadding: space.xl, // padding interno de card/container padrão
  sectionGap: space.xxxl, // espaço entre blocos de conteúdo dentro de uma tela
  controlGap: space.xxl, // espaço entre um input/filtro e o próximo
};

export const shellMaxWidth = 480; // largura máxima do "shell" mobile

// Família tipográfica do Family Trip — nomeada por papel semântico (na linha
// de referências tipo "Text Styles": Main Title, Header, Paragraph...),
// mapeada aos tamanhos que JÁ existem de fato no app (nada importado de fora).
// Toda tela nova nasce escolhendo um destes níveis, nunca um fontSize solto.
//
// lineHeight é sempre explícito (unitless, proporcional ao fontSize) — nunca
// "normal" do navegador, que varia por fonte/peso e é o que causava chips com
// altura inconsistente entre telas. Títulos grandes usam proporção mais
// apertada (1.2–1.25); textos pequenos/labels usam proporção mais folgada
// (1.4–1.5) — fonte pequena precisa de mais respiro relativo pra não
// parecer espremida, é a prática tipográfica padrão, não um valor cravado a esmo.
export const type = {
  // Título de tela — o maior nível do app, um por tela (ex: "Roteiro", "Lugares", "Atrações").
  mainTitle: { fontSize: 26, fontWeight: 800, letterSpacing: -0.3, lineHeight: 1.2 },
  // Título de seção/card — o nível mais repetido do app. Base: nome do card
  // de atividade do Roteiro / título de seção sticky.
  sectionTitle: { fontSize: 17, fontWeight: 800, letterSpacing: -0.1, lineHeight: 1.25 },
  // Título de item de lista/card com foto (ex: título da atividade, nome no PlaceCard-like).
  itemTitle: { fontSize: 15, fontWeight: 700, lineHeight: 1.3 },
  // Texto de corpo — subtítulo de atividade, descrição.
  paragraph: { fontSize: 14, fontWeight: 500, lineHeight: 1.4 },
  // Texto de botão/CTA principal.
  button: { fontSize: 14.5, fontWeight: 700, lineHeight: 1.3 },
  // Texto de chip/tab horizontal (categoria, parque, dia).
  label: { fontSize: 12.5, fontWeight: 700, lineHeight: 1.4 },
  // Texto de badge pequeno sobre foto / label de tab bar.
  caption: { fontSize: 11, fontWeight: 700, lineHeight: 1.4 },
  // Rótulo uppercase pequeno (ex: "DURAÇÃO", "FILA", weekday do DayTabs).
  eyebrow: { fontSize: 10.5, fontWeight: 700, letterSpacing: 0.3, textTransform: 'uppercase', lineHeight: 1.45 },
};

// Aliases mantidos por clareza de uso em contextos específicos — sempre
// apontando para um nível de `type` acima, nunca um valor novo.
type.screenTitle = type.mainTitle;
type.cardPhotoTitle = type.itemTitle;
type.listItemTitle = type.itemTitle;
type.body = type.paragraph;
type.input = { fontSize: 13, fontWeight: 600 }; // texto de input/botão de select — não faz parte da escala de leitura
type.chip = type.label;
type.badge = type.caption;
