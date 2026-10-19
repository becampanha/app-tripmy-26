import { useNavigate } from 'react-router-dom';
import { ArrowLeftIcon } from '@solar-icons/react/linear/arrow-left';
import { AltArrowRightIcon } from '@solar-icons/react/linear/alt-arrow-right';
import { MapPointIcon } from '@solar-icons/react/bold/map-point';
import { useScrollY } from '../hooks/useScrollY.js';
import { useElementHeight } from '../hooks/useElementHeight.js';
import { FixedHeader, color, spacing } from '../design-system/index.js';
import { useTapHandler } from '../hooks/useTapHandler.js';

// Lista de ajustes do sistema — cresce com o tempo, um item por configuração
// (mesmo padrão visual de linha de MoreScreen.jsx). Hoje só "Áreas de
// lugares"; o próximo ajuste nasce aqui como mais um bloco igual.
const ITEMS = [
  {
    key: 'areas',
    icon: MapPointIcon,
    title: 'Áreas de lugares',
    subtitle: 'Editar as áreas de cada categoria em Lugares',
    to: '/configuracoes/areas',
  },
];

function ConfigItemRow({ item, onClick }) {
  const tapHandlers = useTapHandler(onClick);
  return (
    <div
      {...tapHandlers}
      role="button"
      tabIndex={0}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        padding: spacing.cardPadding,
        background: color.bg,
        border: `1px solid ${color.border}`,
        borderRadius: 18,
        cursor: 'pointer',
      }}
    >
      <div
        style={{
          flex: 'none',
          width: 32,
          height: 32,
          borderRadius: 10,
          background: color.surfaceMuted,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <item.icon size={16} color={color.dark} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ color: color.dark, fontSize: 14.5, fontWeight: 700 }}>{item.title}</div>
        <div style={{ color: color.muted, fontSize: 12, fontWeight: 600, marginTop: 1 }}>{item.subtitle}</div>
      </div>
      <AltArrowRightIcon size={16} color={color.muted} />
    </div>
  );
}

function BackButton({ onClick }) {
  const tapHandlers = useTapHandler(onClick);
  return (
    <div
      {...tapHandlers}
      role="button"
      tabIndex={0}
      style={{ width: 38, height: 38, borderRadius: 13, background: color.surfaceMuted, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
    >
      <ArrowLeftIcon size={19} color={color.dark} />
    </div>
  );
}

export default function ConfigScreen() {
  const navigate = useNavigate();
  const { scrollY, anchorRef } = useScrollY();
  const { ref: headerRef, height: headerHeight } = useElementHeight();

  return (
    <div ref={anchorRef} style={{ position: 'relative', width: '100%', minHeight: '100dvh', background: color.bg, boxSizing: 'border-box' }}>
      <FixedHeader
        headerRef={headerRef}
        scrollY={scrollY}
        title="Configurações"
        left={<BackButton onClick={() => navigate(-1)} />}
      />

      <div style={{ marginTop: headerHeight + spacing.controlGap, boxSizing: 'border-box', padding: `2px ${spacing.screenGutter}px 120px` }}>
        {ITEMS.map((item) => (
          <ConfigItemRow key={item.key} item={item} onClick={() => navigate(item.to)} />
        ))}
      </div>
    </div>
  );
}
