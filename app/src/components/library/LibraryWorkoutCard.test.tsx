import { render, screen, fireEvent } from '@testing-library/react-native';
import { LibraryWorkoutCard } from './LibraryWorkoutCard';
import { getWorkoutLibrary } from '@/data/workoutLibrary';

describe('LibraryWorkoutCard', () => {
  it('mostra o nome do programa e dispara onPress', () => {
    const w = getWorkoutLibrary()[0]!;
    const onPress = jest.fn();
    render(<LibraryWorkoutCard workout={w} onPress={onPress} />);
    fireEvent.press(screen.getByText(w.name));
    expect(onPress).toHaveBeenCalledTimes(1);
  });
});
