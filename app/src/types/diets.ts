import { z } from 'zod';

// TODO Bloco 8: schemas completos de dietas (templates, refeições, macros, atribuição ao aluno).

// Identidade mínima de uma dieta atribuída ao aluno.
export const StudentDietSchema = z.object({
  id: z.string().uuid(),
  title: z.string(),
});
export type StudentDiet = z.infer<typeof StudentDietSchema>;
