import { TodayWorkoutSummarySchema } from './workouts';
import { ChallengeTeaserSchema } from './challenges';

describe('schemas-resumo do HOJE', () => {
  it('TodayWorkoutSummary: dia com treino', () => {
    const v = TodayWorkoutSummarySchema.parse({
      has_workout: true,
      workout: {
        id: '11111111-1111-1111-1111-111111111111',
        name: 'Treino A',
        muscle_groups: 'Peito e Tríceps',
        exercise_count: 6,
        est_minutes: 50,
      },
      next_workout: null,
    });
    expect(v.workout?.exercise_count).toBe(6);
  });

  it('TodayWorkoutSummary: dia de descanso', () => {
    const v = TodayWorkoutSummarySchema.parse({
      has_workout: false,
      workout: null,
      next_workout: { weekday: 5, muscle_groups: 'Costas' },
    });
    expect(v.has_workout).toBe(false);
    expect(v.next_workout?.muscle_groups).toBe('Costas');
  });

  it('ChallengeTeaser', () => {
    const v = ChallengeTeaserSchema.parse({
      id: '22222222-2222-2222-2222-222222222222',
      title: 'Desafio de Junho',
      progress_current: 12,
      progress_total: 30,
    });
    expect(v.progress_total).toBe(30);
  });

  it('rejeita exercise_count negativo', () => {
    expect(() =>
      TodayWorkoutSummarySchema.parse({
        has_workout: true,
        workout: {
          id: '11111111-1111-1111-1111-111111111111',
          name: 'X',
          muscle_groups: 'Y',
          exercise_count: -1,
          est_minutes: 10,
        },
        next_workout: null,
      }),
    ).toThrow();
  });
});
