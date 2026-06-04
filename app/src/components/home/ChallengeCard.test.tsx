import { render, screen } from '@testing-library/react-native';
import { ChallengeCard } from './ChallengeCard';

describe('ChallengeCard', () => {
  it('mostra título e progresso', () => {
    render(<ChallengeCard title="Junho" current={12} total={30} onPress={jest.fn()} />);
    expect(screen.getByText('Junho')).toBeTruthy();
    expect(screen.getByText('12 / 30 dias')).toBeTruthy();
  });
});
