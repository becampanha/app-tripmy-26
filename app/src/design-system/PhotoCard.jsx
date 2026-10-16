import ImageLoadingBar from './ImageLoadingBar.jsx';
import { useImageProgress } from '../hooks/useImageProgress.js';
import { color, cardPhotoGradient, cardPhotoGradientHeight, cardPhotoHeight, radius, spacing } from './tokens.js';

// Card com foto de fundo + gradiente escuro na parte de baixo, para legibilidade
// de texto sobreposto. Padrão canônico: PlaceCard. Usado também em AttractionCard
// e RecommendationCard — o conteúdo (badges, título, metadados) é passado via children,
// já posicionado em fluxo normal dentro da área com padding.
// `height` tem default único (cardPhotoHeight) — todo card com foto do app é
// do mesmo tamanho a menos que a tela tenha um motivo explícito pra variar.
export default function PhotoCard({ photo, height = cardPhotoHeight, onClick, children, contentStyle, style }) {
  const { elementRef, progress, objectUrl, loaded } = useImageProgress(photo);

  return (
    <div
      ref={elementRef}
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
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            opacity: loaded ? 0 : 1,
            transition: 'opacity 0.35s ease',
            pointerEvents: 'none',
          }}
        >
          <ImageLoadingBar progress={progress} />
        </div>
      )}

      {objectUrl && (
        <img
          src={objectUrl}
          alt=""
          decoding="async"
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
