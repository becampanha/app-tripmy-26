import { SledgehammerIcon } from '@solar-icons/react/bold/sledgehammer';
import { useScrollY } from '../hooks/useScrollY.js';
import { useElementHeight } from '../hooks/useElementHeight.js';
import { HamburgerMenuButton } from './HamburgerMenuButton.jsx';
import { FixedHeader, color, spacing, type } from '../design-system/index.js';

// Placeholder — tela ainda sem funcionalidade própria, só reserva o lugar
// na tab bar (ver BottomTabBar.jsx) enquanto o que ela vai fazer é definido.
export default function ShoppingScreen() {
  const { scrollY, anchorRef } = useScrollY();
  const { ref: headerRef, height: headerHeight } = useElementHeight();

  return (
    <div ref={anchorRef} style={{ position: 'relative', width: '100%', minHeight: '100dvh', background: color.bg, boxSizing: 'border-box' }}>
      <FixedHeader headerRef={headerRef} scrollY={scrollY} title="Compras" left={<HamburgerMenuButton />} />

      <div
        style={{
          marginTop: headerHeight,
          minHeight: `calc(100dvh - ${headerHeight}px)`,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: spacing.gapMd,
          padding: spacing.screenGutter,
          textAlign: 'center',
          boxSizing: 'border-box',
        }}
      >
        <div
          style={{
            width: 56,
            height: 56,
            borderRadius: 18,
            background: color.surfaceMuted,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <SledgehammerIcon size={26} color={color.dark} />
        </div>
        <div style={{ ...type.sectionTitle, color: color.dark }}>Em construção</div>
        <div style={{ ...type.paragraph, color: color.muted, maxWidth: 260 }}>
          Essa tela ainda está sendo desenhada — em breve dá pra organizar as compras da viagem por aqui.
        </div>
      </div>
    </div>
  );
}
