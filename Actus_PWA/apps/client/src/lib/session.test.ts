import {
  buildSetsPayload,
  currentExerciseIndex,
  isExerciseFullyLogged,
  isSessionComplete,
  nextSetIndex,
  sessionProgress,
} from './session';
import type { SessionExercise, SessionSet } from '@/types/sessions';

function mkSet(over: Partial<SessionSet> = {}): SessionSet {
  return {
    set_index: over.set_index ?? 1,
    weight_kg: over.weight_kg ?? null,
    reps_done: over.reps_done ?? null,
    rest_seconds_actual: over.rest_seconds_actual ?? null,
  };
}

function mk(over: Partial<SessionExercise> = {}): SessionExercise {
  return {
    workout_exercise_id: over.workout_exercise_id ?? '00000000-0000-0000-0000-000000000000',
    completed: over.completed ?? false,
    completed_at: over.completed_at ?? null,
    position: over.position ?? 1,
    wger_exercise_id: over.wger_exercise_id ?? 1,
    name_snapshot: over.name_snapshot ?? 'Supino',
    sets: over.sets ?? 3,
    reps: over.reps ?? 10,
    rest_seconds: over.rest_seconds ?? 60,
    notes: over.notes ?? null,
    muscle_group: over.muscle_group ?? null,
    sets_logged: over.sets_logged ?? [],
  };
}

describe('currentExerciseIndex', () => {
  it('sessão vazia → null', () => {
    expect(currentExerciseIndex([])).toBeNull();
  });

  it('retorna o primeiro incompleto (no meio)', () => {
    const ex = [
      mk({ position: 1, completed: true }),
      mk({ position: 2, completed: false }),
      mk({ position: 3, completed: false }),
    ];
    expect(currentExerciseIndex(ex)).toBe(1);
  });

  it('todos concluídos → null', () => {
    const ex = [mk({ completed: true }), mk({ completed: true })];
    expect(currentExerciseIndex(ex)).toBeNull();
  });
});

describe('isSessionComplete', () => {
  it('sessão vazia → false', () => {
    expect(isSessionComplete([])).toBe(false);
  });

  it('todos concluídos → true', () => {
    const ex = [mk({ completed: true }), mk({ completed: true })];
    expect(isSessionComplete(ex)).toBe(true);
  });

  it('algum incompleto → false', () => {
    const ex = [mk({ completed: true }), mk({ completed: false })];
    expect(isSessionComplete(ex)).toBe(false);
  });
});

describe('sessionProgress', () => {
  it('conta concluídos sobre o total', () => {
    const ex = [mk({ completed: true }), mk({ completed: false }), mk({ completed: true })];
    expect(sessionProgress(ex)).toEqual({ done: 2, total: 3 });
  });

  it('sessão vazia → 0/0', () => {
    expect(sessionProgress([])).toEqual({ done: 0, total: 0 });
  });
});

describe('nextSetIndex', () => {
  it('sem séries logadas → 1', () => {
    expect(nextSetIndex(mk({ sets_logged: [] }))).toBe(1);
  });

  it('após 2 séries logadas → 3', () => {
    const exercise = mk({ sets_logged: [mkSet({ set_index: 1 }), mkSet({ set_index: 2 })] });
    expect(nextSetIndex(exercise)).toBe(3);
  });
});

describe('isExerciseFullyLogged', () => {
  it('false quando logged < sets', () => {
    const exercise = mk({ sets: 3, sets_logged: [mkSet(), mkSet()] });
    expect(isExerciseFullyLogged(exercise)).toBe(false);
  });

  it('true quando logged === sets', () => {
    const exercise = mk({ sets: 2, sets_logged: [mkSet(), mkSet()] });
    expect(isExerciseFullyLogged(exercise)).toBe(true);
  });

  it('true quando logged > sets', () => {
    const exercise = mk({ sets: 1, sets_logged: [mkSet(), mkSet()] });
    expect(isExerciseFullyLogged(exercise)).toBe(true);
  });
});

describe('buildSetsPayload (full-replace)', () => {
  it('acumula as séries já logadas + a nova (não perde as anteriores)', () => {
    const logged: SessionSet[] = [
      mkSet({ set_index: 1, weight_kg: 40, reps_done: 10 }),
      mkSet({ set_index: 2, weight_kg: 42, reps_done: 9 }),
    ];
    const out = buildSetsPayload(logged, { set_index: 3, weight_kg: 44, reps_done: 8 });
    expect(out).toHaveLength(3);
    expect(out.map((s) => s.set_index)).toEqual([1, 2, 3]);
    expect(out[0]).toEqual({ set_index: 1, weight_kg: 40, reps_done: 10 });
    expect(out[2]).toEqual({ set_index: 3, weight_kg: 44, reps_done: 8 });
  });

  it('omite campos nulos das séries já logadas', () => {
    const out = buildSetsPayload([mkSet({ set_index: 1 })], { set_index: 2 });
    expect(out[0]).toEqual({ set_index: 1 });
    expect(out[1]).toEqual({ set_index: 2 });
  });
});
