import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { AltArrowLeftIcon } from '@solar-icons/react/linear/alt-arrow-left';
import { GpsIcon } from '@solar-icons/react/bold/gps';
import { GlobeIcon } from '@solar-icons/react/bold/globe';
import { AltArrowRightIcon } from '@solar-icons/react/linear/alt-arrow-right';
import { MagnifierZoomInIcon } from '@solar-icons/react/bold/magnifier-zoom-in';
import PlaceCard from './PlaceCard.jsx';
import { CATEGORY_ICON_MAP } from '../data/placeTags.js';
import { useAddressesLocations } from '../hooks/useAddressesLocations.js';
import { useGoogleMaps } from '../hooks/useGoogleMaps.js';
import { useElementHeight } from '../hooks/useElementHeight.js';
import { useGeolocation } from '../hooks/useGeolocation.js';
import { useHidesTabBar } from '../hooks/useEditingState.js';
import { usePlacesInItinerary } from '../hooks/usePlacesInItinerary.js';
import { FixedHeader, HScrollTabs, color, shellMaxWidth, spacing, type } from '../design-system/index.js';

const CATEGORIES = ['Restaurante', 'Mercado', 'Centros', 'Outlets', 'Shopping', 'Loja', 'Parque', 'Hotel', 'Aeroporto', 'Outro'];

const CATEGORY_LABELS = {
  Restaurante: 'Restaurantes',
  Mercado: 'Mercados',
  Centros: 'Centros',
  Outlets: 'Outlets',
  Shopping: 'Shopping',
  Loja: 'Lojas',
  Parque: 'Parques',
  Hotel: 'Hotéis',
  Aeroporto: 'Aeroportos',
  Outro: 'Outros',
};

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

// Mesmo balão de pino do DayMap.jsx (fundo claro/escuro conforme seleção,
// seta embaixo) — aqui o texto é o nome do lugar.
function pinElement({ label, isSelected }) {
  const bg = isSelected ? color.dark : '#fff';
  const fg = isSelected ? '#fff' : color.dark;
  const arrowColor = isSelected ? color.dark : '#fff';
  const wrapper = document.createElement('div');
  wrapper.style.cssText = 'position:relative;display:flex;flex-direction:column;align-items:center;';
  wrapper.innerHTML = `
    <div style="padding:4px 9px;border-radius:10px;background:${bg};box-shadow:0 2px 6px rgba(28,26,23,0.3);white-space:nowrap;font:700 11px/1.3 'Nunito', system-ui, sans-serif;color:${fg};">
      ${escapeHtml(label)}
    </div>
    <div style="width:0;height:0;border-left:5px solid transparent;border-right:5px solid transparent;border-top:6px solid ${arrowColor};margin-top:-1px;"></div>
  `;
  return wrapper;
}

// Mapa fullscreen de Lugares — mesmo padrão técnico/visual do DayMap.jsx
// (Google Maps JS API real, pino balão, fit bounds automático, GPS,
// satélite, card da seleção fixo no rodapé), adaptado para a tela de
// Lugares: as abas no header filtram por categoria (igual PlacesScreen,
// mas independentes dela — não herdam subcategoria/busca/toggle "no
// roteiro" da lista), um pino por lugar da categoria ativa, sem
// carrossel nem traçar rota (não fazem sentido sem um roteiro de dia).
export default function PlacesMap({ places, onClose }) {
  useHidesTabBar(true);
  const navigate = useNavigate();
  const containerRef = useRef(null);
  const mapRef = useRef(null);
  const markersRef = useRef(new Map());
  const googleMaps = useGoogleMaps();
  const { ref: headerRef, height: headerHeight } = useElementHeight();
  const { position: myLocation, error: locationError } = useGeolocation();
  const placesInItinerary = usePlacesInItinerary();
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [selected, setSelected] = useState(null);
  const [satellite, setSatellite] = useState(false);

  const placesInCategory = places.filter((p) => p.category === category);
  const uniqueAddresses = [...new Set(placesInCategory.filter((p) => p.address).map((p) => p.address))];
  const { byAddress, loading } = useAddressesLocations(uniqueAddresses);

  const pins = placesInCategory
    .map((place) => ({ place, coords: byAddress.get(place.address) }))
    .filter((p) => p.coords);

  const ready = !loading;

  const countByCategory = {};
  for (const p of places) countByCategory[p.category] = (countByCategory[p.category] || 0) + 1;
  const tabItems = CATEGORIES.map((cat) => ({
    key: cat,
    label: CATEGORY_LABELS[cat] || cat,
    icon: CATEGORY_ICON_MAP[cat].icon,
    iconColor: CATEGORY_ICON_MAP[cat].color,
    count: countByCategory[cat],
  }));

  // Clicar um pino no mapa seleciona o lugar correspondente, mostrando seu
  // card no rodapé.
  const selectPinRef = useRef(null);
  useEffect(() => {
    selectPinRef.current = (pin) => setSelected(pin);
  }, []);

  useEffect(() => {
    if (!googleMaps || !containerRef.current || pins.length === 0) return;

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
      ...(mapId ? { mapId } : {}),
    });
    mapRef.current = map;
    map.addListener('click', () => setSelected(null));

    // Bounds considera só os pinos dos lugares, não a localização do usuário
    // — ver mesmo comentário em DayMap.jsx.
    const bounds = new googleMaps.LatLngBounds();
    for (const pin of pins) bounds.extend({ lat: pin.coords.lat, lng: pin.coords.lng });
    map.fitBounds(bounds, { top: (headerHeight || 80) + 16, right: 32, bottom: 260, left: 32 });

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

    for (const pin of pins) {
      let marker;
      if (AdvancedMarker) {
        marker = new AdvancedMarker({
          map,
          position: { lat: pin.coords.lat, lng: pin.coords.lng },
          content: pinElement({ label: pin.place.name, isSelected: false }),
          collisionBehavior: googleMaps.CollisionBehavior.REQUIRED,
        });
        marker.addListener('click', () => selectPinRef.current(pin));
      } else {
        marker = new googleMaps.Marker({ map, position: { lat: pin.coords.lat, lng: pin.coords.lng }, title: pin.place.name });
        marker.addListener('click', () => selectPinRef.current(pin));
      }
      markersRef.current.set(pin.place.id, { marker, label: pin.place.name, usesAdvanced: !!AdvancedMarker });
    }

    return () => {
      for (const { marker } of markersRef.current.values()) {
        marker.map = null;
        marker.setMap?.(null);
      }
      markersRef.current.clear();
      mapRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [googleMaps, category, pins.length, !!myLocation]);

  useEffect(() => {
    if (!mapRef.current) return;
    mapRef.current.setMapTypeId(satellite ? 'hybrid' : 'roadmap');
  }, [satellite, category, pins.length]);

  // Redesenha só o pino selecionado (fundo preto) e o anterior (de volta ao
  // branco) — mesmo princípio do DayMap.
  useEffect(() => {
    for (const [id, entry] of markersRef.current) {
      if (!entry.usesAdvanced) continue;
      const isSelected = selected?.place.id === id;
      entry.marker.content = pinElement({ label: entry.label, isSelected });
    }
  }, [selected]);

  // Trocar de categoria limpa a seleção — o pino selecionado pertence à
  // categoria anterior.
  useEffect(() => {
    setSelected(null);
  }, [category]);

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
        zIndex: 40,
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

        {(!ready || !googleMaps) && (
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

        {ready && googleMaps && pins.length === 0 && (
          <div
            style={{
              position: 'absolute',
              inset: 0,
              zIndex: 5,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: 32,
              textAlign: 'center',
              background: color.surfaceMuted,
              color: color.muted,
              fontSize: 13.5,
              fontWeight: 600,
            }}
          >
            Não encontramos a localização dos lugares desta categoria.
          </div>
        )}

        <FixedHeader
          headerRef={headerRef}
          title="Lugares no mapa"
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
          tabs={
            <HScrollTabs
              items={tabItems}
              activeKey={category}
              onSelect={setCategory}
              style={{ marginTop: 0, padding: `0 ${spacing.screenGutter}px` }}
            />
          }
        />

        {ready && (myLocation || locationError) && (
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

        {selected && (
          <div
            style={{
              position: 'absolute',
              left: 0,
              right: 0,
              bottom: 14,
              zIndex: 10,
              padding: `0 ${spacing.screenGutter}px`,
              boxSizing: 'border-box',
            }}
          >
            {/* Mesmo padrão do ParkMap/AttractionCard: botões dentro do
                próprio card de foto (via bottomContent), fundo translúcido
                sobre a imagem — não dois blocos separados abaixo. */}
            <PlaceCard
              place={selected.place}
              onAction={() => navigate(`/lugares/${selected.place.id}`)}
              inItinerary={placesInItinerary ? placesInItinerary.has(selected.place.id) : false}
              style={{ height: 220, marginBottom: 0 }}
              bottomContent={
                <div style={{ display: 'flex', gap: spacing.gapMd, marginTop: spacing.gapMd, pointerEvents: 'auto' }}>
                  <div
                    onClick={(e) => {
                      e.stopPropagation();
                      if (!mapRef.current) return;
                      mapRef.current.panTo({ lat: selected.coords.lat, lng: selected.coords.lng });
                      mapRef.current.setZoom(17);
                    }}
                    style={{
                      flex: 1,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 6,
                      padding: 12,
                      borderRadius: 16,
                      background: 'rgba(255,255,255,0.12)',
                      border: '1px solid rgba(255,255,255,0.3)',
                      cursor: 'pointer',
                    }}
                  >
                    <MagnifierZoomInIcon size={15} color="#fff" />
                    <span style={{ color: '#fff', ...type.button }}>Centralizar</span>
                  </div>
                  <div
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(`/lugares/${selected.place.id}`);
                    }}
                    style={{
                      flex: 1,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 6,
                      padding: 12,
                      borderRadius: 16,
                      background: 'rgba(255,255,255,0.12)',
                      border: '1px solid rgba(255,255,255,0.3)',
                      cursor: 'pointer',
                    }}
                  >
                    <AltArrowRightIcon size={15} color="#fff" />
                    <span style={{ color: '#fff', ...type.button }}>Detalhes</span>
                  </div>
                </div>
              }
            />
          </div>
        )}
      </motion.div>
    </div>
  );
}
