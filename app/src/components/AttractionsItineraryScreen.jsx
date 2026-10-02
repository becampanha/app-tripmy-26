import { useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { AnimatePresence, Reorder, useDragControls } from 'motion/react';
import { AltArrowLeftIcon } from '@solar-icons/react/linear/alt-arrow-left';
import { PenIcon } from '@solar-icons/react/linear/pen';
import { HamburgerMenuIcon } from '@solar-icons/react/linear/hamburger-menu';
import { ClockCircleIcon } from '@solar-icons/react/bold/clock-circle';
import { useAttractionsData } from '../hooks/useAttractionsData.js';
import { useElementHeight } from '../hooks/useElementHeight.js';
import { useScrollY } from '../hooks/useScrollY.js';
import { useLiveQueueTimes } from '../hooks/useLiveQueueTimes.js';
import { setGlobalEditing } from '../hooks/useEditingState.js';
import { showToast, showErrorToast } from '../hooks/useToast.js';
import { updateParkStrategy } from '../api/itineraryApi.js';
import { PARK_ICON_MAP } from '../data/parkIcons.js';
import EditActionBar from './EditActionBar.jsx';
import { FixedHeader, HScrollTabs, FieldLabel, inputStyle, ParkStrategyCard, Skeleton, color, radius, space, spacing, type } from '../design-system/index.js';

// Mesmo badge já usado pro lugar vinculado a uma atividade do roteiro de
// dias (ActivityItem.jsx) — padding/radius/background/fonte idênticos —, com
// o ícone de relógio + valor + o mesmo pontinho verde pulsante do
// AttractionCard (indica que o dado é ao vivo, não a estimativa da
// planilha). Fixo no canto superior direito do card, na mesma altura do
// título, em vez de inline — não devia empurrar o título nem quebrar linha.
function LiveQueueTag({ value }) {
  return (
    <div
      style={{
        position: 'absolute',
        top: 14,
        right: 14,
        display: 'inline-flex',
        alignItems: 'center',
        gap: 4,
        padding: '4px 8px 4px 10px',
        borderRadius: radius.badge,
        background: color.surfaceMuted,
        color: color.dark,
        fontSize: 11.5,
        fontWeight: 700,
      }}
    >
      <ClockCircleIcon size={13} color={color.dark} />
      <span style={{ whiteSpace: 'nowrap' }}>{value}</span>
      <span
        style={{
          width: 5,
          height: 5,
          borderRadius: 3,
          background: color.success,
          animation: 'pulse 1.6s ease-in-out infinite',
        }}
      />
    </div>
  );
}

// Linha arrastável do modo de edição — número da posição some em favor do
// handle de arrastar (HamburgerMenuIcon), já que a ordem passa a mudar na
// hora. useDragControls + dragListener=false no Reorder.Item: sem isso, o
// item inteiro vira "arrastável" por qualquer toque, inclusive um scroll
// vertical acidental na lista — só o handle deve iniciar o arrasto.
function DraggableAttractionItem({ attraction, liveQueue }) {
  const dragControls = useDragControls();
  return (
    <Reorder.Item
      value={attraction}
      dragListener={false}
      dragControls={dragControls}
      style={{
        position: 'relative',
        listStyle: 'none',
        display: 'flex',
        alignItems: 'center',
        gap: 14,
        padding: 14,
        marginBottom: 10,
        background: color.bg,
        border: `1px solid ${color.border}`,
        borderRadius: radius.card,
      }}
    >
      {typeof liveQueue === 'number' && <LiveQueueTag value={`${liveQueue} min`} />}

      <button
        type="button"
        onPointerDown={(e) => dragControls.start(e)}
        style={{
          flex: 'none',
          width: 44,
          height: 44,
          borderRadius: 14,
          background: color.surfaceMuted,
          border: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'grab',
          touchAction: 'none',
        }}
      >
        <HamburgerMenuIcon size={18} color={color.dark} />
      </button>

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ ...type.itemTitle, color: color.dark, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', paddingRight: typeof liveQueue === 'number' ? 90 : 0 }}>
          {attraction.name}
        </div>
        {attraction.bestTime && (
          <div style={{ color: color.muted, fontSize: 12.5, fontWeight: 600, marginTop: 2 }}>
            {attraction.bestTime}
          </div>
        )}
      </div>
    </Reorder.Item>
  );
}

function ItemSkeleton() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: 14, marginBottom: 10, background: color.bg, border: `1px solid ${color.border}`, borderRadius: radius.card }}>
      <Skeleton width={44} height={44} radius={12} />
      <div style={{ flex: 1 }}>
        <Skeleton width="60%" height={15} />
      </div>
    </div>
  );
}

// Mesmo layout/padrão visual do Resumo do Roteiro (AllDaysScreen.jsx), mas
// pro parque atual de Atrações: estratégia do parque ("Como aproveitar o
// dia") primeiro, seguida da sequência sugerida (park.route) filtrada só
// pelas atrações já marcadas "Está no roteiro" (required=true). Não é uma
// lista editável — gerada a partir do mesmo dado já usado em
// AttractionsScreen/ParkMap, sempre reflete o estado atual do toggle.
export default function AttractionsItineraryScreen() {
  const location = useLocation();
  const navigate = useNavigate();
  const { parks, setParks, loading } = useAttractionsData();
  const [selectedPark, setSelectedPark] = useState(location.state?.parkIndex ?? 0);
  const park = parks[selectedPark];
  const { ref: headerRef, height: headerHeight } = useElementHeight();
  const { scrollY, anchorRef } = useScrollY();
  const { getLiveQueue } = useLiveQueueTimes();

  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  // Em edição, tanto o texto de estratégia quanto a ordem das atrações só
  // mexem neste rascunho local — nada de PUT a cada tecla/arrasto. Só ao
  // clicar Salvar é que persiste os dois campos de uma vez.
  const [draftStrategy, setDraftStrategy] = useState('');
  const [draftSequence, setDraftSequence] = useState([]);
  const originalRef = useRef(null);

  useEffect(() => {
    setGlobalEditing(editing);
    return () => setGlobalEditing(false);
  }, [editing]);

  const tabItems = parks.map((p, i) => {
    const mapped = PARK_ICON_MAP[p.name];
    return { key: i, label: p.name, icon: mapped?.icon, iconColor: mapped?.color };
  });

  const allAttractions = park ? park.areas.flatMap((a) => a.attractions) : [];
  const byName = new Map(allAttractions.map((a) => [a.name, a]));
  // Toda atração required=true precisa aparecer, mesmo que nunca tenha
  // entrado em park.route (ordem sugerida original, importada da planilha)
  // — marcar "Está no roteiro" numa atração que não está na rota sugerida é
  // um caso real (ex: atração nova, ou planilha desatualizada). As que já
  // estão em route mantêm essa ordem; as que faltam vão pro final, na ordem
  // em que aparecem no catálogo do parque.
  const routed = park?.route
    ? park.route.map((name) => byName.get(name)).filter((a) => a && a.required)
    : [];
  const routedIds = new Set(routed.map((a) => a.id));
  const unrouted = allAttractions.filter((a) => a.required && !routedIds.has(a.id));
  const liveSequence = [...routed, ...unrouted];

  const sequence = editing ? draftSequence : liveSequence;

  const startEditing = () => {
    originalRef.current = { strategy: park?.strategy || '', route: liveSequence.map((a) => a.name) };
    setDraftStrategy(park?.strategy || '');
    setDraftSequence(liveSequence);
    setEditing(true);
  };

  const handleCancel = () => {
    setEditing(false);
    setDraftStrategy('');
    setDraftSequence([]);
    originalRef.current = null;
  };

  const handleSave = async () => {
    const newRoute = draftSequence.map((a) => a.name);
    const original = originalRef.current;
    const strategyChanged = draftStrategy !== original.strategy;
    const routeChanged = JSON.stringify(newRoute) !== JSON.stringify(original.route);

    if (!strategyChanged && !routeChanged) {
      handleCancel();
      return;
    }

    setSaving(true);
    try {
      const fields = {};
      if (strategyChanged) fields.summary = draftStrategy;
      if (routeChanged) fields.route = newRoute;
      await updateParkStrategy(park.id, fields);

      // Atualização otimista local — igual ao padrão de toggle de required.
      setParks((prev) =>
        prev.map((p) => (p.id === park.id ? { ...p, strategy: draftStrategy, route: newRoute } : p))
      );

      setEditing(false);
      setDraftStrategy('');
      setDraftSequence([]);
      originalRef.current = null;
      showToast('Roteiro atualizado com sucesso');
    } catch (err) {
      showErrorToast(err, 'Não foi possível salvar as alterações.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div ref={anchorRef} style={{ position: 'relative', width: '100%', minHeight: '100dvh', background: color.bg, boxSizing: 'border-box' }}>
      <FixedHeader
        headerRef={headerRef}
        scrollY={scrollY}
        title="Roteiro"
        titleSize="compact"
        left={
          <div
            onClick={() => navigate(-1)}
            style={{
              width: 38,
              height: 38,
              borderRadius: 13,
              background: color.surfaceMuted,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
            }}
          >
            <AltArrowLeftIcon size={19} color={color.dark} />
          </div>
        }
        right={
          !editing && (
            <div
              onClick={startEditing}
              style={{
                width: 38,
                height: 38,
                borderRadius: 13,
                background: color.surfaceMuted,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
              }}
            >
              <PenIcon size={17} color={color.dark} />
            </div>
          )
        }
        tabs={
          <HScrollTabs
            items={tabItems}
            activeKey={selectedPark}
            onSelect={setSelectedPark}
            loading={loading}
            style={{ marginTop: 0, padding: `0 ${spacing.screenGutter}px` }}
          />
        }
      />

      <div style={{ marginTop: headerHeight + 16, boxSizing: 'border-box', padding: `0 ${space.screenGutter}px ${editing ? 110 : 40}px` }}>
        {loading && Array.from({ length: 5 }).map((_, i) => <ItemSkeleton key={i} />)}

        {!loading && park && !editing && <ParkStrategyCard strategy={park.strategy} />}

        {!loading && park && editing && (
          <div
            style={{
              padding: spacing.cardPadding,
              marginBottom: spacing.controlGap,
              background: color.surfaceMuted,
              borderRadius: radius.card,
            }}
          >
            <FieldLabel>Como aproveitar o dia</FieldLabel>
            <textarea
              value={draftStrategy}
              onChange={(e) => setDraftStrategy(e.target.value)}
              placeholder="Descreva a estratégia de visita deste parque..."
              rows={9}
              style={{ ...inputStyle, marginTop: 6, background: color.bg, resize: 'vertical', fontFamily: 'inherit' }}
            />
          </div>
        )}

        {!loading && !editing && sequence.map((attraction, i) => {
          const liveQueue = getLiveQueue(attraction.name);
          return (
            <div
              key={attraction.id}
              style={{
                position: 'relative',
                display: 'flex',
                alignItems: 'center',
                gap: 14,
                padding: 14,
                marginBottom: 10,
                background: color.bg,
                border: `1px solid ${color.border}`,
                borderRadius: radius.card,
              }}
            >
              {typeof liveQueue === 'number' && <LiveQueueTag value={`${liveQueue} min`} />}

              <div
                style={{
                  flex: 'none',
                  width: 44,
                  height: 44,
                  borderRadius: 14,
                  background: color.surfaceMuted,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <div style={{ fontSize: 16, fontWeight: 800, color: color.dark }}>{i + 1}</div>
              </div>

              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ ...type.itemTitle, color: color.dark, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', paddingRight: typeof liveQueue === 'number' ? 90 : 0 }}>
                  {attraction.name}
                </div>
                {attraction.bestTime && (
                  <div style={{ color: color.muted, fontSize: 12.5, fontWeight: 600, marginTop: 2 }}>
                    {attraction.bestTime}
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {!loading && editing && (
          <Reorder.Group
            as="div"
            axis="y"
            values={draftSequence}
            onReorder={setDraftSequence}
            style={{ listStyle: 'none', margin: 0, padding: 0 }}
          >
            {draftSequence.map((attraction) => (
              <DraggableAttractionItem key={attraction.id} attraction={attraction} liveQueue={getLiveQueue(attraction.name)} />
            ))}
          </Reorder.Group>
        )}

        {!loading && sequence.length === 0 && (
          <div style={{ padding: '30px 0', textAlign: 'center', color: color.faint, fontSize: 13.5, fontWeight: 600 }}>
            Nenhuma atração marcada como "Está no roteiro" neste parque ainda.
          </div>
        )}
      </div>

      <AnimatePresence>
        {editing && (
          <EditActionBar key="edit-action-bar" onCancel={handleCancel} onSave={handleSave} saving={saving} />
        )}
      </AnimatePresence>
    </div>
  );
}
