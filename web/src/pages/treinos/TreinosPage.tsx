import { useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { Skeleton } from '../../components/ui/Skeleton';
import { Sidebar, type SidebarSection } from '../../layouts/Sidebar';
import { useWorkouts } from '../../hooks/useWorkouts';
import type { WorkoutSummary } from '../../lib/schemas';

function formatDateBr(iso: string): string {
  return new Date(iso).toLocaleDateString('pt-BR');
}

export function TreinosPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [search, setSearch] = useState('');
  const { data: workouts, isLoading, isError } = useWorkouts();

  // Vindo do detalhe do aluno ("Atribuir treino"): mantém o aluno pré-selecionado
  // no fluxo de atribuição (/treinos/:id/atribuir?aluno=:id).
  const alunoParam = searchParams.get('aluno');
  const atribuirSuffix = alunoParam ? `?aluno=${alunoParam}` : '';

  const visible = useMemo(() => {
    const q = search.trim().toLowerCase();
    return (workouts ?? []).filter((w) => q === '' || w.name.toLowerCase().includes(q));
  }, [workouts, search]);

  const sections: SidebarSection[] = [
    {
      label: 'Biblioteca',
      items: [{ name: 'Todos', count: workouts?.length ?? 0, active: true }],
    },
  ];

  return (
    <>
      <Sidebar sections={sections} />
      <div className="flex-1">
        <div className="flex h-[52px] items-center gap-4 border-b border-outline-v px-6">
          <h1 className="font-display text-xl font-black uppercase tracking-wide text-text-1">
            Treinos
          </h1>
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por nome"
            className="ml-4 h-8 w-64 rounded-xl border border-outline-v bg-surface-1 px-3 text-sm text-text-1 placeholder:text-text-3 focus:border-neon focus:outline-none"
          />
          <Button
            className="ml-auto !px-4 !py-1.5 !text-xs"
            onClick={() => navigate('/treinos/novo')}
          >
            + Criar treino
          </Button>
        </div>

        <div className="grid grid-cols-1 gap-3 p-6 md:grid-cols-2 xl:grid-cols-3">
          {isLoading ? (
            Array.from({ length: 6 }, (_, i) => <Skeleton key={i} className="h-28 w-full" />)
          ) : isError ? (
            <p className="col-span-full text-sm text-error">
              Não foi possível carregar os treinos.
            </p>
          ) : !workouts || workouts.length === 0 ? (
            <div className="col-span-full py-20 text-center">
              <p className="font-display text-lg font-bold uppercase tracking-wide text-text-2">
                Nenhum template ainda.
              </p>
              <p className="mt-1 text-sm text-text-3">Monte o primeiro treino.</p>
            </div>
          ) : visible.length === 0 ? (
            <p className="col-span-full py-12 text-center text-sm text-text-3">
              Nenhum treino corresponde à busca.
            </p>
          ) : (
            visible.map((w) => (
              <WorkoutCard
                key={w.id}
                workout={w}
                onOpen={() => navigate(`/treinos/${w.id}`)}
                onAssign={() => navigate(`/treinos/${w.id}/atribuir${atribuirSuffix}`)}
              />
            ))
          )}
        </div>
      </div>
    </>
  );
}

function WorkoutCard({
  workout,
  onOpen,
  onAssign,
}: {
  workout: WorkoutSummary;
  onOpen: () => void;
  onAssign: () => void;
}) {
  return (
    <Card
      role="button"
      tabIndex={0}
      onClick={onOpen}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') onOpen();
      }}
      className="flex cursor-pointer flex-col gap-3 transition-colors hover:border-neon/40"
    >
      <p className="truncate font-display text-base font-bold uppercase tracking-wide text-text-1">
        {workout.name}
      </p>
      {workout.notes && <p className="line-clamp-2 text-xs text-text-3">{workout.notes}</p>}
      <div className="mt-auto flex items-center gap-3">
        <span className="font-mono text-xs text-text-2">{workout.exercise_count} exercícios</span>
        <span className="font-mono text-xs text-text-3">{formatDateBr(workout.created_at)}</span>
        <Button
          variant="secondary"
          className="ml-auto !px-3 !py-1 !text-xs"
          onClick={(e) => {
            e.stopPropagation();
            onAssign();
          }}
        >
          Atribuir
        </Button>
      </div>
    </Card>
  );
}
