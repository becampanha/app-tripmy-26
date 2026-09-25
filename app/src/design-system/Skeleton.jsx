import { color, radius } from './tokens.js';

// Bloco de loading (pulse) genérico. Cor unificada com o fundo claro
// secundário do app (mesma cor das bubbles/chips inativos).
export default function Skeleton({ width = '100%', height, radius: r = radius.card / 3, style }) {
  return (
    <div
      style={{
        width,
        height,
        borderRadius: r,
        background: color.surfaceMuted,
        animation: 'pulse 1.2s ease-in-out infinite',
        ...style,
      }}
    />
  );
}
