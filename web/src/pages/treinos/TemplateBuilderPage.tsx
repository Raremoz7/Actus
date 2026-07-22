import { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { PageHeader } from '../../components/ui/PageHeader';
import { Skeleton } from '../../components/ui/Skeleton';
import { useTemplateDetail, useCreateTemplate, useUpdateTemplate, type TemplatePayload } from '../../hooks/useTemplates';
import { exerciseMuscleGroup, type Exercise } from '../../lib/exercises';
import { CatalogPanel } from './CatalogPanel';
import { ExerciseList } from './ExerciseList';
import type { BuilderExercise } from './BuilderPage';

let keySeq = 0;
const nextKey = () => `ex-${++keySeq}`;

export function TemplateBuilderPage() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEdit = id !== undefined;

  const detail = useTemplateDetail(id);
  const create = useCreateTemplate();
  const update = useUpdateTemplate(id ?? '');

  const [name, setName] = useState('');
  const [notes, setNotes] = useState('');
  const [exercises, setExercises] = useState<BuilderExercise[]>([]);
  const [validationError, setValidationError] = useState<string | null>(null);

  const hydrated = useRef(false);
  useEffect(() => {
    if (!isEdit || hydrated.current || !detail.data) return;
    hydrated.current = true;
    setName(detail.data.name);
    setNotes(detail.data.notes ?? '');
    setExercises(
      detail.data.exercises.map((ex) => ({
        key: nextKey(),
        exercise_id: ex.exercise_id ?? String(ex.wger_exercise_id ?? ''),
        name_snapshot: ex.name_snapshot,
        sets: ex.sets,
        reps: ex.reps,
        rest_seconds: ex.rest_seconds,
        notes: ex.notes,
        muscle_group: ex.muscle_group,
      })),
    );
  }, [isEdit, detail.data]);

  function addExercise(ex: Exercise) {
    setExercises((prev) => [
      ...prev,
      {
        key: nextKey(),
        exercise_id: ex.id,
        name_snapshot: ex.name_pt,
        sets: 3,
        reps: 10,
        rest_seconds: 60,
        notes: null,
        muscle_group: exerciseMuscleGroup(ex),
      },
    ]);
    setValidationError(null);
  }

  function changeExercise(index: number, patch: Partial<BuilderExercise>) {
    setExercises((prev) => prev.map((ex, i) => (i === index ? { ...ex, ...patch } : ex)));
  }
  function removeExercise(index: number) {
    setExercises((prev) => prev.filter((_, i) => i !== index));
  }
  function moveExercise(index: number, direction: -1 | 1) {
    setExercises((prev) => {
      const target = index + direction;
      if (target < 0 || target >= prev.length) return prev;
      const next = [...prev];
      const a = next[index]!;
      next[index] = next[target]!;
      next[target] = a;
      return next;
    });
  }

  const saving = create.isPending || update.isPending;

  async function save() {
    if (name.trim() === '') { setValidationError('Dê um nome ao template.'); return; }
    if (exercises.length === 0) { setValidationError('Adicione pelo menos um exercício.'); return; }
    setValidationError(null);

    const payload: TemplatePayload = {
      name: name.trim(),
      ...(notes.trim() !== '' ? { notes: notes.trim() } : {}),
      exercises: exercises.map((ex, i) => ({
        position: i + 1,
        exercise_id: ex.exercise_id,
        name_snapshot: ex.name_snapshot,
        sets: ex.sets,
        reps: ex.reps,
        rest_seconds: ex.rest_seconds,
        ...(ex.notes ? { notes: ex.notes } : {}),
        muscle_group: ex.muscle_group,
      })),
    };

    try {
      if (isEdit) await update.mutateAsync(payload);
      else await create.mutateAsync(payload);
      navigate('/treinos/templates');
    } catch (err) {
      const branch =
        (err as { response?: { data?: { error?: string } } }).response?.data?.error ??
        'erro inesperado';
      setValidationError(`Não foi possível salvar (${branch}).`);
    }
  }

  if (isEdit && detail.isLoading) {
    return (
      <div className="flex-1 p-6">
        <Skeleton className="mb-4 h-10 w-80" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (isEdit && detail.isError) {
    return (
      <div className="flex-1 p-6">
        <p className="text-sm text-error">Template não encontrado.</p>
      </div>
    );
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <PageHeader
        title={isEdit ? 'Editar template' : 'Novo template'}
        className="shrink-0"
        actions={
          <>
            <Button variant="ghost" className="!px-4 !py-1.5 !text-xs" onClick={() => navigate('/treinos/templates')}>
              Cancelar
            </Button>
            <Button className="!px-4 !py-1.5 !text-xs" disabled={saving} onClick={() => void save()}>
              {saving ? 'Salvando…' : 'Salvar template'}
            </Button>
          </>
        }
      >
        <Input
          value={name}
          onChange={(e) => { setName(e.target.value); setValidationError(null); }}
          placeholder="Nome do template"
          className="ml-4 h-8 w-72"
        />
        {validationError && <p className="text-xs text-error">{validationError}</p>}
      </PageHeader>

      <div className="flex min-h-0 flex-1">
        <div className="flex w-[380px] min-h-0 shrink-0 flex-col border-r border-outline-v">
          <p className="border-b border-outline-v px-3 py-2 font-mono text-[9px] uppercase tracking-widest text-text-3">
            Catálogo de exercícios
          </p>
          <CatalogPanel onAdd={addExercise} />
        </div>
        <div className="min-w-0 flex-1 overflow-y-auto p-6">
          <ExerciseList
            exercises={exercises}
            onChange={changeExercise}
            onRemove={removeExercise}
            onMove={moveExercise}
          />
          <label className="mt-6 block">
            <span className="mb-1 block font-mono text-[9px] uppercase tracking-widest text-text-3">
              Notas do template
            </span>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              placeholder="Orientações gerais"
              className="w-full rounded-xl border border-outline-v bg-surface-1 px-3 py-2 text-sm text-text-1 placeholder:text-text-3 focus:border-neon focus:outline-none"
            />
          </label>
        </div>
      </div>
    </div>
  );
}
