import { useEffect, useState } from 'react';
import { color, cardPhotoGradient, cardPhotoGradientHeight, cardPhotoHeight, radius, spacing } from './tokens.js';

// Card com foto de fundo + gradiente escuro na parte de baixo, para legibilidade
// de texto sobreposto. Padrão canônico: PlaceCard. Usado também em AttractionCard
// e RecommendationCard — o conteúdo (badges, título, metadados) é passado via children,
// já posicionado em fluxo normal dentro da área com padding.
// `height` tem default único (cardPhotoHeight) — todo card com foto do app é
// do mesmo tamanho a menos que a tela tenha um motivo explícito pra variar.
//
// IMPORTANTE: a tag <img> carrega a foto diretamente (sem fetch manual) —
// chegamos a usar fetch+ReadableStream pra mostrar um progresso real de
// download (ver useImageProgress.js, ainda no repo mas não usado aqui), mas
// em testes reais no celular a barra nunca enchia e, pior, boa parte das
// fotos NUNCA carregava — a combinação Service Worker (que faz cache das
// fotos via Workbox, ver sw.js) + fetch manual + leitura de stream se
// mostrou frágil no WebKit/PWA instalado. <img> nativa é o caminho que o
// navegador/Service Worker sempre souberam servir de forma confiável.
export default function PhotoCard({ photo, height = cardPhotoHeight, onClick, children, contentStyle, style }) {
  const [loaded, setLoaded] = useState(false);

  // Reseta o skeleton se a foto do card mudar (ex: card reciclado em lista virtualizada).
  useEffect(() => {
    setLoaded(false);
  }, [photo]);

  // Se a imagem já está no cache do navegador quando o <img> é montado
  // (ex: reabrir uma tela cujas fotos já foram vistas antes — o Service
  // Worker/cache HTTP já tem elas), o carregamento é instantâneo e o
  // evento `load` pode disparar ANTES do React terminar de anexar o
  // listener `onLoad` — o evento nunca chega a ser ouvido, `loaded` nunca
  // vira true, e o skeleton fica cobrindo a foto pra sempre. Bug real
  // reportado pelo usuário: fotos que já tinham carregado numa visita
  // anterior "sumiam" (ficavam atrás do skeleton) ao reabrir a mesma tela
  // uma segunda vez, mesmo com a imagem fisicamente pronta no navegador.
  // Esse ref callback roda assim que o elemento é anexado ao DOM e checa
  // `img.complete` direto — cobre o caso que `onLoad` sozinho perde.
  const checkAlreadyLoaded = (img) => {
    if (img?.complete && img.naturalWidth > 0) setLoaded(true);
  };

  return (
    <div
      onClick={onClick}
      style={{
        position: 'relative',
        height,
        marginBottom: spacing.controlGap,
        borderRadius: radius.cardPhoto,
        overflow: 'hidden',
        background: color.imagePlaceholder,
        cursor: onClick ? 'pointer' : 'default',
        boxSizing: 'border-box',
        ...style,
      }}
    >
      {photo && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: color.surfaceMuted,
            animation: 'image-pulse 1.4s ease-in-out infinite',
            opacity: loaded ? 0 : 1,
            transition: 'opacity 0.35s ease',
            pointerEvents: 'none',
          }}
        />
      )}

      {photo && (
        <img
          ref={checkAlreadyLoaded}
          src={photo}
          alt=""
          loading="lazy"
          decoding="async"
          onLoad={() => setLoaded(true)}
          style={{
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            opacity: loaded ? 1 : 0,
            transition: 'opacity 0.35s ease',
          }}
        />
      )}

      <div
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          bottom: 0,
          height: cardPhotoGradientHeight,
          background: cardPhotoGradient,
          pointerEvents: 'none',
        }}
      />

      <div style={{ position: 'relative', zIndex: 1, height: '100%', ...contentStyle }}>
        {children}
      </div>
    </div>
  );
}
