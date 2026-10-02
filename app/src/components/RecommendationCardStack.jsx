import { useMemo, useState } from 'react';
import { motion, useMotionValue, useTransform, animate } from 'motion/react';
import { SquareAltArrowRightIcon } from '@solar-icons/react/bold/square-alt-arrow-right';
import { PhotoCard, Skeleton, color, radius, spacing } from '../design-system/index.js';

// Modo de visualização alternativo da tela de Dicas — pilha de cards estilo
// Tinder: o card da frente é arrastável (drag="x", Framer Motion), com os
// próximos da pilha visíveis atrás dele (deslocados pra baixo, menores e
// mais transparentes). Navegação por swipe (esquerda avança, direita volta)
// ou pelo botão no canto inferior direito do card (só avança).
//
// Efeito central: ao soltar o swipe além do threshold, o índice troca NA
// HORA (sem esperar nenhuma animação de saída) — a camada que estava logo
// atrás já tinha subido durante o próprio drag (reativa ao gesto via
// dragProgress) e assume instantaneamente o lugar do topo, porque ela é a
// MESMA posição (top:0) que o card antigo ocupava. Não existe "card novo
// entrando de outro lugar": é a própria pilha que sobe um degrau, na hora.
const SWIPE_THRESHOLD = 100;
// Da mais atrás (índice 0) pra mais perto da frente (último índice): desce
// mais, fica mais transparente e menor — dá a sensação de profundidade real
// (não só uma linha reta de cards do mesmo tamanho), e o último "some" quase
// por completo, sugerindo que a pilha continua além do que se vê.
const STACK_LAYERS = [
  { offset: 28, opacity: 0.35, scale: 0.9 },
  { offset: 14, opacity: 0.75, scale: 0.96 },
];
const MAX_OFFSET = STACK_LAYERS[0].offset;
const BOTTOM_GAP = 100; // espaço reservado pra tab bar flutuante não cobrir o card

// Embaralha uma cópia do array (Fisher-Yates) — chamado 1x por montagem do
// componente (toda vez que se entra no modo "cards"), pra ordem/próximo card
// serem imprevisíveis a cada visita, como pedido.
function shuffle(arr) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function StackLayer({ rec, offset, opacity, scale, cardHeight, zIndex, dragProgress }) {
  // Conforme o progresso do arrasto do card da frente cresce (0 a 1), essa
  // camada sobe em direção ao offset 0 / opacity 1 / scale 1 — cada camada
  // reage, mas a mais próxima do topo (offset menor) chega lá primeiro.
  const top = useTransform(dragProgress, (p) => offset * (1 - p));
  const liveOpacity = useTransform(dragProgress, (p) => opacity + (1 - opacity) * p);
  const liveScale = useTransform(dragProgress, (p) => scale + (1 - scale) * p);
  return (
    <motion.div
      style={{
        position: 'absolute',
        top,
        left: 0,
        right: 0,
        scale: liveScale,
        transformOrigin: 'bottom center',
        zIndex,
        pointerEvents: 'none',
        borderRadius: radius.cardPhoto,
        // Fundo sólido SEMPRE opaco, por trás da foto — sem ele, ao reduzir
        // a opacity da foto pra simular profundidade, a camada AINDA MAIS
        // atrás (zIndex menor) aparecia "vazando" por trás, como se duas
        // fotos estivessem sobrepostas/semitransparentes. Com o fundo
        // branco sólido nessa mesma caixa, só a FOTO fica com opacity
        // variável — o branco por trás dela sempre bloqueia o que vem atrás.
        background: '#fff',
      }}
    >
      <motion.div style={{ opacity: liveOpacity, height: '100%' }}>
        <PhotoCard photo={rec.photo} height={cardHeight} style={{ marginBottom: 0 }} />
      </motion.div>
    </motion.div>
  );
}

function RecommendationPhotoContent({ rec, onNext }) {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 12 }}>
      <div style={{ minWidth: 0, flex: 1 }}>
        {rec.place && (
          <div
            style={{
              display: 'inline-flex',
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
      </div>

      {onNext && (
        <div onClick={onNext} style={{ flexShrink: 0, cursor: 'pointer', display: 'flex' }}>
          <SquareAltArrowRightIcon size={44} color="#fff" />
        </div>
      )}
    </div>
  );
}

export default function RecommendationCardStack({ recommendations, headerHeight }) {
  // Embaralha só quando a LISTA de recomendações muda de identidade (ex:
  // carregou do zero) — não a cada render, senão o card trocaria de baixo
  // dos pés do usuário a cada clique em "próximo".
  const shuffled = useMemo(() => (recommendations ? shuffle(recommendations) : null), [recommendations]);

  const [index, setIndex] = useState(0);
  // x do card da frente — motion value única (não state), pra Framer Motion
  // escrever nela a cada frame do gesto sem re-render.
  const x = useMotionValue(0);
  // rotate acompanha x (como segurar um cartão real pela base e inclinar
  // conforme desliza) — dá o leve "efeito de queda" pedido, em vez do card
  // só andar reto na horizontal feito trem.
  const rotate = useTransform(x, [-300, 0, 300], [-12, 0, 12]);
  // Progresso do arrasto (0 a 1) — repassado às camadas de trás, que sobem
  // em tempo real conforme o gesto avança (useTransform em StackLayer).
  const dragProgress = useTransform(x, (v) => Math.min(Math.abs(v) / SWIPE_THRESHOLD, 1));

  const top = headerHeight + spacing.controlGap;
  // Altura do card da frente (parado, sempre no topo) — fixa em relação à
  // viewport (100dvh), naturalmente responsiva: tela menor dá card menor,
  // maior dá card maior. Reserva espaço extra (MAX_OFFSET) embaixo pra
  // caber o deslocamento das camadas de trás sem cortar/sem precisar de
  // scroll.
  const cardHeight = `calc(100dvh - ${top}px - ${BOTTOM_GAP}px - ${MAX_OFFSET}px)`;

  if (!shuffled) {
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

  if (shuffled.length === 0) {
    return (
      <div style={{ marginTop: top, padding: '30px 0', textAlign: 'center', color: color.faint, fontSize: 13.5, fontWeight: 600 }}>
        Nenhuma dica publicada ainda.
      </div>
    );
  }

  const total = shuffled.length;
  const front = shuffled[index % total];
  // STACK_LAYERS vai da mais atrás (zIndex menor) pra mais perto da frente
  // (zIndex maior). A camada mais perto da frente (último item do array) é
  // a PRÓXIMA dica real (index+1) — reflete a ordem verdadeira da fila, não
  // só textura decorativa.
  const behindRecs = STACK_LAYERS.map((_, i) => shuffled[(index + STACK_LAYERS.length - i) % total]);

  // Reseta x/rotate ANTES de trocar o índice — `x.stop()` cancela qualquer
  // animação/gesto de drag ainda em andamento (sem isso, o momentum do
  // drag que acabou de soltar o dedo "vencia" o set(0) um frame depois,
  // fazendo o card novo nascer com um resquício de x/rotate do gesto
  // anterior e "saltar" visivelmente de volta ao centro). Com o gesto
  // parado e o valor zerado antes do novo `front` renderizar, o card já
  // nasce centrado.
  //
  // SEMPRE avança (nunca "volta") — a pilha visível atrás é sempre composta
  // pelos PRÓXIMOS itens (index+1, index+2), então arrastar pra qualquer
  // lado precisa mostrar o próximo real, senão o card que assume o lugar
  // não bate com o que estava subindo durante o drag (bug reportado: pra
  // direita, "o card de baixo muda pra um outro, nada a ver" — porque
  // tentava decrementar o índice, mas a pilha visual nunca preparou o
  // anterior, só o próximo).
  const settleAndAdvance = () => {
    x.stop();
    x.set(0);
    setIndex((i) => (i + 1) % total);
  };

  const goNext = () => settleAndAdvance();

  // Ao soltar: confirma o swipe por DISTÂNCIA (passou do threshold) OU por
  // VELOCIDADE (gesto rápido, mesmo sem ter percorrido muita distância) —
  // é assim que o gesto real do Tinder decide, não só a posição final do
  // dedo. info.velocity.x vem em px/s do próprio Framer Motion.
  const handleDragEnd = (_, info) => {
    const passedDistance = Math.abs(info.offset.x) > SWIPE_THRESHOLD;
    const passedVelocity = Math.abs(info.velocity.x) > 500;
    if (!passedDistance && !passedVelocity) {
      // Cancelado: volta pro centro com mola (leve overshoot natural do
      // spring, sem precisar simular isso manualmente).
      animate(x, 0, { type: 'spring', stiffness: 300, damping: 22 });
      return;
    }
    // Troca o índice NA HORA, sem esperar nenhuma animação de saída — a
    // camada de trás já estava subindo durante o próprio drag (dragProgress)
    // e no momento de soltar já está quase (ou totalmente) na posição final,
    // então o novo card da frente assume o lugar instantaneamente. Antes
    // disso esperava um `animate(...).onComplete` de ~300-400ms pro card
    // antigo terminar de sair da tela — essa espera era o atraso reportado
    // ("ele continua indo, demora uns segundos, aí desaparece"). Sempre
    // avança (ver comentário em settleAndAdvance) independente do lado do
    // swipe — só a direção VISUAL de saída (x negativo/positivo) depende do
    // lado que o usuário arrastou, não o item que vem a seguir.
    settleAndAdvance();
  };

  return (
    <div
      style={{
        position: 'fixed',
        top,
        left: '50%',
        transform: 'translateX(-50%)',
        width: '100%',
        maxWidth: 480,
        boxSizing: 'border-box',
        padding: `0 ${spacing.screenGutter}px`,
      }}
    >
      <div style={{ position: 'relative' }}>
        {total > 1 &&
          STACK_LAYERS.map((layer, i) => (
            <StackLayer
              key={behindRecs[i].id}
              rec={behindRecs[i]}
              offset={layer.offset}
              opacity={layer.opacity}
              scale={layer.scale}
              cardHeight={cardHeight}
              zIndex={5 + i}
              dragProgress={dragProgress}
            />
          ))}

        <motion.div
          key={front.id}
          drag={total > 1 ? 'x' : false}
          dragConstraints={{ left: 0, right: 0 }}
          dragElastic={0.6}
          style={{ x, rotate, position: 'relative', zIndex: 10, cursor: total > 1 ? 'grab' : 'default', touchAction: 'pan-y' }}
          onDragEnd={handleDragEnd}
          whileDrag={{ cursor: 'grabbing' }}
        >
          <PhotoCard
            photo={front.photo}
            height={cardHeight}
            style={{ marginBottom: 0 }}
            contentStyle={{ padding: 18, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}
          >
            <RecommendationPhotoContent rec={front} onNext={total > 1 ? goNext : null} />
          </PhotoCard>
        </motion.div>
      </div>
    </div>
  );
}
