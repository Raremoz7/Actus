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
