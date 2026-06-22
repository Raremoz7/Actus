import { render, screen } from '@testing-library/react-native';
import { BadgeGrid } from './BadgeGrid';

const badges = [
  { id: 'first_step', name: 'Primeiro Passo', description: '', asset_key: 'a', earned: true },
  { id: 'committed_5', name: 'Comprometido', description: '', asset_key: 'a', earned: false },
];

describe('BadgeGrid', () => {
  it('renderiza todos os badges e marca os bloqueados', () => {
    render(<BadgeGrid badges={badges as any} />);
    expect(screen.getByText('Primeiro Passo')).toBeTruthy();
    expect(screen.getByText('Comprometido')).toBeTruthy();
    expect(screen.getByTestId('badge-committed_5-locked')).toBeTruthy();
  });
});
