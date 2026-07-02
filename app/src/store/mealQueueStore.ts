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
