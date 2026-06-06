# Dieta do aluno — detalhe (design)

> Validado pelo designer (Davi) em 05/06/2026 via mockups (visual companion). Direção: **v3** — título grande (A) + faixa de total do dia (A) + refeições em timeline editorial (B).

## Contexto

O aluno não tem aba "Dietas" (decisão de nav: dieta = card no HOJE). Falta a **tela de detalhe da dieta ativa**, que é o destino real do card de dieta do HOJE — hoje o `onPress` aponta para `/(aluno)/(tabs)/treinos` (gambiarra/bug). Esta tela fecha esse buraco e reconcilia a dívida do `useStudentDiet` (schema fictício).

Escopo: **só o detalhe da dieta ativa** (read-only). Sem lista/histórico (o aluno raramente tem mais de uma ativa).

## Dados (API real — confirmada no backend)

- **`GET /me/diets`** → `{ diets: [{ id, diet_template_id, start_date:'YYYY-MM-DD', is_active, created_at, template_name, template_body }] }`. **A lista já traz `template_body`** (o jsonb de refeições).
- **`GET /me/diets/:student_diet_id`** → `{ id, diet_template_id, start_date, is_active, created_at, updated_at, template_name, template_body }`. 404 → `student_diet_not_found`.
- `template_body` é o jsonb livre que o nutri montou no builder (N9) = `DietBodySchema` = `{ meals: [{ name, foods?, kcal?, protein?, carbs?, fat? }], notes? }`. Pode vir `{}` em templates antigos → `parseDietBody` (já existe, de N9) com fallback `{ meals: [] }`.
- Validar respostas com `parseApi` + Zod. Datas data-only locais (`formatDateLocal`), nunca `toISOString`.

## Tela — `app/(aluno)/dieta/[id].tsx`

Empilhada (sem tab bar). Recebe `student_diet_id` via `useLocalSearchParams` (tratar `string[]`). Consome `useStudentDietDetail(id)`.

Layout (v3):
- Header: back (CaretLeft) + eyebrow "Dieta".
- **Título** (A): `template_name` em `AppText variant="h2"`/display grande (~32px), + meta mono `desde {start_date curto} · {N} refeições`.
- **Faixa de total do dia** (A): card faixa com 4 KPIs mono neon — **kcal · prot · carb · gord** somados das refeições (helper puro `dietTotals`). **Só renderiza se houver pelo menos um macro** preenchido em alguma refeição (degrada limpo).
- **Refeições** (B — timeline): label eyebrow "Refeições" + cada refeição como linha com **filete à esquerda** (neon na 1ª/"próxima", `outlineVariant` nas demais) + ícone Phosphor `ForkKnife` (duotone; neon na 1ª) + nome (display) + `foods` (bodySm) quando houver + chips de macro inline (`kcal` em chip neon; `P/C/G` em chips neutros) — só os macros informados.
- `notes` (se houver) ao final, em bodySm tertiary.
- Vazio (sem refeições): "Esta dieta ainda não tem refeições."
- Erro/404: mensagem discreta ("Não foi possível carregar a dieta.").
- 1 motion (reveal de entrada). Tokens do theme, zero emoji, zero hex.

## Reconciliação do HOJE (dívida do `useStudentDiet`)

O `useStudentDiet` atual usa `StudentDietSummarySchema = { id, title }` (fictício) — não bate com o real (`{ diets: [{ template_name, template_body, is_active, ... }] }`) → quebraria contra a API. Correções:
- `src/types/diets.ts`: substituir/estender com o **schema real** — `StudentDietSchema` (id, diet_template_id, start_date, is_active, created_at, template_name, template_body) + `StudentDietsResponseSchema = { diets: [...] }` + `StudentDietDetailSchema` (+ updated_at). `template_body` como `z.unknown()` (parse estrutural via `parseDietBody`).
- `src/hooks/useStudentDiet.ts`: passa a devolver a lista (`{ diets }`); o HOJE escolhe a **ativa** (`is_active`).
- `src/components/home/index` (HOJE `index.tsx`): `DietCard` recebe `title = dietaAtiva.template_name`; **"próxima refeição"** deixa de ser `nextMealMock` e mostra a **1ª refeição real** de `parseDietBody(template_body).meals[0]?.name` (ou esconde se não houver); `onPress` passa a abrir `router.push('/(aluno)/dieta/' + dietaAtiva.id)` (corrige o bug). Remover o uso de `nextMealMock`.

## Unidades

- **Modificar**: `src/types/diets.ts` (schemas reais) · `src/hooks/useStudentDiet.ts` (shape real) · `app/(aluno)/(tabs)/index.tsx` (DietCard real + onPress) · `src/components/home/DietCard.tsx` (se a prop "nextMealTime" virar opcional/derivada).
- **Criar**: `src/hooks/useStudentDietDetail.ts` · `src/lib/diet.ts` (`dietTotals(meals)` — soma macros presentes; pura, TDD) · `src/components/diet/MealCard.tsx` (linha de refeição estilo B, read-only; TDD render) · `app/(aluno)/dieta/[id].tsx`.

## Testes / verificação

- `dietTotals`: soma só macros presentes; lista vazia → zeros; macros ausentes ignorados (TDD).
- Schemas: parse de lista + detalhe + `template_body` `{}` (→ meals []) (TDD).
- `MealCard`: render com/sem macros (chips só dos presentes) (TDD).
- Tela: abre via card do HOJE; refeições na ordem; total some quando sem macros; estado vazio/404.
- `typecheck` + `lint` + `jest` verdes.

## Pendências honestas

- `foods` é texto livre (não estruturado em itens) — exibido como parágrafo. OK para o builder atual.
- Total do dia é derivado client-side (soma de macros opcionais) — não há campo de total na API.
- Fora de escopo (fix separado, paralelo): imagem real no `ExerciseThumb` (hoje só ícone).
