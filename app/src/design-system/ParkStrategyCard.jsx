import { MapIcon } from '@solar-icons/react/bold/map';
import { color, radius, spacing, type } from './tokens.js';

// Resumo de estratégia de visita do parque (ordem sugerida de atrações,
// rope drop) + atalho pro mapa interativo — fica acima da lista de
// atrações em cada aba de parque, na tela de Atrações.
export default function ParkStrategyCard({ strategy, onOpenMap }) {
  if (!strategy) return null;

  return (
    <div
      style={{
        padding: spacing.cardPadding,
        marginBottom: spacing.controlGap,
        background: color.surfaceMuted,
        borderRadius: radius.card,
      }}
    >
      <div style={{ ...type.eyebrow, color: color.faintIcon }}>Como aproveitar o dia</div>
      <div style={{ ...type.paragraph, color: color.dark, marginTop: 6 }}>{strategy}</div>

      <div
        onClick={onOpenMap}
        style={{
          marginTop: spacing.gapLg,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 8,
          padding: '11px 14px',
          borderRadius: radius.button,
          background: color.dark,
          cursor: 'pointer',
        }}
      >
        <MapIcon size={16} color={color.white} />
        <span style={{ ...type.button, color: color.white }}>Ver mapa do parque</span>
      </div>
    </div>
  );
}
