import { useState, useCallback } from 'react';
import { Skeleton } from '../../components/ui/Skeleton';
import { useExerciseCatalog } from '../../hooks/useExerciseCatalog';
import {
  categoryLabel,
  exerciseMuscleGroup,
  CATEGORIES,
  MUSCLES,
  muscleLabel,
  type Exercise,
} from '../../lib/exercises';

export function CatalogPanel({ onAdd }: { onAdd: (exercise: Exercise) => void }) {
  const [term, setTerm] = useState('');
  const [category, setCategory] = useState('');
  const [muscle, setMuscle] = useState('');
  const [debouncedTerm, setDebouncedTerm] = useState('');

  // Debounce simples para não disparar request a cada tecla.
  const [timer, setTimer] = useState<ReturnType<typeof setTimeout> | null>(null);
  function handleTermChange(v: string) {
    setTerm(v);
    if (timer) clearTimeout(timer);
    const t = setTimeout(() => setDebouncedTerm(v), 300);
    setTimer(t);
  }

  const { data, isLoading, isError } = useExerciseCatalog({
    q: debouncedTerm || undefined,
    category: category || undefined,
    muscle: muscle || undefined,
    limit: 60,
  });

  const exercises = data?.exercises ?? [];
  const total = data?.total ?? 0;

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="flex flex-col gap-2 border-b border-outline-v p-3">
        <input
          type="search"
          value={term}
          onChange={(e) => handleTermChange(e.target.value)}
          placeholder="Buscar exercício"
          className="h-8 w-full rounded-xl border border-outline-v bg-surface-1 px-3 text-sm text-text-1 placeholder:text-text-3 focus:border-neon focus:outline-none"
        />
        <div className="flex gap-2">
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="h-7 flex-1 rounded-lg border border-outline-v bg-surface-1 px-2 text-xs text-text-1 focus:border-neon focus:outline-none"
          >
            <option value="">Categoria</option>
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>{categoryLabel(c)}</option>
            ))}
          </select>
          <select
            value={muscle}
            onChange={(e) => setMuscle(e.target.value)}
            className="h-7 flex-1 rounded-lg border border-outline-v bg-surface-1 px-2 text-xs text-text-1 focus:border-neon focus:outline-none"
          >
            <option value="">Músculo</option>
            {MUSCLES.map((m) => (
              <option key={m} value={m}>{muscleLabel(m)}</option>
            ))}
          </select>
        </div>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto p-3">
        {isLoading ? (
          Array.from({ length: 8 }, (_, i) => <Skeleton key={i} className="mb-2 h-12 w-full" />)
        ) : isError ? (
          <p className="text-sm text-error">Não foi possível carregar o catálogo.</p>
        ) : exercises.length === 0 ? (
          <p className="py-8 text-center text-sm text-text-3">Nenhum exercício encontrado.</p>
        ) : (
          <>
            <ul className="flex flex-col gap-1">
              {exercises.map((ex) => (
                <li key={ex.id}>
                  <button
                    type="button"
                    onClick={() => onAdd(ex)}
                    className="flex w-full items-center gap-3 rounded-lg px-2 py-1.5 text-left transition-colors hover:bg-surface-2"
                  >
                    <ExerciseThumb exercise={ex} />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm text-text-1">{ex.name_pt}</span>
                      <span className="block truncate font-mono text-[10px] uppercase text-text-3">
                        {exerciseMuscleGroup(ex)}
                      </span>
                    </span>
                    <span aria-hidden className="text-text-3">+</span>
                  </button>
                </li>
              ))}
            </ul>
            {total > exercises.length && (
              <p className="py-3 text-center font-mono text-[10px] uppercase text-text-3">
                {total - exercises.length} resultados a mais — refine a busca
              </p>
            )}
          </>
        )}
      </div>
    </div>
  );
}

function ExerciseThumb({ exercise }: { exercise: Exercise }) {
  const [failed, setFailed] = useState(false);
  const onError = useCallback(() => setFailed(true), []);
  const url = exercise.image_0_url;

  if (!url || failed) {
    return (
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-surface-2 font-mono text-[10px] text-text-3">
        {(exercise.category ?? '?').slice(0, 3).toUpperCase()}
      </span>
    );
  }
  return (
    <img
      src={url}
      alt=""
      loading="lazy"
      onError={onError}
      className="h-10 w-10 shrink-0 rounded-lg bg-surface-2 object-cover"
    />
  );
}
