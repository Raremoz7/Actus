# Relatório Comparativo — Backend Actus

**Original:** `git@github.com:julioguerradev/actutus_fit_backend.git`
**Atual:** `/mnt/h/Actus/backend/`
**Data:** 11/06/2026

---

## Resumo Executivo

O backend atual é um **fork evolutivo** do original, mantendo 100% da base (rotas, auth, banco, middlewares) e adicionando **6 changesets** novos que viabilizam funcionalidades do app mobile não presentes em produção. Nenhuma rota original foi removida ou alterada de forma quebrada — todas as adições são aditivas.

---

## 1. Arquivos Novos (existem só no atual)

| Arquivo | Finalidade |
|---|---|
| `src/routes/invitePreview.ts` | Endpoint público `GET /invites/:code/preview` — resolve o convidador antes de qualquer login |
| `src/routes/meAvatar.ts` | Upload de avatar `POST /me/avatar` (multipart, multer, disco local) |
| `src/routes/parq.ts` | Par-Q: 3 endpoints (aluno envia, aluno lê, profissional lê) |
| `supabase/migrations/20260610120000_par_q.sql` | Tabela `par_q_responses` (upsert por aluno, 7 respostas JSONB) |
| `supabase/migrations/20260610130000_actus_register_professional.sql` | `ALTER TABLE profiles ADD COLUMN phone text` |
| `test/auth.register-professional.int.test.ts` | Testes do auto-cadastro de profissional |
| `test/invites.preview.int.test.ts` | Testes do preview público de convite |
| `test/me.avatar.int.test.ts` | Testes de upload de avatar |
| `test/me.profile.int.test.ts` | Testes do perfil rico `GET /me/profile` |
| `test/parq.int.test.ts` | Testes do Par-Q |
| `test/studentWorkouts.get.int.test.ts` | Testes do `GET /students/:id/workouts` |
| `CHANGES-FROM-PRODUCTION.md` | Documentação de todos os changesets vs produção |
| `.env.local` | Env local de desenvolvimento (não commitado em produção) |

---

## 2. Arquivo Presente no Original mas Ausente no Atual

| Arquivo | Observação |
|---|---|
| `.github/workflows/deploy.yml` | Pipeline de CI/CD de deploy — o repo original tem; o fork local não inclui |

---

## 3. Arquivos Modificados

### `src/app.ts`

**O que mudou:**
- **CORS dinâmico** — adicionado middleware manual lendo `CORS_ORIGINS` (env), aceita múltiplas origens separadas por vírgula. O original não tinha CORS configurado no Express.
- **Novo mount:** `/uploads` → `express.static(avatarUploadDir())` — serve arquivos de avatar publicamente.
- **Novo mount:** `GET /invites/:code/preview` — registrado **antes** do `/invites` protegido (sem `requireAuth`, mais específico).
- **Novos mounts Par-Q:**
  - `POST /students/:student_id/par-q`
  - `GET /me/par-q`
  - `GET /professional/students/:student_id/par-q`
  - `GET /professional/students/par-q` (bulk — registrado antes do `/:student_id` para não colidir)
- **Novo mount:** `POST /me/avatar` (com `requireAuth`)

---

### `src/routes/auth.ts`

**O que mudou:**
- **Refatoração interna:** a lógica de emissão de tokens (`access_token` + `refresh_token`) foi extraída para uma função `issueSession(userId)` compartilhada — o `POST /register` original tinha o bloco inline (28 linhas); agora chama `return res.status(201).json(await issueSession(created.userId))`.
- **Endpoint novo:** `POST /auth/register-professional`
  - Auto-cadastro do profissional (em produção, profissional só nasce via `/admin/professionals` pelo staff)
  - Body: `{ email, password (min 8), full_name (min 3), phone (min 6), lgpd_consent?, policy_version? }`
  - Cria `app_users` + `profiles` (`tipo='personal'`, `display_name`, `phone`) + `user_lgpd_consents`
  - Resposta: `201 { access_token, access_token_expires_in, refresh_token }` (mesmo contrato do `/register`)
  - Não cria `user_basic_info` (tabela student-shaped com `birth_date NOT NULL`)

---

### `src/routes/me.ts`

**O que mudou:**
- **Endpoint novo:** `GET /me/profile` — perfil rico para tela "editar perfil" (não altera o `GET /me` existente)
  - LEFT JOIN `profiles` + `user_basic_info`
  - Resposta: `{ id, tipo, display_name, avatar_url, timezone, full_name, phone, gender, body_weight_kg, birth_date }`
  - `birth_date` serializado por **componentes UTC** (fix de off-by-one em UTC-3)
  - `body_weight_kg` coercionado para `number` (pg retorna `numeric` como string)
  - Profissional sem `user_basic_info` → campos student retornam `null`
- **`PATCH /me` aprimorado:**
  - Detecta `tipo` do usuário antes de qualquer UPDATE (evita commit parcial em caminho de erro)
  - **Profissional sem `user_basic_info`:** `phone` → `profiles.phone`; `full_name` → `profiles.display_name` (se `display_name` não veio explícito). No original, o PATCH falhava silenciosamente para profissional.
  - `UPDATE user_basic_info` só executa se houver campos para atualizar (`uFields.length > 0`)
  - Erro 404 (profile not found) agora retorna status correto; o original retornava 400 para qualquer erro do PATCH.

---

### `src/routes/studentWorkouts.ts`

**O que mudou:**
- **Endpoint novo:** `GET /professional/students/:student_id/workouts` — visão do personal sobre os treinos de um aluno
  - Autorização: `tipo = 'personal'` + vínculo ativo na `student_professional_links`
  - Suporta query `?active=true|false` (filtra `is_active`)
  - Retorna os mesmos campos de `GET /me/workouts` (paridade de contrato): `id, student_id, workout_id, weekdays, start_date, end_date, display_order, is_active, created_at, workout_name, workout_notes, exercise_count, last_completed_date`
  - Inclui helper de formatação de data `formatDateOnly` + `toIso` (cópia de `meStudentProgram.ts`)

---

### `package.json`

**O que mudou:**

| Campo | Original | Atual |
|---|---|---|
| `dependencies.multer` | ausente | `^1.4.5-lts.1` |
| `devDependencies.@types/multer` | ausente | `^2.1.0` |

---

## 4. Migrations — Comparativo

| Migration | Original | Atual |
|---|---|---|
| `20260423_actus_fase1_schema.sql` | ✓ | ✓ |
| `20260428_actus_custom_auth.sql` | ✓ | ✓ |
| `20260429_invite_first_and_user_fields.sql` | ✓ | ✓ |
| `20260430_staff_roles.sql` | ✓ | ✓ |
| `20260507_student_session_sets_checkin_summary.sql` | ✓ | ✓ |
| `20260508_fix_recompute_streak_ambiguous_d.sql` | ✓ | ✓ |
| `20260509_challenges.sql` | ✓ | ✓ |
| `20260610120000_par_q.sql` | **ausente** | ✓ |
| `20260610130000_actus_register_professional.sql` | **ausente** | ✓ |

---

## 5. Testes — Comparativo

| Teste | Original | Atual |
|---|---|---|
| `admin.links.students.int.test.ts` | ✓ | ✓ |
| `admin.professionals.int.test.ts` | ✓ | ✓ |
| `auth.change-password.int.test.ts` | ✓ | ✓ |
| `auth.register.invite-first.int.test.ts` | ✓ | ✓ |
| `challenges.int.test.ts` | ✓ | ✓ |
| `gamification.int.test.ts` | ✓ | ✓ |
| `invites.list.int.test.ts` | ✓ | ✓ |
| `me.patch.int.test.ts` | ✓ | ✓ |
| `me.student.program.int.test.ts` | ✓ | ✓ |
| `patch.routes.int.test.ts` | ✓ | ✓ |
| `professional.students.int.test.ts` | ✓ | ✓ |
| `workoutCalories.test.ts` | ✓ | ✓ |
| `workouts.and.diets.int.test.ts` | ✓ | ✓ |
| `auth.register-professional.int.test.ts` | **ausente** | ✓ |
| `invites.preview.int.test.ts` | **ausente** | ✓ |
| `me.avatar.int.test.ts` | **ausente** | ✓ |
| `me.profile.int.test.ts` | **ausente** | ✓ |
| `parq.int.test.ts` | **ausente** | ✓ |
| `studentWorkouts.get.int.test.ts` | **ausente** | ✓ |

---

## 6. Arquivos Idênticos (sem alteração)

`src/auth/jwt.ts`, `src/auth/sessionClaims.ts`, `src/crypto.ts`, `src/db.ts`, `src/domain/workoutCalories.ts`, `src/index.ts`, `src/middleware/*` (todos), `src/routes/adminProfessionals.ts`, `src/routes/adminStaff.ts`, `src/routes/adminStudentLinks.ts`, `src/routes/dietTemplates.ts`, `src/routes/invites.ts`, `src/routes/meChallenges.ts`, `src/routes/meGamification.ts`, `src/routes/meStudentProgram.ts`, `src/routes/professionalChallenges.ts`, `src/routes/professionalStudents.ts`, `src/routes/studentDiets.ts`, `src/routes/workouts.ts`, `src/schemaCompat.ts`, `src/services/challengeStats.ts`, `src/services/studentWorkoutSummary.ts`, `src/studentCheckInsQuery.ts`, `src/types/swagger-ui-express.d.ts`, `tsconfig.json`, `vitest.config.ts`, `Dockerfile`, `docker-compose.yml`.

---

## 7. O Que o Dev Back Precisa Portar para Produção

Para integrar o fork ao repositório de produção, basta aplicar nesta ordem:

1. **Migrations** — rodar `20260610120000_par_q.sql` e depois `20260610130000_actus_register_professional.sql`
2. **`package.json`** — adicionar `multer` (dep) e `@types/multer` (devDep) + `npm install`
3. **Novos arquivos `src/`** — copiar `routes/invitePreview.ts`, `routes/meAvatar.ts`, `routes/parq.ts`
4. **`src/app.ts`** — aplicar os 4 blocos de diff (CORS, `/uploads`, mounts novos)
5. **`src/routes/auth.ts`** — extrair `issueSession` + adicionar `POST /register-professional`
6. **`src/routes/me.ts`** — adicionar `GET /me/profile` + corrigir `PATCH /me` para profissional e status 404
7. **`src/routes/studentWorkouts.ts`** — adicionar `GET /` (visão do profissional) + helpers de data
8. **Testes** — copiar os 6 novos arquivos de teste para `test/`
9. **`npm run build`** — recompilar `src/` → `dist/`
