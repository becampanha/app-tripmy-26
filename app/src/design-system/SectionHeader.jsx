import { color, space, type } from './tokens.js';

// Título de seção sticky — usado nas listas agrupadas (área do parque em
// Atrações, subcategoria em Lugares). `top: 0` colaria no topo real do
// container de scroll, que fica por trás da FixedHeader (position: fixed,
// fora do fluxo do scroll — sticky não sabe que ela existe e não desvia
// dela sozinho): o título de seção passava por cima/atrás da barra fixa em
// vez de parar visível logo abaixo. Cada tela deve passar
// style={{ top: headerHeight }} (a mesma altura medida via
// useElementHeight/headerRef, já usada pro padding-top do conteúdo) — zIndex
// acima do FixedHeader (zIndex: 5) garante que, enquanto ainda colando, o
// título de seção fica por cima do conteúdo rolando, não atrás da barra.
export default function SectionHeader({ children, style }) {
  return (
    <div
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 4,
        background: color.bg,
        padding: `${space.lg}px 0`,
        marginBottom: space.xs,
        color: color.dark,
        ...type.sectionTitle,
        ...style,
      }}
    >
      {children}
    </div>
  );
}
