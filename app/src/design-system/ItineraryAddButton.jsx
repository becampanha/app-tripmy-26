import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { AddIcon } from '@solar-icons/react/linear/add';
import { useTapHandler } from '../hooks/useTapHandler.js';
import { color, radius, type } from './tokens.js';

// Mesma mecânica de Select.jsx/FilterMenu.jsx (popover nasce a partir do
// canto do botão, scale+fade, spring com leve overshoot) — ver CLAUDE.md
// seção 23. Botão sempre preto (não tem variante "inativo" como o
// FilterMenu, já que aqui é sempre uma ação de criar, não um filtro
// aplicado/desaplicado).
const POPOVER_TRANSITION = { type: 'spring', stiffness: 500, damping: 32 };

// Substitui o antigo par de círculos tracejados do divisor entre atividades
// do Roteiro — um único botão quadrado preto que abre um menu pra escolher
// o que criar (Atividade ou Roteiro), no lugar de dois alvos de toque
// sempre visíveis.
export default function ItineraryAddButton({ onAddActivity, onAddItineraryCard }) {
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef(null);

  useEffect(() => {
    if (!open) return;
    const onClickOutside = (e) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, [open]);

  const toggleTapHandlers = useTapHandler(() => setOpen((o) => !o));
  const activityTapHandlers = useTapHandler(() => {
    setOpen(false);
    onAddActivity();
  });
  const itineraryTapHandlers = useTapHandler(() => {
    setOpen(false);
    onAddItineraryCard();
  });

  return (
    <div ref={wrapperRef} style={{ position: 'relative', display: 'flex', justifyContent: 'center', margin: '4px 0' }}>
      <div
        {...toggleTapHandlers}
        role="button"
        tabIndex={0}
        style={{
          width: 32,
          height: 32,
          borderRadius: radius.input,
          background: color.dark,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
        }}
      >
        <AddIcon size={16} color={color.white} />
      </div>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, scale: 0.92 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.92 }}
            transition={POPOVER_TRANSITION}
            style={{
              position: 'absolute',
              top: 'calc(100% + 6px)',
              left: '50%',
              x: '-50%',
              transformOrigin: 'top center',
              minWidth: 180,
              background: color.bg,
              borderRadius: radius.button,
              border: `1px solid ${color.border}`,
              boxShadow: '0 12px 28px rgba(28,26,23,0.16)',
              padding: 6,
              zIndex: 30,
              boxSizing: 'border-box',
            }}
          >
            <div
              {...activityTapHandlers}
              role="button"
              tabIndex={0}
              style={{
                padding: '8px 10px',
                borderRadius: 9,
                cursor: 'pointer',
                color: color.dark,
                ...type.input,
              }}
            >
              Atividade
            </div>
            <div
              {...itineraryTapHandlers}
              role="button"
              tabIndex={0}
              style={{
                padding: '8px 10px',
                borderRadius: 9,
                cursor: 'pointer',
                color: color.dark,
                ...type.input,
              }}
            >
              Roteiro
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
