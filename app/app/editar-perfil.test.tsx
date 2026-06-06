import { fireEvent, render, screen } from '@testing-library/react-native';

import EditarPerfilScreen from './editar-perfil';

// Hooks de dados dependem de QueryClientProvider/store; mockamos para um render
// determinístico. Prefixo `mock` é exigido pelo hoisting do jest.mock.
const mockMutate = jest.fn();
const mockBack = jest.fn();

jest.mock('@/hooks/useMe', () => ({
  useMe: () => ({ data: { id: 'x', tipo: 'aluno', display_name: 'Davi' } }),
}));
jest.mock('@/hooks/usePatchMe', () => ({
  usePatchMe: () => ({ mutate: mockMutate, isPending: false }),
}));
jest.mock('expo-router', () => ({
  router: { back: () => mockBack(), canGoBack: () => true, replace: () => {} },
}));

describe('EditarPerfilScreen', () => {
  beforeEach(() => {
    mockMutate.mockClear();
    mockBack.mockClear();
  });

  it('pré-preenche o nome de exibição vindo de /me', () => {
    render(<EditarPerfilScreen />);
    expect(screen.getByDisplayValue('Davi')).toBeTruthy();
  });

  it('não dispara mutação quando nada mudou (Salvar desabilitado)', () => {
    render(<EditarPerfilScreen />);
    fireEvent.press(screen.getByText('Salvar'));
    expect(mockMutate).not.toHaveBeenCalled();
  });

  it('envia apenas os campos preenchidos ao salvar', () => {
    render(<EditarPerfilScreen />);

    fireEvent.changeText(screen.getByLabelText('Nome completo'), 'Davi Machado');
    fireEvent.changeText(screen.getByLabelText('Peso em quilos'), '82.5');

    fireEvent.press(screen.getByText('Salvar'));

    expect(mockMutate).toHaveBeenCalledTimes(1);
    const [body] = mockMutate.mock.calls[0];
    // display_name intocado (igual ao remoto) não entra no body.
    expect(body).toEqual({ full_name: 'Davi Machado', body_weight_kg: 82.5 });
  });
});
