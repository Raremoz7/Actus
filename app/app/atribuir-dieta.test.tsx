import { fireEvent, render, screen } from '@testing-library/react-native';

import AtribuirDietaScreen from './atribuir-dieta';

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
let mockStudents: { data: unknown } = { data: undefined };
let mockDetail: { data: unknown } = { data: undefined };

jest.mock('expo-router', () => ({
  router: {
    back: () => mockBack(),
    replace: (...args: unknown[]) => mockReplace(...args),
    canGoBack: () => true,
  },
  useLocalSearchParams: () => mockParams,
}));

jest.mock('@/hooks/useDietTemplates', () => ({
  useDietTemplates: () => mockList,
}));

jest.mock('@/hooks/useAssignDiet', () => ({
  useAssignDiet: () => mockAssignState,
}));

jest.mock('@/hooks/useStudents', () => ({
  useStudents: () => mockStudents,
}));

jest.mock('@/hooks/useDietTemplateDetail', () => ({
  useDietTemplateDetail: () => mockDetail,
}));

const STUDENT_ID = '11111111-1111-1111-1111-111111111111';

const dietTemplates = [
  {
    id: 'dt-1',
    name: 'Cutting · 1800 kcal',
    created_at: '2026-01-01T00:00:00.000Z',
  },
  {
    id: 'dt-2',
    name: 'Bulking · 3000 kcal',
    created_at: '2026-01-02T00:00:00.000Z',
  },
];

beforeEach(() => {
  mockAssign.mockReset();
  mockBack.mockReset();
  mockReplace.mockReset();
  mockParams = { student: STUDENT_ID };
  mockList = { data: { diet_templates: dietTemplates }, isLoading: false, isError: false };
  mockAssignState = { mutate: mockAssign, isPending: false };
  mockStudents = {
    data: {
      students: [
        {
          id: STUDENT_ID,
          email: 'maria@exemplo.com',
          full_name: 'Maria Silva',
          birth_date: null,
          professional_role: 'nutricionista',
          linked_at: '2026-06-01T12:00:00.000Z',
        },
      ],
    },
  };
  mockDetail = {
    data: {
      id: 'dt-1',
      name: 'Cutting · 1800 kcal',
      created_at: '2026-01-01T00:00:00.000Z',
      body: {
        meals: [{ name: 'Café' }, { name: 'Almoço' }, { name: 'Jantar' }],
        target_kcal: 1800,
      },
    },
  };
});

describe('AtribuirDietaScreen', () => {
  it('lista os templates de dieta do nutricionista', () => {
    render(<AtribuirDietaScreen />);
    expect(screen.getByText('Cutting · 1800 kcal')).toBeTruthy();
    expect(screen.getByText('Bulking · 3000 kcal')).toBeTruthy();
  });

  it('mostra o aluno-alvo (nome do cache) no topo', () => {
    render(<AtribuirDietaScreen />);
    expect(screen.getByText('Maria Silva')).toBeTruthy();
  });

  it('mostra o resumo do body (refeições + kcal) no template selecionado', () => {
    render(<AtribuirDietaScreen />);
    fireEvent.press(screen.getByLabelText('Cutting · 1800 kcal'));
    expect(screen.getByText('3 refeições · 1800 kcal')).toBeTruthy();
  });

  it('"Atribuir" começa desabilitado (sem template selecionado)', () => {
    render(<AtribuirDietaScreen />);
    fireEvent.press(screen.getByText('Atribuir'));
    expect(mockAssign).not.toHaveBeenCalled();
  });

  it('atribui com template selecionado (diet_template_id + start_date local)', () => {
    render(<AtribuirDietaScreen />);

    fireEvent.press(screen.getByLabelText('Cutting · 1800 kcal'));
    fireEvent.press(screen.getByText('Atribuir'));

    expect(mockAssign).toHaveBeenCalledTimes(1);
    const [vars] = mockAssign.mock.calls[0];
    expect(vars.studentId).toBe(STUDENT_ID);
    expect(vars.body.diet_template_id).toBe('dt-1');
    expect(vars.body.start_date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it('sucesso volta para a tela anterior', () => {
    mockAssign.mockImplementation((_vars, opts) => opts.onSuccess?.());
    render(<AtribuirDietaScreen />);
    fireEvent.press(screen.getByLabelText('Bulking · 3000 kcal'));
    fireEvent.press(screen.getByText('Atribuir'));
    expect(mockBack).toHaveBeenCalledTimes(1);
  });

  it('erro mostra mensagem discreta e não navega', () => {
    mockAssign.mockImplementation((_vars, opts) => opts.onError?.(new Error('x')));
    render(<AtribuirDietaScreen />);
    fireEvent.press(screen.getByLabelText('Cutting · 1800 kcal'));
    fireEvent.press(screen.getByText('Atribuir'));
    expect(screen.getByText('Não foi possível atribuir. Tente novamente.')).toBeTruthy();
    expect(mockBack).not.toHaveBeenCalled();
  });

  it('mostra estado vazio quando não há templates', () => {
    mockList = { data: { diet_templates: [] }, isLoading: false, isError: false };
    render(<AtribuirDietaScreen />);
    expect(
      screen.getByText('Nenhuma dieta criada ainda. Monte uma dieta antes de atribuir.'),
    ).toBeTruthy();
  });
});
