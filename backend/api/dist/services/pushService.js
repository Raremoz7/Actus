import { Expo } from "expo-server-sdk";
const expo = new Expo();
export function buildBadgeMessages(tokens, badge) {
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
export async function tokensForUser(client, userId) {
    const r = await client.query(`select expo_push_token from public.device_tokens where user_id = $1`, [userId]);
    return r.rows.map((x) => x.expo_push_token);
}
/** Envio best-effort; poda tokens DeviceNotRegistered. Nunca lança. */
export async function sendBadgeNotifications(client, userId, badges) {
    if (badges.length === 0)
        return;
    try {
        const tokens = await tokensForUser(client, userId);
        if (tokens.length === 0)
            return;
        const messages = badges.flatMap((b) => buildBadgeMessages(tokens, b));
        const chunks = expo.chunkPushNotifications(messages);
        for (const chunk of chunks) {
            const tickets = await expo.sendPushNotificationsAsync(chunk);
            for (let i = 0; i < tickets.length; i++) {
                const t = tickets[i];
                if (t.status === "error" && t.details?.error === "DeviceNotRegistered") {
                    const dead = chunk[i].to;
                    await client.query(`delete from public.device_tokens where expo_push_token = $1`, [dead]);
                }
            }
        }
    }
    catch {
        // best-effort: falha de push não afeta a conquista.
    }
}
