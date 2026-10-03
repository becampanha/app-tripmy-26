import { useEffect, useRef, useState } from 'react';
import { motion, useMotionValue, animate } from 'motion/react';
import { PhotoCard, Skeleton, color, radius, spacing } from '../design-system/index.js';

// Modo de visualização alternativo da tela de Dicas — carrossel simples: os
// cards ficam lado a lado num track horizontal, arrasta pra navegar, solta e
// o track "gruda" (snap) no card mais próximo.
//
// Padrão seguido (motion.dev/docs/react-drag + motion.dev/examples/react-drag):
// - x é um useMotionValue (não um valor derivado só do `index` via
//   `animate={{x:...}}` declarativo) — o track é movido imperativamente via
//   `animate(x, alvo, {...})`, tanto no snap quanto na troca de slide. Isso
//   evita recriar a interpolação a cada render e permite ler x.get() durante
//   o próprio gesto sem precisar de re-render.
// - dragConstraints é calculado a partir da largura REAL do track medida em
//   runtime (containerWidth * (total - 1)), não um valor fixo em {0,0} — um
//   valor fixo trava o elemento sempre voltando pro mesmo ponto de origem,
//   que foi o "problema de scroll" relatado: o carrossel parecia preso /
//   arrastava errado a partir do 2º card em diante.
// - onDragEnd decide o snap usando DOIS sinais (distância percorrida E
//   velocidade do gesto) — um arrasto curto mas rápido também deve virar
//   página, não só um arrasto longo.
const BOTTOM_GAP = 100; // espaço reservado pra tab bar flutuante não cobrir o card
const DRAG_DISTANCE_THRESHOLD = 50; // px
const DRAG_VELOCITY_THRESHOLD = 500; // px/s

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
  const containerRef = useRef(null);
  const [containerWidth, setContainerWidth] = useState(0);
  const [index, setIndex] = useState(0);
  const x = useMotionValue(0);
  // Começa num slide aleatório a cada vez que entra na tela — a ORDEM da
  // lista continua a mesma (não embaralha o array), só o ponto de partida
  // do carrossel muda, pra dar a sensação de "dica nova" sem a
  // imprevisibilidade de uma ordem totalmente aleatória. hasPickedStart
  // garante que isso roda só 1x por montagem (quando os dados chegam),
  // nunca de novo a cada re-render.
  const hasPickedStartRef = useRef(false);

  // Mede a largura real do container (não window.innerWidth) — o carrossel
  // vive dentro de um container com max-width:480px centralizado (ver
  // App.jsx), então em telas largas window.innerWidth estaria errado e os
  // cálculos de constraint/threshold/snap ficariam todos deslocados.
  //
  // IMPORTANTE: o elemento com `ref={containerRef}` só existe depois dos
  // early returns de loading/vazio mais abaixo. Se `recommendations` chega
  // como `null` no primeiro render (estado normal de loading), o container
  // ainda NÃO existe nesse momento — um `useEffect(() => {...}, [])` rodando
  // 1x no mount nunca re-executaria quando os dados chegassem depois e o
  // container finalmente montasse, deixando containerWidth travado em 0 pra
  // sempre (carrossel "quebrado" só quando os dados demoram a carregar).
  // Por isso a dependência inclui `recommendations` — o efeito roda de novo
  // assim que os dados mudam de null pra array, quando o container já existe.
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const update = () => setContainerWidth(el.offsetWidth);
    update();
    const observer = new ResizeObserver(update);
    observer.observe(el);
    return () => observer.disconnect();
  }, [recommendations]);

  const top = headerHeight + spacing.controlGap;
  const cardHeight = `calc(100dvh - ${top}px - ${BOTTOM_GAP}px)`;

  const total = recommendations?.length ?? 0;

  // Sorteia o slide inicial assim que os dados E a largura do container
  // estiverem prontos (precisa de containerWidth pra já posicionar `x` no
  // lugar certo, sem flash do primeiro card antes de pular pro aleatório).
  // Roda só 1x por montagem real da tela — useRef (não state) evita
  // disparar de novo em re-renders normais (ex: ao editar uma dica).
  useEffect(() => {
    if (hasPickedStartRef.current) return;
    if (total === 0 || containerWidth === 0) return;
    hasPickedStartRef.current = true;
    const startIndex = Math.floor(Math.random() * total);
    setIndex(startIndex);
    x.set(-startIndex * containerWidth);
  }, [total, containerWidth, x]);

  // Move o track pro slide `i`, clampado nos limites — chamado tanto pelo
  // snap do drag quanto por qualquer navegação futura (ex: botões).
  const goToIndex = (i) => {
    const clamped = Math.max(0, Math.min(i, total - 1));
    setIndex(clamped);
    animate(x, -clamped * containerWidth, { type: 'spring', stiffness: 300, damping: 32 });
  };

  const handleDragEnd = (_, info) => {
    const passedDistance = Math.abs(info.offset.x) > DRAG_DISTANCE_THRESHOLD;
    const passedVelocity = Math.abs(info.velocity.x) > DRAG_VELOCITY_THRESHOLD;
    if (!passedDistance && !passedVelocity) {
      goToIndex(index); // snap-back pro slide atual
      return;
    }
    const wentLeft = info.offset.x < 0 || info.velocity.x < 0;
    goToIndex(wentLeft ? index + 1 : index - 1);
  };

  if (!recommendations) {
    return (
      <div
        style={{
          position: 'fixed',
          top,
          left: '50%',
          transform: 'translateX(-50%)',
          width: '100%',
          maxWidth: 480,
          padding: `0 ${spacing.screenGutter}px`,
          boxSizing: 'border-box',
        }}
      >
        <Skeleton height={400} radius={radius.cardPhoto} />
      </div>
    );
  }

  if (total === 0) {
    return (
      <div
        style={{
          position: 'fixed',
          top,
          left: '50%',
          transform: 'translateX(-50%)',
          width: '100%',
          maxWidth: 480,
          padding: '30px 0',
          textAlign: 'center',
          color: color.faint,
          fontSize: 13.5,
          fontWeight: 600,
        }}
      >
        Nenhuma dica publicada ainda.
      </div>
    );
  }

  // dragConstraints calculado a partir da largura REAL medida — nunca um
  // valor fixo {0,0}. O limite direito é 0 (não deixa arrastar além do
  // primeiro slide pra direita); o esquerdo é -(largura total do track menos
  // um container), ou seja, o ponto onde o ÚLTIMO slide alinha à esquerda.
  const trackWidth = containerWidth * total;
  const maxDragLeft = -(trackWidth - containerWidth);

  return (
    <div
      ref={containerRef}
      style={{
        position: 'fixed',
        top,
        left: '50%',
        transform: 'translateX(-50%)',
        width: '100%',
        maxWidth: 480,
        boxSizing: 'border-box',
        overflow: 'hidden',
      }}
    >
      <motion.div
        drag={total > 1 && containerWidth > 0 ? 'x' : false}
        dragConstraints={{ left: maxDragLeft, right: 0 }}
        dragElastic={0.1}
        dragMomentum={false}
        onDragEnd={handleDragEnd}
        style={{ x, display: 'flex', width: trackWidth, cursor: total > 1 ? 'grab' : 'default', touchAction: 'pan-y' }}
        whileDrag={{ cursor: 'grabbing' }}
      >
        {recommendations.map((rec) => (
          <div
            key={rec.id}
            style={{ flex: `0 0 ${containerWidth}px`, width: containerWidth, boxSizing: 'border-box', padding: `0 ${spacing.screenGutter}px` }}
          >
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
