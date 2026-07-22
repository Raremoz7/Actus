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
jest.mock('@/navigation', () => ({
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
    render(<AccountScreen showStreak />);

    // Toque no item "Sair" só abre o diálogo de confirmação — não desloga direto.
    fireEvent.press(screen.getByText('Sair'));
    expect(mockLogout).not.toHaveBeenCalled();
    expect(screen.getByText('Você precisará entrar de novo para continuar.')).toBeTruthy();

    // Confirmar no diálogo (o "Sair" do botão, último na árvore) dispara o logout.
    const sairLabels = screen.getAllByText('Sair');
    fireEvent.press(sairLabels[sairLabels.length - 1]);
    expect(mockLogout).toHaveBeenCalledTimes(1);
  });
});
