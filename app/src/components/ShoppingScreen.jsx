import { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { AddIcon } from '@solar-icons/react/linear/add';
import { CartLargeMinimalisticIcon } from '@solar-icons/react/bold/cart-large-minimalistic';
import { LinkMinimalisticIcon } from '@solar-icons/react/linear/link-minimalistic';
import { CheckSquareIcon as CheckSquareBoldIcon } from '@solar-icons/react/bold/check-square';
import { Chart2Icon } from '@solar-icons/react/bold/chart-2';
import { BillCheckIcon } from '@solar-icons/react/bold/bill-check';
import { ClipboardListIcon } from '@solar-icons/react/bold/clipboard-list';
import { useScrollY } from '../hooks/useScrollY.js';
import { useElementHeight } from '../hooks/useElementHeight.js';
import { useExchangeRate } from '../hooks/useExchangeRate.js';
import { HamburgerMenuButton } from './HamburgerMenuButton.jsx';
import ShoppingItemModal from './ShoppingItemModal.jsx';
import ShoppingItemViewModal from './ShoppingItemViewModal.jsx';
import { getTravelerIdentity, setTravelerIdentity } from '../hooks/useTravelerIdentity.js';
import { getCachedShoppingItems, setCachedShoppingItems } from '../hooks/useShoppingScreenState.js';
import { showToast, showErrorToast } from '../hooks/useToast.js';
import { fetchShoppingItems, createShoppingItem, updateShoppingItem, deleteShoppingItem, toggleShoppingItemPurchased, uploadPlacePhoto } from '../api/itineraryApi.js';
import { TRAVELERS } from '../data/travelers.js';
import { SHOPPING_CATEGORIES, SHOPPING_CATEGORY_ICON } from '../data/shoppingCategories.js';
import { FixedHeader, FieldLabel, HScrollTabs, Select, Skeleton, color, radius, spacing, type } from '../design-system/index.js';
import { STAGGER_CONTAINER, STAGGER_ITEM } from '../design-system/motionPresets.js';

const SUMMARY_KEY = '__summary__';

// Imposto sobre vendas da Flórida pago no checkout: 6% estadual + 0.5% do
// condado de Orange (onde fica Orlando, destino da viagem) — Miami-Dade usa
// uma alíquota diferente (7%), mas não se aplica aqui.
const FLORIDA_SALES_TAX_RATE = 0.065;

function formatUSD(value) {
  return value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function formatBRL(value) {
  return value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

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
  const [attemptedConfirm, setAttemptedConfirm] = useState(false);

  const handleClick = () => {
    if (selected) onConfirm(selected);
    else setAttemptedConfirm(true);
  };

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
        <FieldLabel error={attemptedConfirm && !selected}>Quem é você?</FieldLabel>
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
        onClick={handleClick}
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

function ShoppingItemCard({ item, onClick, onTogglePurchased }) {
  // Foto enviada manualmente sempre tem prioridade sobre a imagem extraída
  // do link — e a do link só entra em jogo se o toggle "usar imagem do
  // link" estiver ligado (ver ShoppingItemModal.jsx).
  const displayPhoto = item.photo || (item.useLinkImage && item.linkImage) || null;
  const CategoryIcon = SHOPPING_CATEGORY_ICON[item.category];

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
        opacity: item.purchased ? 0.6 : 1,
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
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {displayPhoto ? (
          <img src={displayPhoto} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        ) : (
          CategoryIcon && <CategoryIcon size={20} color={color.faintIcon} />
        )}
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ color: color.dark, fontSize: 14, fontWeight: 700, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', textDecoration: item.purchased ? 'line-through' : 'none' }}>
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

      <div style={{ flex: 'none', display: 'flex', alignItems: 'center', gap: 10 }}>
        {item.price != null && (
          <div style={{ color: color.dark, fontSize: 14, fontWeight: 800 }}>
            US$ {formatUSD(item.price)}
          </div>
        )}
        <div
          onClick={(e) => {
            e.stopPropagation();
            onTogglePurchased();
          }}
          style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}
        >
          {item.purchased ? (
            <CheckSquareBoldIcon size={22} color={color.success} />
          ) : (
            <div style={{ width: 22, height: 22, borderRadius: 7, border: `1.5px solid ${color.border}`, boxSizing: 'border-box' }} />
          )}
        </div>
      </div>
    </div>
  );
}

// Uma linha label (esquerda) + valor (direita) dentro do card de resumo —
// mesmo padrão nas duas linhas (cadastrado/comprado), só muda a cor do
// valor. Ver SummaryCategoryRow e o total geral em ShoppingSummary.
function SummaryStatRow({ label, count, value, valueColor }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0' }}>
      <div style={{ color: color.muted, fontSize: 12.5, fontWeight: 700 }}>{label} ({count})</div>
      <div style={{ color: valueColor, fontSize: 13.5, fontWeight: 800 }}>
        US$ {formatUSD(value)}
      </div>
    </div>
  );
}

// Card de uma categoria no resumo: título com ícone, depois duas linhas
// (cadastrado / comprado) separadas por uma divisória — ver ShoppingSummary.
// Clicável: leva direto pra aba daquela categoria (ver onSelectCategory).
function SummaryCategoryRow({ category, stats, onClick }) {
  const Icon = SHOPPING_CATEGORY_ICON[category];
  return (
    <div
      onClick={onClick}
      style={{ padding: spacing.cardPadding, background: color.bg, border: `1px solid ${color.border}`, borderRadius: 16, cursor: 'pointer' }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
        <div style={{ flex: 'none', width: 32, height: 32, borderRadius: 10, background: color.surfaceMuted, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {Icon && <Icon size={16} color={color.dark} />}
        </div>
        <div style={{ color: color.dark, fontSize: 14.5, fontWeight: 800 }}>{category}</div>
      </div>
      <SummaryStatRow label="Para comprar" count={stats.totalCount} value={stats.totalValue} valueColor={color.dark} />
      <div style={{ height: 1, background: color.border }} />
      <SummaryStatRow label="Comprado" count={stats.purchasedCount} value={stats.purchasedValue} valueColor={color.success} />
    </div>
  );
}

// Aba especial "Resumo" (ver tabItems/SUMMARY_KEY em ShoppingScreen) — uma
// linha por categoria com item cadastrado, cada uma com a contagem e o
// valor total: cadastrado vs já comprado (ver o check no card). No fim, o
// total geral somando todas as categorias.
function ShoppingSummary({ items, onSelectCategory }) {
  const exchangeRate = useExchangeRate();
  const categories = SHOPPING_CATEGORIES.filter((c) => items.some((i) => i.category === c));

  const statsByCategory = categories.map((c) => {
    const inCategory = items.filter((i) => i.category === c);
    const purchased = inCategory.filter((i) => i.purchased);
    return {
      category: c,
      stats: {
        totalCount: inCategory.length,
        totalValue: inCategory.reduce((sum, i) => sum + (i.price || 0), 0),
        purchasedCount: purchased.length,
        purchasedValue: purchased.reduce((sum, i) => sum + (i.price || 0), 0),
      },
    };
  });

  const grandTotal = {
    totalCount: items.length,
    totalValue: items.reduce((sum, i) => sum + (i.price || 0), 0),
    purchasedCount: items.filter((i) => i.purchased).length,
    purchasedValue: items.filter((i) => i.purchased).reduce((sum, i) => sum + (i.price || 0), 0),
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {statsByCategory.map(({ category, stats }) => (
        <SummaryCategoryRow key={category} category={category} stats={stats} onClick={() => onSelectCategory(category)} />
      ))}

      <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
        <GrandTotalCard
          icon={ClipboardListIcon}
          label={`Para comprar (${grandTotal.totalCount})`}
          value={grandTotal.totalValue}
          exchangeRate={exchangeRate}
          background={color.surfaceMuted}
          labelColor={color.muted}
          valueColor={color.dark}
          mutedColor={color.muted}
        />
        <GrandTotalCard
          icon={BillCheckIcon}
          label={`Comprado (${grandTotal.purchasedCount})`}
          value={grandTotal.purchasedValue}
          exchangeRate={exchangeRate}
          background={color.success}
          labelColor="rgba(255,255,255,0.8)"
          valueColor="#fff"
          mutedColor="rgba(255,255,255,0.75)"
        />
      </div>
    </div>
  );
}

// Um dos dois cards finais do Resumo (Para comprar / Comprado): ícone,
// label com contagem, valor em USD e, em letra menor, a taxa da Flórida
// (imposto embutido no checkout) e a conversão em real — pra dar a noção do
// valor total que de fato sai do bolso, não só o preço anunciado do produto.
function GrandTotalCard({ icon: Icon, label, value, exchangeRate, background, labelColor, valueColor, mutedColor }) {
  const tax = value * FLORIDA_SALES_TAX_RATE;
  const totalWithTax = value + tax;
  return (
    <div style={{ flex: 1, padding: spacing.cardPadding, background, borderRadius: 16 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
        <Icon size={14} color={labelColor} />
        <div style={{ color: labelColor, fontSize: 12, fontWeight: 700 }}>{label}</div>
      </div>
      <div style={{ color: valueColor, fontSize: 19, fontWeight: 800 }}>
        🇺🇸 US$ {formatUSD(value)}
      </div>
      <div style={{ color: mutedColor, fontSize: 10.5, fontWeight: 600, marginTop: 4 }}>
        Taxa: US$ {formatUSD(tax)} ({(FLORIDA_SALES_TAX_RATE * 100).toFixed(1)}%)
      </div>
      {exchangeRate != null && (
        <div style={{ color: valueColor, fontSize: 15, fontWeight: 800, marginTop: 4 }}>
          🇧🇷 R$ {formatBRL(totalWithTax * exchangeRate)}
        </div>
      )}
    </div>
  );
}

export default function ShoppingScreen() {
  const { scrollY, anchorRef } = useScrollY();
  const { ref: headerRef, height: headerHeight } = useElementHeight();

  // Select do header troca a identidade de verdade (quem você é neste
  // aparelho) — mesmo mecanismo usado no select da tela Mais (ver
  // MoreScreen.jsx) e no onboarding (WhoAreYouStep.jsx): não é uma
  // visualização temporária separada, é a mesma fonte de verdade em
  // localStorage (useTravelerIdentity.js). Trocar aqui também muda o que
  // aparece em Mais, e vice-versa.
  const [identity, setIdentity] = useState(() => getTravelerIdentity());
  const [category, setCategory] = useState(SUMMARY_KEY);
  // Mostra a última lista conhecida (localStorage) instantaneamente, mesmo
  // sem internet, enquanto o fetch atualiza em segundo plano — mesmo padrão
  // de Lugares/Atrações/Roteiro (ver useShoppingScreenState.js).
  const [items, setItems] = useState(() => getCachedShoppingItems(getTravelerIdentity()));
  const [editingItem, setEditingItem] = useState(null); // item sendo editado, ou 'new' pra criar
  const [viewingItem, setViewingItem] = useState(null); // item aberto em modo visualização (antes de editar, ver ShoppingItemViewModal)
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!identity) return;
    const cached = getCachedShoppingItems(identity);
    setItems(cached);
    if (cached) setCategory(fallbackCategory(cached));
    fetchShoppingItems(identity)
      .then((data) => {
        setItems(data);
        setCachedShoppingItems(identity, data);
        // Troca de lista (viajante diferente) sempre abre no Resumo, se
        // houver qualquer item — mais simples do que tentar preservar a
        // aba selecionada entre listas que não têm as mesmas categorias.
        setCategory(fallbackCategory(data));
      })
      .catch((err) => showErrorToast(err, 'Não foi possível carregar a lista.'));
  }, [identity]);

  // Mantém o cache em sincronia com qualquer mutação local (criar, editar,
  // remover, marcar como comprado), não só o fetch inicial — assim a lista
  // reaberta offline já reflete a última alteração feita.
  useEffect(() => {
    if (identity && items) setCachedShoppingItems(identity, items);
  }, [identity, items]);

  const handleChangeIdentity = (name) => {
    setTravelerIdentity(name);
    setIdentity(name);
  };

  const isSummary = category === SUMMARY_KEY;
  const itemsInCategory = useMemo(
    () => (isSummary ? [] : (items || []).filter((i) => i.category === category)),
    [items, category, isSummary]
  );
  const totalInCategory = useMemo(
    () => itemsInCategory.reduce((sum, i) => sum + (i.price || 0), 0),
    [itemsInCategory]
  );

  // Só mostra como aba a categoria que tiver pelo menos 1 item — nada de
  // listar as 7 categorias fixas sempre, a maioria vazia pra maioria das
  // listas (cada viajante só usa algumas). "Resumo" é uma aba especial,
  // sempre em primeiro lugar e só com ícone (sem label/contador) — existe
  // assim que há pelo menos 1 item cadastrado, de qualquer categoria.
  const categoriesWithItems = SHOPPING_CATEGORIES.filter(
    (c) => (items || []).some((i) => i.category === c)
  );
  const hasAnyItem = (items || []).length > 0;
  const tabItems = [
    ...(hasAnyItem ? [{ key: SUMMARY_KEY, label: '', icon: Chart2Icon }] : []),
    ...categoriesWithItems.map((c) => ({
      key: c,
      label: c,
      icon: SHOPPING_CATEGORY_ICON[c],
      count: (items || []).filter((i) => i.category === c).length || undefined,
    })),
  ];

  // Primeira categoria "de verdade" com item — usada como fallback sempre
  // que a aba atual deixa de existir (ver os 3 pontos que chamam isso:
  // fetch inicial, salvar e remover item). Prioriza Resumo quando há
  // qualquer item, senão cai pra primeira categoria com conteúdo.
  function fallbackCategory(itemsList) {
    if (itemsList.length > 0) return SUMMARY_KEY;
    return SHOPPING_CATEGORIES[0];
  }

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
        setItems((current) => {
          const next = current.map((i) => (i.id === editingItem.id ? { ...i, ...fields, photo } : i));
          // Editar pode ter mudado a categoria do item pra outra, esvaziando
          // a aba que estava aberta — mesmo fallback do handleDeleteItem.
          const stillHasCurrentCategory = next.some((i) => i.category === category);
          if (!stillHasCurrentCategory) {
            const withItems = SHOPPING_CATEGORIES.filter((c) => next.some((i) => i.category === c));
            setCategory(withItems[0] || SHOPPING_CATEGORIES[0]);
          }
          return next;
        });
        showToast('Item atualizado');
      } else {
        const created = await createShoppingItem({ ...fields, photo, photoFile: undefined, traveler: identity });
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
      setItems((current) => {
        const next = current.filter((i) => i.id !== editingItem.id);
        // Se esse era o último item da categoria aberta, a aba dela some —
        // cai pra primeira categoria que ainda tiver algo (ou volta ao
        // padrão se a lista ficou totalmente vazia).
        const stillHasCurrentCategory = next.some((i) => i.category === category);
        if (!stillHasCurrentCategory) {
          const withItems = SHOPPING_CATEGORIES.filter((c) => next.some((i) => i.category === c));
          setCategory(withItems[0] || SHOPPING_CATEGORIES[0]);
        }
        return next;
      });
      setEditingItem(null);
      showToast('Item removido');
    } catch (err) {
      showErrorToast(err, 'Não foi possível remover o item.');
    }
  };

  // Atualização otimista — risca/desmarca na hora, sem esperar a resposta
  // do servidor; reverte sozinho se a chamada falhar. É um toggle rápido
  // (ver o check no card), não justifica o delay de esperar a rede.
  const handleTogglePurchased = async (item) => {
    const nextPurchased = !item.purchased;
    setItems((current) => current.map((i) => (i.id === item.id ? { ...i, purchased: nextPurchased } : i)));
    setViewingItem((current) => (current && current.id === item.id ? { ...current, purchased: nextPurchased } : current));
    try {
      await toggleShoppingItemPurchased(item.id, nextPurchased);
    } catch (err) {
      setItems((current) => current.map((i) => (i.id === item.id ? { ...i, purchased: item.purchased } : i)));
      setViewingItem((current) => (current && current.id === item.id ? { ...current, purchased: item.purchased } : current));
      showErrorToast(err, 'Não foi possível atualizar o item.');
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
            <>
              <Select
                value={identity}
                onChange={handleChangeIdentity}
                options={TRAVELERS.map(travelerOption)}
                align="right"
                buttonStyle={{ padding: '7px 10px', fontSize: 12.5 }}
              />
              <div
                onClick={() => setEditingItem('new')}
                style={{ height: 38, width: 38, flex: 'none', borderRadius: 13, background: color.surfaceMuted, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
              >
                <AddIcon size={18} color={color.dark} />
              </div>
            </>
          )
        }
        tabs={identity && <HScrollTabs items={tabItems} activeKey={category} onSelect={setCategory} instanceId="shopping" style={{ marginTop: 0, padding: `0 ${spacing.screenGutter}px` }} />}
      />

      {!identity ? (
        <div style={{ marginTop: headerHeight }}>
          <WhoAreYouContent onConfirm={handleChangeIdentity} />
        </div>
      ) : (
        <motion.div
          // key muda ao trocar de categoria (aba) ou ao sair do estado "sem
          // dado ainda" pela primeira vez — ver mesmo padrão em
          // ScheduleScreen.jsx.
          key={items === null ? 'skeleton' : `category-${category}`}
          variants={STAGGER_CONTAINER}
          initial="hidden"
          animate="show"
          style={{ marginTop: headerHeight + spacing.controlGap, boxSizing: 'border-box', padding: `2px ${spacing.screenGutter}px 120px` }}
        >
          {items === null && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} height={72} radius={16} />
              ))}
            </div>
          )}

          {items !== null && isSummary && (
            <motion.div variants={STAGGER_ITEM}>
              <ShoppingSummary items={items} onSelectCategory={setCategory} />
            </motion.div>
          )}

          {items !== null && !isSummary && itemsInCategory.length > 0 && (
            <motion.div variants={STAGGER_ITEM}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.controlGap }}>
                <div style={{ color: color.muted, fontSize: 12.5, fontWeight: 700 }}>{itemsInCategory.length} item(ns)</div>
                <div style={{ color: color.dark, fontSize: 14, fontWeight: 800 }}>Total: US$ {formatUSD(totalInCategory)}</div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {itemsInCategory.map((item) => (
                  <ShoppingItemCard
                    key={item.id}
                    item={item}
                    onClick={() => setViewingItem(item)}
                    onTogglePurchased={() => handleTogglePurchased(item)}
                  />
                ))}
              </div>
            </motion.div>
          )}

          {items !== null && !isSummary && itemsInCategory.length === 0 && (
            <div style={{ padding: '40px 0', textAlign: 'center' }}>
              <div style={{ color: color.faint, fontSize: 13.5, fontWeight: 600, marginBottom: spacing.gapMd }}>Nenhum item na sua lista ainda.</div>
              <div
                onClick={() => setEditingItem('new')}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '12px 22px',
                  borderRadius: radius.button,
                  background: color.dark,
                  color: '#fff',
                  fontSize: 13.5,
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                <AddIcon size={15} color="#fff" />
                Adicionar item
              </div>
            </div>
          )}
        </motion.div>
      )}

      <AnimatePresence>
        {viewingItem && (
          <ShoppingItemViewModal
            key="shopping-item-view-modal"
            item={viewingItem}
            onEdit={() => {
              setEditingItem(viewingItem);
              setViewingItem(null);
            }}
            onClose={() => setViewingItem(null)}
            onTogglePurchased={() => handleTogglePurchased(viewingItem)}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {editingItem && (
          <ShoppingItemModal
            key="shopping-item-modal"
            initialValues={editingItem !== 'new' ? editingItem : null}
            initialCategory={isSummary ? SHOPPING_CATEGORIES[0] : category}
            onSubmit={handleSaveItem}
            onDelete={editingItem !== 'new' ? handleDeleteItem : undefined}
            onClose={() => !saving && setEditingItem(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
