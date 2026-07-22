import { render, screen } from '@testing-library/react-native';
import { ChallengeCalendar } from './ChallengeCalendar';

describe('ChallengeCalendar', () => {
  // Desafio: 06 jun → 06 jul 2026. Hoje: 12 jun.
  const BASE = {
    startsOn: '2026-06-06',
    endsOn: '2026-07-06',
    today: '2026-06-12',
  };

  it('marca hoje com accessibilityLabel "12, hoje"', () => {
    render(<ChallengeCalendar {...BASE} />);
    expect(screen.getByLabelText('12, hoje')).toBeTruthy();
  });

  it('marca o último dia com accessibilityLabel "6, fim"', () => {
    render(<ChallengeCalendar {...BASE} />);
    expect(screen.getByLabelText('6, fim')).toBeTruthy();
  });

  it('mostra separador de mês quando o desafio cruza virada', () => {
    render(<ChallengeCalendar {...BASE} />);
    expect(screen.getByText('Julho')).toBeTruthy();
  });

  it('não mostra separador de mês quando desafio é no mesmo mês', () => {
    render(
      <ChallengeCalendar
        startsOn="2026-06-01"
        endsOn="2026-06-30"
        today="2026-06-12"
      />,
    );
    expect(screen.queryByText('Julho')).toBeNull();
    expect(screen.queryByText('Junho')).toBeNull();
  });

  it('células fora do intervalo não têm accessibilityLabel (não acessíveis)', () => {
    render(<ChallengeCalendar {...BASE} />);
    expect(screen.getByLabelText('6, fim')).toBeTruthy();
  });

  it('quando hoje está fora do desafio não há célula "hoje"', () => {
    render(
      <ChallengeCalendar
        startsOn="2026-05-01"
        endsOn="2026-05-31"
        today="2026-06-12"
      />,
    );
    expect(screen.queryByLabelText(/hoje/)).toBeNull();
  });
});
