import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'motion/react';
import useEmblaCarousel from 'embla-carousel-react';
import { AltArrowLeftIcon } from '@solar-icons/react/linear/alt-arrow-left';
import { RouteIcon } from '@solar-icons/react/bold/route';
import { GpsIcon } from '@solar-icons/react/bold/gps';
import { MagnifierZoomInIcon } from '@solar-icons/react/bold/magnifier-zoom-in';
import { AltArrowRightIcon } from '@solar-icons/react/linear/alt-arrow-right';
import AttractionCard from '../components/AttractionCard.jsx';
import HScrollTabs from './HScrollTabs.jsx';
import FixedHeader from './FixedHeader.jsx';
import { useAttractionLocations } from '../hooks/useAttractionLocations.js';
import { useElementHeight } from '../hooks/useElementHeight.js';
import { useGeolocation } from '../hooks/useGeolocation.js';
import { useHidesTabBar } from '../hooks/useEditingState.js';
import { PARK_ICON_MAP } from '../data/parkIcons.js';
import { color, shellMaxWidth, spacing } from './tokens.js';

// Mapa fullscreen de um parque — mesma estrutura/interação do mapa do dia
// (DayMap.jsx): navbar real com abas (aqui, de PARQUES em vez de dias),
// pino "você está aqui" + botão de GPS, carrossel de atrações no rodapé
// (arrastar troca de pino/centraliza), seleção automática do primeiro item.
// Continua em Leaflet + OpenStreetMap (não Google Maps como o DayMap), por
// isso mantém as 3 features que só faziam sentido aqui: badge de atração
// obrigatória no pino, fila ao vivo no pino, e rota sugerida do parque
// inteiro (linha reta — OSM não tem as trilhas internas dos parques).
function escapeHtml(str) {
  return String(str).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

function pinHtml({ label, required, isSelected }) {
  const bg = isSelected ? color.dark : '#fff';
  const fg = isSelected ? '#fff' : color.dark;
  const arrowColor = isSelected ? color.dark : '#fff';
  const checkBadge = required
    ? `<div style="position:absolute;top:-6px;right:-6px;width:16px;height:16px;border-radius:8px;background:${color.success};border:2px solid #fff;display:flex;align-items:center;justify-content:center;">
         <svg width="8" height="8" viewBox="0 0 24 24" fill="none"><path d="M5 13l4 4L19 7" stroke="#fff" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/></svg>
       </div>`
    : '';
  return `
    <div style="position:relative;display:inline-block;transform:translate(-50%,-100%);">
      <div style="position:relative;display:flex;flex-direction:column;align-items:center;">
        <div style="padding:4px 9px;border-radius:10px;background:${bg};box-shadow:0 2px 6px rgba(28,26,23,0.3);white-space:nowrap;font:700 11px/1.3 'Nunito', system-ui, sans-serif;color:${fg};">
          ${escapeHtml(label)}
        </div>
        <div style="width:0;height:0;border-left:5px solid transparent;border-right:5px solid transparent;border-top:6px solid ${arrowColor};margin-top:-1px;"></div>
        ${checkBadge}
      </div>
    </div>
  `;
}

function myLocationHtml() {
  return `
    <div style="position:relative;width:18px;height:18px;transform:translate(-50%,-50%);">
      <div style="position:absolute;inset:-6px;border-radius:50%;background:rgba(66,133,244,0.25);"></div>
      <div style="position:absolute;inset:0;border-radius:50%;background:#4285f4;border:3px solid #fff;box-shadow:0 1px 4px rgba(0,0,0,0.4);"></div>
    </div>
  `;
}

export default function ParkMap({ parks, selectedPark, onSelectPark, onClose, getLiveQueue }) {
  useHidesTabBar(true);
  const navigate = useNavigate();
  const containerRef = useRef(null);
  const mapRef = useRef(null);
  const markersRef = useRef(new Map());
  const myLocationMarkerRef = useRef(null);
  const routeLayerRef = useRef(null);
  const decoratorRef = useRef(null);
  const { ref: headerRef, height: headerHeight } = useElementHeight();
  const { position: myLocation, error: locationError } = useGeolocation();
  const [leaflet, setLeaflet] = useState(null);
  const [decoratorReady, setDecoratorReady] = useState(false);
  const [selected, setSelected] = useState(null);
  const [showRoute, setShowRoute] = useState(false);
  const selectingFromMapRef = useRef(false);
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: false, align: 'center', containScroll: 'trimSnaps' });

  const park = parks[selectedPark];
  const { getLocation, loading, ready } = useAttractionLocations(park.id);

  const allAttractions = park.areas.flatMap((a) => a.attractions);
  const pins = ready
    ? allAttractions
        .map((attraction) => ({ attraction, coords: getLocation(attraction.name) }))
        .filter((p) => p.coords)
    : [];

  // Sequência sugerida (ver park_strategies.route), filtrada só para o que
  // de fato tem coordenada — nomes que não casarem (mesmo problema de nomes
  // compostos já visto na fila ao vivo) simplesmente ficam de fora da rota.
  const routeCoords = ready && park.route
    ? park.route.map((name) => getLocation(name)).filter(Boolean)
    : [];

  useEffect(() => {
    let cancelled = false;
    Promise.all([import('leaflet'), import('leaflet-polylinedecorator')]).then(([mod]) => {
      if (!cancelled) {
        setLeaflet(mod.default || mod);
        setDecoratorReady(true);
      }
    });
    return () => {
      cancelled = true;
    };
  }, []);

  // Arrastar o carrossel troca o pino selecionado (preto no mapa) e
  // centraliza suavemente nele — só quando a mudança veio do próprio
  // arrasto, não de um setView disparado por clique no pino.
  useEffect(() => {
    if (!emblaApi) return;
    const onSelect = () => {
      if (selectingFromMapRef.current) {
        selectingFromMapRef.current = false;
        return;
      }
      const pin = pins[emblaApi.selectedScrollSnap()];
      if (!pin) return;
      setSelected(pin.attraction);
      mapRef.current?.panTo([pin.coords.lat, pin.coords.lng]);
    };
    emblaApi.on('select', onSelect);
    return () => emblaApi.off('select', onSelect);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [emblaApi, pins.length]);

  // Clicar um pino no mapa faz o carrossel pular pro card correspondente,
  // sem animação de arrasto (jump: true) — já que o usuário não arrastou.
  const selectPin = useCallback(
    (attraction) => {
      setSelected(attraction);
      const index = pins.findIndex((p) => p.attraction.id === attraction.id);
      if (index >= 0 && emblaApi) {
        selectingFromMapRef.current = true;
        emblaApi.scrollTo(index, true);
      }
    },
    [pins, emblaApi]
  );
  const selectPinRef = useRef(selectPin);
  useEffect(() => {
    selectPinRef.current = selectPin;
  }, [selectPin]);

  useEffect(() => {
    if (!leaflet || !containerRef.current || pins.length === 0) return;

    const map = leaflet.map(containerRef.current, {
      zoomControl: false,
      attributionControl: false,
    });
    mapRef.current = map;
    map.on('click', () => setSelected(null));

    leaflet
      .tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19 })
      .addTo(map);

    const bounds = leaflet.latLngBounds(pins.map((p) => [p.coords.lat, p.coords.lng]));
    if (myLocation) bounds.extend([myLocation.lat, myLocation.lng]);
    map.fitBounds(bounds, { paddingTopLeft: [32, (headerHeight || 80) + 16], paddingBottomRight: [32, 260] });

    if (myLocation) {
      const icon = leaflet.divIcon({ className: '', html: myLocationHtml(), iconSize: [0, 0], iconAnchor: [0, 0] });
      myLocationMarkerRef.current = leaflet.marker([myLocation.lat, myLocation.lng], { icon, zIndexOffset: 1000 }).addTo(map);
    }

    for (const pin of pins) {
      const liveQueue = getLiveQueue?.(pin.attraction.name);
      const queueLabel = typeof liveQueue === 'number' ? `${liveQueue} min` : pin.attraction.queue;
      const label = queueLabel || pin.attraction.name;

      const icon = leaflet.divIcon({
        className: '',
        html: pinHtml({ label, required: pin.attraction.required, isSelected: false }),
        // iconSize null + posicionamento via CSS (não iconAnchor em px
        // fixo): o balão muda de largura conforme o texto ("5 min" vs
        // "Sem fila"), e um anchor fixo desalinharia a ponta do balão do
        // ponto real no mapa.
        iconSize: [0, 0],
        iconAnchor: [0, 0],
      });

      const marker = leaflet
        .marker([pin.coords.lat, pin.coords.lng], { icon })
        .addTo(map)
        .on('click', (e) => {
          leaflet.DomEvent.stopPropagation(e);
          selectPinRef.current(pin.attraction);
        });

      markersRef.current.set(pin.attraction.id, { marker, label, required: pin.attraction.required });
    }

    return () => {
      map.remove();
      mapRef.current = null;
      markersRef.current.clear();
      myLocationMarkerRef.current = null;
    };
    // selectedPark nas deps: força recriar o mapa inteiro ao trocar de
    // parque pela navbar. !!myLocation (não o objeto inteiro) — mesmo
    // motivo do DayMap: watchPosition emite muito, só recriar na transição
    // "ainda não sei onde você está" -> "localização resolvida".
  }, [leaflet, selectedPark, pins.length, !!myLocation]);

  // Redesenha só o pino selecionado (fundo preto) e o anterior (de volta ao
  // branco) — não recria o mapa inteiro, só troca o ícone dos dois marcadores.
  useEffect(() => {
    if (!leaflet) return;
    for (const [id, entry] of markersRef.current) {
      const isSelected = selected?.id === id;
      entry.marker.setIcon(
        leaflet.divIcon({
          className: '',
          html: pinHtml({ label: entry.label, required: entry.required, isSelected }),
          iconSize: [0, 0],
          iconAnchor: [0, 0],
        })
      );
    }
  }, [selected, leaflet]);

  // Desenha/remove a linha da rota sugerida + setas de direção conforme o
  // toggle. leaflet-polylinedecorator estende L.Polyline por efeito
  // colateral (não exporta nada próprio), por isso só precisa estar
  // importado — não usamos o retorno do import. Linha reta entre os pontos:
  // já tentamos seguir ruas reais via OSRM, mas o OpenStreetMap não tem as
  // trilhas internas de parques privados mapeadas — o serviço só achava
  // ruas de acesso/serviço nas redondezas, o que ficava pior que a reta
  // (passava confiança de precisão que os dados não sustentam).
  useEffect(() => {
    if (!leaflet || !decoratorReady || !mapRef.current) return;
    const map = mapRef.current;

    if (routeLayerRef.current) {
      routeLayerRef.current.forEach((layer) => map.removeLayer(layer));
      routeLayerRef.current = null;
    }
    if (decoratorRef.current) {
      map.removeLayer(decoratorRef.current);
      decoratorRef.current = null;
    }

    if (!showRoute || routeCoords.length < 2) return;

    const latLngs = routeCoords.map((c) => [c.lat, c.lng]);
    const outline = leaflet
      .polyline(latLngs, { color: '#fff', weight: 9, opacity: 1, lineCap: 'round', lineJoin: 'round' })
      .addTo(map);
    const line = leaflet
      .polyline(latLngs, { color: color.dark, weight: 5, opacity: 1, lineCap: 'round', lineJoin: 'round' })
      .addTo(map);
    routeLayerRef.current = [outline, line];

    decoratorRef.current = leaflet
      .polylineDecorator(line, {
        patterns: [
          {
            offset: '4%',
            repeat: '10%',
            symbol: leaflet.Symbol.arrowHead({
              pixelSize: 10,
              pathOptions: { color: '#fff', fillOpacity: 1, weight: 0 },
            }),
          },
        ],
      })
      .addTo(map);
  }, [showRoute, routeCoords.length, leaflet, decoratorReady]);

  // Entrar no mapa (ou trocar de parque pela navbar) sempre seleciona a
  // primeira atração automaticamente — o card inferior nunca deve aparecer
  // vazio/sem nada selecionado.
  useEffect(() => {
    setSelected(pins[0]?.attraction || null);
    emblaApi?.reInit();
    emblaApi?.scrollTo(0, true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedPark, pins.length, emblaApi]);

  const tabItems = parks.map((p, i) => {
    const mapped = PARK_ICON_MAP[p.name];
    return { key: i, label: p.name, icon: mapped?.icon, iconColor: mapped?.color };
  });

  return (
    <div
      className="allow-native-touch"
      style={{
        position: 'fixed',
        top: 0,
        bottom: 0,
        left: '50%',
        transform: 'translateX(-50%)',
        width: '100%',
        maxWidth: shellMaxWidth,
        zIndex: 40,
        overflow: 'hidden',
      }}
    >
      {/* Wrapper motion separado da div de posicionamento externo (que usa
          transform: translateX(-50%) pra centralizar) — mesma razão do
          WelcomeScreen: animar aqui evita que o Framer sobrescreva esse
          transform com o seu próprio. */}
      <motion.div
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.98 }}
        transition={{ duration: 0.2, ease: [0.32, 0.72, 0, 1] }}
        style={{ position: 'absolute', inset: 0, background: color.surfaceMuted }}
      >
      <div ref={containerRef} style={{ position: 'absolute', inset: 0, zIndex: 0 }} />

      {(loading || !leaflet) && (
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

      {ready && !loading && pins.length === 0 && (
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
          Não encontramos a localização das atrações deste parque.
        </div>
      )}

      <FixedHeader
        headerRef={headerRef}
        title={park.name}
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
            activeKey={selectedPark}
            onSelect={onSelectPark}
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
            mapRef.current.setView([myLocation.lat, myLocation.lng], 18);
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
            // locationError (sem geolocalização): botão continua visível,
            // mas esmaecido — toca e mostra o motivo em vez de simplesmente
            // sumir sem explicação.
            opacity: locationError ? 0.4 : 1,
          }}
        >
          <GpsIcon size={18} color={color.dark} />
        </div>
      )}

      {routeCoords.length >= 2 && (
        <div
          onClick={() => setShowRoute((v) => !v)}
          style={{
            position: 'absolute',
            top: headerHeight + 62,
            right: 18,
            zIndex: 8,
            width: 38,
            height: 38,
            borderRadius: 13,
            background: showRoute ? color.dark : 'rgba(255,255,255,0.85)',
            backdropFilter: 'blur(10px)',
            WebkitBackdropFilter: 'blur(10px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            border: showRoute ? 'none' : `1px solid ${color.border}`,
            boxShadow: '0 2px 10px rgba(28,26,23,0.15)',
          }}
        >
          <RouteIcon size={18} color={showRoute ? '#fff' : color.dark} />
        </div>
      )}

      <AnimatePresence>
        {selected && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 16 }}
            transition={{ duration: 0.18, ease: [0.32, 0.72, 0, 1] }}
            style={{
              position: 'absolute',
              left: 0,
              right: 0,
              bottom: 14,
              zIndex: 10,
            }}
          >
            {/* Carrossel horizontal: arrastar troca de card/pin, igual ao
                mapa do roteiro — mesma lib (embla-carousel-react). Slide com
                88% da largura (peek do próximo/anterior) só quando há mais
                de uma atração. */}
            <div ref={emblaRef} style={{ overflow: 'hidden' }}>
              <div style={{ display: 'flex' }}>
                {pins.map((pin) => (
                  <div
                    key={pin.attraction.id}
                    style={{
                      flex: pins.length > 1 ? '0 0 88%' : '0 0 100%',
                      minWidth: 0,
                      padding: '0 8px',
                      boxSizing: 'border-box',
                      display: 'flex',
                    }}
                  >
                    <AttractionCard
                      attraction={pin.attraction}
                      liveQueue={getLiveQueue?.(pin.attraction.name)}
                      disableNavigate
                      bottomContent={
                        <div style={{ display: 'flex', gap: spacing.gapMd, marginTop: spacing.gapMd }}>
                          <div
                            onClick={(e) => {
                              e.stopPropagation();
                              if (!mapRef.current) return;
                              mapRef.current.setView([pin.coords.lat, pin.coords.lng], 18);
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
                            <span style={{ color: '#fff', fontSize: 13.5, fontWeight: 700 }}>Centralizar</span>
                          </div>
                          <div
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate(`/atracoes/${pin.attraction.id}`);
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
                            <span style={{ color: '#fff', fontSize: 13.5, fontWeight: 700 }}>Detalhes</span>
                          </div>
                        </div>
                      }
                      style={{ flex: 1, height: '100%' }}
                    />
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      </motion.div>
    </div>
  );
}
