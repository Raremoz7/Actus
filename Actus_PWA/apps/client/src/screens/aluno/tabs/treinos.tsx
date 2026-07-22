import { useEffect } from 'react';
import { RefreshControl, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { router, type Href } from '@/navigation';
import { Barbell } from 'phosphor-react-native';
import { StyleSheet } from 'react-native-unistyles';

import { Screen, AppText, ListState, TopBar } from '@/components/ui';
import { NextWorkoutCard, WorkoutListRow, WeekStrip } from '@/components/workouts';
import {
  lastCompletedLabel,
  estMinutesFromCount,
} from '@/components/workouts/workoutMeta';
import { useStudentWorkouts } from '@/hooks/useStudentWorkouts';
import { pickNextWorkout } from '@/lib/nextWorkout';
import type { Weekday } from '@/types/workouts';
import { darkTheme } from '@/theme';

const { motion, colors } = darkTheme;

// weekday local ISO 1..7 (1=seg). getDay(): 0=dom..6=sab.
function todayWeekday(): Weekday {
  const dow = new Date().getDay();
  return (dow === 0 ? 7 : dow) as Weekday;
}

const NAMES: Record<Weekday, string> = {
  1: 'Seg', 2: 'Ter', 3: 'Qua', 4: 'Qui', 5: 'Sex', 6: 'Sáb', 7: 'Dom',
};
// Rótulo do primeiro dia agendado do treino (ex.: "Seg").
function firstDayLabel(weekdays: number[]): string {
  const first = [...weekdays].sort((a, b) => a - b)[0];
  return first ? (NAMES[first as Weekday] ?? '') : '';
}

export default function AlunoTreinosScreen() {
  const list = useStudentWorkouts();

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

  const items = list.data?.student_workouts ?? [];
  const today = todayWeekday();
  const picked = pickNextWorkout(items, today);

  function openDetail(id: string) {
    router.push(`/(aluno)/treino/${id}` as Href);
  }

  return (
    <Screen edges={['top']}>
      <TopBar title="Treinos" />
      <Animated.ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={list.isRefetching}
            onRefresh={() => void list.refetch()}
            tintColor={colors.neon}
            colors={[colors.neon]}
          />
        }
      >
      <Animated.View style={revealStyle}>
        {items.length > 0 ? (
          <View style={styles.strip}>
            <WeekStrip workouts={items} today={today} />
          </View>
        ) : null}

        {picked.next ? (
          <NextWorkoutCard
            title={picked.next.workout_notes ?? picked.next.workout_name}
            exerciseCount={picked.next.exercise_count}
            estMinutes={estMinutesFromCount(picked.next.exercise_count)}
            isToday={picked.isToday}
            lastCompletedLabel={lastCompletedLabel(picked.next.last_completed_date)}
            onStart={() => openDetail(picked.next!.id)}
            onOpen={() => openDetail(picked.next!.id)}
          />
        ) : null}

        {picked.rest.length > 0 ? (
          <View style={styles.block}>
            <AppText variant="eyebrow" color="tertiary" style={styles.restLabel}>
              Resto da semana
            </AppText>
            {picked.rest.map((w) => {
              const est = estMinutesFromCount(w.exercise_count);
              const meta =
                est > 0
                  ? `${firstDayLabel(w.weekdays)} · ${w.exercise_count} exerc. · ~${est} min`
                  : `${firstDayLabel(w.weekdays)} · ${w.exercise_count} exerc.`;
              return (
                <WorkoutListRow
                  key={w.id}
                  title={w.workout_notes ?? w.workout_name}
                  subtitle={meta}
                  lastCompletedLabel={lastCompletedLabel(w.last_completed_date)}
                  onPress={() => openDetail(w.id)}
                />
              );
            })}
          </View>
        ) : null}

        {list.isLoading ? (
          <View style={styles.block}>
            <ListState kind="loading" skeletonCount={3} />
          </View>
        ) : null}

        {!list.isLoading && !list.isError && items.length === 0 ? (
          <View style={styles.block}>
            <ListState
              kind="empty"
              icon={Barbell}
              title="Nenhum treino ainda"
              message="Seu profissional ainda não atribuiu treinos. Eles aparecem aqui assim que chegarem."
            />
          </View>
        ) : null}

        {list.isError ? (
          <View style={styles.block}>
            <ListState
              kind="error"
              title="Não foi possível carregar"
              message="Verifique a conexão e tente novamente."
              actionLabel="Tentar de novo"
              onAction={() => void list.refetch()}
            />
          </View>
        ) : null}
      </Animated.View>
      </Animated.ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create((theme) => ({
  scroll: { padding: theme.spacing.lg },
  strip: { marginBottom: theme.spacing.lg },
  block: { marginTop: theme.spacing.lg },
  restLabel: { marginBottom: theme.spacing.sm },
}));
