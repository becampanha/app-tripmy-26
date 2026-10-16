import { CheckIcon } from '@solar-icons/react/bold/check';
import { color } from './tokens.js';

// Checkbox quadrado — mesma linguagem visual do Toggle (verde quando marcado,
// bege quando desmarcado) por padrão; aceita `activeColor` para contextos que
// não usam a cor de sucesso (ex: filtros, onde ativo = preto).
export default function Checkbox({ checked, onChange, size = 22, activeColor = color.success }) {
  return (
    <div
      onClick={() => onChange(!checked)}
      style={{
        width: size,
        height: size,
        borderRadius: size * 0.32,
        background: checked ? activeColor : color.bg,
        border: `1.5px solid ${checked ? activeColor : color.border}`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'pointer',
        flex: 'none',
        transition: 'background .2s, border-color .2s',
      }}
    >
      {checked && <CheckIcon size={size * 0.68} color={color.white} />}
    </div>
  );
}
