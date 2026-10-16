import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'motion/react';
import { AddIcon } from '@solar-icons/react/linear/add';
import { ListIcon } from '@solar-icons/react/bold/list';
import { PostsCarouselHorizontalIcon } from '@solar-icons/react/bold/posts-carousel-horizontal';
import { useAllRecommendations } from '../hooks/useAllRecommendations.js';
import { getRecommendationsScreenState, saveRecommendationsScreenState } from '../hooks/useRecommendationsScreenState.js';
import { useScrollY } from '../hooks/useScrollY.js';
import { useElementHeight } from '../hooks/useElementHeight.js';
import { createRecommendation, updateRecommendation, deleteRecommendation, uploadPlacePhoto } from '../api/itineraryApi.js';
import { showToast, showErrorToast } from '../hooks/useToast.js';
import { TIP_CATEGORIES, TIP_CATEGORY_ICON } from '../data/tipCategories.js';
import RecommendationModal from './RecommendationModal.jsx';
import RecommendationEditModal from './RecommendationEditModal.jsx';
import RecommendationCardStack from './RecommendationCardStack.jsx';
import { HamburgerMenuButton } from './HamburgerMenuButton.jsx';
import { FixedHeader, HScrollTabs, RecommendationCard, YoutubeVideoModal, SectionHeader, Skeleton, color, radius, spacing } from '../design-system/index.js';
import { STAGGER_CONTAINER, STAGGER_ITEM } from '../design-system/motionPresets.js';
import { useStaggerKey } from '../hooks/useActiveScreen.js';

const NO_AREA_LABEL = 'Outros lugares';
const NO_PLACE_LABEL = 'Sem lugar';

// Agrupa por área do lugar (place.subcategory — ex: "Disney Springs"),
// mantendo juntas todas as recomendações do mesmo lugar dentro da área —
// antes a lista vinha só na ordem de quem publicou por último. Dicas sem
// lugar vinculado caem todas numa seção própria ("Sem lugar"), sempre por
// último.
function groupByArea(recommendations) {
  const byArea = new Map();
  const noPlace = [];
  for (const rec of recommendations) {
    if (!rec.place) {
      noPlace.push(rec);
      continue;
    }
    const area = rec.place.subcategory || NO_AREA_LABEL;
    if (!byArea.has(area)) byArea.set(area, new Map());
    const byPlace = byArea.get(area);
    if (!byPlace.has(rec.place.id)) byPlace.set(rec.place.id, []);
    byPlace.get(rec.place.id).push(rec);
  }

  const sections = Array.from(byArea.entries()).map(([area, byPlace]) => ({
    area,
    items: Array.from(byPlace.values())
      .sort((a, b) => a[0].place.name.localeCompare(b[0].place.name))
      .flat(),
  }));

  // "Outros lugares" (sem área cadastrada) sempre por último, o resto em
  // ordem alfabética — mesmo critério usado em Lugares/Atrações. "Sem
  // lugar" (dicas soltas) fica no fim de tudo.
  sections.sort((a, b) => {
    if (a.area === NO_AREA_LABEL) return 1;
    if (b.area === NO_AREA_LABEL) return -1;
    return a.area.localeCompare(b.area);
  });

  if (noPlace.length > 0) sections.push({ area: NO_PLACE_LABEL, items: noPlace });

  return sections;
}

// Segmented control (pílula com 2 ícones, fundo destacado desliza atrás do
// ativo) — alternativa compacta aos dois botões separados com texto, pedida
// pelo usuário a partir de referência visual (estilo "Preview/Code" do
// GitHub). layoutId faz o Framer Motion animar o fundo entre as posições
// automaticamente quando viewMode muda, sem precisar calcular offset manual.
function ViewModeSegmentedToggle({ viewMode, onChange }) {
  const options = [
    { key: 'list', Icon: ListIcon, label: 'Lista' },
    { key: 'cards', Icon: PostsCarouselHorizontalIcon, label: 'Carrossel' },
  ];
  return (
    <div
      style={{
        display: 'flex',
        padding: 3,
        borderRadius: 13,
        background: color.surfaceMuted,
        gap: 2,
      }}
    >
      {options.map(({ key, Icon, label }) => {
        const active = viewMode === key;
        return (
          <div
            key={key}
            onClick={() => onChange(key)}
            style={{
              position: 'relative',
              height: 32,
              padding: active ? '0 10px' : '0 8px',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              cursor: 'pointer',
            }}
          >
            {active && (
              <motion.div
                layoutId="recommendations-viewmode-pill"
                transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                style={{
                  position: 'absolute',
                  inset: 0,
                  borderRadius: 10,
                  background: '#fff',
                  boxShadow: '0 1px 4px rgba(0,0,0,0.15)',
                }}
              />
            )}
            <Icon size={16} color={active ? color.dark : color.muted} style={{ position: 'relative' }} />
            {active && (
              <span style={{ position: 'relative', color: color.dark, fontSize: 13, fontWeight: 700, whiteSpace: 'nowrap' }}>
                {label}
              </span>
            )}
          </div>
        );
      })}
    </div>
  );
}

function RecommendationsSkeleton() {
  return (
    <>
      {Array.from({ length: 3 }).map((_, i) => (
        <div
          key={i}
          style={{ display: 'flex', gap: 12, alignItems: 'center', padding: 14, marginBottom: 10, background: color.bg, border: `1px solid ${color.border}`, borderRadius: radius.card }}
        >
          <Skeleton width={40} height={13} />
          <div style={{ flex: 1 }}>
            <Skeleton width="70%" height={15} />
            <Skeleton width="45%" height={12} style={{ marginTop: 6 }} />
          </div>
        </div>
      ))}
    </>
  );
}

export default function RecommendationsScreen() {
  const { recommendations, addRecommendation, patchRecommendation, removeRecommendation } = useAllRecommendations();
  const navigate = useNavigate();
  const { scrollY, anchorRef } = useScrollY();
  const { ref: headerRef, height: headerHeight } = useElementHeight();
  const staggerKey = useStaggerKey();
  const [editingRecommendation, setEditingRecommendation] = useState(null);
  const [creatingRecommendation, setCreatingRecommendation] = useState(false);
  const [videoModalRec, setVideoModalRec] = useState(null);
  // Padrão 'cards', mas lembra a última escolha do usuário entre navegações
  // (ver useRecommendationsScreenState.js) — mesmo padrão de persistência já
  // usado em Lugares/Atrações.
  const [viewMode, setViewModeState] = useState(() => getRecommendationsScreenState().viewMode);
  const setViewMode = (mode) => {
    setViewModeState(mode);
    saveRecommendationsScreenState({ viewMode: mode });
  };
  const [category, setCategoryState] = useState(() => getRecommendationsScreenState().category || TIP_CATEGORIES[0]);
  const setCategory = (cat) => {
    setCategoryState(cat);
    saveRecommendationsScreenState({ category: cat });
  };

  const countByCategory = useMemo(() => {
    const counts = {};
    for (const rec of recommendations || []) counts[rec.category] = (counts[rec.category] || 0) + 1;
    return counts;
  }, [recommendations]);

  const filteredRecommendations = useMemo(
    () => (recommendations ? recommendations.filter((rec) => rec.category === category) : null),
    [recommendations, category]
  );

  const sections = useMemo(
    () => (filteredRecommendations ? groupByArea(filteredRecommendations) : null),
    [filteredRecommendations]
  );

  // Só mostra como aba a categoria que tiver pelo menos 1 dica — nada de
  // listar as 6 categorias fixas sempre, a maioria vazia pra maioria das
  // viagens (mesmo critério já usado em Compras/ShoppingScreen.jsx).
  const categoriesWithItems = TIP_CATEGORIES.filter((cat) => countByCategory[cat] > 0);
  const tabItems = categoriesWithItems.map((cat) => ({
    key: cat,
    label: cat,
    icon: TIP_CATEGORY_ICON[cat],
    count: countByCategory[cat],
  }));

  // Se a categoria selecionada ficar sem nenhuma dica (ex: apagou a última
  // dela, ou é a visita inicial e ela nunca teve dica), a aba correspondente
  // some da lista — pula pra primeira categoria que ainda tem dica, pra
  // nunca ficar "presa" numa aba invisível.
  useEffect(() => {
    if (recommendations === null) return;
    if (categoriesWithItems.length > 0 && !categoriesWithItems.includes(category)) {
      setCategory(categoriesWithItems[0]);
    }
  }, [recommendations, categoriesWithItems, category]);

  const handlePublishRecommendation = async ({ title, author, description, category: recCategory, youtubeVideoId, photoFile, placeId, place }) => {
    try {
      let photo = null;
      if (photoFile) {
        const { url } = await uploadPlacePhoto(photoFile);
        photo = url;
      }
      const created = await createRecommendation({ placeId, title, author, description, photo, category: recCategory, youtubeVideoId });
      // A API devolve só os campos da própria dica (sem o lugar aninhado) —
      // o objeto `place` completo já veio do PlaceSelectorModal dentro do
      // modal, então é só anexar aqui pra renderizar o card na hora, sem
      // esperar o próximo refetch.
      addRecommendation({ ...created, place: place || null });
      setCreatingRecommendation(false);
      showToast('Dica publicada com sucesso');
    } catch (err) {
      showErrorToast(err, 'Não foi possível publicar a dica.');
      throw err;
    }
  };

  const handleSaveRecommendation = async ({ title, author, description, category: recCategory, youtubeVideoId, photo, photoFile, placeId, place }) => {
    try {
      let finalPhoto = photo;
      if (photoFile) {
        const { url } = await uploadPlacePhoto(photoFile);
        finalPhoto = url;
      }
      const fields = { title, author, description, photo: finalPhoto, placeId, category: recCategory, youtubeVideoId };
      await updateRecommendation(editingRecommendation.id, fields);
      // A API de update não devolve o lugar aninhado — igual na criação
      // (handlePublishRecommendation), o objeto `place` completo já veio do
      // PlaceSelectorModal dentro do modal, então atualiza o estado local
      // direto com ele, sem esperar o próximo refetch.
      patchRecommendation(editingRecommendation.id, { ...fields, place: place || null });
      setEditingRecommendation(null);
      showToast('Dica atualizada com sucesso');
    } catch (err) {
      showErrorToast(err, 'Não foi possível atualizar a dica.');
      throw err;
    }
  };

  const handleDeleteRecommendation = async () => {
    try {
      await deleteRecommendation(editingRecommendation.id);
      removeRecommendation(editingRecommendation.id);
      setEditingRecommendation(null);
      showToast('Dica removida com sucesso');
    } catch (err) {
      showErrorToast(err, 'Não foi possível remover a dica.');
      throw err;
    }
  };

  return (
    <div ref={anchorRef} style={{ position: 'relative', width: '100%', minHeight: '100dvh', background: color.bg, boxSizing: 'border-box' }}>
      <FixedHeader
        headerRef={headerRef}
        scrollY={scrollY}
        title="Dicas"
        left={<HamburgerMenuButton />}
        tabs={
          <HScrollTabs
            items={tabItems}
            activeKey={category}
            onSelect={setCategory}
            instanceId="recommendations"
            style={{ marginTop: 0, padding: `0 ${spacing.screenGutter}px` }}
          />
        }
        right={
          <>
            <ViewModeSegmentedToggle viewMode={viewMode} onChange={setViewMode} />
            <div
              onClick={() => setCreatingRecommendation(true)}
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
          </>
        }
      />

      {viewMode === 'list' ? (
        // marginTop sem + spacing.controlGap (diferente de Lugares/Atrações):
        // esta tela não tem barra de busca entre o header e o primeiro
        // SectionHeader, que já tem seu próprio respiro de sobra — com o
        // controlGap extra, o espaço até "Disney" ficava maior que o das
        // telas que têm busca ali no meio.
        <motion.div
          // key muda ao trocar de categoria (aba) ou ao sair do estado "sem
          // dado ainda" pela primeira vez — ver mesmo padrão em
          // ScheduleScreen.jsx.
          key={`${staggerKey}-${recommendations === null ? 'skeleton' : `category-${category}`}`}
          variants={STAGGER_CONTAINER}
          initial="hidden"
          animate="show"
          style={{ marginTop: headerHeight, boxSizing: 'border-box', padding: `2px ${spacing.screenGutter}px 120px` }}
        >
          {recommendations === null && <RecommendationsSkeleton />}

          {filteredRecommendations && filteredRecommendations.length === 0 && (
            <div style={{ padding: '30px 0', textAlign: 'center', color: color.faint, fontSize: 13.5, fontWeight: 600 }}>
              Nenhuma dica nesta categoria ainda.
            </div>
          )}

          {sections && sections.map((section) => (
            <motion.div key={section.area} variants={STAGGER_ITEM}>
              <SectionHeader style={{ top: headerHeight }}>{section.area}</SectionHeader>
              {section.items.map((rec) => (
                <RecommendationCard
                  key={rec.id}
                  recommendation={rec}
                  place={rec.place}
                  onClick={rec.place ? () => navigate(`/lugares/${rec.place.id}`) : undefined}
                  onEdit={() => setEditingRecommendation(rec)}
                  onPlayVideo={() => setVideoModalRec(rec)}
                />
              ))}
            </motion.div>
          ))}
        </motion.div>
      ) : (
        // key={category}: força remontar o carrossel ao trocar de aba — o
        // slide inicial sorteado (ver hasPickedStartRef em
        // RecommendationCardStack.jsx) e a posição do track ficam presos na
        // categoria anterior sem isso, e se a nova categoria tiver menos
        // itens, o índice sorteado antes fica fora do range (carrossel em
        // branco, nenhum erro — o item simplesmente não existe naquela
        // posição do array).
        <RecommendationCardStack
          key={category}
          recommendations={filteredRecommendations}
          headerHeight={headerHeight}
        />
      )}

      <AnimatePresence>
        {editingRecommendation && (
          <RecommendationEditModal
            key="recommendation-edit-modal"
            recommendation={editingRecommendation}
            onSave={handleSaveRecommendation}
            onDelete={handleDeleteRecommendation}
            onClose={() => setEditingRecommendation(null)}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {creatingRecommendation && (
          <RecommendationModal
            key="recommendation-create-modal"
            showPlaceField
            onSubmit={handlePublishRecommendation}
            onClose={() => setCreatingRecommendation(false)}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {videoModalRec && (
          <YoutubeVideoModal
            key="recommendation-video-modal"
            videoId={videoModalRec.youtubeVideoId}
            title={videoModalRec.title || 'Vídeo da dica'}
            onClose={() => setVideoModalRec(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
