import { useCallback, useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import useEmblaCarousel from 'embla-carousel-react';
import { AltArrowLeftIcon } from '@solar-icons/react/linear/alt-arrow-left';
import { RouteIcon } from '@solar-icons/react/bold/route';
import { GpsIcon } from '@solar-icons/react/bold/gps';
import { GlobeIcon } from '@solar-icons/react/bold/globe';
import { Buildings2Icon } from '@solar-icons/react/bold/buildings-2';
import { MagnifierZoomInIcon } from '@solar-icons/react/bold/magnifier-zoom-in';
import { AltArrowRightIcon } from '@solar-icons/react/linear/alt-arrow-right';
import ActivityItem from './ActivityItem.jsx';
import { useNavigate } from 'react-router-dom';
import DayTabs from './DayTabs.jsx';
import { useAddressesLocations } from '../hooks/useAddressesLocations.js';
import { useGoogleMaps } from '../hooks/useGoogleMaps.js';
import { useElementHeight } from '../hooks/useElementHeight.js';
import { useGeolocation } from '../hooks/useGeolocation.js';
import { useHidesTabBar } from '../hooks/useEditingState.js';
import { FixedHeader, color, shellMaxWidth, spacing, type } from '../design-system/index.js';

// AdvancedMarkerElement já ancora o conteúdo custom nativamente via
// anchorLeft/anchorTop (CSS aplicado pelo próprio framework do Google, não
// por nós) — um transform CSS manual nosso por cima disso competia com o
// anchor nativo, e os dois recalculavam em momentos levemente diferentes
// durante o zoom, fazendo o conteúdo "derivar" visualmente enquanto o mapa
// dava zoom (sintoma relatado: ponta do balão se movendo, lado oposto
// parecendo fixo). anchorLeft/anchorTop são passados na criação do marker
// (ver chamadas de `new AdvancedMarker(...)`), não mais via transform aqui.
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

// Ponto na metade do comprimento REAL do trajeto (distância acumulada),
// não o índice do meio do array de coordenadas — o path decodificado tem
// densidade de pontos desigual (mais pontos em curvas, menos em retas
// longas), então o índice do meio costuma cair fora do centro visual da
// rota, às vezes bem perto da origem ou do destino.
function midpointByDistance(path, geometry) {
  const spherical = geometry.spherical;
  const segmentLengths = [];
  let total = 0;
  for (let i = 0; i < path.length - 1; i++) {
    const len = spherical.computeDistanceBetween(path[i], path[i + 1]);
    segmentLengths.push(len);
    total += len;
  }

  const half = total / 2;
  let acc = 0;
  for (let i = 0; i < segmentLengths.length; i++) {
    if (acc + segmentLengths[i] >= half) {
      const fraction = segmentLengths[i] === 0 ? 0 : (half - acc) / segmentLengths[i];
      return spherical.interpolate(path[i], path[i + 1], fraction);
    }
    acc += segmentLengths[i];
  }
  return path[Math.floor(path.length / 2)];
}

// Mesma formatação de duração/distância do DistanceBetween.jsx (usado entre
// atividades consecutivas do Roteiro) — reaproveitada aqui pra label no meio
// da rota traçada, pro texto ficar consistente em todo o app.
function formatDuration(min) {
  if (min < 60) return `${min} min`;
  const h = Math.floor(min / 60);
  const rest = min % 60;
  return rest === 0 ? `${h}h` : `${h}h ${rest}min`;
}

// Balão escuro estilo Google Maps/Waze (tempo em destaque, distância embaixo
// menor, cantos bem arredondados, seta apontando pra baixo na rota) — mesma
// família visual e tamanho do pinElement acima, só com dois níveis de texto
// em vez de um.
function routeLabelElement({ distanceKm, durationMin }) {
  const distanceLabel = distanceKm < 10 ? distanceKm.toFixed(1) : Math.round(distanceKm);
  const wrapper = document.createElement('div');
  wrapper.style.cssText = 'position:relative;display:flex;flex-direction:column;align-items:center;';
  wrapper.innerHTML = `
    <div style="padding:5px 10px;border-radius:11px;background:${color.dark};box-shadow:0 2px 6px rgba(28,26,23,0.3);text-align:center;font-family:'Nunito', system-ui, sans-serif;">
      <div style="font-size:11px;font-weight:800;line-height:1.3;color:#fff;white-space:nowrap;">
        ${escapeHtml(formatDuration(durationMin))}
      </div>
      <div style="font-size:9.5px;font-weight:700;line-height:1.3;color:rgba(255,255,255,0.7);white-space:nowrap;">
        ${distanceLabel} km
      </div>
    </div>
    <div style="width:0;height:0;border-left:6px solid transparent;border-right:6px solid transparent;border-top:6px solid ${color.dark};margin-top:-1px;"></div>
  `;
  return wrapper;
}

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

// Mapa fullscreen do roteiro de um dia — mesmo padrão de interação do
// ParkMap.jsx (um pino por local, fit bounds automático, card da atividade
// selecionada fixo no rodapé), mas renderizado com a Maps JavaScript API do
// Google (google.maps.Map + AdvancedMarkerElement) em vez do Leaflet usado
// no ParkMap — pra manter o mapa de verdade com a cara do Google Maps, como
// o resto do app. Os pontos vêm da geocodificação do endereço de cada
// atividade do dia (activity.place?.address || activity.address).
// Recebe a lista inteira de `days` + o índice selecionado (controlado de
// fora, pelo ScheduleScreen, igual à tela de Roteiro) em vez de um único
// `day` fixo — com a navbar trazida pra cá (FixedHeader + DayTabs), dá pra
// trocar de dia sem fechar o mapa, e cada troca refaz os pins/bounds do dia
// novo automaticamente.
export default function DayMap({ days, selectedDay, onSelectDay, onClose }) {
  useHidesTabBar(true);
  const navigate = useNavigate();
  const containerRef = useRef(null);
  const mapRef = useRef(null);
  const markersRef = useRef(new Map());
  const routeLayersRef = useRef([]);
  const googleMaps = useGoogleMaps();
  const { ref: headerRef, height: headerHeight } = useElementHeight();
  const { position: myLocation, error: locationError } = useGeolocation();
  const [selected, setSelected] = useState(null);
  const [routeTarget, setRouteTarget] = useState(null);
  const [satellite, setSatellite] = useState(false);
  const [tilt3d, setTilt3d] = useState(false);
  // Troca de slide pelo carrossel (arrastar) e troca por clique no pino do
  // mapa disparam o mesmo setSelected — esse ref distingue as duas origens
  // pra não ficar um "empurrando" o outro num loop (clicar pino -> scrollTo
  // -> evento select do embla -> tentaria setSelected de novo).
  const selectingFromMapRef = useRef(false);
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: false, align: 'center', containScroll: 'trimSnaps' });

  const day = days[selectedDay];
  const activitiesWithAddress = day.activities.filter((a) => a.place?.address || a.address);
  const uniqueAddresses = [...new Set(activitiesWithAddress.map((a) => a.place?.address || a.address))];
  const { byAddress, loading } = useAddressesLocations(uniqueAddresses);

  const pins = activitiesWithAddress
    .map((activity) => ({ activity, coords: byAddress.get(activity.place?.address || activity.address) }))
    .filter((p) => p.coords);

  const ready = !loading;

  // Arrastar o carrossel troca o pin selecionado (preto no mapa) e centraliza
  // suavemente nele — só quando a mudança veio do próprio arrasto, não de um
  // scrollTo disparado por clique no pino (ver selectingFromMapRef acima).
  useEffect(() => {
    if (!emblaApi) return;
    const onSelect = () => {
      if (selectingFromMapRef.current) {
        selectingFromMapRef.current = false;
        return;
      }
      const pin = pins[emblaApi.selectedScrollSnap()];
      if (!pin) return;
      setSelected(pin);
      mapRef.current?.panTo({ lat: pin.coords.lat, lng: pin.coords.lng });
    };
    emblaApi.on('select', onSelect);
    return () => emblaApi.off('select', onSelect);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [emblaApi, pins.length]);

  // Clicar um pino no mapa faz o carrossel pular pro card correspondente,
  // sem animação de arrasto (jump: true) — já que o usuário não arrastou.
  const selectPin = useCallback(
    (pin) => {
      setSelected(pin);
      const index = pins.findIndex((p) => p.activity.id === pin.activity.id);
      if (index >= 0 && emblaApi) {
        selectingFromMapRef.current = true;
        emblaApi.scrollTo(index, true);
      }
    },
    [pins, emblaApi]
  );
  // Markers são criados dentro de um useEffect que não depende de selectPin
  // (recriar o mapa inteiro a cada render seria caro) — a ref garante que o
  // listener de clique sempre chama a versão mais recente da função.
  const selectPinRef = useRef(selectPin);
  useEffect(() => {
    selectPinRef.current = selectPin;
  }, [selectPin]);

  useEffect(() => {
    if (!googleMaps || !containerRef.current || pins.length === 0) return;

    const mapId = import.meta.env.VITE_GOOGLE_MAPS_MAP_ID;
    const map = new googleMaps.Map(containerRef.current, {
      disableDefaultUI: true,
      // disableDefaultUI já cobre a maioria, mas sendo explícito aqui pra
      // garantir que nenhum controle nativo do Google (zoom, fullscreen,
      // street view, map type, escala) apareça por cima do mapa — só os
      // pinos e o card da atividade, que são nossos. A faixa de atribuição
      // no rodapé ("Keyboard shortcuts", "Map data", "Terms", "Report a map
      // error", logo Google) é exigida pelos Termos de Uso do Google Maps
      // Platform e não pode ser removida nem escondida visualmente.
      fullscreenControl: false,
      zoomControl: false,
      streetViewControl: false,
      mapTypeControl: false,
      scaleControl: false,
      rotateControl: false,
      keyboardShortcuts: false,
      // AdvancedMarkerElement (balão de texto no pino) só funciona com um
      // Map ID real criado em Map Management no Google Cloud Console — sem
      // ele, o Map simplesmente ignora a opção e usa o estilo raster padrão,
      // e o código abaixo cai pro Marker clássico (pino comum, sem balão).
      ...(mapId ? { mapId } : {}),
    });
    mapRef.current = map;
    map.addListener('click', () => setSelected(null));

    const bounds = new googleMaps.LatLngBounds();
    if (myLocation) bounds.extend(myLocation);
    for (const pin of pins) bounds.extend({ lat: pin.coords.lat, lng: pin.coords.lng });
    // Padding de cima considera a altura real da navbar (título + abas dos
    // dias, FixedHeader), senão pins perto do topo ficavam escondidos atrás
    // dela. Padding maior embaixo: o card da atividade selecionada
    // (ActivityItem + botão de rota) cobre uma faixa da parte de baixo do
    // mapa, então sem isso o fitBounds considerava essa área como "visível"
    // e cortava pontos que ficavam escondidos atrás do card.
    map.fitBounds(bounds, { top: (headerHeight || 80) + 16, right: 32, bottom: 260, left: 32 });

    // AdvancedMarkerElement exige um Map ID real (ver comentário acima) —
    // sem ele a própria API lança erro ao tentar usar o marker avançado, por
    // isso só tenta quando mapId está configurado.
    const AdvancedMarker = mapId ? googleMaps.marker?.AdvancedMarkerElement : null;

    // Pino "você está aqui" só desenha quando a geolocalização real já
    // resolveu (myLocation !== null) — sem permissão concedida ainda, ou
    // API indisponível, o mapa simplesmente não mostra esse pino.
    if (myLocation && AdvancedMarker) {
      new AdvancedMarker({
        map,
        position: myLocation,
        content: myLocationElement(),
        // anchorTop: '-50%' em vez do default '-100%' — o círculo "você está
        // aqui" deve centralizar nos dois eixos sobre a coordenada, não
        // ancorar pela base como um pino com ponta.
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
      const label = pin.activity.place?.name || pin.activity.title;

      let marker;
      if (AdvancedMarker) {
        marker = new AdvancedMarker({
          map,
          position: { lat: pin.coords.lat, lng: pin.coords.lng },
          content: pinElement({ label, isSelected: false }),
          collisionBehavior: googleMaps.CollisionBehavior.REQUIRED,
        });
        marker.addListener('click', () => selectPinRef.current(pin));
      } else {
        // Fallback se a lib "marker" não carregar: pino padrão do Google
        // (sem o balão customizado), ainda clicável.
        marker = new googleMaps.Marker({
          map,
          position: { lat: pin.coords.lat, lng: pin.coords.lng },
          title: label,
        });
        marker.addListener('click', () => selectPinRef.current(pin));
      }

      markersRef.current.set(pin.activity.id, { marker, label, usesAdvanced: !!AdvancedMarker });
    }

    return () => {
      for (const { marker } of markersRef.current.values()) {
        marker.map = null;
        marker.setMap?.(null);
      }
      markersRef.current.clear();
      mapRef.current = null;
    };
    // selectedDay nas deps: força recriar o mapa inteiro (tiles, pins,
    // bounds) ao trocar de dia pela navbar — antes o guard `mapRef.current`
    // impedia qualquer recriação depois da primeira montagem.
    // !!myLocation (não o objeto inteiro) nas deps — watchPosition emite um
    // novo objeto a cada pequena variação de GPS; recriar o mapa inteiro a
    // cada tick seria pesado e desnecessário. Só precisa recriar uma vez,
    // na transição de "ainda não sei onde você está" pra "localização
    // resolvida", pra desenhar o pino "você está aqui" que antes não
    // existia.
  }, [googleMaps, selectedDay, pins.length, !!myLocation]);

  // Satélite/3D aplicados aqui (não na criação do mapa acima) porque esse
  // outro useEffect recria o mapa do zero a cada troca de dia — setar aqui
  // de novo preserva a escolha do usuário através dessas recriações, sem
  // precisar guardar/restaurar manualmente. Tilt só faz efeito combinado com
  // mapTypeId satellite/hybrid (no modo 'roadmap' a API ignora o tilt).
  useEffect(() => {
    if (!mapRef.current) return;
    mapRef.current.setMapTypeId(satellite ? 'hybrid' : 'roadmap');
    mapRef.current.setTilt(satellite && tilt3d ? 45 : 0);
  }, [satellite, tilt3d, selectedDay, pins.length]);

  // Redesenha só o pino selecionado (fundo preto) e o anterior (de volta ao
  // branco) — mesmo princípio do ParkMap, adaptado pra API de marker do
  // Google (troca o `content` do AdvancedMarkerElement, não o ícone).
  useEffect(() => {
    for (const [id, entry] of markersRef.current) {
      if (!entry.usesAdvanced) continue;
      const isSelected = selected?.activity.id === id;
      entry.marker.content = pinElement({ label: entry.label, isSelected });
    }
  }, [selected]);

  // Traça a rota real (ruas) da localização atual até o lugar da atividade
  // selecionada — sob demanda, um trecho de cada vez (botão "Traçar rota" no
  // card), em vez de uma linha única ligando todos os lugares do dia de uma
  // vez: mostrar o roteiro inteiro de uma só tacada ficava poluído demais.
  // A rota vem do proxy server-side `/api/places/google?action=route`
  // (Routes API — a Directions API legada do SDK client-side não está
  // habilitada neste projeto), que devolve a polyline codificada + duração/
  // distância; decodificada aqui com geometry.encoding.decodePath e
  // desenhada como duas Polylines sobrepostas — contorno branco mais grosso
  // por baixo, linha escura mais fina por cima — mesmo efeito "linha com
  // borda" já usado na rota sugerida do ParkMap.jsx, mais uma leve sombra e
  // um marker-label (distância/tempo) no ponto médio do trajeto.
  useEffect(() => {
    if (!googleMaps || !mapRef.current) return;

    // Polyline tem .setMap(null), AdvancedMarkerElement se remove via
    // `.map = null` — os dois tipos convivem no mesmo array de camadas.
    for (const layer of routeLayersRef.current) {
      layer.setMap?.(null);
      if ('map' in layer) layer.map = null;
    }
    routeLayersRef.current = [];

    if (!routeTarget || !myLocation) return;

    let cancelled = false;
    const points = [myLocation, routeTarget];

    fetch(`/api/places/google?action=route&points=${encodeURIComponent(JSON.stringify(points))}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (cancelled || !data?.encodedPolyline) return;
        const path = googleMaps.geometry.encoding.decodePath(data.encodedPolyline);

        // Polyline não suporta box-shadow (não é um elemento DOM) — a
        // "sombra fraquinha" é simulada com uma 3ª linha cinza translúcida,
        // mais grossa, por baixo de tudo.
        const shadow = new googleMaps.Polyline({
          map: mapRef.current,
          path,
          strokeColor: color.dark,
          strokeWeight: 11,
          strokeOpacity: 0.12,
          zIndex: 1,
        });
        const outline = new googleMaps.Polyline({
          map: mapRef.current,
          path,
          strokeColor: '#fff',
          strokeWeight: 9,
          strokeOpacity: 1,
          zIndex: 2,
        });
        const line = new googleMaps.Polyline({
          map: mapRef.current,
          path,
          strokeColor: color.dark,
          strokeWeight: 5,
          strokeOpacity: 0.95,
          zIndex: 3,
        });
        routeLayersRef.current = [shadow, outline, line];

        const midPoint = midpointByDistance(path, googleMaps.geometry);
        const AdvancedMarker = googleMaps.marker?.AdvancedMarkerElement;
        const labelMarker = AdvancedMarker
          ? new AdvancedMarker({
              map: mapRef.current,
              position: midPoint,
              content: routeLabelElement({ distanceKm: data.distanceKm, durationMin: data.durationMin }),
              collisionBehavior: googleMaps.CollisionBehavior.REQUIRED,
            })
          : new googleMaps.Marker({
              map: mapRef.current,
              position: midPoint,
              label: {
                text: `${formatDuration(data.durationMin)} · ${data.distanceKm < 10 ? data.distanceKm.toFixed(1) : Math.round(data.distanceKm)} km`,
                fontSize: '12px',
                fontWeight: '700',
              },
              icon: { path: googleMaps.SymbolPath.CIRCLE, scale: 0, fillOpacity: 0 },
            });
        routeLayersRef.current.push(labelMarker);

        const bounds = new googleMaps.LatLngBounds();
        for (const point of path) bounds.extend(point);
        // Mesmo motivo do fitBounds inicial: o card da atividade fica aberto
        // nesse momento (é o botão "Traçar rota" dentro dele que disparou
        // isso), cobrindo a parte de baixo do mapa — sem compensar isso, a
        // rota/label perto do destino ficava fora da área realmente visível.
        mapRef.current.fitBounds(bounds, { top: 80, right: 40, bottom: 260, left: 40 });
      })
      .catch(() => {});

    return () => {
      cancelled = true;
    };
  }, [routeTarget, googleMaps, !!myLocation]);

  // Trocar de atividade selecionada limpa a rota traçada do trecho anterior
  // — cada trecho é relativo a uma atividade específica, não faz sentido
  // continuar visível depois de selecionar outra.
  useEffect(() => {
    setRouteTarget(null);
  }, [selected?.activity.id]);

  // Entrar no mapa (ou trocar de dia pela navbar) sempre seleciona o
  // primeiro item do roteiro automaticamente — o card inferior nunca deve
  // aparecer vazio/sem nada selecionado. reInit porque trocar de dia troca
  // a quantidade de slides do carrossel (embla não percebe isso sozinho).
  useEffect(() => {
    setSelected(pins[0] || null);
    emblaApi?.reInit();
    emblaApi?.scrollTo(0, true);
  }, [selectedDay, pins.length, emblaApi]);

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
          Não encontramos a localização dos lugares deste dia.
        </div>
      )}

      <FixedHeader
        headerRef={headerRef}
        title={day.theme}
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
          <DayTabs
            days={days}
            selected={selectedDay}
            onSelect={onSelectDay}
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
            // locationError (sem geolocalização): botão continua visível,
            // mas esmaecido — toca e mostra o motivo em vez de simplesmente
            // sumir sem explicação (sintoma relatado: "cadê o botão?").
            opacity: locationError ? 0.4 : 1,
          }}
        >
          <GpsIcon size={18} color={color.dark} />
        </div>
      )}

      {/* Satélite/3D empilhados em cascata abaixo do botão de GPS — mesmo
          padrão visual "quadradinho" (borderRadius 13 sobre 38x38) usado no
          botão de voltar do header, não o círculo perfeito do GPS. Tilt 3D
          só aparece quando satélite já está ativo: a API ignora tilt no modo
          roadmap, então mostrar o botão nesse estado seria um controle morto. */}
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
        onClick={() => setTilt3d((v) => !v)}
        style={{
          position: 'absolute',
          top: headerHeight + 108,
          right: 18,
          zIndex: 8,
          width: 38,
          height: 38,
          borderRadius: 13,
          background: tilt3d ? color.dark : 'rgba(255,255,255,0.85)',
          backdropFilter: 'blur(10px)',
          WebkitBackdropFilter: 'blur(10px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          border: tilt3d ? 'none' : `1px solid ${color.border}`,
          boxShadow: '0 2px 10px rgba(28,26,23,0.15)',
        }}
      >
        <Buildings2Icon size={18} color={tilt3d ? '#fff' : color.dark} />
      </div>

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
            {/* Sem botão de fechar: clicar em qualquer ponto vazio do mapa já
                fecha este card (ver map.addListener('click', ...) acima) —
                um X fixo flutuando por cima do carrossel ficava redundante
                com essa mesma ação, então foi removido daqui. */}

            {/* Carrossel horizontal: arrastar troca de card/pin (ver efeito
                onSelect do embla acima), igual ao carrossel de fotos da tela
                de detalhes do lugar — mesma lib (embla-carousel-react), mesmo
                padrão de scroll-snap nativo. Slide com 88% da largura (em vez
                de 100%) deixa a "pontinha" do próximo card visível na borda —
                só assim dá pra perceber, sem instrução nenhuma, que dá pra
                arrastar pros lados quando o dia tem mais de um ponto. */}
            {/* items-stretch (default do flex) já faz cada slide esticar pra
                altura do maior — só precisava que o conteúdo de dentro
                (ActivityItem) também ocupasse 100% dessa altura esticada
                (flex: 1, height: 100%), senão cada card continuava com a
                própria altura de conteúdo mesmo dentro de um slide maior. */}
            <div ref={emblaRef} style={{ overflow: 'hidden' }}>
              <div style={{ display: 'flex' }}>
                {pins.map((pin) => {
                  const isActive = pin.activity.id === selected.activity.id;
                  return (
                    <div
                      key={pin.activity.id}
                      style={{
                        flex: pins.length > 1 ? '0 0 88%' : '0 0 100%',
                        minWidth: 0,
                        padding: '0 8px',
                        boxSizing: 'border-box',
                        display: 'flex',
                      }}
                    >
                      <ActivityItem
                        activity={pin.activity}
                        editing={false}
                        disableNavigate
                        style={{ flex: 1, height: '100%' }}
                        bottomContent={
                          <div style={{ display: 'flex', gap: spacing.gapMd, marginTop: spacing.gapMd }}>
                            <div
                              onClick={() => {
                                if (!mapRef.current) return;
                                mapRef.current.panTo({ lat: pin.coords.lat, lng: pin.coords.lng });
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
                                background: color.bg,
                                border: `1px solid ${color.border}`,
                                cursor: 'pointer',
                              }}
                            >
                              <MagnifierZoomInIcon size={15} color={color.dark} />
                              <span style={{ color: color.dark, ...type.button }}>Centralizar</span>
                            </div>
                            {pin.activity.place && (
                              <div
                                onClick={() => navigate(`/lugares/${pin.activity.place.id}`)}
                                style={{
                                  flex: 1,
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  gap: 6,
                                  padding: 12,
                                  borderRadius: 16,
                                  background: color.bg,
                                  border: `1px solid ${color.border}`,
                                  cursor: 'pointer',
                                }}
                              >
                                <AltArrowRightIcon size={15} color={color.dark} />
                                <span style={{ color: color.dark, ...type.button }}>Detalhes</span>
                              </div>
                            )}
                            {isActive && (
                              <div
                                onClick={() => setRouteTarget((v) => (v ? null : pin.coords))}
                                style={{
                                  flex: 1,
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  gap: 6,
                                  padding: 12,
                                  borderRadius: 16,
                                  background: color.dark,
                                  cursor: 'pointer',
                                }}
                              >
                                <RouteIcon size={15} color="#fff" />
                                <span style={{ color: '#fff', ...type.button }}>
                                  {routeTarget ? 'Ocultar' : 'Rota'}
                                </span>
                              </div>
                            )}
                          </div>
                        }
                      />
                    </div>
                  );
                })}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      </motion.div>
    </div>
  );
}
