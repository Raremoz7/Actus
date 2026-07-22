# Gamificação V1 — Badges + Streaks (TEC-13)

- **Linear:** [TEC-13](https://linear.app/actusfit/issue/TEC-13/gamificacao-v1-badges-streaks) · Projeto ActusFit V1 · Prioridade Alta
- **Data:** 2026-06-22
- **Origem:** Miro — "Actus V1 — User Stories" + "Especificação Detalhada" (seção 6)
- **Escopo decidido nesta sessão de brainstorming:**
  - Streak: **reescrever** para janela rolling de 24h (hoje é por data de calendário).
  - Push: **infra completa agora** (app + backend).
  - Personal: surfacing de streak/badges no **app `(personal)` e no web**.
  - Celebração: **completa com Lottie** (confete + som + haptics).
  - Estrutura: **spec único, plano em fases** (abordagem A).

---

## 1. Visão geral e princípios

**User story.** Como Aluno, quero ver progresso e receber badges para motivação.

**Princípio central — backend é a fonte da verdade.** App e web nunca decidem badge/streak localmente; apenas exibem o que o backend retorna. Isso garante consistência offline: o que vale é o `timestamp` do registro (check-in/sessão), não o momento do sync.

**O que já existe (reaproveitado):**
- `profiles.streak_current`, `streak_best`, `last_activity_date`, `total_workouts_completed`, `total_check_ins`.
- Função SQL `recompute_student_streak()` (será reescrita).
- `GET /me/gamification/weekly-overview` (estendido).
- Evolução de carga por sessão (`load_evolution` / `delta_kg`) em `services/studentWorkoutSummary.ts` — base para o badge de PR.
- App: KPIs de streak no perfil, componentes de fogo (`MyPositionCard`, `RankingRow`), `expo-haptics`, `reanimated`.

**O que é greenfield:** todo o sistema de badges, infra de push, overlay de celebração, surfacing para o Personal.

**Stack.** Backend: Node + TypeScript + Express 5 + PostgreSQL (pg, SQL raw, migrations em `backend/supabase/migrations/`). App: Expo / React Native + expo-router + TanStack Query + zod. Web: React 18 + Vite + Tailwind v4 + axios + TanStack Query + zod.

### Fases de implementação
1. **Backend foundation** — modelo de dados, streak rolling-24h, motor de avaliação de badges, endpoints.
2. **Push** — `expo-notifications`, `device_tokens`, envio via Expo Push API, disparo no desbloqueio.
3. **App aluno** — overlay Lottie + confete + som/haptics, tela de badges, streak na home com pulso/fumaça.
4. **Personal** — mini-indicador de streak/badges no card do aluno (app `(personal)` + web).

---

## 2. Modelo de dados

### Tabela `badges` (catálogo — semeado, 7 linhas)
| coluna | tipo | nota |
|---|---|---|
| `id` | text PK | slug |
| `name` | text | título exibido |
| `description` | text | texto do badge |
| `criteria_type` | text | `workout_count` \| `streak` \| `personal_record` |
| `criteria_threshold` | int null | limiar (count/streak); null para PR |
| `asset_key` | text | chave do Lottie/ilustração |
| `sort_order` | int | ordem na tab |
| `active` | bool | habilita/desabilita sem deploy |

**Catálogo dos 7 badges:**
| id | name | criteria_type | threshold |
|---|---|---|---|
| `first_step` | Primeiro Passo | workout_count | 1 |
| `committed_5` | Comprometido | workout_count | 5 |
| `consistent_10` | Consistente | workout_count | 10 |
| `dedicated_30` | Dedicado | workout_count | 30 |
| `personal_record` | Recorde Pessoal | personal_record | null |
| `fire_streak_7` | Sequência de Fogo | streak | 7 |
| `legendary_30` | Lendário | streak | 30 |

> Contagem de treinos usa `profiles.total_workouts_completed` (treinos concluídos). Streak usa `streak_current`. PR = primeiro `load_evolution` com `delta_kg > 0`.

### Tabela `student_badges` (conquistas — permanentes)
| coluna | tipo | nota |
|---|---|---|
| `id` | uuid PK | |
| `student_id` | uuid FK→profiles | |
| `badge_id` | text FK→badges | |
| `earned_at` | timestamptz | timestamp do registro que disparou (não o do sync) |
| `seen_at` | timestamptz null | **null = ainda não exibido** (controla overlay/banner) |

`UNIQUE(student_id, badge_id)` — conquista uma vez só. Inserções com `ON CONFLICT DO NOTHING` (idempotente).

`seen_at` resolve o caso "conquistou offline": ao sincronizar, o badge entra com `seen_at = null`; ao abrir, o app busca os não-vistos, dispara overlay/banner e marca como visto.

### Tabela `device_tokens` (push)
| coluna | tipo | nota |
|---|---|---|
| `id` | uuid PK | |
| `user_id` | uuid FK→profiles | |
| `expo_push_token` | text | token do Expo |
| `platform` | text | ios \| android |
| `created_at` | timestamptz | |
| `last_seen_at` | timestamptz | atualizado no registro |

`UNIQUE(expo_push_token)`.

### Alterações em `profiles`
- Adicionar `last_activity_at timestamptz` (instante exato da última atividade qualificante — necessário para a janela rolling).
- Adicionar `last_credit_date date` (data local do último crédito de streak — debounce de 1×/dia).
- Manter `streak_current`, `streak_best`, `last_activity_date` (compat).

---

## 3. Streak — janela rolling de 24h

**Mudança:** hoje o streak é por data de calendário. Passa a ser uma cadeia em que cada atividade qualificante ocorre dentro de 24h da anterior, com crédito debounced para 1×/dia-local (evita inflar com 2 treinos no mesmo dia).

Atividade qualificante = check-in OU sessão de treino concluída (`completed` / `completed_partial`) — mesma definição já usada hoje.

### Algoritmo (executado na transação do evento, timestamp `T`, data local `D`)
```
L  = profiles.last_activity_at          (timestamp da última atividade)
LD = profiles.last_credit_date          (data local do último crédito)

se L é null:
    streak_current = 1
    last_credit_date = D
senão se (T - L) > 24h:
    streak_current = 1                   # quebrou e recomeça
    last_credit_date = D
senão:                                   # dentro de 24h → vivo
    se D != LD:
        streak_current += 1              # novo dia-unidade
        last_credit_date = D
    # se D == LD: mesmo dia, sem crédito (debounce)

last_activity_at = T                      # sempre
streak_best = max(streak_best, streak_current)
```

Exemplo do spec: último check-in 14h seg → próximo até 14h ter mantém; depois disso, reseta.

### Detecção de quebra **sem** novo check-in — cálculo no read
Não há cron. A API deriva o valor efetivo na leitura:
- Se `now() - last_activity_at > 24h` → streak exibido = 0 (`is_broken = true`).
- O valor armazenado só é recalculado na próxima atividade.

O `weekly-overview` retorna `streak_current` (efetivo, já considerando quebra), `streak_best`, `is_broken` e `last_activity_at`. O app guarda o último streak conhecido (cache/storage); ao observar a transição de >0 para 0, dispara a animação de fumaça + "Comece de novo, você consegue!".

Sem push de quebra nesta V1 (o feedback de quebra é in-app, conforme spec).

---

## 4. Motor de avaliação de badges

Serviço backend `evaluateBadges(studentId, ctx, tx)`, chamado **na mesma transação** do evento qualificante (finish de sessão e/ou POST de check-in), **depois** de recalcular streak e contadores.

Passos:
1. Carrega badges `active` e os `badge_id` já conquistados pelo aluno.
2. Calcula métricas atuais: `total_workouts_completed`, `streak_current`, `had_pr` (do `load_evolution` do finish: algum `delta_kg > 0`).
3. Para cada badge não conquistado cujo critério é satisfeito → insere em `student_badges` (`earned_at = T`, `seen_at = null`) com `ON CONFLICT DO NOTHING`.
4. Retorna a lista de badges recém-conquistados.

> Idempotência garantida pela UNIQUE + ON CONFLICT. Reprocessar o mesmo evento não duplica.

### Endpoints
- `GET /me/badges` — catálogo completo + status por badge (`earned`, `earned_at`) para a tab (grid locked/unlocked).
- `GET /me/badges/unseen` — badges conquistados com `seen_at = null` (dispara banner/overlay na abertura).
- `POST /me/badges/seen` — body `{ badge_ids: string[] }`, marca `seen_at = now()`.
- **Finish de sessão** (`POST /me/workouts/sessions/:id/finish`): adicionar `newly_earned_badges: Badge[]` ao response → overlay imediato no caminho online.
- **Push de device tokens:** `POST /me/device-tokens` (registra), `DELETE /me/device-tokens/:token` (logout).
- **Personal:** estender o payload da lista de alunos (`/professional/students`) e do detalhe com `streak_current`, `is_broken`, `badge_count` (e opcionalmente `last_badge`). Reusa endpoints existentes.

---

## 5. Push notifications

### App
- Adicionar `expo-notifications`.
- No login/abertura: pede permissão, obtém Expo push token, faz `POST /me/device-tokens`. Trata refresh de token; no logout, `DELETE`.
- Tap na notificação → deep link para a tela de badges (expo-router), com `data: { type: 'badge', badge_id }`.

### Backend
- Tabela `device_tokens` (seção 2).
- Serviço de push usando a Expo Push API (via `expo-server-sdk`).
- No desbloqueio de badge (em `evaluateBadges` ou logo após o commit da transação): enviar push
  `🏆 Nova Conquista! [Badge] desbloqueado. Toque para ver`
  com `data` para o deep link.
- **Enviar após o commit** (nunca dentro da transação). Push é best-effort: falha de envio não desfaz a conquista.
- Tratar tickets/receipts do Expo: tokens inválidos (`DeviceNotRegistered`) são removidos da tabela.

---

## 6. App aluno (UI)

### `BadgeUnlockOverlay`
Modal full-screen: Lottie da ilustração "crescendo" + confete, som (`expo-audio`) + `Haptics.notificationAsync(Success)`, texto "Você conquistou: [Badge]", auto-dismiss em 3s ou botão "Continuar". **Fila:** múltiplos badges são exibidos em sequência.
- **Online:** alimentado por `newly_earned_badges` do response do finish.
- **Offline/abertura:** hook global consulta `unseen` ao abrir; conforme spec, conquista offline aparece como **banner in-app** que ao tocar abre a tab e roda o overlay. Marca `seen` ao exibir.

### Tela de badges — `app/(aluno)/badges.tsx`
Grid dos 7 badges: locked (silhueta/cinza) vs unlocked (colorido + `earned_at`). Linkada do perfil e alvo do deep link do push.

### Streak na home — `app/(aluno)/(tabs)/index.tsx`
Número grande + ícone de fogo (Flame Phosphor). Hoje só aparece no perfil.
- **Pulso** (reanimated) ao incrementar.
- **Fumaça** + "Comece de novo, você consegue!" (2s) ao detectar quebra (streak caiu de >0 para 0 desde o último valor conhecido em cache/storage).

### Tipos e hooks
- Completar `src/types/gamification.ts`: `Badge`, `StudentBadge`, schemas zod; estender `WeeklyOverview` com `is_broken`/`last_activity_at`.
- Hooks: `useBadges`, `useUnseenBadges`, `useMarkBadgesSeen`; estender o response do finish (`useSessionMutations`) com `newly_earned_badges`.
- Invalidação: finish invalida `['me','weekly-overview']`, `['me','badges']`, `['me','badges','unseen']`.

### Assets (dependência externa)
8 arquivos de animação: 7 ilustrações de badge + 1 confete (ou confete via lib). Usar **placeholders** (ícones Phosphor / Lottie genérico) até as artes finais chegarem. Documentar como pendência de design.

---

## 7. Personal — app + web

### App `(personal)`
- `StudentRow` (`src/components/professional/StudentRow.tsx`): mini-indicador com Flame + `streak_current` e contagem de badges (ou ícone do último badge).
- Dashboard pode exibir streak agregado/individual conforme couber.
- Dados vêm do payload estendido de `/professional/students`.

### Web
- Lista de alunos e/ou detalhe do aluno exibem streak + badges. Segue o padrão do web (axios + TanStack Query + zod + Tailwind v4).
- Novos componentes: `StreakBadge`, `StudentBadges`; tipos/hook espelhando os do app.
- Mini-indicador de badge "visível ao Personal" conforme spec.

---

## 8. Tratamento de erros e casos de borda

- **Idempotência de badges:** UNIQUE(student_id, badge_id) + ON CONFLICT DO NOTHING.
- **Streak — quebra sem check-in:** cálculo no read; o app detecta a transição >0→0 para a animação de fumaça.
- **Offline:** `earned_at` usa o timestamp do registro, não o do sync; `seen_at` controla o surfacing.
- **Push:** enviado pós-commit, best-effort; poda de tokens mortos.
- **Múltiplos badges simultâneos:** fila no overlay.
- **Timezone:** debounce de crédito de streak usa a data local (timezone da conta do aluno), reusando `studentLocalDateString()`.
- **Mesmo dia, 2 treinos:** crédito único (debounce por `last_credit_date`); streak continua "vivo" pelo `last_activity_at`.

---

## 9. Testes

- **Backend (algoritmo de streak):** mesmo dia (sem crédito), 23h depois (+1), 25h depois (reset para 1), primeira atividade (1), leitura após 24h sem atividade (efetivo 0 / `is_broken`).
- **Backend (evaluateBadges):** cada limiar (1/5/10/30 treinos, streak 7/30, 1º PR), idempotência (não duplica ao reprocessar), `seen_at = null` na inserção.
- **Backend (endpoints):** `/me/badges`, `unseen`, `seen`, `device-tokens`, payload estendido de students.
- **App:** componente do overlay (fila), tela de badges (locked/unlocked), streak na home (pulso/fumaça), seguindo os testes `.test.tsx` existentes.
- **Web:** componentes de streak/badges do aluno.

---

## 10. Resumo de arquivos afetados (referência)

**Backend**
- `supabase/migrations/` — novas migrations: `badges`, `student_badges`, `device_tokens`, colunas em `profiles`, reescrita de `recompute_student_streak`; seed do catálogo de badges.
- `api/src/services/` — `badgeEvaluation.ts` (novo), `pushService.ts` (novo), ajustes em `studentWorkoutSummary.ts`.
- `api/src/routes/` — `meGamification.ts` (badges + weekly-overview estendido), `meStudentProgram.ts` (finish retorna badges), `deviceTokens.ts` (novo), `meChallenges.ts`/professional students (payload estendido).

**App**
- `app/(aluno)/badges.tsx` (novo), `app/(aluno)/(tabs)/index.tsx` (streak), `app/(aluno)/(tabs)/perfil.tsx` (link p/ badges).
- `src/components/gamification/BadgeUnlockOverlay.tsx`, `BadgeGrid.tsx`, `StreakCounter.tsx` (novos).
- `src/hooks/useBadges.ts`, `useUnseenBadges.ts` (novos); `useSessionMutations.ts`, `useWeeklyOverview.ts` (estendidos).
- `src/types/gamification.ts` (completar).
- `src/lib/push.ts` (registro de token), integração `expo-notifications`.
- `src/components/professional/StudentRow.tsx` (mini-indicador).

**Web**
- `src/components/StreakBadge.tsx`, `StudentBadges.tsx` (novos); página de alunos/detalhe; hook + tipos.

---

## 11. Dependências e pendências
- **Assets Lottie** (7 badges + confete) — design. Placeholders até lá.
- **Som de conquista** — asset de áudio.
- Novas libs: `expo-notifications`, `expo-audio`, `lottie-react-native` (app); `expo-server-sdk` (backend).
- Push real exige build dev/EAS (não funciona no Expo Go para tokens reais) — validar no `build-dev.sh`/EAS.
