import { render, screen, fireEvent, waitFor } from '@testing-library/react-native';

jest.mock('expo-secure-store', () => ({
  getItemAsync: jest.fn(async () => null),
  setItemAsync: jest.fn(async () => undefined),
  deleteItemAsync: jest.fn(async () => undefined),
}));
const mockPush = jest.fn();
jest.mock('expo-router', () => ({
  router: { push: (...a: unknown[]) => mockPush(...a), replace: jest.fn() },
}));

import PerfilProfissionalScreen from './perfil';
import { useAuthStore } from '@/store/authStore';
import { useProfessionalProfileMock } from '@/mocks/professionalProfile';

describe('onboarding professor — perfil', () => {
  beforeEach(() => {
    mockPush.mockClear();
    useAuthStore.setState({
      status: 'authenticated',
      user: { id: 'prof-1', tipo: 'personal' } as never,
    });
    useProfessionalProfileMock.setState({ byUser: {}, hydrated: true });
  });

  it('exige nome + área; grava e avança', async () => {
    render(<PerfilProfissionalScreen />);
    const cta = screen.getByLabelText('Continuar');
    expect(cta.props.accessibilityState?.disabled).toBe(true);

    fireEvent.changeText(screen.getByLabelText('Nome profissional'), 'João Personal');
    fireEvent.press(screen.getByText('Musculação'));
    fireEvent.press(screen.getByText('Continuar'));

    await waitFor(() => {
      expect(
        useProfessionalProfileMock.getState().byUser['prof-1']?.nome_profissional,
      ).toBe('João Personal');
    });
    expect(mockPush).toHaveBeenCalledWith('/onboarding-professor/forma-uso');
  });
});
