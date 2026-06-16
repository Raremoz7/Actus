import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Avatar } from '../../components/ui/Avatar';
import { Skeleton } from '../../components/ui/Skeleton';
import { Tag } from '../../components/ui/Tag';
import { useStudents } from '../../hooks/useStudents';
import { useStudentCheckIns } from '../../hooks/useStudentDetail';
import { deriveStudentStatus } from '../../lib/studentStatus';
import { TreinosTab } from './TreinosTab';
import { HistoricoTab } from './HistoricoTab';
import { PreferenciasTab } from './PreferenciasTab';

type TabKey = 'treinos' | 'historico' | 'preferencias';

const tabs: { key: TabKey; label: string }[] = [
  { key: 'treinos', label: 'Treinos atribuídos' },
  { key: 'historico', label: 'Histórico' },
  { key: 'preferencias', label: 'Preferências' },
];

export function AlunoDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [tab, setTab] = useState<TabKey>('treinos');

  const studentsQuery = useStudents();
  const student = studentsQuery.data?.find((s) => s.id === id);
  const checkIns = useStudentCheckIns(id ?? '', 60);
  const status = deriveStudentStatus(checkIns.data);

  if (!id) return null;

  return (
    <div className="flex-1">
      <div className="flex h-[52px] items-center gap-3 border-b border-outline-v px-6">
        <Link to="/app/alunos" className="text-sm text-text-3 hover:text-neon">
          ‹ Alunos
        </Link>
      </div>

      <div className="p-6">
        {studentsQuery.isLoading ? (
          <div className="flex items-center gap-4">
            <Skeleton className="h-16 w-16 rounded-full" />
            <div className="flex flex-col gap-2">
              <Skeleton className="h-6 w-48" />
              <Skeleton className="h-4 w-64" />
            </div>
          </div>
        ) : !student ? (
          <p className="text-sm text-text-3">
            Aluno não encontrado entre os seus vínculos ativos.
          </p>
        ) : (
          <>
            <div className="flex items-center gap-4">
              <Avatar name={student.full_name} size="lg" />
              <div className="min-w-0">
                <h1 className="truncate font-display text-2xl font-black uppercase tracking-wide text-text-1">
                  {student.full_name ?? student.email}
                </h1>
                <p className="truncate text-sm text-text-3">{student.email}</p>
              </div>
              <Tag variant={status.tone} className="ml-2">
                {status.label}
              </Tag>
            </div>

            <div className="mt-6 flex gap-1 border-b border-outline-v">
              {tabs.map((t) => (
                <button
                  key={t.key}
                  type="button"
                  onClick={() => setTab(t.key)}
                  className={`border-b-2 px-4 py-2.5 font-display text-sm font-bold uppercase tracking-wide transition-colors ${
                    tab === t.key
                      ? 'border-neon text-text-1'
                      : 'border-transparent text-text-2 hover:text-text-1'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>

            <div className="mt-5 max-w-3xl">
              {tab === 'treinos' && <TreinosTab studentId={id} />}
              {tab === 'historico' && <HistoricoTab studentId={id} />}
              {tab === 'preferencias' && <PreferenciasTab />}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
