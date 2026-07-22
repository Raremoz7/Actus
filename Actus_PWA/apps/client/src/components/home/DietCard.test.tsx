import { render, screen, fireEvent } from '@testing-library/react-native';
import { DietCard } from './DietCard';

describe('DietCard', () => {
  it('mostra título, dado real (refeições + meta kcal) e responde ao toque', () => {
    const onPress = jest.fn();
    render(<DietCard title="Cutting" mealCount={5} targetKcal={2400} onPress={onPress} />);
    expect(screen.getByText('Cutting')).toBeTruthy();
    expect(screen.getByText('Dieta')).toBeTruthy();
    expect(screen.getByText('5 refeições · 2.400 kcal')).toBeTruthy();
    fireEvent.press(screen.getByText('Cutting'));
    expect(onPress).toHaveBeenCalled();
  });

  it('sem meta kcal: mostra só a contagem de refeições', () => {
    render(<DietCard title="Cutting" mealCount={1} />);
    expect(screen.getByText('1 refeição')).toBeTruthy();
  });
});
