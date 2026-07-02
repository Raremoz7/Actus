# TEC-57 — Anamnese dinâmica — Backend

**Para:** responsável pelo backend
**Issue:** [TEC-57](https://linear.app/actusfit/issue/TEC-57)
**Natureza:** feature **nova** — não existe nada de anamnese dinâmica hoje (só o PAR-Q fixo). O front já está implementado e consome os endpoints abaixo (estados de loading/vazio enquanto o backend não responde). **Distinto do PAR-Q** (questionário fixo de 7 itens) — não reaproveitar aquelas tabelas.

## Modelo de dados (migration nova)

Pasta `backend/supabase/migrations/`, nome `YYYYMMDDHHMMSS_actus_anamnese.sql`. Registrar em `backend/docs/CHANGES-actus.md`.

```sql
-- Template de anamnese pertence ao profissional. Campos guardados como jsonb
-- (builder dinâmico): array de { key, label, type, options?, required }.
create table public.anamnese_templates (
  id uuid primary key default gen_random_uuid(),
  professional_id uuid not null references public.profiles(id) on delete cascade,
  name text not null,
  fields jsonb not null default '[]'::jsonb,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz
);
create index on public.anamnese_templates (professional_id);

-- Resposta de um aluno a um template (1 resposta atual por aluno+template; upsert).
create table public.anamnese_responses (
  id uuid primary key default gen_random_uuid(),
  template_id uuid not null references public.anamnese_templates(id) on delete cascade,
  student_id uuid not null references public.profiles(id) on delete cascade,
  professional_id uuid not null references public.profiles(id) on delete cascade,
  answers jsonb not null default '{}'::jsonb,
  submitted_at timestamptz not null default now(),
  updated_at timestamptz,
  unique (template_id, student_id)
);
create index on public.anamnese_responses (student_id);
```

### Formato de `fields` (jsonb)
```jsonc
[
  { "key": "lesao_0", "label": "Possui alguma lesão?", "type": "boolean", "required": true },
  { "key": "objetivo_1", "label": "Objetivo principal", "type": "select",
    "options": ["Emagrecimento", "Hipertrofia", "Saúde"], "required": false },
  { "key": "obs_2", "label": "Observações", "type": "textarea" }
]
```
`type ∈ { text, textarea, number, select, boolean, date }`. `options` só quando `type = select`.

### Formato de `answers` (jsonb)
Objeto `{ [fieldKey]: valor }` onde valor é `string | number | boolean | null` conforme o tipo do campo.

## Endpoints (Express, sob `/professional`)

Seguir o padrão de `backend/api/src/routes/professionalStudents.ts`: `withTx`, `authedUserId(req)`, guard `tipo ∈ {personal,nutricionista}`, e — nos endpoints por aluno — checagem de vínculo ativo em `student_professional_links`. **Erro sempre no campo `error` do body.** Validar `fields`/`answers` com Zod (espelhar `web/src/lib/schemas.ts`).

| Método | Rota | Body | Resposta |
|---|---|---|---|
| GET | `/professional/anamnese/templates` | — | `{ templates: AnamneseTemplate[] }` |
| POST | `/professional/anamnese/templates` | `{ name, fields }` | `201 { id }` (ou o template criado) |
| PATCH | `/professional/anamnese/templates/:id` | `{ name?, fields?, is_active? }` | `{ ok: true }` |
| GET | `/professional/students/:student_id/anamnese` | — | `{ template, answers, submitted_at }` |
| PUT | `/professional/students/:student_id/anamnese` | `{ template_id, answers }` | `{ ok: true }` |

Detalhes:
- **GET templates**: só os do profissional autenticado (`professional_id = me`).
- **PATCH template**: garantir que o template pertence ao profissional.
- **GET student anamnese**: retorna o **template ativo** do profissional vinculado ao aluno (ou `null` se não houver) + as `answers` salvas para aquele aluno (ou `null`). O front usa `template` para renderizar o formulário e `answers` para preencher.
- **PUT student anamnese**: upsert em `anamnese_responses` por `(template_id, student_id)`; setar `professional_id = me`, `updated_at = now()`.

### Tipos (referência — já em `web/src/lib/schemas.ts`)
```ts
AnamneseField   = { key, label, type, options?, required? }
AnamneseTemplate = { id, name, fields, is_active, created_at, updated_at? }
StudentAnamnese  = { template: AnamneseTemplate | null, answers: Record<string, value> | null, submitted_at? }
```

## Checklist de produção
- [ ] Migration das 2 tabelas aplicada.
- [ ] 5 endpoints implementados com guards de tipo + vínculo.
- [ ] Validação Zod de `fields` (tipos válidos, `options` em select) e `answers`.
- [ ] Confirmado que não interfere no PAR-Q existente.

## Front consumidor (já pronto)
- Hooks: `web/src/hooks/useAnamnese.ts`
- UI: `web/src/pages/alunos/AnamneseTab.tsx` (aba no perfil) + `web/src/pages/anamnese/AnamneseBuilder.tsx` (builder dinâmico)
