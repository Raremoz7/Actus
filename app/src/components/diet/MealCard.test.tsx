import { render, screen } from '@testing-library/react-native';
import { MealCard } from './MealCard';

describe('MealCard', () => {
  it('mostra nome, alimentos e chips de macro', () => {
    render(
      <MealCard
        name="Café da manhã"
        foods="Ovos, aveia"
        kcal={450}
        protein={30}
        carbs={50}
        fat={12}
        isNext
      />,
    );
    expect(screen.getByText('Café da manhã')).toBeTruthy();
    expect(screen.getByText('Ovos, aveia')).toBeTruthy();
    expect(screen.getByText('450 kcal')).toBeTruthy();
    expect(screen.getByText('P 30')).toBeTruthy();
  });

  it('mostra o horário sugerido quando presente', () => {
    render(
      <MealCard
        name="Café da manhã"
        time="08:00"
        foods={null}
        kcal={null}
        protein={null}
        carbs={null}
        fat={null}
        isNext
      />,
    );
    expect(screen.getByText('08:00')).toBeTruthy();
  });

  it('sem macros: não mostra chips', () => {
    render(
      <MealCard
        name="Lanche"
        foods={null}
        kcal={null}
        protein={null}
        carbs={null}
        fat={null}
        isNext={false}
      />,
    );
    expect(screen.getByText('Lanche')).toBeTruthy();
    expect(screen.queryByText(/kcal/)).toBeNull();
  });
});
