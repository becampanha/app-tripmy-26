import { overlay, radius, shellMaxWidth } from './tokens.js';

// Casca compartilhada da barra flutuante inferior: mesma posição/tamanho/glass
// tanto para a BottomTabBar (navegação) quanto para a EditActionBar (Cancelar/Salvar).
export default function FloatingBar({ children, padding = 8, style }) {
  return (
    <div
      style={{
        position: 'fixed',
        left: '50%',
        transform: 'translateX(-50%)',
        width: `min(calc(100% - 44px), ${shellMaxWidth - 44}px)`,
        bottom: 20,
        display: 'flex',
        alignItems: 'center',
        background: overlay.glassBg,
        backdropFilter: 'blur(28px) saturate(180%)',
        WebkitBackdropFilter: 'blur(28px) saturate(180%)',
        borderRadius: radius.pillBar,
        padding,
        zIndex: 3,
        boxShadow: `0 4px 12px ${overlay.shadowSoft}`,
        ...style,
      }}
    >
      {children}
    </div>
  );
}
