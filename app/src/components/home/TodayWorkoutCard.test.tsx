import { render, screen, fireEvent } from '@testing-library/react-native';
import { TodayWorkoutCard } from './TodayWorkoutCard';
import type { TodayWorkoutSummary } from '@/types/workouts';

const comTreino: TodayWorkoutSummary = {
  has_workout: true,
  workout: {
    id: '11111111-1111-1111-1111-111111111111',
    name: 'Treino A',
    muscle_groups: 'Peito e Tríceps',
    exercise_count: 6,
    est_minutes: 50,
  },
  next_workout: null,
};

const descanso: TodayWorkoutSummary = {
  has_workout: false,
  workout: null,
  next_workout: { weekday: 5, muscle_groups: 'Costas' },
};

describe('TodayWorkoutCard', () => {
  it('estado com treino: mostra grupo, métricas e CTA', () => {
    const onStart = jest.fn();
    render(<TodayWorkoutCard summary={comTreino} onStart={onStart} onSeeWeek={jest.fn()} />);
    expect(screen.getByText('Peito e Tríceps')).toBeTruthy();
    expect(screen.getByText('Iniciar treino')).toBeTruthy();
    fireEvent.press(screen.getByText('Iniciar treino'));
    expect(onStart).toHaveBeenCalledTimes(1);
  });

  it('estado de descanso: sem CTA de iniciar, com atalho da semana', () => {
    const onSeeWeek = jest.fn();
    render(<TodayWorkoutCard summary={descanso} onStart={jest.fn()} onSeeWeek={onSeeWeek} />);
    expect(screen.getByText('Dia de descanso')).toBeTruthy();
    expect(screen.queryByText('Iniciar treino')).toBeNull();
    fireEvent.press(screen.getByText('Ver treinos da semana'));
    expect(onSeeWeek).toHaveBeenCalledTimes(1);
  });
});
