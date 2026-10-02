// Status real da ThemeParks.wiki quando a atração NÃO está operando
// (OPERATING é o único caso "positivo", tratado à parte por quem consome).
// Compartilhado entre AttractionCard.jsx e ParkMap.jsx — sem isso a tag de
// fila simplesmente sumia (mesmo tratamento de "sem dado nenhum"), o que
// escondia uma informação útil: a atração está fechada agora, não é só
// falta de dado ao vivo.
export const ATTRACTION_STATUS_LABEL = {
  CLOSED: 'Fechada',
  DOWN: 'Indisponível',
  REFURBISHMENT: 'Em manutenção',
};
