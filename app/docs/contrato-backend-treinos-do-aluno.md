# Contrato pendente — GET dos treinos atribuídos a um aluno (visão do profissional)

> Para o time do **backend** (`actutus_fit_backend-main`). O app mobile já está implementado
> contra este contrato; falta o endpoint existir. Enquanto não existe, a tela de detalhe do
> aluno (personal) mostra o estado vazio do "Programa atual".

## Por que

A tela de detalhe do aluno (personal) lista os treinos atribuídos, com **editar / remover /
adicionar**. Hoje o router `/students/:student_id/workouts` só expõe:

- `POST /students/:student_id/workouts` — atribui um treino (✅ usado pelo "Adicionar").
- `PATCH /students/:student_id/workouts/:student_workout_id` — edita dias/datas ou desativa
  (`is_active:false` = "Remover", já que não há DELETE).

**Falta o GET** que lista as atribuições de um aluno para o profissional. Sem ele, o app não
tem como exibir o programa nem obter os `id`s para editar/remover.

## Endpoint solicitado

```
GET /students/:student_id/workouts
```

Opcional (paridade com a visão do aluno): aceitar `?active=true|false` para filtrar por
`is_active`. Sem o filtro, retornar todas (o app filtra `is_active` no cliente, mas o default
ideal é retornar todas e deixar o app decidir).

### Autorização

Mesma regra do POST/PATCH já existentes em `routes/studentWorkouts.ts`:

1. Requisitante autenticado tem `profiles.tipo = 'personal'` → senão `403 { "error": "only_personal" }`.
2. Existe vínculo ativo com o aluno:
   ```sql
   select 1 from public.student_professional_links
   where student_id = :student_id and professional_id = :requester
     and professional_role = 'personal' and status = 'active'
   limit 1
   ```
   Sem vínculo → `403 { "error": "student_not_linked" }`.
3. `:student_id` inválido (não-uuid) → `400 { "error": "invalid_params" }`.

Erros sempre no corpo, no campo `error` (convenção do projeto) — nunca só no status HTTP.

## Resposta (200)

```jsonc
{
  "student_workouts": [
    {
      "id": "uuid",                      // student_workouts.id (a ATRIBUIÇÃO; usado em PATCH)
      "student_id": "uuid",
      "workout_id": "uuid",
      "weekdays": [1, 3, 5],             // int[] ISO 1=seg … 7=dom, >= 1 item
      "start_date": "2026-05-01",        // date-only (YYYY-MM-DD), componentes LOCAIS
      "end_date": null,                  // date-only | null
      "display_order": 0,                // int
      "is_active": true,                 // boolean
      "created_at": "2026-05-01T00:00:00.000Z", // ISO timestamp
      "workout_name": "Treino A — Peito",// workouts.name
      "workout_notes": null,             // workouts.notes | null
      "exercise_count": 4,               // int (count de workout_exercises)
      "last_completed_date": null        // date-only da última sessão concluída | null
    }
  ]
}
```

A forma é **idêntica** à de `GET /me/student/workouts` (visão do próprio aluno) — de propósito,
para reaproveitar query e parsing. Ordenar por `display_order asc, created_at desc`.

> Datas date-only devem usar componentes **locais** (não `toISOString()`), conforme o restante
> da API — o app valida o formato `YYYY-MM-DD`.

## SQL pronto (adaptado de `routes/meStudentProgram.ts`)

A query da visão do aluno serve quase inalterada — só muda a **fonte do `student_id`** (passa a
ser o param da rota, validado pela autorização acima) e some o `req` do aluno:

```sql
select
  sw.id, sw.student_id, sw.workout_id, sw.weekdays, sw.start_date, sw.end_date,
  sw.display_order, sw.is_active, sw.created_at,
  w.name  as workout_name,
  w.notes as workout_notes,
  coalesce(wec.cnt, 0)::int as exercise_count,
  lcd.scheduled_for_date    as last_completed_date
from public.student_workouts sw
join public.workouts w on w.id = sw.workout_id
left join (
  select we.workout_id, count(*)::int as cnt
  from public.workout_exercises we
  group by we.workout_id
) wec on wec.workout_id = sw.workout_id
left join (
  select ws.student_workout_id, min(ws.scheduled_for_date) as scheduled_for_date
  from public.workout_sessions ws
  inner join (
    select student_workout_id, max(completed_at) as mx
    from public.workout_sessions
    where status::text in ('completed', 'completed_partial')
    group by student_workout_id
  ) t on t.student_workout_id = ws.student_workout_id and ws.completed_at = t.mx
  where ws.status::text in ('completed', 'completed_partial')
  group by ws.student_workout_id
) lcd on lcd.student_workout_id = sw.id
where sw.student_id = $1            -- $1 = :student_id da rota (já autorizado)
-- and sw.is_active = $2           -- opcional, se aceitar ?active=
order by sw.display_order asc, sw.created_at desc
limit 500;
```

Mapear as linhas igual ao endpoint do aluno: `start_date`/`end_date`/`last_completed_date` via
`formatDateOnly`, `created_at` via `toIso`.

## Onde o app consome (referência)

- Schema esperado: `src/types/workouts.ts` → `ProStudentWorkoutsResponseSchema`
  (alias de `StudentWorkoutsResponseSchema`).
- Hook: `src/hooks/useProStudentWorkouts.ts` → `GET endpoints.studentWorkouts(studentId)`.
- Tela: `src/components/professional/StudentDetailScreen.tsx` (seção "Programa atual").
- Editar/Remover: `src/hooks/useUpdateStudentWorkout.ts` → `PATCH .../workouts/:id`
  (já existente; "Remover" envia `{ is_active: false }`).

## Opcional — DELETE de atribuição

O app implementa "Remover" como soft-disable (`PATCH is_active:false`) porque **não há DELETE**.
Se o time preferir remoção real, expor `DELETE /students/:student_id/workouts/:student_workout_id`
e avisar — trocar no app é trivial (uma linha no `useUpdateStudentWorkout`/handler).

---

### Nota de ambiente (separado deste contrato)

No banco de **dev** local observamos que os **triggers de gamificação** (recompute de
sequência ao concluir treino/check-in) e os triggers de enforcement **não estão aplicados**
(`pg_trigger` vazio; função `recompute_student_streak` ausente). Não afeta este endpoint, mas
faz os fluxos de streak não atualizarem em tempo real no dev. Vale checar se as migrations
`supabase/migrations/2026050*.sql` e `2026042312*.sql` rodaram por completo nesse ambiente.
