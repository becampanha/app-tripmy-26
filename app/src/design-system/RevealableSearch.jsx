import SearchInput from './SearchInput.jsx';
import { spacing } from './tokens.js';

// Altura do SearchInput (~46px) + o mesmo respiro (controlGap) que ele teria
// naturalmente antes do próximo bloco — zerado via marginBottom:0 abaixo
// porque esse respiro precisa estar DENTRO da altura animada (senão o
// elemento seguinte fica colado nele quando revelado).
const HEIGHT = 46 + spacing.controlGap;

// Campo de busca escondido por padrão, revelado com o mesmo "feel" elástico
// do pull-to-refresh do iOS — ver usePullDownSearch.js. `progress` (0→1)
// acompanha a distância do arrasto em tempo real enquanto o dedo segura o
// overscroll no topo; ao soltar depois de passar o threshold, o hook trava
// progress em 1 (aberto) — diferente de uma 1ª tentativa que recolhia ao
// soltar (inutilizável: não dava tempo de tocar/digitar no campo). Uma vez
// aberto, fica visível e interativo até o usuário rolar a lista pra baixo o
// suficiente (ver mesmo hook).
export default function RevealableSearch({ progress, value, onChange, placeholder }) {
  const isAnimating = progress === 0 || progress === 1;
  return (
    <div
      style={{
        height: HEIGHT * progress,
        opacity: progress,
        overflow: 'hidden',
        transition: isAnimating ? 'height 0.22s ease, opacity 0.18s ease' : 'none',
      }}
    >
      <SearchInput value={value} onChange={onChange} placeholder={placeholder} style={{ marginBottom: 0 }} />
    </div>
  );
}
