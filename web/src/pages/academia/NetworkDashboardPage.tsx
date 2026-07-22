import { Navigate } from 'react-router-dom';
import { Card } from '../../components/ui/Card';
import { Eyebrow } from '../../components/ui/Eyebrow';
import { PageHeader } from '../../components/ui/PageHeader';
import { Skeleton } from '../../components/ui/Skeleton';
import { KpiCard } from '../dashboard/KpiCard';
import { useNetworkDashboard } from '../../hooks/useAcademyNetwork';

export function NetworkDashboardPage() {
  const { data, isLoading, isError } = useNetworkDashboard();

  if (isError) return <Navigate to="/app/academia" replace />;

  const units = data?.units ?? [];

  return (
    <div className="flex-1">
      <PageHeader title="Rede" />

      <div className="flex flex-col gap-5 p-6">
        <div className="grid grid-cols-2 gap-4 xl:grid-cols-3">
          <KpiCard label="Total de alunos (rede)" value={data ? String(data.kpis.total_students) : '—'} loading={isLoading} />
          <KpiCard label="Instrutores (rede)" value={data ? String(data.kpis.instructors) : '—'} loading={isLoading} />
        </div>

        <Card>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-display text-base font-bold uppercase tracking-wide text-text-1">Por unidade</h2>
          </div>
          {isLoading ? (
            <div className="flex flex-col gap-2">
              {Array.from({ length: 3 }, (_, i) => (
                <Skeleton key={i} className="h-9 w-full" />
              ))}
            </div>
          ) : units.length === 0 ? (
            <p className="py-8 text-center text-sm text-text-3">Nenhuma filial vinculada ainda.</p>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="border-b border-outline-v text-left">
                  <Eyebrow as="th" className="py-2 font-normal">Unidade</Eyebrow>
                  <Eyebrow as="th" className="py-2 font-normal">Alunos</Eyebrow>
                  <Eyebrow as="th" className="py-2 font-normal">Instrutores</Eyebrow>
                </tr>
              </thead>
              <tbody>
                {units.map((u) => (
                  <tr key={u.id} className="border-b border-outline-v/40">
                    <td className="py-2 text-sm text-text-1">{u.name}</td>
                    <td className="py-2 font-mono text-sm text-text-2">{u.kpis.total_students}</td>
                    <td className="py-2 font-mono text-sm text-text-2">{u.kpis.instructors}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Card>
      </div>
    </div>
  );
}
