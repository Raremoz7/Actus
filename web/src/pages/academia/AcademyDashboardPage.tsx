import { Link } from 'react-router-dom';
import { Card } from '../../components/ui/Card';
import { Skeleton } from '../../components/ui/Skeleton';
import { KpiCard } from '../dashboard/KpiCard';
import { useAcademyDashboard } from '../../hooks/useAcademy';
import { useCommissionReport } from '../../hooks/useCommissions';
import { selectAcademy, useAuthStore } from '../../store/authStore';
import { currentPeriod, formatBRL } from '../../lib/commission';

const thClass = 'py-2 font-mono text-[10px] font-normal uppercase tracking-widest text-text-3';

export function AcademyDashboardPage() {
  const academy = useAuthStore(selectAcademy);
  const { data, isLoading } = useAcademyDashboard();
  const period = currentPeriod();
  const report = useCommissionReport(period);

  const kpis = data?.kpis;
  const ranking = data?.instructor_ranking ?? [];
  const maxStudents = Math.max(1, ...ranking.map((r) => r.student_count));

  return (
    <div className="flex-1">
      <div className="flex h-[52px] items-center border-b border-outline-v px-6">
        <h1 className="font-display text-xl font-black uppercase tracking-wide text-text-1">
          {academy?.name ?? 'Academia'}
        </h1>
      </div>

      <div className="flex flex-col gap-5 p-6">
        <div className="grid grid-cols-2 gap-4 xl:grid-cols-3">
          <KpiCard label="Total de alunos" value={kpis ? String(kpis.total_students) : '—'} loading={isLoading} />
          <KpiCard label="Ativos (7d)" value={kpis ? String(kpis.active_students_7d) : '—'} loading={isLoading} />
          <KpiCard label="Check-ins (30d)" value={kpis ? String(kpis.check_ins_30d) : '—'} loading={isLoading} />
          <KpiCard label="Instrutores" value={kpis ? String(kpis.instructors) : '—'} loading={isLoading} />
          <KpiCard
            label="Aderência (7d)"
            value={kpis?.adherence_7d_pct == null ? '—' : `${kpis.adherence_7d_pct}%`}
            loading={isLoading}
          />
          <KpiCard
            label="Comissões a pagar"
            value={report.data ? formatBRL(report.data.totals.due_cents) : '—'}
            hint={`competência ${period}`}
            loading={report.isLoading}
          />
        </div>

        <Card>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-display text-base font-bold uppercase tracking-wide text-text-1">
              Ranking de instrutores
            </h2>
            <Link to="/app/academia/equipe" className="text-xs text-text-3 hover:text-neon">
              Ver equipe
            </Link>
          </div>
          {isLoading ? (
            <div className="flex flex-col gap-2">
              {Array.from({ length: 4 }, (_, i) => (
                <Skeleton key={i} className="h-9 w-full" />
              ))}
            </div>
          ) : ranking.length === 0 ? (
            <p className="py-8 text-center text-sm text-text-3">Nenhum instrutor vinculado ainda.</p>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="border-b border-outline-v text-left">
                  <th className={thClass}>Instrutor</th>
                  <th className={thClass}>Alunos</th>
                  <th className={thClass}>Ativos 7d</th>
                  <th className={thClass}>Check-ins 30d</th>
                </tr>
              </thead>
              <tbody>
                {ranking.map((r) => (
                  <tr key={r.instructor_user_id} className="border-b border-outline-v/40">
                    <td className="py-2">
                      <Link
                        to={`/app/academia/equipe/${r.instructor_user_id}`}
                        className="text-sm text-text-1 hover:text-neon"
                      >
                        {r.display_name ?? '—'}
                      </Link>
                    </td>
                    <td className="py-2">
                      <div className="flex items-center gap-2">
                        <span className="w-6 font-mono text-sm text-text-1">{r.student_count}</span>
                        <div className="h-1.5 w-24 overflow-hidden rounded-full bg-surface-3">
                          <div
                            className="h-full rounded-full bg-accent-muted"
                            style={{ width: `${(r.student_count / maxStudents) * 100}%` }}
                          />
                        </div>
                      </div>
                    </td>
                    <td className="py-2 font-mono text-sm text-text-2">{r.active_students_7d}</td>
                    <td className="py-2 font-mono text-sm text-text-2">{r.check_ins_30d}</td>
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
