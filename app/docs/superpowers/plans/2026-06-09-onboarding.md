# Onboarding Aluno + Professor — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Onboarding completo de baixa fricção: conta enxuta (aluno e professor) + fluxo pós-cadastro autenticado (foto, vínculo, PAR-Q, preferências / perfil profissional, convite) + homes por estado — front completo, backend sinalizado.

**Architecture:** Conta única na `(auth)` (substitui o wizard de 3 passos) → register (real com convite; proposto/mock sem convite e professor) → gate no dispatch (`app/index.tsx`) via `onboardingStore` local → grupos de onboarding em rotas raiz com scaffold compartilhado (`OnboardingScreen`/`OptionCard`). Preferências em mock persistido (padrão Par-Q); peso real via `PATCH /me`.

**Tech Stack:** Expo SDK 55 · Expo Router · TS estrito · Zod · react-hook-form (só na conta) · Zustand · TanStack Query · Unistyles 3 · jest-expo.

**Worktree:** `/mnt/h/actus_app/.claude/worktrees/cadastro` (branch `feat/cadastro`). NUNCA tocar arquivos fora dele.

**Higiene git:** stage por caminho exato; edições mínimas; preservar EOL; nunca `git add` de diretório.

**Achados da verificação adversarial incorporados** (plano anterior, validados empiricamente):
- (V1) Testes de telas que usam `useLogoutMutation`/hooks de dados: **mockar** `@/features/auth/hooks` (senão "No QueryClient set").
- (V2) Testes que renderizam `Logo`: `jest.mock('@/components/ui/Logo', () => ({ Logo: () => null }))` (SVG vira `{testUri}` no jest-expo e crasha).
- (V3) Comandos jest: argumento é REGEX — nunca passar path com parênteses; usar substring (`npx jest conta-aluno`).
- (V4) Baseline do worktree tem 1 teste falhando pré-existente (`app/convite/index.test.tsx`, label duplicado) — Task 0 tria.
- (V5) devMocks de register: chamar `setDevTipo(...)` para o QA entrar no papel certo.
- (V6) Deep link em `must_change_password` → `PASSWORD_GATE` (gap real).
- (V7) `NO_AUTH_PATHS` (src/api/client.ts) deve incluir os novos paths de register.
- (V9) Mock de consume deve distinguir `invite_exhausted` de `invite_expired`.
- (V10) Validar resposta dos mocks de register contra `TokensResponseSchema` em teste.
- (V11) `experiments.typedRoutes`: criar TODAS as rotas de um grupo na mesma task; não rodar typegen no meio.

**Gate de mockups:** antes das Tasks 6–11 (telas), o controlador valida mockups de alta fidelidade com o designer (visual companion). Tasks 0–5 (lógica/infra) não dependem.

**Nota de QA:** contas existentes não têm flag de onboarding → cairão no onboarding no próximo login em dev. Esperado; os passos são puláveis/rápidos. Documentado no roteiro da Task 12.

---

## Estrutura de arquivos

**Criar:** `src/features/auth/contaForm.ts` (+`.test.ts`) · `src/store/onboardingStore.ts` (+`.test.ts`) · `src/mocks/studentOnboarding.ts` (+`.test.ts`) · `src/mocks/professionalProfile.ts` · `src/hooks/useConsumeInvite.ts` · `app/usar-convite.tsx` (+`.test.tsx`) · `app/register.test.tsx` · `app/(auth)/cadastro-pro.tsx` (+`.test.tsx`) · `src/components/onboarding/{OnboardingScreen,OptionCard,FotoStep,index}.tsx` (+ tests) · `app/onboarding-aluno/{_layout,foto,vinculo,par-q,interesse,experiencia,frequencia,local,corpo}.tsx` (+ tests-chave) · `app/onboarding-professor/{_layout,foto,perfil,forma-uso,convite}.tsx` (+ test) · `src/components/professional/PreferencesSection.tsx` (+`.test.tsx`)

**Modificar:** `src/types/auth.ts` · `src/api/endpoints.ts` · `src/api/client.ts` (NO_AUTH_PATHS) · `src/store/authStore.ts` · `src/features/auth/hooks.ts` · `src/api/devMocks.ts` · `app/index.tsx` · `app/register.tsx` · `app/(auth)/cadastro/_layout.tsx` e `index.tsx` (conta única) · `app/(auth)/escolha-perfil.tsx` · `src/components/account/AccountScreen.tsx` · `app/(aluno)/(tabs)/index.tsx` (home estados) · `src/components/professional/StudentsScreen.tsx` (empty CTAs) · `StudentDetailScreen.tsx` (PreferencesSection) · barrels (`professional/index.ts`) · `AGENTS.md` · `app/convite/index.test.tsx` (triagem)

**Remover:** `app/(auth)/cadastro/passo-1-convite.tsx`, `passo-2-voce.tsx`, `passo-3-acesso.tsx` · `app/(auth)/professor-info.tsx`

---

### Task 0: Triagem da baseline (teste pré-existente quebrado)

**Files:** Modify: `app/convite/index.test.tsx`

- [ ] **Step 1: Reproduzir**

Run: `npx jest "convite/index"`
Expected: FAIL — "Found multiple elements with accessibility label: Novo convite" (pré-existente, herdado da base).

- [ ] **Step 2: Correção defensiva no teste** (a tela tem o label no header E no empty state — o teste deve mirar o primeiro)

No caso "navega para /convite/novo pelo botão Novo convite (header)", trocar `getByLabelText('Novo convite')` por:
```tsx
    fireEvent.press(screen.getAllByLabelText('Novo convite')[0]!);
```
(Leia o teste para o nome exato da query usada e aplique a forma `getAllBy...[0]!`.)

- [ ] **Step 3: Verificar e commitar**

Run: `npx jest "convite/index"` → Expected: PASS.
```bash
git add app/convite/index.test.tsx
git commit -m "test(convite): desambigua label duplicado (triagem de baseline)"
```

---

### Task 1: Contratos de conta (types + endpoints + contaForm)

**Files:**
- Modify: `src/types/auth.ts` (2 edições)
- Modify: `src/api/endpoints.ts`
- Create: `src/features/auth/contaForm.ts`
- Test: `src/features/auth/contaForm.test.ts`

- [ ] **Step 1: Teste falho**

```ts
// src/features/auth/contaForm.test.ts
import {
  ContaAlunoFormSchema,
  ContaProfessorFormSchema,
  contaAlunoDefaults,
  contaProfessorDefaults,
  buildAlunoRegisterBody,
  buildProfessorRegisterBody,
  registerErrorField,
} from './contaForm';

const alunoOk = {
  full_name: 'Maria Silva',
  phone: '(11) 98888-7777',
  email: 'maria@exemplo.com',
  password: 'senha-forte',
  confirm_password: 'senha-forte',
  birth_date: '1995-03-20',
  invite_code: '',
};

describe('ContaAlunoFormSchema', () => {
  it('aceita conta válida (sem convite)', () => {
    expect(ContaAlunoFormSchema.safeParse(alunoOk).success).toBe(true);
  });
  it('telefone agora é OBRIGATÓRIO (mínimo 10 dígitos)', () => {
    expect(ContaAlunoFormSchema.safeParse({ ...alunoOk, phone: '' }).success).toBe(false);
    expect(ContaAlunoFormSchema.safeParse({ ...alunoOk, phone: '119' }).success).toBe(false);
  });
  it('nascimento obrigatório (exigência do backend real)', () => {
    expect(ContaAlunoFormSchema.safeParse({ ...alunoOk, birth_date: '' }).success).toBe(false);
  });
  it('convite vazio passa; preenchido valida base64url', () => {
    expect(ContaAlunoFormSchema.safeParse({ ...alunoOk, invite_code: 'AB!' }).success).toBe(false);
    expect(ContaAlunoFormSchema.safeParse({ ...alunoOk, invite_code: 'ACTUSDEMO' }).success).toBe(true);
  });
});

describe('buildAlunoRegisterBody', () => {
  it('com convite: envia invite_code; telefone vira dígitos', () => {
    const b = buildAlunoRegisterBody({ ...alunoOk, invite_code: 'ACTUSDEMO' });
    expect(b.invite_code).toBe('ACTUSDEMO');
    expect(b.phone).toBe('11988887777');
    expect(b.lgpd_consent).toBe(true);
  });
  it('sem convite: invite_code ausente (contrato proposto ao back)', () => {
    const b = buildAlunoRegisterBody(alunoOk);
    expect(b.invite_code).toBeUndefined();
  });
});

describe('ContaProfessorFormSchema / buildProfessorRegisterBody', () => {
  const profOk = {
    full_name: 'João Treina',
    phone: '(11) 97777-6666',
    email: 'joao@exemplo.com',
    password: 'senha-forte',
    confirm_password: 'senha-forte',
  };
  it('aceita conta válida (sem nascimento — fiel ao PDF)', () => {
    expect(ContaProfessorFormSchema.safeParse(profOk).success).toBe(true);
  });
  it('body proposto: sem birth_date, sem cref (vão depois)', () => {
    const b = buildProfessorRegisterBody(profOk);
    expect(b.full_name).toBe('João Treina');
    expect(b.phone).toBe('11977776666');
    expect('birth_date' in b).toBe(false);
  });
});

describe('registerErrorField (tela única: código → campo ou banner)', () => {
  it('email_already_in_use → campo email', () => {
    expect(registerErrorField('email_already_in_use')).toEqual({ campo: 'email' });
  });
  it('códigos de convite → banner form-level (copy específica)', () => {
    expect(registerErrorField('invite_expired')).toEqual({ formLevel: true });
  });
  it('invalid_body com fieldErrors → campo correspondente', () => {
    const r = registerErrorField('invalid_body', {
      details: { fieldErrors: { birth_date: ['Data inválida'] } },
    });
    expect(r).toEqual({ campo: 'birth_date', fieldMessage: 'Data inválida' });
  });
  it('desconhecido → banner', () => {
    expect(registerErrorField('internal_error')).toEqual({ formLevel: true });
  });
});

describe('defaults', () => {
  it('todos vazios', () => {
    expect(contaAlunoDefaults.invite_code).toBe('');
    expect(contaProfessorDefaults.full_name).toBe('');
  });
});
```

- [ ] **Step 2: Rodar e ver falhar**

Run: `npx jest contaForm` → Expected: FAIL ("Cannot find module './contaForm'").

- [ ] **Step 3: Editar `src/types/auth.ts`**

(a) No `RegisterBodySchema`, trocar a linha do invite:
```ts
  // [proposto ao backend: tornar opcional — cadastro sem vínculo] Hoje o register
  // real EXIGE invite_code; sem ele o submit só funciona via devMocks.
  invite_code: z.string().min(3).max(200).optional(),
```
(b) Append ao FINAL do arquivo:
```ts
// ─── Auto-cadastro de professor (personal) ───
// [pendente no backend: POST /auth/register-professional]
// Contrato PROPOSTO, fiel ao PDF de onboarding: conta enxuta (sem nascimento, sem CREF
// no cadastro — perfil profissional vem depois, no onboarding). Conta ativa + tokens.
export const RegisterProfessionalBodySchema = z.object({
  email: z.string().email().max(320),
  password: z.string().min(8).max(200),
  full_name: z.string().min(3).max(200),
  phone: z.string().min(6).max(40),
  lgpd_consent: z.literal(true).optional(),
  policy_version: z.string().optional(),
});
export type RegisterProfessionalBody = z.infer<typeof RegisterProfessionalBodySchema>;
```

- [ ] **Step 4: Editar `src/api/endpoints.ts`**

Em `auth: {}`, após `changePassword`:
```ts
    // Auto-cadastro de professor (personal). [pendente no backend]
    registerProfessional: '/auth/register-professional',
```
Após `invitePreview`:
```ts
  // Aluno logado consome convite para vincular novo profissional (endpoint REAL).
  invitesConsume: '/invites/consume',
```

- [ ] **Step 5: Criar `src/features/auth/contaForm.ts`**

```ts
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
```

- [ ] **Step 6: Verificar**

Run: `npx jest contaForm && npm run typecheck`
Expected: PASS; typecheck limpo. ATENÇÃO: o typecheck vai acusar os passos antigos do wizard se eles referenciarem símbolos removidos — NÃO removemos nada de `cadastroForm.ts` nesta task (os passos antigos continuam compilando até a Task 6).

- [ ] **Step 7: Commit**

```bash
git add src/types/auth.ts src/api/endpoints.ts src/features/auth/contaForm.ts src/features/auth/contaForm.test.ts
git commit -m "feat(onboarding): contratos de conta única (aluno+professor) e endpoints propostos"
```

---

### Task 2: Sessão e devMocks (registerProfessional, NO_AUTH_PATHS, consume mock)

**Files:**
- Modify: `src/store/authStore.ts` · `src/features/auth/hooks.ts` · `src/api/client.ts` · `src/api/devMocks.ts`
- Test: `src/api/devMocks.registers.test.ts` (novo)

- [ ] **Step 1: authStore — método registerProfessional** (espelho exato do `register`)

1. Import de types: adicionar `type RegisterProfessionalBody` à linha de `@/types/auth`.
2. Interface `AuthState`, após `register`:
```ts
  registerProfessional: (body: RegisterProfessionalBody) => Promise<void>;
```
3. Corpo do store, após o método `register`:
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

- [ ] **Step 2: hooks — mutation**

Em `src/features/auth/hooks.ts` (import `type RegisterProfessionalBody` junto aos types), após `useRegisterMutation`:
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

- [ ] **Step 3: client — NO_AUTH_PATHS (V7)**

Em `src/api/client.ts`, localizar o array `NO_AUTH_PATHS` (linhas ~79–87) e adicionar:
```ts
  endpoints.auth.registerProfessional,
```

- [ ] **Step 4: devMocks — matchers (V5, V9)**

Em `src/api/devMocks.ts`:
1. Ajustar o import de devAuth para incluir `setDevTipo`:
```ts
import { getDevTipo, setDevTipo } from '@/lib/devAuth';
```
(Leia a linha atual do import — se for default/nomeado diferente, ajuste mantendo `getDevTipo`.)

2. No array `MATCHERS`, ANTES do matcher de `GET /invites`:
```ts
  // POST /auth/register-professional  [MOCK — sem endpoint na API v1]
  // Alinha o tipo dev para o /me do bypass devolver 'personal' (QA entra no papel certo).
  {
    test: (m, u) => (m === 'post' && /\/auth\/register-professional$/.test(u) ? [] : null),
    build: () => {
      setDevTipo('personal');
      return mockRegisterTokens('pro');
    },
  },
  // POST /auth/register  [bypass: o backend real não responde; cobre o cadastro
  // sem convite (contrato proposto) e com convite no QA]
  {
    test: (m, u) => (m === 'post' && /\/auth\/register$/.test(u) ? [] : null),
    build: () => {
      setDevTipo('aluno');
      return mockRegisterTokens('aluno');
    },
  },
  // POST /invites/consume (endpoint REAL; mock p/ QA no bypass)
  {
    test: (m, u) => (m === 'post' && /\/invites\/consume$/.test(u) ? [] : null),
    build: (_m, config) => mockConsumeInvite(parseBody(config) as { code?: string }),
  },
```

3. Factories (junto ao bloco de convites):
```ts
// [MOCK] Tokens de register (aluno/pro) — mesmo shape de TokensResponseSchema.
function mockRegisterTokens(kind: string) {
  return {
    access_token: `dev-access-${kind}`,
    access_token_expires_in: 900,
    refresh_token: `dev-refresh-${kind}`,
  };
}

// Consome convite do store local. Distingue expiração de esgotamento (V9);
// segundo consume do mesmo código → note already_linked.
const consumedCodes = new Set<string>();
function mockConsumeInvite(body: { code?: string }) {
  const code = body.code ?? '';
  const inv = devInvites.find((i) => i.code === code);
  if (!inv) throw new MockHttpError(404, 'invalid_invite');
  if (new Date(inv.expires_at).getTime() <= new Date().getTime()) {
    throw new MockHttpError(409, 'invite_expired');
  }
  if (inv.used_count >= inv.max_uses) throw new MockHttpError(409, 'invite_exhausted');
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

- [ ] **Step 5: Teste do contrato dos mocks (V10)**

```ts
// src/api/devMocks.registers.test.ts
// Garante que os mocks de register respondem no MESMO shape que o app valida
// (TokensResponseSchema) — se o contrato mudar, este teste quebra antes da UI.
jest.mock('expo-secure-store', () => ({
  getItemAsync: jest.fn(async () => null),
  setItemAsync: jest.fn(async () => undefined),
  deleteItemAsync: jest.fn(async () => undefined),
}));

import { TokensResponseSchema } from '@/types/auth';
import { __testables } from './devMocks';

describe('devMocks registers', () => {
  it('mockRegisterTokens casa com TokensResponseSchema', () => {
    expect(TokensResponseSchema.safeParse(__testables.mockRegisterTokens('x')).success).toBe(
      true,
    );
  });
});
```
Para isso, exportar no FINAL de `devMocks.ts`:
```ts
// Exposto só para teste de contrato (não usar em runtime).
export const __testables = { mockRegisterTokens };
```
Run: `npx jest devMocks.registers` → FAIL antes do export, PASS depois.

- [ ] **Step 6: Verificar + commit**

Run: `npm run typecheck && npx jest devMocks.registers && git diff --stat`
Expected: limpo; diffs pequenos por arquivo (reformatou → restaure e refaça).
```bash
git add src/store/authStore.ts src/features/auth/hooks.ts src/api/client.ts src/api/devMocks.ts src/api/devMocks.registers.test.ts
git commit -m "feat(onboarding): registerProfessional (store/hook/mock), register mock e consume mock"
```

---

### Task 3: Stores locais (gate de onboarding + preferências + perfil profissional)

**Files:**
- Create: `src/store/onboardingStore.ts` + Test: `src/store/onboardingStore.test.ts`
- Create: `src/mocks/studentOnboarding.ts` + Test: `src/mocks/studentOnboarding.test.ts`
- Create: `src/mocks/professionalProfile.ts`

- [ ] **Step 1: Testes falhos**

```ts
// src/store/onboardingStore.test.ts
jest.mock('expo-secure-store', () => {
  const store = new Map<string, string>();
  return {
    getItemAsync: jest.fn(async (k: string) => store.get(k) ?? null),
    setItemAsync: jest.fn(async (k: string, v: string) => void store.set(k, v)),
    deleteItemAsync: jest.fn(async (k: string) => void store.delete(k)),
  };
});

import { useOnboardingStore } from './onboardingStore';

describe('onboardingStore', () => {
  it('pendente por padrão; markDone persiste e isDone reflete', async () => {
    await useOnboardingStore.getState().hydrate();
    expect(useOnboardingStore.getState().isDone('u1')).toBe(false);
    await useOnboardingStore.getState().markDone('u1');
    expect(useOnboardingStore.getState().isDone('u1')).toBe(true);
    // Re-hidrata do zero (simula reabrir o app).
    useOnboardingStore.setState({ doneByUser: {}, hydrated: false });
    await useOnboardingStore.getState().hydrate();
    expect(useOnboardingStore.getState().isDone('u1')).toBe(true);
  });
});
```

```ts
// src/mocks/studentOnboarding.test.ts
jest.mock('expo-secure-store', () => {
  const store = new Map<string, string>();
  return {
    getItemAsync: jest.fn(async (k: string) => store.get(k) ?? null),
    setItemAsync: jest.fn(async (k: string, v: string) => void store.set(k, v)),
    deleteItemAsync: jest.fn(async (k: string) => void store.delete(k)),
  };
});

import { useStudentOnboardingMock, saveStudentAnswers } from './studentOnboarding';

describe('studentOnboarding mock', () => {
  it('grava respostas parciais por aluno e persiste', async () => {
    await saveStudentAnswers('aluno-1', { interesse: 'hipertrofia' });
    await saveStudentAnswers('aluno-1', { dias_semana: '3', local: 'academia' });
    const a = useStudentOnboardingMock.getState().byStudent['aluno-1'];
    expect(a?.interesse).toBe('hipertrofia');
    expect(a?.dias_semana).toBe('3');
    useStudentOnboardingMock.setState({ byStudent: {}, hydrated: false });
    await useStudentOnboardingMock.getState().hydrate();
    expect(useStudentOnboardingMock.getState().byStudent['aluno-1']?.local).toBe('academia');
  });
});
```
Run: `npx jest onboardingStore studentOnboarding` → FAIL (módulos não existem).

- [ ] **Step 2: `src/store/onboardingStore.ts`**

```ts
import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import { create } from 'zustand';

// Gate LOCAL do onboarding pós-cadastro (uma flag por usuário).
// [local — sem endpoint; sinalizar persistência no /me quando o back expuser]
// Contas existentes não têm a flag → caem no onboarding uma vez (passos puláveis).
const KEY = 'actus.onboarding.done';
const isWeb = Platform.OS === 'web';

async function loadRaw(): Promise<string | null> {
  if (isWeb) return globalThis.localStorage?.getItem(KEY) ?? null;
  try {
    return await SecureStore.getItemAsync(KEY);
  } catch {
    return null;
  }
}

async function saveRaw(value: string): Promise<void> {
  if (isWeb) {
    globalThis.localStorage?.setItem(KEY, value);
    return;
  }
  try {
    await SecureStore.setItemAsync(KEY, value);
  } catch {
    // Gate local: falha de persistência não pode travar o app.
  }
}

interface OnboardingState {
  doneByUser: Record<string, boolean>;
  hydrated: boolean;
  hydrate: () => Promise<void>;
  markDone: (userId: string) => Promise<void>;
  isDone: (userId: string) => boolean;
}

export const useOnboardingStore = create<OnboardingState>((set, get) => ({
  doneByUser: {},
  hydrated: false,
  hydrate: async () => {
    if (get().hydrated) return;
    let map: Record<string, boolean> = {};
    try {
      map = JSON.parse((await loadRaw()) ?? '{}') as Record<string, boolean>;
    } catch {
      map = {};
    }
    set({ doneByUser: map, hydrated: true });
  },
  markDone: async (userId) => {
    const next = { ...get().doneByUser, [userId]: true };
    set({ doneByUser: next });
    await saveRaw(JSON.stringify(next));
  },
  isDone: (userId) => get().doneByUser[userId] === true,
}));
```

- [ ] **Step 3: `src/mocks/studentOnboarding.ts`**

```ts
// [MOCK — sem endpoint na API v1: preferências de treino do aluno]
// História de onboarding: interesse, experiência, dias/semana, local, altura e o
// status do vínculo escolhido. Peso NÃO entra aqui (vai REAL via PATCH /me).
// Mesmo padrão do src/mocks/parq.ts: schema Zod + persistência local por aluno.
import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import { create } from 'zustand';
import { useEffect } from 'react';
import { z } from 'zod';

export const InteresseSchema = z.enum([
  'hipertrofia',
  'emagrecimento',
  'condicionamento',
  'resistencia',
  'adaptacao',
]);
export const ExperienciaSchema = z.enum(['comecando', 'as_vezes', 'frequente']);
export const DiasSemanaSchema = z.enum(['1', '2', '3', '4', '5+']);
export const LocalTreinoSchema = z.enum(['academia', 'casa', 'condominio', 'ar_livre']);
export const LinkStatusSchema = z.enum(['invited', 'linked', 'none']);

export const StudentAnswersSchema = z.object({
  interesse: InteresseSchema.optional(),
  experiencia: ExperienciaSchema.optional(),
  dias_semana: DiasSemanaSchema.optional(),
  local: LocalTreinoSchema.optional(),
  altura_cm: z.number().int().min(100).max(250).optional(),
  link_status: LinkStatusSchema.optional(),
});
export type StudentAnswers = z.infer<typeof StudentAnswersSchema>;

const KEY = 'actus.mock.studentOnboarding';
const isWeb = Platform.OS === 'web';

async function loadRaw(): Promise<string | null> {
  if (isWeb) return globalThis.localStorage?.getItem(KEY) ?? null;
  try {
    return await SecureStore.getItemAsync(KEY);
  } catch {
    return null;
  }
}

async function saveRaw(value: string): Promise<void> {
  if (isWeb) {
    globalThis.localStorage?.setItem(KEY, value);
    return;
  }
  try {
    await SecureStore.setItemAsync(KEY, value);
  } catch {
    // Mock: não pode quebrar o fluxo.
  }
}

type AnswersMap = Record<string, StudentAnswers>;

function parseMap(raw: string | null): AnswersMap {
  if (!raw) return {};
  try {
    const obj = JSON.parse(raw) as Record<string, unknown>;
    const out: AnswersMap = {};
    for (const [id, v] of Object.entries(obj)) {
      const parsed = StudentAnswersSchema.safeParse(v);
      if (parsed.success) out[id] = parsed.data;
    }
    return out;
  } catch {
    return {};
  }
}

interface StudentOnboardingState {
  byStudent: AnswersMap;
  hydrated: boolean;
  hydrate: () => Promise<void>;
  save: (studentId: string, partial: StudentAnswers) => Promise<void>;
}

export const useStudentOnboardingMock = create<StudentOnboardingState>((set, get) => ({
  byStudent: {},
  hydrated: false,
  hydrate: async () => {
    if (get().hydrated) return;
    set({ byStudent: parseMap(await loadRaw()), hydrated: true });
  },
  save: async (studentId, partial) => {
    const current = get().byStudent[studentId] ?? {};
    const merged = StudentAnswersSchema.parse({ ...current, ...partial });
    const next = { ...get().byStudent, [studentId]: merged };
    set({ byStudent: next });
    await saveRaw(JSON.stringify(next));
  },
}));

export async function saveStudentAnswers(
  studentId: string,
  partial: StudentAnswers,
): Promise<void> {
  return useStudentOnboardingMock.getState().save(studentId, partial);
}

// Hook: respostas de um aluno, hidratando na primeira montagem.
export function useStudentAnswers(studentId: string | undefined): StudentAnswers | null {
  const byStudent = useStudentOnboardingMock((s) => s.byStudent);
  const hydrate = useStudentOnboardingMock((s) => s.hydrate);
  useEffect(() => {
    void hydrate();
  }, [hydrate]);
  return studentId ? (byStudent[studentId] ?? null) : null;
}

// Rótulos pt-BR (uma fonte para telas do aluno e seção do personal).
export const INTERESSE_LABEL: Record<z.infer<typeof InteresseSchema>, string> = {
  hipertrofia: 'Hipertrofia',
  emagrecimento: 'Emagrecimento',
  condicionamento: 'Condicionamento físico geral',
  resistencia: 'Resistência muscular',
  adaptacao: 'Adaptação neuromotora',
};
export const EXPERIENCIA_LABEL: Record<z.infer<typeof ExperienciaSchema>, string> = {
  comecando: 'Estou começando',
  as_vezes: 'Já treino às vezes',
  frequente: 'Treino com frequência',
};
export const LOCAL_LABEL: Record<z.infer<typeof LocalTreinoSchema>, string> = {
  academia: 'Academia',
  casa: 'Casa',
  condominio: 'Condomínio',
  ar_livre: 'Ar livre',
};
```

- [ ] **Step 4: `src/mocks/professionalProfile.ts`** (mesma mecânica, shape menor)

```ts
// [MOCK — sem endpoint na API v1: perfil profissional do professor]
// PDF de onboarding: nome profissional + área de atuação (obrigatórios),
// CREF/experiência/cidade opcionais + forma de uso (intenção).
import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import { create } from 'zustand';
import { useEffect } from 'react';
import { z } from 'zod';

export const AreaAtuacaoSchema = z.enum([
  'musculacao',
  'condicionamento',
  'emagrecimento',
  'hipertrofia',
  'reabilitacao',
  'funcional',
  'corrida',
  'outro',
]);
export const FormaUsoSchema = z.enum([
  'organizar',
  'prescrever',
  'acompanhar',
  'convidar',
  'testar',
]);

export const ProfessionalProfileSchema = z.object({
  nome_profissional: z.string().min(2).max(120).optional(),
  area: AreaAtuacaoSchema.optional(),
  cref: z.string().max(40).optional(),
  experiencia_anos: z.string().max(20).optional(),
  cidade_uf: z.string().max(80).optional(),
  forma_uso: FormaUsoSchema.optional(),
});
export type ProfessionalProfile = z.infer<typeof ProfessionalProfileSchema>;

const KEY = 'actus.mock.professionalProfile';
const isWeb = Platform.OS === 'web';

async function loadRaw(): Promise<string | null> {
  if (isWeb) return globalThis.localStorage?.getItem(KEY) ?? null;
  try {
    return await SecureStore.getItemAsync(KEY);
  } catch {
    return null;
  }
}
async function saveRaw(value: string): Promise<void> {
  if (isWeb) {
    globalThis.localStorage?.setItem(KEY, value);
    return;
  }
  try {
    await SecureStore.setItemAsync(KEY, value);
  } catch {
    // Mock.
  }
}

type ProfileMap = Record<string, ProfessionalProfile>;

interface ProfessionalProfileState {
  byUser: ProfileMap;
  hydrated: boolean;
  hydrate: () => Promise<void>;
  save: (userId: string, partial: ProfessionalProfile) => Promise<void>;
}

export const useProfessionalProfileMock = create<ProfessionalProfileState>((set, get) => ({
  byUser: {},
  hydrated: false,
  hydrate: async () => {
    if (get().hydrated) return;
    let map: ProfileMap = {};
    try {
      const obj = JSON.parse((await loadRaw()) ?? '{}') as Record<string, unknown>;
      for (const [id, v] of Object.entries(obj)) {
        const parsed = ProfessionalProfileSchema.safeParse(v);
        if (parsed.success) map[id] = parsed.data;
      }
    } catch {
      map = {};
    }
    set({ byUser: map, hydrated: true });
  },
  save: async (userId, partial) => {
    const merged = ProfessionalProfileSchema.parse({
      ...(get().byUser[userId] ?? {}),
      ...partial,
    });
    const next = { ...get().byUser, [userId]: merged };
    set({ byUser: next });
    await saveRaw(JSON.stringify(next));
  },
}));

export async function saveProfessionalProfile(
  userId: string,
  partial: ProfessionalProfile,
): Promise<void> {
  return useProfessionalProfileMock.getState().save(userId, partial);
}

export const AREA_LABEL: Record<z.infer<typeof AreaAtuacaoSchema>, string> = {
  musculacao: 'Musculação',
  condicionamento: 'Condicionamento físico',
  emagrecimento: 'Emagrecimento',
  hipertrofia: 'Hipertrofia',
  reabilitacao: 'Reabilitação / retorno ao treino',
  funcional: 'Funcional',
  corrida: 'Corrida',
  outro: 'Outro',
};
export const FORMA_USO_LABEL: Record<z.infer<typeof FormaUsoSchema>, string> = {
  organizar: 'Organizar meus alunos',
  prescrever: 'Prescrever treinos',
  acompanhar: 'Acompanhar evolução',
  convidar: 'Convidar alunos',
  testar: 'Testar o app primeiro',
};
```

- [ ] **Step 5: Verificar + commit**

Run: `npx jest onboardingStore studentOnboarding && npm run typecheck` → PASS/limpo.
```bash
git add src/store/onboardingStore.ts src/store/onboardingStore.test.ts src/mocks/studentOnboarding.ts src/mocks/studentOnboarding.test.ts src/mocks/professionalProfile.ts
git commit -m "feat(onboarding): gate local + mocks de preferências e perfil profissional"
```

---

### Task 4: Gate no dispatch + roteamento do deep link

**Files:**
- Modify: `app/index.tsx` · `app/register.tsx`
- Create: `src/lib/onboardingRoutes.ts`
- Test: `app/register.test.tsx`

- [ ] **Step 1: `src/lib/onboardingRoutes.ts`**

```ts
import type { Href } from 'expo-router';
import type { UserTipo } from '@/types/me';

// Primeira tela do onboarding por tipo (null = tipo sem onboarding: nutri/staff).
export function onboardingEntry(tipo: UserTipo): Href | null {
  switch (tipo) {
    case 'aluno':
      return '/onboarding-aluno/foto' as Href;
    case 'personal':
      return '/onboarding-professor/foto' as Href;
    default:
      return null;
  }
}
```

- [ ] **Step 2: Gate em `app/index.tsx`** (edição mínima no efeito de dispatch)

1. Imports novos:
```ts
import { useOnboardingStore } from '@/store/onboardingStore';
import { onboardingEntry } from '@/lib/onboardingRoutes';
```
2. Dentro do componente, junto aos selectors existentes:
```ts
  const obHydrated = useOnboardingStore((s) => s.hydrated);
  const obHydrate = useOnboardingStore((s) => s.hydrate);
  const isOnboardingDone = useOnboardingStore((s) => s.isDone);
```
3. Substituir SOMENTE o bloco `if (status === 'authenticated' && user) { ... }` do efeito por:
```ts
    if (status === 'authenticated' && user) {
      // Gate de onboarding: espera o store local hidratar antes de decidir.
      if (!obHydrated) {
        void obHydrate();
        return;
      }
      const entry = onboardingEntry(user.tipo);
      if (entry && !isOnboardingDone(user.id)) {
        router.replace(entry);
        return;
      }
      router.replace(homeForTipo(user.tipo));
    }
```
4. Deps do efeito: acrescentar `obHydrated, obHydrate, isOnboardingDone` ao array.

- [ ] **Step 3: Teste falho do register** (V2: mock do Logo; V6: must_change_password)

```tsx
// app/register.test.tsx
import { render } from '@testing-library/react-native';

const mockReplace = jest.fn();
let mockParams: Record<string, string | string[] | undefined> = {};
jest.mock('expo-router', () => ({
  router: { replace: (...a: unknown[]) => mockReplace(...a) },
  useLocalSearchParams: () => mockParams,
}));
// SVG sob jest-expo vira asset numérico/objeto → mocka o Logo (V2, verificado).
jest.mock('@/components/ui/Logo', () => ({ Logo: () => null }));

import RegisterDeepLink from './register';
import { useAuthStore } from '@/store/authStore';
import { useCadastroDraftStore } from '@/store/cadastroDraftStore';

describe('register deep link', () => {
  beforeEach(() => {
    mockReplace.mockClear();
    mockParams = {};
    useCadastroDraftStore.getState().clear();
  });

  it('deslogado: grava o code no draft e vai pra conta', () => {
    useAuthStore.setState({ status: 'unauthenticated', user: null });
    mockParams = { code: 'ABC123' };
    render(<RegisterDeepLink />);
    expect(useCadastroDraftStore.getState().inviteCode).toBe('ABC123');
    expect(mockReplace).toHaveBeenCalledWith('/(auth)/cadastro');
  });

  it('autenticado com code: vai para usar-convite preservando o código', () => {
    useAuthStore.setState({
      status: 'authenticated',
      user: { id: 'u1', tipo: 'aluno' } as never,
    });
    mockParams = { code: 'ABC123' };
    render(<RegisterDeepLink />);
    expect(mockReplace).toHaveBeenCalledWith('/usar-convite?code=ABC123');
  });

  it('autenticado sem code: volta pro dispatch', () => {
    useAuthStore.setState({
      status: 'authenticated',
      user: { id: 'u1', tipo: 'aluno' } as never,
    });
    render(<RegisterDeepLink />);
    expect(mockReplace).toHaveBeenCalledWith('/');
  });

  it('must_change_password: vai pro gate de senha (não perde a sessão)', () => {
    useAuthStore.setState({ status: 'must_change_password', user: null });
    mockParams = { code: 'ABC123' };
    render(<RegisterDeepLink />);
    expect(mockReplace).toHaveBeenCalledWith('/(auth)/trocar-senha');
  });

  it('hydrating: espera (não navega)', () => {
    useAuthStore.setState({ status: 'hydrating', user: null });
    mockParams = { code: 'ABC123' };
    render(<RegisterDeepLink />);
    expect(mockReplace).not.toHaveBeenCalled();
  });
});
```
Run: `npx jest register.test` → Expected: FAIL nos casos autenticado/gate/hydrating (comportamento atual), PASS no deslogado.

- [ ] **Step 4: Novo efeito em `app/register.tsx`**

1. Import: `import { PASSWORD_GATE } from '@/lib/authRoutes';`
2. Substituir o corpo do `useEffect`:
```tsx
  useEffect(() => {
    // Cold start: espera o hydrate decidir a sessão (senão o code se perde no guard).
    if (status === 'hydrating') return;

    if (status === 'must_change_password') {
      router.replace(PASSWORD_GATE);
      return;
    }

    const inviteCode = firstParam(code);

    if (status === 'authenticated') {
      // Convite não cria conta de novo — vai pro fluxo de vínculo (guarda por tipo).
      router.replace(
        inviteCode ? `/usar-convite?code=${encodeURIComponent(inviteCode)}` : '/',
      );
      return;
    }

    setInviteCode(inviteCode);
    router.replace('/(auth)/cadastro');
  }, [code, status, setInviteCode]);
```

- [ ] **Step 5: Verificar + commit**

Run: `npx jest register.test && npm run typecheck` → PASS (5/5); limpo.
```bash
git add app/index.tsx app/register.tsx app/register.test.tsx src/lib/onboardingRoutes.ts
git commit -m "feat(onboarding): gate no dispatch e deep link com sessão (usar-convite/gate de senha)"
```

---

### Task 5: useConsumeInvite + tela usar-convite

**Files:**
- Create: `src/hooks/useConsumeInvite.ts` · `app/usar-convite.tsx`
- Test: `app/usar-convite.test.tsx`

- [ ] **Step 1: Hook**

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
// Endpoint REAL. Sucesso invalida ['me'] por prefixo (cobre /me, workouts, diets, weekly).
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

- [ ] **Step 2: Teste falho** (V1: mock dos hooks de auth; V8: callbacks de sucesso/erro)

```tsx
// app/usar-convite.test.tsx
import { render, screen, fireEvent } from '@testing-library/react-native';

const mockMutate = jest.fn();
jest.mock('@/hooks/useConsumeInvite', () => ({
  useConsumeInvite: () => ({ mutate: mockMutate, isPending: false }),
}));
// (V1) useLogoutMutation real exige QueryClientProvider — mock padrão do repo.
jest.mock('@/features/auth/hooks', () => ({
  useLogoutMutation: () => ({ mutate: jest.fn(), isPending: false }),
}));

const mockReplace = jest.fn();
let mockParams: Record<string, string | undefined> = {};
jest.mock('expo-router', () => ({
  router: {
    replace: (...a: unknown[]) => mockReplace(...a),
    back: jest.fn(),
    push: jest.fn(),
    canGoBack: () => false,
  },
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

type ConsumeCallbacks = {
  onSuccess?: (r: unknown) => void;
  onError?: (e: unknown) => void;
};

describe('usar-convite', () => {
  beforeEach(() => {
    mockMutate.mockReset();
    mockParams = {};
  });

  it('aluno com code confirma e vê o sucesso (vínculo criado)', () => {
    setUser('aluno');
    mockParams = { code: 'ACTUSDEMO' };
    mockMutate.mockImplementation((_code: string, cb: ConsumeCallbacks) => {
      cb.onSuccess?.({ ok: true, professional_id: 'p1', professional_role: 'personal' });
    });
    render(<UsarConviteScreen />);
    fireEvent.press(screen.getByText('Confirmar vínculo'));
    expect(screen.getByText('Vínculo criado')).toBeTruthy();
  });

  it('already_linked mostra o estado próprio', () => {
    setUser('aluno');
    mockParams = { code: 'ACTUSDEMO' };
    mockMutate.mockImplementation((_code: string, cb: ConsumeCallbacks) => {
      cb.onSuccess?.({
        ok: true,
        professional_id: 'p1',
        professional_role: 'personal',
        note: 'already_linked',
      });
    });
    render(<UsarConviteScreen />);
    fireEvent.press(screen.getByText('Confirmar vínculo'));
    expect(screen.getByText(/já está vinculado/i)).toBeTruthy();
  });

  it('profissional logado vê o aviso (guard de tipo)', () => {
    setUser('personal');
    render(<UsarConviteScreen />);
    expect(screen.getByText(/Convites são para alunos/i)).toBeTruthy();
    expect(screen.queryByText('Confirmar vínculo')).toBeNull();
  });

  it('aluno sem code vê o input do código', () => {
    setUser('aluno');
    render(<UsarConviteScreen />);
    expect(screen.getByLabelText('Código do convite')).toBeTruthy();
  });
});
```
Run: `npx jest usar-convite` → FAIL (módulo não existe).

- [ ] **Step 3: Tela**

```tsx
// app/usar-convite.tsx
// Aluno logado usa um convite para se vincular a um NOVO profissional
// (POST /invites/consume — REAL). Rota raiz, FORA dos grupos: o guard de (aluno)
// expulsaria um profissional antes do aviso "Convites são para alunos".
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

const CODE_RE = /^[A-Za-z0-9_-]{3,200}$/;

const ROLE_LABEL: Record<ConsumeInviteResponse['professional_role'], string> = {
  personal: 'personal',
  nutricionista: 'nutricionista',
};

// (V8) Papel do conflito quando o backend detalhar em extras (defensivo).
function conflictMessage(extras: Record<string, unknown>): string {
  const role = extras['professional_role'];
  const label =
    role === 'personal' || role === 'nutricionista' ? ROLE_LABEL[role] : 'profissional';
  return `Você já tem um ${label} ativo. Fale com ele antes de trocar.`;
}

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
  // (V8) only_student_can_consume do backend renderiza o MESMO aviso do guard local.
  const [blockedForRole, setBlockedForRole] = useState(false);

  const opacity = useSharedValue(0);
  useEffect(() => {
    opacity.value = withTiming(1, { duration: motion.screenMs });
  }, [opacity]);
  const revealStyle = useAnimatedStyle(() => ({ opacity: opacity.value }));

  if (status !== 'authenticated' || !user) {
    return <Redirect href={AUTH_ENTRY} />;
  }

  if (user.tipo !== 'aluno' || blockedForRole) {
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
        if (isApiError(err)) {
          if (err.code === 'only_student_can_consume') {
            setBlockedForRole(true);
            return;
          }
          if (err.code === 'already_has_active_professional_for_role') {
            setError(conflictMessage(err.extras));
            return;
          }
          setError(authErrorMessage(err.code));
          return;
        }
        setError(authErrorMessage('unknown'));
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

            {/* Card NEUTRO — nome real quando GET /invites/:code/preview existir. */}
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
              style={styles.codeInput}
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
  // (V8) Código em fonte mono, espelhando o input de convite do cadastro antigo.
  codeInput: { fontFamily: theme.fontFamily.mono, letterSpacing: 1 },
  cta: { marginTop: theme.spacing.md },
}));
```
> Confirme `theme.fontFamily.mono` em `src/theme/tokens.ts` (o passo-1 antigo usava esse token via `styles.codeInput` — se o nome divergir, use o token mono real; nunca hardcode). Se `Input` não aceitar `style`, leia `src/components/ui/Input.tsx` e aplique no prop de estilo do texto que ele expõe.

- [ ] **Step 4: Verificar + commit**

Run: `npx jest usar-convite && npm run typecheck` → PASS (4/4); limpo.
```bash
git add src/hooks/useConsumeInvite.ts app/usar-convite.tsx app/usar-convite.test.tsx
git commit -m "feat(onboarding): aluno logado consome convite (tela usar-convite, endpoint real)"
```

---

> **GATE DE MOCKUPS:** a partir daqui são telas novas — o controlador apresenta mockups
> de alta fidelidade ao designer (conta única, telas do onboarding aluno/professor) e
> só libera as Tasks 6–11 após o OK.

### Task 6: Conta única do ALUNO (substitui o wizard de 3 passos)

**Files:**
- Modify: `app/(auth)/cadastro/_layout.tsx` (simplificar) · `app/(auth)/cadastro/index.tsx` (vira a tela)
- Delete: `app/(auth)/cadastro/passo-1-convite.tsx` · `passo-2-voce.tsx` · `passo-3-acesso.tsx`
- Test: `app/(auth)/cadastro/conta-aluno.test.tsx` (novo — nome sem parênteses no comando: `npx jest conta-aluno`)

- [ ] **Step 1: Teste falho**

```tsx
// app/(auth)/cadastro/conta-aluno.test.tsx
import { render, screen } from '@testing-library/react-native';

jest.mock('@/features/auth/hooks', () => ({
  useRegisterMutation: () => ({ mutate: jest.fn(), isPending: false }),
}));

import ContaAlunoScreen from './index';
import { useCadastroDraftStore } from '@/store/cadastroDraftStore';

describe('Conta do aluno (tela única)', () => {
  beforeEach(() => useCadastroDraftStore.getState().clear());

  it('renderiza os campos essenciais (telefone agora obrigatório)', () => {
    render(<ContaAlunoScreen />);
    expect(screen.getByLabelText('Nome completo')).toBeTruthy();
    expect(screen.getByLabelText('Telefone')).toBeTruthy();
    expect(screen.getByLabelText('E-mail')).toBeTruthy();
    expect(screen.getByLabelText('Senha')).toBeTruthy();
    expect(screen.getByLabelText('Confirmar senha')).toBeTruthy();
    expect(screen.getByText('Nascimento')).toBeTruthy();
  });

  it('com convite do deep link mostra o selo do código', () => {
    useCadastroDraftStore.getState().setInviteCode('ACTUSDEMO');
    render(<ContaAlunoScreen />);
    expect(screen.getByText(/Código recebido pelo link/i)).toBeTruthy();
  });

  it('sem convite NÃO mostra o selo (cadastro sem vínculo)', () => {
    render(<ContaAlunoScreen />);
    expect(screen.queryByText(/Código recebido pelo link/i)).toBeNull();
  });
});
```
Run: `npx jest conta-aluno` → FAIL.

- [ ] **Step 2: Simplificar o `_layout.tsx` do grupo** (tela única não precisa de FormProvider compartilhado)

Substituir o conteúdo por:
```tsx
import { Stack } from 'expo-router';
import { StyleSheet } from 'react-native-unistyles';
import { View } from 'react-native';

// Grupo do cadastro do aluno — hoje uma tela única (conta enxuta do onboarding).
// O Stack permanece para futuras telas do grupo.
export default function CadastroLayout() {
  return (
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
  );
}

const styles = StyleSheet.create((theme) => ({
  root: { flex: 1, backgroundColor: theme.colors.bgBase },
  content: { backgroundColor: theme.colors.bgBase },
}));
```

- [ ] **Step 3: Remover os passos antigos**

```bash
git rm "app/(auth)/cadastro/passo-1-convite.tsx" "app/(auth)/cadastro/passo-2-voce.tsx" "app/(auth)/cadastro/passo-3-acesso.tsx"
```

- [ ] **Step 4: Reescrever `app/(auth)/cadastro/index.tsx` como a tela de conta**

A tela usa `useForm` PRÓPRIO (não há mais passos), `zodResolver(ContaAlunoFormSchema)`,
e reaproveita os blocos do antigo passo-3 (senha com hint + consentimento LGPD) e do
passo-2 (DateField de nascimento). Estrutura completa:

```tsx
// Conta do aluno — tela ÚNICA (história de onboarding: nome, telefone, e-mail, senha;
// nascimento mantido por exigência do backend real; convite vem do deep link).
// Com invite_code → register REAL com vínculo automático. Sem → contrato proposto
// [pendente no backend: invite_code opcional]; em dev o devMocks responde.
import { useEffect, useState } from 'react';
import {
  KeyboardAvoidingView,
  Linking,
  Platform,
  Pressable,
  ScrollView,
  Text as RNText,
  View,
} from 'react-native';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { router } from 'expo-router';
import { Check, CheckCircle } from 'phosphor-react-native';
import { StyleSheet } from 'react-native-unistyles';

import { AppText, Button, Input, ScreenHero } from '@/components/ui';
import { DateField, FormErrorBanner, FormField, MaskedField } from '@/components/molecules';
import { useRegisterMutation } from '@/features/auth/hooks';
import { authErrorMessage } from '@/features/auth/errors';
import { useCadastroDraftStore } from '@/store/cadastroDraftStore';
import { isApiError } from '@/api/errors';
import {
  ContaAlunoFormSchema,
  contaAlunoDefaults,
  buildAlunoRegisterBody,
  registerErrorField,
  type ContaAlunoForm,
} from '@/features/auth/contaForm';
import { goBackOr } from '@/lib/nav';
import { darkTheme } from '@/theme';

const { colors } = darkTheme;

const MIN_PASSWORD = 8;

// [ASSET TEMPORÁRIO] placeholder Unsplash até as fotos curadas chegarem.
const CONTA_PHOTO = {
  uri: 'https://images.unsplash.com/photo-1546483875-ad9014c88eba?w=1080&q=70&auto=format&fit=crop',
};

// [ajuste: definir URLs reais de termos de uso / política de privacidade]
const TERMS_URL = 'https://actus.fit/termos';
const PRIVACY_URL = 'https://actus.fit/privacidade';

export default function ContaAlunoScreen() {
  const inviteCode = useCadastroDraftStore((s) => s.inviteCode);
  const mutation = useRegisterMutation();

  const {
    control,
    getValues,
    setValue,
    watch,
    setError,
    formState: { errors },
  } = useForm<ContaAlunoForm>({
    resolver: zodResolver(ContaAlunoFormSchema),
    defaultValues: contaAlunoDefaults,
    mode: 'onSubmit',
  });

  const [formError, setFormError] = useState<string | null>(null);
  const [consent, setConsent] = useState(false);
  const [consentError, setConsentError] = useState(false);

  // invite_code do deep link: injeta UMA vez ao montar.
  useEffect(() => {
    if (inviteCode) setValue('invite_code', inviteCode);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const passwordValue = watch('password');
  const passwordMeetsLength = passwordValue.length >= MIN_PASSWORD;
  const hasInvite = Boolean(inviteCode);

  function toggleConsent() {
    setConsent((c) => !c);
    setConsentError(false);
  }

  function handleApiError(err: unknown) {
    if (!isApiError(err)) {
      setFormError(authErrorMessage('unknown'));
      return;
    }
    const target = registerErrorField(err.code, err.extras);
    if (target.campo) {
      setError(target.campo, {
        message: target.fieldMessage ?? authErrorMessage(err.code),
      });
      return;
    }
    setFormError(authErrorMessage(err.code));
  }

  function handleCreate() {
    setFormError(null);
    const values = getValues();
    if (values.password !== values.confirm_password) {
      setError('confirm_password', { message: 'As senhas não conferem.' });
      return;
    }
    if (!consent) {
      setConsentError(true);
      return;
    }
    mutation.mutate(buildAlunoRegisterBody(values), {
      onSuccess: () => {
        // NÃO limpar o draft aqui: o passo de vínculo do onboarding (Task 9) usa o
        // inviteCode para diferenciar "convidado" de "sem vínculo". O clear acontece
        // no fim do onboarding (corpo.tsx) e no markAndGo do vínculo.
        // O dispatch decide: onboarding pendente → /onboarding-aluno/foto.
        router.replace('/');
      },
      onError: handleApiError,
    });
  }

  return (
    <View style={styles.root}>
      <ScreenHero
        photo={CONTA_PHOTO}
        eyebrow="Sou aluno"
        title="Crie sua conta"
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
          {hasInvite ? (
            <View style={styles.inviteBadge}>
              <CheckCircle size={16} weight="duotone" color={colors.neon} />
              <AppText variant="metaSmall" color="secondary">
                Código recebido pelo link — seu vínculo é confirmado depois.
              </AppText>
            </View>
          ) : null}

          <FormErrorBanner message={formError} />

          <View style={styles.form}>
            <FormField
              control={control}
              name="full_name"
              label="Nome completo"
              autoCapitalize="words"
              autoComplete="name"
              textContentType="name"
              returnKeyType="next"
              error={errors.full_name?.message}
            />

            <Controller
              control={control}
              name="phone"
              render={({ field: { onChange, value } }) => (
                <MaskedField
                  label="Telefone"
                  mask="phone"
                  value={value}
                  onChangeText={onChange}
                  returnKeyType="next"
                  error={errors.phone?.message}
                />
              )}
            />

            <FormField
              control={control}
              name="email"
              label="E-mail"
              autoCapitalize="none"
              autoComplete="email"
              keyboardType="email-address"
              textContentType="emailAddress"
              returnKeyType="next"
              error={errors.email?.message}
            />

            <Controller
              control={control}
              name="birth_date"
              render={({ field: { onChange, value } }) => (
                <DateField
                  label="Nascimento"
                  value={value === '' ? null : value}
                  onChange={onChange}
                  error={errors.birth_date?.message}
                />
              )}
            />

            <View style={styles.field}>
              <Controller
                control={control}
                name="password"
                render={({ field: { onChange, onBlur, value } }) => (
                  <Input
                    label="Senha"
                    value={value}
                    onChangeText={onChange}
                    onBlur={onBlur}
                    secureToggle
                    autoCapitalize="none"
                    autoComplete="password-new"
                    textContentType="newPassword"
                    returnKeyType="next"
                    accessibilityLabel="Senha"
                    error={errors.password?.message}
                  />
                )}
              />
              <View style={styles.hint}>
                {passwordMeetsLength ? (
                  <Check size={12} weight="bold" color={colors.neon} />
                ) : null}
                <AppText
                  variant="metaSmall"
                  color={passwordMeetsLength ? 'neon' : 'tertiary'}
                  uppercase
                >
                  {passwordMeetsLength ? '8+ caracteres' : 'Mínimo de 8 caracteres'}
                </AppText>
              </View>
            </View>

            <Controller
              control={control}
              name="confirm_password"
              render={({ field: { onChange, onBlur, value } }) => (
                <Input
                  label="Confirmar senha"
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  secureToggle
                  autoCapitalize="none"
                  autoComplete="password-new"
                  textContentType="newPassword"
                  returnKeyType="go"
                  onSubmitEditing={handleCreate}
                  accessibilityLabel="Confirmar senha"
                  error={errors.confirm_password?.message}
                />
              )}
            />
          </View>

          {/* Consentimento LGPD (mesmo padrão do cadastro anterior). */}
          <View style={styles.consent}>
            <Pressable
              accessibilityRole="checkbox"
              accessibilityState={{ checked: consent }}
              accessibilityLabel="Li e aceito os termos de uso e a política de privacidade"
              hitSlop={11}
              onPress={toggleConsent}
              style={[
                styles.checkbox,
                consent ? styles.checkboxChecked : null,
                consentError ? styles.checkboxError : null,
              ]}
            >
              {consent ? <Check size={14} weight="bold" color={colors.textInverse} /> : null}
            </Pressable>
            <AppText variant="bodySm" color="tertiary" style={styles.consentText}>
              Li e aceito os{' '}
              <RNText
                style={styles.consentLink}
                accessibilityRole="link"
                onPress={() => void Linking.openURL(TERMS_URL)}
              >
                termos de uso
              </RNText>{' '}
              e a{' '}
              <RNText
                style={styles.consentLink}
                accessibilityRole="link"
                onPress={() => void Linking.openURL(PRIVACY_URL)}
              >
                política de privacidade
              </RNText>
              .
            </AppText>
          </View>
          {consentError ? (
            <AppText variant="bodySm" color="error" style={styles.consentErrorText}>
              Aceite os termos para criar a conta.
            </AppText>
          ) : null}

          <View style={styles.cta}>
            <Button
              variant="primary"
              label="Criar conta"
              loading={mutation.isPending}
              onPress={handleCreate}
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
  inviteBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.md,
  },
  form: { gap: theme.spacing.lg },
  field: { gap: theme.spacing.xs },
  hint: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing.xs },
  consent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: theme.spacing.sm,
    marginTop: theme.spacing.xl,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: theme.colors.outline,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxChecked: { backgroundColor: theme.colors.neon, borderColor: theme.colors.neon },
  checkboxError: { borderColor: theme.colors.error },
  consentText: { flex: 1 },
  consentLink: { color: theme.colors.neon, textDecorationLine: 'underline' },
  consentErrorText: { marginTop: theme.spacing.sm },
  cta: { marginTop: theme.spacing.xl },
}));
```
> Estilos do checkbox/consent: ESPELHE os do antigo `passo-3-acesso.tsx` se divergirem
> (leia antes do `git rm`, ou use `git show HEAD~1` — os nomes acima seguem o padrão).
> O submit usa `handleCreate` SEM rodar `trigger` do zod completo — igual ao fluxo
> antigo (validação de campo acontece no resolver no submit do RHF se preferir
> `handleSubmit`; mantenha o padrão do passo-3: getValues + checks manuais + mutate.
> Se preferir robustez, troque por `handleSubmit(onValid)` com os mesmos checks de
> confirmação/consent antes do mutate — escolha UMA forma e documente no código).

- [ ] **Step 5: Verificar + limpar referências mortas**

Run: `npx jest conta-aluno && npm run typecheck`
O typecheck DEVE acusar referências órfãs se algo ainda importar os passos removidos
(`grep -rn "passo-1-convite\|passo-2-voce\|passo-3-acesso\|cadastroForm" app/ src/ --include="*.ts*"`)
— o `cadastroForm.ts` antigo fica órfão: REMOVA `src/features/auth/cadastroForm.ts` se
nada mais o importar (provável), junto com o uso de `lastInviteError/lastCpfError` se
nenhum consumidor restar (mantenha `inviteCode` e `clear` no draft store).
Expected final: PASS + typecheck limpo.

- [ ] **Step 6: Commit**

```bash
git add -A "app/(auth)/cadastro/" src/features/auth/ src/store/cadastroDraftStore.ts
git commit -m "feat(onboarding): conta única do aluno (substitui wizard de 3 passos)"
```
> Exceção justificada ao "sem add de diretório": o grupo `cadastro/` teve remoções +
> reescrita; confirme com `git status` que SÓ esses arquivos estão staged antes do commit.

---

### Task 7: Conta do PROFESSOR + entrada

**Files:**
- Create: `app/(auth)/cadastro-pro.tsx` + Test: `app/(auth)/cadastro-pro.test.tsx` (rodar com `npx jest cadastro-pro`)
- Modify: `app/(auth)/escolha-perfil.tsx`
- Delete: `app/(auth)/professor-info.tsx`

- [ ] **Step 1: Teste falho**

```tsx
// app/(auth)/cadastro-pro.test.tsx
import { render, screen } from '@testing-library/react-native';

jest.mock('@/features/auth/hooks', () => ({
  useRegisterProfessionalMutation: () => ({ mutate: jest.fn(), isPending: false }),
}));

import CadastroProScreen from './cadastro-pro';

describe('Conta do professor', () => {
  it('renderiza os 4 campos do PDF + confirmação (sem nascimento, sem CREF)', () => {
    render(<CadastroProScreen />);
    expect(screen.getByLabelText('Nome completo')).toBeTruthy();
    expect(screen.getByLabelText('Telefone')).toBeTruthy();
    expect(screen.getByLabelText('E-mail')).toBeTruthy();
    expect(screen.getByLabelText('Senha')).toBeTruthy();
    expect(screen.queryByText('Nascimento')).toBeNull();
    expect(screen.queryByLabelText('CREF')).toBeNull();
  });
});
```

- [ ] **Step 2: Criar `app/(auth)/cadastro-pro.tsx`**

ESPELHO da conta do aluno (Task 6) com estes deltas exatos — copie o arquivo da Task 6
e aplique:
1. Form: `ContaProfessorFormSchema` / `contaProfessorDefaults` / `type ContaProfessorForm` / `buildProfessorRegisterBody`.
2. Mutation: `useRegisterProfessionalMutation` (de `@/features/auth/hooks`).
3. REMOVER: bloco do `inviteBadge`/`hasInvite`, o `Controller` de `birth_date`, os imports
   de `useCadastroDraftStore`/`DateField`/`CheckCircle` e o `useEffect` do invite.
4. Hero: `eyebrow="Sou professor"` · `title="Crie sua conta"` · mesmo onBack.
5. `handleApiError`: igual (registerErrorField serve — campos coincidem).
6. `onSuccess`: apenas `router.replace('/')` (sem clearDraft).
7. Comentário de topo:
```tsx
// Conta do professor (personal) — tela única, fiel ao PDF de onboarding: nome,
// telefone, e-mail, senha. Perfil profissional (nome/área/CREF) vem DEPOIS, no
// onboarding. Submit → POST /auth/register-professional [pendente no backend;
// devMocks responde em dev].
```

- [ ] **Step 3: Entrada + aposentadoria**

1. Em `app/(auth)/escolha-perfil.tsx`: na assinatura de `go(...)` trocar
   `'/(auth)/professor-info'` por `'/(auth)/cadastro-pro'`; no ChoiceCard "Sou professor":
   `onPress={() => go('/(auth)/cadastro-pro')}` e `description="Crio minha conta e convido meus alunos"`.
2. `git rm "app/(auth)/professor-info.tsx"`

- [ ] **Step 4: Verificar + commit**

Run: `npx jest cadastro-pro && npm run typecheck` → PASS; limpo.
```bash
git add "app/(auth)/cadastro-pro.tsx" "app/(auth)/cadastro-pro.test.tsx" "app/(auth)/escolha-perfil.tsx"
git commit -m "feat(onboarding): conta única do professor + entrada (aposenta professor-info)"
```

---

### Task 8: Scaffold do onboarding (OnboardingScreen + OptionCard + FotoStep)

**Files:**
- Create: `src/components/onboarding/OnboardingScreen.tsx` · `OptionCard.tsx` · `FotoStep.tsx` · `index.ts`
- Test: `src/components/onboarding/OptionCard.test.tsx`

- [ ] **Step 1: Teste falho**

```tsx
// src/components/onboarding/OptionCard.test.tsx
import { render, screen, fireEvent } from '@testing-library/react-native';
import { OptionCard } from './OptionCard';

describe('OptionCard', () => {
  it('mostra o rótulo e dispara onPress', () => {
    const onPress = jest.fn();
    render(<OptionCard label="Hipertrofia" selected={false} onPress={onPress} />);
    fireEvent.press(screen.getByText('Hipertrofia'));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('expõe o estado selecionado por acessibilidade', () => {
    render(<OptionCard label="Casa" selected onPress={jest.fn()} />);
    expect(screen.getByLabelText('Casa').props.accessibilityState?.selected).toBe(true);
  });
});
```
Run: `npx jest OptionCard` → FAIL.

- [ ] **Step 2: Componentes**

```tsx
// src/components/onboarding/OnboardingScreen.tsx
// Scaffold dos passos: eyebrow de progresso (ex.: "03 / 08"), título (uma pergunta
// principal por tela), conteúdo e CTA(s). 1 momento de motion: reveal de entrada.
import { useEffect, type ReactNode } from 'react';
import { ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { StyleSheet } from 'react-native-unistyles';

import { AppText, Button } from '@/components/ui';
import { darkTheme } from '@/theme';

const { motion } = darkTheme;

type Props = {
  step: number;
  total: number;
  title: string;
  subtitle?: string;
  children: ReactNode;
  ctaLabel: string;
  ctaDisabled?: boolean;
  ctaLoading?: boolean;
  onCta: () => void;
  // Pular (opcional): passos puláveis exibem o ghost abaixo do CTA.
  skipLabel?: string;
  onSkip?: () => void;
};

export function OnboardingScreen({
  step,
  total,
  title,
  subtitle,
  children,
  ctaLabel,
  ctaDisabled,
  ctaLoading,
  onCta,
  skipLabel,
  onSkip,
}: Props) {
  const opacity = useSharedValue(0);
  useEffect(() => {
    opacity.value = withTiming(1, { duration: motion.screenMs });
  }, [opacity]);
  const revealStyle = useAnimatedStyle(() => ({ opacity: opacity.value }));

  const progress = `${String(step).padStart(2, '0')} / ${String(total).padStart(2, '0')}`;

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <Animated.View style={[styles.flex, revealStyle]}>
        <ScrollView
          style={styles.flex}
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <AppText variant="eyebrow" color="neon">
            {progress}
          </AppText>
          <AppText variant="h2" style={styles.title}>
            {title}
          </AppText>
          {subtitle ? (
            <AppText variant="bodyMd" color="secondary" style={styles.subtitle}>
              {subtitle}
            </AppText>
          ) : null}

          <View style={styles.body}>{children}</View>

          <View style={styles.cta}>
            <Button
              variant="primary"
              label={ctaLabel}
              disabled={ctaDisabled}
              loading={ctaLoading}
              onPress={onCta}
            />
            {skipLabel && onSkip ? (
              <Button variant="ghost" label={skipLabel} onPress={onSkip} />
            ) : null}
          </View>
        </ScrollView>
      </Animated.View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create((theme) => ({
  safe: { flex: 1, backgroundColor: theme.colors.bgLowest },
  flex: { flex: 1 },
  content: {
    flexGrow: 1,
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.xl,
    paddingBottom: theme.spacing.lg,
  },
  title: { marginTop: theme.spacing.xs },
  subtitle: { marginTop: theme.spacing.sm },
  body: { marginTop: theme.spacing.xl, gap: theme.spacing.sm },
  cta: { marginTop: 'auto', paddingTop: theme.spacing.xl, gap: theme.spacing.md },
}));
```

```tsx
// src/components/onboarding/OptionCard.tsx
// Card selecionável (uma escolha por tela — história de baixa fricção).
import { Pressable } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';

import { AppText } from '@/components/ui';

type Props = {
  label: string;
  selected: boolean;
  onPress: () => void;
};

export function OptionCard({ label, selected, onPress }: Props) {
  styles.useVariants({ selected });
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ selected }}
      onPress={onPress}
      style={styles.card}
    >
      <AppText variant="bodyLg" color={selected ? 'inverse' : 'primary'}>
        {label}
      </AppText>
    </Pressable>
  );
}

const styles = StyleSheet.create((theme) => ({
  card: {
    borderRadius: theme.radius.card,
    borderWidth: 1,
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.lg,
    variants: {
      selected: {
        true: { backgroundColor: theme.colors.neon, borderColor: theme.colors.neon },
        false: {
          backgroundColor: theme.colors.surface1,
          borderColor: theme.colors.outlineVariant,
        },
      },
    },
  },
}));
```

```tsx
// src/components/onboarding/FotoStep.tsx
// Passo de foto (aluno e professor). "Adicionar foto" fica pendente:
// [pendente: expo-image-picker (rebuild do dev client) + endpoint de upload]
// — o passo existe e é pulável, fiel à história.
import { View } from 'react-native';
import { UserCircle } from 'phosphor-react-native';
import { StyleSheet } from 'react-native-unistyles';

import { AppText } from '@/components/ui';
import { OnboardingScreen } from './OnboardingScreen';
import { darkTheme } from '@/theme';

const { colors } = darkTheme;

type Props = {
  step: number;
  total: number;
  subtitle: string;
  onAdvance: () => void;
};

export function FotoStep({ step, total, subtitle, onAdvance }: Props) {
  return (
    <OnboardingScreen
      step={step}
      total={total}
      title="Adicione uma foto de perfil"
      subtitle={subtitle}
      ctaLabel="Adicionar foto"
      ctaDisabled
      onCta={() => undefined}
      skipLabel="Pular por enquanto"
      onSkip={onAdvance}
    >
      <View style={styles.avatarWrap}>
        <View style={styles.avatar}>
          <UserCircle size={64} weight="duotone" color={colors.textTertiary} />
        </View>
        <AppText variant="metaSmall" color="tertiary">
          Disponível em breve neste build.
        </AppText>
      </View>
    </OnboardingScreen>
  );
}

const styles = StyleSheet.create((theme) => ({
  avatarWrap: { alignItems: 'center', gap: theme.spacing.md, paddingVertical: theme.spacing.xl },
  avatar: {
    width: 120,
    height: 120,
    borderRadius: theme.radius.pill,
    backgroundColor: theme.colors.surface1,
    borderWidth: 1,
    borderColor: theme.colors.outlineVariant,
    alignItems: 'center',
    justifyContent: 'center',
  },
}));
```

```ts
// src/components/onboarding/index.ts
export { OnboardingScreen } from './OnboardingScreen';
export { OptionCard } from './OptionCard';
export { FotoStep } from './FotoStep';
```

- [ ] **Step 3: Verificar + commit**

Run: `npx jest OptionCard && npm run typecheck` → PASS; limpo.
```bash
git add src/components/onboarding/
git commit -m "feat(onboarding): scaffold (OnboardingScreen, OptionCard, FotoStep)"
```

---

### Task 9: Onboarding do ALUNO (todas as rotas do grupo — V11)

**Files:**
- Create: `app/onboarding-aluno/_layout.tsx` · `foto.tsx` · `vinculo.tsx` · `par-q.tsx` · `interesse.tsx` · `experiencia.tsx` · `frequencia.tsx` · `local.tsx` · `corpo.tsx`
- Test: `app/onboarding-aluno/quiz.test.tsx`

Ordem das 8 telas (total = 8): foto(1) → vinculo(2) → par-q(3) → interesse(4) →
experiencia(5) → frequencia(6) → local(7) → corpo(8).

- [ ] **Step 1: `_layout.tsx`** (guard: autenticado + aluno)

```tsx
import { Redirect, Stack } from 'expo-router';

import { useAuthStore } from '@/store/authStore';
import { AUTH_ENTRY, homeForTipo } from '@/lib/authRoutes';

// Onboarding pós-cadastro do aluno. Raiz (fora de (aluno)) com guard próprio.
// Sem header/voltar: conta criada, o fluxo só avança (passos puláveis quando cabível).
export default function OnboardingAlunoLayout() {
  const status = useAuthStore((s) => s.status);
  const user = useAuthStore((s) => s.user);

  if (status !== 'authenticated' || !user) return <Redirect href={AUTH_ENTRY} />;
  if (user.tipo !== 'aluno') return <Redirect href={homeForTipo(user.tipo)} />;

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
        animationDuration: 300,
        gestureEnabled: false,
      }}
    />
  );
}
```

- [ ] **Step 2: Helper local de avanço + telas de quiz**

Cada tela de quiz: lê/grava `saveStudentAnswers` e avança via `router.push`. Modelo
COMPLETO da primeira (as outras três seguem a MESMA forma trocando as constantes):

```tsx
// app/onboarding-aluno/interesse.tsx
import { useState } from 'react';
import { router } from 'expo-router';

import { OnboardingScreen, OptionCard } from '@/components/onboarding';
import { useAuthStore } from '@/store/authStore';
import {
  INTERESSE_LABEL,
  InteresseSchema,
  saveStudentAnswers,
} from '@/mocks/studentOnboarding';
import type { z } from 'zod';

type Interesse = z.infer<typeof InteresseSchema>;
const OPTIONS = InteresseSchema.options;

export default function InteresseScreen() {
  const user = useAuthStore((s) => s.user);
  const [value, setValue] = useState<Interesse | null>(null);

  async function advance() {
    if (!value || !user) return;
    await saveStudentAnswers(user.id, { interesse: value });
    router.push('/onboarding-aluno/experiencia');
  }

  return (
    <OnboardingScreen
      step={4}
      total={8}
      title="Qual seu principal interesse com o treino?"
      ctaLabel="Continuar"
      ctaDisabled={!value}
      onCta={() => void advance()}
    >
      {OPTIONS.map((opt) => (
        <OptionCard
          key={opt}
          label={INTERESSE_LABEL[opt]}
          selected={value === opt}
          onPress={() => setValue(opt)}
        />
      ))}
    </OnboardingScreen>
  );
}
```

`experiencia.tsx` (step 5 → push `/onboarding-aluno/frequencia`): mesmo arquivo com
`ExperienciaSchema`/`EXPERIENCIA_LABEL`, campo `{ experiencia: value }`, título
"Qual seu nível de treino?".
`frequencia.tsx` (step 6 → `/onboarding-aluno/local`): `DiasSemanaSchema`, rótulo = o
próprio valor (`'1'…'5+'` — labels inline `{ '1': '1', ... }` ou exibir `opt` direto),
campo `{ dias_semana: value }`, título "Quantos dias por semana você quer treinar?".
`local.tsx` (step 7 → `/onboarding-aluno/corpo`): `LocalTreinoSchema`/`LOCAL_LABEL`,
campo `{ local: value }`, título "Onde você treina?".

- [ ] **Step 3: `foto.tsx`**

```tsx
import { router } from 'expo-router';

import { FotoStep } from '@/components/onboarding';

export default function FotoAlunoScreen() {
  return (
    <FotoStep
      step={1}
      total={8}
      subtitle="Seu personal reconhece você com mais facilidade."
      onAdvance={() => router.push('/onboarding-aluno/vinculo')}
    />
  );
}
```

- [ ] **Step 4: `vinculo.tsx`** (3 estados: convidado no register / código manual / seguir sem)

```tsx
// Vínculo com o profissional. Quem registrou COM convite já está vinculado (o register
// real cria o vínculo) — aqui é o reconhecimento visual da história ("Você foi
// convidado por…", nome real quando o preview existir). Sem convite: código manual
// (consume REAL) ou seguir sem vínculo.
import { useState } from 'react';
import { View } from 'react-native';
import { router } from 'expo-router';
import { UserCircle } from 'phosphor-react-native';
import { StyleSheet } from 'react-native-unistyles';

import { AppText, Input } from '@/components/ui';
import { OnboardingScreen } from '@/components/onboarding';
import { useAuthStore } from '@/store/authStore';
import { useCadastroDraftStore } from '@/store/cadastroDraftStore';
import { useConsumeInvite } from '@/hooks/useConsumeInvite';
import { authErrorMessage } from '@/features/auth/errors';
import { isApiError } from '@/api/errors';
import { saveStudentAnswers } from '@/mocks/studentOnboarding';
import { darkTheme } from '@/theme';

const { colors } = darkTheme;

const CODE_RE = /^[A-Za-z0-9_-]{3,200}$/;
const NEXT = '/onboarding-aluno/par-q';

export default function VinculoScreen() {
  const user = useAuthStore((s) => s.user);
  // O code do deep link sobrevive no draft até aqui (não foi limpo? O register limpa).
  // Fonte da verdade do caminho convidado: o draft FOI usado no register — aqui só
  // diferenciamos pela presença do code residual; se o clear já rodou, caímos no
  // caminho manual, que é inofensivo (consume de novo → note already_linked).
  const inviteCode = useCadastroDraftStore((s) => s.inviteCode);
  const consume = useConsumeInvite();

  const [code, setCode] = useState('');
  const [error, setError] = useState<string | null>(null);

  const invited = Boolean(inviteCode);

  async function markAndGo(link: 'invited' | 'linked' | 'none') {
    if (user) await saveStudentAnswers(user.id, { link_status: link });
    router.push(NEXT);
  }

  function confirmInvited() {
    void markAndGo('invited');
  }

  function confirmManual() {
    setError(null);
    const trimmed = code.trim();
    if (!CODE_RE.test(trimmed)) {
      setError('Código de convite inválido.');
      return;
    }
    consume.mutate(trimmed, {
      onSuccess: () => void markAndGo('linked'),
      onError: (err) => {
        setError(isApiError(err) ? authErrorMessage(err.code) : authErrorMessage('unknown'));
      },
    });
  }

  return (
    <OnboardingScreen
      step={2}
      total={8}
      title={invited ? 'Confirme seu vínculo' : 'Você tem um convite?'}
      subtitle={
        invited
          ? 'Seu personal te convidou — confirme para ele acompanhar seu treino.'
          : 'Cole o código do convite ou siga sem vínculo por enquanto.'
      }
      ctaLabel="Confirmar vínculo"
      ctaDisabled={!invited && code.trim().length === 0}
      ctaLoading={consume.isPending}
      onCta={invited ? confirmInvited : confirmManual}
      skipLabel={invited ? undefined : 'Seguir sem vínculo'}
      onSkip={invited ? undefined : () => void markAndGo('none')}
    >
      <View style={styles.card}>
        <View style={styles.icon}>
          <UserCircle size={26} weight="duotone" color={colors.neon} />
        </View>
        <View style={styles.info}>
          <AppText variant="h4">Convite de profissional</AppText>
          <AppText variant="bodySm" color="tertiary">
            {invited
              ? 'Confirmamos quem te convidou ao criar a conta.'
              : 'O vínculo deixa seu treino visível para o profissional.'}
          </AppText>
        </View>
      </View>

      {!invited ? (
        <Input
          label="Código do convite"
          value={code}
          onChangeText={(t) => {
            if (error) setError(null);
            setCode(t);
          }}
          autoCapitalize="none"
          autoCorrect={false}
          style={styles.codeInput}
          error={error ?? undefined}
        />
      ) : null}
    </OnboardingScreen>
  );
}

const styles = StyleSheet.create((theme) => ({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
    backgroundColor: theme.colors.surface1,
    borderWidth: 1,
    borderColor: theme.colors.outlineVariant,
    borderRadius: theme.radius.card,
    padding: theme.spacing.md,
  },
  icon: {
    width: 42,
    height: 42,
    borderRadius: theme.radius.pill,
    backgroundColor: theme.colors.surface2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  info: { flex: 1, gap: 2 },
  codeInput: { fontFamily: theme.fontFamily.mono, letterSpacing: 1 },
}));
```
> NOTA: na Task 6 o `onSuccess` do register chama `clearDraft()` — para o `invited`
> funcionar aqui, MUDE a Task 6: NÃO limpar o draft no sucesso (o clear passa a
> acontecer no fim do onboarding, Task 9/`corpo.tsx`, ou no `markAndGo`). Ajuste:
> em `conta/index.tsx`, remova `clearDraft()` do onSuccess; aqui em `markAndGo`,
> adicione `useCadastroDraftStore.getState().clear()` após salvar. Implementador:
> aplique este ajuste na Task 6 já na primeira escrita (registrado aqui por ordem
> de leitura).

- [ ] **Step 5: `par-q.tsx`** (reuso dos átomos/mock do Par-Q — obrigatório, sem pular)

```tsx
// PAR-Q como passo do onboarding (obrigatório). Reusa as perguntas, a linha de
// toggle e o mock persistido do Par-Q já entregue (src/mocks/parq.ts).
import { useMemo, useState } from 'react';
import { View } from 'react-native';
import { router } from 'expo-router';

import { OnboardingScreen } from '@/components/onboarding';
import { ParqQuestionRow } from '@/components/parq';
import { useAuthStore } from '@/store/authStore';
import { submitParq } from '@/mocks/parq';
import { PARQ_QUESTIONS, type ParqAnswer, type ParqQuestionId } from '@/types/parq';

export default function ParqOnboardingScreen() {
  const user = useAuthStore((s) => s.user);
  const [values, setValues] = useState<Partial<Record<ParqQuestionId, boolean>>>({});
  const [saving, setSaving] = useState(false);

  const allAnswered = useMemo(
    () => PARQ_QUESTIONS.every((q) => typeof values[q.id] === 'boolean'),
    [values],
  );

  async function advance() {
    if (!allAnswered || !user || saving) return;
    setSaving(true);
    const answers: ParqAnswer[] = PARQ_QUESTIONS.map((q) => ({
      question_id: q.id,
      value: values[q.id] as boolean,
    }));
    try {
      await submitParq(user.id, answers);
      router.push('/onboarding-aluno/interesse');
    } finally {
      setSaving(false);
    }
  }

  return (
    <OnboardingScreen
      step={3}
      total={8}
      title="Antes de começar"
      subtitle="Sete perguntas rápidas sobre sua saúde — seu personal usa isso para montar treinos seguros."
      ctaLabel="Enviar respostas"
      ctaDisabled={!allAnswered || saving}
      ctaLoading={saving}
      onCta={() => void advance()}
    >
      <View>
        {PARQ_QUESTIONS.map((q) => (
          <ParqQuestionRow
            key={q.id}
            text={q.text}
            value={values[q.id] ?? null}
            onChange={(v) => setValues((prev) => ({ ...prev, [q.id]: v }))}
          />
        ))}
      </View>
    </OnboardingScreen>
  );
}
```

- [ ] **Step 6: `corpo.tsx`** (peso REAL via PATCH /me; altura mock; pulável; FINALIZA)

```tsx
// Peso e altura (puláveis — critério de aceite). Peso vai REAL (PATCH /me,
// body_weight_kg 20–400). Altura: [MOCK até o back ter campo]. Ao concluir OU pular,
// marca o onboarding como feito e entra na home.
import { useState } from 'react';
import { router } from 'expo-router';

import { Input } from '@/components/ui';
import { OnboardingScreen } from '@/components/onboarding';
import { useAuthStore } from '@/store/authStore';
import { usePatchMe } from '@/hooks/usePatchMe';
import { saveStudentAnswers } from '@/mocks/studentOnboarding';
import { useOnboardingStore } from '@/store/onboardingStore';
import { useCadastroDraftStore } from '@/store/cadastroDraftStore';
import { homeForTipo } from '@/lib/authRoutes';

// "98,7" → 98.7 (aceita vírgula ou ponto); null se não numérico.
function parseDecimal(v: string): number | null {
  const n = Number(v.replace(',', '.'));
  return Number.isFinite(n) ? n : null;
}

export default function CorpoScreen() {
  const user = useAuthStore((s) => s.user);
  const patchMe = usePatchMe();
  const markDone = useOnboardingStore((s) => s.markDone);
  const clearDraft = useCadastroDraftStore((s) => s.clear);

  const [peso, setPeso] = useState('');
  const [altura, setAltura] = useState('');
  const [pesoError, setPesoError] = useState<string | null>(null);
  const [alturaError, setAlturaError] = useState<string | null>(null);

  async function finish() {
    if (!user) return;
    clearDraft();
    await markDone(user.id);
    router.replace(homeForTipo('aluno'));
  }

  async function save() {
    if (!user) return;
    setPesoError(null);
    setAlturaError(null);

    const kg = peso.trim() === '' ? null : parseDecimal(peso);
    const m = altura.trim() === '' ? null : parseDecimal(altura);

    if (peso.trim() !== '' && (kg === null || kg < 20 || kg > 400)) {
      setPesoError('Peso entre 20 e 400 kg.');
      return;
    }
    if (altura.trim() !== '' && (m === null || m < 1 || m > 2.5)) {
      setAlturaError('Altura entre 1,00 e 2,50 m.');
      return;
    }

    if (m !== null) {
      await saveStudentAnswers(user.id, { altura_cm: Math.round(m * 100) });
    }
    if (kg !== null) {
      patchMe.mutate(
        { body_weight_kg: kg },
        { onSuccess: () => void finish(), onError: () => void finish() },
      );
      return; // finish roda no callback (não bloqueia o aluno por erro de peso).
    }
    await finish();
  }

  return (
    <OnboardingScreen
      step={8}
      total={8}
      title="Seu corpo"
      subtitle="Ajuda seu personal a calibrar o treino. Você pode preencher depois."
      ctaLabel="Concluir"
      ctaLoading={patchMe.isPending}
      onCta={() => void save()}
      skipLabel="Pular por enquanto"
      onSkip={() => void finish()}
    >
      <Input
        label="Peso atual (kg)"
        value={peso}
        onChangeText={setPeso}
        keyboardType="decimal-pad"
        placeholder="98,7"
        error={pesoError ?? undefined}
      />
      <Input
        label="Altura (m)"
        value={altura}
        onChangeText={setAltura}
        keyboardType="decimal-pad"
        placeholder="1,98"
        error={alturaError ?? undefined}
      />
    </OnboardingScreen>
  );
}
```

- [ ] **Step 7: Teste do quiz** (uma tela representativa + avanço)

```tsx
// app/onboarding-aluno/quiz.test.tsx
import { render, screen, fireEvent, waitFor } from '@testing-library/react-native';

jest.mock('expo-secure-store', () => ({
  getItemAsync: jest.fn(async () => null),
  setItemAsync: jest.fn(async () => undefined),
  deleteItemAsync: jest.fn(async () => undefined),
}));
const mockPush = jest.fn();
jest.mock('expo-router', () => ({
  router: { push: (...a: unknown[]) => mockPush(...a), replace: jest.fn() },
}));

import InteresseScreen from './interesse';
import { useAuthStore } from '@/store/authStore';
import { useStudentOnboardingMock } from '@/mocks/studentOnboarding';

describe('onboarding aluno — quiz', () => {
  beforeEach(() => {
    mockPush.mockClear();
    useAuthStore.setState({
      status: 'authenticated',
      user: { id: 'aluno-1', tipo: 'aluno' } as never,
    });
    useStudentOnboardingMock.setState({ byStudent: {}, hydrated: true });
  });

  it('CTA travado até escolher; escolha grava e avança', async () => {
    render(<InteresseScreen />);
    const cta = screen.getByLabelText('Continuar');
    expect(cta.props.accessibilityState?.disabled).toBe(true);

    fireEvent.press(screen.getByText('Hipertrofia'));
    fireEvent.press(screen.getByText('Continuar'));

    await waitFor(() => {
      expect(useStudentOnboardingMock.getState().byStudent['aluno-1']?.interesse).toBe(
        'hipertrofia',
      );
    });
    expect(mockPush).toHaveBeenCalledWith('/onboarding-aluno/experiencia');
  });
});
```

- [ ] **Step 8: Verificar + commit** (grupo completo de uma vez — V11)

Run: `npx jest onboarding-aluno && npm run typecheck` → PASS; limpo.
```bash
git add app/onboarding-aluno/
git commit -m "feat(onboarding): fluxo completo do aluno (foto, vínculo, PAR-Q, quiz, corpo)"
```

---

### Task 10: Onboarding do PROFESSOR

**Files:**
- Create: `app/onboarding-professor/_layout.tsx` · `foto.tsx` · `perfil.tsx` · `forma-uso.tsx` · `convite.tsx`
- Test: `app/onboarding-professor/perfil.test.tsx`

Total = 4 passos: foto(1) → perfil(2) → forma-uso(3) → convite(4).

- [ ] **Step 1: `_layout.tsx`** — espelho do `_layout` da Task 9 trocando o guard:
`if (user.tipo !== 'personal') return <Redirect href={homeForTipo(user.tipo)} />;`
e o comentário ("Onboarding pós-cadastro do professor (personal)").

- [ ] **Step 2: `foto.tsx`**

```tsx
import { router } from 'expo-router';

import { FotoStep } from '@/components/onboarding';

export default function FotoProfessorScreen() {
  return (
    <FotoStep
      step={1}
      total={4}
      subtitle="Adicione uma foto para seus alunos reconhecerem você com mais facilidade."
      onAdvance={() => router.push('/onboarding-professor/perfil')}
    />
  );
}
```

- [ ] **Step 3: `perfil.tsx`** (nome profissional + área obrigatórios; CREF/exp/cidade opcionais)

```tsx
// Perfil profissional mínimo (PDF): nome profissional + área de atuação obrigatórios;
// CREF, tempo de experiência e Cidade/UF opcionais — [MOCK até endpoint existir].
import { useState } from 'react';
import { router } from 'expo-router';

import { Input } from '@/components/ui';
import { OnboardingScreen, OptionCard } from '@/components/onboarding';
import { useAuthStore } from '@/store/authStore';
import {
  AREA_LABEL,
  AreaAtuacaoSchema,
  saveProfessionalProfile,
} from '@/mocks/professionalProfile';
import type { z } from 'zod';

type Area = z.infer<typeof AreaAtuacaoSchema>;
const AREAS = AreaAtuacaoSchema.options;

export default function PerfilProfissionalScreen() {
  const user = useAuthStore((s) => s.user);
  const [nome, setNome] = useState('');
  const [area, setArea] = useState<Area | null>(null);
  const [cref, setCref] = useState('');
  const [experiencia, setExperiencia] = useState('');
  const [cidade, setCidade] = useState('');
  const [nomeError, setNomeError] = useState<string | null>(null);

  async function advance() {
    if (!user) return;
    if (nome.trim().length < 2) {
      setNomeError('Informe seu nome profissional.');
      return;
    }
    if (!area) return;
    await saveProfessionalProfile(user.id, {
      nome_profissional: nome.trim(),
      area,
      cref: cref.trim() || undefined,
      experiencia_anos: experiencia.trim() || undefined,
      cidade_uf: cidade.trim() || undefined,
    });
    router.push('/onboarding-professor/forma-uso');
  }

  return (
    <OnboardingScreen
      step={2}
      total={4}
      title="Conte o básico sobre sua atuação"
      subtitle="CREF e demais dados podem ser preenchidos depois, no perfil."
      ctaLabel="Continuar"
      ctaDisabled={nome.trim().length < 2 || !area}
      onCta={() => void advance()}
    >
      <Input
        label="Nome profissional"
        value={nome}
        onChangeText={(t) => {
          if (nomeError) setNomeError(null);
          setNome(t);
        }}
        autoCapitalize="words"
        error={nomeError ?? undefined}
      />
      {AREAS.map((a) => (
        <OptionCard
          key={a}
          label={AREA_LABEL[a]}
          selected={area === a}
          onPress={() => setArea(a)}
        />
      ))}
      <Input label="CREF · opcional" value={cref} onChangeText={setCref} autoCapitalize="characters" />
      <Input
        label="Tempo de experiência · opcional"
        value={experiencia}
        onChangeText={setExperiencia}
      />
      <Input label="Cidade/UF · opcional" value={cidade} onChangeText={setCidade} />
    </OnboardingScreen>
  );
}
```

- [ ] **Step 4: `forma-uso.tsx`** (pulável) — mesma forma do quiz do aluno:
`FormaUsoSchema`/`FORMA_USO_LABEL` de `@/mocks/professionalProfile`, grava
`saveProfessionalProfile(user.id, { forma_uso: value })`, `step={3} total={4}`,
título "O que você quer fazer primeiro na Actus?", `skipLabel="Pular"` com
`onSkip={() => router.push('/onboarding-professor/convite')}`, avanço para
`/onboarding-professor/convite`.

- [ ] **Step 5: `convite.tsx`** (reusa o fluxo real; pulável; FINALIZA)

```tsx
// Convide seu primeiro aluno — reusa o fluxo REAL de convites (/convite/novo).
// "Inserir aluno manualmente" = [fluxo futuro] (sem endpoint). Pular finaliza.
import { router } from 'expo-router';
import { View } from 'react-native';
import { PaperPlaneTilt } from 'phosphor-react-native';
import { StyleSheet } from 'react-native-unistyles';

import { AppText } from '@/components/ui';
import { OnboardingScreen } from '@/components/onboarding';
import { useAuthStore } from '@/store/authStore';
import { useOnboardingStore } from '@/store/onboardingStore';
import { homeForTipo } from '@/lib/authRoutes';
import { darkTheme } from '@/theme';

const { colors } = darkTheme;

export default function ConviteOnboardingScreen() {
  const user = useAuthStore((s) => s.user);
  const markDone = useOnboardingStore((s) => s.markDone);

  async function finish(thenInvite: boolean) {
    if (!user) return;
    await markDone(user.id);
    if (thenInvite) {
      // Home primeiro (replace) e o fluxo real de convite por cima (push):
      // ao fechar o convite, o professor está na home — onboarding não volta.
      router.replace(homeForTipo('personal'));
      router.push('/convite/novo');
      return;
    }
    router.replace(homeForTipo('personal'));
  }

  return (
    <OnboardingScreen
      step={4}
      total={4}
      title="Convide seu primeiro aluno"
      subtitle="Você compartilha um link; o aluno cria a conta já vinculada a você."
      ctaLabel="Convidar aluno"
      onCta={() => void finish(true)}
      skipLabel="Pular por enquanto"
      onSkip={() => void finish(false)}
    >
      <View style={styles.hero}>
        <PaperPlaneTilt size={56} weight="duotone" color={colors.neon} />
        <AppText variant="bodyMd" color="secondary" style={styles.text}>
          O convite é o jeito mais rápido de trazer um aluno — leva menos de um minuto.
        </AppText>
      </View>
    </OnboardingScreen>
  );
}

const styles = StyleSheet.create((theme) => ({
  hero: { alignItems: 'center', gap: theme.spacing.md, paddingVertical: theme.spacing.xl },
  text: { textAlign: 'center' },
}));
```

- [ ] **Step 6: Teste do perfil**

```tsx
// app/onboarding-professor/perfil.test.tsx
import { render, screen, fireEvent, waitFor } from '@testing-library/react-native';

jest.mock('expo-secure-store', () => ({
  getItemAsync: jest.fn(async () => null),
  setItemAsync: jest.fn(async () => undefined),
  deleteItemAsync: jest.fn(async () => undefined),
}));
const mockPush = jest.fn();
jest.mock('expo-router', () => ({
  router: { push: (...a: unknown[]) => mockPush(...a), replace: jest.fn() },
}));

import PerfilProfissionalScreen from './perfil';
import { useAuthStore } from '@/store/authStore';
import { useProfessionalProfileMock } from '@/mocks/professionalProfile';

describe('onboarding professor — perfil', () => {
  beforeEach(() => {
    mockPush.mockClear();
    useAuthStore.setState({
      status: 'authenticated',
      user: { id: 'prof-1', tipo: 'personal' } as never,
    });
    useProfessionalProfileMock.setState({ byUser: {}, hydrated: true });
  });

  it('exige nome + área; grava e avança', async () => {
    render(<PerfilProfissionalScreen />);
    const cta = screen.getByLabelText('Continuar');
    expect(cta.props.accessibilityState?.disabled).toBe(true);

    fireEvent.changeText(screen.getByLabelText('Nome profissional'), 'João Personal');
    fireEvent.press(screen.getByText('Musculação'));
    fireEvent.press(screen.getByText('Continuar'));

    await waitFor(() => {
      expect(
        useProfessionalProfileMock.getState().byUser['prof-1']?.nome_profissional,
      ).toBe('João Personal');
    });
    expect(mockPush).toHaveBeenCalledWith('/onboarding-professor/forma-uso');
  });
});
```

- [ ] **Step 7: Verificar + commit**

Run: `npx jest onboarding-professor && npm run typecheck` → PASS; limpo.
```bash
git add app/onboarding-professor/
git commit -m "feat(onboarding): fluxo completo do professor (foto, perfil, forma de uso, convite)"
```

---

### Task 11: Homes por estado + visão do personal + atalho no perfil

**Files:**
- Modify: `app/(aluno)/(tabs)/index.tsx` · `src/components/professional/StudentsScreen.tsx` · `StudentDetailScreen.tsx` · `src/components/professional/index.ts` · `src/components/account/AccountScreen.tsx`
- Create: `src/components/professional/PreferencesSection.tsx` + Test: `PreferencesSection.test.tsx`

- [ ] **Step 1: PreferencesSection (teste falho → componente)**

```tsx
// src/components/professional/PreferencesSection.test.tsx
import { render, screen } from '@testing-library/react-native';

jest.mock('expo-secure-store', () => ({
  getItemAsync: jest.fn(async () => null),
  setItemAsync: jest.fn(async () => undefined),
  deleteItemAsync: jest.fn(async () => undefined),
}));

import { PreferencesSection } from './PreferencesSection';
import { useStudentOnboardingMock } from '@/mocks/studentOnboarding';

describe('PreferencesSection', () => {
  it('não renderiza nada sem respostas', () => {
    useStudentOnboardingMock.setState({ byStudent: {}, hydrated: true });
    const { toJSON } = render(<PreferencesSection studentId="x" />);
    expect(toJSON()).toBeNull();
  });

  it('lista as respostas do aluno', () => {
    useStudentOnboardingMock.setState({
      byStudent: {
        'aluno-1': { interesse: 'hipertrofia', dias_semana: '3', local: 'casa' },
      },
      hydrated: true,
    });
    render(<PreferencesSection studentId="aluno-1" />);
    expect(screen.getByText('Hipertrofia')).toBeTruthy();
    expect(screen.getByText(/3/)).toBeTruthy();
    expect(screen.getByText('Casa')).toBeTruthy();
  });
});
```

```tsx
// src/components/professional/PreferencesSection.tsx
// Preferências do onboarding do aluno (interesse, experiência, dias, local, altura).
// [MOCK até o back expor — mesma limitação dev-only do Par-Q, documentada no spec]
import { View } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';

import { AppText } from '@/components/ui';
import {
  EXPERIENCIA_LABEL,
  INTERESSE_LABEL,
  LOCAL_LABEL,
  useStudentAnswers,
} from '@/mocks/studentOnboarding';

type Props = { studentId: string };

export function PreferencesSection({ studentId }: Props) {
  const answers = useStudentAnswers(studentId);
  if (!answers || Object.keys(answers).length === 0) return null;

  const rows: Array<{ label: string; value: string }> = [];
  if (answers.interesse) rows.push({ label: 'Interesse', value: INTERESSE_LABEL[answers.interesse] });
  if (answers.experiencia)
    rows.push({ label: 'Experiência', value: EXPERIENCIA_LABEL[answers.experiencia] });
  if (answers.dias_semana)
    rows.push({ label: 'Dias por semana', value: answers.dias_semana });
  if (answers.local) rows.push({ label: 'Local de treino', value: LOCAL_LABEL[answers.local] });
  if (answers.altura_cm)
    rows.push({ label: 'Altura', value: `${(answers.altura_cm / 100).toFixed(2)} m` });
  if (rows.length === 0) return null;

  return (
    <View style={styles.section}>
      <AppText variant="label" color="secondary">
        Preferências
      </AppText>
      <View style={styles.list}>
        {rows.map((r) => (
          <View key={r.label} style={styles.row}>
            <AppText variant="bodySm" color="tertiary" style={styles.rowLabel}>
              {r.label}
            </AppText>
            <AppText variant="bodySm" color="secondary">
              {r.value}
            </AppText>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create((theme) => ({
  section: {
    backgroundColor: theme.colors.surface1,
    borderRadius: theme.radius.card,
    padding: theme.spacing.md,
    gap: theme.spacing.sm,
  },
  list: { gap: theme.spacing.xs },
  row: { flexDirection: 'row', justifyContent: 'space-between', gap: theme.spacing.sm },
  rowLabel: { flexShrink: 0 },
}));
```

Barrel `src/components/professional/index.ts`: append
`export { PreferencesSection } from './PreferencesSection';`
`StudentDetailScreen.tsx`: inserir `<PreferencesSection studentId={id} />` logo APÓS o
`<ParqSection studentId={id} />` existente (mesma região; import junto ao do ParqSection).

- [ ] **Step 2: Home do aluno por estado**

Em `app/(aluno)/(tabs)/index.tsx` (leia o arquivo; edições mínimas):
1. Imports: `import { useStudentAnswers } from '@/mocks/studentOnboarding';`
2. No componente: `const answers = useStudentAnswers(me.data?.id);`
3. No bloco onde NÃO há treino do dia (localize o branch que hoje mostra estado
   vazio/próximo treino — `pickNextWorkout`/`TodayWorkoutCard` com `has_workout`
   false), envolva a mensagem com o estado do vínculo:
```tsx
            {answers?.link_status === 'none' ? (
              <View style={styles.statusCard}>
                <AppText variant="bodyMd" color="secondary">
                  Você ainda não tem um personal vinculado.
                </AppText>
                <Button
                  variant="secondary"
                  label="Usar convite"
                  onPress={() => router.push('/usar-convite' as Href)}
                />
              </View>
            ) : (
              <View style={styles.statusCard}>
                <AppText variant="bodyMd" color="secondary">
                  Seu personal já recebeu suas informações e poderá preparar seu treino.
                </AppText>
              </View>
            )}
```
4. Estilo: `statusCard: { backgroundColor: theme.colors.surface1, borderRadius: theme.radius.card, padding: theme.spacing.md, gap: theme.spacing.md }` no StyleSheet da tela.
> `Button` pode não estar importado na Home — adicione ao import de `@/components/ui`.
> O branch exato: a Home usa `TodayWorkoutSummary`; se a estrutura divergir do descrito,
> renderize o statusCard no lugar do estado vazio atual do card de treino — o critério
> é: SEM treino atribuído → mensagem por vínculo; COM treino → comportamento atual.

- [ ] **Step 3: Empty state do professor**

Em `src/components/professional/StudentsScreen.tsx`, localize o branch `isEmpty`
(renderiza `ListState` vazio). Substitua/acrescente CTAs abaixo do estado vazio:
```tsx
            <View style={styles.emptyCtas}>
              <Button
                variant="primary"
                label="Convidar aluno"
                onPress={openInvite}
              />
              <Button
                variant="secondary"
                label="Criar primeiro treino"
                onPress={() => router.push('/montar-treino' as Href)}
              />
            </View>
```
Copy do vazio (se o `ListState` aceitar mensagem): "Comece convidando um aluno ou
criando seu primeiro treino." Estilo: `emptyCtas: { gap: theme.spacing.md, marginTop: theme.spacing.lg }`.
Imports: `Button` no import de `@/components/ui` (se ausente).

- [ ] **Step 4: Atalho "Usar convite" no perfil do aluno**

Em `src/components/account/AccountScreen.tsx`:
1. Import do ícone `Ticket` (adicionar ao import de `phosphor-react-native`).
2. Após o ActionRow "Editar perfil":
```tsx
          {tipo === 'aluno' ? (
            <ActionRow
              icon={<Ticket size={20} weight="duotone" color={colors.onSurface} />}
              label="Usar convite"
              onPress={() => router.push('/usar-convite' as Href)}
            />
          ) : null}
```

- [ ] **Step 5: Verificar + commit**

Run: `npx jest PreferencesSection && npm run typecheck && npx jest src/components/account src/components/professional` → PASS; limpo.
```bash
git add src/components/professional/PreferencesSection.tsx src/components/professional/PreferencesSection.test.tsx src/components/professional/index.ts src/components/professional/StudentDetailScreen.tsx src/components/professional/StudentsScreen.tsx src/components/account/AccountScreen.tsx "app/(aluno)/(tabs)/index.tsx"
git commit -m "feat(onboarding): homes por estado, preferências no detalhe do aluno e atalho de convite"
```

---

### Task 12: Sinais pro backend + verificação final

**Files:** Modify: `AGENTS.md`

- [ ] **Step 1: Pendências (seção "Pendências conhecidas")**

```markdown
- Onboarding (história aluno + PDF professor) — sinais consolidados ao backend:
  1. `POST /auth/register`: tornar `invite_code` e `birth_date` opcionais (cadastro sem vínculo, baixa fricção). Front pronto; sem convite só funciona via devMocks até lá.
  2. `POST /auth/register-professional` (novo): { email, password ≥8, full_name, phone, lgpd_consent, policy_version } → cria `profiles.tipo='personal'` ATIVO + tokens (igual register). Perfil profissional vem depois (item 6).
  3. `GET /invites/:code/preview` (reforço): incluir NOME do profissional + `professional_role` — requisito da história ("Você foi convidado por João Personal").
  4. Upload de foto de perfil (aluno e professor) + campo no /me. Front tem o passo com [pendente: expo-image-picker → exigirá rebuild do dev client quando entrar].
  5. Preferências do aluno (interesse, experiência, dias/semana, local, altura) — persistir e expor ao profissional vinculado. Front roda sobre `src/mocks/studentOnboarding.ts`.
  6. Perfil profissional (nome profissional, área de atuação, CREF opcional, experiência, cidade/UF, forma de uso) — persistir/expor. Front roda sobre `src/mocks/professionalProfile.ts`.
  7. Flag de onboarding concluído no /me (hoje gate local em `src/store/onboardingStore.ts`).
```

- [ ] **Step 2: Suíte completa**

Run: `npm run typecheck && npm run lint && npx jest`
Expected: zero erro de tipo; lint limpo nos arquivos do ciclo; todos os testes verdes
(a baseline da Task 0 já está triada).

- [ ] **Step 3: Commit**

```bash
git add AGENTS.md
git commit -m "docs(onboarding): sinais consolidados ao backend"
```

- [ ] **Step 4: Roteiro de QA manual (designer, dev build com bypass)**

1. **Aluno por convite**: deep link `actus://register?code=ACTUSDEMO` deslogado → conta única com selo do código → criar → onboarding: foto (pular) → vínculo (confirmar) → PAR-Q (responder, 1 sim) → interesse → experiência → dias → local → corpo (peso 98,7) → home com treino/mensagem.
2. **Aluno sem convite**: escolha-perfil → "Sou aluno" → conta sem selo → criar (mock) → vínculo: digitar ACTUSDEMO (consume) OU "Seguir sem vínculo" → … → home mostra "sem personal" + Usar convite quando seguiu sem.
3. **Professor**: "Sou professor" → conta 4 campos → criar (mock; entra como personal) → foto (pular) → perfil (nome + Musculação) → forma de uso (pular) → convite (pular) → home Alunos com CTAs de vazio.
4. **Personal vê**: detalhe do aluno mostra Prontidão (Par-Q, com Atenção) + Preferências.
5. **Deep link logado**: como aluno → usar-convite com code preenchido; como personal → "Convites são para alunos"; em must_change_password → gate de senha.
6. **Contas antigas**: primeiro login após o update cai no onboarding (passos puláveis) — esperado, uma vez por usuário.

---

## Self-Review (preenchido)

**Cobertura do spec:** conta única aluno/professor (T6/T7) ✔ · telefone obrigatório, nascimento mantido, sem CPF/gênero (T1/T6) ✔ · com/sem convite + contrato proposto (T1/T2/T6) ✔ · gate no dispatch (T4) ✔ · foto pulável com picker pendente (T8) ✔ · vínculo 3 estados (T9) ✔ · PAR-Q reusado obrigatório (T9) ✔ · quiz 4 telas + corpo (peso real/altura mock, pulável) (T9) ✔ · onboarding professor 4 passos com convite real (T10) ✔ · homes por estado + PreferencesSection + atalho perfil (T11) ✔ · usar-convite standalone + deep link com must_change_password (T4/T5) ✔ · sinais consolidados (T12) ✔ · aposentadorias (passos antigos T6, professor-info T7) ✔ · gate de mockups antes das telas ✔ · achados V1–V11 aplicados (V1/V8 em T5; V2/V6 em T4; V3 nos comandos; V4 em T0; V5/V9/V10 em T2; V7 em T2; V11 em T9/T10) ✔.

**Tipos consistentes:** `ContaAlunoForm(Schema)`/`contaAlunoDefaults`/`buildAlunoRegisterBody`/`registerErrorField` (T1) usados em T6; `ContaProfessorForm*` (T1) em T7; `RegisterProfessionalBody` (T1) em T2/T7; `useOnboardingStore.{hydrate,markDone,isDone}` (T3) em T4/T9/T10; `saveStudentAnswers`/`useStudentAnswers`/`*_LABEL`/schemas (T3) em T9/T11; `saveProfessionalProfile`/`AREA_LABEL`/`FORMA_USO_LABEL` (T3) em T10; `onboardingEntry` (T4) no dispatch; `useConsumeInvite` (T5) em T5/T9; `OnboardingScreen`/`OptionCard`/`FotoStep` (T8) em T9/T10. ✔

**Placeholders:** nenhum TBD/TODO funcional; `[MOCK]`/`[pendente]`/`[fluxo futuro]`/`[ajuste]`/`[ASSET TEMPORÁRIO]` são marcadores convencionais. Espelhos com deltas exaustivos: T7 (conta-pro ← conta-aluno), T10 passo forma-uso (← quiz T9), T10 `_layout` (← T9). Pontos de leitura obrigatória do repo sinalizados (branch vazio da Home, `ListState` do StudentsScreen, estilos do consent herdados do passo-3 antigo). Interação T6↔T9 do `clearDraft` documentada nas DUAS tasks. ✔
