# Actus — Backend

Backend do **Actus**, plataforma de personal trainers e nutricionistas para gerenciar alunos, treinos, dietas e gamificação.

---

## Visão geral

O Actus é uma API REST escrita em **Node.js + TypeScript** com **Express 5**, usando **PostgreSQL** como banco de dados (hospedado no Supabase em produção ou via Docker localmente). A autenticação é **própria** (JWT + refresh token), sem depender do Supabase Auth.

```
Actus backend/
├── api/            # Código-fonte da API REST
├── supabase/       # Migrations do banco de dados
├── local/          # Scripts e seeds para ambiente de desenvolvimento local
├── scripts/        # Utilitários para geração de dados (banco de exercícios)
├── assets/         # Imagens estáticas servidas pela API
├── docs/           # Documentação técnica do projeto
└── docker-compose.yml  # Sobe API + Postgres local
```

---

## Estrutura detalhada

### `api/` — Aplicação principal

```
api/
├── src/
│   ├── index.ts            # Ponto de entrada: inicializa o servidor HTTP
│   ├── app.ts              # Cria o app Express, registra middlewares e rotas
│   ├── db.ts               # Pool de conexão PostgreSQL (singleton) + helper withTx
│   ├── crypto.ts           # Utilitários: uuid, sha256, randomToken
│   ├── openapi.ts          # Especificação OpenAPI 3.x gerada programaticamente
│   ├── openapiTags.ts      # Ordem e descrição das tags do Swagger
│   ├── schemaCompat.ts     # Adaptadores de schema para compatibilidade de versões
│   ├── studentCheckInsQuery.ts  # Query reutilizável de check-ins de alunos
│   │
│   ├── auth/
│   │   ├── jwt.ts          # Assina e verifica JWT de acesso (access token)
│   │   └── sessionClaims.ts # Carrega roles e flags do usuário do banco para o token
│   │
│   ├── middleware/
│   │   ├── requireAuth.ts      # Valida Bearer token; injeta userId no request
│   │   ├── requirePersonal.ts  # Rejeita se o usuário não for personal trainer
│   │   ├── requireStudent.ts   # Rejeita se o usuário não for aluno
│   │   ├── requireStaff.ts     # Rejeita se o usuário não for staff interno (admin/suporte)
│   │   └── requireAnyRole.ts   # Verifica se o usuário tem ao menos um dos roles listados
│   │
│   ├── routes/             # Um arquivo por recurso / grupo de endpoints
│   │   ├── auth.ts                 # Login, registro, refresh, logout, troca de senha
│   │   ├── me.ts                   # Perfil do usuário autenticado (GET/PATCH)
│   │   ├── meAvatar.ts             # Upload de avatar (multipart/form-data)
│   │   ├── meStudentProgram.ts     # Programa ativo do aluno (treinos + dietas da semana)
│   │   ├── meGamification.ts       # Streak, check-ins, ranking pessoal
│   │   ├── meChallenges.ts         # Desafios do aluno autenticado
│   │   ├── invites.ts              # CRUD de convites (personal/nutricionista)
│   │   ├── invitePreview.ts        # Prévia pública de convite (sem autenticação)
│   │   ├── workouts.ts             # CRUD de treinos template (personal)
│   │   ├── studentWorkouts.ts      # Atribuição de treinos a alunos
│   │   ├── exercises.ts            # Banco de exercícios (listagem/busca)
│   │   ├── dietTemplates.ts        # Templates de dieta (nutricionista)
│   │   ├── studentDiets.ts         # Atribuição de dietas a alunos
│   │   ├── professionalStudents.ts # Alunos vinculados ao profissional
│   │   ├── professionalChallenges.ts # Desafios criados pelo profissional
│   │   ├── parq.ts                 # PAR-Q (questionário de aptidão física)
│   │   ├── adminProfessionals.ts   # Gestão de profissionais (staff)
│   │   ├── adminStaff.ts           # Gestão de contas de staff interno
│   │   └── adminStudentLinks.ts    # Vínculos aluno–profissional (staff)
│   │
│   ├── domain/
│   │   └── workoutCalories.ts  # Lógica de cálculo de calorias de treino
│   │
│   ├── services/
│   │   ├── challengeStats.ts       # Cálculo de estatísticas de desafios
│   │   └── studentWorkoutSummary.ts # Resumo de progresso de treinos do aluno
│   │
│   └── types/
│       └── swagger-ui-express.d.ts # Tipagem customizada para swagger-ui-express
│
├── test/                   # Testes de integração (Vitest + pg-mem)
│   ├── helpers/
│   │   └── testDb.ts       # Banco em memória (pg-mem) para testes
│   ├── auth.register.invite-first.int.test.ts
│   ├── auth.register-professional.int.test.ts
│   ├── auth.change-password.int.test.ts
│   ├── challenges.int.test.ts
│   ├── gamification.int.test.ts
│   ├── invites.list.int.test.ts
│   ├── invites.preview.int.test.ts
│   ├── me.avatar.int.test.ts
│   ├── me.patch.int.test.ts
│   ├── me.profile.int.test.ts
│   ├── me.student.program.int.test.ts
│   ├── parq.int.test.ts
│   ├── patch.routes.int.test.ts
│   ├── professional.students.int.test.ts
│   ├── studentWorkouts.get.int.test.ts
│   ├── workoutCalories.test.ts
│   ├── workouts.and.diets.int.test.ts
│   ├── admin.links.students.int.test.ts
│   └── admin.professionals.int.test.ts
│
├── Dockerfile              # Build multi-stage (deps → build → runner) com Node 22 Alpine
├── tsconfig.json           # TypeScript: ES2022, moduleResolution Bundler, strict
├── vitest.config.ts        # Configuração do Vitest
└── package.json            # Scripts: dev, build, start, test
```

### `supabase/migrations/` — Histórico do banco

Cada arquivo é uma migration SQL numerada por timestamp. Aplicadas em ordem — tanto no Supabase em produção quanto no Postgres local via `local/initdb.sh`.

| Arquivo | O que cria/altera |
|---|---|
| `20260423120000_actus_fase1_schema.sql` | Schema inicial: `app_users`, `profiles`, `refresh_tokens`, `invites`, `student_professional_links`, `workouts`, `workout_exercises`, `student_workouts`, `workout_sessions`, `check_ins`, `diet_templates`, `student_diets`, etc. |
| `20260428120000_actus_custom_auth.sql` | Remove dependência do Supabase Auth; desativa RLS nas tabelas de domínio |
| `20260429120000_actus_invite_first_and_user_fields.sql` | Campos adicionais em `user_basic_info`; fluxo "invite-first" |
| `20260430130000_actus_staff_roles.sql` | Tabela `app_user_roles`; roles `actus_admin` / `actus_suporte` |
| `20260507120000_student_session_sets_checkin_summary.sql` | Sets por exercício na sessão; colunas de resumo em `profiles` (streak, check-ins) |
| `20260508100000_fix_recompute_streak_ambiguous_d.sql` | Corrige ambiguidade na função `recompute_student_streak` |
| `20260509120000_challenges.sql` | Tabelas `challenges` e `challenge_participants`; ranking de desafios |
| `20260610120000_par_q.sql` | Tabela `par_q_answers` (questionário PAR-Q dos alunos) |
| `20260610130000_actus_register_professional.sql` | Permite auto-cadastro de profissional via `/auth/register-professional` |
| `20260611180000_exercises.sql` | Tabela `exercises` com banco de 873 exercícios PT-BR |
| `20260612000000_workout_exercises_exercise_id.sql` | Adiciona `exercise_id` FK em `workout_exercises` |

### `local/` — Ambiente de desenvolvimento

```
local/
├── initdb.sh           # Script executado pelo Postgres no primeiro boot do volume Docker:
│                       #   1. Aplica 00_shim.sql
│                       #   2. Aplica todas as migrations em ordem
│                       #   3. Aplica seed-ecosystem.sql
├── 00_shim.sql         # Shim de compatibilidade Supabase (schemas auth/storage/extensions)
│                       # Simula o ambiente Supabase em Postgres puro
├── seed-ecosystem.sql  # Dados de teste: staff, personal, nutricionista, aluno e vínculos
├── seed-exercises.sql  # Carga dos 873 exercícios PT-BR na tabela exercises
├── exercise-enum-map-pt.json  # Mapeamento de categorias/músculos em português
├── exercises-coverage.md      # Relatório de cobertura do banco de exercícios
└── CREDITS-exercises.md       # Atribuições das fontes dos exercícios
```

### `scripts/` — Utilitários de geração de dados

```
scripts/
├── build-exercise-db.mjs        # Gera seed-exercises.sql a partir de fontes externas
│                                # (free-exercise-db + gugel/exercises)
└── download-exercise-images.mjs # Baixa imagens dos exercícios localmente
```

### `docs/` — Documentação técnica

| Arquivo | Conteúdo |
|---|---|
| `DATA-MODEL.md` | Modelo de dados completo: tabelas, enums, cardinalidades, regras de negócio |
| `SECURITY-RLS.md` | Política de segurança: RLS desabilitado, autorização no backend |
| `OFFLINE-SYNC.md` | Estratégia de sincronização offline (tabela `sync_applied_ops`) |
| `PLANEJAMENTO-STACK-ARQUITETURA.md` | Decisões de arquitetura e stack |
| `ROADMAP-MIGRACAO.md` | Plano de migração de produção para auth custom |
| `BILLING-STRIPE.md` | Planejamento de integração com Stripe (fora do escopo atual) |
| `ACTUS-STAFF-SEED.md` | Como criar contas de staff via seed |
| `CHANGES-actus.md` | Changelog de funcionalidades |
| `diagramas/` | Diagrama geral da arquitetura (`.mmd`, `.svg`, `.pdf`) |

---

## Modelo de dados resumido

O banco segue este modelo central:

```
app_users          → identidade de login (email + password_hash)
profiles           → perfil público (display_name, tipo, avatar, streak…)
user_basic_info    → PII: CPF, data de nascimento, telefone, gênero
user_lgpd_consents → registro de consentimentos LGPD
app_user_roles     → roles internos de staff (actus_admin, actus_suporte)
refresh_tokens     → refresh tokens (armazenados como hash SHA-256)

invites                    → convites gerados por profissionais
invite_redemptions         → auditoria de uso de convites
professional_invite_limits → limite de convites ativos por profissional
student_professional_links → vínculo aluno ↔ profissional (personal ou nutricionista)

workouts           → templates de treino (criados pelo personal)
workout_exercises  → exercícios dentro de um treino template
student_workouts   → atribuição de treino a um aluno (dias da semana)
workout_sessions   → execução real de uma sessão pelo aluno
session_exercises  → exercícios executados na sessão (séries/reps/peso)
check_ins          → check-in diário do aluno

exercises          → banco de exercícios PT-BR (873 exercícios)

diet_templates     → templates de dieta (criados pelo nutricionista)
student_diets      → atribuição de dieta a um aluno

challenges             → desafios criados por profissionais
challenge_participants → alunos participantes de um desafio

par_q_answers      → respostas do questionário PAR-Q do aluno
sync_applied_ops   → controle de idempotência para sync offline
```

**Tipos de usuário** (`profiles.tipo`): `personal` | `nutricionista` | `aluno` | `actus_admin` | `actus_suporte`

---

## Autenticação

O sistema usa **autenticação própria**, sem Supabase Auth:

- **Registro de aluno:** requer `invite_code` válido. Na mesma transação cria `app_users` + `profiles` + `user_basic_info` + vínculo com o profissional.
- **Registro de profissional:** auto-cadastro via `/auth/register-professional` (sem convite).
- **Access token:** JWT assinado com `JWT_ACCESS_SECRET`, TTL configurável (`ACCESS_TOKEN_TTL_SECONDS`, padrão 15 min).
- **Refresh token:** string aleatória de 32 bytes armazenada como `sha256` em `refresh_tokens`. Rotacionado a cada uso.
- **`must_change_password`:** contas criadas por staff podem exigir troca de senha no primeiro login; o JWT carrega esse flag e a API bloqueia todas as rotas exceto `/auth/change-password` e `/auth/logout`.

---

## Endpoints principais

| Grupo | Prefixo | Autenticação |
|---|---|---|
| Autenticação | `/auth` | — (público) |
| Perfil próprio | `/me` | Bearer |
| Programa do aluno | `/me` (student) | Bearer + role aluno |
| Gamificação | `/me` | Bearer + role aluno |
| Desafios (aluno) | `/me` | Bearer + role aluno |
| Convites | `/invites` | Bearer |
| Treinos template | `/workouts` | Bearer |
| Banco de exercícios | `/exercises` | Bearer |
| Dietas template | `/diet-templates` | Bearer |
| Treinos de alunos | `/students/:id/workouts` | Bearer |
| Dietas de alunos | `/students/:id/diets` | Bearer |
| PAR-Q | `/students/:id/par-q`, `/me/par-q` | Bearer |
| Alunos do profissional | `/professional/students` | Bearer |
| Desafios (profissional) | `/professional/challenges` | Bearer + role personal |
| Admin — profissionais | `/admin/professionals` | Bearer + role staff |
| Admin — vínculos | `/admin/links/students` | Bearer + role staff |
| Admin — staff | `/admin/staff` | Bearer + role staff |
| Documentação | `/docs` | — (público) |
| Spec OpenAPI | `/openapi.json` | — (público) |
| Health check | `/health` | — (público) |

---

## Como rodar localmente

### Pré-requisitos

- [Docker](https://docs.docker.com/get-docker/) e Docker Compose
- Node.js 22+

### 1. Subir banco de dados e API via Docker

```bash
# Na raiz do repositório (onde está o docker-compose.yml)
docker compose up
```

Isso:
1. Sobe um Postgres 16 na porta `5433`
2. No primeiro boot, aplica automaticamente o shim + todas as migrations + seed de teste
3. Sobe a API na porta `3000`

### 2. Rodar a API em modo desenvolvimento (com hot reload)

```bash
cd api
cp .env.example .env.local   # preencha as variáveis
npm install
npm run dev
```

### 3. Variáveis de ambiente (`api/.env.local`)

```env
DATABASE_URL=postgresql://actus:actus@localhost:5433/actus

PORT=3000
NODE_ENV=development

JWT_ACCESS_SECRET=change-me
ACCESS_TOKEN_TTL_SECONDS=900

REFRESH_TOKEN_TTL_DAYS=30
```

> Em produção, `CORS_ORIGINS` define as origens permitidas no CORS (separadas por vírgula).

---

## Como rodar os testes

Os testes de integração usam **pg-mem** (Postgres em memória) — não precisam de banco externo.

```bash
cd api
npm test
```

---

## Build para produção

```bash
cd api
npm run build      # Compila TypeScript → dist/
npm start          # Inicia dist/index.js
```

Ou via Docker:

```bash
docker build -t actus-api ./api
docker run -p 3000:3000 --env-file api/.env actus-api
```

O `Dockerfile` usa **build multi-stage**: instala dependências → compila TypeScript → imagem final mínima com Node 22 Alpine.

---

## CI/CD

O arquivo `.github/workflows/deploy.yml` define o pipeline de deploy automático ativado em pushes para a branch principal.

---

## Stack

| Camada | Tecnologia |
|---|---|
| Runtime | Node.js 22 |
| Framework | Express 5 |
| Linguagem | TypeScript 5 (ES2022, strict) |
| Banco de dados | PostgreSQL 16 (Supabase em produção) |
| Driver SQL | node-postgres (`pg`) |
| Validação | Zod 4 |
| Auth | JWT (`jsonwebtoken`) + bcrypt (`bcryptjs`) |
| Uploads | Multer |
| Documentação | OpenAPI 3 + Swagger UI |
| Testes | Vitest + Supertest + pg-mem |
| Contêineres | Docker + Docker Compose |
