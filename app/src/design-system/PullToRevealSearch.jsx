import SearchInput from './SearchInput.jsx';

const MAX_HEIGHT = 46; // altura do SearchInput + respiro abaixo dele

// Campo de busca escondido por padrão (altura 0), revelado só enquanto o
// usuário segura o gesto de puxar a lista pra baixo no topo (overscroll) —
// mesmo padrão do Contatos/Mail do iOS. Ao soltar, recolhe de volta sozinho
// (ver usePullToReveal.js). `progress` vai de 0 (escondido) a 1 (revelado
// por completo).
export default function PullToRevealSearch({ progress, value, onChange, placeholder }) {
  return (
    <div
      style={{
        height: MAX_HEIGHT * progress,
        opacity: progress,
        overflow: 'hidden',
        transition: progress === 0 ? 'height 0.25s ease, opacity 0.2s ease' : 'none',
      }}
    >
      <SearchInput value={value} onChange={onChange} placeholder={placeholder} style={{ marginBottom: 0 }} />
    </div>
  );
}
