import { useEffect, useRef, useState } from 'react';

const OPEN_THRESHOLD = 50; // px de arrasto além do topo pra "soltar e abrir" de vez
const CLOSE_SCROLL_THRESHOLD = 24; // px rolados pra baixo (lista normal) pra fechar de volta

// Combina dois gestos do iOS num só campo de busca:
// 1) Abrir: igual ao pull-to-refresh (ver usePullToRefresh.js) — o bounce
//    elástico nativo do container no topo gera scrollTop negativo enquanto
//    o dedo arrasta; o campo acompanha essa distância em tempo real
//    (progress 0→1) e, ao soltar depois de passar o threshold, "assenta"
//    aberto (open=true) em vez de recolher.
// 2) Fechar: uma vez aberto, o campo fica visível e usável normalmente até o
//    usuário rolar a lista pra baixo (scroll comum, não overscroll) o
//    suficiente — aí fecha.
export function usePullDownSearch(anchorRef) {
  const [pullProgress, setPullProgress] = useState(0);
  const [open, setOpen] = useState(false);
  const openRef = useRef(false);
  const lastScrollTopRef = useRef(0);
  // O bounce elástico do iOS volta scrollTop a 0 sozinho ANTES do touchend
  // disparar (mesma observação documentada em usePullToRefresh.js) — por
  // isso a distância máxima atingida precisa ficar guardada numa ref, não
  // ser relida de scrollRoot.scrollTop no momento do touchend (que já
  // pode ter voltado a 0 e nunca atingiria o threshold).
  const maxPullRef = useRef(0);

  useEffect(() => {
    const scrollRoot = anchorRef.current?.closest('[data-scroll-root]');
    if (!scrollRoot) return;

    const onScroll = () => {
      const current = scrollRoot.scrollTop;

      if (current < 0) {
        // Overscroll no topo — acompanha o arrasto em tempo real.
        const distance = -current;
        maxPullRef.current = Math.max(maxPullRef.current, distance);
        setPullProgress(Math.min(1, distance / OPEN_THRESHOLD));
        return;
      }

      if (openRef.current) {
        // Já aberto: fecha só com scroll normal pra baixo além do threshold.
        const delta = current - lastScrollTopRef.current;
        if (delta > CLOSE_SCROLL_THRESHOLD) {
          openRef.current = false;
          setOpen(false);
        }
      }
      lastScrollTopRef.current = current;
    };

    const onTouchEnd = () => {
      if (maxPullRef.current >= OPEN_THRESHOLD) {
        openRef.current = true;
        setOpen(true);
      }
      maxPullRef.current = 0;
      setPullProgress(0);
    };

    scrollRoot.addEventListener('scroll', onScroll, { passive: true });
    scrollRoot.addEventListener('touchend', onTouchEnd);
    scrollRoot.addEventListener('touchcancel', onTouchEnd);

    return () => {
      scrollRoot.removeEventListener('scroll', onScroll);
      scrollRoot.removeEventListener('touchend', onTouchEnd);
      scrollRoot.removeEventListener('touchcancel', onTouchEnd);
    };
  }, []);

  // Visível tanto durante o arrasto (acompanhando o dedo) quanto depois de
  // assentar aberto — progress chega a 1 e trava lá enquanto open for true.
  const progress = open ? 1 : pullProgress;
  return { progress, open };
}
