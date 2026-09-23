import { useEffect, useMemo, useState } from 'react';
import { CloseIcon } from '@solar-icons/react/linear/close';
import PlaceCard from './PlaceCard.jsx';
import { fetchPlaces } from '../api/itineraryApi.js';
import { CATEGORY_ICON_MAP } from '../data/placeTags.js';
import { useDragScroll } from '../hooks/useDragScroll.js';

const CATEGORIES = ['Restaurante', 'Mercado', 'Loja', 'Parque', 'Hotel', 'Aeroporto', 'Outro'];

export default function PlaceSelectorModal({ onSelect, onClose }) {
  const [places, setPlaces] = useState([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState(CATEGORIES[0]);
  const { scrollerRef, dragRef, dragHandlers } = useDragScroll();

  useEffect(() => {
    fetchPlaces()
      .then(setPlaces)
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => places.filter((p) => p.category === category), [places, category]);

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
          padding: '20px 22px 60px',
        }}
      >
        <div style={{ color: '#9a9186', fontSize: 12.5, fontWeight: 600, marginBottom: 14 }}>
          {loading ? 'Carregando…' : filtered.length === 1 ? '1 lugar' : `${filtered.length} lugares`}
        </div>

        {filtered.map((place) => (
          <PlaceCard
            key={place.id}
            place={place}
            onAction={() => onSelect(place)}
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
