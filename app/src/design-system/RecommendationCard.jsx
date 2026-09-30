import { AltArrowRightIcon } from '@solar-icons/react/linear/alt-arrow-right';
import { PenIcon } from '@solar-icons/react/linear/pen';
import { color, radius, space } from './tokens.js';

function formatRecommendationDate(iso) {
  if (!iso) return '';
  return new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

// Card de recomendação — mesmo padrão visual do card de atividade do
// Roteiro (ActivityItem): fundo branco com borda, texto à esquerda,
// thumbnail pequena da foto à direita. Usado tanto na tela de detalhe do
// lugar (uma recomendação por vez, sem badge de lugar) quanto na tela
// agregada de Dicas (todos os lugares juntos — aí `place` traz a mesma
// badge/pill de lugar vinculado do ActivityItem, embaixo do texto).
// `onEdit` (opcional) mostra um botão de editar que abre o
// RecommendationEditModal — mesmo card nas duas telas, por isso a prop é
// opcional em vez de sempre presente.
export default function RecommendationCard({ recommendation, place, onOpenPhoto, onClick, onEdit }) {
  const meta = [
    recommendation.author ? `Recomendado por ${recommendation.author}` : null,
    formatRecommendationDate(recommendation.createdAt),
  ].filter(Boolean).join(' · ');
  // Clique normal (em qualquer parte do card, inclusive a foto) navega para
  // o lugar. A foto usa o menu de contexto NATIVO do sistema ao segurar o
  // dedo (Salvar Imagem, Copiar) — não um long-press customizado; por isso
  // fica de fora do touch-callout:none global (ver classe allow-native-touch).
  const cardClickable = !!onClick;

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
        {(meta || onEdit) && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, marginTop: 8 }}>
            {meta && (
              <div style={{ color: color.muted, fontSize: 11.5, fontWeight: 600, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {meta}
              </div>
            )}
            {onEdit && (
              <div
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit();
                }}
                style={{
                  flex: 'none',
                  width: 26,
                  height: 26,
                  borderRadius: 9,
                  background: color.surfaceMuted,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                }}
              >
                <PenIcon size={13} color={color.dark} />
              </div>
            )}
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
          className="allow-native-touch"
          onClick={(e) => {
            e.stopPropagation();
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
