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
        background: '#ffffff',
        border: '1px solid #ececec',
        borderRadius: 22,
        padding: 8,
        zIndex: 3,
      }}
    >
      {TABS.map((tab) => {
        const isActive =
          tab.path === '/'
            ? location.pathname === '/'
            : location.pathname.startsWith(tab.path);
        const color = isActive ? '#1c1a17' : '#c9c2b6';
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
              borderRadius: 14,
              background: isActive ? '#f9f7f2' : 'transparent',
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
