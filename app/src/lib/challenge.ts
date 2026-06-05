import type { Challenge, ChallengeListItem } from '@/types/challenges';

// Lógica pura de desafios — sem efeitos, sobre as datas 'YYYY-MM-DD'.
// A lista de /me/challenges NÃO traz progresso numérico: derivamos "dia X de Y"
// das datas (starts_on..ends_on vs hoje LOCAL).

// Converte 'YYYY-MM-DD' para um número de dia ordinal estável (dias desde a
// "época" 0000-01-01 no calendário proléptico, aproximado).
// Comparamos COMPONENTES de data — nunca toISOString (bug de fuso UTC-3).
// Math.floor garante valor inteiro e independente de horário/fuso.
function dayNumber(dateOnly: string): number {
  const [y, m, d] = dateOnly.split('-').map(Number);
  // Date.UTC dá ms em UTC a partir de componentes puros (sem influência do fuso
  // local da máquina) — usamos só para contar DIAS inteiros entre datas, não
  // para formatar/exibir. A divisão por ms-por-dia + floor anula o horário.
  return Math.floor(Date.UTC(y!, m! - 1, d!) / 86_400_000);
}

function clamp(n: number, min: number, max: number): number {
  return Math.min(Math.max(n, min), max);
}

// Progresso "dia X de Y" derivado das datas do desafio e do hoje LOCAL.
// total = nº de dias inclusive (ends - starts + 1, mínimo 1).
// day = clamp(today - starts + 1, 0..total):
//   0     se ainda não começou (today < starts)
//   total se já terminou       (today > ends)
export function challengeDayProgress(
  startsOn: string,
  endsOn: string,
  today: string,
): { day: number; total: number } {
  const start = dayNumber(startsOn);
  const end = dayNumber(endsOn);
  const now = dayNumber(today);

  const total = Math.max(end - start + 1, 1);
  const day = clamp(now - start + 1, 0, total);

  return { day, total };
}

// Rótulo curto de status do desafio para tags/cards.
// Convite tem precedência (é a ação pendente do aluno); depois deriva do status
// do próprio desafio.
export function challengeStatusLabel(
  status: Challenge['status'],
  participantStatus: ChallengeListItem['participant_status'],
): string {
  if (participantStatus === 'invited') return 'Convite';
  if (status === 'ended') return 'Encerrado';
  if (status === 'draft') return 'Em breve';
  return 'Ativo';
}
