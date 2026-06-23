# TEC-56 — Bloco 1: Perfil do aluno completo + lista + gestão + responsividade

> Parte da decomposição de [TEC-12](https://linear.app/actusfit/issue/TEC-12) (Dashboard do Personal — Web).
> Blocos irmãos: [TEC-57](https://linear.app/actusfit/issue/TEC-57) (Anamnese), [TEC-58](https://linear.app/actusfit/issue/TEC-58) (Alimentação).
> Repos afetados: **web** (`Actus_web`) — principal · **backend** (`Actus_backend`) — mínimo.

## Objetivo

Completar a "Web Básica do Personal" no que toca o **perfil do aluno** e a **lista**: adicionar as tabs Visão Geral e Badges, ordenação na lista, ações de gestão (editar dados, ativar/desativar) e responsividade — com as extensões mínimas de backend que isso exige. As tabs Anamnese e Alimentação ficam para os blocos 2 e 3.

## Estado atual (o que já existe)

- `web/src/pages/alunos/AlunosPage.tsx`: lista com **busca** (nome/e-mail), **filtro de status** (sidebar: Todos/Ativos hoje/Sem treino/Inativos +7d), **streak** e **badge count** por linha.
- `web/src/pages/alunos/AlunoDetailPage.tsx`: header (foto/nome/status) + tabs **Treinos**, **Histórico**, **Preferências**.
- Backend `GET /professional/students` devolve: `id, email, full_name, birth_date, professional_role, linked_at, streak_current, is_broken, badge_count`. `GET /professional/students/:id/check-ins` já existe.
- `web/src/components/StreakBadge.tsx`, `StudentBadges.tsx` (hoje só contagem), `ui/Modal.tsx`, `ui/charts.tsx`.

## Decisões de design (validadas com o Davi via mockups)

1. **Visão Geral — layout B (faixa + grade de métricas).** Faixa superior: avatar + nome + selo de status + ações (Editar / Ativar-Desativar). Abaixo: grade de stat-cards (Idade, Peso, Altura, Membro desde). Por fim, card "Contato" (telefone, gênero, e-mail). Valores numéricos em fonte mono (Share Tech Mono).
2. **Badges — grade única.** Os 7 badges do catálogo na ordem de `sort_order`. Conquistados coloridos (emblema por tipo) com data; bloqueados em cinza com cadeado + texto do critério. Header com contador `n / 7`.
3. **Lista — ordenação.** Dropdown com: Nome (A→Z, padrão), Último check-in (mais recente), Streak (maior). Busca e filtros de status preservados.
4. **Desativar — soft, reversível.** "Desativar" muda o vínculo para `status='inactive'`: some da lista ativa, sai dos KPIs, mas aparece num filtro **"Arquivados"** e pode ser **reativado**. Histórico preservado. Confirm dialog antes de aplicar.
5. **Editar dados — tudo menos e-mail/senha.** Modal espelhando o cadastro, editando `full_name, phone, gender, birth_date, body_weight_kg, height_cm`. E-mail e senha (identidade de login) ficam com o aluno.
6. **Responsividade.** < 1024px: sidebar de filtros vira menu hambúrguer; linhas da lista já são cards; tabs do perfil viram accordion. Mínimo funcional em 320px.

## Backend (mínimo) — repo `Actus_backend`

### Migration
- Nova migration `…_student_height.sql`: `alter table public.user_basic_info add column if not exists height_cm numeric(5,1);` (faixa válida via check opcional, ex. 90–250).

### Endpoints (`api/src/routes/professionalStudents.ts`)
- **`GET /professional/students`** — estender o `SELECT` para incluir `ubi.phone`, `ubi.gender`, `ubi.body_weight_kg`, `ubi.height_cm`, `ubi.cpf_last4`. Aceitar `?status=active|inactive|all` (default `active`) e filtrar `spl.status` conforme — para alimentar o filtro "Arquivados". Manter `limit 500`.
- **`GET /professional/students/:id/badges`** — autoriza vínculo ativo, então roda a mesma query do `meBadges` porém para `:id`: catálogo de `badges` (active) LEFT JOIN `student_badges` do aluno → `{ id, name, description, asset_key, sort_order, earned, earned_at }`, ordenado por `sort_order`. Erros no campo `error` (padrão da API): `not_professional` (403), `student_not_linked` (404).
- **`PATCH /professional/students/:id`** — body Zod parcial: `full_name?, phone?, gender?, birth_date?, body_weight_kg?, height_cm?`. Atualiza `user_basic_info` (upsert por `user_id`). Autoriza vínculo ativo. Nunca toca e-mail/senha. Valida ranges (peso 20–400, altura 90–250) e `gender` no enum.
- **`PATCH /professional/students/:id/status`** — body `{ status: 'active' | 'inactive' }`. Atualiza `student_professional_links.status` do par `(professional_id, student_id)`. Idempotente.

### Autorização
Reusar o padrão já existente em `professionalStudents.ts`: confere `profiles.tipo ∈ {personal, nutricionista}` e vínculo `(professional_id, student_id)` (para mutações de status, permitir reativar vínculo `inactive`).

### Testes (Vitest + pg-mem)
- `professional.students.int.test.ts`: novos campos no GET; `?status` filtra; badges do aluno (earned/locked); PATCH edita e rejeita e-mail; PATCH status alterna e some/volta do GET default.

## Frontend — repo `Actus_web`

### Schemas / tipos (`src/lib/schemas.ts`)
- Estender `Student`: `phone, gender, body_weight_kg, height_cm, cpf_last4, status` (todos nullable/optional, validados com Zod lenient como o resto da API).
- Novo `StudentBadge` (`id, name, description, asset_key, sort_order, earned, earned_at`).

### Hooks (`src/hooks/`)
- `useStudents`: aceitar `status` opcional (`active`/`inactive`/`all`) no query key + querystring.
- `useStudentBadges(studentId)`: `GET /professional/students/:id/badges`.
- `useUpdateStudent(studentId)`: `PATCH …/:id` (invalida `students` + detalhe).
- `useSetStudentStatus(studentId)`: `PATCH …/:id/status` (invalida `students`).

### Componentes / páginas
- `pages/alunos/VisaoGeralTab.tsx` — layout B; recebe `student`; ações disparam modal/confirm.
- `pages/alunos/BadgesTab.tsx` — grade única; consome `useStudentBadges`; estados loading/empty.
- `pages/alunos/EditStudentModal.tsx` — form (reusa `ui/Modal`); campos sem e-mail/senha; usa `useUpdateStudent`.
- `components/ui/ConfirmDialog.tsx` (se não existir) — confirm para ativar/desativar.
- `AlunoDetailPage.tsx` — adicionar tabs **Visão Geral** (primeira) e **Badges**; tabs viram accordion < 1024px. Ordem: Visão Geral · Treinos · Histórico · Badges (Preferências mantida por ora).
- `AlunosPage.tsx` — dropdown de ordenação; opção de filtro **Arquivados** (`status='inactive'`); sidebar → hambúrguer < 1024px.

### Estados
Loading (skeletons já em uso), empty ("sem badges ainda", "nenhum arquivado"), erro (toast via `ui/Toast`). Otimismo nas mutações de status com rollback.

## Fora de escopo (outros blocos / não-objetivos)
- Tab **Anamnese** (TEC-57) e tab **Alimentação** (TEC-58).
- Edição de e-mail/senha do aluno.
- Histórico de medições (peso/altura ao longo do tempo) — aqui é só o valor atual.

## Critérios de aceite
- Abrir um aluno mostra **Visão Geral** com dados pessoais, idade (derivada de `birth_date`), peso, altura, data de cadastro e status.
- Tab **Badges** mostra os 7 com estado correto (conquistado/bloqueado).
- Lista permite **ordenar** por nome/último check-in/streak e ver **arquivados**.
- **Editar dados** persiste e reflete na Visão Geral; **Desativar** remove da lista ativa e **Reativar** traz de volta.
- Layout utilizável de 320px a desktop; sem scroll horizontal; tabs viram accordion no mobile.
- `npm run typecheck` + `npm run lint` + testes do backend passam.
