import SearchInput from './SearchInput.jsx';

const HEIGHT = 46; // altura do SearchInput + respiro abaixo dele

// Campo de busca que some ao rolar a lista pra baixo e reaparece ao rolar de
// volta pra cima (padrão Safari/X) — ver useScrollDirectionReveal.js.
// Diferente de um "revelar só durante o gesto": fica totalmente visível e
// interativo (clicável, digitável) enquanto `visible` for true, sem
// depender de o usuário continuar segurando nada.
export default function RevealableSearch({ visible, value, onChange, placeholder }) {
  return (
    <div
      style={{
        height: visible ? HEIGHT : 0,
        opacity: visible ? 1 : 0,
        overflow: 'hidden',
        transition: 'height 0.22s ease, opacity 0.18s ease',
      }}
    >
      <SearchInput value={value} onChange={onChange} placeholder={placeholder} style={{ marginBottom: 0 }} />
    </div>
  );
}
