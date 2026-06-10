// Convide seu primeiro aluno — reusa o fluxo REAL de convites (/convite/novo).
// "Inserir aluno manualmente" = [fluxo futuro] (sem endpoint). Pular finaliza.
import { router } from 'expo-router';
import { View } from 'react-native';
import { PaperPlaneTilt } from 'phosphor-react-native';
import { StyleSheet } from 'react-native-unistyles';

import { AppText } from '@/components/ui';
import { OnboardingScreen } from '@/components/onboarding';
import { useAuthStore } from '@/store/authStore';
import { useOnboardingStore } from '@/store/onboardingStore';
import { homeForTipo } from '@/lib/authRoutes';
import { darkTheme } from '@/theme';

const { colors } = darkTheme;

export default function ConviteOnboardingScreen() {
  const user = useAuthStore((s) => s.user);
  const markDone = useOnboardingStore((s) => s.markDone);

  async function finish(thenInvite: boolean) {
    if (!user) return;
    await markDone(user.id);
    if (thenInvite) {
      // Home primeiro (replace) e o fluxo real de convite por cima (push):
      // ao fechar o convite, o professor está na home — onboarding não volta.
      router.replace(homeForTipo('personal'));
      router.push('/convite/novo');
      return;
    }
    router.replace(homeForTipo('personal'));
  }

  return (
    <OnboardingScreen
      step={4}
      total={4}
      title="Convide seu primeiro aluno"
      subtitle="Você compartilha um link; o aluno cria a conta já vinculada a você."
      ctaLabel="Convidar aluno"
      onCta={() => void finish(true)}
      skipLabel="Pular por enquanto"
      onSkip={() => void finish(false)}
    >
      <View style={styles.hero}>
        <PaperPlaneTilt size={56} weight="duotone" color={colors.neon} />
        <AppText variant="bodyMd" color="secondary" style={styles.text}>
          O convite é o jeito mais rápido de trazer um aluno — leva menos de um minuto.
        </AppText>
      </View>
    </OnboardingScreen>
  );
}

const styles = StyleSheet.create((theme) => ({
  hero: { alignItems: 'center', gap: theme.spacing.md, paddingVertical: theme.spacing.xl },
  text: { textAlign: 'center' },
}));
