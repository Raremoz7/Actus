# Pendências da API (backend) — o que falta para o app mobile

> Lista compilada a partir dos marcadores no código do app (`[MOCK — sem endpoint na API v1]`,
> `não existe`, `SHAPE A CONFIRMAR`, mocks em `src/mocks/`). Cada item diz **o que o app precisa**,
> **como ele se vira hoje** (mock/placeholder) e o **contrato sugerido**. Backend:
> `actutus_fit_backend-main` (referência — alterar lá, não a partir deste repo).
>
> **Este doc é o sinal para o Dev Backend.** O app já implementou tudo que dava do lado dele;
> o que sobra aqui é o que **só o backend** pode resolver.

Legenda de prioridade: 🔴 bloqueia feature · 🟡 degrada UX · ⚪ cosmético/futuro.

## Estado atual (o que o app JÁ resolveu sozinho — não precisa do backend)

- **Catálogo de exercícios (Wger) → OFFLINE/bundled.** O app gera um snapshot do Wger em
  build-time (`scripts/build-wger-snapshot.mjs` → `assets/wger/catalog.json` + imagens `.webp`,
  ~851 exercícios, CC-BY-SA com atribuição). Busca, nome, descrição, músculos e imagem rodam
  **sem rede**, chaveados por `wger_exercise_id`. → **Backend NÃO precisa** de endpoint de busca
  nem de hospedar mídia de exercício. Única exigência abaixo (C0).
- **Validação de convite no cadastro** consome `GET /invites/:code/preview` via
  `useInvitePreview` e **degrada graciosamente** se o endpoint não existir. (Backend ainda
  precisa implementá-lo — item A3.)
- **Treinos atribuídos (pro)**, **editar/remover atribuição**: app pronto contra contrato (A1).

---

## A) Endpoints faltando

### A1. 🔴 GET treinos atribuídos a um aluno (visão do profissional)
- **Precisa:** `GET /students/:student_id/workouts` → lista as atribuições de um aluno para o personal (listar/editar/remover na tela de detalhe do aluno).
- **Hoje:** só existe `POST` (atribuir) e `PATCH` (editar/desativar). Sem o GET a lista fica vazia.
- **Contrato:** documento dedicado em [`docs/contrato-backend-treinos-do-aluno.md`](./contrato-backend-treinos-do-aluno.md) (shape, autorização e SQL pronto).
- **App:** `useProStudentWorkouts.ts`, `StudentDetailScreen.tsx`.

### A2. ⚪ (Opcional) DELETE de atribuição de treino
- **Precisa:** `DELETE /students/:student_id/workouts/:student_workout_id` para remoção real.
- **Hoje:** "Remover" usa `PATCH { is_active:false }` (soft-disable). Funciona; trocar para DELETE é 1 linha no app (`useUpdateStudentWorkout`).

### A3. 🟡 GET preview do convite — `GET /invites/:code/preview`
- **Precisa:** endpoint **público (sem auth)** que valida um código de convite e (recomendado) devolve quem convidou.
  - **Mínimo (já consumido pelo app — validação no passo 1 do cadastro):**
    - `200 { "ok": true }` para convite **válido**.
    - erro no corpo (campo `error`) para inválido/expirado/esgotado, ex.: `{ "error": "invalid_code" }`, `"invite_expired"`, `"invite_exhausted"`. O app trata como código inválido.
  - **Recomendado (para o card do convidador, hoje neutro):** incluir `professional_display_name` e `avatar_url` (nullable) → `200 { "ok": true, "professional_display_name": "...", "avatar_url": null }`.
- **Hoje:** o app **já chama** este endpoint (`useInvitePreview`) e **degrada graciosamente** se não existir (segue o fluxo; o `register` no passo 3 valida como antes). O card mostra texto neutro até os campos do convidador existirem.
- **App:** `src/hooks/useInvitePreview.ts`, `src/types/invites.ts` (`InvitePreviewSchema`, lenient/passthrough), `app/(auth)/cadastro/passo-1-convite.tsx`, `endpoints.invitePreview(code)`.

### A4. 🟡 GET dos campos ricos do perfil (leitura)
- **Precisa:** um GET que devolva `full_name`, `phone`, `gender`, `body_weight_kg`, `avatar_url`, `timezone`. Opções: estender `GET /me` ou criar `GET /me/profile`.
- **Hoje:** `GET /me` devolve só `{ id, tipo, display_name }`. Esses campos são **write-only** via `PATCH /me` — não voltam em nenhum GET. Por isso a tela de editar perfil começa vazia (só `display_name` faz round-trip) e o avatar é placeholder com a inicial.
- **App:** `app/editar-perfil.tsx`, `AccountScreen.tsx` (avatar).

### A5. ⚪ GET de detalhe de desafio (aluno)
- **Precisa:** `GET /me/challenges/:id` (detalhe). Confirmar também o shape de `GET /me/challenges` (teaser/lista) — hoje marcado `SHAPE A CONFIRMAR`.
- **Hoje:** o detalhe do desafio do aluno usa o item já cacheado da lista (não há GET de detalhe).
- **App:** `app/(aluno)/desafio/[id].tsx`, `src/types/challenges.ts` (ChallengeTeaser).

---

## B) Fluxos inteiros sem API

### B1. 🟡 Reset de senha ("Esqueci a senha")
- **Precisa:** fluxo de recuperação (solicitar e-mail → token → trocar senha).
- **Hoje:** sem isso na API v1 → o login **não** exibe link "Esqueci a senha".
- **App:** `app/(auth)/login.tsx`.

### B2. ⚪ Auto-cadastro de profissional
- **Precisa:** fluxo de cadastro de personal/nutri por conta própria.
- **Hoje:** não existe na API v1 → tela `professor-info` é informativa ("fluxo futuro"); profissionais entram por seed/admin.
- **App:** `app/(auth)/professor-info.tsx`.

### B5. 🔴 Par-Q (questionário de prontidão) — persistência no servidor
- **Precisa:** três endpoints (branch de erro sempre no campo `error`, padrão da API):
  - `POST /students/:student_id/par-q` — aluno autenticado envia as 7 respostas (sim/não);
    servidor carimba `answered_at`, deriva `any_yes` e calcula `valid_until` (+12 meses).
  - `GET /me/par-q` — aluno lê o próprio status/respostas.
  - `GET /professional/students/:student_id/par-q` — profissional vinculado lê status/respostas.
- **Hoje:** front **100% pronto** rodando sobre mock local (`src/mocks/parq.ts`, persistido em
  SecureStore no aparelho). **Limitação real: o dado não trafega entre devices** — o personal só
  vê selo/respostas no mesmo aparelho (vale para demo/dev). Em produção, sem esses endpoints o
  Par-Q respondido pelo aluno **não chega** ao profissional.
- **Contrato:** schema Zod pronto em `src/types/parq.ts` (`ParqSubmissionSchema`: `student_id`,
  `answers[7]{question_id 1-7, value bool}`, `any_yes`, `answered_at`, `valid_until` — datas
  `YYYY-MM-DD`). Migração no app = trocar o store por `useQuery` + `parseApi` sobre o mesmo
  schema, zero refator de telas.
- **App:** `app/(aluno)/par-q.tsx` (questionário), `src/components/parq/` (átomos),
  `ParqSection` no detalhe do aluno, selo na lista de alunos, banner no atribuir-treino,
  card na Home do aluno.

### B3. ⚪ Preferências de notificação
- **Precisa:** GET/PATCH de preferências de notificação.
- **Hoje:** linha "Notificações" aparece como "em breve" (sem navegação morta).
- **App:** `AccountScreen.tsx`.

### B4. ⚪ Documento legal (Termos & Privacidade)
- **Precisa:** fonte do documento (URL ou conteúdo) para exibir no app.
- **Hoje:** linha "Termos & privacidade" marcada "em breve".
- **App:** `AccountScreen.tsx`.

---

## C) Exercícios (Wger) — RESOLVIDO no app; só uma exigência ao backend

### C0. 🔴 (Contrato/constraint) `wger_exercise_id` = id da exercise-base do Wger
- **Resolvido no app:** o catálogo de exercícios (nome, descrição, músculos, equipamento e
  **imagem**) agora é **bundled offline** a partir de um snapshot do Wger
  (`scripts/build-wger-snapshot.mjs` → `assets/wger/`). O `montar-treino` faz busca real nesse
  catálogo e envia o **`wger_exercise_id` real**. **Não há mais** necessidade de endpoint de busca
  nem de hospedagem de mídia no backend.
- **O que o backend precisa garantir:** que o `wger_exercise_id` armazenado em
  `workout_exercises` seja sempre o **id da exercise-base do Wger** (a mesma chave usada pelo
  snapshot e pelas imagens). Se o backend gerar/aceitar ids de outra origem, o app não acha a
  mídia. Hoje o backend só persiste o número que o app manda — então basta **manter esse contrato**
  e não inventar id próprio.
- **Observação:** vídeo de exercício ficou **fora de escopo** (não há base aberta/gratuita com
  cobertura de vídeo; o Wger tem ~78 vídeos só). Cobertura visual = imagem estática do Wger.
- **App:** `scripts/build-wger-snapshot.mjs`, `assets/wger/`, `src/lib/wger/`,
  `montar-treino.tsx`, `src/features/builder/toApiExercises.ts`.

### C3. ⚪ "Próxima refeição" da dieta no card HOJE
- **Precisa:** a API de dieta expor a próxima refeição (ou o app derivar do `body` por horário).
- **Hoje:** mock em `src/mocks/home.ts`.

---

## D) Shapes a confirmar (já consumidos, validar contrato)
- `GET /me/workouts` → `TodayWorkoutSummary` (card do HOJE) — `src/types/workouts.ts:12`.
- `GET /me/challenges` → `ChallengeTeaser` — `src/types/challenges.ts:201`.
- (OK, já verificados: `/professional/challenges/:id/report`, `/workouts`, `/me/student/workouts`, `/me/student/diets`.)

---

## E) Ambiente / migrations (não é endpoint, mas é backend)

### E1. 🔴 Banco de dev sem triggers/funções
- No Postgres de **dev** local, `pg_trigger` está vazio e `recompute_student_streak` não existe — as migrations de **gamificação** e **enforcement** não foram aplicadas por completo.
- **Efeito:** streak/`total_workouts_completed` não atualizam em tempo real (concluir treino/check-in); triggers de validação (owner de workout=personal, dieta=nutri, role do link) não rodam.
- **Ação:** garantir que `supabase/migrations/2026042312*.sql`, `2026050*.sql` rodem por completo nesse ambiente. (O backend serve streak lendo `profiles`; o ranking de desafio é calculado ao vivo e funciona.)

---

## Resumo priorizado

| # | Item | Prioridade |
|---|------|-----------|
| A1 | GET treinos atribuídos do aluno (pro) | 🔴 |
| B5 | Par-Q — persistência no servidor (3 endpoints) | 🔴 |
| E1 | Migrations de triggers no dev | 🔴 |
| C0 | Manter `wger_exercise_id` = id da exercise-base Wger (sem trabalho; só não quebrar) | 🔴 |
| A3 | GET preview do convite (já consumido pelo app) | 🟡 |
| A4 | GET campos ricos do perfil | 🟡 |
| B1 | Reset de senha | 🟡 |
| D | Confirmar shapes /me/workouts, /me/challenges | 🟡 |
| A2 | DELETE de atribuição | ⚪ |
| A5 | Detalhe de desafio (aluno) | ⚪ |
| B2 | Auto-cadastro de profissional | ⚪ |
| B3 | Preferências de notificação | ⚪ |
| B4 | Termos & privacidade | ⚪ |
| C3 | Próxima refeição da dieta | ⚪ |

> **Resolvido no app (não é mais ask de backend):** busca de exercícios e mídia (agora Wger
> offline/bundled). Vídeo de exercício: fora de escopo (sem fonte aberta/gratuita).
