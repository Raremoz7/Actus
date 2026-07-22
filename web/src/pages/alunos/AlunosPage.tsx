import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Avatar } from '../../components/ui/Avatar';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { PageHeader } from '../../components/ui/PageHeader';
import { Skeleton } from '../../components/ui/Skeleton';
import { Tag } from '../../components/ui/Tag';
import { StreakBadge } from '../../components/StreakBadge';
import { StudentBadges } from '../../components/StudentBadges';
import { Sidebar, type SidebarSection } from '../../layouts/Sidebar';
import { useStudents, useStudentsCheckIns } from '../../hooks/useStudents';
import type { Student } from '../../lib/schemas';
import { deriveStudentStatus, type StudentStatus } from '../../lib/studentStatus';

type FilterKey = 'todos' | 'ativos-hoje' | 'sem-treino' | 'inativos-7d';

// DECISÃO (documentada): "Sem treino" = nenhum check-in nos últimos 30 dias
// (daysSince === null). A definição estrita ("sem atribuição de treino") exigiria
// GET /students/:id/workouts por aluno — fan-out extra que não vale o custo aqui.
// "Ativos hoje" e "Inativos +7d" derivam dos check-ins já buscados (amostra
// limitada a MAX_FANOUT em useStudentsCheckIns; além disso o aluno cai em "Sem treino").
const filterFns: Record<FilterKey, (s: StudentStatus) => boolean> = {
  todos: () => true,
  'ativos-hoje': (s) => s.daysSince === 0,
  'sem-treino': (s) => s.daysSince === null,
  'inativos-7d': (s) => s.daysSince !== null && s.daysSince > 7,
};

const filterLabels: Record<FilterKey, string> = {
  todos: 'Todos',
  'ativos-hoje': 'Ativos hoje',
  'sem-treino': 'Sem treino',
  'inativos-7d': 'Inativos +7d',
};

export function AlunosPage() {
  const navigate = useNavigate();
  const [filter, setFilter] = useState<FilterKey>('todos');
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState<'nome' | 'checkin' | 'streak'>('nome');
  const [archived, setArchived] = useState(false);

  const studentsQuery = useStudents(archived ? 'revoked' : 'active');
  const students = useMemo(() => studentsQuery.data ?? [], [studentsQuery.data]);
  const studentIds = useMemo(() => students.map((s) => s.id), [students]);
  const checkIns = useStudentsCheckIns(studentIds, 30);
  const loading = studentsQuery.isLoading;

  const withStatus = useMemo(
    () =>
      students.map((student) => ({
        student,
        status: deriveStudentStatus(checkIns.byStudent.get(student.id)),
      })),
    [students, checkIns.byStudent],
  );

  const counts = useMemo(() => {
    const c = {} as Record<FilterKey, number>;
    for (const key of Object.keys(filterFns) as FilterKey[]) {
      c[key] = withStatus.filter(({ status }) => filterFns[key](status)).length;
    }
    return c;
  }, [withStatus]);

  const visible = useMemo(() => {
    const q = search.trim().toLowerCase();
    return withStatus.filter(
      ({ student, status }) =>
        filterFns[filter](status) &&
        (q === '' ||
          (student.full_name ?? '').toLowerCase().includes(q) ||
          student.email.toLowerCase().includes(q)),
    );
  }, [withStatus, filter, search]);

  const sorted = useMemo(() => {
    const arr = [...visible];
    arr.sort((a, b) => {
      if (sort === 'nome')
        return (a.student.full_name ?? a.student.email).localeCompare(
          b.student.full_name ?? b.student.email,
        );
      if (sort === 'streak')
        return (b.student.streak_current ?? 0) - (a.student.streak_current ?? 0);
      // checkin: menor daysSince primeiro; null vai pro fim
      const da = a.status.daysSince ?? Infinity;
      const db = b.status.daysSince ?? Infinity;
      return da - db;
    });
    return arr;
  }, [visible, sort]);

  const sections: SidebarSection[] = [
    {
      label: 'Status',
      items: (Object.keys(filterFns) as FilterKey[]).map((key) => ({
        name: filterLabels[key],
        count: counts[key],
        active: filter === key,
        onClick: () => setFilter(key),
      })),
    },
  ];

  return (
    <>
      {/* Sidebar de filtros: visível em desktop; colapsável (hambúrguer nativo) < 1024px. */}
      <div className="hidden lg:block">
        <Sidebar sections={sections} />
      </div>
      <details className="border-b border-outline-v lg:hidden">
        <summary className="cursor-pointer list-none px-6 py-3 font-mono text-xs uppercase tracking-widest text-text-3">
          Filtros
        </summary>
        <Sidebar sections={sections} />
      </details>
      <div className="flex-1">
        <PageHeader
          title="Alunos"
          wrap
          actions={
            <Button
              variant="secondary"
              className="!px-4 !py-1.5 !text-xs"
              onClick={() => navigate('/app/convites')}
            >
              Convidar aluno
            </Button>
          }
        >
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por nome ou e-mail"
            className="h-8 w-44 rounded-xl border border-outline-v bg-surface-1 px-3 text-sm text-text-1 placeholder:text-text-3 focus:border-neon focus:outline-none sm:w-64"
          />
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as typeof sort)}
            className="h-8 rounded-xl border border-outline-v bg-surface-1 px-2 text-sm text-text-1 focus:border-neon focus:outline-none"
            aria-label="Ordenar por"
          >
            <option value="nome">Nome</option>
            <option value="checkin">Último check-in</option>
            <option value="streak">Streak</option>
          </select>
          <button
            type="button"
            onClick={() => setArchived((v) => !v)}
            aria-pressed={archived}
            className={`h-8 rounded-xl border px-3 text-xs ${
              archived ? 'border-neon text-neon' : 'border-outline-v text-text-3'
            }`}
          >
            Arquivados
          </button>
        </PageHeader>

        <div className="flex flex-col gap-2 p-6">
          {loading ? (
            Array.from({ length: 6 }, (_, i) => <Skeleton key={i} className="h-16 w-full" />)
          ) : students.length === 0 ? (
            <div className="py-20 text-center">
              <p className="font-display text-lg font-bold uppercase tracking-wide text-text-2">
                {archived ? 'Nenhum aluno arquivado.' : 'Nenhum aluno ainda.'}
              </p>
              {!archived && (
                <p className="mt-1 text-sm text-text-3">Gere um convite para começar.</p>
              )}
            </div>
          ) : sorted.length === 0 ? (
            <p className="py-12 text-center text-sm text-text-3">
              Nenhum aluno corresponde ao filtro.
            </p>
          ) : (
            sorted.map(({ student, status }) => (
              <StudentRow
                key={student.id}
                student={student}
                status={status}
                onClick={() => navigate(`/app/alunos/${student.id}`)}
              />
            ))
          )}
        </div>
      </div>
    </>
  );
}

function StudentRow({
  student,
  status,
  onClick,
}: {
  student: Student;
  status: StudentStatus;
  onClick: () => void;
}) {
  return (
    <Card
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') onClick();
      }}
      className="flex cursor-pointer items-center gap-4 transition-colors hover:border-neon/40"
    >
      <Avatar name={student.full_name} />
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p className="truncate text-sm font-medium text-text-1">
            {student.full_name ?? student.email}
          </p>
          <StreakBadge streak={student.streak_current ?? 0} isBroken={student.is_broken} />
          <StudentBadges count={student.badge_count ?? 0} />
        </div>
        <p className="truncate text-xs text-text-3">{student.email}</p>
      </div>
      <Tag variant={status.tone}>{status.label}</Tag>
      <span aria-hidden className="text-text-3">
        ›
      </span>
    </Card>
  );
}
