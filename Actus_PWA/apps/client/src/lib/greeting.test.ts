import { greetingForHour } from './greeting';

describe('greetingForHour', () => {
  it('madrugada e manhã → Bom dia (0..11)', () => {
    expect(greetingForHour(0)).toBe('Bom dia');
    expect(greetingForHour(11)).toBe('Bom dia');
  });
  it('fronteira 12h → Boa tarde', () => {
    expect(greetingForHour(12)).toBe('Boa tarde');
    expect(greetingForHour(17)).toBe('Boa tarde');
  });
  it('fronteira 18h → Boa noite', () => {
    expect(greetingForHour(18)).toBe('Boa noite');
    expect(greetingForHour(23)).toBe('Boa noite');
  });
});
