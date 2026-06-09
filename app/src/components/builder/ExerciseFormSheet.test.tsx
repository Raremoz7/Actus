import { render, screen, fireEvent } from '@testing-library/react-native';
import { ExerciseFormSheet } from './ExerciseFormSheet';

jest.mock('@/lib/wger/catalog', () => ({
  exerciseName: (ex: { name_pt: string | null; name_en: string | null }) => ex.name_pt ?? ex.name_en ?? '',
  wgerCatalog: () => ({
    search: (t: string) => (t.toLowerCase().includes('sup')
      ? [{ id: 101, name_pt: 'Supino reto', name_en: 'Bench', category: 'Chest', equipment: ['Barra'], muscles: [], description_pt: null, description_en: null, hasImage: true, hasVideo: false }]
      : []),
    getExercise: () => null,
  }),
}));

describe('ExerciseFormSheet (busca → prescrever)', () => {
  it('busca, escolhe e confirma com wgerExerciseId', () => {
    const onConfirm = jest.fn();
    render(<ExerciseFormSheet visible initialValue={null} onClose={() => {}} onConfirm={onConfirm} />);
    fireEvent.changeText(screen.getByLabelText('Buscar exercício'), 'sup');
    fireEvent.press(screen.getByText('Supino reto'));
    fireEvent.press(screen.getByText('Adicionar'));
    expect(onConfirm).toHaveBeenCalledWith(
      expect.objectContaining({ name: 'Supino reto', wgerExerciseId: 101, muscleGroup: 'Peito', sets: 3, reps: 10 }),
    );
  });
});
