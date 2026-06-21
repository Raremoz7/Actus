import { Link, useParams } from 'react-router-dom';
import { Card } from '../../components/ui/Card';
import { Skeleton } from '../../components/ui/Skeleton';
import { Tag } from '../../components/ui/Tag';
import { useAcademyStudents } from '../../hooks/useAcademy';
import { daysSinceLocal } from '../../lib/studentStatus';

const thClass = 'py-2 font-mono text-[10px] font-normal uppercase tracking-widest text-text-3';

export function AcademyInstructorDetailPage() {
  const { instructorId } = useParams<{ instructorId: string }>();
  const { data: students = [], isLoading } = useAcademyStudents(instructorId);
  const instructorName = students[0]?.instructor_name ?? null;

  return (
    <div className="flex-1">
      <div className="flex h-[52px] items-center gap-3 border-b border-outline-v px-6">
        <Link to="/app/academia/equipe" className="text-sm text-text-3 hover:text-neon">
          ← Equipe
        </Link>
        <h1 className="font-display text-xl font-black uppercase tracking-wide text-text-1">
          {instructorName ?? 'Instrutor'}
        </h1>
      </div>

      <div className="p-6">
        <Card>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-display text-base font-bold uppercase tracking-wide text-text-1">
              Alunos
            </h2>
            <span className="font-mono text-xs text-text-3">{students.length}</span>
          </div>
          {isLoading ? (
            <div className="flex flex-col gap-2">
              {Array.from({ length: 5 }, (_, i) => (
                <Skeleton key={i} className="h-9 w-full" />
              ))}
            </div>
          ) : students.length === 0 ? (
            <p className="py-8 text-center text-sm text-text-3">Esse instrutor ainda não tem alunos.</p>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="border-b border-outline-v text-left">
                  <th className={thClass}>Aluno</th>
                  <th className={thClass}>Email</th>
                  <th className={thClass}>Último check-in</th>
                </tr>
              </thead>
              <tbody>
                {students.map((s) => {
                  const stale = s.last_check_in == null || daysSinceLocal(s.last_check_in) > 7;
                  return (
                    <tr key={s.id} className="border-b border-outline-v/40">
                      <td className="py-2 text-sm text-text-1">{s.display_name ?? '—'}</td>
                      <td className="py-2 text-sm text-text-2">{s.email}</td>
                      <td className="py-2">
                        {s.last_check_in == null ? (
                          <Tag variant="warn">Sem registro</Tag>
                        ) : (
                          <Tag variant={stale ? 'warn' : 'active'}>{s.last_check_in}</Tag>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </Card>
      </div>
    </div>
  );
}
