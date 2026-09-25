import { useRef } from 'react';

const LONG_PRESS_MS = 450;
const MOVE_CANCEL_PX = 10;

// Long-press estilo iOS (Peek & Pop / preview do iMessage): pressionar e
// segurar por LONG_PRESS_MS dispara `onLongPress` (com vibração tátil, se o
// navegador suportar — Android/Chrome sim, Safari/iOS não tem
// navigator.vibrate por limitação da Apple, mas o preview abre igual).
// Retorna os handlers pra espalhar no elemento alvo; não interfere no
// onClick normal do mesmo elemento (o consumidor decide se propaga ou não).
export function useLongPress(onLongPress) {
  const timerRef = useRef(null);
  const startRef = useRef(null);
  const firedRef = useRef(false);

  const clear = () => {
    clearTimeout(timerRef.current);
    timerRef.current = null;
  };

  const start = (x, y) => {
    firedRef.current = false;
    startRef.current = { x, y };
    clear();
    timerRef.current = setTimeout(() => {
      firedRef.current = true;
      if (navigator.vibrate) navigator.vibrate(15);
      onLongPress();
    }, LONG_PRESS_MS);
  };

  const move = (x, y) => {
    if (!startRef.current) return;
    const dx = x - startRef.current.x;
    const dy = y - startRef.current.y;
    if (Math.hypot(dx, dy) > MOVE_CANCEL_PX) clear();
  };

  return {
    // Se o long-press disparou, o handler de clique normal do elemento
    // (chamado logo em seguida pelo browser) deve ser suprimido — por isso
    // expomos `didLongPress()` pra o consumidor checar antes de agir no onClick.
    didLongPress: () => firedRef.current,
    handlers: {
      // touch-action: 'none' no elemento (ver RecommendationCard) já impede
      // o navegador de interpretar o toque como início de scroll — sem isso,
      // o browser frequentemente cancela o gesto antes dos LONG_PRESS_MS
      // passarem, tentando decidir "é toque ou é scroll?".
      onTouchStart: (e) => start(e.touches[0].clientX, e.touches[0].clientY),
      onTouchMove: (e) => move(e.touches[0].clientX, e.touches[0].clientY),
      onTouchEnd: clear,
      onTouchCancel: clear,
      onMouseDown: (e) => start(e.clientX, e.clientY),
      onMouseMove: (e) => move(e.clientX, e.clientY),
      onMouseUp: clear,
      onMouseLeave: clear,
    },
  };
}
