import { color, shellMaxWidth, spacing, type } from './tokens.js';

const REVEAL_THRESHOLD = 8; // px de scroll antes da barra fixa aparecer

// Título + ações de tela fixados no topo ao rolar — igual à nav bar do
// PlaceDetailScreen, mas sem foto/blur por trás (fundo sempre branco sólido,
// linha divisória sutil aparece só quando o scroll passa do topo). Usado nas
// telas "raiz" (Roteiro, Dicas, Lugares, Atrações, Mais): o título grande
// normal continua no topo do conteúdo, esta barra é o que aparece por cima
// dele conforme a página rola.
export default function FixedHeader({ scrollY, title, right }) {
  const visible = scrollY > REVEAL_THRESHOLD;

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: '50%',
        transform: 'translateX(-50%)',
        width: '100%',
        maxWidth: shellMaxWidth,
        zIndex: 5,
        background: color.bg,
        borderBottom: visible ? `1px solid ${color.border}` : '1px solid transparent',
        opacity: visible ? 1 : 0,
        pointerEvents: visible ? 'auto' : 'none',
        transition: 'opacity 0.15s ease, border-color 0.15s ease',
        padding: `14px ${spacing.screenGutter}px`,
        boxSizing: 'border-box',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: spacing.gapMd,
      }}
    >
      <div style={{ ...type.itemTitle, color: color.dark, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
        {title}
      </div>
      {right && <div style={{ display: 'flex', alignItems: 'center', gap: spacing.gapMd, flex: 'none' }}>{right}</div>}
    </div>
  );
}
