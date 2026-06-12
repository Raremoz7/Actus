import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { Skeleton } from '../../components/ui/Skeleton';
import { useTemplates, useDeleteTemplate, type TemplateSummary } from '../../hooks/useTemplates';

function formatDateBr(iso: string): string {
  return new Date(iso).toLocaleDateString('pt-BR');
}

export function TemplatesPage() {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const { data: templates, isLoading, isError } = useTemplates();
  const deleteTemplate = useDeleteTemplate();

  const visible = useMemo(() => {
    const q = search.trim().toLowerCase();
    return (templates ?? []).filter((t) => q === '' || t.name.toLowerCase().includes(q));
  }, [templates, search]);

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="flex h-[52px] items-center gap-4 border-b border-outline-v px-6">
        <h1 className="font-display text-xl font-black uppercase tracking-wide text-text-1">
          Templates
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
          onClick={() => navigate('/treinos/templates/novo')}
        >
          + Novo template
        </Button>
      </div>

      <div className="p-6">
        <p className="mb-4 text-xs text-text-3">
          Templates globais visíveis para todos os personais. Eles podem copiar para sua biblioteca.
        </p>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
          {isLoading ? (
            Array.from({ length: 6 }, (_, i) => <Skeleton key={i} className="h-28 w-full" />)
          ) : isError ? (
            <p className="col-span-full text-sm text-error">Não foi possível carregar os templates.</p>
          ) : !templates || templates.length === 0 ? (
            <div className="col-span-full py-20 text-center">
              <p className="font-display text-lg font-bold uppercase tracking-wide text-text-2">
                Nenhum template ainda.
              </p>
              <p className="mt-1 text-sm text-text-3">Crie o primeiro template para os personais.</p>
            </div>
          ) : visible.length === 0 ? (
            <p className="col-span-full py-12 text-center text-sm text-text-3">
              Nenhum template corresponde à busca.
            </p>
          ) : (
            visible.map((t) => (
              <TemplateCard
                key={t.id}
                template={t}
                onEdit={() => navigate(`/treinos/templates/${t.id}`)}
                onDelete={() => {
                  if (confirm(`Excluir "${t.name}"?`)) {
                    void deleteTemplate.mutateAsync(t.id);
                  }
                }}
              />
            ))
          )}
        </div>
      </div>
    </div>
  );
}

function TemplateCard({
  template,
  onEdit,
  onDelete,
}: {
  template: TemplateSummary;
  onEdit: () => void;
  onDelete: () => void;
}) {
  return (
    <Card className="flex flex-col gap-3">
      <p className="truncate font-display text-base font-bold uppercase tracking-wide text-text-1">
        {template.name}
      </p>
      {template.notes && (
        <p className="line-clamp-2 text-xs text-text-3">{template.notes}</p>
      )}
      <div className="mt-auto flex items-center gap-3">
        <span className="font-mono text-xs text-text-2">
          {template.exercise_count} exercício{template.exercise_count !== 1 ? 's' : ''}
        </span>
        <span className="font-mono text-xs text-text-3">{formatDateBr(template.created_at)}</span>
        <div className="ml-auto flex gap-2">
          <Button variant="secondary" className="!px-3 !py-1 !text-xs" onClick={onEdit}>
            Editar
          </Button>
          <Button
            variant="secondary"
            className="!border-error !px-3 !py-1 !text-xs !text-error hover:!border-error hover:!text-error"
            onClick={onDelete}
          >
            Excluir
          </Button>
        </div>
      </div>
    </Card>
  );
}
