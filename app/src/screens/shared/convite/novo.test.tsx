import { Share } from 'react-native';
import { fireEvent, render, screen } from '@testing-library/react-native';

import NovoConviteScreen from './novo';

// Hook de mutação depende de QueryClientProvider; mockamos. Prefixo `mock` é
// exigido pelo hoisting do jest.mock.
const mockCreate = jest.fn();
const mockReplace = jest.fn();
const mockSetString = jest.fn();

jest.mock('@/hooks/useInviteActions', () => ({
  useInviteActions: () => ({
    create: { mutate: mockCreate, isPending: false },
  }),
}));
jest.mock('@/navigation', () => ({
  router: {
    replace: (...args: unknown[]) => mockReplace(...args),
    back: () => {},
    canGoBack: () => true,
  },
}));
jest.mock('@react-native-clipboard/clipboard', () => ({
  default: { setString: (...args: unknown[]) => mockSetString(...args) },
}));

beforeEach(() => {
  mockCreate.mockReset();
  mockReplace.mockReset();
  mockSetString.mockReset();
});

describe('NovoConviteScreen', () => {
  it('gera convite com a validade e usos padrão (7 dias, 1 uso)', () => {
    render(<NovoConviteScreen />);
    fireEvent.press(screen.getByText('Gerar convite'));

    expect(mockCreate).toHaveBeenCalledTimes(1);
    const [args] = mockCreate.mock.calls[0];
    expect(args.maxUses).toBe(1);
    // expiresAt é um instante ISO completo (com hora) no futuro.
    expect(args.expiresAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/);
    expect(new Date(args.expiresAt).getTime()).toBeGreaterThan(Date.now());
  });

  it('usa a validade e o limite de usos selecionados nos chips', () => {
    render(<NovoConviteScreen />);
    fireEvent.press(screen.getByLabelText('Validade de 30 dias'));
    fireEvent.press(screen.getByLabelText('Limite de 5 usos'));
    fireEvent.press(screen.getByText('Gerar convite'));

    const [args] = mockCreate.mock.calls[0];
    expect(args.maxUses).toBe(5);
    // ~30 dias à frente (tolerância de 1 dia).
    const days = (new Date(args.expiresAt).getTime() - Date.now()) / 86_400_000;
    expect(days).toBeGreaterThan(29);
    expect(days).toBeLessThan(31);
  });

  it('no sucesso, mostra a vista de compartilhar com o código gerado', () => {
    mockCreate.mockImplementation((_args, opts) => {
      opts.onSuccess({ id: 'inv-1', code: 'XYZ789' });
    });
    render(<NovoConviteScreen />);
    fireEvent.press(screen.getByText('Gerar convite'));

    expect(screen.getByText('XYZ789')).toBeTruthy();
    expect(screen.getByText('Compartilhar convite')).toBeTruthy();
    expect(screen.getByText('Copiar link')).toBeTruthy();
  });

  it('na vista de compartilhar, "Concluir" volta para /convite', () => {
    mockCreate.mockImplementation((_args, opts) => {
      opts.onSuccess({ id: 'inv-1', code: 'XYZ789' });
    });
    render(<NovoConviteScreen />);
    fireEvent.press(screen.getByText('Gerar convite'));
    fireEvent.press(screen.getByText('Concluir'));

    expect(mockReplace).toHaveBeenCalledWith('/convite');
  });

  it('na vista de compartilhar, copiar usa o deep link do código', () => {
    mockCreate.mockImplementation((_args, opts) => {
      opts.onSuccess({ id: 'inv-1', code: 'XYZ789' });
    });
    render(<NovoConviteScreen />);
    fireEvent.press(screen.getByText('Gerar convite'));
    fireEvent.press(screen.getByText('Copiar link'));

    expect(mockSetString).toHaveBeenCalledWith('actus://register?code=XYZ789');
  });

  it('na vista de compartilhar, compartilhar usa a mensagem do código', () => {
    const shareSpy = jest.spyOn(Share, 'share').mockResolvedValue({} as never);
    mockCreate.mockImplementation((_args, opts) => {
      opts.onSuccess({ id: 'inv-1', code: 'XYZ789' });
    });
    render(<NovoConviteScreen />);
    fireEvent.press(screen.getByText('Gerar convite'));
    fireEvent.press(screen.getByText('Compartilhar convite'));

    expect(shareSpy).toHaveBeenCalledWith({
      message: 'Seu acesso ao Actus: actus://register?code=XYZ789',
    });
    shareSpy.mockRestore();
  });
});
