import { challengeDayProgress, challengeStatusLabel } from './challenge';

describe('challengeDayProgress', () => {
  it('desafio de 30 dias, today no dia 14 → {day:14,total:30}', () => {
    // 2026-06-01 .. 2026-06-30 = 30 dias inclusive; hoje 2026-06-14 → dia 14
    expect(challengeDayProgress('2026-06-01', '2026-06-30', '2026-06-14')).toEqual({
      day: 14,
      total: 30,
    });
  });

  it('primeiro dia → {day:1,total:30}', () => {
    expect(challengeDayProgress('2026-06-01', '2026-06-30', '2026-06-01')).toEqual({
      day: 1,
      total: 30,
    });
  });

  it('último dia → {day:total,total:30}', () => {
    expect(challengeDayProgress('2026-06-01', '2026-06-30', '2026-06-30')).toEqual({
      day: 30,
      total: 30,
    });
  });

  it('antes de começar (today < starts) → day 0', () => {
    expect(challengeDayProgress('2026-06-01', '2026-06-30', '2026-05-20')).toEqual({
      day: 0,
      total: 30,
    });
  });

  it('depois do fim (today > ends) → day = total', () => {
    expect(challengeDayProgress('2026-06-01', '2026-06-30', '2026-07-05')).toEqual({
      day: 30,
      total: 30,
    });
  });

  it('desafio de 1 dia (starts === ends), hoje no dia → {day:1,total:1}', () => {
    expect(challengeDayProgress('2026-06-10', '2026-06-10', '2026-06-10')).toEqual({
      day: 1,
      total: 1,
    });
  });

  it('desafio de 1 dia, antes → day 0', () => {
    expect(challengeDayProgress('2026-06-10', '2026-06-10', '2026-06-09')).toEqual({
      day: 0,
      total: 1,
    });
  });

  it('desafio de 1 dia, depois → day 1', () => {
    expect(challengeDayProgress('2026-06-10', '2026-06-10', '2026-06-11')).toEqual({
      day: 1,
      total: 1,
    });
  });

  it('atravessa virada de mês (cálculo por data, não por dia do mês)', () => {
    // 2026-01-30 .. 2026-02-03 = 5 dias; hoje 2026-02-01 → dia 3
    expect(challengeDayProgress('2026-01-30', '2026-02-03', '2026-02-01')).toEqual({
      day: 3,
      total: 5,
    });
  });

  it('atravessa virada de ano', () => {
    // 2025-12-30 .. 2026-01-02 = 4 dias; hoje 2026-01-01 → dia 3
    expect(challengeDayProgress('2025-12-30', '2026-01-02', '2026-01-01')).toEqual({
      day: 3,
      total: 4,
    });
  });

  it('total mínimo 1 mesmo se ends < starts (dados inconsistentes)', () => {
    const { total } = challengeDayProgress('2026-06-10', '2026-06-01', '2026-06-10');
    expect(total).toBe(1);
  });
});

describe('challengeStatusLabel', () => {
  it('convidado → "Convite"', () => {
    expect(challengeStatusLabel('active', 'invited')).toBe('Convite');
  });

  it('participante ativo em desafio ativo → "Ativo"', () => {
    expect(challengeStatusLabel('active', 'active')).toBe('Ativo');
  });

  it('desafio encerrado → "Encerrado"', () => {
    expect(challengeStatusLabel('ended', 'active')).toBe('Encerrado');
  });

  it('desafio em rascunho (ainda não começou) → "Em breve"', () => {
    expect(challengeStatusLabel('draft', 'active')).toBe('Em breve');
  });

  it('convite tem precedência mesmo em desafio encerrado', () => {
    expect(challengeStatusLabel('ended', 'invited')).toBe('Convite');
  });
});
