import { View } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';

import { Screen, AppText, KpiNumber } from '@/components/ui';
import { useHealth } from '@/hooks/useHealth';

// Tela de diagnóstico (somente DEV): prova a fundação ponta a ponta
// (env → axios → interceptors → react-query → parseApi → UI).
export default function HealthDevScreen() {
  if (!__DEV__) {
    return (
      <Screen padded>
        <AppText variant="bodyMd" color="secondary">
          Indisponível em produção.
        </AppText>
      </Screen>
    );
  }

  return <HealthContent />;
}

function HealthContent() {
  const { data, isLoading, isError } = useHealth();
  const baseUrl = process.env.EXPO_PUBLIC_API_BASE_URL ?? '(não configurada)';

  // 'OK' quando o backend respondeu { ok: true }; '—' enquanto carrega ou em erro.
  const value = data?.ok ? 'OK' : '—';

  return (
    <Screen padded>
      <View style={styles.block}>
        <AppText variant="eyebrow" color="tertiary">
          Health check
        </AppText>
        <KpiNumber value={value} size="big" tone={data?.ok ? 'neon' : 'primary'} />
      </View>

      <View style={styles.block}>
        <AppText variant="eyebrow" color="tertiary">
          Base URL
        </AppText>
        <AppText variant="bodySm" color="secondary">
          {baseUrl}
        </AppText>
      </View>

      <View style={styles.block}>
        <AppText variant="eyebrow" color="tertiary">
          Status
        </AppText>
        <AppText variant="bodySm" color="secondary">
          {isLoading ? 'consultando…' : isError ? 'falha na consulta' : 'ok'}
        </AppText>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create((theme) => ({
  block: {
    gap: theme.spacing.xs,
    marginBottom: theme.spacing.xl,
  },
}));
