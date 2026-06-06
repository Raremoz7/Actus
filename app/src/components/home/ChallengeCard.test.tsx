import { render, screen } from '@testing-library/react-native';
import { ChallengeCard } from './ChallengeCard';

describe('ChallengeCard', () => {
  it('mostra título, progresso "dia X de Y" e percentual no anel', () => {
    render(<ChallengeCard title="Junho" current={12} total={30} onPress={jest.fn()} />);
    expect(screen.getByText('Junho')).toBeTruthy();
    expect(screen.getByText('Dia 12 de 30')).toBeTruthy();
    expect(screen.getByText('40%')).toBeTruthy();
  });
});
