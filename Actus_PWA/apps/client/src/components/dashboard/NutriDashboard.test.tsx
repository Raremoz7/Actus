import { render, screen, fireEvent } from '@testing-library/react-native';

const mockPush = jest.fn();
jest.mock('@/navigation', () => ({ router: { push: (...a: unknown[]) => mockPush(...a) } }));
jest.mock('@/hooks/useMe', () => ({
  useMe: () => ({ data: { display_name: 'Lia', tipo: 'nutricionista' } }),
}));
jest.mock('@/hooks/useStudents', () => ({
  useStudents: () => ({ data: { students: [] } }),
}));
jest.mock('@/hooks/useDietTemplates', () => ({
  useDietTemplates: () => ({ data: { diet_templates: [{}, {}, {}] } }),
}));

import { NutriDashboard } from './NutriDashboard';

describe('NutriDashboard', () => {
  it('mostra KPI de dietas e ação "Nova dieta"', () => {
    render(<NutriDashboard />);
    expect(screen.getByText('Dietas')).toBeTruthy();
    expect(screen.getByText('3')).toBeTruthy();
  });

  it('ação "Nova dieta" navega para o montar-dieta', () => {
    render(<NutriDashboard />);
    fireEvent.press(screen.getByText('Nova dieta'));
    expect(mockPush).toHaveBeenCalledWith('/montar-dieta');
  });
});
