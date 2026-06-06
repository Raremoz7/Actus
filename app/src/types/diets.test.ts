import {
  AssignDietBodySchema,
  CreateDietBodySchema,
  DietBodySchema,
  DietTemplateDetailSchema,
  DietTemplatesResponseSchema,
  MealSchema,
  parseDietBody,
} from './diets';

const UUID = '11111111-1111-1111-1111-111111111111';

describe('schemas de dieta (pro)', () => {
  it('parseia a lista de diet_templates (só id/name/created_at)', () => {
    const v = DietTemplatesResponseSchema.parse({
      diet_templates: [
        {
          id: UUID,
          name: 'Cutting 2000kcal',
          created_at: '2026-06-01T10:00:00.000Z',
        },
      ],
    });
    expect(v.diet_templates[0]?.name).toBe('Cutting 2000kcal');
  });

  it('parseia o detalhe FLAT com body livre', () => {
    const v = DietTemplateDetailSchema.parse({
      id: UUID,
      name: 'Cutting 2000kcal',
      body: { meals: [{ name: 'Café da manhã', foods: 'Ovos\nAveia' }] },
      created_at: '2026-06-01T10:00:00.000Z',
    });
    expect(v.id).toBe(UUID);
    // body chega como unknown — estrutura validada via parseDietBody.
    const parsed = parseDietBody(v.body);
    expect(parsed.meals[0]?.name).toBe('Café da manhã');
  });

  it('DietBodySchema aceita refeição com macros opcionais ausentes', () => {
    const v = DietBodySchema.parse({
      meals: [{ name: 'Almoço', foods: 'Arroz, frango, salada' }],
    });
    expect(v.meals[0]?.kcal).toBeUndefined();
  });

  it('DietBodySchema aceita macros numéricos não-negativos', () => {
    const v = DietBodySchema.parse({
      meals: [
        { name: 'Almoço', kcal: 600, protein: 40, carbs: 70, fat: 15 },
      ],
      notes: 'Beber 3L de água',
    });
    expect(v.meals[0]?.protein).toBe(40);
    expect(v.notes).toBe('Beber 3L de água');
  });

  it('MealSchema aceita horário opcional (time)', () => {
    const v = MealSchema.parse({ name: 'Café da manhã', time: '08:00' });
    expect(v.time).toBe('08:00');
    const semHorario = MealSchema.parse({ name: 'Almoço' });
    expect(semHorario.time).toBeUndefined();
  });

  it('DietBodySchema aceita metas opcionais e água', () => {
    const v = DietBodySchema.parse({
      meals: [{ name: 'Café', time: '07:30', foods: 'Ovos' }],
      target_kcal: 2000,
      target_protein: 150,
      target_carbs: 200,
      target_fat: 60,
      water: 3000,
    });
    expect(v.target_kcal).toBe(2000);
    expect(v.target_protein).toBe(150);
    expect(v.water).toBe(3000);
    expect(v.meals[0]?.time).toBe('07:30');
  });

  it('DietBodySchema permite omitir todas as metas (continuam opcionais)', () => {
    const v = DietBodySchema.parse({ meals: [{ name: 'Almoço' }] });
    expect(v.target_kcal).toBeUndefined();
    expect(v.water).toBeUndefined();
  });

  it('DietBodySchema rejeita meta de água negativa', () => {
    expect(() =>
      DietBodySchema.parse({ meals: [{ name: 'X' }], water: -1 }),
    ).toThrow();
  });

  it('DietBodySchema rejeita refeição sem nome', () => {
    expect(() => DietBodySchema.parse({ meals: [{ name: '' }] })).toThrow();
  });

  it('DietBodySchema rejeita macro negativo', () => {
    expect(() =>
      DietBodySchema.parse({ meals: [{ name: 'X', kcal: -1 }] }),
    ).toThrow();
  });

  describe('parseDietBody (fallback tolerante)', () => {
    it('body {} (template antigo) → { meals: [] }', () => {
      expect(parseDietBody({})).toEqual({ meals: [] });
    });

    it('body inválido → { meals: [] }', () => {
      expect(parseDietBody({ meals: 'nope' })).toEqual({ meals: [] });
      expect(parseDietBody(null)).toEqual({ meals: [] });
      expect(parseDietBody(undefined)).toEqual({ meals: [] });
    });

    it('body válido é preservado', () => {
      const body = { meals: [{ name: 'Jantar', foods: 'Peixe' }], notes: 'ok' };
      expect(parseDietBody(body)).toEqual(body);
    });
  });

  it('CreateDietBodySchema valida name + body estruturado', () => {
    const v = CreateDietBodySchema.parse({
      name: 'Bulking 3000kcal',
      body: { meals: [{ name: 'Ceia', foods: 'Caseína' }] },
    });
    expect(v.name).toBe('Bulking 3000kcal');
    expect(v.body.meals).toHaveLength(1);
  });

  it('CreateDietBodySchema rejeita name vazio', () => {
    expect(() =>
      CreateDietBodySchema.parse({ name: '', body: { meals: [] } }),
    ).toThrow();
  });

  it('AssignDietBodySchema valida atribuição com data opcional', () => {
    const full = AssignDietBodySchema.parse({
      diet_template_id: UUID,
      start_date: '2026-06-05',
      is_active: true,
    });
    expect(full.start_date).toBe('2026-06-05');

    const minimal = AssignDietBodySchema.parse({ diet_template_id: UUID });
    expect(minimal.start_date).toBeUndefined();
  });

  it('AssignDietBodySchema rejeita start_date fora de YYYY-MM-DD', () => {
    expect(() =>
      AssignDietBodySchema.parse({
        diet_template_id: UUID,
        start_date: '05/06/2026',
      }),
    ).toThrow();
  });
});
