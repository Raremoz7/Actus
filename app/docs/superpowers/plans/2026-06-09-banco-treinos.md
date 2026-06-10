# Banco de Treinos — Implementation Plan

> **For agentic workers:** execute task-by-task (TDD). Steps use `- [ ]`. Work ENTIRELY inside the worktree `/mnt/h/actus_app/.claude/worktrees/banco-treinos` (branch `feat/banco-treinos`). NEVER `git add` directories or `-A`; stage only the exact files each task names.

**Goal:** Biblioteca gratuita de treinos prontos (curadoria editorial sobre o catálogo Wger real) que o personal navega na aba Treinos (toggle Meus|Banco) e clona-e-edita via o `montar-treino` existente.

**Architecture:** Seed editorial (`src/data/workoutLibrary.ts`) referencia exercícios por **id real do catálogo Wger** (`assets/wger/catalog.json`, 851 exercícios); um resolver monta o programa completo (nome/grupo via catálogo). Clone reusa `POST /workouts` (endpoint real) pré-preenchendo o builder. Sem backend novo para clonar; `GET /workouts/library` fica sinalizado para servir o seed no futuro.

**Tech Stack:** Expo SDK 55 · TS estrito · Zod · Unistyles 3 · TanStack Query · Phosphor · jest-expo.

---

## Convenções de hygiene (TODAS as tasks)
- Working dir: `/mnt/h/actus_app/.claude/worktrees/banco-treinos`. `node_modules` resolve via aninhamento (não criar).
- `git add <arquivos exatos>` — nunca pasta, nunca `-A`/`.`.
- Não reformatar arquivos existentes; usar edições de string exata (preservar EOL).
- Datas (se houver) com `formatDateLocal`; nunca `toISOString`.
- Tokens do theme; sem hex hardcoded. 1 motion por tela.

## Estrutura de arquivos
**Criar:**
- `src/types/workoutLibrary.ts` — enums + schemas + labels.
- `src/data/workoutLibrary.ts` — seed dos 8 programas + resolver + `libraryToCreateBody`.
- `src/data/workoutLibrary.test.ts` — resolver + conversão (ids reais resolvem; body válido).
- `src/components/library/ObjetivoChips.tsx` · `LibraryWorkoutCard.tsx` · `WorkoutScopeToggle.tsx` · `index.ts` + testes.
- `app/banco-treino/[id].tsx` — detalhe + CTA "Clonar e editar".
**Modificar:**
- `app/(personal)/(tabs)/treinos.tsx` — toggle Meus|Banco + render da biblioteca.
- `app/montar-treino.tsx` — param `fromLibrary` + prefill.
- `AGENTS.md` — sinalizar `GET /workouts/library`.

---

### Task 1 — Tipos + labels (`src/types/workoutLibrary.ts`)

- [ ] **Step 1: criar o arquivo**
```ts
// src/types/workoutLibrary.ts
// Contrato da biblioteca de treinos (Banco de Treinos). Schema da forma RESOLVIDA
// (exercícios já com nome/grupo vindos do catálogo Wger). Valida o seed e, no futuro,
// a resposta de GET /workouts/library.
import { z } from 'zod';

export const ObjetivoSchema = z.enum(['hipertrofia', 'emagrecimento', 'forca', 'resistencia', 'mobilidade']);
export type Objetivo = z.infer<typeof ObjetivoSchema>;

export const NivelSchema = z.enum(['iniciante', 'intermediario', 'avancado']);
export type Nivel = z.infer<typeof NivelSchema>;

export const LibraryExerciseSchema = z.object({
  wger_exercise_id: z.number().int().min(1),
  name: z.string().min(1),
  muscle_group: z.string().nullable(),
  sets: z.number().int().min(1),
  reps: z.number().int().min(1),
  rest_seconds: z.number().int().min(0),
  notes: z.string().nullable(),
});
export type LibraryExercise = z.infer<typeof LibraryExerciseSchema>;

export const LibraryWorkoutSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  objetivo: ObjetivoSchema,
  nivel: NivelSchema,
  muscle_groups: z.string(), // resumo legível, ex.: "Peito · Ombros · Braços"
  notes: z.string().nullable(),
  exercises: z.array(LibraryExerciseSchema).min(1),
});
export type LibraryWorkout = z.infer<typeof LibraryWorkoutSchema>;

// Rótulos pt-BR (com acento) para UI.
export const OBJETIVO_LABEL: Record<Objetivo, string> = {
  hipertrofia: 'Hipertrofia',
  emagrecimento: 'Emagrecimento',
  forca: 'Força',
  resistencia: 'Resistência',
  mobilidade: 'Mobilidade',
};
export const NIVEL_LABEL: Record<Nivel, string> = {
  iniciante: 'Iniciante',
  intermediario: 'Intermediário',
  avancado: 'Avançado',
};
// Ordem dos chips de filtro.
export const OBJETIVOS: Objetivo[] = ['hipertrofia', 'forca', 'emagrecimento', 'resistencia', 'mobilidade'];
```
- [ ] **Step 2:** `npm run typecheck` → PASS.
- [ ] **Step 3:** `git add src/types/workoutLibrary.ts && git commit -m "feat(banco): tipos e labels da biblioteca de treinos"`

---

### Task 2 — Seed editorial + resolver + conversão (`src/data/workoutLibrary.ts`)

Exercícios referenciados por **id real** do catálogo (`wgerCatalog().getExercise(id)` → nome/categoria). Categoria EN → PT via `CATEGORY_PT`.

- [ ] **Step 1: teste falho `src/data/workoutLibrary.test.ts`**
```ts
import { getWorkoutLibrary, getLibraryWorkout, libraryToCreateBody } from './workoutLibrary';
import { CreateWorkoutBodySchema } from '@/types/workouts';
import { LibraryWorkoutSchema } from '@/types/workoutLibrary';

describe('workoutLibrary', () => {
  it('resolve 8 programas válidos a partir do catálogo Wger', () => {
    const lib = getWorkoutLibrary();
    expect(lib.length).toBe(8);
    for (const w of lib) {
      expect(() => LibraryWorkoutSchema.parse(w)).not.toThrow();
      expect(w.exercises.length).toBeGreaterThanOrEqual(1);
      // todo exercício resolveu um nome real do catálogo
      for (const e of w.exercises) expect(e.name.length).toBeGreaterThan(0);
    }
  });

  it('getLibraryWorkout acha por id e devolve null para inexistente', () => {
    const first = getWorkoutLibrary()[0]!;
    expect(getLibraryWorkout(first.id)?.id).toBe(first.id);
    expect(getLibraryWorkout('nao-existe')).toBeNull();
  });

  it('libraryToCreateBody gera body válido para POST /workouts', () => {
    const w = getWorkoutLibrary()[0]!;
    const body = libraryToCreateBody(w);
    expect(() => CreateWorkoutBodySchema.parse(body)).not.toThrow();
    expect(body.exercises[0]!.position).toBe(1);
    expect(body.name).toBe(w.name);
  });
});
```
Run `npx jest src/data/workoutLibrary.test.ts` → FAIL (módulo ausente).

- [ ] **Step 2: implementar `src/data/workoutLibrary.ts`**
```ts
// src/data/workoutLibrary.ts
// [SEED — conteúdo-semente do futuro GET /workouts/library]
// Curadoria editorial: os PROGRAMAS (seleção + séries/reps) são autorais; os EXERCÍCIOS
// são reais do catálogo Wger empacotado (id/nome/imagem). O resolver monta a forma final.
import { wgerCatalog, exerciseName } from '@/lib/wger/catalog';
import {
  LibraryWorkoutSchema,
  type LibraryWorkout,
  type LibraryExercise,
  type Objetivo,
  type Nivel,
} from '@/types/workoutLibrary';
import type { CreateWorkoutBody } from '@/types/workouts';

// Categoria do Wger (EN) → rótulo pt-BR de grupo muscular.
const CATEGORY_PT: Record<string, string> = {
  Chest: 'Peito',
  Back: 'Costas',
  Legs: 'Pernas',
  Shoulders: 'Ombros',
  Arms: 'Braços',
  Abs: 'Abdômen',
  Calves: 'Panturrilhas',
  Cardio: 'Cardio',
};

type SeedExercise = {
  wgerExerciseId: number;
  sets: number;
  reps: number;
  restSeconds: number;
  notes?: string;
};
type Seed = {
  id: string;
  name: string;
  objetivo: Objetivo;
  nivel: Nivel;
  notes?: string;
  exercises: SeedExercise[];
};

// Atalho para reduzir ruído.
const ex = (wgerExerciseId: number, sets: number, reps: number, restSeconds: number, notes?: string): SeedExercise => ({
  wgerExerciseId,
  sets,
  reps,
  restSeconds,
  ...(notes ? { notes } : {}),
});

const SEED: Seed[] = [
  {
    id: 'hipertrofia-superior-push',
    name: 'Peito, Ombro e Tríceps',
    objetivo: 'hipertrofia',
    nivel: 'intermediario',
    notes: 'Treino de empurrar focado em volume para superiores.',
    exercises: [ex(73, 4, 10, 90), ex(538, 3, 10, 90), ex(238, 3, 12, 60), ex(567, 3, 10, 90), ex(348, 3, 15, 45), ex(1185, 3, 12, 60)],
  },
  {
    id: 'hipertrofia-costas-biceps',
    name: 'Costas e Bíceps',
    objetivo: 'hipertrofia',
    nivel: 'intermediario',
    notes: 'Treino de puxar com ênfase em dorsais e bíceps.',
    exercises: [ex(158, 4, 10, 90), ex(921, 3, 10, 90), ex(81, 3, 10, 75), ex(1732, 3, 15, 45), ex(92, 3, 12, 60), ex(1567, 3, 12, 60)],
  },
  {
    id: 'hipertrofia-pernas',
    name: 'Pernas completo',
    objetivo: 'hipertrofia',
    nivel: 'intermediario',
    notes: 'Quadríceps, posterior e panturrilha num só treino.',
    exercises: [ex(257, 4, 8, 120), ex(371, 4, 12, 90), ex(1652, 3, 10, 90), ex(364, 3, 12, 60), ex(369, 3, 15, 60), ex(622, 4, 15, 45)],
  },
  {
    id: 'forca-full-body-5x5',
    name: 'Força full body 5×5',
    objetivo: 'forca',
    nivel: 'avancado',
    notes: 'Básicos pesados, 5 séries de 5 com descanso longo.',
    exercises: [ex(630, 5, 5, 180), ex(73, 5, 5, 180), ex(257, 5, 5, 180), ex(566, 3, 6, 150), ex(921, 3, 6, 150)],
  },
  {
    id: 'emagrecimento-circuito',
    name: 'Circuito queima',
    objetivo: 'emagrecimento',
    nivel: 'iniciante',
    notes: 'Circuito full body, descanso curto, ritmo contínuo.',
    exercises: [ex(203, 3, 15, 45), ex(1551, 3, 12, 45), ex(206, 3, 12, 45), ex(1725, 3, 15, 45), ex(960, 3, 20, 45), ex(1091, 3, 1, 45, 'Segure 30s')],
  },
  {
    id: 'resistencia-core',
    name: 'Core e estabilidade',
    objetivo: 'resistencia',
    nivel: 'intermediario',
    notes: 'Resistência de core e cadeia posterior.',
    exercises: [ex(1091, 3, 1, 45, 'Segure 40s'), ex(1193, 3, 20, 45), ex(377, 3, 15, 45), ex(301, 3, 15, 60), ex(1642, 3, 15, 60)],
  },
  {
    id: 'mobilidade-recuperacao',
    name: 'Mobilidade e recuperação',
    objetivo: 'mobilidade',
    nivel: 'iniciante',
    notes: 'Sessão leve de mobilidade e liberação.',
    exercises: [ex(1865, 2, 12, 30), ex(1859, 2, 1, 30, '1 min cada lado'), ex(1230, 2, 1, 20, '30s cada lado'), ex(1232, 2, 1, 20, '30s cada lado'), ex(268, 2, 12, 45, 'Carga leve')],
  },
  {
    id: 'full-body-iniciante-maquinas',
    name: 'Full body iniciante (máquinas)',
    objetivo: 'hipertrofia',
    nivel: 'iniciante',
    notes: 'Primeira rotina em máquinas guiadas, corpo inteiro.',
    exercises: [ex(371, 3, 12, 60), ex(1725, 3, 12, 60), ex(543, 3, 12, 60), ex(364, 3, 12, 60), ex(135, 3, 12, 60), ex(95, 3, 12, 60)],
  },
];

// Resolve um seed → LibraryWorkout (nome/grupo do catálogo). Exercício cujo id não
// existe no catálogo é descartado (dev warn) — não quebra o programa.
function resolveSeed(seed: Seed): LibraryWorkout {
  const catalog = wgerCatalog();
  const resolved: LibraryExercise[] = [];
  for (const s of seed.exercises) {
    const found = catalog.getExercise(s.wgerExerciseId);
    if (!found) {
      if (__DEV__) console.warn(`[workoutLibrary] exercício ${s.wgerExerciseId} ausente no catálogo Wger (seed ${seed.id})`);
      continue;
    }
    const muscle = CATEGORY_PT[found.category] ?? found.category;
    resolved.push({
      wger_exercise_id: s.wgerExerciseId,
      name: exerciseName(found),
      muscle_group: muscle,
      sets: s.sets,
      reps: s.reps,
      rest_seconds: s.restSeconds,
      notes: s.notes ?? null,
    });
  }
  const groups = [...new Set(resolved.map((e) => e.muscle_group).filter((g): g is string => !!g))];
  return LibraryWorkoutSchema.parse({
    id: seed.id,
    name: seed.name,
    objetivo: seed.objetivo,
    nivel: seed.nivel,
    muscle_groups: groups.join(' · '),
    notes: seed.notes ?? null,
    exercises: resolved,
  });
}

let _lib: LibraryWorkout[] | null = null;
export function getWorkoutLibrary(): LibraryWorkout[] {
  if (_lib) return _lib;
  _lib = SEED.map(resolveSeed);
  return _lib;
}

export function getLibraryWorkout(id: string): LibraryWorkout | null {
  return getWorkoutLibrary().find((w) => w.id === id) ?? null;
}

// Converte um programa da biblioteca no corpo de POST /workouts (clone).
export function libraryToCreateBody(w: LibraryWorkout): CreateWorkoutBody {
  return {
    name: w.name,
    ...(w.notes ? { notes: w.notes } : {}),
    exercises: w.exercises.map((e, i) => ({
      position: i + 1,
      wger_exercise_id: e.wger_exercise_id,
      name_snapshot: e.name,
      sets: e.sets,
      reps: e.reps,
      rest_seconds: e.rest_seconds,
      ...(e.notes ? { notes: e.notes } : {}),
      muscle_group: e.muscle_group,
    })),
  };
}
```
> Verificar: `exerciseName` é exportado de `@/lib/wger/catalog`; `wgerCatalog().getExercise(id)` existe. `__DEV__` é global RN (tipado no projeto). Se algum id do seed não resolver no catálogo, o teste do Step 1 ainda passa (nome>0 para os resolvidos), mas confira no console que nenhum exercício foi descartado — todos os ids foram escolhidos do catálogo real.

- [ ] **Step 3:** `npx jest src/data/workoutLibrary.test.ts` → PASS; `npm run typecheck` → PASS.
- [ ] **Step 4:** `git add src/data/workoutLibrary.ts src/data/workoutLibrary.test.ts && git commit -m "feat(banco): seed editorial sobre catálogo Wger + resolver e clone-body"`

---

### Task 3 — Átomos da biblioteca (`src/components/library/`)

Criar 3 componentes + barrel + testes. Seguir o padrão visual de `src/components/home/DietCard.tsx` (card: head com eyebrow, título h3, metaSmall) e `src/components/ui/Tag.tsx` (variantes Unistyles).

- [ ] **Step 1: testes falhos**
`src/components/library/ObjetivoChips.test.tsx`:
```tsx
import { render, screen, fireEvent } from '@testing-library/react-native';
import { ObjetivoChips } from './ObjetivoChips';

describe('ObjetivoChips', () => {
  it('mostra "Todos" + objetivos e dispara onChange', () => {
    const onChange = jest.fn();
    render(<ObjetivoChips selected={null} onChange={onChange} />);
    expect(screen.getByText('Todos')).toBeTruthy();
    fireEvent.press(screen.getByText('Hipertrofia'));
    expect(onChange).toHaveBeenCalledWith('hipertrofia');
  });
});
```
`src/components/library/LibraryWorkoutCard.test.tsx`:
```tsx
import { render, screen, fireEvent } from '@testing-library/react-native';
import { LibraryWorkoutCard } from './LibraryWorkoutCard';
import { getWorkoutLibrary } from '@/data/workoutLibrary';

describe('LibraryWorkoutCard', () => {
  it('mostra nome e dispara onPress', () => {
    const w = getWorkoutLibrary()[0]!;
    const onPress = jest.fn();
    render(<LibraryWorkoutCard workout={w} onPress={onPress} />);
    fireEvent.press(screen.getByText(w.name));
    expect(onPress).toHaveBeenCalledTimes(1);
  });
});
```
`src/components/library/WorkoutScopeToggle.test.tsx`:
```tsx
import { render, screen, fireEvent } from '@testing-library/react-native';
import { WorkoutScopeToggle } from './WorkoutScopeToggle';

describe('WorkoutScopeToggle', () => {
  it('dispara onChange ao tocar em Banco', () => {
    const onChange = jest.fn();
    render(<WorkoutScopeToggle value="meus" onChange={onChange} />);
    fireEvent.press(screen.getByText('Banco'));
    expect(onChange).toHaveBeenCalledWith('banco');
  });
});
```
Run `npx jest src/components/library` → FAIL.

- [ ] **Step 2: implementar**

`src/components/library/ObjetivoChips.tsx` — linha horizontal de chips; `null` = "Todos" (selecionado quando nenhum objetivo). Props `{ selected: Objetivo | null; onChange: (o: Objetivo | null) => void }`. Use `OBJETIVOS` e `OBJETIVO_LABEL` de `@/types/workoutLibrary`. Chip selecionado: bg neon + texto inverse; senão surface2 + texto secondary. Radius `theme.radius.pill`, ScrollView horizontal sem indicador.

`src/components/library/WorkoutScopeToggle.tsx` — segmented control 2 opções. Props `{ value: 'meus' | 'banco'; onChange: (v: 'meus' | 'banco') => void }`. Trilho `surface1` arredondado (radius pill); segmento ativo bg neon + texto inverse, inativo texto secondary. Dois Pressable com labels "Meus" e "Banco".

`src/components/library/LibraryWorkoutCard.tsx` — card (bg surface1, borda outlineVariant, radius card, padding md). Props `{ workout: LibraryWorkout; onPress: () => void }`. Conteúdo: head com ícone `Barbell` (phosphor duotone, color textTertiary) + eyebrow com `OBJETIVO_LABEL[workout.objetivo]`; `AppText variant="h3"` com `workout.name`; `metaSmall` tertiary com `${NIVEL_LABEL[workout.nivel]} · ${workout.muscle_groups} · ${n} exercícios`. Tudo num `Pressable`.

`src/components/library/index.ts`:
```ts
export { ObjetivoChips } from './ObjetivoChips';
export { LibraryWorkoutCard } from './LibraryWorkoutCard';
export { WorkoutScopeToggle } from './WorkoutScopeToggle';
```
> Use `AppText` de `@/components/ui` (variantes: eyebrow, h3, metaSmall, label; cores: inverse, secondary, tertiary). Sem hex hardcoded.

- [ ] **Step 3:** `npx jest src/components/library` → PASS; `npm run typecheck` → PASS.
- [ ] **Step 4:** `git add src/components/library/ObjetivoChips.tsx src/components/library/LibraryWorkoutCard.tsx src/components/library/WorkoutScopeToggle.tsx src/components/library/index.ts src/components/library/ObjetivoChips.test.tsx src/components/library/LibraryWorkoutCard.test.tsx src/components/library/WorkoutScopeToggle.test.tsx && git commit -m "feat(banco): átomos ObjetivoChips, LibraryWorkoutCard, WorkoutScopeToggle"`

---

### Task 4 — Detalhe da biblioteca (`app/banco-treino/[id].tsx`)

Tela empilhada: preview read-only dos exercícios + CTA "Clonar e editar" → `montar-treino?fromLibrary=<id>`.

- [ ] **Step 1: teste falho `app/banco-treino/[id].test.tsx`**
```tsx
import { render, screen } from '@testing-library/react-native';

const firstId = require('@/data/workoutLibrary').getWorkoutLibrary()[0].id;
jest.mock('expo-router', () => ({
  router: { push: jest.fn(), back: jest.fn() },
  useLocalSearchParams: () => ({ id: firstId }),
}));

import BancoTreinoDetail from './[id]';
import { getWorkoutLibrary } from '@/data/workoutLibrary';

describe('Detalhe do banco', () => {
  it('mostra o nome e os exercícios do programa', () => {
    const w = getWorkoutLibrary()[0]!;
    render(<BancoTreinoDetail />);
    expect(screen.getByText(w.name)).toBeTruthy();
    expect(screen.getByText(w.exercises[0]!.name)).toBeTruthy();
  });
});
```
Run `npx jest "app/banco-treino"` → FAIL.

- [ ] **Step 2: implementar `app/banco-treino/[id].tsx`** (espelhar a estrutura de `app/atribuir-treino.tsx` para topbar + reveal):
  - `const params = useLocalSearchParams<{ id?: string }>(); const id = typeof params.id === 'string' ? params.id : '';`
  - `const workout = getLibraryWorkout(id);`
  - Se `!workout`: estado vazio discreto ("Treino não encontrado") + voltar.
  - SafeAreaView + topbar (CaretLeft → `goBackOr('/(personal)/(tabs)/treinos')`).
  - Cabeçalho: eyebrow `OBJETIVO_LABEL[objetivo]`, `h2` nome, metaSmall `${NIVEL_LABEL[nivel]} · ${muscle_groups}`, notes (bodyMd secondary) se houver.
  - Lista dos exercícios (read-only): para cada, uma linha card com nome (bodyMd) + metaSmall `${sets}×${reps} · descanso ${rest_seconds}s` (+ notes se houver). Pode reutilizar `ExerciseThumb`/`ExerciseCard` de `@/components/workouts` se servir — senão linhas simples (não obrigatório usar o thumb).
  - CTA fixo "Clonar e editar" (`Button` primary) → `router.push(('/montar-treino?fromLibrary=' + id) as Href)`.
  - 1 motion: reveal de entrada (opacity 300ms, `motion.screenMs`).
- [ ] **Step 3:** `npx jest "app/banco-treino"` → PASS; `npm run typecheck` → PASS.
- [ ] **Step 4:** `git add "app/banco-treino/[id].tsx" "app/banco-treino/[id].test.tsx" && git commit -m "feat(banco): tela de detalhe do treino da biblioteca"`

---

### Task 5 — Toggle Meus|Banco na aba Treinos (`app/(personal)/(tabs)/treinos.tsx`)

Edição mínima do arquivo existente. Ler o arquivo primeiro; preservar a lista "Meus" intacta.

- [ ] **Step 1:** adicionar estado `const [scope, setScope] = useState<'meus' | 'banco'>('meus');` e filtro `const [objetivo, setObjetivo] = useState<Objetivo | null>(null);`.
- [ ] **Step 2:** imports: `WorkoutScopeToggle, ObjetivoChips, LibraryWorkoutCard` de `@/components/library`; `getWorkoutLibrary` de `@/data/workoutLibrary`; tipo `Objetivo` de `@/types/workoutLibrary`.
- [ ] **Step 3:** renderizar `<WorkoutScopeToggle value={scope} onChange={setScope} />` logo abaixo do header/topo do conteúdo. Quando `scope === 'meus'`: a lista atual (intacta). Quando `scope === 'banco'`: `<ObjetivoChips selected={objetivo} onChange={setObjetivo} />` + a lista da biblioteca filtrada (`getWorkoutLibrary().filter(w => !objetivo || w.objetivo === objetivo)`) renderizando `LibraryWorkoutCard` com `onPress={() => router.push(('/banco-treino/' + w.id) as Href)}`.
- [ ] **Step 4:** o botão "+" de criar treino (montar-treino) deve aparecer só no escopo "meus" (não no banco). Ajuste condicional mínimo.
- [ ] **Step 5:** `npm run typecheck` → PASS. Rodar testes existentes de treinos se houver (`npx jest "(personal)/(tabs)/treinos"` pode não casar por parênteses — confie no typecheck + smoke). `git diff --stat` deve mostrar mudança contida (não o arquivo todo); se aparecer churn de EOL, alinhe ao HEAD e refaça com edições exatas.
- [ ] **Step 6:** `git add "app/(personal)/(tabs)/treinos.tsx" && git commit -m "feat(banco): toggle Meus|Banco na aba Treinos do personal"`

---

### Task 6 — Prefill `fromLibrary` no `montar-treino` (`app/montar-treino.tsx`)

- [ ] **Step 1:** trocar o tipo do param: `useLocalSearchParams<{ id?: string; fromLibrary?: string }>()` e derivar `const fromLibraryId = typeof params.fromLibrary === 'string' ? params.fromLibrary : undefined;`.
- [ ] **Step 2:** adicionar um `useEffect` de prefill (modo CRIAR, espelhando a hidratação de edição), SEM mexer na de edição:
```tsx
useEffect(() => {
  if (isEditing || hydrated || !fromLibraryId) return;
  const lib = getLibraryWorkout(fromLibraryId);
  if (!lib) return;
  setName(lib.name);
  setNotes(lib.notes ?? '');
  setExercises(
    lib.exercises.map((e) => ({
      name: e.name,
      wgerExerciseId: e.wger_exercise_id,
      sets: e.sets,
      reps: e.reps,
      restSeconds: e.rest_seconds,
      notes: e.notes,
      muscleGroup: e.muscle_group,
    })),
  );
  setHydrated(true);
}, [isEditing, hydrated, fromLibraryId]);
```
  Import `getLibraryWorkout` de `@/data/workoutLibrary`. Salvar continua = `create` (POST /workouts), pois `isEditing` é false. Começa no passo 1 (renomear) — comportamento já existente para criação.
- [ ] **Step 3:** `npm run typecheck` → PASS; `npx jest "montar-treino"` (se houver) ou confie no typecheck. `git diff --stat` contido.
- [ ] **Step 4:** `git add app/montar-treino.tsx && git commit -m "feat(banco): clone-e-edita pré-preenche o montar-treino via fromLibrary"`

---

### Task 7 — Verificação final + sinal pro backend

- [ ] **Step 1:** em `AGENTS.md`, seção "Pendências conhecidas", adicionar:
```markdown
- Banco de Treinos (biblioteca gratuita) — sem endpoint na API v1. Front roda sobre o seed editorial `src/data/workoutLibrary.ts` (exercícios reais do catálogo Wger). Solicitado: `GET /workouts/library` (programas curados públicos). O clone reusa `POST /workouts` (já existe).
```
- [ ] **Step 2:** `npm run typecheck` → PASS (0 erro). `npx jest src/data src/components/library "app/banco-treino"` → PASS.
- [ ] **Step 3:** `git add AGENTS.md && git commit -m "docs(banco): registra GET /workouts/library solicitado ao backend"`
- [ ] **Step 4 (validação manual — designer):** na aba Treinos do personal, toggle "Banco" → chips por objetivo → abrir um programa → "Clonar e editar" abre o montar-treino pré-preenchido → salvar cria o template em "Meus".

---

## Self-Review
- Dados reais: exercícios por id real do catálogo Wger (Task 2) — sem invenção. ✔
- Curadoria = 8 programas cobrindo os 5 objetivos. ✔
- Clone reusa POST /workouts (sem back novo); biblioteca sinalizada como GET /workouts/library. ✔
- Toggle Meus|Banco isolado na aba (Task 5), detalhe (Task 4), prefill (Task 6). ✔
- Tipos/nomes consistentes: `LibraryWorkout`, `getWorkoutLibrary`, `getLibraryWorkout`, `libraryToCreateBody`, `Objetivo`, `Nivel`, `OBJETIVO_LABEL`, `NIVEL_LABEL`, `OBJETIVOS`, `WorkoutScopeToggle`, `ObjetivoChips`, `LibraryWorkoutCard`. ✔
- Placeholders: nenhum; ids do seed são reais (verificados no catálogo). ✔
