import { color, overlay, radius, shellMaxWidth, space } from './tokens.js';

// Nav bar flutuante sobre uma foto de header com parallax: começa translúcida
// com blur (flutuando sobre a foto) e vira clara/sólida assim que o scroll
// "engole" a foto. Padrão canônico: PlaceDetailScreen. Renderiza só a casca
// (fundo branco que aparece atrás) + o botão de voltar; os controles da
// direita (editar/salvar/cancelar) vêm via `right`.
export function NavBarChrome({ visible, height = 76 }) {
  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: '50%',
        transform: 'translateX(-50%)',
        width: '100%',
        maxWidth: shellMaxWidth,
        height,
        background: color.bg,
        boxShadow: visible ? '0 2px 10px rgba(28,26,23,0.08)' : 'none',
        opacity: visible ? 1 : 0,
        transition: 'opacity 0.2s ease, box-shadow 0.2s ease',
        pointerEvents: 'none',
        zIndex: 1,
      }}
    />
  );
}

// Estilo de controle que alterna sozinho entre "flutuando sobre foto"
// (translúcido + blur) e "sobre nav bar sólida" (claro opaco), conforme
// `visible`. Usar como base de estilo em botões circulares/pill da nav bar.
export function navControlStyle(visible) {
  return {
    background: visible ? color.surfaceMuted : overlay.onPhotoControl,
    backdropFilter: visible ? undefined : 'blur(10px)',
    WebkitBackdropFilter: visible ? undefined : 'blur(10px)',
    boxShadow: visible ? 'none' : `0 4px 12px ${overlay.shadowSoft}`,
    transition: 'background 0.2s ease, box-shadow 0.2s ease',
  };
}

export function navControlTextColor(visible) {
  return visible ? color.dark : color.white;
}

// Wrapper de largura travada (mesmo padrão da faixa mobile centralizada) —
// os botões da nav bar usam left/right simples dentro dele.
export default function NavBar({ visible, left, right, height = 76 }) {
  return (
    <>
      <NavBarChrome visible={visible} height={height} />
      <div
        style={{
          position: 'fixed',
          top: 0,
          left: '50%',
          transform: 'translateX(-50%)',
          width: '100%',
          maxWidth: shellMaxWidth,
          height: 0,
          zIndex: 2,
        }}
      >
        <div style={{ position: 'absolute', top: 18, left: 18 }}>{left}</div>
        {right && <div style={{ position: 'absolute', top: 18, right: 18, display: 'flex', gap: space.md }}>{right}</div>}
      </div>
    </>
  );
}
