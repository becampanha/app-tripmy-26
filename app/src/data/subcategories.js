// Subcategorias por categoria-mãe. Cada categoria tem seu próprio critério e
// lista de opções (ex: Restaurante usa área/zona; outras categorias podem usar
// critérios totalmente diferentes quando forem definidas). Categorias sem
// entrada aqui simplesmente não mostram o filtro/select de subcategoria.
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
};

export function subcategoriesFor(category) {
  return SUBCATEGORIES_BY_CATEGORY[category] || [];
}
