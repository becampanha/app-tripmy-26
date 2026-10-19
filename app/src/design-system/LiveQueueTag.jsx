import { ClockCircleIcon } from '@solar-icons/react/bold/clock-circle';
import { LockKeyholeMinimalisticIcon } from '@solar-icons/react/bold/lock-keyhole-minimalistic';
import { color, radius } from './tokens.js';

// Badge de fila em tempo real de uma atração — mesmo visual já usado no
// lugar vinculado a uma atividade do roteiro de dias (ActivityItem.jsx):
// ícone de relógio + valor + pontinho verde pulsante (só quando isLive:
// tempo real de verdade, não um status tipo "Fechada"/"Em manutenção", que
// também usa esta tag mas sem o pulso). Extraído de
// AttractionsItineraryScreen.jsx pra ser reaproveitado também nos subitens
// do card "Roteiro" (ItineraryCardItem.jsx).
export default function LiveQueueTag({ value, isLive, isClosed, style }) {
  const tagColor = isClosed ? color.warning : color.dark;
  return (
    <div
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 4,
        padding: '4px 8px 4px 10px',
        borderRadius: radius.badge,
        background: color.surfaceMuted,
        color: tagColor,
        fontSize: 11.5,
        fontWeight: 700,
        ...style,
      }}
    >
      {isClosed ? (
        <LockKeyholeMinimalisticIcon size={13} color={tagColor} />
      ) : (
        <ClockCircleIcon size={13} color={tagColor} />
      )}
      <span style={{ whiteSpace: 'nowrap' }}>{value}</span>
      {isLive && (
        <span
          style={{
            width: 5,
            height: 5,
            borderRadius: 3,
            background: color.success,
            animation: 'pulse 1.6s ease-in-out infinite',
          }}
        />
      )}
    </div>
  );
}
