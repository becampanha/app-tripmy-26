import { useEffect, useRef, useState } from 'react';

// Baixa uma imagem manualmente via fetch (em vez de deixar a tag <img> cuidar
// disso sozinha) só pra poder ler o progresso real de download enquanto os
// bytes chegam — <img> nativa não expõe isso, só dispara onLoad no final.
// Mantém lazy loading via IntersectionObserver (o fetch só começa quando o
// elemento chega perto da tela), senão toda lista longa baixaria tudo de
// uma vez.
export function useImageProgress(src) {
  const [progress, setProgress] = useState(0); // 0–1
  const [objectUrl, setObjectUrl] = useState(null);
  const elementRef = useRef(null);

  useEffect(() => {
    setProgress(0);
    setObjectUrl(null);
    if (!src) return;

    const el = elementRef.current;
    if (!el) return;

    let cancelled = false;
    let createdUrl = null;

    const load = async () => {
      try {
        const response = await fetch(src);
        const total = Number(response.headers.get('content-length')) || 0;
        // Sem Content-Length (alguns CDNs omitem) não dá pra calcular %
        // real — melhor pular direto pra "carregado" do que fingir um
        // progresso que não existe.
        if (!total || !response.body) {
          const blob = await response.blob();
          if (cancelled) return;
          createdUrl = URL.createObjectURL(blob);
          setObjectUrl(createdUrl);
          setProgress(1);
          return;
        }

        const reader = response.body.getReader();
        const chunks = [];
        let received = 0;
        for (;;) {
          const { done, value } = await reader.read();
          if (done) break;
          chunks.push(value);
          received += value.length;
          if (!cancelled) setProgress(Math.min(1, received / total));
        }
        if (cancelled) return;
        const blob = new Blob(chunks);
        createdUrl = URL.createObjectURL(blob);
        setObjectUrl(createdUrl);
        setProgress(1);
      } catch {
        // Falha de rede: deixa a barra travada no progresso atual em vez de
        // mostrar uma imagem quebrada — o card continua funcional, só sem foto.
      }
    };

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          observer.disconnect();
          load();
        }
      },
      { rootMargin: '200px' }
    );
    observer.observe(el);

    return () => {
      cancelled = true;
      observer.disconnect();
      if (createdUrl) URL.revokeObjectURL(createdUrl);
    };
  }, [src]);

  return { elementRef, progress, objectUrl, loaded: progress >= 1 && !!objectUrl };
}
