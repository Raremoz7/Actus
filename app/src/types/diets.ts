import { z } from 'zod';

// TODO Bloco 8: schemas completos de dietas (templates, refeições, macros, atribuição ao aluno).

// Identidade mínima de uma dieta atribuída ao aluno.
export const StudentDietSchema = z.object({
  id: z.string().uuid(),
  title: z.string(),
});
export type StudentDiet = z.infer<typeof StudentDietSchema>;

// [Bloco 2] Resumo da dieta para o card do HOJE. Detalhe = Bloco 8.
export const StudentDietSummarySchema = StudentDietSchema;
export type StudentDietSummary = z.infer<typeof StudentDietSummarySchema>;
