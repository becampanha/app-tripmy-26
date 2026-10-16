import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { FilterIcon } from '@solar-icons/react/bold/filter';
import { CheckIcon } from '@solar-icons/react/linear/check';
import Checkbox from './Checkbox.jsx';
import { color, radius, type } from './tokens.js';

// Mesmo efeito de abertura usado no Select.jsx — popover nasce a partir
// do canto do botão que o abriu (scale + fade), em vez de aparecer instantâneo.
const POPOVER_TRANSITION = { type: 'spring', stiffness: 500, damping: 32 };

// Botão-ícone de filtro que abre um popover com conteúdo livre — mesma
// mecânica de posicionamento/outside-click/z-index do Select.jsx, mas sem
// fechar ao marcar cada opção (uso: vários toggles/checkboxes juntos num só
// popover, ex: "está no roteiro" + "favoritos" + lista de área de Lugares).
export default function FilterMenu({
  active = false, // deixa o botão preto quando algum filtro está aplicado
  checksLabel, // título da seção de checks (ex: "Filtros") — omitido se não houver checks
  checks = [], // [{ label, icon, checked, onChange }] — vira uma linha com ícone + Checkbox
  areaLabel, // título da seção de área (ex: "Filtrar por área") — omitido se areaOptions vazio
  areaOptions = [], // [{ value, label }] ou string[]
  areaValue,
  onAreaChange,
  buttonStyle,
  align = 'right',
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

  const normalizedArea = areaOptions.map((opt) =>
    typeof opt === 'string' ? { value: opt, label: opt } : opt
  );

  return (
    <div ref={wrapperRef} style={{ position: 'relative', display: 'inline-block' }}>
      <div
        onClick={() => setOpen((o) => !o)}
        style={{
          position: 'relative',
          flex: 'none',
          width: 38,
          height: 38,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: radius.input,
          border: `1px solid ${active ? color.dark : color.border}`,
          background: active ? color.dark : color.bg,
          cursor: 'pointer',
          boxSizing: 'border-box',
          ...buttonStyle,
        }}
      >
        <FilterIcon size={17} color={active ? color.white : color.faintIcon} />
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
            transformOrigin: align === 'right' ? 'top right' : 'top left',
            ...(align === 'right' ? { right: 0 } : { left: 0 }),
            minWidth: 240,
            maxWidth: 300,
            maxHeight: 420,
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
          {checksLabel && checks.length > 0 && (
            <div style={{ padding: '6px 10px 4px', color: color.muted, ...type.eyebrow }}>
              {checksLabel}
            </div>
          )}

          {checks.map(({ label, icon: Icon, checked, onChange }) => (
            <div
              key={label}
              onClick={() => onChange(!checked)}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 10,
                padding: '8px 10px',
                borderRadius: 9,
                cursor: 'pointer',
                color: color.dark,
                ...type.input,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                {Icon && <Icon size={16} color={color.faintIcon} style={{ flex: 'none' }} />}
                {label}
              </div>
              <Checkbox checked={checked} onChange={onChange} size={20} activeColor={color.dark} />
            </div>
          ))}

          {normalizedArea.length > 0 && (
            <>
              <div
                style={{
                  margin: '4px 6px',
                  borderTop: `1px solid ${color.borderFaint}`,
                }}
              />

              {areaLabel && (
                <div style={{ padding: '6px 10px 4px', color: color.muted, ...type.eyebrow }}>
                  {areaLabel}
                </div>
              )}

              <div
                onClick={() => onAreaChange('')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '8px 10px',
                  borderRadius: 9,
                  cursor: 'pointer',
                  color: color.dark,
                  ...type.input,
                }}
              >
                Todas as áreas
                {!areaValue && <CheckIcon size={14} color={color.dark} />}
              </div>

              {normalizedArea.map((opt) => {
                const isActive = opt.value === areaValue;
                return (
                  <div
                    key={opt.value}
                    onClick={() => onAreaChange(opt.value)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '8px 10px',
                      borderRadius: 9,
                      cursor: 'pointer',
                      background: isActive ? color.surfaceMuted : 'transparent',
                      color: color.dark,
                      ...type.input,
                    }}
                  >
                    {opt.label}
                    {isActive && <CheckIcon size={14} color={color.dark} />}
                  </div>
                );
              })}
            </>
          )}
        </motion.div>
      )}
      </AnimatePresence>
    </div>
  );
}
