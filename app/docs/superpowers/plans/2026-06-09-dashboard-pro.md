# Dashboard Personal/Nutri — Implementation Plan

> Executar TDD, task a task. Trabalhar SOMENTE no worktree `/mnt/h/actus_app/.claude/worktrees/dashboard-pro` (branch `feat/dashboard-pro`). `git add` só arquivos exatos; nunca pasta/`-A`. Não reformatar arquivos existentes (preservar EOL). Sem hex hardcoded; 1 motion por tela.

**Goal:** Aba "Início" (landing) para personal e nutri, com dashboard de KPIs reais + ações rápidas + alunos recentes; engajamento agregado sinalizado pro backend.

**Architecture:** `DashboardScreen` lê `me.tipo` e renderiza `PersonalDashboard` OU `NutriDashboard` — cada um chama apenas os hooks do seu papel (evita 403 cruzado e hooks condicionais). Peças apresentacionais compartilhadas (header, KPI, ação, recentes, stub de engajamento). Nova aba `inicio` em cada grupo + `homeForTipo` apontando pra ela.

**Tech Stack:** Expo SDK 55 · TS estrito · Zod · Unistyles 3 · TanStack Query · Phosphor · jest-expo.

---

## Dados reais (já existentes)
- `useStudents()` → `data.students[]` (count; recentes por `linked_at` desc).
- `useProWorkouts()` → `data.workouts[]` (count; só personal).
- `useProChallenges()` → `data.challenges[]` com `status:'draft'|'active'|'ended'` → ativos = `status==='active'`.
- `useDietTemplates()` → `data.diet_templates[]` (count; só nutri).
- `useMe()` → `data.display_name` (nullable), `data.tipo`.
- `greetingForHour(hour)` de `@/lib/greeting`. `KpiNumber` de `@/components/ui` (props `value`, `size`). `StudentRow` de `@/components/professional`.

## Estrutura de arquivos
**Criar:**
- `src/components/dashboard/DashboardHeader.tsx` — saudação + nome.
- `src/components/dashboard/KpiCard.tsx` — KpiNumber + label.
- `src/components/dashboard/QuickAction.tsx` — card pressable (ícone + label).
- `src/components/dashboard/RecentStudents.tsx` — top N alunos recentes (StudentRow).
- `src/components/dashboard/EngagementSoon.tsx` — bloco "Engajamento · em breve".
- `src/components/dashboard/PersonalDashboard.tsx` · `NutriDashboard.tsx` · `DashboardScreen.tsx` · `index.ts`.
- testes: `KpiCard.test.tsx`, `QuickAction.test.tsx`, `RecentStudents.test.tsx`, `PersonalDashboard.test.tsx`, `NutriDashboard.test.tsx`.
- `app/(personal)/(tabs)/inicio.tsx` · `app/(nutri)/(tabs)/inicio.tsx`.
**Modificar:**
- `app/(personal)/(tabs)/_layout.tsx` · `app/(nutri)/(tabs)/_layout.tsx` — aba `inicio` como 1ª.
- `src/lib/authRoutes.ts` — `homeForTipo` → `inicio`.
- `AGENTS.md` — sinalizar `GET /professional/overview`.

---

### Task 1 — Peças apresentacionais (KpiCard, QuickAction, DashboardHeader, EngagementSoon)
Componentes puros (sem hooks de dados). TDD nos dois interativos/medíveis (KpiCard, QuickAction).

- [ ] **KpiCard** `{ value: number|string; label: string }` → card surface1, `KpiNumber` + `AppText label`. Teste: mostra valor e label.
- [ ] **QuickAction** `{ icon: ReactNode; label: string; onPress: () => void }` → Pressable card. Teste: dispara onPress; mostra label.
- [ ] **DashboardHeader** `{ greeting: string; name: string | null }` → `AppText h2` "{greeting}{, name}". (sem teste dedicado; coberto via dashboards).
- [ ] **EngagementSoon** → card discreto: eyebrow "Engajamento", texto "Em breve: adesão e check-ins dos seus alunos." (sem teste dedicado).
- [ ] `index.ts` exporta todos. typecheck + jest src/components/dashboard. Commit (arquivos exatos).

### Task 2 — RecentStudents
- [ ] `{ students: Student[]; onOpen: (id:string)=>void; limit?: number }` → ordena por `linked_at` desc, fatia `limit ?? 4`, renderiza `StudentRow` (name = full_name||email, subtitle = email). Cabeçalho "Alunos recentes". Vazio → linha discreta "Nenhum aluno ainda". Teste: renderiza N nomes; onOpen dispara com id.
- [ ] Commit.

### Task 3 — PersonalDashboard
- [ ] Chama `useMe`, `useStudents`, `useProWorkouts`, `useProChallenges`. KPIs: alunos=`students.length`, treinos=`workouts.length`, desafios ativos=`challenges.filter(status==='active').length`. Ações: Convidar (`/convite`), Novo treino (`/montar-treino`), Criar desafio (`/criar-desafio`). RecentStudents(students). EngagementSoon. Reveal 1x.
- [ ] Teste (mock dos 4 hooks): KPIs corretos; ação "Novo treino" navega `/montar-treino`.
- [ ] Commit.

### Task 4 — NutriDashboard
- [ ] Chama `useMe`, `useStudents`, `useDietTemplates`. KPIs: alunos, dietas=`diet_templates.length`. Ações: Convidar (`/convite`), Nova dieta (`/montar-dieta`). RecentStudents. EngagementSoon.
- [ ] Teste (mock hooks): KPIs; ação "Nova dieta" navega `/montar-dieta`.
- [ ] Commit.

### Task 5 — DashboardScreen (switch por tipo) + telas de aba
- [ ] `DashboardScreen`: `const tipo = useMe().data?.tipo; return tipo === 'nutricionista' ? <NutriDashboard/> : <PersonalDashboard/>;` (default personal; enquanto `me` carrega, render do PersonalDashboard é aceitável pois hooks gateiam em authenticated — mas preferir um guard simples: se `!tipo` mostra `Screen` vazio/loading).
- [ ] `app/(personal)/(tabs)/inicio.tsx` → `export default () => <DashboardScreen/>`. Idem nutri.
- [ ] Teste DashboardScreen: mock useMe tipo personal → PersonalDashboard; tipo nutri → NutriDashboard (verificar por um texto exclusivo, ex. ação "Criar desafio" vs "Nova dieta").
- [ ] Commit.

### Task 6 — Wiring de navegação (tabs + homeForTipo)
- [ ] `app/(personal)/(tabs)/_layout.tsx`: adicionar `HouseIcon` (phosphor) no topo; item `{ name:'inicio', label:'INÍCIO', renderIcon }` como 1º do array `TABS`; `<Tabs.Screen name="inicio" />` como 1º. Edição mínima.
- [ ] `app/(nutri)/(tabs)/_layout.tsx`: idem.
- [ ] `src/lib/authRoutes.ts`: `personal` → `'/(personal)/(tabs)/inicio'`; `nutricionista` → `'/(nutri)/(tabs)/inicio'`. Atualizar o comentário (agora há landing dedicada).
- [ ] typecheck. Verificar visual das 5 abas no ActusTabBar (se cramado, é ajuste fino — anotar). Commit (arquivos exatos).

### Task 7 — Doc backend
- [ ] AGENTS.md "Pendências conhecidas": `- Dashboard profissional — KPIs vêm de listas reais; engajamento agregado (adesão, check-ins, inadimplência) pediria GET /professional/overview. Hoje bloco "em breve".`
- [ ] typecheck + jest (src/components/dashboard + telas). Commit.
- [ ] Validação manual (dev build): login personal cai em Início com KPIs/ações/recentes; idem nutri; 5 abas legíveis.

## Self-Review
- KPIs/recentes = dados reais; engajamento sinalizado. ✔
- Sem hooks condicionais (split Personal/Nutri). ✔
- Banco de treinos NÃO referenciado (não está nesta base). ✔
- Edições mínimas em layouts + authRoutes. ✔
