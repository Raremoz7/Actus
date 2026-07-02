import { Card } from '../../components/ui/Card';
import { Skeleton } from '../../components/ui/Skeleton';
import { KpiCard } from '../dashboard/KpiCard';
import { useNetworkDashboard } from '../../hooks/useAcademyNetwork';

const thClass = 'py-2 font-mono text-[10px] font-normal uppercase tracking-widest text-text-3';

export function NetworkDashboardPage() {
  const { data, isLoading } = useNetworkDashboard();
  const units = data?.units ?? [];

  return (
    <div className="flex-1">
      <div className="flex h-[52px] items-center border-b border-outline-v px-6">
        <h1 className="font-display text-xl font-black uppercase tracking-wide text-text-1">Rede</h1>
      </div>

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
                  <th className={thClass}>Unidade</th>
                  <th className={thClass}>Alunos</th>
                  <th className={thClass}>Instrutores</th>
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
