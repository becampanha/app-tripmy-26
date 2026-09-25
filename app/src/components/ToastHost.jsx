import { AnimatePresence, motion } from 'motion/react';
import { CheckCircleIcon } from '@solar-icons/react/bold/check-circle';
import { CloseCircleIcon } from '@solar-icons/react/bold/close-circle';
import { useToasts, dismissToast } from '../hooks/useToast.js';

const COLORS = {
  success: { background: '#1c1a17', icon: '#4d8a5c' },
  error: { background: '#1c1a17', icon: '#e0736a' },
};

// Fica montado uma única vez em App.jsx, fora do fluxo de rotas — assim um
// toast disparado de qualquer tela sobrevive a navegações/desmontagens.
export default function ToastHost() {
  const toasts = useToasts();

  return (
    <div
      style={{
        position: 'fixed',
        top: 'calc(14px + env(safe-area-inset-top))',
        left: '50%',
        transform: 'translateX(-50%)',
        width: 'calc(100% - 28px)',
        maxWidth: 452,
        zIndex: 60,
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
        pointerEvents: 'none',
      }}
    >
      <AnimatePresence>
        {toasts.map((toast) => {
          const { background, icon } = COLORS[toast.type] || COLORS.success;
          const Icon = toast.type === 'error' ? CloseCircleIcon : CheckCircleIcon;
          return (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, y: -16, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.96 }}
              transition={{ type: 'spring', stiffness: 400, damping: 32 }}
              onClick={() => dismissToast(toast.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                padding: '13px 16px',
                borderRadius: 16,
                background,
                boxShadow: '0 8px 24px rgba(28,26,23,0.28)',
                pointerEvents: 'auto',
                cursor: 'pointer',
              }}
            >
              <Icon size={18} color={icon} style={{ flex: 'none' }} />
              <span style={{ color: '#fff', fontSize: 13.5, fontWeight: 700, lineHeight: 1.3 }}>
                {toast.message}
              </span>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
