// Helpers de convite — puros, sem efeitos. O convite gera um deep link que abre
// a tela de cadastro já com o código preenchido (scheme 'actus', rota register).

// Deep link de cadastro a partir do código do convite.
// encodeURIComponent garante um valor query-safe (espaços, &, etc.).
export function inviteDeepLink(code: string): string {
  return `actus://register?code=${encodeURIComponent(code)}`;
}

// Mensagem pronta para compartilhar (Share.share). Copy quiet-luxury: específica,
// sem buzzword, sem emoji — só o convite e o link.
export function inviteShareMessage(code: string): string {
  return `Seu acesso ao Actus: ${inviteDeepLink(code)}`;
}

// Normaliza um telefone para o formato do wa.me (só dígitos, com DDI). Assume Brasil
// (55) quando o número vem sem código de país. Vazio quando não há dígitos.
export function normalizePhoneForWhatsApp(raw: string): string {
  const digits = raw.replace(/\D/g, '');
  if (!digits) return '';
  return digits.startsWith('55') ? digits : `55${digits}`;
}

// URL do WhatsApp com a mensagem do convite pronta. Com `phone` abre a conversa direta
// (inserir aluno manualmente pelo número); sem `phone`, o WhatsApp pede o contato.
export function inviteWhatsAppUrl(code: string, phone?: string): string {
  const text = encodeURIComponent(inviteShareMessage(code));
  const normalized = phone ? normalizePhoneForWhatsApp(phone) : '';
  return normalized ? `https://wa.me/${normalized}?text=${text}` : `https://wa.me/?text=${text}`;
}

const MS_PER_DAY = 24 * 60 * 60 * 1000;

// Instante (ISO 8601 completo, com hora) correspondente a "agora + N dias".
// expires_at é um TIMESTAMP (instante), não data-only → o ISO completo é o
// formato CORRETO (a regra anti-toISOString vale só para campos data-only).
// Usa o relógio do dispositivo; `now` é injetável para testes determinísticos.
export function isoInDays(days: number, now: Date = new Date()): string {
  return new Date(now.getTime() + days * MS_PER_DAY).toISOString();
}

// Rótulo de validade de um convite a partir do instante de expiração (ISO) vs.
// agora. "expira hoje" / "expira em N dias" enquanto futuro; "expirado" quando
// já passou. Compara instantes (timestamps), arredondando pra cima os dias
// restantes (1ms restante ainda é "expira hoje").
export function inviteExpiryLabel(
  expiresAtIso: string,
  now: Date = new Date(),
): string {
  const expiresMs = new Date(expiresAtIso).getTime();
  const diffMs = expiresMs - now.getTime();
  if (diffMs <= 0) return 'expirado';
  const days = Math.ceil(diffMs / MS_PER_DAY);
  if (days <= 1) return 'expira hoje';
  return `expira em ${days} dias`;
}
