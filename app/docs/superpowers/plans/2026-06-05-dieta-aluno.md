# Dieta do aluno — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: superpowers:subagent-driven-development. Steps use `- [ ]`.

**Goal:** Tela de detalhe da dieta ativa do aluno (read-only: título + total do dia + refeições em timeline) e reconciliação do card de dieta do HOJE com o shape real de `/me/diets` (corrige o `onPress` e o schema fictício do `useStudentDiet`).

**Architecture:** Schemas Zod do shape real de `/me/diets`(+`:id`); `template_body` parseado pelo `parseDietBody` existente (N9); lógica pura de soma de macros em `src/lib/diet.ts`; hooks finos; componente `MealCard` (linha de refeição estilo timeline); tela `app/(aluno)/dieta/[id].tsx`; HOJE passa a usar dado real e abre a tela.

**Tech Stack:** RN 0.83 · Expo SDK 55 · TS estrito · TanStack Query v5 · Zod · Unistyles · Phosphor · jest-expo.

**Trabalha no tree principal** `H:\actus_app` (branch/davi). jest/lint/typecheck verdes na base.

---

## Task 1: Schemas reais de dieta do aluno (TDD)

**Files:** Modify `src/types/diets.ts`; Test `src/types/diets.student.test.ts`

Mantém `DietBodySchema`/`parseDietBody`/`StudentDietSchema`(pro)/etc. existentes. Adiciona o shape REAL do consumo do aluno.

- [ ] **Step 1: Failing test** — `src/types/diets.student.test.ts`:
```ts
import { StudentDietsResponseSchema, StudentDietDetailSchema } from './diets';

const item = {
  id: '11111111-1111-1111-1111-111111111111',
  diet_template_id: '22222222-2222-2222-2222-222222222222',
  start_date: '2026-06-01',
  is_active: true,
  created_at: '2026-06-01T10:00:00.000Z',
  template_name: 'Plano Cutting',
  template_body: { meals: [{ name: 'Café', kcal: 450 }], notes: 'x' },
};

describe('schemas de dieta do aluno', () => {
  it('lista /me/diets', () => {
    const v = StudentDietsResponseSchema.parse({ diets: [item] });
    expect(v.diets[0]?.template_name).toBe('Plano Cutting');
  });
  it('detalhe /me/diets/:id (com updated_at, body vazio tolerado)', () => {
    const v = StudentDietDetailSchema.parse({
      ...item,
      updated_at: '2026-06-02T10:00:00.000Z',
      template_body: {},
    });
    expect(v.is_active).toBe(true);
  });
});
```

- [ ] **Step 2: Run, see fail** — `npm test -- src/types/diets.student.test.ts` → FAIL.

- [ ] **Step 3: Implement** — adicionar em `src/types/diets.ts` (usa `z`, e o `dateOnly` já existente — se não houver, declarar `const dateOnly = z.string().regex(/^\d{4}-\d{2}-\d{2}$/)`):
```ts
// [Dieta aluno] Item REAL de GET /me/diets (a lista já traz template_body).
export const StudentDietSchema = z.object({
  id: z.string().uuid(),
  diet_template_id: z.string().uuid(),
  start_date: dateOnly,
  is_active: z.boolean(),
  created_at: z.string(),
  template_name: z.string(),
  // jsonb livre — estrutura via parseDietBody (tolerante).
  template_body: z.unknown(),
});
export type StudentDietItem = z.infer<typeof StudentDietSchema>;

export const StudentDietsResponseSchema = z.object({
  diets: z.array(StudentDietSchema),
});
export type StudentDietsResponse = z.infer<typeof StudentDietsResponseSchema>;

// GET /me/diets/:id → mesmo + updated_at.
export const StudentDietDetailSchema = StudentDietSchema.extend({
  updated_at: z.string(),
});
export type StudentDietDetail = z.infer<typeof StudentDietDetailSchema>;
```
> NOTA: o `StudentDietSummarySchema` antigo (`{ id, title }`) deixará de ser usado após a Task 3; pode permanecer no arquivo (sem consumidores) — não remover às cegas se algo ainda importar; a Task 3 corrige o `useStudentDiet`.

- [ ] **Step 4: pass** — `npm test -- src/types/diets.student.test.ts` (2). **Step 5:** typecheck+lint. **Step 6: Commit** — `feat(types): schemas reais de dieta do aluno (/me/diets)`.

---

## Task 2: `dietTotals` (TDD)

**Files:** Create `src/lib/diet.ts`, `src/lib/diet.test.ts`

- [ ] **Step 1: Failing test** — `src/lib/diet.test.ts`:
```ts
import { dietTotals, hasAnyMacro } from './diet';
import type { Meal } from '@/types/diets';

const meals: Meal[] = [
  { name: 'A', kcal: 450, protein: 30, carbs: 50, fat: 12 },
  { name: 'B', kcal: 600, protein: 45 },
  { name: 'C' },
];

describe('dietTotals', () => {
  it('soma só os macros presentes', () => {
    expect(dietTotals(meals)).toEqual({ kcal: 1050, protein: 75, carbs: 50, fat: 12 });
  });
  it('lista vazia → zeros', () => {
    expect(dietTotals([])).toEqual({ kcal: 0, protein: 0, carbs: 0, fat: 0 });
  });
  it('hasAnyMacro false quando nenhum macro', () => {
    expect(hasAnyMacro([{ name: 'X' }])).toBe(false);
    expect(hasAnyMacro(meals)).toBe(true);
  });
});
```

- [ ] **Step 2: fail.** **Step 3: Implement** — `src/lib/diet.ts`:
```ts
import type { Meal } from '@/types/diets';

export type DietTotals = { kcal: number; protein: number; carbs: number; fat: number };

// Soma os macros presentes nas refeições (campos opcionais → 0 quando ausentes).
export function dietTotals(meals: Meal[]): DietTotals {
  return meals.reduce<DietTotals>(
    (acc, m) => ({
      kcal: acc.kcal + (m.kcal ?? 0),
      protein: acc.protein + (m.protein ?? 0),
      carbs: acc.carbs + (m.carbs ?? 0),
      fat: acc.fat + (m.fat ?? 0),
    }),
    { kcal: 0, protein: 0, carbs: 0, fat: 0 },
  );
}

// Há algum macro informado em alguma refeição? (controla exibir a faixa de total.)
export function hasAnyMacro(meals: Meal[]): boolean {
  return meals.some(
    (m) => m.kcal != null || m.protein != null || m.carbs != null || m.fat != null,
  );
}
```
> Requer que `Meal` (de `DietBodySchema`) seja exportado em `src/types/diets.ts`. Se não estiver exportado, exporte `export type Meal = z.infer<typeof MealSchema>;` (o `MealSchema` já existe de N9).

- [ ] **Step 4: pass (3).** **Step 5:** typecheck+lint. **Step 6: Commit** — `feat(lib): dietTotals (soma de macros da dieta)`.

---

## Task 3: Hooks — fix `useStudentDiet` + novo `useStudentDietDetail`

**Files:** Modify `src/hooks/useStudentDiet.ts`; Create `src/hooks/useStudentDietDetail.ts`

- [ ] **Step 1: `useStudentDiet` real** — substituir o corpo por (padrão `useMe`):
```ts
import { useQuery, type UseQueryResult } from '@tanstack/react-query';
import { api } from '@/api/client';
import { endpoints } from '@/api/endpoints';
import { parseApi } from '@/api/parseApi';
import { StudentDietsResponseSchema, type StudentDietsResponse } from '@/types/diets';
import { useAuthStore } from '@/store/authStore';

export const studentDietsQueryKey = ['me', 'diets', 'list'] as const;

export function useStudentDiet(): UseQueryResult<StudentDietsResponse, unknown> {
  const status = useAuthStore((s) => s.status);
  return useQuery({
    queryKey: studentDietsQueryKey,
    queryFn: async (): Promise<StudentDietsResponse> => {
      const { data } = await api.get(endpoints.me.diets);
      return parseApi(StudentDietsResponseSchema, data);
    },
    enabled: status === 'authenticated',
  });
}
```

- [ ] **Step 2: `useStudentDietDetail`** — `src/hooks/useStudentDietDetail.ts`:
```ts
import { useQuery, type UseQueryResult } from '@tanstack/react-query';
import { api } from '@/api/client';
import { endpoints } from '@/api/endpoints';
import { parseApi } from '@/api/parseApi';
import { StudentDietDetailSchema, type StudentDietDetail } from '@/types/diets';
import { useAuthStore } from '@/store/authStore';

export function studentDietDetailQueryKey(id: string) {
  return ['me', 'diets', 'detail', id] as const;
}

export function useStudentDietDetail(studentDietId: string): UseQueryResult<StudentDietDetail, unknown> {
  const status = useAuthStore((s) => s.status);
  return useQuery({
    queryKey: studentDietDetailQueryKey(studentDietId),
    queryFn: async (): Promise<StudentDietDetail> => {
      const { data } = await api.get(`${endpoints.me.diets}/${studentDietId}`);
      return parseApi(StudentDietDetailSchema, data);
    },
    enabled: status === 'authenticated' && studentDietId.length > 0,
  });
}
```

- [ ] **Step 3:** `npm run typecheck` (vai acusar o HOJE — esperado; a Task 5 ajusta o `index.tsx`). Se o typecheck falhar SÓ por causa do `index.tsx`/`DietCard`, prossiga; senão conserte. **Step 4: Commit** (após a Task 5 deixar verde) — agrupar com a Task 5 OU commitar isolado se já estiver verde. Para segurança, commitar este passo junto da Task 5.

---

## Task 4: `MealCard` (TDD render)

**Files:** Create `src/components/diet/MealCard.tsx`, `src/components/diet/MealCard.test.tsx`; Modify `src/components/diet/index.ts` (barrel)

- [ ] **Step 1: Failing test** — `src/components/diet/MealCard.test.tsx`:
```tsx
import { render, screen } from '@testing-library/react-native';
import { MealCard } from './MealCard';

describe('MealCard', () => {
  it('mostra nome, alimentos e chips de macro', () => {
    render(
      <MealCard
        name="Café da manhã"
        foods="Ovos, aveia"
        kcal={450}
        protein={30}
        carbs={50}
        fat={12}
        isNext
      />,
    );
    expect(screen.getByText('Café da manhã')).toBeTruthy();
    expect(screen.getByText('Ovos, aveia')).toBeTruthy();
    expect(screen.getByText('450 kcal')).toBeTruthy();
    expect(screen.getByText('P 30')).toBeTruthy();
  });
  it('sem macros: não mostra chips', () => {
    render(<MealCard name="Lanche" foods={null} kcal={null} protein={null} carbs={null} fat={null} isNext={false} />);
    expect(screen.getByText('Lanche')).toBeTruthy();
    expect(screen.queryByText(/kcal/)).toBeNull();
  });
});
```

- [ ] **Step 2: fail.** **Step 3: Implement** — `src/components/diet/MealCard.tsx`:
```tsx
import { View } from 'react-native';
import { ForkKnife } from 'phosphor-react-native';
import { StyleSheet } from 'react-native-unistyles';

import { AppText } from '@/components/ui';
import { darkTheme } from '@/theme';

const { colors } = darkTheme;

type Props = {
  name: string;
  foods: string | null;
  kcal: number | null;
  protein: number | null;
  carbs: number | null;
  fat: number | null;
  isNext: boolean;
};

function Chip({ label, accent }: { label: string; accent?: boolean }) {
  return (
    <View style={[styles.chip, accent && styles.chipAccent]}>
      <AppText variant="metaSmall" color={accent ? 'neon' : 'secondary'}>
        {label}
      </AppText>
    </View>
  );
}

export function MealCard({ name, foods, kcal, protein, carbs, fat, isNext }: Props) {
  return (
    <View style={[styles.row, isNext ? styles.rowNext : styles.rowRest]}>
      <View style={styles.head}>
        <ForkKnife size={16} weight="duotone" color={isNext ? colors.neon : colors.textTertiary} />
        <AppText variant="h3" style={styles.name}>
          {name}
        </AppText>
      </View>
      {foods ? (
        <AppText variant="bodySm" color="secondary" style={styles.foods}>
          {foods}
        </AppText>
      ) : null}
      <View style={styles.chips}>
        {kcal != null ? <Chip label={`${kcal} kcal`} accent /> : null}
        {protein != null ? <Chip label={`P ${protein}`} /> : null}
        {carbs != null ? <Chip label={`C ${carbs}`} /> : null}
        {fat != null ? <Chip label={`G ${fat}`} /> : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create((theme) => ({
  row: {
    borderLeftWidth: 2,
    paddingLeft: theme.spacing.md,
    marginBottom: theme.spacing.lg,
  },
  rowNext: { borderLeftColor: theme.colors.neon },
  rowRest: { borderLeftColor: theme.colors.outlineVariant },
  head: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing.sm },
  name: { fontSize: 19 },
  foods: { marginTop: theme.spacing.xs, marginBottom: theme.spacing.sm },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: theme.spacing.xs },
  chip: {
    borderWidth: 1,
    borderColor: theme.colors.outlineVariant,
    borderRadius: theme.radius.tag,
    paddingVertical: 3,
    paddingHorizontal: theme.spacing.sm,
  },
  chipAccent: { borderColor: theme.colors.neon },
}));
```

- [ ] **Step 4: barrel** — adicionar a `src/components/diet/index.ts`: `export { MealCard } from './MealCard';`
- [ ] **Step 5: pass.** **Step 6:** typecheck+lint+test. **Step 7: Commit** — `feat(diet): MealCard (refeicao read-only em timeline)`.

---

## Task 5: Tela de dieta + reconciliação do HOJE

**Files:** Create `app/(aluno)/dieta/[id].tsx`; Modify `app/(aluno)/(tabs)/index.tsx`

- [ ] **Step 1: Tela** — `app/(aluno)/dieta/[id].tsx`:
```tsx
import { useEffect } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { router, useLocalSearchParams } from 'expo-router';
import { CaretLeft } from 'phosphor-react-native';
import { StyleSheet } from 'react-native-unistyles';

import { AppText } from '@/components/ui';
import { MealCard } from '@/components/diet';
import { useStudentDietDetail } from '@/hooks/useStudentDietDetail';
import { parseDietBody } from '@/types/diets';
import { dietTotals, hasAnyMacro } from '@/lib/diet';
import { darkTheme } from '@/theme';

const { motion, colors } = darkTheme;

const MESES = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];
function shortBr(dateOnly: string): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateOnly);
  if (!m) return dateOnly;
  return `${m[3]} ${MESES[Number(m[2]) - 1] ?? ''}`;
}

export default function DietaDetailScreen() {
  const params = useLocalSearchParams<{ id?: string | string[] }>();
  const id = Array.isArray(params.id) ? (params.id[0] ?? '') : (params.id ?? '');
  const detail = useStudentDietDetail(id);

  const opacity = useSharedValue(0);
  useEffect(() => {
    opacity.value = withTiming(1, { duration: motion.screenMs });
  }, [opacity]);
  const revealStyle = useAnimatedStyle(() => ({ opacity: opacity.value }));

  const diet = detail.data;
  const body = diet ? parseDietBody(diet.template_body) : null;
  const meals = body?.meals ?? [];
  const totals = dietTotals(meals);
  const showTotals = hasAnyMacro(meals);

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Voltar"
          hitSlop={12}
          onPress={() => router.back()}
          style={styles.back}
        >
          <CaretLeft size={20} weight="bold" color={colors.textSecondary} />
        </Pressable>
        <AppText variant="eyebrow" color="tertiary">
          Dieta
        </AppText>
      </View>

      <Animated.View style={[styles.flex, revealStyle]}>
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          {diet ? (
            <>
              <AppText variant="h2" style={styles.title}>
                {diet.template_name}
              </AppText>
              <AppText variant="metaSmall" color="tertiary" style={styles.meta}>
                {`desde ${shortBr(diet.start_date)} · ${meals.length} refeições`}
              </AppText>

              {showTotals ? (
                <View style={styles.totband}>
                  {[
                    { n: totals.kcal, l: 'kcal' },
                    { n: totals.protein, l: 'prot' },
                    { n: totals.carbs, l: 'carb' },
                    { n: totals.fat, l: 'gord' },
                  ].map((t) => (
                    <View key={t.l} style={styles.tot}>
                      <AppText variant="dataMed" color="neon">
                        {String(t.n)}
                      </AppText>
                      <AppText variant="metaSmall" color="tertiary">
                        {t.l}
                      </AppText>
                    </View>
                  ))}
                </View>
              ) : null}

              {meals.length > 0 ? (
                <>
                  <AppText variant="eyebrow" color="tertiary" style={styles.secLabel}>
                    Refeições
                  </AppText>
                  {meals.map((m, i) => (
                    <MealCard
                      key={`${m.name}-${i}`}
                      name={m.name}
                      foods={m.foods ?? null}
                      kcal={m.kcal ?? null}
                      protein={m.protein ?? null}
                      carbs={m.carbs ?? null}
                      fat={m.fat ?? null}
                      isNext={i === 0}
                    />
                  ))}
                </>
              ) : (
                <AppText variant="bodySm" color="tertiary" style={styles.secLabel}>
                  Esta dieta ainda não tem refeições.
                </AppText>
              )}

              {body?.notes ? (
                <AppText variant="bodySm" color="tertiary" style={styles.notes}>
                  {body.notes}
                </AppText>
              ) : null}
            </>
          ) : detail.isError ? (
            <AppText variant="bodySm" color="tertiary">
              Não foi possível carregar a dieta.
            </AppText>
          ) : null}
        </ScrollView>
      </Animated.View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create((theme) => ({
  safe: { flex: 1, backgroundColor: theme.colors.bgBase },
  flex: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.sm,
  },
  back: {
    width: 34,
    height: 34,
    borderRadius: theme.radius.pill,
    backgroundColor: theme.colors.surface1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scroll: { paddingHorizontal: theme.spacing.lg, paddingBottom: theme.spacing.xxl },
  title: { fontSize: 32, lineHeight: 32 },
  meta: { marginTop: theme.spacing.xs, marginBottom: theme.spacing.md },
  totband: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: theme.colors.surface1,
    borderWidth: 1,
    borderColor: theme.colors.outlineVariant,
    borderRadius: theme.radius.card,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.lg,
  },
  tot: { flex: 1, alignItems: 'center' },
  secLabel: { marginBottom: theme.spacing.md },
  notes: { marginTop: theme.spacing.sm },
}));
```

- [ ] **Step 2: HOJE real** — em `app/(aluno)/(tabs)/index.tsx`: o `useStudentDiet()` agora devolve `{ diets }`. Escolher a dieta ativa, derivar o nome e a 1ª refeição, e abrir a tela. Trechos:
  - Manter `const diet = useStudentDiet();`.
  - Adicionar import: `import { parseDietBody } from '@/types/diets';`. Remover `import { nextMealMock } from '@/mocks/home';` e seu uso.
  - Derivar:
```tsx
const activeDiet = diet.data?.diets.find((d) => d.is_active) ?? diet.data?.diets[0] ?? null;
const firstMeal = activeDiet ? parseDietBody(activeDiet.template_body).meals[0]?.name ?? null : null;
```
  - O bloco do `DietCard`:
```tsx
{activeDiet ? (
  <DietCard
    title={activeDiet.template_name}
    nextMealTime={firstMeal}
    onPress={() => router.push(`/(aluno)/dieta/${activeDiet.id}` as Href)}
  />
) : null}
```
  - Ajustar `error state` se referenciava `diet` (segue válido).

- [ ] **Step 3: `DietCard` aceita `nextMealTime` opcional/derivado** — em `src/components/home/DietCard.tsx`, mudar a prop para `nextMealTime: string | null` e exibir a linha só quando houver:
  - Prop: `nextMealTime: string | null`.
  - No corpo, a linha mono passa a ser: `{nextMealTime ? <AppText variant="metaSmall" color="tertiary">{nextMealTime}</AppText> : null}` (remover o prefixo fixo "Almoço · " — mostrar a 1ª refeição real). Ajustar o teste `DietCard.test.tsx` para passar `nextMealTime="Café da manhã"` e assertir esse texto.

- [ ] **Step 4: Verde** — `npm run typecheck && npm run lint && npm test` (inclui o ajuste do DateField? não — só dieta). Conserte o que faltar.
- [ ] **Step 5: Commit** — `feat(dieta): tela de detalhe da dieta do aluno + HOJE usa dado real (fix onPress)`.

---

## Task 6: Verificação final

- [ ] **Step 1:** `npm run typecheck && npm run lint && npm test` — tudo verde.
- [ ] **Step 2: Validação manual:** card de dieta do HOJE abre a tela; refeições na ordem; total some quando a dieta não tem macros; nome da 1ª refeição no card; voltar funciona; 404/erro discreto. (Backend precisa estar de pé pra dado real.)

## Self-review (cobertura do spec)
- Schemas reais `/me/diets`(+:id): Task 1 ✓ · `dietTotals`/`hasAnyMacro`: Task 2 ✓ · hooks (fix + detalhe): Task 3 ✓ · `MealCard` timeline B: Task 4 ✓ · tela v3 (título A + faixa A + refeições B): Task 5 ✓ · HOJE real + onPress fix + mata `nextMealMock`: Task 5 ✓ · datas locais (`shortBr` por regex, `parseDietBody`): ✓ · total só com macros: Task 5 (`hasAnyMacro`) ✓.
- Fora de escopo (separado): imagem real no ExerciseThumb — não coberto aqui (fix do Davi).
