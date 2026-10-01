import { useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { CloseIcon } from '@solar-icons/react/linear/close';
import { CameraMinimalisticIcon } from '@solar-icons/react/linear/camera-minimalistic';
import { AltArrowRightIcon } from '@solar-icons/react/linear/alt-arrow-right';
import PlaceSelectorModal from './PlaceSelectorModal.jsx';
import { FieldLabel, color, inputStyle, radius } from '../design-system/index.js';

// Bottom sheet para publicar uma recomendação: título, descrição, autor e
// foto, todos opcionais — basta um dos três campos de texto preenchido.
// Fica colado na parte de baixo da tela (diferente do PlaceSelectorModal,
// que é fullscreen) — mais rápido de preencher e fechar.
// `showPlaceField` liga o seletor de lugar opcional (tela de Dicas, onde o
// lugar não é conhecido de antemão); quando a dica já nasce vinculada a um
// lugar (tela de detalhe do lugar), essa prop fica de fora e não aparece.
export default function RecommendationModal({ onSubmit, onClose, showPlaceField }) {
  const [title, setTitle] = useState('');
  const [author, setAuthor] = useState('');
  const [description, setDescription] = useState('');
  const [photoFile, setPhotoFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [publishing, setPublishing] = useState(false);
  const [place, setPlace] = useState(null);
  const [selectorOpen, setSelectorOpen] = useState(false);

  const handlePickPhoto = (file) => {
    if (!file) return;
    setPhotoFile(file);
    setPhotoPreview(URL.createObjectURL(file));
  };

  const canPublish =
    (title.trim().length > 0 || author.trim().length > 0 || description.trim().length > 0) && !publishing;

  const handlePublish = async () => {
    if (!canPublish) return;
    setPublishing(true);
    try {
      await onSubmit({
        title: title.trim() || null,
        author: author.trim() || null,
        description: description.trim() || null,
        photoFile,
        placeId: place?.id || null,
        place,
      });
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
          <div style={{ fontSize: 18, fontWeight: 800, color: '#1c1a17' }}>Nova dica</div>
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

        {showPlaceField && (
          <div style={{ marginTop: 18 }}>
            <FieldLabel>Lugar (opcional)</FieldLabel>
            <div
              onClick={() => setSelectorOpen(true)}
              style={{
                marginTop: 5,
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                padding: '12px 14px',
                borderRadius: radius.input,
                background: '#f9f7f2',
                cursor: 'pointer',
              }}
            >
              {place ? (
                <>
                  {place.tag && <span style={{ flex: 'none' }}>{place.tag.split(' ')[0]}</span>}
                  <span style={{ flex: 1, minWidth: 0, color: color.dark, fontSize: 13, fontWeight: 700, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {place.name}
                  </span>
                </>
              ) : (
                <span style={{ flex: 1, color: color.faint, fontSize: 13, fontWeight: 600 }}>
                  Vincular a um lugar
                </span>
              )}
              {place ? (
                <div
                  onClick={(e) => {
                    e.stopPropagation();
                    setPlace(null);
                  }}
                  style={{
                    flex: 'none',
                    width: 22,
                    height: 22,
                    borderRadius: 11,
                    background: color.border,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                  }}
                >
                  <CloseIcon size={12} color={color.dark} />
                </div>
              ) : (
                <AltArrowRightIcon size={15} color={color.faintIcon} style={{ flex: 'none' }} />
              )}
            </div>
          </div>
        )}

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
      </motion.div>

      <AnimatePresence>
        {selectorOpen && (
          <PlaceSelectorModal
            key="place-selector"
            zIndex={40}
            onSelect={(p) => {
              setPlace(p);
              setSelectorOpen(false);
            }}
            onClose={() => setSelectorOpen(false)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
