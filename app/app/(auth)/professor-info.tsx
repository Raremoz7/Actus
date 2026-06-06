// [fluxo futuro] auto-cadastro de profissional não existe na API v1 —
// a conta do professor é criada pela equipe Actus (credenciamento).
import { useEffect } from 'react';
import { Linking, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming,
} from 'react-native-reanimated';
import { router } from 'expo-router';
import { StyleSheet } from 'react-native-unistyles';

import { AppText, Button, ScreenHero } from '@/components/ui';
import { goBackOr } from '@/lib/nav';
import { darkTheme } from '@/theme';

const { motion } = darkTheme;

// [ASSET TEMPORÁRIO] placeholder Unsplash até as fotos curadas chegarem.
const PROFESSOR_PHOTO = {
  uri: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=1080&q=70&auto=format&fit=crop',
};

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
        <AppText variant="bodyLg">{step.title}</AppText>
        <AppText variant="bodySm" color="tertiary" style={styles.stepDetail}>
          {step.detail}
        </AppText>
      </View>
    </Animated.View>
  );
}

export default function ProfessorInfoScreen() {
  return (
    <View style={styles.root}>
      <ScreenHero
        photo={PROFESSOR_PHOTO}
        eyebrow="Acesso de professor"
        title={'Credenciamento\nActus'}
        titleSize={30}
        onBack={() => goBackOr('/(auth)/escolha-perfil')}
      />

      <View style={styles.body}>
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
    </View>
  );
}

const styles = StyleSheet.create((theme) => ({
  root: {
    flex: 1,
    backgroundColor: theme.colors.bgBase,
  },
  body: {
    flex: 1,
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.xl,
    paddingBottom: theme.spacing.lg,
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
    lineHeight: 24,
  },
  stepBody: {
    flex: 1,
    gap: 2,
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
