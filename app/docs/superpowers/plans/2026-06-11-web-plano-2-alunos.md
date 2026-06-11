# Actus Web — Plano 2: Dashboard + Alunos

> **For agentic workers:** REQUIRED SUB-SKILL: superpowers:subagent-driven-development ou executing-plans.

**Goal:** Dashboard com KPIs reais e telas de lista/detalhe de alunos, consumindo a API existente.

**Architecture:** Hooks TanStack Query por recurso (`useStudents`, `useStudentCheckIns`, `useStudentWorkouts`), schemas Zod em `web/src/lib/schemas.ts`, sidebar contextual com filtros client-side.

**Pré-requisito:** Plano 1 concluído (layout, auth, UI base).

**Endpoints reais (verificados em `backend/api/src/routes/`):**
- `GET /professional/students` → `{ students: [{ id, email, full_name, birth_date, professional_role, linked_at }] }`
- `GET /professional/students/:student_id/check-ins?from&to` → check-ins do aluno
- `GET /students/:student_id/workouts` → atribuições (workout_name, weekdays, is_active, last_completed_date, exercise_count…)
- `PATCH /students/:student_id/workouts/:student_workout_id` → editar/desativar atribuição

---

### Task 1: Hooks de dados + schemas

**Files:**
- Create: `web/src/hooks/useStudents.ts`, `web/src/hooks/useStudentDetail.ts`
- Modify: `web/src/lib/schemas.ts`

- [ ] **Step 1:** Schemas Zod: `StudentSchema`, `StudentsResponseSchema`, `CheckInSchema`, `StudentWorkoutSchema` — campos conforme respostas reais (ler os arquivos de rota antes de escrever; validar TODA resposta com `.parse`).
- [ ] **Step 2:** `useStudents()` → query `['students']`, `GET /professional/students`. `useStudentCheckIns(id, from, to)` e `useStudentWorkouts(id)` em `useStudentDetail.ts`.
- [ ] **Step 3:** Derivar status do aluno em `web/src/lib/studentStatus.ts`: a partir dos check-ins, retornar `{ label: 'Treinou hoje' | 'Ontem' | 'N dias inativo' | 'Sem registro', tone: 'active' | 'default' | 'warn' }` usando datas locais (NUNCA `toISOString` para comparar dia — usar componentes locais do Date).
- [ ] **Step 4:** Commit: `feat(web): hooks de alunos + schemas Zod`

### Task 2: Dashboard (`/`)

**Files:**
- Create: `web/src/pages/dashboard/DashboardPage.tsx`, `web/src/pages/dashboard/KpiCard.tsx`, `web/src/pages/dashboard/ActivityPanel.tsx`

- [ ] **Step 1:** 4 KPI cards (Share Tech Mono 28px): Alunos ativos (count de students), Aderência média 30d (check-ins / dias previstos das atribuições ativas — calculado no front), Treinos hoje (check-ins de hoje), Sessões na semana. Skeletons no loading.
- [ ] **Step 2:** Lista dos 8 alunos mais recentes (avatar iniciais + nome + tag de status) com click → `/alunos/:id`. Painel "Atividade recente" derivado dos check-ins mais novos (texto Barlow, timestamp Share Tech Mono).
- [ ] **Step 3:** Empty state quiet luxury: "Nenhum aluno ainda. Gere um convite para começar." Commit: `feat(web): dashboard com KPIs e atividade`

### Task 3: Lista de alunos (`/alunos`)

**Files:**
- Create: `web/src/pages/alunos/AlunosPage.tsx`

- [ ] **Step 1:** Sidebar contextual: Todos / Ativos hoje / Sem treino / Inativos +7d (counts calculados dos dados). Filtros client-side sobre o resultado de `useStudents` + status derivado.
- [ ] **Step 2:** Lista em rows (Card): avatar, nome, e-mail, treino atual (primeira atribuição ativa via `useStudentWorkouts` — lazy, só nome se já carregado; aceitável omitir coluna até o detalhe), tag de status, chevron → `/alunos/:id`. Busca por nome no sub-header (client-side).
- [ ] **Step 3:** Botão "Convidar aluno" no sub-header → navega para `/convites` (modal real fica no Plano 4). Commit: `feat(web): lista de alunos com filtros`

### Task 4: Detalhe do aluno (`/alunos/:id`)

**Files:**
- Create: `web/src/pages/alunos/AlunoDetailPage.tsx`, `web/src/pages/alunos/TreinosTab.tsx`, `web/src/pages/alunos/HistoricoTab.tsx`, `web/src/pages/alunos/PreferenciasTab.tsx`

- [ ] **Step 1:** Header: avatar grande, nome, e-mail, tag de status. Abas (estado local): Treinos atribuídos · Histórico · Preferências.
- [ ] **Step 2:** `TreinosTab`: lista de `useStudentWorkouts(id)` — nome do treino, dias da semana (chips Share Tech Mono), nº exercícios, último treino, toggle ativo (PATCH `is_active` com confirmação). Botão "Atribuir treino" → `/treinos` (fluxo completo no Plano 3).
- [ ] **Step 3:** `HistoricoTab`: calendário/lista de check-ins (`useStudentCheckIns`, últimos 60 dias) com data local formatada + origem.
- [ ] **Step 4:** `PreferenciasTab`: `// [MOCK — sem endpoint na API v1]` com dados estáticos de exemplo e aviso visual "Disponível quando o backend expor as preferências do onboarding".
- [ ] **Step 5:** `npm run build` + smoke. Commit: `feat(web): detalhe do aluno com abas`
