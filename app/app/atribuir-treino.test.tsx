import { fireEvent, render, screen } from '@testing-library/react-native';

import AtribuirTreinoScreen from './atribuir-treino';

// Hooks de dados dependem de QueryClientProvider/store; mockamos para um render
// determinístico. Prefixo `mock` é exigido pelo hoisting do jest.mock.
const mockAssign = jest.fn();
const mockBack = jest.fn();
const mockReplace = jest.fn();

let mockParams: { student?: string } = {};
let mockList: { data: unknown; isLoading: boolean; isError: boolean } = {
  data: undefined,
  isLoading: false,
  isError: false,
};
let mockAssignState = { mutate: mockAssign, isPending: false };

jest.mock('expo-router', () => ({
  router: {
    back: () => mockBack(),
    replace: (...args: unknown[]) => mockReplace(...args),
    canGoBack: () => true,
  },
  useLocalSearchParams: () => mockParams,
}));

jest.mock('@/hooks/useProWorkouts', () => ({
  useProWorkouts: () => mockList,
}));

jest.mock('@/hooks/useAssignWorkout', () => ({
  useAssignWorkout: () => mockAssignState,
}));

const STUDENT_ID = '11111111-1111-1111-1111-111111111111';

const workouts = [
  {
    id: 'wk-1',
    name: 'Treino A',
    notes: 'Peito e tríceps',
    exercise_count: 5,
    created_at: '2026-01-01T00:00:00.000Z',
  },
  {
    id: 'wk-2',
    name: 'Treino B',
    notes: null,
    exercise_count: 4,
    created_at: '2026-01-02T00:00:00.000Z',
  },
];

beforeEach(() => {
  mockAssign.mockReset();
  mockBack.mockReset();
  mockReplace.mockReset();
  mockParams = { student: STUDENT_ID };
  mockList = { data: { workouts }, isLoading: false, isError: false };
  mockAssignState = { mutate: mockAssign, isPending: false };
});

describe('AtribuirTreinoScreen', () => {
  it('lista os templates do profissional', () => {
    render(<AtribuirTreinoScreen />);
    expect(screen.getByText('Treino A')).toBeTruthy();
    expect(screen.getByText('Treino B')).toBeTruthy();
  });

  it('"Atribuir" começa desabilitado (sem template e sem dias)', () => {
    render(<AtribuirTreinoScreen />);
    fireEvent.press(screen.getByText('Atribuir'));
    expect(mockAssign).not.toHaveBeenCalled();
  });

  it('atribui com template + dias selecionados (start_date local incluso)', () => {
    render(<AtribuirTreinoScreen />);

    // Seleciona um template e dois dias da semana (segunda=1, quarta=3).
    fireEvent.press(screen.getByLabelText('Treino A'));
    fireEvent.press(screen.getByLabelText('Segunda'));
    fireEvent.press(screen.getByLabelText('Quarta'));

    fireEvent.press(screen.getByText('Atribuir'));

    expect(mockAssign).toHaveBeenCalledTimes(1);
    const [vars] = mockAssign.mock.calls[0];
    expect(vars.studentId).toBe(STUDENT_ID);
    expect(vars.body.workout_id).toBe('wk-1');
    expect(vars.body.weekdays).toEqual([1, 3]);
    expect(vars.body.start_date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it('toggle de dia remove o dia ao tocar novamente', () => {
    render(<AtribuirTreinoScreen />);
    fireEvent.press(screen.getByLabelText('Treino A'));
    fireEvent.press(screen.getByLabelText('Terça'));
    fireEvent.press(screen.getByLabelText('Terça')); // toggle off

    fireEvent.press(screen.getByText('Atribuir'));
    // Sem dias → não atribui.
    expect(mockAssign).not.toHaveBeenCalled();
  });

  it('sucesso volta para a tela anterior', () => {
    mockAssign.mockImplementation((_vars, opts) => opts.onSuccess?.());
    render(<AtribuirTreinoScreen />);
    fireEvent.press(screen.getByLabelText('Treino B'));
    fireEvent.press(screen.getByLabelText('Sexta'));
    fireEvent.press(screen.getByText('Atribuir'));
    expect(mockBack).toHaveBeenCalledTimes(1);
  });

  it('erro mostra mensagem discreta e não navega', () => {
    mockAssign.mockImplementation((_vars, opts) => opts.onError?.(new Error('x')));
    render(<AtribuirTreinoScreen />);
    fireEvent.press(screen.getByLabelText('Treino A'));
    fireEvent.press(screen.getByLabelText('Segunda'));
    fireEvent.press(screen.getByText('Atribuir'));
    expect(screen.getByText('Não foi possível atribuir. Tente novamente.')).toBeTruthy();
    expect(mockBack).not.toHaveBeenCalled();
  });

  it('mostra estado vazio quando não há templates', () => {
    mockList = { data: { workouts: [] }, isLoading: false, isError: false };
    render(<AtribuirTreinoScreen />);
    expect(
      screen.getByText('Nenhum treino criado ainda. Monte um treino antes de atribuir.'),
    ).toBeTruthy();
  });
});
