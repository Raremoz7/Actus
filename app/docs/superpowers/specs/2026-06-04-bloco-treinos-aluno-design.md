# Bloco — Treinos do aluno (design)

> Validado pelo designer (Davi) em 04/06/2026 via mockups (visual companion). Direções escolhidas: **Lista = C (Próximo + lista)**, **Detalhe = B refinado (foco do treino como herói + cards de exercício)**.

## Escopo

Consumo (read-only) dos treinos do aluno: **lista da semana** + **detalhe do treino** (exercícios). O botão **"Iniciar treino"** existe nas duas telas mas, neste bloco, **navega para um stub** — a execução ao vivo (criar sessão, marcar exercício, gravar séries, finalizar) é o **próximo bloco (Player/Sessão)**. Não criar sessão aqui (evita sessões `in_progress` órfãs sem player que as finalize).

## Decisões validadas

| Tema | Decisão |
|---|---|
| Lista | Direção C: card-herói do **próximo treino** (com "Iniciar treino") + lista compacta "resto da semana" |
| Detalhe | Direção B refinada: foco do treino (`workout_notes` ou nome) como **título herói 36px**; "Exercícios" vira rótulo de seção; cada exercício é um **card** (séries×reps em mono grande, tag de grupo muscular quando houver, descanso com ícone timer); CTA "Iniciar treino" **fixo no rodapé** |
| Iniciar treino | Navega para rota stub (`[fluxo futuro] — player = próximo bloco`). Não chama `POST .../sessions` ainda |
| Ícones | Phosphor duotone. **Zero emoji** ([[nunca-emoji-sempre-icones]]) |
| Motion | 1 momento único por tela: reveal de entrada |
| Cards | radius 12 (token vigente) |

## Dados (API real — confirmada no backend)

**`GET /me/workouts`** → `{ student_workouts: [ ... ] }`, cada item:
`id, student_id, workout_id, weekdays:number[] (ISO 1–7), start_date, end_date|null, display_order, is_active, created_at, workout_name, workout_notes|null, exercise_count:number, last_completed_date|null`. Ordenado por `display_order asc, created_at desc`. Aceita `?is_active=true`.

**`GET /me/workouts/:student_workout_id`** → `{ assignment: { id, workout_id, weekdays, start_date, end_date|null, display_order, is_active, created_at }, workout: { id, name, notes|null, exercises: [{ id, position, wger_exercise_id, name_snapshot, sets, reps, rest_seconds, notes|null, muscle_group|null }] }, recent_sessions: [{ id, scheduled_for_date, status, started_at, completed_at|null }] }`. 404 → `student_workout_not_found`.

Notas de contrato:
- `muscle_group` pode vir `null` (schema antigo) → esconder a tag quando ausente.
- `workout_notes` pode vir `null` → herói do detalhe cai para `workout_name`.
- Datas já chegam como `YYYY-MM-DD`; exibir com helpers locais — nunca `toISOString`.
- Validar tudo com `parseApi` + Zod (mismatch → `invalid_response_shape`).

## "Próximo treino" (lógica pura)

A lista C precisa eleger o **próximo treino** entre os atribuídos. Regra (pura, testável, `src/lib/nextWorkout.ts`):
1. Considerar só `is_active`.
2. Hoje (weekday local 1–7): se algum treino tem `today ∈ weekdays`, esse é o "próximo · hoje".
3. Senão, o próximo é o de menor distância de dias à frente (varrendo weekday+1..+7 circular, menor `display_order` como desempate).
4. Se nenhum ativo tem weekdays futuros → sem próximo (estado vazio).
O "resto da semana" = demais treinos ativos, ordenados por display_order.

## Arquitetura de componentes

**Schemas** (`src/types/workouts.ts`, estende — não remove o que o HOJE usa):
- `StudentWorkoutSchema` (item da lista, shape real acima) + `StudentWorkoutsResponseSchema = { student_workouts: StudentWorkoutSchema[] }`.
- `WorkoutExerciseSchema` + `WorkoutDetailSchema` (`{ assignment, workout: { id, name, notes, exercises }, recent_sessions }`).

**Hooks** (`src/hooks/`, padrão `useMe`):
- `useStudentWorkouts()` → `GET /me/workouts` (parse `StudentWorkoutsResponseSchema`), `enabled: authenticated`.
- `useWorkoutDetail(studentWorkoutId)` → `GET /me/workouts/:id`, `enabled: authenticated && !!id`.

**Lib pura:** `src/lib/nextWorkout.ts` (`pickNextWorkout(items, todayWeekday)`), `src/lib/duration.ts` (`estimatedMinutes(exercises)` — soma `sets*(reps*~3s + rest_seconds)` arredondado, ou regra simples; testável).

**Componentes** (`src/components/workouts/`):
- `NextWorkoutCard` — herói da lista (foco, nº exercícios, "Iniciar treino").
- `WorkoutListRow` — linha compacta (nome, dia, nº exercícios, chevron).
- `WeekdayChips` — chips Seg–Dom com dias ativos acesos (reusa `weekdayLetter` de `src/lib/weekday.ts`).
- `ExerciseCard` — card do exercício (nome, tag muscular opcional, `sets×reps` mono, descanso).
- `WorkoutDetailHeader` — herói do detalhe (foco + meta + chips).

**Telas:**
- `app/(aluno)/(tabs)/treinos.tsx` — substitui placeholder; lista C; consome `useStudentWorkouts` + `pickNextWorkout`.
- `app/(aluno)/treino/[id].tsx` — tela empilhada (detalhe B); consome `useWorkoutDetail`. Registrar no Stack de `app/(aluno)/_layout.tsx`.

**Navegação:** lista → push `/(aluno)/treino/[id]` (passando `student_workout_id`). "Iniciar treino" (em ambas) → push de rota stub do player (`[fluxo futuro]`); por ora pode levar a um placeholder ou no-op visível.

## Estados

- **Loading:** skeleton sóbrio por bloco (sem spinner).
- **Erro:** estado discreto com "Tentar de novo" (refetch) — coerente com o HOJE.
- **Vazio:** sem treinos ativos → mensagem quiet ("Nenhum treino atribuído ainda.").

## Copy (quiet luxury)

Eyebrows mono: "SEUS TREINOS", "PRÓXIMO · HOJE", "RESTO DA SEMANA", "EXERCÍCIOS". CTA "Iniciar treino". Descanso "60s". Sem buzzword, sem emoji.

## Pendências honestas

- Player/execução (sessões, séries) = **próximo bloco**; "Iniciar treino" é stub aqui.
- **Reconciliação com o HOJE:** o card de treino do HOJE foi construído contra um `TodayWorkoutSummarySchema` fictício (marcado SHAPE A CONFIRMAR). O shape real é a **lista** `/me/workouts` — não há endpoint "treino de hoje". Quando integrar, o HOJE deve derivar o treino do dia da lista (via `pickNextWorkout`/weekday), reaproveitando a lógica deste bloco. **Fora do escopo deste bloco**, apenas registrado.
- `muscle_group`/`workout_notes` nulos tratados com fallback.

## Verificação

- `typecheck` + `lint` zero erro/any · `jest` verde · `expo-doctor` (ignorar falso-positivo de react duplicado em worktree aninhada).
- TDD: `pickNextWorkout` (hoje / futuro / circular / vazio), `estimatedMinutes`, schemas (parse válido + reject), e testes de render dos componentes (lista C, card de exercício, estados vazio/erro).
- Validação manual no device: lista mostra próximo correto pelo weekday local (teste de fuso), detalhe abre exercícios na ordem `position`, "Iniciar treino" leva ao stub, tag muscular some quando `null`.
