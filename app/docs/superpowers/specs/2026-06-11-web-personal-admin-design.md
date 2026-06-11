# Actus Web Personal + Admin — Design

**Data:** 2026-06-11 · **Branch:** `branch/davi` · **Autor:** Davi + Claude

> Objetivo: painel web para personal trainers gerenciarem alunos e treinos, e área `/admin` para a equipe Actus administrar a plataforma. Consome a API Express existente em produção. Design system idêntico ao app mobile.

---

## 1. Visão Geral

Um único React SPA com duas áreas protegidas por role:

- **Área Personal** (`/`) — gestão completa: dashboard, alunos, treinos, convites
- **Área Admin** (`/admin`) — visão da plataforma: usuários, métricas, moderação básica

Não há billing nem gestão de assinaturas — o backend não tem esses endpoints na v1.

---

## 2. Arquitetura

### 2.1 Stack

| Camada | Tecnologia |
|---|---|
| Framework | React 18 (Vite) |
| Roteamento | React Router v6 |
| Data fetching | TanStack Query v5 + Axios |
| Estilo | Tailwind CSS + tokens do design system Actus |
| Validação | Zod (toda resposta da API) |
| Auth storage | localStorage (access + refresh JWT) |

Build estático servido por nginx. Sem SSR.

### 2.2 Auth

Reutiliza os endpoints existentes:
- `POST /auth/login` — login com email + senha
- `POST /auth/refresh` — refresh rotativo (persiste novo refresh_token)
- `GET /me` — perfil + role do usuário

Regras herdadas do app mobile:
- `error === 'invalid_token'` → trigger de refresh
- `missing_authorization` → logout
- `must_change_password` (403) → redireciona para troca de senha (fluxo futuro)

**Guards de rota:**
- `<RequireAuth>` — redireciona para `/login` se não autenticado
- `<RequireAdmin>` — redireciona para `/` se role ≠ `actus_admin`

### 2.3 Estrutura de pastas

```
web/
  src/
    api/          # axios instance + interceptors (refresh, logout)
    components/   # componentes compartilhados (Button, Card, Table, Avatar, Tag…)
    layouts/      # AppLayout (top nav + sidebar), AdminLayout
    pages/        # uma pasta por rota
      dashboard/
      alunos/
      treinos/
      convites/
      configuracoes/
      admin/
    hooks/        # useStudents, useWorkouts, useSession…
    store/        # authStore (Zustand)
    lib/          # format, zod schemas
  index.html
  vite.config.ts
  tailwind.config.ts
```

---

## 3. Design System

Tokens idênticos ao app mobile (definidos em `tailwind.config.ts` como CSS custom properties):

```css
--bg-lowest:  #10252D;
--bg-base:    #1A343F;
--surface-1:  #203F4B;
--surface-2:  #294B58;
--surface-3:  #345867;
--surface-4:  #406575;
--neon:       #CBFE00;
--secondary:  #4DE082;
--text-1:     #FFFFFF;
--text-2:     rgba(255,255,255,0.70);
--text-3:     rgba(255,255,255,0.50);
--text-inv:   #141414;
--outline:    #8E9379;
--outline-v:  #444933;
--on-surface: #E2E4CF;
```

**Tipografia:**
- Barlow Condensed 800–900 uppercase → títulos, KPIs, CTAs, labels de seção
- Share Tech Mono → dados numéricos, timestamps, contadores, tags técnicas
- Barlow 400–600 → corpo, nomes, descrições

**Componentes base:**
- Botão primário: pill neon (`border-radius: 100px`), texto `#141414`, Barlow Condensed 900 uppercase
- Card: `bg-surface-1`, border `outline-v`, `border-radius: 12px`
- Input: `bg-surface-1`, border `outline-v` → focus border neon, `border-radius: 12px`
- Tag/chip: `border-radius: 4px`; variantes: default (surface-2), active (neon-dim/neon), warn (warning-dim/warning)
- Modal/sheet: `border-radius: 24px`, sombra apenas neles

**Responsividade:** desktop-first (1280px+), funcional em tablet (768px+). Mobile fora do escopo.

---

## 4. Layout

Layout B aprovado: **Top Nav + Sidebar Contextual**.

```
┌─────────────────── TOP NAV (52px) ────────────────────┐
│ ACTUS  │ Alunos  Treinos  Convites  │  [badge] [avatar]│
├────────┬──────────────────────────────────────────────┤
│        │  SUB-HEADER (52px)                           │
│SIDEBAR │  Título da tela              [Search] [CTA]  │
│ (196px)│──────────────────────────────────────────────│
│        │                                              │
│Filtros │         CONTEÚDO PRINCIPAL                   │
│e       │         (KPIs, listas, builder…)             │
│submenu │                                              │
│        │                                              │
└────────┴──────────────────────────────────────────────┘
```

- **Top nav:** abas Alunos · Treinos · Convites · (Admin para `actus_admin`)
- **Sidebar contextual:** muda conforme a aba ativa
  - Alunos: filtros por status (Todos, Ativos hoje, Sem treino, Inativos +7d) + grupos
  - Treinos: filtros por tipo (Todos, Meus templates, Biblioteca pública)
  - Convites: status (Pendentes, Aceitos, Expirados)
- **Sub-header:** título + busca + ação primária (botão neon)

---

## 5. Páginas — Área Personal

### 5.1 Dashboard (`/`)

**KPIs (4 cards):**
- Alunos ativos (total)
- Aderência média % (sessões `completed` / total de sessões previstas nos últimos 30d — calculado no frontend)
- Treinos hoje (count)
- Sessões na semana (count vs meta)

**Lista de alunos recentes** (últimos 8 ativos):
- Avatar iniciais + nome + treino atual + tag de status (Treinou hoje / Ontem / N dias inativo)
- Click navega para `/alunos/:id`

**Atividade recente** (painel lateral):
- Feed de eventos: sessão finalizada, meta semanal batida, alerta de inatividade

### 5.2 Lista de alunos (`/alunos`)

- Tabela/lista com: avatar, nome, treino atual, último treino, streak, status
- Filtros via sidebar (status + grupos)
- Busca por nome (client-side)
- Botão "Convidar aluno" → abre modal com link de convite

**API:** `GET /professional/students`

### 5.3 Detalhe do aluno (`/alunos/:id`)

Header: avatar, nome, tag de status.

Abas:
1. **Treinos atribuídos** — lista de `student_workouts` com ação "Atribuir treino"
2. **Histórico de sessões** — tabela de sessões (data, treino, duração, exercícios completados)
3. **Preferências** — dados do onboarding do aluno (interesse, experiência, dias/semana, local, altura) — `[MOCK]` até endpoint existir

**API:** `GET /students/:id` · `GET /students/:id/workouts` (sem endpoint v1 → lista vazia) · histórico de sessões `[MOCK]` até endpoint de sessões por aluno existir no backend

### 5.4 Biblioteca de treinos (`/treinos`)

- Grid de cards: nome do template, nº de exercícios, nº de alunos usando, data de criação
- Botão "Criar treino" → `/treinos/novo`
- Click no card → `/treinos/:id`

**API:** `GET /workouts`

### 5.5 Criar / Editar treino (`/treinos/novo` e `/treinos/:id`)

Layout dividido:

```
┌──────────────────┬─────────────────────────────┐
│  CATÁLOGO WGER   │    EXERCÍCIOS DO TREINO      │
│  [busca]         │                              │
│  Exercício A     │  1. Supino Reto  3×10  ···   │
│  Exercício B     │  2. Agachamento  4×8   ···   │
│  Exercício C     │  [+ Adicionar]               │
│  …               │                              │
│                  │  [Nome do treino: _______]   │
│                  │  [Salvar treino]              │
└──────────────────┴─────────────────────────────┘
```

- Busca no catálogo Wger (asset local — sem rede)
- Click em exercício do catálogo → adiciona à lista direita
- Inline edit de séries/reps/descanso por exercício
- Drag-and-drop para reordenar (biblioteca `@dnd-kit/core`)
- Salvar: `POST /workouts` (criar) ou `PATCH /workouts/:id` (editar)

### 5.6 Atribuir treino (`/treinos/:id/atribuir`)

- Seletor de aluno (dropdown com busca)
- Dias da semana (checkboxes)
- Data de início e fim (opcionais)
- Botão "Atribuir"

**API:** `POST /students/:id/workouts`

### 5.7 Convites (`/convites`)

- Botão "Gerar convite" → chama endpoint de criação de convite, exibe link copiável
- Lista de convites: código, status (pendente/aceito/expirado), data

**API:** `POST /invites` · `GET /invites` (se existir; `[MOCK]` até confirmar)

### 5.8 Configurações (`/configuracoes`)

- Perfil profissional (nome, área de atuação, CREF, cidade/UF) — `[MOCK]` até endpoint `/me/profile` existir
- Troca de senha (`POST /auth/change-password`)

---

## 6. Páginas — Área Admin (`/admin`)

Acessível apenas a `actus_admin`. Layout idêntico ao Personal mas com sidebar de admin.

### 6.1 Overview (`/admin`)

KPIs globais do que a API expõe:
- Total de usuários cadastrados
- Total de personals
- Total de alunos
- Sessões últimos 30 dias

Todos via endpoints existentes (a confirmar disponibilidade; `[MOCK]` onde não existir).

### 6.2 Usuários (`/admin/usuarios`)

- Tabela: nome, email, role, data de cadastro, status
- Filtro por role (personal / aluno) e status (ativo / inativo)
- Busca por nome/email
- Click → `/admin/usuarios/:id`

**API:** `GET /admin/users` (a confirmar; `[MOCK]` se não existir)

### 6.3 Detalhe do usuário (`/admin/usuarios/:id`)

- Dados do perfil
- Role e vínculos (aluno de qual personal / alunos do personal)
- Histórico resumido de uso

**API:** `GET /admin/users/:id` (a confirmar)

---

## 7. Estados e Feedback

- **Loading:** skeleton screens (não spinner) no carregamento inicial de listas e KPIs
- **Empty states:** copy quiet luxury — sem emoji, sem buzzword. Ex.: *"Nenhum aluno ainda. Gere um convite para começar."*
- **Erros de API:** toast discreto no canto inferior direito com mensagem técnica em Share Tech Mono
- **Ações destrutivas:** modal de confirmação com botão destrutivo em `#F87171`

---

## 8. Fora do Escopo (v1)

- Billing / assinaturas (nada no backend)
- App mobile-friendly (o app mobile já cobre isso)
- Notificações push / email
- Chat / mensagens entre personal e aluno
- IA criadora de treino (backlog separado)
- Dark/light mode toggle (dark mode único, igual ao app)

---

## 9. Endpoints `[MOCK]` previstos

| Endpoint | Motivo |
|---|---|
| `GET /students/:id/workouts` | Não existe na API v1 |
| `GET /admin/users` | A confirmar disponibilidade |
| `GET /admin/users/:id` | A confirmar disponibilidade |
| Preferências do aluno | Dependente do onboarding backend pendente |
| Perfil profissional | Dependente do onboarding backend pendente |
| `GET /invites` (listagem) | A confirmar disponibilidade |
