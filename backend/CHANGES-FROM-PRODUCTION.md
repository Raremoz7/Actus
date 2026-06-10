# Mudanças do backend vs produção (para o Dev Back)

Este `backend/` é uma **cópia editável**; produção é a referência ("o original").

## Como achar tudo

```bash
grep -rn "ACTUS" backend/                                        # marcadores no código
git log --oneline origin/main..origin/branch/davi -- backend/    # commits de backend vs produção
```

Já integrado em `branch/davi`/`dev`: **A1** (`GET /students/:id/workouts`) e **B5 Par-Q**.
Em branches próprias (PR): **`feat/register-professional`** (`POST /auth/register-professional`),
**`feat/invite-preview`** (`GET /invites/:code/preview`).

---

## Changeset — A4: perfil rico (read-back) · branch `feat/profile-get`

**Motivação:** a tela `editar-perfil` abre vazia — o `PATCH /me` **grava** full_name/phone/
gênero/peso (em `user_basic_info`) + avatar/timezone (em `profiles`), mas **não havia GET** que
devolvesse esses campos. Este changeset adiciona o read-back.

### Endpoint

`GET /me/profile` — autenticado (`requireAuth`; serve aluno e profissional). **Não altera `GET /me`**
(que o bootstrap valida com `MeSchema`).

- Junta `profiles` (display_name, avatar_url, timezone) + `user_basic_info` (full_name, phone,
  gender, body_weight_kg, birth_date) via LEFT JOIN.
- `200 { id, tipo, display_name, avatar_url, timezone, full_name, phone, gender, body_weight_kg, birth_date }`.
  `body_weight_kg` é número (pg devolve numeric como string → convertido); `birth_date` em `YYYY-MM-DD`.
- **Profissional não tem `user_basic_info`** (tabela student-shaped) → os campos student vêm `null`.
  Quando `feat/register-professional` entrar (que põe `phone` em `profiles`), um follow-up pode
  fazer COALESCE do phone para profissionais.
- Erros no corpo: `profile_not_found` (404), `internal_error` (500); `401` sem token.

### Arquivos

| Arquivo | Mudança |
|---|---|
| `api/src/routes/me.ts` | NOVO handler `GET /profile` (+ helper de data). Procure `[ACTUS-NEW]`. |
| `api/src/openapi.ts` | NOVO path `/me/profile`. |
| `api/test/me.profile.int.test.ts` | NOVO. aluno (join + peso número + data); profissional (campos student null); sem token → 401. |

**Sem migration** (lê tabelas existentes).

### Integração no front (follow-up, não incluído aqui)
- Adicionar `endpoints.me.profile = '/me/profile'` + um hook `useMyProfile` e pré-preencher
  `editar-perfil`/avatar com a resposta. O `PatchMeBodySchema` do app já casa os campos de escrita.

> **Build (`dist/`):** changeset só toca `src/`/testes/openapi/doc. Rode `npm run build` em `backend/api` antes de `npm run start`.
