# TEC-62 — Registro Alimentar "O que comi" (mobile) — Backend

**Para:** responsável pelo backend (Julio)
**Issues:** [TEC-62](https://linear.app/actusfit/issue/TEC-62) (front, pai [TEC-14](https://linear.app/actusfit/issue/TEC-14)) · relacionada [TEC-58](https://linear.app/actusfit/issue/TEC-58) (feed web).
**Natureza:** o backend de refeições **não existe** ainda (nem no monorepo, nem em produção `Actus-gyn/Actus_backend`). O front mobile do aluno já consome os endpoints abaixo (estados de vazio/erro enquanto não existem). Complementa o contrato web em `web/docs/backend/tec-58-alimentacao.md`.

## Modelo de dados (migration)
Ver `web/docs/backend/tec-58-alimentacao.md` para `meal_logs` + `meal_log_comments`. **Adicionar** ao `meal_logs`:
```sql
alter table public.meal_logs add column tags text[] not null default '{}';
```

## Endpoints mobile (aluno) — sob `/me`, guard: aluno autenticado dono do recurso
| Método | Rota | Body / Query | Resposta |
|---|---|---|---|
| GET | `/me/meals` | — | `{ meals: MealLog[] }` (com `comments` embutidos, `tags`) |
| POST | `/me/meals` | multipart: `photo` (opcional), `description` (opcional), `eaten_at` (ISO), `tags[]` | `201 { ... }` (a refeição criada) |
| PATCH | `/me/meals/:id` | multipart: mesmos campos (editar) | `200 { ... }` |
| DELETE | `/me/meals/:id` | — | `204` / `{ ok: true }` |

`MealLog = { id, student_id, photo_url: string|null, eaten_at, description: string|null, tags: string[], created_at, comments: MealComment[] }`
`MealComment = { id, author_id, author_name?, body, created_at }`

- **GET**: só refeições do próprio aluno, ordem `eaten_at desc`.
- **POST/PATCH**: `photo` opcional; validar que ao menos `description` OU `photo` veio. Guardar `tags`.
- **DELETE**: só o dono pode excluir.
- Erro sempre no campo `error` do body (convenção da API).

## Upload de imagem
Mesma estratégia do avatar (`POST /me/avatar`, ver `backend/api/src/routes/meAvatar.ts`): disco local em dev → **S3/Supabase Storage em produção**. `photo_url` guarda a URL pública/assinada.

## Push ao aluno
Quando o profissional comenta (endpoint web, ver TEC-58), disparar push ao aluno reusando `pushService.ts`. Conteúdo: "Seu treinador comentou sua refeição".

## Checklist de produção
- [ ] Migration `meal_logs` + `meal_log_comments` + coluna `tags text[]`.
- [ ] `GET /me/meals` (feed próprio com comentários).
- [ ] `POST /me/meals` (multipart + tags).
- [ ] `PATCH /me/meals/:id` e `DELETE /me/meals/:id`.
- [ ] Storage de imagem (local → S3/Supabase em prod).
- [ ] Endpoints web (feed + comentário + push) — ver `web/docs/backend/tec-58-alimentacao.md`.

## Front consumidor (mobile, já pronto)
- Tipos/schema: `app/src/types/meals.ts`
- Hooks: `app/src/hooks/useMeals.ts` (GET/POST/PATCH/DELETE)
- Fila offline: `app/src/store/mealQueueStore.ts`
- Tela: `app/app/(aluno)/alimentacao.tsx` · Card na Home: `app/src/components/home/AlimentacaoCard.tsx`
