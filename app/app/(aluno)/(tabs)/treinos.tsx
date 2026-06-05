import { useEffect } from 'react';
import { View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { router, type Href } from 'expo-router';
import { StyleSheet } from 'react-native-unistyles';

import { Screen, AppText } from '@/components/ui';
import { NextWorkoutCard, WorkoutListRow } from '@/components/workouts';
import { useStudentWorkouts } from '@/hooks/useStudentWorkouts';
import { pickNextWorkout } from '@/lib/nextWorkout';
import type { Weekday } from '@/types/workouts';
import { darkTheme } from '@/theme';

const { motion } = darkTheme;

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
  const picked = pickNextWorkout(items, todayWeekday());

  function openDetail(id: string) {
    router.push(`/(aluno)/treino/${id}` as Href);
  }

  return (
    <Screen scroll padded>
      <Animated.View style={revealStyle}>
        <AppText variant="eyebrow" color="tertiary">
          Seus treinos
        </AppText>
        <AppText variant="h2" style={styles.title}>
          Treinos
        </AppText>

        {picked.next ? (
          <NextWorkoutCard
            title={picked.next.workout_notes ?? picked.next.workout_name}
            exerciseCount={picked.next.exercise_count}
            estMinutes={0}
            isToday={picked.isToday}
            onStart={() => openDetail(picked.next!.id)}
            onOpen={() => openDetail(picked.next!.id)}
          />
        ) : null}

        {picked.rest.length > 0 ? (
          <View style={styles.block}>
            <AppText variant="eyebrow" color="tertiary" style={styles.restLabel}>
              Resto da semana
            </AppText>
            {picked.rest.map((w) => (
              <WorkoutListRow
                key={w.id}
                title={w.workout_notes ?? w.workout_name}
                subtitle={`${firstDayLabel(w.weekdays)} · ${w.exercise_count} exerc.`}
                onPress={() => openDetail(w.id)}
              />
            ))}
          </View>
        ) : null}

        {!list.isLoading && items.length === 0 ? (
          <AppText variant="bodySm" color="tertiary" style={styles.block}>
            Nenhum treino atribuído ainda.
          </AppText>
        ) : null}

        {list.isError ? (
          <AppText variant="bodySm" color="tertiary" style={styles.block}>
            Não foi possível carregar agora.
          </AppText>
        ) : null}
      </Animated.View>
    </Screen>
  );
}

const styles = StyleSheet.create((theme) => ({
  title: { marginTop: theme.spacing.xs, marginBottom: theme.spacing.lg },
  block: { marginTop: theme.spacing.lg },
  restLabel: { marginBottom: theme.spacing.sm },
}));
