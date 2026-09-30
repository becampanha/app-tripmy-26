import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAllRecommendations } from '../hooks/useAllRecommendations.js';
import { useScrollY } from '../hooks/useScrollY.js';
import { FixedHeader, RecommendationCard, SectionHeader, Skeleton, color, radius, spacing, type } from '../design-system/index.js';

const NO_AREA_LABEL = 'Outros lugares';

// Agrupa por área do lugar (place.subcategory — ex: "Disney Springs"),
// mantendo juntas todas as recomendações do mesmo lugar dentro da área —
// antes a lista vinha só na ordem de quem publicou por último.
function groupByArea(recommendations) {
  const byArea = new Map();
  for (const rec of recommendations) {
    const area = rec.place.subcategory || NO_AREA_LABEL;
    if (!byArea.has(area)) byArea.set(area, new Map());
    const byPlace = byArea.get(area);
    if (!byPlace.has(rec.place.id)) byPlace.set(rec.place.id, []);
    byPlace.get(rec.place.id).push(rec);
  }

  const sections = Array.from(byArea.entries()).map(([area, byPlace]) => ({
    area,
    items: Array.from(byPlace.values())
      .sort((a, b) => a[0].place.name.localeCompare(b[0].place.name))
      .flat(),
  }));

  // "Outros lugares" (sem área cadastrada) sempre por último, o resto em
  // ordem alfabética — mesmo critério usado em Lugares/Atrações.
  sections.sort((a, b) => {
    if (a.area === NO_AREA_LABEL) return 1;
    if (b.area === NO_AREA_LABEL) return -1;
    return a.area.localeCompare(b.area);
  });
  return sections;
}

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
  const { scrollY, anchorRef } = useScrollY();

  const sections = useMemo(
    () => (recommendations ? groupByArea(recommendations) : null),
    [recommendations]
  );

  return (
    <div ref={anchorRef} style={{ position: 'relative', width: '100%', minHeight: '100dvh', background: color.bg, boxSizing: 'border-box' }}>
      <FixedHeader scrollY={scrollY} title="Dicas" />
      <div style={{ padding: `${spacing.screenGutter}px ${spacing.screenGutter}px 0` }}>
        <div style={{ ...type.mainTitle, color: color.dark }}>
          Dicas
        </div>
      </div>

      <div style={{ marginTop: spacing.controlGap, boxSizing: 'border-box', padding: `2px ${spacing.screenGutter}px 120px` }}>
        {recommendations === null && <RecommendationsSkeleton />}

        {recommendations && recommendations.length === 0 && (
          <div style={{ padding: '30px 0', textAlign: 'center', color: color.faint, fontSize: 13.5, fontWeight: 600 }}>
            Nenhuma dica publicada ainda.
          </div>
        )}

        {sections && sections.map((section) => (
          <div key={section.area}>
            <SectionHeader>{section.area}</SectionHeader>
            {section.items.map((rec) => (
              <RecommendationCard
                key={rec.id}
                recommendation={rec}
                place={rec.place}
                onClick={() => navigate(`/lugares/${rec.place.id}`)}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
