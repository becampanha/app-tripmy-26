import { MagnifierIcon } from '@solar-icons/react/linear/magnifier';
import { CloseCircleIcon } from '@solar-icons/react/linear/close-circle';
import { color, radius, spacing, type } from './tokens.js';

// Campo de busca com lupa e botão de limpar — usado em Atrações, Lugares e
// no modal de seleção de lugar.
export default function SearchInput({ value, onChange, placeholder = 'Buscar', style }) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: spacing.gapMd,
        padding: '9px 14px',
        borderRadius: radius.input,
        border: `1px solid ${color.border}`,
        background: color.bg,
        marginBottom: spacing.controlGap,
        ...style,
      }}
    >
      <MagnifierIcon size={14} color={color.faintIcon} style={{ flex: 'none' }} />
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        style={{
          flex: 1,
          minWidth: 0,
          border: 'none',
          outline: 'none',
          background: 'transparent',
          color: color.dark,
          ...type.input,
        }}
      />
      {value && (
        <div onClick={() => onChange('')} style={{ flex: 'none', cursor: 'pointer', display: 'flex' }}>
          <CloseCircleIcon size={14} color={color.faintIcon} />
        </div>
      )}
    </div>
  );
}
