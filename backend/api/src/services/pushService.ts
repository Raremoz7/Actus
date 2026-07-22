import { Expo, type ExpoPushMessage } from "expo-server-sdk";
import type { PoolClient } from "pg";

const expo = new Expo();

// firebase-admin é carregado LAZY e só inicializa se houver credencial
// (GOOGLE_APPLICATION_CREDENTIALS apontando para o service account JSON, ou
// FIREBASE_SERVICE_ACCOUNT com o JSON inline). Sem credencial, tokens FCM são
// ignorados silenciosamente (push é best-effort).
type FirebaseMessaging = {
  send: (message: {
    token: string;
    notification: { title: string; body: string };
    data: Record<string, string>;
    android: { notification: { sound: string } };
  }) => Promise<string>;
};

let fcmMessaging: FirebaseMessaging | null | undefined;

function getFcm(): FirebaseMessaging | null {
  if (fcmMessaging !== undefined) return fcmMessaging;
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const admin = require("firebase-admin") as {
      apps: unknown[];
      initializeApp: (opts?: unknown) => unknown;
      credential: { cert: (sa: unknown) => unknown; applicationDefault: () => unknown };
      messaging: () => FirebaseMessaging;
    };
    if (admin.apps.length === 0) {
      const inline = process.env.FIREBASE_SERVICE_ACCOUNT;
      if (inline) {
        admin.initializeApp({ credential: admin.credential.cert(JSON.parse(inline)) });
      } else if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
        admin.initializeApp({ credential: admin.credential.applicationDefault() });
      } else {
        fcmMessaging = null;
        return null;
      }
    }
    fcmMessaging = admin.messaging() as unknown as FirebaseMessaging;
  } catch {
    fcmMessaging = null;
  }
  return fcmMessaging ?? null;
}

export function buildBadgeMessages(
  tokens: string[],
  badge: { id: string; name: string },
): ExpoPushMessage[] {
  return tokens
    .filter((t) => Expo.isExpoPushToken(t))
    .map((to) => ({
      to,
      sound: "default",
      title: "🏆 Nova Conquista!",
      body: `${badge.name} desbloqueado. Toque para ver`,
      data: { type: "badge", badge_id: badge.id },
    }));
}

/** Busca tokens do usuário. */
export async function tokensForUser(client: PoolClient, userId: string): Promise<string[]> {
  const r = await client.query<{ expo_push_token: string }>(
    `select expo_push_token from public.device_tokens where user_id = $1`,
    [userId],
  );
  return r.rows.map((x) => x.expo_push_token);
}

/** Envia para tokens FCM crus via firebase-admin; poda tokens inválidos. */
async function sendFcmBadgeNotifications(
  client: PoolClient,
  tokens: string[],
  badges: { id: string; name: string }[],
): Promise<void> {
  const fcm = getFcm();
  if (!fcm || tokens.length === 0) return;
  for (const badge of badges) {
    for (const token of tokens) {
      try {
        await fcm.send({
          token,
          notification: {
            title: "🏆 Nova Conquista!",
            body: `${badge.name} desbloqueado. Toque para ver`,
          },
          // data precisa ser string→string no FCM; o app lê data.type === 'badge'.
          data: { type: "badge", badge_id: badge.id },
          android: { notification: { sound: "default" } },
        });
      } catch (e) {
        const code = (e as { code?: string })?.code ?? "";
        if (code === "messaging/registration-token-not-registered") {
          await client.query(`delete from public.device_tokens where expo_push_token = $1`, [
            token,
          ]);
        }
        // outros erros: best-effort, segue.
      }
    }
  }
}

/** Envio best-effort; poda tokens DeviceNotRegistered. Nunca lança. */
export async function sendBadgeNotifications(
  client: PoolClient,
  userId: string,
  badges: { id: string; name: string }[],
): Promise<void> {
  if (badges.length === 0) return;
  try {
    const tokens = await tokensForUser(client, userId);
    if (tokens.length === 0) return;

    // Divide por provedor: ExponentPushToken[...] → Expo Push; resto → FCM cru.
    const expoTokens = tokens.filter((t) => Expo.isExpoPushToken(t));
    const fcmTokens = tokens.filter((t) => !Expo.isExpoPushToken(t));

    await sendFcmBadgeNotifications(client, fcmTokens, badges);

    if (expoTokens.length === 0) return;
    const messages = badges.flatMap((b) => buildBadgeMessages(expoTokens, b));
    const chunks = expo.chunkPushNotifications(messages);
    for (const chunk of chunks) {
      const tickets = await expo.sendPushNotificationsAsync(chunk);
      for (let i = 0; i < tickets.length; i++) {
        const t = tickets[i];
        if (t.status === "error" && t.details?.error === "DeviceNotRegistered") {
          const dead = chunk[i].to as string;
          await client.query(`delete from public.device_tokens where expo_push_token = $1`, [dead]);
        }
      }
    }
  } catch {
    // best-effort: falha de push não afeta a conquista.
  }
}
