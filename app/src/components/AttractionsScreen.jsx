import { useEffect, useMemo, useState } from 'react';
import AttractionCard from './AttractionCard.jsx';
import { fetchAttractions } from '../api/itineraryApi.js';
import { readCache, writeCache } from '../hooks/persistentCache.js';
import { PARK_ICON_MAP } from '../data/parkIcons.js';
import { HScrollTabs, SearchInput, SectionHeader, Skeleton, Toggle, cardPhotoHeight, color, radius, space, spacing, type } from '../design-system/index.js';

// Mesmo padrão visual/funcional da tela de Lugares: abas com scroll
// horizontal (aqui, um parque por aba) + seções sticky por área + busca.
export default function AttractionsScreen() {
  const cached = readCache('attractions');
  const [parks, setParks] = useState(cached || []);
  const [loading, setLoading] = useState(cached === null);
  const [parkIndex, setParkIndex] = useState(0);
  const [search, setSearch] = useState('');
  const [onlyInItinerary, setOnlyInItinerary] = useState(false);

  useEffect(() => {
    fetchAttractions()
      .then((data) => {
        setParks(data);
        writeCache('attractions', data);
      })
      .finally(() => setLoading(false));
  }, []);

  const park = parks[parkIndex];

  const sections = useMemo(() => {
    if (!park) return [];
    const query = search.trim().toLowerCase();
    return park.areas
      .map((area) => ({
        name: area.name,
        attractions: area.attractions
          .filter((a) => !query || a.name.toLowerCase().includes(query))
          .filter((a) => !onlyInItinerary || a.required),
      }))
      .filter((area) => area.attractions.length > 0);
  }, [park, search, onlyInItinerary]);

  const tabItems = parks.map((p, i) => {
    const mapped = PARK_ICON_MAP[p.name];
    return { key: i, label: p.name, icon: mapped?.icon, iconColor: mapped?.color };
  });

  return (
    <div style={{ position: 'relative', width: '100%', minHeight: '100dvh', background: color.bg, boxSizing: 'border-box' }}>
      <div style={{ padding: `${space.screenGutter}px ${space.screenGutter}px 0` }}>
        <div style={{ ...type.screenTitle, color: color.dark }}>
          Atrações
        </div>

        <HScrollTabs items={tabItems} activeKey={parkIndex} onSelect={setParkIndex} loading={loading} />
      </div>

      <div
        style={{
          marginTop: spacing.controlGap,
          boxSizing: 'border-box',
          padding: `2px ${space.screenGutter}px 120px`,
        }}
      >
        <SearchInput value={search} onChange={setSearch} placeholder="Buscar atração" />

        <div style={{ display: 'flex', alignItems: 'center', gap: spacing.gapMd, marginBottom: 14 }}>
          <div
            onClick={() => setOnlyInItinerary((v) => !v)}
            style={{ display: 'flex', alignItems: 'center', gap: spacing.gapMd, cursor: 'pointer', userSelect: 'none' }}
          >
            <Toggle checked={onlyInItinerary} onChange={setOnlyInItinerary} />
            <span style={{ color: onlyInItinerary ? color.dark : color.muted, fontSize: 12.5, fontWeight: 600 }}>
              Atrações que estão no roteiro
            </span>
          </div>
        </div>

        {loading && parks.length === 0 && Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} height={cardPhotoHeight} radius={radius.cardPhoto} style={{ marginBottom: spacing.controlGap }} />
        ))}

        {!loading && park && sections.map((section) => (
          <div key={section.name}>
            <SectionHeader>{section.name}</SectionHeader>
            {section.attractions.map((attraction) => (
              <AttractionCard key={attraction.id} attraction={attraction} />
            ))}
          </div>
        ))}

        {!loading && park && sections.length === 0 && (
          <div style={{ padding: '30px 0', textAlign: 'center', color: color.faint, fontSize: 13.5, fontWeight: 600 }}>
            Nenhuma atração encontrada.
          </div>
        )}
      </div>
    </div>
  );
}
