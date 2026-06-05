import { render, screen, fireEvent } from '@testing-library/react-native';
import { DietCard } from './DietCard';

describe('DietCard', () => {
  it('mostra título e próxima refeição (mock) e responde ao toque', () => {
    const onPress = jest.fn();
    render(<DietCard title="Cutting" nextMealTime="12:30" onPress={onPress} />);
    expect(screen.getByText('Cutting')).toBeTruthy();
    expect(screen.getByText('Dieta')).toBeTruthy();
    fireEvent.press(screen.getByText('Cutting'));
    expect(onPress).toHaveBeenCalled();
  });
});
