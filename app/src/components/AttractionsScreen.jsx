import { useEffect, useMemo, useState } from 'react';
import { AnimatePresence } from 'motion/react';
import AttractionCard from './AttractionCard.jsx';
import { fetchAttractions, updateAttraction } from '../api/itineraryApi.js';
import { showErrorToast } from '../hooks/useToast.js';
import { readCache, writeCache } from '../hooks/persistentCache.js';
import { PARK_ICON_MAP } from '../data/parkIcons.js';
import { useScrollY } from '../hooks/useScrollY.js';
import { useElementHeight } from '../hooks/useElementHeight.js';
import { useLiveQueueTimes } from '../hooks/useLiveQueueTimes.js';
import { FixedHeader, HScrollTabs, ParkMap, ParkStrategyCard, SearchInput, SectionHeader, Skeleton, Toggle, cardPhotoHeight, color, radius, space, spacing } from '../design-system/index.js';

// Espelho em memória de módulo do cache — evita reler e reparsear o
// localStorage a cada render (mesmo padrão de useItinerary.js).
let cachedParks = readCache('attractions');

// Mesmo padrão visual/funcional da tela de Lugares: abas com scroll
// horizontal (aqui, um parque por aba) + seções sticky por área + busca.
export default function AttractionsScreen() {
  const [parks, setParks] = useState(cachedParks || []);
  const [loading, setLoading] = useState(cachedParks === null);
  const [parkIndex, setParkIndex] = useState(0);
  const [search, setSearch] = useState('');
  const [onlyInItinerary, setOnlyInItinerary] = useState(false);
  const { scrollY, anchorRef } = useScrollY();
  const { ref: headerRef, height: headerHeight } = useElementHeight();
  const { getLiveQueue } = useLiveQueueTimes();
  const [mapOpen, setMapOpen] = useState(false);

  useEffect(() => {
    fetchAttractions()
      .then((data) => {
        cachedParks = data;
        writeCache('attractions', data);
        setParks(data);
      })
      .finally(() => setLoading(false));
  }, []);

  const park = parks[parkIndex];

  // Otimista: atualiza a lista local na hora, só reverte se o PUT falhar —
  // mesmo padrão de reação imediata usado nos outros toggles do app.
  const applyRequired = (attractionId, required) =>
    setParks((prev) => {
      const next = prev.map((p) => ({
        ...p,
        areas: p.areas.map((a) => ({
          ...a,
          attractions: a.attractions.map((at) =>
            at.id === attractionId ? { ...at, required } : at
          ),
        })),
      }));
      cachedParks = next;
      writeCache('attractions', next);
      return next;
    });

  const handleToggleRequired = (attractionId, required) => {
    applyRequired(attractionId, required);
    updateAttraction(attractionId, { required }).catch((err) => {
      applyRequired(attractionId, !required);
      showErrorToast(err, 'Não foi possível atualizar o status no roteiro.');
    });
  };

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
    <div ref={anchorRef} style={{ position: 'relative', width: '100%', minHeight: '100dvh', background: color.bg, boxSizing: 'border-box' }}>
      <FixedHeader
        headerRef={headerRef}
        scrollY={scrollY}
        title="Atrações"
        tabs={<HScrollTabs items={tabItems} activeKey={parkIndex} onSelect={setParkIndex} loading={loading} style={{ marginTop: 0, padding: `0 ${spacing.screenGutter}px` }} />}
      />

      <div
        style={{
          marginTop: headerHeight + spacing.controlGap,
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

        {!loading && park && (
          <ParkStrategyCard strategy={park.strategy} onOpenMap={() => setMapOpen(true)} />
        )}

        {loading && parks.length === 0 && Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} height={cardPhotoHeight} radius={radius.cardPhoto} style={{ marginBottom: spacing.controlGap }} />
        ))}

        {!loading && park && sections.map((section) => (
          <div key={section.name}>
            <SectionHeader style={{ top: headerHeight }}>{section.name}</SectionHeader>
            {section.attractions.map((attraction) => (
              <AttractionCard
                key={attraction.id}
                attraction={attraction}
                liveQueue={getLiveQueue(attraction.name)}
                onToggleRequired={(required) => handleToggleRequired(attraction.id, required)}
              />
            ))}
          </div>
        ))}

        {!loading && park && sections.length === 0 && (
          <div style={{ padding: '30px 0', textAlign: 'center', color: color.faint, fontSize: 13.5, fontWeight: 600 }}>
            Nenhuma atração encontrada.
          </div>
        )}
      </div>

      <AnimatePresence>
        {mapOpen && park && (
          <ParkMap key="park-map" park={park} onClose={() => setMapOpen(false)} getLiveQueue={getLiveQueue} />
        )}
      </AnimatePresence>
    </div>
  );
}
