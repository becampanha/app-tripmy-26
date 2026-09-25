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
