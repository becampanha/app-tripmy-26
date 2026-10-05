import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'motion/react';
import PlaceCard from './PlaceCard.jsx';
import PlacesMap from './PlacesMap.jsx';
import { AddIcon } from '@solar-icons/react/linear/add';
import { MapIcon } from '@solar-icons/react/bold/map';
import { CheckCircleIcon } from '@solar-icons/react/bold/check-circle';
import { MapPointIcon } from '@solar-icons/react/bold/map-point';
import { fetchPlaces } from '../api/itineraryApi.js';
import { CATEGORY_ICON_MAP } from '../data/placeTags.js';
import { subcategoriesFor } from '../data/subcategories.js';
import { usePlacesInItinerary } from '../hooks/usePlacesInItinerary.js';
import { getPlacesScreenState, savePlacesScreenState, getCachedPlaces, setCachedPlaces } from '../hooks/usePlacesScreenState.js';
import { useScrollY } from '../hooks/useScrollY.js';
import { useElementHeight } from '../hooks/useElementHeight.js';
import { HamburgerMenuButton } from './HamburgerMenuButton.jsx';
import { FixedHeader, HScrollTabs, SearchInput, SectionHeader, Skeleton, Select, color, radius, space, spacing } from '../design-system/index.js';

const CATEGORIES = ['Restaurante', 'Mercado', 'Centros', 'Outlets', 'Shopping', 'Loja', 'Parque', 'Hotel', 'Aeroporto', 'Outro'];

// Rótulo exibido no chip da categoria — separado do valor usado para
// filtrar (que precisa continuar batendo com place.category no banco).
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

export default function PlacesScreen() {
  const savedState = useRef(getPlacesScreenState()).current;
  const cachedPlaces = getCachedPlaces();
  const [places, setPlaces] = useState(cachedPlaces || []);
  const [loading, setLoading] = useState(cachedPlaces === null);
  const [category, setCategory] = useState(savedState.category ?? CATEGORIES[0]);
  const [subcategory, setSubcategory] = useState(savedState.subcategory);
  const [onlyInItinerary, setOnlyInItinerary] = useState(savedState.onlyInItinerary);
  const [search, setSearch] = useState(savedState.search);
  const [mapOpen, setMapOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const placesInItinerary = usePlacesInItinerary();
  const rootRef = useRef(null);
  const { scrollY } = useScrollY(rootRef);
  const { ref: headerRef, height: headerHeight } = useElementHeight();

  // Mesmo padrão do mapa do Roteiro (ver ScheduleScreen.jsx): abrir o mapa
  // empurra uma entrada real no histórico, pra "voltar" (botão dentro do
  // mapa, gesto ou botão físico do celular) sempre funcionar sozinho, sem
  // lógica própria de "lembrar de onde vim".
  const openMap = () => {
    setMapOpen(true);
    navigate(location.pathname, { state: { ...location.state, mapOpen: true } });
  };
  const closeMap = () => navigate(-1);

  useEffect(() => {
    setMapOpen(!!location.state?.mapOpen);
  }, [location.state]);

  // Salva filtros a cada mudança, pra sobreviver à desmontagem ao navegar
  // para a tela de detalhes e voltar.
  useEffect(() => {
    savePlacesScreenState({ category, subcategory, onlyInItinerary, search });
  }, [category, subcategory, onlyInItinerary, search]);

  // Restaura a posição de scroll salva assim que a lista carrega. O elemento
  // que rola de fato é o motion.div ancestral (overflowY: auto) definido em
  // App.jsx, não algo dentro desta tela — por isso sobe a árvore até achá-lo.
  useLayoutEffect(() => {
    if (loading) return;
    const scroller = rootRef.current?.closest('[style*="overflow-y"]');
    if (scroller && savedState.scrollTop) {
      scroller.scrollTop = savedState.scrollTop;
    }
  }, [loading]);

  // Salva a posição de scroll ao navegar para fora desta tela (clique num
  // card) — mais confiável que um listener de "scroll" contínuo, que pode
  // capturar eventos espúrios do motion.div durante a animação de
  // push/pop entre Lugares e Detalhes.
  const getScrollTop = () => {
    const scroller = rootRef.current?.closest('[style*="overflow-y"]');
    return scroller ? scroller.scrollTop : 0;
  };

  const goToPlace = (id) => {
    savePlacesScreenState({ scrollTop: getScrollTop() });
    navigate(`/lugares/${id}`);
  };

  useEffect(() => {
    fetchPlaces()
      .then((data) => {
        setCachedPlaces(data);
        setPlaces(data);
      })
      .finally(() => setLoading(false));
  }, []);

  const countByCategory = useMemo(() => {
    const counts = {};
    for (const p of places) counts[p.category] = (counts[p.category] || 0) + 1;
    return counts;
  }, [places]);

  const subcategoryOptions = subcategoriesFor(category);

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    return places.filter((p) =>
      p.category === category &&
      (!subcategory || p.subcategory === subcategory) &&
      (!onlyInItinerary || (placesInItinerary && placesInItinerary.has(p.id))) &&
      (!query || p.name.toLowerCase().includes(query))
    );
  }, [places, category, subcategory, onlyInItinerary, placesInItinerary, search]);

  // Sem área específica selecionada e a categoria tem subcategorias definidas:
  // agrupa a lista por área, com um mini-título fixo (sticky) por grupo, como
  // as seções da lista de Contatos do iOS. Lugares sem subcategoria caem num
  // grupo "Sem área definida" no final, pra nada ficar escondido.
  const groupedSections = useMemo(() => {
    if (subcategory || subcategoryOptions.length === 0) return null;

    const byArea = new Map();
    for (const area of subcategoryOptions) byArea.set(area, []);
    const noArea = [];

    for (const p of filtered) {
      if (p.subcategory && byArea.has(p.subcategory)) {
        byArea.get(p.subcategory).push(p);
      } else {
        noArea.push(p);
      }
    }

    const sections = subcategoryOptions
      .map((area) => ({ title: area, items: byArea.get(area) }))
      .filter((s) => s.items.length > 0);

    if (noArea.length > 0) sections.push({ title: 'Sem área definida', items: noArea });

    return sections;
  }, [filtered, subcategory, subcategoryOptions]);

  const tabItems = CATEGORIES.map((cat) => ({
    key: cat,
    label: CATEGORY_LABELS[cat] || cat,
    icon: CATEGORY_ICON_MAP[cat].icon,
    iconColor: CATEGORY_ICON_MAP[cat].color,
    count: countByCategory[cat],
  }));

  return (
    <div ref={rootRef} style={{ position: 'relative', width: '100%', minHeight: '100dvh', background: color.bg, boxSizing: 'border-box' }}>
      <FixedHeader
        headerRef={headerRef}
        scrollY={scrollY}
        title="Lugares"
        left={<HamburgerMenuButton />}
        tabs={
          <HScrollTabs
            items={tabItems}
            activeKey={category}
            onSelect={(cat) => {
              setCategory(cat);
              setSubcategory('');
            }}
            style={{ marginTop: 0, padding: `0 ${spacing.screenGutter}px` }}
          />
        }
        right={
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div
              onClick={openMap}
              style={{
                height: 38,
                padding: '0 14px',
                borderRadius: 13,
                background: color.surfaceMuted,
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                cursor: 'pointer',
              }}
            >
              <MapIcon size={17} color={color.dark} />
              <span style={{ color: color.dark, fontSize: 13.5, fontWeight: 700 }}>Mapa</span>
            </div>
            <div
              onClick={() => navigate('/lugares/novo')}
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
              <AddIcon size={17} color={color.dark} />
            </div>
          </div>
        }
      />

      <div
        style={{
          marginTop: headerHeight + spacing.controlGap,
          boxSizing: 'border-box',
          padding: `2px ${space.screenGutter}px 120px`,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'stretch', gap: spacing.gapMd, marginBottom: 14 }}>
          <SearchInput value={search} onChange={setSearch} placeholder="Buscar por nome" style={{ flex: 1, marginBottom: 0 }} />

          <div
            onClick={() => setOnlyInItinerary((v) => !v)}
            title="Lugares que estão no roteiro"
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

          {subcategoryOptions.length > 0 && (
            <Select
              label="Área"
              placeholder="Todas as áreas"
              value={subcategory}
              onChange={setSubcategory}
              options={subcategoryOptions}
              icon={MapPointIcon}
              buttonStyle={{ height: 38, boxSizing: 'border-box' }}
            />
          )}
        </div>

        {loading && Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} height={300} radius={radius.cardPhoto} style={{ marginBottom: 16 }} />
        ))}

        {!loading && groupedSections && groupedSections.map((section) => (
          <div key={section.title}>
            <SectionHeader style={{ top: headerHeight }}>{section.title}</SectionHeader>
            {section.items.map((place) => (
              <PlaceCard
                key={place.id}
                place={place}
                onAction={() => goToPlace(place.id)}
                inItinerary={placesInItinerary ? placesInItinerary.has(place.id) : false}
              />
            ))}
          </div>
        ))}

        {!loading && !groupedSections && filtered.map((place) => (
          <PlaceCard
            key={place.id}
            place={place}
            onAction={() => goToPlace(place.id)}
            inItinerary={placesInItinerary ? placesInItinerary.has(place.id) : false}
          />
        ))}

        {!loading && filtered.length === 0 && (
          <div style={{ padding: '30px 0', textAlign: 'center', color: color.faint, fontSize: 13.5, fontWeight: 600 }}>
            Nenhum lugar encontrado nessa categoria.
          </div>
        )}
      </div>

      <AnimatePresence>
        {mapOpen && <PlacesMap key="places-map" places={places} onClose={closeMap} />}
      </AnimatePresence>
    </div>
  );
}
