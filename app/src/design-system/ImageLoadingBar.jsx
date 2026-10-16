import { color } from './tokens.js';

// Barra de progresso de carregamento específica para imagens (sem ícone) —
// reflete o progresso REAL de download (ver useImageProgress.js), não uma
// animação indeterminada solta. Separada do BootLoader (que é ícone+barra
// indeterminada, usado só na tela de boot do app) a pedido explícito: aqui
// o valor precisa corresponder a bytes de verdade chegando.
export default function ImageLoadingBar({ progress = 0, width = 90, style }) {
  return (
    <div
      style={{
        width,
        height: 4,
        borderRadius: 2,
        background: 'rgba(28, 26, 23, 0.1)',
        overflow: 'hidden',
        ...style,
      }}
    >
      <div
        style={{
          height: '100%',
          width: `${Math.round(progress * 100)}%`,
          background: color.dark,
          borderRadius: 2,
          transition: 'width 0.15s ease-out',
        }}
      />
    </div>
  );
}
