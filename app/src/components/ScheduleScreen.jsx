import { useState } from 'react';
import BackgroundPhoto from './BackgroundPhoto.jsx';
import DayTabs from './DayTabs.jsx';
import ActivityItem from './ActivityItem.jsx';
import PlaceSelectorModal from './PlaceSelectorModal.jsx';
import { useItinerary } from '../hooks/useItinerary.js';
import { createActivity, updateActivity, deleteActivity, reorderActivities } from '../api/itineraryApi.js';

// Proportions carried over from the design prototype (a 390x844 reference
// frame): the panel starts 340/844 down the screen and pins 158/844 from
// the top once scrolled, so the ratios (not the pixels) are what travel to
// real device heights.
const SPACER_VH = (340 / 844) * 100;
const STICKY_TOP_VH = (158 / 844) * 100;

const DEFAULT_PHOTO_URL =
  'https://images.unsplash.com/photo-1670336861932-796471787bcd?q=95&w=1170&auto=format&fit=crop&fm=jpg';

function EditIcon({ active }) {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke={active ? '#fff' : '#1c1a17'} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
    </svg>
  );
}

function PlusIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#1c1a17" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 5v14" />
      <path d="M5 12h14" />
    </svg>
  );
}

export default function ScheduleScreen() {
  const [selectedDay, setSelectedDay] = useState(1);
  const [editing, setEditing] = useState(false);
  const [selectorFor, setSelectorFor] = useState(null); // activity id, ou 'new'
  const { days, loading, reload } = useItinerary();

  if (loading || !days) {
    return (
      <div style={{ position: 'relative', width: '100%', minHeight: '100dvh', background: '#151210', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ color: '#9a9186', fontSize: 13.5, fontWeight: 600 }}>Carregando…</div>
      </div>
    );
  }

  const currentDay = days[selectedDay];
  const n = currentDay.activities.length;
  const activityCountLabel = n === 0 ? '' : n === 1 ? '1 atividade' : `${n} atividades`;

  const patchActivity = async (id, fields) => {
    await updateActivity(id, fields);
    await reload();
  };

  const handleDelete = async (id) => {
    await deleteActivity(id);
    await reload();
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
    await reload();
  };

  const handleAddActivity = async () => {
    await createActivity({ dayId: currentDay.id, time: 'Novo horário', title: 'Novo item' });
    await reload();
  };

  const handleSelectPlace = async (place) => {
    if (selectorFor === 'new') {
      await createActivity({
        dayId: currentDay.id,
        time: 'Novo horário',
        title: place.name,
        placeId: place.id,
      });
    } else {
      await updateActivity(selectorFor, { placeId: place.id });
    }
    setSelectorFor(null);
    await reload();
  };

  return (
    <div style={{ position: 'relative', width: '100%', minHeight: '100dvh', overflow: 'hidden', background: '#151210' }}>
      <BackgroundPhoto url={DEFAULT_PHOTO_URL} ready={true} />

      <div style={{ position: 'absolute', top: 22, left: 22, right: 22, zIndex: 2 }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontSize: 12.5, fontWeight: 700, letterSpacing: 0.4, color: 'rgba(255,255,255,0.8)', textTransform: 'uppercase' }}>
              Orlando, Disney
            </div>
            <div style={{ fontSize: 22, fontWeight: 800, marginTop: 3, letterSpacing: -0.2, color: '#fff' }}>
              {currentDay.weekday}, {currentDay.date}
            </div>
          </div>

          <div
            onClick={() => setEditing((e) => !e)}
            style={{
              flex: 'none',
              width: 38,
              height: 38,
              borderRadius: 13,
              background: editing ? '#1c1a17' : 'rgba(255,255,255,0.92)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              boxShadow: '0 4px 12px rgba(28,26,23,0.18)',
            }}
          >
            <EditIcon active={editing} />
          </div>
        </div>

        <DayTabs days={days} selected={selectedDay} onSelect={setSelectedDay} />
      </div>

      <div style={{ position: 'absolute', inset: 0, overflowY: 'auto', overflowX: 'hidden', zIndex: 1 }}>
        <div style={{ height: `${SPACER_VH}dvh` }} />

        <div
          style={{
            position: 'sticky',
            top: `${STICKY_TOP_VH}dvh`,
            height: `calc(100dvh - ${STICKY_TOP_VH}dvh)`,
            background: '#f7f5f1',
            borderRadius: '28px 28px 0 0',
            boxShadow: '0 -12px 30px rgba(28,26,23,0.18)',
            boxSizing: 'border-box',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'center', padding: '8px 0 10px', flex: 'none' }}>
            <div style={{ width: 38, height: 4, borderRadius: 2, background: '#dcd6ca' }} />
          </div>

          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', padding: '0 22px', marginBottom: 16, flex: 'none' }}>
            <div style={{ color: '#1c1a17', fontSize: 17, fontWeight: 800, letterSpacing: -0.1 }}>{currentDay.theme}</div>
            <div style={{ color: '#9a9186', fontSize: 12.5, fontWeight: 600 }}>{activityCountLabel}</div>
          </div>

          <div style={{ flex: 1, overflowY: 'auto', padding: '0 22px 120px', boxSizing: 'border-box' }}>
            {currentDay.activities.map((act, i) => (
              <ActivityItem
                key={act.id}
                activity={act}
                editing={editing}
                isFirst={i === 0}
                isLast={i === currentDay.activities.length - 1}
                onEditTime={(time) => patchActivity(act.id, { time })}
                onEditTitle={(title) => patchActivity(act.id, { title })}
                onSelectPlace={() => setSelectorFor(act.id)}
                onDelete={() => handleDelete(act.id)}
                onMoveUp={() => handleMove(i, -1)}
                onMoveDown={() => handleMove(i, 1)}
              />
            ))}

            {n === 0 && (
              <div style={{ padding: '30px 0', textAlign: 'center', color: '#b6ae9f', fontSize: 13.5, fontWeight: 600 }}>
                Sem atividades definidas para este dia.
              </div>
            )}

            {editing && (
              <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
                <div
                  onClick={handleAddActivity}
                  style={{
                    flex: 1,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 6,
                    padding: 14,
                    borderRadius: 18,
                    border: '1.5px dashed #dcd6ca',
                    color: '#1c1a17',
                    fontSize: 13.5,
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  <PlusIcon />
                  Item livre
                </div>
                <div
                  onClick={() => setSelectorFor('new')}
                  style={{
                    flex: 1,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 6,
                    padding: 14,
                    borderRadius: 18,
                    border: '1.5px dashed #dcd6ca',
                    color: '#1c1a17',
                    fontSize: 13.5,
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  <PlusIcon />
                  Item com lugar
                </div>
              </div>
            )}
          </div>
        </div>
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
