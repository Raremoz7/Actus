import { render, screen, fireEvent } from '@testing-library/react-native';

const mockReplace = jest.fn();
jest.mock('@/navigation', () => ({
  router: { replace: (...a: unknown[]) => mockReplace(...a), back: jest.fn() },
  useLocalSearchParams: () => ({ id: 'tmpl-1' }),
}));

// Detalhe e cópia do template são mockados — a tela só orquestra hooks + navegação.
const mockMutate = jest.fn();
const mockDetail = {
  data: {
    id: 'tmpl-1',
    name: 'Treino A',
    notes: null,
    created_at: '2026-01-01T00:00:00Z',
    exercises: [
      {
        id: 'ex-1',
        position: 1,
        exercise_id: 'supino-reto',
        wger_exercise_id: null,
        name_snapshot: 'Supino reto',
        sets: 4,
        reps: 8,
        rest_seconds: 90,
        notes: null,
        muscle_group: 'Peito',
      },
    ],
  },
  isLoading: false,
  isError: false,
  refetch: jest.fn(),
};

jest.mock('@/hooks/useWorkoutTemplates', () => ({
  useWorkoutTemplateDetail: () => mockDetail,
  useCopyWorkoutTemplate: () => ({ mutate: mockMutate, isPending: false }),
}));

import BancoTreinoDetailScreen from './[id]';

describe('Detalhe do banco', () => {
  it('mostra o nome e o primeiro exercício do template', () => {
    render(<BancoTreinoDetailScreen />);
    expect(screen.getByText('Treino A')).toBeTruthy();
    expect(screen.getByText('Supino reto')).toBeTruthy();
  });

  it('CTA "Clonar e editar" dispara a cópia e navega no sucesso', () => {
    render(<BancoTreinoDetailScreen />);
    fireEvent.press(screen.getByText('Clonar e editar'));
    expect(mockMutate).toHaveBeenCalledWith('tmpl-1', expect.any(Object));

    // Simula o onSuccess do mutate → navega para o builder do workout clonado.
    const onSuccess = mockMutate.mock.calls[0]![1].onSuccess;
    onSuccess({ workout_id: 'wk-9' });
    expect(mockReplace).toHaveBeenCalledWith('/montar-treino?id=wk-9');
  });
});
