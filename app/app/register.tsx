import { useEffect } from 'react';
import { View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { StyleSheet } from 'react-native-unistyles';

import { Logo } from '@/components/ui';
import { useAuthStore } from '@/store/authStore';
import { useCadastroDraftStore } from '@/store/cadastroDraftStore';

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
    // Usuário já autenticado não cadastra de novo — volta pro dispatch.
    if (status === 'authenticated') {
      router.replace('/');
      return;
    }

    const inviteCode = firstParam(code);
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
