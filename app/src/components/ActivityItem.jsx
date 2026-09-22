function TrashIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#b3453f" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 6h18" />
      <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
      <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
    </svg>
  );
}

function ArrowIcon({ dir }) {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#1c1a17" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
      <path d={dir === 'up' ? 'M18 15l-6-6-6 6' : 'M6 9l6 6 6-6'} />
    </svg>
  );
}

function LinkIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#1c1a17" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m2 7 4.41-4.41A2 2 0 0 1 7.83 2h8.34a2 2 0 0 1 1.42.59L22 7" />
      <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
    </svg>
  );
}

export default function ActivityItem({
  activity,
  editing,
  onEditTime,
  onEditTitle,
  onSelectPlace,
  onDelete,
  onMoveUp,
  onMoveDown,
  isFirst,
  isLast,
}) {
  const { place } = activity;

  return (
    <div
      style={{
        display: 'flex',
        gap: 12,
        alignItems: place ? 'stretch' : 'center',
        padding: place ? 8 : 14,
        marginBottom: 10,
        background: '#fff',
        borderRadius: 18,
        boxShadow: '0 2px 10px rgba(28,26,23,0.06)',
      }}
    >
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: 56, flex: 'none', justifyContent: 'center' }}>
        {editing ? (
          <input
            value={activity.time}
            onChange={(e) => onEditTime(e.target.value)}
            style={{
              width: '100%',
              border: '1px solid #eee9df',
              borderRadius: 8,
              padding: '4px 2px',
              fontSize: 12,
              fontWeight: 700,
              textAlign: 'center',
              color: '#1c1a17',
            }}
          />
        ) : (
          <div style={{ color: '#1c1a17', fontSize: 13, fontWeight: 700, whiteSpace: 'nowrap' }}>{activity.time}</div>
        )}
      </div>

      {!place && <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#1c1a17', flex: 'none' }} />}

      <div style={{ flex: 1, minWidth: 0 }}>
        {place ? (
          <div
            onClick={editing ? onSelectPlace : undefined}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              padding: 8,
              borderRadius: 12,
              background: '#f7f5f1',
              cursor: editing ? 'pointer' : 'default',
            }}
          >
            <div style={{ width: 44, height: 44, borderRadius: 10, flex: 'none', overflow: 'hidden', background: '#eee9df' }}>
              {place.photo && (
                <img src={place.photo} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
              )}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ color: '#1c1a17', fontSize: 14, fontWeight: 800, lineHeight: 1.2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {place.name}
              </div>
              <div style={{ color: '#9a9186', fontSize: 11.5, fontWeight: 500, marginTop: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {place.address ? place.address.split(',')[0].trim() : ''}
              </div>
            </div>
          </div>
        ) : editing ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <input
              value={activity.title}
              onChange={(e) => onEditTitle(e.target.value)}
              placeholder="Título"
              style={{
                border: '1px solid #eee9df',
                borderRadius: 8,
                padding: '6px 8px',
                fontSize: 14,
                fontWeight: 700,
                color: '#1c1a17',
              }}
            />
            <div
              onClick={onSelectPlace}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                padding: '6px 10px',
                borderRadius: 8,
                background: '#f7f5f1',
                color: '#1c1a17',
                fontSize: 12,
                fontWeight: 700,
                cursor: 'pointer',
                alignSelf: 'flex-start',
              }}
            >
              <LinkIcon />
              Selecionar lugar
            </div>
          </div>
        ) : (
          <>
            <div style={{ color: '#1c1a17', fontSize: 15, fontWeight: 700, lineHeight: 1.25 }}>{activity.title}</div>
            {activity.subtitle && (
              <div style={{ color: '#9a9186', fontSize: 12.5, fontWeight: 500, marginTop: 2, lineHeight: 1.3 }}>
                {activity.subtitle}
              </div>
            )}
          </>
        )}
      </div>

      {editing && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4, flex: 'none', justifyContent: 'center' }}>
          <button
            type="button"
            onClick={onMoveUp}
            disabled={isFirst}
            style={{ border: 0, background: 'none', padding: 2, cursor: isFirst ? 'default' : 'pointer', opacity: isFirst ? 0.3 : 1 }}
          >
            <ArrowIcon dir="up" />
          </button>
          <button
            type="button"
            onClick={onMoveDown}
            disabled={isLast}
            style={{ border: 0, background: 'none', padding: 2, cursor: isLast ? 'default' : 'pointer', opacity: isLast ? 0.3 : 1 }}
          >
            <ArrowIcon dir="down" />
          </button>
          <button type="button" onClick={onDelete} style={{ border: 0, background: 'none', padding: 2, cursor: 'pointer' }}>
            <TrashIcon />
          </button>
        </div>
      )}
    </div>
  );
}
