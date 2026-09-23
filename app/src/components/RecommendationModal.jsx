import { useState } from 'react';
import { CloseIcon } from '@solar-icons/react/linear/close';
import { CameraMinimalisticIcon } from '@solar-icons/react/linear/camera-minimalistic';
import { FieldLabel, inputStyle } from './DebouncedInput.jsx';

// Bottom sheet para publicar uma recomendação: descrição e foto opcional.
// Fica colado na parte de baixo da tela (diferente do PlaceSelectorModal,
// que é fullscreen) — mais rápido de preencher e fechar.
export default function RecommendationModal({ onSubmit, onClose }) {
  const [description, setDescription] = useState('');
  const [photoFile, setPhotoFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [publishing, setPublishing] = useState(false);

  const handlePickPhoto = (file) => {
    if (!file) return;
    setPhotoFile(file);
    setPhotoPreview(URL.createObjectURL(file));
  };

  const canPublish = description.trim().length > 0 && !publishing;

  const handlePublish = async () => {
    if (!canPublish) return;
    setPublishing(true);
    try {
      await onSubmit({ description: description.trim(), photoFile });
    } finally {
      setPublishing(false);
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 30,
        display: 'flex',
        alignItems: 'flex-end',
        justifyContent: 'center',
      }}
    >
      <div
        onClick={onClose}
        style={{ position: 'absolute', inset: 0, background: 'rgba(28,26,23,0.5)' }}
      />

      <div
        style={{
          position: 'relative',
          width: '100%',
          maxWidth: 480,
          maxHeight: '88dvh',
          overflowY: 'auto',
          background: '#fff',
          borderTopLeftRadius: 24,
          borderTopRightRadius: 24,
          boxSizing: 'border-box',
          padding: '18px 22px calc(22px + env(safe-area-inset-bottom))',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ fontSize: 18, fontWeight: 800, color: '#1c1a17' }}>Nova recomendação</div>
          <div
            onClick={onClose}
            style={{
              width: 30,
              height: 30,
              borderRadius: 11,
              background: '#f9f7f2',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
            }}
          >
            <CloseIcon size={16} color="#1c1a17" />
          </div>
        </div>

        <div style={{ marginTop: 18 }}>
          <FieldLabel>Descrição</FieldLabel>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Ex: Peça o brisket com molho extra"
            rows={3}
            style={{ ...inputStyle, marginTop: 5, resize: 'vertical', fontFamily: 'inherit' }}
          />
        </div>

        <div style={{ marginTop: 14 }}>
          <FieldLabel>Foto</FieldLabel>
          <label
            style={{
              marginTop: 5,
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              padding: 10,
              borderRadius: 14,
              background: '#f9f7f2',
              cursor: 'pointer',
            }}
          >
            <div
              style={{
                width: 44,
                height: 44,
                borderRadius: 10,
                flex: 'none',
                overflow: 'hidden',
                background: '#eee9df',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {photoPreview ? (
                <img src={photoPreview} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                <CameraMinimalisticIcon size={18} color="#b3ab9c" />
              )}
            </div>
            <span style={{ color: '#1c1a17', fontSize: 13, fontWeight: 700 }}>
              {photoFile ? 'Trocar foto' : 'Adicionar foto (opcional)'}
            </span>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => handlePickPhoto(e.target.files[0])}
              style={{ display: 'none' }}
            />
          </label>
        </div>

        <div
          onClick={handlePublish}
          style={{
            marginTop: 20,
            padding: 14,
            borderRadius: 16,
            background: canPublish ? '#1c1a17' : '#e2ddd2',
            color: '#fff',
            fontSize: 14.5,
            fontWeight: 700,
            textAlign: 'center',
            cursor: canPublish ? 'pointer' : 'default',
          }}
        >
          {publishing ? 'Publicando...' : 'Publicar'}
        </div>
      </div>
    </div>
  );
}
