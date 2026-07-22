import {
  SessionSetSchema,
  WorkoutSessionSchema,
  WorkoutFinishResponseSchema,
  WorkoutFinishSummarySchema,
} from './sessions';

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

describe('resumo do finish (POST /me/workouts/sessions/:id/finish)', () => {
  // Payload realista no formato do backend: a sessão completa + `summary` irmão.
  const finishPayload = {
    session: {
      id: '11111111-1111-1111-1111-111111111111',
      student_workout_id: '22222222-2222-2222-2222-222222222222',
      scheduled_for_date: '2026-06-05',
      status: 'completed',
      started_at: '2026-06-05T10:00:00.000Z',
      completed_at: '2026-06-05T10:48:00.000Z',
    },
    exercises: [
      {
        workout_exercise_id: '44444444-4444-4444-4444-444444444444',
        completed: true,
        completed_at: '2026-06-05T10:30:00.000Z',
        position: 1,
        wger_exercise_id: 73,
        name_snapshot: 'Supino reto',
        sets: 4,
        reps: 10,
        rest_seconds: 60,
        notes: null,
        muscle_group: 'Peito',
        sets_logged: [
          { set_index: 1, weight_kg: 40, reps_done: 10, rest_seconds_actual: 55 },
        ],
      },
    ],
    summary: {
      duration_ms: 2880000,
      duration_label: '48m',
      total_volume_kg: 400,
      has_load_data: true,
      estimated_calories_kcal: 312,
      calories_method: 'met_with_body_weight',
      load_evolution: [
        {
          workout_exercise_id: '44444444-4444-4444-4444-444444444444',
          exercise_name: 'Supino reto',
          muscle_group: 'Peito',
          current_max_kg: 40,
          previous_max_kg: 35,
          delta_kg: 5,
        },
      ],
      branding: {
        professional_id: '66666666-6666-6666-6666-666666666666',
        professional_display_name: 'João Personal',
      },
      share: {
        layout: 'strava_style_v1',
        title: 'Treino concluído',
        subtitle: 'com João Personal',
        duration_label: '48m',
        metrics: [
          { label: 'Duração', value: '48m' },
          { label: 'Volume', value: '~400 kg' },
          { label: 'Calorias (est.)', value: '312 kcal' },
        ],
        highlights: ['Volume total: ~400 kg', 'Evolução: +5 kg em Supino reto'],
        hide_load_evolution: false,
      },
    },
  };

  it('parseia a resposta completa do finish (sessão + summary)', () => {
    const v = WorkoutFinishResponseSchema.parse(finishPayload);
    expect(v.session.status).toBe('completed');
    expect(v.summary.estimated_calories_kcal).toBe(312);
    expect(v.summary.load_evolution[0]?.delta_kg).toBe(5);
    expect(v.summary.share.layout).toBe('strava_style_v1');
    expect(v.summary.branding?.professional_display_name).toBe('João Personal');
  });

  it('aceita summary sem dados de carga (branding null, sem evolução)', () => {
    const v = WorkoutFinishSummarySchema.parse({
      duration_ms: 600000,
      duration_label: '10m',
      total_volume_kg: 0,
      has_load_data: false,
      estimated_calories_kcal: 80,
      calories_method: 'met_reference_weight',
      load_evolution: [],
      branding: null,
      share: {
        layout: 'strava_style_v1',
        title: 'Treino concluído',
        subtitle: null,
        duration_label: '10m',
        metrics: [
          { label: 'Duração', value: '10m' },
          { label: 'Calorias (est.)', value: '80 kcal' },
        ],
        highlights: [],
        hide_load_evolution: true,
      },
    });
    expect(v.branding).toBeNull();
    expect(v.share.hide_load_evolution).toBe(true);
  });

  it('rejeita layout de share diferente de strava_style_v1', () => {
    expect(() =>
      WorkoutFinishSummarySchema.parse({
        ...finishPayload.summary,
        share: { ...finishPayload.summary.share, layout: 'outro_layout' },
      }),
    ).toThrow();
  });
});
