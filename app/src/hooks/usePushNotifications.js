import { subscribeToPush, unsubscribeFromPush } from '../api/itineraryApi.js';

// Chave pública VAPID, injetada em build time (ver vite.config.js) — o
// front só precisa dela pra criar a subscription; a privada fica só no
// servidor (api/_push.js).
const VAPID_PUBLIC_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY;

// PushManager.subscribe espera a chave em Uint8Array, não na string base64
// que o VAPID gera — conversão padrão recomendada pela própria spec Web Push.
function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = atob(base64);
  return Uint8Array.from([...rawData].map((c) => c.charCodeAt(0)));
}

export function isPushSupported() {
  return 'serviceWorker' in navigator && 'PushManager' in window && Boolean(VAPID_PUBLIC_KEY);
}

export function getNotificationPermission() {
  return 'Notification' in window ? Notification.permission : 'unsupported';
}

// Pede a permissão nativa e, se concedida, cria a subscription no push
// service do navegador e salva no backend. Retorna o status final
// ('granted' | 'denied' | 'default') pra quem chamou decidir o que mostrar.
export async function requestPushPermission() {
  if (!isPushSupported()) return 'unsupported';

  const permission = await Notification.requestPermission();
  if (permission !== 'granted') return permission;

  const registration = await navigator.serviceWorker.ready;
  let subscription = await registration.pushManager.getSubscription();
  if (!subscription) {
    subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
    });
  }

  await subscribeToPush(subscription.toJSON());
  return 'granted';
}

export async function disablePushNotifications() {
  if (!isPushSupported()) return;
  const registration = await navigator.serviceWorker.ready;
  const subscription = await registration.pushManager.getSubscription();
  if (!subscription) return;
  await unsubscribeFromPush(subscription.endpoint);
  await subscription.unsubscribe();
}
