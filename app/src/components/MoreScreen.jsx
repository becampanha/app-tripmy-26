import { useState } from 'react';
import { RefreshIcon } from '@solar-icons/react/bold/refresh';
import { color, spacing, type } from '../design-system/index.js';

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
  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await hardRefresh();
    } catch {
      setRefreshing(false);
    }
  };

  return (
    <div style={{ position: 'relative', width: '100%', minHeight: '100dvh', background: color.bg, boxSizing: 'border-box' }}>
      <div style={{ padding: `${spacing.screenGutter}px ${spacing.screenGutter}px 0` }}>
        <div style={{ ...type.mainTitle, color: color.dark }}>
          Mais
        </div>
      </div>

      <div style={{ marginTop: spacing.controlGap, boxSizing: 'border-box', padding: `2px ${spacing.screenGutter}px 120px` }}>
        <div
          style={{
            padding: spacing.cardPadding,
            background: color.bg,
            border: `1px solid ${color.border}`,
            borderRadius: 18,
          }}
        >
          <div style={{ ...type.eyebrow, color: color.faintIcon }}>Versão instalada</div>
          <div style={{ color: color.dark, fontSize: 15, fontWeight: 700, marginTop: 4 }}>
            {__BUILD_INFO__.commit}
          </div>
          <div style={{ color: color.muted, fontSize: 12.5, fontWeight: 600, marginTop: 2 }}>
            Publicada em {formatBuildDate(__BUILD_INFO__.builtAt)}
          </div>
        </div>

        <div
          onClick={handleRefresh}
          style={{
            marginTop: spacing.gapLg,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
            padding: spacing.cardPadding,
            borderRadius: 16,
            background: refreshing ? color.toggleOff : color.dark,
            color: color.white,
            fontSize: 14.5,
            fontWeight: 700,
            cursor: refreshing ? 'default' : 'pointer',
          }}
        >
          <RefreshIcon size={17} color={color.white} />
          {refreshing ? 'Atualizando…' : 'Forçar atualização (hard refresh)'}
        </div>

        <div style={{ color: color.faint, fontSize: 12, fontWeight: 500, marginTop: spacing.gapLg, lineHeight: 1.4, textAlign: 'center' }}>
          Limpa o cache local e recarrega o app do zero — use se o app parecer
          desatualizado depois de uma publicação nova.
        </div>
      </div>
    </div>
  );
}
