import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import { create } from 'zustand';

// Gate LOCAL do onboarding pós-cadastro (uma flag por usuário).
// [local — sem endpoint; sinalizar persistência no /me quando o back expuser]
// Contas existentes não têm a flag → caem no onboarding uma vez (passos puláveis).
const KEY = 'actus.onboarding.done';
const isWeb = Platform.OS === 'web';

async function loadRaw(): Promise<string | null> {
  if (isWeb) return globalThis.localStorage?.getItem(KEY) ?? null;
  try {
    return await SecureStore.getItemAsync(KEY);
  } catch {
    return null;
  }
}

async function saveRaw(value: string): Promise<void> {
  if (isWeb) {
    globalThis.localStorage?.setItem(KEY, value);
    return;
  }
  try {
    await SecureStore.setItemAsync(KEY, value);
  } catch {
    // Gate local: falha de persistência não pode travar o app.
  }
}

interface OnboardingState {
  doneByUser: Record<string, boolean>;
  hydrated: boolean;
  hydrate: () => Promise<void>;
  markDone: (userId: string) => Promise<void>;
  isDone: (userId: string) => boolean;
}

export const useOnboardingStore = create<OnboardingState>((set, get) => ({
  doneByUser: {},
  hydrated: false,
  hydrate: async () => {
    if (get().hydrated) return;
    let map: Record<string, boolean> = {};
    try {
      map = JSON.parse((await loadRaw()) ?? '{}') as Record<string, boolean>;
    } catch {
      map = {};
    }
    set({ doneByUser: map, hydrated: true });
  },
  markDone: async (userId) => {
    const next = { ...get().doneByUser, [userId]: true };
    set({ doneByUser: next });
    await saveRaw(JSON.stringify(next));
  },
  isDone: (userId) => get().doneByUser[userId] === true,
}));
