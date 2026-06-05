import { z } from 'zod';

// TODO Bloco 9: schemas completos do lado profissional (convites, gestão).

const dateOnly = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);

// Papel do profissional.
export const ProfessionalRoleSchema = z.enum(['personal', 'nutricionista']);
export type ProfessionalRole = z.infer<typeof ProfessionalRoleSchema>;

// Aluno vinculado — shape REAL de GET /professional/students.
// A lista NÃO traz status/última atividade; só identificação + papel + data de vínculo.
export const StudentSchema = z.object({
  id: z.string().uuid(),
  email: z.string(),
  full_name: z.string().nullable(),
  birth_date: dateOnly.nullable(),
  professional_role: ProfessionalRoleSchema,
  linked_at: z.string(),
});
export type Student = z.infer<typeof StudentSchema>;

// Resposta de GET /professional/students.
export const StudentsResponseSchema = z.object({
  students: z.array(StudentSchema),
});
export type StudentsResponse = z.infer<typeof StudentsResponseSchema>;

// Check-in de um aluno — shape REAL de GET /professional/students/:id/check-ins.
// .passthrough() tolera campos extras do item além de check_in_date.
export const CheckInSchema = z
  .object({
    check_in_date: dateOnly,
  })
  .passthrough();
export type CheckIn = z.infer<typeof CheckInSchema>;

// Resposta de GET /professional/students/:id/check-ins.
export const CheckInsResponseSchema = z.object({
  student_id: z.string().uuid(),
  check_ins: z.array(CheckInSchema),
});
export type CheckInsResponse = z.infer<typeof CheckInsResponseSchema>;
