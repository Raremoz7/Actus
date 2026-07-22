import { weekdayLetter } from './weekday';

describe('weekdayLetter', () => {
  it('mapeia ISO 1..7 (seg..dom) para letra PT', () => {
    expect(weekdayLetter(1)).toBe('S'); // segunda
    expect(weekdayLetter(2)).toBe('T'); // terça
    expect(weekdayLetter(3)).toBe('Q'); // quarta
    expect(weekdayLetter(4)).toBe('Q'); // quinta
    expect(weekdayLetter(5)).toBe('S'); // sexta
    expect(weekdayLetter(6)).toBe('S'); // sábado
    expect(weekdayLetter(7)).toBe('D'); // domingo
  });
});
