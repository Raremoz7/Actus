# TEC-12 — Histórico do aluno (enriquecimento) — Backend

**Para:** responsável pelo backend
**Issue:** [TEC-12](https://linear.app/actusfit/issue/TEC-12)
**Natureza:** enriquecer um endpoint que **já existe** — `GET /professional/students/:student_id/check-ins`. O front da aba Histórico já consome os campos novos de forma **opcional** (degrada para data + tipo enquanto o backend não os enviar). Sem mudança de contrato incompatível.

## O que muda

Hoje cada check-in retorna: `id`, `check_in_date`, `source`, `created_at`, `workout_session_id?`.

Para check-ins de **sessão de treino** (`source = 'workout_session'`), incluir também:

| Campo | Tipo | Descrição |
|---|---|---|
| `workout_name` | `string \| null` | Nome do treino executado naquela sessão |
| `duration_seconds` | `number \| null` | Duração da sessão em segundos |
| `completion_pct` | `number \| null` | % de completude (séries/exercícios concluídos vs prescritos), 0–100 |
| `pr_count` | `number \| null` | Nº de recordes pessoais (PRs) batidos na sessão |

Para check-ins `manual`, todos esses campos vêm `null` (ou ausentes) — o front já trata.

### Origem dos dados
- `workout_name`: join `workout_sessions → workouts` (ou `student_workouts`).
- `duration_seconds`: da própria `workout_sessions` (início/fim) se houver; senão `null`.
- `completion_pct`: séries concluídas / séries prescritas na sessão (a partir de `session_sets` ou equivalente). Se não houver granularidade, pode ser `null` por enquanto.
- `pr_count`: nº de séries que superaram o melhor histórico do aluno naquele exercício na sessão. Se custoso, pode ficar para um segundo momento (`null`/`0`).

## Guards / padrão
Mesmo do arquivo: autenticado + `tipo ∈ {personal,nutricionista}` + vínculo ativo. Erro no campo `error` do body. Datas em `YYYY-MM-DD` locais (nunca `toISOString`).

## Front consumidor (já pronto)
- Schema: `web/src/lib/schemas.ts` (`CheckInSchema` — campos novos como `.nullable().optional()`).
- UI: `web/src/pages/alunos/HistoricoTab.tsx` (filtro Todos/Treino/Manual + linhas com treino/tempo/completude/PRs quando presentes).

---

## (Opcional, futuro) Remover o N+1 do Dashboard

O `DashboardPage` (`web/src/pages/dashboard/DashboardPage.tsx`) hoje agrega KPIs, gráficos, "alunos em risco" e "recentes" via **fan-out por aluno** (limitado a `MAX_FANOUT`). Existe `professionalDashboard.ts` no monorepo (`/professional/dashboard/overview`, `/adherence`, `/at-risk`) que **não está em produção**. Para o front deixar de fazer o fan-out, seria preciso:
1. Deployar os 3 endpoints de dashboard em produção.
2. Idealmente um endpoint de **feed de atividade recente** agregado (hoje o painel "Atividade" e "Alunos recentes" também usam os check-ins por aluno).

Enquanto isso não existir, o dashboard permanece com a agregação client-side (funciona; números viram "amostra" acima de `MAX_FANOUT`). Não é bloqueador da TEC-12.
