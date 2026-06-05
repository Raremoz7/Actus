import { z } from 'zod';

// Data no formato YYYY-MM-DD (string + regex, nunca z.date()).
const dateOnly = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);

// ── Visão do ALUNO (resumo da dieta atribuída) ──────────────────────────────

// Identidade mínima de uma dieta atribuída ao aluno.
export const StudentDietSchema = z.object({
  id: z.string().uuid(),
  title: z.string(),
});
export type StudentDiet = z.infer<typeof StudentDietSchema>;

// [Bloco 2] Resumo da dieta para o card do HOJE. Detalhe = builder do profissional.
export const StudentDietSummarySchema = StudentDietSchema;
export type StudentDietSummary = z.infer<typeof StudentDietSummarySchema>;

// ── Estrutura do BODY da dieta (jsonb LIVRE definido PELO APP) ──────────────
// O backend aceita `body` como jsonb arbitrário (api/src/routes/dietTemplates.ts
// usa z.unknown()). A forma é definida e validada aqui, no app.

// Uma refeição: nome obrigatório + alimentos em texto livre multi-linha.
// Macros são OPCIONAIS (não inventar dados; >= 0 quando presentes).
export const MealSchema = z.object({
  name: z.string().min(1),
  foods: z.string().optional(),
  kcal: z.number().nonnegative().optional(),
  protein: z.number().nonnegative().optional(),
  carbs: z.number().nonnegative().optional(),
  fat: z.number().nonnegative().optional(),
});
export type Meal = z.infer<typeof MealSchema>;

// Corpo completo da dieta: refeições + observações livres.
export const DietBodySchema = z.object({
  meals: z.array(MealSchema),
  notes: z.string().optional(),
});
export type DietBody = z.infer<typeof DietBodySchema>;

// Lê um body de origem desconhecida (jsonb livre, pode vir {} em templates
// antigos) e devolve sempre um DietBody válido. Fallback tolerante: { meals: [] }.
export function parseDietBody(body: unknown): DietBody {
  const parsed = DietBodySchema.safeParse(body);
  return parsed.success ? parsed.data : { meals: [] };
}

// ── Visão do PROFISSIONAL (templates de dieta) ──────────────────────────────
// Shapes REAIS verificados no backend: api/src/routes/dietTemplates.ts
// (requireAuth + dono nutricionista) e api/src/routes/studentDiets.ts.

// [Pro] Item da lista — GET /diet-templates → { diet_templates: [...] }.
// A lista traz apenas id/name/created_at (sem body). `created_at` é ISO string.
export const DietTemplateListItemSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  created_at: z.string(),
});
export type DietTemplateListItem = z.infer<typeof DietTemplateListItemSchema>;

export const DietTemplatesResponseSchema = z.object({
  diet_templates: z.array(DietTemplateListItemSchema),
});
export type DietTemplatesResponse = z.infer<typeof DietTemplatesResponseSchema>;

// [Pro] Detalhe do template — GET /diet-templates/:id retorna FLAT:
// { id, name, body, created_at }. `body` é jsonb LIVRE — valida-se tolerante
// (z.unknown()); use parseDietBody() para obter a forma estruturada.
export const DietTemplateDetailSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  body: z.unknown(),
  created_at: z.string(),
});
export type DietTemplateDetail = z.infer<typeof DietTemplateDetailSchema>;

// [Pro] Corpo de criação/edição — POST /diet-templates / PATCH /diet-templates/:id.
// Verificado em api/src/routes/dietTemplates.ts (createDietSchema): name 1..200.
// O app envia `body` já no formato DietBodySchema.
export const CreateDietBodySchema = z.object({
  name: z.string().min(1),
  body: DietBodySchema,
});
export type CreateDietBody = z.infer<typeof CreateDietBodySchema>;

// [Pro] Corpo de atribuição — POST /students/:student_id/diets.
// Verificado em api/src/routes/studentDiets.ts (assignDietSchema).
export const AssignDietBodySchema = z.object({
  diet_template_id: z.string().uuid(),
  start_date: dateOnly.optional(),
  is_active: z.boolean().optional(),
});
export type AssignDietBody = z.infer<typeof AssignDietBodySchema>;

// [Pro] Corpo de edição — PATCH /diet-templates/:id (patch parcial).
// Verificado em api/src/routes/dietTemplates.ts (patchDietSchema): ao menos um campo.
export const PatchDietBodySchema = z
  .object({
    name: z.string().min(1).max(200).optional(),
    body: DietBodySchema.optional(),
  })
  .refine((o) => o.name !== undefined || o.body !== undefined, {
    message: 'empty_patch',
  });
export type PatchDietBody = z.infer<typeof PatchDietBodySchema>;

// [Pro] Resposta de POST /diet-templates → 201 { ok: true, diet_template_id }.
// Verificado em api/src/routes/dietTemplates.ts (res.status(201).json(out)).
export const CreateDietResponseSchema = z.object({
  ok: z.literal(true),
  diet_template_id: z.string().uuid(),
});
export type CreateDietResponse = z.infer<typeof CreateDietResponseSchema>;

// [Pro] Resposta de POST /students/:id/diets → 201 { ok: true, student_diet_id }.
// Verificado em api/src/routes/studentDiets.ts (res.status(201).json(out)).
export const AssignDietResponseSchema = z.object({
  ok: z.literal(true),
  student_diet_id: z.string().uuid(),
});
export type AssignDietResponse = z.infer<typeof AssignDietResponseSchema>;
