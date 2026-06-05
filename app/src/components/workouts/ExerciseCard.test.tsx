import { render, screen } from '@testing-library/react-native';
import { ExerciseCard } from './ExerciseCard';

describe('ExerciseCard', () => {
  it('mostra nome, séries×reps e descanso', () => {
    render(
      <ExerciseCard name="Supino reto" sets={4} reps={10} restSeconds={60} muscleGroup="Peito" />,
    );
    expect(screen.getByText('Supino reto')).toBeTruthy();
    expect(screen.getByText('4×10')).toBeTruthy();
    expect(screen.getByText('Peito')).toBeTruthy();
  });
  it('esconde a tag quando muscleGroup é null', () => {
    render(<ExerciseCard name="Agachamento" sets={3} reps={12} restSeconds={90} muscleGroup={null} />);
    expect(screen.queryByText('Peito')).toBeNull();
    expect(screen.getByText('3×12')).toBeTruthy();
  });
});
