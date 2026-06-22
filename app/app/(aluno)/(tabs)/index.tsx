import { useEffect } from 'react';
import { Pressable, RefreshControl, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { router, type Href } from 'expo-router';
import { StyleSheet } from 'react-native-unistyles';

import { Screen, AppText, Button, ListState } from '@/components/ui';
import {
  HomeHeader,
  WeekStrip,
  TodayWorkoutCard,
  DietCard,
  ChallengeCard,
  ParqPromptCard,
} from '@/components/home';
import { StreakCounter } from '@/components/gamification/StreakCounter';
import { useMe } from '@/hooks/useMe';
import { useWeeklyOverview } from '@/hooks/useWeeklyOverview';
import { useStudentWorkouts } from '@/hooks/useStudentWorkouts';
import { useStudentDiet } from '@/hooks/useStudentDiet';
import { useChallenges } from '@/hooks/useChallenges';
import { pickNextWorkout } from '@/lib/nextWorkout';
import { challengeDayProgress } from '@/lib/challenge';
import { greetingForHour } from '@/lib/greeting';
import { useParqHydrated, useParqSubmission } from '@/hooks/useParq';
import { parqStatus } from '@/lib/parq';
import { useStudentAnswers } from '@/mocks/studentOnboarding';
import { formatDateLocal } from '@/lib/format';
import { parseDietBody } from '@/types/diets';
import type { TodayWorkoutSummary, Weekday } from '@/types/workouts';
import { darkTheme } from '@/theme';

const { motion, colors } = darkTheme;

// Rótulo de data PT curto: "Terça · 03 jun". Usa componentes LOCAIS do Date.
const DIAS = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
const MESES = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];
function dateLabelLocal(d: Date): string {
  return `${DIAS[d.getDay()]} · ${String(d.getDate()).padStart(2, '0')} ${MESES[d.getMonth()]}`;
}

// weekday local ISO 1..7 (1=seg). getDay(): 0=dom..6=sab.
function todayWeekday(d: Date): Weekday {
  const dow = d.getDay();
  return (dow === 0 ? 7 : dow) as Weekday;
}

// Duração estimada do treino a partir da contagem de exercícios (sem `sets` na
// lista). Heurística honesta: ~7 min por exercício (séries + descanso), arredondado
// a múltiplos de 5. Não inventa precisão — é um "~N min".
function estimateMinutes(exerciseCount: number): number {
  if (exerciseCount <= 0) return 0;
  return Math.max(5, Math.round((exerciseCount * 7) / 5) * 5);
}

export default function AlunoHojeScreen() {
  const me = useMe();
  const parqSub = useParqSubmission(me.data?.id);
  const parqHydrated = useParqHydrated();
  const parqState = parqStatus(parqSub, new Date());
  // Só pinta o card depois do /me e da hidratação do mock — sem isso, todo cold start
  // mostraria o CTA neon "Responda" por alguns frames para quem já respondeu.
  const parqReady = parqHydrated && Boolean(me.data?.id);
  // Status de vínculo do onboarding (mock) — decide a copy do estado vazio da Home.
  const answers = useStudentAnswers(me.data?.id);
  const week = useWeeklyOverview();
  const workouts = useStudentWorkouts();
  const diet = useStudentDiet();
  const challenges = useChallenges();

  // ÚNICA animação da tela: reveal de entrada (opacity + translateY, 300ms).
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(12);
  useEffect(() => {
    opacity.value = withTiming(1, { duration: motion.screenMs });
    translateY.value = withTiming(0, { duration: motion.screenMs });
  }, [opacity, translateY]);
  const revealStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }));

  const now = new Date();
  const greeting = greetingForHour(now.getHours());
  const todayStr = formatDateLocal(now);

  // Treino do dia derivado da lista real /me/workouts (não há endpoint "treino de hoje").
  // pickNextWorkout decide o de hoje (ou o próximo) pelo weekday local.
  const items = workouts.data?.student_workouts ?? [];
  const picked = pickNextWorkout(items, todayWeekday(now));

  // Treino de hoje já concluído? (last_completed_date === hoje LOCAL).
  const todayDone =
    picked.isToday && picked.next != null && picked.next.last_completed_date === todayStr;

  const todaySummary: TodayWorkoutSummary | null =
    picked.next == null
      ? items.length > 0
        ? { has_workout: false, workout: null, next_workout: null }
        : null
      : picked.isToday
        ? {
            has_workout: true,
            workout: {
              id: picked.next.workout_id,
              name: picked.next.workout_name,
              muscle_groups: picked.next.workout_notes ?? picked.next.workout_name,
              exercise_count: picked.next.exercise_count,
              est_minutes: estimateMinutes(picked.next.exercise_count),
            },
            next_workout: null,
          }
        : {
            has_workout: false,
            workout: null,
            next_workout: {
              weekday: ([...picked.next.weekdays].sort((a, b) => a - b)[0] ?? 1) as Weekday,
              muscle_groups: picked.next.workout_notes ?? picked.next.workout_name,
            },
          };

  // Weekdays com treino planejado (qualquer atribuição ativa) — alimenta a WeekStrip.
  const plannedWeekdays = Array.from(
    new Set(items.filter((i) => i.is_active).flatMap((i) => i.weekdays)),
  ) as Weekday[];

  // Desafio em destaque: primeiro desafio ativo (participação ativa).
  const activeChallenge =
    challenges.data?.challenges.find(
      (c) => c.participant_status === 'active' && c.challenge.status === 'active',
    ) ?? null;
  const challengeProgress = activeChallenge
    ? challengeDayProgress(
        activeChallenge.challenge.starts_on,
        activeChallenge.challenge.ends_on,
        todayStr,
      )
    : null;

  // Dieta em destaque: a ativa (fallback p/ a primeira). Dado honesto: nº de
  // refeições + meta de kcal (quando o nutri preencheu no body).
  const activeDiet = diet.data?.diets.find((d) => d.is_active) ?? diet.data?.diets[0] ?? null;
  const dietBody = activeDiet ? parseDietBody(activeDiet.template_body) : null;

  // Abrir o treino do dia (detalhe → onde "Iniciar treino" cria a sessão).
  function openTodayWorkout() {
    if (picked.next) router.push(`/(aluno)/treino/${picked.next.id}` as Href);
  }
  function seeWeek() {
    router.push('/(aluno)/(tabs)/treinos' as Href);
  }

  // Pull-to-refresh: recarrega todas as fontes da Home.
  function refreshAll() {
    void me.refetch();
    void week.refetch();
    void workouts.refetch();
    void diet.refetch();
    void challenges.refetch();
  }

  // Carregando pela primeira vez: enquanto QUALQUER fonte ainda carrega, skeleton —
  // evita piscar "Plano em preparo" quando só as fontes rápidas resolveram (OR, não AND).
  const initialLoading =
    workouts.isLoading || week.isLoading || diet.isLoading || challenges.isLoading;

  // Qualquer fonte em erro mostra o retry (antes era AND — escondia falhas parciais).
  const anyError =
    me.isError || week.isError || workouts.isError || diet.isError || challenges.isError;

  // Sem treino atribuído (nenhuma atribuição ativa) → card de status por vínculo.
  // NÃO depende de week.data (o weekly-overview vem sempre populado) nem de dieta/
  // desafio: o aluno pode ter dieta da nutri e ainda não ter treino do personal.
  const noWorkoutYet = !initialLoading && !anyError && todaySummary == null;

  const refreshing =
    me.isRefetching ||
    week.isRefetching ||
    workouts.isRefetching ||
    diet.isRefetching ||
    challenges.isRefetching;

  const hasDiet = activeDiet != null && dietBody != null;
  const hasChallenge = activeChallenge != null && challengeProgress != null;
  // Quebra a simetria 50/50: largura total quando só um dos dois existe.
  const soloSecondary = hasDiet !== hasChallenge;

  return (
    <Screen edges={['top']}>
      <Animated.ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={refreshAll}
            tintColor={colors.neon}
            colors={[colors.neon]}
          />
        }
      >
        <Animated.View style={revealStyle}>
          <HomeHeader
            greeting={greeting}
            name={me.data?.display_name ?? null}
            dateLabel={dateLabelLocal(now)}
          />

          {initialLoading ? <ListState kind="loading" skeletonCount={3} /> : null}

          {parqReady ? (
            <View style={styles.parqCard}>
              <ParqPromptCard
                status={parqState}
                validUntil={parqSub?.valid_until ?? null}
                onPress={() => router.push('/par-q' as Href)}
              />
            </View>
          ) : null}

          {/* HERÓI: o treino do dia ocupa o topo, com o maior peso visual. */}
          {todaySummary ? (
            <TodayWorkoutCard
              summary={todaySummary}
              onStart={openTodayWorkout}
              onSeeWeek={seeWeek}
              done={todayDone}
            />
          ) : null}

          {week.data ? (
            <View style={styles.section}>
              <StreakCounter
                streak={week.data.streak_current ?? 0}
                isBroken={week.data.is_broken ?? false}
              />
            </View>
          ) : null}

          {week.data ? (
            <View style={styles.section}>
              <WeekStrip overview={week.data} plannedWeekdays={plannedWeekdays} />
            </View>
          ) : null}

          {hasDiet || hasChallenge ? (
            <View style={[styles.section, styles.row]}>
              {hasDiet ? (
                <DietCard
                  title={activeDiet.template_name}
                  mealCount={dietBody.meals.length}
                  targetKcal={dietBody.target_kcal ?? null}
                  onPress={() => router.push(`/(aluno)/dieta/${activeDiet.id}` as Href)}
                />
              ) : null}
              {hasChallenge ? (
                <ChallengeCard
                  title={activeChallenge.challenge.name}
                  current={challengeProgress.day}
                  total={challengeProgress.total}
                  wide={soloSecondary}
                  onPress={() => router.push('/(aluno)/(tabs)/desafios' as Href)}
                />
              ) : null}
            </View>
          ) : null}

          {noWorkoutYet ? (
            answers?.link_status === 'none' ? (
              <View style={[styles.section, styles.statusCard]}>
                <AppText variant="bodyMd" color="secondary">
                  Você ainda não tem um personal vinculado.
                </AppText>
                <Button
                  variant="secondary"
                  label="Usar convite"
                  onPress={() => router.push('/usar-convite' as Href)}
                />
              </View>
            ) : (
              <View style={[styles.section, styles.statusCard]}>
                <AppText variant="bodyMd" color="secondary">
                  Seu personal já recebeu suas informações e poderá preparar seu treino.
                </AppText>
              </View>
            )
          ) : null}

          {anyError ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Tentar de novo"
              onPress={refreshAll}
              style={styles.retry}
            >
              <AppText variant="bodySm" color="tertiary">
                Não foi possível carregar agora. Tentar de novo.
              </AppText>
            </Pressable>
          ) : null}
        </Animated.View>
      </Animated.ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create((theme) => ({
  scroll: { padding: theme.spacing.lg },
  // Espaço MAIOR entre seções (hierarquia/respiro); o interior de cada bloco é justo.
  section: { marginTop: theme.spacing.xl },
  // Card do Par-Q: respiro próprio entre o header e o herói (que não usam .section).
  parqCard: { marginTop: 10, marginBottom: theme.spacing.md },
  statusCard: {
    backgroundColor: theme.colors.surface1,
    borderRadius: theme.radius.card,
    padding: theme.spacing.md,
    gap: theme.spacing.md,
  },
  retry: { marginTop: theme.spacing.xl, alignItems: 'center' },
  row: { flexDirection: 'row', gap: theme.spacing.md },
}));
