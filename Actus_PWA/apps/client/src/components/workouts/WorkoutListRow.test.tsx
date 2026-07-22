import { render, screen, fireEvent } from '@testing-library/react-native';
import { WorkoutListRow } from './WorkoutListRow';

describe('WorkoutListRow', () => {
  it('mostra nome e responde ao toque', () => {
    const onPress = jest.fn();
    render(<WorkoutListRow title="Treino B" subtitle="qui · 7 exerc." onPress={onPress} />);
    expect(screen.getByText('Treino B')).toBeTruthy();
    fireEvent.press(screen.getByText('Treino B'));
    expect(onPress).toHaveBeenCalled();
  });
});
