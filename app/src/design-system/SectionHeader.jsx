import { color, space, type } from './tokens.js';

// Título de seção sticky — usado nas listas agrupadas (área do parque em
// Atrações, subcategoria em Lugares). zIndex fica abaixo do da tab bar
// flutuante (FloatingBar usa zIndex: 3) — senão o título passa por cima
// dela ao rolar a lista até o fim.
export default function SectionHeader({ children, style }) {
  return (
    <div
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 2,
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
