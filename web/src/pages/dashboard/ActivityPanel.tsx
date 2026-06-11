import { Card } from '../../components/ui/Card';
import { Skeleton } from '../../components/ui/Skeleton';
import { daysSinceLocal } from '../../lib/studentStatus';

export type ActivityItem = {
  id: string;
  studentName: string;
  checkInDate: string; // YYYY-MM-DD
  source: string;
};

function dateLabel(dateOnly: string): string {
  const days = daysSinceLocal(dateOnly);
  if (days <= 0) return 'hoje';
  if (days === 1) return 'ontem';
  const [y, m, d] = dateOnly.split('-');
  return `${d}/${m}/${y?.slice(2)}`;
}

export function ActivityPanel({ items, loading }: { items: ActivityItem[]; loading: boolean }) {
  return (
    <Card className="flex-1">
      <h2 className="mb-3 font-display text-base font-bold uppercase tracking-wide text-text-1">
        Atividade recente
      </h2>
      {loading ? (
        <div className="flex flex-col gap-2.5">
          {Array.from({ length: 5 }, (_, i) => (
            <Skeleton key={i} className="h-5 w-full" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <p className="text-sm text-text-3">Nenhum check-in registrado no período.</p>
      ) : (
        <ul className="flex flex-col">
          {items.map((item) => (
            <li
              key={item.id}
              className="flex items-baseline justify-between gap-3 border-b border-outline-v py-2 last:border-b-0"
            >
              <p className="text-sm text-text-2">
                <span className="text-text-1">{item.studentName}</span> registrou treino
              </p>
              <span className="shrink-0 font-mono text-xs text-text-3">
                {dateLabel(item.checkInDate)}
              </span>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
