// No PWA instalado no iOS (standalone), depois de um gesto de navegação por
// swipe (ex: voltar de um detalhe), o reconhecedor de gesto do WebKit às
// vezes consome o primeiro toque seguinte sem sintetizar o evento `click` —
// confirmado por instrumentação real no device (touchstart/touchend/
// pointerup disparam normalmente, mas `click` não vem, só no 2º toque). Na
// web normal e no desktop isso nunca acontece. Esse hook contorna o
// problema reagindo a `pointerup` diretamente (que sempre disparou nos
// testes), em vez de depender do `click` sintético do navegador.
//
// Continua aceitando teclado/leitor de tela normalmente: `onKeyDown`
// cobre Enter/Espaço, e o próprio `onClick` nativo do elemento (disparado
// por esses casos, não por touch) também aciona a ação — uma ref de
// "último disparo" evita acionar duas vezes quando pointerup E click
// chegam para o mesmo toque físico (caso comum fora do iOS/PWA).
//
// Distingue tap de arrasto/scroll medindo o deslocamento entre pointerdown
// e pointerup: acima de TAP_MOVE_THRESHOLD px, trata como scroll e ignora.
import { useRef } from 'react';

const TAP_MOVE_THRESHOLD = 10;
const DEDUPE_WINDOW_MS = 500;

export function useTapHandler(onTap) {
  const startRef = useRef(null);
  const lastFiredAtRef = useRef(0);
  // true = o pointerup mais recente foi um arrasto (não um tap) — o `click`
  // sintético que o navegador dispara em seguida (mouse: mouseup na mesma
  // posição do elemento, mesmo após mover bastante, ainda gera `click`)
  // precisa ser suprimido também, não só o pointerup.
  const wasDragRef = useRef(false);

  // Recebe o evento original e repassa pra onTap — consumidores que leem
  // coordenadas do clique (ex: RecommendationCardStack decidindo esquerda/
  // direita via e.clientX) dependem disso; sem repassar, onTap(e) chegava
  // com `e` undefined e quebrava com TypeError em qualquer toque/clique
  // real (bug encontrado em produção: navegação do carrossel de Dicas
  // parou de funcionar por completo depois da migração pra useTapHandler).
  const fire = (e) => {
    const now = Date.now();
    if (now - lastFiredAtRef.current < DEDUPE_WINDOW_MS) return;
    lastFiredAtRef.current = now;
    onTap(e);
  };

  if (!onTap) return {};

  return {
    onPointerDown: (e) => {
      startRef.current = { x: e.clientX, y: e.clientY };
    },
    onPointerUp: (e) => {
      const start = startRef.current;
      startRef.current = null;
      if (!start) {
        wasDragRef.current = false;
        return;
      }
      const dx = e.clientX - start.x;
      const dy = e.clientY - start.y;
      wasDragRef.current = Math.hypot(dx, dy) > TAP_MOVE_THRESHOLD;
      if (wasDragRef.current) return;
      fire(e);
    },
    onPointerCancel: () => {
      startRef.current = null;
      wasDragRef.current = false;
    },
    onClick: (e) => {
      if (wasDragRef.current) {
        wasDragRef.current = false;
        return;
      }
      fire(e);
    },
    onKeyDown: (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        fire(e);
      }
    },
  };
}
