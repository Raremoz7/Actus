import { z } from 'zod';

// Resposta padrão de tokens (register, login, refresh).
// O refresh ROTACIONA o refresh_token — o novo valor sempre vem aqui e deve ser persistido.
export const TokensResponseSchema = z.object({
  access_token: z.string().min(1),
  access_token_expires_in: z.number().int().positive(), // segundos
  refresh_token: z.string().min(1),
});

export type TokensResponse = z.infer<typeof TokensResponseSchema>;

// change-password NÃO retorna refresh novo — só rotaciona o access.
export const ChangePasswordResponseSchema = z.object({
  access_token: z.string().min(1),
  access_token_expires_in: z.number().int().positive(),
  must_change_password: z.boolean(),
});

export type ChangePasswordResponse = z.infer<typeof ChangePasswordResponseSchema>;

export const GenderSchema = z.enum(['masculino', 'feminino', 'nao_informar', 'outro']);
export type Gender = z.infer<typeof GenderSchema>;

// Data no formato YYYY-MM-DD (string + regex, nunca z.date()).
const dateOnly = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Data deve estar no formato YYYY-MM-DD');

export const RegisterBodySchema = z.object({
  invite_code: z.string().min(3).max(200),
  email: z.string().email().max(320),
  password: z.string().min(8).max(200),
  full_name: z.string().min(3).max(200),
  birth_date: dateOnly,
  cpf: z.string().min(11).max(32).optional(),
  phone: z.string().min(6).max(40).optional(),
  gender: GenderSchema.optional(),
  lgpd_consent: z.literal(true).optional(),
  policy_version: z.string().optional(),
});

export type RegisterBody = z.infer<typeof RegisterBodySchema>;

export const LoginBodySchema = z.object({
  email: z.string().email().max(320),
  password: z.string().min(1).max(200),
});

export type LoginBody = z.infer<typeof LoginBodySchema>;

export const ChangePasswordBodySchema = z.object({
  current_password: z.string().min(1).max(200),
  new_password: z.string().min(8).max(200),
});

export type ChangePasswordBody = z.infer<typeof ChangePasswordBodySchema>;
