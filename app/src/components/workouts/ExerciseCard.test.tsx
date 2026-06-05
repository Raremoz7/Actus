import { fireEvent, render, screen } from '@testing-library/react-native';
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
  it('chama onPress ao tocar no card', () => {
    const onPress = jest.fn();
    render(
      <ExerciseCard
        name="Levantamento terra"
        sets={5}
        reps={5}
        restSeconds={120}
        muscleGroup="Costas"
        equipment="Barra"
        onPress={onPress}
      />,
    );
    fireEvent.press(screen.getByText('Levantamento terra'));
    expect(onPress).toHaveBeenCalledTimes(1);
  });
});
