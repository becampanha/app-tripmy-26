// Aceita qualquer formato comum de link do YouTube (watch?v=, youtu.be/,
// shorts/, embed/, ou já um ID puro de 11 caracteres) e devolve só o ID do
// vídeo — usado tanto pelo player embutido (iframe .../embed/<id>) quanto
// pela thumbnail (img.youtube.com/vi/<id>/...). Mesma função usada em
// AttractionDetailScreen.jsx, movida pra cá pra não duplicar entre Atrações
// e Dicas.
export function extractYoutubeId(input) {
  if (!input) return null;
  const trimmed = input.trim();
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtube\.com\/shorts\/|youtube\.com\/embed\/|youtu\.be\/)([a-zA-Z0-9_-]{11})/,
  ];
  for (const re of patterns) {
    const match = trimmed.match(re);
    if (match) return match[1];
  }
  return /^[a-zA-Z0-9_-]{11}$/.test(trimmed) ? trimmed : null;
}

// Thumbnails oficiais do YouTube via URL direta (sem API key). `hqdefault`
// (480x360, proporção 4:3) existe pra praticamente qualquer vídeo público,
// mas é a imagem real do vídeo (quase sempre 16:9) encaixada com barras
// pretas (letterbox) dentro dessa moldura 4:3 — com object-fit:cover isso
// aparece como barras pretas cobrindo parte do card. `maxresdefault`
// (1280x720, 16:9 de verdade, sem barras) resolve isso mas nem todo vídeo
// tem essa resolução gerada — por isso o fallback em youtubeThumbnailProps.
export function youtubeThumbnailHighRes(videoId) {
  return `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`;
}

export function youtubeThumbnail(videoId) {
  return `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
}

// Props prontas pra um <img>: tenta a thumbnail 16:9 sem barras primeiro: se
// não existir (o YouTube responde com uma imagem placeholder cinza de
// 120x90 nesse caso, em vez de 404 — por isso o onError sozinho não
// detectaria a falha), cai pra hqdefault no onLoad assim que confirma que a
// imagem carregada é esse placeholder.
export function youtubeThumbnailProps(videoId) {
  return {
    src: youtubeThumbnailHighRes(videoId),
    onLoad: (e) => {
      if (e.target.naturalWidth === 120 && e.target.naturalHeight === 90) {
        e.target.src = youtubeThumbnail(videoId);
      }
    },
    onError: (e) => {
      e.target.onerror = null;
      e.target.src = youtubeThumbnail(videoId);
    },
  };
}

// Mesma lógica de fallback de youtubeThumbnailProps, mas resolvendo a URL
// final via pré-carregamento em memória (Image()) em vez de props de <img> —
// usado onde o consumidor só aceita uma string de URL pronta (ex: PhotoCard,
// que recebe `photo` como prop simples, sem onLoad/onError). Cache simples
// por videoId: a checagem só roda uma vez por vídeo, não a cada render/troca
// de slide do carrossel.
const resolvedThumbnailCache = new Map();

export function resolveYoutubeThumbnail(videoId, onResolved) {
  if (resolvedThumbnailCache.has(videoId)) {
    onResolved(resolvedThumbnailCache.get(videoId));
    return;
  }
  const probe = new Image();
  probe.onload = () => {
    const url = (probe.naturalWidth === 120 && probe.naturalHeight === 90)
      ? youtubeThumbnail(videoId)
      : youtubeThumbnailHighRes(videoId);
    resolvedThumbnailCache.set(videoId, url);
    onResolved(url);
  };
  probe.onerror = () => {
    const url = youtubeThumbnail(videoId);
    resolvedThumbnailCache.set(videoId, url);
    onResolved(url);
  };
  probe.src = youtubeThumbnailHighRes(videoId);
}
