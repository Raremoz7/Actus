# Actus Web — Plano 3: Treinos (biblioteca + builder + atribuição)

> **For agentic workers:** REQUIRED SUB-SKILL: superpowers:subagent-driven-development ou executing-plans.

**Goal:** Biblioteca de templates, builder de treino com catálogo Wger e fluxo de atribuição a aluno.

**Pré-requisito:** Planos 1 e 2 concluídos.

**Endpoints reais:**
- `GET /workouts` · `GET /workouts/:id` · `POST /workouts` (aceita `id` UUID opcional) · `PATCH /workouts/:id` (`exercises` é full-replace)
- `POST /students/:student_id/workouts` (atribuir; aceita `id` opcional) · `PATCH /students/:student_id/workouts/:swId`

**Catálogo Wger:** copiar `app/assets/wger/catalog.json` e `app/assets/wger/images/` para `web/public/wger/` (script de build ou cópia commitada — escolher cópia commitada, simples). 851 exercícios; imagem por id em `/wger/images/<id>.webp` quando `hasImage`.

---

### Task 1: Catálogo Wger no web

**Files:**
- Create: `web/public/wger/` (catalog.json + images/), `web/src/lib/wger.ts`, `web/src/hooks/useWgerCatalog.ts`

- [ ] **Step 1:** Copiar assets: `cp app/assets/wger/catalog.json web/public/wger/ && cp -r app/assets/wger/images web/public/wger/images`.
- [ ] **Step 2:** `wger.ts` — tipos do exercício (id, name_pt|name_en, category, equipment, muscles, description, hasImage) + `wgerImageUrl(id)` → `/wger/images/${id}.webp` ou null. `useWgerCatalog()` — fetch único de `/wger/catalog.json` com `staleTime: Infinity`, helper `searchExercises(term, category?)` (busca case/acento-insensível em name_pt e name_en).
- [ ] **Step 3:** Commit: `feat(web): catálogo Wger local`

### Task 2: Biblioteca de treinos (`/treinos`)

**Files:**
- Create: `web/src/pages/treinos/TreinosPage.tsx`, `web/src/hooks/useWorkouts.ts`

- [ ] **Step 1:** `useWorkouts()` (`GET /workouts`, Zod), `useWorkoutDetail(id)`. Grid de cards: nome (Barlow Condensed), nº exercícios, data de criação (Share Tech Mono). Sidebar contextual: Todos / contagem. Botão sub-header "+ Criar treino" → `/treinos/novo`. Click no card → `/treinos/:id`.
- [ ] **Step 2:** Empty state: "Nenhum template ainda. Monte o primeiro treino." Commit: `feat(web): biblioteca de treinos`

### Task 3: Builder (`/treinos/novo` e `/treinos/:id`)

**Files:**
- Create: `web/src/pages/treinos/BuilderPage.tsx`, `web/src/pages/treinos/CatalogPanel.tsx`, `web/src/pages/treinos/ExerciseList.tsx`, `web/src/hooks/useWorkoutMutations.ts`

- [ ] **Step 1:** Layout dividido: esquerda `CatalogPanel` (busca + filtro por categoria, rows com thumb Wger + nome + grupo muscular, click adiciona); direita `ExerciseList` (exercícios do treino com inputs inline de séries/reps/descanso, botão remover, reordenar com botões ↑↓ — sem lib de DnD no v1, YAGNI).
- [ ] **Step 2:** Estado do builder em `useState` local: `{ name, notes, exercises: [{ wger_exercise_id, name_snapshot, sets, reps, rest_seconds, notes? }] }`. Conferir shape exato do `POST /workouts` em `backend/api/src/routes/workouts.ts:141` antes de implementar.
- [ ] **Step 3:** Salvar: novo → `POST /workouts`; edição → carregar via `useWorkoutDetail(id)`, salvar via `PATCH` (exercises full-replace). Invalidate `['workouts']` e navegar para `/treinos`. Validação: nome obrigatório, ≥1 exercício.
- [ ] **Step 4:** Commit: `feat(web): builder de treino com catálogo Wger`

### Task 4: Atribuir treino (`/treinos/:id/atribuir`)

**Files:**
- Create: `web/src/pages/treinos/AtribuirPage.tsx`

- [ ] **Step 1:** Form: seletor de aluno (dropdown com busca sobre `useStudents`), checkboxes de dias da semana (1=seg…7=dom, conferir shape em `studentWorkouts.ts:129`), datas início/fim opcionais.
- [ ] **Step 2:** Submit → `POST /students/:studentId/workouts`; sucesso → toast + navegar para `/alunos/:studentId`. Tratar branches de erro da API exibindo a mensagem técnica no toast.
- [ ] **Step 3:** Botão "Atribuir" também acessível do card do treino na biblioteca e do detalhe do aluno (link com `?treino=:id` pré-selecionado). `npm run build`. Commit: `feat(web): atribuição de treino a aluno`
