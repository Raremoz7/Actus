# O que comi — Registro Alimentar (front mobile) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Construir o front mobile do aluno para registrar refeições ("o que comi") — feed por dia, adicionar/editar/excluir, tags, comentários do personal (read-only) e fila offline — ligado à API specada (`/me/meals`), com estados de vazio/erro.

**Architecture:** Camadas isoladas seguindo o app: `types` (Zod validado) → `lib` (puro, testável) → `store` (fila offline Zustand) → `hooks` (TanStack Query + fetch multipart) → `components` (Unistyles + tokens) → `screen` (rota dedicada) + card de entrada na HOJE. Sem novo módulo nativo: offline por detecção implícita (enfileira ao falhar/estar offline; flush no foreground + retry manual).

**Tech Stack:** React Native + Expo SDK 55, TypeScript estrito, Zod, TanStack Query v5, Zustand, Unistyles 3, Phosphor duotone, expo-image-picker, @react-native-community/datetimepicker.

**Spec:** `app/docs/superpowers/specs/2026-07-01-o-que-comi-registro-alimentar-design.md`

**Checkpoint visual:** antes de executar as Tasks 6 (MealCard) e 7 (MealFormSheet), renderizar mockups de alta fidelidade e obter aprovação do designer (Davi) — regra do AGENTS.md.

---

## File Structure

- Create `app/src/types/meals.ts` — schemas Zod + tipos (MealLog, MealComment, inputs).
- Create `app/src/lib/meals.ts` — agrupamento por dia, rótulos, validação, normalização feed.
- Create `app/src/lib/meals.test.ts` — testes do lib.
- Create `app/src/store/mealQueueStore.ts` — fila offline (Zustand + persistência).
- Create `app/src/store/mealQueueStore.test.ts` — testes do store.
- Create `app/src/hooks/useMeals.ts` — queries/mutations `/me/meals`.
- Create `app/src/components/meals/MealCard.tsx` (+ `.test.tsx`) — card de refeição.
- Create `app/src/components/meals/MealFormSheet.tsx` (+ `.test.tsx`) — bottom sheet add/editar.
- Create `app/src/components/meals/index.ts` — barrel.
- Create `app/src/components/home/AlimentacaoCard.tsx` — card de entrada na HOJE.
- Create `app/app/(aluno)/alimentacao.tsx` — tela do feed.
- Modify `app/app/(aluno)/(tabs)/index.tsx` — render do `AlimentacaoCard`.
- Modify `app/src/api/endpoints.ts` — adicionar `meals: '/me/meals'`.
- Modify `app/src/components/home/index.ts` — exportar `AlimentacaoCard`.
- Create `app/docs/backend/tec-62-meals-mobile.md` — contrato para o Julio.

---

### Task 1: Endpoint + tipos de refeição

**Files:**
- Modify: `app/src/api/endpoints.ts`
- Create: `app/src/types/meals.ts`

- [ ] **Step 1: Adicionar o endpoint**

Em `app/src/api/endpoints.ts`, dentro do objeto `me` (perto de `avatar: '/me/avatar'`), adicionar:

```ts
    // Registro alimentar do aluno ("o que comi").
    meals: '/me/meals',
```

- [ ] **Step 2: Escrever os schemas e tipos**

Criar `app/src/types/meals.ts`:

```ts
import { z } from 'zod';

// Comentário do profissional numa refeição (read-only no mobile).
export const MealCommentSchema = z.object({
  id: z.string(),
  author_id: z.string(),
  author_name: z.string().nullable().optional(),
  body: z.string(),
  created_at: z.string(),
});
export type MealComment = z.infer<typeof MealCommentSchema>;

// Refeição registrada pelo aluno. tags é extensão do contrato (ver pendências backend).
export const MealLogSchema = z.object({
  id: z.string(),
  student_id: z.string(),
  photo_url: z.string().nullable(),
  eaten_at: z.string(), // ISO datetime
  description: z.string().nullable(),
  tags: z.array(z.string()).default([]),
  created_at: z.string(),
  comments: z.array(MealCommentSchema).default([]),
});
export type MealLog = z.infer<typeof MealLogSchema>;

export const MealLogsResponseSchema = z.object({
  meals: z.array(MealLogSchema),
});
export type MealLogsResponse = z.infer<typeof MealLogsResponseSchema>;

// Entrada para criar/editar (o front decide photoUri; o hook monta o multipart).
export interface MealInput {
  photoUri: string | null;
  description: string | null;
  tags: string[];
  eatenAt: string; // ISO datetime
}
```

- [ ] **Step 3: Typecheck**

Run: `cd app && npm run typecheck`
Expected: sem erros.

- [ ] **Step 4: Commit**

```bash
git add app/src/api/endpoints.ts app/src/types/meals.ts
git commit -m "feat(app): tipos e endpoint de refeicoes (TEC-62)"
```

---

### Task 2: Lib pura — agrupamento, rótulos, validação, feed normalizado

**Files:**
- Create: `app/src/lib/meals.ts`
- Test: `app/src/lib/meals.test.ts`

- [ ] **Step 1: Escrever os testes**

Criar `app/src/lib/meals.test.ts`:

```ts
import {
  isMealInputValid,
  mealTimeLabel,
  groupFeedByDay,
  type FeedMeal,
} from './meals';

describe('isMealInputValid', () => {
  const base = { eatenAt: '2026-07-01T12:00:00.000Z', tags: [] };
  it('exige horário + (descrição OU foto)', () => {
    expect(isMealInputValid({ ...base, description: 'ovos', photoUri: null })).toBe(true);
    expect(isMealInputValid({ ...base, description: null, photoUri: 'file://x.jpg' })).toBe(true);
    expect(isMealInputValid({ ...base, description: '  ', photoUri: null })).toBe(false);
    expect(isMealInputValid({ ...base, description: null, photoUri: null })).toBe(false);
  });
});

describe('mealTimeLabel', () => {
  it('formata HH:MM local', () => {
    const d = new Date(2026, 6, 1, 8, 5);
    expect(mealTimeLabel(d.toISOString())).toBe('08:05');
  });
});

describe('groupFeedByDay', () => {
  it('agrupa por dia local, mais recente primeiro', () => {
    const mk = (id: string, iso: string): FeedMeal => ({
      key: id, id, photoUri: null, eatenAt: iso, description: id,
      tags: [], comments: [], sync: 'synced',
    });
    const a = mk('a', new Date(2026, 6, 1, 9, 0).toISOString());
    const b = mk('b', new Date(2026, 6, 1, 20, 0).toISOString());
    const c = mk('c', new Date(2026, 6, 2, 7, 0).toISOString());
    const groups = groupFeedByDay([a, b, c]);
    expect(groups.map((g) => g.dateKey)).toEqual(['2026-07-02', '2026-07-01']);
    // dentro do dia, mais recente primeiro
    expect(groups[1]!.meals.map((m) => m.id)).toEqual(['b', 'a']);
  });
});
```

- [ ] **Step 2: Rodar e ver falhar**

Run: `cd app && npx jest src/lib/meals.test.ts`
Expected: FAIL (módulo não existe).

- [ ] **Step 3: Implementar o lib**

Criar `app/src/lib/meals.ts`:

```ts
import { formatDateLocal } from '@/lib/format';
import type { MealComment } from '@/types/meals';

// Refeição normalizada consumida pelo feed/card: unifica item do servidor e da fila.
export interface FeedMeal {
  key: string;            // id do servidor ou localId da fila
  id: string | null;      // id do servidor (null enquanto pendente)
  photoUri: string | null;
  eatenAt: string;        // ISO
  description: string | null;
  tags: string[];
  comments: MealComment[];
  sync: 'synced' | 'pending' | 'error';
}

export interface DayGroup {
  dateKey: string;   // YYYY-MM-DD local
  dayLabel: string;  // "Terça · 01 jul"
  meals: FeedMeal[];
}

const DIAS = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
const MESES = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];

function dayLabelLocal(d: Date): string {
  return `${DIAS[d.getDay()]} · ${String(d.getDate()).padStart(2, '0')} ${MESES[d.getMonth()]}`;
}

// "Salvar" habilita com horário + (descrição não-vazia OU foto).
export function isMealInputValid(input: {
  eatenAt: string;
  description: string | null;
  photoUri: string | null;
}): boolean {
  if (!input.eatenAt) return false;
  const hasDesc = (input.description ?? '').trim().length > 0;
  const hasPhoto = (input.photoUri ?? '').length > 0;
  return hasDesc || hasPhoto;
}

// HH:MM em componentes LOCAIS do Date (nunca toISOString — regra de fuso do app).
export function mealTimeLabel(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

// Agrupa por dia LOCAL, dias mais recentes primeiro e refeições recentes primeiro no dia.
export function groupFeedByDay(meals: FeedMeal[]): DayGroup[] {
  const byDay = new Map<string, FeedMeal[]>();
  for (const m of meals) {
    const d = new Date(m.eatenAt);
    if (Number.isNaN(d.getTime())) continue;
    const key = formatDateLocal(d);
    const arr = byDay.get(key) ?? [];
    arr.push(m);
    byDay.set(key, arr);
  }
  return [...byDay.entries()]
    .sort((a, b) => (a[0] < b[0] ? 1 : -1))
    .map(([dateKey, list]) => ({
      dateKey,
      dayLabel: dayLabelLocal(new Date(list[0]!.eatenAt)),
      meals: list.sort(
        (a, b) => new Date(b.eatenAt).getTime() - new Date(a.eatenAt).getTime(),
      ),
    }));
}
```

- [ ] **Step 4: Rodar e ver passar**

Run: `cd app && npx jest src/lib/meals.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add app/src/lib/meals.ts app/src/lib/meals.test.ts
git commit -m "feat(app): lib de refeicoes (agrupamento/validacao) (TEC-62)"
```

---

### Task 3: Fila offline (store Zustand persistido)

**Files:**
- Create: `app/src/store/mealQueueStore.ts`
- Test: `app/src/store/mealQueueStore.test.ts`

- [ ] **Step 1: Escrever os testes**

Criar `app/src/store/mealQueueStore.test.ts`:

```ts
import { useMealQueueStore } from './mealQueueStore';

beforeEach(() => {
  useMealQueueStore.setState({ items: {}, hydrated: true });
});

describe('mealQueueStore', () => {
  it('enfileira uma refeição como pending', () => {
    const id = useMealQueueStore.getState().enqueue({
      photoUri: 'file://a.jpg', description: 'ovos', tags: ['Café da manhã'],
      eatenAt: '2026-07-01T09:00:00.000Z',
    });
    const item = useMealQueueStore.getState().items[id];
    expect(item?.status).toBe('pending');
    expect(item?.description).toBe('ovos');
  });

  it('marca erro e remove', () => {
    const id = useMealQueueStore.getState().enqueue({
      photoUri: null, description: 'x', tags: [], eatenAt: '2026-07-01T09:00:00.000Z',
    });
    useMealQueueStore.getState().markError(id);
    expect(useMealQueueStore.getState().items[id]?.status).toBe('error');
    useMealQueueStore.getState().remove(id);
    expect(useMealQueueStore.getState().items[id]).toBeUndefined();
  });
});
```

- [ ] **Step 2: Rodar e ver falhar**

Run: `cd app && npx jest src/store/mealQueueStore.test.ts`
Expected: FAIL (módulo não existe).

- [ ] **Step 3: Implementar o store**

Criar `app/src/store/mealQueueStore.ts` (persistência no padrão do `onboardingStore`: SecureStore nativo / localStorage web; payload pequeno):

```ts
import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import { create } from 'zustand';

const KEY = 'actus.meal.queue';
const isWeb = Platform.OS === 'web';

// Refeição criada localmente aguardando envio ao servidor.
export interface QueuedMeal {
  localId: string;
  photoUri: string | null;
  description: string | null;
  tags: string[];
  eatenAt: string; // ISO
  status: 'pending' | 'error';
}

export type EnqueueInput = Omit<QueuedMeal, 'localId' | 'status'>;

interface MealQueueState {
  items: Record<string, QueuedMeal>;
  hydrated: boolean;
  hydrate: () => Promise<void>;
  enqueue: (input: EnqueueInput) => string; // retorna localId
  markError: (localId: string) => void;
  markPending: (localId: string) => void;
  remove: (localId: string) => void;
  update: (localId: string, patch: Partial<EnqueueInput>) => void;
}

// id local sem depender de libs (contador + timestamp base do device).
let counter = 0;
function localId(): string {
  counter += 1;
  return `local-${Date.now()}-${counter}`;
}

async function loadRaw(): Promise<string | null> {
  if (isWeb) return globalThis.localStorage?.getItem(KEY) ?? null;
  try {
    return await SecureStore.getItemAsync(KEY);
  } catch {
    return null;
  }
}

function persist(items: Record<string, QueuedMeal>): void {
  const raw = JSON.stringify(items);
  if (isWeb) {
    globalThis.localStorage?.setItem(KEY, raw);
    return;
  }
  void SecureStore.setItemAsync(KEY, raw).catch(() => {
    // fila local: falha de persistência não trava o app.
  });
}

export const useMealQueueStore = create<MealQueueState>((set, get) => ({
  items: {},
  hydrated: false,
  hydrate: async () => {
    if (get().hydrated) return;
    let items: Record<string, QueuedMeal> = {};
    try {
      items = JSON.parse((await loadRaw()) ?? '{}') as Record<string, QueuedMeal>;
    } catch {
      items = {};
    }
    set({ items, hydrated: true });
  },
  enqueue: (input) => {
    const id = localId();
    const item: QueuedMeal = { ...input, localId: id, status: 'pending' };
    const next = { ...get().items, [id]: item };
    set({ items: next });
    persist(next);
    return id;
  },
  markError: (id) => {
    const cur = get().items[id];
    if (!cur) return;
    const next = { ...get().items, [id]: { ...cur, status: 'error' as const } };
    set({ items: next });
    persist(next);
  },
  markPending: (id) => {
    const cur = get().items[id];
    if (!cur) return;
    const next = { ...get().items, [id]: { ...cur, status: 'pending' as const } };
    set({ items: next });
    persist(next);
  },
  remove: (id) => {
    const next = { ...get().items };
    delete next[id];
    set({ items: next });
    persist(next);
  },
  update: (id, patch) => {
    const cur = get().items[id];
    if (!cur) return;
    const next = { ...get().items, [id]: { ...cur, ...patch } };
    set({ items: next });
    persist(next);
  },
}));
```

- [ ] **Step 4: Rodar e ver passar**

Run: `cd app && npx jest src/store/mealQueueStore.test.ts`
Expected: PASS. (O jest.setup do app já mocka `expo-secure-store`; se necessário, mockar no topo do teste como em outros stores.)

- [ ] **Step 5: Commit**

```bash
git add app/src/store/mealQueueStore.ts app/src/store/mealQueueStore.test.ts
git commit -m "feat(app): fila offline de refeicoes (TEC-62)"
```

---

### Task 4: Hooks de dados (GET/POST/PATCH/DELETE /me/meals)

**Files:**
- Create: `app/src/hooks/useMeals.ts`

Referência de multipart: `app/src/hooks/useUploadAvatar.ts` (usa `fetch` + `FormData`, não axios, porque o `api` força `application/json`).

- [ ] **Step 1: Implementar os hooks**

Criar `app/src/hooks/useMeals.ts`:

```ts
import {
  useMutation,
  useQuery,
  useQueryClient,
  type UseMutationResult,
  type UseQueryResult,
} from '@tanstack/react-query';
import { api } from '@/api/client';
import { endpoints } from '@/api/endpoints';
import { parseApi } from '@/api/parseApi';
import { tokenStorage } from '@/api/storage';
import { MealLogsResponseSchema, type MealLog, type MealInput } from '@/types/meals';

export const mealsQueryKey = ['me', 'meals'] as const;

// GET /me/meals — feed do próprio aluno. retry:false p/ cair em vazio/erro
// enquanto o backend não existe (decisão do spec).
export function useMeals(): UseQueryResult<MealLog[]> {
  return useQuery({
    queryKey: mealsQueryKey,
    queryFn: async () => {
      const { data } = await api.get(endpoints.me.meals);
      return parseApi(MealLogsResponseSchema, data).meals;
    },
    retry: false,
    staleTime: 30_000,
  });
}

// Monta o multipart de uma refeição (foto opcional + campos).
function mealFormData(input: MealInput): FormData {
  const form = new FormData();
  form.append('eaten_at', input.eatenAt);
  if (input.description != null) form.append('description', input.description);
  for (const tag of input.tags) form.append('tags[]', tag);
  if (input.photoUri) {
    const name = input.photoUri.split('/').pop() ?? 'meal.jpg';
    form.append('photo', { uri: input.photoUri, name, type: 'image/jpeg' } as unknown as Blob);
  }
  return form;
}

async function sendMeal(method: 'POST' | 'PATCH', path: string, input: MealInput): Promise<void> {
  const base = process.env.EXPO_PUBLIC_API_BASE_URL ?? '';
  const token = await tokenStorage.getAccess();
  const res = await fetch(`${base}${path}`, {
    method,
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    body: mealFormData(input),
  });
  if (!res.ok) {
    const data: unknown = await res.json().catch(() => null);
    throw new Error((data as { error?: string } | null)?.error ?? 'meal_upload_failed');
  }
}

// POST /me/meals (multipart).
export function useCreateMeal(): UseMutationResult<void, unknown, MealInput> {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: MealInput) => sendMeal('POST', endpoints.me.meals, input),
    onSuccess: () => qc.invalidateQueries({ queryKey: mealsQueryKey }),
  });
}

// PATCH /me/meals/:id — editar (multipart; foto opcional).
export function useUpdateMeal(): UseMutationResult<void, unknown, { id: string; input: MealInput }> {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }) => sendMeal('PATCH', `${endpoints.me.meals}/${id}`, input),
    onSuccess: () => qc.invalidateQueries({ queryKey: mealsQueryKey }),
  });
}

// DELETE /me/meals/:id.
export function useDeleteMeal(): UseMutationResult<void, unknown, string> {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`${endpoints.me.meals}/${id}`);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: mealsQueryKey }),
  });
}
```

- [ ] **Step 2: Typecheck**

Run: `cd app && npm run typecheck`
Expected: sem erros.

- [ ] **Step 3: Commit**

```bash
git add app/src/hooks/useMeals.ts
git commit -m "feat(app): hooks de refeicoes /me/meals (TEC-62)"
```

---

### Task 5: MealCard — componente do feed

> **Checkpoint visual:** renderizar mockup do card e obter aprovação do Davi antes de codar.

**Files:**
- Create: `app/src/components/meals/MealCard.tsx`
- Create: `app/src/components/meals/index.ts`
- Test: `app/src/components/meals/MealCard.test.tsx`

- [ ] **Step 1: Escrever o teste**

Criar `app/src/components/meals/MealCard.test.tsx`:

```tsx
import { render, screen, fireEvent } from '@testing-library/react-native';
import { MealCard } from './MealCard';
import type { FeedMeal } from '@/lib/meals';

const base: FeedMeal = {
  key: 'm1', id: 'm1', photoUri: null, eatenAt: '2026-07-01T12:30:00.000Z',
  description: 'Frango e arroz', tags: ['Almoço'], comments: [], sync: 'synced',
};

describe('MealCard', () => {
  it('mostra descrição, horário e tag', () => {
    render(<MealCard meal={base} onEdit={() => {}} onDelete={() => {}} />);
    expect(screen.getByText('Frango e arroz')).toBeTruthy();
    expect(screen.getByText('Almoço')).toBeTruthy();
  });

  it('mostra badge de aguardando quando pending', () => {
    render(<MealCard meal={{ ...base, sync: 'pending' }} onEdit={() => {}} onDelete={() => {}} />);
    expect(screen.getByText('Aguardando sincronização')).toBeTruthy();
  });

  it('dispara onDelete', () => {
    const onDelete = jest.fn();
    render(<MealCard meal={base} onEdit={() => {}} onDelete={onDelete} />);
    fireEvent.press(screen.getByLabelText('Excluir refeição'));
    expect(onDelete).toHaveBeenCalledTimes(1);
  });
});
```

- [ ] **Step 2: Rodar e ver falhar**

Run: `cd app && npx jest src/components/meals/MealCard.test.tsx`
Expected: FAIL (componente não existe).

- [ ] **Step 3: Implementar o MealCard**

Criar `app/src/components/meals/MealCard.tsx`:

```tsx
import { useState } from 'react';
import { Image, Pressable, View } from 'react-native';
import { PencilSimple, Trash, ChatCircle, CloudArrowUp, WarningCircle } from 'phosphor-react-native';
import { StyleSheet } from 'react-native-unistyles';

import { AppText } from '@/components/ui';
import { mealTimeLabel, type FeedMeal } from '@/lib/meals';
import { darkTheme } from '@/theme';

const { colors } = darkTheme;

type Props = {
  meal: FeedMeal;
  onEdit: () => void;
  onDelete: () => void;
};

export function MealCard({ meal, onEdit, onDelete }: Props) {
  const [showComments, setShowComments] = useState(false);
  const commentCount = meal.comments.length;

  return (
    <View style={styles.card}>
      {meal.photoUri ? (
        <Image source={{ uri: meal.photoUri }} style={styles.photo} resizeMode="cover" />
      ) : null}

      <View style={styles.headerRow}>
        <AppText variant="dataMed" color="neon">{mealTimeLabel(meal.eatenAt)}</AppText>
        <View style={styles.actions}>
          <Pressable accessibilityRole="button" accessibilityLabel="Editar refeição" hitSlop={10} onPress={onEdit}>
            <PencilSimple size={18} weight="duotone" color={colors.textSecondary} />
          </Pressable>
          <Pressable accessibilityRole="button" accessibilityLabel="Excluir refeição" hitSlop={10} onPress={onDelete}>
            <Trash size={18} weight="duotone" color={colors.error} />
          </Pressable>
        </View>
      </View>

      {meal.description ? (
        <AppText variant="bodyMd" style={styles.description}>{meal.description}</AppText>
      ) : null}

      {meal.tags.length > 0 ? (
        <View style={styles.tags}>
          {meal.tags.map((t) => (
            <View key={t} style={styles.tag}>
              <AppText variant="metaSmall" color="secondary">{t}</AppText>
            </View>
          ))}
        </View>
      ) : null}

      {meal.sync !== 'synced' ? (
        <View style={styles.syncRow}>
          {meal.sync === 'error' ? (
            <WarningCircle size={14} weight="duotone" color={colors.error} />
          ) : (
            <CloudArrowUp size={14} weight="duotone" color={colors.textTertiary} />
          )}
          <AppText variant="metaSmall" color={meal.sync === 'error' ? 'error' : 'tertiary'}>
            {meal.sync === 'error' ? 'Falha ao enviar — tentar de novo' : 'Aguardando sincronização'}
          </AppText>
        </View>
      ) : null}

      {commentCount > 0 ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Comentário do Personal"
          onPress={() => setShowComments((v) => !v)}
          style={styles.commentToggle}
        >
          <ChatCircle size={16} weight="duotone" color={colors.accentMuted} />
          <AppText variant="metaSmall" color="accentMuted">
            {`Comentário do Personal (${commentCount})`}
          </AppText>
        </Pressable>
      ) : null}

      {showComments
        ? meal.comments.map((c) => (
            <View key={c.id} style={styles.comment}>
              <AppText variant="metaSmall" color="tertiary">
                {c.author_name ?? 'Personal'} · {mealTimeLabel(c.created_at)}
              </AppText>
              <AppText variant="bodySm">{c.body}</AppText>
            </View>
          ))
        : null}
    </View>
  );
}

const styles = StyleSheet.create((theme) => ({
  card: {
    backgroundColor: theme.colors.surface1,
    borderWidth: 1,
    borderColor: theme.colors.outlineVariant,
    borderRadius: theme.radius.card,
    padding: theme.spacing.md,
    gap: theme.spacing.sm,
  },
  photo: {
    width: '100%',
    height: 180,
    borderRadius: theme.radius.thumb,
    marginBottom: theme.spacing.xs,
  },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  actions: { flexDirection: 'row', gap: theme.spacing.md },
  description: {},
  tags: { flexDirection: 'row', flexWrap: 'wrap', gap: theme.spacing.xs },
  tag: {
    paddingVertical: 4,
    paddingHorizontal: theme.spacing.sm,
    borderRadius: theme.radius.tag,
    backgroundColor: theme.colors.accentMutedSurface,
  },
  syncRow: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing.xs },
  commentToggle: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing.xs },
  comment: {
    gap: 2,
    borderLeftWidth: 2,
    borderLeftColor: theme.colors.accentMuted,
    paddingLeft: theme.spacing.sm,
  },
}));
```

Criar `app/src/components/meals/index.ts`:

```ts
export { MealCard } from './MealCard';
export { MealFormSheet } from './MealFormSheet';
```

- [ ] **Step 4: Rodar e ver passar**

Run: `cd app && npx jest src/components/meals/MealCard.test.tsx`
Expected: PASS. (Se `index.ts` falhar por `MealFormSheet` ainda não existir, criar o `index.ts` só na Task 6; até lá, importar `MealCard` direto no teste — já está.)

- [ ] **Step 5: Typecheck + commit**

Run: `cd app && npm run typecheck`

```bash
git add app/src/components/meals/MealCard.tsx app/src/components/meals/MealCard.test.tsx
git commit -m "feat(app): MealCard do feed de refeicoes (TEC-62)"
```

---

### Task 6: MealFormSheet — bottom sheet adicionar/editar

> **Checkpoint visual:** renderizar mockup do sheet e obter aprovação do Davi antes de codar.

**Files:**
- Create: `app/src/components/meals/MealFormSheet.tsx`
- Test: `app/src/components/meals/MealFormSheet.test.tsx`

Padrões de referência: `ExerciseFormSheet.tsx` (bottom sheet + safe-area), `FotoStep.tsx` (image-picker), `Input.tsx` (campo).

Constantes de tags: `MEAL_TAGS = ['Café da manhã','Almoço','Lanche','Jantar','Pré-treino','Pós-treino']`.

- [ ] **Step 1: Escrever o teste**

Criar `app/src/components/meals/MealFormSheet.test.tsx`:

```tsx
import { render, screen, fireEvent } from '@testing-library/react-native';
import { MealFormSheet } from './MealFormSheet';

describe('MealFormSheet', () => {
  it('mantém "Salvar" desabilitado sem descrição nem foto e confirma com descrição', () => {
    const onConfirm = jest.fn();
    render(
      <MealFormSheet visible initial={null} onClose={() => {}} onConfirm={onConfirm} />,
    );
    const salvar = screen.getByLabelText('Salvar refeição');
    expect(salvar.props.accessibilityState?.disabled).toBe(true);
    fireEvent.changeText(screen.getByLabelText('Descrição'), 'Panqueca');
    fireEvent.press(salvar);
    expect(onConfirm).toHaveBeenCalledWith(
      expect.objectContaining({ description: 'Panqueca', photoUri: null }),
    );
  });
});
```

- [ ] **Step 2: Rodar e ver falhar**

Run: `cd app && npx jest src/components/meals/MealFormSheet.test.tsx`
Expected: FAIL (componente não existe).

- [ ] **Step 3: Implementar o MealFormSheet**

Criar `app/src/components/meals/MealFormSheet.tsx`:

```tsx
import { useEffect, useState } from 'react';
import { Image, Modal, Platform, Pressable, ScrollView, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Camera, X } from 'phosphor-react-native';
import { StyleSheet } from 'react-native-unistyles';

import { AppText, Button, Input } from '@/components/ui';
import { isMealInputValid } from '@/lib/meals';
import type { MealInput } from '@/types/meals';
import { darkTheme } from '@/theme';

const { colors, motion, spacing } = darkTheme;

export const MEAL_TAGS = ['Café da manhã', 'Almoço', 'Lanche', 'Jantar', 'Pré-treino', 'Pós-treino'] as const;

type Props = {
  visible: boolean;
  initial: (MealInput & { id?: string }) | null; // null = adicionar
  onClose: () => void;
  onConfirm: (input: MealInput) => void;
};

export function MealFormSheet({ visible, initial, onClose, onConfirm }: Props) {
  const insets = useSafeAreaInsets();
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [description, setDescription] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [eatenAt, setEatenAt] = useState<Date>(new Date());
  const [showPicker, setShowPicker] = useState(false);

  useEffect(() => {
    if (!visible) return;
    setPhotoUri(initial?.photoUri ?? null);
    setDescription(initial?.description ?? '');
    setTags(initial?.tags ?? []);
    setEatenAt(initial?.eatenAt ? new Date(initial.eatenAt) : new Date());
    setShowPicker(false);
  }, [visible, initial]);

  const reveal = useSharedValue(0);
  useEffect(() => {
    reveal.value = withTiming(visible ? 1 : 0, { duration: motion.screenMs });
  }, [visible, reveal]);
  const sheetStyle = useAnimatedStyle(() => ({
    opacity: reveal.value,
    transform: [{ translateY: (1 - reveal.value) * 24 }],
  }));

  async function pickPhoto() {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) return;
    const result = await ImagePicker.launchImageLibraryAsync({ quality: 0.8 });
    if (result.canceled) return;
    setPhotoUri(result.assets[0]?.uri ?? null);
  }

  function toggleTag(t: string) {
    setTags((cur) => (cur.includes(t) ? cur.filter((x) => x !== t) : [...cur, t]));
  }

  const canSave = isMealInputValid({
    eatenAt: eatenAt.toISOString(),
    description: description.trim() === '' ? null : description,
    photoUri,
  });

  function handleConfirm() {
    if (!canSave) return;
    onConfirm({
      photoUri,
      description: description.trim() === '' ? null : description.trim(),
      tags,
      eatenAt: eatenAt.toISOString(),
    });
  }

  const timeLabel = `${String(eatenAt.getHours()).padStart(2, '0')}:${String(eatenAt.getMinutes()).padStart(2, '0')}`;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose} accessibilityViewIsModal>
      <View style={styles.backdrop}>
        <Pressable style={StyleSheet.absoluteFill} accessibilityLabel="Fechar" onPress={onClose} />
        <Animated.View style={[styles.sheet, sheetStyle, { paddingBottom: spacing.xxl + insets.bottom }]}>
          <View style={styles.handle} />
          <View style={styles.header}>
            <AppText variant="h3">{initial?.id ? 'Editar refeição' : 'Adicionar refeição'}</AppText>
            <Pressable accessibilityRole="button" accessibilityLabel="Fechar" hitSlop={12} onPress={onClose}>
              <X size={20} weight="bold" color={colors.textSecondary} />
            </Pressable>
          </View>

          <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
            <Pressable accessibilityRole="button" accessibilityLabel="Adicionar foto" onPress={() => void pickPhoto()} style={styles.photoBox}>
              {photoUri ? (
                <Image source={{ uri: photoUri }} style={styles.photo} resizeMode="cover" />
              ) : (
                <Camera size={32} weight="duotone" color={colors.textTertiary} />
              )}
            </Pressable>

            <Pressable accessibilityRole="button" accessibilityLabel="Horário" onPress={() => setShowPicker(true)} style={styles.timeRow}>
              <AppText variant="eyebrow" color="tertiary">Horário</AppText>
              <AppText variant="dataMed">{timeLabel}</AppText>
            </Pressable>
            {showPicker ? (
              <DateTimePicker
                value={eatenAt}
                mode="time"
                onChange={(_e, d) => {
                  setShowPicker(Platform.OS === 'ios');
                  if (d) setEatenAt(d);
                }}
              />
            ) : null}

            <Input label="Descrição" accessibilityLabel="Descrição" placeholder="O que você comeu?" value={description} onChangeText={setDescription} multiline />

            <AppText variant="eyebrow" color="tertiary" style={styles.tagsLabel}>Tags</AppText>
            <View style={styles.tags}>
              {MEAL_TAGS.map((t) => {
                const on = tags.includes(t);
                return (
                  <Pressable key={t} accessibilityRole="button" accessibilityState={{ selected: on }} onPress={() => toggleTag(t)} style={[styles.tag, on && styles.tagOn]}>
                    <AppText variant="metaSmall" color={on ? 'inverse' : 'secondary'}>{t}</AppText>
                  </Pressable>
                );
              })}
            </View>
          </ScrollView>

          <View style={styles.cta}>
            <Button variant="primary" label="Salvar refeição" disabled={!canSave} onPress={handleConfirm} />
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create((theme) => ({
  backdrop: { flex: 1, justifyContent: 'flex-end', backgroundColor: theme.colors.overlay },
  sheet: {
    backgroundColor: theme.colors.bgBase,
    borderTopLeftRadius: theme.radius.modal,
    borderTopRightRadius: theme.radius.modal,
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.md,
    gap: theme.spacing.md,
    maxHeight: '88%',
    shadowColor: theme.colors.shadow,
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 12,
  },
  handle: { alignSelf: 'center', width: 36, height: 4, borderRadius: theme.radius.tag, backgroundColor: theme.colors.surface3 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  photoBox: {
    height: 160, borderRadius: theme.radius.card, backgroundColor: theme.colors.surface1,
    borderWidth: 1, borderColor: theme.colors.outlineVariant, alignItems: 'center', justifyContent: 'center', overflow: 'hidden',
    marginBottom: theme.spacing.md,
  },
  photo: { width: '100%', height: '100%' },
  timeRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: theme.colors.surface1, borderWidth: 1, borderColor: theme.colors.outlineVariant,
    borderRadius: theme.radius.input, paddingHorizontal: theme.spacing.md, paddingVertical: theme.spacing.md,
    marginBottom: theme.spacing.md,
  },
  tagsLabel: { marginBottom: theme.spacing.xs },
  tags: { flexDirection: 'row', flexWrap: 'wrap', gap: theme.spacing.xs },
  tag: { paddingVertical: 6, paddingHorizontal: theme.spacing.md, borderRadius: theme.radius.pill, borderWidth: 1, borderColor: theme.colors.outline },
  tagOn: { backgroundColor: theme.colors.neon, borderColor: theme.colors.neon },
  cta: { paddingTop: theme.spacing.xs },
}));
```

- [ ] **Step 4: Rodar e ver passar**

Run: `cd app && npx jest src/components/meals/MealFormSheet.test.tsx`
Expected: PASS. (Mockar `@react-native-community/datetimepicker` e `expo-image-picker` no topo do teste se o ambiente exigir, como em `perfil.test.tsx`/`FotoStep`.)

- [ ] **Step 5: Typecheck + commit**

Run: `cd app && npm run typecheck`

```bash
git add app/src/components/meals/
git commit -m "feat(app): MealFormSheet adicionar/editar refeicao (TEC-62)"
```

---

### Task 7: Tela do feed `alimentacao.tsx`

**Files:**
- Create: `app/app/(aluno)/alimentacao.tsx`

Referência de tela com feed/estados: `app/app/convite/index.tsx` e `(aluno)/(tabs)/index.tsx`.

- [ ] **Step 1: Implementar a tela**

Criar `app/app/(aluno)/alimentacao.tsx`:

```tsx
import { useEffect, useMemo, useState } from 'react';
import { Pressable, RefreshControl, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { CaretLeft, Plus, ForkKnife } from 'phosphor-react-native';
import { StyleSheet } from 'react-native-unistyles';

import { AppText, Button, ConfirmDialog, ListState } from '@/components/ui';
import { MealCard, MealFormSheet } from '@/components/meals';
import { goBackOr } from '@/lib/nav';
import { toast } from '@/store/toastStore';
import { groupFeedByDay, type FeedMeal } from '@/lib/meals';
import { useMeals, useCreateMeal, useUpdateMeal, useDeleteMeal } from '@/hooks/useMeals';
import { useMealQueueStore } from '@/store/mealQueueStore';
import type { MealInput } from '@/types/meals';
import { darkTheme } from '@/theme';

const { colors } = darkTheme;

export default function AlimentacaoScreen() {
  const list = useMeals();
  const create = useCreateMeal();
  const update = useUpdateMeal();
  const del = useDeleteMeal();
  const queue = useMealQueueStore();

  const [sheetOpen, setSheetOpen] = useState(false);
  const [editing, setEditing] = useState<(MealInput & { id?: string }) | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  useEffect(() => { void queue.hydrate(); }, [queue]);

  // Feed = servidor + fila local, normalizados e agrupados por dia.
  const groups = useMemo(() => {
    const server: FeedMeal[] = (list.data ?? []).map((m) => ({
      key: m.id, id: m.id, photoUri: m.photo_url, eatenAt: m.eaten_at,
      description: m.description, tags: m.tags, comments: m.comments, sync: 'synced',
    }));
    const pending: FeedMeal[] = Object.values(queue.items).map((q) => ({
      key: q.localId, id: null, photoUri: q.photoUri, eatenAt: q.eatenAt,
      description: q.description, tags: q.tags, comments: [], sync: q.status,
    }));
    return groupFeedByDay([...server, ...pending]);
  }, [list.data, queue.items]);

  const isEmpty = !list.isLoading && !list.isError && groups.length === 0;

  function openAdd() { setEditing(null); setSheetOpen(true); }

  function handleConfirm(input: MealInput) {
    setSheetOpen(false);
    if (editing?.id) {
      update.mutate({ id: editing.id, input }, {
        onSuccess: () => toast('Refeição atualizada'),
        onError: () => toast('Não foi possível atualizar'),
      });
      return;
    }
    create.mutate(input, {
      onSuccess: () => toast('Refeição registrada'),
      onError: () => {
        // Offline/erro: enfileira para sincronizar depois.
        queue.enqueue({ photoUri: input.photoUri, description: input.description, tags: input.tags, eatenAt: input.eatenAt });
        toast('Salvo — aguardando sincronização');
      },
    });
  }

  function confirmDelete() {
    if (!deleteId) return;
    del.mutate(deleteId, {
      onSettled: () => setDeleteId(null),
      onSuccess: () => toast('Refeição excluída'),
      onError: () => toast('Não foi possível excluir'),
    });
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <Pressable accessibilityRole="button" accessibilityLabel="Voltar" hitSlop={12} onPress={() => goBackOr()} style={styles.back}>
          <CaretLeft size={20} weight="bold" color={colors.textSecondary} />
        </Pressable>
        <View style={styles.headerText}>
          <AppText variant="eyebrow" color="tertiary">Alimentação</AppText>
          <AppText variant="h2">O que comi</AppText>
        </View>
        <Pressable accessibilityRole="button" accessibilityLabel="Adicionar refeição" onPress={openAdd} style={styles.addBtn}>
          <Plus size={22} weight="bold" color={colors.textInverse} />
        </Pressable>
      </View>

      <View style={styles.flex}>
        {list.isLoading ? <ListState kind="loading" skeletonCount={3} /> : null}
        {isEmpty ? (
          <ListState kind="empty" icon={ForkKnife} title="Nenhuma refeição registrada" message="Toque em + para registrar o que você comeu" actionLabel="Adicionar refeição" onAction={openAdd} />
        ) : null}
        {list.isError && groups.length === 0 ? (
          <ListState kind="error" title="Não foi possível carregar" message="Verifique sua conexão e tente novamente." actionLabel="Tentar de novo" onAction={() => void list.refetch()} />
        ) : null}

        {groups.length > 0 ? (
          <View style={styles.scrollWrap}>
            <RefreshableFeed groups={groups} refreshing={list.isRefetching} onRefresh={() => void list.refetch()}
              onEdit={(m) => { setEditing({ id: m.id ?? undefined, photoUri: m.photoUri, description: m.description, tags: m.tags, eatenAt: m.eatenAt }); setSheetOpen(true); }}
              onDelete={(m) => { if (m.id) setDeleteId(m.id); else { /* item local */ queue.remove(m.key); } }}
            />
          </View>
        ) : null}
      </View>

      <MealFormSheet visible={sheetOpen} initial={editing} onClose={() => setSheetOpen(false)} onConfirm={handleConfirm} />
      <ConfirmDialog visible={deleteId !== null} title="Excluir refeição" message="Esta ação não pode ser desfeita." confirmLabel="Excluir" tone="destructive" loading={del.isPending} onConfirm={confirmDelete} onCancel={() => setDeleteId(null)} />
    </SafeAreaView>
  );
}

// Feed rolável com agrupamento por dia (extraído p/ manter o componente pai enxuto).
function RefreshableFeed({ groups, refreshing, onRefresh, onEdit, onDelete }: {
  groups: ReturnType<typeof groupFeedByDay>;
  refreshing: boolean;
  onRefresh: () => void;
  onEdit: (m: FeedMeal) => void;
  onDelete: (m: FeedMeal) => void;
}) {
  const { ScrollView } = require('react-native') as typeof import('react-native');
  return (
    <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.neon} colors={[colors.neon]} />}>
      {groups.map((g) => (
        <View key={g.dateKey} style={styles.day}>
          <AppText variant="eyebrow" color="tertiary">{g.dayLabel}</AppText>
          {g.meals.map((m) => (
            <MealCard key={m.key} meal={m} onEdit={() => onEdit(m)} onDelete={() => onDelete(m)} />
          ))}
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create((theme) => ({
  safe: { flex: 1, backgroundColor: theme.colors.bgBase },
  flex: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing.md, paddingHorizontal: theme.spacing.lg, paddingVertical: theme.spacing.md },
  back: { width: 32, height: 32, alignItems: 'center', justifyContent: 'center' },
  headerText: { flex: 1, gap: theme.spacing.xs },
  addBtn: { width: 44, height: 44, borderRadius: theme.radius.pill, backgroundColor: theme.colors.neon, alignItems: 'center', justifyContent: 'center' },
  scrollWrap: { flex: 1 },
  content: { paddingHorizontal: theme.spacing.lg, paddingTop: theme.spacing.sm, paddingBottom: theme.spacing.xl },
  day: { gap: theme.spacing.sm, marginTop: theme.spacing.lg },
}));
```

Nota ao executor: se o padrão `require('react-native')` para `ScrollView` destoar do lint do projeto, importar `ScrollView` normalmente no topo (import estático) — foi inline só para deixar o `RefreshableFeed` autocontido. Preferir import estático.

- [ ] **Step 2: Typecheck**

Run: `cd app && npm run typecheck`
Expected: sem erros (ajustar import de `ScrollView` para estático).

- [ ] **Step 3: Commit**

```bash
git add "app/app/(aluno)/alimentacao.tsx"
git commit -m "feat(app): tela do feed de refeicoes (TEC-62)"
```

---

### Task 8: Card de entrada na HOJE

**Files:**
- Create: `app/src/components/home/AlimentacaoCard.tsx`
- Modify: `app/src/components/home/index.ts`
- Modify: `app/app/(aluno)/(tabs)/index.tsx`

- [ ] **Step 1: Implementar o card**

Criar `app/src/components/home/AlimentacaoCard.tsx` (padrão do `DietCard`):

```tsx
import { Pressable, View } from 'react-native';
import { ForkKnife, CaretRight } from 'phosphor-react-native';
import { StyleSheet } from 'react-native-unistyles';

import { AppText } from '@/components/ui';
import { darkTheme } from '@/theme';

const { colors } = darkTheme;

export function AlimentacaoCard({ onPress }: { onPress: () => void }) {
  return (
    <Pressable accessibilityRole="button" accessibilityLabel="Alimentação" onPress={onPress} style={styles.card}>
      <View style={styles.icon}>
        <ForkKnife size={22} weight="duotone" color={colors.neon} />
      </View>
      <View style={styles.text}>
        <AppText variant="h4">Alimentação</AppText>
        <AppText variant="bodySm" color="tertiary">Registre o que comeu hoje</AppText>
      </View>
      <CaretRight size={18} weight="bold" color={colors.textTertiary} />
    </Pressable>
  );
}

const styles = StyleSheet.create((theme) => ({
  card: {
    flexDirection: 'row', alignItems: 'center', gap: theme.spacing.md,
    backgroundColor: theme.colors.surface1, borderWidth: 1, borderColor: theme.colors.outlineVariant,
    borderRadius: theme.radius.card, padding: theme.spacing.md,
  },
  icon: { width: 42, height: 42, borderRadius: theme.radius.thumb, backgroundColor: theme.colors.surface2, alignItems: 'center', justifyContent: 'center' },
  text: { flex: 1, gap: 2 },
}));
```

- [ ] **Step 2: Exportar no barrel**

Em `app/src/components/home/index.ts`, adicionar:

```ts
export { AlimentacaoCard } from './AlimentacaoCard';
```

- [ ] **Step 3: Renderizar na HOJE**

Em `app/app/(aluno)/(tabs)/index.tsx`:
- adicionar ao import de `@/components/home`: `AlimentacaoCard`.
- inserir a seção logo após o bloco de `DietCard`/`ChallengeCard` (antes do `noWorkoutYet`):

```tsx
          <View style={styles.section}>
            <AlimentacaoCard onPress={() => router.push('/(aluno)/alimentacao' as Href)} />
          </View>
```

- [ ] **Step 4: Typecheck + commit**

Run: `cd app && npm run typecheck`

```bash
git add app/src/components/home/AlimentacaoCard.tsx app/src/components/home/index.ts "app/app/(aluno)/(tabs)/index.tsx"
git commit -m "feat(app): card de Alimentacao na Home do aluno (TEC-62)"
```

---

### Task 9: Flush da fila offline no foreground

**Files:**
- Modify: `app/app/(aluno)/alimentacao.tsx`

- [ ] **Step 1: Adicionar o flush**

Na tela, adicionar uma função que percorre `queue.items` com status `pending`/`error`, chama `create.mutateAsync` para cada, e em sucesso `queue.remove(localId)` / em falha `queue.markError(localId)`. Disparar:
- ao montar a tela (após `hydrate`);
- no evento `AppState` `active`;
- no toque do badge de erro do `MealCard` (retry manual — passar `onRetry` opcional ao card ou reusar `onEdit`).

Código a inserir na `AlimentacaoScreen`:

```tsx
import { AppState } from 'react-native';
// ...
async function flushQueue() {
  const pend = Object.values(useMealQueueStore.getState().items);
  for (const q of pend) {
    try {
      useMealQueueStore.getState().markPending(q.localId);
      await create.mutateAsync({ photoUri: q.photoUri, description: q.description, tags: q.tags, eatenAt: q.eatenAt });
      useMealQueueStore.getState().remove(q.localId);
    } catch {
      useMealQueueStore.getState().markError(q.localId);
    }
  }
}

useEffect(() => {
  void (async () => { await queue.hydrate(); void flushQueue(); })();
  const sub = AppState.addEventListener('change', (s) => { if (s === 'active') void flushQueue(); });
  return () => sub.remove();
  // eslint-disable-next-line react-hooks/exhaustive-deps
}, []);
```

(Remover o `useEffect` de hydrate anterior da Task 7 para não duplicar — este o substitui.)

- [ ] **Step 2: Typecheck + commit**

Run: `cd app && npm run typecheck`

```bash
git add "app/app/(aluno)/alimentacao.tsx"
git commit -m "feat(app): flush da fila offline de refeicoes (TEC-62)"
```

---

### Task 10: Suíte completa + contrato de backend

**Files:**
- Create: `app/docs/backend/tec-62-meals-mobile.md`

- [ ] **Step 1: Rodar a suíte inteira**

Run: `cd app && npm run typecheck && npx jest`
Expected: sem erros de tipo; testes de meals passando. (Falhas pré-existentes de telas de treino, se houver, são independentes.)

- [ ] **Step 2: Lint**

Run: `cd app && npx eslint src/components/meals src/hooks/useMeals.ts src/lib/meals.ts src/store/mealQueueStore.ts src/types/meals.ts "app/(aluno)/alimentacao.tsx"`
Expected: sem erros.

- [ ] **Step 3: Escrever o contrato de backend**

Criar `app/docs/backend/tec-62-meals-mobile.md` com: endpoints `GET/POST/PATCH/DELETE /me/meals`, shape do multipart (photo, description, eaten_at, tags[]), coluna `tags text[]` em `meal_logs`, storage de imagem (S3/Supabase em prod), e push ao aluno no comentário do profissional. Referenciar `web/docs/backend/tec-58-alimentacao.md`.

- [ ] **Step 4: Commit**

```bash
git add app/docs/backend/tec-62-meals-mobile.md
git commit -m "docs(app): contrato de backend das refeicoes mobile (TEC-62)"
```

---

## Pós-implementação (fora do código do front)

- Atualizar TEC-62 no Linear: front concluído; anexar `tec-62-meals-mobile.md`; reatribuir a parte de backend (endpoints `/me/meals` + PATCH/DELETE + migration + storage) ao `julio.guerra.dev@gmail.com`.
- Rebuild do dev client não é necessário se `expo-image-picker` e `@react-native-community/datetimepicker` já estiverem no binário atual; caso contrário, sinalizar rebuild.
