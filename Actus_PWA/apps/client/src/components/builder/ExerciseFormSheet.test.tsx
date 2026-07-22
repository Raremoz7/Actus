import { render, screen, fireEvent } from '@testing-library/react-native';
import { ExerciseFormSheet } from './ExerciseFormSheet';

// O thumb do resultado usa wgerImageSource → evita carregar o require-map real de imagens.
jest.mock('@/lib/wger/media', () => ({ wgerImageSource: () => null }));

// Usa o catálogo PT-BR real (src/lib/exercises/catalog.ts). O termo de busca abaixo
// resolve para exatamente UM exercício, garantindo um resultado determinístico.
const SEARCH_TERM = 'supino declinado com halteres';
const EXERCISE_NAME = 'Supino Declinado com Halteres';
const EXERCISE_ID = 'Decline_Dumbbell_Bench_Press'; // slug do catálogo; primary chest → Peito

describe('ExerciseFormSheet (busca → prescrever)', () => {
  it('busca, escolhe e confirma com exerciseId do catálogo PT-BR', () => {
    const onConfirm = jest.fn();
    render(<ExerciseFormSheet visible initialValue={null} onClose={() => {}} onConfirm={onConfirm} />);
    fireEvent.changeText(screen.getByLabelText('Buscar exercício'), SEARCH_TERM);
    fireEvent.press(screen.getByText(EXERCISE_NAME));
    fireEvent.press(screen.getByText('Adicionar'));
    expect(onConfirm).toHaveBeenCalledWith(
      expect.objectContaining({
        name: EXERCISE_NAME,
        exerciseId: EXERCISE_ID,
        wgerExerciseId: null,
        muscleGroup: 'Peito',
        sets: 3,
        reps: 10,
      }),
    );
  });
});
