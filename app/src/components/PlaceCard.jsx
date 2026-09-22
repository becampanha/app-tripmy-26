import { useState } from 'react';

function shortAddress(address) {
  if (!address) return '';
  return address.split(',')[0].trim();
}

export default function PlaceCard({ place, onAction, actionIcon }) {
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

        {onAction && (
          <div
            onClick={onAction}
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
            {actionIcon || (
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 18l6-6-6-6" />
              </svg>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
