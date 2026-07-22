# Actus Web

Interface web do sistema Actus — plataforma para personal trainers gerenciarem alunos, treinos e exercícios.

Construída com **React 18 + TypeScript + Vite + Tailwind CSS v4**.

---

## Sumário

- [Pré-requisitos](#pré-requisitos)
- [Como rodar](#como-rodar)
- [Variáveis de ambiente](#variáveis-de-ambiente)
- [Estrutura de arquivos](#estrutura-de-arquivos)
- [Roteamento](#roteamento)
- [Autenticação e sessão](#autenticação-e-sessão)
- [Comunicação com o backend](#comunicação-com-o-backend)
- [Catálogo de exercícios](#catálogo-de-exercícios-wger)
- [Stack e dependências](#stack-e-dependências)

---

## Pré-requisitos

- Node.js 20+
- Backend Actus rodando em `localhost:3000` (ou configurado via variável de ambiente)

---

## Como rodar

```bash
# Instalar dependências
npm install

# Iniciar em modo de desenvolvimento
npm run dev

# Gerar build de produção
npm run build

# Pré-visualizar o build gerado
npm run preview
```

O `npm run dev` inicia na porta **5173** (padrão do Vite). O proxy já está configurado: qualquer chamada para `/api/*` é redirecionada automaticamente para `http://localhost:3000`.

---

## Variáveis de ambiente

Crie um arquivo `.env.local` na raiz de `/web` se precisar sobrescrever o backend:

```env
VITE_API_URL=http://localhost:3000
```

Se essa variável não for definida, o Vite usa o proxy embutido (`/api`), que funciona bem em desenvolvimento.

---

## Estrutura de arquivos

```
web/
├── public/
│   └── wger/                   # Catálogo de exercícios em JSON + imagens .webp
│       ├── catalog.json        # ~800 exercícios com nome PT/EN, músculos, equipamentos
│       └── images/             # Fotos dos exercícios (<id>.webp)
│
├── src/
│   ├── main.tsx                # Ponto de entrada — monta o React no DOM
│   ├── index.css               # Estilos globais (importa Tailwind)
│   ├── routes.tsx              # Mapa completo de todas as rotas da aplicação
│   │
│   ├── api/                    # Camada de comunicação com o backend
│   │   ├── client.ts           # Instância do axios + interceptors de auth/refresh
│   │   └── auth.ts             # Funções login, refresh e logout
│   │
│   ├── store/
│   │   └── authStore.ts        # Estado global de autenticação (Zustand + persistência)
│   │
│   ├── lib/                    # Utilitários puros (sem hooks, sem JSX)
│   │   ├── schemas.ts          # Todos os schemas Zod que espelham as respostas do backend
│   │   ├── wger.ts             # Schemas e helpers do catálogo de exercícios
│   │   ├── exercises.ts        # Busca e filtragem local no catálogo wger
│   │   └── studentStatus.ts    # Lógica de status do aluno (ativo, inativo, etc.)
│   │
│   ├── hooks/                  # React Query — cada hook = um recurso da API
│   │   ├── useMe.ts            # Dados do usuário logado (GET /me)
│   │   ├── useStudents.ts      # Lista de alunos do profissional
│   │   ├── useStudentDetail.ts # Detalhe de um aluno específico
│   │   ├── useWorkouts.ts      # Lista de treinos
│   │   ├── useWorkoutMutations.ts # Criar/editar/deletar treinos
│   │   ├── useExerciseCatalog.ts  # Busca no catálogo local de exercícios
│   │   ├── useWgerCatalog.ts   # Carrega o catalog.json do wger
│   │   ├── useInvites.ts       # Gerenciamento de convites
│   │   └── useAdmin.ts         # Dados e ações da área admin
│   │
│   ├── components/             # Componentes reutilizáveis
│   │   ├── RequireAuth.tsx     # Guard de rota: redireciona para /login se não autenticado
│   │   ├── RequireAdmin.tsx    # Guard de rota: bloqueia acesso sem role actus_admin
│   │   └── ui/                 # Primitivos visuais sem lógica de negócio
│   │       ├── Avatar.tsx
│   │       ├── Button.tsx
│   │       ├── Card.tsx
│   │       ├── Modal.tsx
│   │       ├── Skeleton.tsx
│   │       ├── Tag.tsx
│   │       └── Toast.tsx
│   │
│   ├── layouts/                # Estrutura visual das páginas (header, sidebar, etc.)
│   │   ├── AppLayout.tsx       # Layout principal com sidebar — envolve todas as páginas logadas
│   │   ├── AdminLayout.tsx     # Layout da área admin (pode ter nav extra)
│   │   └── Sidebar.tsx         # Barra lateral de navegação
│   │
│   └── pages/                  # Uma pasta por módulo; cada arquivo = uma tela
│       ├── login/
│       │   └── LoginPage.tsx           # Tela de login
│       │
│       ├── dashboard/
│       │   ├── DashboardPage.tsx       # Visão geral do profissional
│       │   ├── KpiCard.tsx             # Card de métrica (componente local)
│       │   └── ActivityPanel.tsx       # Painel de atividade recente
│       │
│       ├── alunos/
│       │   ├── AlunosPage.tsx          # Lista de todos os alunos
│       │   ├── AlunoDetailPage.tsx     # Perfil completo do aluno (orquestra as tabs abaixo)
│       │   ├── TreinosTab.tsx          # Aba: treinos atribuídos ao aluno
│       │   ├── HistoricoTab.tsx        # Aba: histórico de check-ins
│       │   └── PreferenciasTab.tsx     # Aba: preferências e dados do aluno
│       │
│       ├── treinos/
│       │   ├── TreinosPage.tsx         # Lista de treinos criados pelo profissional
│       │   ├── BuilderPage.tsx         # Editor de treino (criar / editar exercícios)
│       │   ├── AtribuirPage.tsx        # Atribuir treino a um aluno com data e dias
│       │   ├── CatalogPanel.tsx        # Painel lateral de busca no catálogo de exercícios
│       │   └── ExerciseList.tsx        # Lista de exercícios dentro de um treino
│       │
│       ├── exercicios/
│       │   └── ExerciciosPage.tsx      # Explorador do catálogo completo de exercícios
│       │
│       ├── convites/
│       │   └── ConvitesPage.tsx        # Gerar e gerenciar links de convite para alunos
│       │
│       ├── configuracoes/
│       │   └── ConfiguracoesPage.tsx   # Configurações de perfil e senha
│       │
│       ├── admin/                      # Área restrita — requer role actus_admin
│       │   ├── AdminOverviewPage.tsx   # Painel geral do admin
│       │   ├── StaffPage.tsx           # Gerenciar usuários da equipe
│       │   ├── VinculosPage.tsx        # Ver e revogar vínculos aluno-profissional
│       │   └── ProfissionaisPage.tsx   # Cadastrar novos profissionais
│       │
│       └── Placeholder.tsx             # Tela temporária para rotas ainda não implementadas
│
├── index.html                  # HTML raiz (Vite injeta o bundle aqui)
├── vite.config.ts              # Config do Vite (proxy, plugins React e Tailwind)
├── tsconfig.json               # Config TypeScript raiz
├── tsconfig.app.json           # Config TypeScript para o código da aplicação
├── tsconfig.node.json          # Config TypeScript para scripts de build (vite.config.ts)
├── eslint.config.js            # Regras de lint (React Hooks + React Refresh)
└── package.json
```

---

## Roteamento

Todas as rotas estão definidas em `src/routes.tsx` usando React Router v6 com `createBrowserRouter`.

A hierarquia de proteção funciona em camadas aninhadas:

```
/login               → pública
└── <RequireAuth>    → redireciona para /login se não autenticado
    └── <AppLayout>  → sidebar + layout principal
        ├── /                        Dashboard
        ├── /alunos                  Lista de alunos
        ├── /alunos/:id              Detalhe do aluno
        ├── /treinos                 Lista de treinos
        ├── /treinos/novo            Criar treino
        ├── /treinos/:id             Editar treino
        ├── /treinos/:id/atribuir    Atribuir treino a aluno
        ├── /exercicios              Catálogo de exercícios
        ├── /convites                Gerenciar convites
        ├── /configuracoes           Configurações
        └── <RequireAdmin>           bloqueia sem role actus_admin
            └── <AdminLayout>
                ├── /admin           Painel admin
                ├── /admin/equipe    Gerenciar equipe
                ├── /admin/vinculos  Vínculos aluno-profissional
                └── /admin/profissionais  Cadastrar profissionais
```

---

## Autenticação e sessão

O estado de autenticação vive em `src/store/authStore.ts` (Zustand com persistência no `localStorage` sob a chave `actus-auth`).

O store guarda:

| Campo | Descrição |
|---|---|
| `accessToken` | JWT de curta duração usado em todas as requisições |
| `refreshToken` | Token de longa duração para renovar o access token |
| `user` | `{ id, display_name, tipo, roles }` |

**Fluxo de refresh automático** (`src/api/client.ts`):

1. Toda requisição recebe o `Authorization: Bearer <accessToken>` via interceptor.
2. Se o backend retorna `{ error: "invalid_token" }`, o cliente dispara um refresh.
3. O refresh é _single-flight_: múltiplas requisições que falham ao mesmo tempo compartilham uma única chamada de refresh — sem duplicar tokens.
4. Se o refresh também falhar, o usuário é deslogado e redirecionado para `/login`.
5. O campo `error` no body é quem define o fluxo — não o status HTTP.

As roles do usuário (`actus_admin`, etc.) vêm do payload do JWT, decodificado pela função `decodeJwtPayload` em `src/lib/schemas.ts`.

---

## Comunicação com o backend

Toda comunicação usa a instância `api` exportada de `src/api/client.ts` (axios). Nunca use `axios` diretamente nas pages ou hooks — sempre importe `api`.

Os dados são buscados via **React Query** (`@tanstack/react-query`). Cada recurso tem seu próprio hook em `src/hooks/`:

```ts
// Exemplo de uso numa page
const { data: students, isLoading } = useStudents();
```

Os tipos de todas as respostas são inferidos dos schemas Zod em `src/lib/schemas.ts`. Se o backend mudar um campo, o schema quebra em tempo de execução — não silenciosamente.

---

## Catálogo de exercícios (wger)

Os exercícios vêm de uma base local gerada a partir do [wger](https://wger.de), armazenada em `public/wger/catalog.json`.

- ~800 exercícios com nome em português e inglês, grupo muscular, equipamentos e flag de imagem.
- Imagens ficam em `public/wger/images/<id>.webp`.
- O arquivo `src/lib/wger.ts` expõe os helpers:
  - `wgerName(ex)` — retorna nome PT com fallback para EN.
  - `wgerImageUrl(ex)` — retorna a URL local da imagem ou `null`.
- A busca e filtragem local são feitas em `src/lib/exercises.ts` (sem chamada de rede).
- O hook `useWgerCatalog` carrega o JSON uma única vez e o mantém em cache via React Query.

---

## Stack e dependências

| Pacote | Função |
|---|---|
| React 18 | UI |
| TypeScript | Tipagem estática |
| Vite 8 | Build e dev server |
| Tailwind CSS v4 | Estilização via utilitários |
| React Router v6 | Roteamento client-side |
| TanStack React Query v5 | Cache de dados assíncronos |
| Zustand v5 | Estado global (autenticação) |
| Axios | HTTP client |
| Zod v4 | Validação e tipagem dos schemas de API |
