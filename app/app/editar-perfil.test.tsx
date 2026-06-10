import { fireEvent, render, screen } from '@testing-library/react-native';

import EditarPerfilScreen from './editar-perfil';

// Hooks de dados dependem de QueryClientProvider/store; mockamos para um render
// determinístico. Prefixo `mock` é exigido pelo hoisting do jest.mock.
const mockMutate = jest.fn();
const mockBack = jest.fn();

// Perfil rico vindo de GET /me/profile (useMyProfile) — pré-preenche a tela.
jest.mock('@/hooks/useMyProfile', () => ({
  useMyProfile: () => ({
    data: {
      id: 'x',
      tipo: 'aluno',
      display_name: 'Davi',
      avatar_url: null,
      timezone: 'America/Sao_Paulo',
      full_name: 'Davi Machado',
      phone: '+5531999998888',
      gender: 'masculino',
      body_weight_kg: 80,
      birth_date: '2000-01-15',
    },
  }),
}));
jest.mock('@/hooks/usePatchMe', () => ({
  usePatchMe: () => ({ mutate: mockMutate, isPending: false }),
}));
jest.mock('@/hooks/useUploadAvatar', () => ({
  useUploadAvatar: () => ({ mutate: jest.fn(), isPending: false }),
}));
jest.mock('expo-image-picker', () => ({
  requestMediaLibraryPermissionsAsync: jest.fn(async () => ({ granted: true })),
  launchImageLibraryAsync: jest.fn(async () => ({ canceled: true })),
}));
jest.mock('expo-router', () => ({
  router: { back: () => mockBack(), canGoBack: () => true, replace: () => {} },
}));

describe('EditarPerfilScreen', () => {
  beforeEach(() => {
    mockMutate.mockClear();
    mockBack.mockClear();
  });

  it('pré-preenche os campos vindos de GET /me/profile', () => {
    render(<EditarPerfilScreen />);
    expect(screen.getByDisplayValue('Davi')).toBeTruthy();
    expect(screen.getByDisplayValue('Davi Machado')).toBeTruthy();
    expect(screen.getByDisplayValue('+5531999998888')).toBeTruthy();
    expect(screen.getByDisplayValue('80')).toBeTruthy();
  });

  it('não dispara mutação quando nada mudou (Salvar sem alterações)', () => {
    render(<EditarPerfilScreen />);
    fireEvent.press(screen.getByText('Salvar'));
    expect(mockMutate).not.toHaveBeenCalled();
  });

  it('envia apenas o campo alterado ao salvar', () => {
    render(<EditarPerfilScreen />);

    // Só o peso muda; os demais permanecem iguais ao perfil → não entram no body.
    fireEvent.changeText(screen.getByLabelText('Peso em quilos'), '82.5');
    fireEvent.press(screen.getByText('Salvar'));

    expect(mockMutate).toHaveBeenCalledTimes(1);
    const [body] = mockMutate.mock.calls[0];
    expect(body).toEqual({ body_weight_kg: 82.5 });
  });
});
