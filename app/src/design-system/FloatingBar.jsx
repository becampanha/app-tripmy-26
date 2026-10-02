import { motion } from 'motion/react';
import { overlay, radius, shellMaxWidth } from './tokens.js';

// Casca compartilhada da barra flutuante inferior: mesma posição/tamanho/glass
// tanto para a BottomTabBar (navegação) quanto para a EditActionBar (Cancelar/Salvar).
// É o próprio motion.div (não um <div> envolvido por um motion.div externo):
// um motion.div pai com transform (Framer Motion aplica transform sempre que
// anima x/y) quebra o containing block do position:fixed do filho, fazendo a
// barra fixed se posicionar relativa a esse pai (que colapsa pro tamanho do
// próprio conteúdo) em vez de relativa à viewport — cortava visualmente os
// ícones pela metade. motionProps (initial/animate/exit/transition) entra
// direto aqui, sem wrapper intermediário.
export default function FloatingBar({ children, padding = 8, style, ...motionProps }) {
  return (
    <motion.div
      {...motionProps}
      style={{
        position: 'fixed',
        left: '50%',
        x: '-50%',
        width: `min(calc(100% - 44px), ${shellMaxWidth - 44}px)`,
        bottom: 20,
        display: 'flex',
        alignItems: 'center',
        background: overlay.glassBg,
        backdropFilter: 'blur(28px) saturate(180%)',
        WebkitBackdropFilter: 'blur(28px) saturate(180%)',
        borderRadius: radius.pillBar,
        padding,
        zIndex: 20,
        boxShadow: `0 4px 12px ${overlay.shadowSoft}`,
        ...style,
      }}
    >
      {children}
    </motion.div>
  );
}
