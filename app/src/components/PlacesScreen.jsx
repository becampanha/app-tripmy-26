import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'motion/react';
import PlaceCard from './PlaceCard.jsx';
import PlacesMap from './PlacesMap.jsx';
import { AddIcon } from '@solar-icons/react/linear/add';
import { MapIcon } from '@solar-icons/react/bold/map';
import { CheckCircleIcon } from '@solar-icons/react/bold/check-circle';
import { StarIcon } from '@solar-icons/react/bold/star';
import { fetchPlaces, toggleFavoritePlace } from '../api/itineraryApi.js';
import { showErrorToast } from '../hooks/useToast.js';
import { getTravelerIdentity } from '../hooks/useTravelerIdentity.js';
import { CATEGORY_ICON_MAP } from '../data/placeTags.js';
import { subcategoriesFor } from '../data/subcategories.js';
import { usePlacesInItinerary } from '../hooks/usePlacesInItinerary.js';
import { getPlacesScreenState, savePlacesScreenState, getCachedPlaces, setCachedPlaces } from '../hooks/usePlacesScreenState.js';
import { useScrollY } from '../hooks/useScrollY.js';
import { useElementHeight } from '../hooks/useElementHeight.js';
import { HamburgerMenuButton } from './HamburgerMenuButton.jsx';
import { FixedHeader, HScrollTabs, SearchInput, SectionHeader, Skeleton, FilterMenu, color, radius, space, spacing } from '../design-system/index.js';
import { STAGGER_CONTAINER, STAGGER_ITEM } from '../design-system/motionPresets.js';
import { useStaggerKey } from '../hooks/useActiveScreen.js';

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
  const [onlyFavorite, setOnlyFavorite] = useState(savedState.onlyFavorite);
  const [search, setSearch] = useState(savedState.search);
  const navigate = useNavigate();
  const location = useLocation();
  const placesInItinerary = usePlacesInItinerary();
  const identity = getTravelerIdentity();
  const rootRef = useRef(null);
  const { scrollY } = useScrollY(rootRef);
  const { ref: headerRef, height: headerHeight } = useElementHeight();
  const staggerKey = useStaggerKey();

  // Mesmo padrão do mapa do Roteiro (ver ScheduleScreen.jsx): abrir o mapa
  // empurra uma entrada real no histórico, pra "voltar" (botão dentro do
  // mapa, gesto ou botão físico do celular) sempre funcionar sozinho, sem
  // lógica própria de "lembrar de onde vim". `mapOpen` é derivado direto de
  // location.state a cada render (não um useState espelhado via useEffect) —
  // um useEffect com [location.state] ou [location.key] como dependência
  // nunca disparava de novo ao voltar: o HashRouter reutiliza a mesma
  // location.key ("default") e pode devolver a mesma referência de state
  // entre navegações pro mesmo pathname, então o mapa abria normalmente mas
  // "voltar" não fechava sozinho (só depois de um 2º clique/navegação forçar
  // outro recálculo qualquer). Lendo direto do location atual a cada render
  // não depende de nenhuma dessas identidades.
  const mapOpen = !!location.state?.mapOpen;
  const openMap = () => navigate(location.pathname, { state: { ...location.state, mapOpen: true } });
  const closeMap = () => navigate(-1);

  // Salva filtros a cada mudança, pra sobreviver à desmontagem ao navegar
  // para a tela de detalhes e voltar.
  useEffect(() => {
    savePlacesScreenState({ category, subcategory, onlyInItinerary, onlyFavorite, search });
  }, [category, subcategory, onlyInItinerary, onlyFavorite, search]);

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
      (!onlyFavorite || (p.favoritedBy && p.favoritedBy.length > 0)) &&
      (!query || p.name.toLowerCase().includes(query))
    );
  }, [places, category, subcategory, onlyInItinerary, onlyFavorite, placesInItinerary, search]);

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

  // Favoritos são por viajante (ver place_favorites/toggleFavoritePlace) —
  // o clique só adiciona/remove a identidade ATIVA deste aparelho da lista
  // favoritedBy do lugar, sem mexer no favorito de ninguém mais.
  // Atualização otimista, mesmo padrão de handleTogglePurchased em
  // ShoppingScreen.jsx: aplica na hora, reverte sozinha se a chamada falhar.
  const handleToggleFavorite = async (place) => {
    const identity = getTravelerIdentity();
    if (!identity) return;

    const currentlyFavorited = (place.favoritedBy || []).includes(identity);
    const nextFavoritedBy = currentlyFavorited
      ? place.favoritedBy.filter((t) => t !== identity)
      : [...(place.favoritedBy || []), identity];

    setPlaces((current) => {
      const next = current.map((p) => (p.id === place.id ? { ...p, favoritedBy: nextFavoritedBy } : p));
      setCachedPlaces(next);
      return next;
    });
    try {
      await toggleFavoritePlace(place.id, identity, !currentlyFavorited);
    } catch (err) {
      setPlaces((current) => {
        const next = current.map((p) => (p.id === place.id ? { ...p, favoritedBy: place.favoritedBy } : p));
        setCachedPlaces(next);
        return next;
      });
      showErrorToast(err, 'Não foi possível atualizar o favorito.');
    }
  };

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
            instanceId="places"
            style={{ marginTop: 0, padding: `0 ${spacing.screenGutter}px` }}
          />
        }
        right={
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
        }
      />

      <motion.div
        // key muda ao trocar de categoria (aba) ou ao sair do estado "sem
        // dado ainda" (skeleton) pela primeira vez — em ambos os casos o
        // bloco desmonta/remonta e o stagger (initial="hidden" animate=
        // "show") dispara de novo, reanimando o conteúdo novo. Enquanto
        // `loading`, a key fica fixa: os skeletons não entram na coreografia.
        key={`${staggerKey}-${loading ? 'skeleton' : `category-${category}-${subcategory || 'all'}`}`}
        variants={STAGGER_CONTAINER}
        initial="hidden"
        animate="show"
        style={{
          marginTop: headerHeight + spacing.controlGap,
          boxSizing: 'border-box',
          padding: `2px ${space.screenGutter}px 120px`,
        }}
      >
        {/* Call-to-action do mapa — mesmo padrão visual/posição do card
            "Ver mapa do parque" da tela de Atrações (imagem estática, sem
            overlay de gradiente, botão preto centralizado por cima).
            Substituiu o antigo botão "Mapa" que ficava na navbar. */}
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
                Ver mapa
              </span>
            </div>
          </div>
        </motion.div>

        <motion.div variants={STAGGER_ITEM} style={{ display: 'flex', alignItems: 'stretch', gap: spacing.gapMd, marginBottom: 14 }}>
          <SearchInput value={search} onChange={setSearch} placeholder="Buscar por nome" style={{ flex: 1, marginBottom: 0 }} />

          <FilterMenu
            active={onlyInItinerary || onlyFavorite || !!subcategory}
            checksLabel="Filtros"
            checks={[
              { label: 'Está no roteiro', icon: CheckCircleIcon, checked: onlyInItinerary, onChange: setOnlyInItinerary },
              { label: 'Favoritos', icon: StarIcon, checked: onlyFavorite, onChange: setOnlyFavorite },
            ]}
            areaLabel="Filtrar por área"
            areaOptions={subcategoryOptions}
            areaValue={subcategory}
            onAreaChange={setSubcategory}
          />
        </motion.div>

        {loading && Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} height={300} radius={radius.cardPhoto} style={{ marginBottom: 16 }} />
        ))}

        {!loading && groupedSections && groupedSections.map((section) => (
          <motion.div key={section.title} variants={STAGGER_ITEM}>
            <SectionHeader style={{ top: headerHeight }}>{section.title}</SectionHeader>
            {section.items.map((place) => (
              <PlaceCard
                key={place.id}
                place={place}
                onAction={() => goToPlace(place.id)}
                onToggleFavorite={() => handleToggleFavorite(place)}
                isFavorite={identity ? (place.favoritedBy || []).includes(identity) : false}
                inItinerary={placesInItinerary ? placesInItinerary.has(place.id) : false}
              />
            ))}
          </motion.div>
        ))}

        {!loading && !groupedSections && (
          <motion.div variants={STAGGER_ITEM}>
            {filtered.map((place) => (
              <PlaceCard
                key={place.id}
                place={place}
                onAction={() => goToPlace(place.id)}
                onToggleFavorite={() => handleToggleFavorite(place)}
                isFavorite={identity ? (place.favoritedBy || []).includes(identity) : false}
                inItinerary={placesInItinerary ? placesInItinerary.has(place.id) : false}
              />
            ))}
          </motion.div>
        )}

        {!loading && filtered.length === 0 && (
          <div style={{ padding: '30px 0', textAlign: 'center', color: color.faint, fontSize: 13.5, fontWeight: 600 }}>
            Nenhum lugar encontrado nessa categoria.
          </div>
        )}
      </motion.div>

      <AnimatePresence>
        {mapOpen && <PlacesMap key="places-map" places={places} onClose={closeMap} />}
      </AnimatePresence>
    </div>
  );
}
