import { useRef } from 'react';
import { HashRouter, Routes, Route, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'motion/react';
import ScheduleScreen from './components/ScheduleScreen.jsx';
import PlacesScreen from './components/PlacesScreen.jsx';
import PlaceDetailScreen from './components/PlaceDetailScreen.jsx';
import BottomTabBar from './components/BottomTabBar.jsx';

// Hierarquia simples de navegação: Roteiro e Lugares são telas "raiz" das
// abas (sem transição de push/pop entre si); a tela de detalhe de um lugar
// é "empilhada" sobre Lugares, como uma navigation stack do iOS.
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
  return pathname.startsWith('/lugares/') ? 1 : 0;
}

const TRANSITION = { type: 'tween', ease: [0.32, 0.72, 0, 1], duration: 0.32 };

const variants = {
  // Topo da pilha (a tela de detalhe): entra 100% da direita, sai 100% pela direita.
  offscreenRight: { x: '100%', opacity: 1 },
  top: { x: 0, opacity: 1 },
  // Base da pilha (a tela de baixo, ex: Lugares): recua sutilmente quando o
  // detalhe é empurrado por cima, volta ao normal quando ele é fechado.
  receded: { x: '-22%', opacity: 0.92 },
};

function Screen({ pathname, depth, direction, children }) {
  // direction: 'push' | 'pop' | null (transição no mesmo nível, sem animação)
  const isTopOfStack = depth === 1;

  let initial, animate, exit;
  if (direction === null) {
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

  return (
    <motion.div
      key={pathname}
      variants={variants}
      initial={initial}
      animate={animate}
      exit={exit}
      transition={direction === null ? { duration: 0 } : TRANSITION}
      data-scroll-root
      style={{ position: 'absolute', inset: 0, overflowY: 'auto', WebkitOverflowScrolling: 'touch' }}
    >
      {children}
    </motion.div>
  );
}

function Shell() {
  const location = useLocation();
  const prevDepthRef = useRef(depthOf(location.pathname));
  const currentDepth = depthOf(location.pathname);
  const prevDepth = prevDepthRef.current;
  const direction = currentDepth === prevDepth ? null : currentDepth > prevDepth ? 'push' : 'pop';
  prevDepthRef.current = currentDepth;

  return (
    <>
      <AnimatePresence initial={false}>
        <Screen pathname={location.pathname} depth={currentDepth} direction={direction}>
          <Routes location={location}>
            <Route path="/" element={<ScheduleScreen />} />
            <Route path="/lugares" element={<PlacesScreen />} />
            <Route path="/lugares/novo" element={<PlaceDetailScreen />} />
            <Route path="/lugares/:id" element={<PlaceDetailScreen />} />
          </Routes>
        </Screen>
      </AnimatePresence>
      {currentDepth === 0 && <BottomTabBar />}
    </>
  );
}

export default function App() {
  return (
    <div style={{ maxWidth: 480, margin: '0 auto', height: '100dvh', position: 'relative', overflow: 'hidden' }}>
      <HashRouter>
        <Shell />
      </HashRouter>
    </div>
  );
}
