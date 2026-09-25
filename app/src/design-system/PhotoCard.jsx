import { color, cardPhotoGradient, cardPhotoGradientHeight, cardPhotoHeight, radius, spacing } from './tokens.js';

// Card com foto de fundo + gradiente escuro na parte de baixo, para legibilidade
// de texto sobreposto. Padrão canônico: PlaceCard. Usado também em AttractionCard
// e RecommendationCard — o conteúdo (badges, título, metadados) é passado via children,
// já posicionado em fluxo normal dentro da área com padding.
// `height` tem default único (cardPhotoHeight) — todo card com foto do app é
// do mesmo tamanho a menos que a tela tenha um motivo explícito pra variar.
export default function PhotoCard({ photo, height = cardPhotoHeight, onClick, children, contentStyle }) {
  return (
    <div
      onClick={onClick}
      style={{
        position: 'relative',
        height,
        marginBottom: spacing.controlGap,
        borderRadius: radius.cardPhoto,
        overflow: 'hidden',
        background: color.imagePlaceholder,
        cursor: onClick ? 'pointer' : 'default',
      }}
    >
      {photo && (
        <img
          src={photo}
          alt=""
          loading="lazy"
          decoding="async"
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }}
        />
      )}

      <div
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          bottom: 0,
          height: cardPhotoGradientHeight,
          background: cardPhotoGradient,
          pointerEvents: 'none',
        }}
      />

      <div style={{ position: 'relative', zIndex: 1, height: '100%', ...contentStyle }}>
        {children}
      </div>
    </div>
  );
}
