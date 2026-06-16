# Lacunas do backend de produção (`http://136.119.240.96:3000`)

O que o **front espera consumir**, **em que momento** da experiência, e que o backend de produção **não fornece** hoje. Levantado empiricamente em 2026-06-16, sondando cada endpoint do front (`src/api/endpoints.ts` + hooks) contra o remoto, autenticado nos papéis corretos.

> Critério de classificação:
> - **FALTA-ROTA (404)** — a rota não está no build que roda em produção (build mais antigo que o repositório).
> - **FALTA-TABELA (500)** — a rota **existe e está deployada**, mas o banco remoto não tem a tabela (`relation … does not exist`).

### Como foi confirmado (duas fontes independentes)

1. **`GET /openapi.json` de produção** (build `Actus API 0.1.0`) — lista as **48 rotas que o processo realmente expõe**. É a fonte autoritativa do que está deployado.
2. **Sondagem HTTP ao vivo** — cada endpoint do front batido no remoto, autenticado. 404 com corpo `Cannot GET/POST …` = rota ausente; 500 `relation … does not exist` = rota presente, tabela ausente.

As duas fontes concordam.

---

## Resumo

São **duas naturezas de lacuna — e elas pedem correções diferentes**:

1. **Migration ausente (NÃO é o código).** As rotas de **Desafios** (`/me/challenges*`, `/professional/challenges*`) **estão deployadas** — aparecem no `/openapi.json` de produção. Elas quebram com **500 `relation "challenges" does not exist`** porque a tabela `challenges` (e relacionadas) nunca foi criada no banco de produção. Correção = **rodar a migration no banco de prod**, não mexer em código.

2. **Build de produção desatualizado (deploy pendente).** Estas rotas **não estão no `/openapi.json` de prod** e dão **404** ao vivo, mesmo existindo no repositório do backend: **Par-Q**, **Banco de Treinos** (`/workout-templates*`), **perfil rico** (`/me/profile`), **avatar** (`/me/avatar`), **preview de convite** (`/invites/:code/preview`), **catálogo de exercícios** (`/exercises`) e **auto-cadastro de profissional** (`/auth/register-professional`). Correção = **deploy do build atual do backend**.

> Resumo da resposta ao "não é o código": **para os Desafios, correto — é a migration do banco.** Para o resto (Par-Q, Banco de Treinos, perfil/avatar, preview de convite, exercises, register-professional), o código está no repo mas **não no que roda em produção** — o repositório está à frente do deploy.

Tudo isso bate com as "Pendências conhecidas" do `AGENTS.md` (Par-Q, Banco de Treinos e Desafios marcados como "aplicar no backend de produção").

---

## 1. Par-Q — questionário de prontidão  ·  FALTA-ROTA (404)

| Endpoint | Hook | Tela / Momento |
|---|---|---|
| `GET /me/par-q` | `useMyParq` (`src/hooks/useParq.ts`) | Home do aluno (**ParqPromptCard** — aviso "preencha seu Par-Q"); aba **Perfil**; ao abrir a tela `(aluno)/par-q.tsx` |
| `POST /students/:id/par-q` | `useSubmitParq` | **Onboarding do aluno** (passo `onboarding-aluno/par-q.tsx`) e ao reenviar em `(aluno)/par-q.tsx` |
| `GET /professional/students/:id/par-q` | `useStudentParq` | Detalhe do aluno (`aluno/[id].tsx` → **ParqSection**) — profissional lê o Par-Q do aluno |
| `GET /professional/students/par-q` | `useParqMap` | Lista de **Alunos** e dashboard do profissional — badge de status (verde/amarelo/vermelho) por aluno |

**Impacto:** o aluno não consegue enviar nem ler o Par-Q; o card de aviso na Home e o passo do onboarding falham; o profissional não vê status de prontidão de nenhum aluno.

---

## 2. Banco de Treinos — templates curados  ·  FALTA-ROTA (404)

| Endpoint | Hook | Tela / Momento |
|---|---|---|
| `GET /workout-templates` | `useWorkoutTemplates` (`src/hooks/useWorkoutTemplates.ts`) | Aba **Treinos** do profissional, escopo "Banco" — lista de programas prontos |
| `GET /workout-templates/:id` | `useWorkoutTemplateDetail` | Preview do programa (`banco-treino/[id].tsx`) |
| `POST /workout-templates/:id/copy` | `useCopyWorkoutTemplate` | Botão **"Clonar e editar"** — cria um workout na biblioteca e abre o builder |

**Impacto:** a aba "Banco" fica vazia/em erro e o "clonar e editar" não funciona. O profissional ainda consegue criar treinos do zero (isso usa `/workouts`, que existe).

---

## 3. Desafios — toda a feature  ·  FALTA-TABELA (500) — código JÁ deployado

⚠️ **Diferente das outras seções:** as rotas de desafio **estão deployadas** (constam no `/openapi.json` de prod). Elas respondem **500 `relation "public.challenges" does not exist`** porque a tabela não foi criada no banco de produção. **Não é problema de código — é a migration que falta rodar.**

| Endpoint | Hook | Tela / Momento |
|---|---|---|
| `GET /me/challenges` | `useChallenges` | Aba **Desafios** do aluno; **ChallengeCard** na Home (desafios em andamento) |
| `POST /me/challenges/:id/accept` / `…/decline` | `useChallengeActions` | Detalhe do desafio (`desafio/[id].tsx`) — aceitar/recusar convite |
| `GET /me/challenges/:id/ranking` | `useChallengeRanking` | Ranking no detalhe do desafio (aluno) |
| `GET /professional/challenges` | `useProChallenges` | Aba **Desafios** do profissional; **KPI de desafios** no dashboard (aba Início) |
| `POST /professional/challenges` · `PATCH …/:id` · `POST …/:id/participants` | `useChallengeMutations` | Criar desafio (`criar-desafio.tsx`); publicar/encerrar e adicionar participantes (`desafio-pro/[id].tsx`) |
| `GET /professional/challenges/:id` · `…/ranking` · `…/report` | `useProChallengeDetail` / `useProChallengeRanking` / `useProChallengeReport` | Gerenciamento do desafio (detalhe, ranking ao vivo, relatório) |

**Impacto:** as abas de Desafios (aluno e profissional) quebram; criar/gerenciar desafio falha; o KPI de desafios no dashboard do profissional erra; o ChallengeCard na Home do aluno não carrega.

> Observação: `POST /professional/challenges/:id/participants` é a única rota de desafio cuja **rota** existe (responde 400 na validação), mas ela também quebraria ao tocar o banco (tabela ausente).

---

## 4. Perfil rico e avatar  ·  FALTA-ROTA (404)

| Endpoint | Hook | Tela / Momento |
|---|---|---|
| `GET /me/profile` | `useMyProfile` (`src/hooks/useMyProfile.ts`) | **Editar perfil** (`editar-perfil.tsx`) — pré-preenche nome, telefone, gênero, peso, altura, avatar |
| `POST /me/avatar` | `useUploadAvatar` | Upload de foto no onboarding e em editar perfil |

**Impacto:** a tela de editar perfil não consegue pré-carregar os dados ricos; upload de avatar falha. (O `GET /me` básico e o `PATCH /me` **funcionam** — então edição de campos simples ainda passa, mas sem o read-back completo.)

---

## 5. Preview de convite  ·  FALTA-ROTA (404)

| Endpoint | Hook | Tela / Momento |
|---|---|---|
| `GET /invites/:code/preview` | `useInvitePreview` (`src/hooks/useInvitePreview.ts`) | Cadastro do aluno via deep link (passo 1) e `usar-convite.tsx` — mostrar **"Você foi convidado por João Personal"** |

**Impacto:** o card do convidador não aparece antes do cadastro. Já estava previsto como `[MOCK]` no `AGENTS.md`; o vínculo em si (consumir convite no cadastro) funciona — quebra só a prévia.

---

## 6. Outras rotas no repo, mas 404 em produção

| Endpoint | Hook / Uso | Tela / Momento | Observação |
|---|---|---|---|
| `POST /auth/register-professional` | `authStore.registerProfessional` | **Cadastro de profissional** (`cadastro-pro.tsx`) | Auto-cadastro de personal/nutri quebra em prod (404). Contornável via `/admin/professionals` (que existe). |
| `GET /exercises` · `GET /exercises/:id` | catálogo de exercícios do backend | Builder de treino (busca de exercício) | A rota existe no repo mas dá **404** em prod. O front hoje **não consome** `/exercises` (o builder envia `name_snapshot` manual — vide `AGENTS.md`), então sem impacto imediato. Foi o item que motivou a dúvida do "seed de exercícios": o seed popula a tabela, mas a **rota** não está deployada. |

---

## O que o remoto JÁ fornece (funciona)

Para contraste, estes fluxos batem normalmente em produção:

- **Auth** — login, register, register-professional, refresh, logout, change-password
- **Conta** — `GET /me`, `PATCH /me`
- **Treinos** — biblioteca do profissional (`/workouts` GET/POST/PATCH, detalhe), treinos do aluno (`/me/workouts`, detalhe)
- **Sessões de treino** — criar sessão, detalhe, check-in de exercícios/séries, finalizar (todo o fluxo de execução do aluno)
- **Dietas** — templates (`/diet-templates`), dieta do aluno (`/me/diets`)
- **Atribuições** — `POST /students/:id/workouts` e `…/diets`
- **Alunos (visão do profissional)** — `/professional/students`, `…/check-ins`
- **Gamificação** — `GET /me/check-ins`, `GET /me/gamification/weekly-overview`
- **Convites** — `GET /invites`, `POST /invites`, `POST /invites/consume`

---

## Como resolver

São **dois problemas distintos**:

1. **Rodar a migration de Desafios no banco de produção** (criar `challenges`, `challenge_participants` e relacionadas). O código já está deployado — só falta a tabela. Enquanto não rodar, as rotas continuam dando 500.
2. **Fazer deploy do build atual do backend** (o repo está à frente de produção): isso traz Par-Q, Banco de Treinos (`workout-templates`), perfil rico (`/me/profile`, `/me/avatar`), `invites/:code/preview`, `/exercises` e `/auth/register-professional`.

Quando o backend de produção for atualizado, dá para complementar a migração de dados `@actus.dev` com os **2 desafios** e o **Par-Q do Carlos** (dados já extraídos), que ficaram de fora justamente por essas lacunas.
