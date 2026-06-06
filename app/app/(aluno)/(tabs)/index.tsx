import { useEffect } from 'react';
import { Pressable, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { router, type Href } from 'expo-router';
import { StyleSheet } from 'react-native-unistyles';

import { Screen, AppText } from '@/components/ui';
import {
  HomeHeader,
  WeekStrip,
  TodayWorkoutCard,
  DietCard,
  ChallengeCard,
} from '@/components/home';
import { useMe } from '@/hooks/useMe';
import { useWeeklyOverview } from '@/hooks/useWeeklyOverview';
import { useStudentWorkouts } from '@/hooks/useStudentWorkouts';
import { useStudentDiet } from '@/hooks/useStudentDiet';
import { useChallenges } from '@/hooks/useChallenges';
import { pickNextWorkout } from '@/lib/nextWorkout';
import { challengeDayProgress } from '@/lib/challenge';
import { greetingForHour } from '@/lib/greeting';
import { formatDateLocal } from '@/lib/format';
import { parseDietBody } from '@/types/diets';
import type { TodayWorkoutSummary, Weekday } from '@/types/workouts';
import { darkTheme } from '@/theme';

const { motion } = darkTheme;

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

export default function AlunoHojeScreen() {
  const me = useMe();
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
              est_minutes: 0,
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

  // Dieta em destaque: a ativa (fallback p/ a primeira); "próxima refeição" = 1ª refeição real.
  const activeDiet = diet.data?.diets.find((d) => d.is_active) ?? diet.data?.diets[0] ?? null;
  const firstMeal = activeDiet
    ? (parseDietBody(activeDiet.template_body).meals[0]?.name ?? null)
    : null;

  // Abrir o treino do dia (detalhe → onde "Iniciar treino" cria a sessão).
  function openTodayWorkout() {
    if (picked.next) router.push(`/(aluno)/treino/${picked.next.id}` as Href);
  }
  function seeWeek() {
    router.push('/(aluno)/(tabs)/treinos' as Href);
  }

  return (
    <Screen scroll padded>
      <Animated.View style={revealStyle}>
        <HomeHeader
          greeting={greeting}
          name={me.data?.display_name ?? null}
          streakCurrent={week.data?.streak_current ?? 0}
          dateLabel={dateLabelLocal(now)}
        />

        {todaySummary ? (
          <TodayWorkoutCard
            summary={todaySummary}
            onStart={openTodayWorkout}
            onSeeWeek={seeWeek}
          />
        ) : null}

        {week.data ? (
          <View style={styles.block}>
            <WeekStrip overview={week.data} />
          </View>
        ) : null}

        <View style={styles.row}>
          {activeDiet ? (
            <DietCard
              title={activeDiet.template_name}
              nextMealTime={firstMeal}
              onPress={() => router.push(`/(aluno)/dieta/${activeDiet.id}` as Href)}
            />
          ) : null}
          {activeChallenge && challengeProgress ? (
            <ChallengeCard
              title={activeChallenge.challenge.name}
              current={challengeProgress.day}
              total={challengeProgress.total}
              onPress={() => router.push('/(aluno)/(tabs)/desafios' as Href)}
            />
          ) : null}
        </View>

        {workouts.isError && week.isError ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Tentar de novo"
            onPress={() => {
              void me.refetch();
              void week.refetch();
              void workouts.refetch();
              void diet.refetch();
              void challenges.refetch();
            }}
            style={styles.retry}
          >
            <AppText variant="bodySm" color="tertiary">
              Não foi possível carregar agora. Tentar de novo.
            </AppText>
          </Pressable>
        ) : null}
      </Animated.View>
    </Screen>
  );
}

const styles = StyleSheet.create((theme) => ({
  block: { marginTop: theme.spacing.lg },
  retry: { marginTop: theme.spacing.lg, alignItems: 'center' },
  row: { flexDirection: 'row', gap: theme.spacing.md, marginTop: theme.spacing.lg },
}));
