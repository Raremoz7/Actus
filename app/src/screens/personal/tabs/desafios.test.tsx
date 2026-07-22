import { fireEvent, render, screen } from '@testing-library/react-native';

import PersonalDesafiosScreen from './desafios';

// useProChallenges depende de QueryClientProvider/store; mockamos para render
// determinístico. Prefixo `mock` é exigido pelo hoisting do jest.mock.
const mockUseProChallenges = jest.fn();
const mockPush = jest.fn();

jest.mock('@/hooks/useProChallenges', () => ({
  useProChallenges: () => mockUseProChallenges(),
}));
jest.mock('@/navigation', () => ({
  router: { push: (...args: unknown[]) => mockPush(...args) },
}));

const challenges = [
  {
    id: '11111111-1111-1111-1111-111111111111',
    owner_professional_id: '99999999-9999-9999-9999-999999999999',
    name: 'Janeiro sem falta',
    starts_on: '2026-01-01',
    ends_on: '2026-01-31',
    visibility: 'public_among_participants',
    status: 'active',
    created_at: '2025-12-20T12:00:00.000Z',
    updated_at: '2025-12-20T12:00:00.000Z',
  },
  {
    id: '22222222-2222-2222-2222-222222222222',
    owner_professional_id: '99999999-9999-9999-9999-999999999999',
    name: 'Verão fit',
    starts_on: '2026-02-01',
    ends_on: '2026-02-28',
    visibility: 'private_ranking',
    status: 'draft',
    created_at: '2025-12-21T12:00:00.000Z',
    updated_at: '2025-12-21T12:00:00.000Z',
  },
];

beforeEach(() => {
  mockUseProChallenges.mockReset();
  mockPush.mockReset();
});

describe('PersonalDesafiosScreen', () => {
  it('lista os desafios com nome, período e status', () => {
    mockUseProChallenges.mockReturnValue({
      data: { challenges },
      isLoading: false,
      isError: false,
    });
    render(<PersonalDesafiosScreen />);
    expect(screen.getByText('Janeiro sem falta')).toBeTruthy();
    expect(screen.getByText('01/01 – 31/01')).toBeTruthy();
    expect(screen.getByText('Ativo')).toBeTruthy();
    expect(screen.getByText('Verão fit')).toBeTruthy();
    expect(screen.getByText('Rascunho')).toBeTruthy();
    expect(screen.getByText('2 desafios')).toBeTruthy();
  });

  it('abre o form de criação pelo botão Novo desafio', () => {
    mockUseProChallenges.mockReturnValue({
      data: { challenges },
      isLoading: false,
      isError: false,
    });
    render(<PersonalDesafiosScreen />);
    fireEvent.press(screen.getByText('Novo desafio'));
    expect(mockPush).toHaveBeenCalledWith('/criar-desafio');
  });

  it('abre o detalhe ao tocar num desafio', () => {
    mockUseProChallenges.mockReturnValue({
      data: { challenges },
      isLoading: false,
      isError: false,
    });
    render(<PersonalDesafiosScreen />);
    fireEvent.press(screen.getByText('Janeiro sem falta'));
    expect(mockPush).toHaveBeenCalledWith(
      '/desafio-pro/11111111-1111-1111-1111-111111111111',
    );
  });

  it('mostra estado vazio quando não há desafios', () => {
    mockUseProChallenges.mockReturnValue({
      data: { challenges: [] },
      isLoading: false,
      isError: false,
    });
    render(<PersonalDesafiosScreen />);
    expect(screen.getByText('Nenhum desafio ainda')).toBeTruthy();
  });

  it('mostra estado de erro discreto', () => {
    mockUseProChallenges.mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: true,
    });
    render(<PersonalDesafiosScreen />);
    expect(screen.getByText('Não foi possível carregar')).toBeTruthy();
    expect(screen.getByText('Tentar de novo')).toBeTruthy();
  });
});
