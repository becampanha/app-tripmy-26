import { useState } from 'react';
import itinerary from '../data/itinerary.json';
import BackgroundPhoto from './BackgroundPhoto.jsx';
import DayTabs from './DayTabs.jsx';

// Proportions carried over from the design prototype (a 390x844 reference
// frame): the panel starts 340/844 down the screen and pins 158/844 from
// the top once scrolled, so the ratios (not the pixels) are what travel to
// real device heights.
const SPACER_VH = (340 / 844) * 100;
const STICKY_TOP_VH = (158 / 844) * 100;

const DEFAULT_PHOTO_URL =
  'https://images.unsplash.com/photo-1670336861932-796471787bcd?q=95&w=1170&auto=format&fit=crop&fm=jpg';

export default function ScheduleScreen() {
  const [selectedDay, setSelectedDay] = useState(1);

  const currentDay = itinerary[selectedDay];
  const n = currentDay.activities.length;
  const activityCountLabel = n === 0 ? '' : n === 1 ? '1 atividade' : `${n} atividades`;

  return (
    <div style={{ position: 'relative', width: '100%', minHeight: '100dvh', overflow: 'hidden', background: '#151210' }}>
      <BackgroundPhoto url={DEFAULT_PHOTO_URL} ready={true} />

      <div style={{ position: 'absolute', top: 22, left: 22, right: 22, zIndex: 2 }}>
        <div style={{ fontSize: 12.5, fontWeight: 700, letterSpacing: 0.4, color: 'rgba(255,255,255,0.8)', textTransform: 'uppercase' }}>
          Orlando, Disney
        </div>
        <div style={{ fontSize: 22, fontWeight: 800, marginTop: 3, letterSpacing: -0.2, color: '#fff' }}>
          {currentDay.weekday}, {currentDay.date}
        </div>
        <DayTabs days={itinerary} selected={selectedDay} onSelect={setSelectedDay} />
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
              <div
                key={i}
                style={{
                  display: 'flex',
                  gap: 12,
                  alignItems: 'center',
                  padding: 14,
                  marginBottom: 10,
                  background: '#fff',
                  borderRadius: 18,
                  boxShadow: '0 2px 10px rgba(28,26,23,0.06)',
                }}
              >
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: 56, flex: 'none' }}>
                  <div style={{ color: '#1c1a17', fontSize: 13, fontWeight: 700, whiteSpace: 'nowrap' }}>{act.time}</div>
                </div>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#1c1a17', flex: 'none' }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ color: '#1c1a17', fontSize: 15, fontWeight: 700, lineHeight: 1.25 }}>{act.title}</div>
                  {act.subtitle && (
                    <div style={{ color: '#9a9186', fontSize: 12.5, fontWeight: 500, marginTop: 2, lineHeight: 1.3 }}>
                      {act.subtitle}
                    </div>
                  )}
                </div>
              </div>
            ))}

            {n === 0 && (
              <div style={{ padding: '30px 0', textAlign: 'center', color: '#b6ae9f', fontSize: 13.5, fontWeight: 600 }}>
                Sem atividades definidas para este dia.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
