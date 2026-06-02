// [fluxo futuro] auto-cadastro de profissional não existe na API v1 —
// a conta do professor é criada pela equipe Actus (credenciamento).
import { useEffect } from 'react';
import { Linking, Pressable, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming,
} from 'react-native-reanimated';
import { router } from 'expo-router';
import { CaretLeft } from 'phosphor-react-native';
import { StyleSheet } from 'react-native-unistyles';

import { AppText, Button, Screen } from '@/components/ui';
import { darkTheme } from '@/theme';

const { motion, colors } = darkTheme;

// [ajuste: definir canal de contato real]
const CONTATO_URL = 'mailto:contato@actus.fit';

type Step = {
  num: string;
  title: string;
  detail: string;
};

const STEPS: readonly Step[] = [
  { num: '01', title: 'Você fala com a equipe', detail: 'WhatsApp ou e-mail — leva minutos' },
  { num: '02', title: 'Validamos seu CREF/CRN', detail: 'Registro profissional ativo' },
  { num: '03', title: 'Acesso liberado', detail: 'E-mail e senha provisória na sua caixa' },
] as const;

// Linha de passo com entrada própria (stagger orquestrado pelo pai via delay).
function StepRow({ step, index, isLast }: { step: Step; index: number; isLast: boolean }) {
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(10);

  useEffect(() => {
    const delay = index * 60;
    opacity.value = withDelay(delay, withTiming(1, { duration: motion.screenMs }));
    translateY.value = withDelay(delay, withTiming(0, { duration: motion.screenMs }));
  }, [index, opacity, translateY]);

  const style = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }));

  return (
    <Animated.View style={[styles.step, !isLast && styles.stepDivider, style]}>
      <AppText variant="metaSmall" color="neon" style={styles.stepNum}>
        {step.num}
      </AppText>
      <View style={styles.stepBody}>
        <AppText variant="h3" style={styles.stepTitle}>
          {step.title}
        </AppText>
        <AppText variant="bodySm" color="tertiary" style={styles.stepDetail}>
          {step.detail}
        </AppText>
      </View>
    </Animated.View>
  );
}

export default function ProfessorInfoScreen() {
  return (
    <Screen padded>
      <View style={styles.flex}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Voltar"
          hitSlop={12}
          onPress={() => router.back()}
          style={styles.back}
        >
          <CaretLeft size={24} weight="duotone" color={colors.textTertiary} />
        </Pressable>

        <View style={styles.header}>
          <AppText variant="eyebrow" color="tertiary">
            Acesso de professor
          </AppText>
          <AppText variant="h1" style={styles.title}>
            Credenciamento{'\n'}Actus
          </AppText>
        </View>

        <View style={styles.steps}>
          {STEPS.map((step, index) => (
            <StepRow
              key={step.num}
              step={step}
              index={index}
              isLast={index === STEPS.length - 1}
            />
          ))}
        </View>

        <View style={styles.footer}>
          <Button
            variant="primary"
            label="Entrar com meus dados"
            onPress={() => router.push('/(auth)/login')}
          />
          <Button
            variant="secondary"
            label="Falar com a equipe Actus"
            onPress={() => {
              void Linking.openURL(CONTATO_URL);
            }}
          />
        </View>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create((theme) => ({
  flex: {
    flex: 1,
  },
  back: {
    alignSelf: 'flex-start',
    marginBottom: theme.spacing.lg,
  },
  header: {
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.xl,
  },
  title: {
    fontSize: 40,
    lineHeight: 40,
  },
  steps: {
    alignSelf: 'stretch',
  },
  step: {
    flexDirection: 'row',
    gap: theme.spacing.lg,
    paddingVertical: theme.spacing.lg,
  },
  stepDivider: {
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.outlineVariant,
  },
  stepNum: {
    fontSize: 13,
    lineHeight: 24,
  },
  stepBody: {
    flex: 1,
    gap: 2,
  },
  stepTitle: {
    fontSize: 16,
    lineHeight: 20,
  },
  stepDetail: {
    marginTop: 2,
  },
  footer: {
    marginTop: 'auto',
    gap: theme.spacing.md,
    paddingTop: theme.spacing.xl,
  },
}));
