import { render, screen } from '@testing-library/react-native';
import { WeekdayChips } from './WeekdayChips';

describe('WeekdayChips', () => {
  it('renderiza os 7 dias', () => {
    render(<WeekdayChips active={[1, 3, 5]} />);
    expect(screen.getByText('D')).toBeTruthy();
  });
});
