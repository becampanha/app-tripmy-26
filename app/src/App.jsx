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
  return (
    pathname.startsWith('/lugares/') ||
    pathname.startsWith('/atracoes/') ||
    pathname === '/roteiro/dias' ||
    pathname === '/mais' ||
    pathname === '/configuracoes' ||
    pathname === '/configuracoes/areas'
  ) ? 1 : 0;
}

// TESTE: "Mais" usa uma transição diferente do push/pop padrão — sobe de
// baixo pra cima cobrindo a tela inteira (como um modal/bottom-sheet em tela
// cheia), em vez de entrar deslizando da direita. A tela de baixo escurece
// no lugar (sem recuar/deslizar) em vez do parallax sutil usado pra telas de
// detalhe. Só se aplica à rota /mais — todo o resto do app continua com o
// push/pop padrão (ver depthOf/direction em Shell()).
function isModalRoute(pathname) {
  return pathname === '/mais';
}

const TRANSITION = { type: 'tween', ease: [0.32, 0.72, 0, 1], duration: 0.32 };
const MODAL_TRANSITION = { type: 'tween', ease: [0.22, 1, 0.36, 1], duration: 0.38 };

// Toda variante declara x/y/opacity explicitamente, mesmo quando o valor é
// "neutro" (0/1) — se uma variante de destino omite uma propriedade que a
// variante de origem definia (ex: 'top' sem 'y', chegando vindo de
// 'offscreenBottom' que tem y:'100%'), o Motion não anima essa propriedade
// de volta: ele simplesmente a deixa congelada no valor atual, por padrão só
// anima o que está explícito em AMBOS os lados da transição. Foi exatamente
// essa omissão (variantes antigas nunca precisaram de 'y', só 'x') que
// travava a tela "Mais" para sempre em y:'100%' (offscreenBottom) mesmo com
// animate="top" sendo aplicado corretamente — 'top' nunca mencionava 'y',
// então não havia nada pra animar.
const variants = {
  // Topo da pilha (a tela de detalhe): entra 100% da direita, sai 100% pela direita.
  offscreenRight: { x: '100%', y: 0, opacity: 1 },
  top: { x: 0, y: 0, opacity: 1 },
  // Base da pilha (a tela de baixo, ex: Lugares): recua sutilmente quando o
  // detalhe é empurrado por cima, volta ao normal quando ele é fechado.
  receded: { x: '-22%', y: 0, opacity: 0.92 },
  // TESTE: tela "Mais" sobe de baixo pra cima cobrindo tudo.
  offscreenBottom: { x: 0, y: '100%', opacity: 1 },
  // TESTE: tela de baixo (Roteiro) ao abrir "Mais" — escurece no lugar, sem
  // deslizar. O escurecimento em si é um overlay próprio (ver Screen), não
  // uma opacidade do conteúdo inteiro — baixar a opacity do bloco inteiro
  // deixaria texto/imagens "lavados"; um véu escuro por cima preserva o
  // contraste do conteúdo e só reduz a luminosidade percebida, como o
  // scrim atrás de um bottom-sheet no Android/iOS.
  darkened: { x: 0, y: 0, opacity: 1 },
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

function Screen({ depth, direction, location, isModalTransition, onExited }) {
  // direction: 'push' | 'pop' | null (transição no mesmo nível, sem animação)
  const isTopOfStack = depth === 1;
  const isModalScreen = isModalRoute(location.pathname);

  let initial, animate, exit;
  if (isModalTransition) {
    // TESTE: "Mais" sobe de baixo pra cima cobrindo a tela inteira; a tela
    // que ficou por baixo escurece no lugar (ver overlay em style, abaixo) —
    // nenhuma das duas desliza lateralmente nessa transição específica.
    if (isModalScreen) {
      initial = direction === 'push' ? 'offscreenBottom' : 'darkened';
      animate = direction === 'push' ? 'top' : 'offscreenBottom';
      exit = direction === 'push' ? 'darkened' : 'offscreenBottom';
    } else {
      initial = 'top';
      animate = direction === 'push' ? 'darkened' : 'top';
      exit = direction === 'push' ? 'darkened' : 'top';
    }
  } else if (direction === null) {
    initial = animate = exit = 'top';
  } else if (isTopOfStack) {
    // Esta instância É a tela de detalhe: entra da direita (sempre — só
    // existe uma forma de "estar em cima"), sai pela direita.
    initial = direction === 'push' ? 'offscreenRight' : 'top';
    animate = 'top';
    exit = direction === 'push' ? 'top' : 'offscreenRight';
  } else {
    // Esta instância é a tela de baixo (Lugares): recua quando o detalhe
    // entra por cima, volta ao normal quando ele sai.
    initial = 'top';
    animate = direction === 'push' ? 'receded' : 'top';
    exit = direction === 'push' ? 'receded' : 'top';
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

  return (
    <motion.div
      variants={variants}
      initial={initial}
      animate={currentVariant}
      transition={direction === null ? { duration: 0 } : isModalTransition ? MODAL_TRANSITION : TRANSITION}
      onAnimationComplete={() => {
        if (!isPresent) {
          safeToRemove();
          onExited();
        }
      }}
      data-scroll-root
      style={{
        position: 'absolute',
        inset: 0,
        overflowY: 'auto',
        WebkitOverflowScrolling: 'touch',
        // Este motion.div — não o html/body — é quem de fato rola cada tela
        // (o body inteiro tem overflow:hidden, ver App abaixo). overscroll-
        // -behavior:none tentava impedir o "bounce" no elemento errado antes;
        // contain evita que ele vaze pro body por trás (revelando a cor de
        // fundo do sistema) sem travar o scroll do próprio elemento.
        overscrollBehavior: 'contain',
      }}
    >
      {/* TESTE: véu escuro da tela de baixo durante a transição modal —
          só existe (e só anima) na instância que NÃO é /mais, e só enquanto
          ela está na variante 'darkened'. pointerEvents:none pra não roubar
          toque do conteúdo de verdade quando a opacidade ainda é baixa. */}
      {isModalTransition && !isModalScreen && (
        <motion.div
          initial={false}
          animate={{ opacity: currentVariant === 'darkened' ? 0.55 : 0 }}
          transition={MODAL_TRANSITION}
          style={{
            position: 'absolute',
            inset: 0,
            background: '#000',
            pointerEvents: 'none',
            zIndex: 1,
          }}
        />
      )}
      <ScreenRoutes location={location} />
    </motion.div>
  );
}

function Shell() {
  const location = useLocation();
  const currentDepth = depthOf(location.pathname);

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
  // navegação real, e `direction` sair sempre `null` (sem slide nenhum) —
  // cada tela usar essa prop incorretamente achava que não havia transição,
  // o bug ficava mascarado no push/pop padrão (null também não anima nada
  // visível ali) mas travava por completo a transição modal (que depende de
  // `direction` pra saber se deve ir pra 'top' ou ficar em 'offscreenBottom').
  const lastEntry = screens[screens.length - 1];
  if (location.pathname !== lastEntry.location.pathname) {
    const prevDepth = lastEntry.depth;
    const direction = currentDepth === prevDepth ? null : currentDepth > prevDepth ? 'push' : 'pop';
    // TESTE: transição "modal" (ver variants.offscreenBottom/darkened em
    // Screen) sempre que /mais entra ou sai — tanto a entrada nova quanto a
    // saída que ela estava cobrindo precisam saber que fazem parte dessa
    // transição especial, não do push/pop padrão.
    const isModalTransition = isModalRoute(location.pathname) || isModalRoute(lastEntry.location.pathname);
    // A entrada antiga (lastEntry) também precisa saber a `direction` desta
    // transição — ela nasceu com a dela PRÓPRIA (normalmente `null`, de
    // quando foi criada), que nunca muda sozinha depois disso. Sem atualizar
    // aqui, a tela de baixo numa transição modal recebia isModalTransition
    // correto mas direction continuava `null` (congelada do passado),
    // caindo sempre no branch `direction === 'push' ? 'darkened' : 'top'`
    // como `false` — o overlay escuro nunca aparecia, mesmo com tudo mais
    // calculado certo.
    //
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
      const nextGen = Math.max(0, ...current.map((s) => s.gen ?? 0)) + 1;
      const newEntry = {
        key: `${location.pathname}-${nextGen}`,
        location,
        depth: currentDepth,
        direction,
        isModalTransition,
        gen: nextGen,
      };
      // A entrada que estava "por cima" (lastEntry) é REMOVIDA da lista de
      // children do AnimatePresence agora (filter) — é isso que faz
      // isPresent virar false pra ela e disparar sua animação de saída (ver
      // usePresence/onAnimationComplete em Screen). As demais entradas
      // (ex: a tela que ficou enterrada/escurecida por baixo da modal)
      // continuam presentes, mas TODAS recebem a nova direction/
      // isModalTransition — sem isso, a entrada enterrada retomava o
      // controle (vira a nova "última" depois do filter) carregando ainda a
      // direction da navegação ANTERIOR (ex: 'push', de quando foi
      // escurecida), nunca recalculada pra 'pop' nesta navegação de volta —
      // ela ficava presa em 'darkened' para sempre, sem nunca chamar
      // onAnimationComplete (que só dispara quando HÁ uma transição real
      // acontecendo) nem, por tabela, nenhum onExited.
      return [
        ...current.filter((s) => s.key !== lastEntry.key).map((s) => ({ ...s, isModalTransition, direction })),
        newEntry,
      ];
    });
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
            direction={screen.direction}
            location={screen.location}
            isModalTransition={screen.isModalTransition}
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
