import { useEffect, useMemo, useState } from 'react';
import { CloseIcon } from '@solar-icons/react/linear/close';
import { MagnifierIcon } from '@solar-icons/react/linear/magnifier';
import { CloseCircleIcon } from '@solar-icons/react/linear/close-circle';
import PlaceCard from './PlaceCard.jsx';
import Select from './Select.jsx';
import { fetchPlaces } from '../api/itineraryApi.js';
import { CATEGORY_ICON_MAP } from '../data/placeTags.js';
import { subcategoriesFor } from '../data/subcategories.js';
import { useDragScroll } from '../hooks/useDragScroll.js';
import { usePlacesInItinerary } from '../hooks/usePlacesInItinerary.js';

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
  const { scrollerRef, dragRef, dragHandlers } = useDragScroll();
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

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        bottom: 0,
        left: '50%',
        transform: 'translateX(-50%)',
        width: '100%',
        maxWidth: 480,
        zIndex: 20,
        background: '#fff',
        overflowY: 'auto',
        boxSizing: 'border-box',
      }}
    >
      <div style={{ padding: '22px 22px 0' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ fontSize: 20, fontWeight: 800, color: '#1c1a17' }}>Selecionar lugar</div>
          <div
            onClick={onClose}
            style={{
              width: 34,
              height: 34,
              borderRadius: 12,
              background: '#1c1a17',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
            }}
          >
            <CloseIcon size={18} color="#fff" />
          </div>
        </div>

        <div
          ref={scrollerRef}
          {...dragHandlers}
          style={{
            display: 'flex',
            gap: 8,
            overflowX: 'auto',
            marginTop: 16,
            padding: '2px 2px 6px',
            WebkitOverflowScrolling: 'touch',
            cursor: 'grab',
            userSelect: 'none',
          }}
        >
          {CATEGORIES.map((cat) => {
            const active = cat === category;
            const { icon: CatIcon, color: iconColor } = CATEGORY_ICON_MAP[cat];
            return (
              <div
                key={cat}
                onClick={() => {
                  if (dragRef.current && dragRef.current.moved) return;
                  setCategory(cat);
                  setSubcategory('');
                }}
                style={{
                  flex: 'none',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '8px 16px',
                  borderRadius: 14,
                  fontSize: 12.5,
                  fontWeight: 700,
                  cursor: 'pointer',
                  userSelect: 'none',
                  background: active ? '#1c1a17' : '#f9f7f2',
                  color: active ? '#fff' : '#6b6459',
                }}
              >
                <CatIcon size={15} color={active ? '#fff' : iconColor} />
                {CATEGORY_LABELS[cat] || cat}
                {countByCategory[cat] != null && (
                  <span style={{ opacity: 0.7 }}>({countByCategory[cat]})</span>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <div
        style={{
          marginTop: 16,
          boxSizing: 'border-box',
          padding: '2px 22px 60px',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            padding: '9px 14px',
            borderRadius: 12,
            border: '1px solid #ececec',
            background: '#fff',
            marginBottom: 16,
          }}
        >
          <MagnifierIcon size={14} color="#b3ab9c" style={{ flex: 'none' }} />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por nome"
            style={{
              flex: 1,
              minWidth: 0,
              border: 'none',
              outline: 'none',
              background: 'transparent',
              color: '#1c1a17',
              fontSize: 13,
              fontWeight: 600,
            }}
          />
          {search && (
            <div onClick={() => setSearch('')} style={{ flex: 'none', cursor: 'pointer', display: 'flex' }}>
              <CloseCircleIcon size={14} color="#b3ab9c" />
            </div>
          )}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, marginBottom: 14 }}>
          <div
            onClick={() => setOnlyInItinerary((v) => !v)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              cursor: 'pointer',
              userSelect: 'none',
              flex: 'none',
            }}
          >
            <div
              style={{
                position: 'relative',
                width: 38,
                height: 22,
                borderRadius: 11,
                background: onlyInItinerary ? '#3fa35a' : '#e2ddd2',
                transition: 'background .2s',
                flex: 'none',
              }}
            >
              <div
                style={{
                  position: 'absolute',
                  top: 2,
                  left: onlyInItinerary ? 18 : 2,
                  width: 18,
                  height: 18,
                  borderRadius: 9,
                  background: '#fff',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.25)',
                  transition: 'left .2s',
                }}
              />
            </div>
            <span style={{ color: onlyInItinerary ? '#1c1a17' : '#9a9186', fontSize: 12.5, fontWeight: 600 }}>
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
            <div
              style={{
                position: 'sticky',
                top: 0,
                zIndex: 5,
                background: '#fff',
                padding: '10px 0',
                marginBottom: 4,
                color: '#1c1a17',
                fontSize: 17,
                fontWeight: 800,
                letterSpacing: -0.1,
              }}
            >
              {section.title}
            </div>
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
          <div style={{ padding: '30px 0', textAlign: 'center', color: '#b6ae9f', fontSize: 13.5, fontWeight: 600 }}>
            Nenhum lugar encontrado nessa categoria.
          </div>
        )}
      </div>
    </div>
  );
}
