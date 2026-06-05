# Bloco — Treinos do aluno · Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: superpowers:subagent-driven-development. Steps use `- [ ]`.

**Goal:** Lista de treinos da semana (Direção C: próximo treino em destaque + resto da semana) e detalhe do treino (Direção B refinada: foco do treino como herói + cards de exercício), com dado real da API. "Iniciar treino" navega para stub (player = próximo bloco).

**Base:** branch `bloco/bloco-2-hoje` (já tem jest-expo, `weekdayLetter`, `useMe`, radius 12, componentes do HOJE). Treinos empilha sobre o HOJE.

**Tech:** RN 0.83 · Expo SDK 55 · TS estrito · TanStack Query v5 · Zod · Unistyles 3 · Phosphor duotone · jest.

**Regras:** tokens do theme (sem hex hardcoded) · zero emoji · datas locais (nunca toISOString) · 1 motion por tela · parseApi+Zod em toda resposta.

Spec: `docs/superpowers/specs/2026-06-04-bloco-treinos-aluno-design.md`.

---

## Task 1: Schemas de treino (TDD)

**Files:** Modify `src/types/workouts.ts`; Create `src/types/workouts.test.ts`.

- [ ] **Step 1: Failing test** — `src/types/workouts.test.ts`:
```ts
import {
  StudentWorkoutsResponseSchema,
  WorkoutDetailSchema,
} from './workouts';

describe('schemas de treino', () => {
  it('lista de treinos', () => {
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
    expect(v.student_workouts[0]!.weekdays).toEqual([1, 3, 5]);
  });

  it('detalhe com exercícios (muscle_group nulo permitido)', () => {
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
    expect(v.workout.exercises[0]!.sets).toBe(4);
  });
});
```

- [ ] **Step 2: Run, fail** — `npm test -- src/types/workouts.test.ts` → FAIL.

- [ ] **Step 3: Implement** — append to `src/types/workouts.ts` (keep `WeekdaySchema`, `TodayWorkoutSummarySchema`):
```ts
const dateOnly = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);

// [Bloco Treinos] Item da lista GET /me/workouts (shape real confirmado no backend).
export const StudentWorkoutSchema = z.object({
  id: z.string().uuid(),
  student_id: z.string().uuid(),
  workout_id: z.string().uuid(),
  weekdays: z.array(WeekdaySchema),
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

// [Bloco Treinos] Exercício do detalhe GET /me/workouts/:id.
export const WorkoutExerciseSchema = z.object({
  id: z.string().uuid(),
  position: z.number().int().positive(),
  wger_exercise_id: z.number().int(),
  name_snapshot: z.string(),
  sets: z.number().int().nonnegative(),
  reps: z.number().int().nonnegative(),
  rest_seconds: z.number().int().nonnegative(),
  notes: z.string().nullable(),
  muscle_group: z.string().nullable(),
});
export type WorkoutExercise = z.infer<typeof WorkoutExerciseSchema>;

export const WorkoutDetailSchema = z.object({
  assignment: z.object({
    id: z.string().uuid(),
    workout_id: z.string().uuid(),
    weekdays: z.array(WeekdaySchema),
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

- [ ] **Step 4: Run, pass** → `npm test -- src/types/workouts.test.ts`.
- [ ] **Step 5: Green** → `npm run typecheck && npm run lint`.
- [ ] **Step 6: Commit** → `feat(types): schemas de treino do aluno (lista + detalhe)`.

---

## Task 2: `pickNextWorkout` (TDD)

**Files:** Create `src/lib/nextWorkout.ts`, `src/lib/nextWorkout.test.ts`.

- [ ] **Step 1: Failing test**:
```ts
import { pickNextWorkout } from './nextWorkout';
import type { StudentWorkout } from '@/types/workouts';

function mk(p: Partial<StudentWorkout> & { id: string; weekdays: number[]; display_order: number; is_active?: boolean }): StudentWorkout {
  return {
    student_id: 'x', workout_id: 'x', start_date: '2026-06-01', end_date: null,
    created_at: '', workout_name: p.id, workout_notes: null, exercise_count: 0,
    last_completed_date: null, is_active: p.is_active ?? true,
    ...p,
  } as StudentWorkout;
}

describe('pickNextWorkout', () => {
  it('treino de hoje vence (dist 0)', () => {
    const r = pickNextWorkout([mk({ id: 'A', weekdays: [2], display_order: 0 }), mk({ id: 'B', weekdays: [4], display_order: 1 })], 2);
    expect(r.next?.id).toBe('A');
    expect(r.rest.map((w) => w.id)).toEqual(['B']);
  });
  it('sem treino hoje → menor distância à frente', () => {
    const r = pickNextWorkout([mk({ id: 'A', weekdays: [1], display_order: 0 }), mk({ id: 'B', weekdays: [4], display_order: 1 })], 2);
    expect(r.next?.id).toBe('B'); // qui (dist 2) vs seg (dist 6)
  });
  it('ignora inativos; vazio → next null', () => {
    expect(pickNextWorkout([mk({ id: 'A', weekdays: [2], display_order: 0, is_active: false })], 2).next).toBeNull();
    expect(pickNextWorkout([], 3).next).toBeNull();
  });
  it('desempate por display_order', () => {
    const r = pickNextWorkout([mk({ id: 'A', weekdays: [2], display_order: 2 }), mk({ id: 'B', weekdays: [2], display_order: 1 })], 2);
    expect(r.next?.id).toBe('B');
  });
});
```

- [ ] **Step 2: Run, fail.**
- [ ] **Step 3: Implement** — `src/lib/nextWorkout.ts`:
```ts
import type { StudentWorkout, Weekday } from '@/types/workouts';

// Distância circular de hoje até um weekday agendado (0 = hoje, 1..6 à frente).
function daysUntil(today: Weekday, target: Weekday): number {
  return (target - today + 7) % 7;
}

export type NextWorkoutPick = {
  next: StudentWorkout | null;
  rest: StudentWorkout[];
};

// Elege o próximo treino entre os ATIVOS pela menor distância em dias a partir de
// hoje (treino de hoje = dist 0), com display_order como desempate. "rest" = demais
// ativos ordenados por display_order.
export function pickNextWorkout(items: StudentWorkout[], today: Weekday): NextWorkoutPick {
  const ranked = items
    .filter((w) => w.is_active && w.weekdays.length > 0)
    .map((w) => ({ w, dist: Math.min(...w.weekdays.map((wd) => daysUntil(today, wd))) }))
    .sort((a, b) => a.dist - b.dist || a.w.display_order - b.w.display_order);

  if (ranked.length === 0) return { next: null, rest: [] };

  const next = ranked[0]!.w;
  const rest = ranked
    .slice(1)
    .map((r) => r.w)
    .sort((a, b) => a.display_order - b.display_order);
  return { next, rest };
}
```

- [ ] **Step 4: Run, pass.** **Step 5: typecheck+lint.** **Step 6: Commit** `feat(lib): pickNextWorkout (proximo treino por weekday)`.

---

## Task 3: `estimatedMinutes` (TDD)

**Files:** Create `src/lib/duration.ts`, `src/lib/duration.test.ts`.

- [ ] **Step 1: Failing test**:
```ts
import { estimatedMinutes } from './duration';

describe('estimatedMinutes', () => {
  it('soma execução (~3s/rep) + descanso por série', () => {
    // 4x10 rest60: 4*(30+60)=360s ; 3x12 rest45: 3*(36+45)=243s ; total 603s ~ 10min
    expect(estimatedMinutes([
      { sets: 4, reps: 10, rest_seconds: 60 },
      { sets: 3, reps: 12, rest_seconds: 45 },
    ])).toBe(10);
  });
  it('mínimo 1 e lista vazia → 1', () => {
    expect(estimatedMinutes([])).toBe(1);
  });
});
```

- [ ] **Step 2: Run, fail.**
- [ ] **Step 3: Implement** — `src/lib/duration.ts`:
```ts
type Sets = { sets: number; reps: number; rest_seconds: number };

// Estimativa simples de duração: cada série ~ (reps * 3s de execução + descanso).
// Para o card-resumo; não precisa ser exata.
export function estimatedMinutes(exercises: Sets[]): number {
  const seconds = exercises.reduce(
    (acc, e) => acc + e.sets * (e.reps * 3 + e.rest_seconds),
    0,
  );
  return Math.max(1, Math.round(seconds / 60));
}
```

- [ ] **Step 4: pass. Step 5: typecheck+lint. Step 6: Commit** `feat(lib): estimatedMinutes (duracao estimada do treino)`.

---

## Task 4: Hooks de treino

**Files:** Create `src/hooks/useStudentWorkouts.ts`, `src/hooks/useWorkoutDetail.ts`.

- [ ] **Step 1: `useStudentWorkouts.ts`** (padrão useMe):
```ts
import { useQuery, type UseQueryResult } from '@tanstack/react-query';
import { api } from '@/api/client';
import { endpoints } from '@/api/endpoints';
import { parseApi } from '@/api/parseApi';
import { StudentWorkoutsResponseSchema, type StudentWorkout } from '@/types/workouts';
import { useAuthStore } from '@/store/authStore';

export const studentWorkoutsQueryKey = ['me', 'workouts', 'list'] as const;

export function useStudentWorkouts(): UseQueryResult<StudentWorkout[], unknown> {
  const status = useAuthStore((s) => s.status);
  return useQuery({
    queryKey: studentWorkoutsQueryKey,
    queryFn: async (): Promise<StudentWorkout[]> => {
      const { data } = await api.get(endpoints.me.workouts);
      return parseApi(StudentWorkoutsResponseSchema, data).student_workouts;
    },
    enabled: status === 'authenticated',
  });
}
```

- [ ] **Step 2: `useWorkoutDetail.ts`**:
```ts
import { useQuery, type UseQueryResult } from '@tanstack/react-query';
import { api } from '@/api/client';
import { endpoints } from '@/api/endpoints';
import { parseApi } from '@/api/parseApi';
import { WorkoutDetailSchema, type WorkoutDetail } from '@/types/workouts';
import { useAuthStore } from '@/store/authStore';

export const workoutDetailQueryKey = (id: string) => ['me', 'workouts', 'detail', id] as const;

export function useWorkoutDetail(studentWorkoutId: string | undefined): UseQueryResult<WorkoutDetail, unknown> {
  const status = useAuthStore((s) => s.status);
  return useQuery({
    queryKey: workoutDetailQueryKey(studentWorkoutId ?? ''),
    queryFn: async (): Promise<WorkoutDetail> => {
      const { data } = await api.get(`${endpoints.me.workouts}/${studentWorkoutId}`);
      return parseApi(WorkoutDetailSchema, data);
    },
    enabled: status === 'authenticated' && !!studentWorkoutId,
  });
}
```

- [ ] **Step 3: typecheck+lint+test green. Step 4: Commit** `feat(hooks): useStudentWorkouts + useWorkoutDetail`.

---

## Task 5: Componentes da lista — `WeekdayChips`, `WorkoutListRow`, `NextWorkoutCard` (TDD render)

**Files:** Create the 3 components + `.test.tsx` for each in `src/components/workouts/`.

Use: `AppText`/`@/components/ui`, `darkTheme`/`@/theme`, `weekdayLetter`/`@/lib/weekday`, Phosphor (`Play`, `CaretRight`). `StudentWorkout` type. Tokens: surface1, neon, outlineVariant, outline, surface3, textInverse, textTertiary; radius.card(12)/pill; spacing.

- [ ] **Step 1: Tests** (one file each):

`WeekdayChips.test.tsx`:
```tsx
import { render, screen } from '@testing-library/react-native';
import { WeekdayChips } from './WeekdayChips';
describe('WeekdayChips', () => {
  it('renderiza 7 letras', () => {
    render(<WeekdayChips active={[1, 3, 5]} />);
    expect(screen.getAllByText(/^[STQD]$/).length).toBe(7);
  });
});
```

`NextWorkoutCard.test.tsx`:
```tsx
import { render, screen, fireEvent } from '@testing-library/react-native';
import { NextWorkoutCard } from './NextWorkoutCard';
describe('NextWorkoutCard', () => {
  it('mostra foco, nº exercícios e dispara iniciar', () => {
    const onStart = jest.fn();
    render(<NextWorkoutCard focus="Peito e tríceps" exerciseCount={6} isToday onStart={onStart} onPress={jest.fn()} />);
    expect(screen.getByText('Peito e tríceps')).toBeTruthy();
    expect(screen.getByText('Iniciar treino')).toBeTruthy();
    fireEvent.press(screen.getByText('Iniciar treino'));
    expect(onStart).toHaveBeenCalled();
  });
});
```

`WorkoutListRow.test.tsx`:
```tsx
import { render, screen, fireEvent } from '@testing-library/react-native';
import { WorkoutListRow } from './WorkoutListRow';
describe('WorkoutListRow', () => {
  it('mostra nome e meta, responde ao toque', () => {
    const onPress = jest.fn();
    render(<WorkoutListRow name="Treino B" meta="qui · 7 exerc." onPress={onPress} />);
    expect(screen.getByText('Treino B')).toBeTruthy();
    fireEvent.press(screen.getByText('Treino B'));
    expect(onPress).toHaveBeenCalled();
  });
});
```

- [ ] **Step 2: Run, fail.**
- [ ] **Step 3: Implement** — `src/components/workouts/WeekdayChips.tsx`:
```tsx
import { View } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';
import { AppText } from '@/components/ui';
import { weekdayLetter } from '@/lib/weekday';
import type { Weekday } from '@/types/workouts';

const ALL: Weekday[] = [1, 2, 3, 4, 5, 6, 7];

export function WeekdayChips({ active }: { active: number[] }) {
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
    width: 22, height: 22, borderRadius: 6,
    backgroundColor: theme.colors.surface3,
    alignItems: 'center', justifyContent: 'center',
  },
  chipOn: { backgroundColor: theme.colors.neon },
}));
```

`src/components/workouts/NextWorkoutCard.tsx`:
```tsx
import { Pressable, View } from 'react-native';
import { Play } from 'phosphor-react-native';
import { StyleSheet } from 'react-native-unistyles';
import { AppText } from '@/components/ui';
import { darkTheme } from '@/theme';

const { colors } = darkTheme;

type Props = {
  focus: string;
  exerciseCount: number;
  isToday: boolean;
  onStart: () => void;
  onPress: () => void;
};

export function NextWorkoutCard({ focus, exerciseCount, isToday, onStart, onPress }: Props) {
  return (
    <Pressable style={styles.card} onPress={onPress} accessibilityRole="button">
      <AppText variant="eyebrow" color="neon">
        {isToday ? 'Próximo · hoje' : 'Próximo treino'}
      </AppText>
      <AppText variant="h2" style={styles.focus}>
        {focus}
      </AppText>
      <AppText variant="bodySm" color="secondary" style={styles.meta}>
        {`${exerciseCount} exercícios`}
      </AppText>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Iniciar treino"
        style={styles.cta}
        onPress={onStart}
      >
        <Play size={18} weight="fill" color={colors.textInverse} />
        <AppText variant="label" color="inverse">Iniciar treino</AppText>
      </Pressable>
    </Pressable>
  );
}

const styles = StyleSheet.create((theme) => ({
  card: {
    backgroundColor: theme.colors.surface1,
    borderWidth: 1, borderColor: theme.colors.outlineVariant,
    borderRadius: theme.radius.card, padding: theme.spacing.lg,
  },
  focus: { marginTop: theme.spacing.sm, marginBottom: theme.spacing.xs },
  meta: { marginBottom: theme.spacing.lg },
  cta: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: theme.spacing.sm, backgroundColor: theme.colors.neon,
    borderRadius: theme.radius.pill, paddingVertical: theme.spacing.md,
  },
}));
```

`src/components/workouts/WorkoutListRow.tsx`:
```tsx
import { Pressable, View } from 'react-native';
import { CaretRight } from 'phosphor-react-native';
import { StyleSheet } from 'react-native-unistyles';
import { AppText } from '@/components/ui';
import { darkTheme } from '@/theme';

const { colors } = darkTheme;

type Props = { name: string; meta: string; onPress: () => void };

export function WorkoutListRow({ name, meta, onPress }: Props) {
  return (
    <Pressable style={styles.row} onPress={onPress} accessibilityRole="button">
      <View style={styles.body}>
        <AppText variant="h3" style={styles.name}>{name}</AppText>
        <AppText variant="metaSmall" color="tertiary">{meta}</AppText>
      </View>
      <CaretRight size={18} weight="bold" color={colors.textTertiary} />
    </Pressable>
  );
}

const styles = StyleSheet.create((theme) => ({
  row: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: theme.colors.surface1, borderWidth: 1,
    borderColor: theme.colors.outlineVariant, borderRadius: theme.radius.card,
    padding: theme.spacing.md, marginBottom: theme.spacing.sm,
  },
  body: { flex: 1 },
  name: { fontSize: 17, marginBottom: 2 },
}));
```

- [ ] **Step 4: Run, pass.** **Step 5: typecheck+lint+full test.** **Step 6: Commit** `feat(workouts): WeekdayChips, NextWorkoutCard, WorkoutListRow`.

---

## Task 6: Componentes do detalhe — `ExerciseCard`, `WorkoutDetailHeader` (TDD render)

**Files:** Create both + `.test.tsx` in `src/components/workouts/`.

- [ ] **Step 1: Tests**

`ExerciseCard.test.tsx`:
```tsx
import { render, screen } from '@testing-library/react-native';
import { ExerciseCard } from './ExerciseCard';
describe('ExerciseCard', () => {
  it('mostra nome, séries×reps e descanso; tag muscular quando houver', () => {
    render(<ExerciseCard name="Supino reto" sets={4} reps={10} restSeconds={60} muscleGroup="Peito" />);
    expect(screen.getByText('Supino reto')).toBeTruthy();
    expect(screen.getByText('4×10')).toBeTruthy();
    expect(screen.getByText('Peito')).toBeTruthy();
  });
  it('sem grupo muscular não renderiza a tag', () => {
    render(<ExerciseCard name="Prancha" sets={3} reps={30} restSeconds={30} muscleGroup={null} />);
    expect(screen.queryByText('Peito')).toBeNull();
  });
});
```

`WorkoutDetailHeader.test.tsx`:
```tsx
import { render, screen } from '@testing-library/react-native';
import { WorkoutDetailHeader } from './WorkoutDetailHeader';
describe('WorkoutDetailHeader', () => {
  it('herói = foco; fallback para nome quando notes nulo', () => {
    const { rerender } = render(<WorkoutDetailHeader name="Treino A" notes="Peito e tríceps" exerciseCount={6} estMinutes={50} weekdays={[1,3,5]} />);
    expect(screen.getByText('Peito e tríceps')).toBeTruthy();
    rerender(<WorkoutDetailHeader name="Treino A" notes={null} exerciseCount={6} estMinutes={50} weekdays={[1,3,5]} />);
    expect(screen.getByText('Treino A')).toBeTruthy();
  });
});
```

- [ ] **Step 2: Run, fail.**
- [ ] **Step 3: Implement** — `src/components/workouts/ExerciseCard.tsx`:
```tsx
import { View } from 'react-native';
import { Timer } from 'phosphor-react-native';
import { StyleSheet } from 'react-native-unistyles';
import { AppText, Tag } from '@/components/ui';
import { darkTheme } from '@/theme';

const { colors } = darkTheme;

type Props = {
  name: string; sets: number; reps: number; restSeconds: number; muscleGroup: string | null;
};

export function ExerciseCard({ name, sets, reps, restSeconds, muscleGroup }: Props) {
  return (
    <View style={styles.card}>
      <View style={styles.left}>
        <AppText variant="h3" style={styles.name}>{name}</AppText>
        {muscleGroup ? <View style={styles.tagWrap}><Tag label={muscleGroup} /></View> : null}
      </View>
      <View style={styles.right}>
        <AppText variant="dataMed" color="neon" style={styles.sets}>{`${sets}×${reps}`}</AppText>
        <View style={styles.rest}>
          <Timer size={12} weight="duotone" color={colors.textTertiary} />
          <AppText variant="metaSmall" color="tertiary">{`${restSeconds}s`}</AppText>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create((theme) => ({
  card: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start',
    backgroundColor: theme.colors.surface1, borderWidth: 1,
    borderColor: theme.colors.outlineVariant, borderRadius: theme.radius.card,
    padding: theme.spacing.md, marginBottom: theme.spacing.sm,
  },
  left: { flex: 1 },
  name: { fontSize: 18 },
  tagWrap: { marginTop: theme.spacing.xs, alignSelf: 'flex-start' },
  right: { alignItems: 'flex-end' },
  sets: { fontSize: 22 },
  rest: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 },
}));
```
> If the existing `Tag` atom API differs (props), adapt the usage to it (it lives in `src/components/ui`, exported as `Tag` with `TagTone`). Inspect it first.

`src/components/workouts/WorkoutDetailHeader.tsx`:
```tsx
import { View } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';
import { AppText } from '@/components/ui';
import { WeekdayChips } from './WeekdayChips';

type Props = {
  name: string; notes: string | null; exerciseCount: number; estMinutes: number; weekdays: number[];
};

export function WorkoutDetailHeader({ name, notes, exerciseCount, estMinutes, weekdays }: Props) {
  const focus = notes && notes.trim().length > 0 ? notes : name;
  return (
    <View>
      <AppText variant="eyebrow" color="tertiary">{name}</AppText>
      <AppText variant="h1" style={styles.focus} numberOfLines={2}>{focus}</AppText>
      <AppText variant="bodySm" color="secondary" style={styles.meta}>
        {`${exerciseCount} exercícios · ~${estMinutes} min`}
      </AppText>
      <View style={styles.chips}><WeekdayChips active={weekdays} /></View>
    </View>
  );
}

const styles = StyleSheet.create((theme) => ({
  focus: { fontSize: 36, lineHeight: 34, marginTop: theme.spacing.sm },
  meta: { marginTop: theme.spacing.sm },
  chips: { marginTop: theme.spacing.md },
}));
```

- [ ] **Step 4: pass. Step 5: typecheck+lint+full test. Step 6: Commit** `feat(workouts): ExerciseCard + WorkoutDetailHeader`.

---

## Task 7: Tela da lista (Direção C)

**Files:** Modify `app/(aluno)/(tabs)/treinos.tsx` (replace placeholder); Create `src/components/workouts/index.ts` (barrel).

- [ ] **Step 1: Barrel** `src/components/workouts/index.ts`:
```ts
export { WeekdayChips } from './WeekdayChips';
export { NextWorkoutCard } from './NextWorkoutCard';
export { WorkoutListRow } from './WorkoutListRow';
export { ExerciseCard } from './ExerciseCard';
export { WorkoutDetailHeader } from './WorkoutDetailHeader';
```

- [ ] **Step 2: Implement** `app/(aluno)/(tabs)/treinos.tsx`:
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
import { darkTheme } from '@/theme';
import type { Weekday } from '@/types/workouts';

const { motion } = darkTheme;

function isoWeekdayLocal(d: Date): Weekday {
  const dow = d.getDay(); // 0=dom..6=sab
  return (dow === 0 ? 7 : dow) as Weekday;
}

export default function AlunoTreinosScreen() {
  const workouts = useStudentWorkouts();

  const opacity = useSharedValue(0);
  const translateY = useSharedValue(12);
  useEffect(() => {
    opacity.value = withTiming(1, { duration: motion.screenMs });
    translateY.value = withTiming(0, { duration: motion.screenMs });
  }, [opacity, translateY]);
  const revealStyle = useAnimatedStyle(() => ({ opacity: opacity.value, transform: [{ translateY: translateY.value }] }));

  const today = isoWeekdayLocal(new Date());
  const picked = workouts.data ? pickNextWorkout(workouts.data, today) : { next: null, rest: [] };

  function openDetail(id: string) {
    router.push(`/(aluno)/treino/${id}` as Href);
  }
  // [fluxo futuro] player = próximo bloco; por ora "Iniciar treino" abre o detalhe.
  function startWorkout(id: string) {
    openDetail(id);
  }

  return (
    <Screen scroll padded>
      <Animated.View style={revealStyle}>
        <AppText variant="eyebrow" color="tertiary">Seus treinos</AppText>
        <AppText variant="h2" style={styles.title}>Treinos</AppText>

        {picked.next ? (
          <NextWorkoutCard
            focus={picked.next.workout_notes?.trim() || picked.next.workout_name}
            exerciseCount={picked.next.exercise_count}
            isToday={picked.next.weekdays.includes(today)}
            onStart={() => startWorkout(picked.next!.id)}
            onPress={() => openDetail(picked.next!.id)}
          />
        ) : null}

        {picked.rest.length > 0 ? (
          <View style={styles.restBlock}>
            <AppText variant="eyebrow" color="tertiary" style={styles.restLabel}>Resto da semana</AppText>
            {picked.rest.map((w) => (
              <WorkoutListRow
                key={w.id}
                name={w.workout_name}
                meta={`${w.weekdays.map(weekdayLetter).join(' ')} · ${w.exercise_count} exerc.`}
                onPress={() => openDetail(w.id)}
              />
            ))}
          </View>
        ) : null}

        {workouts.isSuccess && !picked.next ? (
          <AppText variant="bodySm" color="tertiary" style={styles.empty}>Nenhum treino atribuído ainda.</AppText>
        ) : null}
        {workouts.isError ? (
          <AppText variant="bodySm" color="tertiary" style={styles.empty}>Não foi possível carregar agora.</AppText>
        ) : null}
      </Animated.View>
    </Screen>
  );
}

const styles = StyleSheet.create((theme) => ({
  title: { marginTop: theme.spacing.xs, marginBottom: theme.spacing.lg },
  restBlock: { marginTop: theme.spacing.xl },
  restLabel: { marginBottom: theme.spacing.md },
  empty: { marginTop: theme.spacing.xl },
}));
```

- [ ] **Step 3: typecheck+lint+test green. Step 4: Commit** `feat(workouts): tela de lista de treinos (Direcao C)`.

---

## Task 8: Tela de detalhe (Direção B) + rota

**Files:** Create `app/(aluno)/treino/[id].tsx`. (O Stack de `app/(aluno)/_layout.tsx` auto-descobre a rota; não precisa editar o layout.)

- [ ] **Step 1: Implement** `app/(aluno)/treino/[id].tsx`:
```tsx
import { useEffect } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { router, useLocalSearchParams } from 'expo-router';
import { CaretLeft, Play } from 'phosphor-react-native';
import { StyleSheet } from 'react-native-unistyles';

import { AppText } from '@/components/ui';
import { ExerciseCard, WorkoutDetailHeader } from '@/components/workouts';
import { useWorkoutDetail } from '@/hooks/useWorkoutDetail';
import { estimatedMinutes } from '@/lib/duration';
import { darkTheme } from '@/theme';

const { colors, motion } = darkTheme;

export default function TreinoDetalheScreen() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const detail = useWorkoutDetail(id);

  const opacity = useSharedValue(0);
  useEffect(() => { opacity.value = withTiming(1, { duration: motion.screenMs }); }, [opacity]);
  const revealStyle = useAnimatedStyle(() => ({ opacity: opacity.value }));

  const w = detail.data?.workout;
  const assignment = detail.data?.assignment;
  const est = w ? estimatedMinutes(w.exercises) : 0;

  // [fluxo futuro] player = próximo bloco; por ora "Iniciar treino" é stub (volta).
  function startWorkout() {
    router.back();
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <Pressable accessibilityRole="button" accessibilityLabel="Voltar" hitSlop={12} onPress={() => router.back()} style={styles.back}>
          <CaretLeft size={20} weight="bold" color={colors.textSecondary} />
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Animated.View style={revealStyle}>
          {w && assignment ? (
            <>
              <WorkoutDetailHeader
                name={w.name}
                notes={w.notes}
                exerciseCount={w.exercises.length}
                estMinutes={est}
                weekdays={assignment.weekdays}
              />
              <AppText variant="eyebrow" color="tertiary" style={styles.secLabel}>Exercícios</AppText>
              {w.exercises.map((ex) => (
                <ExerciseCard
                  key={ex.id}
                  name={ex.name_snapshot}
                  sets={ex.sets}
                  reps={ex.reps}
                  restSeconds={ex.rest_seconds}
                  muscleGroup={ex.muscle_group}
                />
              ))}
            </>
          ) : detail.isError ? (
            <AppText variant="bodySm" color="tertiary">Não foi possível carregar o treino.</AppText>
          ) : null}
        </Animated.View>
      </ScrollView>

      {w ? (
        <View style={styles.ctabar}>
          <Pressable accessibilityRole="button" accessibilityLabel="Iniciar treino" style={styles.cta} onPress={startWorkout}>
            <Play size={18} weight="fill" color={colors.textInverse} />
            <AppText variant="label" color="inverse">Iniciar treino</AppText>
          </Pressable>
        </View>
      ) : null}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create((theme) => ({
  safe: { flex: 1, backgroundColor: theme.colors.bgBase },
  header: { paddingHorizontal: theme.spacing.lg, paddingTop: theme.spacing.sm },
  back: { width: 34, height: 34, borderRadius: theme.radius.pill, backgroundColor: theme.colors.surface1, alignItems: 'center', justifyContent: 'center' },
  scroll: { paddingHorizontal: theme.spacing.lg, paddingTop: theme.spacing.md, paddingBottom: 110 },
  secLabel: { marginTop: theme.spacing.xl, marginBottom: theme.spacing.md },
  ctabar: { position: 'absolute', left: 0, right: 0, bottom: 0, padding: theme.spacing.lg, backgroundColor: theme.colors.bgBase },
  cta: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: theme.spacing.sm,
    backgroundColor: theme.colors.neon, borderRadius: theme.radius.pill, paddingVertical: theme.spacing.md,
  },
}));
```

- [ ] **Step 2:** typecheck+lint+test. Verify the route resolves (`/(aluno)/treino/<id>`); if expo-router typed routes complain, the `as Href` cast in the list screen handles navigation.
- [ ] **Step 3: Commit** `feat(workouts): tela de detalhe do treino (Direcao B) + rota`.

---

## Task 9: Verificação final

- [ ] **Step 1:** `npm run typecheck && npm run lint && npm test` — tudo verde.
- [ ] **Step 2:** (manual/device, quando possível) lista mostra próximo correto pelo weekday local; detalhe abre exercícios na ordem; tag muscular some quando null; "Iniciar treino" stub; sem emoji; cards 12px.
- [ ] **Step 3:** Final review holístico do diff do bloco; corrigir issues importantes.

---

## Self-review (cobertura do spec)

- Lista C (próximo + resto): Task 7 ✓ (usa Task 2 pickNextWorkout)
- Detalhe B refinado (foco herói + cards exercício + CTA fixo): Tasks 6, 8 ✓
- "Iniciar treino" stub (sem criar sessão): Tasks 7, 8 ✓
- Dados reais + parseApi: Tasks 1, 4 ✓
- weekdayLetter reutilizado: Tasks 5, 7 ✓
- muscle_group/workout_notes nulos com fallback: Tasks 6, 7, 8 ✓
- zero emoji / tokens / motion único / local weekday: todas as tasks ✓
- Pendência HOJE reconciliation: registrada no spec (fora de escopo) ✓
