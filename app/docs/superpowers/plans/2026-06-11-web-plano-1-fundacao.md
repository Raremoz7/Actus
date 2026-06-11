# Actus Web — Plano 1: Fundação

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development ou superpowers:executing-plans. Steps usam checkbox (`- [ ]`).

**Goal:** Scaffold do React SPA com design system Actus, auth completa (login + refresh rotativo) e layout B (top nav + sidebar contextual) com roteamento protegido.

**Architecture:** Vite + React 18 + TypeScript em `web/` na raiz do monorepo. Axios com interceptors de refresh (mesmas regras do app mobile), Zustand para auth, TanStack Query v5 para dados, Tailwind com tokens CSS do design system.

**Tech Stack:** Vite, React 18, React Router v6, TanStack Query v5, Axios, Zod, Zustand, Tailwind CSS.

**Spec:** `app/docs/superpowers/specs/2026-06-11-web-personal-admin-design.md`

---

### Task 1: Scaffold + design tokens

**Files:**
- Create: `web/package.json`, `web/vite.config.ts`, `web/tsconfig.json`, `web/tailwind.config.ts`, `web/index.html`, `web/src/main.tsx`, `web/src/index.css`

- [ ] **Step 1:** `npm create vite@latest web -- --template react-ts` na raiz do monorepo; instalar deps:

```bash
cd web && npm i react-router-dom @tanstack/react-query axios zod zustand
npm i -D tailwindcss @tailwindcss/vite
```

- [ ] **Step 2:** Configurar Tailwind v4 via plugin Vite. Em `web/src/index.css`:

```css
@import "tailwindcss";
@import url('https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@400;600;700;800;900&family=Barlow:wght@400;500;600;700&family=Share+Tech+Mono&display=swap');

@theme {
  --color-bg-lowest: #10252D;
  --color-bg-base: #1A343F;
  --color-surface-1: #203F4B;
  --color-surface-2: #294B58;
  --color-surface-3: #345867;
  --color-surface-4: #406575;
  --color-neon: #CBFE00;
  --color-secondary: #4DE082;
  --color-text-1: #FFFFFF;
  --color-text-2: rgba(255,255,255,0.70);
  --color-text-3: rgba(255,255,255,0.50);
  --color-text-inv: #141414;
  --color-outline: #8E9379;
  --color-outline-v: #444933;
  --color-on-surface: #E2E4CF;
  --color-success: #4ADE80;
  --color-warning: #FBBF24;
  --color-error: #F87171;
  --font-display: 'Barlow Condensed', sans-serif;
  --font-body: 'Barlow', sans-serif;
  --font-mono: 'Share Tech Mono', monospace;
}

body { background: var(--color-bg-base); color: var(--color-text-1); font-family: var(--color-font-body, 'Barlow', sans-serif); }
```

- [ ] **Step 3:** `npm run build` passa. Commit: `feat(web): scaffold Vite + tokens do design system`

### Task 2: API client + auth store

**Files:**
- Create: `web/src/api/client.ts` (axios + interceptors), `web/src/api/auth.ts`, `web/src/store/authStore.ts`, `web/src/lib/schemas.ts`

- [ ] **Step 1:** `client.ts` — axios com `baseURL` de `import.meta.env.VITE_API_URL ?? 'http://localhost:3000'`. Interceptor de response implementa as regras críticas:
  - body `error === 'invalid_token'` → tenta `POST /auth/refresh` com refresh_token do localStorage; **persiste o novo refresh** (rotaciona); refaz a request original; se refresh falha → logout
  - `error === 'missing_authorization'` → logout
  - fila de requests durante refresh (single-flight)

```ts
// web/src/api/client.ts
import axios, { AxiosError, type AxiosRequestConfig } from 'axios';
import { useAuthStore } from '../store/authStore';

export const api = axios.create({ baseURL: import.meta.env.VITE_API_URL ?? 'http://localhost:3000' });

api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().accessToken;
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

let refreshing: Promise<string | null> | null = null;

async function doRefresh(): Promise<string | null> {
  const { refreshToken, setTokens, logout } = useAuthStore.getState();
  if (!refreshToken) { logout(); return null; }
  try {
    const r = await axios.post(`${api.defaults.baseURL}/auth/refresh`, { refresh_token: refreshToken });
    setTokens(r.data.access_token, r.data.refresh_token); // refresh ROTACIONA
    return r.data.access_token as string;
  } catch { useAuthStore.getState().logout(); return null; }
}

api.interceptors.response.use(undefined, async (err: AxiosError<{ error?: string }>) => {
  const branch = err.response?.data?.error;
  const original = err.config as AxiosRequestConfig & { _retried?: boolean };
  if (branch === 'invalid_token' && !original._retried) {
    refreshing ??= doRefresh().finally(() => { refreshing = null; });
    const token = await refreshing;
    if (token) { original._retried = true; original.headers = { ...original.headers, Authorization: `Bearer ${token}` }; return api(original); }
  }
  if (branch === 'missing_authorization') useAuthStore.getState().logout();
  return Promise.reject(err);
});
```

- [ ] **Step 2:** `authStore.ts` — Zustand com persistência em localStorage: `accessToken`, `refreshToken`, `user` (id, display_name, roles), `setTokens`, `setUser`, `logout`. Selector `isAdmin = roles.includes('actus_admin')`.
- [ ] **Step 3:** `auth.ts` — `login(email, password)` chama `POST /auth/login`, valida com Zod (`LoginResponseSchema` em `schemas.ts`: access_token, refresh_token), busca `GET /me` e popula o store. Tratar branch `invalid_credentials` → mensagem na UI; `must_change_password` (403) → não deslogar, exibir aviso "troque a senha pelo app".
- [ ] **Step 4:** Commit: `feat(web): api client com refresh rotativo + auth store`

### Task 3: Login + roteamento protegido

**Files:**
- Create: `web/src/pages/login/LoginPage.tsx`, `web/src/routes.tsx`, `web/src/components/RequireAuth.tsx`, `web/src/components/RequireAdmin.tsx`

- [ ] **Step 1:** `LoginPage` — card centrado em `bg-base`: logo ACTUS (Barlow Condensed 900 neon), inputs email/senha (surface-1, radius 12, focus border neon), botão pill neon "Entrar" (texto #141414, uppercase). Erro `invalid_credentials` → texto `--color-error` abaixo do form.
- [ ] **Step 2:** `RequireAuth` redireciona para `/login` sem token; `RequireAdmin` redireciona para `/` se `!isAdmin`. `routes.tsx` com `createBrowserRouter`: `/login`, layout autenticado com filhos placeholder (`/`, `/alunos`, `/treinos`, `/convites`, `/configuracoes`, `/admin/*`).
- [ ] **Step 3:** Commit: `feat(web): login + guards de rota`

### Task 4: AppLayout (layout B)

**Files:**
- Create: `web/src/layouts/AppLayout.tsx`, `web/src/layouts/Sidebar.tsx`, `web/src/components/ui/Button.tsx`, `web/src/components/ui/Card.tsx`, `web/src/components/ui/Tag.tsx`, `web/src/components/ui/Skeleton.tsx`

- [ ] **Step 1:** `AppLayout` — top nav 52px `bg-lowest` border-b `outline-v`: logo ACTUS neon, abas (NavLink) Alunos · Treinos · Convites, aba Admin só se `isAdmin`; à direita avatar com iniciais (clicável → menu com Configurações / Sair). Aba ativa: texto branco + border-bottom 2px neon.
- [ ] **Step 2:** `Sidebar` — 196px `bg-lowest`, recebe `sections: { label: string; items: { name: string; count?: number; to?: string; active?: boolean; onClick?: () => void }[] }[]`. Labels de seção em Share Tech Mono 9px uppercase tracking-widest text-3; item ativo `bg-neon/10 text-neon` radius 8.
- [ ] **Step 3:** Componentes UI: `Button` (variantes primary pill neon / secondary outline / ghost), `Card` (surface-1, border outline-v, radius 12), `Tag` (radius 4, variantes default/active/warn/error), `Skeleton` (pulse em surface-2).
- [ ] **Step 4:** Páginas placeholder renderizam dentro do layout com sub-header (título Barlow Condensed 900 uppercase). `npm run build` + smoke manual. Commit: `feat(web): AppLayout B + componentes UI base`
