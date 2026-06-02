import { useEffect } from 'react';
import { Pressable, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import { CaretRight } from 'phosphor-react-native';
import { StyleSheet } from 'react-native-unistyles';

import { AppText, Logo } from '@/components/ui';
import { darkTheme } from '@/theme';

const { motion, colors } = darkTheme;

export default function EscolhaPerfilScreen() {
  const router = useRouter();

  // ÚNICA animação da tela: o bloco neon desliza de cima no load.
  const blockY = useSharedValue(-40);
  const blockOpacity = useSharedValue(0);

  useEffect(() => {
    blockY.value = withTiming(0, { duration: motion.screenMs });
    blockOpacity.value = withTiming(1, { duration: motion.screenMs });
  }, [blockY, blockOpacity]);

  const blockStyle = useAnimatedStyle(() => ({
    opacity: blockOpacity.value,
    transform: [{ translateY: blockY.value }],
  }));

  function go(path: '/(auth)/cadastro' | '/(auth)/professor-info' | '/(auth)/login') {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push(path);
  }

  return (
    <View style={styles.root}>
      {/* Bloco neon full-bleed — inalterado. Cobre a área da status bar (edges top). */}
      <Animated.View style={blockStyle}>
        <SafeAreaView edges={['top']} style={styles.neonBlock}>
          <View style={styles.neonInner}>
            <Logo variant="symbol" color="dark" width={44} />
            <AppText variant="h1" color="inverse" style={styles.manifesto}>
              O sistema por trás do movimento
            </AppText>
          </View>
        </SafeAreaView>
      </Animated.View>

      {/* Base escura — escolhas distribuídas no eixo (B). */}
      <SafeAreaView edges={['bottom']} style={styles.base}>
        <View style={styles.baseInner}>
          <View style={styles.spacer} />

          <AppText variant="eyebrow" color="tertiary" style={styles.eyebrow}>
            Acesso
          </AppText>

          {/* As duas escolhas — cards-irmãos, mesmo raio. */}
          <ChoiceCard
            variant="primary"
            title="Sou aluno"
            description="Recebi um convite do meu treinador"
            accessibilityLabel="Sou aluno, com convite"
            onPress={() => go('/(auth)/cadastro')}
          />
          <ChoiceCard
            variant="secondary"
            title="Sou professor"
            description="Gerencio meus alunos"
            accessibilityLabel="Sou professor"
            onPress={() => go('/(auth)/professor-info')}
          />

          <View style={styles.spacer} />

          <Pressable
            accessibilityRole="link"
            accessibilityLabel="Já tenho conta. Entrar"
            onPress={() => go('/(auth)/login')}
            hitSlop={12}
            style={styles.entrarRow}
          >
            <AppText variant="bodyMd" color="secondary">
              Já tenho conta ·{' '}
            </AppText>
            <AppText variant="bodyMd" color="neon" style={styles.entrarLink}>
              Entrar
            </AppText>
          </Pressable>
        </View>
      </SafeAreaView>
    </View>
  );
}

// Card de escolha: título + descrição à esquerda, chevron à direita.
// variant 'primary' = fill neon · 'secondary' = outline. Mesmo raio (input/12).
type ChoiceCardProps = {
  variant: 'primary' | 'secondary';
  title: string;
  description: string;
  accessibilityLabel: string;
  onPress: () => void;
};

function ChoiceCard({
  variant,
  title,
  description,
  accessibilityLabel,
  onPress,
}: ChoiceCardProps) {
  const scale = useSharedValue(1);
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const isPrimary = variant === 'primary';

  return (
    <Animated.View style={[styles.cardOuter, animatedStyle]}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel}
        onPress={onPress}
        onPressIn={() => {
          scale.value = withTiming(0.98, { duration: motion.microMs });
        }}
        onPressOut={() => {
          scale.value = withTiming(1, { duration: motion.microMs });
        }}
        style={[styles.cardFill, isPrimary ? styles.cardPrimary : styles.cardSecondary]}
      >
        <View style={styles.cardText}>
          <AppText variant="label" color={isPrimary ? 'inverse' : 'primary'}>
            {title}
          </AppText>
          <AppText
            variant="bodySm"
            color={isPrimary ? 'inverse' : 'tertiary'}
            style={isPrimary ? styles.descPrimary : undefined}
          >
            {description}
          </AppText>
        </View>
        <CaretRight
          size={18}
          weight="duotone"
          color={isPrimary ? colors.textInverse : colors.textTertiary}
        />
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create((theme) => ({
  root: {
    flex: 1,
    backgroundColor: theme.colors.bgBase,
  },
  neonBlock: {
    backgroundColor: theme.colors.neon,
  },
  neonInner: {
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.xl,
    paddingBottom: theme.spacing.xxl,
  },
  manifesto: {
    marginTop: theme.spacing.lg,
    fontSize: 38,
    lineHeight: Math.round(38 * 0.92),
  },
  base: {
    flex: 1,
  },
  baseInner: {
    flex: 1,
    paddingHorizontal: theme.spacing.lg,
  },
  // Espaçadores que distribuem as escolhas no eixo (B) e ancoram "Entrar" no rodapé.
  spacer: {
    flex: 1,
  },
  eyebrow: {
    marginBottom: theme.spacing.lg,
    letterSpacing: 3,
  },
  // Card de escolha (par)
  cardOuter: {
    alignSelf: 'stretch',
    marginBottom: theme.spacing.md,
  },
  cardFill: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: theme.radius.input,
    paddingVertical: theme.spacing.xl,
    paddingHorizontal: theme.spacing.xl,
  },
  cardPrimary: {
    backgroundColor: theme.colors.neon,
  },
  cardSecondary: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: theme.colors.outline,
  },
  cardText: {
    flex: 1,
    gap: theme.spacing.xs,
  },
  // Descrição sobre fundo neon: texto inverse atenuado (opacity, não hex novo).
  descPrimary: {
    opacity: 0.6,
  },
  entrarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: theme.spacing.xl,
  },
  entrarLink: {
    fontFamily: theme.fontFamily.bodySemiBold,
  },
}));
