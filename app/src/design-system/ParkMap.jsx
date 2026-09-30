import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { CloseIcon } from '@solar-icons/react/linear/close';
import { RouteIcon } from '@solar-icons/react/bold/route';
import AttractionCard from '../components/AttractionCard.jsx';
import { useAttractionLocations } from '../hooks/useAttractionLocations.js';
import { useHidesTabBar } from '../hooks/useEditingState.js';
import { color, shellMaxWidth } from './tokens.js';

// Mapa fullscreen de um parque com um marcador (balão com tempo de fila,
// estilo apps oficiais de parque) por atração já cadastrada no catálogo —
// as que a ThemeParks.wiki conseguiu casar por nome (ver
// useAttractionLocations). Toque num marcador destaca o pino (fundo preto)
// e abre o AttractionCard completo (mesmo componente da lista) fixo no
// rodapé, sem fechar o mapa. Toque fora (no próprio mapa) fecha o card.
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

export default function ParkMap({ park, onClose, getLiveQueue }) {
  useHidesTabBar(true);
  const containerRef = useRef(null);
  const mapRef = useRef(null);
  const markersRef = useRef(new Map());
  const routeLayerRef = useRef(null);
  const decoratorRef = useRef(null);
  const [leaflet, setLeaflet] = useState(null);
  const [decoratorReady, setDecoratorReady] = useState(false);
  const [selected, setSelected] = useState(null);
  const [showRoute, setShowRoute] = useState(false);
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

  useEffect(() => {
    if (!leaflet || !containerRef.current || pins.length === 0 || mapRef.current) return;

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
    map.fitBounds(bounds, { padding: [32, 32] });

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
          setSelected(pin.attraction);
        });

      markersRef.current.set(pin.attraction.id, { marker, label, required: pin.attraction.required });
    }

    return () => {
      map.remove();
      mapRef.current = null;
      markersRef.current.clear();
    };
  }, [leaflet, pins.length]);

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
    // Efeito "linha com contorno" (Waze/Google Maps): uma linha branca mais
    // grossa por baixo, servindo de borda, e a linha escura mais fina por
    // cima — não dá pra fazer isso com stroke+outline num só polyline do
    // Leaflet, por isso são duas camadas sobrepostas.
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

      <div
        onClick={onClose}
        style={{
          position: 'absolute',
          top: 18,
          right: 18,
          zIndex: 10,
          width: 38,
          height: 38,
          borderRadius: 19,
          background: 'rgba(255,255,255,0.85)',
          backdropFilter: 'blur(10px)',
          WebkitBackdropFilter: 'blur(10px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          boxShadow: '0 2px 10px rgba(28,26,23,0.15)',
        }}
      >
        <CloseIcon size={18} color={color.dark} />
      </div>

      <div
        style={{
          position: 'absolute',
          top: 18,
          left: 18,
          zIndex: 10,
          padding: '8px 14px',
          borderRadius: 12,
          background: 'rgba(255,255,255,0.85)',
          backdropFilter: 'blur(10px)',
          WebkitBackdropFilter: 'blur(10px)',
          color: color.dark,
          fontSize: 13,
          fontWeight: 800,
          boxShadow: '0 2px 10px rgba(28,26,23,0.15)',
        }}
      >
        {park.name}
      </div>

      {routeCoords.length >= 2 && (
        <div
          onClick={() => setShowRoute((v) => !v)}
          style={{
            position: 'absolute',
            top: 64,
            left: 18,
            zIndex: 10,
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            padding: '8px 14px',
            borderRadius: 12,
            background: showRoute ? color.dark : 'rgba(255,255,255,0.85)',
            backdropFilter: 'blur(10px)',
            WebkitBackdropFilter: 'blur(10px)',
            boxShadow: '0 2px 10px rgba(28,26,23,0.15)',
            cursor: 'pointer',
          }}
        >
          <RouteIcon size={14} color={showRoute ? '#fff' : color.dark} />
          <span style={{ color: showRoute ? '#fff' : color.dark, fontSize: 12.5, fontWeight: 700 }}>
            Rota sugerida
          </span>
        </div>
      )}

      <AnimatePresence>
        {selected && (
          <motion.div
            key={selected.id}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 16 }}
            transition={{ duration: 0.18, ease: [0.32, 0.72, 0, 1] }}
            style={{
              position: 'absolute',
              left: 14,
              right: 14,
              bottom: 14,
              zIndex: 10,
            }}
          >
            <div style={{ position: 'relative' }}>
              <AttractionCard attraction={selected} liveQueue={getLiveQueue?.(selected.name)} />
              <div
                onClick={() => setSelected(null)}
                style={{
                  position: 'absolute',
                  top: -10,
                  right: -10,
                  width: 28,
                  height: 28,
                  borderRadius: 14,
                  background: color.dark,
                  boxShadow: '0 2px 8px rgba(28,26,23,0.35)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                }}
              >
                <CloseIcon size={15} color="#fff" />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      </motion.div>
    </div>
  );
}
