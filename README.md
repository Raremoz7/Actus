# Actus

Plataforma de gestão e engajamento para personal trainers, nutricionistas e alunos: o profissional monta treinos/dietas, convida alunos e acompanha aderência; o aluno executa o programa, registra sessões e participa de desafios com ranking e streak.

Monorepo com o app mobile e a API.

## Estrutura

| Pasta | O que é |
|---|---|
| `app/` | App mobile — React Native + Expo SDK 55, TypeScript estrito |
| `app/docs/` | Planos de bloco, contratos propostos e pendências de backend |
| `backend/` | API Node/Express + Postgres (cópia editável — ver [Produção](#produção)) |
| `backend/api/` | Código da API (`src/routes/` é a fonte da verdade dos endpoints) |
| `backend/supabase/migrations/` | Migrations SQL, em ordem cronológica |
| `backend/docs/` | Modelo de dados, segurança/RLS, roadmap, billing |

## Stack

| Lado | Tecnologias |
|---|---|
| App | Expo SDK 55 (dev build) · Expo Router · Unistyles 3 · Zustand · TanStack Query v5 + Axios · Zod · Reanimated · Sentry |
| API | Node + Express · TypeScript · Postgres 16 · JWT (access + refresh rotativo) · Zod · Swagger · Vitest |

## Como rodar

### API + banco

```bash
cd backend
docker compose up -d db        # Postgres 16 local (user/senha/db: actus)

cd api
cp .env.example .env.local     # preencher DATABASE_URL e JWT_ACCESS_SECRET
npm install
npm run dev                    # http://localhost:3000
```

- Migrations: aplicar os arquivos de `backend/supabase/migrations/` na ordem (são SQL puro).
- Documentação interativa: `http://localhost:3000/docs` (Swagger) · spec em `/openapi.json`.
- Testes: `npm test` (Vitest, integração — precisa do Postgres de pé).

### App mobile

```bash
cd app
npm install
npm start                      # expo start --dev-client
```

- Exige **development build** — Expo Go não funciona. Primeira vez: `npm run android` ou `npm run ios`.
- A API alvo vem de `EXPO_PUBLIC_API_BASE_URL` (no web, `EXPO_PUBLIC_API_BASE_URL_WEB` + `npm run cors-proxy`).
- Qualidade: `npm run typecheck` · `npm run lint` · `npm test` · `npm run doctor`.

## Fluxo de trabalho (branches Somo)

| Branch | Uso |
|---|---|
| `branch/davi` | Branch pessoal — todo trabalho acontece aqui |
| `dev` | Integração — recebe via `/fechar`, nunca commit direto |
| `main` | Estável — só recebe da `dev` |

Comandos no Claude Code: `/salvar` (commit + push na pessoal) · `/fechar` (merge na dev) · `/sync` (traz a dev).

## Leitura obrigatória antes de desenvolver

| Documento | Conteúdo |
|---|---|
| `app/AGENTS.md` | Regras críticas da API (refresh rotativo, branch por `error`, fusos), stack inegociável e processo por blocos |
| `backend/design.md` | Design system Actus — tokens, tipografia, componentes |
| `backend/SOMO_DESIGN_CONSTRAINTS.md` | Restrições de design obrigatórias |
| `app/docs/backend-pendencias.md` | Endpoints solicitados ao backend (Par-Q, preview de convite, biblioteca de treinos…) |
| `backend/docs/DATA-MODEL.md` | Modelo de dados do Postgres |

## Produção

A API em produção é deployada a partir do **repositório original do backend** (workflow SSH → VM, preservado em `backend/.github/workflows/deploy.yml`, inerte neste monorepo). O `backend/` daqui é a cópia de evolução: mudanças de contrato nascem aqui junto com o app e só chegam em produção ao serem levadas ao repo original.
