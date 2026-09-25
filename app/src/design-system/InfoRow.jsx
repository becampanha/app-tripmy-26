import { color, space } from './tokens.js';

// Linha de "ficha técnica": label à esquerda, valor à direita, divisor sutil.
export default function InfoRow({ label, value, borderColor = color.border, borderSide = 'bottom' }) {
  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        padding: `${space.lg + 2}px 0`,
        [borderSide === 'top' ? 'borderTop' : 'borderBottom']: `1px solid ${borderColor}`,
      }}
    >
      <span style={{ fontSize: 13.5, fontWeight: 600, color: color.muted }}>{label}</span>
      <span style={{ fontSize: 13.5, fontWeight: 700, color: color.dark }}>{value}</span>
    </div>
  );
}
