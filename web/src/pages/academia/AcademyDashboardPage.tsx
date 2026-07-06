import type { ReactNode } from 'react';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Avatar } from '../../components/ui/Avatar';
import { Card } from '../../components/ui/Card';
import { Skeleton } from '../../components/ui/Skeleton';
import { Tag } from '../../components/ui/Tag';
import { KpiCard } from '../dashboard/KpiCard';
import { UnitFilter, type UnitOption } from '../../components/academy/UnitFilter';
import { PeriodSegmented, type Period } from '../../components/academy/PeriodSegmented';
import { useAcademyDashboard } from '../../hooks/useAcademy';
import { useNetworkDashboard } from '../../hooks/useAcademyNetwork';
import { selectAcademy, useAuthStore } from '../../store/authStore';
import { formatBRL } from '../../lib/commission';
import {
  AreaChart,
  ChartLegend,
  ColumnChart,
  Donut,
  WeekdayLineChart,
} from '../../components/ui/charts';
import {
  mockAgeBuckets,
  mockGoals,
  mockModalities,
  mockMonthlyCheckIns,
  mockOccupancy,
  mockOverdueStudents,
  mockUpcomingBirthdaysStaff,
  mockUpcomingBirthdaysStudents,
  mockWeekdayBySex,
  mockWeeklyFrequencyTotals,
  scaleColumns,
  scopeFactor,
  weekdayFullLabels,
} from '../../mocks/academyInsights';

const thClass = 'py-2 font-mono text-[10px] font-normal uppercase tracking-widest text-text-3';

const sexLegend = [
  { label: 'Masc.', color: 'var(--color-data-1)' },
  { label: 'Fem.', color: 'var(--color-data-4)' },
];

/** Selo discreto para widgets ainda sem endpoint agregador — não confundir com dado real. */
function PreviewTag() {
  return <Tag variant="future">Prévia</Tag>;
}

function CardHead({
  title,
  right,
}: {
  title: string;
  right?: ReactNode;
}) {
  return (
    <div className="mb-3.5 flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1.5">
      <h2 className="font-display text-base font-bold uppercase tracking-wide text-text-1">{title}</h2>
      {right}
    </div>
  );
}

function PersonRow({
  avatarLabel,
  primary,
  secondary,
  right,
}: {
  avatarLabel: string;
  primary: string;
  secondary: string;
  right: ReactNode;
}) {
  return (
    <div className="flex items-center gap-3 rounded-lg px-1.5 py-2 transition-colors hover:bg-surface-2">
      <Avatar name={avatarLabel} size="sm" />
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm text-text-1">{primary}</p>
        <p className="truncate font-mono text-[11px] text-text-3">{secondary}</p>
      </div>
      <div className="shrink-0 text-right">{right}</div>
    </div>
  );
}

export function AcademyDashboardPage() {
  const academy = useAuthStore(selectAcademy);
  const { data, isLoading } = useAcademyDashboard();

  const [scope, setScope] = useState<string | null>(null);
  const [period, setPeriod] = useState<Period>('month');

  const isHq = academy?.network_role === 'network_hq';
  const net = useNetworkDashboard({ enabled: isHq });
  const units: UnitOption[] = (net.data?.units ?? []).map((u) => ({ id: u.id, name: u.name }));

  // [TEC-79] Escala determinística dos cards de prévia conforme a unidade selecionada.
  const f = scopeFactor(scope);
  const scaledGoals = mockGoals.map((g) => ({ ...g, value: Math.round(g.value * f) }));
  const scaledModalities = mockModalities.map((m) => ({ ...m, value: Math.round(m.value * f) }));

  const kpis = data?.kpis;
  const ranking = data?.instructor_ranking ?? [];
  const maxStudents = Math.max(1, ...ranking.map((r) => r.student_count));
  const topInstructors = ranking.slice(0, 2);

  return (
    <div className="flex-1">
      <div className="flex h-[52px] items-center justify-between gap-3 border-b border-outline-v px-6">
        <div className="flex min-w-0 items-center gap-2.5">
          <h1 className="truncate font-display text-xl font-black uppercase tracking-wide text-text-1">
            {scope ? (units.find((u) => u.id === scope)?.name ?? academy?.name ?? 'Academia') : (academy?.name ?? 'Academia')}
          </h1>
          {scope && (
            <span className="shrink-0 rounded px-2 py-0.5 font-mono text-[9px] uppercase tracking-wider text-accent-muted" style={{ background: 'color-mix(in srgb, var(--color-accent-muted) 16%, transparent)' }}>
              Filial
            </span>
          )}
        </div>
        <div className="flex flex-wrap items-center justify-end gap-2.5">
          {isHq && units.length > 0 && <UnitFilter units={units} value={scope} onChange={setScope} />}
          <PeriodSegmented value={period} onChange={setPeriod} />
        </div>
      </div>

      <div className="grid grid-cols-12 gap-4 p-6">
        {/* KPIs reais — GET /academy/dashboard */}
        <div className="col-span-6 md:col-span-4 xl:col-span-2">
          <KpiCard label="Total de alunos" value={kpis ? String(kpis.total_students) : '—'} loading={isLoading} />
        </div>
        <div className="col-span-6 md:col-span-4 xl:col-span-2">
          <KpiCard label="Ativos (7d)" value={kpis ? String(kpis.active_students_7d) : '—'} loading={isLoading} />
        </div>
        <div className="col-span-6 md:col-span-4 xl:col-span-2">
          <KpiCard label="Check-ins (30d)" value={kpis ? String(kpis.check_ins_30d) : '—'} loading={isLoading} />
        </div>
        <div className="col-span-6 md:col-span-4 xl:col-span-2">
          <KpiCard label="Instrutores" value={kpis ? String(kpis.instructors) : '—'} loading={isLoading} />
        </div>
        <div className="col-span-6 md:col-span-4 xl:col-span-2">
          <KpiCard
            label="Aderência (7d)"
            value={kpis?.adherence_7d_pct == null ? '—' : `${kpis.adherence_7d_pct}%`}
            loading={isLoading}
          />
        </div>
        <div className="col-span-6 md:col-span-4 xl:col-span-2">
          <Card className="flex flex-col gap-1.5">
            <p className="flex items-center justify-between gap-2 font-mono text-[10px] uppercase tracking-widest text-text-3">
              <span>Ocupação agora</span>
              <span className="inline-flex items-center gap-1.5 text-success">
                <i className="h-[7px] w-[7px] animate-pulse rounded-full bg-success" />
                ao vivo
              </span>
            </p>
            <p className="font-mono text-[28px] leading-none text-data-1">{Math.round(mockOccupancy.current * f)}</p>
            <p className="text-xs text-text-3">
              de {mockOccupancy.capacity} vagas · {Math.round((Math.round(mockOccupancy.current * f) / mockOccupancy.capacity) * 100)}%
            </p>
          </Card>
        </div>

        {/* Movimento da academia (área) + Objetivo (donut) */}
        <Card className="col-span-12 xl:col-span-8">
          <CardHead title="Movimento da academia" right={<span className="flex items-center gap-2"><PreviewTag /><span className="font-mono text-[10px] uppercase tracking-widest text-text-3">check-ins / mês</span></span>} />
          <AreaChart
            values={mockMonthlyCheckIns.values}
            xLabels={mockMonthlyCheckIns.xLabels}
            peakIndex={mockMonthlyCheckIns.peakIndex}
          />
        </Card>

        <Card className="col-span-12 xl:col-span-4">
          <CardHead title="Objetivo" right={<PreviewTag />} />
          <Donut
            segments={scaledGoals}
            centerValue={String(scaledGoals.reduce((sum, g) => sum + g.value, 0))}
            centerLabel="alunos"
          />
        </Card>

        {/* Faixa etária + Frequência semanal */}
        <Card className="col-span-12 xl:col-span-6">
          <CardHead title="Faixa etária" right={<PreviewTag />} />
          <ColumnChart data={scaleColumns(mockAgeBuckets, f)} color="var(--color-data-1)" />
        </Card>

        <Card className="col-span-12 xl:col-span-6">
          <CardHead title="Frequência semanal" right={<PreviewTag />} />
          <ColumnChart data={scaleColumns(mockWeeklyFrequencyTotals, f)} color="var(--color-data-6)" />
        </Card>

        {/* Instrutores em destaque (dados reais) + Modalidades (mock) */}
        <Card className="col-span-12 xl:col-span-7">
          <CardHead title="Instrutores em destaque" right={<Link to="/app/academia/equipe" className="text-xs text-text-3 hover:text-neon">Ver equipe</Link>} />
          {isLoading ? (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <Skeleton className="h-32 w-full" />
              <Skeleton className="h-32 w-full" />
            </div>
          ) : topInstructors.length === 0 ? (
            <p className="py-8 text-center text-sm text-text-3">Nenhum instrutor vinculado ainda.</p>
          ) : (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {topInstructors.map((r) => (
                <Link
                  key={r.instructor_user_id}
                  to={`/app/academia/equipe/${r.instructor_user_id}`}
                  className="rounded-xl border border-outline-v bg-surface-2 p-3.5 transition-colors hover:border-outline"
                >
                  <p className="font-display text-[17px] font-extrabold uppercase tracking-wide text-text-1">
                    {r.display_name ?? '—'}
                  </p>
                  <p className="font-mono text-[10px] uppercase tracking-wider text-text-3">Personal trainer</p>
                  <div className="my-3.5 flex gap-5">
                    <div>
                      <div className="font-mono text-lg text-text-1">{r.student_count}</div>
                      <div className="font-mono text-[9px] uppercase tracking-wider text-text-3">Alunos</div>
                    </div>
                    <div>
                      <div className="font-mono text-lg text-text-1">{r.active_students_7d}</div>
                      <div className="font-mono text-[9px] uppercase tracking-wider text-text-3">Ativos 7d</div>
                    </div>
                    <div>
                      <div className="font-mono text-lg text-text-1">{r.check_ins_30d}</div>
                      <div className="font-mono text-[9px] uppercase tracking-wider text-text-3">Check-ins 30d</div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </Card>

        <Card className="col-span-12 xl:col-span-5">
          <CardHead title="Modalidades mais praticadas" right={<PreviewTag />} />
          <div className="flex flex-wrap content-start gap-2">
            {scaledModalities.map((m) => (
              <span
                key={m.label}
                className="inline-flex items-center gap-1.5 rounded-full border border-outline-v bg-surface-2 px-3.5 py-2"
              >
                <i className="h-[9px] w-[9px] shrink-0 rounded-full" style={{ background: m.color }} />
                <span className="text-[13px] text-text-1">{m.label}</span>
                <span className="font-mono text-[11px] text-text-3">{m.value}</span>
              </span>
            ))}
          </div>
        </Card>

        {/* Dia da semana por sexo (mock) */}
        <Card className="col-span-12">
          <CardHead
            title="Alunos por dia da semana"
            right={
              <span className="flex items-center gap-2">
                <PreviewTag />
                <ChartLegend items={sexLegend} />
              </span>
            }
          />
          <WeekdayLineChart
            xLabels={mockWeekdayBySex.xLabels}
            fullLabels={weekdayFullLabels}
            series={[
              { label: 'Masculino', color: 'var(--color-data-1)', values: mockWeekdayBySex.masc.map((v) => Math.round(v * f)) },
              { label: 'Feminino', color: 'var(--color-data-4)', values: mockWeekdayBySex.fem.map((v) => Math.round(v * f)) },
            ]}
          />
        </Card>

        {/* Alunos por personal (dado real) + Inadimplentes (mock) */}
        <Card className="col-span-12 xl:col-span-6">
          <CardHead title="Ranking de instrutores" right={<Link to="/app/academia/equipe" className="text-xs text-text-3 hover:text-neon">Ver equipe</Link>} />
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
                            className="h-full rounded-full bg-data-1"
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

        <Card className="col-span-12 xl:col-span-6">
          <CardHead
            title="Alunos inadimplentes"
            right={
              <span className="flex items-center gap-2">
                <PreviewTag />
                <span className="font-mono text-[10px] uppercase tracking-widest text-text-3">
                  {formatBRL(mockOverdueStudents.reduce((sum, s) => sum + s.amountCents, 0))} em aberto
                </span>
              </span>
            }
          />
          <div className="flex flex-col">
            {mockOverdueStudents.map((s) => (
              <PersonRow
                key={s.name}
                avatarLabel={s.name}
                primary={s.name}
                secondary={`Venc. ${s.dueDate} · ${s.daysOverdue} dias`}
                right={<span className="font-mono text-sm text-error">{formatBRL(s.amountCents)}</span>}
              />
            ))}
          </div>
        </Card>

        {/* Aniversariantes alunos + equipe */}
        <Card className="col-span-12 xl:col-span-6">
          <CardHead title="Aniversariantes · alunos" right={<span className="flex items-center gap-2"><PreviewTag /><span className="font-mono text-[10px] uppercase tracking-widest text-text-3">próx. 7 dias</span></span>} />
          <div className="flex flex-col">
            {mockUpcomingBirthdaysStudents.map((s) => (
              <PersonRow
                key={s.name}
                avatarLabel={s.name}
                primary={s.name}
                secondary={`Faz ${s.turningAge} anos`}
                right={<Tag variant={s.when === 'Hoje' ? 'active' : 'default'}>{s.when}</Tag>}
              />
            ))}
          </div>
        </Card>

        <Card className="col-span-12 xl:col-span-6">
          <CardHead title="Aniversariantes · equipe" right={<span className="flex items-center gap-2"><PreviewTag /><span className="font-mono text-[10px] uppercase tracking-widest text-text-3">próx. 7 dias</span></span>} />
          <div className="flex flex-col">
            {mockUpcomingBirthdaysStaff.map((s) => (
              <PersonRow key={s.name} avatarLabel={s.name} primary={s.name} secondary={s.role} right={<Tag>{s.when}</Tag>} />
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
