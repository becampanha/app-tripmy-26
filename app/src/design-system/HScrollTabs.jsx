import { useEffect, useRef } from 'react';
import { motion } from 'motion/react';
import { useDragScroll } from '../hooks/useDragScroll.js';
import { color, radius, spacing, type } from './tokens.js';

// Tabs de scroll horizontal com chip retangular ativo/inativo — padrão usado
// para categorias de Lugares, parques de Atrações e o seletor de categoria
// do modal de vincular lugar. Cada item: { key, label, icon?: Component, count? }.
// `instanceId` (opcional, default por propósito de cada chamador que precisa
// ser único): algumas telas montam duas instâncias de HScrollTabs ao mesmo
// tempo (ex: AttractionsScreen + ParkMap aberto por cima, PlacesScreen +
// PlacesMap) — sem um layoutId diferente por instância, o Motion tentaria
// animar o indicador ativo como se fosse o MESMO elemento voando entre essas
// duas árvores não relacionadas (mesmo cuidado já tomado em DayTabs.jsx).
export default function HScrollTabs({ items, activeKey, onSelect, loading, loadingCount = 3, style, instanceId = 'default' }) {
  const { scrollerRef, dragRef, dragHandlers } = useDragScroll();
  const activeRef = useRef(null);

  // Este componente costuma ser renderizado em paralelo em dois lugares
  // (título normal da tela + dentro do FixedHeader) — cada instância tem
  // seu próprio scroll horizontal nativo, sem sincronia entre elas. Sem
  // isso, a instância que acabou de aparecer (ex: a do FixedHeader, ao
  // rolar a página) ficava com o scroll "resetado", mostrando a aba ativa
  // fora do lugar onde o usuário a tinha deixado na outra instância.
  // `inline: 'nearest'` (não 'center'): só move o scroll o mínimo pra trazer
  // a aba pra dentro da área visível — se ela já está visível (ex: usuário
  // clicou numa aba perto da borda, já vendo ela), não move nada. Com
  // 'center' toda seleção recentralizava a aba, mesmo quando já visível, o
  // que deixava a navegação por clique estranha (a tela "pulava").
  useEffect(() => {
    activeRef.current?.scrollIntoView({ block: 'nearest', inline: 'nearest' });
  }, [activeKey]);

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
            ref={active ? activeRef : undefined}
            onClick={() => {
              if (dragRef.current && dragRef.current.moved) return;
              onSelect(item.key);
            }}
            style={{
              position: 'relative',
              flex: 'none',
              display: 'flex',
              alignItems: 'center',
              gap: spacing.gapSm,
              padding: `${spacing.gapMd}px 16px`,
              borderRadius: radius.chip,
              ...type.chip,
              cursor: 'pointer',
              userSelect: 'none',
              background: active ? undefined : color.surfaceMuted,
              color: active ? color.white : color.mutedDeep,
            }}
          >
            {/* layoutId compartilhado entre os chips desta instância — o
                fundo preto "voa" fisicamente de uma aba pra outra em vez de
                sumir numa e aparecer na outra (mesmo padrão de
                DayTabs.jsx/BottomTabBar.jsx). */}
            {active && (
              <motion.div
                layoutId={`h-scroll-tabs-pill-${instanceId}`}
                transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                style={{ position: 'absolute', inset: 0, borderRadius: radius.chip, background: color.dark }}
              />
            )}
            {Icon && <Icon size={15} color={active ? color.white : (item.iconColor || color.mutedDeep)} style={{ position: 'relative' }} />}
            {item.emoji && <span style={{ position: 'relative' }}>{item.emoji}</span>}
            <span style={{ position: 'relative' }}>{item.label}</span>
            {item.count != null && <span style={{ position: 'relative', opacity: 0.7 }}>({item.count})</span>}
          </div>
        );
      })}
    </div>
  );
}
