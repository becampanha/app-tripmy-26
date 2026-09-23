import { useRef, useState } from 'react';
import { flushSync } from 'react-dom';
import { PenIcon } from '@solar-icons/react/linear/pen';
import { AddIcon } from '@solar-icons/react/linear/add';
import { CloseIcon } from '@solar-icons/react/linear/close';
import DayTabs from './DayTabs.jsx';
import ActivityItem from './ActivityItem.jsx';
import PlaceSelectorModal from './PlaceSelectorModal.jsx';
import { useItinerary } from '../hooks/useItinerary.js';
import { useDayWeather } from '../hooks/useDayWeather.js';
import { createActivity, updateActivity, deleteActivity, reorderActivities, updateDay } from '../api/itineraryApi.js';
import DebouncedInput from './DebouncedInput.jsx';
import { weatherEmoji } from '../data/weatherCodes.js';

const EDITABLE_FIELDS = ['time', 'title', 'subtitle', 'placeId'];

function activityFields(act) {
  return {
    time: act.time || '',
    title: act.title || '',
    subtitle: act.subtitle || '',
    placeId: act.place ? act.place.id : null,
  };
}

function Skeleton({ width, height, radius = 6, style }) {
  return (
    <div
      style={{
        width,
        height,
        borderRadius: radius,
        background: '#f9f7f2',
        animation: 'pulse 1.2s ease-in-out infinite',
        ...style,
      }}
    />
  );
}

function ActivitySkeleton() {
  return (
    <div style={{ display: 'flex', gap: 12, alignItems: 'center', padding: 14, marginBottom: 10, background: '#fff', border: '1px solid #ececec', borderRadius: 18 }}>
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
  const [selectedDay, setSelectedDay] = useState(1);
  const [editing, setEditing] = useState(false);
  const [selectorFor, setSelectorFor] = useState(null); // activity id, ou 'new'
  const { days, loading, reload } = useItinerary();
  const snapshotRef = useRef(null); // { dayId, activities: [{id, ...fields}] } ao entrar em edição
  const [cancelToken, setCancelToken] = useState(0); // muda a cada Cancelar, mata debounces pendentes nos inputs
  const weatherByDay = useDayWeather(days);

  const currentDay = days ? days[selectedDay] : null;
  const currentWeather = currentDay ? weatherByDay[currentDay.id] : null;
  const n = currentDay ? currentDay.activities.length : 0;

  const patchActivity = async (id, fields) => {
    await updateActivity(id, fields);
    await reload(true);
  };

  const patchDay = async (fields) => {
    await updateDay(currentDay.id, fields);
    await reload(true);
  };

  const handleDelete = async (id) => {
    await deleteActivity(id);
    await reload(true);
  };

  const handleUnlinkPlace = async (id) => {
    await updateActivity(id, { placeId: null });
    await reload(true);
  };

  const handleMove = async (index, delta) => {
    const activities = currentDay.activities;
    const targetIndex = index + delta;
    if (targetIndex < 0 || targetIndex >= activities.length) return;

    const a = activities[index];
    const b = activities[targetIndex];
    await reorderActivities([
      { id: a.id, dayId: currentDay.id, sortOrder: targetIndex },
      { id: b.id, dayId: currentDay.id, sortOrder: index },
    ]);
    await reload(true);
  };

  const handleAddActivity = async () => {
    await createActivity({ dayId: currentDay.id, time: '', title: '' });
    await reload(true);
  };

  const handleSelectPlace = async (place) => {
    await updateActivity(selectorFor, { placeId: place.id });
    setSelectorFor(null);
    await reload(true);
  };

  const startEditing = () => {
    snapshotRef.current = {
      dayId: currentDay.id,
      theme: currentDay.theme,
      activities: currentDay.activities.map((act) => ({ id: act.id, ...activityFields(act) })),
    };
    setEditing(true);
  };

  const handleCancel = async () => {
    const snapshot = snapshotRef.current;
    if (!snapshot) {
      setEditing(false);
      return;
    }

    // Mata qualquer debounce pendente nos DebouncedInput (mudar cancelToken
    // dispara o useEffect de cada input, que cancela o timer sem commitar).
    // Precisa de flushSync + commit síncrono antes de sair do modo edição:
    // se setEditing(false) fosse batched junto, os inputs desmontariam no
    // mesmo render sem o efeito de cancelamento chegar a rodar para eles,
    // e o timer (setTimeout solto, sobrevive ao unmount) dispararia depois.
    flushSync(() => {
      setCancelToken((t) => t + 1);
    });
    setEditing(false);

    // Lê o estado direto da API em vez do `currentDay` capturado no closure
    // deste handler — closure pode estar desatualizado em relação ao banco
    // se houve mutações (add/edit/delete) entre a criação do handler e o clique.
    const res = await fetch('/api/itinerary');
    const freshDays = await res.json();
    const freshDay = freshDays.find((d) => d.id === snapshot.dayId);

    if (freshDay.theme !== snapshot.theme) {
      await updateDay(snapshot.dayId, { theme: snapshot.theme });
    }

    const before = snapshot.activities;
    const after = freshDay.activities.map((act) => ({ id: act.id, ...activityFields(act) }));
    const beforeIds = new Set(before.map((a) => a.id));
    const afterIds = new Set(after.map((a) => a.id));

    // Itens criados durante a edição: remover
    for (const act of after) {
      if (!beforeIds.has(act.id)) {
        await deleteActivity(act.id);
      }
    }

    // Itens removidos durante a edição: recriar (ganham novo id)
    const idMap = {};
    for (const act of before) {
      if (!afterIds.has(act.id)) {
        const created = await createActivity({ dayId: snapshot.dayId, ...act });
        idMap[act.id] = created.id;
      }
    }

    // Itens que continuam existindo: reverter campos alterados
    for (const act of before) {
      if (afterIds.has(act.id)) {
        const current = after.find((a) => a.id === act.id);
        const changed = EDITABLE_FIELDS.some((f) => current[f] !== act[f]);
        if (changed) {
          await updateActivity(act.id, act);
        }
      }
    }

    // Restaurar ordem original
    await reorderActivities(
      before.map((act, i) => ({ id: idMap[act.id] || act.id, dayId: snapshot.dayId, sortOrder: i }))
    );

    snapshotRef.current = null;
    await reload(true);
  };

  return (
    <div style={{ position: 'relative', width: '100%', minHeight: '100dvh', background: '#fff', boxSizing: 'border-box' }}>
      <div style={{ padding: '22px 22px 0' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
          <div style={{ fontSize: 26, fontWeight: 800, letterSpacing: -0.3, color: '#1c1a17' }}>
            Roteiro
          </div>

          <div style={{ flex: 'none', display: 'flex', alignItems: 'center', gap: 8 }}>
            {editing && (
              <div
                onMouseDown={(e) => e.preventDefault()}
                onClick={handleCancel}
                style={{
                  height: 38,
                  padding: '0 16px',
                  borderRadius: 13,
                  background: '#f9f7f2',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 6,
                  cursor: 'pointer',
                }}
              >
                <CloseIcon size={15} color="#1c1a17" />
                <span style={{ color: '#1c1a17', fontSize: 13.5, fontWeight: 700 }}>Cancelar</span>
              </div>
            )}

            <div
              onClick={() => (editing ? setEditing(false) : startEditing())}
              style={{
                height: 38,
                padding: editing ? '0 16px' : 0,
                width: editing ? 'auto' : 38,
                borderRadius: 13,
                background: editing ? '#1c1a17' : '#f9f7f2',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 6,
                cursor: 'pointer',
              }}
            >
              {editing ? (
                <span style={{ color: '#fff', fontSize: 13.5, fontWeight: 700 }}>Salvar</span>
              ) : (
                <PenIcon size={17} color="#1c1a17" />
              )}
            </div>
          </div>
        </div>

        <DayTabs days={days} selected={selectedDay} onSelect={setSelectedDay} />
      </div>

      <div
        style={{
          marginTop: 18,
          boxSizing: 'border-box',
          padding: '20px 22px 120px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 16, gap: 10 }}>
          {currentDay && editing ? (
            <DebouncedInput
              value={currentDay.theme || ''}
              onCommit={(theme) => patchDay({ theme })}
              cancelToken={cancelToken}
              style={{ fontSize: 17, fontWeight: 800, letterSpacing: -0.1, flex: 1 }}
              placeholder="Título do dia"
            />
          ) : (
            <div style={{ color: '#1c1a17', fontSize: 17, fontWeight: 800, letterSpacing: -0.1 }}>
              {currentDay ? currentDay.theme : <Skeleton width={120} height={17} />}
            </div>
          )}
          <div style={{ display: 'flex', alignItems: 'center', gap: 5, flex: 'none' }}>
            {currentWeather ? (
              <>
                <span style={{ fontSize: 15 }}>{weatherEmoji(currentWeather.code)}</span>
                <span style={{ color: '#9a9186', fontSize: 12.5, fontWeight: 600 }}>
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

        {!currentDay && Array.from({ length: 4 }).map((_, i) => <ActivitySkeleton key={i} />)}

        {currentDay && currentDay.activities.map((act, i) => (
          <ActivityItem
            key={act.id}
            activity={act}
            editing={editing}
            cancelToken={cancelToken}
            isFirst={i === 0}
            isLast={i === currentDay.activities.length - 1}
            onEditTime={(time) => patchActivity(act.id, { time })}
            onEditTitle={(title) => patchActivity(act.id, { title })}
            onEditSubtitle={(subtitle) => patchActivity(act.id, { subtitle })}
            onSelectPlace={() => setSelectorFor(act.id)}
            onUnlinkPlace={() => handleUnlinkPlace(act.id)}
            onDelete={() => handleDelete(act.id)}
            onMoveUp={() => handleMove(i, -1)}
            onMoveDown={() => handleMove(i, 1)}
          />
        ))}

        {currentDay && n === 0 && (
          <div style={{ padding: '30px 0', textAlign: 'center', color: '#b6ae9f', fontSize: 13.5, fontWeight: 600 }}>
            Sem atividades definidas para este dia.
          </div>
        )}

        {currentDay && editing && (
          <div
            onClick={handleAddActivity}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 6,
              padding: 14,
              marginTop: 4,
              borderRadius: 18,
              border: '1.5px dashed #dcd6ca',
              color: '#1c1a17',
              fontSize: 13.5,
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            <AddIcon size={16} color="#1c1a17" />
            Adicionar item
          </div>
        )}
      </div>

      {selectorFor && (
        <PlaceSelectorModal
          onSelect={handleSelectPlace}
          onClose={() => setSelectorFor(null)}
        />
      )}
    </div>
  );
}
