import { useEffect, useRef } from 'react';
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

export default function DayTabs({ days, selected, onSelect, style }) {
  const { scrollerRef, dragRef, dragHandlers } = useDragScroll();
  const activeRef = useRef(null);

  // Este componente é renderizado em paralelo em dois lugares (título
  // normal da tela + dentro do FixedHeader) — cada instância tem seu
  // próprio scroll horizontal nativo, sem sincronia entre elas. Sem isso, a
  // instância que acabou de aparecer (ex: a do FixedHeader, ao rolar a
  // página) ficava com o scroll "resetado", mostrando a aba ativa fora do
  // lugar onde o usuário a tinha deixado na outra instância.
  // `inline: 'nearest'` (não 'center'): só move o scroll o mínimo pra trazer
  // a aba pra dentro da área visível — se ela já está visível (ex: usuário
  // clicou numa aba perto da borda, já vendo ela), não move nada. Com
  // 'center' toda seleção recentralizava a aba, mesmo quando já visível,
  // o que deixava a navegação por clique estranha (a tela "pulava").
  useEffect(() => {
    activeRef.current?.scrollIntoView({ block: 'nearest', inline: 'nearest' });
  }, [selected]);

  if (!days) {
    return (
      <div style={{ display: 'flex', gap: 10, marginTop: 14, padding: '2px 2px 6px', ...style }}>
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
        ...style,
      }}
    >
      {days.map((day, i) => {
        const active = i === selected;
        return (
          <div
            key={day.date}
            ref={active ? activeRef : undefined}
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
