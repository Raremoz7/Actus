import { render, screen, fireEvent } from '@testing-library/react-native';
import { StudentsScreen } from './StudentsScreen';

// useStudents depende de QueryClientProvider/store; mockamos para render determinístico.
// Prefixo `mock` é exigido pelo hoisting do jest.mock.
const mockUseStudents = jest.fn();
const mockPush = jest.fn();

jest.mock('@/hooks/useStudents', () => ({
  useStudents: () => mockUseStudents(),
}));
jest.mock('expo-router', () => ({
  router: { push: (...args: unknown[]) => mockPush(...args) },
}));

const students = [
  {
    id: '11111111-1111-1111-1111-111111111111',
    email: 'maria@exemplo.com',
    full_name: 'Maria Silva',
    birth_date: '1995-03-10',
    professional_role: 'personal',
    linked_at: '2026-06-01T12:00:00.000Z',
  },
  {
    id: '22222222-2222-2222-2222-222222222222',
    email: 'joao@exemplo.com',
    full_name: 'João Souza',
    birth_date: null,
    professional_role: 'personal',
    linked_at: '2026-06-02T08:30:00.000Z',
  },
];

beforeEach(() => {
  mockUseStudents.mockReset();
  mockPush.mockReset();
});

describe('StudentsScreen', () => {
  it('lista os alunos com nome e e-mail', () => {
    mockUseStudents.mockReturnValue({
      data: { students },
      isLoading: false,
      isError: false,
    });
    render(<StudentsScreen />);
    expect(screen.getByText('Maria Silva')).toBeTruthy();
    expect(screen.getByText('João Souza')).toBeTruthy();
    expect(screen.getByText('2 alunos')).toBeTruthy();
  });

  it('filtra client-side por nome', () => {
    mockUseStudents.mockReturnValue({
      data: { students },
      isLoading: false,
      isError: false,
    });
    render(<StudentsScreen />);
    fireEvent.changeText(
      screen.getByPlaceholderText('Buscar por nome ou e-mail'),
      'maria',
    );
    expect(screen.getByText('Maria Silva')).toBeTruthy();
    expect(screen.queryByText('João Souza')).toBeNull();
  });

  it('navega para o detalhe ao tocar num aluno', () => {
    mockUseStudents.mockReturnValue({
      data: { students },
      isLoading: false,
      isError: false,
    });
    render(<StudentsScreen />);
    fireEvent.press(screen.getByText('Maria Silva'));
    expect(mockPush).toHaveBeenCalledWith(
      '/aluno/11111111-1111-1111-1111-111111111111',
    );
  });

  it('navega para o convite pelo botão neon', () => {
    mockUseStudents.mockReturnValue({
      data: { students },
      isLoading: false,
      isError: false,
    });
    render(<StudentsScreen />);
    fireEvent.press(screen.getByLabelText('Convidar aluno'));
    expect(mockPush).toHaveBeenCalledWith('/convite');
  });

  it('mostra estado vazio quando não há alunos', () => {
    mockUseStudents.mockReturnValue({
      data: { students: [] },
      isLoading: false,
      isError: false,
    });
    render(<StudentsScreen />);
    expect(screen.getByText('Nenhum aluno ainda.')).toBeTruthy();
  });

  it('mostra estado de erro discreto', () => {
    mockUseStudents.mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: true,
    });
    render(<StudentsScreen />);
    expect(screen.getByText('Não foi possível carregar agora.')).toBeTruthy();
  });
});
