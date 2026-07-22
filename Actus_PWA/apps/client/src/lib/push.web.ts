// Variante WEB do push: no-op. Push web (Web Push / FCM web) fica para uma fase
// posterior; aqui tudo degrada para no-op para não quebrar o boot.
export async function getFcmPushToken(): Promise<{ token: string; platform: 'ios' | 'android' } | null> {
  return null;
}

export function onPushTokenRefresh(_cb: (token: string) => void): () => void {
  return () => {};
}

export type PushTapData = { type?: string } & Record<string, unknown>;

export function onPushNotificationTap(_cb: (data: PushTapData) => void): () => void {
  return () => {};
}
