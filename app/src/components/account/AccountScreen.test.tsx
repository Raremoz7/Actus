import { Alert } from 'react-native';
import { fireEvent, render, screen } from '@testing-library/react-native';
import { AccountScreen } from './AccountScreen';

// Os hooks de dados dependem de QueryClientProvider/store; aqui mockamos para
// um render determinístico. A tela degrada com data undefined.
// Prefixo `mock` é exigido pelo hoisting do jest.mock.
const mockLogout = jest.fn();

jest.mock('@/hooks/useMyProfile', () => ({
  useMyProfile: () => ({ data: { id: 'x', tipo: 'aluno', display_name: 'Davi', avatar_url: null } }),
}));
jest.mock('@/hooks/useMe', () => ({
  useMe: () => ({ data: { id: 'x', tipo: 'aluno', display_name: 'Davi' } }),
}));
jest.mock('@/hooks/useWeeklyOverview', () => ({
  useWeeklyOverview: () => ({ data: { streak_current: 7, streak_best: 21 } }),
}));
jest.mock('@/features/auth/hooks', () => ({
  useLogoutMutation: () => ({ mutate: mockLogout, isPending: false }),
}));
jest.mock('expo-router', () => ({
  router: { push: jest.fn() },
}));

describe('AccountScreen', () => {
  it('renderiza e mostra a ação Sair', () => {
    render(<AccountScreen showStreak />);
    expect(screen.getByText('Sair')).toBeTruthy();
  });

  it('sinaliza itens indisponíveis como "em breve" em vez de navegação morta', () => {
    render(<AccountScreen showStreak />);
    // Duas linhas mock (Notificações, Termos & privacidade) usam a eyebrow "em breve".
    expect(screen.getAllByText('em breve')).toHaveLength(2);
  });

  it('confirma antes de sair, sem deslogar direto', () => {
    const alertSpy = jest.spyOn(Alert, 'alert');
    render(<AccountScreen showStreak />);

    fireEvent.press(screen.getByText('Sair'));
    expect(alertSpy).toHaveBeenCalledTimes(1);
    // Logout só dispara via callback de confirmação, não no toque direto.
    expect(mockLogout).not.toHaveBeenCalled();
    alertSpy.mockRestore();
  });
});
