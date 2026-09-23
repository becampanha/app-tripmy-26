import { MapArrowDownIcon } from '@solar-icons/react/bold/map-arrow-down';
import { useGeocode } from '../hooks/useGeocode.js';
import { useDistance } from '../hooks/useDistance.js';

// Recuo horizontal fixo, alinhado ao padding: 14 do texto dentro dos cards.
export const TICK_INDENT = 14;

function formatDuration(min) {
  if (min < 60) return `${min} min`;
  const h = Math.floor(min / 60);
  const rest = min % 60;
  return rest === 0 ? `${h}h` : `${h}h ${rest}min`;
}

// Distância/tempo de carro entre dois lugares vinculados em atividades
// consecutivas do roteiro. Fica fora dos cards, alinhada à esquerda no mesmo
// recuo do texto dentro dos cards.
export default function DistanceBetween({ from, to }) {
  const fromCoords = useGeocode(from.address);
  const toCoords = useGeocode(to.address);
  const result = useDistance(from.id, fromCoords, to.id, toCoords);

  if (!result) return null;

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 5,
        paddingLeft: TICK_INDENT,
        paddingTop: 6,
        paddingBottom: 6,
        margin: '10px 0',
        color: '#9a9186',
        fontSize: 12,
        fontWeight: 600,
      }}
    >
      <MapArrowDownIcon size={13} color="#9a9186" />
      {result.distanceKm < 10 ? result.distanceKm.toFixed(1) : Math.round(result.distanceKm)} km · {formatDuration(result.durationMin)} de carro
    </div>
  );
}
