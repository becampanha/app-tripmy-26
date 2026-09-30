import { useState } from 'react';
import { SquareTopUpIcon } from '@solar-icons/react/bold/square-top-up';
import { AddSquareIcon } from '@solar-icons/react/bold/add-square';
import { color, radius, spacing, type } from '../design-system/index.js';

const DISMISSED_KEY = 'addToHomeScreenDismissed';

export function wasAddToHomeScreenDismissed() {
  try {
    return localStorage.getItem(DISMISSED_KEY) === '1';
  } catch {
    return false;
  }
}

function dismiss() {
  try {
    localStorage.setItem(DISMISSED_KEY, '1');
  } catch {
    // localStorage indisponível — pior caso é a tela aparecer de novo
  }
}

// Ensina o passo a passo manual de "Adicionar à Tela de Início" no Safari —
// iOS não tem (ao contrário do Android/Chrome) uma API que dispare esse
// prompt via código, então o melhor que dá pra fazer é guiar visualmente.
// Aparece uma única vez (ver wasAddToHomeScreenDismissed) — depois de
// pulada ou concluída, não volta a incomodar nas próximas visitas.
export default function AddToHomeScreenPrompt({ onClose }) {
  const [closing, setClosing] = useState(false);

  const handleClose = () => {
    dismiss();
    setClosing(true);
    setTimeout(onClose, 200);
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 60,
        display: 'flex',
        alignItems: 'flex-end',
        justifyContent: 'center',
        opacity: closing ? 0 : 1,
        transition: 'opacity 0.2s ease',
      }}
    >
      <div
        onClick={handleClose}
        style={{ position: 'absolute', inset: 0, background: 'rgba(28,26,23,0.55)' }}
      />

      <div
        style={{
          position: 'relative',
          width: '100%',
          maxWidth: 480,
          background: '#fff',
          borderTopLeftRadius: radius.sheetTop,
          borderTopRightRadius: radius.sheetTop,
          boxSizing: 'border-box',
          padding: `${spacing.screenGutter}px ${spacing.screenGutter}px calc(${spacing.screenGutter}px + env(safe-area-inset-bottom))`,
          transform: closing ? 'translateY(12px)' : 'translateY(0)',
          transition: 'transform 0.2s ease',
        }}
      >
        <div
          style={{
            width: 44,
            height: 44,
            borderRadius: 14,
            background: color.dark,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: spacing.gapLg,
          }}
        >
          <AddSquareIcon size={22} color="#fff" />
        </div>

        <div style={{ ...type.sectionTitle, color: color.dark }}>Instale o Family Trip</div>
        <div style={{ ...type.paragraph, color: color.muted, marginTop: 4 }}>
          Adicione o app à tela de início do seu iPhone para abrir como um app de verdade — em tela cheia, sem a barra do navegador.
        </div>

        <div style={{ marginTop: spacing.gapLg, display: 'flex', flexDirection: 'column', gap: spacing.gapMd }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: spacing.gapMd }}>
            <div
              style={{
                flex: 'none',
                width: 28,
                height: 28,
                borderRadius: 14,
                background: color.surfaceMuted,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                ...type.label,
                color: color.dark,
              }}
            >
              1
            </div>
            <div style={{ ...type.paragraph, color: color.dark, flex: 1 }}>
              Toque no ícone de compartilhar <SquareTopUpIcon size={15} color={color.dark} style={{ verticalAlign: -2 }} /> na barra do Safari
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: spacing.gapMd }}>
            <div
              style={{
                flex: 'none',
                width: 28,
                height: 28,
                borderRadius: 14,
                background: color.surfaceMuted,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                ...type.label,
                color: color.dark,
              }}
            >
              2
            </div>
            <div style={{ ...type.paragraph, color: color.dark, flex: 1 }}>
              Escolha <strong>Adicionar à Tela de Início</strong>
            </div>
          </div>
        </div>

        <div
          onClick={handleClose}
          style={{
            marginTop: spacing.screenGutter,
            padding: 14,
            borderRadius: radius.button,
            background: color.surfaceMuted,
            color: color.dark,
            textAlign: 'center',
            cursor: 'pointer',
            ...type.button,
          }}
        >
          Continuar no navegador
        </div>
      </div>
    </div>
  );
}
