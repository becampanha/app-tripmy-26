import { useState } from 'react';
import { CheckIcon } from '@solar-icons/react/linear/check';
import { TRAVELERS } from '../data/travelers.js';
import { color, spacing, radius, type } from '../design-system/index.js';

// Etapa obrigatória do onboarding (ver WelcomeScreen.jsx) — pergunta "quem é
// você" antes de liberar o app, pra já popular a mesma identidade usada na
// tela de Compras (ver useTravelerIdentity.js). Lista com check (em vez do
// dropdown Select usado hoje em ShoppingScreen/WhoAreYouContent) porque esta
// etapa é tela cheia, sem outro conteúdo competindo por espaço — mesmo
// padrão visual de card (emoji + nome) já usado em outros lugares do app.
export default function WhoAreYouStep({ onConfirm }) {
  const [selected, setSelected] = useState('');
  const [attemptedConfirm, setAttemptedConfirm] = useState(false);

  const handleConfirmClick = () => {
    if (selected) onConfirm(selected);
    else setAttemptedConfirm(true);
  };

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        background: '#fff',
        display: 'flex',
        flexDirection: 'column',
        boxSizing: 'border-box',
      }}
    >
      <div
        style={{
          flex: 'none',
          padding: `calc(env(safe-area-inset-top) + 28px) ${spacing.screenGutter}px ${spacing.gapMd}px`,
          textAlign: 'center',
        }}
      >
        <div style={{ ...type.mainTitle, color: color.dark }}>Quem é você?</div>
        <div style={{ color: color.muted, fontSize: 14.5, fontWeight: 500, marginTop: 8, lineHeight: 1.5 }}>
          Selecione seu nome pra gente saber quem está usando o app agora — isso também define sua lista pessoal em Compras.
        </div>
        {attemptedConfirm && !selected && (
          <div style={{ color: color.danger, fontSize: 13, fontWeight: 700, marginTop: 10 }}>
            Selecione seu nome para continuar
          </div>
        )}
      </div>

      <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', padding: `0 ${spacing.screenGutter}px` }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, paddingBottom: 12 }}>
          {TRAVELERS.map((traveler) => {
            const active = selected === traveler.name;
            return (
              <div
                key={traveler.name}
                onClick={() => setSelected(traveler.name)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 14,
                  padding: spacing.cardPadding,
                  background: active ? color.surfaceMuted : color.bg,
                  border: `1px solid ${active ? color.dark : color.border}`,
                  borderRadius: 16,
                  cursor: 'pointer',
                }}
              >
                <div
                  style={{
                    flex: 'none',
                    width: 44,
                    height: 44,
                    borderRadius: 14,
                    background: color.surfaceMuted,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 22,
                  }}
                >
                  {traveler.emoji}
                </div>
                <div style={{ flex: 1, color: color.dark, fontSize: 15, fontWeight: 700 }}>{traveler.name}</div>
                {active && (
                  <div
                    style={{
                      flex: 'none',
                      width: 24,
                      height: 24,
                      borderRadius: 12,
                      background: color.dark,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <CheckIcon size={14} color="#fff" />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <div
        style={{
          flex: 'none',
          padding: `${spacing.gapMd}px ${spacing.screenGutter}px calc(env(safe-area-inset-bottom) + 22px)`,
        }}
      >
        <div
          onClick={handleConfirmClick}
          style={{
            padding: '14px 0',
            borderRadius: radius.button,
            background: selected ? color.dark : color.toggleOff,
            color: '#fff',
            textAlign: 'center',
            fontSize: 14.5,
            fontWeight: 700,
            cursor: selected ? 'pointer' : 'default',
          }}
        >
          Confirmar
        </div>
      </div>
    </div>
  );
}
