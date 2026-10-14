import { motion } from 'motion/react';
import { PenIcon } from '@solar-icons/react/linear/pen';
import { CloseIcon } from '@solar-icons/react/linear/close';
import { LinkMinimalisticIcon } from '@solar-icons/react/linear/link-minimalistic';
import { SHOPPING_CATEGORY_ICON } from '../data/shoppingCategories.js';
import { IconButton, Toggle, color, radius, spacing } from '../design-system/index.js';

function formatUSD(value) {
  return value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function InfoRow({ label, children }) {
  return (
    <div style={{ padding: '10px 0', borderBottom: `1px solid ${color.border}` }}>
      <div style={{ color: color.muted, fontSize: 11.5, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.3 }}>
        {label}
      </div>
      <div style={{ color: color.dark, fontSize: 14.5, fontWeight: 600, marginTop: 3 }}>
        {children}
      </div>
    </div>
  );
}

// Bottom-sheet de visualização de um item de Compras — aberto ao clicar no
// item da lista (ver ShoppingScreen.jsx), antes da edição propriamente dita.
// Foto grande no topo, dados só de leitura embaixo; o botão de editar (mesmo
// padrão de lápis usado em todo o app) troca para o ShoppingItemModal atual.
export default function ShoppingItemViewModal({ item, onEdit, onClose, onTogglePurchased }) {
  const displayPhoto = item.photo || (item.useLinkImage && item.linkImage) || null;
  const CategoryIcon = SHOPPING_CATEGORY_ICON[item.category];

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
        }}
      >
        <div
          style={{
            position: 'relative',
            width: '100%',
            height: 240,
            flex: 'none',
            overflow: 'hidden',
            background: color.imagePlaceholder,
            borderTopLeftRadius: 24,
            borderTopRightRadius: 24,
          }}
        >
          {displayPhoto && (
            <img src={displayPhoto} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
          )}
          <div style={{ position: 'absolute', top: 14, right: 14, display: 'flex', gap: 8 }}>
            <IconButton icon={PenIcon} onClick={onEdit} />
            <IconButton icon={CloseIcon} onClick={onClose} />
          </div>
        </div>

        <div style={{ padding: '18px 22px calc(22px + env(safe-area-inset-bottom))' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {CategoryIcon && (
              <div style={{ flex: 'none', width: 28, height: 28, borderRadius: 9, background: color.surfaceMuted, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <CategoryIcon size={14} color={color.dark} />
              </div>
            )}
            <div style={{ color: color.muted, fontSize: 12.5, fontWeight: 700 }}>{item.category}</div>
          </div>

          <div
            style={{
              color: color.dark,
              fontSize: 19,
              fontWeight: 800,
              marginTop: 8,
              textDecoration: item.purchased ? 'line-through' : 'none',
            }}
          >
            {item.name}
          </div>

          {item.price != null && (
            <div style={{ color: color.dark, fontSize: 17, fontWeight: 800, marginTop: 4 }}>
              US$ {formatUSD(item.price)}
            </div>
          )}

          <div style={{ marginTop: 14 }}>
            {item.brand && <InfoRow label="Marca">{item.brand}</InfoRow>}
            {item.link && (
              <InfoRow label="Link de referência">
                <a
                  href={item.link}
                  target="_blank"
                  rel="noreferrer"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: 5, color: color.dark, textDecoration: 'none' }}
                >
                  <LinkMinimalisticIcon size={14} color={color.dark} />
                  Ver link
                </a>
              </InfoRow>
            )}
            {item.notes && <InfoRow label="Observação">{item.notes}</InfoRow>}
          </div>

          <div
            style={{
              marginTop: 18,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 10,
              padding: spacing.cardPadding,
              background: color.surfaceMuted,
              borderRadius: radius.card,
            }}
          >
            <div style={{ color: color.dark, fontSize: 14, fontWeight: 700 }}>
              {item.purchased ? 'Comprado' : 'Não comprado'}
            </div>
            <Toggle checked={item.purchased} onChange={onTogglePurchased} />
          </div>
        </div>
      </motion.div>
    </div>
  );
}
