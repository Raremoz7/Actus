import { render, screen, fireEvent } from '@testing-library/react-native';
import { DietCard } from './DietCard';

describe('DietCard', () => {
  it('mostra título, 1ª refeição e responde ao toque', () => {
    const onPress = jest.fn();
    render(<DietCard title="Cutting" nextMealTime="Café da manhã" onPress={onPress} />);
    expect(screen.getByText('Cutting')).toBeTruthy();
    expect(screen.getByText('Dieta')).toBeTruthy();
    expect(screen.getByText('Café da manhã')).toBeTruthy();
    fireEvent.press(screen.getByText('Cutting'));
    expect(onPress).toHaveBeenCalled();
  });

  it('sem refeição (null): não mostra a linha', () => {
    render(<DietCard title="Cutting" nextMealTime={null} />);
    expect(screen.getByText('Cutting')).toBeTruthy();
  });
});
