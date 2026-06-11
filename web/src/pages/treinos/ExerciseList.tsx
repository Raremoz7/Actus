import type { BuilderExercise } from './BuilderPage';

type Props = {
  exercises: BuilderExercise[];
  onChange: (index: number, patch: Partial<BuilderExercise>) => void;
  onRemove: (index: number) => void;
  onMove: (index: number, direction: -1 | 1) => void;
};

function NumberField({
  label,
  value,
  min,
  max,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  onChange: (v: number) => void;
}) {
  return (
    <label className="flex flex-col gap-0.5">
      <span className="font-mono text-[9px] uppercase tracking-widest text-text-3">{label}</span>
      <input
        type="number"
        value={value}
        min={min}
        max={max}
        onChange={(e) => {
          const n = Number(e.target.value);
          if (Number.isFinite(n)) onChange(Math.max(min, Math.min(max, Math.trunc(n))));
        }}
        className="h-8 w-16 rounded-xl border border-outline-v bg-surface-1 px-2 font-mono text-sm text-text-1 focus:border-neon focus:outline-none"
      />
    </label>
  );
}

export function ExerciseList({ exercises, onChange, onRemove, onMove }: Props) {
  if (exercises.length === 0) {
    return (
      <p className="py-12 text-center text-sm text-text-3">
        Adicione exercícios pelo catálogo ao lado.
      </p>
    );
  }

  return (
    <ol className="flex flex-col gap-2">
      {exercises.map((ex, i) => (
        <li
          key={ex.key}
          className="flex items-center gap-3 rounded-xl border border-outline-v bg-surface-1 p-3"
        >
          <span className="w-6 shrink-0 font-mono text-xs text-text-3">{i + 1}</span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-text-1">{ex.name_snapshot}</p>
            {ex.muscle_group && (
              <p className="truncate font-mono text-[10px] uppercase text-text-3">
                {ex.muscle_group}
              </p>
            )}
          </div>
          <NumberField
            label="Séries"
            value={ex.sets}
            min={1}
            max={50}
            onChange={(v) => onChange(i, { sets: v })}
          />
          <NumberField
            label="Reps"
            value={ex.reps}
            min={1}
            max={500}
            onChange={(v) => onChange(i, { reps: v })}
          />
          <NumberField
            label="Descanso (s)"
            value={ex.rest_seconds}
            min={0}
            max={3600}
            onChange={(v) => onChange(i, { rest_seconds: v })}
          />
          <div className="flex flex-col">
            <button
              type="button"
              aria-label="Mover para cima"
              disabled={i === 0}
              onClick={() => onMove(i, -1)}
              className="px-1.5 text-text-2 transition-colors hover:text-text-1 disabled:pointer-events-none disabled:opacity-30"
            >
              ↑
            </button>
            <button
              type="button"
              aria-label="Mover para baixo"
              disabled={i === exercises.length - 1}
              onClick={() => onMove(i, 1)}
              className="px-1.5 text-text-2 transition-colors hover:text-text-1 disabled:pointer-events-none disabled:opacity-30"
            >
              ↓
            </button>
          </div>
          <button
            type="button"
            aria-label="Remover exercício"
            onClick={() => onRemove(i)}
            className="px-2 text-text-3 transition-colors hover:text-error"
          >
            ✕
          </button>
        </li>
      ))}
    </ol>
  );
}
