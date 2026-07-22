// Push via FCM (@react-native-firebase/messaging), substituindo o Expo Push.
// Os requires são LAZY e protegidos: sem google-services.json compilado no build
// (Firebase não configurado), tudo degrada para no-op — registro de push é
// best-effort e nunca pode quebrar o app.
import { PermissionsAndroid, Platform } from 'react-native';

type MessagingModule = typeof import('@react-native-firebase/messaging');

function loadMessaging(): MessagingModule | null {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    return require('@react-native-firebase/messaging') as MessagingModule;
  } catch {
    return null;
  }
}

// Obtém o token FCM, pedindo permissão se necessário (Android 13+ exige a
// runtime permission POST_NOTIFICATIONS). Retorna null se negado ou sem Firebase.
export async function getFcmPushToken(): Promise<{ token: string; platform: 'ios' | 'android' } | null> {
  try {
    const mod = loadMessaging();
    if (!mod) return null;

    if (Platform.OS === 'android' && Platform.Version >= 33) {
      const status = await PermissionsAndroid.request(
        'android.permission.POST_NOTIFICATIONS' as 'android.permission.POST_NOTIFICATIONS',
      );
      if (status !== PermissionsAndroid.RESULTS.GRANTED) return null;
    }

    const messaging = mod.getMessaging();
    const authStatus = await mod.requestPermission(messaging);
    const granted =
      authStatus === mod.AuthorizationStatus.AUTHORIZED ||
      authStatus === mod.AuthorizationStatus.PROVISIONAL;
    if (!granted) return null;

    const token = await mod.getToken(messaging);
    if (!token) return null;
    return { token, platform: Platform.OS === 'ios' ? 'ios' : 'android' };
  } catch {
    return null;
  }
}

// Tokens FCM rotacionam — re-registrar no backend quando mudar.
export function onPushTokenRefresh(cb: (token: string) => void): () => void {
  try {
    const mod = loadMessaging();
    if (!mod) return () => {};
    return mod.onTokenRefresh(mod.getMessaging(), cb);
  } catch {
    return () => {};
  }
}

export type PushTapData = { type?: string } & Record<string, unknown>;

// Tap em notificação (app em background → aberto, e app morto → boot).
// O callback recebe o `data` da mensagem (ex.: { type: 'badge' }).
export function onPushNotificationTap(cb: (data: PushTapData) => void): () => void {
  try {
    const mod = loadMessaging();
    if (!mod) return () => {};
    const messaging = mod.getMessaging();

    // App em background, usuário tocou na notificação.
    const unsub = mod.onNotificationOpenedApp(messaging, (message) => {
      if (message?.data) cb(message.data as PushTapData);
    });

    // App aberto A PARTIR da notificação (cold start).
    void mod.getInitialNotification(messaging).then((message) => {
      if (message?.data) cb(message.data as PushTapData);
    });

    return unsub;
  } catch {
    return () => {};
  }
}
