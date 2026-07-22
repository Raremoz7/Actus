import { useEffect } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { CaretLeft, Trophy } from 'phosphor-react-native';
import { StyleSheet } from 'react-native-unistyles';

import { AppText, ListState } from '@/components/ui';
import { BadgeGrid } from '@/components/gamification/BadgeGrid';
import { useBadges } from '@/hooks/useBadges';
import { goBackOr } from '@/lib/nav';
import { darkTheme } from '@/theme';

const { motion, colors } = darkTheme;

// Tela de conquistas do aluno: grid de badges (conquistados/bloqueados) vindo de GET /me/badges.
export default function BadgesScreen() {
  const badges = useBadges();
  const list = badges.data?.badges ?? [];

  // 1 momento de motion por tela: reveal de entrada.
  const opacity = useSharedValue(0);
  useEffect(() => {
    opacity.value = withTiming(1, { duration: motion.screenMs });
  }, [opacity]);
  const revealStyle = useAnimatedStyle(() => ({ opacity: opacity.value }));

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Voltar"
          hitSlop={12}
          onPress={() => goBackOr('/(aluno)/(tabs)/perfil')}
          style={styles.back}
        >
          <CaretLeft size={20} weight="bold" color={colors.textSecondary} />
        </Pressable>
        <AppText variant="eyebrow" color="tertiary">
          Perfil
        </AppText>
      </View>

      <Animated.View style={[styles.flex, revealStyle]}>
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          <View style={styles.hero}>
            <View style={styles.heroHead}>
              <Trophy size={16} weight="duotone" color={colors.neon} />
              <AppText variant="eyebrow" color="neon">
                Suas conquistas
              </AppText>
            </View>
            <AppText variant="h1" style={styles.heroTitle}>
              Conquistas
            </AppText>
            <AppText variant="metaSmall" color="tertiary" style={styles.heroSub}>
              Treine com constância para desbloquear novas medalhas.
            </AppText>
          </View>

          {badges.isLoading ? (
            <View style={styles.body}>
              <ListState kind="loading" skeletonCount={3} />
            </View>
          ) : badges.isError ? (
            <View style={styles.body}>
              <ListState
                kind="error"
                title="Conquistas indisponíveis"
                message="Não foi possível carregar agora. Tente de novo."
                actionLabel="Tentar de novo"
                onAction={() => void badges.refetch()}
              />
            </View>
          ) : list.length === 0 ? (
            <View style={styles.body}>
              <AppText variant="bodySm" color="tertiary">
                Nenhuma conquista disponível ainda. Continue treinando.
              </AppText>
            </View>
          ) : (
            <View style={styles.body}>
              <BadgeGrid badges={list} />
            </View>
          )}
        </ScrollView>
      </Animated.View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create((theme) => ({
  safe: { flex: 1, backgroundColor: theme.colors.bgBase },
  flex: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.sm,
  },
  back: {
    width: 34,
    height: 34,
    borderRadius: theme.radius.pill,
    backgroundColor: theme.colors.surface1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scroll: { paddingHorizontal: theme.spacing.lg, paddingBottom: theme.spacing.xl },
  hero: {
    backgroundColor: theme.colors.surface1,
    borderWidth: 1,
    borderColor: theme.colors.outlineVariant,
    borderRadius: theme.radius.card,
    padding: theme.spacing.lg,
  },
  heroHead: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing.xs },
  heroTitle: { marginTop: theme.spacing.sm },
  heroSub: { marginTop: theme.spacing.xs },
  body: { marginTop: theme.spacing.lg },
}));
