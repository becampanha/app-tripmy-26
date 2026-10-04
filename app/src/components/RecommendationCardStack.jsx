import { useEffect, useRef, useState } from 'react';
import { motion, useMotionValue, animate } from 'motion/react';
import { PhotoCard, Skeleton, color, radius, spacing } from '../design-system/index.js';

// Modo de visualização alternativo da tela de Dicas — carrossel em loop: os
// cards ficam lado a lado num track horizontal, arrasta pra navegar, solta e
// o track "gruda" (snap) no card mais próximo; do último card dá pra
// continuar arrastando e volta pro primeiro (e vice-versa), sem travar.
//
// Padrão seguido (motion.dev/docs/react-drag + motion.dev/examples/react-drag):
// - x é um useMotionValue (não um valor derivado só do `index` via
//   `animate={{x:...}}` declarativo) — o track é movido imperativamente via
//   `animate(x, alvo, {...})`, tanto no snap quanto na troca de slide. Isso
//   evita recriar a interpolação a cada render e permite ler x.get() durante
//   o próprio gesto sem precisar de re-render.
// - dragConstraints é calculado a partir da largura REAL do track medida em
//   runtime, não um valor fixo em {0,0} — um valor fixo trava o elemento
//   sempre voltando pro mesmo ponto de origem.
// - onDragEnd decide o snap usando DOIS sinais (distância percorrida E
//   velocidade do gesto) — um arrasto curto mas rápido também deve virar
//   página, não só um arrasto longo.
// - Loop infinito via clone nas pontas (abordagem padrão de carrosséis tipo
//   Embla/Swiper): o track real inclui um clone do último card antes do
//   primeiro e um clone do primeiro depois do último; ao assentar num desses
//   clones, `goToIndex` teleporta `x` pro item real equivalente SEM animação
//   (mesma posição visual, card idêntico) — o usuário nunca percebe o salto.
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
  // `index` aqui é a posição no TRACK (não no array de recommendations) —
  // o track tem um clone do último card na posição 0 e um clone do primeiro
  // na última posição, então o índice "real" de recommendations é index - 1.
  // Isso é o que permite o loop: ao assentar num desses clones, dá pra
  // teleportar instantaneamente pro item real equivalente (ver goToIndex),
  // criando a ilusão de um carrossel infinito.
  const [index, setIndex] = useState(1);
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

  // Com 2+ dicas o track ganha um clone em cada ponta (ver trackItems mais
  // abaixo), o que desloca todo índice "real" em +1 dentro do track. Com 0
  // ou 1 dica não há clones nem loop — o índice do track é o próprio índice
  // real, sem deslocamento.
  const hasLoop = total > 1;
  const indexOffset = hasLoop ? 1 : 0;

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
    setIndex(startIndex + indexOffset);
    x.set(-(startIndex + indexOffset) * containerWidth);
  }, [total, containerWidth, x, indexOffset]);

  // Move o track pro slide `i` (posição no TRACK, já com o deslocamento do
  // clone) — chamado tanto pelo snap do drag quanto por qualquer navegação
  // futura. Sem loop, clampa nas pontas de verdade; com loop, os clones (0 e
  // total+1) são posições alcançáveis — delas que vem o teleporte abaixo.
  const goToIndex = (i) => {
    if (!hasLoop) {
      const clamped = Math.max(0, Math.min(i, total - 1));
      setIndex(clamped);
      animate(x, -clamped * containerWidth, { type: 'spring', stiffness: 300, damping: 32 });
      return;
    }

    const target = Math.max(0, Math.min(i, total + 1));
    setIndex(target);
    animate(x, -target * containerWidth, { type: 'spring', stiffness: 300, damping: 32 }).then(() => {
      // Assentou num clone (posição 0 = clone do último, total+1 = clone do
      // primeiro) — teleporta sem animação pro item real equivalente, sem o
      // usuário perceber, fechando o loop infinito.
      if (target === 0) {
        setIndex(total);
        x.set(-total * containerWidth);
      } else if (target === total + 1) {
        setIndex(1);
        x.set(-1 * containerWidth);
      }
    });
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

  // Track com loop: clone do último card antes do primeiro, clone do
  // primeiro depois do último — são esses clones que tornam possível
  // arrastar "além" das pontas sem travar (ver dragConstraints) e dão o
  // material visual pro teleporte silencioso em goToIndex.
  const trackItems = total > 1
    ? [recommendations[total - 1], ...recommendations, recommendations[0]]
    : recommendations;
  const trackWidth = containerWidth * trackItems.length;
  // Com loop, as duas pontas do drag têm folga de +1 card (o clone) — não
  // mais 0/-(trackWidth-containerWidth) direto, já que agora dá pra passar
  // do primeiro/último real pro clone do lado oposto.
  const maxDragLeft = -(trackWidth - containerWidth);
  const maxDragRight = 0;

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
        dragConstraints={{ left: maxDragLeft, right: maxDragRight }}
        dragElastic={0.1}
        dragMomentum={false}
        onDragEnd={handleDragEnd}
        style={{ x, display: 'flex', width: trackWidth, cursor: total > 1 ? 'grab' : 'default', touchAction: 'pan-y' }}
        whileDrag={{ cursor: 'grabbing' }}
      >
        {trackItems.map((rec, i) => (
          <div
            key={`${rec.id}-${i}`}
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
