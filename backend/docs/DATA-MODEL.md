# Modelo de dados — Actus (Fase 1)

**Referência:** planejamento em `docs/PLANEJAMENTO-STACK-ARQUITETURA.md`, `docs/SECURITY-RLS.md`, `docs/OFFLINE-SYNC.md`.  
**Migrations:** [`supabase/migrations/`](../supabase/migrations/).

## Nomenclatura (PT ↔ identificadores SQL)

Os documentos de produto usam termos em português; o **schema Postgres** usa **inglês snake_case** (padrão comum com Supabase/clients). Mapeamento:

| Conceito (docs) | Tabela / tipo SQL |
|-----------------|-------------------|
| perfis | `profiles` |
| identidade (login) | `app_users` |
| refresh tokens | `refresh_tokens` |
| convites | `invites` |
| consumo de convites (auditoria) | `invite_redemptions` |
| limite de convites (profissional) | `professional_invite_limits` |
| vínculo aluno–profissional | `student_professional_links` |
| dados básicos (PII) | `user_basic_info` |
| consentimentos LGPD | `user_lgpd_consents` |
| papéis internos (RBAC API) | `app_user_roles` |
| dados profissionais | `professional_info` |
| treinos (template) | `workouts` |
| exercícios do treino | `workout_exercises` |
| atribuição ao aluno | `student_workouts` |
| sessão de execução | `workout_sessions` |
| exercício na sessão | `session_exercises` |
| check-in diário | `check_ins` |
| idempotência de sync | `sync_applied_ops` |
| plano de dieta (template) | `diet_templates` |
| dieta atribuída | `student_diets` |

Enums em inglês: `user_role`, `link_status`, `workout_session_status`, etc.

## Perfis e papéis

- `profiles.tipo` (enum `user_role`): `personal` | `nutricionista` | `aluno` | `actus_admin` | `actus_suporte`.
- **Staff interno:** além do tipo no perfil, a autorização de endpoints administrativos usa `public.app_user_roles` com `role in ('actus_admin','actus_suporte')`, refletida no JWT (`roles`).
- Alunos **não** guardam `personal_id` no perfil: vínculo só em `student_professional_links`.
- **Cadastro (auth custom, invite-first):** a identidade do usuário vive em `public.app_users`. O aluno **só se cadastra com `invite_code` válido** e, na mesma transação, o backend cria `app_users` + `profiles` (com `tipo = aluno`) + dados básicos/LGPD e já cria o vínculo em `student_professional_links`.
- **Sessão:** tokens e autorização são responsabilidade do backend (JWT de acesso + refresh token armazenado em `public.refresh_tokens` como hash). Contas com `app_users.must_change_password = true` só podem chamar rotas de auth necessárias (ex.: troca de senha) até regularizar.
- **Profissionais (`personal`/`nutricionista`)** podem ser criados por staff via `POST /admin/professionals` (sem convite). Caso contrário, **elevação** continua sendo operação administrativa controlada (seed/SQL); não há elevação automática por metadata.

## Cardinalidade aluno ↔ profissionais

- No máximo **1 personal ativo** e **1 nutricionista ativo** por aluno.
- Garantia: coluna `professional_role` em `student_professional_links` + índice único parcial `(student_id, professional_role) WHERE status = 'active'`.

## Convites e limites (Fase 1)

- **Emissor:** apenas `profiles.tipo in ('personal','nutricionista')` pode criar convites.
- **Cadastro do aluno:** exige convite válido (não expirado e não esgotado) e o consumo incrementa `invites.used_count`.
- **Auditoria:** cada consumo é registrado em `invite_redemptions` (para rastreabilidade).
- **Limite por profissional:** `professional_invite_limits.max_active_invites` define quantos convites “ativos” (ainda utilizáveis) um profissional pode manter. A API também aceita um fallback por env (`DEFAULT_MAX_ACTIVE_INVITES`) caso não exista registro na tabela.

## Dia ativo e streak (Fase 1)

- **Dia ativo:** existe **check-in** naquela data **ou** sessão de treino com `status` ∈ {`completed`, `completed_partial`} naquela `scheduled_for_date` (união OR), conforme `activity_dates_for_student`.
- **Datas:** `check_ins.check_in_date` e `workout_sessions.scheduled_for_date` são `date`; cálculo de “hoje” no RPC/trigger usa `profiles.timezone` com `timezone(tz, now())::date` quando aplicável.
- **Streak:** após check-in ou conclusão de treino, `recompute_student_streak` percorre dias consecutivos a partir do “hoje” local do aluno; se hoje ainda não tem atividade, considera-se também ontem como início da contagem (um dia de tolerância para o streak não zerar à meia-noite sem atividade ainda registrada). Ajuste fino de UX pode mudar só a função SQL.
- **Agregados em `profiles` (aluno):** `streak_current`, `streak_best`, `last_activity_date`, `total_check_ins`, `total_workouts_completed` — materializados pela recompute / triggers.

## Gamificação: desafios e ranking (produto alvo)

Decisões de produto adotadas na implementação atual (podem ser afinadas depois em migração/API):

- **Contagem de dia ativo nos desafios:** igual ao dia ativo global — entram check-in **e** sessões `completed` **e** `completed_partial` na data, conforme `activity_dates_for_student`.
- **Tolerância “grace” vs zerar:** o streak **global** do aluno segue `recompute_student_streak` (âncora hoje/ontem no TZ). Nos desafios, a série exibida no ranking é **apenas dentro do intervalo** `[starts_on, ends_on]`; não há campo extra de “X dias sem atividade zera” no MVP — dias sem atividade **não** pontuam; a sequência consecutiva é quebrada naturalmente.
- **Ranking `private_ranking`:** só o personal dono do desafio vê o ranking completo (nomes/ids). Participantes alunos **não** acessam o endpoint de ranking nesse modo.
- **Ranking `public_among_participants`:** participantes com status `active` veem o ranking com **`display_name`** de cada um (sem anonimização por “Aluno A” no MVP); o dono profissional vê o mesmo conjunto.

### Fase 2 — push e lembretes de streak

- **Não implementado no MVP:** registo de tokens (FCM/APNs), tabela `push_tokens`, job/cron ou Edge Function que, por exemplo, avise quando `streak_current > 0`, ainda não há linha em `activity_dates_for_student` para “hoje” no TZ do aluno e o relógio local ultrapassa um limiar (ex.: faltam 4h para o fim do dia).

## Semanas no calendário (`student_workouts.weekdays`)

- Inteiros **1 = segunda … 7 = domingo** (ISO-8601 weekday).

## Billing

- Fora do escopo desta migration. Colunas Stripe podem ser adicionadas depois em `profiles`.

## RPCs (estado atual)

- Com auth custom, o consumo de convites e operações idempotentes passam a ser feitos no **backend** (Node). RPCs e RLS deixam de ser a interface principal do app.

## RLS / Data API (importante)

Este repositório passa a tratar o Supabase como **Postgres gerenciado**, com acesso ao banco **somente via backend**. Por isso:

- As tabelas do domínio em `public` têm RLS **desabilitado** e grants para `anon/authenticated` **revogados** na migração de auth custom.
- Toda autorização acontece no backend.

| Tabela | Aluno | Personal | Nutricionista |
|--------|-------|----------|----------------|
| `profiles` | CRUD próprio; lê profissionais vinculados | Lê alunos com link ativo | Idem |
| `invites` | — | CRUD próprios (se `tipo` ∈ personal/nutri) | Idem |
| `student_professional_links` | SELECT participante | SELECT | SELECT |
| `workouts` / `workout_exercises` | SELECT se atribuído | CRUD do dono | — |
| `student_workouts` | SELECT | CRUD com link personal + dono do treino | — |
| `workout_sessions` / `session_exercises` | CRUD próprio (sessão) | SELECT progresso | — |
| `check_ins` | INSERT + SELECT próprio | SELECT alunos | SELECT alunos |
| `challenges` / `challenge_participants` | Aceitar/declinar; listar os seus | CRUD desafios próprios; convites | — |
| `sync_applied_ops` | SELECT próprio | — | — |
| `diet_templates` | SELECT se atribuído | — | CRUD próprio |
| `student_diets` | SELECT próprio | — | CRUD + link nutri–aluno |

Como a autorização é no backend, as regras de escrita são aplicadas na API e as tabelas não ficam expostas para `anon/authenticated`.

## Ambiente

As migrations devem ser aplicadas no **Postgres do Supabase**. O schema agora inclui `public.app_users`/`public.refresh_tokens` e não depende de `auth.users` para o fluxo principal de autenticação.
