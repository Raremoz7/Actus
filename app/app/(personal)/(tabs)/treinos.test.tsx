import { fireEvent, render, screen } from '@testing-library/react-native';

import PersonalTreinosScreen from './treinos';

// useProWorkouts depende de QueryClientProvider/store; mockamos para render
// determinístico. Prefixo `mock` é exigido pelo hoisting do jest.mock.
const mockUseProWorkouts = jest.fn();
const mockPush = jest.fn();

jest.mock('@/hooks/useProWorkouts', () => ({
  useProWorkouts: () => mockUseProWorkouts(),
}));
jest.mock('expo-router', () => ({
  router: { push: (...args: unknown[]) => mockPush(...args) },
}));

const workouts = [
  {
    id: '11111111-1111-1111-1111-111111111111',
    name: 'Treino A',
    notes: 'Peito e tríceps',
    exercise_count: 5,
    created_at: '2026-06-01T12:00:00.000Z',
  },
  {
    id: '22222222-2222-2222-2222-222222222222',
    name: 'Treino B',
    notes: null,
    exercise_count: 1,
    created_at: '2026-06-02T08:30:00.000Z',
  },
];

beforeEach(() => {
  mockUseProWorkouts.mockReset();
  mockPush.mockReset();
});

describe('PersonalTreinosScreen', () => {
  it('lista os templates com nome, foco e contagem de exercícios', () => {
    mockUseProWorkouts.mockReturnValue({
      data: { workouts },
      isLoading: false,
      isError: false,
    });
    render(<PersonalTreinosScreen />);
    expect(screen.getByText('Treino A')).toBeTruthy();
    expect(screen.getByText('Peito e tríceps')).toBeTruthy();
    expect(screen.getByText('5 exercícios')).toBeTruthy();
    expect(screen.getByText('1 exercício')).toBeTruthy();
    expect(screen.getByText('2 treinos')).toBeTruthy();
  });

  it('abre o builder em branco pelo botão Novo treino', () => {
    mockUseProWorkouts.mockReturnValue({
      data: { workouts },
      isLoading: false,
      isError: false,
    });
    render(<PersonalTreinosScreen />);
    fireEvent.press(screen.getByText('Novo treino'));
    expect(mockPush).toHaveBeenCalledWith('/montar-treino');
  });

  it('abre o builder em modo edição ao tocar num template', () => {
    mockUseProWorkouts.mockReturnValue({
      data: { workouts },
      isLoading: false,
      isError: false,
    });
    render(<PersonalTreinosScreen />);
    fireEvent.press(screen.getByText('Treino A'));
    expect(mockPush).toHaveBeenCalledWith(
      '/montar-treino?id=11111111-1111-1111-1111-111111111111',
    );
  });

  it('mostra estado vazio quando não há treinos', () => {
    mockUseProWorkouts.mockReturnValue({
      data: { workouts: [] },
      isLoading: false,
      isError: false,
    });
    render(<PersonalTreinosScreen />);
    expect(screen.getByText('Nenhum treino ainda')).toBeTruthy();
  });

  it('mostra estado de erro discreto', () => {
    mockUseProWorkouts.mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: true,
    });
    render(<PersonalTreinosScreen />);
    expect(screen.getByText('Não foi possível carregar')).toBeTruthy();
    expect(screen.getByText('Tentar de novo')).toBeTruthy();
  });
});
