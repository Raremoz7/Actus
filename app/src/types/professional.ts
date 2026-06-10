import { z } from 'zod';

// TODO Bloco 9: schemas completos do lado profissional (alunos vinculados, convites, gestão).

// Papel do profissional.
export const ProfessionalRoleSchema = z.enum(['personal', 'nutricionista']);
export type ProfessionalRole = z.infer<typeof ProfessionalRoleSchema>;
