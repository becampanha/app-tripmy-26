import { useEffect, useRef, useState } from 'react';

// Mede a altura real (renderizada) de um elemento e mantém atualizada se
// ela mudar — usado pelo FixedHeader pra telas saberem exatamente quanto
// padding-top reservar no conteúdo, sem precisar hardcodar um valor fixo
// (que quebraria se o título quebrasse em 2 linhas, ou a tela tivesse tabs
// e outra não).
export function useElementHeight() {
  const ref = useRef(null);
  const [height, setHeight] = useState(0);

  useEffect(() => {
    if (!ref.current) return;
    const observer = new ResizeObserver(([entry]) => {
      setHeight(entry.contentRect.height);
    });
    observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  return { ref, height };
}
