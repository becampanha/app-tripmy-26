import { useDragScroll } from '../hooks/useDragScroll.js';
import { color } from '../design-system/index.js';

const bubbleBase = {
  flex: 'none',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 2,
  width: 48,
  height: 58,
  borderRadius: 18,
  cursor: 'pointer',
  transition: 'background .2s',
  userSelect: 'none',
};

export default function DayTabs({ days, selected, onSelect }) {
  const { scrollerRef, dragRef, dragHandlers } = useDragScroll();

  if (!days) {
    return (
      <div style={{ display: 'flex', gap: 10, marginTop: 14, padding: '2px 2px 6px' }}>
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            style={{ ...bubbleBase, background: color.surfaceMuted, animation: 'pulse 1.2s ease-in-out infinite' }}
          />
        ))}
      </div>
    );
  }

  return (
    <div
      ref={scrollerRef}
      {...dragHandlers}
      style={{
        display: 'flex',
        gap: 10,
        overflowX: 'auto',
        marginTop: 14,
        padding: '2px 2px 6px',
        WebkitOverflowScrolling: 'touch',
        cursor: 'grab',
        userSelect: 'none',
      }}
    >
      {days.map((day, i) => {
        const active = i === selected;
        return (
          <div
            key={day.date}
            onClick={() => {
              if (!dragRef.current || !dragRef.current.moved) onSelect(i);
            }}
            style={{
              ...bubbleBase,
              background: active ? color.dark : color.surfaceMuted,
            }}
          >
            <div
              style={{
                fontSize: 10.5,
                fontWeight: 700,
                letterSpacing: 0.3,
                textTransform: 'uppercase',
                color: active ? 'rgba(255,255,255,0.65)' : color.muted,
              }}
            >
              {day.weekday}
            </div>
            <div style={{ fontSize: 16, fontWeight: 800, color: active ? color.white : color.dark }}>
              {day.date.split('/')[0]}
            </div>
          </div>
        );
      })}
    </div>
  );
}
