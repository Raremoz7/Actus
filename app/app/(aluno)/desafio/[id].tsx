import { useEffect } from 'react';
import { ActivityIndicator, Pressable, ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { router, useLocalSearchParams } from 'expo-router';
import { CaretLeft, Trophy } from 'phosphor-react-native';
import { StyleSheet } from 'react-native-unistyles';

import { AppText } from '@/components/ui';
import { RankingRow } from '@/components/challenges';
import { useChallenges } from '@/hooks/useChallenges';
import { useChallengeRanking } from '@/hooks/useChallengeRanking';
import { useMe } from '@/hooks/useMe';
import { challengeDayProgress } from '@/lib/challenge';
import { formatDateLocal, shortDateBr } from '@/lib/format';
import { darkTheme } from '@/theme';

const { motion, colors } = darkTheme;

// Razão dia/total clampada a [0, 1] para a largura da barra.
function progressRatio(day: number, total: number): number {
  if (total <= 0) return 0;
  return Math.min(1, Math.max(0, day / total));
}

export default function DesafioDetailScreen() {
  // params podem chegar como string | string[] — normaliza para a primeira string.
  const params = useLocalSearchParams<{ id?: string | string[] }>();
  const id = Array.isArray(params.id) ? params.id[0] : params.id;

  const list = useChallenges();
  const me = useMe();
  const ranking = useChallengeRanking(id);

  // 1 momento de motion por tela: reveal de entrada.
  const opacity = useSharedValue(0);
  useEffect(() => {
    opacity.value = withTiming(1, { duration: motion.screenMs });
  }, [opacity]);
  const revealStyle = useAnimatedStyle(() => ({ opacity: opacity.value }));

  // O desafio vem da lista já cacheada (não há GET de detalhe na API v1).
  const item = list.data?.challenges.find((it) => it.challenge.id === id);
  const challenge = item?.challenge;

  // Hoje em componentes LOCAIS (nunca toISOString — bug de fuso UTC-3).
  const today = formatDateLocal(new Date());
  const dayProgress = challenge
    ? challengeDayProgress(challenge.starts_on, challenge.ends_on, today)
    : { day: 0, total: 1 };
  const ratio = progressRatio(dayProgress.day, dayProgress.total);

  const rows = ranking.data?.ranking ?? [];

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Voltar"
          hitSlop={12}
          onPress={() => router.back()}
          style={styles.back}
        >
          <CaretLeft size={20} weight="bold" color={colors.textSecondary} />
        </Pressable>
        <AppText variant="eyebrow" color="tertiary">
          Desafio
        </AppText>
      </View>

      <Animated.View style={[styles.flex, revealStyle]}>
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          {challenge ? (
            <>
              <View style={styles.hero}>
                <View style={styles.heroHead}>
                  <Trophy size={16} weight="duotone" color={colors.neon} />
                  <AppText variant="eyebrow" color="tertiary">
                    Desafio
                  </AppText>
                </View>
                <AppText variant="h1" style={styles.heroTitle}>
                  {challenge.name}
                </AppText>
                <AppText variant="metaSmall" color="tertiary" style={styles.period}>
                  {`${shortDateBr(challenge.starts_on)} até ${shortDateBr(challenge.ends_on)}`}
                </AppText>

                <View style={styles.progressRow}>
                  <AppText variant="metaSmall" color="tertiary">
                    {`dia ${dayProgress.day} de ${dayProgress.total}`}
                  </AppText>
                </View>
                <View style={styles.track}>
                  <View style={[styles.fill, { width: `${ratio * 100}%` }]} />
                </View>
              </View>

              <AppText variant="eyebrow" color="tertiary" style={styles.secLabel}>
                Ranking
              </AppText>

              {ranking.isLoading ? (
                <View style={styles.center}>
                  <ActivityIndicator size="small" color={colors.textTertiary} />
                </View>
              ) : ranking.isError ? (
                <AppText variant="bodySm" color="tertiary">
                  Ranking indisponível para este desafio.
                </AppText>
              ) : rows.length === 0 ? (
                <AppText variant="bodySm" color="tertiary">
                  Ninguém no ranking ainda.
                </AppText>
              ) : (
                rows.map((row) => (
                  <RankingRow
                    key={row.student_id}
                    position={row.position}
                    name={row.display_name ?? 'Participante'}
                    activeDays={row.active_days}
                    streak={row.streak_current_in_challenge}
                    isMe={row.student_id === me.data?.id}
                  />
                ))
              )}
            </>
          ) : list.isLoading ? (
            <View style={styles.center}>
              <ActivityIndicator size="small" color={colors.textTertiary} />
            </View>
          ) : (
            <AppText variant="bodySm" color="tertiary">
              Não foi possível carregar o desafio.
            </AppText>
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
  period: { marginTop: theme.spacing.xs },
  progressRow: { marginTop: theme.spacing.lg, marginBottom: theme.spacing.xs },
  track: {
    height: 6,
    borderRadius: theme.radius.pill,
    backgroundColor: theme.colors.surface3,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    borderRadius: theme.radius.pill,
    backgroundColor: theme.colors.neon,
  },
  secLabel: { marginTop: theme.spacing.xl, marginBottom: theme.spacing.sm },
  center: { paddingVertical: theme.spacing.xl, alignItems: 'center' },
}));
