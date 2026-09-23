import { useRef, useState } from 'react';
import { PenIcon } from '@solar-icons/react/linear/pen';
import { AddIcon } from '@solar-icons/react/linear/add';
import { CloseIcon } from '@solar-icons/react/linear/close';
import DayTabs from './DayTabs.jsx';
import ActivityItem from './ActivityItem.jsx';
import DistanceBetween from './DistanceBetween.jsx';
import PlaceSelectorModal from './PlaceSelectorModal.jsx';
import { useItinerary } from '../hooks/useItinerary.js';
import { useDayWeather } from '../hooks/useDayWeather.js';
import { createActivity, updateActivity, deleteActivity, reorderActivities, updateDay } from '../api/itineraryApi.js';
import { weatherEmoji } from '../data/weatherCodes.js';

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
  const [saving, setSaving] = useState(false);
  const [selectorFor, setSelectorFor] = useState(null); // activity id (ou id negativo temporário de item recém-criado)
  const { days, loading, reload } = useItinerary();
  // Enquanto editing=true, toda mutação (digitar, mover, excluir, adicionar,
  // vincular lugar) só mexe neste estado local — nada de chamada de rede a
  // cada tecla. As chamadas de API só acontecem de uma vez, em lote, quando
  // o usuário clica em Salvar (handleSave). Isso evita a lentidão de um
  // PUT + reload a cada campo editado que existia antes.
  const [draft, setDraft] = useState(null); // { dayId, theme, activities: [...] }
  const originalRef = useRef(null); // snapshot pré-edição, para diff no Salvar

  const currentDay = days ? days[selectedDay] : null;
  const weatherByDay = useDayWeather(days);
  const currentWeather = currentDay ? weatherByDay[currentDay.id] : null;

  const displayDay = editing && draft ? draft : currentDay;
  const n = displayDay ? displayDay.activities.length : 0;

  const startEditing = () => {
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

  const handleMove = (index, delta) => {
    setDraft((d) => {
      const activities = d.activities.slice();
      const targetIndex = index + delta;
      if (targetIndex < 0 || targetIndex >= activities.length) return d;
      [activities[index], activities[targetIndex]] = [activities[targetIndex], activities[index]];
      return { ...d, activities };
    });
  };

  const handleAddActivity = () => {
    const id = nextDraftId--;
    setDraft((d) => ({
      ...d,
      activities: [...d.activities, { id, time: '', title: '', subtitle: '', placeId: null, place: null }],
    }));
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
    } finally {
      setSaving(false);
    }
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
              onClick={() => {
                if (saving) return;
                editing ? handleSave() : startEditing();
              }}
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
                cursor: saving ? 'default' : 'pointer',
                opacity: saving ? 0.7 : 1,
              }}
            >
              {editing ? (
                <span style={{ color: '#fff', fontSize: 13.5, fontWeight: 700 }}>{saving ? 'Salvando...' : 'Salvar'}</span>
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
          {editing && draft ? (
            <input
              value={draft.theme || ''}
              onChange={(e) => setDraft((d) => ({ ...d, theme: e.target.value }))}
              placeholder="Título do dia"
              style={{
                flex: 1,
                minWidth: 0,
                border: '1px solid #eee9df',
                borderRadius: 8,
                padding: '6px 8px',
                fontSize: 17,
                fontWeight: 800,
                letterSpacing: -0.1,
                color: '#1c1a17',
                boxSizing: 'border-box',
              }}
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

        {!displayDay && Array.from({ length: 4 }).map((_, i) => <ActivitySkeleton key={i} />)}

        {displayDay && displayDay.activities.map((act, i) => {
          const next = displayDay.activities[i + 1];
          return (
            <div key={act.id}>
              <ActivityItem
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
              />
              {!editing && next && act.place && next.place ? (
                <DistanceBetween from={act.place} to={next.place} />
              ) : (
                <div style={{ marginBottom: 10 }} />
              )}
            </div>
          );
        })}

        {displayDay && n === 0 && (
          <div style={{ padding: '30px 0', textAlign: 'center', color: '#b6ae9f', fontSize: 13.5, fontWeight: 600 }}>
            Sem atividades definidas para este dia.
          </div>
        )}

        {displayDay && editing && (
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
