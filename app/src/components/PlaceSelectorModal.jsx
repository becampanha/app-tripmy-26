import { useEffect, useMemo, useState } from 'react';
import { CloseIcon } from '@solar-icons/react/linear/close';
import PlaceCard from './PlaceCard.jsx';
import { fetchPlaces } from '../api/itineraryApi.js';
import { CATEGORY_ICON_MAP } from '../data/placeTags.js';
import { subcategoriesFor } from '../data/subcategories.js';
import { usePlacesInItinerary } from '../hooks/usePlacesInItinerary.js';
import { HScrollTabs, SearchInput, Toggle, SectionHeader, IconButton, Select, color, shellMaxWidth, space, spacing, type } from '../design-system/index.js';

const CATEGORIES = ['Restaurante', 'Mercado', 'Centros', 'Outlets', 'Shopping', 'Loja', 'Parque', 'Hotel', 'Aeroporto', 'Outro'];

const CATEGORY_LABELS = {
  Restaurante: 'Restaurantes',
  Mercado: 'Mercados',
  Centros: 'Centros',
  Outlets: 'Outlets',
  Shopping: 'Shopping',
  Loja: 'Lojas',
  Parque: 'Parques',
  Hotel: 'Hotéis',
  Aeroporto: 'Aeroportos',
  Outro: 'Outros',
};

export default function PlaceSelectorModal({ onSelect, onClose }) {
  const [places, setPlaces] = useState([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [subcategory, setSubcategory] = useState('');
  const [onlyInItinerary, setOnlyInItinerary] = useState(false);
  const [search, setSearch] = useState('');
  const placesInItinerary = usePlacesInItinerary();

  useEffect(() => {
    fetchPlaces()
      .then(setPlaces)
      .finally(() => setLoading(false));
  }, []);

  const countByCategory = useMemo(() => {
    const counts = {};
    for (const p of places) counts[p.category] = (counts[p.category] || 0) + 1;
    return counts;
  }, [places]);

  const subcategoryOptions = subcategoriesFor(category);

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    return places.filter((p) =>
      p.category === category &&
      (!subcategory || p.subcategory === subcategory) &&
      (!onlyInItinerary || (placesInItinerary && placesInItinerary.has(p.id))) &&
      (!query || p.name.toLowerCase().includes(query))
    );
  }, [places, category, subcategory, onlyInItinerary, placesInItinerary, search]);

  const groupedSections = useMemo(() => {
    if (subcategory || subcategoryOptions.length === 0) return null;

    const byArea = new Map();
    for (const area of subcategoryOptions) byArea.set(area, []);
    const noArea = [];

    for (const p of filtered) {
      if (p.subcategory && byArea.has(p.subcategory)) {
        byArea.get(p.subcategory).push(p);
      } else {
        noArea.push(p);
      }
    }

    const sections = subcategoryOptions
      .map((area) => ({ title: area, items: byArea.get(area) }))
      .filter((s) => s.items.length > 0);

    if (noArea.length > 0) sections.push({ title: 'Sem área definida', items: noArea });

    return sections;
  }, [filtered, subcategory, subcategoryOptions]);

  const tabItems = CATEGORIES.map((cat) => ({
    key: cat,
    label: CATEGORY_LABELS[cat] || cat,
    icon: CATEGORY_ICON_MAP[cat].icon,
    iconColor: CATEGORY_ICON_MAP[cat].color,
    count: countByCategory[cat],
  }));

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
        zIndex: 20,
        background: color.bg,
        overflowY: 'auto',
        boxSizing: 'border-box',
      }}
    >
      <div style={{ padding: `${space.screenGutter}px ${space.screenGutter}px 0` }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ fontSize: 20, fontWeight: 800, color: color.dark }}>Selecionar lugar</div>
          <IconButton icon={CloseIcon} onClick={onClose} size={34} variant="dark" iconSize={18} />
        </div>

        <HScrollTabs
          items={tabItems}
          activeKey={category}
          onSelect={(cat) => {
            setCategory(cat);
            setSubcategory('');
          }}
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

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: spacing.gapLg, marginBottom: 14 }}>
          <div
            onClick={() => setOnlyInItinerary((v) => !v)}
            style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', userSelect: 'none', flex: 'none' }}
          >
            <Toggle checked={onlyInItinerary} onChange={setOnlyInItinerary} />
            <span style={{ color: onlyInItinerary ? color.dark : color.muted, fontSize: 12.5, fontWeight: 600 }}>
              Lugares que estão no roteiro
            </span>
          </div>

          {subcategoryOptions.length > 0 && (
            <Select
              label="Área"
              placeholder="Todas as áreas"
              value={subcategory}
              onChange={setSubcategory}
              options={subcategoryOptions}
              buttonStyle={{ padding: '7px 12px', fontSize: 12.5 }}
            />
          )}
        </div>

        {groupedSections && groupedSections.map((section) => (
          <div key={section.title}>
            <SectionHeader>{section.title}</SectionHeader>
            {section.items.map((place) => (
              <PlaceCard
                key={place.id}
                place={place}
                onAction={() => onSelect(place)}
                inItinerary={placesInItinerary ? placesInItinerary.has(place.id) : false}
              />
            ))}
          </div>
        ))}

        {!groupedSections && filtered.map((place) => (
          <PlaceCard
            key={place.id}
            place={place}
            onAction={() => onSelect(place)}
            inItinerary={placesInItinerary ? placesInItinerary.has(place.id) : false}
          />
        ))}

        {!loading && filtered.length === 0 && (
          <div style={{ padding: '30px 0', textAlign: 'center', color: color.faint, fontSize: 13.5, fontWeight: 600 }}>
            Nenhum lugar encontrado nessa categoria.
          </div>
        )}
      </div>
    </div>
  );
}
