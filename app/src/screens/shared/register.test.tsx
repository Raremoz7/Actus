import { render } from '@testing-library/react-native';

const mockReplace = jest.fn();
let mockParams: Record<string, string | string[] | undefined> = {};
jest.mock('@/navigation', () => ({
  router: { replace: (...a: unknown[]) => mockReplace(...a) },
  useLocalSearchParams: () => mockParams,
}));
// SVG sob jest-expo vira asset numérico/objeto → mocka o Logo (verificado).
jest.mock('@/components/ui/Logo', () => ({ Logo: () => null }));

import RegisterDeepLink from './register';
import { useAuthStore } from '@/store/authStore';
import { useCadastroDraftStore } from '@/store/cadastroDraftStore';

describe('register deep link', () => {
  beforeEach(() => {
    mockReplace.mockClear();
    mockParams = {};
    useCadastroDraftStore.getState().clear();
  });

  it('deslogado: grava o code no draft e vai pra conta', () => {
    useAuthStore.setState({ status: 'unauthenticated', user: null });
    mockParams = { code: 'ABC123' };
    render(<RegisterDeepLink />);
    expect(useCadastroDraftStore.getState().inviteCode).toBe('ABC123');
    expect(mockReplace).toHaveBeenCalledWith('/(auth)/cadastro');
  });

  it('autenticado com code: vai para usar-convite preservando o código', () => {
    useAuthStore.setState({
      status: 'authenticated',
      user: { id: 'u1', tipo: 'aluno' } as never,
    });
    mockParams = { code: 'ABC123' };
    render(<RegisterDeepLink />);
    expect(mockReplace).toHaveBeenCalledWith('/usar-convite?code=ABC123');
  });

  it('autenticado sem code: volta pro dispatch', () => {
    useAuthStore.setState({
      status: 'authenticated',
      user: { id: 'u1', tipo: 'aluno' } as never,
    });
    render(<RegisterDeepLink />);
    expect(mockReplace).toHaveBeenCalledWith('/');
  });

  it('must_change_password: vai pro gate de senha (não perde a sessão)', () => {
    useAuthStore.setState({ status: 'must_change_password', user: null });
    mockParams = { code: 'ABC123' };
    render(<RegisterDeepLink />);
    expect(mockReplace).toHaveBeenCalledWith('/(auth)/trocar-senha');
  });

  it('hydrating: espera (não navega)', () => {
    useAuthStore.setState({ status: 'hydrating', user: null });
    mockParams = { code: 'ABC123' };
    render(<RegisterDeepLink />);
    expect(mockReplace).not.toHaveBeenCalled();
  });
});
