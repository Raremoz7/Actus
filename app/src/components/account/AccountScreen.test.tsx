import { render, screen } from '@testing-library/react-native';
import { AccountScreen } from './AccountScreen';

// Os hooks de dados dependem de QueryClientProvider/store; aqui mockamos para
// um render determinístico. A tela degrada com data undefined.
// Prefixo `mock` é exigido pelo hoisting do jest.mock.
const mockLogout = jest.fn();

jest.mock('@/hooks/useMe', () => ({
  useMe: () => ({ data: { id: 'x', tipo: 'aluno', display_name: 'Davi' } }),
}));
jest.mock('@/hooks/useWeeklyOverview', () => ({
  useWeeklyOverview: () => ({ data: { streak_current: 7, streak_best: 21 } }),
}));
jest.mock('@/features/auth/hooks', () => ({
  useLogoutMutation: () => ({ mutate: mockLogout }),
}));
jest.mock('expo-router', () => ({
  router: { push: jest.fn() },
}));

describe('AccountScreen', () => {
  it('renderiza e mostra a ação Sair', () => {
    render(<AccountScreen showStreak />);
    expect(screen.getByText('Sair')).toBeTruthy();
  });
});
