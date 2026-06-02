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
      {/* Bloco neon full-bleed — cobre a área da status bar (edges top). */}
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

      {/* Base escura com as escolhas. */}
      <SafeAreaView edges={['bottom']} style={styles.base}>
        <View style={styles.baseInner}>
          <AppText variant="eyebrow" color="tertiary" style={styles.eyebrow}>
            Acesso
          </AppText>

          {/* "Sou aluno" — pill primário com layout interno custom. */}
          <PillAluno onPress={() => go('/(auth)/cadastro')} />

          {/* "Sou professor" — outline com chevron. */}
          <OutlineProfessor onPress={() => go('/(auth)/professor-info')} />

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

// Pill primário "Sou aluno": label à esquerda + tag mono "COM CONVITE →" à direita.
function PillAluno({ onPress }: { onPress: () => void }) {
  const scale = useSharedValue(1);
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Animated.View style={[styles.pillOuter, animatedStyle]}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Sou aluno, com convite"
        onPress={onPress}
        onPressIn={() => {
          scale.value = withTiming(0.98, { duration: motion.microMs });
        }}
        onPressOut={() => {
          scale.value = withTiming(1, { duration: motion.microMs });
        }}
        style={styles.pillFill}
      >
        <AppText variant="label" color="inverse">
          Sou aluno
        </AppText>
        <AppText variant="metaSmall" color="inverse" style={styles.pillTag}>
          COM CONVITE →
        </AppText>
      </Pressable>
    </Animated.View>
  );
}

// Outline "Sou professor": label à esquerda + chevron à direita. Radius input (12).
function OutlineProfessor({ onPress }: { onPress: () => void }) {
  const scale = useSharedValue(1);
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Animated.View style={[styles.outlineOuter, animatedStyle]}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Sou professor"
        onPress={onPress}
        onPressIn={() => {
          scale.value = withTiming(0.98, { duration: motion.microMs });
        }}
        onPressOut={() => {
          scale.value = withTiming(1, { duration: motion.microMs });
        }}
        style={styles.outlineFill}
      >
        <AppText variant="label" color="primary">
          Sou professor
        </AppText>
        <CaretRight size={18} weight="duotone" color={colors.textTertiary} />
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
    paddingTop: theme.spacing.xl,
  },
  eyebrow: {
    marginBottom: theme.spacing.lg,
    letterSpacing: 3,
  },
  // Pill primário
  pillOuter: {
    alignSelf: 'stretch',
    marginBottom: theme.spacing.md,
  },
  pillFill: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: theme.colors.neon,
    borderRadius: theme.radius.pill,
    paddingVertical: 17,
    paddingHorizontal: theme.spacing.xl,
  },
  pillTag: {
    letterSpacing: 1,
  },
  // Outline secundário
  outlineOuter: {
    alignSelf: 'stretch',
  },
  outlineFill: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: theme.colors.outline,
    borderRadius: theme.radius.input,
    paddingVertical: 15,
    paddingHorizontal: theme.spacing.xl,
  },
  entrarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 'auto',
    paddingBottom: theme.spacing.xl,
  },
  entrarLink: {
    fontFamily: theme.fontFamily.bodySemiBold,
  },
}));
