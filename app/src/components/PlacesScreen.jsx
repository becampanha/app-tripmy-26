import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import places from '../data/places.json';

const CATEGORIES = ['Restaurante', 'Mercado', 'Loja', 'Parque', 'Outro'];

export default function PlacesScreen() {
  const [category, setCategory] = useState(CATEGORIES[0]);
  const navigate = useNavigate();

  const filtered = useMemo(() => {
    return places.filter((p) => p.category === category);
  }, [category]);

  return (
    <div style={{ position: 'relative', width: '100%', minHeight: '100dvh', background: '#151210', boxSizing: 'border-box' }}>
      <div style={{ padding: '22px 22px 0' }}>
        <div style={{ fontSize: 12.5, fontWeight: 700, letterSpacing: 0.4, color: 'rgba(255,255,255,0.8)', textTransform: 'uppercase' }}>
          Orlando, Disney
        </div>
        <div style={{ fontSize: 22, fontWeight: 800, marginTop: 3, letterSpacing: -0.2, color: '#fff' }}>
          Lugares
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
          padding: '20px 22px 120px',
        }}
      >
        <div style={{ color: '#9a9186', fontSize: 12.5, fontWeight: 600, marginBottom: 14 }}>
          {filtered.length === 1 ? '1 lugar' : `${filtered.length} lugares`}
        </div>

        {filtered.map((place) => (
          <PlaceCard key={place.id} place={place} onOpen={() => navigate(`/lugares/${place.id}`)} />
        ))}

        {filtered.length === 0 && (
          <div style={{ padding: '30px 0', textAlign: 'center', color: '#b6ae9f', fontSize: 13.5, fontWeight: 600 }}>
            Nenhum lugar encontrado nessa categoria.
          </div>
        )}
      </div>
    </div>
  );
}

function shortAddress(address) {
  if (!address) return '';
  return address.split(',')[0].trim();
}

function PlaceCard({ place, onOpen }) {
  const [photoIndex, setPhotoIndex] = useState(0);
  const backgroundPhotos = [
    ...(place.photo ? [place.photo] : []),
    ...(place.dishPhotos || []),
  ];
  const facadePhoto = place.photo;

  const goToPhoto = (delta) => {
    if (backgroundPhotos.length === 0) return;
    setPhotoIndex((i) => Math.min(Math.max(i + delta, 0), backgroundPhotos.length - 1));
  };

  return (
    <div
      style={{
        position: 'relative',
        height: 300,
        marginBottom: 16,
        borderRadius: 20,
        overflow: 'hidden',
        background: '#eee9df',
        boxShadow: '0 10px 24px rgba(28,26,23,0.16)',
      }}
    >
      {backgroundPhotos[photoIndex] && (
        <img
          src={backgroundPhotos[photoIndex]}
          alt=""
          loading="lazy"
          decoding="async"
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }}
        />
      )}

      {/* Zonas de clique para navegar o carrossel: esquerda volta, direita avança, com loop */}
      {backgroundPhotos.length > 1 && (
        <>
          <div
            onClick={() => goToPhoto(-1)}
            style={{ position: 'absolute', top: 0, bottom: 0, left: 0, width: '50%', zIndex: 1, cursor: 'pointer' }}
          />
          <div
            onClick={() => goToPhoto(1)}
            style={{ position: 'absolute', top: 0, bottom: 0, right: 0, width: '50%', zIndex: 1, cursor: 'pointer' }}
          />
        </>
      )}

      <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.06)', pointerEvents: 'none' }} />

      <div
        style={{
          position: 'absolute',
          top: 12,
          left: 12,
          padding: '3px 9px',
          borderRadius: 8,
          background: 'rgba(28,26,23,0.72)',
          color: '#fff',
          fontSize: 11,
          fontWeight: 700,
          zIndex: 2,
          pointerEvents: 'none',
        }}
      >
        {place.tag || place.category}
      </div>

      {backgroundPhotos.length > 1 && (
        <div
          style={{
            position: 'absolute',
            left: '50%',
            transform: 'translateX(-50%)',
            bottom: 86,
            display: 'flex',
            gap: 4,
            zIndex: 2,
            pointerEvents: 'none',
          }}
        >
          {backgroundPhotos.map((_, i) => (
            <div
              key={i}
              style={{
                width: i === photoIndex ? 14 : 5,
                height: 5,
                borderRadius: 3,
                background: i === photoIndex ? '#fff' : 'rgba(255,255,255,0.5)',
                transition: 'width .2s',
              }}
            />
          ))}
        </div>
      )}

      {/* Cardzinho flutuante com foto do local + nome/endereço, por cima do carrossel */}
      <div
        style={{
          position: 'absolute',
          left: 10,
          right: 10,
          bottom: 10,
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          padding: 10,
          borderRadius: 16,
          background: 'rgba(255,255,255,0.94)',
          backdropFilter: 'blur(8px)',
          WebkitBackdropFilter: 'blur(8px)',
          boxShadow: '0 6px 18px rgba(28,26,23,0.18)',
          zIndex: 2,
        }}
      >
        <div
          style={{
            width: 46,
            height: 46,
            borderRadius: 12,
            flex: 'none',
            overflow: 'hidden',
            background: '#eee9df',
          }}
        >
          {facadePhoto && (
            <img
              src={facadePhoto}
              alt=""
              loading="lazy"
              style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
            />
          )}
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ color: '#1c1a17', fontSize: 14.5, fontWeight: 800, lineHeight: 1.2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {place.name}
          </div>
          <div style={{ color: '#9a9186', fontSize: 11.5, fontWeight: 500, marginTop: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {shortAddress(place.address)}
          </div>
        </div>

        <div
          onClick={onOpen}
          style={{
            flex: 'none',
            width: 34,
            height: 34,
            borderRadius: 12,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: '#1c1a17',
            cursor: 'pointer',
          }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 18l6-6-6-6" />
          </svg>
        </div>
      </div>
    </div>
  );
}
