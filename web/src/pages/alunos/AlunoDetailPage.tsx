import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog';
import { PageHeader } from '../../components/ui/PageHeader';
import { Skeleton } from '../../components/ui/Skeleton';
import { useStudents } from '../../hooks/useStudents';
import { useSetStudentStatus } from '../../hooks/useStudentProfile';
import { VisaoGeralTab } from './VisaoGeralTab';
import { BadgesTab } from './BadgesTab';
import { TreinosTab } from './TreinosTab';
import { HistoricoTab } from './HistoricoTab';
import { AnamneseTab } from './AnamneseTab';
import { AlimentacaoTab } from './AlimentacaoTab';
import { EditStudentModal } from './EditStudentModal';

type TabKey = 'visao' | 'anamnese' | 'treinos' | 'historico' | 'alimentacao' | 'badges';
const tabs: { key: TabKey; label: string }[] = [
  { key: 'visao', label: 'Visão Geral' },
  { key: 'anamnese', label: 'Anamnese' },
  { key: 'treinos', label: 'Treinos' },
  { key: 'historico', label: 'Histórico' },
  { key: 'alimentacao', label: 'Alimentação' },
  { key: 'badges', label: 'Badges' },
];

export function AlunoDetailPage() {
  const { id } = useParams<{ id: string }>();
  // Desktop: aba selecionada (sempre uma). Mobile: accordion (null = tudo fechado).
  const [tab, setTab] = useState<TabKey>('visao');
  const [openSection, setOpenSection] = useState<TabKey | null>('visao');
  const [editing, setEditing] = useState(false);
  const [confirming, setConfirming] = useState(false);

  // Busca em 'all' para também abrir alunos arquivados.
  const studentsQuery = useStudents('all');
  const student = studentsQuery.data?.find((s) => s.id === id);
  const archived = student?.status === 'revoked';
  const setStatus = useSetStudentStatus(id ?? '');

  if (!id) return null;
  const studentId = id;

  function renderTab(key: TabKey) {
    if (!student) return null;
    switch (key) {
      case 'visao':
        return (
          <VisaoGeralTab
            student={student}
            archived={archived}
            onEdit={() => setEditing(true)}
            onToggleStatus={() => setConfirming(true)}
          />
        );
      case 'anamnese':
        return <AnamneseTab studentId={studentId} />;
      case 'treinos':
        return <TreinosTab studentId={studentId} />;
      case 'historico':
        return <HistoricoTab studentId={studentId} />;
      case 'alimentacao':
        return <AlimentacaoTab studentId={studentId} />;
      case 'badges':
        return <BadgesTab studentId={studentId} />;
    }
  }

  return (
    <div className="flex-1">
      <PageHeader
        before={
          <Link to="/app/alunos" className="text-sm text-text-3 hover:text-neon">
            ‹ Alunos
          </Link>
        }
      />

      <div className="p-6">
        {studentsQuery.isLoading ? (
          <Skeleton className="h-40 w-full" />
        ) : !student ? (
          <p className="text-sm text-text-3">Aluno não encontrado entre os seus vínculos.</p>
        ) : (
          <>
            {/* Desktop: tabs horizontais */}
            <div className="hidden gap-1 border-b border-outline-v lg:flex">
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
            <div className="mt-5 hidden max-w-3xl lg:block">{renderTab(tab)}</div>

            {/* Mobile: accordion */}
            <div className="flex flex-col gap-2 lg:hidden">
              {tabs.map((t) => {
                const open = openSection === t.key;
                return (
                  <div key={t.key} className="rounded-xl border border-outline-v">
                    <button
                      type="button"
                      onClick={() => setOpenSection(open ? null : t.key)}
                      aria-expanded={open}
                      className="flex w-full items-center justify-between px-4 py-3 font-display text-sm font-bold uppercase tracking-wide text-text-1"
                    >
                      {t.label}
                      <span className="text-text-3">{open ? '−' : '+'}</span>
                    </button>
                    {open && (
                      <div className="border-t border-outline-v p-4">{renderTab(t.key)}</div>
                    )}
                  </div>
                );
              })}
            </div>

            <EditStudentModal student={student} open={editing} onClose={() => setEditing(false)} />
            <ConfirmDialog
              open={confirming}
              title={archived ? 'Reativar aluno' : 'Desativar aluno'}
              message={
                archived
                  ? 'O aluno volta para a lista ativa e a contar nos indicadores.'
                  : 'O aluno sai da lista ativa e dos indicadores, mas o histórico é preservado. Você pode reativar depois.'
              }
              confirmLabel={archived ? 'Reativar' : 'Desativar'}
              pending={setStatus.isPending}
              onConfirm={() =>
                setStatus.mutate(archived ? 'active' : 'revoked', {
                  onSuccess: () => setConfirming(false),
                })
              }
              onClose={() => setConfirming(false)}
            />
          </>
        )}
      </div>
    </div>
  );
}
