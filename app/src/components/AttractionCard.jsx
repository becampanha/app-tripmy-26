import { CheckCircleIcon } from '@solar-icons/react/bold/check-circle';
import { AddCircleIcon } from '@solar-icons/react/bold/add-circle';
import { ClockCircleIcon } from '@solar-icons/react/bold/clock-circle';
import { UsersGroupRoundedIcon } from '@solar-icons/react/bold/users-group-rounded';
import { FerrisWheelIcon } from '@solar-icons/react/bold/ferris-wheel';
import { CalendarMinimalisticIcon } from '@solar-icons/react/bold/calendar-minimalistic';
import { InfoCircleIcon } from '@solar-icons/react/bold/info-circle';
import { PhotoCard, color as tokenColor } from '../design-system/index.js';

const INTENSITY_LABEL = {
  Alta: 'Muito radical',
  Média: 'Radical',
  Baixa: 'Pouco radical',
};

// Mini-card compacto: ícone + valor numa linha só, sem label separado.
// Usado no canto superior direito para Duração e Fila, e no canto superior
// esquerdo para Melhor horário e Restrições.
function MiniStat({ icon: Icon, value }) {
  if (!value) return null;
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 4,
        padding: '4px 8px',
        borderRadius: 8,
        background: 'rgba(28,26,23,0.55)',
      }}
    >
      <Icon size={12} color="#fff" />
      <span style={{ color: '#fff', fontSize: 11, fontWeight: 700, whiteSpace: 'nowrap' }}>{value}</span>
    </div>
  );
}

// Mesmo MiniStat, mas com um pontinho verde pulsante ao lado do valor —
// usado só quando o dado é a fila real (API), não a estimativa da planilha.
function LiveMiniStat({ icon: Icon, value }) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 4,
        padding: '4px 8px',
        borderRadius: 8,
        background: 'rgba(28,26,23,0.55)',
      }}
    >
      <Icon size={12} color="#fff" />
      <span style={{ color: '#fff', fontSize: 11, fontWeight: 700, whiteSpace: 'nowrap' }}>{value}</span>
      <span
        style={{
          width: 5,
          height: 5,
          borderRadius: 3,
          background: tokenColor.success,
          animation: 'pulse 1.6s ease-in-out infinite',
        }}
      />
    </div>
  );
}

export default function AttractionCard({ attraction, liveQueue, onToggleRequired }) {
  const intensityLabel = INTENSITY_LABEL[attraction.intensity] || attraction.intensity;
  const hasHeightRestriction = attraction.restrictions === 'Altura mínima';
  const hasLiveQueue = typeof liveQueue === 'number';
  const queueValue = hasLiveQueue ? `${liveQueue} min` : attraction.queue;

  return (
    <PhotoCard photo={attraction.photo} contentStyle={{ padding: 14, display: 'flex', flexDirection: 'column' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10 }}>
        {attraction.bestTime && (
          <div style={{ display: 'flex', gap: 6, flex: 'none' }}>
            <MiniStat icon={CalendarMinimalisticIcon} value={attraction.bestTime} />
          </div>
        )}

        {(attraction.duration || queueValue) && (
          <div style={{ display: 'flex', gap: 6, flex: 'none', marginLeft: 'auto' }}>
            <MiniStat icon={FerrisWheelIcon} value={attraction.duration} />
            {hasLiveQueue ? (
              <LiveMiniStat icon={ClockCircleIcon} value={queueValue} />
            ) : (
              <MiniStat icon={ClockCircleIcon} value={queueValue} />
            )}
          </div>
        )}
      </div>

      <div style={{ flex: 1 }} />

      <div style={{ minWidth: 0 }}>
        <div
          onClick={(e) => {
            e.stopPropagation();
            onToggleRequired?.(!attraction.required);
          }}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 4,
            padding: '3px 8px 3px 6px',
            borderRadius: 7,
            background: attraction.required ? tokenColor.success : tokenColor.dark,
            marginBottom: 5,
            cursor: onToggleRequired ? 'pointer' : 'default',
          }}
        >
          {attraction.required ? (
            <CheckCircleIcon size={12} color="#fff" />
          ) : (
            <AddCircleIcon size={12} color="#fff" />
          )}
          <span style={{ color: '#fff', fontSize: 10.5, fontWeight: 700 }}>
            {attraction.required ? 'Está no roteiro' : 'Não está no roteiro'}
          </span>
        </div>
        <div style={{ color: '#fff', fontSize: 15, fontWeight: 800, lineHeight: 1.25, textShadow: '0 1px 4px rgba(0,0,0,0.35)' }}>
          {attraction.name}
        </div>
        {(attraction.type || attraction.intensity) && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 2 }}>
            {attraction.type && (
              <span style={{ color: 'rgba(255,255,255,0.85)', fontSize: 12, fontWeight: 600, textShadow: '0 1px 4px rgba(0,0,0,0.35)' }}>
                {attraction.type}
              </span>
            )}
            {attraction.type && attraction.intensity && (
              <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: 12 }}>•</span>
            )}
            {attraction.intensity && (
              <span style={{ color: 'rgba(255,255,255,0.85)', fontSize: 12, fontWeight: 600, textShadow: '0 1px 4px rgba(0,0,0,0.35)' }}>
                {intensityLabel}
              </span>
            )}
          </div>
        )}
        {(hasHeightRestriction || attraction.parentSwap) && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 6 }}>
            {hasHeightRestriction && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <InfoCircleIcon size={13} color={tokenColor.warning} />
                <span style={{ color: tokenColor.warning, fontSize: 12, fontWeight: 600, textShadow: '0 1px 4px rgba(0,0,0,0.35)' }}>
                  Atração requer altura mínima
                </span>
              </div>
            )}
            {hasHeightRestriction && attraction.parentSwap && (
              <span style={{ color: tokenColor.warning, opacity: 0.6, fontSize: 12 }}>•</span>
            )}
            {attraction.parentSwap && (
              <span style={{ color: tokenColor.warning, fontSize: 12, fontWeight: 600, textShadow: '0 1px 4px rgba(0,0,0,0.35)' }}>
                Possui Parent Swap
              </span>
            )}
          </div>
        )}
      </div>
    </PhotoCard>
  );
}
