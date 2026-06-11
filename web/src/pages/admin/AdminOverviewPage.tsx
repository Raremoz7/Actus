import { useMemo } from 'react';
import { Card } from '../../components/ui/Card';
import { Skeleton } from '../../components/ui/Skeleton';
import { useStaff, useStudentLinks } from '../../hooks/useAdmin';

// KPIs somente com dados reais de GET /admin/staff e GET /admin/links/students.
export function AdminOverviewPage() {
  const staffQuery = useStaff();
  const linksQuery = useStudentLinks('active');

  const linksByRole = useMemo(() => {
    const links = linksQuery.data ?? [];
    return {
      personal: links.filter((l) => l.professional_role === 'personal').length,
      nutricionista: links.filter((l) => l.professional_role === 'nutricionista').length,
    };
  }, [linksQuery.data]);

  const loading = staffQuery.isLoading || linksQuery.isLoading;

  return (
    <>
      <div className="flex h-[52px] items-center border-b border-outline-v px-6">
        <h1 className="font-display text-xl font-black uppercase tracking-wide text-text-1">
          Overview
        </h1>
      </div>
      <div className="grid grid-cols-2 gap-4 p-6 lg:grid-cols-4">
        {loading ? (
          Array.from({ length: 4 }, (_, i) => <Skeleton key={i} className="h-24 w-full" />)
        ) : (
          <>
            <Kpi label="Equipe" value={staffQuery.data?.length ?? 0} />
            <Kpi label="Vínculos ativos" value={linksQuery.data?.length ?? 0} />
            <Kpi label="Vínculos · personal" value={linksByRole.personal} />
            <Kpi label="Vínculos · nutrição" value={linksByRole.nutricionista} />
          </>
        )}
      </div>
    </>
  );
}

function Kpi({ label, value }: { label: string; value: number }) {
  return (
    <Card>
      <p className="font-mono text-[10px] uppercase tracking-widest text-text-3">{label}</p>
      <p className="mt-2 font-mono text-3xl text-neon">{value}</p>
    </Card>
  );
}
