import { useNavigate, useLocation } from 'react-router-dom';
import { MapIcon } from '@solar-icons/react/bold/map';
import { ShopIcon } from '@solar-icons/react/bold/shop';

const TABS = [
  { key: 'roteiro', label: 'Roteiro', icon: MapIcon, path: '/' },
  { key: 'lugares', label: 'Lugares', icon: ShopIcon, path: '/lugares' },
];

export default function BottomTabBar() {
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <div
      style={{
        position: 'fixed',
        left: '50%',
        transform: 'translateX(-50%)',
        width: 'min(calc(100% - 44px), 436px)',
        bottom: 20,
        display: 'flex',
        alignItems: 'stretch',
        background: 'rgba(255,255,255,0.35)',
        backdropFilter: 'blur(28px) saturate(180%)',
        WebkitBackdropFilter: 'blur(28px) saturate(180%)',
        borderRadius: 34,
        padding: 8,
        zIndex: 3,
        boxShadow: '0 4px 12px rgba(28,26,23,0.18)',
      }}
    >
      {TABS.map((tab) => {
        const isActive =
          tab.path === '/'
            ? location.pathname === '/'
            : location.pathname.startsWith(tab.path);
        const color = isActive ? '#fff' : '#1c1a17';
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
              borderRadius: 26,
              background: isActive ? '#1c1a17' : 'transparent',
              boxShadow: isActive ? '0 3px 8px rgba(28,26,23,0.35)' : 'none',
              cursor: 'pointer',
            }}
          >
            <Icon size={22} color={color} />
            <div style={{ fontSize: 11, fontWeight: 700, color }}>{tab.label}</div>
          </div>
        );
      })}
    </div>
  );
}
