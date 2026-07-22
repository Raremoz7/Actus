import { render, screen, fireEvent } from '@testing-library/react-native';

const mockPush = jest.fn();
jest.mock('@/navigation', () => ({ router: { push: (...a: unknown[]) => mockPush(...a) } }));
jest.mock('@/hooks/useMe', () => ({
  useMe: () => ({ data: { display_name: 'Davi', tipo: 'personal' } }),
}));
jest.mock('@/hooks/useStudents', () => ({
  useStudents: () => ({
    data: {
      students: [
        {
          id: '1',
          email: 'a@x.com',
          full_name: 'Ana',
          birth_date: null,
          professional_role: 'personal',
          linked_at: '2026-06-01',
        },
      ],
    },
  }),
}));
jest.mock('@/hooks/useProWorkouts', () => ({
  useProWorkouts: () => ({ data: { workouts: [{}, {}] } }),
}));
jest.mock('@/hooks/useProChallenges', () => ({
  useProChallenges: () => ({ data: { challenges: [{ status: 'active' }, { status: 'ended' }] } }),
}));

import { PersonalDashboard } from './PersonalDashboard';

describe('PersonalDashboard', () => {
  it('mostra saudação, KPIs e ações do personal', () => {
    render(<PersonalDashboard />);
    // A saudação varia com a hora; verificamos só que o nome aparece no cabeçalho.
    expect(screen.getByText(/Davi/)).toBeTruthy();
    expect(screen.getByText('Treinos')).toBeTruthy();
    expect(screen.getByText('Desafios ativos')).toBeTruthy();
  });

  it('ação "Novo treino" navega para o montar-treino', () => {
    render(<PersonalDashboard />);
    fireEvent.press(screen.getByText('Novo treino'));
    expect(mockPush).toHaveBeenCalledWith('/montar-treino');
  });
});
