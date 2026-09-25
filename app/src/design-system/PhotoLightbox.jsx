import { useEffect, useRef, useState } from 'react';
import { CloseIcon } from '@solar-icons/react/linear/close';
import { shellMaxWidth } from './tokens.js';

// Visualizador de foto(s) em fullscreen: arrasta horizontal pra navegar
// entre várias fotos, arrasta vertical pra fechar (estilo Fotos do iOS).
// Usado a partir de qualquer card com foto (Roteiro, Lugares, Recomendações)
// via long-press (ver useLongPress) — permite os gestos nativos do
// navegador (pinch-zoom, segurar-pra-salvar) via classe .allow-native-touch,
// diferente do resto do app onde esses gestos ficam desativados.
export default function PhotoLightbox({ photos, photoIndex, onIndexChange, onClose }) {
  // O Embla foi desenhado pra um único eixo de arrasto — aqui precisamos de
  // dois gestos concorrentes (arrastar horizontal navega entre fotos,
  // arrastar vertical fecha o lightbox), então mantemos o controle manual
  // já testado em vez de lutar contra o motor de drag do Embla.
  const scrollerRef = useRef(null);
  const dragRef = useRef(null);
  const [dragY, setDragY] = useState(0);

  useEffect(() => {
    const el = scrollerRef.current;
    if (!el) return;
    el.scrollLeft = photoIndex * el.clientWidth;
  }, []);

  const handleScroll = () => {
    const el = scrollerRef.current;
    if (!el || el.clientWidth === 0) return;
    const i = Math.round(el.scrollLeft / el.clientWidth);
    if (i !== photoIndex) onIndexChange(i);
  };

  const startDrag = (x, y) => {
    dragRef.current = { startX: x, startY: y, startScroll: scrollerRef.current.scrollLeft, axis: null, moved: false };
  };
  // Mouse não gera scroll nativo por arrastar (diferente de touch, que o
  // navegador já rola sozinho via overflowX: auto) — quando o gesto é
  // identificado como horizontal E veio do mouse, movemos scrollLeft à mão.
  const moveDrag = (x, y, isMouse) => {
    const drag = dragRef.current;
    if (!drag) return;
    const dx = x - drag.startX;
    const dy = y - drag.startY;
    if (!drag.axis && (Math.abs(dx) > 8 || Math.abs(dy) > 8)) {
      drag.axis = Math.abs(dy) > Math.abs(dx) ? 'y' : 'x';
      drag.moved = true;
    }
    if (drag.axis === 'y') setDragY(Math.max(0, dy));
    else if (drag.axis === 'x' && isMouse) scrollerRef.current.scrollLeft = drag.startScroll - dx;
  };
  const endDrag = () => {
    const moved = dragRef.current?.moved;
    if (dragY > 100) {
      onClose();
    } else {
      setDragY(0);
    }
    dragRef.current = null;
    // Toque simples (sem arrastar), fora de uma foto (ver onClick da imagem,
    // que interrompe a propagação) — clicou no fundo preto, então fecha.
    if (!moved) onClose();
  };

  return (
    <div
      className="allow-native-touch"
      style={{
        position: 'fixed',
        top: 0,
        bottom: 0,
        left: '50%',
        transform: 'translateX(-50%)',
        width: '100%',
        maxWidth: shellMaxWidth,
        zIndex: 50,
        background: `rgba(0,0,0,${Math.max(0.4, 1 - dragY / 300)})`,
      }}
    >
      <div
        ref={scrollerRef}
        onScroll={handleScroll}
        onTouchStart={(e) => startDrag(e.touches[0].clientX, e.touches[0].clientY)}
        onTouchMove={(e) => moveDrag(e.touches[0].clientX, e.touches[0].clientY, false)}
        onTouchEnd={endDrag}
        onMouseDown={(e) => startDrag(e.clientX, e.clientY)}
        onMouseMove={(e) => moveDrag(e.clientX, e.clientY, true)}
        onMouseUp={endDrag}
        style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          overflowX: dragY > 0 ? 'hidden' : 'auto',
          scrollSnapType: 'x mandatory',
          transform: `translateY(${dragY}px)`,
          transition: dragY === 0 ? 'transform 0.2s' : 'none',
        }}
      >
        {photos.map((src, i) => (
          <div
            key={i}
            style={{
              flex: 'none',
              width: '100%',
              height: '100%',
              scrollSnapAlign: 'start',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <img src={src} alt="" draggable={false} style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
          </div>
        ))}
      </div>

      <div
        onClick={onClose}
        style={{
          position: 'absolute',
          top: 18,
          right: 18,
          width: 38,
          height: 38,
          borderRadius: 19,
          background: 'rgba(255,255,255,0.22)',
          backdropFilter: 'blur(10px)',
          WebkitBackdropFilter: 'blur(10px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
        }}
      >
        <CloseIcon size={18} color="#fff" />
      </div>

      {photos.length > 1 && (
        <div
          style={{
            position: 'absolute',
            bottom: 24,
            left: 0,
            right: 0,
            display: 'flex',
            justifyContent: 'center',
            gap: 5,
          }}
        >
          {photos.map((_, i) => (
            <div
              key={i}
              style={{
                width: i === photoIndex ? 16 : 6,
                height: 6,
                borderRadius: 3,
                background: i === photoIndex ? '#fff' : 'rgba(255,255,255,0.45)',
                transition: 'width 0.25s ease, background 0.25s ease',
              }}
            />
          ))}
        </div>
      )}

      {photos.length > 1 && (
        <div
          style={{
            position: 'absolute',
            bottom: 24,
            right: 18,
            padding: '4px 10px',
            borderRadius: 8,
            background: 'rgba(255,255,255,0.22)',
            backdropFilter: 'blur(10px)',
            WebkitBackdropFilter: 'blur(10px)',
            color: '#fff',
            fontSize: 12,
            fontWeight: 700,
          }}
        >
          {photoIndex + 1}/{photos.length}
        </div>
      )}
    </div>
  );
}
