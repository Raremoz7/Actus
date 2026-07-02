# TEC-58 — Alimentação (feed + comentários + push) — Backend

**Para:** responsável pelo backend
**Issue:** [TEC-58](https://linear.app/actusfit/issue/TEC-58)
**Natureza:** feature **nova** — não existe `meal_logs` hoje (só `diet_templates`/`student_diets`). O **registro de refeição** é feito pelo **aluno no app mobile**; o **profissional (web)** vê o feed e **comenta** (dispara push ao aluno). O front web já está pronto e consome os endpoints de leitura/comentário.

## Modelo de dados (migration nova)

Pasta `backend/supabase/migrations/`, nome `YYYYMMDDHHMMSS_actus_meal_logs.sql`. Registrar em `backend/docs/CHANGES-actus.md`.

```sql
-- Refeição registrada pelo aluno (mobile).
create table public.meal_logs (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.profiles(id) on delete cascade,
  photo_url text,
  eaten_at timestamptz not null default now(),
  description text,
  created_at timestamptz not null default now()
);
create index on public.meal_logs (student_id, eaten_at desc);

-- Comentário do profissional numa refeição.
create table public.meal_log_comments (
  id uuid primary key default gen_random_uuid(),
  meal_log_id uuid not null references public.meal_logs(id) on delete cascade,
  author_id uuid not null references public.profiles(id) on delete cascade,
  body text not null,
  created_at timestamptz not null default now()
);
create index on public.meal_log_comments (meal_log_id);
```

## Endpoints

### Web (profissional) — sob `/professional`, consumidos pelo front pronto
Padrão de `backend/api/src/routes/professionalStudents.ts`: `withTx`, `authedUserId`, guard `tipo ∈ {personal,nutricionista}` + vínculo ativo. Erro no campo `error` do body.

| Método | Rota | Body | Resposta |
|---|---|---|---|
| GET | `/professional/students/:student_id/meals?from&to&limit` | — | `{ meals: MealLog[] }` |
| POST | `/professional/students/:student_id/meals/:meal_id/comments` | `{ body }` | `201 { id }` + **dispara push** |

`MealLog` inclui os comentários embutidos:
```ts
MealLog = {
  id, student_id, photo_url: string | null, eaten_at: string (ISO),
  description: string | null, created_at: string,
  comments: { id, author_id, author_name?, body, created_at }[]
}
```
- **GET meals**: ordenar por `eaten_at desc`; `limit` default ~50; `from`/`to` opcionais (`YYYY-MM-DD`). Fazer JOIN/aggregation dos comentários (ou subquery jsonb) para já trazer `comments`.
- **POST comment**: inserir em `meal_log_comments` com `author_id = me`; validar que a refeição pertence a um aluno vinculado ativo.

### Mobile (aluno) — pertence ao app/backend (citado para completude)
| Método | Rota | Observação |
|---|---|---|
| GET | `/me/meals` | feed do próprio aluno (com comentários) |
| POST | `/me/meals` | criar refeição com **upload de imagem** |

## Push notification (reusar serviço existente)
`backend/api/src/services/pushService.ts` já usa Expo Push SDK (`sendBadgeNotifications`, `device_tokens`). Adicionar `sendMealCommentNotification(client, studentId, { professionalName, snippet })` no mesmo molde e chamar no POST de comentário. Conteúdo sugerido: título "Seu treinador comentou sua refeição", corpo = trecho do comentário.

## Upload de imagem
Seguir a mesma estratégia do avatar (`POST /me/avatar`): hoje disco local no backend; **trocar por S3/Supabase Storage em produção**. `photo_url` guarda a URL pública/assinada.

## Checklist de produção
- [ ] Migration das 2 tabelas aplicada.
- [ ] `GET /professional/students/:id/meals` (com comentários embutidos) + guard de vínculo.
- [ ] `POST .../meals/:meal_id/comments` + push ao aluno.
- [ ] Endpoints mobile `GET/POST /me/meals` (upload de imagem).
- [ ] Storage de imagem definido (local → S3/Supabase em prod).

## Front consumidor (já pronto)
- Hooks: `web/src/hooks/useMeals.ts`
- UI: `web/src/pages/alunos/AlimentacaoTab.tsx` (aba no perfil — feed + comentar)
