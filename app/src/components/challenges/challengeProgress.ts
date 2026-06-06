// Leitura TEMPORAL de um desafio a partir das suas datas data-only
// (starts_on..ends_on, YYYY-MM-DD) comparadas com HOJE no fuso LOCAL.
//
// Por que aqui (e não em format.ts): é regra de produto do bloco Profissional —
// derivar "Dia X de Y", "Começa em N dias" e "Encerrado" sem nenhum campo de
// progresso vindo da API. As datas são DATA-ONLY: comparamos por componentes
// locais (nunca new Date(iso) cru, que faz parse UTC e "vira" o dia em UTC-3).

// Converte 'YYYY-MM-DD' em um número de dia ordinal estável (dias desde a época
// no calendário LOCAL), usando Date(ano, mês-1, dia) — meia-noite local, sem
// fuso. Serve só para diferenças entre datas data-only.
function dayNumberFromDateOnly(dateOnly: string): number | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateOnly);
  if (!m) return null;
  const year = Number(m[1]);
  const month = Number(m[2]);
  const day = Number(m[3]);
  const date = new Date(year, month - 1, day);
  // Diferença em dias inteiros (a meia-noite local cancela o fuso na subtração).
  return Math.round(date.getTime() / 86_400_000);
}

// HOJE como número de dia ordinal local (mesma base de dayNumberFromDateOnly).
function todayDayNumber(now: Date): number {
  const local = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  return Math.round(local.getTime() / 86_400_000);
}

export type ChallengeStatus = 'draft' | 'active' | 'ended';

export type ChallengeTiming =
  | { kind: 'upcoming'; daysUntilStart: number }
  | { kind: 'running'; dayCurrent: number; dayTotal: number; ratio: number }
  | { kind: 'ended' };

// Deriva a leitura temporal de um desafio a partir do par de datas + status.
//
// Regras:
// - status 'ended'                       → { kind: 'ended' }
// - hoje < starts_on                     → { kind: 'upcoming', daysUntilStart }
// - starts_on <= hoje (<= ends_on)       → { kind: 'running', dia X de Y }
// - hoje > ends_on (mas status != ended) → running fixado no último dia (Y de Y)
//
// dayTotal é INCLUSIVO (starts e ends contam): ends - starts + 1, mínimo 1.
export function deriveChallengeTiming(
  startsOn: string,
  endsOn: string,
  status: ChallengeStatus,
  now: Date = new Date(),
): ChallengeTiming {
  if (status === 'ended') return { kind: 'ended' };

  const start = dayNumberFromDateOnly(startsOn);
  const end = dayNumberFromDateOnly(endsOn);
  const today = todayDayNumber(now);

  // Datas malformadas: não inventa leitura temporal.
  if (start === null || end === null) {
    return status === 'draft'
      ? { kind: 'upcoming', daysUntilStart: 0 }
      : { kind: 'running', dayCurrent: 1, dayTotal: 1, ratio: 0 };
  }

  const dayTotal = Math.max(1, end - start + 1);

  // Rascunho ainda não publicado: nunca "em andamento", mesmo que a data de
  // início já tenha passado — é sempre uma contagem regressiva (mín. 0 = hoje).
  if (status === 'draft') {
    return { kind: 'upcoming', daysUntilStart: Math.max(0, start - today) };
  }

  if (today < start) {
    return { kind: 'upcoming', daysUntilStart: start - today };
  }

  // Dentro (ou após) o intervalo: dia atual 1-based, fixado ao total no fim.
  const rawCurrent = today - start + 1;
  const dayCurrent = Math.min(Math.max(1, rawCurrent), dayTotal);
  const ratio = dayTotal === 0 ? 0 : dayCurrent / dayTotal;
  return { kind: 'running', dayCurrent, dayTotal, ratio };
}

// Rótulo curto da leitura temporal — para o card da lista.
// 'Dia 4 de 30' / 'Começa em 3 dias' / 'Começa amanhã' / 'Começa hoje' / 'Encerrado'.
export function challengeTimingLabel(timing: ChallengeTiming): string {
  switch (timing.kind) {
    case 'ended':
      return 'Encerrado';
    case 'upcoming':
      if (timing.daysUntilStart <= 0) return 'Começa hoje';
      if (timing.daysUntilStart === 1) return 'Começa amanhã';
      return `Começa em ${timing.daysUntilStart} dias`;
    case 'running':
      return `Dia ${timing.dayCurrent} de ${timing.dayTotal}`;
  }
}

// Dias inteiros decorridos desde um timestamp (ISO completo) até agora, mínimo 0.
// Usado em "convidado há N dias" (invited_at é TIMESTAMP, não data-only).
export function daysSinceTimestamp(iso: string, now: Date = new Date()): number {
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return 0;
  const diff = now.getTime() - then;
  if (diff <= 0) return 0;
  return Math.floor(diff / 86_400_000);
}

// 'convidado hoje' / 'convidado ontem' / 'convidado há N dias'.
export function invitedAgoLabel(invitedAtIso: string, now: Date = new Date()): string {
  const days = daysSinceTimestamp(invitedAtIso, now);
  if (days <= 0) return 'convidado hoje';
  if (days === 1) return 'convidado ontem';
  return `convidado há ${days} dias`;
}
