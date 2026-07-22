import { underlineTranslateX } from './underline';

describe('underlineTranslateX', () => {
  it('centraliza sob a 1ª aba (4 abas)', () => {
    // tabWidth = 100; 0*100 + (100-30)/2 = 35
    expect(underlineTranslateX(0, 400, 4, 30)).toBe(35);
  });

  it('centraliza sob a última aba (4 abas)', () => {
    // 3*100 + 35 = 335
    expect(underlineTranslateX(3, 400, 4, 30)).toBe(335);
  });

  it('funciona com 3 abas (nutri)', () => {
    // tabWidth = 120; 1*120 + (120-30)/2 = 165
    expect(underlineTranslateX(1, 360, 3, 30)).toBe(165);
  });

  it('barWidth ainda não medido (0) retorna 0', () => {
    expect(underlineTranslateX(0, 0, 4, 30)).toBe(0);
  });

  it('tabCount 0 retorna 0 (degenerado)', () => {
    expect(underlineTranslateX(0, 400, 0, 30)).toBe(0);
  });
});
