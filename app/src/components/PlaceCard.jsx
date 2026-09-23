import { PointOnMapIcon } from '@solar-icons/react/linear/point-on-map';
import { CheckCircleIcon } from '@solar-icons/react/bold/check-circle';

function shortAddress(address) {
  if (!address) return '';
  return address.split(',')[0].trim();
}

export default function PlaceCard({ place, onAction, inItinerary }) {
  const facadePhoto = place.photo;
  const dishPhotos = place.dishPhotos || [];

  return (
    <div
      onClick={onAction}
      style={{
        position: 'relative',
        height: 300,
        marginBottom: 16,
        borderRadius: 20,
        overflow: 'hidden',
        background: '#eee9df',
        cursor: onAction ? 'pointer' : 'default',
      }}
    >
      {facadePhoto && (
        <img
          src={facadePhoto}
          alt=""
          loading="lazy"
          decoding="async"
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }}
        />
      )}

      <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.06)', pointerEvents: 'none' }} />

      <div
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          bottom: 0,
          height: '55%',
          background: 'linear-gradient(to top, rgba(0,0,0,0.72) 0%, rgba(0,0,0,0) 100%)',
          pointerEvents: 'none',
        }}
      />

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

      {place.cost != null && (
        <div
          style={{
            position: 'absolute',
            top: 12,
            right: 12,
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
          💵 US$ {place.cost}
        </div>
      )}

      {/* Informações soltas sobre o gradiente, sem card/fundo próprio */}
      <div
        style={{
          position: 'absolute',
          left: 14,
          right: 14,
          bottom: 12,
          display: 'flex',
          alignItems: 'flex-end',
          justifyContent: 'space-between',
          gap: 10,
          zIndex: 2,
          pointerEvents: 'none',
        }}
      >
        <div style={{ flex: 1, minWidth: 0 }}>
          {inItinerary && (
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 4,
                padding: '3px 8px 3px 6px',
                borderRadius: 7,
                background: '#3fa35a',
                marginBottom: 5,
              }}
            >
              <CheckCircleIcon size={12} color="#fff" />
              <span style={{ color: '#fff', fontSize: 10.5, fontWeight: 700 }}>Está no roteiro</span>
            </div>
          )}
          <div style={{ color: '#fff', fontSize: 14.5, fontWeight: 800, lineHeight: 1.2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', textShadow: '0 1px 4px rgba(0,0,0,0.35)' }}>
            {place.name}
          </div>
          {place.recommendation && (
            <div style={{ color: 'rgba(255,255,255,0.92)', fontSize: 12, fontWeight: 600, marginTop: 3, lineHeight: 1.3, textShadow: '0 1px 4px rgba(0,0,0,0.4)' }}>
              {place.recommendation}
            </div>
          )}
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 4 }}>
            <PointOnMapIcon size={12} color="rgba(255,255,255,0.82)" />
            <div style={{ color: 'rgba(255,255,255,0.82)', fontSize: 11.5, fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', textShadow: '0 1px 4px rgba(0,0,0,0.35)' }}>
              {shortAddress(place.address)}
            </div>
          </div>
        </div>

        {dishPhotos.length > 0 && (
          <div style={{ display: 'flex', flex: 'none' }}>
            {dishPhotos.map((src, i) => (
              <div
                key={i}
                style={{
                  width: 58,
                  height: 58,
                  borderRadius: 15,
                  flex: 'none',
                  overflow: 'hidden',
                  border: '3.5px solid rgba(255,255,255,0.92)',
                  boxShadow: '5px 0 10px rgba(0,0,0,0.28)',
                  marginLeft: i === 0 ? 0 : -12,
                  zIndex: dishPhotos.length - i,
                }}
              >
                <img
                  src={src}
                  alt=""
                  loading="lazy"
                  style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
