import { render, screen, fireEvent } from '@testing-library/react-native';
import { StudentDetailScreen } from './StudentDetailScreen';

// Hooks de dados dependem de QueryClientProvider/store; mockamos para render
// determinístico. Prefixo `mock` é exigido pelo hoisting do jest.mock.
const mockUseStudents = jest.fn();
const mockUseCheckIns = jest.fn();
const mockUseMe = jest.fn();
const mockPush = jest.fn();
const mockBack = jest.fn();

jest.mock('@/hooks/useStudents', () => ({
  useStudents: () => mockUseStudents(),
}));
jest.mock('@/hooks/useStudentCheckIns', () => ({
  useStudentCheckIns: () => mockUseCheckIns(),
}));
jest.mock('@/hooks/useMe', () => ({
  useMe: () => mockUseMe(),
}));
jest.mock('expo-router', () => ({
  router: {
    push: (...args: unknown[]) => mockPush(...args),
    back: () => mockBack(),
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
  mockUseMe.mockReset();
  mockPush.mockReset();
  mockBack.mockReset();

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
    // KPI: total de check-ins.
    expect(screen.getByText('2')).toBeTruthy();
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

  it('mostra fallback discreto quando o aluno não está no cache (deep link)', () => {
    mockUseStudents.mockReturnValue({
      data: { students: [] },
      isLoading: false,
      isError: false,
    });
    render(<StudentDetailScreen id={STUDENT_ID} />);
    expect(screen.getByText('Aluno não encontrado nesta sessão.')).toBeTruthy();
    // Sem aluno → nenhuma ação de atribuição.
    expect(screen.queryByText('Atribuir treino')).toBeNull();
  });

  it('volta pelo botão de voltar', () => {
    render(<StudentDetailScreen id={STUDENT_ID} />);
    fireEvent.press(screen.getByLabelText('Voltar'));
    expect(mockBack).toHaveBeenCalledTimes(1);
  });
});
