import { useRef } from 'react';

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
  transition: 'background .2s, border-color .2s',
  userSelect: 'none',
};

export default function DayTabs({ days, selected, onSelect }) {
  const scrollerRef = useRef(null);
  const dragRef = useRef(null);

  const onMouseDown = (e) => {
    dragRef.current = { startX: e.clientX, startScroll: scrollerRef.current.scrollLeft, moved: false };
  };
  const onMouseMove = (e) => {
    const drag = dragRef.current;
    if (!drag) return;
    const dx = e.clientX - drag.startX;
    if (Math.abs(dx) > 3) drag.moved = true;
    scrollerRef.current.scrollLeft = drag.startScroll - dx;
  };
  const onMouseUp = () => {
    dragRef.current = null;
  };

  return (
    <div
      ref={scrollerRef}
      onMouseDown={onMouseDown}
      onMouseMove={onMouseMove}
      onMouseUp={onMouseUp}
      onMouseLeave={onMouseUp}
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
              background: active ? '#1c1a17' : '#eee9df',
            }}
          >
            <div
              style={{
                fontSize: 10.5,
                fontWeight: 700,
                letterSpacing: 0.3,
                textTransform: 'uppercase',
                color: active ? 'rgba(255,255,255,0.65)' : '#9a9186',
              }}
            >
              {day.weekday}
            </div>
            <div style={{ fontSize: 16, fontWeight: 800, color: active ? '#fff' : '#1c1a17' }}>
              {day.date.split('/')[0]}
            </div>
          </div>
        );
      })}
    </div>
  );
}
