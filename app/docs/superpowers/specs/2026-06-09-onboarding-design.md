# Onboarding Aluno + Professor — Design (substitui o spec de cadastro-pro)

Data: 2026-06-09 · Worktree: `feat/cadastro`
Fontes: história de usuário "Onboarding do aluno" (Davi, 2026-06-09) + PDF "Fluxo de onboarding — Professor".
**Substitui** `2026-06-09-cadastro-profissional-convite-design.md` (o consume/usar-convite e a
infraestrutura de wizard daquele spec são absorvidos por este).

## Contexto

Os dois documentos de produto redefinem os fluxos de entrada com princípio de **baixa fricção**:
uma pergunta por tela, opcionais puláveis, valor rápido (chegar à home cedo). Estratégia da fatia
continua: **front completo sem alterar o backend** — o que faltar vira mock isolado + sinalização.

Fatos do backend que moldam o design (verificados):
- `POST /auth/register` (real) **exige** `invite_code` e `birth_date`; cria só aluno.
- `POST /invites/consume` (real) vincula aluno logado a um profissional.
- `GET /invites/:code/preview` **não existe** (nome do personal no convite depende dele — já solicitado).
- `PATCH /me` aceita `body_weight_kg` (real). Altura, foto, preferências de treino, perfil
  profissional (nome/área), registro de professor: **não existem**.
- PAR-Q: front pronto (mock local `src/mocks/parq.ts`, telas e selo "Atenção" no detalhe do aluno).

## Decisões validadas (designer: Davi)

| Decisão | Escolha |
|---|---|
| Escopo | Os docs **substituem** o spec anterior; um ciclo único "Onboarding completo" |
| Nascimento (aluno) | **Mantido** na tela de conta (backend exige; sinalizar tornar opcional) |
| Aluno sem convite | **Incluído contra mock** (register com `invite_code` opcional — proposto ao back; antecipa o card V4 "Cadastro livre sem convite") |
| Professor | **Só personal** (fiel ao PDF; sem nutricionista/CRN neste fluxo) |
| Peso | Real via `PATCH /me body_weight_kg`; **altura** mock + sinal |
| Peso/altura no fluxo | Tela única "Seu corpo", **pulável** (resolve a contradição da história: telas existem, critério permite concluir sem) |
| Foto de perfil | Tela no fluxo com **"Pular" funcional**; "Adicionar foto" fica `[pendente: expo-image-picker (rebuild do dev client) + endpoint de upload]` — a dep nativa NÃO entra neste ciclo para não forçar rebuild no meio do trabalho paralelo |
| PAR-Q | **Reuso** dos componentes/mocks existentes, embutido como passo do onboarding |

## Arquitetura do fluxo

O onboarding pós-conta roda **autenticado** (o consume e o PAR-Q exigem sessão):

```
escolha-perfil ("Como você quer usar a Actus?")
├─ Sou aluno     → (auth)/cadastro       (conta) ──register──▶ onboarding-aluno/*     → home aluno
└─ Sou professor → (auth)/cadastro-pro   (conta) ──register-professional [MOCK]──▶ onboarding-professor/* → home professor
```

- **Gate de onboarding**: `src/store/onboardingStore.ts` (Zustand + storage local, por user id):
  `{ done: boolean }` por fluxo. `app/index.tsx` (dispatch) passa a checar: autenticado + tipo
  aluno/personal + onboarding pendente → `replace` para o grupo de onboarding. Marcador
  `[local — persistir no /me quando o back expuser]`.
- Grupos de onboarding são **rotas raiz** (`app/onboarding-aluno/`, `app/onboarding-professor/`)
  com guard interno (autenticado + tipo certo), stack `slide_from_right`, **puláveis individualmente**
  conforme cada doc; sem botão voltar para a (auth) (conta já criada).
- Cada tela: **uma pergunta principal**, opções em cards/chips selecionáveis, sem texto longo.

## Fluxo do ALUNO

### Conta — `(auth)/cadastro` (reformulado: passos atuais 1–3 viram UMA tela "Crie sua conta")
- Campos: **nome completo, telefone (obrigatório agora), e-mail, senha** + **nascimento**
  (mantido — exigência do backend; sinalizar tornar opcional) + consentimento LGPD.
- CPF e gênero **saem** do cadastro (coletáveis depois no perfil — `PATCH /me`).
- **Com deep link** (`actus://register?code=X`): register real **com** `invite_code` (vínculo
  automático, confirmado visualmente no passo de vínculo).
- **Sem convite**: register **sem** `invite_code` → contrato proposto (back: tornar opcional);
  em dev, devMocks responde. Produção real continua exigindo o caminho do convite até o back mudar.
- Erros: mesmo roteamento por código já existente (email/cpf em uso, invalid_body etc., adaptado
  à tela única).

### Onboarding (rotas em `app/onboarding-aluno/`, nesta ordem)
1. **Foto** — "Adicione uma foto de perfil". CTAs: Adicionar foto `[pendente]` · **Pular por enquanto**.
2. **Vínculo** — com convite consumido no register: card "Você foi convidado por …" (nome real
   quando o preview existir; card neutro até lá) + **Confirmar vínculo** (no caminho com register
   real o vínculo JÁ existe — o confirmar é reconhecimento visual e marca o passo).
   Sem vínculo: input de código (→ `POST /invites/consume`, real) **ou** "Seguir sem vínculo".
3. **PAR-Q** — obrigatório; reusa `PARQ_QUESTIONS`/`ParqQuestionRow`/`submitParq` embutidos
   (lista única, mesma tela do app). `any_yes` → personal já vê o selo "Atenção" (entregue).
4. **Interesse principal** — cards: Hipertrofia · Emagrecimento · Condicionamento físico geral ·
   Resistência muscular · Adaptação neuromotora (1 escolha, obrigatória).
5. **Experiência** — "Qual seu nível de treino?": Estou começando · Já treino às vezes ·
   Treino com frequência.
6. **Disponibilidade** — "Quantos dias por semana você quer treinar?": 1 · 2 · 3 · 4 · 5+.
7. **Local** — "Onde você treina?": Academia · Casa · Condomínio · Ar livre.
8. **Seu corpo** (pulável) — peso (kg, decimal com vírgula, 20–400 → `PATCH /me` REAL) e
   altura (m, ex.: 1,98 → mock + sinal). CTA "Pular por enquanto".
9. Marca `done` → home.

### Persistência das respostas
`src/mocks/studentOnboarding.ts` — `// [MOCK — sem endpoint na API v1: preferências de treino do aluno]`
schema Zod `{ interesse, experiencia, dias_semana, local, altura_cm? }` por user id, persistido
local (mesmo padrão do Par-Q). Peso NÃO entra no mock (vai real no `PATCH /me`).

### Visível pro personal
Nova seção "Preferências" no `StudentDetailScreen` (abaixo do Par-Q): interesse, experiência,
dias/semana, local — lendo o mock `[MOCK até o back expor]`. Crit. de aceite "informações de
fácil acesso para o personal" ✔ (com a mesma limitação dev-only do Par-Q, documentada).

### Home do aluno por status (ajustes na Home existente)
- Vinculado **sem treino**: card "Seu personal já recebeu suas informações e poderá preparar seu treino."
- Vinculado **com treino**: comportamento atual (treino do dia) — já entregue.
- **Sem personal**: card com CTA "Usar convite" (→ `/usar-convite`, que continua existindo
  standalone para deep link logado e entrada manual pelo Perfil).

## Fluxo do PROFESSOR

### Conta — `(auth)/cadastro-pro` (tela única "Crie sua conta")
- Campos: nome completo, telefone, e-mail, senha (PDF). Sem nascimento (endpoint é proposto;
  contrato sugere `birth_date` opcional). Submit → `POST /auth/register-professional`
  `[pendente no backend; devMocks em dev]` → tokens → autenticado.

### Onboarding (rotas em `app/onboarding-professor/`)
1. **Foto** — igual ao aluno (Pular funcional; Adicionar `[pendente]`).
2. **Perfil profissional** — "Conte o básico sobre sua atuação": **nome profissional** +
   **área de atuação** (obrigatórios; áreas do PDF: Musculação, Condicionamento físico,
   Emagrecimento, Hipertrofia, Reabilitação/retorno ao treino, Funcional, Corrida, Outro);
   CREF, tempo de experiência, Cidade/UF **opcionais**. Persistência:
   `src/mocks/professionalProfile.ts` `[MOCK — sem endpoint]`.
3. **Forma de uso** (pulável) — "O que você quer fazer primeiro na Actus?": Organizar meus
   alunos · Prescrever treinos · Acompanhar evolução · Convidar alunos · Testar o app primeiro.
   Guardado no mesmo mock (telemetria de intenção).
4. **Convite** (pulável) — "Convide seu primeiro aluno": reusa o fluxo de convite existente
   (`/convite/novo` gera código/link real; compartilhar = share sheet nativo). "Inserir aluno
   manualmente" = `[fluxo futuro]` (sem endpoint). CTA "Pular por enquanto".
5. Marca `done` → home (aba Alunos).

### Home do professor por status
A aba Alunos já cobre: vazio → empty state (ganha CTAs "Convidar aluno" e "Criar primeiro
treino"); com alunos → lista (entregue). Ajuste de copy do empty state para o PDF.

### Registro/validade do antigo plano
- A tela informativa `professor-info` continua **aposentada**.
- O wizard de 3 passos do spec anterior é substituído por conta única + onboarding.
- CREF agora **opcional** (PDF) — sem chip de papel (só personal).

## Sinais para o Dev Back (consolidado — AGENTS.md)

1. `POST /auth/register`: tornar `invite_code` **opcional** (cadastro sem vínculo) e `birth_date`
   **opcional** (baixa fricção). Sem convite → conta de aluno sem vínculo.
2. `POST /auth/register-professional` (novo): nome, telefone, e-mail, senha (+ opcionais
   `birth_date`, `cref_number`); cria `profiles.tipo='personal'` ativo; tokens na resposta.
3. `GET /invites/:code/preview` (reforço): **nome do profissional** + `professional_role` —
   agora requisito da história ("Você foi convidado por João Personal").
4. Upload de **foto de perfil** (aluno e professor) + campo no `/me`.
5. **Preferências do aluno** (interesse, experiência, dias/semana, local, altura) — persistir e
   expor ao profissional vinculado (`GET /professional/students/:id` ou similar).
6. **Perfil profissional** (nome profissional, área de atuação, tempo de experiência, cidade/UF)
   — persistir e expor.
7. PAR-Q: endpoints já solicitados (ciclo anterior) — reforço: agora é passo obrigatório do onboarding.

## Regras de design

- Tokens/radius/fontes/1 motion por tela/Phosphor duotone/copy quiet luxury (regras do projeto).
- Cards de escolha: padrão `ChoiceCard`/chips existentes; uma pergunta por tela; progresso
  discreto (`WizardProgress` ou contagem eyebrow `03 / 08`).
- Mockups de alta fidelidade no navegador ANTES de implementar as telas (gate do processo).

## Testes

- Conta aluno: schema (telefone obrigatório, nascimento presente), register com/sem invite_code
  (mock), roteamento de erros na tela única.
- Onboarding aluno: gate do dispatch (pendente → onboarding; done → home), cada tela marca
  resposta no mock store; PAR-Q embutido grava via `submitParq`; "Seu corpo" envia
  `PATCH /me body_weight_kg` real e pular não envia nada.
- Vínculo: com convite (reconhecimento), sem convite (consume real ok/erros, seguir sem vínculo).
- Conta professor + onboarding: perfil profissional obrigatórios, passos puláveis, convite reusa
  fluxo real, gate → home.
- Home: card por status (sem treino/sem personal).
- `usar-convite` standalone + register deep link: testes do ciclo anterior permanecem.

## Fora de escopo (YAGNI)

- Picker/upload de foto (dep nativa + endpoint) — tela entra, ação fica pendente.
- "Inserir aluno manualmente" — `[fluxo futuro]`.
- Onboarding de **nutricionista** (segue credenciamento).
- Bio, redes sociais, dados bancários, valor de plano (PDF: depois, no perfil).
- Anamnese longa; altura no backend; idade mínima.
