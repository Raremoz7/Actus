import { Card } from '../../components/ui/Card';
import { Skeleton } from '../../components/ui/Skeleton';
import { useStudentCheckIns } from '../../hooks/useStudentDetail';
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

export function HistoricoTab({ studentId }: { studentId: string }) {
  const { data: checkIns, isLoading, isError } = useStudentCheckIns(studentId, 60);

  return (
    <div className="flex flex-col gap-3">
      <h2 className="font-display text-base font-bold uppercase tracking-wide text-text-1">
        Histórico — últimos 60 dias
      </h2>
      {isLoading ? (
        Array.from({ length: 6 }, (_, i) => <Skeleton key={i} className="h-12 w-full" />)
      ) : isError ? (
        <p className="text-sm text-error">Não foi possível carregar o histórico.</p>
      ) : !checkIns || checkIns.length === 0 ? (
        <p className="py-8 text-sm text-text-3">Nenhum check-in no período.</p>
      ) : (
        <Card className="!p-0">
          <ul>
            {checkIns.map((c) => (
              <li
                key={c.id}
                className="flex items-center justify-between gap-4 border-b border-outline-v px-4 py-3 last:border-b-0"
              >
                <span className="font-mono text-sm text-text-1">{dateLabel(c.check_in_date)}</span>
                <span className="font-mono text-xs text-text-3">
                  {c.check_in_date.split('-').reverse().join('/')}
                </span>
                <span className="ml-auto text-xs text-text-2">
                  {SOURCE_LABEL[c.source] ?? c.source}
                </span>
              </li>
            ))}
          </ul>
        </Card>
      )}
    </div>
  );
}
