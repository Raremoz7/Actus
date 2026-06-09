import { render, screen, fireEvent } from '@testing-library/react-native';

const mockPush = jest.fn();
jest.mock('expo-router', () => ({
  router: { push: (...a: unknown[]) => mockPush(...a), back: jest.fn() },
  // require lazy dentro da factory (jest proíbe referenciar variáveis fora de escopo).
  useLocalSearchParams: () => ({
    id: require('@/data/workoutLibrary').getWorkoutLibrary()[0].id,
  }),
}));

import BancoTreinoDetailScreen from './[id]';
import { getWorkoutLibrary } from '@/data/workoutLibrary';

describe('Detalhe do banco', () => {
  it('mostra o nome e o primeiro exercício do programa', () => {
    const w = getWorkoutLibrary()[0]!;
    render(<BancoTreinoDetailScreen />);
    expect(screen.getByText(w.name)).toBeTruthy();
    expect(screen.getByText(w.exercises[0]!.name)).toBeTruthy();
  });

  it('CTA "Clonar e editar" navega para o montar-treino com fromLibrary', () => {
    const w = getWorkoutLibrary()[0]!;
    render(<BancoTreinoDetailScreen />);
    fireEvent.press(screen.getByText('Clonar e editar'));
    expect(mockPush).toHaveBeenCalledWith('/montar-treino?fromLibrary=' + w.id);
  });
});
