import { useNavigate } from 'react-router-dom';
import { AltArrowLeftIcon } from '@solar-icons/react/linear/alt-arrow-left';
import { useItinerary } from '../hooks/useItinerary.js';
import { useDayWeather } from '../hooks/useDayWeather.js';
import { useScrollY } from '../hooks/useScrollY.js';
import { weatherEmoji } from '../data/weatherCodes.js';
import { FixedHeader, Skeleton, color, radius, space, spacing, type } from '../design-system/index.js';

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
  const { days } = useItinerary();
  const weatherByDay = useDayWeather(days);
  const { scrollY, anchorRef } = useScrollY();

  return (
    <div ref={anchorRef} style={{ position: 'relative', width: '100%', minHeight: '100dvh', background: color.bg, boxSizing: 'border-box' }}>
      <FixedHeader
        scrollY={scrollY}
        title="Resumo do Roteiro"
        left={
          <div
            onClick={() => navigate(-1)}
            style={{
              width: 32,
              height: 32,
              borderRadius: 11,
              background: color.surfaceMuted,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
            }}
          >
            <AltArrowLeftIcon size={17} color={color.dark} />
          </div>
        }
      />
      <div style={{ padding: `${space.screenGutter}px ${space.screenGutter}px 0`, display: 'flex', alignItems: 'center', gap: spacing.gapMd }}>
        <div
          onClick={() => navigate(-1)}
          style={{
            flex: 'none',
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
        <div style={{ ...type.mainTitle, color: color.dark }}>Resumo do Roteiro</div>
      </div>

      <div style={{ marginTop: 18, boxSizing: 'border-box', padding: `0 ${space.screenGutter}px 40px` }}>
        {!days && Array.from({ length: 6 }).map((_, i) => <DayRowSkeleton key={i} />)}

        {days && days.map((day, i) => {
          const weather = weatherByDay[day.id];
          const activityCount = day.activities.length;
          return (
            <div
              key={day.id}
              onClick={() => navigate('/', { state: { selectedDay: i } })}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 14,
                padding: 14,
                marginBottom: 10,
                background: color.bg,
                border: `1px solid ${color.border}`,
                borderRadius: radius.card,
                cursor: 'pointer',
              }}
            >
              <div
                style={{
                  flex: 'none',
                  width: 48,
                  height: 48,
                  borderRadius: 14,
                  background: color.surfaceMuted,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 1,
                }}
              >
                <div style={{ fontSize: 9.5, fontWeight: 700, letterSpacing: 0.3, textTransform: 'uppercase', color: color.muted }}>
                  {day.weekday}
                </div>
                <div style={{ fontSize: 17, fontWeight: 800, color: color.dark }}>{day.date.split('/')[0]}</div>
              </div>

              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ ...type.itemTitle, color: color.dark, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {day.theme}
                </div>
                {activityCount > 0 && (
                  <div style={{ color: color.muted, fontSize: 12.5, fontWeight: 600, marginTop: 2 }}>
                    {activityCount} {activityCount === 1 ? 'atividade' : 'atividades'}
                  </div>
                )}
              </div>

              {weather && (
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
    </div>
  );
}
