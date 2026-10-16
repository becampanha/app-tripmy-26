import { useEffect, useRef, useState } from 'react';

const THRESHOLD = 64; // px de arrasto pra soltar e disparar o "refresh"
const SETTLE_MS = 500; // tempo que o indicador fica girando antes de recolher

// Puro efeito visual por enquanto (sem recarregar dado nenhum) — só o "feel"
// do pull-to-refresh nativo do iOS. Reaproveita o mesmo mecanismo já usado
// pelo zoom no header do PlaceDetailScreen: não precisa de touchstart/move
// manual, o bounce elástico nativo do container com overflow (ver
// data-scroll-root em App.jsx) já entrega scrollTop negativo sozinho
// enquanto o dedo arrasta além do topo — só precisamos observar o `scroll`.
export function usePullToRefresh(anchorRef) {
  const [pullDistance, setPullDistance] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const refreshingRef = useRef(false);
  const settleTimeoutRef = useRef(null);

  useEffect(() => {
    const scrollRoot = anchorRef.current?.closest('[data-scroll-root]');
    if (!scrollRoot) return;

    const onScroll = () => {
      if (refreshingRef.current) return;
      setPullDistance(Math.max(0, -scrollRoot.scrollTop));
    };
    scrollRoot.addEventListener('scroll', onScroll, { passive: true });

    // O bounce já "mola" de volta sozinho (scrollTop some em 0) antes de
    // sabermos se o usuário passou do threshold — por isso escutamos o fim
    // do gesto de toque diretamente, não só o scroll.
    const onTouchEnd = () => {
      if (refreshingRef.current) return;
      const distance = Math.max(0, -scrollRoot.scrollTop);
      if (distance >= THRESHOLD) {
        refreshingRef.current = true;
        setRefreshing(true);
        clearTimeout(settleTimeoutRef.current);
        settleTimeoutRef.current = setTimeout(() => {
          refreshingRef.current = false;
          setRefreshing(false);
          setPullDistance(0);
        }, SETTLE_MS);
      }
    };
    scrollRoot.addEventListener('touchend', onTouchEnd);

    return () => {
      scrollRoot.removeEventListener('scroll', onScroll);
      scrollRoot.removeEventListener('touchend', onTouchEnd);
      clearTimeout(settleTimeoutRef.current);
    };
  }, []);

  const progress = Math.min(1, pullDistance / THRESHOLD);
  return { progress, refreshing, visible: pullDistance > 0 || refreshing };
}
