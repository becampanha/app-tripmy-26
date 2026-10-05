import { motion } from 'motion/react';
import { RefreshIcon } from '@solar-icons/react/bold/refresh';
import { useSwUpdate } from '../hooks/useSwUpdate.js';
import { color, radius, shellMaxWidth } from '../design-system/index.js';

// Card flutuante avisando que já tem uma versão nova baixada e pronta — fica
// logo acima da BottomTabBar (mesmo escopo: só em telas raiz, ver App.jsx),
// nunca recarrega sozinho. Clicar em "Atualizar" ativa o service worker
// novo e recarrega a página (ver applyUpdate / updateSW em main.jsx).
export default function UpdateBanner() {
  const { needRefresh, applyUpdate } = useSwUpdate();

  if (!needRefresh) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 12 }}
      transition={{ duration: 0.18, ease: [0.32, 0.72, 0, 1] }}
      style={{
        position: 'fixed',
        left: '50%',
        x: '-50%',
        width: `min(calc(100% - 44px), ${shellMaxWidth - 44}px)`,
        bottom: 92,
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        background: color.dark,
        borderRadius: radius.card,
        padding: '14px 14px 14px 18px',
        zIndex: 19,
        boxShadow: '0 8px 20px rgba(0,0,0,0.28)',
        boxSizing: 'border-box',
      }}
    >
      <div style={{ flex: 1, color: '#fff', fontSize: 13, fontWeight: 700, lineHeight: 1.3 }}>
        Nova atualização disponível
      </div>
      <div
        onClick={applyUpdate}
        style={{
          flex: 'none',
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          padding: '9px 14px',
          borderRadius: radius.button,
          background: 'rgba(255,255,255,0.14)',
          color: '#fff',
          fontSize: 12.5,
          fontWeight: 700,
          cursor: 'pointer',
        }}
      >
        <RefreshIcon size={14} color="#fff" />
        Atualizar
      </div>
    </motion.div>
  );
}
