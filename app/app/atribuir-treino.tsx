// Atribuir treino ao aluno (rota '/atribuir-treino?student=<studentId>').
//
// Fluxo: o personal escolhe UM template existente (GET /workouts) + os DIAS da
// semana (toggle múltiplo, ≥1) e atribui via POST /students/:student_id/workouts.
// start_date = hoje LOCAL por padrão (formatDateLocal — nunca toISOString, bug UTC-3).
//
// NOTA: não há tela de "criar template" aqui — isto reutiliza os templates já
// montados em /montar-treino. Sem template ou sem dias, "Atribuir" fica desabilitado.

import { useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { router, useLocalSearchParams, type Href } from 'expo-router';
import { Barbell, Check, CaretLeft } from 'phosphor-react-native';
import { StyleSheet } from 'react-native-unistyles';

import { AppText, Button } from '@/components/ui';
import { useProWorkouts } from '@/hooks/useProWorkouts';
import { useAssignWorkout } from '@/hooks/useAssignWorkout';
import { useUpdateStudentWorkout } from '@/hooks/useUpdateStudentWorkout';
import { useStudents } from '@/hooks/useStudents';
import { weekdayLetter } from '@/lib/weekday';
import { formatDateLocal } from '@/lib/format';
import type { ProWorkoutListItem, Weekday } from '@/types/workouts';
import { darkTheme } from '@/theme';
import { StudentTargetHeader } from '@/components/professional/StudentTargetHeader';
import { DateField } from '@/components/molecules';

const { colors, motion } = darkTheme;

// Dias da semana na ordem ISO-8601 (1=segunda … 7=domingo).
const WEEKDAYS: Weekday[] = [1, 2, 3, 4, 5, 6, 7];

// Nome completo do dia (acessibilidade) — o chip mostra só a inicial.
const WEEKDAY_NAME: Record<Weekday, string> = {
  1: 'Segunda',
  2: 'Terça',
  3: 'Quarta',
  4: 'Quinta',
  5: 'Sexta',
  6: 'Sábado',
  7: 'Domingo',
};

// Rótulo de exercícios do card (igual à aba de treinos).
function exerciseLabel(n: number): string {
  return n === 1 ? '1 exercício' : `${n} exercícios`;
}

type TemplateCardProps = {
  workout: ProWorkoutListItem;
  selected: boolean;
  onPress: () => void;
};

// Card de template SELECIONÁVEL (seleção única). Visual alinhado ao
// ProWorkoutCard da aba de treinos; borda/realce neon quando selecionado.
function TemplateCard({ workout, selected, onPress }: TemplateCardProps) {
  const notes = workout.notes?.trim();
  return (
    <Pressable
      accessibilityRole="radio"
      accessibilityState={{ selected }}
      accessibilityLabel={workout.name}
      onPress={onPress}
      style={[styles.card, selected && styles.cardSelected]}
    >
      <View style={styles.cardIcon}>
        <Barbell size={22} weight="duotone" color={colors.neon} />
      </View>
      <View style={styles.cardText}>
        <AppText variant="h3" numberOfLines={1}>
          {workout.name}
        </AppText>
        {notes && notes.length > 0 ? (
          <AppText variant="bodySm" color="secondary" numberOfLines={1}>
            {notes}
          </AppText>
        ) : null}
        <AppText variant="metaSmall" color="tertiary">
          {exerciseLabel(workout.exercise_count)}
        </AppText>
      </View>
      {selected ? (
        <View style={styles.checkMark}>
          <Check size={16} weight="bold" color={colors.textInverse} />
        </View>
      ) : (
        <View style={styles.checkEmpty} />
      )}
    </Pressable>
  );
}

type WeekdaySelectorProps = {
  selected: Weekday[];
  onToggle: (weekday: Weekday) => void;
};

// Seletor de dias da semana: chips toggle (múltipla escolha). Reaproveita
// weekdayLetter de @/lib/weekday. Realce neon quando ativo.
function WeekdaySelector({ selected, onToggle }: WeekdaySelectorProps) {
  return (
    <View style={styles.weekdayRow}>
      {WEEKDAYS.map((wd) => {
        const on = selected.includes(wd);
        return (
          <Pressable
            key={wd}
            accessibilityRole="checkbox"
            accessibilityState={{ checked: on }}
            accessibilityLabel={WEEKDAY_NAME[wd]}
            hitSlop={6}
            onPress={() => onToggle(wd)}
            style={[styles.weekdayChip, on && styles.weekdayChipOn]}
          >
            <AppText variant="label" color={on ? 'inverse' : 'secondary'}>
              {weekdayLetter(wd)}
            </AppText>
          </Pressable>
        );
      })}
    </View>
  );
}

// Parseia "1,3,5" → [1,3,5] (apenas dias ISO válidos, ordenados).
function parseWeekdayParam(s: string | undefined): Weekday[] {
  if (!s) return [];
  return s
    .split(',')
    .map((n) => Number(n))
    .filter((n): n is Weekday => Number.isInteger(n) && n >= 1 && n <= 7)
    .sort((a, b) => a - b);
}

export default function AtribuirTreinoScreen() {
  const params = useLocalSearchParams<{
    student?: string;
    // Modo edição: id da atribuição + dados pré-preenchidos (vindos da lista do aluno).
    assignment?: string;
    workout?: string;
    weekdays?: string;
    start?: string;
  }>();
  const studentId = typeof params.student === 'string' ? params.student : undefined;
  const assignmentId = typeof params.assignment === 'string' ? params.assignment : undefined;
  const isEdit = Boolean(assignmentId);

  const list = useProWorkouts();
  const assign = useAssignWorkout();
  const update = useUpdateStudentWorkout();
  const students = useStudents();

  // Aluno-alvo resolvido do cache de useStudents (id chega por param; nome vem do cache).
  const student = useMemo(
    () => students.data?.students.find((s) => s.id === studentId),
    [students.data, studentId],
  );
  const studentName = student
    ? (student.full_name?.trim() || student.email)
    : null;

  // Em modo edição, os campos vêm pré-preenchidos pelos params (a lista do aluno passa o
  // estado atual da atribuição). O template é fixo na edição (PATCH não troca workout_id).
  const today = useMemo(() => formatDateLocal(new Date()), []);
  const [workoutId, setWorkoutId] = useState<string | null>(
    typeof params.workout === 'string' ? params.workout : null,
  );
  const [weekdays, setWeekdays] = useState<Weekday[]>(() =>
    parseWeekdayParam(typeof params.weekdays === 'string' ? params.weekdays : undefined),
  );
  const [startDate, setStartDate] = useState<string | null>(
    typeof params.start === 'string' ? params.start : today,
  );
  const [error, setError] = useState<string | undefined>(undefined);

  // 1 momento de motion por tela: reveal de entrada (opacity + translateY, 300ms).
  const reveal = useSharedValue(0);
  useEffect(() => {
    reveal.value = withTiming(1, { duration: motion.screenMs });
  }, [reveal]);
  const revealStyle = useAnimatedStyle(() => ({
    opacity: reveal.value,
    transform: [{ translateY: (1 - reveal.value) * 12 }],
  }));

  const workouts = useMemo(() => list.data?.workouts ?? [], [list.data]);
  // Na edição, o template é fixo: resolve pelo id (do cache de templates) para exibir.
  const selectedTemplate = useMemo(
    () => workouts.find((w) => w.id === workoutId) ?? null,
    [workouts, workoutId],
  );

  function toggleWeekday(wd: Weekday) {
    if (error) setError(undefined);
    setWeekdays((prev) =>
      prev.includes(wd) ? prev.filter((d) => d !== wd) : [...prev, wd].sort((a, b) => a - b),
    );
  }

  function selectWorkout(id: string) {
    if (error) setError(undefined);
    setWorkoutId(id);
  }

  function handleBack() {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/(personal)/(tabs)/alunos');
    }
  }

  // Habilita com template + ao menos um dia + data válida + aluno conhecido.
  const canSubmit =
    Boolean(studentId) && workoutId !== null && weekdays.length > 0 && startDate !== null;
  const isPending = isEdit ? update.isPending : assign.isPending;

  function handleSubmit() {
    if (!studentId || !workoutId || weekdays.length === 0 || !startDate) return;
    setError(undefined);

    if (isEdit && assignmentId) {
      // Edição: PATCH só dias/início (workout_id não muda na atribuição).
      update.mutate(
        { studentId, studentWorkoutId: assignmentId, body: { weekdays, start_date: startDate } },
        {
          onSuccess: () => handleBack(),
          onError: () => setError('Não foi possível salvar. Tente novamente.'),
        },
      );
      return;
    }

    assign.mutate(
      {
        studentId,
        body: {
          workout_id: workoutId,
          weekdays,
          // start_date escolhido no DateField (ISO local, nunca toISOString → fuso UTC-3).
          start_date: startDate,
        },
      },
      {
        onSuccess: () => handleBack(),
        onError: () => setError('Não foi possível atribuir. Tente novamente.'),
      },
    );
  }

  const isEmpty = !list.isLoading && !list.isError && workouts.length === 0;

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Voltar"
          hitSlop={12}
          onPress={handleBack}
          style={styles.back}
        >
          <CaretLeft size={20} weight="bold" color={colors.textSecondary} />
        </Pressable>
        <View style={styles.headerText}>
          <AppText variant="eyebrow" color="tertiary">
            Aluno
          </AppText>
          <AppText variant="h2">{isEdit ? 'Editar treino' : 'Atribuir treino'}</AppText>
        </View>
      </View>

      <Animated.View style={[styles.flex, revealStyle]}>
        <ScrollView
          style={styles.flex}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          <StudentTargetHeader name={studentName} email={student?.email} />

          <AppText variant="eyebrow" color="tertiary" style={styles.secLabel}>
            Treino
          </AppText>

          {isEdit ? (
            // Edição: template fixo, exibido em read-only (não dá pra trocar via PATCH).
            <View style={styles.list}>
              {selectedTemplate ? (
                <TemplateCard workout={selectedTemplate} selected onPress={() => {}} />
              ) : (
                <AppText variant="bodySm" color="tertiary">
                  Carregando treino…
                </AppText>
              )}
            </View>
          ) : list.isLoading ? (
            <AppText variant="bodySm" color="tertiary">
              Carregando treinos…
            </AppText>
          ) : list.isError ? (
            <AppText variant="bodySm" color="tertiary">
              Não foi possível carregar seus treinos.
            </AppText>
          ) : isEmpty ? (
            <View style={styles.emptyBlock}>
              <AppText variant="bodySm" color="tertiary">
                Nenhum treino criado ainda. Monte um treino antes de atribuir.
              </AppText>
              <Button
                variant="secondary"
                label="Montar treino"
                onPress={() => router.push('/montar-treino' as Href)}
              />
            </View>
          ) : (
            <View style={styles.list}>
              {workouts.map((w) => (
                <TemplateCard
                  key={w.id}
                  workout={w}
                  selected={workoutId === w.id}
                  onPress={() => selectWorkout(w.id)}
                />
              ))}
            </View>
          )}

          <AppText variant="eyebrow" color="tertiary" style={styles.secLabelGap}>
            Dias da semana
          </AppText>
          <WeekdaySelector selected={weekdays} onToggle={toggleWeekday} />

          <AppText variant="eyebrow" color="tertiary" style={styles.secLabelGap}>
            Início
          </AppText>
          <DateField
            value={startDate}
            onChange={(v) => {
              if (error) setError(undefined);
              setStartDate(v === '' ? null : v);
            }}
            maximumDate={null}
          />

          {error ? (
            <AppText variant="bodySm" color="error" style={styles.error}>
              {error}
            </AppText>
          ) : null}
        </ScrollView>
      </Animated.View>

      <View style={styles.footer}>
        <Button
          variant="primary"
          label={isEdit ? 'Salvar' : 'Atribuir'}
          loading={isPending}
          disabled={!canSubmit}
          onPress={handleSubmit}
        />
      </View>
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
    paddingVertical: theme.spacing.md,
  },
  back: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerText: {
    flex: 1,
    gap: theme.spacing.xs,
  },
  content: {
    flexGrow: 1,
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.xs,
    paddingBottom: theme.spacing.xl,
  },
  secLabel: {
    marginBottom: theme.spacing.md,
  },
  secLabelGap: {
    marginTop: theme.spacing.xl,
    marginBottom: theme.spacing.md,
  },
  list: {
    gap: theme.spacing.md,
  },
  emptyBlock: {
    gap: theme.spacing.md,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
    backgroundColor: theme.colors.surface1,
    borderWidth: 1,
    borderColor: theme.colors.outlineVariant,
    borderRadius: theme.radius.card,
    padding: theme.spacing.lg,
  },
  cardSelected: {
    borderColor: theme.colors.neon,
    backgroundColor: theme.colors.surface2,
  },
  cardIcon: {
    width: 44,
    height: 44,
    borderRadius: theme.radius.pill,
    backgroundColor: theme.colors.surface2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardText: {
    flex: 1,
    gap: theme.spacing.xs,
  },
  checkMark: {
    width: 24,
    height: 24,
    borderRadius: theme.radius.pill,
    backgroundColor: theme.colors.neon,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkEmpty: {
    width: 24,
    height: 24,
    borderRadius: theme.radius.pill,
    borderWidth: 1,
    borderColor: theme.colors.outline,
  },
  weekdayRow: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
  },
  weekdayChip: {
    flex: 1,
    height: 44,
    borderRadius: theme.radius.input,
    borderWidth: 1,
    borderColor: theme.colors.outlineVariant,
    backgroundColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
  },
  weekdayChipOn: {
    backgroundColor: theme.colors.neon,
    borderColor: theme.colors.neon,
  },
  error: {
    marginTop: theme.spacing.lg,
  },
  footer: {
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.md,
    paddingBottom: theme.spacing.sm,
  },
}));
