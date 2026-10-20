import { CrownIcon } from '@solar-icons/react/bold/crown';
import { GlobeIcon } from '@solar-icons/react/bold/globe';
import { ClapperboardIcon } from '@solar-icons/react/bold/clapperboard';
import { PawIcon } from '@solar-icons/react/bold/paw';
import { RocketIcon } from '@solar-icons/react/bold/rocket';
import { LeafIcon } from '@solar-icons/react/bold/leaf';
import { CameraIcon } from '@solar-icons/react/bold/camera';

// Experimento: ícone Solar Icons por parque, no lugar do emoji — mesmo
// espírito do CATEGORY_ICON_MAP de placeTags.js (ícone + cor por item).
export const PARK_ICON_MAP = {
  'Magic Kingdom': { icon: CrownIcon, color: '#c9985c' },
  'Epcot': { icon: GlobeIcon, color: '#5f8fc9' },
  'Hollywood Studios': { icon: ClapperboardIcon, color: '#b3708f' },
  'Animal Kingdom': { icon: PawIcon, color: '#7a9e7e' },
  'Epic': { icon: RocketIcon, color: '#c9704a' },
  'Islands of Adventure': { icon: LeafIcon, color: '#4a9e8f' },
  'Universal Studios': { icon: CameraIcon, color: '#8f5aa3' },
};

// Um card "Roteiro" pode ter como local principal um LUGAR que é o parque
// inteiro (ex: place "Magic Kingdom", categoria "Parque" — os 7 cards reais
// de parque criados a partir do Roteiro de Atrações, ver seção 32 do
// CLAUDE.md) em vez de uma atração específica — não existe uma "atração" que
// represente o parque inteiro no catálogo. O nome do place nem sempre bate
// exatamente com o nome usado no catálogo de atrações (chaves acima), por
// isso o mapeamento explícito.
const PLACE_NAME_TO_PARK_NAME = {
  'Magic Kingdom': 'Magic Kingdom',
  Epcot: 'Epcot',
  "Disney's Hollywood Studios": 'Hollywood Studios',
  "Disney's Animal Kingdom": 'Animal Kingdom',
  "Universal's Epic Universe": 'Epic',
  'Islands of Adventure': 'Islands of Adventure',
  'Universal Studios Florida': 'Universal Studios',
};

// Resolve o nome do parque (chave de PARK_ICON_MAP/catálogo de atrações) a
// partir do local principal de um card "Roteiro" — seja uma atração
// (attraction.parkName já vem pronto) ou um lugar que é o parque inteiro
// (place com category "Parque", resolvido via PLACE_NAME_TO_PARK_NAME).
// Usado tanto pelo botão "Ver mapa do parque" (ItineraryCardItem.jsx) quanto
// pelo facilitador que pré-seleciona a aba certa ao escolher a atração de um
// subitem (ScheduleScreen.jsx).
export function resolveParkName({ place, attraction }) {
  if (attraction) return attraction.parkName;
  if (place?.category === 'Parque') return PLACE_NAME_TO_PARK_NAME[place.name];
  return undefined;
}
