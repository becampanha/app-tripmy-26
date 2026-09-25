import { color, overlay, radius, space, type } from './tokens.js';

// Pill pequena sobre foto — fundo escuro translúcido, texto branco por padrão.
// Ex: tag/categoria e custo no PlaceCard, "Obrigatória"/intensidade no AttractionCard.
export default function Badge({ icon: Icon, iconColor, children, textColor = color.white, style }) {
  return (
    <div
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: space.xs,
        padding: Icon ? `${space.xxs}px ${space.md}px ${space.xxs}px ${space.sm}px` : `3px ${space.md + 1}px`,
        borderRadius: radius.pill,
        background: overlay.badgeOnPhoto,
        ...style,
      }}
    >
      {Icon && <Icon size={11} color={iconColor || textColor} />}
      <span style={{ ...type.eyebrow, textTransform: 'none', letterSpacing: 0, color: textColor }}>
        {children}
      </span>
    </div>
  );
}
