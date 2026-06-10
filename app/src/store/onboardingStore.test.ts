jest.mock('expo-secure-store', () => {
  const store = new Map<string, string>();
  return {
    getItemAsync: jest.fn(async (k: string) => store.get(k) ?? null),
    setItemAsync: jest.fn(async (k: string, v: string) => void store.set(k, v)),
    deleteItemAsync: jest.fn(async (k: string) => void store.delete(k)),
  };
});

import { useOnboardingStore } from './onboardingStore';

describe('onboardingStore', () => {
  it('pendente por padrão; markDone persiste e isDone reflete', async () => {
    await useOnboardingStore.getState().hydrate();
    expect(useOnboardingStore.getState().isDone('u1')).toBe(false);
    await useOnboardingStore.getState().markDone('u1');
    expect(useOnboardingStore.getState().isDone('u1')).toBe(true);
    // Re-hidrata do zero (simula reabrir o app).
    useOnboardingStore.setState({ doneByUser: {}, hydrated: false });
    await useOnboardingStore.getState().hydrate();
    expect(useOnboardingStore.getState().isDone('u1')).toBe(true);
  });
});
