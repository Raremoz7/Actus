import { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Button } from '../../components/ui/Button';
import { Skeleton } from '../../components/ui/Skeleton';
import { useWorkoutDetail } from '../../hooks/useWorkouts';
import {
  useCreateWorkout,
  useUpdateWorkout,
  type WorkoutPayload,
} from '../../hooks/useWorkoutMutations';
import { wgerName, type WgerExercise } from '../../lib/wger';
import { CatalogPanel } from './CatalogPanel';
import { ExerciseList } from './ExerciseList';

export type BuilderExercise = {
  key: string; // chave local de lista (permite o mesmo exercício 2x)
  wger_exercise_id: number;
  name_snapshot: string;
  sets: number;
  reps: number;
  rest_seconds: number;
  notes: string | null;
  muscle_group: string | null;
};

let keySeq = 0;
const nextKey = () => `ex-${++keySeq}`;

export function BuilderPage() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEdit = id !== undefined;

  const detail = useWorkoutDetail(id);
  const create = useCreateWorkout();
  const update = useUpdateWorkout(id ?? '');

  const [name, setName] = useState('');
  const [notes, setNotes] = useState('');
  const [exercises, setExercises] = useState<BuilderExercise[]>([]);
  const [validationError, setValidationError] = useState<string | null>(null);

  // Hidrata o estado local uma única vez quando o detalhe chega (modo edição).
  const hydrated = useRef(false);
  useEffect(() => {
    if (!isEdit || hydrated.current || !detail.data) return;
    hydrated.current = true;
    setName(detail.data.name);
    setNotes(detail.data.notes ?? '');
    setExercises(
      detail.data.exercises.map((ex) => ({
        key: nextKey(),
        wger_exercise_id: ex.wger_exercise_id,
        name_snapshot: ex.name_snapshot,
        sets: ex.sets,
        reps: ex.reps,
        rest_seconds: ex.rest_seconds,
        notes: ex.notes,
        muscle_group: ex.muscle_group,
      })),
    );
  }, [isEdit, detail.data]);

  function addExercise(ex: WgerExercise) {
    setExercises((prev) => [
      ...prev,
      {
        key: nextKey(),
        wger_exercise_id: ex.id,
        name_snapshot: wgerName(ex),
        sets: 3,
        reps: 10,
        rest_seconds: 60,
        notes: null,
        muscle_group: ex.muscles[0] ?? ex.category,
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
    if (name.trim() === '') {
      setValidationError('Dê um nome ao treino.');
      return;
    }
    if (exercises.length === 0) {
      setValidationError('Adicione pelo menos um exercício.');
      return;
    }
    setValidationError(null);

    const payload: WorkoutPayload = {
      name: name.trim(),
      ...(notes.trim() !== '' ? { notes: notes.trim() } : {}),
      exercises: exercises.map((ex, i) => ({
        position: i + 1,
        wger_exercise_id: ex.wger_exercise_id,
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
      navigate('/treinos');
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
        <p className="text-sm text-error">Treino não encontrado.</p>
      </div>
    );
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="flex h-[52px] shrink-0 items-center gap-4 border-b border-outline-v px-6">
        <h1 className="font-display text-xl font-black uppercase tracking-wide text-text-1">
          {isEdit ? 'Editar treino' : 'Novo treino'}
        </h1>
        <input
          value={name}
          onChange={(e) => {
            setName(e.target.value);
            setValidationError(null);
          }}
          placeholder="Nome do treino"
          className="ml-4 h-8 w-72 rounded-xl border border-outline-v bg-surface-1 px-3 text-sm text-text-1 placeholder:text-text-3 focus:border-neon focus:outline-none"
        />
        {validationError && <p className="text-xs text-error">{validationError}</p>}
        <div className="ml-auto flex items-center gap-2">
          {isEdit && (
            <Button
              variant="secondary"
              className="!px-4 !py-1.5 !text-xs"
              onClick={() => navigate(`/treinos/${id}/atribuir`)}
            >
              Atribuir
            </Button>
          )}
          <Button variant="ghost" className="!px-4 !py-1.5 !text-xs" onClick={() => navigate('/treinos')}>
            Cancelar
          </Button>
          <Button
            className="!px-4 !py-1.5 !text-xs"
            disabled={saving}
            onClick={() => void save()}
          >
            {saving ? 'Salvando…' : 'Salvar treino'}
          </Button>
        </div>
      </div>

      <div className="flex min-h-0 flex-1">
        <div className="flex w-[380px] shrink-0 flex-col border-r border-outline-v">
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
              Notas do treino
            </span>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              placeholder="Orientações gerais para o aluno"
              className="w-full rounded-xl border border-outline-v bg-surface-1 px-3 py-2 text-sm text-text-1 placeholder:text-text-3 focus:border-neon focus:outline-none"
            />
          </label>
        </div>
      </div>
    </div>
  );
}
