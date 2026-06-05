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
