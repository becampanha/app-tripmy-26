import { useEffect, useRef, useState } from 'react';

const DIRECTION_THRESHOLD = 6; // px de scroll antes de considerar uma troca de direção real (evita flicker em micro-ajustes)

// Padrão Safari/X: um elemento fixo logo abaixo do header some ao rolar a
// lista pra baixo (ganha espaço pro conteúdo) e reaparece assim que o
// usuário rola de volta pra cima, mesmo que só um pouco — permanece visível
// e totalmente interativo até a próxima rolada pra baixo. Diferente de um
// "revelar só durante o gesto" (inútil pra campos de texto, que precisam
// ficar visíveis tempo suficiente pra tocar e digitar).
export function useScrollDirectionReveal(anchorRef) {
  const [visible, setVisible] = useState(true);
  const lastScrollTopRef = useRef(0);

  useEffect(() => {
    const scrollRoot = anchorRef.current?.closest('[data-scroll-root]');
    if (!scrollRoot) return;

    const onScroll = () => {
      const current = scrollRoot.scrollTop;
      const last = lastScrollTopRef.current;
      const delta = current - last;

      if (current <= 0) {
        setVisible(true);
      } else if (delta > DIRECTION_THRESHOLD) {
        setVisible(false);
        lastScrollTopRef.current = current;
      } else if (delta < -DIRECTION_THRESHOLD) {
        setVisible(true);
        lastScrollTopRef.current = current;
      }
    };

    scrollRoot.addEventListener('scroll', onScroll, { passive: true });
    return () => scrollRoot.removeEventListener('scroll', onScroll);
  }, []);

  return visible;
}
