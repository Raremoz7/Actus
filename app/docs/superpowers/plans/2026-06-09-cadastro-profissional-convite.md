# Cadastro Profissional + Convite do Aluno Logado — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Auto-cadastro de profissional (personal + nutricionista, wizard 3 passos contra endpoint sinalizado) e fluxo de convite para aluno já logado (`POST /invites/consume`, endpoint real), com correções de copy.

**Architecture:** Espelha 1:1 a arquitetura do cadastro do aluno: schema de form em `src/features/auth/` + draft store Zustand + FormProvider único no `_layout` do grupo + passos como rotas Stack + roteamento de erros por código. O submit do pro vai a `POST /auth/register-professional` (pendente no back → mock no devMocks). O consume usa endpoint real. Tela `usar-convite` vive na **raiz** do router (fora dos grupos) com guard interno por tipo.

**Tech Stack:** Expo SDK 55 · Expo Router · TS estrito · Zod · react-hook-form + zodResolver · Zustand · TanStack Query · Unistyles 3 · jest-expo + @testing-library/react-native.

**Worktree:** `/mnt/h/actus_app/.claude/worktrees/cadastro` (branch `feat/cadastro`). Outros chats trabalham em paralelo em outros worktrees — **NUNCA** tocar arquivos fora deste worktree.

**Higiene de git (obrigatória):** stage SEMPRE por caminho exato (`git add <arquivo> <arquivo>`), nunca por diretório/`-A`/`.`. Edições em arquivos existentes: mínimas, sem reformatar, preservando EOL.

**Gate de mockups:** antes de iniciar a Task 3 (primeira tela), o controlador apresenta mockups de alta fidelidade ao designer (visual companion) das telas passo-1-papel e usar-convite. Tasks 1–2 (lógica) não dependem disso.

---

## Estrutura de arquivos

**Criar:**
- `src/features/auth/cadastroProForm.ts` + `.test.ts` — schema do wizard pro, campos por passo, build do body, roteamento de erros.
- `src/store/cadastroProDraftStore.ts` — erros retroativos entre passos (registro/CPF).
- `src/hooks/useConsumeInvite.ts` — mutation do consume.
- `app/(auth)/cadastro-pro/_layout.tsx`, `index.tsx`, `passo-1-papel.tsx`, `passo-2-voce.tsx`, `passo-3-acesso.tsx` (+ `passo-1-papel.test.tsx`).
- `app/usar-convite.tsx` + `.test.tsx` — tela raiz do consume.
- `app/register.test.tsx` — testes do roteamento do deep link.

**Modificar:**
- `src/types/auth.ts` — `RegisterProfessionalBodySchema`.
- `src/api/endpoints.ts` — `auth.registerProfessional` + `invitesConsume`.
- `src/store/authStore.ts` — método `registerProfessional`.
- `src/features/auth/hooks.ts` — `useRegisterProfessionalMutation`.
- `src/api/devMocks.ts` — matchers de register-professional e consume.
- `app/register.tsx` — roteamento por status (hydrating/autenticado).
- `app/(auth)/escolha-perfil.tsx` — rota do "Sou professor".
- `app/(auth)/cadastro/passo-1-convite.tsx` — copy neutra.
- `src/components/account/AccountScreen.tsx` — ActionRow "Usar convite" (aluno).
- `AGENTS.md` — sinal pro back.

**Remover:**
- `app/(auth)/professor-info.tsx` (nenhum teste o referencia — verificado).

---

### Task 1: Contrato de dados (types + endpoints + cadastroProForm)

**Files:**
- Modify: `src/types/auth.ts` (append ao final)
- Modify: `src/api/endpoints.ts`
- Create: `src/features/auth/cadastroProForm.ts`
- Test: `src/features/auth/cadastroProForm.test.ts`

- [ ] **Step 1: Escrever o teste falho**

```ts
// src/features/auth/cadastroProForm.test.ts
import {
  CadastroProFormSchema,
  cadastroProDefaultValues,
  buildRegisterProfessionalBody,
  routeRegisterProError,
  PASSO_PRO_1_FIELDS,
} from './cadastroProForm';

// Form válido de personal — base dos testes.
const validPersonal = {
  professional_role: 'personal' as const,
  registry_number: '012345-G/SP',
  registry_expires_at: '',
  full_name: 'Ana Souza',
  birth_date: '1990-05-10',
  gender: '' as const,
  cpf: '',
  email: 'ana@exemplo.com',
  phone: '',
  password: 'senha-forte',
  confirm_password: 'senha-forte',
};

describe('CadastroProFormSchema', () => {
  it('aceita um form válido de personal', () => {
    expect(CadastroProFormSchema.safeParse(validPersonal).success).toBe(true);
  });

  it('rejeita papel vazio', () => {
    const r = CadastroProFormSchema.safeParse({ ...validPersonal, professional_role: '' });
    expect(r.success).toBe(false);
  });

  it('rejeita registro com menos de 3 caracteres', () => {
    const r = CadastroProFormSchema.safeParse({ ...validPersonal, registry_number: 'ab' });
    expect(r.success).toBe(false);
  });

  it('CPF vazio passa; preenchido exige 11 dígitos', () => {
    expect(CadastroProFormSchema.safeParse({ ...validPersonal, cpf: '' }).success).toBe(true);
    expect(CadastroProFormSchema.safeParse({ ...validPersonal, cpf: '123' }).success).toBe(false);
    expect(
      CadastroProFormSchema.safeParse({ ...validPersonal, cpf: '529.982.247-25' }).success,
    ).toBe(true);
  });
});

describe('buildRegisterProfessionalBody', () => {
  it('personal → cref_number; validade vazia vira undefined', () => {
    const body = buildRegisterProfessionalBody(validPersonal);
    expect(body.professional_role).toBe('personal');
    if (body.professional_role === 'personal') {
      expect(body.cref_number).toBe('012345-G/SP');
      expect(body.cref_expires_at).toBeUndefined();
    }
    expect(body.lgpd_consent).toBe(true);
    expect(body.policy_version).toBe('v1');
  });

  it('nutricionista → crn_number + validade quando preenchida', () => {
    const body = buildRegisterProfessionalBody({
      ...validPersonal,
      professional_role: 'nutricionista',
      registry_number: 'CRN-3 12345',
      registry_expires_at: '2027-01-01',
    });
    expect(body.professional_role).toBe('nutricionista');
    if (body.professional_role === 'nutricionista') {
      expect(body.crn_number).toBe('CRN-3 12345');
      expect(body.crn_expires_at).toBe('2027-01-01');
    }
  });

  it('normaliza cpf/phone para dígitos e vazio para undefined', () => {
    const body = buildRegisterProfessionalBody({
      ...validPersonal,
      cpf: '529.982.247-25',
      phone: '(11) 98888-7777',
    });
    expect(body.cpf).toBe('52998224725');
    expect(body.phone).toBe('11988887777');
  });
});

describe('routeRegisterProError', () => {
  it('email_already_in_use → passo 3 campo email', () => {
    expect(routeRegisterProError('email_already_in_use')).toEqual({ passo: 3, campo: 'email' });
  });

  it('cpf_already_in_use → passo 2 campo cpf', () => {
    expect(routeRegisterProError('cpf_already_in_use')).toEqual({ passo: 2, campo: 'cpf' });
  });

  it('invalid_body com fieldError de cref_number → passo 1 campo registry_number', () => {
    const r = routeRegisterProError('invalid_body', {
      details: { fieldErrors: { cref_number: ['CREF inválido'] } },
    });
    expect(r).toEqual({ passo: 1, campo: 'registry_number', fieldMessage: 'CREF inválido' });
  });

  it('desconhecido → passo 3 form-level', () => {
    expect(routeRegisterProError('internal_error')).toEqual({ passo: 3, formLevel: true });
  });
});

describe('constantes', () => {
  it('passo 1 valida papel + registro', () => {
    expect([...PASSO_PRO_1_FIELDS]).toEqual([
      'professional_role',
      'registry_number',
      'registry_expires_at',
    ]);
  });

  it('defaults têm todos os campos vazios', () => {
    expect(cadastroProDefaultValues.professional_role).toBe('');
    expect(cadastroProDefaultValues.registry_number).toBe('');
  });
});
```

- [ ] **Step 2: Rodar e ver falhar**

Run: `cd /mnt/h/actus_app/.claude/worktrees/cadastro && npx jest src/features/auth/cadastroProForm.test.ts`
Expected: FAIL ("Cannot find module './cadastroProForm'").

- [ ] **Step 3: Adicionar o schema do body em `src/types/auth.ts`** (append ao FINAL do arquivo, sem tocar o existente)

```ts
// ─── Auto-cadastro de profissional ───
// [pendente no backend: POST /auth/register-professional]
// Contrato PROPOSTO (espelha POST /admin/professionals SEM must_change_password —
// a pessoa define a própria senha; conta ativa imediata, validação do registro
// assíncrona pela equipe). União discriminada por professional_role.
const registerProfessionalBase = z.object({
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

export const RegisterProfessionalBodySchema = z.discriminatedUnion('professional_role', [
  registerProfessionalBase.extend({
    professional_role: z.literal('personal'),
    cref_number: z.string().min(3).max(40),
    cref_expires_at: dateOnly.optional(),
  }),
  registerProfessionalBase.extend({
    professional_role: z.literal('nutricionista'),
    crn_number: z.string().min(3).max(40),
    crn_expires_at: dateOnly.optional(),
  }),
]);

export type RegisterProfessionalBody = z.infer<typeof RegisterProfessionalBodySchema>;
```

> `dateOnly` e `GenderSchema` já existem no arquivo (declarados acima do ponto de append).

- [ ] **Step 4: Adicionar endpoints em `src/api/endpoints.ts`** (edições mínimas)

Dentro de `auth: { ... }`, após `changePassword`:
```ts
    // Auto-cadastro de profissional. [pendente no backend]
    registerProfessional: '/auth/register-professional',
```

Após a linha `invitePreview: ...`:
```ts
  // Aluno logado consome convite para vincular novo profissional (endpoint REAL).
  invitesConsume: '/invites/consume',
```

- [ ] **Step 5: Criar `src/features/auth/cadastroProForm.ts`**

```ts
import { z } from 'zod';

import {
  GenderSchema,
  type Gender,
  type RegisterProfessionalBody,
} from '@/types/auth';
import { onlyDigits } from '@/lib/format';

// ─── Schema do formulário do wizard PRO ───
// Espelha cadastroForm.ts (aluno): campos editáveis dos 3 passos; opcionais como
// string vazia; normalização para RegisterProfessionalBody só no submit.
// O registro profissional usa um campo ÚNICO no form (registry_number) — o build
// mapeia para cref_number/crn_number conforme o papel.

const ProfessionalRoleEnum = z.enum(['personal', 'nutricionista']);
export type CadastroProRole = z.infer<typeof ProfessionalRoleEnum>;

const dateOnlyOrEmpty = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'Data inválida.')
  .or(z.literal(''));

export const CadastroProFormSchema = z.object({
  // Passo 1
  professional_role: z
    .union([ProfessionalRoleEnum, z.literal('')])
    .refine((v) => v !== '', 'Escolha como você atende.'),
  registry_number: z
    .string()
    .trim()
    .min(3, 'Informe seu registro profissional.')
    .max(40, 'Registro muito longo.'),
  registry_expires_at: dateOnlyOrEmpty,

  // Passo 2 (espelho do aluno)
  full_name: z
    .string()
    .trim()
    .min(3, 'Informe seu nome completo.')
    .max(200, 'Nome muito longo.'),
  birth_date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Informe sua data de nascimento.'),
  gender: z.union([GenderSchema, z.literal('')]).optional(),
  cpf: z
    .string()
    .refine((v) => v === '' || onlyDigits(v).length === 11, 'CPF inválido.'),

  // Passo 3 (espelho do aluno)
  email: z
    .string()
    .trim()
    .min(1, 'Informe seu e-mail.')
    .email('E-mail inválido.')
    .max(320, 'E-mail muito longo.'),
  phone: z
    .string()
    .refine((v) => v === '' || onlyDigits(v).length >= 10, 'Telefone inválido.'),
  password: z
    .string()
    .min(8, 'A senha precisa de ao menos 8 caracteres.')
    .max(200, 'Senha muito longa.'),
  confirm_password: z.string().min(1, 'Confirme sua senha.'),
});

export type CadastroProForm = z.infer<typeof CadastroProFormSchema>;

export const cadastroProDefaultValues: CadastroProForm = {
  professional_role: '',
  registry_number: '',
  registry_expires_at: '',
  full_name: '',
  birth_date: '',
  gender: '',
  cpf: '',
  email: '',
  phone: '',
  password: '',
  confirm_password: '',
};

export const PASSO_PRO_1_FIELDS = [
  'professional_role',
  'registry_number',
  'registry_expires_at',
] as const;
export const PASSO_PRO_2_FIELDS = ['full_name', 'birth_date', 'gender', 'cpf'] as const;
export const PASSO_PRO_3_FIELDS = ['email', 'phone', 'password', 'confirm_password'] as const;

// Monta o RegisterProfessionalBody: normaliza opcionais e mapeia o registro para
// o campo do papel (CREF/CRN). Pré-condição: form validado (papel escolhido).
export function buildRegisterProfessionalBody(
  form: CadastroProForm,
): RegisterProfessionalBody {
  const cpfDigits = onlyDigits(form.cpf);
  const phoneDigits = onlyDigits(form.phone);
  const gender: Gender | undefined =
    form.gender === '' || form.gender === undefined ? undefined : form.gender;
  const expires =
    form.registry_expires_at === '' ? undefined : form.registry_expires_at;

  const base = {
    email: form.email.trim(),
    password: form.password,
    full_name: form.full_name.trim(),
    birth_date: form.birth_date,
    cpf: cpfDigits || undefined,
    phone: phoneDigits || undefined,
    gender,
    lgpd_consent: true as const,
    policy_version: 'v1',
  };

  if (form.professional_role === 'nutricionista') {
    return {
      ...base,
      professional_role: 'nutricionista',
      crn_number: form.registry_number.trim(),
      crn_expires_at: expires,
    };
  }
  return {
    ...base,
    professional_role: 'personal',
    cref_number: form.registry_number.trim(),
    cref_expires_at: expires,
  };
}

// ─── Roteamento de erros do register-professional ───
// Mesmo padrão do aluno (routeRegisterError): decide pelo CÓDIGO, nunca pelo status.

export type CadastroProFieldName = keyof CadastroProForm;

export type RegisterProErrorRoute = {
  passo: 1 | 2 | 3;
  campo?: CadastroProFieldName;
  fieldMessage?: string;
  formLevel?: boolean;
};

// Campos do backend (snake_case do body) → passo + campo do form.
const FIELD_TO_ROUTE: Record<string, { passo: 1 | 2 | 3; campo: CadastroProFieldName }> = {
  professional_role: { passo: 1, campo: 'professional_role' },
  cref_number: { passo: 1, campo: 'registry_number' },
  crn_number: { passo: 1, campo: 'registry_number' },
  cref_expires_at: { passo: 1, campo: 'registry_expires_at' },
  crn_expires_at: { passo: 1, campo: 'registry_expires_at' },
  full_name: { passo: 2, campo: 'full_name' },
  birth_date: { passo: 2, campo: 'birth_date' },
  cpf: { passo: 2, campo: 'cpf' },
  gender: { passo: 2, campo: 'gender' },
  email: { passo: 3, campo: 'email' },
  password: { passo: 3, campo: 'password' },
  phone: { passo: 3, campo: 'phone' },
};

// Extrai o primeiro par (campo, mensagem) de extras.details.fieldErrors (defensivo).
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
      const message =
        Array.isArray(value) && typeof value[0] === 'string' ? value[0] : undefined;
      return { field, message };
    }
  }
  return null;
}

export function routeRegisterProError(
  code: string,
  extras?: Record<string, unknown>,
): RegisterProErrorRoute {
  switch (code) {
    case 'email_already_in_use':
      return { passo: 3, campo: 'email' };
    case 'cpf_already_in_use':
      return { passo: 2, campo: 'cpf' };
    case 'invalid_body': {
      const hit = firstFieldError(extras);
      if (hit) {
        const route = FIELD_TO_ROUTE[hit.field];
        if (route) {
          return { passo: route.passo, campo: route.campo, fieldMessage: hit.message };
        }
      }
      return { passo: 3, formLevel: true };
    }
    default:
      return { passo: 3, formLevel: true };
  }
}
```

- [ ] **Step 6: Rodar e ver passar + typecheck**

Run: `npx jest src/features/auth/cadastroProForm.test.ts && npm run typecheck`
Expected: PASS em todos os casos; typecheck limpo.

- [ ] **Step 7: Commit (paths exatos)**

```bash
git add src/types/auth.ts src/api/endpoints.ts src/features/auth/cadastroProForm.ts src/features/auth/cadastroProForm.test.ts
git commit -m "feat(cadastro-pro): contrato de dados (body proposto + form schema + roteamento de erros)"
```

---

### Task 2: Infra (draft store + authStore + hook + devMocks)

**Files:**
- Create: `src/store/cadastroProDraftStore.ts`
- Modify: `src/store/authStore.ts`
- Modify: `src/features/auth/hooks.ts`
- Modify: `src/api/devMocks.ts`

> Tarefa mecânica (espelhos diretos de código existente) — verificação por typecheck.
> Leia cada arquivo antes de editar; edições mínimas, sem reformatar.

- [ ] **Step 1: Criar `src/store/cadastroProDraftStore.ts`**

```ts
import { create } from 'zustand';

// Rascunho do cadastro PRO: erros retroativos entre passos (o passo 3 dispara o
// register-professional, mas o erro pode pertencer ao passo 1 — registro — ou 2 — CPF).
// Espelho de cadastroDraftStore (aluno), sem inviteCode (não há convite no fluxo pro).
type CadastroProDraftState = {
  lastRegistryError: string | null;
  lastCpfError: string | null;
  setLastRegistryError: (error: string | null) => void;
  setLastCpfError: (error: string | null) => void;
  clear: () => void;
};

export const useCadastroProDraftStore = create<CadastroProDraftState>((set) => ({
  lastRegistryError: null,
  lastCpfError: null,
  setLastRegistryError: (error) => set({ lastRegistryError: error }),
  setLastCpfError: (error) => set({ lastCpfError: error }),
  clear: () => set({ lastRegistryError: null, lastCpfError: null }),
}));
```

- [ ] **Step 2: Adicionar `registerProfessional` ao authStore**

Em `src/store/authStore.ts`:
1. No import de types: trocar `type RegisterBody` por `type RegisterBody, type RegisterProfessionalBody` (mesma linha de `@/types/auth`).
2. Na interface `AuthState`, logo após `register: ...`:
```ts
  registerProfessional: (body: RegisterProfessionalBody) => Promise<void>;
```
3. No corpo do store, logo após o método `register` (espelho exato):
```ts
  // POST /auth/register-professional → tokens → /me. Mesmo fluxo atômico do register.
  // [pendente no backend] — em dev bypass, o devMocks responde.
  async registerProfessional(body) {
    const { data } = await api.post(endpoints.auth.registerProfessional, body);
    const tokens = parseApi(TokensResponseSchema, data);
    await tokenStorage.setTokens(tokens.access_token, tokens.refresh_token);
    await resolveSessionStatus(set);
  },
```

- [ ] **Step 3: Adicionar mutation em `src/features/auth/hooks.ts`**

1. No import de `@/types/auth`, adicionar `type RegisterProfessionalBody`.
2. Após `useRegisterMutation`:
```ts
export function useRegisterProfessionalMutation(): UseMutationResult<
  void,
  unknown,
  RegisterProfessionalBody
> {
  return useMutation({
    mutationFn: (body: RegisterProfessionalBody): Promise<void> =>
      useAuthStore.getState().registerProfessional(body),
  });
}
```

- [ ] **Step 4: Adicionar matchers ao devMocks**

Em `src/api/devMocks.ts` (leia o arquivo para localizar `MATCHERS` e os helpers `MockHttpError`/`parseBody`/`genUuid`/`devInvites`/`inviteActive`):

1. No array `MATCHERS`, ANTES do matcher de `GET /invites` (ordem: específicos primeiro):
```ts
  // POST /auth/register-professional  [MOCK — sem endpoint na API v1]
  {
    test: (m, u) => (m === 'post' && /\/auth\/register-professional$/.test(u) ? [] : null),
    build: () => mockRegisterProfessional(),
  },
  // POST /invites/consume (endpoint REAL no backend; mock p/ QA no bypass)
  {
    test: (m, u) => (m === 'post' && /\/invites\/consume$/.test(u) ? [] : null),
    build: (_m, config) => mockConsumeInvite(parseBody(config) as { code?: string }),
  },
```

2. Junto aos demais mocks (após o bloco de convites), as factories:
```ts
// [MOCK — sem endpoint na API v1: POST /auth/register-professional]
// Simula o 201 do contrato proposto (tokens). O /me do bypass completa a sessão.
function mockRegisterProfessional() {
  return {
    access_token: 'dev-access-pro',
    access_token_expires_in: 900,
    refresh_token: 'dev-refresh-pro',
  };
}

// Consome um convite do store local: segunda vez no mesmo código → note already_linked.
const consumedCodes = new Set<string>();
function mockConsumeInvite(body: { code?: string }) {
  const code = body.code ?? '';
  const inv = devInvites.find((i) => i.code === code);
  if (!inv) throw new MockHttpError(404, 'invalid_invite');
  if (!inviteActive(inv)) throw new MockHttpError(409, 'invite_expired');
  if (consumedCodes.has(code)) {
    return {
      ok: true,
      professional_id: genUuid(),
      professional_role: 'personal',
      note: 'already_linked',
    };
  }
  consumedCodes.add(code);
  inv.used_count += 1;
  return { ok: true, professional_id: genUuid(), professional_role: 'personal' };
}
```

- [ ] **Step 5: Typecheck + diffs mínimos**

Run: `npm run typecheck && git diff --stat`
Expected: typecheck limpo; authStore/hooks/devMocks com poucas linhas alteradas cada (se um arquivo inteiro aparecer modificado, você reformatou — restaure com `git checkout -- <arquivo>` e refaça com edições exatas).

- [ ] **Step 6: Commit**

```bash
git add src/store/cadastroProDraftStore.ts src/store/authStore.ts src/features/auth/hooks.ts src/api/devMocks.ts
git commit -m "feat(cadastro-pro): infra (draft store, authStore, mutation, devMocks)"
```

---

### Task 3: Wizard PRO — layout + index + passo 1 (Papel)

**Files:**
- Create: `app/(auth)/cadastro-pro/_layout.tsx`
- Create: `app/(auth)/cadastro-pro/index.tsx`
- Create: `app/(auth)/cadastro-pro/passo-1-papel.tsx`
- Test: `app/(auth)/cadastro-pro/passo-1-papel.test.tsx`

- [ ] **Step 1: Escrever o teste falho**

```tsx
// app/(auth)/cadastro-pro/passo-1-papel.test.tsx
import { render, screen, fireEvent } from '@testing-library/react-native';
import { FormProvider, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

import Passo1PapelScreen from './passo-1-papel';
import {
  CadastroProFormSchema,
  cadastroProDefaultValues,
  type CadastroProForm,
} from '@/features/auth/cadastroProForm';

// O passo lê o form via useFormContext — wrapper de teste com o mesmo resolver real.
function Wrapper() {
  const methods = useForm<CadastroProForm>({
    resolver: zodResolver(CadastroProFormSchema),
    defaultValues: cadastroProDefaultValues,
    mode: 'onSubmit',
  });
  return (
    <FormProvider {...methods}>
      <Passo1PapelScreen />
    </FormProvider>
  );
}

describe('Cadastro PRO — Passo 1 (Papel)', () => {
  it('mostra os dois papéis e o campo de registro só após escolher', () => {
    render(<Wrapper />);
    expect(screen.getByText('Personal')).toBeTruthy();
    expect(screen.getByText('Nutricionista')).toBeTruthy();
    expect(screen.queryByLabelText(/CREF|CRN/)).toBeNull();

    fireEvent.press(screen.getByText('Personal'));
    expect(screen.getByLabelText('CREF')).toBeTruthy();

    fireEvent.press(screen.getByText('Nutricionista'));
    expect(screen.getByLabelText('CRN')).toBeTruthy();
  });

  it('mostra a nota de validação assíncrona', () => {
    render(<Wrapper />);
    expect(screen.getByText(/validado pela equipe Actus/i)).toBeTruthy();
  });
});
```

- [ ] **Step 2: Rodar e ver falhar**

Run: `npx jest "app/(auth)/cadastro-pro/passo-1-papel.test.tsx"`
Expected: FAIL (módulo não encontrado).

- [ ] **Step 3: Criar o `_layout.tsx`** (espelho exato do layout do cadastro aluno, sem injeção de invite)

```tsx
import { FormProvider, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Stack } from 'expo-router';
import { StyleSheet } from 'react-native-unistyles';
import { View } from 'react-native';

import {
  CadastroProFormSchema,
  cadastroProDefaultValues,
  type CadastroProForm,
} from '@/features/auth/cadastroProForm';

// Layout do wizard de cadastro PRO — mesma arquitetura do cadastro do aluno:
// FormProvider único; cada passo é uma rota do Stack que lê via useFormContext.
export default function CadastroProLayout() {
  const methods = useForm<CadastroProForm>({
    resolver: zodResolver(CadastroProFormSchema),
    defaultValues: cadastroProDefaultValues,
    mode: 'onSubmit',
  });

  return (
    <FormProvider {...methods}>
      <View style={styles.root}>
        <Stack
          screenOptions={{
            headerShown: false,
            animation: 'slide_from_right',
            animationDuration: 300,
            contentStyle: styles.content,
          }}
        />
      </View>
    </FormProvider>
  );
}

const styles = StyleSheet.create((theme) => ({
  root: { flex: 1, backgroundColor: theme.colors.bgBase },
  content: { backgroundColor: theme.colors.bgBase },
}));
```

- [ ] **Step 4: Criar o `index.tsx`**

```tsx
import { Redirect } from 'expo-router';

export default function CadastroProIndex() {
  return <Redirect href="/(auth)/cadastro-pro/passo-1-papel" />;
}
```

- [ ] **Step 5: Criar `passo-1-papel.tsx`**

```tsx
import { useEffect } from 'react';
import {
  KeyboardAvoidingView,
  Linking,
  Platform,
  Pressable,
  ScrollView,
  View,
} from 'react-native';
import { Controller, useFormContext } from 'react-hook-form';
import { router } from 'expo-router';
import { StyleSheet } from 'react-native-unistyles';

import { AppText, Button, ScreenHero } from '@/components/ui';
import { DateField, FormField, WizardProgress } from '@/components/molecules';
import { useCadastroProDraftStore } from '@/store/cadastroProDraftStore';
import {
  PASSO_PRO_1_FIELDS,
  type CadastroProForm,
  type CadastroProRole,
} from '@/features/auth/cadastroProForm';
import { goBackOr } from '@/lib/nav';

// [ASSET TEMPORÁRIO] placeholder Unsplash até as fotos curadas chegarem.
const PASSO1_PHOTO = {
  uri: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=1080&q=70&auto=format&fit=crop',
};

// [ajuste: definir canal de contato real]
const CONTATO_URL = 'mailto:contato@actus.fit';

// Rótulo do registro por papel (CREF = personal, CRN = nutricionista).
const REGISTRY_LABEL: Record<CadastroProRole, string> = {
  personal: 'CREF',
  nutricionista: 'CRN',
};

const ROLES: ReadonlyArray<{ value: CadastroProRole; label: string }> = [
  { value: 'personal', label: 'Personal' },
  { value: 'nutricionista', label: 'Nutricionista' },
];

export default function Passo1PapelScreen() {
  const {
    control,
    trigger,
    setError,
    watch,
    formState: { errors },
  } = useFormContext<CadastroProForm>();

  const lastRegistryError = useCadastroProDraftStore((s) => s.lastRegistryError);
  const setLastRegistryError = useCadastroProDraftStore((s) => s.setLastRegistryError);

  // Erro de registro vindo do register-professional (passo 3): aplica ao remontar.
  useEffect(() => {
    if (lastRegistryError) {
      setError('registry_number', { message: lastRegistryError });
      setLastRegistryError(null);
    }
  }, [lastRegistryError, setError, setLastRegistryError]);

  const role = watch('professional_role');
  const registryLabel = role === '' ? null : REGISTRY_LABEL[role];

  async function handleContinue() {
    const ok = await trigger([...PASSO_PRO_1_FIELDS]);
    if (ok) {
      router.push('/(auth)/cadastro-pro/passo-2-voce');
    }
  }

  return (
    <View style={styles.root}>
      <ScreenHero
        photo={PASSO1_PHOTO}
        eyebrow="Passo 01 / Papel"
        title="Como você atende"
        titleSize={28}
        compact
        onBack={() => goBackOr('/(auth)/escolha-perfil')}
      />

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          style={styles.flex}
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.progress}>
            <WizardProgress total={3} current={1} />
          </View>

          <View style={styles.form}>
            <Controller
              control={control}
              name="professional_role"
              render={({ field: { onChange, value } }) => (
                <View>
                  <AppText variant="eyebrow" color="tertiary" style={styles.roleLabel}>
                    Seu papel
                  </AppText>
                  <View style={styles.roleRow}>
                    {ROLES.map((r) => {
                      const selected = value === r.value;
                      return (
                        <Pressable
                          key={r.value}
                          accessibilityRole="button"
                          accessibilityState={{ selected }}
                          onPress={() => onChange(r.value)}
                          style={[styles.rolePill, selected && styles.rolePillOn]}
                        >
                          <AppText
                            variant="label"
                            color={selected ? 'inverse' : 'secondary'}
                          >
                            {r.label}
                          </AppText>
                        </Pressable>
                      );
                    })}
                  </View>
                  {errors.professional_role?.message ? (
                    <AppText variant="bodySm" color="error" style={styles.roleError}>
                      {errors.professional_role.message}
                    </AppText>
                  ) : null}
                </View>
              )}
            />

            {registryLabel ? (
              <>
                <FormField
                  control={control}
                  name="registry_number"
                  label={registryLabel}
                  autoCapitalize="characters"
                  returnKeyType="done"
                  error={errors.registry_number?.message}
                />

                <Controller
                  control={control}
                  name="registry_expires_at"
                  render={({ field: { onChange, value } }) => (
                    <DateField
                      label="Validade do registro · opcional"
                      value={value === '' ? null : value}
                      onChange={onChange}
                      // Validade é FUTURA: sem teto (o default do DateField é hoje).
                      maximumDate={null}
                      minimumDate={new Date()}
                      error={errors.registry_expires_at?.message}
                    />
                  )}
                />
              </>
            ) : null}

            <AppText variant="bodySm" color="tertiary">
              Seu registro é validado pela equipe Actus após o cadastro.
            </AppText>
          </View>

          <View style={styles.cta}>
            <Button variant="primary" label="Continuar" onPress={handleContinue} />
            <Button
              variant="ghost"
              label="Falar com a equipe Actus"
              onPress={() => {
                void Linking.openURL(CONTATO_URL);
              }}
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create((theme) => ({
  root: { flex: 1, backgroundColor: theme.colors.bgBase },
  flex: { flex: 1 },
  content: {
    flexGrow: 1,
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.lg,
    paddingBottom: theme.spacing.lg,
  },
  progress: { marginBottom: theme.spacing.xl },
  form: { gap: theme.spacing.lg },
  roleLabel: { marginBottom: theme.spacing.sm },
  roleRow: { flexDirection: 'row', gap: theme.spacing.sm },
  rolePill: {
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.lg,
    borderRadius: theme.radius.pill,
    borderWidth: 1,
    borderColor: theme.colors.surface4,
    backgroundColor: 'transparent',
  },
  rolePillOn: {
    backgroundColor: theme.colors.neon,
    borderColor: theme.colors.neon,
  },
  roleError: { marginTop: theme.spacing.sm },
  cta: { marginTop: theme.spacing.xl, gap: theme.spacing.md },
}));
```

> Se o `Button` não tiver variant `ghost` (leia `src/components/ui/Button.tsx` — `ButtonVariant = 'primary' | 'secondary' | 'ghost'`, existe), mantenha como está. Se `FormField` não repassar `accessibilityLabel` igual ao `label` (repassa — o Input define `accessibilityLabel={label}`), o `getByLabelText('CREF')` funciona.

- [ ] **Step 6: Rodar e ver passar + typecheck**

Run: `npx jest "app/(auth)/cadastro-pro/passo-1-papel.test.tsx" && npm run typecheck`
Expected: PASS; typecheck limpo.

- [ ] **Step 7: Commit**

```bash
git add "app/(auth)/cadastro-pro/_layout.tsx" "app/(auth)/cadastro-pro/index.tsx" "app/(auth)/cadastro-pro/passo-1-papel.tsx" "app/(auth)/cadastro-pro/passo-1-papel.test.tsx"
git commit -m "feat(cadastro-pro): wizard layout + passo 1 (papel e registro)"
```

---

### Task 4: Wizard PRO — passo 2 (Você)

**Files:**
- Create: `app/(auth)/cadastro-pro/passo-2-voce.tsx`

> Espelho quase literal de `app/(auth)/cadastro/passo-2-voce.tsx` (aluno) — sem teste
> dedicado (os passos do wizard do aluno também não têm; a lógica de campos já está
> coberta pelos testes do schema na Task 1). Verificação: typecheck.

- [ ] **Step 1: Criar `passo-2-voce.tsx`**

Copie a estrutura EXATA de `app/(auth)/cadastro/passo-2-voce.tsx` (leia o arquivo) com estas trocas:
1. Imports: `useCadastroProDraftStore` (em vez de `useCadastroDraftStore`); `type CadastroProForm, PASSO_PRO_2_FIELDS` de `@/features/auth/cadastroProForm`.
2. `useFormContext<CadastroProForm>()`.
3. Hero: `eyebrow="Passo 02 / Você"` · `title="Quem atende"` · `onBack={() => goBackOr('/(auth)/cadastro-pro/passo-1-papel')}`.
4. Avanço: `router.push('/(auth)/cadastro-pro/passo-3-acesso')` com `trigger([...PASSO_PRO_2_FIELDS])`.
5. O bloco do CPF usa `lastCpfError`/`setLastCpfError` do `useCadastroProDraftStore` (mesma mecânica).
6. Foto: manter o mesmo placeholder Unsplash do arquivo copiado (`[ASSET TEMPORÁRIO]`).
7. Campos (FormField nome / DateField nascimento / GenderChips / MaskedField CPF): idênticos ao arquivo de origem — JSX igual, sem mudanças.

- [ ] **Step 2: Typecheck**

Run: `npm run typecheck`
Expected: limpo.

- [ ] **Step 3: Commit**

```bash
git add "app/(auth)/cadastro-pro/passo-2-voce.tsx"
git commit -m "feat(cadastro-pro): passo 2 (dados pessoais)"
```

---

### Task 5: Wizard PRO — passo 3 (Acesso) com submit e roteamento de erros

**Files:**
- Create: `app/(auth)/cadastro-pro/passo-3-acesso.tsx`

> Espelho de `app/(auth)/cadastro/passo-3-acesso.tsx` (leia o arquivo INTEIRO antes —
> ele tem o bloco de senha com hint reativo e o checkbox LGPD a reproduzir igual).

- [ ] **Step 1: Criar `passo-3-acesso.tsx`**

Copie a estrutura EXATA do passo 3 do aluno com estas trocas:

1. Imports:
```tsx
import { useRegisterProfessionalMutation } from '@/features/auth/hooks';
import { useCadastroProDraftStore } from '@/store/cadastroProDraftStore';
import {
  buildRegisterProfessionalBody,
  routeRegisterProError,
  type CadastroProForm,
} from '@/features/auth/cadastroProForm';
```
(`authErrorMessage`, `isApiError`, moléculas e UI: iguais ao original.)

2. `useFormContext<CadastroProForm>()`; `const mutation = useRegisterProfessionalMutation();`.

3. Draft store: `const clearDraft = useCadastroProDraftStore((s) => s.clear);` ·
`const setLastRegistryError = useCadastroProDraftStore((s) => s.setLastRegistryError);` ·
`const setLastCpfError = useCadastroProDraftStore((s) => s.setLastCpfError);`.

4. `handleApiError` (substitui o do aluno — passo 1 agora é o registro, não convite):
```tsx
  function handleApiError(err: unknown) {
    if (!isApiError(err)) {
      setFormError(authErrorMessage('unknown'));
      return;
    }

    const route = routeRegisterProError(err.code, err.extras);

    // Passo 1 — registro profissional: grava no draft e volta.
    if (route.passo === 1) {
      setLastRegistryError(route.fieldMessage ?? authErrorMessage(err.code));
      router.dismissTo('/(auth)/cadastro-pro/passo-1-papel');
      return;
    }

    // Passo 2 — CPF já em uso.
    if (route.passo === 2) {
      setLastCpfError(route.fieldMessage ?? authErrorMessage(err.code));
      router.dismissTo('/(auth)/cadastro-pro/passo-2-voce');
      return;
    }

    if (route.formLevel) {
      setFormError(authErrorMessage(err.code));
      return;
    }

    if (route.campo) {
      const message = route.fieldMessage ?? authErrorMessage(err.code);
      setError(route.campo, { message });
    } else {
      setFormError(authErrorMessage(err.code));
    }
  }
```

5. `handleCreate`: igual ao aluno (checa confirmação de senha → consentimento → envia), com:
```tsx
    mutation.mutate(buildRegisterProfessionalBody(values), {
      onSuccess: () => {
        clearDraft();
        router.replace('/');
      },
      onError: handleApiError,
    });
```
> Confira no arquivo original como o `mutation.mutate` do aluno é chamado (callbacks
> inline vs `onSuccess` no hook) e espelhe o formato exato.

6. Hero: `eyebrow="Passo 03 / Acesso"` · `title="Seu acesso"` · `onBack={() => goBackOr('/(auth)/cadastro-pro/passo-2-voce')}` · `WizardProgress total={3} current={3}`.

7. CTA: `label="Criar conta"` com `loading={mutation.isPending}`.

8. Campos (email, phone, password com hint, confirm, consentimento LGPD com TERMS_URL/PRIVACY_URL): JSX idêntico ao original.

- [ ] **Step 2: Typecheck + suíte de auth**

Run: `npm run typecheck && npx jest src/features/auth`
Expected: limpo; testes da Task 1 seguem verdes.

- [ ] **Step 3: Commit**

```bash
git add "app/(auth)/cadastro-pro/passo-3-acesso.tsx"
git commit -m "feat(cadastro-pro): passo 3 (acesso) com submit e roteamento de erros"
```

---

### Task 6: useConsumeInvite + tela usar-convite

**Files:**
- Create: `src/hooks/useConsumeInvite.ts`
- Create: `app/usar-convite.tsx`
- Test: `app/usar-convite.test.tsx`

- [ ] **Step 1: Criar o hook**

```ts
// src/hooks/useConsumeInvite.ts
import {
  useMutation,
  useQueryClient,
  type UseMutationResult,
} from '@tanstack/react-query';
import { api } from '@/api/client';
import { endpoints } from '@/api/endpoints';
import { parseApi } from '@/api/parseApi';
import {
  ConsumeInviteResponseSchema,
  type ConsumeInviteResponse,
} from '@/types/invites';

// POST /invites/consume { code } → vincula o aluno logado a um novo profissional.
// Endpoint REAL (backend já implementa). Sucesso invalida ['me'] por prefixo —
// cobre /me, workouts, diets e weekly-overview do aluno de uma vez.
export function useConsumeInvite(): UseMutationResult<
  ConsumeInviteResponse,
  unknown,
  string
> {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (code: string): Promise<ConsumeInviteResponse> => {
      const { data } = await api.post(endpoints.invitesConsume, { code: code.trim() });
      return parseApi(ConsumeInviteResponseSchema, data);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['me'] });
    },
  });
}
```

- [ ] **Step 2: Escrever o teste falho da tela**

```tsx
// app/usar-convite.test.tsx
import { render, screen, fireEvent } from '@testing-library/react-native';

const mockMutate = jest.fn();
let mockMutationState: { isPending: boolean } = { isPending: false };
jest.mock('@/hooks/useConsumeInvite', () => ({
  useConsumeInvite: () => ({ mutate: mockMutate, ...mockMutationState }),
}));

const mockReplace = jest.fn();
let mockParams: Record<string, string | undefined> = {};
jest.mock('expo-router', () => ({
  router: { replace: (...a: unknown[]) => mockReplace(...a), back: jest.fn(), push: jest.fn(), canGoBack: () => false },
  useLocalSearchParams: () => mockParams,
  Redirect: () => null,
}));

import UsarConviteScreen from './usar-convite';
import { useAuthStore } from '@/store/authStore';

function setUser(tipo: string | null) {
  useAuthStore.setState({
    status: tipo ? 'authenticated' : 'unauthenticated',
    user: tipo ? ({ id: 'u1', tipo } as never) : null,
  });
}

describe('usar-convite', () => {
  beforeEach(() => {
    mockMutate.mockClear();
    mockMutationState = { isPending: false };
    mockParams = {};
  });

  it('aluno com code no param vê o card e confirma o vínculo', () => {
    setUser('aluno');
    mockParams = { code: 'ACTUSDEMO' };
    render(<UsarConviteScreen />);
    expect(screen.getByText('Convite de profissional')).toBeTruthy();
    fireEvent.press(screen.getByText('Confirmar vínculo'));
    expect(mockMutate).toHaveBeenCalledWith('ACTUSDEMO', expect.anything());
  });

  it('aluno sem code vê o input e o CTA desabilitado até digitar', () => {
    setUser('aluno');
    render(<UsarConviteScreen />);
    expect(screen.getByLabelText('Código do convite')).toBeTruthy();
  });

  it('profissional logado vê o aviso e não o formulário', () => {
    setUser('personal');
    render(<UsarConviteScreen />);
    expect(screen.getByText(/Convites são para alunos/i)).toBeTruthy();
    expect(screen.queryByText('Confirmar vínculo')).toBeNull();
  });
});
```

- [ ] **Step 3: Rodar e ver falhar**

Run: `npx jest app/usar-convite.test.tsx`
Expected: FAIL (módulo não encontrado).

- [ ] **Step 4: Criar a tela**

```tsx
// app/usar-convite.tsx
// Aluno logado usa um convite para se vincular a um NOVO profissional
// (POST /invites/consume — endpoint REAL). Rota raiz, FORA dos grupos: o guard de
// (aluno) expulsaria um profissional antes de ver o aviso "Convites são para alunos".
// 1 momento de motion por tela: reveal de entrada.
import { useEffect, useState } from 'react';
import { Pressable, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { Redirect, router, useLocalSearchParams } from 'expo-router';
import { CaretLeft, CheckCircle, UserCircle } from 'phosphor-react-native';
import { StyleSheet } from 'react-native-unistyles';

import { AppText, Button, Input } from '@/components/ui';
import { useAuthStore } from '@/store/authStore';
import { useConsumeInvite } from '@/hooks/useConsumeInvite';
import { useLogoutMutation } from '@/features/auth/hooks';
import { authErrorMessage } from '@/features/auth/errors';
import { isApiError } from '@/api/errors';
import { AUTH_ENTRY, homeForTipo } from '@/lib/authRoutes';
import { goBackOr } from '@/lib/nav';
import type { ConsumeInviteResponse } from '@/types/invites';
import { darkTheme } from '@/theme';

const { colors, motion } = darkTheme;

// Mesma validação local do passo 1 do cadastro.
const CODE_RE = /^[A-Za-z0-9_-]{3,200}$/;

// Mensagens específicas deste fluxo (além das de convite em authErrorMessage).
const CONSUME_MESSAGES: Record<string, string> = {
  already_has_active_professional_for_role:
    'Você já tem um profissional ativo deste tipo. Fale com ele antes de trocar.',
  only_student_can_consume: 'Convites são para alunos.',
};

function consumeErrorMessage(code: string): string {
  return CONSUME_MESSAGES[code] ?? authErrorMessage(code);
}

const ROLE_LABEL: Record<ConsumeInviteResponse['professional_role'], string> = {
  personal: 'personal',
  nutricionista: 'nutricionista',
};

function firstParam(value: string | string[] | undefined): string {
  if (Array.isArray(value)) return value[0] ?? '';
  return value ?? '';
}

export default function UsarConviteScreen() {
  const params = useLocalSearchParams<{ code?: string | string[] }>();
  const status = useAuthStore((s) => s.status);
  const user = useAuthStore((s) => s.user);
  const consume = useConsumeInvite();
  const logout = useLogoutMutation();

  const [code, setCode] = useState(() => firstParam(params.code));
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<ConsumeInviteResponse | null>(null);

  const opacity = useSharedValue(0);
  useEffect(() => {
    opacity.value = withTiming(1, { duration: motion.screenMs });
  }, [opacity]);
  const revealStyle = useAnimatedStyle(() => ({ opacity: opacity.value }));

  // Deslogado não usa convite por aqui — o deep link deslogado vai pro cadastro.
  if (status !== 'authenticated' || !user) {
    return <Redirect href={AUTH_ENTRY} />;
  }

  // Profissional logado: aviso honesto + trocar de conta (defesa dupla do
  // only_student_can_consume do backend).
  if (user.tipo !== 'aluno') {
    return (
      <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
        <View style={styles.centerWrap}>
          <AppText variant="eyebrow" color="neon">
            Convite
          </AppText>
          <AppText variant="h2" style={styles.title}>
            Convites são para alunos
          </AppText>
          <AppText variant="bodyMd" color="secondary" style={styles.note}>
            Este link vincula um aluno a um profissional. Para usá-lo, entre com uma
            conta de aluno.
          </AppText>
          <Button
            variant="secondary"
            label="Trocar de conta"
            disabled={logout.isPending}
            onPress={() => logout.mutate()}
          />
          <Button
            variant="ghost"
            label="Voltar"
            onPress={() => goBackOr(homeForTipo(user.tipo) as string)}
          />
        </View>
      </SafeAreaView>
    );
  }

  function handleConfirm() {
    setError(null);
    const trimmed = code.trim();
    if (!CODE_RE.test(trimmed)) {
      setError('Código de convite inválido.');
      return;
    }
    consume.mutate(trimmed, {
      onSuccess: (res) => setDone(res),
      onError: (err) => {
        setError(isApiError(err) ? consumeErrorMessage(err.code) : consumeErrorMessage('unknown'));
      },
    });
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <View style={styles.topbar}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Voltar"
          onPress={() => goBackOr(homeForTipo('aluno') as string)}
          hitSlop={12}
        >
          <CaretLeft size={24} weight="bold" color={colors.textPrimary} />
        </Pressable>
      </View>

      <Animated.View style={[styles.flex, revealStyle]}>
        {done ? (
          <View style={styles.centerWrap}>
            <CheckCircle size={40} weight="duotone" color={colors.neon} />
            <AppText variant="h2" style={styles.title}>
              {done.note === 'already_linked' ? 'Vínculo já existia' : 'Vínculo criado'}
            </AppText>
            <AppText variant="bodyMd" color="secondary" style={styles.note}>
              {done.note === 'already_linked'
                ? 'Você já está vinculado a este profissional.'
                : `Você está vinculado ao seu novo ${ROLE_LABEL[done.professional_role]}.`}
            </AppText>
            <Button
              variant="primary"
              label="Concluir"
              onPress={() => router.replace(homeForTipo('aluno'))}
            />
          </View>
        ) : (
          <View style={styles.body}>
            <AppText variant="eyebrow" color="neon">
              Convite
            </AppText>
            <AppText variant="h2" style={styles.title}>
              Vincular profissional
            </AppText>

            {/* Card NEUTRO — sem nome até GET /invites/:code/preview existir. */}
            <View style={styles.inviterCard}>
              <View style={styles.inviterIcon}>
                <UserCircle size={26} weight="duotone" color={colors.neon} />
              </View>
              <View style={styles.inviterInfo}>
                <AppText variant="h4">Convite de profissional</AppText>
                <AppText variant="bodySm" color="tertiary">
                  Confirmamos quem te convidou ao criar o vínculo.
                </AppText>
              </View>
            </View>

            <Input
              label="Código do convite"
              value={code}
              onChangeText={(t) => {
                if (error) setError(null);
                setCode(t);
              }}
              autoCapitalize="none"
              autoCorrect={false}
              error={error ?? undefined}
            />

            <View style={styles.cta}>
              <Button
                variant="primary"
                label="Confirmar vínculo"
                disabled={code.trim().length === 0 || consume.isPending}
                loading={consume.isPending}
                onPress={handleConfirm}
              />
            </View>
          </View>
        )}
      </Animated.View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create((theme) => ({
  safe: { flex: 1, backgroundColor: theme.colors.bgLowest },
  flex: { flex: 1 },
  topbar: { paddingHorizontal: theme.spacing.md, paddingVertical: theme.spacing.sm },
  body: { flex: 1, padding: theme.spacing.lg, gap: theme.spacing.md },
  centerWrap: {
    flex: 1,
    padding: theme.spacing.lg,
    gap: theme.spacing.md,
    justifyContent: 'center',
  },
  title: { marginTop: theme.spacing.xs },
  note: { marginBottom: theme.spacing.md },
  inviterCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
    backgroundColor: theme.colors.surface1,
    borderWidth: 1,
    borderColor: theme.colors.outlineVariant,
    borderRadius: theme.radius.card,
    padding: theme.spacing.md,
  },
  inviterIcon: {
    width: 42,
    height: 42,
    borderRadius: theme.radius.pill,
    backgroundColor: theme.colors.surface2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  inviterInfo: { flex: 1, gap: 2 },
  cta: { marginTop: theme.spacing.md },
}));
```

> Confirme a prop de erro do `Input` lendo `src/components/ui/Input.tsx` (o passo 3 do
> aluno usa `error={...}` — existe). Se `goBackOr` exigir `string` (exige — assinatura
> `goBackOr(fallback?: string)`), o cast `as string` de `Href` é seguro aqui.

- [ ] **Step 5: Rodar e ver passar + typecheck**

Run: `npx jest app/usar-convite.test.tsx && npm run typecheck`
Expected: PASS; typecheck limpo.

- [ ] **Step 6: Commit**

```bash
git add src/hooks/useConsumeInvite.ts app/usar-convite.tsx app/usar-convite.test.tsx
git commit -m "feat(convite): aluno logado consome convite (POST /invites/consume real)"
```

---

### Task 7: Roteamento do deep link (register.tsx)

**Files:**
- Modify: `app/register.tsx`
- Test: `app/register.test.tsx` (criar)

- [ ] **Step 1: Escrever o teste falho**

```tsx
// app/register.test.tsx
import { render } from '@testing-library/react-native';

const mockReplace = jest.fn();
let mockParams: Record<string, string | string[] | undefined> = {};
jest.mock('expo-router', () => ({
  router: { replace: (...a: unknown[]) => mockReplace(...a) },
  useLocalSearchParams: () => mockParams,
}));

import RegisterDeepLink from './register';
import { useAuthStore } from '@/store/authStore';
import { useCadastroDraftStore } from '@/store/cadastroDraftStore';

describe('register deep link', () => {
  beforeEach(() => {
    mockReplace.mockClear();
    mockParams = {};
    useCadastroDraftStore.getState().clear();
  });

  it('deslogado: grava o code no draft e vai pro cadastro', () => {
    useAuthStore.setState({ status: 'unauthenticated', user: null });
    mockParams = { code: 'ABC123' };
    render(<RegisterDeepLink />);
    expect(useCadastroDraftStore.getState().inviteCode).toBe('ABC123');
    expect(mockReplace).toHaveBeenCalledWith('/(auth)/cadastro');
  });

  it('autenticado com code: vai para usar-convite preservando o código', () => {
    useAuthStore.setState({ status: 'authenticated', user: { id: 'u1', tipo: 'aluno' } as never });
    mockParams = { code: 'ABC123' };
    render(<RegisterDeepLink />);
    expect(mockReplace).toHaveBeenCalledWith('/usar-convite?code=ABC123');
  });

  it('autenticado sem code: volta pro dispatch', () => {
    useAuthStore.setState({ status: 'authenticated', user: { id: 'u1', tipo: 'aluno' } as never });
    render(<RegisterDeepLink />);
    expect(mockReplace).toHaveBeenCalledWith('/');
  });

  it('hydrating: espera (não navega ainda)', () => {
    useAuthStore.setState({ status: 'hydrating', user: null });
    mockParams = { code: 'ABC123' };
    render(<RegisterDeepLink />);
    expect(mockReplace).not.toHaveBeenCalled();
  });
});
```

- [ ] **Step 2: Rodar e ver falhar**

Run: `npx jest app/register.test.tsx`
Expected: FAIL — os casos "autenticado com code" e "hydrating" falham (comportamento atual descarta o code e navega durante hydrating).

- [ ] **Step 3: Modificar o `useEffect` de `app/register.tsx`** (edição mínima — só o corpo do efeito)

```tsx
  useEffect(() => {
    // Cold start: espera o hydrate decidir a sessão antes de rotear (senão o code
    // se perderia no redirect do guard de (auth)).
    if (status === 'hydrating') return;

    const inviteCode = firstParam(code);

    // Autenticado: convite não cria conta — vai pro fluxo de vínculo (usar-convite),
    // que guarda por tipo. Sem code, volta ao dispatch.
    if (status === 'authenticated') {
      router.replace(
        inviteCode ? `/usar-convite?code=${encodeURIComponent(inviteCode)}` : '/',
      );
      return;
    }

    setInviteCode(inviteCode);
    router.replace('/(auth)/cadastro');
  }, [code, status, setInviteCode]);
```

> O TypeScript pode exigir cast do template string para `Href` — use
> `router.replace((\`/usar-convite?code=${encodeURIComponent(inviteCode)}\`) as Href)`
> com `import type { Href } from 'expo-router'` se necessário.

- [ ] **Step 4: Rodar e ver passar + typecheck**

Run: `npx jest app/register.test.tsx && npm run typecheck`
Expected: PASS (4/4); typecheck limpo.

- [ ] **Step 5: Commit**

```bash
git add app/register.tsx app/register.test.tsx
git commit -m "feat(convite): deep link logado roteia para usar-convite (não descarta mais o code)"
```

---

### Task 8: Fiações e copy (escolha-perfil, professor-info, passo-1, AccountScreen)

**Files:**
- Modify: `app/(auth)/escolha-perfil.tsx`
- Delete: `app/(auth)/professor-info.tsx`
- Modify: `app/(auth)/cadastro/passo-1-convite.tsx`
- Modify: `src/components/account/AccountScreen.tsx`

> Edições mínimas. Nenhum teste existente referencia professor-info/escolha-perfil
> (verificado) — remover a tela não quebra testes.

- [ ] **Step 1: Trocar a rota do "Sou professor"**

Em `app/(auth)/escolha-perfil.tsx`:
1. Na assinatura `function go(path: '/(auth)/cadastro' | '/(auth)/professor-info' | '/(auth)/login')`, trocar `'/(auth)/professor-info'` por `'/(auth)/cadastro-pro'`.
2. No ChoiceCard "Sou professor": `onPress={() => go('/(auth)/cadastro-pro')}` e
   `description="Crio minha conta com CREF ou CRN"` (a descrição atual "Gerencio meus alunos" fica genérica demais para um CTA de cadastro).

- [ ] **Step 2: Remover a tela aposentada**

```bash
git rm "app/(auth)/professor-info.tsx"
```

- [ ] **Step 3: Copy neutra no passo 1 do cadastro aluno**

Em `app/(auth)/cadastro/passo-1-convite.tsx` (3 strings, nada estrutural):
1. `<AppText variant="h4">Convite de treinador</AppText>` → `Convite de profissional`.
2. Helper "O vínculo com seu personal é confirmado ao criar a conta." → "O vínculo com seu profissional é confirmado ao criar a conta." (localize com grep; se a string for outra, ajuste a frase equivalente que mencione "personal"/"treinador").

- [ ] **Step 4: ActionRow "Usar convite" no perfil do aluno**

Em `src/components/account/AccountScreen.tsx`:
1. Import do ícone: adicionar `Ticket` ao import existente de `phosphor-react-native`.
2. Dentro de `<View style={styles.actions}>`, logo APÓS o ActionRow "Editar perfil":
```tsx
          {tipo === 'aluno' ? (
            <ActionRow
              icon={<Ticket size={20} weight="duotone" color={colors.onSurface} />}
              label="Usar convite"
              onPress={() => router.push('/usar-convite' as Href)}
            />
          ) : null}
```
> `tipo`, `router`, `Href` e `colors` já existem no arquivo (verificado).

- [ ] **Step 5: Typecheck + suítes afetadas + diffs mínimos**

Run: `npm run typecheck && npx jest src/components/account && git diff --stat HEAD`
Expected: typecheck limpo; testes do AccountScreen (se existirem) verdes; cada arquivo modificado com POUCAS linhas no stat.

- [ ] **Step 6: Commit**

```bash
git add "app/(auth)/escolha-perfil.tsx" "app/(auth)/cadastro/passo-1-convite.tsx" src/components/account/AccountScreen.tsx
git commit -m "feat(cadastro): liga wizard pro na escolha de perfil, aposenta professor-info, copy neutra e atalho usar-convite"
```
> O `git rm` do professor-info já está staged pelo Step 2 — confirme com `git status` antes do commit.

---

### Task 9: Sinal pro backend + verificação final

**Files:**
- Modify: `AGENTS.md` (seção "Pendências conhecidas")

- [ ] **Step 1: Documentar o sinal pro Dev Back**

Adicionar à seção "Pendências conhecidas" do `AGENTS.md`:

```markdown
- Auto-cadastro de profissional — sem endpoint na API v1. Front pronto (wizard `/(auth)/cadastro-pro`), submit via devMocks no bypass. Solicitado ao backend: `POST /auth/register-professional` — união discriminada por `professional_role` (personal→`cref_number`+`cref_expires_at?` / nutricionista→`crn_number`+`crn_expires_at?`) + base do register (email, password min 8, full_name, birth_date, cpf?, phone?, gender?, lgpd_consent, policy_version), SEM `must_change_password` (senha própria); cria conta ATIVA (`profiles.tipo = professional_role`), validação do registro assíncrona pela equipe; resposta 201 com tokens (igual register); erros: `invalid_body`/`email_already_in_use`/`cpf_already_in_use`/`internal_error` no campo `error`.
- Reforço no `GET /invites/:code/preview` (já solicitado): incluir `professional_role` do emissor na resposta — habilita copy específica no card do convite.
```

- [ ] **Step 2: Suíte completa + qualidade**

Run: `npm run typecheck && npm run lint && npx jest`
Expected: zero erro de tipo; lint limpo nos arquivos novos; todos os testes verdes.

- [ ] **Step 3: Commit final**

```bash
git add AGENTS.md
git commit -m "docs(cadastro-pro): registra endpoint solicitado ao backend"
```

- [ ] **Step 4: Roteiro de verificação manual (designer, dev build com bypass)**

1. Escolha de perfil → "Sou professor" → wizard 3 passos: escolher Personal (campo vira CREF), preencher tudo, criar conta → entra no app como personal (mock).
2. Repetir com Nutricionista (campo vira CRN).
3. Erros: e-mail inválido barra no passo 3; sem papel barra no passo 1.
4. Como aluno logado: Perfil → "Usar convite" → digitar `ACTUSDEMO` → "Vínculo criado". Repetir o mesmo código → "Vínculo já existia".
5. Deep link `npx uri-scheme open "actus://register?code=ACTUSDEMO"` com aluno logado → cai em usar-convite com o código preenchido; com personal logado → aviso "Convites são para alunos"; deslogado → cadastro com código preenchido.
6. Cadastro do aluno: card do passo 1 agora diz "Convite de profissional".

---

## Self-Review (preenchido)

**Cobertura do spec:** auto-cadastro (Tasks 1–5, 8) ✔ · consume + usar-convite + entrada manual (Tasks 6, 8) ✔ · deep link logado/hydrating (Task 7) ✔ · copy neutra + aposentadoria do professor-info (Task 8) ✔ · sinal pro back (Task 9) ✔ · guard por tipo na raiz (Task 6) ✔ · devMocks (Task 2) ✔ · testes (Tasks 1, 3, 6, 7) ✔.

**Tipos consistentes:** `CadastroProForm`/`CadastroProFormSchema`/`cadastroProDefaultValues`/`PASSO_PRO_*_FIELDS`/`buildRegisterProfessionalBody`/`routeRegisterProError` (Task 1) usados idênticos nas Tasks 3–5; `RegisterProfessionalBody` (Task 1) em authStore/hooks (Task 2); `useConsumeInvite` (Task 6) único consumidor de `endpoints.invitesConsume` (Task 1); `useCadastroProDraftStore` (Task 2) nas Tasks 3 e 5. ✔

**Placeholders:** nenhum TBD/TODO; os `[ajuste]`/`[ASSET TEMPORÁRIO]`/`[MOCK]`/`[pendente no backend]` são marcadores convencionais do projeto. Tasks 4–5 instruem espelhar arquivos existentes COM as trocas exatas listadas — o esqueleto-fonte é lido pelo implementador no próprio repo (não é placeholder: as diferenças estão integralmente especificadas). ✔
