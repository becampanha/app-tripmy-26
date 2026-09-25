import { StarIcon } from '@solar-icons/react/bold/star';
import { ClockCircleIcon } from '@solar-icons/react/bold/clock-circle';
import { UsersGroupRoundedIcon } from '@solar-icons/react/bold/users-group-rounded';

const INTENSITY_COLOR = {
  Alta: '#b3453f',
  Média: '#c98a3a',
  Baixa: '#3fa35a',
};

function InfoBit({ label, value }) {
  if (!value) return null;
  return (
    <div style={{ minWidth: 0 }}>
      <div style={{ color: '#9a9186', fontSize: 10.5, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.3 }}>
        {label}
      </div>
      <div style={{ color: '#1c1a17', fontSize: 12.5, fontWeight: 700, marginTop: 2, lineHeight: 1.3 }}>
        {value}
      </div>
    </div>
  );
}

export default function AttractionCard({ attraction }) {
  const intensityColor = INTENSITY_COLOR[attraction.intensity] || '#9a9186';

  return (
    <div
      style={{
        padding: 14,
        marginBottom: 10,
        borderRadius: 18,
        background: '#fff',
        border: '1px solid #ececec',
      }}
    >
      <div style={{ display: 'flex', gap: 12, alignItems: 'stretch' }}>
        <div style={{ flex: 1, minWidth: 0, display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10 }}>
          <div style={{ minWidth: 0 }}>
            {attraction.required && (
              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 4,
                  padding: '2px 8px 2px 6px',
                  borderRadius: 7,
                  background: '#1c1a17',
                  marginBottom: 6,
                }}
              >
                <StarIcon size={11} color="#f4c65a" />
                <span style={{ color: '#fff', fontSize: 10.5, fontWeight: 700 }}>Obrigatória</span>
              </div>
            )}
            <div style={{ color: '#1c1a17', fontSize: 15, fontWeight: 800, lineHeight: 1.25 }}>
              {attraction.name}
            </div>
            {attraction.type && (
              <div style={{ color: '#9a9186', fontSize: 12, fontWeight: 600, marginTop: 2 }}>
                {attraction.type}
              </div>
            )}
          </div>

          {attraction.intensity && (
            <div
              style={{
                flex: 'none',
                padding: '3px 9px',
                borderRadius: 8,
                background: `${intensityColor}1a`,
                color: intensityColor,
                fontSize: 10.5,
                fontWeight: 700,
                whiteSpace: 'nowrap',
              }}
            >
              {attraction.intensity}
            </div>
          )}
        </div>

        {attraction.photo && (
          <div
            style={{
              flex: 'none',
              width: 96,
              minHeight: 84,
              alignSelf: 'stretch',
              borderRadius: 14,
              overflow: 'hidden',
              background: '#eee9df',
              position: 'relative',
            }}
          >
            <img
              src={attraction.photo}
              alt=""
              loading="lazy"
              style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }}
            />
          </div>
        )}
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          rowGap: 10,
          columnGap: 10,
          marginTop: 12,
          paddingTop: 12,
          borderTop: '1px solid #f2efe9',
        }}
      >
        <InfoBit label="Duração" value={attraction.duration} />
        <InfoBit label="Fila" value={attraction.queue} />
        <InfoBit label="Melhor horário" value={attraction.bestTime} />
        <InfoBit label="Restrições" value={attraction.restrictions} />
      </div>

      {attraction.parentSwap && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            marginTop: 10,
            paddingTop: 10,
            borderTop: '1px solid #f2efe9',
          }}
        >
          <UsersGroupRoundedIcon size={14} color="#3fa35a" />
          <span style={{ color: '#3fa35a', fontSize: 12, fontWeight: 700 }}>Tem Parent Swap</span>
        </div>
      )}
    </div>
  );
}
