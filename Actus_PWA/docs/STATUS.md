# Actus PWA — Status da unificação

Sistema único web-first (desktop + mobile no navegador) que unifica app + backend do Actus num só monorepo. Front = codebase React Native rodando na web via **react-native-web + Vite** (sem Expo).

## ✅ Concluído

### Fase 0 — Spike de tooling (gate)
Vite + react-native-web + Unistyles 3 + Reanimated 4 + gesture-handler + svg + phosphor renderizam e buildam. Ver [`FASE-0-SPIKE.md`](FASE-0-SPIKE.md). Achado crítico: `@vitejs/plugin-react` **v4 + Vite 6** (a v6/Vite 8 ignora plugins Babel).

### Fase 1 — Monorepo + backend + boot do client
- **Monorepo** npm workspaces: `apps/client` (front), `apps/api` (backend copiado, original intocado).
- **Backend** em `apps/api`: cópia integral do backend Express+Postgres. **88/88 testes passam.** CORS já libera `http://localhost:5173`. Sobe via `docker compose up` (db+api) ou `npm run dev`.
- **Client bootando as telas reais do app** na web: `src` inteira do app trazida e rodando via RNW. Entry web (`src/main.tsx`), `@font-face` das fontes Barlow, alias `@/`, defines de env `EXPO_PUBLIC_*`.
- **Wrappers `.web`** para módulos nativos (o Vite resolve `.web.ts` primeiro): `secureStorage` (localStorage), `haptics` (Vibration API), `clipboard` (navigator.clipboard), `imagePicker` (`<input file>`), `push` (no-op), `sentry` (no-op), `reloadApp` (location.reload).
- **Shims de módulo** (alias no Vite): `react-native-bootsplash` → no-op, `@react-native-community/datetimepicker` → `<input date/time>`, `react-native-linear-gradient` → `react-native-web-linear-gradient`.
- **SVG**: `vite-plugin-svgr` + `Logo.web.tsx`. **Imagens wger**: `import.meta.glob` em `images.web.ts` (substitui `require`).
- **Navegação**: React Navigation com URLs reais (`/Auth/EscolhaPerfil`, `/Aluno/Tabs/...`). Corrigida corrida de boot no shim `router.ts` (enfileira navegação até o `navigationRef` ficar pronto — a navegação inicial se perdia na web).
- **Fluxo de auth**: `/` → Splash → despacho por estado (hidrata do storage) → EscolhaPerfil. **0 erros.**

### Fases 2–3 — Personas do app (validadas via DEV bypass + devMocks)
Todas as telas principais renderizam na web com **0 erros** e dados mockados reais:
- **Aluno**: home (treino do dia), treinos, desafios, perfil, alimentação, badges, onboarding.
- **Personal**: painel, alunos, treinos, desafios, perfil.
- **Nutri**: painel, alunos, dietas, perfil.

### Fase 5 — PWA + Landing + shell responsivo + URLs reais
- **PWA**: `vite-plugin-pwa` — manifest + service worker (workbox, `dist/sw.js`), ícones 192/512, apple-touch-icon, tema.
- **Landing como entrada** (`src/screens/landing.tsx`): reconstruída em react-native-web com a **copy canônica** da LP do `web` e o design system (Barlow Condensed black uppercase, paleta teal, neon). Hero + destaques + cards + reviews + CTA + footer. É a rota `/landing`; o Splash manda o usuário deslogado para lá; CTAs → login/cadastro.
- **Shell responsivo**: `AppFrame` (breakpoints Unistyles) centraliza as telas do app numa coluna no desktop; a **landing usa largura total**. Cap global de largura removido do `index.html`.
- **URLs reais / deep-links**: `linking.config` COMPLETO no `App.tsx` cobrindo toda a árvore de navegação → URLs limpas (`/landing`, `/login`, `/aluno`, `/personal`, ...), à prova de refresh e compartilháveis. (Corrigiu um bug latente: o config parcial anterior fazia o catch-all `*`→NotFound sequestrar URLs na web.)

### Fase 6 — Deploy
`apps/client/Dockerfile` (build Vite → nginx) + `nginx.conf` (fallback SPA + cache). Mesmo padrão do `web`.

## ⏳ Pendente / próximos passos

- **Login e2e ao vivo**: falta rodar contra o backend real (precisa do Docker Desktop ligado). Passo a passo abaixo. As telas já foram provadas via devMocks; os 88 testes do backend passam.
- **Confirmação visual em navegador real**: o preview headless mede geometria como 0 (aba sem viewport) e não anima (rAF estrangulado). Layout/centralização/animações precisam ser vistos abrindo `http://localhost:5173`.
- **Layouts desktop dedicados (Fase 4)**: as telas do app agora **centralizam** no desktop (AppFrame). Painéis multi-coluna que aproveitem a largura (ex.: gestão de academia/rede e admin, que só existem no projeto `web`) são net-new neste codebase RN — reconstrução é trabalho à parte.
- **Landing — enriquecimento**: a LP já é a entrada com a copy canônica, mas **sem os mockups de celular e as fotos de academia** (assets de marketing do `web`) e **sem as animações de scroll GSAP**. Portar esses assets/animações é polimento futuro.
- **`packages/shared`**: contratos Zod/libs ainda vivem dentro de `apps/client` (trazidos do app). Extrair para pacote compartilhado é refactor futuro.
- **Otimização de bundle**: 2.7 MB (700 KB gzip) num chunk — falta code-splitting por rota/persona.
- **Push web / Sentry web / observabilidade**: hoje no-op.

## Como rodar

```bash
# 1) Backend (precisa do Docker Desktop ligado) — a partir de apps/api:
cd apps/api && docker compose up --build      # db (5433) + api (3000), migrations+seeds no 1º boot

# 2) Client — a partir da raiz:
npm run client                                 # http://localhost:5173
```

Login e2e: abrir `http://localhost:5173`, ir em "Entrar", usar uma conta semeada pelo backend (ver seeds em `apps/api/local/`).

Varrer telas sem backend: descomentar `EXPO_PUBLIC_DEV_BYPASS_AUTH=1` e `EXPO_PUBLIC_DEV_TIPO` em `apps/client/.env`.
