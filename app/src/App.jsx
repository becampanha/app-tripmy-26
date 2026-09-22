import { useRef } from 'react';
import { HashRouter, Routes, Route, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'motion/react';
import ScheduleScreen from './components/ScheduleScreen.jsx';
import PlacesScreen from './components/PlacesScreen.jsx';
import PlaceDetailScreen from './components/PlaceDetailScreen.jsx';
import BottomTabBar from './components/BottomTabBar.jsx';

// Hierarquia simples de navegação: Roteiro e Lugares são telas "raiz" das
// abas (sem transição de push/pop entre si); a tela de detalhe de um lugar
// é "empilhada" sobre Lugares — entra deslizando da direita (push) e sai
// deslizando para a direita (pop), como uma navigation stack do iOS.
function depthOf(pathname) {
  return pathname.startsWith('/lugares/') ? 1 : 0;
}

function Shell() {
  const location = useLocation();
  const prevDepthRef = useRef(depthOf(location.pathname));
  const currentDepth = depthOf(location.pathname);
  const prevDepth = prevDepthRef.current;
  const isPush = currentDepth > prevDepth;
  const isSameLevel = currentDepth === prevDepth;
  prevDepthRef.current = currentDepth;

  const variants = isSameLevel
    ? { initial: { x: 0, opacity: 1 }, exit: { x: 0, opacity: 1 } }
    : {
        initial: { x: isPush ? '100%' : '-30%', opacity: isPush ? 1 : 0.6 },
        exit: { x: isPush ? '-30%' : '100%', opacity: isPush ? 0.6 : 1 },
      };

  return (
    <>
      <AnimatePresence initial={false}>
        <motion.div
          key={location.pathname}
          initial={variants.initial}
          animate={{ x: 0, opacity: 1 }}
          exit={variants.exit}
          transition={isSameLevel ? { duration: 0 } : { type: 'tween', ease: [0.32, 0.72, 0, 1], duration: 0.32 }}
          style={{ position: 'absolute', inset: 0, overflowY: 'auto', WebkitOverflowScrolling: 'touch' }}
        >
          <Routes location={location}>
            <Route path="/" element={<ScheduleScreen />} />
            <Route path="/lugares" element={<PlacesScreen />} />
            <Route path="/lugares/:id" element={<PlaceDetailScreen />} />
          </Routes>
        </motion.div>
      </AnimatePresence>
      <BottomTabBar />
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
