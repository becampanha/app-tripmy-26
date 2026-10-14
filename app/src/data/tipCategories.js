import { ChefHatIcon } from '@solar-icons/react/bold/chef-hat';
import { BagIcon } from '@solar-icons/react/bold/bag';
import { FerrisWheelIcon } from '@solar-icons/react/bold/ferris-wheel';
import { BusIcon } from '@solar-icons/react/bold/bus';
import { BedIcon } from '@solar-icons/react/bold/bed';
import { WidgetIcon } from '@solar-icons/react/bold/widget';

// Categorias fixas de dica — escolhidas no momento de criar/editar (ver
// RecommendationModal.jsx/RecommendationEditModal.jsx); cada uma vira uma
// aba na tela de Dicas (ver RecommendationsScreen.jsx). Lista fechada,
// mesmo espírito de SHOPPING_CATEGORIES em shoppingCategories.js. "Outro" é
// o valor padrão — toda dica tem categoria, nenhuma fica sem aba.
export const TIP_CATEGORIES = ['Comida', 'Compras', 'Passeios', 'Transporte', 'Hospedagem', 'Outro'];

export const TIP_CATEGORY_ICON = {
  Comida: ChefHatIcon,
  Compras: BagIcon,
  Passeios: FerrisWheelIcon,
  Transporte: BusIcon,
  Hospedagem: BedIcon,
  Outro: WidgetIcon,
};
