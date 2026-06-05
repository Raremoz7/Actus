import { fireEvent, render, screen } from '@testing-library/react-native';

import CriarDesafioScreen from './criar-desafio';

// Mutations/router dependem de QueryClientProvider/store; mockamos para um render
// determinístico. Prefixo `mock` é exigido pelo hoisting do jest.mock.
const mockCreateMutate = jest.fn();
const mockReplace = jest.fn();
const mockBack = jest.fn();
const mockCanGoBack = jest.fn(() => true);

jest.mock('@/hooks/useChallengeMutations', () => ({
  useChallengeMutations: () => ({
    create: { mutate: mockCreateMutate, isPending: false },
    update: { mutate: jest.fn(), isPending: false },
    addParticipants: { mutate: jest.fn(), isPending: false },
  }),
}));

jest.mock('expo-router', () => ({
  router: {
    replace: (...args: unknown[]) => mockReplace(...args),
    back: () => mockBack(),
    canGoBack: () => mockCanGoBack(),
  },
}));

// DateField real usa o picker nativo; aqui um stub controlável que escolhe uma
// data fixa por toque, permitindo dirigir os fluxos de validação.
jest.mock('@/components/molecules', () => {
  const React = require('react');
  const { Pressable, Text } = require('react-native');
  const FIXED: Record<string, string> = {
    Início: '2026-01-01',
    Fim: '2026-01-31',
  };
  return {
    DateField: ({
      label,
      value,
      onChange,
      error,
    }: {
      label: string;
      value: string | null;
      onChange: (v: string) => void;
      error?: string;
    }) =>
      React.createElement(
        Pressable,
        {
          accessibilityLabel: label,
          onPress: () => onChange(FIXED[label] ?? '2026-01-01'),
        },
        React.createElement(Text, null, value ?? `escolher ${label}`),
        error ? React.createElement(Text, null, error) : null,
      ),
  };
});

beforeEach(() => {
  mockCreateMutate.mockReset();
  mockReplace.mockReset();
  mockBack.mockReset();
  mockCanGoBack.mockReset();
  mockCanGoBack.mockReturnValue(true);
});

// O título da tela e o label do botão são "Criar desafio"; o botão é alcançado
// por role para desambiguar do h2.
function pressSubmit() {
  fireEvent.press(screen.getByRole('button', { name: 'Criar desafio' }));
}

describe('CriarDesafioScreen', () => {
  it('valida nome e datas obrigatórios antes de enviar', () => {
    render(<CriarDesafioScreen />);
    pressSubmit();

    expect(screen.getByText('Dê um nome ao desafio')).toBeTruthy();
    expect(screen.getByText('Escolha a data de início')).toBeTruthy();
    expect(screen.getByText('Escolha a data de fim')).toBeTruthy();
    expect(mockCreateMutate).not.toHaveBeenCalled();
  });

  it('cria o desafio como rascunho com nome, datas e visibilidade', () => {
    render(<CriarDesafioScreen />);

    fireEvent.changeText(
      screen.getByLabelText('Nome do desafio'),
      'Janeiro sem falta',
    );
    fireEvent.press(screen.getByLabelText('Início'));
    fireEvent.press(screen.getByLabelText('Fim'));

    pressSubmit();

    expect(mockCreateMutate).toHaveBeenCalledTimes(1);
    expect(mockCreateMutate.mock.calls[0][0]).toEqual({
      name: 'Janeiro sem falta',
      starts_on: '2026-01-01',
      ends_on: '2026-01-31',
      visibility: 'public_among_participants',
    });
  });

  it('envia ranking privado quando o chip é selecionado', () => {
    render(<CriarDesafioScreen />);

    fireEvent.changeText(screen.getByLabelText('Nome do desafio'), 'Verão fit');
    fireEvent.press(screen.getByLabelText('Início'));
    fireEvent.press(screen.getByLabelText('Fim'));
    fireEvent.press(screen.getByText('Ranking privado'));

    pressSubmit();

    expect(mockCreateMutate.mock.calls[0][0].visibility).toBe('private_ranking');
  });

  it('navega para o detalhe no sucesso da criação', () => {
    mockCreateMutate.mockImplementation((_body, opts) => {
      opts.onSuccess({ id: 'abc-123' });
    });
    render(<CriarDesafioScreen />);

    fireEvent.changeText(screen.getByLabelText('Nome do desafio'), 'Janeiro');
    fireEvent.press(screen.getByLabelText('Início'));
    fireEvent.press(screen.getByLabelText('Fim'));
    pressSubmit();

    expect(mockReplace).toHaveBeenCalledWith('/desafio-pro/abc-123');
  });

  it('mostra erro discreto quando a criação falha', () => {
    mockCreateMutate.mockImplementation((_body, opts) => {
      opts.onError(new Error('falhou'));
    });
    render(<CriarDesafioScreen />);

    fireEvent.changeText(screen.getByLabelText('Nome do desafio'), 'Janeiro');
    fireEvent.press(screen.getByLabelText('Início'));
    fireEvent.press(screen.getByLabelText('Fim'));
    pressSubmit();

    expect(
      screen.getByText('Não foi possível criar agora. Tente novamente.'),
    ).toBeTruthy();
  });
});
