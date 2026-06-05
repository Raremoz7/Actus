import { estimatedMinutes } from './duration';

describe('estimatedMinutes', () => {
  it('soma sets*(reps*3s + rest) e arredonda em minutos', () => {
    expect(estimatedMinutes([{ sets: 4, reps: 10, rest_seconds: 60 }])).toBe(6);
  });
  it('lista vazia → 0', () => {
    expect(estimatedMinutes([])).toBe(0);
  });
  it('soma múltiplos exercícios', () => {
    expect(
      estimatedMinutes([
        { sets: 4, reps: 10, rest_seconds: 60 },
        { sets: 3, reps: 12, rest_seconds: 45 },
      ]),
    ).toBe(10);
  });
});
