# Par-Q — Design (Sub-projeto MVP/V1)

Data: 2026-06-09 · Módulo: Personal Trainer · Prioridade: Critical · Esforço: Large

## Contexto

Primeiro sub-projeto da coluna **MVP (V1)** do roadmap (Miro). Estratégia geral desta
fatia: **construir o front completo sem alterar o backend**, isolando todo dado sem
endpoint em `src/mocks/` e documentando explicitamente o que o Dev Back precisa expor.

O Par-Q (Physical Activity Readiness Questionnaire) é o questionário de prontidão para
atividade física. No Actus ele cumpre dois papéis: dar segurança/responsabilidade ao
personal antes de prescrever treino, e registrar a resposta do aluno.

Não existe endpoint no backend para Par-Q (confirmado em `api/src/routes/` — não há
rota de questionário/anamnese). Tudo roda sobre mock até o back expor as rotas.

## Decisões validadas (designer: Davi)

| Decisão | Escolha |
|---|---|
| Quem responde | **Aluno responde, personal revisa** (modelo clássico) |
| Conjunto de perguntas | **PAR-Q padrão fixo — 7 perguntas sim/não** (instrumento validado, igual para todos) |
| Comportamento em "sim" | **Aviso brando**: selo "Atenção" + alerta ao atribuir treino, **sem bloqueio** |
| Layout do questionário | **Lista única (scroll)** com toggles Sim/Não — não wizard |
| Validade | **12 meses**; re-prompt ao expirar |
| Entrada do aluno | Card na Home (enquanto pendente) + linha no Perfil |
| Persistência (enquanto mock) | Store local (Zustand + SecureStore/AsyncStorage) por aluno |

## 1. Contrato de dados

As 7 perguntas oficiais do PAR-Q como constantes estáticas (`PARQ_QUESTIONS`,
`question_id` 1–7). Schema Zod em `src/types/parq.ts` (mesmo schema validará a resposta
real da API quando existir):

```ts
ParqAnswer = { question_id: 1..7, value: boolean }   // true = "sim"

ParqSubmission = {
  student_id: string
  answers: ParqAnswer[]        // exatamente 7, uma por question_id
  any_yes: boolean             // derivado: true se qualquer value === true
  answered_at: string          // data LOCAL (formatDateLocal — nunca toISOString)
  valid_until: string          // answered_at + 12 meses (componentes locais do Date)
}
```

Status derivado (perspectiva do personal):
`não respondido` · `respondido — ok` · `respondido — atenção` (any_yes) · `expirado`
(quando `valid_until` < hoje).

### Mock

`src/mocks/parq.ts` com marcador `// [MOCK — sem endpoint na API v1: /students/:id/par-q]`:

- `PARQ_QUESTIONS` — texto das 7 perguntas (copy quiet luxury, pt-BR).
- Store de submissões por `student_id`, validado por `ParqSubmissionSchema`, persistido
  localmente (SecureStore/AsyncStorage) para o envio do aluno sobreviver ao reload no
  dev build. Migração futura = trocar o store por `useQuery` + `parseApi(...)` sem
  refatorar tela (convenção do `src/mocks/README.md`).

## 2. Lado do aluno

- **Entrada**: card na Home ("Responda seu Par-Q") enquanto pendente — some ao
  responder. Linha permanente no Perfil ("respondido em DD/MM, válido até DD/MM" ou
  "pendente"), com opção de revisar/refazer.
- **Tela** `app/(aluno)/par-q.tsx` (lista única): parágrafo de intro (o que é, ~2 min),
  7 toggles Sim/Não — todos começam **sem marcação**; enviar só habilita com os 7
  respondidos. **1 momento de motion**: reveal de entrada (opacity/scale 300ms).
- **Pós-envio**: confirmação discreta. Se houver "sim", nota tranquila:
  *"Recomendamos avaliação médica antes de iniciar. Seu personal foi avisado."*
  (sem alarme, sem emoji).

## 3. Lado do personal (revisão)

- **`StudentRow`**: selo discreto — "Atenção" (token `warning`) quando `any_yes`,
  "Par-Q pendente" quando não respondido, nada/check quando ok/expirado.
- **`StudentDetailScreen`**: nova seção "Prontidão (Par-Q)" — status, data, validade e
  as 7 respostas read-only com os "sim" destacados. Pendente → "Aguardando resposta" +
  ação "Lembrar aluno" `[fluxo futuro: push]`.
- **Gating (aviso brando)**: no fluxo `atribuir-treino`, se o aluno tem `any_yes`, banner
  **não-bloqueante** antes de atribuir: *"Este aluno marcou atenção no Par-Q — avaliação
  médica recomendada."* O botão de atribuir permanece liberado (respeita o julgamento
  profissional).

## 4. Sinal para o Dev Back (documentar, NÃO implementar aqui)

Endpoints solicitados (branch sempre no campo `error`, padrão da API):

| Endpoint | Uso |
|---|---|
| `POST /students/:student_id/par-q` | Aluno autenticado envia respostas; servidor carimba `answered_at`, calcula `any_yes` e `valid_until` |
| `GET /me/par-q` | Aluno lê o próprio status/respostas |
| `GET /professional/students/:student_id/par-q` | Personal lê status/respostas do aluno |

Registrar também em "Pendências externas (backend)" do projeto. Até existirem, front
roda 100% sobre `src/mocks/parq.ts`.

## 5. Regras de design aplicáveis

- Tokens do theme — nada de hex hardcoded. Card 12px, pill 100, toggle como pill.
- Selo "Atenção" usa token `warning`; estado ok usa `secondary`/`success` sutil.
- Fontes: Barlow Condensed (títulos), Barlow (corpo/perguntas), Share Tech Mono (datas).
- Copy específica, sem buzzword/CTA genérico, sem emoji.
- Sombra só em modal/sheet; 1 momento de motion por tela.

## 6. Testes

- `src/types/parq.ts`: parse do schema, derivação de `any_yes`, cálculo de `valid_until`
  com componentes **locais** do Date (caso de teste do bug de fuso: responder em
  01/01/2026 → `valid_until === "2027-01-01"`).
- Mock store: persistir e ler submissão por aluno.
- Tela do aluno: enviar fica desabilitado até os 7 respondidos; `any_yes` correto.
- `StudentDetailScreen`: seção renderiza status/respostas; destaque dos "sim".
- Gating: banner aparece só quando `any_yes`; nunca bloqueia o botão de atribuir.

## Fora de escopo (YAGNI)

- PAR-Q+ estendido / perguntas condicionais.
- Customização de perguntas pelo personal (builder de formulário).
- Bloqueio rígido / upload de liberação médica.
- Push real de lembrete (fica `[fluxo futuro]`).
