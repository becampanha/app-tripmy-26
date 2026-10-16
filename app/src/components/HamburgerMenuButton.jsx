import { useNavigate } from 'react-router-dom';
import { HamburgerMenuIcon } from '@solar-icons/react/linear/hamburger-menu';
import { color } from '../design-system/index.js';

// Botão fixo no canto esquerdo do título, presente só nas telas "mãe" da
// tab bar (Roteiro, Dicas, Lugares, Atrações, Compras) — leva pra tela Mais,
// que também faz parte dessa hierarquia de telas raiz (ver App.jsx).
// `onClick` (opcional): TESTE — ScheduleScreen passa um handler próprio pra
// disparar a saída coreografada (conteúdo em cascata → header → tab bar)
// antes de navegar, em vez do navigate() direto padrão.
export function HamburgerMenuButton({ onClick }) {
  const navigate = useNavigate();
  return (
    <div
      onClick={onClick || (() => navigate('/mais'))}
      style={{
        width: 38,
        height: 38,
        borderRadius: 13,
        background: color.surfaceMuted,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'pointer',
      }}
    >
      <HamburgerMenuIcon size={18} color={color.dark} />
    </div>
  );
}
