# TEC-56 — Bloco 1 (Perfil + lista + gestão) — Backend

**Para:** responsável pelo backend
**Issue:** [TEC-56](https://linear.app/actusfit/issue/TEC-56)
**Natureza:** os endpoints **já existem** no monorepo (`/mnt/h/Actus/backend`). Esta é uma tarefa de **aplicação em produção** — não há código novo a escrever, exceto se a versão de produção estiver defasada.

## Resumo

O front web do perfil do aluno (Visão Geral, Badges, lista com busca/filtro/ordenação, editar dados, ativar/desativar) consome quatro endpoints que já estão implementados no backend do monorepo. Para o front funcionar **em produção**, basta garantir que estas rotas e as colunas que elas leem estejam deployadas.

## Endpoints consumidos pelo front (contrato atual)

Todos sob guard: autenticado + `profiles.tipo ∈ {personal, nutricionista}` + vínculo ativo em `student_professional_links`. Erro sempre no campo `error` do body.

| Método | Rota | Uso no front |
|---|---|---|
| GET | `/professional/students?status=active\|revoked\|all` | Lista de alunos + Visão Geral |
| GET | `/professional/students/:id/badges` | Aba Badges |
| PATCH | `/professional/students/:id` | Editar dados básicos |
| PATCH | `/professional/students/:id/status` | Ativar/Desativar vínculo |

Arquivo de referência: `backend/api/src/routes/professionalStudents.ts`.

### GET /professional/students
O `SELECT` deve retornar (já retorna no monorepo) os campos lidos de `user_basic_info`:
`body_weight_kg`, `height_cm`, `phone`, `gender`, `cpf_last4`, além de `streak_current`, `badge_count`, `status`, `linked_at`, `birth_date`, `full_name`, `email`.

> ⚠️ **Verificar em produção:** se a versão deployada do `GET /professional/students` ainda não inclui `body_weight_kg / height_cm / phone / gender`, aplicar o `SELECT` atualizado (linhas ~50-110 do arquivo de referência). O front trata ausência como `null`, mas Visão Geral fica incompleta sem esses campos.

### PATCH /professional/students/:id
Body (Zod `.strict()`): `full_name?` (min 3), `phone?` (string|null), `gender?` (`masculino|feminino|nao_informar|outro`), `birth_date?` (`YYYY-MM-DD`), `body_weight_kg?` (20–400|null), `height_cm?` (90–250|null). Atualiza `user_basic_info`.

### PATCH /professional/students/:id/status
Body: `{ status: "active" | "revoked" }`. Atualiza `student_professional_links.status`.

### GET /professional/students/:id/badges
Retorna `{ student_id, badges: [{ id, name, description, asset_key, earned, earned_at }] }` — catálogo `public.badges` com flag `earned` via `student_badges`.

## Migrations a garantir em produção

Em `backend/supabase/migrations/`:
- `20260423120000_actus_fase1_schema.sql` — schema base (profiles, links, badges).
- `20260622120000_gamification_v1.sql` — `badges`, `student_badges`, `device_tokens`, streak.
- `20260623120000_user_height.sql` — coluna `height_cm` em `user_basic_info`.

## Checklist de produção
- [ ] Rotas de `professionalStudents.ts` deployadas (4 endpoints acima).
- [ ] `GET /professional/students` retornando peso/altura/phone/gender.
- [ ] Migrations de badges + `height_cm` aplicadas.
- [ ] Catálogo `public.badges` populado (senão a aba Badges fica vazia).

## Status do front
Implementado e validado (lint + typecheck limpos). Único ajuste deste ciclo: responsividade do header da lista em telas estreitas (≥320px). Nenhuma mudança de contrato.
