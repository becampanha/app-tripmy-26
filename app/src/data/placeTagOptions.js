// Lista fixa de tags válidas por categoria — usada no Select de "Tag" do
// formulário de lugar. Derivada das tags já em uso no banco no momento em
// que essa lista foi criada; adicione novas tags aqui conforme necessário.
export const TAG_OPTIONS_BY_CATEGORY = {
  Restaurante: [
    '🍽️ Restaurante', '🍽️ Americano', '🦐 Frutos do mar', '🍳 Breakfast',
    '🍔 Hambúrguer', '☕ Café', '🍕 Pizza', '🍝 Italiano', '🥐 Padaria',
    '🍣 Japonesa', '🍖 Churrasco', '🥪 Sanduíche', '🥩 Steakhouse',
    '🍽️ Africana', '🍽️ Buffet', '🥖 Francesa', '🥢 Chinesa', '🌮 Mexicana',
    '🍦 Sorveteria', '🍹 Bar', '🍽️ Praça de alimentação', '🍷 Espanhol',
    '🍩 Rosquinha', '🍺 Alemã',
  ],
  Mercado: ['🛒 Mercearia', '🛍️ Departamento'],
  Centros: ['🏙️ Centro'],
  Outlets: ['🏷️ Outlet'],
  Shopping: ['🏬 Shopping'],
  Loja: ['🛍️ Departamento'],
  Parque: ['🎢 Parque temático'],
  Hotel: ['🏨 Hotel Disney'],
  Aeroporto: ['✈️ Aeroporto'],
  Outro: ['🎢 Parque temático'],
};

export function tagOptionsFor(category) {
  return TAG_OPTIONS_BY_CATEGORY[category] || [];
}
