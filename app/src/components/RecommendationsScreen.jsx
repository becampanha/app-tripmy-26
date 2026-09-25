import { useNavigate } from 'react-router-dom';
import { useAllRecommendations } from '../hooks/useAllRecommendations.js';
import { RecommendationCard, Skeleton, color, radius, spacing, type } from '../design-system/index.js';

function RecommendationsSkeleton() {
  return (
    <>
      {Array.from({ length: 3 }).map((_, i) => (
        <div
          key={i}
          style={{ display: 'flex', gap: 12, alignItems: 'center', padding: 14, marginBottom: 10, background: color.bg, border: `1px solid ${color.border}`, borderRadius: radius.card }}
        >
          <Skeleton width={40} height={13} />
          <div style={{ flex: 1 }}>
            <Skeleton width="70%" height={15} />
            <Skeleton width="45%" height={12} style={{ marginTop: 6 }} />
          </div>
        </div>
      ))}
    </>
  );
}

export default function RecommendationsScreen() {
  const { recommendations } = useAllRecommendations();
  const navigate = useNavigate();

  return (
    <div style={{ position: 'relative', width: '100%', minHeight: '100dvh', background: color.bg, boxSizing: 'border-box' }}>
      <div style={{ padding: `${spacing.screenGutter}px ${spacing.screenGutter}px 0` }}>
        <div style={{ ...type.mainTitle, color: color.dark }}>
          Recomendações
        </div>
      </div>

      <div style={{ marginTop: spacing.controlGap, boxSizing: 'border-box', padding: `2px ${spacing.screenGutter}px 120px` }}>
        {recommendations === null && <RecommendationsSkeleton />}

        {recommendations && recommendations.length === 0 && (
          <div style={{ padding: '30px 0', textAlign: 'center', color: color.faint, fontSize: 13.5, fontWeight: 600 }}>
            Nenhuma recomendação publicada ainda.
          </div>
        )}

        {recommendations && recommendations.map((rec) => (
          <RecommendationCard
            key={rec.id}
            recommendation={rec}
            place={rec.place}
            onClick={() => navigate(`/lugares/${rec.place.id}`)}
          />
        ))}
      </div>
    </div>
  );
}
