import {
  inviteDeepLink,
  inviteShareMessage,
  isoInDays,
  inviteExpiryLabel,
} from './invite';

describe('inviteDeepLink', () => {
  it('monta o deep link no scheme actus com o code', () => {
    expect(inviteDeepLink('ABC123')).toBe('actus://register?code=ABC123');
  });

  it('encoda caracteres especiais do code (query-safe)', () => {
    // espaços e símbolos precisam ser percent-encoded para um link válido.
    expect(inviteDeepLink('a b&c')).toBe('actus://register?code=a%20b%26c');
  });

  it('code vazio gera link com code vazio (sem quebrar)', () => {
    expect(inviteDeepLink('')).toBe('actus://register?code=');
  });
});

describe('inviteShareMessage', () => {
  it('inclui o deep link do code na mensagem', () => {
    const msg = inviteShareMessage('ABC123');
    expect(msg).toContain('actus://register?code=ABC123');
  });

  it('usa copy quiet-luxury (menciona Actus, sem buzzword/emoji)', () => {
    const msg = inviteShareMessage('ABC123');
    expect(msg).toContain('Actus');
    // sem chamadas genéricas de marketing.
    expect(msg).not.toMatch(/comece agora|saiba mais/i);
  });
});

describe('isoInDays', () => {
  const now = new Date('2026-06-05T10:00:00.000Z');

  it('soma N dias ao instante atual em ISO 8601 completo (com hora)', () => {
    expect(isoInDays(7, now)).toBe('2026-06-12T10:00:00.000Z');
  });

  it('0 dias é o próprio instante', () => {
    expect(isoInDays(0, now)).toBe('2026-06-05T10:00:00.000Z');
  });
});

describe('inviteExpiryLabel', () => {
  const now = new Date('2026-06-05T10:00:00.000Z');

  it('mostra "expira em N dias" quando ainda futuro', () => {
    expect(inviteExpiryLabel('2026-06-12T10:00:00.000Z', now)).toBe(
      'expira em 7 dias',
    );
  });

  it('arredonda pra cima dias parciais', () => {
    // ~1.5 dias restantes → "expira em 2 dias".
    expect(inviteExpiryLabel('2026-06-06T22:00:00.000Z', now)).toBe(
      'expira em 2 dias',
    );
  });

  it('mostra "expira hoje" quando falta menos de 1 dia', () => {
    expect(inviteExpiryLabel('2026-06-05T18:00:00.000Z', now)).toBe(
      'expira hoje',
    );
  });

  it('mostra "expirado" quando o instante já passou', () => {
    expect(inviteExpiryLabel('2026-06-04T10:00:00.000Z', now)).toBe('expirado');
  });

  it('mostra "expirado" no exato instante de expiração', () => {
    expect(inviteExpiryLabel('2026-06-05T10:00:00.000Z', now)).toBe('expirado');
  });
});
