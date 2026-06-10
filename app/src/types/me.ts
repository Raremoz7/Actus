import { z } from 'zod';
import { GenderSchema } from './auth';

// Tipos de usuário. staff (actus_admin/actus_suporte) existe no schema mas NUNCA aparece em /me.
export const UserTipoSchema = z.enum([
  'aluno',
  'personal',
  'nutricionista',
  'actus_admin',
  'actus_suporte',
]);

export type UserTipo = z.infer<typeof UserTipoSchema>;

// GET /me → identidade mínima do usuário autenticado.
export const MeSchema = z.object({
  id: z.string().uuid(),
  tipo: UserTipoSchema,
  display_name: z.string().nullable(),
});

export type Me = z.infer<typeof MeSchema>;

// PATCH /me → pelo menos 1 campo deve ser enviado.
export const PatchMeBodySchema = z
  .object({
    display_name: z.string(),
    avatar_url: z.union([z.string().url(), z.literal('')]),
    timezone: z.string(),
    full_name: z.string(),
    phone: z.string().nullable(),
    gender: GenderSchema,
    body_weight_kg: z.number().min(20).max(400).nullable(),
  })
  .partial()
  .refine((body) => Object.keys(body).length > 0, {
    message: 'Envie pelo menos um campo para atualizar',
  });

export type PatchMeBody = z.infer<typeof PatchMeBodySchema>;
