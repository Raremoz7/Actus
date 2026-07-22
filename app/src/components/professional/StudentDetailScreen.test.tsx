import { render, screen, fireEvent } from '@testing-library/react-native';
import { StudentDetailScreen } from './StudentDetailScreen';

// Hooks de dados dependem de QueryClientProvider/store; mockamos para render
// determinístico. Prefixo `mock` é exigido pelo hoisting do jest.mock.
const mockUseStudents = jest.fn();
const mockUseCheckIns = jest.fn();
const mockUseProWorkouts = jest.fn();
const mockUseMe = jest.fn();
const mockPush = jest.fn();
const mockBack = jest.fn();

jest.mock('@/hooks/useStudents', () => ({
  useStudents: () => mockUseStudents(),
}));
// ParqSection usa hook de query; aqui não testamos o Par-Q → sem submissão.
jest.mock('@/hooks/useParq', () => ({
  useParqSubmission: () => null,
}));
jest.mock('@/hooks/useStudentCheckIns', () => ({
  useStudentCheckIns: () => mockUseCheckIns(),
}));
jest.mock('@/hooks/useProStudentWorkouts', () => ({
  useProStudentWorkouts: () => mockUseProWorkouts(),
}));
jest.mock('@/hooks/useUpdateStudentWorkout', () => ({
  useUpdateStudentWorkout: () => ({ mutate: jest.fn(), isPending: false }),
}));
jest.mock('@/hooks/useMe', () => ({
  useMe: () => mockUseMe(),
}));
jest.mock('@/navigation', () => ({
  router: {
    push: (...args: unknown[]) => mockPush(...args),
    back: () => mockBack(),
    canGoBack: () => true,
    replace: () => {},
  },
}));

const STUDENT_ID = '11111111-1111-1111-1111-111111111111';

const student = {
  id: STUDENT_ID,
  email: 'maria@exemplo.com',
  full_name: 'Maria Silva',
  birth_date: '1995-03-10',
  professional_role: 'personal',
  linked_at: '2026-06-01T12:00:00.000Z',
};

beforeEach(() => {
  mockUseStudents.mockReset();
  mockUseCheckIns.mockReset();
  mockUseProWorkouts.mockReset();
  mockUseMe.mockReset();
  mockPush.mockReset();
  mockBack.mockReset();

  // Padrão: sem treinos atribuídos (estado vazio). Testes específicos sobrescrevem.
  mockUseProWorkouts.mockReturnValue({
    data: { student_workouts: [] },
    isLoading: false,
    isError: false,
  });

  mockUseStudents.mockReturnValue({
    data: { students: [student] },
    isLoading: false,
    isError: false,
  });
  mockUseCheckIns.mockReturnValue({
    data: { student_id: STUDENT_ID, check_ins: [] },
    isLoading: false,
    isError: false,
  });
  mockUseMe.mockReturnValue({ data: { id: 'p', tipo: 'personal', display_name: 'Davi' } });
});

describe('StudentDetailScreen', () => {
  it('mostra identidade do aluno (nome + e-mail) do cache', () => {
    render(<StudentDetailScreen id={STUDENT_ID} />);
    expect(screen.getByText('Maria Silva')).toBeTruthy();
    expect(screen.getByText('maria@exemplo.com')).toBeTruthy();
  });

  it('mostra "Sem check-ins ainda." quando não há atividade', () => {
    render(<StudentDetailScreen id={STUDENT_ID} />);
    expect(screen.getByText('Sem check-ins ainda.')).toBeTruthy();
  });

  it('lista check-ins recentes formatados e a KPI com o total', () => {
    mockUseCheckIns.mockReturnValue({
      data: {
        student_id: STUDENT_ID,
        check_ins: [{ check_in_date: '2026-06-05' }, { check_in_date: '2026-06-04' }],
      },
      isLoading: false,
      isError: false,
    });
    render(<StudentDetailScreen id={STUDENT_ID} />);
    expect(screen.getByText('05 jun')).toBeTruthy();
    expect(screen.getByText('04 jun')).toBeTruthy();
    // KPI: total de check-ins (2). Pode haver outra KPI com o mesmo valor
    // (dias ativos na janela), por isso usamos getAllByText.
    expect(screen.getAllByText('2').length).toBeGreaterThanOrEqual(1);
  });

  it('personal vê "Atribuir treino" e navega para a tela de atribuição com o student', () => {
    render(<StudentDetailScreen id={STUDENT_ID} />);
    fireEvent.press(screen.getByText('Atribuir treino'));
    expect(mockPush).toHaveBeenCalledWith('/atribuir-treino?student=' + STUDENT_ID);
  });

  it('nutricionista vê "Atribuir dieta" e navega para a tela de atribuição com o student', () => {
    mockUseMe.mockReturnValue({
      data: { id: 'n', tipo: 'nutricionista', display_name: 'Ale' },
    });
    render(<StudentDetailScreen id={STUDENT_ID} />);
    fireEvent.press(screen.getByText('Atribuir dieta'));
    expect(mockPush).toHaveBeenCalledWith('/atribuir-dieta?student=' + STUDENT_ID);
  });

  it('personal sem treinos vê o estado vazio do programa', () => {
    render(<StudentDetailScreen id={STUDENT_ID} />);
    expect(
      screen.getByText(/Nenhum treino atribuído ainda/),
    ).toBeTruthy();
  });

  it('lista treino atribuído e "Editar" navega em modo edição (com assignment e dias)', () => {
    mockUseProWorkouts.mockReturnValue({
      data: {
        student_workouts: [
          {
            id: 'sw-1',
            student_id: STUDENT_ID,
            workout_id: 'wk-9',
            weekdays: [1, 3, 5],
            start_date: '2026-05-01',
            end_date: null,
            display_order: 0,
            is_active: true,
            created_at: '2026-05-01T00:00:00.000Z',
            workout_name: 'Treino A — Peito',
            workout_notes: null,
            exercise_count: 4,
            last_completed_date: null,
          },
        ],
      },
      isLoading: false,
      isError: false,
    });
    render(<StudentDetailScreen id={STUDENT_ID} />);
    expect(screen.getByText('Treino A — Peito')).toBeTruthy();
    fireEvent.press(screen.getByLabelText('Editar Treino A — Peito'));
    expect(mockPush).toHaveBeenCalledWith(
      '/atribuir-treino?student=' +
        STUDENT_ID +
        '&assignment=sw-1&workout=wk-9&weekdays=1,3,5&start=2026-05-01',
    );
  });

  it('mostra fallback discreto quando o aluno não está no cache (deep link)', () => {
    mockUseStudents.mockReturnValue({
      data: { students: [] },
      isLoading: false,
      isError: false,
    });
    render(<StudentDetailScreen id={STUDENT_ID} />);
    expect(screen.getByText('Abra este aluno pela sua lista de alunos.')).toBeTruthy();
    // Sem aluno → nenhuma ação de atribuição.
    expect(screen.queryByText('Atribuir treino')).toBeNull();
  });

  it('volta pelo botão de voltar', () => {
    render(<StudentDetailScreen id={STUDENT_ID} />);
    fireEvent.press(screen.getByLabelText('Voltar'));
    expect(mockBack).toHaveBeenCalledTimes(1);
  });
});
