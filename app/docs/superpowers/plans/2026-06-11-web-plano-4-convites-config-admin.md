# Actus Web — Plano 4: Convites + Configurações + Admin

> **For agentic workers:** REQUIRED SUB-SKILL: superpowers:subagent-driven-development ou executing-plans.

**Goal:** Telas de convites, configurações da conta e área /admin sobre os endpoints reais de staff.

**Pré-requisito:** Planos 1–3 concluídos.

**Endpoints reais:**
- `GET /invites` · `POST /invites` · `PATCH /invites/:invite_id` (conferir shapes em `backend/api/src/routes/invites.ts`)
- `POST /auth/change-password` (não retorna refresh novo → manter o refresh atual, só trocar access)
- Admin (requireStaff): `GET /admin/staff` · `PATCH /admin/staff/:user_id` · `POST /admin/professionals` · `PATCH /admin/professionals/:user_id` · `GET /admin/links/students` · `PATCH /admin/links/students/:link_id`

---

### Task 1: Convites (`/convites`)

**Files:**
- Create: `web/src/pages/convites/ConvitesPage.tsx`, `web/src/hooks/useInvites.ts`, `web/src/components/ui/Toast.tsx` (provider simples, canto inferior direito, Share Tech Mono)

- [ ] **Step 1:** `useInvites()` (`GET /invites`, Zod) + mutations criar/revogar. Conferir shape real do POST (campos e resposta) em `invites.ts:69` antes de implementar.
- [ ] **Step 2:** Página: botão "Gerar convite" → POST → modal (radius 24) com código + botão "Copiar link" (`navigator.clipboard`). Lista de convites: código (Share Tech Mono), status tag (pendente/aceito/expirado/revogado), data, ação revogar (PATCH) com confirmação.
- [ ] **Step 3:** Sidebar contextual: filtro por status. Commit: `feat(web): convites com geração e revogação`

### Task 2: Configurações (`/configuracoes`)

**Files:**
- Create: `web/src/pages/configuracoes/ConfiguracoesPage.tsx`

- [ ] **Step 1:** Seção "Perfil profissional": exibe display_name/email do `/me`; campos de perfil profissional (área, CREF, cidade) marcados `// [MOCK — sem endpoint na API v1]` desabilitados com aviso.
- [ ] **Step 2:** Seção "Trocar senha": senha atual + nova (≥8) + confirmação → `POST /auth/change-password`. **Regra crítica:** a resposta NÃO traz refresh novo — atualizar apenas o access token no store, preservar o refresh. Branch de erro → mensagem no form.
- [ ] **Step 3:** Botão "Sair" (logout). Commit: `feat(web): configurações com troca de senha`

### Task 3: Admin overview + staff (`/admin`)

**Files:**
- Create: `web/src/layouts/AdminLayout.tsx`, `web/src/pages/admin/AdminOverviewPage.tsx`, `web/src/pages/admin/StaffPage.tsx`, `web/src/hooks/useAdmin.ts`

- [ ] **Step 1:** `AdminLayout` = AppLayout com sidebar admin: Overview / Equipe / Vínculos / Profissionais. Guard `RequireAdmin` já existe (Plano 1).
- [ ] **Step 2:** `useStaff()` (`GET /admin/staff`), `useStudentLinks()` (`GET /admin/links/students`). Overview: KPI cards com counts (staff, vínculos ativos, vínculos por role) — somente dados que esses endpoints fornecem; nada de métricas inventadas.
- [ ] **Step 3:** `StaffPage`: tabela (nome, email, roles, must_change_password) + edição via PATCH em modal. Commit: `feat(web): área admin com overview e equipe`

### Task 4: Admin vínculos + criar profissional

**Files:**
- Create: `web/src/pages/admin/VinculosPage.tsx`, `web/src/pages/admin/ProfissionaisPage.tsx`

- [ ] **Step 1:** `VinculosPage`: tabela de `GET /admin/links/students` (aluno, profissional, role, status, linked_at) com filtro por status e ação ativar/desativar (`PATCH /admin/links/students/:link_id`) com confirmação.
- [ ] **Step 2:** `ProfissionaisPage`: form "Criar profissional" (`POST /admin/professionals` — discriminated union personal/nutricionista: email, senha, nome, nascimento, CREF/CRN opcionais, must_change_password default true). Toast de sucesso com aviso "usuário deverá trocar a senha no primeiro acesso".
- [ ] **Step 3:** `npm run build` + typecheck. Commit final: `feat(web): admin vínculos e criação de profissionais`

### Task 5: Fechamento

- [ ] **Step 1:** Revisão visual completa (todas as telas) contra o design system: tokens, radius, fontes, copy quiet luxury, 1 momento de motion por tela.
- [ ] **Step 2:** `README.md` em `web/` com setup (`npm i && npm run dev`, `VITE_API_URL`).
- [ ] **Step 3:** Commit: `docs(web): README do Actus Web`
