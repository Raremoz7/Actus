import { useEffect } from 'react';
import { ActivityIndicator, Pressable, ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { router, useLocalSearchParams, type Href } from 'expo-router';
import { CaretLeft, Play } from 'phosphor-react-native';
import { StyleSheet } from 'react-native-unistyles';

import { AppText } from '@/components/ui';
import { WorkoutDetailHeader, ExerciseCard, WorkoutHistory } from '@/components/workouts';
import { aggregatedMuscleGroups, planValidityLabel } from '@/components/workouts/workoutMeta';
import { useWorkoutDetail } from '@/hooks/useWorkoutDetail';
import { goBackOr } from '@/lib/nav';
import { useCreateSession } from '@/hooks/useCreateSession';
import { estimatedMinutes } from '@/lib/duration';
import { darkTheme } from '@/theme';

const { motion, colors } = darkTheme;

// Acima deste nº de exercícios, numeramos os cards p/ orientar treinos longos.
const NUMBER_THRESHOLD = 6;

export default function TreinoDetailScreen() {
  const params = useLocalSearchParams<{ id?: string }>();
  const id = typeof params.id === 'string' ? params.id : '';
  const detail = useWorkoutDetail(id);
  const createSession = useCreateSession();

  function handleStart() {
    if (!id || createSession.isPending) return;
    createSession.mutate(id, {
      onSuccess: (payload) => {
        router.push(`/(aluno)/sessao/${payload.session.id}` as Href);
      },
    });
  }

  const opacity = useSharedValue(0);
  useEffect(() => {
    opacity.value = withTiming(1, { duration: motion.screenMs });
  }, [opacity]);
  const revealStyle = useAnimatedStyle(() => ({ opacity: opacity.value }));

  const workout = detail.data?.workout;
  const assignment = detail.data?.assignment;
  const recentSessions = detail.data?.recent_sessions ?? [];
  const exercises = workout?.exercises ?? [];
  const focus = workout?.notes ?? workout?.name ?? 'Treino';
  const muscleGroups = aggregatedMuscleGroups(exercises);
  const validity = planValidityLabel(assignment?.end_date ?? null);
  const numbered = exercises.length > NUMBER_THRESHOLD;
  // Nota geral do treino: só mostramos como instrução se NÃO virou o título (focus).
  const generalNote = workout && workout.notes && focus !== workout.notes ? workout.notes : null;

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Voltar"
          hitSlop={12}
          onPress={() => goBackOr('/(aluno)/(tabs)/treinos')}
          style={styles.back}
        >
          <CaretLeft size={20} weight="bold" color={colors.textSecondary} />
        </Pressable>
        <AppText variant="eyebrow" color="tertiary">
          {workout?.name ?? 'Treino'}
        </AppText>
      </View>

      <Animated.View style={[styles.flex, revealStyle]}>
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          {workout && assignment ? (
            <>
              <WorkoutDetailHeader
                focus={focus}
                exerciseCount={exercises.length}
                estMinutes={estimatedMinutes(exercises)}
                weekdays={assignment.weekdays}
                muscleGroups={muscleGroups}
                validityLabel={validity}
              />

              {generalNote ? (
                <View style={styles.note}>
                  <AppText variant="bodySm" color="secondary">
                    {generalNote}
                  </AppText>
                </View>
              ) : null}

              <AppText variant="eyebrow" color="tertiary" style={styles.secLabel}>
                Exercícios
              </AppText>
              {exercises.map((e, i) => (
                <ExerciseCard
                  key={e.id}
                  name={e.name_snapshot}
                  sets={e.sets}
                  reps={e.reps}
                  restSeconds={e.rest_seconds}
                  muscleGroup={e.muscle_group}
                  notes={e.notes}
                  position={numbered ? i + 1 : undefined}
                  onPress={() =>
                    router.push({
                      pathname: '/(aluno)/exercicio/[id]',
                      params: {
                        id: e.id,
                        workoutId: id,
                        position: String(e.position),
                        name: e.name_snapshot,
                        muscle: e.muscle_group ?? '',
                        sets: String(e.sets),
                        reps: String(e.reps),
                        rest: String(e.rest_seconds),
                        note: e.notes ?? '',
                      },
                    } as Href)
                  }
                />
              ))}

              <WorkoutHistory sessions={recentSessions} />
            </>
          ) : detail.isLoading ? (
            <View style={styles.center}>
              <ActivityIndicator size="small" color={colors.textTertiary} />
            </View>
          ) : detail.isError ? (
            <AppText variant="bodySm" color="tertiary">
              Não foi possível carregar o treino.
            </AppText>
          ) : null}
        </ScrollView>
      </Animated.View>

      {workout ? (
        <View style={styles.ctaBar}>
          {createSession.isError ? (
            <AppText variant="bodySm" color="tertiary" style={styles.ctaError}>
              Não foi possível iniciar. Tente de novo.
            </AppText>
          ) : null}
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Iniciar treino"
            accessibilityState={{ disabled: createSession.isPending }}
            disabled={createSession.isPending}
            style={styles.cta}
            onPress={handleStart}
          >
            {createSession.isPending ? (
              <>
                <ActivityIndicator size="small" color={colors.textInverse} />
                <AppText variant="label" color="inverse">
                  Iniciando…
                </AppText>
              </>
            ) : (
              <>
                <Play size={18} weight="fill" color={colors.textInverse} />
                <AppText variant="label" color="inverse">
                  Iniciar treino
                </AppText>
              </>
            )}
          </Pressable>
        </View>
      ) : null}
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
  scroll: { paddingHorizontal: theme.spacing.lg, paddingBottom: 96 },
  center: { paddingVertical: theme.spacing.xl, alignItems: 'center' },
  note: {
    marginTop: theme.spacing.lg,
    backgroundColor: theme.colors.surface1,
    borderLeftWidth: 2,
    borderLeftColor: theme.colors.neon,
    borderRadius: theme.radius.tag,
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.md,
  },
  secLabel: { marginTop: theme.spacing.lg, marginBottom: theme.spacing.sm },
  ctaBar: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    padding: theme.spacing.lg,
    backgroundColor: theme.colors.bgBase,
  },
  ctaError: { textAlign: 'center', marginBottom: theme.spacing.sm },
  cta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing.sm,
    backgroundColor: theme.colors.neon,
    borderRadius: theme.radius.pill,
    paddingVertical: theme.spacing.md,
  },
}));
