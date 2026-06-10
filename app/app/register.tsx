import { useEffect } from 'react';
import { View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { StyleSheet } from 'react-native-unistyles';

import { Logo } from '@/components/ui';
import { useAuthStore } from '@/store/authStore';
import { useCadastroDraftStore } from '@/store/cadastroDraftStore';
import { PASSWORD_GATE } from '@/lib/authRoutes';

// Normaliza o param de query (pode vir como array em deep links).
function firstParam(value: string | string[] | undefined): string | null {
  if (Array.isArray(value)) return value[0] ?? null;
  return value ?? null;
}

// Rota de entrada por deep link com ?code=... → guarda o convite e encaminha pro cadastro.
export default function RegisterDeepLink() {
  const { code } = useLocalSearchParams<{ code?: string | string[] }>();
  const status = useAuthStore((s) => s.status);
  const setInviteCode = useCadastroDraftStore((s) => s.setInviteCode);

  useEffect(() => {
    // Cold start: espera o hydrate decidir a sessão (senão o code se perde no guard).
    if (status === 'hydrating') return;

    if (status === 'must_change_password') {
      router.replace(PASSWORD_GATE);
      return;
    }

    const inviteCode = firstParam(code);

    if (status === 'authenticated') {
      // Convite não cria conta de novo — vai pro fluxo de vínculo (guarda por tipo).
      router.replace(
        inviteCode ? `/usar-convite?code=${encodeURIComponent(inviteCode)}` : '/',
      );
      return;
    }

    setInviteCode(inviteCode);
    router.replace('/(auth)/cadastro');
  }, [code, status, setInviteCode]);

  // Tela de transição instantânea (sem flash de conteúdo).
  return (
    <View style={styles.container}>
      <Logo variant="symbol" color="neon" width={96} />
    </View>
  );
}

const styles = StyleSheet.create((theme) => ({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.bgLowest,
  },
}));
