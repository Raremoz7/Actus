# Actus — App Mobile

App de gestão e engajamento para personal trainers, nutricionistas e alunos. Desenvolvido com React Native + Expo SDK 55, TypeScript estrito, design dark mode "quiet luxury".

---

## Sumário

- [O que é o Actus](#o-que-é-o-actus)
- [Pré-requisitos](#pré-requisitos)
- [Configuração](#configuração)
- [Rodando o projeto](#rodando-o-projeto)
- [Estrutura de pastas](#estrutura-de-pastas)
  - [app/ — telas e rotas](#app--telas-e-rotas)
  - [src/api/ — camada HTTP](#srcapi--camada-http)
  - [src/hooks/ — dados reativos](#srchooks--dados-reativos)
  - [src/store/ — estado global](#srcstore--estado-global)
  - [src/components/ — componentes](#srccomponents--componentes)
  - [src/lib/ — utilitários puros](#srclib--utilitários-puros)
  - [src/types/ — contratos Zod + TypeScript](#srctypes--contratos-zod--typescript)
  - [src/theme/ — design system](#srctheme--design-system)
  - [src/mocks/ — dados sem endpoint](#srcmocks--dados-sem-endpoint)
  - [src/features/ — lógica de feature isolada](#srcfeatures--lógica-de-feature-isolada)
  - [src/data/ — dados estáticos](#srcdata--dados-estáticos)
  - [src/observability/ — monitoramento](#srcobservability--monitoramento)
  - [docs/ — documentação interna](#docs--documentação-interna)
  - [scripts/ — utilitários de dev](#scripts--utilitários-de-dev)
- [Stack e dependências-chave](#stack-e-dependências-chave)
- [Contrato com a API](#contrato-com-a-api)
- [Sistema de autenticação](#sistema-de-autenticação)
- [Design system](#design-system)
- [Testes](#testes)
- [Bypass de autenticação (DEV)](#bypass-de-autenticação-dev)
- [Variáveis de ambiente](#variáveis-de-ambiente)
- [Pendências conhecidas](#pendências-conhecidas)

---

## O que é o Actus

O Actus conecta três tipos de usuário em um único app:

| Perfil | O que faz no app |
|---|---|
| **Personal trainer** | Cria treinos, atribui a alunos, acompanha adesão, cria desafios |
| **Nutricionista** | Cria dietas, atribui a alunos, acompanha adesão |
| **Aluno** | Executa treinos, acompanha dieta, participa de desafios, vê progresso |

O roteamento é feito por perfil: ao logar, o app detecta o `tipo` do usuário (`personal`, `nutri`, `aluno`) e direciona para a área correta.

---

## Pré-requisitos

- Node.js 20+
- npm 10+
- **Expo Dev Client** instalado no dispositivo/emulador — o **Expo Go não funciona** (dependências nativas: Unistyles, Reanimated, SecureStore)
- Android SDK ou Xcode para builds locais

---

## Configuração

```bash
# 1. Instalar dependências
npm install

# 2. Copiar e preencher as variáveis de ambiente
cp .env.example .env
```

Edite `.env` com os valores corretos (veja a seção [Variáveis de ambiente](#variáveis-de-ambiente)).

---

## Rodando o projeto

```bash
# Inicia o dev server (requer dev client no dispositivo)
npm run start

# Build e run direto no Android conectado
npm run android

# Build e run no iOS (macOS only)
npm run ios

# Verificação de tipos
npm run typecheck

# Linter (zero warnings tolerados)
npm run lint

# Testes unitários
npm test

# Proxy CORS para desenvolvimento web
npm run cors-proxy

# Sanidade geral das dependências Expo
npm run doctor
```

---

## Estrutura de pastas

```
actus/
├── app/               # Telas e layouts (Expo Router — file-based routing)
├── src/
│   ├── api/           # Cliente HTTP, interceptors, endpoints, storage de tokens
│   ├── hooks/         # React Query hooks (uma query/mutation por arquivo)
│   ├── store/         # Zustand (auth, onboarding, rascunhos)
│   ├── components/    # Componentes React Native organizados por domínio
│   ├── lib/           # Funções puras e utilitários sem efeitos colaterais
│   ├── types/         # Schemas Zod + tipos TypeScript inferidos (contratos da API)
│   ├── theme/         # Design tokens, fontes, configuração do Unistyles
│   ├── mocks/         # Dados falsos para features sem endpoint real na API v1
│   ├── features/      # Lógica de feature isolada (forms, transformações)
│   ├── data/          # Dados estáticos/seed (biblioteca de exercícios)
│   └── observability/ # Sentry
├── docs/              # Documentação interna (planos, specs de design, decisões)
├── scripts/           # Scripts utilitários Node.js
├── assets/            # Imagens, ícones, splash
├── android/           # Código nativo Android (gerado pelo Expo prebuild)
├── app.config.ts      # Configuração Expo (nome, bundle IDs, plugins)
├── babel.config.js
├── metro.config.js
└── tsconfig.json
```

---

### `app/` — telas e rotas

O Expo Router usa o sistema de arquivos como roteador. Cada arquivo `.tsx` dentro de `app/` é uma rota. Layouts (`_layout.tsx`) definem o shell de navegação de cada grupo.

```
app/
├── _layout.tsx                    # Root layout — inicializa fontes, Sentry, auth hydration
├── index.tsx                      # Entry point — redireciona por tipo de usuário
├── +not-found.tsx                 # Tela 404
├── +html.tsx                      # Shell HTML para Expo web
│
├── (auth)/                        # Grupo de autenticação (sem tab bar)
│   ├── login.tsx                  # Login com email e senha
│   ├── escolha-perfil.tsx         # Escolha entre "sou aluno" e "sou profissional"
│   ├── cadastro/                  # Cadastro de aluno (wizard multi-step)
│   │   └── index.tsx              # Passo: dados da conta
│   ├── cadastro-pro.tsx           # Cadastro de profissional (personal/nutri)
│   └── trocar-senha.tsx           # Gate de troca de senha (403 must_change_password)
│
├── (aluno)/                       # Área do aluno (tab bar própria)
│   ├── (tabs)/
│   │   ├── index.tsx              # Início — hoje, semana, próximo treino, desafios
│   │   ├── treinos.tsx            # Lista de treinos atribuídos
│   │   ├── desafios.tsx           # Desafios em andamento
│   │   └── perfil.tsx             # Perfil e configurações
│   ├── treino/[id].tsx            # Detalhe de treino
│   ├── sessao/[id].tsx            # Execução de sessão de treino (stepper)
│   ├── exercicio/[id].tsx         # Detalhe de exercício (vídeo/gif + instruções)
│   ├── dieta/[id].tsx             # Detalhe de dieta atribuída
│   ├── desafio/[id].tsx           # Detalhe de desafio + ranking
│   └── par-q.tsx                  # Questionário PAR-Q
│
├── (personal)/                    # Área do personal trainer (tab bar própria)
│   └── (tabs)/
│       ├── inicio.tsx             # Dashboard com KPIs e ações rápidas
│       ├── alunos.tsx             # Lista de alunos vinculados
│       ├── treinos.tsx            # Biblioteca de treinos criados
│       ├── desafios.tsx           # Desafios criados
│       └── perfil.tsx             # Perfil profissional
│
├── (nutri)/                       # Área do nutricionista (tab bar própria)
│   └── (tabs)/
│       ├── inicio.tsx             # Dashboard
│       ├── alunos.tsx             # Lista de alunos vinculados
│       ├── dietas.tsx             # Biblioteca de dietas
│       └── perfil.tsx             # Perfil profissional
│
├── aluno/[id].tsx                 # Detalhe de aluno (para profissionais)
├── montar-treino.tsx              # Editor de treino (exercícios + séries)
├── montar-dieta.tsx               # Editor de dieta (refeições + alimentos)
├── atribuir-treino.tsx            # Modal de atribuição de treino a aluno
├── atribuir-dieta.tsx             # Modal de atribuição de dieta a aluno
├── criar-desafio.tsx              # Criação de desafio
├── desafio-pro/[id].tsx           # Detalhe de desafio (visão do profissional)
├── banco-treino/[id].tsx          # Detalhe de programa da biblioteca pública
├── editar-perfil.tsx              # Edição de perfil (nome, foto, bio)
├── convite/
│   ├── index.tsx                  # Lista de convites gerados
│   └── novo.tsx                   # Geração de novo convite
├── usar-convite.tsx               # Consumir convite recebido (aluno vincula profissional)
├── register.tsx                   # Cadastro via deep link (actus://register?code=XXX)
│
├── onboarding-aluno/              # Wizard de onboarding do aluno (pós-cadastro)
│   ├── interesse.tsx              # Objetivo de treino
│   ├── experiencia.tsx            # Nível de experiência
│   ├── frequencia.tsx             # Dias/semana disponíveis
│   ├── local.tsx                  # Onde treina
│   ├── corpo.tsx                  # Altura e dados físicos
│   ├── foto.tsx                   # Upload de foto de perfil
│   ├── par-q.tsx                  # PAR-Q no onboarding
│   └── vinculo.tsx                # Inserir código de convite (vincular profissional)
│
├── onboarding-professor/          # Wizard de onboarding do profissional (pós-cadastro)
│   ├── perfil.tsx                 # Nome profissional, área, CREF
│   ├── forma-uso.tsx              # Como pretende usar o app
│   ├── foto.tsx                   # Upload de foto de perfil
│   └── convite.tsx                # Criar primeiro convite
│
└── _dev/
    └── health.tsx                 # Tela de diagnóstico (DEV only — chama GET /health)
```

**Convenção de nomenclatura de rotas:**
- `(grupo)/` — grupo de layout sem segmento na URL
- `[id].tsx` — segmento dinâmico
- `_layout.tsx` — define o shell de navegação do grupo
- `_dev/` — telas de desenvolvimento, não entram em produção

---

### `src/api/` — camada HTTP

Toda comunicação com o backend passa por aqui.

| Arquivo | O que faz |
|---|---|
| `client.ts` | Instância Axios com interceptors de auth (Bearer + refresh automático) |
| `endpoints.ts` | Centraliza todos os paths da API — nunca escreva URL em componente |
| `storage.ts` | Persiste e lê tokens (access + refresh) no `expo-secure-store` |
| `parseApi.ts` | Valida resposta com Zod; lança erro tipado se o shape não bater |
| `errors.ts` | Classe `ApiError` com campo `code` (string) — nunca dependa do HTTP status |
| `devMocks.ts` | Adapter axios-mock-adapter usado em desenvolvimento sem backend |

**Regra crítica:** o campo `error` do body da resposta é a fonte de verdade para erros — nunca o HTTP status code.

O interceptor de response do `client.ts` trata automaticamente:
- `invalid_token` → refresh single-flight + retry da request original
- `missing_authorization` → logout imediato
- `must_change_password` → redireciona para gate de troca de senha (sem logout)

---

### `src/hooks/` — dados reativos

Um arquivo por recurso da API. Cada hook usa TanStack Query v5 (`useQuery` ou `useMutation`).

```
useMe.ts                  # GET /me — usuário autenticado
useStudents.ts            # GET /professional/students
useStudentWorkouts.ts     # GET /students/:id (treinos do aluno)
useWorkoutDetail.ts       # GET /workouts/:id
useWorkoutMutations.ts    # POST/PATCH /workouts
useProWorkouts.ts         # Treinos do profissional logado
useAssignWorkout.ts       # POST /students/:id/workouts
useDietTemplates.ts       # GET /diet-templates
useDietMutations.ts       # POST/PATCH /diet-templates
useAssignDiet.ts          # POST /students/:id/diets
useChallenges.ts          # GET /me/challenges (aluno)
useProChallenges.ts       # GET /professional/challenges
useChallengeMutations.ts  # POST/PATCH /professional/challenges
useChallengeRanking.ts    # GET /me/challenges/:id/ranking
useParq.ts                # GET/POST /me/par-q
useInvites.ts             # GET /invites
useInviteActions.ts       # POST /invites
useConsumeInvite.ts       # POST /invites/consume
useSession.ts             # GET /sessions/:id (execução de treino)
useCreateSession.ts       # POST /sessions
useWeeklyOverview.ts      # GET /me/gamification/weekly-overview
useUploadAvatar.ts        # POST /me/avatar
...
```

---

### `src/store/` — estado global

Estado que precisa existir fora do ciclo de vida de uma tela específica.

| Arquivo | O que guarda |
|---|---|
| `authStore.ts` | Status da sessão (`hydrating`, `unauthenticated`, `authenticated`, `must_change_password`), objeto `user` (do `/me`), ações de login/register/logout |
| `onboardingStore.ts` | Flag de onboarding concluído (gate local enquanto o backend não tem o campo) |
| `cadastroDraftStore.ts` | Rascunho do wizard de cadastro multi-step (dados entre telas) |

---

### `src/components/` — componentes

Organizados por domínio. Cada subpasta tem um `index.ts` que reexporta tudo publicamente.

```
components/
├── ui/              # Primitivos genéricos: Button, Input, Text, Tag, Screen, TopBar, Logo...
├── molecules/       # Compostos reutilizáveis: FormField, DateField, MaskedField, WizardProgress...
├── navigation/      # ActusTabBar (tab bar customizada com animação de underline)
├── home/            # Cards da tela Início do aluno: TodayWorkoutCard, WeekStrip, DietCard...
├── workouts/        # Componentes de treino: WorkoutListRow, ExerciseCard, WeekdayChips...
├── diet/            # Componentes de dieta: MealCard, MealEditRow, MealFormSheet
├── challenges/      # Componentes de desafio: ChallengeListCard, RankingRow, ChallengeTimingHero...
├── dashboard/       # Dashboard do profissional: KpiCard, RecentStudents, QuickAction...
├── professional/    # Gestão de alunos: StudentRow, StudentDetailScreen, ParqSection...
├── builder/         # Editor de treino: ExerciseEditRow, ExerciseFormSheet
├── onboarding/      # Wizard de onboarding: OnboardingScreen, OptionCard, FotoStep
├── parq/            # Questionário PAR-Q: ParqQuestionRow, ParqStatusBadge, ParqAttentionBanner
├── invite/          # Convites: InviteCard
├── library/         # Banco de treinos: LibraryWorkoutCard, ObjetivoChips, WorkoutScopeToggle
├── session/         # Execução de sessão: Stepper, SessionFinishSummary
└── account/         # Tela de conta/perfil: AccountScreen
```

**Regra de estilo:** todo estilo usa tokens do `src/theme/tokens.ts` via Unistyles. Nunca hex hardcoded em componente.

---

### `src/lib/` — utilitários puros

Funções sem efeitos colaterais, testáveis de forma isolada.

| Arquivo/pasta | O que faz |
|---|---|
| `format.ts` | Formatação de datas com componentes **locais** do Date (evita bug de fuso UTC-3 do `toISOString`) |
| `weekday.ts` | Manipulação de dias da semana |
| `duration.ts` | Formatação de duração em segundos → `mm:ss` |
| `greeting.ts` | Saudação dinâmica por hora do dia |
| `session.ts` | Lógica de execução de sessão de treino (progresso, sets) |
| `challenge.ts` | Cálculos de progresso e estado de desafio |
| `diet.ts` | Funções de dieta (macros, totais) |
| `student.ts` | Utilitários de aluno (status, pulse) |
| `parq.ts` | Avaliação de respostas do questionário PAR-Q |
| `invite.ts` | Geração e validação de links de convite |
| `nextWorkout.ts` | Lógica de "próximo treino" do aluno |
| `nav.ts` | Helpers de navegação tipados |
| `authRoutes.ts` | Paths das rotas de autenticação (usados pelo root layout) |
| `onboardingRoutes.ts` | Sequência de steps do onboarding |
| `queryClient.ts` | Configuração e instância do TanStack Query |
| `clipboard.ts` | Wrapper de `expo-clipboard` |
| `devAuth.ts` | Controles do bypass de auth para desenvolvimento |
| `domGuard.ts` | Guard para código que só existe no ambiente web |
| `exerciseImage.ts` | Resolve URL de imagem/gif de exercício |
| `exercises/` | Catálogo local de exercícios com tipos Zod |
| `wger/` | Integração com a API pública Wger (biblioteca de exercícios open source) |

---

### `src/types/` — contratos Zod + TypeScript

Cada arquivo define o schema Zod da resposta da API e exporta o tipo inferido. Toda resposta é validada antes de entrar na UI via `parseApi()`.

```
auth.ts            # LoginBody, RegisterBody, TokensResponseSchema
me.ts              # MeSchema, UserTipo (personal | nutri | aluno)
workouts.ts        # WorkoutSchema, ExerciseSchema, SetSchema...
diets.ts           # DietTemplateSchema, MealSchema, FoodItemSchema...
challenges.ts      # ChallengeSchema, ParticipantSchema...
sessions.ts        # SessionSchema, CheckInSchema...
invites.ts         # InviteSchema, InvitePreviewSchema...
professional.ts    # StudentSchema, StudentListSchema...
parq.ts            # ParqResponseSchema, ParqAnswerSchema...
home.ts            # WeeklyOverviewSchema, TodayWorkoutSchema...
gamification.ts    # StreakSchema, BadgeSchema...
health.ts          # HealthSchema (resposta do GET /health)
error.ts           # ApiErrorBodySchema (campo "error" do body)
workoutLibrary.ts  # Schema do banco de treinos público (Wger)
svg.d.ts           # Declaração de módulo para imports de .svg
```

**Convenção:** se um schema tem testes de validação, o arquivo de teste fica junto (`workouts.test.ts`, `diets.test.ts`, etc.).

---

### `src/theme/` — design system

| Arquivo | O que contém |
|---|---|
| `tokens.ts` | Paleta de cores, gradientes, espaçamentos, tipografia, border radius, sombras — **fonte de verdade visual do app** |
| `unistyles.ts` | Registra o tema no Unistyles 3 (conecta tokens ao sistema de estilos) |
| `fonts.ts` | Carregamento das fontes Barlow Condensed, Share Tech Mono e Barlow |
| `index.ts` | Re-exporta tudo |

**Fontes do design system:**
- `Barlow Condensed 800` — títulos, botões (uppercase)
- `Share Tech Mono` — dados numéricos, KPIs
- `Barlow` — corpo de texto

**Paleta principal:**
- `bgLowest: #10252D` — fundo mais escuro (splash, modais)
- `bgBase: #1A343F` — fundo padrão das telas
- `neon: #CBFE00` — cor de ação primária (botões, CTAs)
- `textPrimary: #FFFFFF` / `textInverse: #141414` — texto sobre fundo escuro/claro

---

### `src/mocks/` — dados sem endpoint

Concentra todo dado que ainda **não tem endpoint real na API v1**. Quando o backend expuser a rota, basta trocar a fonte aqui — sem alterar nenhum componente.

**Convenção obrigatória:** toda constante de mock leva o comentário `// [MOCK — sem endpoint na API v1]`. Um `grep` por essa string lista tudo que falta no backend.

```
home.ts                # Dados de gamificação da tela Início (streak, badges)
studentOnboarding.ts   # Preferências do aluno (interesse, experiência, local...)
professionalProfile.ts # Perfil profissional (área de atuação, CREF, experiência)
README.md              # Convenções detalhadas do diretório
```

---

### `src/features/` — lógica de feature isolada

Lógica de negócio que pertence a uma feature específica mas não cabe em `lib/` (puro) nem em `hooks/` (query).

```
auth/
  contaForm.ts       # Schema Zod + validação do formulário de conta
  errors.ts          # Mapeamento de ApiError → mensagem amigável para o usuário
  hooks.ts           # Hooks de formulário de auth (react-hook-form + resolvers)

builder/
  toApiExercises.ts  # Transforma exercícios do editor para o formato da API
```

---

### `src/data/` — dados estáticos

```
workoutLibrary.ts    # Seed editorial de programas de treino (exercícios do catálogo Wger)
                     # [MOCK — sem endpoint na API v1]
                     # Usado pelo banco de treinos até o backend expor GET /workouts/library
```

---

### `src/observability/` — monitoramento

```
sentry.ts   # Inicialização do Sentry com DSN do ambiente, sem dados pessoais (sem PII)
```

---

### `docs/` — documentação interna

```
docs/
├── plano-bloco-0-1.md              # Plano de construção dos blocos 0 e 1
├── decisoes-visuais-bloco-1.md     # Decisões de design aprovadas pelo designer
├── design-blocos-restantes.md      # Roadmap visual dos próximos blocos
├── critica-design-2026-06-06.md    # Crítica de design registrada
├── backend-pendencias.md           # Endpoints solicitados ao backend e status
├── contrato-backend-treinos-do-aluno.md  # Contrato detalhado da API de treinos
└── superpowers/
    ├── plans/    # Planos de implementação por feature (gerados antes de codar)
    └── specs/    # Specs de design por feature (mockups em texto antes de implementar)
```

---

### `scripts/` — utilitários de dev

| Script | O que faz |
|---|---|
| `cors-proxy.mjs` | Proxy CORS local para desenvolvimento web (aponta para o backend) |
| `build-wger-snapshot.mjs` | Baixa e serializa o catálogo de exercícios da API Wger para o seed local |
| `seed-accounts-extra.sql` | Seeds SQL de contas de teste extras |
| `seed-ecosystem.sql` | Seed SQL de ecossistema completo (alunos, treinos, desafios) |

---

## Stack e dependências-chave

| Categoria | Tecnologia |
|---|---|
| Runtime | React Native 0.83 + React 19 |
| Build | Expo SDK 55 (dev client obrigatório) |
| Roteamento | Expo Router (file-based) |
| Estilos | React Native Unistyles 3 |
| Estado global | Zustand 5 |
| Dados remotos | TanStack Query v5 + Axios |
| Validação | Zod (toda resposta da API é validada) |
| Tokens seguros | expo-secure-store |
| Formulários | React Hook Form + @hookform/resolvers |
| Animações | React Native Reanimated 4 |
| Ícones | Phosphor React Native (duotone) |
| Monitoramento | Sentry |
| Testes | Jest + @testing-library/react-native |

---

## Contrato com a API

Regras que, se violadas, causam bugs em produção:

1. **O campo `error` (string) no body é a fonte de verdade** — nunca leia o HTTP status para decidir o tipo do erro
2. **Refresh rotaciona o refresh_token** — sempre persista o par novo retornado
3. **`change-password` não retorna refresh novo** — use `tokenStorage.setAccessOnly()`
4. **`must_change_password` chega como 403** — não faça logout; redirecione para troca de senha
5. **Gatilho de refresh:** só `error === 'invalid_token'`. `missing_authorization` → logout. `invalid_credentials` → trate na UI
6. **Datas de calendário** → use `formatDateLocal()` de `src/lib/format.ts`, nunca `toISOString()` (bug de fuso UTC-3)
7. **Feature sem endpoint** → mock isolado em `src/mocks/` com marcador `// [MOCK — sem endpoint na API v1]`

---

## Sistema de autenticação

O `authStore.ts` (Zustand) centraliza todo o ciclo de sessão com 4 estados possíveis:

```
hydrating              → boot do app, decidindo se há sessão válida
unauthenticated        → sem sessão (ou encerrada)
authenticated          → sessão válida, /me resolvido
must_change_password   → senha provisória, gate antes de qualquer tela
```

O fluxo é atômico: o status só vira `authenticated` após o `/me` resolver com sucesso. O `client.ts` gerencia o refresh automático de tokens com single-flight (múltiplas requests concorrentes aguardam o mesmo refresh).

---

## Design system

O design segue o conceito **"quiet luxury dark mode"**: escuro, refinado, sem excesso de cor.

- Todos os valores visuais estão em `src/theme/tokens.ts`
- Nunca use hex hardcoded em componentes — importe do theme
- Border radius padrão: cards `12px`, inputs `12px`, tags `4px`, modais `24px`, botões `100px` (pill)
- Sombra apenas em modais, sheets e dropdowns
- 1 momento de animação/motion por tela
- Copy: específico, sem buzzword, sem emoji em bullets

---

## Testes

```bash
npm test              # Roda todos os testes
npm test -- --watch   # Modo watch
```

Os testes ficam junto dos arquivos que testam (`Component.test.tsx`, `util.test.ts`). Não há pasta `/tests` separada.

Cobertura atual inclui: schemas Zod (validação de contratos da API), componentes críticos de UI, utilitários de lib, stores de estado.

---

## Bypass de autenticação (DEV)

Para desenvolver sem backend ativo, defina no `.env`:

```bash
EXPO_PUBLIC_DEV_BYPASS_AUTH=true
EXPO_PUBLIC_DEV_TIPO=personal   # ou nutri, aluno
```

Com isso, o app inicia diretamente na área do tipo definido com dados falsos do `src/api/devMocks.ts`. A tela `_dev/health.tsx` permite trocar o tipo de usuário em runtime.

---

## Variáveis de ambiente

```bash
# URL base do backend (obrigatória)
EXPO_PUBLIC_API_BASE_URL=https://seu-backend.com

# URL do backend para Expo web (opcional — usa cors-proxy local em dev)
EXPO_PUBLIC_API_BASE_URL_WEB=http://localhost:8010/proxy

# Bypass de auth para dev sem backend
EXPO_PUBLIC_DEV_BYPASS_AUTH=false
EXPO_PUBLIC_DEV_TIPO=personal

# DSN do Sentry (opcional em dev)
EXPO_PUBLIC_SENTRY_DSN=
```

Veja `.env.example` para o template completo.

---

## Pendências conhecidas

| Item | Status |
|---|---|
| Fonte `Gegola.otf` (marca) | Aguardando designer — usar `actus.svg` |
| `GET /invites/:code/preview` (nome do profissional) | Solicitado ao backend; card do convidador é mock |
| Reset de senha | Não existe na API — não criar link "Esqueci a senha" |
| `POST /auth/register-professional` | Solicitado ao backend; em dev funciona via devMocks |
| `POST /auth/register` sem invite_code | Solicitado ao backend (tornar campo opcional) |
| Upload de foto de perfil | Front pronto; exige rebuild quando `expo-image-picker` entrar |
| Preferências do aluno (onboarding) | Front pronto; persiste via `src/mocks/studentOnboarding.ts` |
| Perfil profissional (onboarding) | Front pronto; persiste via `src/mocks/professionalProfile.ts` |
| Flag de onboarding concluído no `/me` | Gate hoje é local (`onboardingStore.ts`) |
| `GET /workouts/library` (banco público) | Front roda sobre seed de `src/data/workoutLibrary.ts` |
| `GET /professional/overview` (engajamento) | Bloco "Engajamento · em breve" no dashboard |
| Par-Q | Endpoints implementados no backend do monorepo; aplicar em produção |

Para o detalhamento completo, veja `docs/backend-pendencias.md`.
