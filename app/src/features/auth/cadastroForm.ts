import { z } from 'zod';

import { GenderSchema, type Gender, type RegisterBody } from '@/types/auth';
import { onlyDigits } from '@/lib/format';

// ─── Schema do formulário do wizard ───
// Diferente do RegisterBodySchema (o contrato de rede): aqui os campos guardam o
// estado EDITÁVEL dos 3 passos. Opcionais ficam como string vazia enquanto não
// preenchidos; a normalização para RegisterBody (digits-only, undefined, etc.)
// acontece só no submit via buildRegisterBody.
//
// Validações por passo são acionadas com trigger([...campos do passo]) antes de
// avançar — por isso cada campo carrega sua própria regra aqui.

const base64UrlCode = /^[A-Za-z0-9_-]{3,200}$/;

export const CadastroFormSchema = z.object({
  // Passo 1
  invite_code: z
    .string()
    .min(1, 'Informe o código do convite.')
    .regex(base64UrlCode, 'Código de convite inválido.'),

  // Passo 2
  full_name: z
    .string()
    .trim()
    .min(3, 'Informe seu nome completo.')
    .max(200, 'Nome muito longo.'),
  birth_date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Informe sua data de nascimento.'),
  gender: z.union([GenderSchema, z.literal('')]).optional(),
  // CPF opcional: vazio passa; preenchido precisa ter 11 dígitos.
  cpf: z
    .string()
    .refine((v) => v === '' || onlyDigits(v).length === 11, 'CPF inválido.'),

  // Passo 3
  email: z
    .string()
    .trim()
    .min(1, 'Informe seu e-mail.')
    .email('E-mail inválido.')
    .max(320, 'E-mail muito longo.'),
  // Telefone opcional: vazio passa; preenchido precisa ter ao menos 10 dígitos.
  phone: z
    .string()
    .refine((v) => v === '' || onlyDigits(v).length >= 10, 'Telefone inválido.'),
  password: z
    .string()
    .min(8, 'A senha precisa de ao menos 8 caracteres.')
    .max(200, 'Senha muito longa.'),
  // Confirmação de senha: a igualdade com `password` é checada no submit do
  // passo 3 (handleCreate) — este passo não roda o zod antes de enviar.
  confirm_password: z.string().min(1, 'Confirme sua senha.'),
});

export type CadastroForm = z.infer<typeof CadastroFormSchema>;

// Valores iniciais do formulário (todos string vazia; invite_code é injetado pelo layout).
export const cadastroDefaultValues: CadastroForm = {
  invite_code: '',
  full_name: '',
  birth_date: '',
  gender: '',
  cpf: '',
  email: '',
  phone: '',
  password: '',
  confirm_password: '',
};

// Campos validados em cada passo, usados em trigger() antes de avançar.
export const PASSO_1_FIELDS = ['invite_code'] as const;
export const PASSO_2_FIELDS = ['full_name', 'birth_date', 'gender', 'cpf'] as const;
export const PASSO_3_FIELDS = ['email', 'phone', 'password', 'confirm_password'] as const;

// Monta o RegisterBody final a partir do form: normaliza opcionais (digits-only,
// undefined quando vazio) e injeta os campos de consentimento da v1.
export function buildRegisterBody(form: CadastroForm): RegisterBody {
  const cpfDigits = onlyDigits(form.cpf);
  const phoneDigits = onlyDigits(form.phone);
  const gender: Gender | undefined =
    form.gender === '' || form.gender === undefined ? undefined : form.gender;

  return {
    invite_code: form.invite_code.trim(),
    email: form.email.trim(),
    password: form.password,
    full_name: form.full_name.trim(),
    birth_date: form.birth_date,
    cpf: cpfDigits || undefined,
    phone: phoneDigits || undefined,
    gender,
    lgpd_consent: true,
    policy_version: 'v1',
  };
}

// ─── Roteamento de erros do register ───
// O register dispara no passo 3, mas o erro pode pertencer a outro passo.
// routeRegisterError mapeia o código (e os detalhes de invalid_body) para o passo
// e, quando aplicável, o campo do form a marcar com setError.

export type CadastroFieldName = keyof CadastroForm;

export type RegisterErrorRoute = {
  // Passo de destino (1 = convite, 2 = você, 3 = acesso).
  passo: 1 | 2 | 3;
  // Campo do form a marcar com setError (quando o erro é de campo).
  campo?: CadastroFieldName;
  // Mensagem específica do campo (quando o backend detalha invalid_body).
  fieldMessage?: string;
  // Quando true, o passo 3 mostra o banner form-level (erro genérico/rede).
  formLevel?: boolean;
};

// Mapeia o nome de campo do backend (snake_case do RegisterBody) para o passo + campo do form.
const FIELD_TO_ROUTE: Record<string, { passo: 1 | 2 | 3; campo: CadastroFieldName }> = {
  invite_code: { passo: 1, campo: 'invite_code' },
  full_name: { passo: 2, campo: 'full_name' },
  birth_date: { passo: 2, campo: 'birth_date' },
  cpf: { passo: 2, campo: 'cpf' },
  gender: { passo: 2, campo: 'gender' },
  email: { passo: 3, campo: 'email' },
  password: { passo: 3, campo: 'password' },
  phone: { passo: 3, campo: 'phone' },
};

// Extrai com segurança o primeiro par (campo, mensagem) de extras.details.fieldErrors.
// Shape esperado (defensivo): { details: { fieldErrors: { campo: string[] } } }.
function firstFieldError(
  extras: Record<string, unknown> | undefined,
): { field: string; message?: string } | null {
  if (!extras) return null;
  const details = extras['details'];
  if (details === null || typeof details !== 'object') return null;
  const fieldErrors = (details as Record<string, unknown>)['fieldErrors'];
  if (fieldErrors === null || typeof fieldErrors !== 'object') return null;

  for (const [field, value] of Object.entries(fieldErrors as Record<string, unknown>)) {
    if (field in FIELD_TO_ROUTE) {
      const message = Array.isArray(value) && typeof value[0] === 'string' ? value[0] : undefined;
      return { field, message };
    }
  }
  return null;
}

// Decide o destino do erro pelo CÓDIGO (campo "error" do backend), nunca pelo HTTP status.
export function routeRegisterError(
  code: string,
  extras?: Record<string, unknown>,
): RegisterErrorRoute {
  switch (code) {
    // Convite inválido → volta ao passo 1 (banner via cadastroDraftStore).
    case 'invalid_invite':
    case 'invite_expired':
    case 'invite_exhausted':
    case 'invalid_invite_professional':
      return { passo: 1, campo: 'invite_code' };

    // E-mail já em uso → fica no passo 3 marcando o campo email.
    case 'email_already_in_use':
      return { passo: 3, campo: 'email' };

    // CPF já em uso → volta ao passo 2 marcando o campo cpf.
    case 'cpf_already_in_use':
      return { passo: 2, campo: 'cpf' };

    // Validação de corpo → roteia pelo primeiro campo conhecido em details.fieldErrors.
    case 'invalid_body': {
      const hit = firstFieldError(extras);
      if (hit) {
        const route = FIELD_TO_ROUTE[hit.field];
        if (route) {
          return { passo: route.passo, campo: route.campo, fieldMessage: hit.message };
        }
      }
      // Sem detalhe utilizável: banner form-level no passo 3.
      return { passo: 3, formLevel: true };
    }

    // Erro interno / rede → banner form-level no passo 3, dados preservados.
    default:
      return { passo: 3, formLevel: true };
  }
}
