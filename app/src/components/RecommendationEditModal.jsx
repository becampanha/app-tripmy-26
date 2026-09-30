import { useState } from 'react';
import { motion } from 'motion/react';
import { CloseIcon } from '@solar-icons/react/linear/close';
import { CameraMinimalisticIcon } from '@solar-icons/react/linear/camera-minimalistic';
import { TrashBinTrashIcon } from '@solar-icons/react/linear/trash-bin-trash';
import { FieldLabel, inputStyle } from '../design-system/index.js';

// Mesmo bottom sheet do RecommendationModal (criar), mas pré-preenchido com
// os dados da recomendação — aberto pelo botão de editar do próprio
// RecommendationCard, não mais pelo modo de edição do lugar. Salva/exclui
// imediatamente (mesmo espírito do "Publicar" do modal de criar), sem
// depender do botão Salvar geral da tela de detalhes do lugar.
export default function RecommendationEditModal({ recommendation, onSave, onDelete, onClose }) {
  const [title, setTitle] = useState(recommendation.title || '');
  const [author, setAuthor] = useState(recommendation.author || '');
  const [description, setDescription] = useState(recommendation.description || '');
  const [photo, setPhoto] = useState(recommendation.photo || null);
  const [photoFile, setPhotoFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const handlePickPhoto = (file) => {
    if (!file) return;
    setPhotoFile(file);
    setPhotoPreview(URL.createObjectURL(file));
  };

  const handleRemovePhoto = () => {
    setPhoto(null);
    setPhotoFile(null);
    setPhotoPreview(null);
  };

  const busy = saving || deleting;
  const canSave = description.trim().length > 0 && !busy;

  const handleSave = async () => {
    if (!canSave) return;
    setSaving(true);
    try {
      await onSave({
        title: title.trim() || null,
        author: author.trim() || null,
        description: description.trim(),
        photo,
        photoFile,
      });
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
          <div style={{ fontSize: 18, fontWeight: 800, color: '#1c1a17' }}>Editar dica</div>
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
          <FieldLabel>Título</FieldLabel>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Ex: O melhor prato do restaurante"
            style={{ ...inputStyle, marginTop: 5 }}
          />
        </div>

        <div style={{ marginTop: 14 }}>
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
          <FieldLabel>Quem está sugerindo</FieldLabel>
          <input
            value={author}
            onChange={(e) => setAuthor(e.target.value)}
            placeholder="Seu nome"
            style={{ ...inputStyle, marginTop: 5 }}
          />
        </div>

        <div style={{ marginTop: 14 }}>
          <FieldLabel>Foto</FieldLabel>
          <div style={{ marginTop: 5, display: 'flex', alignItems: 'center', gap: 10 }}>
            <label
              style={{
                flex: 1,
                minWidth: 0,
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
                {photoPreview || photo ? (
                  <img src={photoPreview || photo} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  <CameraMinimalisticIcon size={18} color="#b3ab9c" />
                )}
              </div>
              <span style={{ color: '#1c1a17', fontSize: 13, fontWeight: 700, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {photo || photoPreview ? 'Trocar foto' : 'Adicionar foto (opcional)'}
              </span>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => handlePickPhoto(e.target.files[0])}
                style={{ display: 'none' }}
              />
            </label>
            {(photo || photoPreview) && (
              <button
                type="button"
                onClick={handleRemovePhoto}
                style={{ border: 0, background: 'none', padding: 4, cursor: 'pointer', flex: 'none' }}
              >
                <CloseIcon size={18} color="#b3453f" />
              </button>
            )}
          </div>
        </div>

        <div style={{ marginTop: 20, display: 'flex', gap: 10 }}>
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
