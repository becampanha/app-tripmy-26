import { ChefHatIcon } from '@solar-icons/react/bold/chef-hat';
import { BagIcon } from '@solar-icons/react/bold/bag';
import { Shop2Icon } from '@solar-icons/react/bold/shop-2';
import { CartLarge2Icon } from '@solar-icons/react/bold/cart-large-2';
import { FerrisWheelIcon } from '@solar-icons/react/bold/ferris-wheel';
import { BedIcon } from '@solar-icons/react/bold/bed';
import { PlaneIcon } from '@solar-icons/react/bold/plane';
import { StarsMinimalisticIcon } from '@solar-icons/react/bold/stars-minimalistic';
import { BuildingsIcon } from '@solar-icons/react/bold/buildings';
import { TagPriceIcon } from '@solar-icons/react/bold/tag-price';

// Categorias do topo (chips de filtro da tela de Lugares e do seletor).
// Tags específicas de cada lugar (place.tag) usam emoji embutido na própria
// string salva no banco, não ícone — o Solar Icons não tem cobertura
// suficiente de tipos específicos (pizza, sushi, shopping, mercearia, etc.).
export const CATEGORY_ICON_MAP = {
  'Restaurante': { icon: ChefHatIcon, color: '#c9704a' },
  'Mercado': { icon: CartLarge2Icon, color: '#7a9e7e' },
  'Centros': { icon: BuildingsIcon, color: '#b3708f' },
  'Outlets': { icon: TagPriceIcon, color: '#c96a6a' },
  'Shopping': { icon: Shop2Icon, color: '#4a9e8f' },
  'Loja': { icon: BagIcon, color: '#5f8fc9' },
  'Parque': { icon: FerrisWheelIcon, color: '#c9985c' },
  'Hotel': { icon: BedIcon, color: '#a9714a' },
  'Aeroporto': { icon: PlaneIcon, color: '#5c8ab3' },
  'Outro': { icon: StarsMinimalisticIcon, color: '#8f5aa3' },
};
