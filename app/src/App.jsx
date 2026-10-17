import { useEffect, useRef, useState } from 'react';
import { HashRouter, Routes, Route, useLocation } from 'react-router-dom';
import { AnimatePresence, motion, usePresence } from 'motion/react';
import ScheduleScreen from './components/ScheduleScreen.jsx';
import AllDaysScreen from './components/AllDaysScreen.jsx';
import PlacesScreen from './components/PlacesScreen.jsx';
import PlaceDetailScreen from './components/PlaceDetailScreen.jsx';
import AttractionsScreen from './components/AttractionsScreen.jsx';
import AttractionDetailScreen from './components/AttractionDetailScreen.jsx';
import AttractionsItineraryScreen from './components/AttractionsItineraryScreen.jsx';
import RecommendationsScreen from './components/RecommendationsScreen.jsx';
import ShoppingScreen from './components/ShoppingScreen.jsx';
import MoreScreen from './components/MoreScreen.jsx';
import ConfigScreen from './components/ConfigScreen.jsx';
import PlaceAreasConfigScreen from './components/PlaceAreasConfigScreen.jsx';
import DesignSystemScreen from './components/DesignSystemScreen.jsx';
import BottomTabBar from './components/BottomTabBar.jsx';
import UpdateBanner from './components/UpdateBanner.jsx';
import ToastHost from './components/ToastHost.jsx';
import AddToHomeScreenPrompt, { wasAddToHomeScreenDismissed } from './components/AddToHomeScreenPrompt.jsx';
import WelcomeScreen, { wasWelcomeScreenSeen } from './components/WelcomeScreen.jsx';
import { useIsEditingAnywhere, useIsFullscreenOverlayOpen } from './hooks/useEditingState.js';
import { isIOS, isStandalone } from './hooks/useIsStandalone.js';
import { getNotificationPermission, isPushSupported, requestPushPermission } from './hooks/usePushNotifications.js';
import { useAreasData } from './hooks/useAreasData.js';
import { ActiveScreenProvider } from './hooks/useActiveScreen.js';

// Hierarquia simples de navegação: Roteiro, Dicas, Lugares, Atrações, Compras
// e Mais são telas "raiz" (sem transição de push/pop entre si); a tela de
// detalhe de um lugar/atração/viajantes é "empilhada" sobre sua tela raiz,
// como uma navigation stack do iOS.
//
// No iOS real, ao empurrar uma tela: a tela nova desliza 100% da direita até
// cobrir a tela atual; a tela de baixo NÃO acompanha com a mesma
// intensidade — só recua um pouco (parallax sutil) e escurece. Nunca as
// duas telas se deslocam com o mesmo peso visual ao mesmo tempo, senão
// parece "duas animações competindo".
//
// Cada tela sabe sua própria profundidade (0 = raiz, 1 = detalhe). Isso é
// fixo por rota, então cada motion.div (entrando ou saindo) calcula seu
// próprio variant a partir da SUA profundidade — não de um isPush/isSameLevel
// global recalculado a cada render do Shell, que seria idêntico para as duas
// instâncias simultâneas durante a transição.
function depthOf(pathname) {
  // Hierarquia real de navegação (push empilha, pop desempilha): raiz (0) →
  // /mais (1) → /configuracoes (2) → /configuracoes/areas (3). Cada rota só
  // precisa saber sua profundidade absoluta; push/pop e qual variante usar
  // são derivados comparando profundidades entre navegações (ver Shell).
  if (pathname === '/configuracoes/areas') return 3;
  if (pathname === '/configuracoes') return 2;
  return (
    pathname.startsWith('/lugares/') ||
    pathname.startsWith('/atracoes/') ||
    pathname === '/roteiro/dias' ||
    pathname === '/mais'
  ) ? 1 : 0;
}

const TRANSITION = { type: 'tween', ease: [0.32, 0.72, 0, 1], duration: 0.32 };

const variants = {
  // Topo da pilha (a tela de detalhe): entra 100% da direita, sai 100% pela direita.
  offscreenRight: { x: '100%', opacity: 1 },
  top: { x: 0, opacity: 1 },
};

// EXPERIMENTO: efeito de entrada/saída alternativo, isolado às "telas
// solitárias" — acessadas por um botão avulso, não por um item de lista
// (/mais, "Ver todos os dias" do Roteiro, "Roteiro de Atrações") — não mexe
// em depthOf/direction/isTopOfStack (o mecanismo compartilhado por todas as
// outras telas continua 100% intocado). Troca QUAIS variantes/transição
// essa tela específica usa: em vez de deslizar da direita, "desce" cobrindo
// a tela (y: -100% → 0) e sai voltando a subir (y: 0 → -100%), como um wipe
// vertical. NÃO se aplica a telas abertas a partir de um item de lista (ex:
// um lugar específico em Lugares, uma atração específica em Atrações) —
// essas usam seu próprio efeito, ver usesListDetailTransition abaixo.
function usesWipeTransition(pathname) {
  return pathname === '/mais' || pathname === '/roteiro/dias' || pathname === '/atracoes/roteiro';
}

const WIPE_TRANSITION = { type: 'tween', ease: [0.32, 0.72, 0, 1], duration: 0.36 };

const wipeVariants = {
  offscreenTop: { y: '-100%', opacity: 1 },
  top: { y: 0, opacity: 1 },
};

// A tela de baixo (ex: Roteiro sob Mais, Lugares sob o detalhe de um lugar)
// fica sempre parada no eixo X e só encolhe sutilmente (scale) — nunca mais
// desloca lateralmente (x:-22%, usado antes só na entrada lateral padrão).
// Testado com um véu escuro por cima também, mas removido a pedido: o
// recuo/scale já basta, o escurecimento ficava redundante.
const recededVariants = {
  top: { x: 0, scale: 1, opacity: 1 },
  receded: { x: 0, scale: 0.96, opacity: 1 },
};

// Rotas vivem aqui dentro, não no Shell — cada instância de Screen recebe seu
// PRÓPRIO `location` (congelado no momento em que essa instância nasceu, ver
// Shell), em vez de todas compartilharem o location "atual" do useLocation().
// Sem isso, <Routes> sempre resolve pra rota nova mesmo dentro da instância
// de Screen que o AnimatePresence está mantendo viva só pra tocar a animação
// de saída — o conteúdo que deveria estar "saindo" já virava o da tela nova
// no meio da transição, matando o efeito visual mesmo com a lógica de
// variants/direction correta.
function ScreenRoutes({ location }) {
  return (
    <Routes location={location}>
      <Route path="/" element={<ScheduleScreen />} />
      <Route path="/roteiro/dias" element={<AllDaysScreen />} />
      <Route path="/recomendacoes" element={<RecommendationsScreen />} />
      <Route path="/lugares" element={<PlacesScreen />} />
      <Route path="/lugares/novo" element={<PlaceDetailScreen />} />
      <Route path="/lugares/:id" element={<PlaceDetailScreen />} />
      <Route path="/atracoes" element={<AttractionsScreen />} />
      <Route path="/atracoes/roteiro" element={<AttractionsItineraryScreen />} />
      <Route path="/atracoes/:id" element={<AttractionDetailScreen />} />
      <Route path="/compras" element={<ShoppingScreen />} />
      <Route path="/mais" element={<MoreScreen />} />
      <Route path="/configuracoes" element={<ConfigScreen />} />
      <Route path="/configuracoes/areas" element={<PlaceAreasConfigScreen />} />
      {/* Rota oculta de referência interna — não aparece na tab bar,
          só acessível digitando /design-system na URL. */}
      <Route path="/design-system" element={<DesignSystemScreen />} />
    </Routes>
  );
}

function Screen({ depth, direction, isTopOfStack, location, onExited }) {
  // O FixedHeader de cada tela (ver design-system/FixedHeader.jsx) é
  // `position: fixed` — ignora completamente o `overflow` do container pai
  // e o `scale` do próprio motion.div (ele vira "fixed ao containing block
  // com transform mais próximo", mas continua VISÍVEL e ocupando espaço
  // físico perto do topo real da tela mesmo quando esta entrada está
  // recuada atrás de outra). Bug real reportado pelo usuário: fragmentos
  // de um header de tela recuada (ícone + texto de um item de lista)
  // "vazando" por cima/sob o conteúdo da tela ativa. `hideWhenReceded` só
  // vira true DEPOIS que a animação de recuar já terminou de verdade (via
  // onAnimationComplete abaixo) — nunca durante a transição em si, senão a
  // tela sumiria de repente no meio do movimento de scale, quebrando o
  // efeito visual.
  const [hideWhenReceded, setHideWhenReceded] = useState(false);
  const isWipeScreen = isTopOfStack && usesWipeTransition(location.pathname);
  const offscreenState = isWipeScreen ? 'offscreenTop' : 'offscreenRight';
  // Dois conjuntos de variantes: a tela de topo usa `variants` (slide
  // lateral) ou `wipeVariants` (desce/sobe); a tela de baixo SEMPRE usa
  // `recededVariants` (parada + scale), nunca o deslocamento lateral antigo.
  const activeVariants = isTopOfStack ? (isWipeScreen ? wipeVariants : variants) : recededVariants;

  // IMPORTANTE: `exit` NUNCA depende de `direction` — só de `isTopOfStack`
  // (que é fixo pra cada entrada, igual `depth`). Quando o Shell remove uma
  // entrada do array `screens` (usuário voltou, ver setScreens), o React
  // nunca mais chama Screen(...) de novo pra ela com props atualizadas — só
  // o Motion a mantém montada via AnimatePresence, CONGELADA com as ÚLTIMAS
  // props que recebeu (as de quando ela foi criada, com a `direction` de
  // ENTÃO). Se `exit` dependesse de `direction`, ele usaria essa direction
  // congelada (ex: sempre 'push', de quando entrou) — e como 'push' sempre
  // mapeava exit para 'top' (igual a animate), o useEffect de "variante de
  // saída igual à de entrada" removia a tela SEM NUNCA ANIMAR a saída (bug
  // real: a tela de detalhe sempre "sumia" em vez de deslizar pra fora ao
  // voltar, só mascarado pela tela de baixo já estar visível no lugar).
  // A saída real de QUALQUER entrada (de topo ou recuada) é sempre a MESMA,
  // não importa que direction a tirou de cena: topo sempre sai pro seu
  // offscreen; recuada sempre volta a 'top' (ela nunca desmonta de fato
  // nesse caso, só muda de variant — ver comentário em `animate` abaixo).
  const exit = isTopOfStack ? offscreenState : 'top';

  // `initial`/`animate`, ao contrário de `exit`, são seguros de calcular a
  // partir de `direction` — só importam enquanto a entrada ainda está
  // `isPresent` (recebendo props atualizadas normalmente a cada render).
  let initial, animate;
  if (direction === null) {
    initial = animate = 'top';
  } else if (isTopOfStack) {
    // Esta instância É a tela de detalhe: entra da direita (sempre — só
    // existe uma forma de "estar em cima"), sai pela direita. Exceto telas
    // "wipe" (ver acima), que descem/sobem no lugar de deslizar lateral.
    initial = direction === 'push' ? offscreenState : 'top';
    animate = 'top';
  } else {
    // Esta instância é a tela de baixo (Lugares): recua quando o detalhe
    // entra por cima, volta ao normal quando ele sai. `animate` é sempre
    // 'receded' aqui (nunca depende de `direction`) — isTopOfStack já
    // decide que ela NÃO é a de maior profundidade agora, então por
    // definição deve estar recuada. Bug real que isso corrige: calcular
    // a partir de `direction === 'push'` assumia que um 'pop' sempre
    // significava "a tela de cima fechou, volto a 'top'" — falso quando
    // existem 3+ níveis empilhados (ex: Roteiro → Mais → Configurações):
    // ao voltar de Configurações pra Mais (pop), a entrada de Roteiro
    // também recebe direction:'pop' (toda entrada remanescente recebe a
    // mesma direction, ver setScreens) e erroneamente voltava a 'top',
    // sobrepondo visualmente com Mais (ainda isTopOfStack:false pra ela,
    // já que Mais continua por cima) — o "ghosting" de duas telas na
    // mesma posição reportado pelo usuário.
    initial = 'top';
    animate = 'receded';
  }

  // usePresence (em vez de confiar só no AnimatePresence.onExitComplete do
  // pai) — cada Screen sabe por si só quando DEIXOU de ser a entrada mais
  // recente (isPresent vira false) e, só então, avisa o Shell pra removê-la
  // do array `screens`, pela SUA PRÓPRIA key. Isso suporta qualquer número
  // de telas saindo ao mesmo tempo (navegação mais rápida que a duração da
  // transição): antes, o Shell cortava o array por POSIÇÃO (current.slice(-1))
  // tanto ao adicionar quanto ao remover — com 2+ saídas sobrepostas isso
  // descartava uma tela no meio do próprio exit, sem o Framer Motion nunca
  // reportar essa remoção como concluída, e dali em diante onExitComplete
  // parava de disparar, deixando telas antigas montadas pra sempre
  // (o "ghosting" de telas sobrepostas permanentemente, não só durante a
  // transição).
  const [isPresent, safeToRemove] = usePresence();

  useEffect(() => {
    // Quando a variante de saída é IGUAL à de entrada (ex: duas telas de
    // mesma profundidade, direction null — ambas usam 'top'), a posição
    // visual não muda ao "sair", então o Motion nunca dispara uma nova
    // animação e onAnimationComplete (abaixo) jamais seria chamado de novo —
    // a tela ficaria montada pra sempre, exatamente a causa do "ghosting"
    // persistente visto em navegações rápidas em sequência. Nesse caso não
    // há nada pra esperar visualmente: remove na hora.
    if (!isPresent && animate === exit) {
      safeToRemove();
      onExited();
    }
  }, [isPresent]);

  const currentVariant = isPresent ? animate : exit;

  // Assim que a tela volta a ser a de topo (ex: voltou de Configurações pra
  // Mais), o header precisa reaparecer IMEDIATAMENTE — não esperar o fim da
  // animação de entrada, senão a tela ficaria sem header visível durante
  // toda a transição de volta a 'top'.
  useEffect(() => {
    if (isTopOfStack) setHideWhenReceded(false);
  }, [isTopOfStack]);

  return (
    <motion.div
      variants={activeVariants}
      initial={initial}
      animate={currentVariant}
      transition={direction === null ? { duration: 0 } : isWipeScreen ? WIPE_TRANSITION : TRANSITION}
      onAnimationComplete={() => {
        if (!isPresent) {
          safeToRemove();
          onExited();
          return;
        }
        if (!isTopOfStack) setHideWhenReceded(true);
      }}
      data-scroll-root
      style={{
        position: 'absolute',
        inset: 0,
        overflowY: 'auto',
        WebkitOverflowScrolling: 'touch',
        visibility: hideWhenReceded ? 'hidden' : 'visible',
        // Este motion.div — não o html/body — é quem de fato rola cada tela
        // (o body inteiro tem overflow:hidden, ver App abaixo). overscroll-
        // -behavior:none tentava impedir o "bounce" no elemento errado antes;
        // contain evita que ele vaze pro body por trás (revelando a cor de
        // fundo do sistema) sem travar o scroll do próprio elemento.
        overscrollBehavior: 'contain',
        // Agora que uma entrada "recuada" (ex: Mais sob Configurações)
        // permanece montada em vez de desmontar (ver setScreens), o Chrome
        // aplicava scroll anchoring nela: ao encolher via scale (variants
        // `receded`/`wipeRecededVariants`), ele reposicionava sozinho o
        // scrollTop pra "compensar" a mudança de layout enquanto o elemento
        // estava fora da viewport visível — bug real reportado pelo
        // usuário (tela voltava com os primeiros itens cortados, como se
        // tivesse rolado um pouco sozinha). overflow-anchor:none desativa
        // esse comportamento automático nessas telas.
        overflowAnchor: 'none',
      }}
    >
      <ActiveScreenProvider value={isTopOfStack}>
        <ScreenRoutes location={location} />
      </ActiveScreenProvider>
    </motion.div>
  );
}

// Zona de borda (px) onde o iOS reconhece o gesto de arrastar pra "voltar" —
// mesmo em PWA standalone (ícone na tela de início, sem barra do Safari), o
// WebKit intercepta esse gesto e já anima visualmente a revelação da tela
// anterior ANTES de disparar popstate. Ver uso em Shell abaixo.
const EDGE_SWIPE_ZONE_PX = 24;

function Shell() {
  const location = useLocation();
  const currentDepth = depthOf(location.pathname);

  // Detecta se a navegação de "voltar" que está prestes a ser processada
  // veio do gesto nativo de edge-swipe do iOS, não de um clique no botão
  // Voltar. Bug real reportado pelo usuário: ao arrastar da borda esquerda
  // pra voltar, a animação de "voltar" tocava 2x — uma vez porque o WebKit
  // já anima a transição sozinho durante o próprio gesto de arrastar (antes
  // de qualquer JS saber o que houve), e de novo porque, ao soltar o dedo,
  // o popstate resultante chega normalmente até aqui e o Framer Motion toca
  // a SUA PRÓPRIA animação de saída por cima — duas transições concatenadas.
  // Só acontece com o gesto (clique no botão nunca passa por touchstart).
  // `edgeSwipeRef` fica true por uma janela curta após soltar o dedo — tempo
  // suficiente pro popstate correspondente chegar e ser identificado como
  // "já animado pelo sistema", então a transição do Framer Motion abaixo é
  // pulada pra essa navegação específica (ver uso de `direction` abaixo).
  const edgeSwipeRef = useRef(false);
  useEffect(() => {
    let clearTimer = null;
    const onTouchStart = (e) => {
      const x = e.touches[0]?.clientX;
      if (x !== undefined && x < EDGE_SWIPE_ZONE_PX) edgeSwipeRef.current = true;
    };
    const onTouchEnd = () => {
      // Soltar o dedo não significa que o popstate já chegou — ele só chega
      // depois que o WebKit decide que o gesto foi "completo" o suficiente
      // pra navegar de fato. Mantém a flag viva por mais um instante; o
      // consumo (abaixo, no corpo do Shell) a zera assim que usada.
      clearTimer = setTimeout(() => { edgeSwipeRef.current = false; }, 400);
    };
    document.addEventListener('touchstart', onTouchStart, { passive: true });
    document.addEventListener('touchend', onTouchEnd, { passive: true });
    document.addEventListener('touchcancel', onTouchEnd, { passive: true });
    return () => {
      document.removeEventListener('touchstart', onTouchStart);
      document.removeEventListener('touchend', onTouchEnd);
      document.removeEventListener('touchcancel', onTouchEnd);
      if (clearTimer) clearTimeout(clearTimer);
    };
  }, []);

  // Cada entrada é um Screen "congelado" com seu PRÓPRIO location — é isso
  // que permite ter a tela de saída e a de entrada montadas ao mesmo tempo,
  // cada uma mostrando seu próprio conteúdo (não o location atual
  // compartilhado, que o <Routes> de cada uma resolveria sempre pra rota
  // nova).
  //
  // A cada navegação, a entrada anterior é REMOVIDA da lista (current.filter,
  // não current.slice(-1) por posição) no mesmo momento em que a nova é
  // adicionada. Isso é seguro com usePresence: ao sumir da lista de children
  // do AnimatePresence, o Motion mantém aquela Screen montada por conta
  // própria até ela chamar safeToRemove() (ver Screen) — mesmo que outras
  // navegações aconteçam enquanto isso, PORQUE cada Screen controla seu
  // próprio ciclo de saída via `isPresent`, não uma contagem/posição global.
  // Isso corrige um bug anterior: cortar por POSIÇÃO (current.slice(-1)),
  // tanto ao adicionar quanto num onExitComplete global do AnimatePresence,
  // assumia "no máximo 2 entradas por vez" — 2+ navegações mais rápidas que
  // a duração da transição (perfeitamente possível no uso real) descartavam
  // uma tela no MEIO do próprio exit sem o Motion nunca reportar aquilo como
  // concluído; daí em diante a limpeza parava de funcionar de forma
  // confiável e telas antigas ficavam montadas (sobrepostas, "ghosting")
  // PERMANENTEMENTE, não só durante a transição.
  const [screens, setScreens] = useState(() => [{ key: location.pathname, location, depth: currentDepth, direction: null, gen: 0 }]);

  // pathname (não currentDepth) é o que de fato identifica "já processamos
  // essa navegação" — Shell pode re-renderizar por outros motivos (isEditing,
  // isOverlayOpen mudando, ex: abrir um modal) sem o pathname ter mudado.
  //
  // O depth anterior vem de lastEntry.depth (lido do state `screens`), não de
  // uma ref mutada direto no corpo da função — uma ref mutada aqui é um
  // efeito colateral impuro durante o render, que o React.StrictMode (ativo
  // em dev, ver main.jsx) executa DUAS VEZES de propósito pra detectar esse
  // tipo de bug: a mutação da ref "vazava" da primeira execução fantasma pra
  // segunda, fazendo currentDepth===prevDepth parecer verdadeiro mesmo numa
  // navegação real, e `direction` sair sempre `null` (sem slide nenhum).
  const lastEntry = screens[screens.length - 1];
  if (location.pathname !== lastEntry.location.pathname) {
    const prevDepth = lastEntry.depth;
    let direction = currentDepth === prevDepth ? null : currentDepth > prevDepth ? 'push' : 'pop';
    // Pop causado pelo gesto de edge-swipe do iOS (ver edgeSwipeRef acima):
    // o WebKit já tocou a transição visual sozinho durante o arrasto, então
    // tratamos como `null` (mesmo branch usado pra troca de aba) — Screen
    // usa `transition: { duration: 0 }` nesse caso, sem Framer Motion por
    // cima. Zerar a flag aqui (não só no timeout de touchend) é seguro sob
    // React.StrictMode: ao contrário de um contador que acumularia, zerar
    // uma flag booleana duas vezes dá o mesmo resultado que zerar uma vez.
    if (direction === 'pop' && edgeSwipeRef.current) {
      direction = null;
      edgeSwipeRef.current = false;
    }
    // A key da nova entrada usa um número de "geração" (gen) calculado
    // DENTRO do updater, como max(gen de todas as entradas em current) + 1 —
    // não um contador em ref mutada no corpo da função (um contador assim
    // incrementava duas vezes sob React.StrictMode, que invoca o corpo do
    // componente 2x de propósito, gerando keys diferentes pras duas
    // invocações da MESMA navegação e resetando a animação antes dela
    // começar), nem location.key do Router (que pareceria mais seguro por
    // vir de fora, mas o React Router REUTILIZA o mesmo location.key ao
    // voltar no histórico pra um pathname que já existia numa entrada ainda
    // viva do array `screens` — ela nunca foi removida, só ficou recuada/
    // escurecida por baixo —, colidindo com a key da entrada antiga:
    // warning do React de "two children with the same key", que confundia o
    // AnimatePresence sobre qual entrada era qual). gen cresce a cada
    // navegação real e NUNCA decresce, mesmo quando entradas somem do array
    // via handleExited — ao contrário de current.length, que oscilaria com
    // entradas saindo e poderia reaproveitar um número já usado antes.
    setScreens((current) => {
      // `lastEntry` só CONTINUA na lista de children do AnimatePresence
      // (nunca removida, só muda de variant pra 'receded') quando esta
      // navegação é um PUSH — ela vira a tela de BAIXO da nova entrada
      // entrando por cima. Em qualquer outro caso (POP, fechando a tela de
      // cima; ou null, trocando de aba entre duas telas raiz de mesma
      // depth) ela é REMOVIDA — é isso que faz isPresent virar false pra
      // ela e disparar sua animação de saída (ver usePresence/
      // onAnimationComplete em Screen). Bug real que isso corrige: antes só
      // tratava `direction === 'pop'` como caso de remoção — trocar de aba
      // pela tab bar (Atrações → Lugares, ambas depth 0, direction: null)
      // nunca removia a entrada anterior, acumulando uma entrada NOVA a
      // cada troca de aba para sempre, todas sobrepostas e visíveis ao
      // mesmo tempo (o "ghosting" de conteúdo misturado de duas telas raiz
      // diferentes reportado pelo usuário).
      const withoutExiting = direction === 'push'
        ? current
        : current.filter((s) => s.key !== lastEntry.key);
      // Num POP, a entrada que está voltando a ser "topo" (ex: Roteiro) JÁ
      // existe em `withoutExiting` (nunca foi removida quando foi empurrada
      // pra baixo, ver acima) — reaproveita ela em vez de criar uma
      // `newEntry`, senão existiriam DUAS entradas para o mesmo pathname
      // simultaneamente (a antiga recuada + uma nova por cima dela). Troca
      // de aba (direction: null) nunca tem uma entrada preexistente pra
      // reaproveitar desse jeito — cada aba raiz vive sozinha, sem nunca
      // ficar "recuada" por baixo de outra aba raiz.
      const existingEntry = direction === 'pop'
        ? withoutExiting.find((s) => s.location.pathname === location.pathname)
        : null;
      if (existingEntry) {
        // A ordem de renderização (screens.map no JSX) é a ordem de
        // empilhamento visual no DOM (sem z-index explícito — ver Screen):
        // quem vem depois fica por cima. `existingEntry` estava numa
        // posição antiga do array (de quando foi criada, lá atrás), mas
        // agora volta a ser a entrada de MAIOR depth (ativa) — precisa ir
        // pro FINAL do array, não ficar atualizada na mesma posição via
        // .map(). Bug real que isso corrige: ao voltar (ex: Configurações
        // → Roteiro, ou detalhe de lugar → lista de Lugares), a entrada
        // reaproveitada continuava na posição antiga (geralmente a
        // primeira), renderizada ANTES das entradas recuadas que vieram
        // depois dela — essas ficavam visualmente POR CIMA da tela que
        // deveria estar ativa (fragmentos de texto/ícone "vazando" por
        // cima do conteúdo correto, navbar reaparecendo por último).
        const rest = withoutExiting
          .filter((s) => s.key !== existingEntry.key)
          .map((s) => ({ ...s, direction }));
        return [...rest, { ...existingEntry, location, depth: currentDepth, direction }];
      }
      const nextGen = Math.max(0, ...current.map((s) => s.gen ?? 0)) + 1;
      const newEntry = {
        key: `${location.pathname}-${nextGen}`,
        location,
        depth: currentDepth,
        direction,
        gen: nextGen,
      };
      return [
        ...withoutExiting.map((s) => ({ ...s, direction })),
        newEntry,
      ];
    });
  } else if (location !== lastEntry.location) {
    // Mesmo pathname, mas o objeto `location` mudou (ex: location.state
    // mudou — abrir/fechar um mapa embutido numa tela, que empurra uma
    // entrada de histórico com o MESMO pathname só pra "voltar" funcionar
    // sozinho, ver ScheduleScreen/PlacesScreen/AttractionsScreen). Sem
    // atualizar `location` aqui, a tela usa <Routes location={screen.location}>
    // (ver ScreenRoutes) com o location CONGELADO do momento em que essa
    // entrada nasceu — React Router sobrescreve o contexto de useLocation()
    // pra toda a subárvore com esse valor fixo, então o componente nunca
    // "vê" o novo state (useLocation() sempre devolve o antigo), mesmo o
    // navigate() real do browser já tendo acontecido (history.length muda
    // normalmente). Isso fazia abrir o mapa funcionar (setMapOpen local) mas
    // fechar (que dependia de ler o novo state) não refletir no primeiro
    // clique. Atualiza só a entrada ativa, sem gen/direction novos — não é
    // uma navegação push/pop, não deve disparar nenhuma animação.
    setScreens((current) => current.map((s) => (s.key === lastEntry.key ? { ...s, location } : s)));
  }

  // Chamado por uma Screen específica (pela sua própria key) quando ela
  // termina de verdade sua animação de saída — nunca removemos por posição.
  const handleExited = (key) => {
    setScreens((current) => current.filter((s) => s.key !== key));
  };

  // Enquanto uma tela raiz está em modo de edição, ela mesma renderiza sua
  // própria EditActionBar (Cancelar/Salvar) no lugar da tab bar — ver
  // useEditingState.js.
  const isEditing = useIsEditingAnywhere();
  const isOverlayOpen = useIsFullscreenOverlayOpen();
  // Pré-carrega as áreas de lugar cedo (nível raiz), pra subcategoriesFor()
  // já estar com o cache quente quando PlacesScreen/PlaceDetailScreen
  // renderizarem, igual ao padrão de outros dados globais do app.
  useAreasData();

  return (
    <>
      <AnimatePresence initial={false}>
        {/* key precisa estar aqui — no filho DIRETO do AnimatePresence, não
            um nível mais fundo dentro do motion.div retornado por Screen.
            AnimatePresence só rastreia entrada/saída comparando as keys dos
            seus filhos imediatos; como Screen é sempre o mesmo componente
            React (só re-renderiza com props novas), uma key só no motion.div
            interno nunca era vista mudar — a transição de saída (exit)
            nunca disparava de fato, por mais que a lógica de variants
            parecesse correta na leitura do código. */}
        {screens.map((screen) => (
          <Screen
            key={screen.key}
            depth={screen.depth}
            // "Topo da pilha" = tem a MAIOR profundidade entre as entradas
            // ativas agora — relativo às outras, não um valor fixo (ex: 1).
            // Precisa ser relativo porque /configuracoes (depth 2) empurrada
            // por cima de /mais (depth 1) e /configuracoes/areas (depth 3)
            // empurrada por cima de /configuracoes (depth 2) são AMBAS "a
            // tela de detalhe entrando por cima" em suas respectivas
            // transições, apesar de terem depths absolutos diferentes.
            isTopOfStack={screen.depth === Math.max(...screens.map((s) => s.depth))}
            direction={screen.direction}
            location={screen.location}
            onExited={() => handleExited(screen.key)}
          />
        ))}
      </AnimatePresence>
      <AnimatePresence>
        {currentDepth === 0 && !isEditing && !isOverlayOpen && location.pathname !== '/design-system' && (
          <UpdateBanner key="update-banner" />
        )}
      </AnimatePresence>
      <AnimatePresence>
        {currentDepth === 0 && !isEditing && !isOverlayOpen && location.pathname !== '/design-system' && (
          <BottomTabBar key="bottom-tab-bar" />
        )}
      </AnimatePresence>
    </>
  );
}

export default function App() {
  const [showWelcome, setShowWelcome] = useState(() => !wasWelcomeScreenSeen());
  const [showAddToHomeScreen, setShowAddToHomeScreen] = useState(
    () => isIOS() && !isStandalone() && !wasAddToHomeScreenDismissed()
  );

  return (
    <div
      style={{
        // position:fixed + inset:0 (em vez de relative + height:100dvh)
        // trava o container na viewport visual real de forma absoluta —
        // 100dvh ainda pode descasar momentaneamente do espaço físico
        // disponível durante o recálculo dinâmico da barra de endereço do
        // Safari no meio de um gesto de scroll, o que deixava a borda do
        // app "escorregar" e revelar o fundo do body por trás durante o
        // bounce elástico.
        position: 'fixed',
        inset: 0,
        maxWidth: 480,
        margin: '0 auto',
        overflow: 'hidden',
      }}
    >
      <HashRouter>
        <Shell />
      </HashRouter>
      <ToastHost />
      <AnimatePresence>
        {!showWelcome && showAddToHomeScreen && (
          <AddToHomeScreenPrompt key="add-to-home" onClose={() => setShowAddToHomeScreen(false)} />
        )}
      </AnimatePresence>
      <AnimatePresence>
        {showWelcome && (
          <WelcomeScreen
            key="welcome"
            onClose={() => {
              setShowWelcome(false);
              // Só pergunta se já estiver instalado como PWA — pedida como
              // aba comum do navegador, a permissão nativa tende a ser
              // negada e, uma vez negada, não dá pra perguntar de novo (o
              // usuário precisaria reativar manualmente nas configurações).
              // 'granted' sem 'default' também entra aqui (não só a primeira
              // vez): cobre o caso de permissão concedida por fora, mas sem
              // subscription salva ainda (ex: reinstalou o PWA) — ver
              // requestPushPermission, que já lida com subscription existente.
              if (isStandalone() && isPushSupported() && getNotificationPermission() !== 'denied') {
                requestPushPermission().catch(() => {});
              }
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
