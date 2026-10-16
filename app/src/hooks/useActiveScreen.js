import { createContext, useContext, useEffect, useRef, useState } from 'react';

// true quando esta Screen (ver App.jsx) é a de MAIOR profundidade agora — a
// que o usuário está vendo/interagindo, não uma recuada atrás de outra.
// Cada tela com entrada em stagger usa isso pra saber quando precisa
// re-disparar a cascata: como uma tela empilhada não desmonta mais ao ser
// coberta (fica recuada, scale 0.96 — ver App.jsx), o container de stagger
// precisa de um sinal explícito pra reanimar ao voltar a ficar ativa, em
// vez de depender só da montagem inicial do componente.
const ActiveScreenContext = createContext(true);

export const ActiveScreenProvider = ActiveScreenContext.Provider;

export function useIsActiveScreen() {
  return useContext(ActiveScreenContext);
}

// Incrementa um contador toda vez que a tela passa de inativa (recuada,
// coberta por outra) para ativa de novo — usar esse valor como parte da
// `key` do container de STAGGER_CONTAINER/WIPE_STAGGER_CONTAINER força o
// Motion a desmontar e remontar aquele elemento, reiniciando "hidden" e
// disparando a cascata de entrada de novo. Sem isso, como a tela nunca
// desmonta de fato ao ser coberta (só recua, ver App.jsx), initial="hidden"
// só valeria na primeiríssima montagem — voltar de uma tela empilhada
// (ex: Configurações → Mais) não reanimaria o conteúdo.
export function useStaggerKey() {
  const isActive = useIsActiveScreen();
  const [gen, setGen] = useState(0);
  const wasActive = useRef(isActive);

  useEffect(() => {
    if (isActive && !wasActive.current) setGen((g) => g + 1);
    wasActive.current = isActive;
  }, [isActive]);

  return gen;
}
