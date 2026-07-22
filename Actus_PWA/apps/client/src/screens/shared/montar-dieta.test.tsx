import { fireEvent, render, screen } from '@testing-library/react-native';

import MontarDietaScreen from './montar-dieta';

// Hooks de dados dependem de QueryClientProvider/store; mockamos para um render
// determinístico. Prefixo `mock` é exigido pelo hoisting do jest.mock.
const mockCreate = jest.fn();
const mockUpdate = jest.fn();
const mockBack = jest.fn();
const mockReplace = jest.fn();

let mockParams: { id?: string } = {};
let mockDetail: { data: unknown; isLoading: boolean } = { data: undefined, isLoading: false };

jest.mock('@/navigation', () => ({
  router: {
    back: () => mockBack(),
    replace: (...args: unknown[]) => mockReplace(...args),
    canGoBack: () => true,
  },
  useLocalSearchParams: () => mockParams,
}));

jest.mock('@/hooks/useDietTemplateDetail', () => ({
  useDietTemplateDetail: () => mockDetail,
}));

jest.mock('@/hooks/useDietMutations', () => ({
  useDietMutations: () => ({
    create: { mutate: mockCreate, isPending: false },
    update: { mutate: mockUpdate, isPending: false },
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

describe('MontarDietaScreen — criar', () => {
  it('exige nome antes de avançar do passo 1', () => {
    render(<MontarDietaScreen />);
    fireEvent.press(screen.getByText('Continuar'));
    expect(screen.getByText('Dê um nome à dieta')).toBeTruthy();
  });

  it('cria a dieta com nome + refeição adicionada pelo sheet', () => {
    render(<MontarDietaScreen />);

    // Passo 1
    fireEvent.changeText(screen.getByLabelText('Nome da dieta'), 'Cutting');
    fireEvent.press(screen.getByText('Continuar'));

    // Passo 2 — adiciona refeição via sheet
    fireEvent.press(screen.getByText('Adicionar refeição'));
    fireEvent.changeText(screen.getByLabelText('Refeição'), 'Café da manhã');
    fireEvent.changeText(screen.getByLabelText('Kcal'), '450');
    fireEvent.press(screen.getByText('Adicionar'));

    // De volta ao passo 2, refeição listada
    expect(screen.getByText('Café da manhã')).toBeTruthy();

    // Passo 3 — revisar e salvar
    fireEvent.press(screen.getByText('Revisar'));
    fireEvent.press(screen.getByText('Salvar dieta'));

    expect(mockCreate).toHaveBeenCalledTimes(1);
    const [body] = mockCreate.mock.calls[0];
    expect(body.name).toBe('Cutting');
    expect(body.body.meals).toHaveLength(1);
    expect(body.body.meals[0]).toEqual({ name: 'Café da manhã', kcal: 450 });
  });

  it('bloqueia avanço ao passo 3 sem refeições', () => {
    render(<MontarDietaScreen />);
    fireEvent.changeText(screen.getByLabelText('Nome da dieta'), 'Dieta vazia');
    fireEvent.press(screen.getByText('Continuar'));
    fireEvent.press(screen.getByText('Revisar'));
    // Continua no passo 2 (botão Adicionar refeição ainda visível).
    expect(screen.getByText('Adicionar refeição')).toBeTruthy();
    expect(mockCreate).not.toHaveBeenCalled();
  });
});

describe('MontarDietaScreen — editar', () => {
  beforeEach(() => {
    mockParams = { id: 'dt-1' };
    mockDetail = {
      isLoading: false,
      data: {
        id: 'dt-1',
        name: 'Dieta existente',
        created_at: '2026-01-01T00:00:00.000Z',
        body: {
          meals: [
            { name: 'Almoço', foods: 'Arroz e frango', kcal: 700, protein: 50 },
          ],
          notes: 'Beber 3L de água',
        },
      },
    };
  });

  it('pré-preenche e abre direto na lista (passo 2)', () => {
    render(<MontarDietaScreen />);
    expect(screen.getByText('Almoço')).toBeTruthy();
    expect(screen.getByText('Adicionar refeição')).toBeTruthy();
  });

  it('salva via update com o id da rota e o body estruturado', () => {
    render(<MontarDietaScreen />);
    fireEvent.press(screen.getByText('Revisar'));
    fireEvent.press(screen.getByText('Salvar dieta'));

    expect(mockUpdate).toHaveBeenCalledTimes(1);
    const [vars] = mockUpdate.mock.calls[0];
    expect(vars.id).toBe('dt-1');
    expect(vars.body.name).toBe('Dieta existente');
    expect(vars.body.body.notes).toBe('Beber 3L de água');
    expect(vars.body.body.meals[0]).toEqual({
      name: 'Almoço',
      foods: 'Arroz e frango',
      kcal: 700,
      protein: 50,
    });
  });

  it('tolera body vazio de templates antigos (meals: [])', () => {
    mockDetail = {
      isLoading: false,
      data: { id: 'dt-2', name: 'Antiga', created_at: '2026-01-01T00:00:00.000Z', body: {} },
    };
    render(<MontarDietaScreen />);
    expect(screen.getByText('Nenhuma refeição ainda. Adicione a primeira abaixo.')).toBeTruthy();
  });
});
