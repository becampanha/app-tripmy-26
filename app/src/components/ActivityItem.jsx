import { useNavigate } from 'react-router-dom';
import { TrashBinTrashIcon } from '@solar-icons/react/linear/trash-bin-trash';
import { AltArrowUpIcon } from '@solar-icons/react/linear/alt-arrow-up';
import { AltArrowDownIcon } from '@solar-icons/react/linear/alt-arrow-down';
import { PointOnMapIcon } from '@solar-icons/react/linear/point-on-map';
import { CloseIcon } from '@solar-icons/react/linear/close';
import { AltArrowRightIcon } from '@solar-icons/react/linear/alt-arrow-right';
import { ClockCircleIcon } from '@solar-icons/react/bold/clock-circle';
import { FieldLabel, inputStyle, color, radius, type } from '../design-system/index.js';

export default function ActivityItem({
  activity,
  editing,
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
  const navigate = useNavigate();
  const clickable = !editing && !!place;

  return (
    <div
      onClick={clickable ? () => navigate(`/lugares/${place.id}`) : undefined}
      style={{
        position: 'relative',
        display: 'flex',
        gap: editing ? 12 : 0,
        flexDirection: editing ? 'row' : 'column',
        alignItems: editing ? 'flex-start' : 'stretch',
        padding: 14,
        background: color.bg,
        border: `1px solid ${color.border}`,
        borderRadius: radius.card,
        cursor: clickable ? 'pointer' : 'default',
      }}
    >
      {editing && (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'stretch', width: 64, flex: 'none', paddingTop: 2 }}>
          <FieldLabel>Horário</FieldLabel>
          <input
            value={activity.time}
            onChange={(e) => onEditTime(e.target.value)}
            style={{ ...inputStyle, marginTop: 3, padding: '4px 2px', fontSize: 12, fontWeight: 700, textAlign: 'center' }}
          />
        </div>
      )}

      <div style={{ flex: 1, minWidth: 0, display: editing ? 'block' : 'flex', gap: editing ? 0 : 12, alignItems: editing ? undefined : 'stretch' }}>
        {editing ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div>
              <FieldLabel>Título</FieldLabel>
              <input
                value={activity.title}
                onChange={(e) => onEditTitle(e.target.value)}
                placeholder="Título"
                style={{ ...inputStyle, marginTop: 3, fontSize: 14, fontWeight: 700 }}
              />
            </div>

            <div>
              <FieldLabel>Descrição</FieldLabel>
              <input
                value={activity.subtitle || ''}
                onChange={(e) => onEditSubtitle(e.target.value)}
                placeholder="Descrição (opcional)"
                style={{ ...inputStyle, marginTop: 3 }}
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
                  borderRadius: radius.input,
                  background: color.surfaceMuted,
                }}
              >
                <div
                  onClick={onSelectPlace}
                  style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1, minWidth: 0, cursor: 'pointer' }}
                >
                  <div style={{ width: 40, height: 40, borderRadius: 10, flex: 'none', overflow: 'hidden', background: color.imagePlaceholder }}>
                    {place.photo && (
                      <img src={place.photo} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                    )}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ color: color.dark, fontSize: 13, fontWeight: 800, lineHeight: 1.2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {place.name}
                    </div>
                    <div style={{ color: color.muted, fontSize: 11, fontWeight: 500, marginTop: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
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
                    background: color.danger,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                  }}
                >
                  <CloseIcon size={12} color={color.white} />
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
                    borderRadius: radius.badge,
                    background: color.surfaceMuted,
                    color: color.dark,
                    fontSize: 12,
                    fontWeight: 700,
                    cursor: 'pointer',
                    alignSelf: 'flex-start',
                  }}
                >
                  <PointOnMapIcon size={14} color={color.dark} />
                  Selecionar lugar
                </div>
              )}
            </div>
          </div>
        ) : (
          <>
            <div style={{ flex: 1, minWidth: 0 }}>
              {activity.time && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 4, color: color.muted, ...type.label, marginBottom: 4 }}>
                  <ClockCircleIcon size={13} color={color.muted} />
                  {activity.time}
                </div>
              )}
              <div style={{ color: color.dark, ...type.itemTitle }}>{activity.title}</div>
              {activity.subtitle && (
                <div style={{ color: color.dark, ...type.paragraph, marginTop: 2 }}>
                  {activity.subtitle}
                </div>
              )}
              {place && (
                <div
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 4,
                    marginTop: 10,
                    padding: '4px 8px 4px 10px',
                    borderRadius: radius.badge,
                    background: color.surfaceMuted,
                    color: color.dark,
                    fontSize: 11.5,
                    fontWeight: 700,
                    maxWidth: '100%',
                  }}
                >
                  {place.tag && <span style={{ flex: 'none' }}>{place.tag.split(' ')[0]}</span>}
                  <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{place.name}</span>
                  <AltArrowRightIcon size={13} color={color.dark} style={{ flex: 'none' }} />
                </div>
              )}
            </div>

            {place && (
              <div
                className={place.photo ? 'allow-native-touch' : undefined}
                style={{
                  position: 'relative',
                  flex: 'none',
                  width: 96,
                  minHeight: 84,
                  alignSelf: 'stretch',
                  borderRadius: radius.chip,
                  overflow: 'hidden',
                  background: color.imagePlaceholder,
                }}
              >
                {place.photo && (
                  <img
                    src={place.photo}
                    alt=""
                    style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                )}
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
            <AltArrowUpIcon size={16} color={color.dark} />
          </button>
          <button
            type="button"
            onClick={onMoveDown}
            disabled={isLast}
            style={{ border: 0, background: 'none', padding: 2, cursor: isLast ? 'default' : 'pointer', opacity: isLast ? 0.3 : 1 }}
          >
            <AltArrowDownIcon size={16} color={color.dark} />
          </button>
          <button type="button" onClick={onDelete} style={{ border: 0, background: 'none', padding: 2, cursor: 'pointer' }}>
            <TrashBinTrashIcon size={16} color={color.danger} />
          </button>
        </div>
      )}
    </div>
  );
}
