import { useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, ScrollView, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { router, useLocalSearchParams, type Href } from 'expo-router';
import { CaretLeft, Check, FlagCheckered, SkipForward } from 'phosphor-react-native';
import { StyleSheet } from 'react-native-unistyles';

import { AppText } from '@/components/ui';
import { useSession } from '@/hooks/useSession';
import { useSessionMutations } from '@/hooks/useSessionMutations';
import {
  buildSetsPayload,
  currentExerciseIndex,
  isSessionComplete,
  nextSetIndex,
  sessionProgress,
} from '@/lib/session';
import { darkTheme } from '@/theme';
import type { SessionExercise } from '@/types/sessions';

const { motion, colors } = darkTheme;

// Modos do player: tudo num fluxo só, dirigido por estado local.
type PlayerMode = 'overview' | 'logging' | 'resting';

export default function SessaoPlayerScreen() {
  const params = useLocalSearchParams<{ id?: string | string[] }>();
  const id = Array.isArray(params.id) ? (params.id[0] ?? '') : (params.id ?? '');

  const session = useSession(id);
  const mutations = useSessionMutations(id);

  const [mode, setMode] = useState<PlayerMode>('overview');
  const [activeExerciseId, setActiveExerciseId] = useState<string | null>(null);
  const [weight, setWeight] = useState('');
  const [reps, setReps] = useState('');
  const [restLeft, setRestLeft] = useState(0);

  // 1 motion por tela: reveal de entrada.
  const opacity = useSharedValue(0);
  useEffect(() => {
    opacity.value = withTiming(1, { duration: motion.screenMs });
  }, [opacity]);
  const revealStyle = useAnimatedStyle(() => ({ opacity: opacity.value }));

  const exercises = useMemo(() => session.data?.exercises ?? [], [session.data]);

  // Exercício "atual" = primeiro não concluído; activeExerciseId fixa o foco
  // durante logging/resting, mas cai no atual quando indefinido.
  const currentIdx = currentExerciseIndex(exercises);
  const activeExercise: SessionExercise | null = useMemo(() => {
    if (activeExerciseId) {
      const byId = exercises.find((e) => e.workout_exercise_id === activeExerciseId);
      if (byId) return byId;
    }
    return currentIdx != null ? (exercises[currentIdx] ?? null) : null;
  }, [exercises, activeExerciseId, currentIdx]);

  // Countdown local do descanso; SEMPRE limpa o intervalo no cleanup (sem leak).
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  useEffect(() => {
    if (mode !== 'resting') return;
    intervalRef.current = setInterval(() => {
      setRestLeft((prev) => {
        if (prev <= 1) {
          if (intervalRef.current) clearInterval(intervalRef.current);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [mode]);

  // Ao zerar o descanso, segue para logging da próxima série.
  useEffect(() => {
    if (mode === 'resting' && restLeft === 0) {
      setMode('logging');
    }
  }, [mode, restLeft]);

  const progress = sessionProgress(exercises);
  const sessionComplete = isSessionComplete(exercises);

  function openLogging(exercise: SessionExercise) {
    setActiveExerciseId(exercise.workout_exercise_id);
    setWeight('');
    setReps('');
    setMode('logging');
  }

  function handleFinish() {
    mutations.finish.mutate(
      { early_finish: !sessionComplete, with_check_in: true },
      {
        onSuccess: () => {
          router.replace('/(aluno)/(tabs)' as Href);
        },
      },
    );
  }

  function handleCompleteSet() {
    if (!activeExercise) return;
    const exercise = activeExercise;
    const setIndex = nextSetIndex(exercise);
    const hadMoreBefore = setIndex < exercise.sets;

    const weightNum = weight.trim() === '' ? undefined : Number(weight.replace(',', '.'));
    const repsNum = reps.trim() === '' ? undefined : Number(reps);

    mutations.logSets.mutate(
      {
        workoutExerciseId: exercise.workout_exercise_id,
        // PUT .../sets faz FULL-REPLACE → enviar a lista ACUMULADA (ver buildSetsPayload).
        sets: buildSetsPayload(exercise.sets_logged, {
          set_index: setIndex,
          ...(weightNum != null && Number.isFinite(weightNum) ? { weight_kg: weightNum } : {}),
          ...(repsNum != null && Number.isFinite(repsNum) ? { reps_done: repsNum } : {}),
        }),
      },
      {
        onSuccess: () => {
          setWeight('');
          setReps('');
          if (hadMoreBefore) {
            // Ainda faltam séries → descanso a partir do rest prescrito.
            setRestLeft(exercise.rest_seconds);
            setMode('resting');
          } else {
            // Última série → marca o exercício e volta ao overview.
            mutations.markExercise.mutate(exercise.workout_exercise_id);
            setActiveExerciseId(null);
            setMode('overview');
          }
        },
      },
    );
  }

  function skipRest() {
    if (intervalRef.current) clearInterval(intervalRef.current);
    setRestLeft(0);
    setMode('logging');
  }

  function addRest() {
    setRestLeft((prev) => prev + 15);
  }

  function handleBack() {
    if (mode === 'overview') {
      router.back();
    } else {
      setActiveExerciseId(null);
      setMode('overview');
    }
  }

  const isBusy =
    mutations.logSets.isPending ||
    mutations.markExercise.isPending ||
    mutations.finish.isPending;

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={mode === 'overview' ? 'Voltar' : 'Voltar ao resumo'}
          hitSlop={12}
          onPress={handleBack}
          style={styles.back}
        >
          <CaretLeft size={20} weight="bold" color={colors.textSecondary} />
        </Pressable>
        <AppText variant="eyebrow" color="tertiary">
          Treino · {progress.done}/{progress.total} feitos
        </AppText>
      </View>

      <Animated.View style={[styles.flex, revealStyle]}>
        {session.isLoading ? (
          <View style={styles.center}>
            <AppText variant="bodySm" color="tertiary">
              Carregando sessão…
            </AppText>
          </View>
        ) : session.isError || !session.data ? (
          <View style={styles.center}>
            <AppText variant="bodySm" color="tertiary">
              Não foi possível carregar a sessão.
            </AppText>
          </View>
        ) : mode === 'overview' ? (
          <Overview
            exercises={exercises}
            currentIdx={currentIdx}
            onPressCurrent={openLogging}
          />
        ) : mode === 'logging' && activeExercise ? (
          <Logging
            exercise={activeExercise}
            weight={weight}
            reps={reps}
            onChangeWeight={setWeight}
            onChangeReps={setReps}
            onComplete={handleCompleteSet}
            busy={isBusy}
          />
        ) : mode === 'resting' && activeExercise ? (
          <Resting
            exercise={activeExercise}
            restLeft={restLeft}
            onSkip={skipRest}
            onAdd={addRest}
          />
        ) : (
          <View style={styles.center}>
            <AppText variant="bodySm" color="tertiary">
              Treino concluído.
            </AppText>
          </View>
        )}
      </Animated.View>

      {!session.isLoading && session.data && mode === 'overview' ? (
        <View style={styles.ctaBar}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Finalizar treino"
            disabled={mutations.finish.isPending}
            style={[styles.cta, mutations.finish.isPending ? styles.ctaDisabled : null]}
            onPress={handleFinish}
          >
            <FlagCheckered size={18} weight="fill" color={colors.textInverse} />
            <AppText variant="label" color="inverse">
              Finalizar treino
            </AppText>
          </Pressable>
        </View>
      ) : null}
    </SafeAreaView>
  );
}

// ——— Overview: progresso + lista de exercícios ———
function Overview({
  exercises,
  currentIdx,
  onPressCurrent,
}: {
  exercises: SessionExercise[];
  currentIdx: number | null;
  onPressCurrent: (exercise: SessionExercise) => void;
}) {
  const { done, total } = sessionProgress(exercises);
  const pct = total > 0 ? done / total : 0;

  return (
    <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
      <View style={styles.progressTrack}>
        <View style={[styles.progressFill, { width: `${Math.round(pct * 100)}%` }]} />
      </View>

      <AppText variant="eyebrow" color="tertiary" style={styles.secLabel}>
        Exercícios
      </AppText>

      {exercises.map((e, idx) => {
        const isCurrent = idx === currentIdx;
        return (
          <Pressable
            key={e.workout_exercise_id}
            accessibilityRole="button"
            accessibilityLabel={`${e.name_snapshot}, ${e.sets} por ${e.reps}`}
            disabled={!isCurrent}
            onPress={isCurrent ? () => onPressCurrent(e) : undefined}
            style={[styles.exRow, isCurrent ? styles.exRowCurrent : null]}
          >
            <View style={[styles.exMark, e.completed ? styles.exMarkDone : null]}>
              {e.completed ? <Check size={14} weight="bold" color={colors.textInverse} /> : null}
            </View>
            <View style={styles.exBody}>
              <AppText
                variant="bodyMd"
                color={isCurrent ? 'primary' : e.completed ? 'tertiary' : 'secondary'}
                numberOfLines={1}
              >
                {e.name_snapshot}
              </AppText>
            </View>
            <AppText variant="metaSmall" color={isCurrent ? 'neon' : 'tertiary'}>
              {e.sets}×{e.reps}
            </AppText>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

// ——— Logging: foco no exercício atual, dois inputs grandes ———
function Logging({
  exercise,
  weight,
  reps,
  onChangeWeight,
  onChangeReps,
  onComplete,
  busy,
}: {
  exercise: SessionExercise;
  weight: string;
  reps: string;
  onChangeWeight: (v: string) => void;
  onChangeReps: (v: string) => void;
  onComplete: () => void;
  busy: boolean;
}) {
  const setIndex = nextSetIndex(exercise);

  return (
    <View style={styles.flex}>
      <ScrollView contentContainerStyle={styles.logScroll} showsVerticalScrollIndicator={false}>
        <AppText variant="h2" numberOfLines={2}>
          {exercise.name_snapshot}
        </AppText>
        <AppText variant="metaSmall" color="tertiary" style={styles.logMeta}>
          {exercise.sets}×{exercise.reps} · descanso {exercise.rest_seconds}s
        </AppText>

        {exercise.sets_logged.length > 0 ? (
          <View style={styles.loggedList}>
            {exercise.sets_logged.map((s) => (
              <View key={s.set_index} style={styles.loggedRow}>
                <AppText variant="dataMed" color="secondary">
                  {s.weight_kg ?? '—'} × {s.reps_done ?? '—'}
                </AppText>
                <Check size={16} weight="bold" color={colors.secondary} />
              </View>
            ))}
          </View>
        ) : null}

        <AppText variant="eyebrow" color="neon" style={styles.setLabel}>
          Série {setIndex}
        </AppText>

        <View style={styles.inputsRow}>
          <View style={styles.inputBox}>
            <TextInput
              accessibilityLabel="Peso em quilos"
              value={weight}
              onChangeText={onChangeWeight}
              keyboardType="numeric"
              placeholder="0"
              placeholderTextColor={colors.textTertiary}
              style={styles.bigInput}
            />
            <AppText variant="metaSmall" color="tertiary">
              kg
            </AppText>
          </View>
          <View style={styles.inputBox}>
            <TextInput
              accessibilityLabel="Repetições"
              value={reps}
              onChangeText={onChangeReps}
              keyboardType="numeric"
              placeholder="0"
              placeholderTextColor={colors.textTertiary}
              style={styles.bigInput}
            />
            <AppText variant="metaSmall" color="tertiary">
              reps
            </AppText>
          </View>
        </View>
      </ScrollView>

      <View style={styles.ctaBar}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Concluir série"
          disabled={busy}
          style={[styles.cta, busy ? styles.ctaDisabled : null]}
          onPress={onComplete}
        >
          <Check size={18} weight="bold" color={colors.textInverse} />
          <AppText variant="label" color="inverse">
            Concluir série
          </AppText>
        </Pressable>
      </View>
    </View>
  );
}

// ——— Resting: timer regressivo grande + controles ———
function Resting({
  exercise,
  restLeft,
  onSkip,
  onAdd,
}: {
  exercise: SessionExercise;
  restLeft: number;
  onSkip: () => void;
  onAdd: () => void;
}) {
  const logged = exercise.sets_logged.length;

  return (
    <View style={styles.flex}>
      <View style={styles.center}>
        <AppText variant="eyebrow" color="tertiary">
          Descanso
        </AppText>
        <AppText variant="dataBig" color="neon" style={styles.timer}>
          {restLeft}
        </AppText>
        <View style={styles.dots}>
          {Array.from({ length: exercise.sets }).map((_, i) => (
            <View
              key={i}
              style={[styles.dot, i < logged ? styles.dotDone : null]}
            />
          ))}
        </View>
      </View>

      <View style={styles.restBar}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Mais 15 segundos"
          style={styles.ghostBtn}
          onPress={onAdd}
        >
          <AppText variant="label" color="secondary">
            +15s
          </AppText>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Pular descanso"
          style={[styles.cta, styles.restSkip]}
          onPress={onSkip}
        >
          <SkipForward size={18} weight="fill" color={colors.textInverse} />
          <AppText variant="label" color="inverse">
            Pular descanso
          </AppText>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create((theme) => ({
  safe: { flex: 1, backgroundColor: theme.colors.bgBase },
  flex: { flex: 1 },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing.md,
    paddingHorizontal: theme.spacing.lg,
  },
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
  secLabel: { marginTop: theme.spacing.lg, marginBottom: theme.spacing.sm },

  // Progresso (overview)
  progressTrack: {
    height: 6,
    borderRadius: theme.radius.pill,
    backgroundColor: theme.colors.surface1,
    overflow: 'hidden',
    marginTop: theme.spacing.sm,
  },
  progressFill: {
    height: 6,
    borderRadius: theme.radius.pill,
    backgroundColor: theme.colors.neon,
  },

  // Linha de exercício (overview)
  exRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.md,
    borderRadius: theme.radius.card,
    marginBottom: theme.spacing.sm,
    backgroundColor: theme.colors.surface1,
  },
  exRowCurrent: {
    borderWidth: 1,
    borderColor: theme.colors.neon,
  },
  exMark: {
    width: 22,
    height: 22,
    borderRadius: theme.radius.pill,
    borderWidth: 1,
    borderColor: theme.colors.outline,
    alignItems: 'center',
    justifyContent: 'center',
  },
  exMarkDone: {
    backgroundColor: theme.colors.secondary,
    borderColor: theme.colors.secondary,
  },
  exBody: { flex: 1 },

  // Logging
  logScroll: {
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.md,
    paddingBottom: 96,
    flexGrow: 1,
    justifyContent: 'center',
  },
  logMeta: { marginTop: theme.spacing.xs },
  loggedList: { marginTop: theme.spacing.lg, gap: theme.spacing.xs },
  loggedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  setLabel: { marginTop: theme.spacing.xl, marginBottom: theme.spacing.sm },
  inputsRow: {
    flexDirection: 'row',
    gap: theme.spacing.md,
  },
  inputBox: {
    flex: 1,
    backgroundColor: theme.colors.surface1,
    borderRadius: theme.radius.input,
    paddingVertical: theme.spacing.lg,
    alignItems: 'center',
    gap: theme.spacing.xs,
  },
  bigInput: {
    fontFamily: theme.fontFamily.mono,
    fontSize: 40,
    color: theme.colors.textPrimary,
    textAlign: 'center',
    minWidth: 80,
    padding: 0,
  },

  // Resting
  timer: {
    fontSize: 88,
    lineHeight: 96,
    marginVertical: theme.spacing.md,
  },
  dots: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: theme.radius.pill,
    backgroundColor: theme.colors.surface3,
  },
  dotDone: {
    backgroundColor: theme.colors.secondary,
  },
  restBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
    padding: theme.spacing.lg,
  },
  restSkip: { flex: 1 },
  ghostBtn: {
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.lg,
    borderRadius: theme.radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // CTA
  ctaBar: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    padding: theme.spacing.lg,
    backgroundColor: theme.colors.bgBase,
  },
  cta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing.sm,
    backgroundColor: theme.colors.neon,
    borderRadius: theme.radius.pill,
    paddingVertical: theme.spacing.md,
  },
  ctaDisabled: { opacity: 0.5 },
}));
