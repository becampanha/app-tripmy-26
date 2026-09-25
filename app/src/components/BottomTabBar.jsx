import { useNavigate, useLocation } from 'react-router-dom';
import { MapIcon } from '@solar-icons/react/bold/map';
import { HeartIcon } from '@solar-icons/react/bold/heart';
import { ShopIcon } from '@solar-icons/react/bold/shop';
import { FerrisWheelIcon } from '@solar-icons/react/bold/ferris-wheel';
import { FloatingBar, color, overlay, radius } from '../design-system/index.js';

const TABS = [
  { key: 'roteiro', label: 'Roteiro', icon: MapIcon, path: '/' },
  { key: 'recomendacoes', label: 'Recomendações', icon: HeartIcon, path: '/recomendacoes' },
  { key: 'lugares', label: 'Lugares', icon: ShopIcon, path: '/lugares' },
  { key: 'atracoes', label: 'Atrações', icon: FerrisWheelIcon, path: '/atracoes' },
];

export default function BottomTabBar() {
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <FloatingBar style={{ alignItems: 'stretch' }}>
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
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 4,
              padding: '6px 0',
              borderRadius: radius.pillBarButton,
              background: isActive ? color.dark : 'transparent',
              boxShadow: isActive ? `0 3px 8px ${overlay.shadowStrong}` : 'none',
              cursor: 'pointer',
            }}
          >
            <Icon size={22} color={iconColor} />
            <div style={{ fontSize: 11, fontWeight: 700, color: iconColor }}>{tab.label}</div>
          </div>
        );
      })}
    </FloatingBar>
  );
}
