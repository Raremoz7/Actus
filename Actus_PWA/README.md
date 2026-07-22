# Actus PWA — super-sistema web unificado

Monorepo que unifica app + web + backend do Actus em **um único sistema web-first** (desktop + mobile no navegador), a partir da LP.

- **Front (`apps/client`)** — codebase único React Native rodando na web via **react-native-web**, empacotado com **Vite** (sem Expo). Reaproveita a lógica pura do app original (schemas Zod, libs, hooks React Query, stores).
- **Backend (`apps/api`)** — cópia do backend Express + PostgreSQL existente (fase 1).
- **`packages/shared`** — contratos Zod + libs puras compartilhados (fase 1).

> Os projetos originais (`../app`, `../web`, `../backend`) permanecem intocados. Este é um repositório novo e independente.

## Status

O app inteiro (aluno / personal / nutri) **já roda na web** via react-native-web + Vite, contra o backend copiado, com PWA e deploy configurados. Detalhes completos e pendências em [`docs/STATUS.md`](docs/STATUS.md).

- **Fase 0** (tooling) ✅ — [`docs/FASE-0-SPIKE.md`](docs/FASE-0-SPIKE.md). Crítico: `@vitejs/plugin-react` **v4 + Vite 6**.
- **Fase 1** (monorepo + backend + boot) ✅ — backend 88/88 testes; client bootando as telas reais.
- **Fases 2–3** (aluno/personal/nutri) ✅ — todas as telas renderizam com 0 erros.
- **Fase 5** (PWA) ✅ parcial — manifest + service worker + ícones.
- **Fase 6** (deploy) ✅ — `apps/client/Dockerfile` + nginx.
- Pendente: login e2e ao vivo (Docker), layouts desktop dedicados, LP de marketing, `packages/shared`, code-splitting.

## Rodar

```bash
cd apps/api && docker compose up --build   # backend: db (5433) + api (3000)
npm run client                             # client: http://localhost:5173
```

## Rodar o spike

```bash
npm install
npm run client        # vite dev em http://localhost:5173
npm run client:build  # build de produção (checagem estática)
```
