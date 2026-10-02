import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'motion/react';
import { AltArrowLeftIcon } from '@solar-icons/react/linear/alt-arrow-left';
import { PenIcon } from '@solar-icons/react/linear/pen';
import { CheckIcon } from '@solar-icons/react/bold/check';
import { useItinerary } from '../hooks/useItinerary.js';
import { useDayWeather } from '../hooks/useDayWeather.js';
import { useScrollY } from '../hooks/useScrollY.js';
import { useElementHeight } from '../hooks/useElementHeight.js';
import { setGlobalEditing } from '../hooks/useEditingState.js';
import { showToast, showErrorToast } from '../hooks/useToast.js';
import { swapDays } from '../api/itineraryApi.js';
import { weatherEmoji } from '../data/weatherCodes.js';
import { FloatingBar, FixedHeader, Skeleton, color, radius, space, type } from '../design-system/index.js';

function DayRowSkeleton() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: 14, marginBottom: 10, background: color.bg, border: `1px solid ${color.border}`, borderRadius: radius.card }}>
      <Skeleton width={44} height={44} radius={12} />
      <div style={{ flex: 1 }}>
        <Skeleton width="55%" height={15} />
        <Skeleton width="35%" height={12} style={{ marginTop: 6 }} />
      </div>
    </div>
  );
}

// Lista compacta de todos os dias do roteiro — atalho pra navegar direto pra
// um dia específico sem precisar arrastar pelas abas horizontais do
// ScheduleScreen, que pode ter bastante dia. Cada linha mostra a mesma
// informação já disponível (data/dia da semana/tema), mais um resumo
// opcional de quantidade de atividades e a temperatura do dia, quando
// esses dados já estiverem carregados — não é fixo, só aparece quando
// existe.
export default function AllDaysScreen() {
  const navigate = useNavigate();
  const { days, reload } = useItinerary();
  const weatherByDay = useDayWeather(days);
  const { scrollY, anchorRef } = useScrollY();
  const { ref: headerRef, height: headerHeight } = useElementHeight();

  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  // Dois toques selecionam os dias a trocar — a troca em si só acontece ao
  // confirmar na barra que aparece embaixo (nunca ao segundo toque direto),
  // pra dar chance de desistir antes de mexer em dado de verdade. Troca o
  // CONTEÚDO (tema + atividades) dos dois dias, não a ordem/posição deles —
  // date/weekday continuam fixos em cada linha da lista.
  const [pickedIds, setPickedIds] = useState([]);

  useEffect(() => {
    setGlobalEditing(editing);
    return () => setGlobalEditing(false);
  }, [editing]);

  const stopEditing = () => {
    setEditing(false);
    setPickedIds([]);
  };

  const togglePick = (id) => {
    setPickedIds((current) => {
      if (current.includes(id)) return current.filter((x) => x !== id);
      if (current.length === 2) return [current[1], id]; // troca o mais antigo pelo novo
      return [...current, id];
    });
  };

  const handleSwap = async () => {
    const [idA, idB] = pickedIds;
    setSaving(true);
    try {
      await swapDays(idA, idB);
      await reload(true);
      showToast('Dias trocados com sucesso');
      setPickedIds([]);
    } catch (err) {
      showErrorToast(err, 'Não foi possível trocar os dias.');
    } finally {
      setSaving(false);
    }
  };

  const pickedDays = pickedIds.map((id) => days?.find((d) => d.id === id)).filter(Boolean);

  return (
    <div ref={anchorRef} style={{ position: 'relative', width: '100%', minHeight: '100dvh', background: color.bg, boxSizing: 'border-box' }}>
      <FixedHeader
        headerRef={headerRef}
        scrollY={scrollY}
        title="Resumo do Roteiro"
        titleSize="compact"
        left={
          <div
            onClick={() => (editing ? stopEditing() : navigate(-1))}
            style={{
              width: 38,
              height: 38,
              borderRadius: 13,
              background: color.surfaceMuted,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
            }}
          >
            <AltArrowLeftIcon size={19} color={color.dark} />
          </div>
        }
        right={
          !editing && (
            <div
              onClick={() => setEditing(true)}
              style={{
                width: 38,
                height: 38,
                borderRadius: 13,
                background: color.surfaceMuted,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
              }}
            >
              <PenIcon size={17} color={color.dark} />
            </div>
          )
        }
      />

      <div style={{ marginTop: headerHeight + 18, boxSizing: 'border-box', padding: `0 ${space.screenGutter}px ${editing ? 100 : 40}px` }}>
        {!days && Array.from({ length: 6 }).map((_, i) => <DayRowSkeleton key={i} />)}

        {days && days.map((day, i) => {
          const weather = weatherByDay[day.id];
          const activityCount = day.activities.length;
          const pickedIndex = pickedIds.indexOf(day.id);
          const isPicked = pickedIndex !== -1;
          return (
            <div
              key={day.id}
              onClick={editing ? () => togglePick(day.id) : () => navigate('/', { state: { selectedDay: i } })}
              style={{
                position: 'relative',
                display: 'flex',
                alignItems: 'center',
                gap: 14,
                padding: 14,
                marginBottom: 10,
                background: isPicked ? color.dark : color.bg,
                border: `1px solid ${isPicked ? color.dark : color.border}`,
                borderRadius: radius.card,
                cursor: 'pointer',
              }}
            >
              {isPicked && (
                <div
                  style={{
                    position: 'absolute',
                    top: -8,
                    left: -8,
                    width: 24,
                    height: 24,
                    borderRadius: 12,
                    background: color.success,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 2px 6px rgba(28,26,23,0.3)',
                  }}
                >
                  <CheckIcon size={13} color="#fff" />
                </div>
              )}

              <div
                style={{
                  flex: 'none',
                  width: 48,
                  height: 48,
                  borderRadius: 14,
                  background: isPicked ? 'rgba(255,255,255,0.12)' : color.surfaceMuted,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 1,
                }}
              >
                <div style={{ fontSize: 9.5, fontWeight: 700, letterSpacing: 0.3, textTransform: 'uppercase', color: isPicked ? 'rgba(255,255,255,0.7)' : color.muted }}>
                  {day.weekday}
                </div>
                <div style={{ fontSize: 17, fontWeight: 800, color: isPicked ? '#fff' : color.dark }}>{day.date.split('/')[0]}</div>
              </div>

              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ ...type.itemTitle, color: isPicked ? '#fff' : color.dark, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {day.theme}
                </div>
                {activityCount > 0 && (
                  <div style={{ color: isPicked ? 'rgba(255,255,255,0.7)' : color.muted, fontSize: 12.5, fontWeight: 600, marginTop: 2 }}>
                    {activityCount} {activityCount === 1 ? 'atividade' : 'atividades'}
                  </div>
                )}
              </div>

              {!editing && weather && (
                <div style={{ flex: 'none', display: 'flex', alignItems: 'center', gap: 4 }}>
                  <span style={{ fontSize: 15 }}>{weatherEmoji(weather.code)}</span>
                  <span style={{ color: color.muted, fontSize: 12.5, fontWeight: 600 }}>
                    {Math.round(weather.min)}°–{Math.round(weather.max)}°
                  </span>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <AnimatePresence>
        {editing && (() => {
          const ready = pickedDays.length === 2;
          return (
            <FloatingBar
              key="swap-confirm-bar"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 12 }}
              transition={{ duration: 0.18, ease: [0.32, 0.72, 0, 1] }}
              style={{ justifyContent: 'center' }}
            >
              <motion.div
                onClick={() => {
                  if (ready && !saving) handleSwap();
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                  width: '100%',
                  height: 46,
                  borderRadius: radius.pillBarButton,
                  background: ready ? color.success : color.surfaceMuted,
                  boxShadow: ready ? '0 3px 8px rgba(63,163,90,0.35)' : 'none',
                  cursor: ready && !saving ? 'pointer' : 'default',
                  opacity: saving ? 0.7 : 1,
                }}
              >
                <span style={{ color: ready ? '#fff' : color.muted, fontSize: 14, fontWeight: 700 }}>
                  {saving
                    ? 'Trocando...'
                    : ready
                    ? `Trocar Dia ${pickedDays[0].date.split('/')[0]} ↔ Dia ${pickedDays[1].date.split('/')[0]}`
                    : pickedDays.length === 1
                    ? `Toque em mais um dia para trocar com o Dia ${pickedDays[0].date.split('/')[0]}`
                    : 'Toque em dois dias para trocar'}
                </span>
              </motion.div>
            </FloatingBar>
          );
        })()}
      </AnimatePresence>
    </div>
  );
}
