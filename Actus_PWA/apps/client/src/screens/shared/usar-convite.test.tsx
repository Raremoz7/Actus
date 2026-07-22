import { render, screen, fireEvent } from '@testing-library/react-native';

const mockMutate = jest.fn();
jest.mock('@/hooks/useConsumeInvite', () => ({
  useConsumeInvite: () => ({ mutate: mockMutate, isPending: false }),
}));
// useLogoutMutation real exige QueryClientProvider — mock padrão do repo.
jest.mock('@/features/auth/hooks', () => ({
  useLogoutMutation: () => ({ mutate: jest.fn(), isPending: false }),
}));

const mockReplace = jest.fn();
let mockParams: Record<string, string | undefined> = {};
jest.mock('@/navigation', () => ({
  router: {
    replace: (...a: unknown[]) => mockReplace(...a),
    back: jest.fn(),
    push: jest.fn(),
    canGoBack: () => false,
  },
  useLocalSearchParams: () => mockParams,
  Redirect: () => null,
}));

import UsarConviteScreen from './usar-convite';
import { useAuthStore } from '@/store/authStore';

function setUser(tipo: string | null) {
  useAuthStore.setState({
    status: tipo ? 'authenticated' : 'unauthenticated',
    user: tipo ? ({ id: 'u1', tipo } as never) : null,
  });
}

type ConsumeCallbacks = {
  onSuccess?: (r: unknown) => void;
  onError?: (e: unknown) => void;
};

describe('usar-convite', () => {
  beforeEach(() => {
    mockMutate.mockReset();
    mockParams = {};
  });

  it('aluno com code confirma e vê o sucesso (vínculo criado)', () => {
    setUser('aluno');
    mockParams = { code: 'ACTUSDEMO' };
    mockMutate.mockImplementation((_code: string, cb: ConsumeCallbacks) => {
      cb.onSuccess?.({ ok: true, professional_id: 'p1', professional_role: 'personal' });
    });
    render(<UsarConviteScreen />);
    fireEvent.press(screen.getByText('Confirmar vínculo'));
    expect(screen.getByText('Vínculo criado')).toBeTruthy();
  });

  it('already_linked mostra o estado próprio', () => {
    setUser('aluno');
    mockParams = { code: 'ACTUSDEMO' };
    mockMutate.mockImplementation((_code: string, cb: ConsumeCallbacks) => {
      cb.onSuccess?.({
        ok: true,
        professional_id: 'p1',
        professional_role: 'personal',
        note: 'already_linked',
      });
    });
    render(<UsarConviteScreen />);
    fireEvent.press(screen.getByText('Confirmar vínculo'));
    expect(screen.getByText(/já está vinculado/i)).toBeTruthy();
  });

  it('profissional logado vê o aviso (guard de tipo)', () => {
    setUser('personal');
    render(<UsarConviteScreen />);
    expect(screen.getByText(/Convites são para alunos/i)).toBeTruthy();
    expect(screen.queryByText('Confirmar vínculo')).toBeNull();
  });

  it('aluno sem code vê o input do código', () => {
    setUser('aluno');
    render(<UsarConviteScreen />);
    expect(screen.getByLabelText('Código do convite')).toBeTruthy();
  });
});
