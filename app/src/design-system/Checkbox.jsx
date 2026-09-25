import { CheckIcon } from '@solar-icons/react/bold/check';
import { color } from './tokens.js';

// Checkbox quadrado — mesma linguagem visual do Toggle (verde quando marcado,
// bege quando desmarcado). Sem uso no app ainda; nasce aqui pronto para a
// próxima tela que precisar de seleção múltipla.
export default function Checkbox({ checked, onChange, size = 22 }) {
  return (
    <div
      onClick={() => onChange(!checked)}
      style={{
        width: size,
        height: size,
        borderRadius: size * 0.32,
        background: checked ? color.success : color.bg,
        border: `1.5px solid ${checked ? color.success : color.border}`,
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
