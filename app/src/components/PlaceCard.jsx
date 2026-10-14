import { PointOnMapIcon } from '@solar-icons/react/linear/point-on-map';
import { CheckCircleIcon } from '@solar-icons/react/bold/check-circle';
import { StarIcon } from '@solar-icons/react/bold/star';
import { PhotoCard, Badge, overlay, color } from '../design-system/index.js';
import { TRAVELERS } from '../data/travelers.js';

function shortAddress(address) {
  if (!address) return '';
  return address.split(',')[0].trim();
}

function travelerEmoji(name) {
  return TRAVELERS.find((t) => t.name === name)?.emoji || '';
}

// Favoritos são por viajante (ver place_favorites) — `favoritedBy` é a lista
// de nomes de quem marcou este lugar como favorito, não um boolean único.
export default function PlaceCard({ place, onAction, onToggleFavorite, isFavorite, inItinerary, bottomContent, style }) {
  const facadePhoto = place.photo;
  const dishPhotos = place.dishPhotos || [];
  const favoritedBy = place.favoritedBy || [];

  return (
    <PhotoCard photo={facadePhoto} onClick={onAction} style={style}>
      {onToggleFavorite && (
        <div style={{ position: 'absolute', top: 12, right: 12, zIndex: 3, display: 'flex', alignItems: 'center', gap: 6, pointerEvents: 'none' }}>
          {favoritedBy.length > 0 && (
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 4,
                padding: '4px 10px 4px 8px',
                borderRadius: 7,
                background: overlay.badgeOnPhoto,
                minWidth: 0,
              }}
            >
              <span style={{ color: '#fff', fontSize: 10.5, fontWeight: 700, whiteSpace: 'nowrap' }}>
                Favoritado por {favoritedBy.map(travelerEmoji).join(' ')}
              </span>
            </div>
          )}

          <div
            onClick={(e) => {
              e.stopPropagation();
              onToggleFavorite();
            }}
            style={{
              flex: 'none',
              width: 30,
              height: 30,
              borderRadius: 11,
              background: isFavorite ? color.accent : overlay.badgeOnPhoto,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              pointerEvents: 'auto',
            }}
          >
            <StarIcon size={16} color="#fff" />
          </div>
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
          flexDirection: 'column',
          gap: 10,
          zIndex: 2,
          pointerEvents: bottomContent ? 'auto' : 'none',
        }}
      >
      <div
        style={{
          display: 'flex',
          alignItems: 'flex-end',
          justifyContent: 'space-between',
          gap: 10,
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
                background: color.success,
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
            <div style={{ color: 'rgba(255,255,255,0.92)', fontSize: 12, fontWeight: 600, marginTop: 3, lineHeight: 1.3, textShadow: '0 1px 4px rgba(0,0,0,0.4)', overflowWrap: 'anywhere' }}>
              {place.recommendation}
            </div>
          )}
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 4 }}>
            <PointOnMapIcon size={12} color="rgba(255,255,255,0.82)" />
            <div style={{ color: 'rgba(255,255,255,0.82)', fontSize: 11.5, fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', textShadow: '0 1px 4px rgba(0,0,0,0.35)' }}>
              {shortAddress(place.address)}
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 8 }}>
            <Badge>{place.tag || place.category}</Badge>
            {place.cost != null && <Badge>💵 US$ {place.cost}</Badge>}
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

      {bottomContent}
      </div>
    </PhotoCard>
  );
}
