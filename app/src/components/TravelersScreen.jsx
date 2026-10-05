import { useNavigate } from 'react-router-dom';
import { AltArrowLeftIcon } from '@solar-icons/react/linear/alt-arrow-left';
import { useScrollY } from '../hooks/useScrollY.js';
import { useElementHeight } from '../hooks/useElementHeight.js';
import { TRAVELERS } from '../data/travelers.js';
import { FixedHeader, color, spacing } from '../design-system/index.js';

export default function TravelersScreen() {
  const navigate = useNavigate();
  const { scrollY, anchorRef } = useScrollY();
  const { ref: headerRef, height: headerHeight } = useElementHeight();

  return (
    <div ref={anchorRef} style={{ position: 'relative', width: '100%', minHeight: '100dvh', background: color.bg, boxSizing: 'border-box' }}>
      <FixedHeader
        headerRef={headerRef}
        scrollY={scrollY}
        title="Viajantes"
        left={
          <div
            onClick={() => navigate(-1)}
            style={{ width: 38, height: 38, borderRadius: 13, background: color.surfaceMuted, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
          >
            <AltArrowLeftIcon size={19} color={color.dark} />
          </div>
        }
      />

      <div style={{ marginTop: headerHeight + spacing.controlGap, boxSizing: 'border-box', padding: `2px ${spacing.screenGutter}px 40px` }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {TRAVELERS.map((traveler, i) => (
            <div
              key={i}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 14,
                padding: spacing.cardPadding,
                background: color.bg,
                border: `1px solid ${color.border}`,
                borderRadius: 16,
              }}
            >
              <div
                style={{
                  flex: 'none',
                  width: 44,
                  height: 44,
                  borderRadius: 14,
                  background: color.surfaceMuted,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 22,
                }}
              >
                {traveler.emoji}
              </div>
              <div style={{ color: color.dark, fontSize: 15, fontWeight: 700 }}>{traveler.name}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
