import { fireEvent, render, screen } from '@testing-library/react-native';

import NutriDietasScreen from './dietas';

// useDietTemplates depende de QueryClientProvider/store; mockamos para render
// determinístico. Prefixo `mock` é exigido pelo hoisting do jest.mock.
const mockUseDietTemplates = jest.fn();
const mockPush = jest.fn();

jest.mock('@/hooks/useDietTemplates', () => ({
  useDietTemplates: () => mockUseDietTemplates(),
}));
jest.mock('expo-router', () => ({
  router: { push: (...args: unknown[]) => mockPush(...args) },
}));

const dietTemplates = [
  {
    id: '11111111-1111-1111-1111-111111111111',
    name: 'Cutting · 1800 kcal',
    created_at: '2026-06-01T12:00:00.000Z',
  },
  {
    id: '22222222-2222-2222-2222-222222222222',
    name: 'Bulking limpo',
    created_at: '2026-06-02T08:30:00.000Z',
  },
];

beforeEach(() => {
  mockUseDietTemplates.mockReset();
  mockPush.mockReset();
});

describe('NutriDietasScreen', () => {
  it('lista os templates de dieta com nome e contagem', () => {
    mockUseDietTemplates.mockReturnValue({
      data: { diet_templates: dietTemplates },
      isLoading: false,
      isError: false,
    });
    render(<NutriDietasScreen />);
    expect(screen.getByText('Cutting · 1800 kcal')).toBeTruthy();
    expect(screen.getByText('Bulking limpo')).toBeTruthy();
    expect(screen.getByText('2 dietas')).toBeTruthy();
  });

  it('abre o builder em branco pelo botão Nova dieta', () => {
    mockUseDietTemplates.mockReturnValue({
      data: { diet_templates: dietTemplates },
      isLoading: false,
      isError: false,
    });
    render(<NutriDietasScreen />);
    fireEvent.press(screen.getByText('Nova dieta'));
    expect(mockPush).toHaveBeenCalledWith('/montar-dieta');
  });

  it('abre o builder em modo edição ao tocar num template', () => {
    mockUseDietTemplates.mockReturnValue({
      data: { diet_templates: dietTemplates },
      isLoading: false,
      isError: false,
    });
    render(<NutriDietasScreen />);
    fireEvent.press(screen.getByText('Cutting · 1800 kcal'));
    expect(mockPush).toHaveBeenCalledWith(
      '/montar-dieta?id=11111111-1111-1111-1111-111111111111',
    );
  });

  it('mostra estado vazio quando não há dietas', () => {
    mockUseDietTemplates.mockReturnValue({
      data: { diet_templates: [] },
      isLoading: false,
      isError: false,
    });
    render(<NutriDietasScreen />);
    expect(screen.getByText('Nenhuma dieta criada ainda.')).toBeTruthy();
  });

  it('mostra estado de erro discreto', () => {
    mockUseDietTemplates.mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: true,
    });
    render(<NutriDietasScreen />);
    expect(screen.getByText('Não foi possível carregar agora.')).toBeTruthy();
  });
});
