const TABS = [
  { key: 'roteiro', label: 'Roteiro', icon: 'map' },
  { key: 'lugares', label: 'Lugares', icon: 'store' },
];

function MapIcon({ color }) {
  return (
    <svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14.106 5.553a2 2 0 0 0 1.788 0l3.659-1.83A1 1 0 0 1 21 4.619v12.764a1 1 0 0 1-.553.894l-4.553 2.277a2 2 0 0 1-1.788 0l-4.212-2.106a2 2 0 0 0-1.788 0l-3.659 1.83A1 1 0 0 1 3 19.381V6.618a1 1 0 0 1 .553-.894l4.553-2.277a2 2 0 0 1 1.788 0z" />
      <path d="M15 5.764v15" />
      <path d="M9 3.236v15" />
    </svg>
  );
}

function StoreIcon({ color }) {
  return (
    <svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m2 7 4.41-4.41A2 2 0 0 1 7.83 2h8.34a2 2 0 0 1 1.42.59L22 7" />
      <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
      <path d="M15 22v-4a2 2 0 0 0-2-2h-2a2 2 0 0 0-2 2v4" />
      <path d="M2 7h20" />
      <path d="M22 7v3a2 2 0 0 1-2 2 2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 16 12a2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 12 12a2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 8 12a2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 4 12a2 2 0 0 1-2-2V7" />
    </svg>
  );
}

export default function BottomTabBar({ active, onSelect }) {
  return (
    <div
      style={{
        position: 'absolute',
        left: 22,
        right: 22,
        bottom: 20,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-around',
        background: '#ffffff',
        borderRadius: 22,
        padding: '12px 8px',
        boxShadow: '0 10px 26px rgba(28,26,23,0.14)',
        zIndex: 3,
      }}
    >
      {TABS.map((tab, i) => {
        const isActive = i === active;
        const color = isActive ? '#1c1a17' : '#c9c2b6';
        return (
          <div
            key={tab.key}
            onClick={() => onSelect(i)}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 4,
              padding: '6px 22px',
              borderRadius: 14,
              cursor: 'pointer',
            }}
          >
            {tab.icon === 'map' ? <MapIcon color={color} /> : <StoreIcon color={color} />}
            <div style={{ fontSize: 11, fontWeight: 700, color }}>{tab.label}</div>
          </div>
        );
      })}
    </div>
  );
}
