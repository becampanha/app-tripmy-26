import { CheckIcon } from '@solar-icons/react/bold/check';
import { FloatingBar, color, radius } from '../design-system/index.js';

// Substitui a BottomTabBar enquanto uma tela está em modo de edição: mesmo
// tamanho/posição fixa da tab bar, mas com Cancelar (estilo link) e Salvar
// (botão verde com check) no lugar da navegação entre abas.
export default function EditActionBar({ onCancel, onSave, saving }) {
  return (
    <FloatingBar padding="8px 8px 8px 20px" style={{ justifyContent: 'space-between' }}>
      <div
        onMouseDown={(e) => e.preventDefault()}
        onClick={onCancel}
        style={{ color: color.muted, fontSize: 14, fontWeight: 700, cursor: 'pointer' }}
      >
        Cancelar
      </div>

      <div
        onClick={() => {
          if (!saving) onSave();
        }}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 6,
          height: 46,
          padding: '0 20px',
          borderRadius: radius.pillBarButton,
          background: color.success,
          boxShadow: '0 3px 8px rgba(63,163,90,0.35)',
          cursor: saving ? 'default' : 'pointer',
          opacity: saving ? 0.7 : 1,
        }}
      >
        <CheckIcon size={17} color={color.white} />
        <span style={{ color: color.white, fontSize: 14, fontWeight: 700 }}>
          {saving ? 'Salvando...' : 'Salvar'}
        </span>
      </div>
    </FloatingBar>
  );
}
