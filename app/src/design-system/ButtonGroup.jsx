import { color, radius, type } from './tokens.js';

// Segmented control estilo iOS: opções lado a lado dentro de uma cápsula,
// a ativa em destaque escuro. Sem uso no app ainda; nasce aqui pronto para
// a próxima tela que precisar de um seletor de 2-4 opções mutuamente exclusivas.
export default function ButtonGroup({ options, value, onChange, style }) {
  return (
    <div
      style={{
        display: 'flex',
        padding: 4,
        borderRadius: radius.input,
        background: color.surfaceMuted,
        gap: 2,
        ...style,
      }}
    >
      {options.map((opt) => {
        const active = opt.value === value;
        return (
          <div
            key={opt.value}
            onClick={() => onChange(opt.value)}
            style={{
              flex: 1,
              textAlign: 'center',
              padding: '7px 12px',
              borderRadius: radius.badge,
              cursor: 'pointer',
              userSelect: 'none',
              background: active ? color.dark : 'transparent',
              color: active ? color.white : color.mutedDeep,
              ...type.label,
              transition: 'background .15s, color .15s',
            }}
          >
            {opt.label}
          </div>
        );
      })}
    </div>
  );
}
