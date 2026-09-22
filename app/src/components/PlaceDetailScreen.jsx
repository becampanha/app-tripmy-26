import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import places from '../data/places.json';

function BackIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#1c1a17" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
      <path d="M15 18l-6-6 6-6" />
    </svg>
  );
}

export default function PlaceDetailScreen() {
  const { id } = useParams();
  const navigate = useNavigate();
  const place = places.find((p) => p.id === id);
  const [photoIndex, setPhotoIndex] = useState(0);

  if (!place) {
    return (
      <div style={{ padding: 40, textAlign: 'center', color: '#9a9186' }}>
        Lugar não encontrado.
      </div>
    );
  }

  const photos = place.dishPhotos && place.dishPhotos.length > 0 ? place.dishPhotos : place.photo ? [place.photo] : [];

  const goToPhoto = (delta) => {
    if (photos.length === 0) return;
    setPhotoIndex((i) => (i + delta + photos.length) % photos.length);
  };

  return (
    <div style={{ position: 'relative', width: '100%', minHeight: '100dvh', background: '#f7f5f1', boxSizing: 'border-box', paddingBottom: 40 }}>
      <div style={{ position: 'relative', width: '100%', height: 320, background: '#eee9df', overflow: 'hidden' }}>
        {photos.length > 0 && (
          <img
            src={photos[photoIndex]}
            alt=""
            style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
          />
        )}

        {/* Zonas de clique para navegar o carrossel: esquerda volta, direita avança, com loop */}
        {photos.length > 1 && (
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

        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: 'linear-gradient(to bottom, rgba(0,0,0,0.35) 0%, rgba(0,0,0,0) 22%)',
            pointerEvents: 'none',
          }}
        />

        <div
          onClick={() => navigate(-1)}
          style={{
            position: 'absolute',
            top: 18,
            left: 18,
            width: 38,
            height: 38,
            borderRadius: 19,
            background: 'rgba(255,255,255,0.92)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            boxShadow: '0 4px 12px rgba(28,26,23,0.18)',
            zIndex: 2,
          }}
        >
          <BackIcon />
        </div>

        {photos.length > 1 && (
          <div
            style={{
              position: 'absolute',
              bottom: 14,
              left: 0,
              right: 0,
              display: 'flex',
              justifyContent: 'center',
              gap: 6,
              zIndex: 2,
              pointerEvents: 'none',
            }}
          >
            {photos.map((_, i) => (
              <div
                key={i}
                style={{
                  width: i === photoIndex ? 18 : 6,
                  height: 6,
                  borderRadius: 3,
                  background: i === photoIndex ? '#fff' : 'rgba(255,255,255,0.5)',
                  transition: 'width .2s',
                }}
              />
            ))}
          </div>
        )}
      </div>

      <div style={{ padding: '20px 22px' }}>
        <div
          style={{
            display: 'inline-block',
            padding: '4px 10px',
            borderRadius: 8,
            background: 'rgba(28,26,23,0.72)',
            color: '#fff',
            fontSize: 12,
            fontWeight: 700,
            marginBottom: 10,
          }}
        >
          {place.tag || place.category}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {place.photo && (
            <div
              style={{
                width: 44,
                height: 44,
                borderRadius: 12,
                flex: 'none',
                overflow: 'hidden',
                background: '#eee9df',
              }}
            >
              <img
                src={place.photo}
                alt=""
                style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
              />
            </div>
          )}
          <div style={{ minWidth: 0 }}>
            <div style={{ color: '#1c1a17', fontSize: 22, fontWeight: 800, lineHeight: 1.2 }}>
              {place.name}
            </div>
            <div style={{ color: '#9a9186', fontSize: 13, fontWeight: 500, marginTop: 3, lineHeight: 1.3 }}>
              {place.address}
            </div>
          </div>
        </div>

        {(place.reviewLabel || place.cost != null || place.distanceFromHotel != null || place.hours) && (
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: 10,
              marginTop: 16,
            }}
          >
            {place.reviewLabel && <InfoPill label={place.reviewLabel} />}
            {place.cost != null && <InfoPill label={`💵 US$ ${place.cost}`} />}
            {place.distanceFromHotel != null && <InfoPill label={`📍 ${place.distanceFromHotel} km do hotel`} />}
            {place.hours && <InfoPill label={`🕒 ${place.hours}`} />}
          </div>
        )}

        {place.recommendation && (
          <div
            style={{
              marginTop: 18,
              padding: 14,
              borderRadius: 16,
              background: '#fff',
              boxShadow: '0 2px 10px rgba(28,26,23,0.06)',
            }}
          >
            <div style={{ color: '#9a9186', fontSize: 11.5, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.3 }}>
              Recomendação
            </div>
            <div style={{ color: '#1c1a17', fontSize: 14.5, fontWeight: 600, marginTop: 4, lineHeight: 1.4 }}>
              {place.recommendation}
            </div>
          </div>
        )}

        {place.googleMapsUri && (
          <a
            href={place.googleMapsUri}
            target="_blank"
            rel="noreferrer"
            style={{
              display: 'block',
              marginTop: 16,
              padding: '14px 18px',
              borderRadius: 16,
              background: '#1c1a17',
              color: '#fff',
              fontSize: 14.5,
              fontWeight: 700,
              textAlign: 'center',
              textDecoration: 'none',
            }}
          >
            Ver no Google Maps
          </a>
        )}
      </div>
    </div>
  );
}

function InfoPill({ label }) {
  return (
    <div
      style={{
        padding: '6px 12px',
        borderRadius: 10,
        background: '#fff',
        color: '#1c1a17',
        fontSize: 12.5,
        fontWeight: 700,
        boxShadow: '0 2px 8px rgba(28,26,23,0.06)',
      }}
    >
      {label}
    </div>
  );
}
