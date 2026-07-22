import { useEffect } from 'react';
import { useRouter, type Href } from '@/navigation';

import { api } from '@/api/client';
import { endpoints } from '@/api/endpoints';
import { useAuthStore } from '@/store/authStore';
import { getFcmPushToken, onPushTokenRefresh, onPushNotificationTap } from '@/lib/push';

// Registra o token FCM no backend quando o usuário autentica (e quando o token
// rotaciona) e trata o tap na notificação de conquista (deep link → badges).
// Tudo best-effort: falha de permissão/token/registro não pode quebrar o app.
export function useRegisterPushToken(): void {
  const status = useAuthStore((s) => s.status);
  const router = useRouter();

  useEffect(() => {
    if (status !== 'authenticated') return;

    let mounted = true;

    async function register(token: string, platform: 'ios' | 'android') {
      try {
        // Campo novo `fcm_token`; `expo_push_token` segue aceito pelo backend
        // na transição (apps antigos instalados).
        await api.post(endpoints.me.deviceTokens, { fcm_token: token, platform });
      } catch {
        // best-effort: registro de push não bloqueia o uso do app.
      }
    }

    void (async () => {
      const res = await getFcmPushToken();
      if (mounted && res) await register(res.token, res.platform);
    })();

    const unsubRefresh = onPushTokenRefresh((token) => {
      if (mounted) void register(token, 'android');
    });

    const unsubTap = onPushNotificationTap((data) => {
      if (data?.type === 'badge') {
        router.push('/(aluno)/badges' as Href);
      }
    });

    return () => {
      mounted = false;
      unsubRefresh();
      unsubTap();
    };
  }, [status, router]);
}
