import { useNavigate } from 'react-router-dom';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { Skeleton } from '../../components/ui/Skeleton';
import { Tag } from '../../components/ui/Tag';
import { useStudentWorkouts, useToggleWorkoutActive } from '../../hooks/useStudentDetail';
import type { StudentWorkout } from '../../lib/schemas';
import { deriveWorkoutStatus, parseLocalDate, type WorkoutTemporalTone } from '../../lib/studentStatus';

// weekdays da API: 1=segunda … 7=domingo
const WEEKDAY_SHORT = ['', 'SEG', 'TER', 'QUA', 'QUI', 'SEX', 'SÁB', 'DOM'];

function formatDateBr(dateOnly: string): string {
  const d = parseLocalDate(dateOnly);
  return d.toLocaleDateString('pt-BR');
}

// Período do treino (início – fim) para o card. null quando não há datas definidas.
function periodLabel(start: string | null, end: string | null): string | null {
  if (start && end) return `${formatDateBr(start)} – ${formatDateBr(end)}`;
  if (start) return `desde ${formatDateBr(start)}`;
  if (end) return `até ${formatDateBr(end)}`;
  return null;
}

// Status temporal → variante do Tag (done cai no cinza padrão).
const STATUS_TAG_VARIANT: Record<WorkoutTemporalTone, 'active' | 'future' | 'default'> = {
  active: 'active',
  future: 'future',
  done: 'default',
};

function WorkoutRow({ workout, studentId }: { workout: StudentWorkout; studentId: string }) {
  const toggle = useToggleWorkoutActive(studentId);

  function onToggle() {
    const next = !workout.is_active;
    const ok = window.confirm(
      next
        ? `Reativar "${workout.workout_name}" para este aluno?`
        : `Desativar "${workout.workout_name}"? O aluno deixa de ver este treino na agenda.`,
    );
    if (ok) toggle.mutate({ studentWorkoutId: workout.id, isActive: next });
  }

  // Status temporal só faz sentido enquanto o treino está ativo; inativo mostra "Inativo".
  const status = deriveWorkoutStatus(workout.start_date, workout.end_date);
  const period = periodLabel(workout.start_date, workout.end_date);
  const dimmed = !workout.is_active || status.tone === 'done';

  return (
    <Card className={`flex items-center gap-4 ${dimmed ? 'opacity-70' : ''}`}>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-text-1">{workout.workout_name}</p>
        <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
          {[...workout.weekdays].sort((a, b) => a - b).map((d) => (
            <span
              key={d}
              className="rounded-sm bg-surface-2 px-1.5 py-0.5 font-mono text-[10px] text-on-surface"
            >
              {WEEKDAY_SHORT[d]}
            </span>
          ))}
          {period && (
            <span className="ml-1 font-mono text-[10px] text-text-3">{period}</span>
          )}
        </div>
      </div>
      <div className="text-right">
        <p className="font-mono text-xs text-text-2">{workout.exercise_count} exercícios</p>
        <p className="mt-1 font-mono text-xs text-text-3">
          {workout.last_completed_date
            ? `último: ${formatDateBr(workout.last_completed_date)}`
            : 'nunca concluído'}
        </p>
      </div>
      {workout.is_active ? (
        <Tag variant={STATUS_TAG_VARIANT[status.tone]}>{status.label}</Tag>
      ) : (
        <Tag variant="default">Inativo</Tag>
      )}
      <Button
        variant="ghost"
        className="!px-3 !py-1.5 !text-xs"
        disabled={toggle.isPending}
        onClick={onToggle}
      >
        {workout.is_active ? 'Desativar' : 'Reativar'}
      </Button>
    </Card>
  );
}

export function TreinosTab({ studentId }: { studentId: string }) {
  const navigate = useNavigate();
  const { data: workouts, isLoading, isError } = useStudentWorkouts(studentId);

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-base font-bold uppercase tracking-wide text-text-1">
          Treinos atribuídos
        </h2>
        <Button
          variant="secondary"
          className="!px-4 !py-1.5 !text-xs"
          onClick={() => navigate(`/treinos?aluno=${studentId}`)}
        >
          Atribuir treino
        </Button>
      </div>
      {isLoading ? (
        Array.from({ length: 3 }, (_, i) => <Skeleton key={i} className="h-20 w-full" />)
      ) : isError ? (
        <p className="text-sm text-error">Não foi possível carregar os treinos deste aluno.</p>
      ) : !workouts || workouts.length === 0 ? (
        <p className="py-8 text-sm text-text-3">Nenhum treino atribuído a este aluno.</p>
      ) : (
        workouts.map((w) => <WorkoutRow key={w.id} workout={w} studentId={studentId} />)
      )}
    </div>
  );
}
