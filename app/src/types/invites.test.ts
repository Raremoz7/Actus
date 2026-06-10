import {
  CreatedInviteSchema,
  InvitesResponseSchema,
  ProInviteSchema,
} from './invites';

describe('schemas de convites (lado profissional)', () => {
  it('parseia lista de convites válida (GET /invites)', () => {
    const v = InvitesResponseSchema.parse({
      invites: [
        {
          id: '11111111-1111-1111-1111-111111111111',
          code: 'ABC123',
          expires_at: '2026-06-12T12:00:00.000Z',
          max_uses: 5,
          used_count: 2,
          created_at: '2026-06-05T08:30:00.000Z',
          active: true,
        },
        {
          id: '22222222-2222-2222-2222-222222222222',
          code: 'XYZ789',
          expires_at: '2026-06-05T00:00:00.000Z',
          max_uses: 1,
          used_count: 1,
          created_at: '2026-06-01T10:00:00.000Z',
          active: false,
        },
      ],
    });

    expect(v.invites).toHaveLength(2);
    expect(v.invites[0]?.code).toBe('ABC123');
    expect(v.invites[0]?.active).toBe(true);
    expect(v.invites[1]?.used_count).toBe(1);
    expect(v.invites[1]?.active).toBe(false);
  });

  it('parseia resposta de criação (POST /invites) — id + code flat', () => {
    const v = CreatedInviteSchema.parse({
      id: '33333333-3333-3333-3333-333333333333',
      code: 'NEW001',
    });

    expect(v.id).toBe('33333333-3333-3333-3333-333333333333');
    expect(v.code).toBe('NEW001');
  });

  it('rejeita max_uses menor que 1', () => {
    expect(() =>
      ProInviteSchema.parse({
        id: '11111111-1111-1111-1111-111111111111',
        code: 'ABC123',
        expires_at: '2026-06-12T12:00:00.000Z',
        max_uses: 0,
        used_count: 0,
        created_at: '2026-06-05T08:30:00.000Z',
        active: true,
      }),
    ).toThrow();
  });

  it('rejeita id que não é uuid', () => {
    expect(() =>
      CreatedInviteSchema.parse({ id: 'not-a-uuid', code: 'NEW001' }),
    ).toThrow();
  });
});
