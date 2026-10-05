import { useEffect, useState } from 'react';

// Ponte entre o registerSW (chamado fora da árvore React, em main.jsx) e
// qualquer componente que precise saber "tem atualização esperando" — um
// EventTarget simples funciona como um pub/sub mínimo sem precisar de
// Context (registerSW roda antes do primeiro render, não dentro de um
// provider).
const bus = new EventTarget();
let needRefresh = false;
let applyUpdateFn = null;

export function notifyUpdateAvailable(applyUpdate) {
  needRefresh = true;
  applyUpdateFn = applyUpdate;
  bus.dispatchEvent(new Event('change'));
}

export function useSwUpdate() {
  const [value, setValue] = useState(needRefresh);

  useEffect(() => {
    const onChange = () => setValue(needRefresh);
    bus.addEventListener('change', onChange);
    return () => bus.removeEventListener('change', onChange);
  }, []);

  return {
    needRefresh: value,
    applyUpdate: () => applyUpdateFn?.(),
  };
}
