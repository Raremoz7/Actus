# Mudanças do backend vs produção (para o Dev Back)

Este `backend/` é uma **cópia editável**; a versão em **produção é a referência ("o original")**.
Aqui ficam registradas as mudanças que ainda **não existem em produção**, para o Dev Back portar.

## Como achar tudo

```bash
grep -rn "ACTUS" backend/                       # marcadores no código ([ACTUS-NEW], [ACTUS — ...])
git log --oneline origin/main..origin/branch/davi -- backend/   # commits de backend desde produção
```

Já integrado em `branch/davi`/`dev` (changesets anteriores, marcados no código):
- **A1** — `GET /students/:student_id/workouts` (treinos do aluno, visão do pro) — em `routes/studentWorkouts.ts`.
- **B5 — Par-Q** — `POST /students/:id/par-q`, `GET /me/par-q`, `GET /professional/students/:id/par-q`, e o **bulk** `GET /professional/students/par-q` — em `routes/parq.ts` + migration `20260610120000_par_q.sql` (tabela `par_q_responses`).

---

## Changeset — Auto-cadastro de profissional · branch `feat/register-professional`

**Motivação:** card MVP "Fluxo de Cadastro (personal)". Em produção, profissional só nasce via
`POST /admin/professionals` (staff). O app tem o wizard de auto-cadastro pronto, chamando
`POST /auth/register-professional` (hoje atendido por mock de dev). Este changeset cria o endpoint real.

### Endpoint

`POST /auth/register-professional` — **público** (sem auth), espelha `POST /auth/register` (sem convite).

- **Body** (fiel ao `RegisterProfessionalBodySchema` do app, `app/src/types/auth.ts`):
  `{ email, password (min 8), full_name (min 3), phone (min 6), lgpd_consent? : true, policy_version? }`.
- **Efeito:** cria `app_users` + `profiles` (**`tipo = 'personal'`**, `display_name = full_name`, `phone`) +
  `user_lgpd_consents`. **Conta ativa imediata** (não usa `must_change_password`). NÃO cria
  `user_basic_info` (tabela student-shaped, com `birth_date NOT NULL`) — o `phone` vai no `profiles`.
- **Resposta:** `201 { access_token, access_token_expires_in, refresh_token }` (mesmo shape do register/login;
  o app faz `setTokens` → `GET /me` → roteia por `tipo` para `(personal)`).
- **Erros (no corpo `error`):** `invalid_body` (400), `email_already_in_use` (409), `internal_error` (500).

> **Papel:** cria sempre `personal` — o contrato do app não envia `role` (CREF/CRN e detalhes do
> profissional vêm depois, no onboarding). Cadastro de **nutricionista** por conta própria ficaria
> como extensão futura (adicionar um campo `role` ao body + ao insert).

### Arquivos

| Arquivo | Mudança |
|---|---|
| `api/src/routes/auth.ts` | NOVO handler `POST /register-professional` (+ schema). Procure `[ACTUS-NEW]`/`ACTUS`. |
| `supabase/migrations/20260610130000_actus_register_professional.sql` | NOVO. `alter table profiles add column if not exists phone text` (aditivo, idempotente). |
| `api/src/openapi.ts` | NOVO path `/auth/register-professional` (tags Auth; reusa `AuthTokensResponse`). |
| `api/test/auth.register-professional.int.test.ts` | NOVO. 3 testes: cria personal ativo + login + `/me` tipo personal; e-mail duplicado → 409; corpo inválido → 400. |
| `api/test/helpers/testDb.ts` | `profiles` ganhou `phone text` (espelho da migration) para os testes. |

### Como aplicar em produção

1. Rodar a migration `20260610130000_actus_register_professional.sql` (coluna `profiles.phone`).
2. Subir o handler (já registrado em `routes/auth.ts`, sob o router `/auth`).
3. Front já pronto: ao existir o endpoint real, remover a interceptação do mock em
   `app/src/api/devMocks.ts` (matcher de `POST /auth/register-professional`). Sem refator de tela.

> **Build (`dist/`):** este changeset toca `src/`/testes/migration/doc — não inclui o JS compilado.
> Rode `npm run build` em `backend/api` antes de `npm run start`.
