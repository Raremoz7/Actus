// src/mocks/parq.test.ts
import { useParqMock, submitParq } from './parq';
import type { ParqAnswer } from '@/types/parq';

// Mock de SecureStore em memória (o store persiste via expo-secure-store).
jest.mock('expo-secure-store', () => {
  const store = new Map<string, string>();
  return {
    getItemAsync: jest.fn(async (k: string) => store.get(k) ?? null),
    setItemAsync: jest.fn(async (k: string, v: string) => void store.set(k, v)),
    deleteItemAsync: jest.fn(async (k: string) => void store.delete(k)),
  };
});

function answers(yesIds: number[] = []): ParqAnswer[] {
  return [1, 2, 3, 4, 5, 6, 7].map((id) => ({ question_id: id, value: yesIds.includes(id) }));
}

describe('mock parq store', () => {
  it('guarda e lê a submissão por aluno', async () => {
    const sub = await submitParq('aluno-1', answers([2]));
    expect(sub.any_yes).toBe(true);
    expect(useParqMock.getState().byStudent['aluno-1']?.any_yes).toBe(true);
  });

  it('hydrate carrega o que foi persistido', async () => {
    await submitParq('aluno-2', answers());
    // Zera o estado em memória e re-hidrata do SecureStore.
    useParqMock.setState({ byStudent: {}, hydrated: false });
    await useParqMock.getState().hydrate();
    expect(useParqMock.getState().byStudent['aluno-2']).toBeTruthy();
  });

  it('submit em store frio NÃO apaga submissões persistidas de outros alunos', async () => {
    // aluno-1 e aluno-2 já estão no "disco" (testes acima). Esfria o store em memória
    // (cold start: deep link direto na tela do Par-Q, nada hidratou ainda)…
    useParqMock.setState({ byStudent: {}, hydrated: false });
    // …e o submit de um terceiro aluno deve hidratar antes de persistir por cima.
    await submitParq('aluno-3', answers([1]));

    const map = useParqMock.getState().byStudent;
    expect(map['aluno-3']?.any_yes).toBe(true);
    expect(map['aluno-1']).toBeTruthy();
    expect(map['aluno-2']).toBeTruthy();

    // E o que foi salvo no disco também contém os três.
    useParqMock.setState({ byStudent: {}, hydrated: false });
    await useParqMock.getState().hydrate();
    const rehydrated = useParqMock.getState().byStudent;
    expect(Object.keys(rehydrated).sort()).toEqual(['aluno-1', 'aluno-2', 'aluno-3']);
  });
});
