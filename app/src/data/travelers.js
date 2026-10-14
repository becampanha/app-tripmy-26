// Lista fixa dos participantes da viagem — sem dado vindo de API, só
// identificação visual de quem é quem no app (ver o select de identidade em
// MoreScreen.jsx/ShoppingScreen.jsx e a identidade local salva por aparelho
// em hooks/useTravelerIdentity.js).
export const TRAVELERS = [
  { emoji: '👩🏼‍🦳', name: 'Luciane' },
  { emoji: '👴🏼', name: 'Marcos' },
  { emoji: '👩🏻', name: 'Giulia' },
  { emoji: '👱🏼‍♂️', name: 'Bruno' },
  { emoji: '👧🏼', name: 'Maria Luiza' },
  { emoji: '👶🏼', name: 'Anna' },
  { emoji: '👦🏼', name: 'Nicolas' },
  { emoji: '👦🏼', name: 'Pedro' },
  { emoji: '👱🏼‍♀️', name: 'Isabela' },
  { emoji: '🧔🏻‍♂️', name: 'Marco' },
];

// Nome + emoji pronto pra exibição (ex: "👱🏼‍♂️ Bruno") — usado em "Recomendado
// por" (ver RecommendationCard.jsx/RecommendationCardStack.jsx). Autores
// antigos (de antes do campo virar o select fixo de viajantes) podem não
// bater com nenhum emoji — nesse caso só mostra o nome, sem ícone.
export function travelerLabel(name) {
  const traveler = TRAVELERS.find((t) => t.name === name);
  return traveler ? `${traveler.emoji} ${name}` : name;
}
