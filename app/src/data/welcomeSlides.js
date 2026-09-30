import { MapIcon } from '@solar-icons/react/bold/map';
import { HeartIcon } from '@solar-icons/react/bold/heart';
import { ShopIcon } from '@solar-icons/react/bold/shop';
import { FerrisWheelIcon } from '@solar-icons/react/bold/ferris-wheel';

// Conteúdo do carrossel de boas-vindas — fotos reais já hospedadas no
// projeto (a da capa é da própria viagem da família; as demais vêm dos
// lugares/atrações já cadastrados no catálogo).
export const WELCOME_SLIDES = [
  {
    key: 'cover',
    photo: '/onboarding/welcome-family.jpg',
    appIcon: true,
    title: 'Bem-vindos ao Family Trip',
    description:
      'Esse é o app da nossa viagem — feito pela própria família, com tudo que a gente pesquisou e viveu junto. Aqui está o roteiro, os lugares, as atrações e as dicas de quem já esteve lá, sempre à mão, mesmo sem internet.',
  },
  {
    key: 'roteiro',
    photo: '/places/nordstrom-rack.jpg',
    icon: MapIcon,
    iconColor: '#c9985c',
    title: 'Roteiro',
    description:
      'O dia a dia inteiro da viagem, hora a hora — desde a saída do hotel até o fechamento do parque à noite. Cada atividade já vem com o lugar certo vinculado, pra ninguém se perder na correria.',
  },
  {
    key: 'dicas',
    photo: 'https://cho9lt1ga1ikudg9.public.blob.vercel-storage.com/places/1790358155746-images%20%287%29.jpeg',
    icon: HeartIcon,
    iconColor: '#b3708f',
    title: 'Dicas',
    description:
      'Os pratos, passeios e achados que a própria família recomenda — publicados por vocês mesmos durante a viagem, com foto e tudo, pra não esquecer o que valeu a pena.',
  },
  {
    key: 'lugares',
    photo: '/places/xlsx-olive-garden.jpg',
    icon: ShopIcon,
    iconColor: '#5f8fc9',
    title: 'Lugares',
    description:
      'Todos os restaurantes, hotéis e lojas já pesquisados, organizados por categoria — com endereço, fotos e nota de avaliação, pronto pra decidir onde ir sem precisar procurar de novo.',
  },
  {
    key: 'atracoes',
    photo: 'https://cho9lt1ga1ikudg9.public.blob.vercel-storage.com/places/ChIJN7cZMDx_3YgRDnxOz3U4LfE-1790280797839-0.jpg',
    icon: FerrisWheelIcon,
    iconColor: '#7a9e7e',
    title: 'Atrações',
    description:
      'As 133 atrações dos 7 parques, com fila em tempo real, mapa interativo e uma estratégia de visita pensada pra aproveitar cada dia sem perder tempo na fila errada.',
  },
];
