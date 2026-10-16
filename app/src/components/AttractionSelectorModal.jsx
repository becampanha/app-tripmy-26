import { useMemo, useState } from 'react';
import { motion } from 'motion/react';
import { CloseIcon } from '@solar-icons/react/linear/close';
import AttractionCard from './AttractionCard.jsx';
import { useAttractionsData } from '../hooks/useAttractionsData.js';
import { PARK_ICON_MAP } from '../data/parkIcons.js';
import { HScrollTabs, SearchInput, SectionHeader, IconButton, color, shellMaxWidth, space, spacing } from '../design-system/index.js';

export default function AttractionSelectorModal({ onSelect, onClose, zIndex = 20 }) {
  const { parks, loading } = useAttractionsData();
  const [parkIndex, setParkIndex] = useState(0);
  const [search, setSearch] = useState('');
  const park = parks[parkIndex];

  const tabItems = parks.map((p, i) => {
    const mapped = PARK_ICON_MAP[p.name];
    return { key: i, label: p.name, icon: mapped?.icon, iconColor: mapped?.color };
  });

  const sections = useMemo(() => {
    if (!park) return [];
    const query = search.trim().toLowerCase();
    return park.areas
      .map((area) => ({
        title: area.name,
        items: area.attractions.filter((a) => !query || a.name.toLowerCase().includes(query)),
      }))
      .filter((s) => s.items.length > 0);
  }, [park, search]);

  const totalResults = sections.reduce((sum, s) => sum + s.items.length, 0);

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        bottom: 0,
        left: '50%',
        transform: 'translateX(-50%)',
        width: '100%',
        maxWidth: shellMaxWidth,
        zIndex,
        overflow: 'hidden',
      }}
    >
      <motion.div
        initial={{ x: '100%' }}
        animate={{ x: 0 }}
        exit={{ x: '100%' }}
        transition={{ type: 'tween', ease: [0.32, 0.72, 0, 1], duration: 0.28 }}
        style={{
          position: 'absolute',
          inset: 0,
          background: color.bg,
          overflowY: 'auto',
          boxSizing: 'border-box',
        }}
      >
      <div style={{ padding: `${space.screenGutter}px ${space.screenGutter}px 0` }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ fontSize: 20, fontWeight: 800, color: color.dark }}>Selecionar atração</div>
          <IconButton icon={CloseIcon} onClick={onClose} size={34} variant="dark" iconSize={18} />
        </div>

        <HScrollTabs
          items={tabItems}
          activeKey={parkIndex}
          onSelect={setParkIndex}
          loading={loading}
          instanceId="attraction-selector-modal"
        />
      </div>

      <div
        style={{
          marginTop: spacing.controlGap,
          boxSizing: 'border-box',
          padding: `2px ${space.screenGutter}px 60px`,
        }}
      >
        <SearchInput value={search} onChange={setSearch} placeholder="Buscar por nome" />

        {sections.map((section) => (
          <div key={section.title}>
            <SectionHeader>{section.title}</SectionHeader>
            {section.items.map((attraction) => (
              <AttractionCard
                key={attraction.id}
                attraction={attraction}
                disableNavigate
                bottomContent={
                  <button
                    type="button"
                    onClick={() => onSelect({ ...attraction, parkName: park.name, parkEmoji: park.emoji, area: section.title })}
                    style={{
                      marginTop: 10,
                      width: '100%',
                      padding: '9px 0',
                      borderRadius: 10,
                      border: 0,
                      background: '#fff',
                      color: color.dark,
                      fontSize: 13,
                      fontWeight: 800,
                      cursor: 'pointer',
                    }}
                  >
                    Selecionar
                  </button>
                }
              />
            ))}
          </div>
        ))}

        {!loading && totalResults === 0 && (
          <div style={{ padding: '30px 0', textAlign: 'center', color: color.faint, fontSize: 13.5, fontWeight: 600 }}>
            Nenhuma atração encontrada neste parque.
          </div>
        )}
      </div>
      </motion.div>
    </div>
  );
}
