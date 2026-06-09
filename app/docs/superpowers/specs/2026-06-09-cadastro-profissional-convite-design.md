# [SUBSTITUÍDO] Cadastro Profissional + Convite do Aluno Logado — Design

> **SUBSTITUÍDO em 2026-06-09** por `2026-06-09-onboarding-design.md` (história de usuário do
> onboarding do aluno + PDF do fluxo do professor redefiniram os dois fluxos). O consume/
> usar-convite e a infraestrutura de wizard deste spec foram absorvidos pelo novo.

Data: 2026-06-09 · Cards do Miro: "Fluxo de Cadastro (personal)" + "Fluxo de Cadastro (aluno)" · Prioridade: Critical
Worktree: `feat/cadastro` (isolado — Par-Q e Banco de Treinos correm em paralelo em outros worktrees)

## Contexto

Estratégia da fatia MVP: **front completo sem alterar o backend**; o que faltar no back é
sinalizado (AGENTS.md) e roda sobre mock isolado até existir.

Fatos verificados (varredura app + backend real):

- O cadastro do **aluno com convite** (wizard 3 passos) está completo e polido no app.
- O backend **não tem auto-cadastro de profissional em hipótese alguma**: `POST /auth/register`
  cria `'aluno'` hardcoded (sem campo de role); profissional nasce só via
  `POST /admin/professionals` (staff, `must_change_password` default true).
- O backend **TEM** `POST /invites/consume` (real, pronto): aluno logado consome convite para
  se vincular a um novo profissional. O app **descarta o código** quando o deep link chega
  autenticado (`app/register.tsx` → `replace('/')`) — nenhuma chamada a consume existe no front.
- Não há envio de e-mail no backend (zero mailer) — a copy atual do credenciamento
  ("senha provisória na sua caixa") é desonesta.
- O emissor do convite pode ser personal **ou nutricionista** (o vínculo herda o papel do
  emissor) — a copy atual do card de convite ("Convite de treinador") é enviesada.

## Decisões validadas (designer: Davi)

| Decisão | Escolha |
|---|---|
| Cadastro personal | **Auto-cadastro completo** no front, contra endpoint sinalizado (`POST /auth/register-professional`) |
| Papéis cobertos | **Personal + Nutricionista** (chip de papel; CREF vs CRN) |
| Pós-cadastro | **Conta ativa imediata** (tokens na resposta) + validação assíncrona do registro pela equipe |
| Convite com aluno logado | **Incluir** — fluxo sobre `POST /invites/consume` (endpoint real, zero mock) |
| Idade mínima | **Sem restrição** (mantém como está, decisão de produto futura) |
| Copy | Corrigir: card de convite neutro ("Convite de profissional"); morre a promessa de e-mail automático |
| Mockups | Alta fidelidade no navegador antes de implementar as telas (processo do projeto) |

## 1. Auto-cadastro do profissional

### Entrada
- `escolha-perfil`: "Sou professor" passa a rotear para `/(auth)/cadastro-pro` (wizard).
- A tela `professor-info` é **aposentada** (rota removida). O link "Falar com a equipe Actus"
  sobrevive como ghost no passo 1 do wizard (`mailto:contato@actus.fit` — mantém o marcador
  `[ajuste: definir canal de contato real]`).

### Wizard `/(auth)/cadastro-pro` (3 passos)
Mesma arquitetura do cadastro do aluno: `FormProvider` único no `_layout` do grupo +
`zodResolver`, passos como rotas de um Stack (`slide_from_right`), `WizardProgress`,
validação por passo via `trigger(CAMPOS_DO_PASSO)`.

- **01 / Papel** — chips Personal | Nutricionista (obrigatório); campo do registro
  profissional (CREF para personal, CRN para nutri — obrigatório, string 3–40) +
  validade do registro (DateField, opcional). Nota honesta:
  *"Seu registro é validado pela equipe Actus após o cadastro."*
- **02 / Você** — nome completo (min 3), nascimento (DateField, obrigatório,
  `YYYY-MM-DD` por componentes locais), gênero em chips (opcional), CPF com máscara
  (opcional, 11 dígitos quando presente). Espelho do passo 2 do aluno.
- **03 / Acesso** — e-mail, telefone (opcional, máscara), senha (min 8, hint reativo) +
  confirmação, checkbox de consentimento LGPD com links de termos/privacidade
  (mesmos placeholders `[ajuste: URLs reais]` do cadastro do aluno).

### Submit
- Monta body e chama `POST /auth/register-professional` — **`[pendente no backend]`**.
- Enquanto o endpoint não existe: o submit roda via `src/api/devMocks.ts` (infra de mock de
  dev que o app já usa), simulando o 201 com o marcador
  `// [MOCK — sem endpoint na API v1: POST /auth/register-professional]`. A UI fica 100%
  completa; quando o back entregar, remove-se a interceptação.
- Sucesso real (contrato proposto): 201 com tokens → mesmo fluxo do register do aluno
  (`setTokens` → `GET /me` → roteia por tipo para `(personal)`/`(nutri)`).

### Roteamento de erros entre passos (mesmo padrão do aluno)
- `email_already_in_use` → passo 3 (campo e-mail + link para login)
- `cpf_already_in_use` → passo 2 (campo CPF, via draft store)
- Campo de registro profissional inválido (`invalid_body` em `cref_number`/`crn_number`) → passo 1
- `invalid_body` com `fieldErrors` → cada campo ao passo de origem
- `internal_error`/rede → erro form-level no passo 3, preservando dados
- Draft store próprio (`cadastroProDraftStore`, Zustand em memória) para erros retroativos,
  espelhando `cadastroDraftStore`.

## 2. Convite com aluno logado (consume — endpoint REAL)

### Roteamento do deep link (`app/register.tsx`)
`actus://register?code=X` com sessão ativa deixa de descartar o código:
- `status === 'authenticated'` → `router.replace('/usar-convite?code=X')` (a tela guarda por tipo).
- Deslogado → comportamento atual (draft store → wizard de cadastro).

### Tela `app/usar-convite.tsx` (rota raiz empilhada, FORA dos grupos)
Fica fora de `(aluno)` de propósito: o guard do grupo redirecionaria um profissional logado
antes da tela montar, tornando o estado "Convites são para alunos" inalcançável. A tela faz
o próprio guard por tipo (padrão de `app/aluno/[id].tsx`, que também vive na raiz).
- Aceita `?code=` opcional; sem code, mostra input mono do código (mesma validação local
  base64url do passo 1).
- Card **neutro** do convite ("Convite de profissional" — sem nome até o preview existir;
  reusa o padrão honesto do passo 1, com degradação se o preview falhar).
- CTA "Confirmar vínculo" → `POST /invites/consume` (schema `ConsumeInviteResponse` já
  existe em `src/types/invites.ts` — reusar).
- **Estados de resposta**:
  - sucesso → "Vínculo criado." + invalida caches relevantes (`/me`, treinos/dietas do aluno)
  - `note: "already_linked"` → "Você já está vinculado a este profissional."
  - `already_has_active_professional_for_role` → "Você já tem um {personal|nutricionista}
    ativo. Fale com ele antes de trocar." (papel vindo do erro/contexto quando disponível)
  - `invalid_invite` / `invite_expired` / `invite_exhausted` → mesmas copies do cadastro
- **Guard por tipo**: logado como personal/nutricionista → estado "Convites são para alunos."
  com ação de trocar de conta (logout → escolha-perfil). `only_student_can_consume` do
  backend vira o mesmo estado (defesa dupla).

### Entrada manual
- Item "Usar convite" no perfil do aluno (`AccountScreen`, visível só para tipo aluno) →
  abre `/usar-convite` sem code.

## 3. Correções de copy (escopo incluído)

- Card do convite no cadastro (passo 1) e na tela usar-convite: **"Convite de profissional"**
  / "Confirmamos quem te convidou ao criar a conta." (neutro quanto ao papel).
- A copy de credenciamento com "senha provisória na sua caixa" morre junto com a
  `professor-info` (o backend não envia e-mail — confirmado).

## 4. Sinal para o Dev Back (documentar em AGENTS.md, NÃO implementar)

### `POST /auth/register-professional` (novo)
Rota pública. Contrato proposto (espelha o schema de `POST /admin/professionals`, união
discriminada por `professional_role`, **sem** `must_change_password` — a pessoa define a
própria senha):

- Base: `email` (max 320), `password` (min 8), `full_name` (3–200), `birth_date`
  (`YYYY-MM-DD`), `cpf?`, `phone?`, `gender?`, `lgpd_consent` (literal true, default),
  `policy_version` (default "v1")
- `professional_role: "personal"` → `cref_number` (obrigatório no auto-cadastro), `cref_expires_at?`
- `professional_role: "nutricionista"` → `crn_number` (obrigatório), `crn_expires_at?`
- Efeitos: cria `app_users` (sem flag de troca de senha), `profiles.tipo = professional_role`,
  `user_basic_info`, consentimento LGPD source `'self'`, `professional_info` com CREF/CRN.
  Conta **ativa imediata**; validação do registro é assíncrona pela equipe (pode suspender depois).
- Resposta: 201 `{ access_token, access_token_expires_in, refresh_token }` (igual register).
- Erros: `invalid_body` (400), `email_already_in_use` (409), `cpf_already_in_use` (409),
  `internal_error` (500) — branch sempre no campo `error`.

### Reforço em `GET /invites/:code/preview` (já solicitado)
Incluir o **papel do emissor** (`professional_role`) na resposta — habilita copy específica
("Convite de personal" / "de nutricionista") no card.

### Consume
Nada a pedir — `POST /invites/consume` já existe e é usado como está.

## 5. Regras de design aplicáveis

- Tokens do theme, zero hex; radius padrão (cards 12, inputs 12, pill 100); 1 momento de
  motion por tela; Phosphor duotone; copy quiet luxury (sem buzzword, sem emoji).
- Wizard pro espelha a linguagem visual do wizard do aluno (hero compacto, WizardProgress,
  FormField/MaskedField/DateField/GenderChips existentes — máximo reuso de moléculas).
- Mockups de alta fidelidade no navegador para validação do designer **antes** de
  implementar as telas (wizard pro + usar-convite).

## 6. Testes

- Schemas zod do cadastro-pro (papel discriminado, CREF/CRN obrigatório por papel, datas locais).
- Roteamento de erros do wizard pro (email→3, cpf→2, registro→1, fieldErrors).
- Telas: 3 passos do wizard (validação por passo, CTA estados), nota de validação assíncrona.
- `usar-convite`: estados ok / already_linked / conflito de papel / convite inválido / guard
  de tipo (profissional logado).
- `register.tsx`: deslogado → cadastro com draft; aluno logado → usar-convite com code;
  profissional logado → usar-convite (guard).
- Mock devMocks do register-professional validado pelo mesmo schema do contrato proposto.

## Fora de escopo (YAGNI)

- Cadastro livre de aluno **sem convite** (card de V4 no Miro — outro ciclo).
- Validação síncrona de CREF/CRN (consulta a conselho) — assíncrona pela equipe.
- Envio de e-mail (boas-vindas, confirmação) — não existe mailer no backend.
- Reset de senha — continua `[fluxo futuro]` (regra do projeto).
- Idade mínima — sem restrição por decisão de produto.
