import { render, screen, fireEvent } from '@testing-library/react-native';
import { NextWorkoutCard } from './NextWorkoutCard';

describe('NextWorkoutCard', () => {
  it('mostra foco, contagem e dispara onStart', () => {
    const onStart = jest.fn();
    render(
      <NextWorkoutCard
        title="Peito e tríceps"
        exerciseCount={6}
        estMinutes={50}
        isToday
        onStart={onStart}
        onOpen={jest.fn()}
      />,
    );
    expect(screen.getByText('Peito e tríceps')).toBeTruthy();
    fireEvent.press(screen.getByText('Iniciar treino'));
    expect(onStart).toHaveBeenCalledTimes(1);
  });

  it('esconde minutos quando estMinutes <= 0', () => {
    render(
      <NextWorkoutCard
        title="Treino A"
        exerciseCount={6}
        estMinutes={0}
        isToday={false}
        onStart={jest.fn()}
        onOpen={jest.fn()}
      />,
    );
    expect(screen.getByText('6 exercícios')).toBeTruthy();
  });
});
