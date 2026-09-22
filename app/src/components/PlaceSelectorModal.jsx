import { useEffect, useMemo, useState } from 'react';
import PlaceCard from './PlaceCard.jsx';
import { fetchPlaces } from '../api/itineraryApi.js';

const CATEGORIES = ['Restaurante', 'Mercado', 'Loja', 'Parque', 'Outro'];

function CheckIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 6 9 17l-5-5" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#1c1a17" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 6 6 18" />
      <path d="M6 6l12 12" />
    </svg>
  );
}

export default function PlaceSelectorModal({ onSelect, onClose }) {
  const [places, setPlaces] = useState([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState(CATEGORIES[0]);

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
        inset: 0,
        zIndex: 20,
        background: '#151210',
        overflowY: 'auto',
        boxSizing: 'border-box',
      }}
    >
      <div style={{ padding: '22px 22px 0' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ fontSize: 20, fontWeight: 800, color: '#fff' }}>Selecionar lugar</div>
          <div
            onClick={onClose}
            style={{
              width: 34,
              height: 34,
              borderRadius: 12,
              background: '#fff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
            }}
          >
            <CloseIcon />
          </div>
        </div>

        <div
          style={{
            display: 'flex',
            gap: 8,
            overflowX: 'auto',
            marginTop: 16,
            padding: '2px 2px 6px',
            WebkitOverflowScrolling: 'touch',
          }}
        >
          {CATEGORIES.map((cat) => {
            const active = cat === category;
            return (
              <div
                key={cat}
                onClick={() => setCategory(cat)}
                style={{
                  flex: 'none',
                  padding: '8px 16px',
                  borderRadius: 14,
                  fontSize: 12.5,
                  fontWeight: 700,
                  cursor: 'pointer',
                  userSelect: 'none',
                  background: active ? '#fff' : 'rgba(255,255,255,0.12)',
                  color: active ? '#1c1a17' : 'rgba(255,255,255,0.75)',
                }}
              >
                {cat}
              </div>
            );
          })}
        </div>
      </div>

      <div
        style={{
          marginTop: 18,
          background: '#f7f5f1',
          borderRadius: '28px 28px 0 0',
          minHeight: 'calc(100dvh - 170px)',
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
            actionIcon={<CheckIcon />}
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
