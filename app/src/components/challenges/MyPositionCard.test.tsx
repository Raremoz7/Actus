import { render, screen } from '@testing-library/react-native';
import { MyPositionCard } from './MyPositionCard';

const BASE_STANDING = {
  position: 3,
  streakCurrent: 5,
  activeDays: 10,
  streakBest: 7,
  lastActivityDate: '2026-06-12',
};

describe('MyPositionCard', () => {
  it('mostra posição, sequência e dias ativos', () => {
    render(<MyPositionCard standing={BASE_STANDING} today="2026-06-12" />);
    expect(screen.getByText('3º')).toBeTruthy();
    expect(screen.getByText('5')).toBeTruthy();
    expect(screen.getByText('10')).toBeTruthy();
  });

  it('mostra chama quando streakCurrent >= 1', () => {
    render(<MyPositionCard standing={BASE_STANDING} today="2026-06-12" />);
    expect(screen.getByTestId('streak-flame')).toBeTruthy();
  });

  it('não mostra chama quando streakCurrent é 0', () => {
    render(
      <MyPositionCard
        standing={{ ...BASE_STANDING, streakCurrent: 0 }}
        today="2026-06-12"
      />,
    );
    expect(screen.queryByTestId('streak-flame')).toBeNull();
  });

  it('mostra mensagem de intenção quando ranking é privado', () => {
    render(<MyPositionCard isPrivate today="2026-06-12" />);
    expect(screen.getByText(/ranking privado/i)).toBeTruthy();
  });

  it('mostra mensagem de sem registro quando sem standing', () => {
    render(<MyPositionCard today="2026-06-12" />);
    expect(screen.getByText(/não tem registro/i)).toBeTruthy();
  });
});
