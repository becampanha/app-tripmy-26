// "Áreas" (antes chamadas de subcategoria) por categoria-mãe. Cada categoria
// tem seu próprio critério e lista de opções (ex: Restaurante usa área/zona
// geográfica; Parque usa o complexo/resort). Categorias com lista vazia
// simplesmente não mostram o filtro/select de área ainda.
export const SUBCATEGORIES_BY_CATEGORY = {
  'Restaurante': [
    'Orlando',
    'Hotéis Disney',
    'Disney Springs',
    'Magic Kingdom',
    'Epcot',
    'Hollywood Studios',
    'Animal Kingdom',
    'Universal Studios',
    'Islands of Adventure',
    'Universal CityWalk',
    'Miami',
    'Winter Garden',
    'Winter Park',
  ],
  'Mercado': [],
  'Centros': [],
  'Outlets': [],
  'Shopping': [],
  'Loja': [],
  'Parque': ['Universal', 'Disney'],
  'Hotel': [],
  'Aeroporto': [],
  'Outro': [],
};

export function subcategoriesFor(category) {
  return SUBCATEGORIES_BY_CATEGORY[category] || [];
}
