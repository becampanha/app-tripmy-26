import { TrashBinTrashIcon } from '@solar-icons/react/linear/trash-bin-trash';
import { AltArrowUpIcon } from '@solar-icons/react/linear/alt-arrow-up';
import { AltArrowDownIcon } from '@solar-icons/react/linear/alt-arrow-down';
import { PointOnMapIcon } from '@solar-icons/react/linear/point-on-map';
import { CloseIcon } from '@solar-icons/react/linear/close';
import { AltArrowRightIcon } from '@solar-icons/react/linear/alt-arrow-right';
import DebouncedInput, { FieldLabel } from './DebouncedInput.jsx';

export default function ActivityItem({
  activity,
  editing,
  cancelToken,
  onEditTime,
  onEditTitle,
  onEditSubtitle,
  onSelectPlace,
  onUnlinkPlace,
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
        position: 'relative',
        display: 'flex',
        gap: editing ? 12 : 0,
        flexDirection: editing ? 'row' : 'column',
        alignItems: editing ? 'flex-start' : 'stretch',
        padding: 14,
        marginBottom: 10,
        background: '#fff',
        border: '1px solid #ececec',
        borderRadius: 18,
      }}
    >
      {editing && (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'stretch', width: 64, flex: 'none', paddingTop: 2 }}>
          <FieldLabel>Horário</FieldLabel>
          <DebouncedInput
            value={activity.time}
            onCommit={onEditTime}
            cancelToken={cancelToken}
            style={{ marginTop: 3, padding: '4px 2px', fontSize: 12, fontWeight: 700, textAlign: 'center' }}
          />
        </div>
      )}

      {!editing && activity.time && (
        <div
          style={{
            position: 'absolute',
            top: 12,
            right: 12,
            padding: '4px 10px',
            borderRadius: 8,
            background: '#f9f7f2',
            color: '#1c1a17',
            fontSize: 11.5,
            fontWeight: 700,
            whiteSpace: 'nowrap',
          }}
        >
          {activity.time}
        </div>
      )}

      <div style={{ flex: 1, minWidth: 0 }}>
        {editing ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div>
              <FieldLabel>Título</FieldLabel>
              <DebouncedInput
                value={activity.title}
                onCommit={onEditTitle}
                cancelToken={cancelToken}
                placeholder="Título"
                style={{ marginTop: 3, fontSize: 14, fontWeight: 700 }}
              />
            </div>

            <div>
              <FieldLabel>Descrição</FieldLabel>
              <DebouncedInput
                value={activity.subtitle || ''}
                onCommit={onEditSubtitle}
                cancelToken={cancelToken}
                placeholder="Descrição (opcional)"
                style={{ marginTop: 3 }}
              />
            </div>

            <div>
              <FieldLabel>Lugar</FieldLabel>
              {place ? (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  marginTop: 5,
                  padding: 8,
                  borderRadius: 12,
                  background: '#f9f7f2',
                }}
              >
                <div
                  onClick={onSelectPlace}
                  style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1, minWidth: 0, cursor: 'pointer' }}
                >
                  <div style={{ width: 40, height: 40, borderRadius: 10, flex: 'none', overflow: 'hidden', background: '#eee9df' }}>
                    {place.photo && (
                      <img src={place.photo} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                    )}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ color: '#1c1a17', fontSize: 13, fontWeight: 800, lineHeight: 1.2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {place.name}
                    </div>
                    <div style={{ color: '#9a9186', fontSize: 11, fontWeight: 500, marginTop: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {place.address ? place.address.split(',')[0].trim() : ''}
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={onUnlinkPlace}
                  style={{
                    flex: 'none',
                    width: 22,
                    height: 22,
                    borderRadius: 11,
                    border: 0,
                    background: '#b3453f',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                  }}
                >
                  <CloseIcon size={12} color="#fff" />
                </button>
              </div>
              ) : (
                <div
                  onClick={onSelectPlace}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    marginTop: 5,
                    padding: '6px 10px',
                    borderRadius: 8,
                    background: '#f9f7f2',
                    color: '#1c1a17',
                    fontSize: 12,
                    fontWeight: 700,
                    cursor: 'pointer',
                    alignSelf: 'flex-start',
                  }}
                >
                  <PointOnMapIcon size={14} color="#1c1a17" />
                  Selecionar lugar
                </div>
              )}
            </div>
          </div>
        ) : (
          <>
            <div style={{ paddingRight: activity.time ? 64 : 0 }}>
              <div style={{ color: '#1c1a17', fontSize: 15, fontWeight: 700, lineHeight: 1.25 }}>{activity.title}</div>
            </div>
            {activity.subtitle && (
              <div style={{ color: '#9a9186', fontSize: 12.5, fontWeight: 500, marginTop: 2, lineHeight: 1.3 }}>
                {activity.subtitle}
              </div>
            )}
            {place && (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  marginTop: 10,
                  padding: 10,
                  borderRadius: 16,
                  background: '#f9f7f2',
                }}
              >
                <div style={{ width: 46, height: 46, borderRadius: 12, flex: 'none', overflow: 'hidden', background: '#eee9df' }}>
                  {place.photo && (
                    <img src={place.photo} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                  )}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ color: '#1c1a17', fontSize: 14.5, fontWeight: 800, lineHeight: 1.2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {place.name}
                  </div>
                  <div style={{ color: '#9a9186', fontSize: 11.5, fontWeight: 500, marginTop: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {place.address ? place.address.split(',')[0].trim() : ''}
                  </div>
                </div>
                <div
                  style={{
                    flex: 'none',
                    width: 34,
                    height: 34,
                    borderRadius: 12,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: '#1c1a17',
                  }}
                >
                  <AltArrowRightIcon size={14} color="#fff" />
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {editing && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4, flex: 'none', paddingTop: 2 }}>
          <button
            type="button"
            onClick={onMoveUp}
            disabled={isFirst}
            style={{ border: 0, background: 'none', padding: 2, cursor: isFirst ? 'default' : 'pointer', opacity: isFirst ? 0.3 : 1 }}
          >
            <AltArrowUpIcon size={16} color="#1c1a17" />
          </button>
          <button
            type="button"
            onClick={onMoveDown}
            disabled={isLast}
            style={{ border: 0, background: 'none', padding: 2, cursor: isLast ? 'default' : 'pointer', opacity: isLast ? 0.3 : 1 }}
          >
            <AltArrowDownIcon size={16} color="#1c1a17" />
          </button>
          <button type="button" onClick={onDelete} style={{ border: 0, background: 'none', padding: 2, cursor: 'pointer' }}>
            <TrashBinTrashIcon size={16} color="#b3453f" />
          </button>
        </div>
      )}
    </div>
  );
}
