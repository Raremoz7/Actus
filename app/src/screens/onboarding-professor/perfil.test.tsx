import { render, screen, fireEvent, waitFor } from '@testing-library/react-native';

import PerfilProfissionalScreen from './perfil';
import { useAuthStore } from '@/store/authStore';
import { saveProfessionalProfile } from '@/api/professionalProfile';

jest.mock('@/lib/secureStorage', () => ({
  getItemAsync: jest.fn(async () => null),
  setItemAsync: jest.fn(async () => undefined),
  deleteItemAsync: jest.fn(async () => undefined),
}));

// Mantém schemas/labels reais (a tela usa AREA_LABEL/AreaAtuacaoSchema); só o save vira spy.
jest.mock('@/api/professionalProfile', () => {
  const actual = jest.requireActual('@/api/professionalProfile');
  return { __esModule: true, ...actual, saveProfessionalProfile: jest.fn(async () => undefined) };
});

const mockPush = jest.fn();
jest.mock('@/navigation', () => ({
  router: { push: (...a: unknown[]) => mockPush(...a), replace: jest.fn() },
}));

describe('onboarding professor — perfil', () => {
  beforeEach(() => {
    mockPush.mockClear();
    (saveProfessionalProfile as jest.Mock).mockClear();
    useAuthStore.setState({
      status: 'authenticated',
      user: { id: 'prof-1', tipo: 'personal' } as never,
    });
  });

  it('sinaliza campos obrigatórios ao tentar avançar; grava e avança quando preenchido (TEC-74)', async () => {
    render(<PerfilProfissionalScreen />);
    const cta = screen.getByLabelText('Continuar');
    // Botão habilitado — a sinalização vem ao tentar avançar.
    expect(cta.props.accessibilityState?.disabled).toBe(false);

    // Tenta avançar vazio → sinaliza os dois campos obrigatórios e não avança.
    fireEvent.press(screen.getByText('Continuar'));
    expect(screen.getByText('Informe seu nome profissional.')).toBeTruthy();
    expect(screen.getByText('Selecione sua área de atuação.')).toBeTruthy();
    expect(mockPush).not.toHaveBeenCalled();

    fireEvent.changeText(
      screen.getByLabelText('Nome profissional. erro: Informe seu nome profissional.'),
      'João Personal',
    );
    // Abre o dropdown de área antes de escolher a opção.
    fireEvent.press(screen.getByLabelText('Selecionar área de atuação'));
    fireEvent.press(screen.getByText('Musculação'));
    fireEvent.press(screen.getByText('Continuar'));

    await waitFor(() => {
      expect(saveProfessionalProfile).toHaveBeenCalledWith(
        expect.objectContaining({ nome_profissional: 'João Personal', area: 'musculacao' }),
      );
    });
    expect(mockPush).toHaveBeenCalledWith('/onboarding-professor/forma-uso');
  });
});
