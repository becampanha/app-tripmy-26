import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { AnimatePresence, Reorder, motion } from 'motion/react';
import { PenIcon } from '@solar-icons/react/linear/pen';
import { AddIcon } from '@solar-icons/react/linear/add';
import { ListIcon } from '@solar-icons/react/linear/list';
import { RouteIcon } from '@solar-icons/react/bold/route';
import { MapIcon } from '@solar-icons/react/bold/map';
import DayTabs from './DayTabs.jsx';
import ActivityItem from './ActivityItem.jsx';
import ItineraryCardItem from './ItineraryCardItem.jsx';
import DistanceBetween from './DistanceBetween.jsx';
import PlaceSelectorModal from './PlaceSelectorModal.jsx';
import AttractionSelectorModal from './AttractionSelectorModal.jsx';
import MoveToDayModal from './MoveToDayModal.jsx';
import DayMap from './DayMap.jsx';
import EditActionBar from './EditActionBar.jsx';
import { HamburgerMenuButton } from './HamburgerMenuButton.jsx';
import { useItinerary } from '../hooks/useItinerary.js';
import { useDayWeather } from '../hooks/useDayWeather.js';
import { setGlobalEditing } from '../hooks/useEditingState.js';
import { showToast, showErrorToast } from '../hooks/useToast.js';
import { useScrollY } from '../hooks/useScrollY.js';
import { usePullToRefresh } from '../hooks/usePullToRefresh.js';
import { useElementHeight } from '../hooks/useElementHeight.js';
import { getScheduleScreenState, saveScheduleScreenState } from '../hooks/useScheduleScreenState.js';
import { createActivity, updateActivity, deleteActivity, reorderActivities, updateDay, moveActivityToDay } from '../api/itineraryApi.js';
import { weatherEmoji } from '../data/weatherCodes.js';
import { FixedHeader, PullToRefreshIndicator, Skeleton, color, radius, spacing, type } from '../design-system/index.js';
import { STAGGER_CONTAINER, STAGGER_ITEM } from '../design-system/motionPresets.js';
import { useStaggerKey } from '../hooks/useActiveScreen.js';

const EDITABLE_FIELDS = ['time', 'title', 'subtitle', 'placeId', 'attractionId'];

function activityFields(act) {
  return {
    type: act.type || 'simple',
    time: act.time || '',
    title: act.title || '',
    subtitle: act.subtitle || '',
    placeId: act.place ? act.place.id : null,
    place: act.place || null,
    attractionId: act.attraction ? act.attraction.id : null,
    attraction: act.attraction || null,
    // Fase 3: card 'itinerary' ganha subitens no draft, mas ainda não são
    // editáveis por aqui — preserva o que já veio da API intacto, sem
    // achatar/perder (seriam sobrescritos ao reabrir o modo edição senão).
    // CRUD de subitens vem na fase 4.
    items: act.items ? act.items.map((sub) => ({ id: sub.id, ...activityFields(sub) })) : undefined,
  };
}

let nextDraftId = -1;

// Divisor clicável entre dois itens (ou antes do primeiro/depois do último)
// pra inserir conteúdo novo naquela posição exata, em vez de só no fim da
// lista. Fica discreto (sem borda tracejada grande) pra não parecer um item
// de atividade de verdade no meio da lista. Dois alvos lado a lado — não um
// ActionSheet — pra criar uma atividade simples (igual sempre foi) ou um
// card "Roteiro" novo (mini-roteiro com subitens, ver ItineraryCardItem.jsx).
function AddActivityDivider({ onAddActivity, onAddItineraryCard }) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        height: 22,
        margin: '-4px 0 2px',
      }}
    >
      <div
        onClick={onAddActivity}
        style={{
          width: 26,
          height: 26,
          borderRadius: 13,
          border: `1.5px dashed ${color.dashedBorder}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: color.bg,
          cursor: 'pointer',
        }}
      >
        <AddIcon size={14} color={color.dark} />
      </div>
      <div
        onClick={onAddItineraryCard}
        style={{
          width: 26,
          height: 26,
          borderRadius: 13,
          border: `1.5px dashed ${color.dashedBorder}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: color.bg,
          cursor: 'pointer',
        }}
      >
        <RouteIcon size={14} color={color.dark} />
      </div>
    </div>
  );
}

function ActivitySkeleton() {
  return (
    <div style={{ display: 'flex', gap: 12, alignItems: 'center', padding: 14, marginBottom: 10, background: color.bg, border: `1px solid ${color.border}`, borderRadius: radius.card }}>
      <Skeleton width={40} height={13} />
      <Skeleton width={8} height={8} radius={4} />
      <div style={{ flex: 1 }}>
        <Skeleton width="70%" height={15} />
        <Skeleton width="45%" height={12} style={{ marginTop: 6 }} />
      </div>
    </div>
  );
}

export default function ScheduleScreen() {
  const location = useLocation();
  const navigate = useNavigate();
  const savedState = useRef(getScheduleScreenState()).current;
  // Prioridade: veio de "Resumo do Roteiro" com um dia específico (state da
  // navegação) > último dia visitado nesta sessão (savedState) > dia 1.
  const [selectedDay, setSelectedDay] = useState(
    () => location.state?.selectedDay ?? savedState.selectedDay ?? 1
  );
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [selectorFor, setSelectorFor] = useState(null); // activity id (ou id negativo temporário de item recém-criado) pedindo um lugar
  const [attractionSelectorFor, setAttractionSelectorFor] = useState(null); // mesmo esquema, para o seletor de atração
  const [movingActivity, setMovingActivity] = useState(null); // activity sendo movida de dia (abre o MoveToDayModal)
  const [moving, setMoving] = useState(false);
  const staggerKey = useStaggerKey();
  const { days, loading, reload } = useItinerary();
  const { scrollY, anchorRef } = useScrollY();
  const { ref: headerRef, height: headerHeight } = useElementHeight();
  const pullToRefresh = usePullToRefresh(anchorRef);

  // Salva o dia selecionado a cada mudança, pra sobreviver à desmontagem ao
  // navegar para outra tela e voltar (mesmo padrão de usePlacesScreenState).
  useEffect(() => {
    saveScheduleScreenState({ selectedDay });
  }, [selectedDay]);

  // Restaura a posição de scroll salva assim que o roteiro carrega. Quem
  // rola de fato é o motion.div ancestral (overflowY: auto, ver App.jsx).
  useLayoutEffect(() => {
    if (loading) return;
    const scroller = anchorRef.current?.closest('[data-scroll-root]');
    if (scroller && savedState.scrollTop) {
      scroller.scrollTop = savedState.scrollTop;
    }
  }, [loading]);

  // Salva a posição de scroll continuamente (não só ao clicar num botão
  // específico) — diferente de Lugares, a navegação pra fora do Roteiro
  // acontece de várias formas (trocar de aba, abrir Resumo do Roteiro, abrir
  // um lugar vinculado a uma atividade), não dá pra interceptar uma por uma.
  useEffect(() => {
    const scroller = anchorRef.current?.closest('[data-scroll-root]');
    if (!scroller) return;
    const onScroll = () => saveScheduleScreenState({ scrollTop: scroller.scrollTop });
    scroller.addEventListener('scroll', onScroll, { passive: true });
    return () => scroller.removeEventListener('scroll', onScroll);
  }, []);
  // Enquanto editing=true, toda mutação (digitar, mover, excluir, adicionar,
  // vincular lugar) só mexe neste estado local — nada de chamada de rede a
  // cada tecla. As chamadas de API só acontecem de uma vez, em lote, quando
  // o usuário clica em Salvar (handleSave). Isso evita a lentidão de um
  // PUT + reload a cada campo editado que existia antes.
  const [draft, setDraft] = useState(null); // { dayId, theme, activities: [...] }
  const originalRef = useRef(null); // snapshot pré-edição, para diff no Salvar

  // Abrir o mapa empurra uma entrada real no histórico (mesmo pathname, só
  // muda o state) — sem isso, o mapa é só um overlay local, e ao clicar
  // "Ver detalhes" lá dentro e depois "voltar" na tela de detalhes, o
  // navigate(-1) pulava o mapa direto pra tela de Roteiro, porque o mapa
  // nunca tinha existido como entrada de histórico. Com essa entrada, voltar
  // (seja pelo botão da tela de detalhes, seja pelo gesto/botão físico do
  // celular) resolve sozinho, sem lógica própria de "lembrar de onde vim".
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

  // Avisa o Shell (App.jsx) pra esconder a BottomTabBar enquanto esta tela
  // está em edição — ela some pra dar lugar à EditActionBar (Cancelar/Salvar).
  useEffect(() => {
    setGlobalEditing(editing);
    return () => setGlobalEditing(false);
  }, [editing]);

  const currentDay = days ? days[selectedDay] : null;
  const weatherByDay = useDayWeather(days);
  const currentWeather = currentDay ? weatherByDay[currentDay.id] : null;

  const displayDay = editing && draft ? draft : currentDay;
  const n = displayDay ? displayDay.activities.length : 0;

  const startEditing = () => {
    if (!currentDay) return;
    const snapshot = {
      dayId: currentDay.id,
      theme: currentDay.theme,
      activities: currentDay.activities.map((act) => ({ id: act.id, ...activityFields(act) })),
    };
    originalRef.current = snapshot;
    setDraft({
      dayId: snapshot.dayId,
      theme: snapshot.theme,
      activities: snapshot.activities.map((a) => ({ ...a })),
    });
    setEditing(true);
  };

  const patchDraftActivity = (id, fields) => {
    setDraft((d) => ({
      ...d,
      activities: d.activities.map((a) => (a.id === id ? { ...a, ...fields } : a)),
    }));
  };

  const handleDelete = (id) => {
    setDraft((d) => ({ ...d, activities: d.activities.filter((a) => a.id !== id) }));
  };

  const handleUnlinkPlace = (id) => {
    patchDraftActivity(id, { placeId: null, place: null });
  };

  const handleUnlinkAttraction = (id) => {
    patchDraftActivity(id, { attractionId: null, attraction: null });
  };

  const handleReorder = (activities) => {
    setDraft((d) => ({ ...d, activities }));
  };

  const handleMove = (index, delta) => {
    setDraft((d) => {
      const activities = d.activities.slice();
      const targetIndex = index + delta;
      if (targetIndex < 0 || targetIndex >= activities.length) return d;
      [activities[index], activities[targetIndex]] = [activities[targetIndex], activities[index]];
      return { ...d, activities };
    });
  };

  // Mover pra outro dia persiste na hora (diferente das outras edições, que
  // só mexem no draft local até o Salvar geral) — o dia de destino não faz
  // parte do draft desta tela, então não dá pra "ficar pendente" até salvar
  // sem reimplementar o diff de dois dias ao mesmo tempo. Só é oferecido
  // para atividades já existentes (id positivo); um item recém-criado ainda
  // não tem contrapartida no banco pra mover.
  const handleMoveToDay = async (activity, targetDay) => {
    setMoving(true);
    try {
      await moveActivityToDay(activity.id, targetDay.id);
      setDraft((d) => ({ ...d, activities: d.activities.filter((a) => a.id !== activity.id) }));
      setMovingActivity(null);
      await reload(true);
      showToast(`Movido para ${targetDay.weekday} · ${targetDay.date}`);
    } catch (err) {
      showErrorToast(err, 'Não foi possível mover a atividade.');
    } finally {
      setMoving(false);
    }
  };

  const handleAddActivity = (atIndex) => {
    const id = nextDraftId--;
    const newActivity = { id, type: 'simple', time: '', title: '', subtitle: '', placeId: null, place: null, attractionId: null, attraction: null };
    setDraft((d) => {
      const activities = d.activities.slice();
      const insertAt = atIndex === undefined ? activities.length : atIndex;
      activities.splice(insertAt, 0, newActivity);
      return { ...d, activities };
    });
  };

  // Mesmo padrão de handleAddActivity, mas type:'itinerary' e items: [].
  const handleAddItineraryCard = (atIndex) => {
    const id = nextDraftId--;
    const newCard = { id, type: 'itinerary', time: '', title: '', subtitle: '', placeId: null, place: null, attractionId: null, attraction: null, items: [] };
    setDraft((d) => {
      const activities = d.activities.slice();
      const insertAt = atIndex === undefined ? activities.length : atIndex;
      activities.splice(insertAt, 0, newCard);
      return { ...d, activities };
    });
  };

  // Subitens vivem dentro de activity.items (array), não no nível raiz do
  // draft — todas as funções abaixo navegam até o card pelo cardId antes de
  // alterar o item. Sem horário próprio (ver ItinerarySubItem) — a ordem
  // entre irmãos é só a posição no array.
  const patchDraftSubItem = (cardId, subItemId, fields) => {
    setDraft((d) => ({
      ...d,
      activities: d.activities.map((a) =>
        a.id === cardId
          ? { ...a, items: a.items.map((sub) => (sub.id === subItemId ? { ...sub, ...fields } : sub)) }
          : a
      ),
    }));
  };

  const handleAddSubItem = (cardId, atIndex) => {
    const id = nextDraftId--;
    const newSubItem = { id, type: 'itinerary_item', time: '', title: '', subtitle: '', placeId: null, place: null, attractionId: null, attraction: null };
    setDraft((d) => ({
      ...d,
      activities: d.activities.map((a) => {
        if (a.id !== cardId) return a;
        const items = a.items.slice();
        const insertAt = atIndex === undefined ? items.length : atIndex;
        items.splice(insertAt, 0, newSubItem);
        return { ...a, items };
      }),
    }));
  };

  const handleDeleteSubItem = (cardId, subItemId) => {
    setDraft((d) => ({
      ...d,
      activities: d.activities.map((a) =>
        a.id === cardId ? { ...a, items: a.items.filter((sub) => sub.id !== subItemId) } : a
      ),
    }));
  };

  const handleMoveSubItem = (cardId, index, delta) => {
    setDraft((d) => ({
      ...d,
      activities: d.activities.map((a) => {
        if (a.id !== cardId) return a;
        const items = a.items.slice();
        const targetIndex = index + delta;
        if (targetIndex < 0 || targetIndex >= items.length) return a;
        [items[index], items[targetIndex]] = [items[targetIndex], items[index]];
        return { ...a, items };
      }),
    }));
  };

  // Callback do Reorder.Group interno de um card — já recebe o array inteiro
  // reordenado pronto (mesmo padrão de handleReorder no nível raiz).
  const handleReorderSubItems = (cardId, items) => {
    setDraft((d) => ({
      ...d,
      activities: d.activities.map((a) => (a.id === cardId ? { ...a, items } : a)),
    }));
  };

  const handleUnlinkSubItemPlace = (cardId, subItemId) => {
    patchDraftSubItem(cardId, subItemId, { placeId: null, place: null });
  };

  const handleUnlinkSubItemAttraction = (cardId, subItemId) => {
    patchDraftSubItem(cardId, subItemId, { attractionId: null, attraction: null });
  };

  // selectorFor/attractionSelectorFor guardam um id simples (atividade de
  // nível raiz) OU { cardId, subItemId } (subitem de um card) — os dois
  // formatos convivem no mesmo state pra reaproveitar PlaceSelectorModal/
  // AttractionSelectorModal sem duplicar modal nem state por nível.
  const handleSelectPlace = (place) => {
    if (selectorFor && typeof selectorFor === 'object') {
      patchDraftSubItem(selectorFor.cardId, selectorFor.subItemId, { placeId: place.id, place, attractionId: null, attraction: null });
    } else {
      patchDraftActivity(selectorFor, { placeId: place.id, place, attractionId: null, attraction: null });
    }
    setSelectorFor(null);
  };

  const handleSelectAttraction = (attraction) => {
    if (attractionSelectorFor && typeof attractionSelectorFor === 'object') {
      patchDraftSubItem(attractionSelectorFor.cardId, attractionSelectorFor.subItemId, { attractionId: attraction.id, attraction, placeId: null, place: null });
    } else {
      patchDraftActivity(attractionSelectorFor, { attractionId: attraction.id, attraction, placeId: null, place: null });
    }
    setAttractionSelectorFor(null);
  };

  const handleCancel = () => {
    setEditing(false);
    setDraft(null);
    originalRef.current = null;
  };

  const handleSave = async () => {
    const before = originalRef.current.activities;
    const after = draft.activities;
    const beforeIds = new Set(before.map((a) => a.id));

    setSaving(true);
    try {
      if (draft.theme !== originalRef.current.theme) {
        await updateDay(draft.dayId, { theme: draft.theme });
      }

      // Itens removidos durante a edição.
      for (const act of before) {
        if (!after.some((a) => a.id === act.id)) {
          await deleteActivity(act.id);
        }
      }

      // Itens existentes: só envia PUT para quem de fato mudou algum campo.
      for (const act of after) {
        if (!beforeIds.has(act.id)) continue;
        const original = before.find((a) => a.id === act.id);
        const changed = EDITABLE_FIELDS.some((f) => act[f] !== original[f]);
        if (changed) {
          await updateActivity(act.id, {
            time: act.time,
            title: act.title,
            subtitle: act.subtitle,
            placeId: act.placeId,
            attractionId: act.attractionId,
          });
        }
      }

      // Itens novos (criados durante a edição, id temporário negativo). Um
      // card novo ('itinerary') nasce sem subitens no banco — eles são
      // criados logo abaixo, já com o id real do card como parentActivityId.
      const idMap = {};
      for (const act of after) {
        if (act.id < 0) {
          const created = await createActivity({
            dayId: draft.dayId,
            type: act.type,
            time: act.time,
            title: act.title,
            subtitle: act.subtitle,
            placeId: act.placeId,
            attractionId: act.attractionId,
          });
          idMap[act.id] = created.id;
        }
      }

      // Ordem final, já com os ids reais dos itens recém-criados.
      await reorderActivities(
        after.map((act, i) => ({ id: idMap[act.id] || act.id, dayId: draft.dayId, sortOrder: i }))
      );

      // Diff de subitens, um card por vez — mesma lógica de "removido /
      // mudou / novo / ordem final" do nível raiz acima, só que escopada aos
      // irmãos de um mesmo parentActivityId em vez de um dayId inteiro.
      for (const act of after) {
        if (act.type !== 'itinerary') continue;
        const cardRealId = idMap[act.id] || act.id;
        const originalCard = before.find((a) => a.id === act.id);
        const beforeItems = originalCard?.items || [];
        const afterItems = act.items || [];
        const beforeItemIds = new Set(beforeItems.map((sub) => sub.id));

        for (const sub of beforeItems) {
          if (!afterItems.some((s) => s.id === sub.id)) {
            await deleteActivity(sub.id);
          }
        }

        for (const sub of afterItems) {
          if (!beforeItemIds.has(sub.id)) continue;
          const originalSub = beforeItems.find((s) => s.id === sub.id);
          const changed = EDITABLE_FIELDS.some((f) => sub[f] !== originalSub[f]);
          if (changed) {
            await updateActivity(sub.id, {
              title: sub.title,
              subtitle: sub.subtitle,
              placeId: sub.placeId,
              attractionId: sub.attractionId,
            });
          }
        }

        const subItemIdMap = {};
        for (const sub of afterItems) {
          if (sub.id < 0) {
            const created = await createActivity({
              dayId: draft.dayId,
              type: 'itinerary_item',
              parentActivityId: cardRealId,
              title: sub.title,
              subtitle: sub.subtitle,
              placeId: sub.placeId,
              attractionId: sub.attractionId,
            });
            subItemIdMap[sub.id] = created.id;
          }
        }

        if (afterItems.length > 0) {
          await reorderActivities(
            afterItems.map((sub, i) => ({
              id: subItemIdMap[sub.id] || sub.id,
              dayId: draft.dayId,
              sortOrder: i,
              parentActivityId: cardRealId,
            }))
          );
        }
      }

      setEditing(false);
      setDraft(null);
      originalRef.current = null;
      await reload(true);
      showToast('Edição realizada com sucesso');
    } catch (err) {
      showErrorToast(err, 'Não foi possível salvar as alterações do roteiro.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div ref={anchorRef} style={{ position: 'relative', width: '100%', minHeight: '100dvh', background: color.bg, boxSizing: 'border-box' }}>
      <FixedHeader
        headerRef={headerRef}
        scrollY={scrollY}
        title="Roteiro"
        left={!editing && <HamburgerMenuButton />}
        tabs={!editing && <DayTabs days={days} selected={selectedDay} onSelect={setSelectedDay} instanceId="schedule" style={{ marginTop: 0, padding: `0 ${spacing.screenGutter}px` }} />}
        right={
          !editing && (
            <>
              <div
                onClick={() => navigate('/roteiro/dias')}
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
                <ListIcon size={17} color={color.dark} />
                <span style={{ color: color.dark, fontSize: 13.5, fontWeight: 700 }}>Resumo</span>
              </div>
              <div
                onClick={startEditing}
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
                <PenIcon size={17} color={color.dark} />
              </div>
            </>
          )
        }
      />

      <div style={{ position: 'absolute', top: headerHeight, left: 0, right: 0 }}>
        <PullToRefreshIndicator {...pullToRefresh} />
      </div>

      <motion.div
        // key muda quando (a) o dia selecionado muda, ou (b) o conteúdo sai
        // do estado "sem dado ainda" (skeleton) pra "tenho displayDay" pela
        // primeira vez — em ambos os casos o React desmonta e remonta este
        // bloco do zero, o que faz o stagger (initial="hidden" animate=
        // "show") disparar de novo. Enquanto não há displayDay (nem cache,
        // nem resposta da API ainda), a key fica fixa em 'skeleton': o bloco
        // não remonta a cada render nesse meio tempo, e os skeletons (que
        // não têm variants) aparecem direto, sem entrar na coreografia —
        // misturar skeleton no stagger fazia a troca skeleton→conteúdo real
        // (quando os dados chegam depois do primeiro render) não reanimar
        // direito, porque o container já tinha disparado "show" uma vez.
        key={`${staggerKey}-${displayDay ? `day-${selectedDay}` : 'skeleton'}`}
        variants={STAGGER_CONTAINER}
        initial="hidden"
        animate="show"
        style={{
          marginTop: headerHeight + 16,
          boxSizing: 'border-box',
          padding: '0 22px 120px',
        }}
      >
        {/* Call-to-action do mapa do dia — imagem estática fixa (não
            gerada por API em tempo real, arquivo salvo em public/), sem
            overlay; o botão preto por cima leva pro mapa de verdade, com os
            pontos reais das atividades do dia, montado ao abrir o DayMap em
            tela cheia. Some durante a edição: não faz sentido abrir o mapa
            enquanto o roteiro está sendo editado em rascunho local. */}
        {!editing && (
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
                  Ver roteiro no mapa
                </span>
              </div>
            </div>
          </motion.div>
        )}

        <motion.div variants={STAGGER_ITEM} style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 16, gap: 10 }}>
          {editing && draft ? (
            <input
              value={draft.theme || ''}
              onChange={(e) => setDraft((d) => ({ ...d, theme: e.target.value }))}
              placeholder="Título do dia"
              style={{
                flex: 1,
                minWidth: 0,
                border: `1px solid ${color.imagePlaceholder}`,
                borderRadius: 8,
                padding: '6px 8px',
                ...type.sectionTitle,
                color: color.dark,
                boxSizing: 'border-box',
              }}
            />
          ) : (
            <div style={{ color: color.dark, ...type.sectionTitle }}>
              {currentDay ? currentDay.theme : <Skeleton width={120} height={17} />}
            </div>
          )}
          <div style={{ display: 'flex', alignItems: 'center', gap: 5, flex: 'none' }}>
            {currentWeather ? (
              <>
                <span style={{ fontSize: 15 }}>{weatherEmoji(currentWeather.code)}</span>
                <span style={{ color: color.muted, fontSize: 12.5, fontWeight: 600 }}>
                  {Math.round(currentWeather.min)}°–{Math.round(currentWeather.max)}°
                  {currentWeather.isHistoricalAverage && (
                    <span style={{ color: '#c9c2b6' }}> (méd.)</span>
                  )}
                </span>
              </>
            ) : (
              <Skeleton width={60} height={14} />
            )}
          </div>
        </motion.div>

        {!displayDay && Array.from({ length: 4 }).map((_, i) => <ActivitySkeleton key={i} />)}

        {displayDay && editing && (
          <AddActivityDivider onAddActivity={() => handleAddActivity(0)} onAddItineraryCard={() => handleAddItineraryCard(0)} />
        )}

        {displayDay && (
          <Reorder.Group
            as="div"
            variants={STAGGER_ITEM}
            axis="y"
            values={displayDay.activities}
            onReorder={editing ? handleReorder : () => {}}
            style={{ listStyle: 'none', margin: 0, padding: 0 }}
          >
            {displayDay.activities.map((act, i) => {
              const next = displayDay.activities[i + 1];
              // Fase 4: CRUD completo do card e seus subitens — drag-and-drop
              // dos subitens vem na fase 5.
              if (act.type === 'itinerary') {
                return (
                  <div key={act.id} style={{ marginBottom: 12 }}>
                    <ItineraryCardItem
                      activity={act}
                      editing={editing}
                      onEditTime={(time) => patchDraftActivity(act.id, { time })}
                      onEditTitle={(title) => patchDraftActivity(act.id, { title })}
                      onEditSubtitle={(subtitle) => patchDraftActivity(act.id, { subtitle })}
                      onSelectPlace={() => setSelectorFor(act.id)}
                      onUnlinkPlace={() => handleUnlinkPlace(act.id)}
                      onSelectAttraction={() => setAttractionSelectorFor(act.id)}
                      onUnlinkAttraction={() => handleUnlinkAttraction(act.id)}
                      onDelete={() => handleDelete(act.id)}
                      onMoveToDay={act.id > 0 ? () => setMovingActivity(act) : undefined}
                      onAddSubItem={(atIndex) => handleAddSubItem(act.id, atIndex)}
                      onReorderSubItems={(items) => handleReorderSubItems(act.id, items)}
                      onEditSubItemTitle={(subId, title) => patchDraftSubItem(act.id, subId, { title })}
                      onEditSubItemSubtitle={(subId, subtitle) => patchDraftSubItem(act.id, subId, { subtitle })}
                      onSelectSubItemPlace={(subId) => setSelectorFor({ cardId: act.id, subItemId: subId })}
                      onUnlinkSubItemPlace={(subId) => handleUnlinkSubItemPlace(act.id, subId)}
                      onSelectSubItemAttraction={(subId) => setAttractionSelectorFor({ cardId: act.id, subItemId: subId })}
                      onUnlinkSubItemAttraction={(subId) => handleUnlinkSubItemAttraction(act.id, subId)}
                      onDeleteSubItem={(subId) => handleDeleteSubItem(act.id, subId)}
                      onMoveSubItemUp={(index) => handleMoveSubItem(act.id, index, -1)}
                      onMoveSubItemDown={(index) => handleMoveSubItem(act.id, index, 1)}
                    />
                    {editing && <AddActivityDivider onAddActivity={() => handleAddActivity(i + 1)} onAddItineraryCard={() => handleAddItineraryCard(i + 1)} />}
                  </div>
                );
              }
              return (
                <ActivityItem
                  key={act.id}
                  activity={act}
                  editing={editing}
                  isFirst={i === 0}
                  isLast={i === displayDay.activities.length - 1}
                  onEditTime={(time) => patchDraftActivity(act.id, { time })}
                  onEditTitle={(title) => patchDraftActivity(act.id, { title })}
                  onEditSubtitle={(subtitle) => patchDraftActivity(act.id, { subtitle })}
                  onSelectPlace={() => setSelectorFor(act.id)}
                  onUnlinkPlace={() => handleUnlinkPlace(act.id)}
                  onSelectAttraction={() => setAttractionSelectorFor(act.id)}
                  onUnlinkAttraction={() => handleUnlinkAttraction(act.id)}
                  onDelete={() => handleDelete(act.id)}
                  onMoveUp={() => handleMove(i, -1)}
                  onMoveDown={() => handleMove(i, 1)}
                  onMoveToDay={act.id > 0 ? () => setMovingActivity(act) : undefined}
                  footer={
                    <>
                      <div style={{ marginBottom: 10 }}>
                        {!editing && next && act.place && next.place && (
                          <DistanceBetween from={act.place} to={next.place} />
                        )}
                      </div>
                      {editing && <AddActivityDivider onAddActivity={() => handleAddActivity(i + 1)} onAddItineraryCard={() => handleAddItineraryCard(i + 1)} />}
                    </>
                  }
                />
              );
            })}
          </Reorder.Group>
        )}

        {displayDay && n === 0 && (
          <div style={{ padding: '30px 0', textAlign: 'center', color: color.faint, fontSize: 13.5, fontWeight: 600 }}>
            Sem atividades definidas para este dia.
          </div>
        )}
      </motion.div>

      <AnimatePresence>
        {selectorFor && (
          <PlaceSelectorModal
            key="place-selector"
            onSelect={handleSelectPlace}
            onClose={() => setSelectorFor(null)}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {attractionSelectorFor && (
          <AttractionSelectorModal
            key="attraction-selector"
            onSelect={handleSelectAttraction}
            onClose={() => setAttractionSelectorFor(null)}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {movingActivity && (
          <MoveToDayModal
            key="move-to-day"
            days={days}
            currentDayId={draft.dayId}
            onSelect={(targetDay) => !moving && handleMoveToDay(movingActivity, targetDay)}
            onClose={() => !moving && setMovingActivity(null)}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {editing && (
          <EditActionBar key="edit-action-bar" onCancel={handleCancel} onSave={handleSave} saving={saving} />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {mapOpen && currentDay && (
          <DayMap
            key="day-map"
            days={days}
            selectedDay={selectedDay}
            onSelectDay={setSelectedDay}
            onClose={closeMap}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
