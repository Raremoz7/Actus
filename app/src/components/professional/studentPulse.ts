// Helpers puros do "pulso" do aluno (lista + detalhe). Operam sobre datas:
// `linked_at`/`created_at` são TIMESTAMPS ISO (ok usar Date direto) e
// `check_in_date` é date-only 'YYYY-MM-DD' (NUNCA toISOString — bug de fuso UTC-3).

import type { CheckIn } from '@/types/professional';
import { formatDateLocal } from '@/lib/format';

// Quantos dias um vínculo é considerado "novo" (badge na lista).
export const NEW_LINK_DAYS = 7;

// Quantas semanas a mini-trilha de aderência mostra (4 semanas = 28 dias).
export const HEATMAP_WEEKS = 4;
const HEATMAP_DAYS = HEATMAP_WEEKS * 7;

// Diferença em dias inteiros entre dois timestamps (a - b), ignorando horas.
// Usa componentes LOCAIS de cada Date (sem UTC) para alinhar com o calendário do usuário.
function dayDiffLocal(a: Date, b: Date): number {
  const da = new Date(a.getFullYear(), a.getMonth(), a.getDate());
  const db = new Date(b.getFullYear(), b.getMonth(), b.getDate());
  return Math.round((da.getTime() - db.getTime()) / 86_400_000);
}

// "Desde DD/MM" a partir de um timestamp ISO de vínculo (linked_at).
// Lê componentes LOCAIS do Date (linked_at é timestamp, não date-only).
export function linkedSinceLabel(linkedAt: string): string | null {
  const d = new Date(linkedAt);
  if (Number.isNaN(d.getTime())) return null;
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  return `Desde ${day}/${month}`;
}

// Há quantos dias o vínculo foi criado (para marcar "Novo"). null se inválido.
export function daysSinceLinked(linkedAt: string, now: Date): number | null {
  const d = new Date(linkedAt);
  if (Number.isNaN(d.getTime())) return null;
  return dayDiffLocal(now, d);
}

// Vínculo recente o bastante para o selo "Novo".
export function isNewLink(linkedAt: string, now: Date): boolean {
  const n = daysSinceLinked(linkedAt, now);
  return n !== null && n >= 0 && n <= NEW_LINK_DAYS;
}

// Compara dois alunos por linked_at desc (mais recente primeiro). Vínculos sem
// data válida vão para o fim (Infinity de "idade").
export function compareByLinkedDesc(a: { linked_at: string }, b: { linked_at: string }): number {
  const ta = new Date(a.linked_at).getTime();
  const tb = new Date(b.linked_at).getTime();
  const va = Number.isNaN(ta) ? -Infinity : ta;
  const vb = Number.isNaN(tb) ? -Infinity : tb;
  return vb - va;
}

// Dias desde o check-in mais recente (date-only). null se não há check-in.
// O check-in mais recente é o maior check_in_date — não dependemos da ordem da API.
export function daysSinceLastCheckIn(checkIns: CheckIn[], now: Date): number | null {
  let latest = '';
  for (const c of checkIns) {
    if (c.check_in_date > latest) latest = c.check_in_date;
  }
  if (latest === '') return null;
  const [y, m, d] = latest.split('-').map(Number);
  if (y === undefined || m === undefined || d === undefined) return null;
  const last = new Date(y, m - 1, d);
  return dayDiffLocal(now, last);
}

// Rótulo humano de "último check-in há N dias".
export function lastCheckInLabel(days: number | null): string {
  if (days === null) return 'Sem check-in registrado';
  if (days <= 0) return 'Último check-in hoje';
  if (days === 1) return 'Último check-in ontem';
  return `Último check-in há ${days} dias`;
}

// Uma célula da mini-trilha: a data local (YYYY-MM-DD) e se houve check-in nela.
export type HeatCell = {
  date: string;
  active: boolean;
};

// Constrói as últimas HEATMAP_DAYS células (ordem cronológica, hoje por último),
// marcando como ativas as datas que têm ao menos um check-in. Comparação por
// string date-only — sem Date(iso), sem deslize de fuso.
export function buildHeatmap(checkIns: CheckIn[], now: Date): HeatCell[] {
  const active = new Set<string>();
  for (const c of checkIns) active.add(c.check_in_date);

  const cells: HeatCell[] = [];
  for (let i = HEATMAP_DAYS - 1; i >= 0; i -= 1) {
    const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i);
    const key = formatDateLocal(d);
    cells.push({ date: key, active: active.has(key) });
  }
  return cells;
}

// Quantos dias ativos (com check-in) nas últimas HEATMAP_WEEKS semanas.
export function activeDaysInWindow(cells: HeatCell[]): number {
  return cells.reduce((acc, c) => acc + (c.active ? 1 : 0), 0);
}

// Um check-in veio de um treino concluído? (tem workout_session_id ou source de treino).
export function isWorkoutCheckIn(checkIn: CheckIn): boolean {
  if (checkIn.workout_session_id) return true;
  return checkIn.source === 'workout';
}
