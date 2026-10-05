import { useEffect, useRef, useState } from 'react';
import { motion } from 'motion/react';
import { AltArrowLeftIcon } from '@solar-icons/react/linear/alt-arrow-left';
import { GpsIcon } from '@solar-icons/react/bold/gps';
import { GlobeIcon } from '@solar-icons/react/bold/globe';
import { useGoogleMaps } from '../hooks/useGoogleMaps.js';
import { useElementHeight } from '../hooks/useElementHeight.js';
import { useGeolocation } from '../hooks/useGeolocation.js';
import { useHidesTabBar } from '../hooks/useEditingState.js';
import { FixedHeader, color, shellMaxWidth, spacing, type } from '../design-system/index.js';

function myLocationElement() {
  const wrapper = document.createElement('div');
  wrapper.style.cssText = 'position:relative;width:18px;height:18px;';
  wrapper.innerHTML = `
    <div style="position:absolute;inset:-6px;border-radius:50%;background:rgba(66,133,244,0.25);"></div>
    <div style="position:absolute;inset:0;border-radius:50%;background:#4285f4;border:3px solid #fff;box-shadow:0 1px 4px rgba(0,0,0,0.4);"></div>
  `;
  return wrapper;
}

function escapeHtml(str) {
  return String(str).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

// Mesmo balão de pino (fundo claro, seta embaixo) do DayMap.jsx — aqui sempre
// "selecionado" (fundo escuro), já que é o único ponto do mapa, sem estado
// de seleção pra alternar.
function pinElement({ label }) {
  const wrapper = document.createElement('div');
  wrapper.style.cssText = 'position:relative;display:flex;flex-direction:column;align-items:center;';
  wrapper.innerHTML = `
    <div style="padding:4px 9px;border-radius:10px;background:${color.dark};box-shadow:0 2px 6px rgba(28,26,23,0.3);white-space:nowrap;font:700 11px/1.3 'Nunito', system-ui, sans-serif;color:#fff;">
      ${escapeHtml(label)}
    </div>
    <div style="width:0;height:0;border-left:5px solid transparent;border-right:5px solid transparent;border-top:6px solid ${color.dark};margin-top:-1px;"></div>
  `;
  return wrapper;
}

// Mapa fullscreen de um único lugar — mesmo padrão técnico/visual do
// DayMap.jsx (Google Maps JS API real, pino balão, GPS, satélite, card fixo
// no rodapé), mas sem DayTabs, carrossel ou traçar rota: não fazem sentido
// com um ponto só. Usado pelo PlaceDetailScreen no lugar do antigo
// MapFullscreen (iframe estático do Maps Embed).
export default function SinglePlaceMap({ coords, name, address, photo, onClose }) {
  useHidesTabBar(true);
  const containerRef = useRef(null);
  const mapRef = useRef(null);
  const markerRef = useRef(null);
  const googleMaps = useGoogleMaps();
  const { ref: headerRef, height: headerHeight } = useElementHeight();
  const { position: myLocation, error: locationError } = useGeolocation();
  const [satellite, setSatellite] = useState(false);

  useEffect(() => {
    if (!googleMaps || !containerRef.current) return;

    const mapId = import.meta.env.VITE_GOOGLE_MAPS_MAP_ID;
    const map = new googleMaps.Map(containerRef.current, {
      disableDefaultUI: true,
      fullscreenControl: false,
      zoomControl: false,
      streetViewControl: false,
      mapTypeControl: false,
      scaleControl: false,
      rotateControl: false,
      keyboardShortcuts: false,
      center: { lat: coords.lat, lng: coords.lng },
      zoom: 16,
      ...(mapId ? { mapId } : {}),
    });
    mapRef.current = map;

    const AdvancedMarker = mapId ? googleMaps.marker?.AdvancedMarkerElement : null;

    if (myLocation && AdvancedMarker) {
      new AdvancedMarker({
        map,
        position: myLocation,
        content: myLocationElement(),
        anchorLeft: '-50%',
        anchorTop: '-50%',
        collisionBehavior: googleMaps.CollisionBehavior.REQUIRED,
      });
    } else if (myLocation) {
      new googleMaps.Marker({
        map,
        position: myLocation,
        icon: {
          path: googleMaps.SymbolPath.CIRCLE,
          scale: 8,
          fillColor: '#4285f4',
          fillOpacity: 1,
          strokeColor: '#fff',
          strokeWeight: 3,
        },
      });
    }

    if (AdvancedMarker) {
      markerRef.current = new AdvancedMarker({
        map,
        position: { lat: coords.lat, lng: coords.lng },
        content: pinElement({ label: name }),
        collisionBehavior: googleMaps.CollisionBehavior.REQUIRED,
      });
    } else {
      markerRef.current = new googleMaps.Marker({ map, position: { lat: coords.lat, lng: coords.lng }, title: name });
    }

    return () => {
      if (markerRef.current) {
        markerRef.current.map = null;
        markerRef.current.setMap?.(null);
      }
      mapRef.current = null;
    };
    // !!myLocation (não o objeto inteiro): watchPosition emite um novo
    // objeto a cada pequena variação de GPS — recriar o mapa a cada tick
    // seria pesado; só precisa recriar uma vez, quando a localização resolve
    // pela primeira vez, pra desenhar o pino "você está aqui".
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [googleMaps, coords.lat, coords.lng, !!myLocation]);

  useEffect(() => {
    if (!mapRef.current) return;
    mapRef.current.setMapTypeId(satellite ? 'hybrid' : 'roadmap');
  }, [satellite]);

  return (
    <div
      className="allow-native-touch"
      style={{
        position: 'fixed',
        top: 0,
        bottom: 0,
        left: 0,
        right: 0,
        marginInline: 'auto',
        width: '100%',
        maxWidth: shellMaxWidth,
        zIndex: 50,
        overflow: 'hidden',
      }}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.98 }}
        transition={{ duration: 0.2, ease: [0.32, 0.72, 0, 1] }}
        style={{ position: 'absolute', inset: 0, background: color.surfaceMuted }}
      >
        <div ref={containerRef} style={{ position: 'absolute', inset: 0, zIndex: 0 }} />

        {!googleMaps && (
          <div
            style={{
              position: 'absolute',
              inset: 0,
              zIndex: 5,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: color.surfaceMuted,
              color: color.muted,
              fontSize: 13.5,
              fontWeight: 600,
            }}
          >
            Carregando mapa…
          </div>
        )}

        <FixedHeader
          headerRef={headerRef}
          title={name}
          titleSize="compact"
          scrollY={9}
          left={
            <div
              onClick={onClose}
              style={{
                width: 38,
                height: 38,
                borderRadius: 13,
                background: color.surfaceMuted,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
              }}
            >
              <AltArrowLeftIcon size={19} color={color.dark} />
            </div>
          }
        />

        {(myLocation || locationError) && (
          <div
            onClick={() => {
              if (locationError) {
                alert(`Localização indisponível: ${locationError.message}`);
                return;
              }
              if (!mapRef.current) return;
              mapRef.current.panTo(myLocation);
              mapRef.current.setZoom(15);
            }}
            style={{
              position: 'absolute',
              top: headerHeight + 16,
              right: 18,
              zIndex: 8,
              width: 38,
              height: 38,
              borderRadius: 13,
              background: 'rgba(255,255,255,0.85)',
              backdropFilter: 'blur(10px)',
              WebkitBackdropFilter: 'blur(10px)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              border: `1px solid ${color.border}`,
              boxShadow: '0 2px 10px rgba(28,26,23,0.15)',
              opacity: locationError ? 0.4 : 1,
            }}
          >
            <GpsIcon size={18} color={color.dark} />
          </div>
        )}

        <div
          onClick={() => setSatellite((v) => !v)}
          style={{
            position: 'absolute',
            top: headerHeight + 62,
            right: 18,
            zIndex: 8,
            width: 38,
            height: 38,
            borderRadius: 13,
            background: satellite ? color.dark : 'rgba(255,255,255,0.85)',
            backdropFilter: 'blur(10px)',
            WebkitBackdropFilter: 'blur(10px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            border: satellite ? 'none' : `1px solid ${color.border}`,
            boxShadow: '0 2px 10px rgba(28,26,23,0.15)',
          }}
        >
          <GlobeIcon size={18} color={satellite ? '#fff' : color.dark} />
        </div>

        <div
          style={{
            position: 'absolute',
            left: 14,
            right: 14,
            bottom: 20,
            display: 'flex',
            alignItems: 'center',
            gap: spacing.gapLg,
            padding: 10,
            borderRadius: 18,
            background: 'rgba(255,255,255,0.9)',
            backdropFilter: 'blur(14px)',
            WebkitBackdropFilter: 'blur(14px)',
            boxShadow: '0 8px 24px rgba(28,26,23,0.22)',
            zIndex: 10,
          }}
        >
          <div style={{ width: 46, height: 46, borderRadius: 12, flex: 'none', overflow: 'hidden', background: color.surfaceMuted }}>
            {photo && <img src={photo} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ color: color.dark, fontSize: 14, fontWeight: 800, lineHeight: 1.2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {name}
            </div>
            <div style={{ color: color.muted, fontSize: 12, fontWeight: 500, marginTop: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {address}
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
