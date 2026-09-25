import { color } from './tokens.js';

// Switch customizado (usado em Lugares e no seletor de lugar). O clique é
// interceptado com stopPropagation: quando o Toggle vive dentro de um
// wrapper maior que também é clicável (linha inteira "Lugares que estão no
// roteiro"), sem isso os dois onClick disparariam juntos e inverteriam o
// estado duas vezes, cancelando a mudança ao clicar bem em cima do switch.
export default function Toggle({ checked, onChange }) {
  return (
    <div
      onClick={(e) => {
        e.stopPropagation();
        onChange(!checked);
      }}
      style={{
        width: 38,
        height: 22,
        borderRadius: 11,
        background: checked ? color.success : color.toggleOff,
        position: 'relative',
        cursor: 'pointer',
        transition: 'background .2s',
        flex: 'none',
      }}
    >
      <div
        style={{
          position: 'absolute',
          top: 2,
          left: checked ? 18 : 2,
          width: 18,
          height: 18,
          borderRadius: 9,
          background: color.white,
          boxShadow: '0 1px 3px rgba(0,0,0,0.25)',
          transition: 'left .2s',
        }}
      />
    </div>
  );
}
