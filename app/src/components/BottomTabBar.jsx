import { useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'motion/react';
import { MapIcon } from '@solar-icons/react/bold/map';
import { HeartIcon } from '@solar-icons/react/bold/heart';
import { ShopIcon } from '@solar-icons/react/bold/shop';
import { FerrisWheelIcon } from '@solar-icons/react/bold/ferris-wheel';
import { CartLargeMinimalisticIcon } from '@solar-icons/react/bold/cart-large-minimalistic';
import { FloatingBar, color, overlay, radius } from '../design-system/index.js';

const TABS = [
  { key: 'roteiro', label: 'Roteiro', icon: MapIcon, path: '/' },
  { key: 'recomendacoes', label: 'Dicas', icon: HeartIcon, path: '/recomendacoes' },
  { key: 'lugares', label: 'Lugares', icon: ShopIcon, path: '/lugares' },
  { key: 'atracoes', label: 'Atrações', icon: FerrisWheelIcon, path: '/atracoes' },
  { key: 'compras', label: 'Compras', icon: CartLargeMinimalisticIcon, path: '/compras' },
];

export default function BottomTabBar() {
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <FloatingBar
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 12 }}
      transition={{ duration: 0.18, ease: [0.32, 0.72, 0, 1] }}
      style={{ alignItems: 'stretch' }}
    >
      {TABS.map((tab) => {
        const isActive =
          tab.path === '/'
            ? location.pathname === '/'
            : location.pathname.startsWith(tab.path);
        const iconColor = isActive ? color.white : color.dark;
        const Icon = tab.icon;
        return (
          <div
            key={tab.key}
            onClick={() => navigate(tab.path)}
            style={{
              position: 'relative',
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 4,
              padding: '6px 0',
              cursor: 'pointer',
            }}
          >
            {/* layoutId compartilhado entre as 5 abas — em vez de cada uma
                aparecer/sumir com fundo preto na hora, o Motion detecta que
                este elemento "é o mesmo" mudando de posição entre renders e
                anima o deslocamento sozinho (mesmo padrão já usado no
                segmented toggle de Dicas, ViewModeSegmentedToggle). */}
            {isActive && (
              <motion.div
                layoutId="bottom-tab-bar-pill"
                transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                style={{
                  position: 'absolute',
                  inset: 0,
                  borderRadius: radius.pillBarButton,
                  background: color.dark,
                  boxShadow: `0 3px 8px ${overlay.shadowStrong}`,
                }}
              />
            )}
            <Icon size={22} color={iconColor} style={{ position: 'relative' }} />
            <div style={{ position: 'relative', fontSize: 11, fontWeight: 700, color: iconColor }}>{tab.label}</div>
          </div>
        );
      })}
    </FloatingBar>
  );
}
