import {
  AddParticipantsBodySchema,
  CreateChallengeBodySchema,
  ProChallengeDetailSchema,
  ProChallengeReportSchema,
  ProChallengesResponseSchema,
} from './challenges';

describe('schemas de desafio — visão do profissional', () => {
  it('lista de desafios (GET /professional/challenges)', () => {
    const v = ProChallengesResponseSchema.parse({
      challenges: [
        {
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
        {
          id: '33333333-3333-3333-3333-333333333333',
          owner_professional_id: '22222222-2222-2222-2222-222222222222',
          name: 'Rascunho de Julho',
          starts_on: '2026-07-01',
          ends_on: '2026-07-31',
          visibility: 'private_ranking',
          status: 'draft',
          created_at: '2026-06-01T10:00:00.000Z',
          updated_at: '2026-06-01T10:00:00.000Z',
        },
      ],
    });
    expect(v.challenges).toHaveLength(2);
    expect(v.challenges[0]?.status).toBe('active');
    expect(v.challenges[1]?.visibility).toBe('private_ranking');
  });

  it('detalhe do desafio com participantes (GET /professional/challenges/:id)', () => {
    const v = ProChallengeDetailSchema.parse({
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
      participants: [
        {
          student_id: '44444444-4444-4444-4444-444444444444',
          status: 'active',
          display_name: 'Ana',
          invited_at: '2026-05-21T10:00:00.000Z',
          responded_at: '2026-05-22T08:00:00.000Z',
        },
        {
          student_id: '55555555-5555-5555-5555-555555555555',
          status: 'invited',
          display_name: null,
          invited_at: '2026-05-21T10:00:00.000Z',
          responded_at: null,
        },
      ],
    });
    expect(v.challenge.name).toBe('Desafio de Junho');
    expect(v.participants).toHaveLength(2);
    expect(v.participants[0]?.status).toBe('active');
    expect(v.participants[1]?.responded_at).toBeNull();
  });

  it('corpo de criação mínimo (POST /professional/challenges)', () => {
    const v = CreateChallengeBodySchema.parse({
      name: 'Desafio de Junho',
      starts_on: '2026-06-01',
      ends_on: '2026-06-30',
    });
    expect(v.name).toBe('Desafio de Junho');
    expect(v.visibility).toBeUndefined();
    expect(v.status).toBeUndefined();
  });

  it('corpo de criação completo (publicar como active)', () => {
    const v = CreateChallengeBodySchema.parse({
      name: 'Desafio de Junho',
      starts_on: '2026-06-01',
      ends_on: '2026-06-30',
      visibility: 'private_ranking',
      status: 'active',
    });
    expect(v.status).toBe('active');
    expect(v.visibility).toBe('private_ranking');
  });

  it('aceita criação com starts_on igual a ends_on', () => {
    const v = CreateChallengeBodySchema.parse({
      name: 'Desafio de um dia',
      starts_on: '2026-06-01',
      ends_on: '2026-06-01',
    });
    expect(v.ends_on).toBe(v.starts_on);
  });

  it('rejeita ends_on anterior a starts_on', () => {
    expect(() =>
      CreateChallengeBodySchema.parse({
        name: 'Desafio inválido',
        starts_on: '2026-06-30',
        ends_on: '2026-06-01',
      }),
    ).toThrow();
  });

  it('rejeita name vazio', () => {
    expect(() =>
      CreateChallengeBodySchema.parse({
        name: '',
        starts_on: '2026-06-01',
        ends_on: '2026-06-30',
      }),
    ).toThrow();
  });

  it('rejeita status ended na criação', () => {
    expect(() =>
      CreateChallengeBodySchema.parse({
        name: 'Desafio de Junho',
        starts_on: '2026-06-01',
        ends_on: '2026-06-30',
        status: 'ended',
      }),
    ).toThrow();
  });

  it('rejeita data com formato BR', () => {
    expect(() =>
      CreateChallengeBodySchema.parse({
        name: 'Desafio de Junho',
        starts_on: '01/06/2026',
        ends_on: '2026-06-30',
      }),
    ).toThrow();
  });

  it('corpo de adicionar participantes (POST .../participants)', () => {
    const v = AddParticipantsBodySchema.parse({
      student_ids: [
        '44444444-4444-4444-4444-444444444444',
        '55555555-5555-5555-5555-555555555555',
      ],
    });
    expect(v.student_ids).toHaveLength(2);
  });

  it('rejeita student_ids vazio', () => {
    expect(() =>
      AddParticipantsBodySchema.parse({ student_ids: [] }),
    ).toThrow();
  });

  it('rejeita student_id que não é uuid', () => {
    expect(() =>
      AddParticipantsBodySchema.parse({ student_ids: ['nao-eh-uuid'] }),
    ).toThrow();
  });

  it('relatório do desafio (GET /professional/challenges/:id/report)', () => {
    const v = ProChallengeReportSchema.parse({
      ok: true,
      challenge_id: '11111111-1111-1111-1111-111111111111',
      invited_count: 3,
      active_count: 2,
      declined_count: 1,
      average_active_days: 8.5,
      average_adherence_ratio: 0.4250000000000001,
      challenge_day_span: 20,
      participants: [
        {
          student_id: '44444444-4444-4444-4444-444444444444',
          display_name: 'Ana',
          active_days: 12,
          streak_current_in_challenge: 0,
          last_activity_date: '2026-06-04',
          streak_broken_hint: true,
        },
        {
          student_id: '55555555-5555-5555-5555-555555555555',
          display_name: null,
          active_days: 0,
          streak_current_in_challenge: 0,
          last_activity_date: null,
          streak_broken_hint: false,
        },
      ],
    });
    expect(v.ok).toBe(true);
    expect(v.invited_count).toBe(3);
    expect(v.average_active_days).toBeCloseTo(8.5);
    expect(v.challenge_day_span).toBe(20);
    expect(v.participants[0]?.streak_broken_hint).toBe(true);
    expect(v.participants[1]?.last_activity_date).toBeNull();
  });
});
