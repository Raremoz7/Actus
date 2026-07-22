# Mudanças do backend vs produção (para o Dev Back)

Este `backend/` é uma **cópia editável**; produção é a referência ("o original").
Aqui ficam as mudanças que ainda **não existem em produção**, para o Dev Back portar.

## Como achar tudo

```bash
grep -rn "ACTUS" backend/                                        # marcadores no código
git log --oneline origin/main..origin/dev -- backend/            # commits de backend vs produção
```

## Índice de changesets

| # | O quê | Endpoint(s) | Migration |
|---|---|---|---|
| A1 | Treinos atribuídos do aluno (visão do pro) | `GET /students/:id/workouts` | — |
| B5 | Par-Q (questionário de prontidão) | `POST /students/:id/par-q`, `GET /me/par-q`, `GET /professional/students/:id/par-q` (+ bulk) | `20260610120000_par_q.sql` (tabela `par_q_responses`) |
| — | Auto-cadastro de profissional | `POST /auth/register-professional` | `20260610130000_actus_register_professional.sql` (`profiles.phone`) |
| A3 | Preview público de convite | `GET /invites/:code/preview` | — |
| A4 | Perfil rico (read-back) | `GET /me/profile` | — |
| — | Upload de avatar | `POST /me/avatar` (multipart) + `/uploads` estático | — |

> A1 e B5 já vinham integrados; os três últimos entraram nesta rodada de integração.
> **Ordem das migrations:** `..._120000_par_q.sql` antes de `..._130000_..._register_professional.sql` (timestamps distintos, sem colisão).

---

## Auto-cadastro de profissional — `POST /auth/register-professional`

Card MVP "Fluxo de Cadastro (personal)". Em produção, profissional só nasce via
`POST /admin/professionals` (staff). Aqui o próprio se cadastra: conta **ATIVA + tokens**
(espelha `/register`, sem convite).

- **Body** (fiel ao `RegisterProfessionalBodySchema` do app): `{ email, password (min 8),
  full_name (min 3), phone (min 6), lgpd_consent?, policy_version? }`.
- Cria `app_users` + `profiles` (**`tipo='personal'`**, `display_name`, `phone`) + `user_lgpd_consents`.
  Sem `user_basic_info` (student-shaped, `birth_date NOT NULL`) → `phone` no `profiles`
  (migration aditiva `profiles.phone`).
- Resposta `201 { access_token, access_token_expires_in, refresh_token }`. Erros no corpo:
  `invalid_body` (400), `email_already_in_use` (409), `internal_error` (500).
- Cria sempre `personal` (o contrato do app não envia `role`; nutri = extensão futura).
- Arquivos: `routes/auth.ts`, migration `20260610130000_actus_register_professional.sql`,
  `openapi.ts`, `test/auth.register-professional.int.test.ts`, `test/helpers/testDb.ts` (profiles.phone).

## Preview público de convite — `GET /invites/:code/preview`

Passo 1 do cadastro valida o código ANTES de logar (e devolve quem convidou).

- **PÚBLICO** (sem auth), read-only (não consome). `200 { ok:true, professional_display_name, avatar_url }`.
  Erros no corpo: `404 invalid_invite`/`invalid_invite_professional`, `410 invite_expired`/`invite_exhausted`.
- Montado **antes** do `/invites` protegido (mais específico + sem `requireAuth`).
- Sem migration (usa `invites` + `profiles`).
- Arquivos: `routes/invitePreview.ts`, `app.ts` (mount), `openapi.ts`, `test/invites.preview.int.test.ts`.

## Perfil rico (read-back) — `GET /me/profile`

Destrava `editar-perfil` (o `PATCH /me` grava, faltava o GET).

- Autenticado (serve aluno e profissional). **Não altera `GET /me`** (bootstrap/`MeSchema`).
- LEFT JOIN `profiles` + `user_basic_info`. `200 { id, tipo, display_name, avatar_url, timezone,
  full_name, phone, gender, body_weight_kg, birth_date }`. `body_weight_kg` numérico;
  `birth_date` `YYYY-MM-DD` por **componentes UTC** (coluna `date` volta à meia-noite UTC —
  locais dariam off-by-one em UTC-3). Profissional sem `user_basic_info` → campos student `null`.
- Sem migration. Arquivos: `routes/me.ts`, `openapi.ts`, `test/me.profile.int.test.ts`.
- Follow-up no front: `endpoints.me.profile` + hook + prefill de `editar-perfil`/avatar.

## Upload de avatar — `POST /me/avatar`

`profiles.avatar_url` existia, mas não havia como o usuário definir uma foto (sem upload/storage).

- Autenticado (qualquer tipo). **multipart/form-data**, campo `avatar` (JPEG/PNG/WebP, ≤ 5 MB).
- Grava em disco (`AVATAR_UPLOAD_DIR`, default `<api>/uploads`) com nome `<userId>-<uuid>.<ext>`,
  seta `profiles.avatar_url` para a URL servida em `/uploads/<arquivo>` (estático, público).
  `201 { avatar_url }`; erros `invalid_image` (400), `internal_error` (500); `401` sem token.
- **Storage = disco local** (escolha: rápido, sem credencial). NÃO é production-grade — para
  produção, trocar `meAvatar.ts` (fs.writeFile + base da URL) por Supabase Storage/S3 (interface
  do endpoint não muda). Base da URL respeita `PUBLIC_BASE_URL`; senão deriva do request.
- Sem migration. `uploads/` ignorado no git. Dep nova: `multer`.
- Arquivos: `routes/meAvatar.ts`, `app.ts` (mount + `express.static`), `openapi.ts`,
  `test/me.avatar.int.test.ts`. Front: `expo-image-picker` → `POST /me/avatar` → exibe em
  `AccountScreen`/`editar-perfil` (fallback = iniciais).

> **Build (`dist/`):** os changesets tocam `src/`/testes/migration/openapi/doc — não o JS compilado.
> Rode `npm run build` em `backend/api` antes de `npm run start`.
