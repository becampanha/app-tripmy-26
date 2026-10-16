import { useEffect, useMemo } from 'react';
import { motion } from 'motion/react';

const COLORS = ['#3fa35a', '#f2b705', '#e85d75', '#4a90d9', '#ff8a3d', '#8a5fd9'];
const PARTICLE_COUNT = 18;
const DURATION_MS = 700;

// Pequena explosão de confete nascendo de um ponto exato da tela (ex: o
// checkbox que o usuário acabou de marcar) — inspirado no exemplo
// "react-confetti" do motion.dev, mas contido/pequeno em vez de cobrir a
// tela inteira. `x`/`y` são coordenadas absolutas (viewport), tipicamente
// vindas de getBoundingClientRect() do elemento clicado. Cada partícula
// anima uma vez e o componente se desmonta sozinho via onComplete, no
// chamador — este componente aqui não tem estado próprio, só a animação.
export default function Confetti({ x, y, onComplete }) {
  const particles = useMemo(
    () =>
      Array.from({ length: PARTICLE_COUNT }, (_, i) => {
        const angle = (Math.PI * 2 * i) / PARTICLE_COUNT + Math.random() * 0.5;
        const distance = 40 + Math.random() * 50;
        return {
          id: i,
          color: COLORS[i % COLORS.length],
          dx: Math.cos(angle) * distance,
          dy: Math.sin(angle) * distance - 20, // leve impulso pra cima, depois a gravidade (dy final maior) puxa pra baixo
          rotate: (Math.random() - 0.5) * 360,
          size: 5 + Math.random() * 4,
          shape: i % 3 === 0 ? '50%' : '2px', // mistura círculos e quadrados
        };
      }),
    []
  );

  // onAnimationComplete do Motion não se mostrou confiável aqui (não disparava
  // de forma consistente com várias propriedades animadas ao mesmo tempo em
  // múltiplas instâncias simultâneas) — um timeout com a duração exata da
  // transição é mais simples e sempre funciona.
  useEffect(() => {
    const timer = setTimeout(onComplete, DURATION_MS);
    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <div style={{ position: 'fixed', left: x, top: y, width: 0, height: 0, zIndex: 50, pointerEvents: 'none' }}>
      {particles.map((p) => (
        <motion.div
          key={p.id}
          initial={{ x: 0, y: 0, opacity: 1, rotate: 0, scale: 1 }}
          animate={{ x: p.dx, y: p.dy + 60, opacity: 0, rotate: p.rotate, scale: 0.6 }}
          transition={{ duration: DURATION_MS / 1000, ease: [0.16, 1, 0.3, 1] }}
          style={{
            position: 'absolute',
            width: p.size,
            height: p.size,
            borderRadius: p.shape,
            background: p.color,
          }}
        />
      ))}
    </div>
  );
}
