import { useMemo, useState } from 'react';
import { Skeleton } from '../../components/ui/Skeleton';
import { useWgerCatalog } from '../../hooks/useWgerCatalog';
import { searchExercises, wgerImageUrl, wgerName, type WgerExercise } from '../../lib/wger';

const VISIBLE_LIMIT = 60;

export function CatalogPanel({ onAdd }: { onAdd: (exercise: WgerExercise) => void }) {
  const { data: exercises, isLoading, isError } = useWgerCatalog();
  const [term, setTerm] = useState('');
  const [category, setCategory] = useState('');

  const categories = useMemo(
    () => [...new Set((exercises ?? []).map((e) => e.category))].sort(),
    [exercises],
  );

  const results = useMemo(
    () => searchExercises(exercises ?? [], term, category || undefined),
    [exercises, term, category],
  );

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="flex gap-2 border-b border-outline-v p-3">
        <input
          type="search"
          value={term}
          onChange={(e) => setTerm(e.target.value)}
          placeholder="Buscar exercício"
          className="h-8 min-w-0 flex-1 rounded-xl border border-outline-v bg-surface-1 px-3 text-sm text-text-1 placeholder:text-text-3 focus:border-neon focus:outline-none"
        />
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="h-8 rounded-xl border border-outline-v bg-surface-1 px-2 text-sm text-text-1 focus:border-neon focus:outline-none"
        >
          <option value="">Todas</option>
          {categories.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto p-3">
        {isLoading ? (
          Array.from({ length: 8 }, (_, i) => <Skeleton key={i} className="mb-2 h-12 w-full" />)
        ) : isError ? (
          <p className="text-sm text-error">Não foi possível carregar o catálogo.</p>
        ) : results.length === 0 ? (
          <p className="py-8 text-center text-sm text-text-3">Nenhum exercício encontrado.</p>
        ) : (
          <>
            <ul className="flex flex-col gap-1">
              {results.slice(0, VISIBLE_LIMIT).map((ex) => (
                <li key={ex.id}>
                  <button
                    type="button"
                    onClick={() => onAdd(ex)}
                    className="flex w-full items-center gap-3 rounded-lg px-2 py-1.5 text-left transition-colors hover:bg-surface-2"
                  >
                    <ExerciseThumb exercise={ex} />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm text-text-1">{wgerName(ex)}</span>
                      <span className="block truncate font-mono text-[10px] uppercase text-text-3">
                        {ex.muscles.length > 0 ? ex.muscles.join(' · ') : ex.category}
                      </span>
                    </span>
                    <span aria-hidden className="text-text-3">
                      +
                    </span>
                  </button>
                </li>
              ))}
            </ul>
            {results.length > VISIBLE_LIMIT && (
              <p className="py-3 text-center font-mono text-[10px] uppercase text-text-3">
                {results.length - VISIBLE_LIMIT} resultados a mais — refine a busca
              </p>
            )}
          </>
        )}
      </div>
    </div>
  );
}

function ExerciseThumb({ exercise }: { exercise: WgerExercise }) {
  const url = wgerImageUrl(exercise);
  if (!url) {
    return (
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-surface-2 font-mono text-[10px] text-text-3">
        {exercise.category.slice(0, 3).toUpperCase()}
      </span>
    );
  }
  return (
    <img
      src={url}
      alt=""
      loading="lazy"
      className="h-10 w-10 shrink-0 rounded-lg bg-surface-2 object-cover"
    />
  );
}
