import { useEffect, useMemo, useRef, useState } from 'react';
import { Alert, Pressable, ScrollView, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { router, useLocalSearchParams, type Href } from '@/navigation';
import { goBackOr } from '@/lib/nav';
import { CaretLeft, Check, FlagCheckered, Info, PencilSimple, SkipForward } from 'phosphor-react-native';
import { StyleSheet } from 'react-native-unistyles';

import { AppText, ListState } from '@/components/ui';
import { Stepper } from '@/components/session/Stepper';
import { SessionFinishSummary } from '@/components/session/SessionFinishSummary';
import { BadgeUnlockQueue } from '@/components/gamification/BadgeUnlockQueue';
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
import type { SessionExercise, SessionSet, WorkoutSession } from '@/types/sessions';
import type { Badge } from '@/types/gamification';

const { motion, colors, spacing } = darkTheme;

// Modos do player: tudo num fluxo só, dirigido por estado local.
type PlayerMode = 'overview' | 'logging' | 'resting';

// Descanso em mm:ss (mono) — nunca número cru.
function formatRest(seconds: number): string {
  const s = Math.max(0, Math.floor(seconds));
  const mm = Math.floor(s / 60);
  const ss = s % 60;
  return `${String(mm).padStart(2, '0')}:${String(ss).padStart(2, '0')}`;
}

// Número como string limpa para pré-preencher inputs (sem ".0" cru, "" se nulo).
function numToInput(n: number | null): string {
  if (n == null) return '';
  return String(n);
}

// schedule_hint chega via .passthrough() (não tipado). Lê de forma defensiva.
function isOutsidePlannedDay(data: WorkoutSession | undefined): boolean {
  if (!data) return false;
  const hint = (data as { schedule_hint?: { matches_planned_weekdays?: boolean } }).schedule_hint;
  return hint?.matches_planned_weekdays === false;
}

export default function SessaoPlayerScreen() {
  const params = useLocalSearchParams<{ id?: string | string[] }>();
  const id = Array.isArray(params.id) ? (params.id[0] ?? '') : (params.id ?? '');

  const session = useSession(id);
  const mutations = useSessionMutations(id);
  const insets = useSafeAreaInsets();

  const [mode, setMode] = useState<PlayerMode>('overview');
  const [activeExerciseId, setActiveExerciseId] = useState<string | null>(null);
  const [weight, setWeight] = useState('');
  const [reps, setReps] = useState('');
  const [restLeft, setRestLeft] = useState(0);
  // Aviso "fora do dia planejado" é dispensável pelo aluno (não-bloqueante).
  const [hintDismissed, setHintDismissed] = useState(false);
  // Conquistas concedidas pelo finish (Task 16): a celebração ONLINE. O finish
  // retorna `newly_earned_badges`; guardamos aqui p/ exibir a fila por cima da
  // tela de resumo (o overlay é um Modal — flutua sobre o SessionFinishSummary).
  const [badgeQueue, setBadgeQueue] = useState<Badge[]>([]);

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

  const activeIndex = useMemo(
    () =>
      activeExercise
        ? exercises.findIndex((e) => e.workout_exercise_id === activeExercise.workout_exercise_id)
        : -1,
    [exercises, activeExercise],
  );

  // Pré-preenche os inputs com a última série logada do exercício em foco —
  // valores editáveis (o aluno costuma repetir/ajustar a partir da anterior).
  function prefillFrom(exercise: SessionExercise): void {
    const last = exercise.sets_logged[exercise.sets_logged.length - 1];
    setWeight(last ? numToInput(last.weight_kg) : '');
    setReps(last ? numToInput(last.reps_done) : '');
  }

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
      if (activeExercise) prefillFrom(activeExercise);
      setMode('logging');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, restLeft]);

  const progress = sessionProgress(exercises);
  const sessionComplete = isSessionComplete(exercises);

  // Abre o logging de qualquer exercício — pendente OU concluído (p/ corrigir).
  function openLogging(exercise: SessionExercise) {
    setActiveExerciseId(exercise.workout_exercise_id);
    prefillFrom(exercise);
    setMode('logging');
  }

  function doFinish() {
    // Guarda contra reentrância (o Alert de parcial chama doFinish direto).
    if (mutations.finish.isPending) return;
    mutations.finish.mutate(
      { early_finish: !sessionComplete, with_check_in: true },
      {
        onSuccess: (res) => {
          // Celebração online: dispara a fila ANTES de qualquer navegação. Como
          // o finish leva à tela de resumo (mesma rota, via showFinishScreen), o
          // overlay (Modal) aparece por cima dela — celebração visível ao terminar.
          if (res.newly_earned_badges.length > 0) setBadgeQueue(res.newly_earned_badges);
        },
      },
    );
  }

  function handleFinish() {
    if (mutations.finish.isPending) return;
    const pending = progress.total - progress.done;
    if (pending > 0) {
      // Faltam exercícios → confirma treino parcial antes de finalizar.
      Alert.alert(
        'Finalizar treino?',
        `Faltam ${pending} ${pending === 1 ? 'exercício' : 'exercícios'}. Finalizar como treino parcial?`,
        [
          { text: 'Continuar treino', style: 'cancel' },
          { text: 'Finalizar parcial', style: 'destructive', onPress: doFinish },
        ],
      );
      return;
    }
    // Tudo feito → 1 toque.
    doFinish();
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
          if (hadMoreBefore) {
            // Ainda faltam séries → descanso a partir do rest prescrito.
            setWeight('');
            setReps('');
            setRestLeft(exercise.rest_seconds);
            setMode('resting');
          } else {
            // Última série → marca o exercício; só volta ao overview se marcar deu certo.
            mutations.markExercise.mutate(exercise.workout_exercise_id, {
              onSuccess: () => {
                setWeight('');
                setReps('');
                setActiveExerciseId(null);
                setMode('overview');
              },
              onError: () => {
                Alert.alert(
                  'Não foi possível concluir',
                  'A série foi salva, mas não deu para marcar o exercício como concluído. Tente de novo.',
                );
              },
            });
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
      goBackOr('/(aluno)/(tabs)');
    } else {
      setActiveExerciseId(null);
      setMode('overview');
    }
  }

  const isBusy =
    mutations.logSets.isPending ||
    mutations.markExercise.isPending ||
    mutations.finish.isPending;

  const finishSummary = mutations.finish.data?.summary ?? null;
  const showFinishScreen = mutations.finish.isSuccess && finishSummary != null;

  const showHint =
    mode === 'overview' &&
    !hintDismissed &&
    !showFinishScreen &&
    isOutsidePlannedDay(session.data);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={
            showFinishScreen ? 'Voltar' : mode === 'overview' ? 'Voltar' : 'Voltar ao resumo'
          }
          hitSlop={12}
          onPress={showFinishScreen ? () => router.replace('/(aluno)/(tabs)' as Href) : handleBack}
          style={styles.back}
        >
          <CaretLeft size={20} weight="bold" color={colors.textSecondary} />
        </Pressable>
        <AppText variant="eyebrow" color="tertiary">
          {showFinishScreen ? 'Resumo do treino' : `Treino · ${progress.done}/${progress.total} feitos`}
        </AppText>
      </View>

      {showFinishScreen && finishSummary ? (
        <SessionFinishSummary
          summary={finishSummary}
          onDone={() => router.replace('/(aluno)/(tabs)' as Href)}
        />
      ) : (
        <Animated.View style={[styles.flex, revealStyle]}>
          {session.isLoading ? (
            <View style={styles.stateWrap}>
              <ListState kind="loading" skeletonCount={4} />
            </View>
          ) : session.isError || !session.data ? (
            <View style={styles.stateWrap}>
              <ListState
                kind="error"
                title="Sessão indisponível"
                message="Não foi possível carregar a sessão de treino."
                actionLabel="Tentar de novo"
                onAction={() => session.refetch()}
              />
            </View>
          ) : mode === 'overview' ? (
            <Overview
              exercises={exercises}
              currentIdx={currentIdx}
              showHint={showHint}
              onDismissHint={() => setHintDismissed(true)}
              onPressExercise={openLogging}
              insetsBottom={insets.bottom}
            />
          ) : mode === 'logging' && activeExercise ? (
            <Logging
              exercise={activeExercise}
              positionLabel={`Exercício ${activeIndex + 1}/${exercises.length}`}
              weight={weight}
              reps={reps}
              onChangeWeight={setWeight}
              onChangeReps={setReps}
              onComplete={handleCompleteSet}
              busy={isBusy}
              insetsBottom={insets.bottom}
            />
          ) : mode === 'resting' && activeExercise ? (
            <Resting
              exercise={activeExercise}
              restLeft={restLeft}
              onSkip={skipRest}
              onAdd={addRest}
              insetsBottom={insets.bottom}
            />
          ) : (
            <View style={styles.center}>
              <AppText variant="bodySm" color="tertiary">
                Treino concluído.
              </AppText>
            </View>
          )}
        </Animated.View>
      )}

      {!session.isLoading && session.data && mode === 'overview' && !showFinishScreen ? (
        <View style={[styles.ctaBar, { paddingBottom: spacing.lg + insets.bottom }]}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Finalizar treino"
            disabled={mutations.finish.isPending}
            style={[styles.cta, mutations.finish.isPending ? styles.ctaDisabled : null]}
            onPress={handleFinish}
          >
            <FlagCheckered size={18} weight="fill" color={colors.textInverse} />
            <AppText variant="label" color="inverse">
              {mutations.finish.isPending ? 'Finalizando…' : 'Finalizar treino'}
            </AppText>
          </Pressable>
        </View>
      ) : null}

      {/* Celebração online das conquistas concedidas pelo finish (overlay Modal). */}
      {badgeQueue.length > 0 ? (
        <BadgeUnlockQueue badges={badgeQueue} onDone={() => setBadgeQueue([])} />
      ) : null}
    </SafeAreaView>
  );
}

// Resumo do que foi feito num exercício concluído (ex.: "40kg · 3 séries").
function loggedSummary(exercise: SessionExercise): string | null {
  const sets = exercise.sets_logged;
  if (sets.length === 0) return null;
  const weights = sets.map((s) => s.weight_kg).filter((w): w is number => w != null);
  const count = `${sets.length} ${sets.length === 1 ? 'série' : 'séries'}`;
  if (weights.length === 0) return count;
  const maxW = Math.max(...weights);
  return `${maxW}kg · ${count}`;
}

// ——— Overview: progresso + lista de exercícios (qualquer um abrível) ———
function Overview({
  exercises,
  currentIdx,
  showHint,
  onDismissHint,
  onPressExercise,
  insetsBottom,
}: {
  exercises: SessionExercise[];
  currentIdx: number | null;
  showHint: boolean;
  onDismissHint: () => void;
  onPressExercise: (exercise: SessionExercise) => void;
  insetsBottom: number;
}) {
  const { done, total } = sessionProgress(exercises);
  const pct = total > 0 ? done / total : 0;

  return (
    <ScrollView
      contentContainerStyle={[styles.scroll, { paddingBottom: 96 + insetsBottom }]}
      showsVerticalScrollIndicator={false}
    >
      {showHint ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Fora do dia planejado. Toque para dispensar."
          onPress={onDismissHint}
          style={styles.hint}
        >
          <Info size={18} weight="duotone" color={colors.textSecondary} />
          <AppText variant="bodySm" color="secondary" style={styles.hintText}>
            Fora do dia planejado — sem problema.
          </AppText>
        </Pressable>
      ) : null}

      <View style={styles.progressTrack}>
        <View style={[styles.progressFill, { width: `${Math.round(pct * 100)}%` }]} />
      </View>

      <AppText variant="eyebrow" color="tertiary" style={styles.secLabel}>
        Exercícios
      </AppText>

      {exercises.map((e, idx) => {
        const isCurrent = idx === currentIdx;
        const summary = e.completed ? loggedSummary(e) : null;
        return (
          <Pressable
            key={e.workout_exercise_id}
            accessibilityRole="button"
            accessibilityLabel={`${e.name_snapshot}, ${e.sets} por ${e.reps}, ${
              e.completed ? 'concluído' : isCurrent ? 'em andamento' : 'pendente'
            }`}
            accessibilityState={{ selected: isCurrent }}
            onPress={() => onPressExercise(e)}
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
              {summary ? (
                <AppText variant="metaSmall" color="tertiary">
                  {summary}
                </AppText>
              ) : null}
            </View>
            {e.completed ? (
              <PencilSimple size={16} weight="duotone" color={colors.textTertiary} />
            ) : (
              <AppText variant="metaSmall" color={isCurrent ? 'neon' : 'tertiary'}>
                {e.sets}×{e.reps}
              </AppText>
            )}
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

// ——— Logging: foco no exercício, referência da anterior + steppers ———
function Logging({
  exercise,
  positionLabel,
  weight,
  reps,
  onChangeWeight,
  onChangeReps,
  onComplete,
  busy,
  insetsBottom,
}: {
  exercise: SessionExercise;
  positionLabel: string;
  weight: string;
  reps: string;
  onChangeWeight: (v: string) => void;
  onChangeReps: (v: string) => void;
  onComplete: () => void;
  busy: boolean;
  insetsBottom: number;
}) {
  const setIndex = nextSetIndex(exercise);
  const prevSet: SessionSet | undefined = exercise.sets_logged[exercise.sets_logged.length - 1];
  const overLogged = setIndex > exercise.sets;

  return (
    <View style={styles.flex}>
      <ScrollView
        contentContainerStyle={[styles.logScroll, { paddingBottom: 96 + insetsBottom }]}
        showsVerticalScrollIndicator={false}
      >
        <AppText variant="eyebrow" color="tertiary">
          {positionLabel}
        </AppText>
        <AppText variant="h2" numberOfLines={2} style={styles.logTitle}>
          {exercise.name_snapshot}
        </AppText>
        <AppText variant="metaSmall" color="tertiary" style={styles.logMeta}>
          {exercise.sets}×{exercise.reps} · descanso {exercise.rest_seconds}s
        </AppText>

        {exercise.notes ? (
          <View style={styles.noteBox}>
            <Info size={16} weight="duotone" color={colors.textSecondary} />
            <AppText variant="bodySm" color="secondary" style={styles.noteText}>
              {exercise.notes}
            </AppText>
          </View>
        ) : null}

        {exercise.sets_logged.length > 0 ? (
          <View style={styles.loggedList}>
            {exercise.sets_logged.map((s) => (
              <View key={s.set_index} style={styles.loggedRow}>
                <AppText variant="metaSmall" color="tertiary">
                  Série {s.set_index}
                </AppText>
                <AppText variant="dataMed" color="secondary">
                  {s.weight_kg ?? '—'} × {s.reps_done ?? '—'}
                </AppText>
                <Check size={16} weight="bold" color={colors.secondary} />
              </View>
            ))}
          </View>
        ) : null}

        <AppText variant="eyebrow" color="neon" style={styles.setLabel}>
          {overLogged ? `Série extra ${setIndex}` : `Série ${setIndex} de ${exercise.sets}`}
        </AppText>

        {/* Referência: meta prescrita e o que foi feito na série anterior. */}
        <View style={styles.refRow}>
          <AppText variant="metaSmall" color="tertiary">
            Meta {exercise.reps} reps
          </AppText>
          {prevSet ? (
            <AppText variant="metaSmall" color="tertiary">
              Anterior {prevSet.weight_kg ?? '—'}kg × {prevSet.reps_done ?? '—'}
            </AppText>
          ) : null}
        </View>

        <View style={styles.inputsRow}>
          <Stepper
            label="Peso"
            unit="kg"
            value={weight}
            onChange={onChangeWeight}
            step={2.5}
            decimals={1}
            accessibilityLabel="Peso em quilos"
          />
          <Stepper
            label="Reps"
            unit="reps"
            value={reps}
            onChange={onChangeReps}
            step={1}
            decimals={0}
            accessibilityLabel="Repetições"
          />
        </View>
      </ScrollView>

      <View style={[styles.ctaBar, { paddingBottom: spacing.lg + insetsBottom }]}>
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

// ——— Resting: timer regressivo grande + a seguir + controles ———
function Resting({
  exercise,
  restLeft,
  onSkip,
  onAdd,
  insetsBottom,
}: {
  exercise: SessionExercise;
  restLeft: number;
  onSkip: () => void;
  onAdd: () => void;
  insetsBottom: number;
}) {
  const logged = exercise.sets_logged.length;
  const nextSet = logged + 1;
  const hasNextSet = nextSet <= exercise.sets;

  return (
    <View style={styles.flex}>
      <View style={styles.center}>
        <AppText variant="eyebrow" color="tertiary">
          Descanso
        </AppText>
        <AppText variant="dataBig" color="neon" style={styles.timer}>
          {formatRest(restLeft)}
        </AppText>
        <View style={styles.dots}>
          {Array.from({ length: exercise.sets }).map((_, i) => (
            <View
              key={i}
              style={[styles.dot, i < logged ? styles.dotDone : null]}
            />
          ))}
        </View>
        {hasNextSet ? (
          <AppText variant="metaSmall" color="secondary" style={styles.nextUp}>
            A seguir: Série {nextSet} · meta {exercise.reps} reps
          </AppText>
        ) : null}
      </View>

      <View style={[styles.restBar, { paddingBottom: spacing.lg + insetsBottom }]}>
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
  stateWrap: {
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.lg,
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

  // Aviso fora do dia planejado (não-bloqueante, dispensável)
  hint: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.md,
    borderRadius: theme.radius.card,
    backgroundColor: theme.colors.surface1,
    marginTop: theme.spacing.sm,
  },
  hintText: { flex: 1 },

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
  exBody: { flex: 1, gap: theme.spacing.xs },

  // Logging (ancorado ao topo p/ não pular entre séries)
  logScroll: {
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.lg,
    paddingBottom: 96,
  },
  logTitle: { marginTop: theme.spacing.xs },
  logMeta: { marginTop: theme.spacing.xs },
  noteBox: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
    padding: theme.spacing.md,
    borderRadius: theme.radius.card,
    backgroundColor: theme.colors.surface1,
    marginTop: theme.spacing.md,
  },
  noteText: { flex: 1 },
  loggedList: { marginTop: theme.spacing.lg, gap: theme.spacing.sm },
  loggedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
  },
  setLabel: { marginTop: theme.spacing.xl, marginBottom: theme.spacing.sm },
  refRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: theme.spacing.md,
  },
  inputsRow: {
    flexDirection: 'row',
    gap: theme.spacing.md,
  },

  // Resting
  timer: {
    fontSize: theme.typeScale.timerHero,
    lineHeight: Math.round(theme.typeScale.timerHero * 1.1),
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
  nextUp: { marginTop: theme.spacing.lg },
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
