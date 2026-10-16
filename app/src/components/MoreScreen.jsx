import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { RefreshIcon } from '@solar-icons/react/bold/refresh';
import { PlayCircleIcon } from '@solar-icons/react/bold/play-circle';
import { BellIcon } from '@solar-icons/react/bold/bell';
import { InfoCircleIcon } from '@solar-icons/react/bold/info-circle';
import { SettingsIcon } from '@solar-icons/react/bold/settings';
import { CloseIcon } from '@solar-icons/react/linear/close';
import { AltArrowRightIcon } from '@solar-icons/react/linear/alt-arrow-right';
import { useScrollY } from '../hooks/useScrollY.js';
import { useElementHeight } from '../hooks/useElementHeight.js';
import WelcomeScreen from './WelcomeScreen.jsx';
import { isStandalone } from '../hooks/useIsStandalone.js';
import { getTravelerIdentity, setTravelerIdentity } from '../hooks/useTravelerIdentity.js';
import { TRAVELERS } from '../data/travelers.js';
import {
  disablePushNotifications,
  getNotificationPermission,
  isPushSupported,
  requestPushPermission,
} from '../hooks/usePushNotifications.js';
import { FixedHeader, Select, Toggle, color, spacing, type } from '../design-system/index.js';
import { STAGGER_ITEM, WIPE_STAGGER_CONTAINER } from '../design-system/motionPresets.js';
import { useStaggerKey } from '../hooks/useActiveScreen.js';

function travelerOption(t) {
  return { value: t.name, label: `${t.emoji} ${t.name}` };
}

function formatBuildDate(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  return d.toLocaleString('pt-BR', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

// Desregistra o service worker, apaga todos os caches do Cache API, e
// recarrega — mais forte que um location.reload() comum, que ainda pode
// servir do cache do SW se ele não tiver detectado a versão nova ainda.
async function hardRefresh() {
  if ('serviceWorker' in navigator) {
    const registrations = await navigator.serviceWorker.getRegistrations();
    await Promise.all(registrations.map((r) => r.unregister()));
  }
  if ('caches' in window) {
    const keys = await caches.keys();
    await Promise.all(keys.map((k) => caches.delete(k)));
  }
  window.location.reload();
}

export default function MoreScreen() {
  const navigate = useNavigate();
  const [refreshing, setRefreshing] = useState(false);
  const [showWelcome, setShowWelcome] = useState(false);
  const [pushEnabled, setPushEnabled] = useState(() => getNotificationPermission() === 'granted');
  const [identity, setIdentity] = useState(() => getTravelerIdentity());
  const { scrollY, anchorRef } = useScrollY();
  const { ref: headerRef, height: headerHeight } = useElementHeight();
  const staggerKey = useStaggerKey();

  // Trocar aqui redefine quem é "você" neste aparelho de verdade (ao
  // contrário do Select equivalente em ShoppingScreen, que só troca a
  // visualização temporária de outra lista sem mexer na identidade) — mesmo
  // mecanismo salvo em localStorage (useTravelerIdentity.js), então a tela
  // de Compras já reflete a pessoa nova na próxima vez que for aberta.
  const handleChangeIdentity = (name) => {
    setTravelerIdentity(name);
    setIdentity(name);
  };

  // Sincroniza o toggle se a permissão for revogada por fora do app (ex:
  // configurações do sistema) entre uma visita e outra a esta tela.
  useEffect(() => {
    setPushEnabled(getNotificationPermission() === 'granted');
  }, []);

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await hardRefresh();
    } catch {
      setRefreshing(false);
    }
  };

  const pushBlocked = getNotificationPermission() === 'denied';

  const handleTogglePush = async (next) => {
    if (pushBlocked) return; // navegador bloqueou — só reverte indo nas configurações dele, não tem o que o toggle faça
    if (next) {
      const result = await requestPushPermission();
      setPushEnabled(result === 'granted');
    } else {
      await disablePushNotifications();
      setPushEnabled(false);
    }
  };

  return (
    <div ref={anchorRef} style={{ position: 'relative', width: '100%', minHeight: '100dvh', background: color.bg, boxSizing: 'border-box' }}>
      <FixedHeader
        headerRef={headerRef}
        scrollY={scrollY}
        title="Mais"
        left={
          <div
            onClick={() => navigate(-1)}
            style={{ width: 38, height: 38, borderRadius: 13, background: color.surfaceMuted, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
          >
            <CloseIcon size={20} color={color.dark} />
          </div>
        }
        right={
          identity && (
            <Select
              value={identity}
              onChange={handleChangeIdentity}
              options={TRAVELERS.map(travelerOption)}
              align="right"
              buttonStyle={{ padding: '7px 10px', fontSize: 12.5 }}
            />
          )
        }
      />

      <motion.div
        key={staggerKey}
        variants={WIPE_STAGGER_CONTAINER}
        initial="hidden"
        animate="show"
        style={{ marginTop: headerHeight + spacing.controlGap, boxSizing: 'border-box', padding: `2px ${spacing.screenGutter}px 120px` }}
      >
        <motion.div
          variants={STAGGER_ITEM}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            padding: spacing.cardPadding,
            background: color.bg,
            border: `1px solid ${color.border}`,
            borderRadius: 18,
          }}
        >
          <div
            style={{
              flex: 'none',
              width: 32,
              height: 32,
              borderRadius: 10,
              background: color.surfaceMuted,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <InfoCircleIcon size={16} color={color.dark} />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ color: color.dark, fontSize: 14.5, fontWeight: 700 }}>
              Versão {__BUILD_INFO__.commit}
            </div>
            <div style={{ color: color.muted, fontSize: 12, fontWeight: 600, marginTop: 1 }}>
              Publicada em {formatBuildDate(__BUILD_INFO__.builtAt)}
            </div>
          </div>
          <div
            onClick={handleRefresh}
            style={{
              flex: 'none',
              width: 32,
              height: 32,
              borderRadius: 10,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: refreshing ? 'default' : 'pointer',
            }}
          >
            <RefreshIcon size={17} color={refreshing ? color.faint : color.dark} />
          </div>
        </motion.div>

        {isStandalone() && isPushSupported() && (
          <motion.div
            variants={STAGGER_ITEM}
            style={{
              marginTop: spacing.gapLg,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: spacing.gapMd,
              padding: spacing.cardPadding,
              background: color.bg,
              border: `1px solid ${color.border}`,
              borderRadius: 18,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
              <div
                style={{
                  flex: 'none',
                  width: 32,
                  height: 32,
                  borderRadius: 10,
                  background: color.surfaceMuted,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <BellIcon size={16} color={color.dark} />
              </div>
              <div style={{ minWidth: 0 }}>
                <div style={{ color: color.dark, fontSize: 14.5, fontWeight: 700 }}>Notificações de novas dicas</div>
                <div style={{ color: pushBlocked ? color.danger : pushEnabled ? color.success : color.muted, fontSize: 12, fontWeight: 600, marginTop: 1 }}>
                  {pushBlocked ? 'Bloqueadas nas configurações do navegador' : pushEnabled ? 'Ativadas' : 'Desativadas'}
                </div>
              </div>
            </div>
            <Toggle checked={pushEnabled && !pushBlocked} onChange={handleTogglePush} />
          </motion.div>
        )}

        <motion.div
          variants={STAGGER_ITEM}
          onClick={() => navigate('/configuracoes')}
          style={{
            marginTop: spacing.gapLg,
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            padding: spacing.cardPadding,
            background: color.bg,
            border: `1px solid ${color.border}`,
            borderRadius: 18,
            cursor: 'pointer',
          }}
        >
          <div
            style={{
              flex: 'none',
              width: 32,
              height: 32,
              borderRadius: 10,
              background: color.surfaceMuted,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <SettingsIcon size={16} color={color.dark} />
          </div>
          <div style={{ flex: 1, color: color.dark, fontSize: 14.5, fontWeight: 700 }}>Configurações</div>
          <AltArrowRightIcon size={16} color={color.muted} />
        </motion.div>

        <motion.div
          variants={STAGGER_ITEM}
          onClick={() => setShowWelcome(true)}
          style={{
            marginTop: spacing.gapLg,
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            padding: spacing.cardPadding,
            background: color.bg,
            border: `1px solid ${color.border}`,
            borderRadius: 18,
            cursor: 'pointer',
          }}
        >
          <div
            style={{
              flex: 'none',
              width: 32,
              height: 32,
              borderRadius: 10,
              background: color.surfaceMuted,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <PlayCircleIcon size={16} color={color.dark} />
          </div>
          <div style={{ flex: 1, color: color.dark, fontSize: 14.5, fontWeight: 700 }}>Ver tela de boas-vindas</div>
          <AltArrowRightIcon size={16} color={color.muted} />
        </motion.div>
      </motion.div>

      {showWelcome && <WelcomeScreen onClose={() => setShowWelcome(false)} />}
    </div>
  );
}
