# Mudanças do backend feitas a partir do monorepo Actus (para o Dev Backend)

> **Contexto:** este `backend/` é uma **cópia editável**; a versão em produção é externa
> (`actutus_fit_backend-main`). Aqui registramos **o que foi adicionado/alterado** para o app
> mobile, para o dev de backend aplicar/revisar na produção. Cada mudança no código está
> marcada com `// [ACTUS-NEW]` (código novo) ou `// [ACTUS-MOD]` (linha alterada).
> Veja também `app/docs/backend-pendencias.md` (catálogo completo das pendências).

Convenção mantida: erros sempre no corpo, campo `error`; datas date-only como `YYYY-MM-DD`;
auth = `requireAuth` + checagem de `profiles.tipo` + vínculo ativo quando aplicável.

---

## A1 — `GET /students/:student_id/workouts` (treinos atribuídos a um aluno, visão do profissional) 🔴

**Por quê:** a tela de detalhe do aluno (personal) lista treinos atribuídos para editar/remover.
Só existiam `POST`/`PATCH`; faltava o GET para listar e obter os `id`s das atribuições.

**Arquivos:**
- `api/src/routes/studentWorkouts.ts` — **adicionado** `router.get("/")` + helpers locais
  `formatDateOnly`/`toIso` (marcados `// [ACTUS-NEW]`). Nenhuma linha existente removida.

**Contrato:** `app/docs/contrato-backend-treinos-do-aluno.md` (shape, autorização, SQL).
Forma da resposta idêntica a `GET /me/workouts` (reaproveita a query do aluno).

**Autorização:** `tipo = 'personal'` (senão `403 only_personal`) + vínculo ativo
(`student_professional_links`, senão `403 student_not_linked`); `:student_id` não-uuid → `400 invalid_params`.

**Query param opcional:** `?active=true|false` (sem ele, retorna todas — o app filtra no cliente).

**Resposta 200:** `{ "student_workouts": [ { id, student_id, workout_id, weekdays, start_date,
end_date, display_order, is_active, created_at, workout_name, workout_notes, exercise_count,
last_completed_date } ] }`, ordenado por `display_order asc, created_at desc`.

**App consome:** `src/hooks/useProStudentWorkouts.ts`, `StudentDetailScreen.tsx`,
schema `ProStudentWorkoutsResponseSchema`.

**Migração:** nenhuma (usa tabelas existentes `student_workouts`, `workouts`, `workout_exercises`, `workout_sessions`).

---

## B5 — Par-Q (questionário de prontidão) — persistência no servidor 🔴

**Por quê:** o app tinha o Par-Q 100% pronto sobre mock local (SecureStore), mas o dado não
trafegava entre devices (o profissional não via as respostas do aluno). Estes endpoints
persistem no servidor.

**Migração (nova):** `supabase/migrations/20260610120000_par_q.sql` — cria
`public.par_q_responses` (PK `student_id` → uma resposta corrente por aluno; `POST` faz upsert):
`student_id`, `answers jsonb`, `any_yes bool`, `answered_at date`, `valid_until date`, timestamps.

**Arquivos:**
- `api/src/routes/parq.ts` — **novo**: 3 routers (`studentParqRouter`, `meParqRouter`,
  `professionalParqRouter`).
- `api/src/app.ts` — **3 mounts** + import (marcados `// [ACTUS-NEW]`).
- `api/test/parq.int.test.ts` — teste pg-mem (3 casos).

**Endpoints:**
- `POST /students/:student_id/par-q` — **só o próprio aluno** (`requester === :student_id`, tipo
  aluno). Body `{ answers: [{question_id:1..7, value:bool}] }` (exatamente 7). Servidor deriva
  `any_yes`, carimba `answered_at` (data **local**) e `valid_until` (+12 meses). Upsert.
  Resposta `200 { ok:true, par_q:{ student_id, answers, any_yes, answered_at, valid_until } }`.
  Erros: `403 forbidden` (não é o próprio), `403 only_student`, `400 invalid_body/invalid_params`.
- `GET /me/par-q` — aluno lê o próprio → `200 { par_q: <record> | null }`.
- `GET /professional/students/:student_id/par-q` — profissional **vinculado** (personal ou nutri)
  lê → `200 { par_q: <record> | null }`. Erros: `403 not_professional`, `403 student_not_linked`.

> **Nota de fuso:** `answered_at`/`valid_until` são carimbados em **componentes locais** (regra de
> datas do projeto). Para precisão por fuso do aluno, dá para trocar por `studentLocalDateString`
> (como em `meStudentProgram.ts`).

**App consome (quando migrar do mock):** `src/mocks/parq.ts` → trocar por `useQuery`/`mutation`
sobre o mesmo `ParqSubmissionSchema` (`src/types/parq.ts`); telas não mudam.

---

## Testes

`api/test/studentWorkouts.get.int.test.ts` (A1, 3) e `api/test/parq.int.test.ts` (B5, 3) — rodam
em **pg-mem** (sem DB externo): `npm test` no `backend/api`. Demais suítes existentes intactas.
