import { useEffect, useMemo, useState } from 'react';
import { AnimatePresence } from 'motion/react';
import { AddIcon } from '@solar-icons/react/linear/add';
import { CartLargeMinimalisticIcon } from '@solar-icons/react/bold/cart-large-minimalistic';
import { LinkMinimalisticIcon } from '@solar-icons/react/linear/link-minimalistic';
import { useScrollY } from '../hooks/useScrollY.js';
import { useElementHeight } from '../hooks/useElementHeight.js';
import { HamburgerMenuButton } from './HamburgerMenuButton.jsx';
import ShoppingItemModal from './ShoppingItemModal.jsx';
import { getTravelerIdentity, setTravelerIdentity } from '../hooks/useTravelerIdentity.js';
import { showToast, showErrorToast } from '../hooks/useToast.js';
import { fetchShoppingItems, createShoppingItem, updateShoppingItem, deleteShoppingItem, uploadPlacePhoto } from '../api/itineraryApi.js';
import { TRAVELERS } from '../data/travelers.js';
import { SHOPPING_CATEGORIES } from '../data/shoppingCategories.js';
import { FixedHeader, FieldLabel, HScrollTabs, Select, Skeleton, color, radius, spacing, type } from '../design-system/index.js';

function travelerOption(t) {
  return { value: t.name, label: `${t.emoji} ${t.name}` };
}

// Conteúdo de introdução — pede "quem é você" antes de mostrar qualquer
// lista, na primeira vez que esta aba é aberta neste aparelho (ver
// useTravelerIdentity.js). Sem login: uma vez escolhido, fica salvo só
// neste aparelho; reinstalar o PWA esquece e pergunta de novo. Só o
// CONTEÚDO abaixo do FixedHeader (que a tela renderiza sempre, ver
// ShoppingScreen) — não a tela inteira, pra manter o mesmo cabeçalho
// (título + hambúrguer + scroll) das demais telas raiz.
function WhoAreYouContent({ onConfirm }) {
  const [selected, setSelected] = useState('');

  return (
    <div
      style={{
        minHeight: '60dvh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: spacing.gapMd,
        padding: spacing.screenGutter,
        textAlign: 'center',
        boxSizing: 'border-box',
      }}
    >
      <div
        style={{
          width: 56,
          height: 56,
          borderRadius: 18,
          background: color.surfaceMuted,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <CartLargeMinimalisticIcon size={26} color={color.dark} />
      </div>
      <div style={{ ...type.paragraph, color: color.muted, maxWidth: 280 }}>
        Organize o que você quer comprar na viagem, com link, preço e foto de cada produto — tudo salvo na sua lista pessoal.
      </div>

      <div style={{ marginTop: spacing.gapMd, width: '100%', maxWidth: 260, textAlign: 'left' }}>
        <FieldLabel>Quem é você?</FieldLabel>
        <div style={{ marginTop: 5 }}>
          <Select
            value={selected}
            onChange={setSelected}
            options={TRAVELERS.map(travelerOption)}
            placeholder="Selecione seu nome"
            fullWidth
          />
        </div>
      </div>

      <div
        onClick={() => selected && onConfirm(selected)}
        style={{
          marginTop: spacing.gapMd,
          padding: '12px 28px',
          borderRadius: radius.button,
          background: selected ? color.dark : color.toggleOff,
          color: '#fff',
          fontSize: 14.5,
          fontWeight: 700,
          cursor: selected ? 'pointer' : 'default',
        }}
      >
        Criar minha lista
      </div>
    </div>
  );
}

function ShoppingItemCard({ item, onClick }) {
  return (
    <div
      onClick={onClick}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        padding: spacing.cardPadding,
        background: color.bg,
        border: `1px solid ${color.border}`,
        borderRadius: 16,
        cursor: 'pointer',
      }}
    >
      <div
        style={{
          flex: 'none',
          width: 48,
          height: 48,
          borderRadius: 12,
          overflow: 'hidden',
          background: color.imagePlaceholder,
        }}
      >
        {item.photo && <img src={item.photo} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />}
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ color: color.dark, fontSize: 14, fontWeight: 700, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {item.name}
        </div>
        {item.brand && (
          <div style={{ color: color.muted, fontSize: 12, fontWeight: 600, marginTop: 1 }}>{item.brand}</div>
        )}
        {item.link && (
          <a
            href={item.link}
            target="_blank"
            rel="noreferrer"
            onClick={(e) => e.stopPropagation()}
            style={{ display: 'inline-flex', alignItems: 'center', gap: 3, marginTop: 3, color: color.dark, fontSize: 11.5, fontWeight: 700, textDecoration: 'none' }}
          >
            <LinkMinimalisticIcon size={11} color={color.dark} />
            Ver link
          </a>
        )}
      </div>

      {item.price != null && (
        <div style={{ flex: 'none', color: color.dark, fontSize: 14, fontWeight: 800 }}>
          US$ {item.price}
        </div>
      )}
    </div>
  );
}

export default function ShoppingScreen() {
  const { scrollY, anchorRef } = useScrollY();
  const { ref: headerRef, height: headerHeight } = useElementHeight();

  const [identity, setIdentity] = useState(() => getTravelerIdentity());
  // Viajante cuja lista está sendo VISTA agora — separado da identidade
  // salva no aparelho: trocar aqui é só navegação temporária (ver conversa
  // de design da feature), não redefine quem o dropdown considera "você".
  const [viewingTraveler, setViewingTraveler] = useState(identity);
  const [category, setCategory] = useState(SHOPPING_CATEGORIES[0]);
  const [items, setItems] = useState(null);
  const [editingItem, setEditingItem] = useState(null); // item sendo editado, ou 'new' pra criar
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!viewingTraveler) return;
    setItems(null);
    fetchShoppingItems(viewingTraveler)
      .then(setItems)
      .catch((err) => showErrorToast(err, 'Não foi possível carregar a lista.'));
  }, [viewingTraveler]);

  const handleConfirmIdentity = (name) => {
    setTravelerIdentity(name);
    setIdentity(name);
    setViewingTraveler(name);
  };

  const itemsInCategory = useMemo(
    () => (items || []).filter((i) => i.category === category),
    [items, category]
  );
  const totalInCategory = useMemo(
    () => itemsInCategory.reduce((sum, i) => sum + (i.price || 0), 0),
    [itemsInCategory]
  );

  const tabItems = SHOPPING_CATEGORIES.map((c) => ({
    key: c,
    label: c,
    count: (items || []).filter((i) => i.category === c).length || undefined,
  }));

  const handleSaveItem = async (fields) => {
    setSaving(true);
    try {
      let photo = editingItem?.photo || null;
      if (fields.photoFile) {
        const uploaded = await uploadPlacePhoto(fields.photoFile);
        photo = uploaded.url;
      }

      if (editingItem && editingItem !== 'new') {
        await updateShoppingItem(editingItem.id, { ...fields, photo, photoFile: undefined });
        setItems((current) => current.map((i) => (i.id === editingItem.id ? { ...i, ...fields, photo } : i)));
        showToast('Item atualizado');
      } else {
        const created = await createShoppingItem({ ...fields, photo, photoFile: undefined, traveler: viewingTraveler });
        setItems((current) => [created, ...(current || [])]);
        showToast('Item adicionado');
      }
      setEditingItem(null);
    } catch (err) {
      showErrorToast(err, 'Não foi possível salvar o item.');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteItem = async () => {
    if (!editingItem || editingItem === 'new') return;
    try {
      await deleteShoppingItem(editingItem.id);
      setItems((current) => current.filter((i) => i.id !== editingItem.id));
      setEditingItem(null);
      showToast('Item removido');
    } catch (err) {
      showErrorToast(err, 'Não foi possível remover o item.');
    }
  };

  return (
    <div ref={anchorRef} style={{ position: 'relative', width: '100%', minHeight: '100dvh', background: color.bg, boxSizing: 'border-box' }}>
      <FixedHeader
        headerRef={headerRef}
        scrollY={scrollY}
        title="Compras"
        left={<HamburgerMenuButton />}
        right={
          identity && (
            <div
              onClick={() => setEditingItem('new')}
              style={{ height: 38, width: 38, borderRadius: 13, background: color.surfaceMuted, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
            >
              <AddIcon size={18} color={color.dark} />
            </div>
          )
        }
        tabs={identity && <HScrollTabs items={tabItems} activeKey={category} onSelect={setCategory} style={{ marginTop: 0, padding: `0 ${spacing.screenGutter}px` }} />}
      />

      {!identity ? (
        <div style={{ marginTop: headerHeight }}>
          <WhoAreYouContent onConfirm={handleConfirmIdentity} />
        </div>
      ) : (
        <div style={{ marginTop: headerHeight + spacing.controlGap, boxSizing: 'border-box', padding: `2px ${spacing.screenGutter}px 40px` }}>
          <div style={{ marginBottom: spacing.controlGap }}>
            <Select
              value={viewingTraveler}
              onChange={setViewingTraveler}
              options={TRAVELERS.map(travelerOption)}
              fullWidth
            />
          </div>

          {items === null && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} height={72} radius={16} />
              ))}
            </div>
          )}

          {items !== null && itemsInCategory.length > 0 && (
            <>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.controlGap }}>
                <div style={{ color: color.muted, fontSize: 12.5, fontWeight: 700 }}>{itemsInCategory.length} item(ns)</div>
                <div style={{ color: color.dark, fontSize: 14, fontWeight: 800 }}>Total: US$ {totalInCategory.toFixed(2)}</div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {itemsInCategory.map((item) => (
                  <ShoppingItemCard key={item.id} item={item} onClick={() => setEditingItem(item)} />
                ))}
              </div>
            </>
          )}

          {items !== null && itemsInCategory.length === 0 && (
            <div style={{ padding: '40px 0', textAlign: 'center' }}>
              <div style={{ color: color.faint, fontSize: 13.5, fontWeight: 600 }}>Nenhum item na sua lista ainda.</div>
              <div
                onClick={() => setEditingItem('new')}
                style={{ marginTop: 12, display: 'inline-flex', alignItems: 'center', gap: 6, color: color.dark, fontSize: 13.5, fontWeight: 700, cursor: 'pointer' }}
              >
                <AddIcon size={15} color={color.dark} />
                Adicionar item
              </div>
            </div>
          )}
        </div>
      )}

      <AnimatePresence>
        {editingItem && (
          <ShoppingItemModal
            key="shopping-item-modal"
            initialValues={editingItem !== 'new' ? editingItem : null}
            initialCategory={category}
            onSubmit={handleSaveItem}
            onDelete={editingItem !== 'new' ? handleDeleteItem : undefined}
            onClose={() => !saving && setEditingItem(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
