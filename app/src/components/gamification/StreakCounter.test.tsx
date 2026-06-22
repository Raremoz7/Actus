import { render, screen } from '@testing-library/react-native';
import { StreakCounter } from './StreakCounter';

describe('StreakCounter', () => {
  it('mostra o número de dias e o rótulo', () => {
    render(<StreakCounter streak={7} isBroken={false} />);
    expect(screen.getByText('7')).toBeTruthy();
    expect(screen.getByText(/dias seguidos/i)).toBeTruthy();
  });

  it('quando quebrado mostra a mensagem de recomeço', () => {
    render(<StreakCounter streak={0} isBroken />);
    expect(screen.getByText(/Comece de novo/i)).toBeTruthy();
  });
});
