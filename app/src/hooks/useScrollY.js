import { useEffect, useRef, useState } from 'react';

// Acompanha o scroll da tela atual. Cada tela é seu próprio container com
// overflowY:auto (ver App.jsx) — não o window — por isso sobe até o
// ancestral marcado com data-scroll-root. Mesmo padrão já usado no
// PlaceDetailScreen para o parallax/nav bar sobre a foto.
// Aceita um ref externo (opcional) para telas que já têm um ref próprio no
// container raiz e precisam de um único nó DOM compartilhado.
export function useScrollY(externalRef) {
  const [scrollY, setScrollY] = useState(0);
  const ownRef = useRef(null);
  const anchorRef = externalRef || ownRef;

  useEffect(() => {
    const scrollRoot = anchorRef.current?.closest('[data-scroll-root]');
    if (!scrollRoot) return;
    const onScroll = () => setScrollY(scrollRoot.scrollTop);
    scrollRoot.addEventListener('scroll', onScroll, { passive: true });
    return () => scrollRoot.removeEventListener('scroll', onScroll);
  }, []);

  return { scrollY, anchorRef };
}
