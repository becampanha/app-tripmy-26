import { useDragScroll } from '../hooks/useDragScroll.js';
import { color, radius, spacing, type } from './tokens.js';

// Tabs de scroll horizontal com chip retangular ativo/inativo — padrão usado
// para categorias de Lugares, parques de Atrações e o seletor de categoria
// do modal de vincular lugar. Cada item: { key, label, icon?: Component, count? }.
export default function HScrollTabs({ items, activeKey, onSelect, loading, loadingCount = 3, style }) {
  const { scrollerRef, dragRef, dragHandlers } = useDragScroll();

  return (
    <div
      ref={scrollerRef}
      {...dragHandlers}
      style={{
        display: 'flex',
        gap: spacing.gapMd,
        overflowX: 'auto',
        marginTop: spacing.controlGap,
        padding: '2px 2px 6px',
        WebkitOverflowScrolling: 'touch',
        cursor: 'grab',
        userSelect: 'none',
        ...style,
      }}
    >
      {loading && items.length === 0 && Array.from({ length: loadingCount }).map((_, i) => (
        <div
          key={i}
          style={{ flex: 'none', width: 120, height: 36, borderRadius: radius.chip, background: color.surfaceMuted, animation: 'pulse 1.2s ease-in-out infinite' }}
        />
      ))}

      {items.map((item) => {
        const active = item.key === activeKey;
        const Icon = item.icon;
        return (
          <div
            key={item.key}
            onClick={() => {
              if (dragRef.current && dragRef.current.moved) return;
              onSelect(item.key);
            }}
            style={{
              flex: 'none',
              display: 'flex',
              alignItems: 'center',
              gap: spacing.gapSm,
              padding: `${spacing.gapMd}px 16px`,
              borderRadius: radius.chip,
              ...type.chip,
              cursor: 'pointer',
              userSelect: 'none',
              background: active ? color.dark : color.surfaceMuted,
              color: active ? color.white : color.mutedDeep,
            }}
          >
            {Icon && <Icon size={15} color={active ? color.white : (item.iconColor || color.mutedDeep)} />}
            {item.emoji && <span>{item.emoji}</span>}
            {item.label}
            {item.count != null && <span style={{ opacity: 0.7 }}>({item.count})</span>}
          </div>
        );
      })}
    </div>
  );
}
