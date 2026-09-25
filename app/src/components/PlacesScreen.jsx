import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import PlaceCard from './PlaceCard.jsx';
import { AddIcon } from '@solar-icons/react/linear/add';
import { fetchPlaces } from '../api/itineraryApi.js';
import { CATEGORY_ICON_MAP } from '../data/placeTags.js';
import { subcategoriesFor } from '../data/subcategories.js';
import { usePlacesInItinerary } from '../hooks/usePlacesInItinerary.js';
import { getPlacesScreenState, savePlacesScreenState, getCachedPlaces, setCachedPlaces } from '../hooks/usePlacesScreenState.js';
import { useScrollY } from '../hooks/useScrollY.js';
import { FixedHeader, HScrollTabs, SearchInput, Toggle, SectionHeader, Skeleton, Select, color, radius, space, spacing, type } from '../design-system/index.js';

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
  const navigate = useNavigate();
  const placesInItinerary = usePlacesInItinerary();
  const rootRef = useRef(null);
  const { scrollY } = useScrollY(rootRef);

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
        scrollY={scrollY}
        title="Lugares"
        right={
          <div
            onClick={() => navigate('/lugares/novo')}
            style={{
              width: 32,
              height: 32,
              borderRadius: 11,
              background: color.surfaceMuted,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
            }}
          >
            <AddIcon size={15} color={color.dark} />
          </div>
        }
      />
      <div style={{ padding: `${space.screenGutter}px ${space.screenGutter}px 0` }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
          <div style={{ ...type.screenTitle, color: color.dark }}>
            Lugares
          </div>

          <div
            onClick={() => navigate('/lugares/novo')}
            style={{
              flex: 'none',
              height: 38,
              width: 38,
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

        <HScrollTabs
          items={tabItems}
          activeKey={category}
          onSelect={(cat) => {
            setCategory(cat);
            setSubcategory('');
          }}
        />
      </div>

      <div
        style={{
          marginTop: spacing.controlGap,
          boxSizing: 'border-box',
          padding: `2px ${space.screenGutter}px 120px`,
        }}
      >
        <SearchInput value={search} onChange={setSearch} placeholder="Buscar por nome" />

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: spacing.gapLg, marginBottom: 14 }}>
          <div
            onClick={() => setOnlyInItinerary((v) => !v)}
            style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', userSelect: 'none', flex: 'none' }}
          >
            <Toggle checked={onlyInItinerary} onChange={setOnlyInItinerary} />
            <span style={{ color: onlyInItinerary ? color.dark : color.muted, fontSize: 12.5, fontWeight: 600 }}>
              Lugares que estão no roteiro
            </span>
          </div>

          {subcategoryOptions.length > 0 && (
            <Select
              label="Área"
              placeholder="Todas as áreas"
              value={subcategory}
              onChange={setSubcategory}
              options={subcategoryOptions}
              buttonStyle={{ padding: '7px 12px', fontSize: 12.5 }}
            />
          )}
        </div>

        {loading && Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} height={300} radius={radius.cardPhoto} style={{ marginBottom: 16 }} />
        ))}

        {!loading && groupedSections && groupedSections.map((section) => (
          <div key={section.title}>
            <SectionHeader>{section.title}</SectionHeader>
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
    </div>
  );
}
