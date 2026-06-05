import { SessionSetSchema, WorkoutSessionSchema } from './sessions';

describe('schemas de sessão de treino', () => {
  it('parseia payload completo (1 exercício, 1 série logada)', () => {
    const v = WorkoutSessionSchema.parse({
      session: {
        id: '11111111-1111-1111-1111-111111111111',
        student_workout_id: '22222222-2222-2222-2222-222222222222',
        scheduled_for_date: '2026-06-05',
        status: 'in_progress',
        started_at: '2026-06-05T10:00:00.000Z',
        completed_at: null,
      },
      exercises: [
        {
          workout_exercise_id: '44444444-4444-4444-4444-444444444444',
          completed: false,
          completed_at: null,
          position: 1,
          wger_exercise_id: 73,
          name_snapshot: 'Supino reto',
          sets: 4,
          reps: 10,
          rest_seconds: 60,
          notes: null,
          muscle_group: null,
          sets_logged: [
            {
              set_index: 1,
              weight_kg: 40,
              reps_done: 10,
              rest_seconds_actual: 55,
            },
          ],
        },
      ],
      schedule_hint: 'today',
    });

    expect(v.session.status).toBe('in_progress');
    expect(v.exercises[0]?.sets_logged[0]?.set_index).toBe(1);
    expect(v.exercises[0]?.sets_logged[0]?.weight_kg).toBe(40);
  });

  it('rejeita set_index 0', () => {
    expect(() =>
      SessionSetSchema.parse({
        set_index: 0,
        weight_kg: null,
        reps_done: null,
        rest_seconds_actual: null,
      }),
    ).toThrow();
  });
});
