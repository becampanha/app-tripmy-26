import { RefreshIcon } from '@solar-icons/react/bold/refresh';
import { color, overlay, radius } from './tokens.js';

// Disco flutuante que aparece ao puxar a tela pra baixo além do topo (ver
// hooks/usePullToRefresh.js) — gira proporcional ao progresso do arrasto,
// e continua girando sozinho (animação CSS) enquanto "refreshing" (efeito
// visual só, sem recarregar dado nenhum por enquanto).
export default function PullToRefreshIndicator({ progress, refreshing, visible }) {
  if (!visible) return null;

  const scale = 0.6 + Math.min(1, progress) * 0.4;

  return (
    <div
      style={{
        position: 'absolute',
        top: 14,
        left: '50%',
        transform: `translateX(-50%) scale(${scale})`,
        width: 34,
        height: 34,
        borderRadius: radius.circleButton,
        background: color.bg,
        boxShadow: `0 4px 12px ${overlay.shadowSoft}`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        opacity: Math.min(1, progress * 1.4),
        pointerEvents: 'none',
        zIndex: 6,
        animation: refreshing ? 'ptr-spin 0.7s linear infinite' : 'none',
      }}
    >
      <style>{'@keyframes ptr-spin { to { transform: rotate(360deg); } }'}</style>
      <div style={{ transform: refreshing ? 'none' : `rotate(${progress * 360}deg)` }}>
        <RefreshIcon size={16} color={color.muted} />
      </div>
    </div>
  );
}
