import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'motion/react';
import { MapIcon } from '@solar-icons/react/bold/map';
import { CheckCircleIcon } from '@solar-icons/react/bold/check-circle';
import AttractionCard from './AttractionCard.jsx';
import { useAttractionsData } from '../hooks/useAttractionsData.js';
import { getAttractionsScreenState, saveAttractionsScreenState } from '../hooks/useAttractionsScreenState.js';
import { PARK_ICON_MAP } from '../data/parkIcons.js';
import { useScrollY } from '../hooks/useScrollY.js';
import { useElementHeight } from '../hooks/useElementHeight.js';
import { useLiveQueueTimes } from '../hooks/useLiveQueueTimes.js';
import { HamburgerMenuButton } from './HamburgerMenuButton.jsx';
import { FixedHeader, HScrollTabs, ParkMap, SearchInput, SectionHeader, Skeleton, cardPhotoHeight, color, radius, space, spacing } from '../design-system/index.js';
import { STAGGER_CONTAINER, STAGGER_ITEM } from '../design-system/motionPresets.js';
import { useStaggerKey } from '../hooks/useActiveScreen.js';

// area vem em CAIXA ALTA da planilha original importada (ex: "ADVENTURELAND",
// "DIAGON ALLEY") — aqui só pra exibição, sem mexer no dado em si (usado
// pra agrupar/comparar em outros lugares). Conectores minúsculos ficam
// minúsculos (ex: "of", "the"), resto vira Primeira Maiúscula.
const LOWERCASE_WORDS = new Set(['de', 'da', 'do', 'e', 'of', 'the', 'and']);
function formatAreaLabel(area) {
  return area
    .toLowerCase()
    .split(' ')
    .map((word, i) => (i > 0 && LOWERCASE_WORDS.has(word) ? word : word.charAt(0).toUpperCase() + word.slice(1)))
    .join(' ');
}

// Mesmo padrão visual/funcional da tela de Lugares: abas com scroll
// horizontal (aqui, um parque por aba) + seções sticky por área + busca.
export default function AttractionsScreen() {
  const location = useLocation();
  const navigate = useNavigate();
  const savedState = useRef(getAttractionsScreenState()).current;
  const { parks, setParks, loading } = useAttractionsData();
  const [parkIndex, setParkIndex] = useState(
    () => location.state?.parkIndex ?? savedState.parkIndex ?? 0
  );
  const [search, setSearch] = useState(savedState.search);
  const [onlyInItinerary, setOnlyInItinerary] = useState(savedState.onlyInItinerary);
  const { scrollY, anchorRef } = useScrollY();
  const { ref: headerRef, height: headerHeight } = useElementHeight();
  const { getLiveQueue, getLiveStatus } = useLiveQueueTimes();
  const staggerKey = useStaggerKey();

  // Salva parque/filtros a cada mudança, pra sobreviver à desmontagem ao
  // navegar para outra tela e voltar (mesmo padrão de usePlacesScreenState).
  useEffect(() => {
    saveAttractionsScreenState({ parkIndex, search, onlyInItinerary });
  }, [parkIndex, search, onlyInItinerary]);

  // Restaura a posição de scroll salva assim que a lista carrega. Quem rola
  // de fato é o motion.div ancestral (overflowY: auto, ver App.jsx) —
  // mesmo padrão de ScheduleScreen.jsx.
  useLayoutEffect(() => {
    if (loading) return;
    const scroller = anchorRef.current?.closest('[data-scroll-root]');
    if (scroller && savedState.scrollTop) {
      scroller.scrollTop = savedState.scrollTop;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading]);

  // Salva a posição de scroll continuamente — a navegação pra fora da tela
  // de Atrações acontece de várias formas (abrir detalhe, abrir mapa, abrir
  // Roteiro de Atrações, trocar de aba inferior), não dá pra interceptar
  // uma por uma.
  useEffect(() => {
    const scroller = anchorRef.current?.closest('[data-scroll-root]');
    if (!scroller) return;
    const onScroll = () => saveAttractionsScreenState({ scrollTop: scroller.scrollTop });
    scroller.addEventListener('scroll', onScroll, { passive: true });
    return () => scroller.removeEventListener('scroll', onScroll);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Abrir o mapa empurra uma entrada real no histórico (mesmo padrão do
  // ScheduleScreen/DayMap) — sem isso, clicar "Detalhes" dentro do mapa e
  // depois "voltar" na tela de detalhe pulava o mapa direto pra lista.
  // `mapOpen` é derivado direto de location.state a cada render (não um
  // useState espelhado via useEffect) — um useEffect com [location.state] ou
  // [location.key] como dependência nunca disparava de novo ao voltar: o
  // HashRouter reutiliza a mesma location.key ("default") e pode devolver a
  // mesma referência de state entre navegações pro mesmo pathname, então o
  // mapa abria normalmente mas "voltar" não fechava sozinho (só depois de um
  // 2º clique/navegação forçar outro recálculo qualquer).
  const mapOpen = !!location.state?.mapOpen;
  const openMap = () => navigate(location.pathname, { state: { ...location.state, mapOpen: true } });
  const closeMap = () => navigate(-1);

  const park = parks[parkIndex];

  const sections = useMemo(() => {
    if (!park) return [];
    const query = search.trim().toLowerCase();
    return park.areas
      .map((area) => ({
        name: area.name,
        attractions: area.attractions
          .filter((a) => !query || a.name.toLowerCase().includes(query))
          .filter((a) => !onlyInItinerary || a.required),
      }))
      .filter((area) => area.attractions.length > 0);
  }, [park, search, onlyInItinerary]);

  const tabItems = parks.map((p, i) => {
    const mapped = PARK_ICON_MAP[p.name];
    return { key: i, label: p.name, icon: mapped?.icon, iconColor: mapped?.color };
  });

  return (
    <div ref={anchorRef} style={{ position: 'relative', width: '100%', minHeight: '100dvh', background: color.bg, boxSizing: 'border-box' }}>
      <FixedHeader
        headerRef={headerRef}
        scrollY={scrollY}
        title="Atrações"
        left={<HamburgerMenuButton />}
        tabs={<HScrollTabs items={tabItems} activeKey={parkIndex} onSelect={setParkIndex} loading={loading} instanceId="attractions" style={{ marginTop: 0, padding: `0 ${spacing.screenGutter}px` }} />}
      />

      <motion.div
        // key muda ao trocar de parque (aba) ou ao sair do estado "sem dado
        // ainda" pela primeira vez — ver mesmo padrão em ScheduleScreen.jsx.
        key={`${staggerKey}-${loading && parks.length === 0 ? 'skeleton' : `park-${parkIndex}`}`}
        variants={STAGGER_CONTAINER}
        initial="hidden"
        animate="show"
        style={{
          marginTop: headerHeight + spacing.controlGap,
          boxSizing: 'border-box',
          padding: `2px ${space.screenGutter}px 120px`,
        }}
      >
        {/* Call-to-action do mapa do parque — mesmo padrão visual/posição do
            card "Ver roteiro no mapa" da tela de Roteiro (imagem estática,
            sem overlay, botão preto centralizado por cima). Substituiu o
            antigo botão "Ver mapa do parque" que ficava dentro do
            ParkStrategyCard. */}
        {!loading && park && (
          <motion.div
            variants={STAGGER_ITEM}
            onClick={openMap}
            style={{
              position: 'relative',
              marginBottom: 28,
              borderRadius: 20,
              overflow: 'hidden',
              height: 110,
              background: '#eee9df',
              border: `1px solid ${color.border}`,
              cursor: 'pointer',
            }}
          >
            <img
              src="/roteiro-mapa-card.png"
              alt=""
              loading="lazy"
              style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
            />
            <div
              style={{
                position: 'absolute',
                inset: 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '10px 18px',
                  borderRadius: 14,
                  background: '#1c1a17',
                }}
              >
                <MapIcon size={17} color="#fff" />
                <span style={{ color: '#fff', fontSize: 14.5, fontWeight: 800, letterSpacing: -0.1 }}>
                  Ver mapa do parque
                </span>
              </div>
            </div>
          </motion.div>
        )}

        <motion.div variants={STAGGER_ITEM} style={{ display: 'flex', alignItems: 'stretch', gap: spacing.gapMd, marginBottom: 14 }}>
          <SearchInput value={search} onChange={setSearch} placeholder="Buscar atração" style={{ flex: 1, marginBottom: 0 }} />

          <div
            onClick={() => setOnlyInItinerary((v) => !v)}
            title="Atrações que estão no roteiro"
            style={{
              flex: 'none',
              width: 38,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: radius.input,
              border: `1px solid ${onlyInItinerary ? color.dark : color.border}`,
              background: onlyInItinerary ? color.dark : color.bg,
              cursor: 'pointer',
            }}
          >
            <CheckCircleIcon size={17} color={onlyInItinerary ? '#fff' : color.faintIcon} />
          </div>
        </motion.div>

        {loading && parks.length === 0 && Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} height={cardPhotoHeight} radius={radius.cardPhoto} style={{ marginBottom: spacing.controlGap }} />
        ))}

        {!loading && park && sections.map((section) => (
          <motion.div key={section.name} variants={STAGGER_ITEM}>
            <SectionHeader style={{ top: headerHeight }}>{formatAreaLabel(section.name)}</SectionHeader>
            {section.attractions.map((attraction) => (
              <AttractionCard
                key={attraction.id}
                attraction={attraction}
                liveQueue={getLiveQueue(attraction.name)}
                liveStatus={getLiveStatus(attraction.name)}
              />
            ))}
          </motion.div>
        ))}

        {!loading && park && sections.length === 0 && (
          <div style={{ padding: '30px 0', textAlign: 'center', color: color.faint, fontSize: 13.5, fontWeight: 600 }}>
            Nenhuma atração encontrada.
          </div>
        )}
      </motion.div>

      <AnimatePresence>
        {mapOpen && park && (
          <ParkMap
            key="park-map"
            parks={parks}
            selectedPark={parkIndex}
            onSelectPark={setParkIndex}
            onClose={closeMap}
            getLiveQueue={getLiveQueue}
            getLiveStatus={getLiveStatus}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
