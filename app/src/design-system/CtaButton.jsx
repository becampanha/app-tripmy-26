import { color, radius, spacing, type } from './tokens.js';

// Botão grande de ação/CTA — preenchido escuro por padrão, ou desabilitado
// (fundo claro) quando `disabled`. Ex: "Publicar", "Ver no Google Maps".
export default function CtaButton({ children, onClick, disabled, style }) {
  return (
    <div
      onClick={disabled ? undefined : onClick}
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: spacing.cardPadding,
        borderRadius: radius.button,
        background: disabled ? color.toggleOff : color.dark,
        color: color.white,
        ...type.body,
        fontWeight: 700,
        fontSize: 14.5,
        cursor: disabled ? 'default' : 'pointer',
        ...style,
      }}
    >
      {children}
    </div>
  );
}
