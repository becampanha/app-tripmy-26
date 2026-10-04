import { motion } from 'motion/react';
import { CalendarMinimalisticIcon } from '@solar-icons/react/bold/calendar-minimalistic';
import { color, radius, spacing, type } from '../design-system/index.js';

// Bottom sheet simples de seleção de dia, usado pra mover uma atividade do
// Roteiro pra outro dia (ver ScheduleScreen.jsx, handleMoveToDay) — mesmo
// padrão visual de sheet-de-baixo do AddToHomeScreenPrompt.jsx.
export default function MoveToDayModal({ days, currentDayId, onSelect, onClose }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 60,
        display: 'flex',
        alignItems: 'flex-end',
        justifyContent: 'center',
      }}
    >
      <div
        onClick={onClose}
        style={{ position: 'absolute', inset: 0, background: 'rgba(28,26,23,0.55)' }}
      />

      <motion.div
        initial={{ y: 24 }}
        animate={{ y: 0 }}
        exit={{ y: 24 }}
        transition={{ duration: 0.22, ease: [0.32, 0.72, 0, 1] }}
        style={{
          position: 'relative',
          width: '100%',
          maxWidth: 480,
          maxHeight: '70dvh',
          background: '#fff',
          borderTopLeftRadius: radius.sheetTop,
          borderTopRightRadius: radius.sheetTop,
          boxSizing: 'border-box',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <div style={{ padding: `${spacing.screenGutter}px ${spacing.screenGutter}px 0` }}>
          <div style={{ ...type.sectionTitle, color: color.dark }}>Mover para outro dia</div>
        </div>

        <div style={{ overflowY: 'auto', padding: `${spacing.gapMd}px ${spacing.screenGutter}px calc(${spacing.screenGutter}px + env(safe-area-inset-bottom))` }}>
          {days.map((day, i) => {
            const isCurrent = day.id === currentDayId;
            return (
              <div
                key={day.id}
                onClick={() => !isCurrent && onSelect(day)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  padding: '12px 4px',
                  borderTop: i === 0 ? 'none' : `1px solid ${color.border}`,
                  cursor: isCurrent ? 'default' : 'pointer',
                  opacity: isCurrent ? 0.4 : 1,
                }}
              >
                <div
                  style={{
                    flex: 'none',
                    width: 36,
                    height: 36,
                    borderRadius: 11,
                    background: color.surfaceMuted,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <CalendarMinimalisticIcon size={17} color={color.dark} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ color: color.dark, fontSize: 14, fontWeight: 700 }}>
                    {day.weekday} · {day.date}
                  </div>
                  <div style={{ color: color.muted, fontSize: 12.5, fontWeight: 500, marginTop: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {isCurrent ? 'Dia atual' : day.theme}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </motion.div>
    </motion.div>
  );
}
