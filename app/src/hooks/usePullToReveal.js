import { useEffect, useRef, useState } from 'react';

const REVEAL_HEIGHT = 56; // px de arrasto necessários pra revelar por completo

// Mesmo mecanismo de usePullToRefresh.js (overscroll nativo do container
// com overflow já entrega scrollTop negativo sozinho enquanto o dedo
// arrasta além do topo) — mas sem o "settle"/estado de refreshing: aqui só
// interessa a distância do arrasto em si, pra revelar um elemento escondido
// acima do topo (campo de busca), não disparar uma ação. Ao soltar o dedo,
// sempre recolhe de volta a 0 — não existe "ficar revelado".
export function usePullToReveal(anchorRef) {
  const [pullDistance, setPullDistance] = useState(0);
  const heldRef = useRef(false);

  useEffect(() => {
    const scrollRoot = anchorRef.current?.closest('[data-scroll-root]');
    if (!scrollRoot) return;

    const onScroll = () => {
      if (!heldRef.current) return;
      setPullDistance(Math.max(0, -scrollRoot.scrollTop));
    };
    const onTouchStart = () => {
      heldRef.current = true;
    };
    const onTouchEnd = () => {
      heldRef.current = false;
      setPullDistance(0);
    };

    scrollRoot.addEventListener('scroll', onScroll, { passive: true });
    scrollRoot.addEventListener('touchstart', onTouchStart, { passive: true });
    scrollRoot.addEventListener('touchend', onTouchEnd);
    scrollRoot.addEventListener('touchcancel', onTouchEnd);

    return () => {
      scrollRoot.removeEventListener('scroll', onScroll);
      scrollRoot.removeEventListener('touchstart', onTouchStart);
      scrollRoot.removeEventListener('touchend', onTouchEnd);
      scrollRoot.removeEventListener('touchcancel', onTouchEnd);
    };
  }, []);

  return Math.min(1, pullDistance / REVEAL_HEIGHT);
}
