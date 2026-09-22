import { useRef } from 'react';

// Permite arrastar com o mouse para rolar um container horizontal (comportamento
// de touch/trackpad replicado para clique-e-arraste com mouse). Retorna os
// handlers de mouse para o elemento scrollável e um scrollerRef para anexar nele.
// `moved` no dragRef indica se houve arraste real, útil para suprimir cliques
// acidentais em itens dentro do scroller após um drag.
export function useDragScroll() {
  const scrollerRef = useRef(null);
  const dragRef = useRef(null);

  const onMouseDown = (e) => {
    dragRef.current = { startX: e.clientX, startScroll: scrollerRef.current.scrollLeft, moved: false };
  };
  const onMouseMove = (e) => {
    const drag = dragRef.current;
    if (!drag) return;
    const dx = e.clientX - drag.startX;
    if (Math.abs(dx) > 3) drag.moved = true;
    scrollerRef.current.scrollLeft = drag.startScroll - dx;
  };
  const onMouseUp = () => {
    dragRef.current = null;
  };

  return {
    scrollerRef,
    dragRef,
    dragHandlers: { onMouseDown, onMouseMove, onMouseUp, onMouseLeave: onMouseUp },
  };
}
