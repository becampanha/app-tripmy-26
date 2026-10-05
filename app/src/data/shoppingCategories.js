import { TShirtIcon } from '@solar-icons/react/bold/t-shirt';
import { BoxMinimalisticIcon } from '@solar-icons/react/bold/box-minimalistic';
import { MonitorIcon } from '@solar-icons/react/bold/monitor';
import { GiftIcon } from '@solar-icons/react/bold/gift';
import { PerfumeIcon } from '@solar-icons/react/bold/perfume';
import { Home2Icon } from '@solar-icons/react/bold/home-2';
import { Widget2Icon } from '@solar-icons/react/bold/widget-2';

// Categorias fixas de compras — escolhidas no momento de criar/editar um
// item (ver ShoppingItemModal.jsx); cada uma vira uma aba na tela de
// Compras (ver ShoppingScreen.jsx). Lista fechada por decisão de produto:
// mais simples que deixar cada viajante criar suas próprias categorias, e
// cobre os casos mais prováveis de compra de viagem a Orlando.
export const SHOPPING_CATEGORIES = ['Vestuário', 'Calçados', 'Eletrônicos', 'Brinquedos', 'Beleza', 'Casa', 'Outros'];

// Ícone de cada categoria — usado na aba de Resumo (ver ShoppingScreen.jsx),
// que mostra só o ícone (sem o nome) pra ocupar menos espaço na fileira de
// abas. Não existe um ícone de "calçado/tênis" dedicado no pacote, por isso
// a aproximação via caixa de produto.
export const SHOPPING_CATEGORY_ICON = {
  'Vestuário': TShirtIcon,
  'Calçados': BoxMinimalisticIcon,
  'Eletrônicos': MonitorIcon,
  'Brinquedos': GiftIcon,
  'Beleza': PerfumeIcon,
  'Casa': Home2Icon,
  'Outros': Widget2Icon,
};
