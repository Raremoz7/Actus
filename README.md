# Actus

Plataforma de gestão e engajamento para personal trainers, nutricionistas e alunos.

## Estrutura

| Pasta | O que é |
|---|---|
| `app/` | App mobile — React Native + Expo SDK 55, TypeScript estrito |
| `backend/` | API Node/Express + Postgres (cópia editável; a versão em produção é referência externa) |

Documentos de design: `backend/design.md` e `backend/SOMO_DESIGN_CONSTRAINTS.md`.

## Sistema de branches (Somo)

| Branch | Uso |
|---|---|
| `branch/davi` | Branch fixa do Davi |
| `branch/ale` | Branch fixa do Alexandre |
| `dev` | Integração — recebe via `/fechar` |
| `main` | Estável — só recebe da `dev` |
