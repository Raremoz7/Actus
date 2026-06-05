# Bloco — Treinos do aluno · Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: superpowers:subagent-driven-development. Steps use `- [ ]`.

**Goal:** Lista de treinos da semana (Direção C: próximo-herói + lista) e detalhe do treino (Direção B: foco-herói + cards de exercício), read-only, com "Iniciar treino" como stub (player = próximo bloco).

**Architecture:** Schemas Zod do shape real de `/me/workouts` e `/me/workouts/:id`; lógica pura em `src/lib/` (eleger próximo treino, duração estimada); hooks finos em `src/hooks/`; componentes de apresentação em `src/components/workouts/`; tela de lista (tab) + tela de detalhe (empilhada `treino/[id]`).

**Base branch:** `bloco/bloco-2-hoje` (já tem jest-expo, `radius.card:12`, `src/lib/weekday.ts`, AppText/Screen/tokens). **Não** ramificar de `branch/davi`.

**Regras herdadas:** tokens do theme (nunca hex), **zero emoji** (Phosphor duotone), datas locais (nunca `toISOString`), 1 motion por tela, cards radius 12. Toda resposta via `parseApi`+Zod.

---

## Estrutura de arquivos

**Criar:** `src/lib/nextWorkout.ts`(+test) · `src/lib/duration.ts`(+test) · `src/hooks/useStudentWorkouts.ts` · `src/hooks/useWorkoutDetail.ts` · `src/components/workouts/{WeekdayChips,NextWorkoutCard,WorkoutListRow,ExerciseCard,WorkoutDetailHeader,index}.tsx`(+tests) · `app/(aluno)/treino/[id].tsx`

**Modificar:** `src/types/workouts.ts` (schemas reais) · `app/(aluno)/(tabs)/treinos.tsx` (substitui placeholder)

---

## Task 1: Schemas reais de treino (TDD)

**Files:** Modify `src/types/workouts.ts`; Create `src/types/workouts.test.ts`

- [ ] **Step 1: Failing test** — `src/types/workouts.test.ts`:
```ts
import {
  StudentWorkoutsResponseSchema,
  WorkoutDetailSchema,
} from './workouts';

describe('schemas de treino', () => {
  it('lista de student_workouts', () => {
    const v = StudentWorkoutsResponseSchema.parse({
      student_workouts: [
        {
          id: '11111111-1111-1111-1111-111111111111',
          student_id: '22222222-2222-2222-2222-222222222222',
          workout_id: '33333333-3333-3333-3333-333333333333',
          weekdays: [1, 3, 5],
          start_date: '2026-06-01',
          end_date: null,
          display_order: 0,
          is_active: true,
          created_at: '2026-06-01T10:00:00.000Z',
          workout_name: 'Treino A',
          workout_notes: 'Peito e tríceps',
          exercise_count: 6,
          last_completed_date: '2026-06-02',
        },
      ],
    });
    expect(v.student_workouts[0]?.weekdays).toEqual([1, 3, 5]);
  });

  it('detalhe com exercícios e muscle_group nulo', () => {
    const v = WorkoutDetailSchema.parse({
      assignment: {
        id: '11111111-1111-1111-1111-111111111111',
        workout_id: '33333333-3333-3333-3333-333333333333',
        weekdays: [1, 3, 5],
        start_date: '2026-06-01',
        end_date: null,
        display_order: 0,
        is_active: true,
        created_at: '2026-06-01T10:00:00.000Z',
      },
      workout: {
        id: '33333333-3333-3333-3333-333333333333',
        name: 'Treino A',
        notes: null,
        exercises: [
          {
            id: '44444444-4444-4444-4444-444444444444',
            position: 1,
            wger_exercise_id: 73,
            name_snapshot: 'Supino reto',
            sets: 4,
            reps: 10,
            rest_seconds: 60,
            notes: null,
            muscle_group: null,
          },
        ],
      },
      recent_sessions: [],
    });
    expect(v.workout.exercises[0]?.sets).toBe(4);
  });

  it('rejeita weekday fora de 1..7', () => {
    expect(() =>
      StudentWorkoutsResponseSchema.parse({
        student_workouts: [{ weekdays: [8] }],
      }),
    ).toThrow();
  });
});
```

- [ ] **Step 2: Run, see fail** — `npm test -- src/types/workouts.test.ts` → FAIL.

- [ ] **Step 3: Implement** — add to `src/types/workouts.ts` (keep `WeekdaySchema` and the existing `TodayWorkoutSummarySchema`):
```ts
const dateOnly = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);

// [Bloco Treinos] Item da lista — shape REAL de GET /me/workouts.
export const StudentWorkoutSchema = z.object({
  id: z.string().uuid(),
  student_id: z.string().uuid(),
  workout_id: z.string().uuid(),
  weekdays: z.array(WeekdaySchema).min(1),
  start_date: dateOnly,
  end_date: dateOnly.nullable(),
  display_order: z.number().int(),
  is_active: z.boolean(),
  created_at: z.string(),
  workout_name: z.string(),
  workout_notes: z.string().nullable(),
  exercise_count: z.number().int().nonnegative(),
  last_completed_date: dateOnly.nullable(),
});
export type StudentWorkout = z.infer<typeof StudentWorkoutSchema>;

export const StudentWorkoutsResponseSchema = z.object({
  student_workouts: z.array(StudentWorkoutSchema),
});
export type StudentWorkoutsResponse = z.infer<typeof StudentWorkoutsResponseSchema>;

// [Bloco Treinos] Detalhe — shape REAL de GET /me/workouts/:id.
export const WorkoutExerciseSchema = z.object({
  id: z.string().uuid(),
  position: z.number().int().positive(),
  wger_exercise_id: z.number().int(),
  name_snapshot: z.string(),
  sets: z.number().int().positive(),
  reps: z.number().int().positive(),
  rest_seconds: z.number().int().nonnegative(),
  notes: z.string().nullable(),
  muscle_group: z.string().nullable(),
});
export type WorkoutExercise = z.infer<typeof WorkoutExerciseSchema>;

export const WorkoutDetailSchema = z.object({
  assignment: z.object({
    id: z.string().uuid(),
    workout_id: z.string().uuid(),
    weekdays: z.array(WeekdaySchema).min(1),
    start_date: dateOnly,
    end_date: dateOnly.nullable(),
    display_order: z.number().int(),
    is_active: z.boolean(),
    created_at: z.string(),
  }),
  workout: z.object({
    id: z.string().uuid(),
    name: z.string(),
    notes: z.string().nullable(),
    exercises: z.array(WorkoutExerciseSchema),
  }),
  recent_sessions: z.array(
    z.object({
      id: z.string().uuid(),
      scheduled_for_date: dateOnly,
      status: z.string(),
      started_at: z.string(),
      completed_at: z.string().nullable(),
    }),
  ),
});
export type WorkoutDetail = z.infer<typeof WorkoutDetailSchema>;
```
(`z` já está importado no arquivo.)

- [ ] **Step 4: Run, see pass** — `npm test -- src/types/workouts.test.ts` → PASS (3).
- [ ] **Step 5:** `npm run typecheck && npm run lint`.
- [ ] **Step 6: Commit** — `git -C "<wt>" add src/types/workouts.ts src/types/workouts.test.ts && git -C "<wt>" commit -m "feat(types): schemas reais de treino (lista + detalhe)"`

---

## Task 2: `pickNextWorkout` (TDD)

**Files:** Create `src/lib/nextWorkout.ts`, `src/lib/nextWorkout.test.ts`

- [ ] **Step 1: Failing test** — `src/lib/nextWorkout.test.ts`:
```ts
import { pickNextWorkout } from './nextWorkout';
import type { StudentWorkout } from '@/types/workouts';

function mk(over: Partial<StudentWorkout>): StudentWorkout {
  return {
    id: over.id ?? 'a',
    student_id: 's',
    workout_id: 'w',
    weekdays: over.weekdays ?? [1],
    start_date: '2026-06-01',
    end_date: null,
    display_order: over.display_order ?? 0,
    is_active: over.is_active ?? true,
    created_at: '2026-06-01T00:00:00Z',
    workout_name: over.workout_name ?? 'T',
    workout_notes: null,
    exercise_count: 0,
    last_completed_date: null,
  } as StudentWorkout;
}

describe('pickNextWorkout', () => {
  it('elege treino de hoje quando há match (isToday)', () => {
    const a = mk({ id: 'a', weekdays: [3], workout_name: 'A' });
    const r = pickNextWorkout([a], 3);
    expect(r.next?.id).toBe('a');
    expect(r.isToday).toBe(true);
    expect(r.rest).toHaveLength(0);
  });

  it('sem hoje, escolhe o próximo à frente (circular)', () => {
    const b = mk({ id: 'b', weekdays: [1], display_order: 0 }); // segunda
    const r = pickNextWorkout([b], 5); // sexta → próximo é seg
    expect(r.next?.id).toBe('b');
    expect(r.isToday).toBe(false);
  });

  it('desempata por display_order', () => {
    const a = mk({ id: 'a', weekdays: [3], display_order: 5 });
    const b = mk({ id: 'b', weekdays: [3], display_order: 1 });
    const r = pickNextWorkout([a, b], 3);
    expect(r.next?.id).toBe('b');
    expect(r.rest.map((x) => x.id)).toEqual(['a']);
  });

  it('ignora inativos; vazio → next null', () => {
    const a = mk({ id: 'a', weekdays: [3], is_active: false });
    const r = pickNextWorkout([a], 3);
    expect(r.next).toBeNull();
    expect(r.rest).toHaveLength(0);
  });
});
```

- [ ] **Step 2: Run, see fail.**
- [ ] **Step 3: Implement** — `src/lib/nextWorkout.ts`:
```ts
import type { StudentWorkout } from '@/types/workouts';
import type { Weekday } from '@/types/workouts';

export type NextWorkout = {
  next: StudentWorkout | null;
  isToday: boolean;
  rest: StudentWorkout[];
};

// Elege o próximo treino entre os atribuídos, dado o weekday local (1=seg..7=dom).
// Hoje tem prioridade; senão o de menor distância à frente (circular); desempate por display_order.
export function pickNextWorkout(items: StudentWorkout[], todayWeekday: Weekday): NextWorkout {
  const active = items
    .filter((i) => i.is_active)
    .slice()
    .sort((a, b) => a.display_order - b.display_order);

  if (active.length === 0) return { next: null, isToday: false, rest: [] };

  const today = active.find((i) => i.weekdays.includes(todayWeekday));
  if (today) {
    return { next: today, isToday: true, rest: active.filter((i) => i !== today) };
  }

  for (let d = 1; d <= 7; d += 1) {
    const wd = (((todayWeekday - 1 + d) % 7) + 1) as Weekday;
    const found = active.find((i) => i.weekdays.includes(wd));
    if (found) return { next: found, isToday: false, rest: active.filter((i) => i !== found) };
  }

  return { next: null, isToday: false, rest: active };
}
```

- [ ] **Step 4: Run, see pass (4).** **Step 5:** typecheck+lint. **Step 6: Commit** — `feat(lib): pickNextWorkout (elege proximo treino da semana)`.

---

## Task 3: `estimatedMinutes` (TDD)

**Files:** Create `src/lib/duration.ts`, `src/lib/duration.test.ts`

- [ ] **Step 1: Failing test** — `src/lib/duration.test.ts`:
```ts
import { estimatedMinutes } from './duration';

describe('estimatedMinutes', () => {
  it('soma sets*(reps*3s + rest) e arredonda em minutos', () => {
    // 1 ex: 4 sets * (10*3 + 60) = 4*90 = 360s = 6 min
    expect(estimatedMinutes([{ sets: 4, reps: 10, rest_seconds: 60 }])).toBe(6);
  });
  it('lista vazia → 0', () => {
    expect(estimatedMinutes([])).toBe(0);
  });
  it('soma múltiplos exercícios', () => {
    // 360s + (3*(12*3+45)=3*81=243s)=603s → round(603/60)=10
    expect(
      estimatedMinutes([
        { sets: 4, reps: 10, rest_seconds: 60 },
        { sets: 3, reps: 12, rest_seconds: 45 },
      ]),
    ).toBe(10);
  });
});
```

- [ ] **Step 2: fail.** **Step 3: Implement** — `src/lib/duration.ts`:
```ts
// Estimativa simples de duração de um treino. ~3s por repetição + descanso, por série.
type ExerciseTiming = { sets: number; reps: number; rest_seconds: number };
const SECONDS_PER_REP = 3;

export function estimatedMinutes(exercises: ExerciseTiming[]): number {
  const totalSeconds = exercises.reduce(
    (acc, e) => acc + e.sets * (e.reps * SECONDS_PER_REP + e.rest_seconds),
    0,
  );
  return Math.round(totalSeconds / 60);
}
```

- [ ] **Step 4: pass (3).** **Step 5:** typecheck+lint. **Step 6: Commit** — `feat(lib): estimatedMinutes (duracao estimada do treino)`.

---

## Task 4: Hooks de treino

**Files:** Create `src/hooks/useStudentWorkouts.ts`, `src/hooks/useWorkoutDetail.ts`

- [ ] **Step 1: `useStudentWorkouts`** — segue padrão `useMe`:
```ts
import { useQuery, type UseQueryResult } from '@tanstack/react-query';
import { api } from '@/api/client';
import { endpoints } from '@/api/endpoints';
import { parseApi } from '@/api/parseApi';
import { StudentWorkoutsResponseSchema, type StudentWorkoutsResponse } from '@/types/workouts';
import { useAuthStore } from '@/store/authStore';

export const studentWorkoutsQueryKey = ['me', 'workouts', 'list'] as const;

export function useStudentWorkouts(): UseQueryResult<StudentWorkoutsResponse, unknown> {
  const status = useAuthStore((s) => s.status);
  return useQuery({
    queryKey: studentWorkoutsQueryKey,
    queryFn: async (): Promise<StudentWorkoutsResponse> => {
      const { data } = await api.get(endpoints.me.workouts);
      return parseApi(StudentWorkoutsResponseSchema, data);
    },
    enabled: status === 'authenticated',
  });
}
```

- [ ] **Step 2: `useWorkoutDetail`**:
```ts
import { useQuery, type UseQueryResult } from '@tanstack/react-query';
import { api } from '@/api/client';
import { endpoints } from '@/api/endpoints';
import { parseApi } from '@/api/parseApi';
import { WorkoutDetailSchema, type WorkoutDetail } from '@/types/workouts';
import { useAuthStore } from '@/store/authStore';

export function workoutDetailQueryKey(id: string) {
  return ['me', 'workouts', 'detail', id] as const;
}

export function useWorkoutDetail(studentWorkoutId: string): UseQueryResult<WorkoutDetail, unknown> {
  const status = useAuthStore((s) => s.status);
  return useQuery({
    queryKey: workoutDetailQueryKey(studentWorkoutId),
    queryFn: async (): Promise<WorkoutDetail> => {
      const { data } = await api.get(`${endpoints.me.workouts}/${studentWorkoutId}`);
      return parseApi(WorkoutDetailSchema, data);
    },
    enabled: status === 'authenticated' && studentWorkoutId.length > 0,
  });
}
```

- [ ] **Step 3:** `npm run typecheck && npm run lint && npm test`. **Step 4: Commit** — `feat(hooks): useStudentWorkouts + useWorkoutDetail`.

---

## Task 5: `WeekdayChips` + `ExerciseCard` (TDD render)

**Files:** Create `src/components/workouts/WeekdayChips.tsx`(+test), `src/components/workouts/ExerciseCard.tsx`(+test)

- [ ] **Step 1: Tests**

`WeekdayChips.test.tsx`:
```tsx
import { render, screen } from '@testing-library/react-native';
import { WeekdayChips } from './WeekdayChips';

describe('WeekdayChips', () => {
  it('renderiza os 7 dias', () => {
    render(<WeekdayChips active={[1, 3, 5]} />);
    // 7 letras (S T Q Q S S D); 'D' aparece 1x
    expect(screen.getByText('D')).toBeTruthy();
  });
});
```

`ExerciseCard.test.tsx`:
```tsx
import { render, screen } from '@testing-library/react-native';
import { ExerciseCard } from './ExerciseCard';

describe('ExerciseCard', () => {
  it('mostra nome, séries×reps e descanso', () => {
    render(
      <ExerciseCard name="Supino reto" sets={4} reps={10} restSeconds={60} muscleGroup="Peito" />,
    );
    expect(screen.getByText('Supino reto')).toBeTruthy();
    expect(screen.getByText('4×10')).toBeTruthy();
    expect(screen.getByText('Peito')).toBeTruthy();
  });
  it('esconde a tag quando muscleGroup é null', () => {
    render(<ExerciseCard name="Agachamento" sets={3} reps={12} restSeconds={90} muscleGroup={null} />);
    expect(screen.queryByText('Peito')).toBeNull();
    expect(screen.getByText('3×12')).toBeTruthy();
  });
});
```

- [ ] **Step 2: fail.**
- [ ] **Step 3: Implement `WeekdayChips`** — `src/components/workouts/WeekdayChips.tsx`:
```tsx
import { View } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';

import { AppText } from '@/components/ui';
import { weekdayLetter } from '@/lib/weekday';
import type { Weekday } from '@/types/workouts';

const ALL: Weekday[] = [1, 2, 3, 4, 5, 6, 7];

type Props = { active: number[] };

export function WeekdayChips({ active }: Props) {
  return (
    <View style={styles.row}>
      {ALL.map((wd) => {
        const on = active.includes(wd);
        return (
          <View key={wd} style={[styles.chip, on && styles.chipOn]}>
            <AppText variant="metaSmall" color={on ? 'inverse' : 'tertiary'}>
              {weekdayLetter(wd)}
            </AppText>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create((theme) => ({
  row: { flexDirection: 'row', gap: theme.spacing.xs },
  chip: {
    width: 22,
    height: 22,
    borderRadius: theme.radius.tag,
    backgroundColor: theme.colors.surface3,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chipOn: { backgroundColor: theme.colors.neon },
}));
```

- [ ] **Step 4: Implement `ExerciseCard`** — `src/components/workouts/ExerciseCard.tsx`:
```tsx
import { View } from 'react-native';
import { Timer } from 'phosphor-react-native';
import { StyleSheet } from 'react-native-unistyles';

import { AppText, Tag } from '@/components/ui';
import { darkTheme } from '@/theme';

const { colors } = darkTheme;

type Props = {
  name: string;
  sets: number;
  reps: number;
  restSeconds: number;
  muscleGroup: string | null;
};

export function ExerciseCard({ name, sets, reps, restSeconds, muscleGroup }: Props) {
  return (
    <View style={styles.card}>
      <View style={styles.left}>
        <AppText variant="h3" numberOfLines={2}>
          {name}
        </AppText>
        {muscleGroup ? (
          <View style={styles.tagWrap}>
            <Tag label={muscleGroup} />
          </View>
        ) : null}
      </View>
      <View style={styles.right}>
        <AppText variant="dataMed" color="neon">
          {`${sets}×${reps}`}
        </AppText>
        <View style={styles.rest}>
          <Timer size={12} weight="duotone" color={colors.textTertiary} />
          <AppText variant="metaSmall" color="tertiary">
            {`${restSeconds}s`}
          </AppText>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create((theme) => ({
  card: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    backgroundColor: theme.colors.surface1,
    borderWidth: 1,
    borderColor: theme.colors.outlineVariant,
    borderRadius: theme.radius.card,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.sm,
  },
  left: { flex: 1, paddingRight: theme.spacing.sm },
  tagWrap: { flexDirection: 'row', marginTop: theme.spacing.xs },
  right: { alignItems: 'flex-end', gap: theme.spacing.xs },
  rest: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing.xs },
}));
```
> NOTA: confirme a API do átomo `Tag` (`src/components/ui/Tag.tsx`). Se a prop não for `label`, adapte a chamada ao que o átomo expõe (ex.: children). Verifique antes de implementar lendo o arquivo.

- [ ] **Step 5: pass.** **Step 6:** typecheck+lint+test. **Step 7: Commit** — `feat(workouts): WeekdayChips e ExerciseCard`.

---

## Task 6: `NextWorkoutCard` + `WorkoutListRow` + `WorkoutDetailHeader` + barrel (TDD render)

**Files:** Create `src/components/workouts/{NextWorkoutCard,WorkoutListRow,WorkoutDetailHeader,index}.tsx` (+ tests for the first two)

- [ ] **Step 1: Tests**

`NextWorkoutCard.test.tsx`:
```tsx
import { render, screen, fireEvent } from '@testing-library/react-native';
import { NextWorkoutCard } from './NextWorkoutCard';

describe('NextWorkoutCard', () => {
  it('mostra foco, contagem e dispara onStart', () => {
    const onStart = jest.fn();
    render(
      <NextWorkoutCard
        title="Peito e tríceps"
        exerciseCount={6}
        estMinutes={50}
        isToday
        onStart={onStart}
        onOpen={jest.fn()}
      />,
    );
    expect(screen.getByText('Peito e tríceps')).toBeTruthy();
    fireEvent.press(screen.getByText('Iniciar treino'));
    expect(onStart).toHaveBeenCalledTimes(1);
  });
});
```

`WorkoutListRow.test.tsx`:
```tsx
import { render, screen, fireEvent } from '@testing-library/react-native';
import { WorkoutListRow } from './WorkoutListRow';

describe('WorkoutListRow', () => {
  it('mostra nome e responde ao toque', () => {
    const onPress = jest.fn();
    render(<WorkoutListRow title="Treino B" subtitle="qui · 7 exerc." onPress={onPress} />);
    expect(screen.getByText('Treino B')).toBeTruthy();
    fireEvent.press(screen.getByText('Treino B'));
    expect(onPress).toHaveBeenCalled();
  });
});
```

- [ ] **Step 2: fail.**
- [ ] **Step 3: Implement `NextWorkoutCard`**:
```tsx
import { Pressable, View } from 'react-native';
import { Play } from 'phosphor-react-native';
import { StyleSheet } from 'react-native-unistyles';

import { AppText } from '@/components/ui';
import { darkTheme } from '@/theme';

const { colors } = darkTheme;

type Props = {
  title: string;
  exerciseCount: number;
  estMinutes: number;
  isToday: boolean;
  onStart: () => void;
  onOpen: () => void;
};

export function NextWorkoutCard({ title, exerciseCount, estMinutes, isToday, onStart, onOpen }: Props) {
  return (
    <Pressable style={styles.card} onPress={onOpen} accessibilityRole="button">
      <AppText variant="eyebrow" color="neon">
        {isToday ? 'Próximo · hoje' : 'Próximo treino'}
      </AppText>
      <AppText variant="h2" style={styles.title}>
        {title}
      </AppText>
      <AppText variant="bodySm" color="secondary" style={styles.meta}>
        {`${exerciseCount} exercícios · ~${estMinutes} min`}
      </AppText>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Iniciar treino"
        style={styles.cta}
        onPress={onStart}
      >
        <Play size={18} weight="fill" color={colors.textInverse} />
        <AppText variant="label" color="inverse">
          Iniciar treino
        </AppText>
      </Pressable>
    </Pressable>
  );
}

const styles = StyleSheet.create((theme) => ({
  card: {
    backgroundColor: theme.colors.surface1,
    borderWidth: 1,
    borderColor: theme.colors.outlineVariant,
    borderRadius: theme.radius.card,
    padding: theme.spacing.lg,
  },
  title: { marginTop: theme.spacing.sm },
  meta: { marginTop: theme.spacing.xs, marginBottom: theme.spacing.lg },
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
```

- [ ] **Step 4: Implement `WorkoutListRow`**:
```tsx
import { Pressable, View } from 'react-native';
import { CaretRight } from 'phosphor-react-native';
import { StyleSheet } from 'react-native-unistyles';

import { AppText } from '@/components/ui';
import { darkTheme } from '@/theme';

const { colors } = darkTheme;

type Props = { title: string; subtitle: string; onPress: () => void };

export function WorkoutListRow({ title, subtitle, onPress }: Props) {
  return (
    <Pressable style={styles.row} onPress={onPress} accessibilityRole="button">
      <View style={styles.body}>
        <AppText variant="h3" style={styles.title}>
          {title}
        </AppText>
        <AppText variant="metaSmall" color="tertiary" style={styles.sub}>
          {subtitle}
        </AppText>
      </View>
      <CaretRight size={16} weight="bold" color={colors.textTertiary} />
    </Pressable>
  );
}

const styles = StyleSheet.create((theme) => ({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: theme.colors.surface1,
    borderWidth: 1,
    borderColor: theme.colors.outlineVariant,
    borderRadius: theme.radius.card,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.sm,
  },
  body: { flex: 1 },
  title: { fontSize: 17 },
  sub: { marginTop: 2 },
}));
```

- [ ] **Step 5: Implement `WorkoutDetailHeader`** (no test required — pure presentational, exercised by the screen):
```tsx
import { View } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';

import { AppText } from '@/components/ui';
import { WeekdayChips } from './WeekdayChips';

type Props = {
  focus: string;
  exerciseCount: number;
  estMinutes: number;
  weekdays: number[];
};

export function WorkoutDetailHeader({ focus, exerciseCount, estMinutes, weekdays }: Props) {
  return (
    <View>
      <AppText variant="h1" style={styles.focus}>
        {focus}
      </AppText>
      <AppText variant="bodySm" color="secondary" style={styles.meta}>
        {`${exerciseCount} exercícios · ~${estMinutes} min`}
      </AppText>
      <WeekdayChips active={weekdays} />
    </View>
  );
}

const styles = StyleSheet.create((theme) => ({
  focus: { fontSize: 36, lineHeight: 34 },
  meta: { marginTop: theme.spacing.sm, marginBottom: theme.spacing.sm },
}));
```

- [ ] **Step 6: Barrel** — `src/components/workouts/index.ts`:
```ts
export { WeekdayChips } from './WeekdayChips';
export { ExerciseCard } from './ExerciseCard';
export { NextWorkoutCard } from './NextWorkoutCard';
export { WorkoutListRow } from './WorkoutListRow';
export { WorkoutDetailHeader } from './WorkoutDetailHeader';
```

- [ ] **Step 7: pass.** **Step 8:** typecheck+lint+test. **Step 9: Commit** — `feat(workouts): NextWorkoutCard, WorkoutListRow, WorkoutDetailHeader`.

---

## Task 7: Tela de lista `treinos.tsx` (Direção C)

**Files:** Modify `app/(aluno)/(tabs)/treinos.tsx`

- [ ] **Step 1: Implement** — substitui o placeholder:
```tsx
import { useEffect } from 'react';
import { View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { router, type Href } from 'expo-router';
import { StyleSheet } from 'react-native-unistyles';

import { Screen, AppText } from '@/components/ui';
import { NextWorkoutCard, WorkoutListRow } from '@/components/workouts';
import { useStudentWorkouts } from '@/hooks/useStudentWorkouts';
import { pickNextWorkout } from '@/lib/nextWorkout';
import { weekdayLetter } from '@/lib/weekday';
import type { Weekday } from '@/types/workouts';
import { darkTheme } from '@/theme';

const { motion } = darkTheme;

// weekday local ISO 1..7 (1=seg).
function todayWeekday(): Weekday {
  const dow = new Date().getDay(); // 0=dom..6=sab
  return (dow === 0 ? 7 : dow) as Weekday;
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
  // [fluxo futuro] player = próximo bloco; por ora abre o detalhe.
  function startWorkout(id: string) {
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
            onStart={() => startWorkout(picked.next!.id)}
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
                subtitle={`${nextDayLabel(w.weekdays)} · ${w.exercise_count} exerc.`}
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
            Não foi possível carregar agora. Tentar de novo.
          </AppText>
        ) : null}
      </Animated.View>
    </Screen>
  );
}

// Rótulo do primeiro dia da semana do treino (ex.: "Seg").
function nextDayLabel(weekdays: number[]): string {
  const first = [...weekdays].sort((a, b) => a - b)[0];
  return first ? `${dayName(first as Weekday)}` : '';
}
const NAMES: Record<Weekday, string> = {
  1: 'Seg', 2: 'Ter', 3: 'Qua', 4: 'Qui', 5: 'Sex', 6: 'Sáb', 7: 'Dom',
};
function dayName(wd: Weekday): string {
  return NAMES[wd];
}

const styles = StyleSheet.create((theme) => ({
  title: { marginTop: theme.spacing.xs, marginBottom: theme.spacing.lg },
  block: { marginTop: theme.spacing.lg },
  restLabel: { marginBottom: theme.spacing.sm },
}));
```
> NOTA: `estMinutes={0}` na lista porque a lista não traz exercícios (só `exercise_count`). Mostrar duração só no detalhe. Se preferir, omitir o "~min" no card quando 0 — ajuste o `NextWorkoutCard` para esconder "· ~0 min" quando `estMinutes===0`. Implementar esse guard no card (Task 6) OU passar uma prop opcional. Decisão de implementação: esconder o trecho de minutos quando `estMinutes<=0`.

- [ ] **Step 2:** Ajustar `NextWorkoutCard` para esconder o trecho `· ~N min` quando `estMinutes <= 0` (atualizar o teste da Task 6 se necessário para refletir). Manter verde.
- [ ] **Step 3:** typecheck+lint+test. **Step 4: Commit** — `feat(treinos): tela de lista (proximo + resto da semana)`.

---

## Task 8: Tela de detalhe `treino/[id].tsx` (Direção B)

**Files:** Create `app/(aluno)/treino/[id].tsx`

- [ ] **Step 1: Implement**:
```tsx
import { useEffect } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { router, useLocalSearchParams } from 'expo-router';
import { CaretLeft, Play } from 'phosphor-react-native';
import { StyleSheet } from 'react-native-unistyles';

import { AppText } from '@/components/ui';
import { WorkoutDetailHeader, ExerciseCard } from '@/components/workouts';
import { useWorkoutDetail } from '@/hooks/useWorkoutDetail';
import { estimatedMinutes } from '@/lib/duration';
import { darkTheme } from '@/theme';

const { motion, colors } = darkTheme;

export default function TreinoDetailScreen() {
  const params = useLocalSearchParams<{ id?: string }>();
  const id = typeof params.id === 'string' ? params.id : '';
  const detail = useWorkoutDetail(id);

  const opacity = useSharedValue(0);
  useEffect(() => {
    opacity.value = withTiming(1, { duration: motion.screenMs });
  }, [opacity]);
  const revealStyle = useAnimatedStyle(() => ({ opacity: opacity.value }));

  const workout = detail.data?.workout;
  const assignment = detail.data?.assignment;
  const exercises = workout?.exercises ?? [];
  const focus = workout?.notes ?? workout?.name ?? 'Treino';

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
              />
              <AppText variant="eyebrow" color="tertiary" style={styles.secLabel}>
                Exercícios
              </AppText>
              {exercises.map((e) => (
                <ExerciseCard
                  key={e.id}
                  name={e.name_snapshot}
                  sets={e.sets}
                  reps={e.reps}
                  restSeconds={e.rest_seconds}
                  muscleGroup={e.muscle_group}
                />
              ))}
            </>
          ) : detail.isError ? (
            <AppText variant="bodySm" color="tertiary">
              Não foi possível carregar o treino.
            </AppText>
          ) : null}
        </ScrollView>
      </Animated.View>

      {workout ? (
        <View style={styles.ctaBar}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Iniciar treino"
            style={styles.cta}
            onPress={() => {
              // [fluxo futuro] player de execução = próximo bloco.
            }}
          >
            <Play size={18} weight="fill" color={colors.textInverse} />
            <AppText variant="label" color="inverse">
              Iniciar treino
            </AppText>
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
  secLabel: { marginTop: theme.spacing.lg, marginBottom: theme.spacing.sm },
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
}));
```

- [ ] **Step 2:** typecheck+lint+test. Confirme que a rota `/(aluno)/treino/[id]` é descoberta pelo Stack de `app/(aluno)/_layout.tsx` (file-based; nenhuma alteração no layout deve ser necessária — verifique abrindo o app se possível, senão confie no typegen do expo-router).
- [ ] **Step 3: Commit** — `feat(treinos): tela de detalhe do treino (exercicios + iniciar stub)`.

---

## Task 9: Verificação final

- [ ] **Step 1:** `npm run typecheck && npm run lint && npm test` — tudo verde.
- [ ] **Step 2:** `npx expo-doctor` — 18/19 (ignorar falso-positivo de `react` duplicado: artefato de worktree aninhada).
- [ ] **Step 3: Validação manual (device, checklist):** lista mostra o "próximo" correto pelo weekday local (teste de fuso); "resto da semana" ordenado por display_order; detalhe abre exercícios na ordem `position`; tag muscular some quando `null`; herói cai para `workout_name` quando `notes` null; "Iniciar treino" não cria sessão (stub); estados vazio/erro aparecem.
- [ ] **Step 4:** Integração via fluxo Somo quando aprovado (coordenar com a base; este bloco está empilhado sobre `bloco/bloco-2-hoje`).

## Self-review (cobertura do spec)
- Lista C (próximo + resto): Task 7 ✓ · Detalhe B (foco herói + cards): Task 8 + 6 ✓
- Schemas reais: Task 1 ✓ · próximo treino (lógica): Task 2 ✓ · duração: Task 3 ✓ · hooks: Task 4 ✓
- WeekdayChips/ExerciseCard/cards: Tasks 5–6 ✓ · muscle_group/notes null fallback: Tasks 5/8 ✓
- Iniciar treino = stub: Tasks 7/8 ✓ · zero emoji / tokens / parseApi: todas ✓
- Pendência reconciliação HOJE: registrada no spec (fora de escopo) ✓
