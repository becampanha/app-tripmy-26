import { useState } from 'react';
import { motion } from 'motion/react';
import { CloseIcon } from '@solar-icons/react/linear/close';
import { CameraMinimalisticIcon } from '@solar-icons/react/linear/camera-minimalistic';
import { useHidesTabBar } from '../hooks/useEditingState.js';
import { SHOPPING_CATEGORIES } from '../data/shoppingCategories.js';
import { FieldLabel, Select, color, inputStyle, radius } from '../design-system/index.js';

// Bottom sheet de criar/editar um item da lista de compras — mesmo padrão
// visual de RecommendationModal.jsx. `initialValues` presente = modo edição
// (pré-preenche os campos); ausente = criação, categoria inicial vem de
// `initialCategory` (a aba em que o usuário estava quando clicou "+").
export default function ShoppingItemModal({ initialValues, initialCategory, onSubmit, onDelete, onClose }) {
  const [category, setCategory] = useState(initialValues?.category || initialCategory || SHOPPING_CATEGORIES[0]);
  const [name, setName] = useState(initialValues?.name || '');
  const [brand, setBrand] = useState(initialValues?.brand || '');
  const [link, setLink] = useState(initialValues?.link || '');
  const [price, setPrice] = useState(initialValues?.price ?? '');
  const [notes, setNotes] = useState(initialValues?.notes || '');
  const [photoFile, setPhotoFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(initialValues?.photo || null);
  const [saving, setSaving] = useState(false);

  useHidesTabBar(true);

  const handlePickPhoto = (file) => {
    if (!file) return;
    setPhotoFile(file);
    setPhotoPreview(URL.createObjectURL(file));
  };

  const canSave = name.trim().length > 0 && !saving;

  const handleSave = async () => {
    if (!canSave) return;
    setSaving(true);
    try {
      await onSubmit({
        category,
        name: name.trim(),
        brand: brand.trim() || null,
        link: link.trim() || null,
        price: price === '' ? null : Number(price),
        notes: notes.trim() || null,
        photoFile,
      });
    } finally {
      setSaving(false);
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
          <div style={{ fontSize: 18, fontWeight: 800, color: '#1c1a17' }}>
            {initialValues ? 'Editar item' : 'Novo item'}
          </div>
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
          <FieldLabel>Categoria</FieldLabel>
          <div style={{ marginTop: 5 }}>
            <Select
              value={category}
              onChange={setCategory}
              options={SHOPPING_CATEGORIES}
              fullWidth
            />
          </div>
        </div>

        <div style={{ marginTop: 14 }}>
          <FieldLabel>Produto</FieldLabel>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Ex: Tênis Nike Air Max"
            style={{ ...inputStyle, marginTop: 5 }}
          />
        </div>

        <div style={{ marginTop: 14 }}>
          <FieldLabel>Marca (opcional)</FieldLabel>
          <input
            value={brand}
            onChange={(e) => setBrand(e.target.value)}
            placeholder="Ex: Nike"
            style={{ ...inputStyle, marginTop: 5 }}
          />
        </div>

        <div style={{ marginTop: 14, display: 'flex', gap: 10 }}>
          <div style={{ flex: 1 }}>
            <FieldLabel>Valor (US$, opcional)</FieldLabel>
            <input
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              type="number"
              placeholder="0"
              style={{ ...inputStyle, marginTop: 5 }}
            />
          </div>
          <div style={{ flex: 2 }}>
            <FieldLabel>Link de referência (opcional)</FieldLabel>
            <input
              value={link}
              onChange={(e) => setLink(e.target.value)}
              placeholder="https://..."
              style={{ ...inputStyle, marginTop: 5 }}
            />
          </div>
        </div>

        <div style={{ marginTop: 14 }}>
          <FieldLabel>Observação (opcional)</FieldLabel>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Ex: Comprar no tamanho M"
            rows={2}
            style={{ ...inputStyle, marginTop: 5, resize: 'vertical', fontFamily: 'inherit' }}
          />
        </div>

        <div style={{ marginTop: 14 }}>
          <FieldLabel>Foto (opcional)</FieldLabel>
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
              {photoFile || photoPreview ? 'Trocar foto' : 'Adicionar foto'}
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
          onClick={handleSave}
          style={{
            marginTop: 20,
            padding: 14,
            borderRadius: 16,
            background: canSave ? '#1c1a17' : '#e2ddd2',
            color: '#fff',
            textAlign: 'center',
            fontSize: 14.5,
            fontWeight: 700,
            cursor: canSave ? 'pointer' : 'default',
          }}
        >
          {saving ? 'Salvando...' : 'Salvar'}
        </div>

        {onDelete && (
          <div
            onClick={onDelete}
            style={{
              marginTop: 10,
              padding: 14,
              borderRadius: 16,
              textAlign: 'center',
              fontSize: 14.5,
              fontWeight: 700,
              color: color.danger,
              cursor: 'pointer',
            }}
          >
            Remover item
          </div>
        )}
      </motion.div>
    </div>
  );
}
