import { fireEvent, render, screen } from '@testing-library/react-native';

import MontarTreinoScreen from './montar-treino';

// Hooks de dados dependem de QueryClientProvider/store; mockamos para um render
// determinístico. Prefixo `mock` é exigido pelo hoisting do jest.mock.
const mockCreate = jest.fn();
const mockUpdate = jest.fn();
const mockBack = jest.fn();
const mockReplace = jest.fn();

let mockParams: { id?: string } = {};
let mockDetail: { data: unknown; isLoading: boolean } = { data: undefined, isLoading: false };

jest.mock('expo-router', () => ({
  router: {
    back: () => mockBack(),
    replace: (...args: unknown[]) => mockReplace(...args),
    canGoBack: () => true,
  },
  useLocalSearchParams: () => mockParams,
}));

jest.mock('@/hooks/useProWorkoutDetail', () => ({
  useProWorkoutDetail: () => mockDetail,
}));

jest.mock('@/hooks/useWorkoutMutations', () => ({
  useWorkoutMutations: () => ({
    create: { mutate: mockCreate, isPending: false },
    update: { mutate: mockUpdate, isPending: false },
  }),
}));

// Catálogo Wger mockado: 'sup' devolve Supino reto (id 101, categoria Chest → Peito).
jest.mock('@/lib/wger/catalog', () => ({
  exerciseName: (ex: { name_pt: string | null; name_en: string | null }) =>
    ex.name_pt ?? ex.name_en ?? '',
  wgerCatalog: () => ({
    search: (t: string) =>
      t.toLowerCase().includes('sup')
        ? [
            {
              id: 101,
              name_pt: 'Supino reto',
              name_en: 'Bench',
              category: 'Chest',
              equipment: ['Barra'],
              muscles: [],
              description_pt: null,
              description_en: null,
              hasImage: true,
              hasVideo: false,
            },
          ]
        : [],
    getExercise: () => null,
  }),
}));

beforeEach(() => {
  mockCreate.mockReset();
  mockUpdate.mockReset();
  mockBack.mockReset();
  mockReplace.mockReset();
  mockParams = {};
  mockDetail = { data: undefined, isLoading: false };
});

describe('MontarTreinoScreen — criar', () => {
  it('exige nome antes de avançar do passo 1', () => {
    render(<MontarTreinoScreen />);
    fireEvent.press(screen.getByText('Continuar'));
    expect(screen.getByText('Dê um nome ao treino')).toBeTruthy();
  });

  it('cria o treino com nome + exercício adicionado pelo sheet', () => {
    render(<MontarTreinoScreen />);

    // Passo 1
    fireEvent.changeText(screen.getByLabelText('Nome do treino'), 'Treino A');
    fireEvent.press(screen.getByText('Continuar'));

    // Passo 2 — busca no catálogo Wger, escolhe e adiciona via sheet
    fireEvent.press(screen.getByText('Adicionar exercício'));
    fireEvent.changeText(screen.getByLabelText('Buscar exercício'), 'sup');
    fireEvent.press(screen.getByText('Supino reto'));
    fireEvent.press(screen.getByText('Adicionar'));

    // De volta ao passo 2, exercício listado
    expect(screen.getByText('Supino reto')).toBeTruthy();

    // Passo 3 — revisar e salvar
    fireEvent.press(screen.getByText('Revisar'));
    fireEvent.press(screen.getByText('Salvar treino'));

    expect(mockCreate).toHaveBeenCalledTimes(1);
    const [body] = mockCreate.mock.calls[0];
    expect(body.name).toBe('Treino A');
    expect(body.exercises).toHaveLength(1);
    expect(body.exercises[0]).toMatchObject({
      position: 1,
      wger_exercise_id: 101,
      name_snapshot: 'Supino reto',
      sets: 3,
      reps: 10,
      rest_seconds: 60,
    });
  });

  it('bloqueia avanço ao passo 3 sem exercícios', () => {
    render(<MontarTreinoScreen />);
    fireEvent.changeText(screen.getByLabelText('Nome do treino'), 'Treino vazio');
    fireEvent.press(screen.getByText('Continuar'));
    fireEvent.press(screen.getByText('Revisar'));
    // Continua no passo 2 (botão Adicionar exercício ainda visível).
    expect(screen.getByText('Adicionar exercício')).toBeTruthy();
    expect(mockCreate).not.toHaveBeenCalled();
  });
});

describe('MontarTreinoScreen — editar', () => {
  beforeEach(() => {
    mockParams = { id: 'wk-1' };
    mockDetail = {
      isLoading: false,
      data: {
        id: 'wk-1',
        name: 'Treino existente',
        notes: 'Foco em força',
        created_at: '2026-01-01T00:00:00.000Z',
        exercises: [
          {
            id: 'ex-1',
            position: 1,
            wger_exercise_id: 1,
            name_snapshot: 'Agachamento',
            sets: 5,
            reps: 5,
            rest_seconds: 120,
            notes: null,
            muscle_group: null,
          },
        ],
      },
    };
  });

  it('pré-preenche e abre direto na lista (passo 2)', () => {
    render(<MontarTreinoScreen />);
    expect(screen.getByText('Agachamento')).toBeTruthy();
    expect(screen.getByText('Adicionar exercício')).toBeTruthy();
  });

  it('salva via update com o id da rota', () => {
    render(<MontarTreinoScreen />);
    fireEvent.press(screen.getByText('Revisar'));
    fireEvent.press(screen.getByText('Salvar treino'));

    expect(mockUpdate).toHaveBeenCalledTimes(1);
    const [vars] = mockUpdate.mock.calls[0];
    expect(vars.id).toBe('wk-1');
    expect(vars.body.name).toBe('Treino existente');
    expect(vars.body.exercises[0]).toMatchObject({
      position: 1,
      name_snapshot: 'Agachamento',
      sets: 5,
    });
  });
});
