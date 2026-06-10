jest.mock('expo-secure-store', () => {
  const store = new Map<string, string>();
  return {
    getItemAsync: jest.fn(async (k: string) => store.get(k) ?? null),
    setItemAsync: jest.fn(async (k: string, v: string) => void store.set(k, v)),
    deleteItemAsync: jest.fn(async (k: string) => void store.delete(k)),
  };
});

import { useStudentOnboardingMock, saveStudentAnswers } from './studentOnboarding';

describe('studentOnboarding mock', () => {
  it('grava respostas parciais por aluno e persiste', async () => {
    await saveStudentAnswers('aluno-1', { interesse: 'hipertrofia' });
    await saveStudentAnswers('aluno-1', { dias_semana: '3', local: 'academia' });
    const a = useStudentOnboardingMock.getState().byStudent['aluno-1'];
    expect(a?.interesse).toBe('hipertrofia');
    expect(a?.dias_semana).toBe('3');
    useStudentOnboardingMock.setState({ byStudent: {}, hydrated: false });
    await useStudentOnboardingMock.getState().hydrate();
    expect(useStudentOnboardingMock.getState().byStudent['aluno-1']?.local).toBe('academia');
  });
});
