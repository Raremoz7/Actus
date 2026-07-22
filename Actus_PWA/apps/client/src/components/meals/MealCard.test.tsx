import { render, screen, fireEvent } from '@testing-library/react-native';
import { MealCard } from './MealCard';
import type { FeedMeal } from '@/lib/meals';

const base: FeedMeal = {
  key: 'm1', id: 'm1', photoUri: null, eatenAt: '2026-07-01T12:30:00.000Z',
  description: 'Frango e arroz', tags: ['Almoço'], comments: [], sync: 'synced',
};

describe('MealCard', () => {
  it('mostra descrição, horário e tag', () => {
    render(<MealCard meal={base} onEdit={() => {}} onDelete={() => {}} />);
    expect(screen.getByText('Frango e arroz')).toBeTruthy();
    expect(screen.getByText('Almoço')).toBeTruthy();
  });

  it('mostra badge de aguardando quando pending', () => {
    render(<MealCard meal={{ ...base, sync: 'pending' }} onEdit={() => {}} onDelete={() => {}} />);
    expect(screen.getByText('Aguardando sincronização')).toBeTruthy();
  });

  it('dispara onDelete', () => {
    const onDelete = jest.fn();
    render(<MealCard meal={base} onEdit={() => {}} onDelete={onDelete} />);
    fireEvent.press(screen.getByLabelText('Excluir refeição'));
    expect(onDelete).toHaveBeenCalledTimes(1);
  });
});
