import {
  CheckInsResponseSchema,
  StudentsResponseSchema,
} from './professional';

describe('schemas do lado profissional', () => {
  it('parseia lista de alunos válida (full_name e birth_date nullable)', () => {
    const v = StudentsResponseSchema.parse({
      students: [
        {
          id: '11111111-1111-1111-1111-111111111111',
          email: 'aluno@exemplo.com',
          full_name: 'Maria Silva',
          birth_date: '1995-03-10',
          professional_role: 'personal',
          linked_at: '2026-06-01T12:00:00.000Z',
        },
        {
          id: '22222222-2222-2222-2222-222222222222',
          email: 'outro@exemplo.com',
          full_name: null,
          birth_date: null,
          professional_role: 'nutricionista',
          linked_at: '2026-06-02T08:30:00.000Z',
        },
      ],
    });

    expect(v.students).toHaveLength(2);
    expect(v.students[0]?.full_name).toBe('Maria Silva');
    expect(v.students[1]?.full_name).toBeNull();
    expect(v.students[1]?.birth_date).toBeNull();
  });

  it('parseia check-ins de um aluno (item tolera campos extras)', () => {
    const v = CheckInsResponseSchema.parse({
      student_id: '11111111-1111-1111-1111-111111111111',
      check_ins: [
        { check_in_date: '2026-06-05', mood: 'great' },
        { check_in_date: '2026-06-04' },
      ],
    });

    expect(v.check_ins).toHaveLength(2);
    expect(v.check_ins[0]?.check_in_date).toBe('2026-06-05');
    // .passthrough() preserva campos extras do item.
    expect((v.check_ins[0] as { mood?: string }).mood).toBe('great');
  });

  it('rejeita professional_role inválido', () => {
    expect(() =>
      StudentsResponseSchema.parse({
        students: [
          {
            id: '11111111-1111-1111-1111-111111111111',
            email: 'aluno@exemplo.com',
            full_name: 'Maria Silva',
            birth_date: '1995-03-10',
            professional_role: 'admin',
            linked_at: '2026-06-01T12:00:00.000Z',
          },
        ],
      }),
    ).toThrow();
  });
});
