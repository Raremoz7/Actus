import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Avatar } from '../../components/ui/Avatar';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { Skeleton } from '../../components/ui/Skeleton';
import { Tag } from '../../components/ui/Tag';
import { useStudents, useStudentsCheckIns, useStudentsWorkouts, MAX_FANOUT } from '../../hooks/useStudents';
import type { CheckIn, Student, StudentWorkout } from '../../lib/schemas';
import { deriveStudentStatus, daysSinceLocal } from '../../lib/studentStatus';
import { ActivityPanel, type ActivityItem } from './ActivityPanel';
import { KpiCard } from './KpiCard';
import { BarMini, TrendLine } from '../../components/ui/charts';

const KPI_WINDOW_DAYS = 30;

// DECISÃO (documentada): a API só expõe check-ins/atribuições POR aluno, então os
// KPIs de aderência/treinos-hoje exigem fan-out. Limitamos aos MAX_FANOUT alunos
// mais recentes (useStudentsCheckIns/useStudentsWorkouts) — acima disso os números
// são sobre a amostra, e o hint do card deixa isso explícito.

/** Aderência 30d: dias com check-in / dias previstos pelas atribuições ativas (weekdays). */
function adherence30d(
  checkInsByStudent: Map<string, CheckIn[]>,
  workoutsByStudent: Map<string, StudentWorkout[]>,
): number | null {
  const now = new Date();
  const perStudent: number[] = [];
  for (const [studentId, workouts] of workoutsByStudent) {
    const activeWeekdays = new Set<number>();
    for (const w of workouts) {
      if (w.is_active) for (const d of w.weekdays) activeWeekdays.add(d % 7); // 1=seg…7=dom → getDay
    }
    if (activeWeekdays.size === 0) continue;
    let expected = 0;
    for (let i = 0; i < KPI_WINDOW_DAYS; i++) {
      const day = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i);
      if (activeWeekdays.has(day.getDay())) expected++;
    }
    if (expected === 0) continue;
    const doneDays = new Set(
      (checkInsByStudent.get(studentId) ?? [])
        .filter((c) => daysSinceLocal(c.check_in_date) < KPI_WINDOW_DAYS)
        .map((c) => c.check_in_date),
    );
    perStudent.push(Math.min(1, doneDays.size / expected));
  }
  if (perStudent.length === 0) return null;
  return perStudent.reduce((a, b) => a + b, 0) / perStudent.length;
}

function StudentRow({ student, checkIns }: { student: Student; checkIns: CheckIn[] | undefined }) {
  const status = deriveStudentStatus(checkIns);
  return (
    <Link
      to={`/app/alunos/${student.id}`}
      className="flex items-center gap-3 rounded-lg px-2 py-2 transition-colors hover:bg-surface-2"
    >
      <Avatar name={student.full_name} size="sm" />
      <span className="min-w-0 flex-1 truncate text-sm text-text-1">
        {student.full_name ?? student.email}
      </span>
      <Tag variant={status.tone}>{status.label}</Tag>
    </Link>
  );
}

export function DashboardPage() {
  const studentsQuery = useStudents();
  const students = useMemo(() => studentsQuery.data ?? [], [studentsQuery.data]);
  const studentIds = useMemo(() => students.map((s) => s.id), [students]);
  const checkIns = useStudentsCheckIns(studentIds, KPI_WINDOW_DAYS);
  const workouts = useStudentsWorkouts(studentIds);

  const loading = studentsQuery.isLoading;
  const kpisLoading = loading || checkIns.isLoading || workouts.isLoading;
  const sampled = students.length > MAX_FANOUT;
  const sampleHint = sampled ? `amostra dos ${MAX_FANOUT} vínculos mais recentes` : undefined;

  const allCheckIns = useMemo(() => {
    const nameById = new Map(students.map((s) => [s.id, s.full_name ?? s.email]));
    const items: ActivityItem[] = [];
    for (const [studentId, list] of checkIns.byStudent) {
      for (const c of list) {
        items.push({
          id: c.id,
          studentName: nameById.get(studentId) ?? 'Aluno',
          checkInDate: c.check_in_date,
          source: c.source,
        });
      }
    }
    items.sort((a, b) => b.checkInDate.localeCompare(a.checkInDate));
    return items;
  }, [students, checkIns.byStudent]);

  const trainedToday = useMemo(() => {
    let n = 0;
    for (const list of checkIns.byStudent.values()) {
      if (list.some((c) => daysSinceLocal(c.check_in_date) <= 0)) n++;
    }
    return n;
  }, [checkIns.byStudent]);

  const sessionsWeek = useMemo(
    () => allCheckIns.filter((c) => daysSinceLocal(c.checkInDate) < 7).length,
    [allCheckIns],
  );

  const adherence = useMemo(
    () => adherence30d(checkIns.byStudent, workouts.byStudent),
    [checkIns.byStudent, workouts.byStudent],
  );

  // Incrementos client-side (reusam os check-ins já buscados; janela de KPI_WINDOW_DAYS=30).
  const activityByDay = useMemo(() => {
    const buckets = new Array(14).fill(0) as number[];
    for (const c of allCheckIns) {
      const d = daysSinceLocal(c.checkInDate);
      if (d >= 0 && d < 14) buckets[13 - d] += 1;
    }
    return buckets.map((value) => ({ value }));
  }, [allCheckIns]);

  const adherenceSeries = useMemo(() => {
    const total = students.length;
    const pts: { value: number }[] = [];
    for (let w = 3; w >= 0; w--) {
      const active = new Set<string>();
      for (const [sid, list] of checkIns.byStudent) {
        if (list.some((c) => {
          const d = daysSinceLocal(c.check_in_date);
          return d >= w * 7 && d < w * 7 + 7;
        })) {
          active.add(sid);
        }
      }
      pts.push({ value: total > 0 ? Math.round((active.size / total) * 100) : 0 });
    }
    return pts;
  }, [checkIns.byStudent, students.length]);

  const atRiskStudents = useMemo(() => {
    return students
      .map((s) => {
        const list = checkIns.byStudent.get(s.id) ?? [];
        const lastDays = list.length ? Math.min(...list.map((c) => daysSinceLocal(c.check_in_date))) : Infinity;
        return { student: s, lastDays };
      })
      .filter((x) => x.lastDays > 7)
      .sort((a, b) => b.lastDays - a.lastDays)
      .slice(0, 6);
  }, [students, checkIns.byStudent]);

  const recent = students.slice(0, 8);
  const empty = !loading && students.length === 0;

  return (
    <div className="flex-1">
      <div className="flex h-[52px] items-center border-b border-outline-v px-6">
        <h1 className="font-display text-xl font-black uppercase tracking-wide text-text-1">
          Dashboard
        </h1>
      </div>

      {empty ? (
        <div className="flex flex-col items-center gap-4 px-6 py-24 text-center">
          <p className="font-display text-lg font-bold uppercase tracking-wide text-text-2">
            Nenhum aluno ainda.
          </p>
          <p className="text-sm text-text-3">Gere um convite para começar.</p>
          <Link to="/app/convites">
            <Button variant="secondary">Convidar aluno</Button>
          </Link>
        </div>
      ) : (
        <div className="flex flex-col gap-5 p-6">
          <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
            <KpiCard label="Alunos ativos" value={String(students.length)} loading={loading} />
            <KpiCard
              label="Aderência média 30d"
              value={adherence === null ? '—' : `${Math.round(adherence * 100)}%`}
              hint={adherence === null ? 'sem atribuições ativas' : sampleHint}
              loading={kpisLoading}
            />
            <KpiCard
              label="Treinos hoje"
              value={String(trainedToday)}
              hint={sampleHint}
              loading={kpisLoading}
            />
            <KpiCard
              label="Sessões na semana"
              value={String(sessionsWeek)}
              hint={sampleHint}
              loading={kpisLoading}
            />
          </div>

          <div className="flex flex-col gap-5 xl:flex-row">
            <Card className="flex-1">
              <h2 className="mb-3 font-display text-base font-bold uppercase tracking-wide text-text-1">
                Aderência (4 semanas)
              </h2>
              <TrendLine data={adherenceSeries} />
              <div className="mt-2 flex justify-between font-mono text-[10px] text-text-3">
                <span>4 sem atrás</span>
                <span>atual</span>
              </div>
            </Card>
            <Card className="flex-1">
              <h2 className="mb-3 font-display text-base font-bold uppercase tracking-wide text-text-1">
                Atividade (14 dias)
              </h2>
              <BarMini data={activityByDay} />
              <div className="mt-2 flex justify-between font-mono text-[10px] text-text-3">
                <span>14 dias atrás</span>
                <span>hoje</span>
              </div>
            </Card>
            <Card className="flex-1">
              <h2 className="mb-3 font-display text-base font-bold uppercase tracking-wide text-text-1">
                Alunos em risco
              </h2>
              {atRiskStudents.length === 0 ? (
                <p className="py-6 text-center text-sm text-text-3">Ninguém sem treinar há mais de 7 dias.</p>
              ) : (
                <div className="flex flex-col gap-0.5">
                  {atRiskStudents.map(({ student, lastDays }) => (
                    <Link
                      key={student.id}
                      to={`/app/alunos/${student.id}`}
                      className="flex items-center gap-3 rounded-lg px-2 py-1.5 transition-colors hover:bg-surface-2"
                    >
                      <Avatar name={student.full_name} size="sm" />
                      <span className="min-w-0 flex-1 truncate text-sm text-text-1">
                        {student.full_name ?? student.email}
                      </span>
                      <Tag variant="warn">
                        {lastDays === Infinity ? 'Sem registro' : `${lastDays}d`}
                      </Tag>
                    </Link>
                  ))}
                </div>
              )}
            </Card>
          </div>

          <div className="flex flex-col gap-5 xl:flex-row">
            <Card className="flex-1">
              <div className="mb-3 flex items-center justify-between">
                <h2 className="font-display text-base font-bold uppercase tracking-wide text-text-1">
                  Alunos recentes
                </h2>
                <Link to="/app/alunos" className="text-xs text-text-3 hover:text-neon">
                  Ver todos
                </Link>
              </div>
              {loading ? (
                <div className="flex flex-col gap-2">
                  {Array.from({ length: 5 }, (_, i) => (
                    <Skeleton key={i} className="h-10 w-full" />
                  ))}
                </div>
              ) : (
                <div className="flex flex-col gap-0.5">
                  {recent.map((s) => (
                    <StudentRow key={s.id} student={s} checkIns={checkIns.byStudent.get(s.id)} />
                  ))}
                </div>
              )}
            </Card>
            <ActivityPanel items={allCheckIns.slice(0, 10)} loading={kpisLoading} />
          </div>
        </div>
      )}
    </div>
  );
}
