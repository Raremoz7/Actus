import {
  AssignWorkoutBodySchema,
  ProWorkoutDetailSchema,
  ProWorkoutsResponseSchema,
} from './workouts';

describe('schemas de treino — visão do profissional', () => {
  it('lista de templates (GET /workouts)', () => {
    const v = ProWorkoutsResponseSchema.parse({
      workouts: [
        {
          id: '33333333-3333-3333-3333-333333333333',
          name: 'Treino A',
          notes: 'Peito e tríceps',
          exercise_count: 6,
          created_at: '2026-06-01T10:00:00.000Z',
        },
        {
          id: '44444444-4444-4444-4444-444444444444',
          name: 'Treino B',
          notes: null,
          exercise_count: 0,
          created_at: '2026-06-02T10:00:00.000Z',
        },
      ],
    });
    expect(v.workouts).toHaveLength(2);
    expect(v.workouts[0]?.exercise_count).toBe(6);
    expect(v.workouts[1]?.notes).toBeNull();
  });

  it('detalhe FLAT do template com exercícios (GET /workouts/:id)', () => {
    const v = ProWorkoutDetailSchema.parse({
      id: '33333333-3333-3333-3333-333333333333',
      name: 'Treino A',
      notes: null,
      created_at: '2026-06-01T10:00:00.000Z',
      exercises: [
        {
          id: '55555555-5555-5555-5555-555555555555',
          position: 1,
          wger_exercise_id: 73,
          name_snapshot: 'Supino reto',
          sets: 4,
          reps: 10,
          rest_seconds: 60,
          notes: null,
          muscle_group: 'Peito',
        },
        {
          id: '66666666-6666-6666-6666-666666666666',
          position: 2,
          wger_exercise_id: 1,
          name_snapshot: 'Tríceps corda',
          sets: 3,
          reps: 12,
          rest_seconds: 45,
          notes: 'cadência controlada',
          muscle_group: null,
        },
      ],
    });
    expect(v.exercises).toHaveLength(2);
    expect(v.exercises[0]?.sets).toBe(4);
    expect(v.exercises[1]?.muscle_group).toBeNull();
  });

  it('corpo de atribuição mínimo (POST /students/:id/workouts)', () => {
    const v = AssignWorkoutBodySchema.parse({
      workout_id: '33333333-3333-3333-3333-333333333333',
      weekdays: [1, 3, 5],
    });
    expect(v.weekdays).toEqual([1, 3, 5]);
    expect(v.start_date).toBeUndefined();
  });

  it('corpo de atribuição completo', () => {
    const v = AssignWorkoutBodySchema.parse({
      workout_id: '33333333-3333-3333-3333-333333333333',
      weekdays: [2, 4],
      start_date: '2026-06-08',
      end_date: '2026-07-08',
      display_order: 1,
      is_active: true,
    });
    expect(v.start_date).toBe('2026-06-08');
    expect(v.is_active).toBe(true);
  });

  it('rejeita weekdays vazio', () => {
    expect(() =>
      AssignWorkoutBodySchema.parse({
        workout_id: '33333333-3333-3333-3333-333333333333',
        weekdays: [],
      }),
    ).toThrow();
  });

  it('rejeita weekday fora de 1..7', () => {
    expect(() =>
      AssignWorkoutBodySchema.parse({
        workout_id: '33333333-3333-3333-3333-333333333333',
        weekdays: [0],
      }),
    ).toThrow();
  });

  it('rejeita start_date com formato inválido', () => {
    expect(() =>
      AssignWorkoutBodySchema.parse({
        workout_id: '33333333-3333-3333-3333-333333333333',
        weekdays: [1],
        start_date: '08/06/2026',
      }),
    ).toThrow();
  });
});
