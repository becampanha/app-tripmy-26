import { color, radius, spacing, type } from './tokens.js';

// Resumo de estratégia de visita do parque (ordem sugerida de atrações,
// rope drop) — fica acima da lista de atrações em cada aba de parque, na
// tela de Atrações. O atalho pro mapa saiu daqui e virou um card próprio
// (ver "Ver mapa do parque" em AttractionsScreen.jsx), no mesmo padrão
// visual do card "Ver roteiro no mapa" da tela de Roteiro.
export default function ParkStrategyCard({ strategy }) {
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
    </div>
  );
}
