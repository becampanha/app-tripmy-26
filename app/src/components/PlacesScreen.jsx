import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import PlaceCard from './PlaceCard.jsx';
import Select from './Select.jsx';
import { fetchPlaces } from '../api/itineraryApi.js';
import { CATEGORY_ICON_MAP } from '../data/placeTags.js';
import { subcategoriesFor } from '../data/subcategories.js';
import { useDragScroll } from '../hooks/useDragScroll.js';
import { usePlacesInItinerary } from '../hooks/usePlacesInItinerary.js';

const CATEGORIES = ['Restaurante', 'Mercado', 'Loja', 'Parque', 'Hotel', 'Aeroporto', 'Outro'];

function PlaceCardSkeleton() {
  return (
    <div
      style={{
        height: 300,
        marginBottom: 16,
        borderRadius: 20,
        background: '#f9f7f2',
        animation: 'pulse 1.2s ease-in-out infinite',
      }}
    />
  );
}

export default function PlacesScreen() {
  const [places, setPlaces] = useState([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [subcategory, setSubcategory] = useState('');
  const [onlyInItinerary, setOnlyInItinerary] = useState(false);
  const navigate = useNavigate();
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
    return places.filter((p) =>
      p.category === category &&
      (!subcategory || p.subcategory === subcategory) &&
      (!onlyInItinerary || (placesInItinerary && placesInItinerary.has(p.id)))
    );
  }, [places, category, subcategory, onlyInItinerary, placesInItinerary]);

  // Sem área específica selecionada e a categoria tem subcategorias definidas:
  // agrupa a lista por área, com um mini-título fixo (sticky) por grupo, como
  // as seções da lista de Contatos do iOS. Lugares sem subcategoria caem num
  // grupo "Sem área definida" no final, pra nada ficar escondido.
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
    <div style={{ position: 'relative', width: '100%', minHeight: '100dvh', background: '#fff', boxSizing: 'border-box' }}>
      <div style={{ padding: '22px 22px 0' }}>
        <div style={{ fontSize: 26, fontWeight: 800, letterSpacing: -0.3, color: '#1c1a17' }}>
          Lugares
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
                {cat}
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
          padding: '2px 22px 120px',
        }}
      >
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

        {loading && Array.from({ length: 3 }).map((_, i) => <PlaceCardSkeleton key={i} />)}

        {!loading && groupedSections && groupedSections.map((section) => (
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
                onAction={() => navigate(`/lugares/${place.id}`)}
                inItinerary={placesInItinerary ? placesInItinerary.has(place.id) : false}
              />
            ))}
          </div>
        ))}

        {!loading && !groupedSections && filtered.map((place) => (
          <PlaceCard
            key={place.id}
            place={place}
            onAction={() => navigate(`/lugares/${place.id}`)}
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
