# Mudanças do backend vs produção (para o Dev Back)

Este `backend/` é uma **cópia editável**; produção é a referência ("o original").

## Como achar tudo

```bash
grep -rn "ACTUS" backend/                                        # marcadores no código
git log --oneline origin/main..origin/branch/davi -- backend/    # commits de backend vs produção
```

Já integrado em `branch/davi`/`dev`: **A1** (`GET /students/:id/workouts`) e **B5 Par-Q**
(`/me/par-q`, `/professional/students/:id/par-q` + bulk + migration `par_q_responses`).
Em branches próprias: **`feat/register-professional`** (`POST /auth/register-professional`).

---

## Changeset — A3: preview público de convite · branch `feat/invite-preview`

**Motivação:** passo 1 do cadastro valida o código de convite ANTES de criar a conta. O app já
chama `GET /invites/:code/preview` (`useInvitePreview`) e degrada se não existir; este changeset
cria o endpoint real e ainda devolve quem convidou (para o card do convidador deixar de ser mock).

### Endpoint

`GET /invites/:code/preview` — **PÚBLICO** (sem auth), read-only (não consome/incrementa o convite).

- **200** `{ ok: true, professional_display_name, avatar_url }` quando o convite é válido.
- Erro no corpo (`{ error }`, padrão da API), status não-2xx p/ o interceptor do app disparar:
  - `404 invalid_invite` (código inexistente) · `404 invalid_invite_professional` (emissor não é profissional)
  - `410 invite_expired` · `410 invite_exhausted`
- O app valida só `{ ok: true }` (`InvitePreviewSchema`, passthrough) — os campos do convidador são
  opcionais e aproveitados pelo card.

### Arquivos

| Arquivo | Mudança |
|---|---|
| `api/src/routes/invitePreview.ts` | NOVO router público. Lê `invites` + `profiles` (nome/avatar do emissor). |
| `api/src/app.ts` | Monta `/invites/:code/preview` **antes** do `/invites` protegido (mais específico + sem `requireAuth`). Procure `[ACTUS-NEW]`. |
| `api/src/openapi.ts` | NOVO path `/invites/{code}/preview` (sem security). |
| `api/test/invites.preview.int.test.ts` | NOVO. válido→200+nome; expirado→410; esgotado→410; inexistente→404; sem auth não dá 401. |

**Sem migration** (usa `invites` + `profiles` existentes).

### Como aplicar / integrar no front
1. Subir o router (já montado, público).
2. Front já consome via `useInvitePreview` — passa a validar de verdade no passo 1; o card do
   convidador pode usar `professional_display_name`/`avatar_url` (deixa de ser [MOCK]).

> **Build (`dist/`):** changeset só toca `src/`/testes/openapi/doc. Rode `npm run build` em `backend/api` antes de `npm run start`.
