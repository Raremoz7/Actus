import { render, screen } from '@testing-library/react-native';
import { HomeHeader } from './HomeHeader';

describe('HomeHeader', () => {
  it('saudação recua a eyebrow; estado do dia é a heroína (H2)', () => {
    render(
      <HomeHeader
        greeting="Bom dia"
        name="Davi"
        dateLabel="Terça · 03 jun"
        headline="Peito e Tríceps hoje"
      />,
    );
    expect(screen.getByText('Bom dia, Davi')).toBeTruthy();
    expect(screen.getByText('Peito e Tríceps hoje')).toBeTruthy();
    expect(screen.getByText('Terça · 03 jun')).toBeTruthy();
  });

  it('sem nome → só a saudação', () => {
    render(
      <HomeHeader
        greeting="Boa noite"
        name={null}
        dateLabel="Qui · 05 jun"
        headline="Descanso programado"
      />,
    );
    expect(screen.getByText('Boa noite')).toBeTruthy();
    expect(screen.getByText('Descanso programado')).toBeTruthy();
  });
});
