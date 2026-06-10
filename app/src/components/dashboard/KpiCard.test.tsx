import { render, screen } from '@testing-library/react-native';
import { KpiCard } from './KpiCard';

describe('KpiCard', () => {
  it('mostra o valor e o rótulo', () => {
    render(<KpiCard value={7} label="Alunos" />);
    expect(screen.getByText('7')).toBeTruthy();
    expect(screen.getByText('Alunos')).toBeTruthy();
  });
});
