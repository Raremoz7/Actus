import { render, screen } from '@testing-library/react-native';
import { HomeHeader } from './HomeHeader';

describe('HomeHeader', () => {
  it('top bar mostra data (eyebrow) + saudação com nome', () => {
    render(<HomeHeader greeting="Bom dia" name="Davi" dateLabel="Terça · 03 jun" />);
    expect(screen.getByText('Bom dia, Davi')).toBeTruthy();
    expect(screen.getByText('Terça · 03 jun')).toBeTruthy();
  });

  it('sem nome → só a saudação', () => {
    render(<HomeHeader greeting="Boa noite" name={null} dateLabel="Qui · 05 jun" />);
    expect(screen.getByText('Boa noite')).toBeTruthy();
    expect(screen.getByText('Qui · 05 jun')).toBeTruthy();
  });
});
