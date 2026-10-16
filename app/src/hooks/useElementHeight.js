import { useCallback, useRef, useState } from 'react';

// Mede a altura real (renderizada) de um elemento e mantém atualizada se
// ela mudar — usado pelo FixedHeader pra telas saberem exatamente quanto
// padding-top reservar no conteúdo, sem precisar hardcodar um valor fixo
// (que quebraria se o título quebrasse em 2 linhas, ou a tela tivesse tabs
// e outra não).
//
// ref vem de um callback ref (não useRef) de propósito: se fosse useRef
// comum, o efeito de observar só rodaria uma vez no mount (dependência []),
// e em telas que renderizam o elemento medido condicionalmente (ex: só
// depois de um estado inicial tipo "quem é você", ver ShoppingScreen.jsx) o
// ref.current ainda seria null nesse primeiro efeito — sem o elemento
// existir ainda, o ResizeObserver nunca é criado, e a altura fica travada
// em 0 pra sempre, mesmo quando o header de verdade aparece depois. Um
// callback ref dispara de novo toda vez que o nó DOM muda (inclusive de
// null para um elemento real), então o observer é sempre criado no
// momento certo, não só na primeira vez.
//
// A medição inicial (callback ref) chama getBoundingClientRect() de forma
// síncrona, ANTES do navegador pintar a tela — diferente do ResizeObserver,
// que só entrega sua primeira medição de forma assíncrona (depois do
// primeiro paint). Sem isso, toda vez que uma tela com header monta (abrir a
// tela pela primeira vez, ou voltar a ela por navegação), `height` nasce em
// `0` por um frame, o conteúdo recebe um padding-top menor que o real, e
// aparece por trás do header (que é `position: fixed`) até o ResizeObserver
// corrigir — gera o "flash" de conteúdo embaixo da nav bar, mais perceptível
// em headers mais altos (com tabs). O ResizeObserver continua sendo a fonte
// de atualizações depois do mount (ex: título quebrando em 2 linhas).
export function useElementHeight() {
  const [height, setHeight] = useState(0);
  const observerRef = useRef(null);

  const ref = useCallback((node) => {
    observerRef.current?.disconnect();
    if (!node) return;
    setHeight(node.getBoundingClientRect().height);
    const observer = new ResizeObserver(([entry]) => {
      setHeight(entry.contentRect.height);
    });
    observer.observe(node);
    observerRef.current = observer;
  }, []);

  return { ref, height };
}
