import { AltArrowRightIcon } from '@solar-icons/react/linear/alt-arrow-right';
import { useLongPress } from '../hooks/useLongPress.js';
import { color, radius, space } from './tokens.js';

function formatRecommendationDate(iso) {
  if (!iso) return '';
  return new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

// Card de recomendação (somente leitura) — mesmo padrão visual do card de
// atividade do Roteiro (ActivityItem): fundo branco com borda, texto à
// esquerda, thumbnail pequena da foto à direita. Usado tanto na tela de
// detalhe do lugar (uma recomendação por vez, sem badge de lugar) quanto na
// tela agregada de Recomendações (todos os lugares juntos — aí `place` traz
// a mesma badge/pill de lugar vinculado do ActivityItem, embaixo do texto).
// Editar/remover uma recomendação acontece inline no modo de edição do
// lugar (PlaceDetailScreen), não neste card.
export default function RecommendationCard({ recommendation, place, onOpenPhoto, onClick }) {
  const meta = [
    recommendation.author ? `Recomendado por ${recommendation.author}` : null,
    formatRecommendationDate(recommendation.createdAt),
  ].filter(Boolean).join(' · ');
  // Clique normal (em qualquer parte do card, inclusive a foto) navega para
  // o lugar. Pressionar e segurar especificamente NA FOTO abre ela em
  // fullscreen (estilo Peek & Pop do iOS) — por isso a foto tem seu próprio
  // onClick que intercepta o clique quando o long-press já disparou.
  const cardClickable = !!onClick;
  const photoLongPress = useLongPress(() => {
    if (recommendation.photo && onOpenPhoto) onOpenPhoto();
  });

  return (
    <div
      onClick={cardClickable ? onClick : undefined}
      style={{
        display: 'flex',
        gap: 12,
        alignItems: 'stretch',
        padding: space.xl,
        marginBottom: space.lg,
        background: color.bg,
        border: `1px solid ${color.border}`,
        borderRadius: radius.card,
        cursor: cardClickable ? 'pointer' : 'default',
      }}
    >
      <div style={{ flex: 1, minWidth: 0 }}>
        {recommendation.title && (
          <div style={{ color: color.dark, fontSize: 15, fontWeight: 700, lineHeight: 1.25 }}>
            {recommendation.title}
          </div>
        )}
        {recommendation.description && (
          <div style={{ color: color.dark, fontSize: 14, fontWeight: 500, marginTop: recommendation.title ? 2 : 0, lineHeight: 1.35 }}>
            {recommendation.description}
          </div>
        )}
        {meta && (
          <div style={{ color: color.muted, fontSize: 11.5, fontWeight: 600, marginTop: 8 }}>
            {meta}
          </div>
        )}
        {place && (
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 4,
              marginTop: 10,
              padding: '4px 8px 4px 10px',
              borderRadius: radius.badge,
              background: color.surfaceMuted,
              color: color.dark,
              fontSize: 11.5,
              fontWeight: 700,
              maxWidth: '100%',
            }}
          >
            {place.tag && <span style={{ flex: 'none' }}>{place.tag.split(' ')[0]}</span>}
            <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{place.name}</span>
            <AltArrowRightIcon size={13} color={color.dark} style={{ flex: 'none' }} />
          </div>
        )}
      </div>

      {recommendation.photo && (
        <div
          {...photoLongPress.handlers}
          onClick={(e) => {
            e.stopPropagation();
            if (photoLongPress.didLongPress()) return;
            if (onOpenPhoto) onOpenPhoto();
            else if (onClick) onClick();
          }}
          style={{
            position: 'relative',
            flex: 'none',
            width: 96,
            minHeight: 84,
            alignSelf: 'stretch',
            borderRadius: radius.chip,
            overflow: 'hidden',
            background: color.imagePlaceholder,
            cursor: 'pointer',
            WebkitTouchCallout: 'none',
            WebkitUserSelect: 'none',
            userSelect: 'none',
            touchAction: 'pan-y',
          }}
        >
          <img
            src={recommendation.photo}
            alt=""
            loading="lazy"
            style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }}
          />
        </div>
      )}
    </div>
  );
}
