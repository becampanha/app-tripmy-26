import { CheckIcon } from '@solar-icons/react/bold/check';

// Substitui a BottomTabBar enquanto uma tela está em modo de edição: mesmo
// tamanho/posição fixa da tab bar, mas com Cancelar (estilo link) e Salvar
// (botão verde com check) no lugar da navegação entre abas.
export default function EditActionBar({ onCancel, onSave, saving }) {
  return (
    <div
      style={{
        position: 'fixed',
        left: '50%',
        transform: 'translateX(-50%)',
        width: 'min(calc(100% - 44px), 436px)',
        bottom: 20,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        background: 'rgba(255,255,255,0.35)',
        backdropFilter: 'blur(28px) saturate(180%)',
        WebkitBackdropFilter: 'blur(28px) saturate(180%)',
        borderRadius: 34,
        padding: '8px 8px 8px 20px',
        zIndex: 3,
        boxShadow: '0 4px 12px rgba(28,26,23,0.18)',
      }}
    >
      <div
        onMouseDown={(e) => e.preventDefault()}
        onClick={onCancel}
        style={{
          color: '#9a9186',
          fontSize: 14,
          fontWeight: 700,
          cursor: 'pointer',
        }}
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
          borderRadius: 26,
          background: '#3fa35a',
          boxShadow: '0 3px 8px rgba(63,163,90,0.35)',
          cursor: saving ? 'default' : 'pointer',
          opacity: saving ? 0.7 : 1,
        }}
      >
        <CheckIcon size={17} color="#fff" />
        <span style={{ color: '#fff', fontSize: 14, fontWeight: 700 }}>
          {saving ? 'Salvando...' : 'Salvar'}
        </span>
      </div>
    </div>
  );
}
