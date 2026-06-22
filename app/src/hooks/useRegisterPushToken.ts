import { useEffect } from 'react';
import * as Notifications from 'expo-notifications';
import { useRouter, type Href } from 'expo-router';

import { api } from '@/api/client';
import { endpoints } from '@/api/endpoints';
import { useAuthStore } from '@/store/authStore';
import { getExpoPushToken } from '@/lib/push';

// Registra o Expo push token no backend quando o usuário autentica e trata o tap
// na notificação de conquista (deep link → tela de badges). Tudo best-effort:
// falha de permissão/token/registro não pode quebrar o app.
export function useRegisterPushToken(): void {
  const status = useAuthStore((s) => s.status);
  const router = useRouter();

  useEffect(() => {
    if (status !== 'authenticated') return;

    let mounted = true;
    void (async () => {
      try {
        const res = await getExpoPushToken();
        if (mounted && res) {
          await api.post(endpoints.me.deviceTokens, {
            expo_push_token: res.token,
            platform: res.platform,
          });
        }
      } catch {
        // best-effort: registro de push não bloqueia o uso do app.
      }
    })();

    const sub = Notifications.addNotificationResponseReceivedListener((response) => {
      const data = response.notification.request.content.data as { type?: string };
      if (data?.type === 'badge') {
        router.push('/(aluno)/badges' as Href);
      }
    });

    return () => {
      mounted = false;
      sub.remove();
    };
  }, [status, router]);
}
