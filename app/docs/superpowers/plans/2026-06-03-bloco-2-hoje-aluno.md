# Bloco 2 — HOJE do aluno · Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Construir a tela HOJE do aluno (`app/(aluno)/(tabs)/index.tsx`) com dado real da API: saudação por horário, card do treino do dia (com estado de descanso), faixa da semana/streak, e cards-resumo de dieta e desafio.

**Architecture:** Lógica pura em `src/lib/` (testável isolada), schemas Zod-resumo em `src/types/`, query hooks finos em `src/hooks/` (padrão `useMe`), componentes de apresentação sem fetch em `src/components/home/`, e a tela que orquestra hooks → componentes. Toda resposta da API validada por `parseApi`. Introduz jest-expo (primeira infra de teste do projeto), com TDD para lógica pura/schemas e testes de render para componentes.

**Tech Stack:** React Native 0.83 · Expo SDK 55 · TypeScript estrito · TanStack Query v5 · Zod · Unistyles 3 · Reanimated · Phosphor duotone · jest-expo + @testing-library/react-native.

**Regras herdadas (inegociáveis):**
- Tudo via tokens do theme — nunca hex hardcoded em componente.
- **Zero emoji** — sempre ícone Phosphor duotone.
- Datas com componentes locais do `Date` (`formatDateLocal`) — nunca `toISOString()`.
- 1 momento único de motion por tela (reveal de entrada).
- Cards: radius 12 (após Task 1).

---

## Estrutura de arquivos

**Criar:**
- `jest.config.js` · `jest.setup.js` — infra de teste
- `src/lib/greeting.ts` (+ `greeting.test.ts`) — saudação por horário
- `src/lib/weekday.ts` (+ `weekday.test.ts`) — rótulos PT dos dias
- `src/hooks/useWeeklyOverview.ts` · `useTodayWorkout.ts` · `useStudentDiet.ts` · `useChallengeTeaser.ts`
- `src/components/home/HomeHeader.tsx` · `WeekStrip.tsx` · `TodayWorkoutCard.tsx` · `DietCard.tsx` · `ChallengeCard.tsx` · `index.ts`
- `src/components/home/*.test.tsx` — testes de render
- `src/mocks/home.ts` — fixtures + campos sem endpoint (próxima refeição)

**Modificar:**
- `src/theme/tokens.ts` — `radius.card` 4 → 12
- `src/types/workouts.ts` · `challenges.ts` · `diets.ts` — schemas-resumo (+ `.test.ts`)
- `app/(aluno)/(tabs)/index.tsx` — substitui placeholder pela tela real
- `package.json` — deps + script `test`
- `AGENTS.md` · `docs/plano-bloco-0-1.md` · `docs/decisoes-visuais-bloco-1.md` — refletir radius 12

---

## Task 0: Setup jest-expo

**Files:**
- Modify: `package.json`
- Create: `jest.config.js`, `jest.setup.js`, `src/lib/smoke.test.ts`

- [ ] **Step 1: Instalar dependências de teste**

Run:
```bash
npx expo install jest-expo
npm i -D jest @testing-library/react-native @types/jest react-test-renderer@19.2.0
```
Expected: deps adicionadas sem conflito de peer.

- [ ] **Step 2: Adicionar script `test` ao package.json**

Em `package.json`, no bloco `"scripts"`, adicionar:
```json
"test": "jest"
```

- [ ] **Step 3: Criar `jest.config.js`**

```js
/** @type {import('jest').Config} */
module.exports = {
  preset: 'jest-expo',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  transformIgnorePatterns: [
    'node_modules/(?!((jest-)?react-native|@react-native(-community)?|expo(nent)?|@expo(nent)?/.*|@expo-google-fonts/.*|react-navigation|@react-navigation/.*|@unimodules/.*|unimodules|sentry-expo|native-base|react-native-svg|react-native-unistyles|react-native-reanimated|phosphor-react-native))',
  ],
};
```

- [ ] **Step 4: Criar `jest.setup.js` (mocks de libs nativas)**

```js
/* eslint-disable @typescript-eslint/no-require-imports */
// Reanimated traz mock oficial pra jest.
require('react-native-reanimated').setUpTests?.();

// Unistyles 3 exige configure nativo; no jest, StyleSheet.create vira passthrough
// que executa a factory com um theme stub (basta para resolver os estilos).
jest.mock('react-native-unistyles', () => {
  const { darkTheme } = require('@/theme');
  return {
    StyleSheet: {
      create: (styles) => {
        const resolved = typeof styles === 'function' ? styles(darkTheme) : styles;
        resolved.useVariants = () => {};
        return resolved;
      },
      configure: () => {},
    },
  };
});

// Phosphor renderiza SVG; no jest substituímos por um stub leve que preserva o nome.
jest.mock('phosphor-react-native', () => {
  const React = require('react');
  return new Proxy(
    {},
    {
      get: (_t, name) => (props) =>
        React.createElement('icon', { ...props, 'data-icon': String(name) }),
    },
  );
});

jest.mock('expo-haptics', () => ({
  impactAsync: jest.fn(),
  ImpactFeedbackStyle: { Light: 'light' },
}));
```

- [ ] **Step 5: Smoke test**

`src/lib/smoke.test.ts`:
```ts
describe('jest', () => {
  it('roda', () => {
    expect(1 + 1).toBe(2);
  });
});
```

- [ ] **Step 6: Rodar e verificar verde**

Run: `npm test -- src/lib/smoke.test.ts`
Expected: PASS (1 test).

- [ ] **Step 7: Commit**

```bash
git add package.json package-lock.json jest.config.js jest.setup.js src/lib/smoke.test.ts
git commit -m "test: introduz jest-expo + testing-library (infra de testes)"
```

---

## Task 1: Migrar token radius.card 4 → 12

**Files:**
- Modify: `src/theme/tokens.ts:51-58`, `AGENTS.md`, `docs/plano-bloco-0-1.md`, `docs/decisoes-visuais-bloco-1.md`

- [ ] **Step 1: Alterar o token**

Em `src/theme/tokens.ts`, no objeto `radius`:
```ts
// Raios — cards 12px (decisão Bloco 2; antes 4px sharp)
export const radius = {
  card: 12,
  tag: 4,
  input: 12,
  modal: 24,
  pill: 100,
} as const;
```

- [ ] **Step 2: Atualizar a documentação que cita "cards 4px sharp"**

- `AGENTS.md`: trocar "Radius: cards **4px sharp**" por "Radius: cards **12px**" (manter tags 4, inputs 12, modais 24, botões pill 100).
- `docs/plano-bloco-0-1.md`: na tabela de radius e na linha "Cards | **4px sharp**", trocar para 12 com nota "(revisado no Bloco 2)".
- `docs/decisoes-visuais-bloco-1.md`: se houver menção a 4px nos cards, anotar a revisão para 12.

- [ ] **Step 3: Verificar que nada quebra**

Run: `npm run typecheck && npm run lint`
Expected: zero erro. Revisar manualmente (no device/web) as telas do Bloco 1 que usam `radius.card` (card do convidador no passo 1, banner de erro) — devem só ficar com cantos um pouco mais suaves.

- [ ] **Step 4: Commit**

```bash
git add src/theme/tokens.ts AGENTS.md docs/plano-bloco-0-1.md docs/decisoes-visuais-bloco-1.md
git commit -m "feat(theme): radius.card 4 -> 12 (decisao Bloco 2)"
```

---

## Task 2: `greetingForHour` (TDD)

**Files:**
- Create: `src/lib/greeting.ts`, `src/lib/greeting.test.ts`

- [ ] **Step 1: Teste falhando**

`src/lib/greeting.test.ts`:
```ts
import { greetingForHour } from './greeting';

describe('greetingForHour', () => {
  it('madrugada e manhã → Bom dia (0..11)', () => {
    expect(greetingForHour(0)).toBe('Bom dia');
    expect(greetingForHour(11)).toBe('Bom dia');
  });
  it('fronteira 12h → Boa tarde', () => {
    expect(greetingForHour(12)).toBe('Boa tarde');
    expect(greetingForHour(17)).toBe('Boa tarde');
  });
  it('fronteira 18h → Boa noite', () => {
    expect(greetingForHour(18)).toBe('Boa noite');
    expect(greetingForHour(23)).toBe('Boa noite');
  });
});
```

- [ ] **Step 2: Rodar e ver falhar**

Run: `npm test -- src/lib/greeting.test.ts`
Expected: FAIL ("Cannot find module './greeting'").

- [ ] **Step 3: Implementar**

`src/lib/greeting.ts`:
```ts
export type Greeting = 'Bom dia' | 'Boa tarde' | 'Boa noite';

// Saudação pela hora LOCAL do aparelho (0..23). <12 manhã, 12..17 tarde, >=18 noite.
export function greetingForHour(hour: number): Greeting {
  if (hour < 12) return 'Bom dia';
  if (hour < 18) return 'Boa tarde';
  return 'Boa noite';
}
```

- [ ] **Step 4: Rodar e ver passar**

Run: `npm test -- src/lib/greeting.test.ts`
Expected: PASS (3 tests).

- [ ] **Step 5: Commit**

```bash
git add src/lib/greeting.ts src/lib/greeting.test.ts
git commit -m "feat(lib): greetingForHour (saudacao por horario local)"
```

---

## Task 3: Rótulos de dia da semana (TDD)

**Files:**
- Create: `src/lib/weekday.ts`, `src/lib/weekday.test.ts`

- [ ] **Step 1: Teste falhando**

`src/lib/weekday.test.ts`:
```ts
import { weekdayLetter } from './weekday';

describe('weekdayLetter', () => {
  it('mapeia ISO 1..7 (seg..dom) para letra PT', () => {
    expect(weekdayLetter(1)).toBe('S'); // segunda
    expect(weekdayLetter(2)).toBe('T'); // terça
    expect(weekdayLetter(3)).toBe('Q'); // quarta
    expect(weekdayLetter(4)).toBe('Q'); // quinta
    expect(weekdayLetter(5)).toBe('S'); // sexta
    expect(weekdayLetter(6)).toBe('S'); // sábado
    expect(weekdayLetter(7)).toBe('D'); // domingo
  });
});
```

- [ ] **Step 2: Rodar e ver falhar**

Run: `npm test -- src/lib/weekday.test.ts`
Expected: FAIL.

- [ ] **Step 3: Implementar**

`src/lib/weekday.ts`:
```ts
import type { Weekday } from '@/types/workouts';

// Letra PT do dia (ISO-8601: 1=segunda .. 7=domingo). Seg/Sex/Sáb compartilham "S".
const LETTERS: Record<Weekday, string> = {
  1: 'S',
  2: 'T',
  3: 'Q',
  4: 'Q',
  5: 'S',
  6: 'S',
  7: 'D',
};

export function weekdayLetter(weekday: Weekday): string {
  return LETTERS[weekday];
}
```

- [ ] **Step 4: Rodar e ver passar**

Run: `npm test -- src/lib/weekday.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/lib/weekday.ts src/lib/weekday.test.ts
git commit -m "feat(lib): weekdayLetter (rotulo PT do dia da semana)"
```

---

## Task 4: Schemas-resumo (TDD)

> ⚠️ O shape real de `/me/workouts`, `/me/diets`, `/me/challenges` **deve ser confirmado no backend** (`/mnt/h/actutus_fit_backend-main`). Estes schemas-resumo são o contrato mínimo do HOJE; se o backend divergir, `parseApi` lança `invalid_response_shape` (fail-fast) e ajustamos aqui. Campos sem endpoint vão para `src/mocks/` (Task 5/6).

**Files:**
- Modify: `src/types/workouts.ts`, `src/types/challenges.ts`, `src/types/diets.ts`
- Create: `src/types/home.test.ts`

- [ ] **Step 1: Teste falhando**

`src/types/home.test.ts`:
```ts
import { TodayWorkoutSummarySchema } from './workouts';
import { ChallengeTeaserSchema } from './challenges';
import { StudentDietSummarySchema } from './diets';

describe('schemas-resumo do HOJE', () => {
  it('TodayWorkoutSummary: dia com treino', () => {
    const v = TodayWorkoutSummarySchema.parse({
      has_workout: true,
      workout: {
        id: '11111111-1111-1111-1111-111111111111',
        name: 'Treino A',
        muscle_groups: 'Peito e Tríceps',
        exercise_count: 6,
        est_minutes: 50,
      },
      next_workout: null,
    });
    expect(v.workout?.exercise_count).toBe(6);
  });

  it('TodayWorkoutSummary: dia de descanso', () => {
    const v = TodayWorkoutSummarySchema.parse({
      has_workout: false,
      workout: null,
      next_workout: { weekday: 5, muscle_groups: 'Costas' },
    });
    expect(v.has_workout).toBe(false);
    expect(v.next_workout?.muscle_groups).toBe('Costas');
  });

  it('ChallengeTeaser', () => {
    const v = ChallengeTeaserSchema.parse({
      id: '22222222-2222-2222-2222-222222222222',
      title: 'Desafio de Junho',
      progress_current: 12,
      progress_total: 30,
    });
    expect(v.progress_total).toBe(30);
  });

  it('StudentDietSummary', () => {
    const v = StudentDietSummarySchema.parse({
      id: '33333333-3333-3333-3333-333333333333',
      title: 'Cutting',
    });
    expect(v.title).toBe('Cutting');
  });

  it('rejeita exercise_count negativo', () => {
    expect(() =>
      TodayWorkoutSummarySchema.parse({
        has_workout: true,
        workout: {
          id: '11111111-1111-1111-1111-111111111111',
          name: 'X',
          muscle_groups: 'Y',
          exercise_count: -1,
          est_minutes: 10,
        },
        next_workout: null,
      }),
    ).toThrow();
  });
});
```

- [ ] **Step 2: Rodar e ver falhar**

Run: `npm test -- src/types/home.test.ts`
Expected: FAIL (schemas inexistentes).

- [ ] **Step 3: Adicionar `TodayWorkoutSummarySchema` em `src/types/workouts.ts`**

Acrescentar (mantendo o `WeekdaySchema` existente):
```ts
// [Bloco 2] Resumo do treino do dia para o card do HOJE.
// SHAPE A CONFIRMAR no backend (/me/workouts). Detalhe profundo = Bloco 4.
export const TodayWorkoutSummarySchema = z.object({
  has_workout: z.boolean(),
  workout: z
    .object({
      id: z.string().uuid(),
      name: z.string(),
      muscle_groups: z.string(),
      exercise_count: z.number().int().nonnegative(),
      est_minutes: z.number().int().nonnegative(),
    })
    .nullable(),
  // Para o estado de descanso: próximo treino agendado (pode faltar).
  next_workout: z
    .object({
      weekday: WeekdaySchema,
      muscle_groups: z.string(),
    })
    .nullable(),
});
export type TodayWorkoutSummary = z.infer<typeof TodayWorkoutSummarySchema>;
```

- [ ] **Step 4: Adicionar `ChallengeTeaserSchema` em `src/types/challenges.ts`**

```ts
import { z } from 'zod';

// [Bloco 2] Teaser de desafio ativo para o card do HOJE. Detalhe = Bloco 7.
// SHAPE A CONFIRMAR no backend (/me/challenges).
export const ChallengeTeaserSchema = z.object({
  id: z.string().uuid(),
  title: z.string(),
  progress_current: z.number().int().nonnegative(),
  progress_total: z.number().int().positive(),
});
export type ChallengeTeaser = z.infer<typeof ChallengeTeaserSchema>;
```
> Se `src/types/challenges.ts` já tiver conteúdo/esqueleto, apenas acrescentar este bloco (não remover o existente).

- [ ] **Step 5: Adicionar `StudentDietSummarySchema` em `src/types/diets.ts`**

Acrescentar (reaproveitando o `StudentDietSchema` existente como base):
```ts
// [Bloco 2] Resumo da dieta para o card do HOJE. Detalhe = Bloco 8.
export const StudentDietSummarySchema = StudentDietSchema;
export type StudentDietSummary = z.infer<typeof StudentDietSummarySchema>;
```

- [ ] **Step 6: Rodar e ver passar**

Run: `npm test -- src/types/home.test.ts`
Expected: PASS (5 tests).

- [ ] **Step 7: Commit**

```bash
git add src/types/workouts.ts src/types/challenges.ts src/types/diets.ts src/types/home.test.ts
git commit -m "feat(types): schemas-resumo do HOJE (workout/diet/challenge)"
```

---

## Task 5: Query hooks

**Files:**
- Create: `src/hooks/useWeeklyOverview.ts`, `src/hooks/useTodayWorkout.ts`, `src/hooks/useStudentDiet.ts`, `src/hooks/useChallengeTeaser.ts`
- Create: `src/mocks/home.ts`

- [ ] **Step 1: Mock do campo "próxima refeição" (sem endpoint)**

`src/mocks/home.ts`:
```ts
import { z } from 'zod';

// [MOCK — sem endpoint na API v1] A API de dieta não expõe a "próxima refeição"
// com horário. Até existir, o card do HOJE usa este texto fixo.
export const NextMealMockSchema = z.object({ label: z.string(), time: z.string() });
export type NextMealMock = z.infer<typeof NextMealMockSchema>;

// [MOCK — sem endpoint na API v1]
export const nextMealMock: NextMealMock = NextMealMockSchema.parse({
  label: 'Próxima refeição',
  time: '12:30',
});
```

- [ ] **Step 2: `useWeeklyOverview` (padrão `useMe`)**

`src/hooks/useWeeklyOverview.ts`:
```ts
import { useQuery, type UseQueryResult } from '@tanstack/react-query';
import { api } from '@/api/client';
import { endpoints } from '@/api/endpoints';
import { parseApi } from '@/api/parseApi';
import { WeeklyOverviewSchema, type WeeklyOverview } from '@/types/gamification';
import { useAuthStore } from '@/store/authStore';

export const weeklyOverviewQueryKey = ['me', 'weekly-overview'] as const;

export function useWeeklyOverview(): UseQueryResult<WeeklyOverview, unknown> {
  const status = useAuthStore((s) => s.status);
  return useQuery({
    queryKey: weeklyOverviewQueryKey,
    queryFn: async (): Promise<WeeklyOverview> => {
      const { data } = await api.get(endpoints.me.weeklyOverview);
      return parseApi(WeeklyOverviewSchema, data);
    },
    enabled: status === 'authenticated',
  });
}
```

- [ ] **Step 3: `useTodayWorkout`**

`src/hooks/useTodayWorkout.ts`:
```ts
import { useQuery, type UseQueryResult } from '@tanstack/react-query';
import { api } from '@/api/client';
import { endpoints } from '@/api/endpoints';
import { parseApi } from '@/api/parseApi';
import { TodayWorkoutSummarySchema, type TodayWorkoutSummary } from '@/types/workouts';
import { useAuthStore } from '@/store/authStore';

export const todayWorkoutQueryKey = ['me', 'workouts', 'today'] as const;

export function useTodayWorkout(): UseQueryResult<TodayWorkoutSummary, unknown> {
  const status = useAuthStore((s) => s.status);
  return useQuery({
    queryKey: todayWorkoutQueryKey,
    queryFn: async (): Promise<TodayWorkoutSummary> => {
      const { data } = await api.get(endpoints.me.workouts);
      return parseApi(TodayWorkoutSummarySchema, data);
    },
    enabled: status === 'authenticated',
  });
}
```

- [ ] **Step 4: `useStudentDiet`**

`src/hooks/useStudentDiet.ts`:
```ts
import { useQuery, type UseQueryResult } from '@tanstack/react-query';
import { api } from '@/api/client';
import { endpoints } from '@/api/endpoints';
import { parseApi } from '@/api/parseApi';
import { StudentDietSummarySchema, type StudentDietSummary } from '@/types/diets';
import { useAuthStore } from '@/store/authStore';

export const studentDietQueryKey = ['me', 'diets', 'current'] as const;

export function useStudentDiet(): UseQueryResult<StudentDietSummary, unknown> {
  const status = useAuthStore((s) => s.status);
  return useQuery({
    queryKey: studentDietQueryKey,
    queryFn: async (): Promise<StudentDietSummary> => {
      const { data } = await api.get(endpoints.me.diets);
      return parseApi(StudentDietSummarySchema, data);
    },
    enabled: status === 'authenticated',
  });
}
```

- [ ] **Step 5: `useChallengeTeaser`**

`src/hooks/useChallengeTeaser.ts`:
```ts
import { useQuery, type UseQueryResult } from '@tanstack/react-query';
import { api } from '@/api/client';
import { endpoints } from '@/api/endpoints';
import { parseApi } from '@/api/parseApi';
import { ChallengeTeaserSchema, type ChallengeTeaser } from '@/types/challenges';
import { useAuthStore } from '@/store/authStore';

export const challengeTeaserQueryKey = ['me', 'challenges', 'teaser'] as const;

export function useChallengeTeaser(): UseQueryResult<ChallengeTeaser, unknown> {
  const status = useAuthStore((s) => s.status);
  return useQuery({
    queryKey: challengeTeaserQueryKey,
    queryFn: async (): Promise<ChallengeTeaser> => {
      const { data } = await api.get(endpoints.me.challenges);
      return parseApi(ChallengeTeaserSchema, data);
    },
    enabled: status === 'authenticated',
  });
}
```

- [ ] **Step 6: Verificar tipos + commit**

Run: `npm run typecheck && npm run lint`
Expected: zero erro.
```bash
git add src/hooks/useWeeklyOverview.ts src/hooks/useTodayWorkout.ts src/hooks/useStudentDiet.ts src/hooks/useChallengeTeaser.ts src/mocks/home.ts
git commit -m "feat(hooks): queries do HOJE (weekly-overview/treino/dieta/desafio)"
```

---

## Task 6: Componente `HomeHeader` (TDD render)

**Files:**
- Create: `src/components/home/HomeHeader.tsx`, `src/components/home/HomeHeader.test.tsx`

- [ ] **Step 1: Teste falhando**

`src/components/home/HomeHeader.test.tsx`:
```tsx
import { render, screen } from '@testing-library/react-native';
import { HomeHeader } from './HomeHeader';

describe('HomeHeader', () => {
  it('mostra saudação com nome e streak', () => {
    render(<HomeHeader greeting="Bom dia" name="Davi" streakCurrent={7} dateLabel="Terça · 03 jun" />);
    expect(screen.getByText('Bom dia, Davi')).toBeTruthy();
    expect(screen.getByText('7')).toBeTruthy();
    expect(screen.getByText('Terça · 03 jun')).toBeTruthy();
  });

  it('sem nome → só a saudação', () => {
    render(<HomeHeader greeting="Boa noite" name={null} streakCurrent={0} dateLabel="Qui · 05 jun" />);
    expect(screen.getByText('Boa noite')).toBeTruthy();
  });
});
```

- [ ] **Step 2: Rodar e ver falhar**

Run: `npm test -- src/components/home/HomeHeader.test.tsx`
Expected: FAIL.

- [ ] **Step 3: Implementar**

`src/components/home/HomeHeader.tsx`:
```tsx
import { View } from 'react-native';
import { Flame } from 'phosphor-react-native';
import { StyleSheet } from 'react-native-unistyles';

import { AppText } from '@/components/ui';
import { darkTheme } from '@/theme';
import type { Greeting } from '@/lib/greeting';

const { colors } = darkTheme;

type Props = {
  greeting: Greeting;
  name: string | null;
  streakCurrent: number;
  dateLabel: string;
};

export function HomeHeader({ greeting, name, streakCurrent, dateLabel }: Props) {
  const title = name ? `${greeting}, ${name}` : greeting;
  return (
    <View>
      <View style={styles.topRow}>
        <AppText variant="eyebrow" color="tertiary">
          {dateLabel}
        </AppText>
        <View style={styles.streakChip}>
          <Flame size={15} weight="duotone" color={colors.neon} />
          <AppText variant="metaSmall" color="secondary">
            {String(streakCurrent)}
          </AppText>
        </View>
      </View>
      <AppText variant="h2" style={styles.greet} numberOfLines={1}>
        {title}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create((theme) => ({
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: theme.spacing.sm,
  },
  streakChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
    borderWidth: 1,
    borderColor: theme.colors.outlineVariant,
    borderRadius: theme.radius.pill,
    paddingVertical: 4,
    paddingHorizontal: theme.spacing.md,
  },
  greet: {
    marginBottom: theme.spacing.lg,
  },
}));
```

- [ ] **Step 4: Rodar e ver passar**

Run: `npm test -- src/components/home/HomeHeader.test.tsx`
Expected: PASS (2 tests).

- [ ] **Step 5: Commit**

```bash
git add src/components/home/HomeHeader.tsx src/components/home/HomeHeader.test.tsx
git commit -m "feat(home): HomeHeader (saudacao + streak chip)"
```

---

## Task 7: Componente `WeekStrip` (TDD render)

> A API (`WeeklyOverviewDay`) só traz `completed` por dia — não há flag de descanso por dia. A faixa mostra **concluído / hoje / pendente**. Marcador de descanso por dia fica para quando o backend expuser.

**Files:**
- Create: `src/components/home/WeekStrip.tsx`, `src/components/home/WeekStrip.test.tsx`

- [ ] **Step 1: Teste falhando**

`src/components/home/WeekStrip.test.tsx`:
```tsx
import { render, screen } from '@testing-library/react-native';
import { WeekStrip } from './WeekStrip';
import type { WeeklyOverview } from '@/types/gamification';

const overview: WeeklyOverview = {
  week_start: '2026-06-01',
  week_end: '2026-06-07',
  today_date: '2026-06-03',
  today_weekday: 3,
  timezone: 'America/Sao_Paulo',
  streak_current: 7,
  streak_best: 21,
  days: [
    { date: '2026-06-01', weekday: 1, completed: true },
    { date: '2026-06-02', weekday: 2, completed: true },
    { date: '2026-06-03', weekday: 3, completed: false },
    { date: '2026-06-04', weekday: 4, completed: false },
    { date: '2026-06-05', weekday: 5, completed: false },
    { date: '2026-06-06', weekday: 6, completed: false },
    { date: '2026-06-07', weekday: 7, completed: false },
  ],
};

describe('WeekStrip', () => {
  it('mostra o streak atual e os 7 dias', () => {
    render(<WeekStrip overview={overview} />);
    expect(screen.getByText('7 dias seguidos')).toBeTruthy();
    expect(screen.getByText('Sua semana')).toBeTruthy();
  });
});
```

- [ ] **Step 2: Rodar e ver falhar**

Run: `npm test -- src/components/home/WeekStrip.test.tsx`
Expected: FAIL.

- [ ] **Step 3: Implementar**

`src/components/home/WeekStrip.tsx`:
```tsx
import { View } from 'react-native';
import { Check } from 'phosphor-react-native';
import { StyleSheet } from 'react-native-unistyles';

import { AppText } from '@/components/ui';
import { darkTheme } from '@/theme';
import { weekdayLetter } from '@/lib/weekday';
import type { WeeklyOverview } from '@/types/gamification';

const { colors } = darkTheme;

type Props = { overview: WeeklyOverview };

export function WeekStrip({ overview }: Props) {
  return (
    <View>
      <View style={styles.header}>
        <AppText variant="eyebrow" color="tertiary">
          Sua semana
        </AppText>
        <AppText variant="metaSmall" color="neon">
          {`${overview.streak_current} dias seguidos`}
        </AppText>
      </View>
      <View style={styles.row}>
        {overview.days.map((day) => {
          const isToday = day.date === overview.today_date;
          return (
            <View key={day.date} style={styles.day}>
              <AppText variant="metaSmall" color="tertiary">
                {weekdayLetter(day.weekday)}
              </AppText>
              <View
                style={[
                  styles.dot,
                  day.completed && styles.dotDone,
                  !day.completed && isToday && styles.dotToday,
                ]}
              >
                {day.completed ? (
                  <Check size={13} weight="bold" color={colors.textInverse} />
                ) : null}
              </View>
            </View>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create((theme) => ({
  header: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    marginBottom: theme.spacing.sm,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: theme.spacing.xs,
  },
  day: {
    flex: 1,
    alignItems: 'center',
    gap: theme.spacing.xs,
  },
  dot: {
    width: 28,
    height: 28,
    borderRadius: theme.radius.pill,
    backgroundColor: theme.colors.surface2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dotDone: {
    backgroundColor: theme.colors.neon,
  },
  dotToday: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: theme.colors.neon,
  },
}));
```

- [ ] **Step 4: Rodar e ver passar**

Run: `npm test -- src/components/home/WeekStrip.test.tsx`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/components/home/WeekStrip.tsx src/components/home/WeekStrip.test.tsx
git commit -m "feat(home): WeekStrip (faixa da semana + streak)"
```

---

## Task 8: Componente `TodayWorkoutCard` (TDD render — dois estados)

**Files:**
- Create: `src/components/home/TodayWorkoutCard.tsx`, `src/components/home/TodayWorkoutCard.test.tsx`

- [ ] **Step 1: Teste falhando**

`src/components/home/TodayWorkoutCard.test.tsx`:
```tsx
import { render, screen, fireEvent } from '@testing-library/react-native';
import { TodayWorkoutCard } from './TodayWorkoutCard';
import type { TodayWorkoutSummary } from '@/types/workouts';

const comTreino: TodayWorkoutSummary = {
  has_workout: true,
  workout: {
    id: '11111111-1111-1111-1111-111111111111',
    name: 'Treino A',
    muscle_groups: 'Peito e Tríceps',
    exercise_count: 6,
    est_minutes: 50,
  },
  next_workout: null,
};

const descanso: TodayWorkoutSummary = {
  has_workout: false,
  workout: null,
  next_workout: { weekday: 5, muscle_groups: 'Costas' },
};

describe('TodayWorkoutCard', () => {
  it('estado com treino: mostra grupo, métricas e CTA', () => {
    const onStart = jest.fn();
    render(<TodayWorkoutCard summary={comTreino} onStart={onStart} onSeeWeek={jest.fn()} />);
    expect(screen.getByText('Peito e Tríceps')).toBeTruthy();
    expect(screen.getByText('Iniciar treino')).toBeTruthy();
    fireEvent.press(screen.getByText('Iniciar treino'));
    expect(onStart).toHaveBeenCalledTimes(1);
  });

  it('estado de descanso: sem CTA de iniciar, com atalho da semana', () => {
    const onSeeWeek = jest.fn();
    render(<TodayWorkoutCard summary={descanso} onStart={jest.fn()} onSeeWeek={onSeeWeek} />);
    expect(screen.getByText('Dia de descanso')).toBeTruthy();
    expect(screen.queryByText('Iniciar treino')).toBeNull();
    fireEvent.press(screen.getByText('Ver treinos da semana'));
    expect(onSeeWeek).toHaveBeenCalledTimes(1);
  });
});
```

- [ ] **Step 2: Rodar e ver falhar**

Run: `npm test -- src/components/home/TodayWorkoutCard.test.tsx`
Expected: FAIL.

- [ ] **Step 3: Implementar**

`src/components/home/TodayWorkoutCard.tsx`:
```tsx
import { Pressable, View } from 'react-native';
import { Play, MoonStars, CaretRight } from 'phosphor-react-native';
import { StyleSheet } from 'react-native-unistyles';

import { AppText } from '@/components/ui';
import { darkTheme } from '@/theme';
import type { TodayWorkoutSummary } from '@/types/workouts';

const { colors } = darkTheme;

type Props = {
  summary: TodayWorkoutSummary;
  onStart: () => void;
  onSeeWeek: () => void;
};

export function TodayWorkoutCard({ summary, onStart, onSeeWeek }: Props) {
  if (summary.has_workout && summary.workout) {
    const w = summary.workout;
    return (
      <View style={styles.card}>
        <AppText variant="eyebrow" color="neon">
          Treino de hoje
        </AppText>
        <AppText variant="h2" style={styles.muscle}>
          {w.muscle_groups}
        </AppText>
        <AppText variant="bodySm" color="secondary" style={styles.meta}>
          {`${w.exercise_count} exercícios · ~${w.est_minutes} min · ${w.name}`}
        </AppText>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Iniciar treino"
          style={styles.cta}
          onPress={onStart}
        >
          <Play size={18} weight="fill" color={colors.textInverse} />
          <AppText variant="label" color="inverse">
            Iniciar treino
          </AppText>
        </Pressable>
      </View>
    );
  }

  // Estado de descanso.
  const next = summary.next_workout;
  return (
    <View style={styles.card}>
      <View style={styles.restIcon}>
        <MoonStars size={26} weight="duotone" color={colors.secondary} />
      </View>
      <AppText variant="eyebrow" color="secondary">
        Hoje
      </AppText>
      <AppText variant="h2" style={styles.muscle}>
        Dia de descanso
      </AppText>
      <AppText variant="bodySm" color="secondary" style={styles.meta}>
        {next
          ? `Recuperação faz parte do plano. Próximo treino: ${next.muscle_groups}`
          : 'Recuperação faz parte do plano.'}
      </AppText>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Ver treinos da semana"
        style={styles.ghostLine}
        onPress={onSeeWeek}
      >
        <AppText variant="bodyMd" color="secondary">
          Ver treinos da semana
        </AppText>
        <CaretRight size={16} weight="bold" color={colors.textTertiary} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create((theme) => ({
  card: {
    backgroundColor: theme.colors.surface1,
    borderWidth: 1,
    borderColor: theme.colors.outlineVariant,
    borderRadius: theme.radius.card,
    padding: theme.spacing.lg,
  },
  muscle: {
    marginTop: theme.spacing.sm,
    marginBottom: theme.spacing.xs,
  },
  meta: {
    marginBottom: theme.spacing.lg,
  },
  cta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing.sm,
    backgroundColor: theme.colors.neon,
    borderRadius: theme.radius.pill,
    paddingVertical: theme.spacing.md,
  },
  ghostLine: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: theme.colors.outlineVariant,
    paddingTop: theme.spacing.md,
    marginTop: theme.spacing.xs,
  },
  restIcon: {
    width: 46,
    height: 46,
    borderRadius: theme.radius.pill,
    backgroundColor: theme.colors.surface2,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: theme.spacing.md,
  },
}));
```

- [ ] **Step 4: Rodar e ver passar**

Run: `npm test -- src/components/home/TodayWorkoutCard.test.tsx`
Expected: PASS (2 tests).

- [ ] **Step 5: Commit**

```bash
git add src/components/home/TodayWorkoutCard.tsx src/components/home/TodayWorkoutCard.test.tsx
git commit -m "feat(home): TodayWorkoutCard (treino do dia + estado descanso)"
```

---

## Task 9: Cards `DietCard` e `ChallengeCard` (TDD render)

**Files:**
- Create: `src/components/home/DietCard.tsx`, `src/components/home/ChallengeCard.tsx`, e respectivos `.test.tsx`

- [ ] **Step 1: Testes falhando**

`src/components/home/DietCard.test.tsx`:
```tsx
import { render, screen, fireEvent } from '@testing-library/react-native';
import { DietCard } from './DietCard';

describe('DietCard', () => {
  it('mostra título e próxima refeição (mock) e responde ao toque', () => {
    const onPress = jest.fn();
    render(<DietCard title="Cutting" nextMealTime="12:30" onPress={onPress} />);
    expect(screen.getByText('Cutting')).toBeTruthy();
    expect(screen.getByText('Dieta')).toBeTruthy();
    fireEvent.press(screen.getByText('Cutting'));
    expect(onPress).toHaveBeenCalled();
  });
});
```

`src/components/home/ChallengeCard.test.tsx`:
```tsx
import { render, screen } from '@testing-library/react-native';
import { ChallengeCard } from './ChallengeCard';

describe('ChallengeCard', () => {
  it('mostra título e progresso', () => {
    render(<ChallengeCard title="Junho" current={12} total={30} onPress={jest.fn()} />);
    expect(screen.getByText('Junho')).toBeTruthy();
    expect(screen.getByText('12 / 30 dias')).toBeTruthy();
  });
});
```

- [ ] **Step 2: Rodar e ver falhar**

Run: `npm test -- src/components/home/DietCard.test.tsx src/components/home/ChallengeCard.test.tsx`
Expected: FAIL.

- [ ] **Step 3: Implementar `DietCard`**

`src/components/home/DietCard.tsx`:
```tsx
import { Pressable, View } from 'react-native';
import { ForkKnife } from 'phosphor-react-native';
import { StyleSheet } from 'react-native-unistyles';

import { AppText } from '@/components/ui';
import { darkTheme } from '@/theme';

const { colors } = darkTheme;

type Props = { title: string; nextMealTime: string; onPress: () => void };

export function DietCard({ title, nextMealTime, onPress }: Props) {
  return (
    <Pressable style={styles.card} onPress={onPress} accessibilityRole="button">
      <View style={styles.head}>
        <ForkKnife size={14} weight="duotone" color={colors.textTertiary} />
        <AppText variant="eyebrow" color="tertiary">
          Dieta
        </AppText>
      </View>
      <AppText variant="h3" style={styles.name}>
        {title}
      </AppText>
      <AppText variant="metaSmall" color="tertiary">
        {`Almoço · ${nextMealTime}`}
      </AppText>
    </Pressable>
  );
}

const styles = StyleSheet.create((theme) => ({
  card: {
    flex: 1,
    backgroundColor: theme.colors.surface1,
    borderWidth: 1,
    borderColor: theme.colors.outlineVariant,
    borderRadius: theme.radius.card,
    padding: theme.spacing.md,
  },
  head: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing.xs },
  name: { marginTop: theme.spacing.xs, marginBottom: 2 },
}));
```

- [ ] **Step 4: Implementar `ChallengeCard`**

`src/components/home/ChallengeCard.tsx`:
```tsx
import { Pressable, View } from 'react-native';
import { Trophy } from 'phosphor-react-native';
import { StyleSheet } from 'react-native-unistyles';

import { AppText } from '@/components/ui';
import { darkTheme } from '@/theme';

const { colors } = darkTheme;

type Props = { title: string; current: number; total: number; onPress: () => void };

export function ChallengeCard({ title, current, total, onPress }: Props) {
  return (
    <Pressable style={styles.card} onPress={onPress} accessibilityRole="button">
      <View style={styles.head}>
        <Trophy size={14} weight="duotone" color={colors.textTertiary} />
        <AppText variant="eyebrow" color="tertiary">
          Desafio
        </AppText>
      </View>
      <AppText variant="h3" style={styles.name}>
        {title}
      </AppText>
      <AppText variant="metaSmall" color="tertiary">
        {`${current} / ${total} dias`}
      </AppText>
    </Pressable>
  );
}

const styles = StyleSheet.create((theme) => ({
  card: {
    flex: 1,
    backgroundColor: theme.colors.surface1,
    borderWidth: 1,
    borderColor: theme.colors.outlineVariant,
    borderRadius: theme.radius.card,
    padding: theme.spacing.md,
  },
  head: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing.xs },
  name: { marginTop: theme.spacing.xs, marginBottom: 2 },
}));
```

- [ ] **Step 5: Barrel `src/components/home/index.ts`**

```ts
export { HomeHeader } from './HomeHeader';
export { WeekStrip } from './WeekStrip';
export { TodayWorkoutCard } from './TodayWorkoutCard';
export { DietCard } from './DietCard';
export { ChallengeCard } from './ChallengeCard';
```

- [ ] **Step 6: Rodar e ver passar**

Run: `npm test -- src/components/home`
Expected: PASS (todos os componentes).

- [ ] **Step 7: Commit**

```bash
git add src/components/home/DietCard.tsx src/components/home/ChallengeCard.tsx src/components/home/DietCard.test.tsx src/components/home/ChallengeCard.test.tsx src/components/home/index.ts
git commit -m "feat(home): DietCard e ChallengeCard (cards-resumo)"
```

---

## Task 10: Montar a tela HOJE

**Files:**
- Modify: `app/(aluno)/(tabs)/index.tsx`

- [ ] **Step 1: Implementar a tela**

`app/(aluno)/(tabs)/index.tsx`:
```tsx
import { useEffect } from 'react';
import { View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { router } from 'expo-router';
import { StyleSheet } from 'react-native-unistyles';

import { Screen, AppText } from '@/components/ui';
import {
  HomeHeader,
  WeekStrip,
  TodayWorkoutCard,
  DietCard,
  ChallengeCard,
} from '@/components/home';
import { useMe } from '@/hooks/useMe';
import { useWeeklyOverview } from '@/hooks/useWeeklyOverview';
import { useTodayWorkout } from '@/hooks/useTodayWorkout';
import { useStudentDiet } from '@/hooks/useStudentDiet';
import { useChallengeTeaser } from '@/hooks/useChallengeTeaser';
import { greetingForHour } from '@/lib/greeting';
import { nextMealMock } from '@/mocks/home';
import { darkTheme } from '@/theme';

const { motion } = darkTheme;

// Rótulo de data PT curto: "Terça · 03 jun". Usa componentes LOCAIS do Date.
const DIAS = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
const MESES = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];
function dateLabelLocal(d: Date): string {
  return `${DIAS[d.getDay()]} · ${String(d.getDate()).padStart(2, '0')} ${MESES[d.getMonth()]}`;
}

export default function AlunoHojeScreen() {
  const me = useMe();
  const week = useWeeklyOverview();
  const workout = useTodayWorkout();
  const diet = useStudentDiet();
  const challenge = useChallengeTeaser();

  // ÚNICA animação da tela: reveal de entrada (opacity + translateY, 300ms).
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(12);
  useEffect(() => {
    opacity.value = withTiming(1, { duration: motion.screenMs });
    translateY.value = withTiming(0, { duration: motion.screenMs });
  }, [opacity, translateY]);
  const revealStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }));

  const now = new Date();
  const greeting = greetingForHour(now.getHours());

  // [fluxo futuro] destino real do treino = Bloco 5 (execução de sessão).
  function startWorkout() {
    router.push('/(aluno)/(tabs)/treinos');
  }
  function seeWeek() {
    router.push('/(aluno)/(tabs)/treinos');
  }

  return (
    <Screen scroll padded>
      <Animated.View style={revealStyle}>
        <HomeHeader
          greeting={greeting}
          name={me.data?.display_name ?? null}
          streakCurrent={week.data?.streak_current ?? 0}
          dateLabel={dateLabelLocal(now)}
        />

        {workout.data ? (
          <TodayWorkoutCard summary={workout.data} onStart={startWorkout} onSeeWeek={seeWeek} />
        ) : null}

        {week.data ? (
          <View style={styles.block}>
            <WeekStrip overview={week.data} />
          </View>
        ) : null}

        <View style={styles.row}>
          {diet.data ? (
            <DietCard
              title={diet.data.title}
              nextMealTime={nextMealMock.time}
              onPress={() => router.push('/(aluno)/(tabs)/treinos')}
            />
          ) : null}
          {challenge.data ? (
            <ChallengeCard
              title={challenge.data.title}
              current={challenge.data.progress_current}
              total={challenge.data.progress_total}
              onPress={() => router.push('/(aluno)/(tabs)/desafios')}
            />
          ) : null}
        </View>

        {workout.isError && week.isError ? (
          <AppText variant="bodySm" color="tertiary" style={styles.block}>
            Não foi possível carregar agora. Puxe para atualizar.
          </AppText>
        ) : null}
      </Animated.View>
    </Screen>
  );
}

const styles = StyleSheet.create((theme) => ({
  block: { marginTop: theme.spacing.lg },
  row: { flexDirection: 'row', gap: theme.spacing.md, marginTop: theme.spacing.lg },
}));
```

> Nota: o `TodayWorkoutCard` aparece logo após o header (herói), seguido da semana e da linha dieta+desafio — ordem da Direção A validada. Os `onPress` levam a destinos stub (treinos/desafios) até os blocos donos existirem.

- [ ] **Step 2: Verificar tipos + lint**

Run: `npm run typecheck && npm run lint`
Expected: zero erro/any.

- [ ] **Step 3: Rodar a suíte completa**

Run: `npm test`
Expected: todos os testes PASS.

- [ ] **Step 4: Commit**

```bash
git add "app/(aluno)/(tabs)/index.tsx"
git commit -m "feat(home): tela HOJE do aluno (Bloco 2)"
```

---

## Task 11: Verificação final

- [ ] **Step 1: Suíte de qualidade**

Run: `npm run typecheck && npm run lint && npm test && npx expo-doctor`
Expected: typecheck/lint zero erro · jest todos verdes · expo-doctor 19/19.

- [ ] **Step 2: Validação manual no dev build (device/emulador)**

Checklist:
- Login como aluno → cai no HOJE.
- Saudação coerente com o horário do aparelho (testar trocando a hora do device entre 11h/13h/19h).
- Faixa da semana destaca o **dia local** correto (teste de fuso: device em UTC-3, virada de meia-noite não desloca o "hoje").
- Estado de descanso renderiza quando `/me/workouts` não traz treino para hoje (se o backend permitir simular).
- Cards de dieta e desafio com dado real; "próxima refeição" usa o mock marcado.
- Cantos dos cards visivelmente 12px; nada do Bloco 1 quebrado.
- Apenas 1 momento de motion (reveal de entrada); sem glow.
- Zero emoji em qualquer estado.

- [ ] **Step 3: Confirmar shape real da API**

Conferir no backend (`/mnt/h/actutus_fit_backend-main`) o shape de `/me/workouts`, `/me/diets`, `/me/challenges`. Se divergir dos schemas-resumo, ajustar `src/types/*` e os testes — `parseApi` já protege com `invalid_response_shape` enquanto não baterem.

- [ ] **Step 4: Salvar na branch pessoal**

Quando o designer validar no device, integrar conforme o fluxo Somo (`/salvar` na `branch/davi`; `/fechar` para a `dev` quando aprovado). Coordenar com o outro chat por causa da working tree compartilhada.

---

## Self-review (cobertura do spec)

- Layout Direção A (header → treino → semana → dieta+desafio): Tasks 6–10 ✓
- Saudação por horário: Task 2 + Task 10 ✓
- Estado de descanso: Task 8 ✓
- Iniciar treino só no card; botão central stub: Task 10 (sem ação no central) ✓
- Ícones Phosphor / zero emoji: todos os componentes usam Phosphor ✓
- Motion único (reveal): Task 10 ✓
- radius.card 4→12 global: Task 1 ✓
- Dados reais + parseApi: Task 5 ✓; schemas-resumo Task 4 ✓
- "Próxima refeição" como MOCK marcado: Task 5 (`src/mocks/home.ts`) ✓
- Pendências (treino detalhe Bloco 4, sessão Bloco 5, shape backend): notadas nas Tasks 4/10/11 ✓
