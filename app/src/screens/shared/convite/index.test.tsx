import { Share } from 'react-native';
import { fireEvent, render, screen } from '@testing-library/react-native';

import ConvitesScreen from './index';

// Hooks de dados dependem de QueryClientProvider/store; mockamos para um render
// determinístico. Prefixo `mock` é exigido pelo hoisting do jest.mock.
const mockUseInvites = jest.fn();
const mockRevoke = jest.fn();
const mockPush = jest.fn();
const mockBack = jest.fn();
const mockSetString = jest.fn();

jest.mock('@/hooks/useInvites', () => ({
  useInvites: () => mockUseInvites(),
}));
jest.mock('@/hooks/useInviteActions', () => ({
  useInviteActions: () => ({ revoke: { mutate: mockRevoke } }),
}));
jest.mock('@/navigation', () => ({
  router: {
    push: (...args: unknown[]) => mockPush(...args),
    back: () => mockBack(),
    canGoBack: () => true,
    replace: () => {},
  },
}));
jest.mock('@react-native-clipboard/clipboard', () => ({
  default: { setString: (...args: unknown[]) => mockSetString(...args) },
}));

// expires_at bem no futuro para um rótulo de validade estável ("expira em N dias").
const farFuture = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

const invites = [
  {
    id: '11111111-1111-1111-1111-111111111111',
    code: 'ABC123',
    expires_at: farFuture,
    max_uses: 5,
    used_count: 1,
    created_at: '2026-06-01T12:00:00.000Z',
    active: true,
  },
];

beforeEach(() => {
  mockUseInvites.mockReset();
  mockRevoke.mockReset();
  mockPush.mockReset();
  mockBack.mockReset();
  mockSetString.mockReset();
});

describe('ConvitesScreen', () => {
  it('lista os convites com código', () => {
    mockUseInvites.mockReturnValue({
      data: { invites },
      isLoading: false,
      isError: false,
    });
    render(<ConvitesScreen />);
    expect(screen.getByText('ABC123')).toBeTruthy();
  });

  it('navega para /convite/novo pelo botão Novo convite (header)', () => {
    mockUseInvites.mockReturnValue({
      data: { invites },
      isLoading: false,
      isError: false,
    });
    render(<ConvitesScreen />);
    // Header e CTA de rodapé expõem o mesmo label (o Button ganhou accessibilityLabel);
    // o primeiro na árvore é o do header — ambos navegam para /convite/novo.
    fireEvent.press(screen.getAllByLabelText('Novo convite')[0]!);
    expect(mockPush).toHaveBeenCalledWith('/convite/novo');
  });

  it('copia apenas o código do convite ao tocar em Copiar (TEC-69)', () => {
    mockUseInvites.mockReturnValue({
      data: { invites },
      isLoading: false,
      isError: false,
    });
    render(<ConvitesScreen />);
    fireEvent.press(screen.getByLabelText('Copiar código do convite'));
    expect(mockSetString).toHaveBeenCalledWith('ABC123');
  });

  it('compartilha a mensagem ao tocar em Compartilhar', () => {
    const shareSpy = jest.spyOn(Share, 'share').mockResolvedValue({} as never);
    mockUseInvites.mockReturnValue({
      data: { invites },
      isLoading: false,
      isError: false,
    });
    render(<ConvitesScreen />);
    fireEvent.press(screen.getByLabelText('Compartilhar convite'));
    expect(shareSpy).toHaveBeenCalledWith({
      message: 'Seu acesso ao Actus: actus://register?code=ABC123',
    });
    shareSpy.mockRestore();
  });

  it('revoga via ConfirmDialog do app ao confirmar (TEC-70)', () => {
    mockUseInvites.mockReturnValue({
      data: { invites },
      isLoading: false,
      isError: false,
    });
    render(<ConvitesScreen />);
    // 1) toca no ícone de revogar → abre o diálogo de confirmação do app.
    fireEvent.press(screen.getByLabelText('Revogar convite'));
    // 2) confirma no botão "Revogar" do diálogo (não é o Alert nativo).
    fireEvent.press(screen.getByText('Revogar'));
    expect(mockRevoke).toHaveBeenCalledWith(
      '11111111-1111-1111-1111-111111111111',
      expect.any(Object),
    );
  });

  it('mostra estado vazio quando não há convites', () => {
    mockUseInvites.mockReturnValue({
      data: { invites: [] },
      isLoading: false,
      isError: false,
    });
    render(<ConvitesScreen />);
    expect(screen.getByText('Nenhum convite ainda')).toBeTruthy();
  });

  it('mostra estado de erro discreto', () => {
    mockUseInvites.mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: true,
    });
    render(<ConvitesScreen />);
    expect(screen.getByText('Não foi possível carregar')).toBeTruthy();
    expect(screen.getByText('Tentar de novo')).toBeTruthy();
  });
});
