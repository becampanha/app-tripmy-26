import { color, overlay, radius } from './tokens.js';

// Botão circular de ação (voltar, fechar, editar). `variant` cobre as
// variações de fundo já em uso no app:
// - 'light' (padrão): fundo claro opaco #f9f7f2 — botões fora de foto
// - 'onPhoto': translúcido com blur, para flutuar sobre uma foto
// - 'dark': fundo escuro sólido, para contexto de modal fullscreen
export default function IconButton({ icon: Icon, onClick, size = 38, variant = 'light', iconSize = 18, style }) {
  const variants = {
    light: { background: color.surfaceMuted, iconColor: color.dark, backdropFilter: undefined },
    onPhoto: { background: overlay.onPhotoControl, iconColor: color.white, backdropFilter: 'blur(12px)' },
    dark: { background: color.dark, iconColor: color.white, backdropFilter: undefined },
  };
  const v = variants[variant];

  return (
    <div
      onClick={onClick}
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        background: v.background,
        backdropFilter: v.backdropFilter,
        WebkitBackdropFilter: v.backdropFilter,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'pointer',
        flex: 'none',
        ...style,
      }}
    >
      <Icon size={iconSize} color={v.iconColor} />
    </div>
  );
}
