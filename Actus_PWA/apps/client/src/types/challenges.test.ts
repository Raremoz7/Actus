import {
  ChallengesResponseSchema,
  RankingResponseSchema,
} from './challenges';

describe('schemas reais de desafio', () => {
  it('parse de lista válida (1 invited + 1 active)', () => {
    const v = ChallengesResponseSchema.parse({
      challenges: [
        {
          challenge: {
            id: '11111111-1111-1111-1111-111111111111',
            owner_professional_id: '22222222-2222-2222-2222-222222222222',
            name: 'Desafio de Junho',
            starts_on: '2026-06-01',
            ends_on: '2026-06-30',
            visibility: 'public_among_participants',
            status: 'active',
            created_at: '2026-05-20T10:00:00.000Z',
            updated_at: '2026-05-21T10:00:00.000Z',
          },
          participant_status: 'invited',
        },
        {
          challenge: {
            id: '33333333-3333-3333-3333-333333333333',
            owner_professional_id: '22222222-2222-2222-2222-222222222222',
            name: 'Desafio de Maio',
            starts_on: '2026-05-01',
            ends_on: '2026-05-31',
            visibility: 'private_ranking',
            status: 'ended',
            created_at: '2026-04-20T10:00:00.000Z',
            updated_at: '2026-04-21T10:00:00.000Z',
          },
          participant_status: 'active',
        },
      ],
    });
    expect(v.challenges).toHaveLength(2);
    expect(v.challenges[0]?.participant_status).toBe('invited');
    expect(v.challenges[1]?.participant_status).toBe('active');
    expect(v.challenges[0]?.challenge.starts_on).toBe('2026-06-01');
  });

  it('parse de ranking', () => {
    const v = RankingResponseSchema.parse({
      visibility: 'public_among_participants',
      ranking: [
        {
          position: 1,
          student_id: '44444444-4444-4444-4444-444444444444',
          display_name: 'Ana',
          streak_current_in_challenge: 12,
          streak_best_in_challenge: 15,
          active_days: 20,
          last_activity_date: '2026-06-05',
        },
        {
          position: 2,
          student_id: '55555555-5555-5555-5555-555555555555',
          display_name: null,
          streak_current_in_challenge: 0,
          streak_best_in_challenge: 0,
          active_days: 0,
          last_activity_date: null,
        },
      ],
    });
    expect(v.ranking).toHaveLength(2);
    expect(v.ranking[0]?.position).toBe(1);
    expect(v.ranking[0]?.streak_best_in_challenge).toBe(15);
    expect(v.ranking[0]?.last_activity_date).toBe('2026-06-05');
    expect(v.ranking[1]?.display_name).toBeNull();
    expect(v.ranking[1]?.last_activity_date).toBeNull();
  });

  it('rejeita participant_status inválido', () => {
    expect(() =>
      ChallengesResponseSchema.parse({
        challenges: [
          {
            challenge: {
              id: '11111111-1111-1111-1111-111111111111',
              owner_professional_id: '22222222-2222-2222-2222-222222222222',
              name: 'Desafio de Junho',
              starts_on: '2026-06-01',
              ends_on: '2026-06-30',
              visibility: 'public_among_participants',
              status: 'active',
              created_at: '2026-05-20T10:00:00.000Z',
              updated_at: '2026-05-21T10:00:00.000Z',
            },
            participant_status: 'pending',
          },
        ],
      }),
    ).toThrow();
  });
});
