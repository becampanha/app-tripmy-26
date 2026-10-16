import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'motion/react';
import { ArrowLeftIcon } from '@solar-icons/react/linear/arrow-left';
import { AddIcon } from '@solar-icons/react/linear/add';
import { AltArrowRightIcon } from '@solar-icons/react/linear/alt-arrow-right';
import { MapPointIcon } from '@solar-icons/react/bold/map-point';
import AreaEditModal from './AreaEditModal.jsx';
import { createArea, renameArea, deleteArea } from '../api/itineraryApi.js';
import { showErrorToast, showToast } from '../hooks/useToast.js';
import { useAreasData } from '../hooks/useAreasData.js';
import { useScrollY } from '../hooks/useScrollY.js';
import { useElementHeight } from '../hooks/useElementHeight.js';
import { FixedHeader, HScrollTabs, Skeleton, color, radius, spacing } from '../design-system/index.js';
import { STAGGER_CONTAINER, STAGGER_ITEM } from '../design-system/motionPresets.js';
import { useStaggerKey } from '../hooks/useActiveScreen.js';

// Mesmas 10 categorias de PlacesScreen.jsx — cada uma tem sua própria lista
// independente de áreas (ver place_areas no banco).
const CATEGORIES = ['Restaurante', 'Mercado', 'Centros', 'Outlets', 'Shopping', 'Loja', 'Parque', 'Hotel', 'Aeroporto', 'Outro'];
const CATEGORY_LABELS = {
  Restaurante: 'Restaurantes',
  Mercado: 'Mercados',
  Centros: 'Centros',
  Outlets: 'Outlets',
  Shopping: 'Shopping',
  Loja: 'Lojas',
  Parque: 'Parques',
  Hotel: 'Hotéis',
  Aeroporto: 'Aeroportos',
  Outro: 'Outros',
};

export default function PlaceAreasConfigScreen() {
  const navigate = useNavigate();
  const { areasByCategory, setAreasByCategory, loading } = useAreasData();
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [editingArea, setEditingArea] = useState(null); // null = fechado; 'new' = criando; objeto = editando
  const { scrollY, anchorRef } = useScrollY();
  const { ref: headerRef, height: headerHeight } = useElementHeight();
  const staggerKey = useStaggerKey();

  const areas = areasByCategory[category] || [];
  const tabItems = CATEGORIES.map((cat) => ({ key: cat, label: CATEGORY_LABELS[cat] || cat }));

  const handleSave = async (name) => {
    try {
      if (editingArea === 'new') {
        const created = await createArea(category, name);
        setAreasByCategory((current) => ({
          ...current,
          [category]: [...(current[category] || []), { id: created.id, name }],
        }));
        showToast('Área criada.');
      } else {
        await renameArea(editingArea.id, name);
        setAreasByCategory((current) => ({
          ...current,
          [category]: (current[category] || []).map((a) => (a.id === editingArea.id ? { ...a, name } : a)),
        }));
        showToast('Área atualizada.');
      }
      setEditingArea(null);
    } catch (err) {
      showErrorToast(err, 'Não foi possível salvar a área.');
    }
  };

  const handleDelete = async () => {
    try {
      await deleteArea(editingArea.id);
      setAreasByCategory((current) => ({
        ...current,
        [category]: (current[category] || []).filter((a) => a.id !== editingArea.id),
      }));
      showToast('Área removida.');
      setEditingArea(null);
    } catch (err) {
      showErrorToast(err, 'Não foi possível remover a área.');
    }
  };

  return (
    <div ref={anchorRef} style={{ position: 'relative', width: '100%', minHeight: '100dvh', background: color.bg, boxSizing: 'border-box' }}>
      <FixedHeader
        headerRef={headerRef}
        scrollY={scrollY}
        title="Áreas de lugares"
        left={
          <div
            onClick={() => navigate(-1)}
            style={{ width: 38, height: 38, borderRadius: 13, background: color.surfaceMuted, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
          >
            <ArrowLeftIcon size={19} color={color.dark} />
          </div>
        }
        tabs={
          <HScrollTabs
            items={tabItems}
            activeKey={category}
            onSelect={setCategory}
            instanceId="place-areas-config"
            style={{ marginTop: 0, padding: `0 ${spacing.screenGutter}px` }}
          />
        }
        right={
          <div
            onClick={() => setEditingArea('new')}
            style={{ width: 38, height: 38, borderRadius: 13, background: color.surfaceMuted, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
          >
            <AddIcon size={17} color={color.dark} />
          </div>
        }
      />

      <motion.div
        // key muda ao trocar de categoria (aba) ou ao sair do estado "sem
        // dado ainda" pela primeira vez — ver mesmo padrão em
        // ScheduleScreen.jsx.
        key={`${staggerKey}-${loading && areas.length === 0 ? 'skeleton' : `category-${category}`}`}
        variants={STAGGER_CONTAINER}
        initial="hidden"
        animate="show"
        style={{ marginTop: headerHeight + spacing.controlGap, boxSizing: 'border-box', padding: `2px ${spacing.screenGutter}px 120px` }}
      >
        {loading && areas.length === 0 && Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} height={56} radius={18} style={{ marginBottom: 10 }} />
        ))}

        {!loading && areas.length === 0 && (
          <div style={{ padding: '30px 0', textAlign: 'center', color: color.faint, fontSize: 13.5, fontWeight: 600 }}>
            Nenhuma área cadastrada nessa categoria ainda.
          </div>
        )}

        {areas.map((area) => (
          <motion.div
            key={area.id}
            variants={STAGGER_ITEM}
            onClick={() => setEditingArea(area)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              padding: spacing.cardPadding,
              background: color.bg,
              border: `1px solid ${color.border}`,
              borderRadius: 18,
              marginBottom: 10,
              cursor: 'pointer',
            }}
          >
            <div
              style={{
                flex: 'none',
                width: 32,
                height: 32,
                borderRadius: 10,
                background: color.surfaceMuted,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <MapPointIcon size={16} color={color.dark} />
            </div>
            <div style={{ flex: 1, minWidth: 0, color: color.dark, fontSize: 14.5, fontWeight: 700, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {area.name}
            </div>
            <AltArrowRightIcon size={16} color={color.muted} />
          </motion.div>
        ))}
      </motion.div>

      <AnimatePresence>
        {editingArea && (
          <AreaEditModal
            key="area-edit"
            area={editingArea === 'new' ? null : editingArea}
            onSave={handleSave}
            onDelete={handleDelete}
            onClose={() => setEditingArea(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
