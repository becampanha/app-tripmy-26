import { useEffect, useState } from 'react';
import { color, cardPhotoGradient, cardPhotoGradientHeight, cardPhotoHeight, radius, spacing } from './tokens.js';

// Card com foto de fundo + gradiente escuro na parte de baixo, para legibilidade
// de texto sobreposto. Padrão canônico: PlaceCard. Usado também em AttractionCard
// e RecommendationCard — o conteúdo (badges, título, metadados) é passado via children,
// já posicionado em fluxo normal dentro da área com padding.
// `height` tem default único (cardPhotoHeight) — todo card com foto do app é
// do mesmo tamanho a menos que a tela tenha um motivo explícito pra variar.
export default function PhotoCard({ photo, height = cardPhotoHeight, onClick, children, contentStyle, style }) {
  const [loaded, setLoaded] = useState(false);

  // Reseta o skeleton se a foto do card mudar (ex: card reciclado em lista virtualizada).
  useEffect(() => {
    setLoaded(false);
  }, [photo]);

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
        boxSizing: 'border-box',
        ...style,
      }}
    >
      {photo && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: color.surfaceMuted,
            animation: 'image-pulse 1.4s ease-in-out infinite',
            opacity: loaded ? 0 : 1,
            transition: 'opacity 0.35s ease',
          }}
        />
      )}

      {photo && (
        <img
          src={photo}
          alt=""
          loading="lazy"
          decoding="async"
          onLoad={() => setLoaded(true)}
          style={{
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            opacity: loaded ? 1 : 0,
            transition: 'opacity 0.35s ease',
          }}
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
