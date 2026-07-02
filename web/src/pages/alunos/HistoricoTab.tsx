import { useMemo, useState } from 'react';
import { Card } from '../../components/ui/Card';
import { Skeleton } from '../../components/ui/Skeleton';
import { Tag } from '../../components/ui/Tag';
import { useStudentCheckIns } from '../../hooks/useStudentDetail';
import type { CheckIn } from '../../lib/schemas';
import { daysSinceLocal, parseLocalDate } from '../../lib/studentStatus';

const SOURCE_LABEL: Record<string, string> = {
  manual: 'manual',
  workout_session: 'sessão de treino',
};

function dateLabel(dateOnly: string): string {
  const days = daysSinceLocal(dateOnly);
  if (days <= 0) return 'Hoje';
  if (days === 1) return 'Ontem';
  const d = parseLocalDate(dateOnly);
  return d.toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit', month: '2-digit' });
}

// segundos → "48 min" / "1 h 05".
function formatDuration(seconds: number): string {
  const min = Math.round(seconds / 60);
  if (min < 60) return `${min} min`;
  const h = Math.floor(min / 60);
  const m = min % 60;
  return m === 0 ? `${h} h` : `${h} h ${String(m).padStart(2, '0')}`;
}

type Filter = 'todos' | 'workout_session' | 'manual';
const FILTERS: { key: Filter; label: string }[] = [
  { key: 'todos', label: 'Todos' },
  { key: 'workout_session', label: 'Treino' },
  { key: 'manual', label: 'Manual' },
];

// Uma linha do histórico. Mostra treino + métricas (tempo, completude, PRs) quando
// o backend enviar; caso contrário degrada para data + tipo (comportamento atual).
function CheckInRow({ c }: { c: CheckIn }) {
  const isWorkout = c.source === 'workout_session';
  const hasMetrics =
    c.duration_seconds != null || c.completion_pct != null || (c.pr_count ?? 0) > 0;

  return (
    <li className="flex items-center gap-3 border-b border-outline-v px-4 py-3 last:border-b-0">
      <div className="min-w-[64px]">
        <div className="font-mono text-sm text-text-1">{dateLabel(c.check_in_date)}</div>
        <div className="font-mono text-[11px] text-text-3">
          {c.check_in_date.split('-').reverse().join('/')}
        </div>
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm text-text-1">
          {c.workout_name ?? (isWorkout ? 'Sessão de treino' : 'Check-in manual')}
        </p>
        {hasMetrics && (
          <div className="mt-1 flex flex-wrap gap-3 font-mono text-[11px] text-text-2">
            {c.duration_seconds != null && <span>{formatDuration(c.duration_seconds)}</span>}
            {c.completion_pct != null && (
              <span className={c.completion_pct >= 90 ? 'text-success' : 'text-warning'}>
                {Math.round(c.completion_pct)}%
              </span>
            )}
            {(c.pr_count ?? 0) > 0 && (
              <span className="text-neon">
                ★ {c.pr_count} {c.pr_count === 1 ? 'PR' : 'PRs'}
              </span>
            )}
          </div>
        )}
      </div>
      {!isWorkout && <Tag variant="default">{SOURCE_LABEL[c.source] ?? c.source}</Tag>}
    </li>
  );
}

export function HistoricoTab({ studentId }: { studentId: string }) {
  const { data: checkIns, isLoading, isError } = useStudentCheckIns(studentId, 60);
  const [filter, setFilter] = useState<Filter>('todos');

  const filtered = useMemo(() => {
    const list = checkIns ?? [];
    if (filter === 'todos') return list;
    return list.filter((c) => c.source === filter);
  }, [checkIns, filter]);

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="font-display text-base font-bold uppercase tracking-wide text-text-1">
          Histórico — últimos 60 dias
        </h2>
        <div className="flex gap-1 rounded-full border border-outline-v bg-surface-1 p-1">
          {FILTERS.map((f) => (
            <button
              key={f.key}
              type="button"
              onClick={() => setFilter(f.key)}
              aria-pressed={filter === f.key}
              className={`rounded-full px-3 py-1 font-mono text-xs uppercase tracking-wide transition-colors ${
                filter === f.key ? 'bg-neon text-text-inv' : 'text-text-2 hover:text-text-1'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        Array.from({ length: 6 }, (_, i) => <Skeleton key={i} className="h-12 w-full" />)
      ) : isError ? (
        <p className="text-sm text-error">Não foi possível carregar o histórico.</p>
      ) : filtered.length === 0 ? (
        <p className="py-8 text-sm text-text-3">
          {filter === 'todos'
            ? 'Nenhum check-in no período.'
            : 'Nenhum check-in desse tipo no período.'}
        </p>
      ) : (
        <Card className="!p-0">
          <ul>
            {filtered.map((c) => (
              <CheckInRow key={c.id} c={c} />
            ))}
          </ul>
        </Card>
      )}
    </div>
  );
}
