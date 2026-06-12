import { useEffect } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { useLocalSearchParams } from 'expo-router';
import { CaretLeft, Trophy } from 'phosphor-react-native';
import { StyleSheet } from 'react-native-unistyles';

import { AppText, ListState } from '@/components/ui';
import { ChallengeCalendar, MyPositionCard, RankingRow } from '@/components/challenges';
import { useChallenges } from '@/hooks/useChallenges';
import { useChallengeRanking } from '@/hooks/useChallengeRanking';
import { goBackOr } from '@/lib/nav';
import { useMe } from '@/hooks/useMe';
import { challengeStatusLabel } from '@/lib/challenge';
import { formatDateLocal, shortDateBr } from '@/lib/format';
import { isApiError } from '@/api/errors';
import { darkTheme } from '@/theme';

const { motion, colors } = darkTheme;

// Ranking 403 por visibilidade/participação → privado (não é erro real).
// O backend responde 403 com error 'ranking_private' / 'forbidden_not_participant'
// (a branch real vem no body.error; o status reforça). Qualquer outro = erro real.
function isPrivateRankingError(error: unknown): boolean {
  if (!isApiError(error)) return false;
  if (error.httpStatus === 403) return true;
  return error.code === 'ranking_private' || error.code === 'forbidden_not_participant';
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
  const statusLabel = challenge
    ? challengeStatusLabel(challenge.status, item?.participant_status ?? 'active')
    : 'Desafio';

  const rows = ranking.data?.ranking ?? [];
  const myId = me.data?.id;
  const myRow = rows.find((r) => r.student_id === myId);
  const isPrivate = isPrivateRankingError(ranking.error);
  // Erro real = falhou e NÃO é o caso de ranking privado.
  const isRealRankingError = ranking.isError && !isPrivate;

  // Standing do próprio aluno para o bloco "Sua posição" (só com dado público).
  const myStanding = myRow
    ? {
        position: myRow.position,
        streakCurrent: myRow.streak_current_in_challenge,
        activeDays: myRow.active_days,
        streakBest: myRow.streak_best_in_challenge,
        lastActivityDate: myRow.last_activity_date,
      }
    : null;

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Voltar"
          hitSlop={12}
          onPress={() => goBackOr('/(aluno)/(tabs)/desafios')}
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
                  <AppText variant="eyebrow" color="neon">
                    {statusLabel}
                  </AppText>
                </View>
                <AppText variant="h1" style={styles.heroTitle}>
                  {challenge.name}
                </AppText>
                <AppText variant="metaSmall" color="tertiary" style={styles.period}>
                  {`${shortDateBr(challenge.starts_on)} até ${shortDateBr(challenge.ends_on)}`}
                </AppText>

                <View style={styles.calendar}>
                  <ChallengeCalendar
                    startsOn={challenge.starts_on}
                    endsOn={challenge.ends_on}
                    today={today}
                  />
                </View>
              </View>

              {/* Bloco ancorado "Sua posição" — entre hero e lista. */}
              {ranking.isLoading ? null : (
                <View style={styles.standing}>
                  <MyPositionCard
                    standing={myStanding}
                    isPrivate={isPrivate}
                    today={today}
                  />
                </View>
              )}

              <AppText variant="metaSmall" color="tertiary" style={styles.rule}>
                Pontua por dia com treino; ordena por sequência.
              </AppText>

              <AppText variant="eyebrow" color="tertiary" style={styles.secLabel}>
                Ranking
              </AppText>

              {ranking.isLoading ? (
                <ListState kind="loading" skeletonCount={4} />
              ) : isPrivate ? (
                <AppText variant="bodySm" color="tertiary">
                  O ranking deste desafio é privado. Seu progresso aparece acima.
                </AppText>
              ) : isRealRankingError ? (
                <ListState
                  kind="error"
                  title="Ranking indisponível"
                  message="Não foi possível carregar agora. Tente de novo."
                  actionLabel="Tentar de novo"
                  onAction={() => void ranking.refetch()}
                />
              ) : rows.length === 0 ? (
                <AppText variant="bodySm" color="tertiary">
                  Ninguém no ranking ainda. Seja o primeiro a treinar.
                </AppText>
              ) : (
                rows.map((row) => (
                  <RankingRow
                    key={row.student_id}
                    position={row.position}
                    name={row.display_name ?? 'Participante'}
                    activeDays={row.active_days}
                    streak={row.streak_current_in_challenge}
                    streakBest={row.streak_best_in_challenge}
                    lastActivityDate={row.last_activity_date}
                    today={today}
                    isMe={row.student_id === myId}
                  />
                ))
              )}
            </>
          ) : list.isLoading ? (
            <ListState kind="loading" skeletonCount={3} />
          ) : (
            <ListState
              kind="error"
              title="Desafio indisponível"
              message="Não foi possível carregar este desafio."
              actionLabel="Voltar"
              onAction={() => goBackOr('/(aluno)/(tabs)/desafios')}
            />
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
  calendar: { marginTop: theme.spacing.lg },
  standing: { marginTop: theme.spacing.lg },
  rule: { marginTop: theme.spacing.lg },
  secLabel: { marginTop: theme.spacing.xl, marginBottom: theme.spacing.sm },
}));
