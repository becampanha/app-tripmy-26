import { useEffect, useState } from 'react';
import useEmblaCarousel from 'embla-carousel-react';
import { AnimatePresence, motion } from 'motion/react';
import { WELCOME_SLIDES } from '../data/welcomeSlides.js';
import { color, shellMaxWidth, spacing, type } from '../design-system/index.js';

const DISMISSED_KEY = 'welcomeScreenSeen';
const PHOTO_HEIGHT = '62%';
const BADGE_SIZE = 72;

export function wasWelcomeScreenSeen() {
  try {
    return localStorage.getItem(DISMISSED_KEY) === '1';
  } catch {
    return false;
  }
}

function markWelcomeScreenSeen() {
  try {
    localStorage.setItem(DISMISSED_KEY, '1');
  } catch {
    // localStorage indisponível — pior caso é a tela aparecer de novo
  }
}

// Carrossel de boas-vindas, mostrado na primeira abertura do app (ou de
// novo a qualquer momento via atalho na tela Mais — ver MoreScreen).
// Embla cuida do arrasto da foto (mouse e touch, com física de swipe) —
// mesma lib já usada no carrossel de fotos do PlaceDetailScreen, só que
// aqui o conteúdo de texto (ícone/título/descrição) anima por fora, com
// fade + slide vertical via motion/react, sincronizado pelo índice do
// Embla — não dá pra confiar só no z-index quando dois blocos empilhados
// têm position/overflow diferentes (foi o que bugava o ícone antes).
export default function WelcomeScreen({ onClose }) {
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: false });
  const [index, setIndex] = useState(0);
  const isLast = index === WELCOME_SLIDES.length - 1;
  const slide = WELCOME_SLIDES[index];
  const Icon = slide.icon;

  useEffect(() => {
    if (!emblaApi) return;
    const onSelect = () => setIndex(emblaApi.selectedScrollSnap());
    emblaApi.on('select', onSelect);
    return () => emblaApi.off('select', onSelect);
  }, [emblaApi]);

  const goToNext = () => {
    if (isLast) {
      markWelcomeScreenSeen();
      onClose();
      return;
    }
    emblaApi?.scrollNext();
  };

  const skip = () => {
    markWelcomeScreenSeen();
    onClose();
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        left: '50%',
        transform: 'translateX(-50%)',
        width: '100%',
        maxWidth: shellMaxWidth,
        zIndex: 70,
        background: '#fff',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <div
        style={{
          height: PHOTO_HEIGHT,
          flex: 'none',
          position: 'relative',
          padding: `${spacing.screenGutter}px ${spacing.screenGutter}px 0`,
          paddingTop: 'calc(env(safe-area-inset-top) + 18px)',
          boxSizing: 'border-box',
        }}
      >
        <div
          ref={emblaRef}
          style={{
            width: '100%',
            height: '100%',
            overflow: 'hidden',
            borderRadius: 26,
            border: '4px solid #fff',
            boxShadow: '0 10px 28px rgba(28,26,23,0.22)',
            boxSizing: 'border-box',
            cursor: 'grab',
          }}
        >
          <div style={{ display: 'flex', height: '100%' }}>
            {WELCOME_SLIDES.map((s) => (
              <div key={s.key} style={{ flex: '0 0 100%', height: '100%', minWidth: 0 }}>
                <img
                  src={s.photo}
                  alt=""
                  draggable={false}
                  style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center 30%', pointerEvents: 'none' }}
                />
              </div>
            ))}
          </div>
        </div>

        <div
          style={{
            position: 'absolute',
            bottom: -BADGE_SIZE / 2,
            left: '50%',
            transform: 'translateX(-50%)',
            width: BADGE_SIZE,
            height: BADGE_SIZE,
            borderRadius: 22,
            background: slide.appIcon ? color.dark : slide.iconColor,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 6px 18px rgba(28,26,23,0.25)',
            border: '4px solid #fff',
            boxSizing: 'border-box',
          }}
        >
          <AnimatePresence mode="wait">
            <motion.div
              key={slide.key}
              initial={{ opacity: 0, scale: 0.6 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.6 }}
              transition={{ duration: 0.2 }}
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            >
              {slide.appIcon ? (
                <img src="/icons/icon-192.png" alt="" style={{ width: BADGE_SIZE - 8, height: BADGE_SIZE - 8, borderRadius: 18 }} />
              ) : (
                Icon && <Icon size={34} color="#fff" />
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      <div style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
        <AnimatePresence mode="wait">
          <motion.div
            key={slide.key}
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -14 }}
            transition={{ duration: 0.25, ease: [0.32, 0.72, 0, 1] }}
            style={{
              position: 'absolute',
              inset: 0,
              padding: `${BADGE_SIZE / 2 + spacing.screenGutter}px ${spacing.screenGutter}px 90px`,
              textAlign: 'center',
              overflowY: 'auto',
              boxSizing: 'border-box',
            }}
          >
            <div style={{ ...type.mainTitle, color: color.dark }}>{slide.title}</div>
            <div
              style={{
                fontSize: 16,
                fontWeight: 500,
                lineHeight: 1.5,
                color: color.muted,
                marginTop: spacing.gapMd,
              }}
            >
              {slide.description}
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      <div
        style={{
          position: 'absolute',
          left: spacing.screenGutter,
          right: spacing.screenGutter,
          bottom: 'calc(env(safe-area-inset-bottom) + 22px)',
          display: 'flex',
          alignItems: 'center',
          gap: spacing.gapMd,
        }}
      >
        <div
          onClick={skip}
          style={{
            flex: 'none',
            padding: '14px 18px',
            color: color.muted,
            ...type.button,
            cursor: 'pointer',
          }}
        >
          {isLast ? '' : 'Pular'}
        </div>

        <div style={{ flex: 1, display: 'flex', justifyContent: 'center', gap: 6 }}>
          {WELCOME_SLIDES.map((s, i) => (
            <div
              key={s.key}
              style={{
                width: i === index ? 16 : 6,
                height: 6,
                borderRadius: 3,
                background: i === index ? color.dark : color.border,
                transition: 'width 0.25s ease, background 0.25s ease',
              }}
            />
          ))}
        </div>

        <div
          onClick={goToNext}
          style={{
            flex: 'none',
            padding: '14px 22px',
            borderRadius: 16,
            background: color.dark,
            color: '#fff',
            ...type.button,
            cursor: 'pointer',
          }}
        >
          {isLast ? 'Começar' : 'Próximo'}
        </div>
      </div>
    </div>
  );
}
