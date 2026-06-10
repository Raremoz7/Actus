# Segurança, Tenancy e RLS (Supabase)

Este documento descreve o modelo de autorização do Actus Fit e duas opções de segurança no Supabase:

- **Opção A (atual)**: Supabase como **Postgres gerenciado** e acesso **somente via backend** (Node). RLS/grants para `anon/authenticated` ficam desabilitados/revogados e a autorização é no backend.
- **Opção B (futura)**: expor tabelas via Data API e aplicar **RLS**.

## Objetivos
- Garantir que cada usuário veja apenas o que lhe pertence.
- Modelar a relação **personal → alunos** (B2B2C) de forma simples.
- Aplicar **billing enforcement** no backend (não depender do app).

## Modelo mental (tenancy)
- **Tenant owner**: `personal`
- **Tenant member**: `aluno` vinculado ao personal (via convite)

No MVP, a “fronteira” do tenant é: tudo que tem `personal_id` (ou é derivado de vínculo com ele).

## Entidades e regras de acesso (conceito)

### Perfis (`profiles`)
- Usuário só lê/atualiza o próprio `profile`, exceto campos sensíveis controlados pelo backend (ex.: `subscription_status`).

### Convites (`convites`)
- Personal cria/lista convites próprios.
- Aluno consome convite no cadastro/vinculação (a lógica de “consumir” deve ser server-side).

### Treinos templates (`treinos`, `exercicios_treino`)
- Personal: CRUD apenas dos seus treinos.
- Aluno: não deve editar; leitura apenas via atribuição.

### Atribuições (`aluno_treino`)
- Personal: cria/edita/remove atribuições para seus alunos.
- Aluno: lê apenas atribuições onde `aluno_id = <userId>` (no backend) ou `auth.uid()` (caso volte a usar RLS/Data API).

### Execução (recomendado)
Para histórico/progresso, separar tabela(s) de execução:
- Aluno escreve suas execuções (somente dele).
- Personal pode ler execuções dos seus alunos (opcional no MVP, útil para “progresso básico”).

## Billing enforcement (obrigatório)
Regras sugeridas:
- Se `profiles.tipo = personal`, então ações “de escrita” (criar treino, atribuir treino) devem exigir `subscription_status = active` (ou trial).
- Essa validação pode ser aplicada de duas formas:
  - **RLS + views** (para cenários simples)
  - **Edge Function** mediando ações críticas (mais flexível)

## Diretrizes de RLS (MVP)
- Se seguir a **Opção A**, não habilitar RLS nas tabelas do domínio e não conceder grants para `anon/authenticated`.
- Se seguir a **Opção B**, habilitar RLS em todas as tabelas do domínio.
- Criar policies por tabela para:
  - `select`
  - `insert`
  - `update`
  - `delete`
- Evitar policies “genéricas” demais; o MVP ainda precisa ser seguro por padrão.

## Campos sensíveis
Campos recomendados como “controlados pelo backend” (não atualizáveis pelo client):
- `stripe_customer_id`
- `stripe_subscription_id`
- `subscription_status`
- `subscription_current_period_end`
- totais/derivados de gamificação (ex.: `pontos_total`, `streak_dias`, `ultimo_checkin`) se forem computados server-side

## Observações de evolução
Quando escalar:
- centralizar regras em um serviço de autorização (se migrar para backend próprio)
- introduzir auditoria mais completa (logs por ação crítica)
- revisar índices e queries para evitar vazamento por inferência (ex.: filtros fracos)

