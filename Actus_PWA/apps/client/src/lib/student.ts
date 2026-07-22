// Helpers puros do detalhe de aluno — sobre as datas 'YYYY-MM-DD' do backend.
// Comparamos/formatamos COMPONENTES de data — nunca toISOString (bug de fuso UTC-3).

// Idade em anos completos a partir de birth_date 'YYYY-MM-DD' e do dia LOCAL.
// `today` é um Date (passado pelo caller para manter a função pura/testável).
// Retorna null se a data for inválida ou implausível (futuro / antes de 1900).
export function calcAge(birthDate: string, today: Date): number | null {
  const parts = birthDate.split('-').map(Number);
  const [y, m, d] = parts;
  if (y === undefined || m === undefined || d === undefined) return null;
  if (!Number.isFinite(y) || !Number.isFinite(m) || !Number.isFinite(d)) return null;
  if (y < 1900 || m < 1 || m > 12 || d < 1 || d > 31) return null;

  // Componentes LOCAIS do "hoje" — sem conversão UTC.
  const ty = today.getFullYear();
  const tm = today.getMonth() + 1;
  const td = today.getDate();

  let age = ty - y;
  // Ainda não fez aniversário este ano → subtrai 1.
  if (tm < m || (tm === m && td < d)) age -= 1;

  if (age < 0 || age > 130) return null;
  return age;
}

const MONTHS_PT = [
  'jan',
  'fev',
  'mar',
  'abr',
  'mai',
  'jun',
  'jul',
  'ago',
  'set',
  'out',
  'nov',
  'dez',
] as const;

// Rótulo curto e estável de uma data 'YYYY-MM-DD': "05 jun" (dia + mês PT abreviado).
// Não usa Date para evitar qualquer deslize de fuso; lê os componentes direto.
export function formatCheckInDate(dateOnly: string): string {
  const parts = dateOnly.split('-').map(Number);
  const [, m, d] = parts;
  if (m === undefined || d === undefined) return dateOnly;
  const month = MONTHS_PT[m - 1];
  if (!month) return dateOnly;
  return `${String(d).padStart(2, '0')} ${month}`;
}
