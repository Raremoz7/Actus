import { useState, useCallback } from 'react';
import { Skeleton } from '../../components/ui/Skeleton';
import { useExerciseCatalog } from '../../hooks/useExerciseCatalog';
import {
  categoryLabel,
  equipmentLabel,
  muscleLabel,
  exerciseMuscleGroup,
  levelLabel,
  CATEGORIES,
  EQUIPMENTS,
  MUSCLES,
  LEVELS,
  type Exercise,
} from '../../lib/exercises';

const PAGE_SIZE = 48;

export function ExerciciosPage() {
  const [term, setTerm] = useState('');
  const [debouncedTerm, setDebouncedTerm] = useState('');
  const [category, setCategory] = useState('');
  const [equipment, setEquipment] = useState('');
  const [muscle, setMuscle] = useState('');
  const [level, setLevel] = useState('');
  const [offset, setOffset] = useState(0);
  const [selected, setSelected] = useState<Exercise | null>(null);
  const [timer, setTimer] = useState<ReturnType<typeof setTimeout> | null>(null);

  function handleTermChange(v: string) {
    setTerm(v);
    setOffset(0);
    if (timer) clearTimeout(timer);
    const t = setTimeout(() => setDebouncedTerm(v), 350);
    setTimer(t);
  }

  function handleFilter(setter: (v: string) => void, v: string) {
    setter(v);
    setOffset(0);
  }

  const { data, isLoading, isError } = useExerciseCatalog({
    q: debouncedTerm || undefined,
    category: category || undefined,
    equipment: equipment || undefined,
    muscle: muscle || undefined,
    level: level || undefined,
    limit: PAGE_SIZE,
    offset,
  });

  const exercises = data?.exercises ?? [];
  const total = data?.total ?? 0;
  const totalPages = Math.ceil(total / PAGE_SIZE);
  const currentPage = Math.floor(offset / PAGE_SIZE) + 1;

  return (
    <div className="flex min-h-0 flex-1">
      {/* Lista */}
      <div className="flex min-h-0 flex-1 flex-col">
        {/* Toolbar */}
        <div className="flex flex-wrap items-center gap-3 border-b border-outline-v px-6 py-3">
          <h1 className="font-display text-xl font-black uppercase tracking-wide text-text-1">
            Banco de exercícios
          </h1>
          <input
            type="search"
            value={term}
            onChange={(e) => handleTermChange(e.target.value)}
            placeholder="Buscar por nome"
            className="h-8 w-56 rounded-xl border border-outline-v bg-surface-1 px-3 text-sm text-text-1 placeholder:text-text-3 focus:border-neon focus:outline-none"
          />
          <select
            value={category}
            onChange={(e) => handleFilter(setCategory, e.target.value)}
            className="h-8 rounded-xl border border-outline-v bg-surface-1 px-2 text-sm text-text-1 focus:border-neon focus:outline-none"
          >
            <option value="">Categoria</option>
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>{categoryLabel(c)}</option>
            ))}
          </select>
          <select
            value={muscle}
            onChange={(e) => handleFilter(setMuscle, e.target.value)}
            className="h-8 rounded-xl border border-outline-v bg-surface-1 px-2 text-sm text-text-1 focus:border-neon focus:outline-none"
          >
            <option value="">Músculo</option>
            {MUSCLES.map((m) => (
              <option key={m} value={m}>{muscleLabel(m)}</option>
            ))}
          </select>
          <select
            value={equipment}
            onChange={(e) => handleFilter(setEquipment, e.target.value)}
            className="h-8 rounded-xl border border-outline-v bg-surface-1 px-2 text-sm text-text-1 focus:border-neon focus:outline-none"
          >
            <option value="">Equipamento</option>
            {EQUIPMENTS.map((eq) => (
              <option key={eq} value={eq}>{equipmentLabel(eq)}</option>
            ))}
          </select>
          <select
            value={level}
            onChange={(e) => handleFilter(setLevel, e.target.value)}
            className="h-8 rounded-xl border border-outline-v bg-surface-1 px-2 text-sm text-text-1 focus:border-neon focus:outline-none"
          >
            <option value="">Nível</option>
            {LEVELS.map((l) => (
              <option key={l} value={l}>{levelLabel(l)}</option>
            ))}
          </select>
          {total > 0 && (
            <span className="ml-auto font-mono text-[10px] uppercase text-text-3">
              {total} exercício{total !== 1 ? 's' : ''}
            </span>
          )}
        </div>

        {/* Grade */}
        <div className="flex-1 overflow-y-auto p-6">
          {isLoading ? (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
              {Array.from({ length: 24 }, (_, i) => (
                <Skeleton key={i} className="h-[180px] w-full rounded-xl" />
              ))}
            </div>
          ) : isError ? (
            <p className="py-12 text-center text-sm text-error">
              Não foi possível carregar os exercícios.
            </p>
          ) : exercises.length === 0 ? (
            <p className="py-12 text-center text-sm text-text-3">Nenhum exercício encontrado.</p>
          ) : (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
              {exercises.map((ex) => (
                <ExerciseCard
                  key={ex.id}
                  exercise={ex}
                  active={selected?.id === ex.id}
                  onClick={() => setSelected(ex.id === selected?.id ? null : ex)}
                />
              ))}
            </div>
          )}

          {/* Paginação */}
          {totalPages > 1 && (
            <div className="mt-6 flex items-center justify-center gap-2">
              <button
                type="button"
                disabled={currentPage === 1}
                onClick={() => setOffset(Math.max(0, offset - PAGE_SIZE))}
                className="h-8 w-8 rounded-lg border border-outline-v bg-surface-1 text-sm text-text-2 disabled:opacity-40 hover:bg-surface-2"
              >
                ‹
              </button>
              <span className="font-mono text-xs text-text-3">
                {currentPage} / {totalPages}
              </span>
              <button
                type="button"
                disabled={currentPage >= totalPages}
                onClick={() => setOffset(offset + PAGE_SIZE)}
                className="h-8 w-8 rounded-lg border border-outline-v bg-surface-1 text-sm text-text-2 disabled:opacity-40 hover:bg-surface-2"
              >
                ›
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Painel de detalhe */}
      {selected && (
        <div className="w-[320px] shrink-0 overflow-y-auto border-l border-outline-v p-6">
          <ExerciseDetail exercise={selected} onClose={() => setSelected(null)} />
        </div>
      )}
    </div>
  );
}

function ExerciseCard({
  exercise,
  active,
  onClick,
}: {
  exercise: Exercise;
  active: boolean;
  onClick: () => void;
}) {
  const [imgFailed, setImgFailed] = useState(false);
  const onImgError = useCallback(() => setImgFailed(true), []);
  const showImg = !!exercise.image_0_url && !imgFailed;

  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex flex-col overflow-hidden rounded-xl border text-left transition-colors ${
        active
          ? 'border-neon bg-surface-2'
          : 'border-outline-v bg-surface-1 hover:border-outline-h hover:bg-surface-2'
      }`}
    >
      {showImg ? (
        <img
          src={exercise.image_0_url!}
          alt=""
          loading="lazy"
          onError={onImgError}
          className="aspect-video w-full bg-surface-2 object-cover"
        />
      ) : (
        <div className="flex aspect-video w-full items-center justify-center bg-surface-2">
          <span className="font-mono text-[10px] uppercase text-text-3">
            {(exercise.category ?? '?').slice(0, 3)}
          </span>
        </div>
      )}
      <div className="p-2">
        <p className="line-clamp-2 text-xs font-medium text-text-1">{exercise.name_pt}</p>
        <p className="mt-0.5 truncate font-mono text-[9px] uppercase text-text-3">
          {exerciseMuscleGroup(exercise)}
        </p>
      </div>
    </button>
  );
}

function ExerciseDetail({ exercise, onClose }: { exercise: Exercise; onClose: () => void }) {
  return (
    <div>
      <div className="mb-4 flex items-start justify-between gap-2">
        <h2 className="text-base font-bold text-text-1">{exercise.name_pt}</h2>
        <button
          type="button"
          onClick={onClose}
          className="shrink-0 text-text-3 hover:text-text-1"
          aria-label="Fechar"
        >
          ✕
        </button>
      </div>

      {/* Imagens */}
      <div className="mb-4 flex gap-2">
        {[exercise.image_0_url, exercise.image_1_url].map(
          (url, i) =>
            url && (
              <img
                key={i}
                src={url}
                alt=""
                className="h-24 flex-1 rounded-lg object-cover bg-surface-2"
              />
            ),
        )}
      </div>

      {/* Metadados */}
      <div className="mb-4 grid grid-cols-2 gap-x-4 gap-y-2 text-xs">
        {exercise.category && (
          <Field label="Categoria" value={categoryLabel(exercise.category)} />
        )}
        {exercise.equipment && (
          <Field label="Equipamento" value={equipmentLabel(exercise.equipment)} />
        )}
        {exercise.level && (
          <Field label="Nível" value={levelLabel(exercise.level)} />
        )}
        {exercise.mechanic && (
          <Field label="Mecânica" value={exercise.mechanic === 'compound' ? 'Composto' : 'Isolado'} />
        )}
        {exercise.force && (
          <Field
            label="Força"
            value={exercise.force === 'push' ? 'Empurrar' : exercise.force === 'pull' ? 'Puxar' : 'Isométrico'}
          />
        )}
      </div>

      {/* Músculos */}
      {exercise.primary_muscles.length > 0 && (
        <div className="mb-3">
          <p className="mb-1 font-mono text-[9px] uppercase text-text-3">Músculos primários</p>
          <div className="flex flex-wrap gap-1">
            {exercise.primary_muscles.map((m) => (
              <span
                key={m}
                className="rounded px-2 py-0.5 text-[10px] font-medium bg-neon/10 text-neon"
              >
                {muscleLabel(m)}
              </span>
            ))}
          </div>
        </div>
      )}
      {exercise.secondary_muscles.length > 0 && (
        <div className="mb-3">
          <p className="mb-1 font-mono text-[9px] uppercase text-text-3">Músculos secundários</p>
          <div className="flex flex-wrap gap-1">
            {exercise.secondary_muscles.map((m) => (
              <span
                key={m}
                className="rounded px-2 py-0.5 text-[10px] text-text-2 bg-surface-3"
              >
                {muscleLabel(m)}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Nome em inglês */}
      <p className="font-mono text-[9px] uppercase text-text-3">
        EN: {exercise.name_en}
      </p>
    </div>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="font-mono text-[9px] uppercase text-text-3">{label}</p>
      <p className="text-text-1">{value}</p>
    </div>
  );
}
