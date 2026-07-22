import { Card } from '../../components/ui/Card';
import { Skeleton } from '../../components/ui/Skeleton';
import { useStudentBadges } from '../../hooks/useStudentProfile';
import type { StudentBadge } from '../../lib/schemas';

function BadgeCell({ badge }: { badge: StudentBadge }) {
  const earnedAt = badge.earned_at
    ? new Date(badge.earned_at).toLocaleDateString('pt-BR')
    : null;
  return (
    <Card
      className={`flex flex-col items-center gap-1 text-center !p-3 ${
        badge.earned ? '' : 'opacity-40 grayscale'
      }`}
    >
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-surface-2 text-xl">
        {badge.earned ? '★' : '🔒'}
      </div>
      <div className="text-[11px] font-bold text-text-1">{badge.name}</div>
      <div className="font-mono text-[9px] text-text-3">
        {badge.earned ? (earnedAt ?? 'Conquistado') : (badge.description ?? '')}
      </div>
    </Card>
  );
}

export function BadgesTab({ studentId }: { studentId: string }) {
  const { data, isLoading } = useStudentBadges(studentId);
  if (isLoading) {
    return (
      <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
        {Array.from({ length: 7 }, (_, i) => (
          <Skeleton key={i} className="h-28 w-full" />
        ))}
      </div>
    );
  }
  const badges = data ?? [];
  if (badges.length === 0)
    return <p className="py-8 text-center text-sm text-text-3">Sem conquistas ainda.</p>;
  const earned = badges.filter((b) => b.earned).length;
  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-baseline justify-between">
        <span className="font-display text-base font-bold uppercase tracking-wide text-text-1">
          Conquistas
        </span>
        <span className="font-mono text-xs text-text-3">
          {earned} / {badges.length}
        </span>
      </div>
      <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
        {badges.map((b) => (
          <BadgeCell key={b.id} badge={b} />
        ))}
      </div>
    </div>
  );
}
