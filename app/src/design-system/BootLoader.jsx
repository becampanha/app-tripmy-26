import { color } from './tokens.js';

// Mesmo visual da tela de boot do app (ver index.html: ícone + barra de
// progresso indeterminada) — reaproveitado aqui como indicador de loading
// genérico dentro do React (ex: PhotoCard enquanto a imagem carrega), pra
// manter uma única identidade de "carregando" em todo o app.
export default function BootLoader({ size = 44, style }) {
  const barWidth = size * 2.2;

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: size * 0.3,
        ...style,
      }}
    >
      <img
        src="/icons/icon-192.png"
        alt=""
        style={{ width: size, height: size, borderRadius: size * 0.28 }}
      />
      <div
        style={{
          position: 'relative',
          width: barWidth,
          height: 4,
          borderRadius: 2,
          background: 'rgba(28, 26, 23, 0.1)',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            position: 'absolute',
            top: 0,
            bottom: 0,
            left: 0,
            width: '45%',
            background: color.dark,
            borderRadius: 2,
            animation: 'boot-progress-slide 1.1s ease-in-out infinite',
          }}
        />
      </div>
    </div>
  );
}
