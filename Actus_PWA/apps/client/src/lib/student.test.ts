import { calcAge, formatCheckInDate } from './student';

describe('calcAge', () => {
  it('calcula idade em anos completos (aniversário já passou no ano)', () => {
    // nasceu 1995-03-10; hoje 2026-06-05 → 31.
    expect(calcAge('1995-03-10', new Date(2026, 5, 5))).toBe(31);
  });

  it('subtrai 1 quando o aniversário ainda não chegou este ano', () => {
    // nasceu 1995-12-25; hoje 2026-06-05 → 30.
    expect(calcAge('1995-12-25', new Date(2026, 5, 5))).toBe(30);
  });

  it('conta o aniversário no próprio dia', () => {
    // nasceu 2000-06-05; hoje 2000+26 mesmo dia → 26.
    expect(calcAge('2000-06-05', new Date(2026, 5, 5))).toBe(26);
  });

  it('rejeita data implausível (futuro) com null', () => {
    expect(calcAge('2030-01-01', new Date(2026, 5, 5))).toBeNull();
  });

  it('rejeita data malformada com null', () => {
    expect(calcAge('not-a-date', new Date(2026, 5, 5))).toBeNull();
  });
});

describe('formatCheckInDate', () => {
  it('formata como "dia mês" abreviado PT', () => {
    expect(formatCheckInDate('2026-06-05')).toBe('05 jun');
    expect(formatCheckInDate('2026-01-31')).toBe('31 jan');
    expect(formatCheckInDate('2026-12-09')).toBe('09 dez');
  });

  it('devolve a string original se malformada', () => {
    expect(formatCheckInDate('abc')).toBe('abc');
  });
});
