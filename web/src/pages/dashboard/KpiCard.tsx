import { Card } from '../../components/ui/Card';
import { Skeleton } from '../../components/ui/Skeleton';

type Props = {
  label: string;
  value: string;
  hint?: string;
  loading?: boolean;
};

export function KpiCard({ label, value, hint, loading }: Props) {
  return (
    <Card className="flex flex-col gap-1.5">
      <p className="font-mono text-[10px] uppercase tracking-widest text-text-3">{label}</p>
      {loading ? (
        <Skeleton className="h-8 w-16" />
      ) : (
        <p className="font-mono text-[28px] leading-none text-text-1">{value}</p>
      )}
      {hint && <p className="text-xs text-text-3">{hint}</p>}
    </Card>
  );
}
