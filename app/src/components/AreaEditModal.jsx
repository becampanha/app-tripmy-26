import { useState } from 'react';
import { motion } from 'motion/react';
import { CloseIcon } from '@solar-icons/react/linear/close';
import { TrashBinTrashIcon } from '@solar-icons/react/linear/trash-bin-trash';
import { FieldLabel, inputStyle } from '../design-system/index.js';
import { useHidesTabBar } from '../hooks/useEditingState.js';

// Bottom sheet de criar/editar uma área — mesmo padrão visual/estrutural do
// RecommendationEditModal.jsx (campo único aqui, já que área é só um nome).
// `area` null = modo criar (sem botão excluir); área existente = editar.
export default function AreaEditModal({ area, onSave, onDelete, onClose }) {
  const [name, setName] = useState(area?.name || '');
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [attemptedSave, setAttemptedSave] = useState(false);

  useHidesTabBar(true);

  const busy = saving || deleting;
  const canSave = name.trim().length > 0 && !busy;

  const handleSave = async () => {
    if (!canSave) {
      setAttemptedSave(true);
      return;
    }
    setSaving(true);
    try {
      await onSave(name.trim());
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (busy) return;
    setDeleting(true);
    try {
      await onDelete();
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 30, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.18 }}
        onClick={onClose}
        style={{ position: 'absolute', inset: 0, background: 'rgba(28,26,23,0.5)' }}
      />

      <motion.div
        initial={{ y: 24 }}
        animate={{ y: 0 }}
        exit={{ y: 24 }}
        transition={{ duration: 0.22, ease: [0.32, 0.72, 0, 1] }}
        style={{
          position: 'relative',
          width: '100%',
          maxWidth: 480,
          background: '#fff',
          borderTopLeftRadius: 24,
          borderTopRightRadius: 24,
          boxSizing: 'border-box',
          padding: '18px 22px calc(22px + env(safe-area-inset-bottom))',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ fontSize: 18, fontWeight: 800, color: '#1c1a17' }}>{area ? 'Editar área' : 'Nova área'}</div>
          <div
            onClick={onClose}
            style={{ width: 30, height: 30, borderRadius: 11, background: '#f9f7f2', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
          >
            <CloseIcon size={16} color="#1c1a17" />
          </div>
        </div>

        <div style={{ marginTop: 18 }}>
          <FieldLabel error={attemptedSave && !name.trim() && true}>Nome da área</FieldLabel>
          <input
            autoFocus
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Ex: Disney Springs"
            style={{ ...inputStyle, marginTop: 5 }}
          />
        </div>

        <div style={{ marginTop: 20, display: 'flex', gap: 10 }}>
          {area && (
            <div
              onClick={handleDelete}
              style={{
                flex: 'none',
                width: 50,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: 16,
                background: '#faeeed',
                cursor: busy ? 'default' : 'pointer',
                opacity: busy ? 0.6 : 1,
              }}
            >
              <TrashBinTrashIcon size={19} color="#b3453f" />
            </div>
          )}
          <div
            onClick={handleSave}
            style={{
              flex: 1,
              padding: 14,
              borderRadius: 16,
              background: canSave ? '#1c1a17' : '#e2ddd2',
              color: '#fff',
              fontSize: 14.5,
              fontWeight: 700,
              textAlign: 'center',
              cursor: canSave ? 'pointer' : 'default',
            }}
          >
            {saving ? 'Salvando...' : 'Salvar'}
          </div>
        </div>
      </motion.div>
    </div>
  );
}
