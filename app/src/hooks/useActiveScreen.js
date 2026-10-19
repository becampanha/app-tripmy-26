import { createContext, useContext, useEffect, useRef, useState } from 'react';

// value é { isActive, direction, depth } — ver Shell/Screen em App.jsx.
// isActive: true quando esta Screen é a de MAIOR profundidade agora — a que
// o usuário está vendo/interagindo, não uma recuada atrás de outra. Cada
// tela com entrada em stagger usa isso pra saber quando precisa re-disparar
// a cascata: como uma tela empilhada não desmonta mais ao ser coberta (fica
// recuada, scale 0.96 — ver App.jsx), o container de stagger precisa de um
// sinal explícito pra reanimar ao voltar a ficar ativa, em vez de depender
// só da montagem inicial do componente.
const ActiveScreenContext = createContext({ isActive: true, direction: null, depth: 0 });

export const ActiveScreenProvider = ActiveScreenContext.Provider;

export function useIsActiveScreen() {
  return useContext(ActiveScreenContext).isActive;
}

// Incrementa um contador toda vez que a tela passa de inativa (recuada,
// coberta por outra) para ativa de novo — usar esse valor como parte da
// `key` do container de STAGGER_CONTAINER/WIPE_STAGGER_CONTAINER força o
// Motion a desmontar e remontar aquele elemento, reiniciando "hidden" e
// disparando a cascata de entrada de novo. Sem isso, como a tela nunca
// desmonta de fato ao ser coberta (só recua, ver App.jsx), initial="hidden"
// só valeria na primeiríssima montagem — voltar de uma tela empilhada
// (ex: Configurações → Mais) não reanimaria o conteúdo.
//
// EXCEÇÃO: quando a tela que recebe o pop é uma raiz de tab (depth 0 —
// Roteiro, Lugares, Atrações, Dicas, Compras) voltando de um filho de
// detalhe (depth > 0, ex: /lugares/:id), NÃO reanima. Bug real reportado
// pelo usuário: abrir o detalhe de um lugar e voltar pra lista fazia todos
// os cards "piscarem" (fade+subida de novo), mesmo sem ter trocado de
// categoria e com os dados já em cache — sensação de recarregamento sem
// motivo. A tela já tem seu próprio identificador de conteúdo na key (ex:
// category/subcategory em PlacesScreen) que muda quando o conteúdo real
// muda; o `gen` sozinho disparava em QUALQUER retorno, inclusive esse. A
// condição `direction === 'pop' && depth === 0` é estrutural (calculada em
// Shell a partir de depthOf, não heurística de tempo) e não afeta o caso
// que motivou a criação deste hook: Configurações → Mais é um pop para
// depth 1 (não é raiz de tab), então continua reanimando normalmente.
export function useStaggerKey() {
  const { isActive, direction, depth } = useContext(ActiveScreenContext);
  const [gen, setGen] = useState(0);
  const wasActive = useRef(isActive);

  useEffect(() => {
    const isReturningFromOwnDetail = direction === 'pop' && depth === 0;

    // rAF em vez de incrementar na hora: `isActive` vira true no mesmo
    // commit em que o Screen pai (App.jsx) agenda `hideWhenReceded: false`
    // (visibility: hidden → visible) — sem esperar o browser pintar essa
    // mudança, o container de stagger seria desmontado/remontado (key muda)
    // ainda com `visibility: hidden` aplicado. Bug real: todo <img
    // loading="lazy"> dentro dos cards nascia "invisível" aos olhos do
    // navegador e nunca mais disparava o carregamento lazy, mesmo depois da
    // tela ficar visível de novo (ex: fotos da tela de Atrações sumindo e
    // nunca mais carregando ao voltar da tela de detalhe).
    if (isActive && !wasActive.current && !isReturningFromOwnDetail) {
      const id = requestAnimationFrame(() => setGen((g) => g + 1));
      wasActive.current = isActive;
      return () => cancelAnimationFrame(id);
    }
    wasActive.current = isActive;
  }, [isActive]);

  return gen;
}
