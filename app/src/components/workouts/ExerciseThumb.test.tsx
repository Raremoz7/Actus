import { render, screen } from '@testing-library/react-native';
import { ExerciseThumb } from './ExerciseThumb';

describe('ExerciseThumb', () => {
  it('renderiza o placeholder', () => {
    render(<ExerciseThumb testID="thumb" />);
    expect(screen.getByTestId('thumb')).toBeTruthy();
  });
});
