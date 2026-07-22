import { render, screen, fireEvent, waitFor } from '@testing-library/react-native';

import InteresseScreen from './interesse';
import { useAuthStore } from '@/store/authStore';
import { useStudentOnboardingMock } from '@/mocks/studentOnboarding';

jest.mock('@/lib/secureStorage', () => ({
  getItemAsync: jest.fn(async () => null),
  setItemAsync: jest.fn(async () => undefined),
  deleteItemAsync: jest.fn(async () => undefined),
}));
const mockPush = jest.fn();
jest.mock('@/navigation', () => ({
  router: { push: (...a: unknown[]) => mockPush(...a), replace: jest.fn() },
}));

describe('onboarding aluno — quiz', () => {
  beforeEach(() => {
    mockPush.mockClear();
    useAuthStore.setState({
      status: 'authenticated',
      user: { id: 'aluno-1', tipo: 'aluno' } as never,
    });
    useStudentOnboardingMock.setState({ byStudent: {}, hydrated: true });
  });

  it('sinaliza escolha pendente ao tentar avançar; escolha grava e avança (TEC-74)', async () => {
    render(<InteresseScreen />);
    const cta = screen.getByLabelText('Continuar');
    // Botão habilitado — a sinalização vem ao tentar avançar, não por desabilitar.
    expect(cta.props.accessibilityState?.disabled).toBe(false);

    // Tocar sem escolher mostra o erro e não avança.
    fireEvent.press(screen.getByText('Continuar'));
    expect(screen.getByText('Escolha uma opção para continuar.')).toBeTruthy();
    expect(mockPush).not.toHaveBeenCalled();

    fireEvent.press(screen.getByText('Hipertrofia'));
    fireEvent.press(screen.getByText('Continuar'));

    await waitFor(() => {
      expect(useStudentOnboardingMock.getState().byStudent['aluno-1']?.interesse).toBe(
        'hipertrofia',
      );
    });
    expect(mockPush).toHaveBeenCalledWith('/onboarding-aluno/experiencia');
  });
});
