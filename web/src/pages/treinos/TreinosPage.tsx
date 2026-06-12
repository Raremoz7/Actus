import { useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { Skeleton } from '../../components/ui/Skeleton';
import { Sidebar, type SidebarSection } from '../../layouts/Sidebar';
import { useWorkouts } from '../../hooks/useWorkouts';
import { useTemplates, useCopyTemplate, type TemplateSummary } from '../../hooks/useTemplates';
import { useToast } from '../../components/ui/Toast';
import type { WorkoutSummary } from '../../lib/schemas';

function formatDateBr(iso: string): string {
  return new Date(iso).toLocaleDateString('pt-BR');
}

export function TreinosPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [search, setSearch] = useState('');
  const [tab, setTab] = useState<'meus' | 'templates'>('meus');
  const { data: workouts, isLoading, isError } = useWorkouts();
  const templates = useTemplates();
  const copyTemplate = useCopyTemplate();
  const { toast } = useToast();

  // Vindo do detalhe do aluno ("Atribuir treino"): mantém o aluno pré-selecionado
  // no fluxo de atribuição (/treinos/:id/atribuir?aluno=:id).
  const alunoParam = searchParams.get('aluno');
  const atribuirSuffix = alunoParam ? `?aluno=${alunoParam}` : '';

  const visible = useMemo(() => {
    const q = search.trim().toLowerCase();
    return (workouts ?? []).filter((w) => q === '' || w.name.toLowerCase().includes(q));
  }, [workouts, search]);

  const visibleTemplates = useMemo(() => {
    const q = search.trim().toLowerCase();
    return (templates.data ?? []).filter((t) => q === '' || t.name.toLowerCase().includes(q));
  }, [templates.data, search]);

  async function handleCopy(templateId: string, templateName: string) {
    try {
      await copyTemplate.mutateAsync(templateId);
      toast(`"${templateName}" adicionado à sua biblioteca.`);
    } catch {
      toast('Não foi possível copiar o template.');
    }
  }

  const sections: SidebarSection[] = [
    {
      label: 'Biblioteca',
      items: [
        { name: 'Meus treinos', count: workouts?.length ?? 0, active: tab === 'meus', onClick: () => setTab('meus') },
        { name: 'Templates', count: templates.data?.length ?? 0, active: tab === 'templates', onClick: () => setTab('templates') },
      ],
    },
  ];

  return (
    <>
      <Sidebar sections={sections} />
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
        <div className="flex h-[52px] shrink-0 items-center gap-4 border-b border-outline-v px-6">
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
          {tab === 'meus' && (
            <Button
              className="ml-auto !px-4 !py-1.5 !text-xs"
              onClick={() => navigate('/treinos/novo')}
            >
              + Criar treino
            </Button>
          )}
        </div>

        <div className="flex-1 overflow-y-auto">
          {tab === 'meus' ? (
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
                    Nenhum treino ainda.
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
          ) : (
            <div className="p-6">
              <p className="mb-4 text-xs text-text-3">
                Templates prontos criados pelo time Actus. Copie para sua biblioteca e personalize.
              </p>
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
                {templates.isLoading ? (
                  Array.from({ length: 6 }, (_, i) => <Skeleton key={i} className="h-28 w-full" />)
                ) : templates.isError ? (
                  <p className="col-span-full text-sm text-error">Não foi possível carregar os templates.</p>
                ) : !templates.data || templates.data.length === 0 ? (
                  <div className="col-span-full py-20 text-center">
                    <p className="font-display text-lg font-bold uppercase tracking-wide text-text-2">
                      Nenhum template disponível.
                    </p>
                  </div>
                ) : visibleTemplates.length === 0 ? (
                  <p className="col-span-full py-12 text-center text-sm text-text-3">
                    Nenhum template corresponde à busca.
                  </p>
                ) : (
                  visibleTemplates.map((t) => (
                    <TemplateCard
                      key={t.id}
                      template={t}
                      onCopy={() => void handleCopy(t.id, t.name)}
                      copying={copyTemplate.isPending}
                    />
                  ))
                )}
              </div>
            </div>
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

function TemplateCard({
  template,
  onCopy,
  copying,
}: {
  template: TemplateSummary;
  onCopy: () => void;
  copying: boolean;
}) {
  return (
    <Card className="flex flex-col gap-3">
      <p className="truncate font-display text-base font-bold uppercase tracking-wide text-text-1">
        {template.name}
      </p>
      {template.notes && <p className="line-clamp-2 text-xs text-text-3">{template.notes}</p>}
      <div className="mt-auto flex items-center gap-3">
        <span className="font-mono text-xs text-text-2">
          {template.exercise_count} exercício{template.exercise_count !== 1 ? 's' : ''}
        </span>
        <Button
          variant="secondary"
          className="ml-auto !px-3 !py-1 !text-xs"
          disabled={copying}
          onClick={onCopy}
        >
          Copiar para minha biblioteca
        </Button>
      </div>
    </Card>
  );
}
