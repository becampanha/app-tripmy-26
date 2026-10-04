import webpush from 'web-push';
import { getSql } from './_db.js';

let configured = false;
function ensureConfigured() {
  if (configured) return;
  webpush.setVapidDetails(
    process.env.VAPID_SUBJECT,
    process.env.VAPID_PUBLIC_KEY,
    process.env.VAPID_PRIVATE_KEY
  );
  configured = true;
}

// Envia a mesma notificação para todas as inscrições salvas — usado quando
// uma nova dica é publicada (ver places/recommendations.js). Inscrições que
// o push service recusa de vez (410 Gone / 404, dispositivo desinstalou o
// PWA ou revogou a permissão) são removidas da tabela; outros erros apenas
// seguem para a próxima inscrição, sem travar o envio dos demais.
export async function sendPushToAll(payload) {
  ensureConfigured();
  const sql = getSql();
  const subscriptions = await sql.query('SELECT endpoint, p256dh, auth FROM push_subscriptions');

  await Promise.all(
    subscriptions.map(async (sub) => {
      try {
        await webpush.sendNotification(
          {
            endpoint: sub.endpoint,
            keys: { p256dh: sub.p256dh, auth: sub.auth },
          },
          JSON.stringify(payload)
        );
      } catch (err) {
        if (err.statusCode === 404 || err.statusCode === 410) {
          await sql.query('DELETE FROM push_subscriptions WHERE endpoint = $1', [sub.endpoint]);
        }
      }
    })
  );
}
