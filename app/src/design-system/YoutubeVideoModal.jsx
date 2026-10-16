import { motion } from 'motion/react';
import { CloseIcon } from '@solar-icons/react/linear/close';
import { shellMaxWidth } from './tokens.js';
import { useHidesTabBar } from '../hooks/useEditingState.js';

// Vídeo em tela cheia, aberto a partir de um botão de play (ver
// YoutubePlayButton) — mostra direto o iframe com autoplay=1, então a capa
// nativa do YouTube (título/canal/"Watch on YouTube"/compartilhar) nunca
// chega a aparecer, já que ela só existe no estado parado do player. Mesmo
// componente usado em Atrações e Dicas.
export default function YoutubeVideoModal({ videoId, title = 'Vídeo', onClose }) {
  // Sem isso a tab bar ficava montada (e clicável) por baixo do vídeo, apesar
  // do zIndex menor — mesmo motivo documentado em useEditingState.js.
  useHidesTabBar(true);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.18 }}
      style={{
        position: 'fixed',
        top: 0,
        bottom: 0,
        left: '50%',
        transform: 'translateX(-50%)',
        width: '100%',
        maxWidth: shellMaxWidth,
        zIndex: 50,
        background: '#000',
        display: 'flex',
        alignItems: 'center',
      }}
    >
      <div style={{ position: 'relative', width: '100%', paddingTop: '56.25%' }}>
        <iframe
          src={`https://www.youtube.com/embed/${videoId}?modestbranding=1&rel=0&iv_load_policy=3&autoplay=1`}
          title={title}
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', border: 0 }}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
      </div>

      <div
        onClick={onClose}
        style={{
          position: 'absolute',
          top: 18,
          right: 18,
          width: 38,
          height: 38,
          borderRadius: 19,
          background: 'rgba(255,255,255,0.22)',
          backdropFilter: 'blur(10px)',
          WebkitBackdropFilter: 'blur(10px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
        }}
      >
        <CloseIcon size={18} color="#fff" />
      </div>
    </motion.div>
  );
}
