import { render, screen, fireEvent, waitFor } from '@testing-library/react-native';

import InteresseScreen from './interesse';
import { useAuthStore } from '@/store/authStore';
import { useStudentOnboardingMock } from '@/mocks/studentOnboarding';

jest.mock('expo-secure-store', () => ({
  getItemAsync: jest.fn(async () => null),
  setItemAsync: jest.fn(async () => undefined),
  deleteItemAsync: jest.fn(async () => undefined),
}));
const mockPush = jest.fn();
jest.mock('expo-router', () => ({
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

  it('CTA travado até escolher; escolha grava e avança', async () => {
    render(<InteresseScreen />);
    const cta = screen.getByLabelText('Continuar');
    expect(cta.props.accessibilityState?.disabled).toBe(true);

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
