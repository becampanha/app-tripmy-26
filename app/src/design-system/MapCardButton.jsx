import { useTapHandler } from '../hooks/useTapHandler.js';
import { type } from './tokens.js';

// Botão ícone + texto, translúcido sobre foto — usado dentro do bottomContent
// dos cards de pin nos mapas (PlacesMap, ParkMap, DayMap): "Centralizar",
// "Detalhes", "Rota". Sempre um irmão de um PhotoCard que também reage a
// onPointerUp (ver useTapHandler) — por isso precisa do próprio onPointerDown
// com stopPropagation (suprime o tap do card pai) além do useTapHandler
// (reage ao próprio toque, com a mesma trava de tap-vs-arrasto).
export default function MapCardButton({ icon: Icon, label, onClick }) {
  const tapHandlers = useTapHandler(onClick);

  return (
    <div
      onPointerDown={(e) => {
        e.stopPropagation();
        tapHandlers.onPointerDown(e);
      }}
      onPointerUp={(e) => {
        e.stopPropagation();
        tapHandlers.onPointerUp(e);
      }}
      onPointerCancel={tapHandlers.onPointerCancel}
      onClick={(e) => {
        e.stopPropagation();
        tapHandlers.onClick(e);
      }}
      role="button"
      tabIndex={0}
      style={{
        flex: 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
        padding: 12,
        borderRadius: 16,
        background: 'rgba(255,255,255,0.12)',
        border: '1px solid rgba(255,255,255,0.3)',
        cursor: 'pointer',
      }}
    >
      <Icon size={15} color="#fff" />
      <span style={{ color: '#fff', ...type.button }}>{label}</span>
    </div>
  );
}
