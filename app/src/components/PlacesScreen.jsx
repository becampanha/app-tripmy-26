import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import PlaceCard from './PlaceCard.jsx';
import { fetchPlaces } from '../api/itineraryApi.js';
import { CATEGORY_ICON_MAP } from '../data/placeTags.js';
import { useDragScroll } from '../hooks/useDragScroll.js';

const CATEGORIES = ['Restaurante', 'Mercado', 'Loja', 'Parque', 'Hotel', 'Outro'];

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
  const navigate = useNavigate();
  const { scrollerRef, dragRef, dragHandlers } = useDragScroll();

  useEffect(() => {
    fetchPlaces()
      .then(setPlaces)
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    return places.filter((p) => p.category === category);
  }, [places, category]);

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
                  if (!dragRef.current || !dragRef.current.moved) setCategory(cat);
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
              </div>
            );
          })}
        </div>
      </div>

      <div
        style={{
          marginTop: 18,
          boxSizing: 'border-box',
          padding: '20px 22px 120px',
        }}
      >
        <div style={{ color: '#9a9186', fontSize: 12.5, fontWeight: 600, marginBottom: 14 }}>
          {loading ? 'Carregando…' : filtered.length === 1 ? '1 lugar' : `${filtered.length} lugares`}
        </div>

        {loading && Array.from({ length: 3 }).map((_, i) => <PlaceCardSkeleton key={i} />)}

        {!loading && filtered.map((place) => (
          <PlaceCard key={place.id} place={place} onAction={() => navigate(`/lugares/${place.id}`)} />
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
