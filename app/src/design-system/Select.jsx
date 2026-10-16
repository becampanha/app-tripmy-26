import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { AltArrowDownIcon } from '@solar-icons/react/linear/alt-arrow-down';
import { CheckIcon } from '@solar-icons/react/linear/check';
import { color, radius, type } from './tokens.js';

// Mesmo efeito de abertura usado no FilterMenu.jsx — popover nasce a partir
// do canto do botão que o abriu (scale + fade), em vez de aparecer instantâneo.
const POPOVER_TRANSITION = { type: 'spring', stiffness: 500, damping: 32 };

// Select customizado (botão pill + popover pequeno ancorado nele), no estilo
// do resto do app — substitui o <select> nativo do navegador, cuja aparência
// não combina com o design do produto. Popover compacto, não tela cheia.
export default function Select({
  label,
  placeholder = 'Selecione',
  value,
  onChange,
  options, // [{ value, label }] ou string[] (usa o próprio valor como label)
  buttonStyle,
  align = 'right', // 'right' ancora pela borda direita do botão, 'left' pela esquerda
  fullWidth = false, // botão ocupa 100% do container pai (uso em formulários)
  icon: Icon, // gatilho vira um botão quadrado só com ícone+seta, sem o texto do valor — usado quando o espaço ao lado é apertado (ex: mesma linha da busca)
}) {
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

  const normalized = options.map((opt) =>
    typeof opt === 'string' ? { value: opt, label: opt } : opt
  );
  const selected = normalized.find((opt) => opt.value === value);

  return (
    <div ref={wrapperRef} style={{ position: 'relative', display: fullWidth ? 'block' : 'inline-block' }}>
      <div
        onClick={() => setOpen((o) => !o)}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: Icon ? 'center' : 'space-between',
          gap: Icon ? 2 : 8,
          padding: Icon ? '9px 10px' : '9px 14px',
          borderRadius: radius.input,
          border: `1px solid ${color.border}`,
          background: color.bg,
          color: value ? color.dark : color.muted,
          ...type.input,
          cursor: 'pointer',
          userSelect: 'none',
          boxSizing: 'border-box',
          width: fullWidth ? '100%' : undefined,
          ...buttonStyle,
        }}
      >
        {Icon ? (
          <Icon size={16} color={value ? color.dark : color.faintIcon} style={{ flex: 'none' }} />
        ) : (
          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {selected ? selected.label : placeholder}
          </span>
        )}
        <AltArrowDownIcon size={14} color={color.faintIcon} style={{ flex: 'none' }} />
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
            transformOrigin: fullWidth ? 'top center' : align === 'right' ? 'top right' : 'top left',
            ...(fullWidth
              ? { left: 0, right: 0 }
              : align === 'right'
                ? { right: 0 }
                : { left: 0 }),
            minWidth: fullWidth ? undefined : 190,
            maxWidth: fullWidth ? undefined : 260,
            maxHeight: 280,
            overflowY: 'auto',
            background: color.bg,
            borderRadius: radius.button,
            border: `1px solid ${color.border}`,
            boxShadow: '0 12px 28px rgba(28,26,23,0.16)',
            padding: 6,
            zIndex: 30,
            boxSizing: 'border-box',
          }}
        >
          {label && (
            <div style={{ padding: '6px 10px 4px', color: color.muted, ...type.eyebrow }}>
              {label}
            </div>
          )}

          <div
            onClick={() => {
              onChange('');
              setOpen(false);
            }}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '8px 10px',
              borderRadius: 9,
              cursor: 'pointer',
              color: color.muted,
              ...type.input,
            }}
          >
            {placeholder}
            {!value && <CheckIcon size={14} color={color.dark} />}
          </div>

          {normalized.map((opt) => {
            const active = opt.value === value;
            return (
              <div
                key={opt.value}
                onClick={() => {
                  onChange(opt.value);
                  setOpen(false);
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '8px 10px',
                  borderRadius: 9,
                  cursor: 'pointer',
                  background: active ? color.surfaceMuted : 'transparent',
                  color: color.dark,
                  ...type.input,
                }}
              >
                {opt.label}
                {active && <CheckIcon size={14} color={color.dark} />}
              </div>
            );
          })}
        </motion.div>
      )}
      </AnimatePresence>
    </div>
  );
}
