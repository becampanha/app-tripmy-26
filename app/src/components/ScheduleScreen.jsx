import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { AnimatePresence, Reorder } from 'motion/react';
import { PenIcon } from '@solar-icons/react/linear/pen';
import { AddIcon } from '@solar-icons/react/linear/add';
import { ListIcon } from '@solar-icons/react/linear/list';
import { MapIcon } from '@solar-icons/react/bold/map';
import DayTabs from './DayTabs.jsx';
import ActivityItem from './ActivityItem.jsx';
import DistanceBetween from './DistanceBetween.jsx';
import PlaceSelectorModal from './PlaceSelectorModal.jsx';
import DayMap from './DayMap.jsx';
import EditActionBar from './EditActionBar.jsx';
import { useItinerary } from '../hooks/useItinerary.js';
import { useDayWeather } from '../hooks/useDayWeather.js';
import { setGlobalEditing } from '../hooks/useEditingState.js';
import { showToast, showErrorToast } from '../hooks/useToast.js';
import { useScrollY } from '../hooks/useScrollY.js';
import { useElementHeight } from '../hooks/useElementHeight.js';
import { getScheduleScreenState, saveScheduleScreenState } from '../hooks/useScheduleScreenState.js';
import { createActivity, updateActivity, deleteActivity, reorderActivities, updateDay } from '../api/itineraryApi.js';
import { weatherEmoji } from '../data/weatherCodes.js';
import { FixedHeader, Skeleton, color, radius, spacing, type } from '../design-system/index.js';

const EDITABLE_FIELDS = ['time', 'title', 'subtitle', 'placeId'];

function activityFields(act) {
  return {
    time: act.time || '',
    title: act.title || '',
    subtitle: act.subtitle || '',
    placeId: act.place ? act.place.id : null,
    place: act.place || null,
  };
}

let nextDraftId = -1;

// Divisor clicável entre dois itens (ou antes do primeiro/depois do último)
// pra inserir uma nova atividade naquela posição exata, em vez de só no fim
// da lista. Fica discreto (sem borda tracejada grande) pra não parecer um
// item de atividade de verdade no meio da lista.
function AddActivityDivider({ onClick }) {
  return (
    <div
      onClick={onClick}
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: 22,
        margin: '-4px 0 2px',
        cursor: 'pointer',
      }}
    >
      <div
        style={{
          width: 26,
          height: 26,
          borderRadius: 13,
          border: `1.5px dashed ${color.dashedBorder}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: color.bg,
        }}
      >
        <AddIcon size={14} color={color.dark} />
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
  const [selectorFor, setSelectorFor] = useState(null); // activity id (ou id negativo temporário de item recém-criado)
  const { days, loading, reload } = useItinerary();
  const { scrollY, anchorRef } = useScrollY();
  const { ref: headerRef, height: headerHeight } = useElementHeight();

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
  const [mapOpen, setMapOpen] = useState(false);

  // Abrir o mapa empurra uma entrada real no histórico (mesmo pathname, só
  // muda o state) — sem isso, o mapa é só um overlay local, e ao clicar
  // "Ver detalhes" lá dentro e depois "voltar" na tela de detalhes, o
  // navigate(-1) pulava o mapa direto pra tela de Roteiro, porque o mapa
  // nunca tinha existido como entrada de histórico. Com essa entrada, voltar
  // (seja pelo botão da tela de detalhes, seja pelo gesto/botão físico do
  // celular) resolve sozinho, sem lógica própria de "lembrar de onde vim".
  const openMap = () => {
    setMapOpen(true);
    navigate(location.pathname, { state: { ...location.state, mapOpen: true } });
  };
  const closeMap = () => navigate(-1);

  // location.state é a fonte da verdade: cobre tanto fechar pelo botão
  // dentro do DayMap quanto o usuário apertar voltar no navegador/celular
  // (gesto ou botão físico), que o React Router já traduz num novo valor de
  // location sem passar pelo onClose do componente.
  useEffect(() => {
    setMapOpen(!!location.state?.mapOpen);
  }, [location.state]);

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

  const handleAddActivity = (atIndex) => {
    const id = nextDraftId--;
    const newActivity = { id, time: '', title: '', subtitle: '', placeId: null, place: null };
    setDraft((d) => {
      const activities = d.activities.slice();
      const insertAt = atIndex === undefined ? activities.length : atIndex;
      activities.splice(insertAt, 0, newActivity);
      return { ...d, activities };
    });
  };

  const handleSelectPlace = (place) => {
    patchDraftActivity(selectorFor, { placeId: place.id, place });
    setSelectorFor(null);
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
          });
        }
      }

      // Itens novos (criados durante a edição, id temporário negativo).
      const idMap = {};
      for (const act of after) {
        if (act.id < 0) {
          const created = await createActivity({
            dayId: draft.dayId,
            time: act.time,
            title: act.title,
            subtitle: act.subtitle,
            placeId: act.placeId,
          });
          idMap[act.id] = created.id;
        }
      }

      // Ordem final, já com os ids reais dos itens recém-criados.
      await reorderActivities(
        after.map((act, i) => ({ id: idMap[act.id] || act.id, dayId: draft.dayId, sortOrder: i }))
      );

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
        tabs={<DayTabs days={days} selected={selectedDay} onSelect={setSelectedDay} style={{ marginTop: 0, padding: `0 ${spacing.screenGutter}px` }} />}
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
                <span style={{ color: color.dark, fontSize: 13.5, fontWeight: 700 }}>Roteiro</span>
              </div>
              <div
                onClick={startEditing}
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
                <PenIcon size={17} color={color.dark} />
                <span style={{ color: color.dark, fontSize: 13.5, fontWeight: 700 }}>Editar</span>
              </div>
            </>
          )
        }
      />

      <div
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
          <div
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
          </div>
        )}

        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 16, gap: 10 }}>
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
        </div>

        {!displayDay && Array.from({ length: 4 }).map((_, i) => <ActivitySkeleton key={i} />)}

        {displayDay && editing && (
          <AddActivityDivider onClick={() => handleAddActivity(0)} />
        )}

        {displayDay && (
          <Reorder.Group
            as="div"
            axis="y"
            values={displayDay.activities}
            onReorder={editing ? handleReorder : () => {}}
            style={{ listStyle: 'none', margin: 0, padding: 0 }}
          >
            {displayDay.activities.map((act, i) => {
              const next = displayDay.activities[i + 1];
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
                  onDelete={() => handleDelete(act.id)}
                  onMoveUp={() => handleMove(i, -1)}
                  onMoveDown={() => handleMove(i, 1)}
                  footer={
                    <>
                      <div style={{ marginBottom: 10 }}>
                        {!editing && next && act.place && next.place && (
                          <DistanceBetween from={act.place} to={next.place} />
                        )}
                      </div>
                      {editing && <AddActivityDivider onClick={() => handleAddActivity(i + 1)} />}
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
      </div>

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
