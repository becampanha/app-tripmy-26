import { useState } from 'react';
import { motion } from 'motion/react';
import { PhotoCard, Skeleton, color, radius, spacing } from '../design-system/index.js';

// Modo de visualização alternativo da tela de Dicas — carrossel simples: os
// cards ficam lado a lado num track horizontal, arrasta pra navegar, solta e
// o track "gruda" (snap) no card mais próximo. Sem pilha, sem profundidade,
// sem física de swipe — é só um carrossel comum.
const BOTTOM_GAP = 100; // espaço reservado pra tab bar flutuante não cobrir o card

function RecommendationPhotoContent({ rec }) {
  return (
    <>
      {rec.place && (
        <div
          style={{
            display: 'inline-flex',
            alignSelf: 'flex-start',
            alignItems: 'center',
            gap: 4,
            padding: '4px 10px',
            borderRadius: 7,
            background: 'rgba(28,26,23,0.55)',
            marginBottom: 10,
            maxWidth: '100%',
          }}
        >
          <span style={{ color: '#fff', fontSize: 11.5, fontWeight: 700, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {rec.place.name}
          </span>
        </div>
      )}

      {rec.title && (
        <div style={{ color: '#fff', fontSize: 20, fontWeight: 800, lineHeight: 1.25, textShadow: '0 1px 4px rgba(0,0,0,0.35)' }}>
          {rec.title}
        </div>
      )}
      {rec.description && (
        <div style={{ color: 'rgba(255,255,255,0.9)', fontSize: 14, fontWeight: 500, lineHeight: 1.4, marginTop: 6, textShadow: '0 1px 4px rgba(0,0,0,0.35)' }}>
          {rec.description}
        </div>
      )}
      {rec.author && (
        <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: 12.5, fontWeight: 600, marginTop: 10 }}>
          Recomendado por {rec.author}
        </div>
      )}
    </>
  );
}

export default function RecommendationCardStack({ recommendations, headerHeight }) {
  const [index, setIndex] = useState(0);

  const top = headerHeight + spacing.controlGap;
  const cardHeight = `calc(100dvh - ${top}px - ${BOTTOM_GAP}px)`;

  if (!recommendations) {
    return (
      <div style={{ marginTop: top, padding: `0 ${spacing.screenGutter}px` }}>
        <Skeleton height={400} radius={radius.cardPhoto} />
      </div>
    );
  }

  if (recommendations.length === 0) {
    return (
      <div style={{ marginTop: top, padding: '30px 0', textAlign: 'center', color: color.faint, fontSize: 13.5, fontWeight: 600 }}>
        Nenhuma dica publicada ainda.
      </div>
    );
  }

  const total = recommendations.length;
  const clampedIndex = Math.min(index, total - 1);

  // Snap simples: cada slide ocupa 100% da largura do track; dragEnd decide
  // pra qual índice "gruda" com base em quanto o arrasto percorreu, igual
  // qualquer carrossel comum (sem física de swipe, sem threshold especial).
  const handleDragEnd = (_, info) => {
    const draggedRatio = info.offset.x / window.innerWidth;
    if (draggedRatio < -0.2 && clampedIndex < total - 1) {
      setIndex(clampedIndex + 1);
    } else if (draggedRatio > 0.2 && clampedIndex > 0) {
      setIndex(clampedIndex - 1);
    }
  };

  return (
    <div
      style={{
        marginTop: top,
        boxSizing: 'border-box',
        overflow: 'hidden',
      }}
    >
      <motion.div
        drag={total > 1 ? 'x' : false}
        dragConstraints={{ left: 0, right: 0 }}
        dragElastic={0.15}
        onDragEnd={handleDragEnd}
        animate={{ x: `-${clampedIndex * 100}%` }}
        transition={{ type: 'spring', stiffness: 300, damping: 32 }}
        style={{ display: 'flex', cursor: total > 1 ? 'grab' : 'default', touchAction: 'pan-y' }}
        whileDrag={{ cursor: 'grabbing' }}
      >
        {recommendations.map((rec) => (
          <div key={rec.id} style={{ flex: '0 0 100%', boxSizing: 'border-box', padding: `0 ${spacing.screenGutter}px` }}>
            <PhotoCard
              photo={rec.photo}
              height={cardHeight}
              style={{ marginBottom: 0 }}
              contentStyle={{ padding: 18, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}
            >
              <RecommendationPhotoContent rec={rec} />
            </PhotoCard>
          </div>
        ))}
      </motion.div>
    </div>
  );
}
