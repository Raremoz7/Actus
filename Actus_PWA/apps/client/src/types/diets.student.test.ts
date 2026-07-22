import { StudentDietsResponseSchema, StudentDietDetailSchema } from './diets';

const item = {
  id: '11111111-1111-1111-1111-111111111111',
  diet_template_id: '22222222-2222-2222-2222-222222222222',
  start_date: '2026-06-01',
  is_active: true,
  created_at: '2026-06-01T10:00:00.000Z',
  template_name: 'Plano Cutting',
  template_body: { meals: [{ name: 'Café', kcal: 450 }], notes: 'x' },
};

describe('schemas de dieta do aluno', () => {
  it('lista /me/diets', () => {
    const v = StudentDietsResponseSchema.parse({ diets: [item] });
    expect(v.diets[0]?.template_name).toBe('Plano Cutting');
  });

  it('detalhe /me/diets/:id (com updated_at, body vazio tolerado)', () => {
    const v = StudentDietDetailSchema.parse({
      ...item,
      updated_at: '2026-06-02T10:00:00.000Z',
      template_body: {},
    });
    expect(v.is_active).toBe(true);
  });
});
