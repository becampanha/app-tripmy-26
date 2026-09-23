// Mapa de campo da API (camelCase) → coluna da tabela places (snake_case),
// compartilhado entre o POST (criação) e o PUT (edição) de lugares.
export const FIELD_MAP = {
  name: 'name',
  category: 'category',
  subcategory: 'subcategory',
  tag: 'tag',
  address: 'address',
  rating: 'rating',
  googleMapsUri: 'google_maps_uri',
  cost: 'cost',
  hours: 'hours',
  menuLabel: 'menu_label',
  reviewLabel: 'review_label',
  recommendation: 'recommendation',
  photo: 'photo',
  dishPhotos: 'dish_photos',
};
