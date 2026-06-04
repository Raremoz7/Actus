import { render, screen } from '@testing-library/react-native';
import { HomeHeader } from './HomeHeader';

describe('HomeHeader', () => {
  it('mostra saudação com nome e streak', () => {
    render(<HomeHeader greeting="Bom dia" name="Davi" streakCurrent={7} dateLabel="Terça · 03 jun" />);
    expect(screen.getByText('Bom dia, Davi')).toBeTruthy();
    expect(screen.getByText('7')).toBeTruthy();
    expect(screen.getByText('Terça · 03 jun')).toBeTruthy();
  });

  it('sem nome → só a saudação', () => {
    render(<HomeHeader greeting="Boa noite" name={null} streakCurrent={0} dateLabel="Qui · 05 jun" />);
    expect(screen.getByText('Boa noite')).toBeTruthy();
  });
});
