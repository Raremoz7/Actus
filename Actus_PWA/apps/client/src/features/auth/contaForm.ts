import { z } from 'zod';

import type { RegisterBody, RegisterProfessionalBody } from '@/types/auth';
import { onlyDigits } from '@/lib/format';

// ─── Conta única (substitui o wizard de 3 passos) ───
// História de onboarding: conta enxuta — nome, TELEFONE (agora obrigatório), e-mail,
// senha. Aluno mantém nascimento (o register real exige; back sinalizado p/ tornar
// opcional) e carrega o invite_code do deep link (oculto; vazio = sem vínculo).
// CPF e gênero saíram do cadastro (coletáveis depois via PATCH /me).

const base64UrlCode = /^[A-Za-z0-9_-]{3,200}$/;

const contaBase = z.object({
  full_name: z
    .string()
    .trim()
    .min(3, 'Informe seu nome completo.')
    .max(200, 'Nome muito longo.'),
  phone: z
    .string()
    .refine((v) => onlyDigits(v).length >= 10, 'Informe um telefone válido.'),
  email: z
    .string()
    .trim()
    .min(1, 'Informe seu e-mail.')
    .email('E-mail inválido.')
    .max(320, 'E-mail muito longo.'),
  password: z
    .string()
    .min(8, 'A senha precisa de ao menos 8 caracteres.')
    .max(200, 'Senha muito longa.'),
  confirm_password: z.string().min(1, 'Confirme sua senha.'),
});

export const ContaAlunoFormSchema = contaBase.extend({
  birth_date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Informe sua data de nascimento.'),
  // Vem do deep link; vazio = cadastro sem vínculo (vínculo opcional no onboarding).
  invite_code: z
    .string()
    .refine((v) => v === '' || base64UrlCode.test(v), 'Código de convite inválido.'),
});
export type ContaAlunoForm = z.infer<typeof ContaAlunoFormSchema>;

export const ContaProfessorFormSchema = contaBase;
export type ContaProfessorForm = z.infer<typeof ContaProfessorFormSchema>;

export const contaAlunoDefaults: ContaAlunoForm = {
  full_name: '',
  phone: '',
  email: '',
  password: '',
  confirm_password: '',
  birth_date: '',
  invite_code: '',
};

export const contaProfessorDefaults: ContaProfessorForm = {
  full_name: '',
  phone: '',
  email: '',
  password: '',
  confirm_password: '',
};

export function buildAlunoRegisterBody(form: ContaAlunoForm): RegisterBody {
  const code = form.invite_code.trim();
  return {
    invite_code: code === '' ? undefined : code,
    email: form.email.trim(),
    password: form.password,
    full_name: form.full_name.trim(),
    birth_date: form.birth_date,
    phone: onlyDigits(form.phone),
    lgpd_consent: true,
    policy_version: 'v1',
  };
}

export function buildProfessorRegisterBody(
  form: ContaProfessorForm,
): RegisterProfessionalBody {
  return {
    email: form.email.trim(),
    password: form.password,
    full_name: form.full_name.trim(),
    phone: onlyDigits(form.phone),
    lgpd_consent: true,
    policy_version: 'v1',
  };
}

// ─── Erros do register na tela única ───
// Sem passos: o código vira campo da própria tela ou banner form-level.

export type ContaFieldName = keyof ContaAlunoForm;

export type RegisterErrorTarget = {
  campo?: ContaFieldName;
  fieldMessage?: string;
  formLevel?: boolean;
};

const FIELD_MAP: Record<string, ContaFieldName> = {
  full_name: 'full_name',
  phone: 'phone',
  email: 'email',
  password: 'password',
  birth_date: 'birth_date',
  invite_code: 'invite_code',
};

function firstFieldError(
  extras: Record<string, unknown> | undefined,
): { field: string; message?: string } | null {
  if (!extras) return null;
  const details = extras['details'];
  if (details === null || typeof details !== 'object') return null;
  const fieldErrors = (details as Record<string, unknown>)['fieldErrors'];
  if (fieldErrors === null || typeof fieldErrors !== 'object') return null;
  for (const [field, value] of Object.entries(fieldErrors as Record<string, unknown>)) {
    if (field in FIELD_MAP) {
      const message =
        Array.isArray(value) && typeof value[0] === 'string' ? value[0] : undefined;
      return { field, message };
    }
  }
  return null;
}

export function registerErrorField(
  code: string,
  extras?: Record<string, unknown>,
): RegisterErrorTarget {
  switch (code) {
    case 'email_already_in_use':
      return { campo: 'email' };
    case 'cpf_already_in_use':
      // CPF não é coletado na conta — se o back devolver, vira banner.
      return { formLevel: true };
    case 'invalid_invite':
    case 'invite_expired':
    case 'invite_exhausted':
    case 'invalid_invite_professional':
      // Convite veio do deep link (campo oculto) → banner com a copy do código.
      return { formLevel: true };
    case 'invalid_body': {
      const hit = firstFieldError(extras);
      if (hit) {
        const campo = FIELD_MAP[hit.field];
        if (campo) return { campo, fieldMessage: hit.message };
      }
      return { formLevel: true };
    }
    default:
      return { formLevel: true };
  }
}
