import { useNavigate } from 'react-router-dom';
import { Reorder, useDragControls } from 'motion/react';
import { ClockCircleIcon } from '@solar-icons/react/bold/clock-circle';
import { AltArrowRightIcon } from '@solar-icons/react/linear/alt-arrow-right';
import { PointOnMapIcon } from '@solar-icons/react/linear/point-on-map';
import { FerrisWheelIcon } from '@solar-icons/react/bold/ferris-wheel';
import { CloseIcon } from '@solar-icons/react/linear/close';
import { CalendarAddIcon } from '@solar-icons/react/linear/calendar-add';
import { TrashBinTrashIcon } from '@solar-icons/react/linear/trash-bin-trash';
import { HamburgerMenuIcon } from '@solar-icons/react/linear/hamburger-menu';
import { AltArrowUpIcon } from '@solar-icons/react/linear/alt-arrow-up';
import { AltArrowDownIcon } from '@solar-icons/react/linear/alt-arrow-down';
import { AddIcon } from '@solar-icons/react/linear/add';
import { MapIcon } from '@solar-icons/react/linear/map';
import { FieldLabel, inputStyle, color, radius, type } from '../design-system/index.js';
import { useTapHandler } from '../hooks/useTapHandler.js';
import { useLiveQueueTimes } from '../hooks/useLiveQueueTimes.js';

// Subitem de um card "Roteiro" — sempre numerado (1, 2, 3...), mesmo visual
// de número já usado em AttractionsItineraryScreen.jsx (círculo
// width/height 44, borderRadius 14, fundo surfaceMuted). Sem horário próprio
// (ver ItineraryCardItem) — só título/descrição livres e um vínculo opcional
// a lugar OU atração, igual ActivityItem. Fase 4: CRUD completo (editar,
// mover cima/baixo, excluir) — drag-and-drop vem na fase 5.
function ItinerarySubItem({
  subItem,
  index,
  isFirst,
  isLast,
  getLiveQueue,
  getLiveStatus,
  editing,
  onEditTime,
  onEditTitle,
  onEditSubtitle,
  onSelectPlace,
  onUnlinkPlace,
  onSelectAttraction,
  onUnlinkAttraction,
  onDelete,
  onMoveUp,
  onMoveDown,
}) {
  const navigate = useNavigate();
  const { place, attraction } = subItem;
  const clickable = !editing && (!!place || !!attraction);
  const tapHandlers = useTapHandler(
    clickable ? () => navigate(place ? `/lugares/${place.id}` : `/atracoes/${attraction.id}`) : null
  );

  const liveQueue = attraction ? getLiveQueue(attraction.name) : null;
  const hasLiveQueue = typeof liveQueue === 'number';
  const liveStatus = attraction && !hasLiveQueue ? getLiveStatus(attraction.name) : null;
  const statusLabel = liveStatus === 'CLOSED' || liveStatus === 'DOWN' || liveStatus === 'REFURBISHMENT' ? 'Fechada' : null;
  const tagValue = hasLiveQueue ? `${liveQueue} min` : statusLabel;
  const dragControls = useDragControls();

  if (editing) {
    return (
      <Reorder.Item
        value={subItem}
        dragListener={false}
        dragControls={dragControls}
        style={{ listStyle: 'none', display: 'flex', gap: 10, padding: '10px 0', alignItems: 'flex-start', background: color.bg }}
      >
        <button
          type="button"
          onPointerDown={(e) => dragControls.start(e)}
          style={{
            flex: 'none',
            width: 36,
            height: 36,
            borderRadius: 12,
            background: color.surfaceMuted,
            border: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginTop: 2,
            cursor: 'grab',
            touchAction: 'none',
          }}
        >
          <HamburgerMenuIcon size={16} color={color.dark} />
        </button>

        <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div style={{ display: 'flex', gap: 8 }}>
            <input
              value={subItem.time || ''}
              onChange={(e) => onEditTime(e.target.value)}
              placeholder="Horário"
              style={{ ...inputStyle, flex: 'none', width: 56, fontSize: 12, fontWeight: 700, textAlign: 'center' }}
            />
            <input
              value={subItem.title}
              onChange={(e) => onEditTitle(e.target.value)}
              placeholder="Título"
              style={{ ...inputStyle, flex: 1, minWidth: 0, fontSize: 13, fontWeight: 700 }}
            />
          </div>
          <textarea
            value={subItem.subtitle || ''}
            onChange={(e) => onEditSubtitle(e.target.value)}
            placeholder="Descrição (opcional)"
            rows={2}
            style={{ ...inputStyle, resize: 'vertical', fontFamily: 'inherit', fontSize: 13 }}
          />

          {place || attraction ? (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                padding: 6,
                borderRadius: radius.input,
                background: color.surfaceMuted,
              }}
            >
              <div
                onClick={place ? onSelectPlace : onSelectAttraction}
                style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1, minWidth: 0, cursor: 'pointer' }}
              >
                <div style={{ width: 32, height: 32, borderRadius: 8, flex: 'none', overflow: 'hidden', background: color.imagePlaceholder }}>
                  {(place || attraction).photo && (
                    <img src={(place || attraction).photo} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                  )}
                </div>
                <div style={{ flex: 1, minWidth: 0, color: color.dark, fontSize: 12, fontWeight: 800, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {(place || attraction).name}
                </div>
              </div>
              <button
                type="button"
                onClick={place ? onUnlinkPlace : onUnlinkAttraction}
                style={{ flex: 'none', width: 20, height: 20, borderRadius: 10, border: 0, background: color.danger, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
              >
                <CloseIcon size={11} color={color.white} />
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', gap: 6 }}>
              <div
                onClick={onSelectPlace}
                style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '5px 8px', borderRadius: radius.badge, background: color.surfaceMuted, color: color.dark, fontSize: 11, fontWeight: 700, cursor: 'pointer' }}
              >
                <PointOnMapIcon size={12} color={color.dark} />
                Lugar
              </div>
              <div
                onClick={onSelectAttraction}
                style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '5px 8px', borderRadius: radius.badge, background: color.surfaceMuted, color: color.dark, fontSize: 11, fontWeight: 700, cursor: 'pointer' }}
              >
                <FerrisWheelIcon size={12} color={color.dark} />
                Atração
              </div>
            </div>
          )}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 2, flex: 'none' }}>
          <button type="button" onClick={onMoveUp} disabled={isFirst} style={{ border: 0, background: 'none', padding: 2, cursor: isFirst ? 'default' : 'pointer', opacity: isFirst ? 0.3 : 1 }}>
            <AltArrowUpIcon size={14} color={color.dark} />
          </button>
          <button type="button" onClick={onMoveDown} disabled={isLast} style={{ border: 0, background: 'none', padding: 2, cursor: isLast ? 'default' : 'pointer', opacity: isLast ? 0.3 : 1 }}>
            <AltArrowDownIcon size={14} color={color.dark} />
          </button>
          <button type="button" onClick={onDelete} style={{ border: 0, background: 'none', padding: 2, cursor: 'pointer' }}>
            <TrashBinTrashIcon size={14} color={color.danger} />
          </button>
        </div>
      </Reorder.Item>
    );
  }

  return (
    <div
      {...tapHandlers}
      role={clickable ? 'button' : undefined}
      tabIndex={clickable ? 0 : undefined}
      style={{
        position: 'relative',
        display: 'flex',
        alignItems: 'stretch',
        gap: 12,
        padding: '10px 0',
        cursor: clickable ? 'pointer' : 'default',
      }}
    >
      <div style={{ flex: 1, minWidth: 0 }}>
        {subItem.time && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, color: color.muted, ...type.label, marginBottom: 4 }}>
            <ClockCircleIcon size={13} color={color.muted} />
            {subItem.time}
          </div>
        )}
        {subItem.title && (
          <div style={{ color: color.dark, ...type.itemTitle, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {subItem.title}
          </div>
        )}
        {subItem.subtitle && (
          <div style={{ color: color.dark, ...type.paragraph, marginTop: subItem.title ? 2 : 0 }}>
            {subItem.subtitle}
          </div>
        )}
        {tagValue && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, color: color.muted, ...type.label, marginTop: 6 }}>
            <ClockCircleIcon size={13} color={color.muted} />
            {hasLiveQueue ? `Tempo de fila: ${tagValue}` : tagValue}
          </div>
        )}
        {(place || attraction) && (
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 4,
              marginTop: 6,
              padding: '4px 8px 4px 10px',
              borderRadius: radius.badge,
              background: color.surfaceMuted,
              color: color.dark,
              fontSize: 11.5,
              fontWeight: 700,
              maxWidth: '100%',
            }}
          >
            {place
              ? place.tag && <span style={{ flex: 'none' }}>{place.tag.split(' ')[0]}</span>
              : attraction.parkEmoji && <span style={{ flex: 'none' }}>{attraction.parkEmoji}</span>}
            <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{(place || attraction).name}</span>
            <AltArrowRightIcon size={13} color={color.dark} style={{ flex: 'none' }} />
          </div>
        )}
      </div>

      {(place || attraction) && (
        <div
          className={(place || attraction).photo ? 'allow-native-touch' : undefined}
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
          {(place || attraction).photo && (
            <img
              src={(place || attraction).photo}
              alt=""
              style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }}
            />
          )}
        </div>
      )}
    </div>
  );
}

// Card "Roteiro" — mini-roteiro dentro de um dia, com horário e local
// guarda-chuva opcionais (igual a uma ActivityItem comum) e uma lista de
// subitens sempre expandida (sem accordion/collapse). Fase 5: drag-and-drop
// dos subitens via Reorder.Group interno (próprio, aninhado dentro do
// Reorder.Item do card no Reorder.Group externo de ScheduleScreen.jsx — ver
// investigação registrada no CLAUDE.md sobre nesting ser seguro: cada grupo
// só enxerga seus próprios Reorder.Item via Context, não há "vazamento"
// entre os dois níveis).
export default function ItineraryCardItem({
  activity,
  editing,
  onEditTime,
  onEditTitle,
  onEditSubtitle,
  onSelectPlace,
  onUnlinkPlace,
  onSelectAttraction,
  onUnlinkAttraction,
  onDelete,
  onMoveToDay,
  onAddSubItem,
  onReorderSubItems,
  onEditSubItemTime,
  onEditSubItemTitle,
  onEditSubItemSubtitle,
  onSelectSubItemPlace,
  onUnlinkSubItemPlace,
  onSelectSubItemAttraction,
  onUnlinkSubItemAttraction,
  onDeleteSubItem,
  onMoveSubItemUp,
  onMoveSubItemDown,
  onDragHandlePointerDown,
}) {
  const navigate = useNavigate();
  const { place, attraction } = activity;
  const items = activity.items || [];
  const { getLiveQueue, getLiveStatus } = useLiveQueueTimes();
  const clickable = !editing && (!!place || !!attraction);
  const tapHandlers = useTapHandler(
    clickable ? () => navigate(place ? `/lugares/${place.id}` : `/atracoes/${attraction.id}`) : null
  );

  return (
    <div
      style={{
        position: 'relative',
        display: 'flex',
        gap: editing ? 12 : 0,
        padding: 14,
        background: color.bg,
        border: `1px solid ${color.border}`,
        borderRadius: radius.card,
        boxSizing: 'border-box',
      }}
    >
      <div style={{ flex: 1, minWidth: 0 }}>
        {editing ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div style={{ display: 'flex', gap: 12 }}>
              <div style={{ width: 64, flex: 'none' }}>
                <FieldLabel>Horário</FieldLabel>
                <input
                  value={activity.time}
                  onChange={(e) => onEditTime(e.target.value)}
                  style={{ ...inputStyle, marginTop: 3, padding: '4px 2px', fontSize: 12, fontWeight: 700, textAlign: 'center' }}
                />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <FieldLabel>Título</FieldLabel>
                <input
                  value={activity.title}
                  onChange={(e) => onEditTitle(e.target.value)}
                  placeholder="Título do roteiro"
                  style={{ ...inputStyle, marginTop: 3, fontSize: 14, fontWeight: 700 }}
                />
              </div>
            </div>

            <div>
              <FieldLabel>Descrição</FieldLabel>
              <textarea
                value={activity.subtitle || ''}
                onChange={(e) => onEditSubtitle(e.target.value)}
                placeholder="Descrição (opcional)"
                rows={3}
                style={{ ...inputStyle, marginTop: 3, resize: 'vertical', fontFamily: 'inherit' }}
              />
            </div>

            <div>
              <FieldLabel>Local (opcional)</FieldLabel>
              {place || attraction ? (
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
                    onClick={place ? onSelectPlace : onSelectAttraction}
                    style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1, minWidth: 0, cursor: 'pointer' }}
                  >
                    <div style={{ width: 40, height: 40, borderRadius: 10, flex: 'none', overflow: 'hidden', background: color.imagePlaceholder }}>
                      {(place || attraction).photo && (
                        <img src={(place || attraction).photo} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                      )}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ color: color.dark, fontSize: 13, fontWeight: 800, lineHeight: 1.2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {(place || attraction).name}
                      </div>
                      <div style={{ color: color.muted, fontSize: 11, fontWeight: 500, marginTop: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {place ? (place.address ? place.address.split(',')[0].trim() : '') : `${attraction.parkName} · ${attraction.area}`}
                      </div>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={place ? onUnlinkPlace : onUnlinkAttraction}
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
                <div style={{ display: 'flex', gap: 8, marginTop: 5 }}>
                  <div
                    onClick={onSelectPlace}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6,
                      padding: '6px 10px',
                      borderRadius: radius.badge,
                      background: color.surfaceMuted,
                      color: color.dark,
                      fontSize: 12,
                      fontWeight: 700,
                      cursor: 'pointer',
                    }}
                  >
                    <PointOnMapIcon size={14} color={color.dark} />
                    Selecionar lugar
                  </div>
                  <div
                    onClick={onSelectAttraction}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6,
                      padding: '6px 10px',
                      borderRadius: radius.badge,
                      background: color.surfaceMuted,
                      color: color.dark,
                      fontSize: 12,
                      fontWeight: 700,
                      cursor: 'pointer',
                    }}
                  >
                    <FerrisWheelIcon size={14} color={color.dark} />
                    Selecionar atração
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div style={{ display: 'flex', gap: 12, alignItems: 'stretch' }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              {activity.time && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 4, color: color.muted, ...type.label, marginBottom: 4 }}>
                  <ClockCircleIcon size={13} color={color.muted} />
                  {activity.time}
                </div>
              )}
              {activity.title && (
                <div style={{ color: color.dark, ...type.itemTitle }}>{activity.title}</div>
              )}
              {activity.subtitle && (
                <div style={{ color: color.dark, ...type.paragraph, marginTop: 2 }}>
                  {activity.subtitle}
                </div>
              )}
              {(place || attraction) && (
                <div
                  {...tapHandlers}
                  role={clickable ? 'button' : undefined}
                  tabIndex={clickable ? 0 : undefined}
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
                    cursor: clickable ? 'pointer' : 'default',
                  }}
                >
                  {place
                    ? place.tag && <span style={{ flex: 'none' }}>{place.tag.split(' ')[0]}</span>
                    : attraction.parkEmoji && <span style={{ flex: 'none' }}>{attraction.parkEmoji}</span>}
                  <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{(place || attraction).name}</span>
                  <AltArrowRightIcon size={13} color={color.dark} style={{ flex: 'none' }} />
                </div>
              )}
            </div>

            {(place || attraction) && (
              <div
                className={(place || attraction).photo ? 'allow-native-touch' : undefined}
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
                {(place || attraction).photo && (
                  <img
                    src={(place || attraction).photo}
                    alt=""
                    style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                )}
              </div>
            )}
          </div>
        )}

        {(items.length > 0 || editing) && (
          <div style={{ marginTop: 12, borderTop: `1px solid ${color.border}`, paddingTop: 2 }}>
            {editing ? (
              <Reorder.Group as="div" axis="y" values={items} onReorder={onReorderSubItems} style={{ listStyle: 'none', margin: 0, padding: 0 }}>
                {items.map((subItem, index) => (
                  <ItinerarySubItem
                    key={subItem.id}
                    subItem={subItem}
                    index={index}
                    isFirst={index === 0}
                    isLast={index === items.length - 1}
                    getLiveQueue={getLiveQueue}
                    getLiveStatus={getLiveStatus}
                    editing={editing}
                    onEditTime={(time) => onEditSubItemTime(subItem.id, time)}
                    onEditTitle={(title) => onEditSubItemTitle(subItem.id, title)}
                    onEditSubtitle={(subtitle) => onEditSubItemSubtitle(subItem.id, subtitle)}
                    onSelectPlace={() => onSelectSubItemPlace(subItem.id)}
                    onUnlinkPlace={() => onUnlinkSubItemPlace(subItem.id)}
                    onSelectAttraction={() => onSelectSubItemAttraction(subItem.id)}
                    onUnlinkAttraction={() => onUnlinkSubItemAttraction(subItem.id)}
                    onDelete={() => onDeleteSubItem(subItem.id)}
                    onMoveUp={() => onMoveSubItemUp(index)}
                    onMoveDown={() => onMoveSubItemDown(index)}
                  />
                ))}
              </Reorder.Group>
            ) : (
              items.map((subItem, index) => (
                <div key={subItem.id} style={{ borderBottom: index < items.length - 1 ? `1px solid ${color.borderFaint}` : 'none' }}>
                  <ItinerarySubItem
                    subItem={subItem}
                    index={index}
                    isFirst={index === 0}
                    isLast={index === items.length - 1}
                    getLiveQueue={getLiveQueue}
                    getLiveStatus={getLiveStatus}
                    editing={editing}
                  />
                </div>
              ))
            )}
            {editing && (
              <div
                onClick={() => onAddSubItem(items.length)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '10px 0',
                  cursor: 'pointer',
                  color: color.muted,
                  fontSize: 12.5,
                  fontWeight: 700,
                }}
              >
                <div
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 12,
                    border: `1.5px dashed ${color.dashedBorder}`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flex: 'none',
                  }}
                >
                  <AddIcon size={14} color={color.dark} />
                </div>
                Adicionar item ao roteiro
              </div>
            )}
          </div>
        )}

        {!editing && attraction && (
          <button
            type="button"
            onClick={() => navigate('/atracoes', { state: { parkName: attraction.parkName, mapOpen: true } })}
            style={{
              marginTop: 12,
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 6,
              padding: '9px 0',
              borderRadius: radius.button,
              border: `1.5px solid ${color.border}`,
              background: 'none',
              color: color.dark,
              fontSize: 13,
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            <MapIcon size={15} color={color.dark} />
            Ver mapa do parque
          </button>
        )}
      </div>

      {editing && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4, flex: 'none', paddingTop: 2 }}>
          {onDragHandlePointerDown && (
            <button
              type="button"
              onPointerDown={onDragHandlePointerDown}
              style={{ border: 0, background: 'none', padding: 2, cursor: 'grab', touchAction: 'none' }}
            >
              <HamburgerMenuIcon size={16} color={color.dark} />
            </button>
          )}
          {onMoveToDay && (
            <button type="button" onClick={onMoveToDay} style={{ border: 0, background: 'none', padding: 2, cursor: 'pointer' }}>
              <CalendarAddIcon size={16} color={color.dark} />
            </button>
          )}
          <button type="button" onClick={onDelete} style={{ border: 0, background: 'none', padding: 2, cursor: 'pointer' }}>
            <TrashBinTrashIcon size={16} color={color.danger} />
          </button>
        </div>
      )}
    </div>
  );
}
