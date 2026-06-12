import type { ExerciseFormValue } from '@/components/builder';
import type { CreateWorkoutExercise } from '@/types/workouts';

// Converte os exercícios do builder no exercises[] da API (position 1-based).
// exercise_id tem prioridade (catálogo PT-BR); wger_exercise_id fica para legado.
export function toApiExercises(drafts: ExerciseFormValue[]): CreateWorkoutExercise[] {
  return drafts.map((d, i) => ({
    position: i + 1,
    exercise_id: d.exerciseId ?? undefined,
    wger_exercise_id: d.wgerExerciseId ?? undefined,
    name_snapshot: d.name,
    sets: d.sets,
    reps: d.reps,
    rest_seconds: d.restSeconds,
    notes: d.notes ?? undefined,
    muscle_group: d.muscleGroup ?? undefined,
  }));
}
