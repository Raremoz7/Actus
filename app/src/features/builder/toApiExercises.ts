import type { ExerciseFormValue } from '@/components/builder';
import type { CreateWorkoutExercise } from '@/types/workouts';

// Converte os exercícios do builder no exercises[] da API (position 1-based +
// wger_exercise_id REAL escolhido na busca). Mesma forma p/ create e PATCH (full replace).
export function toApiExercises(drafts: ExerciseFormValue[]): CreateWorkoutExercise[] {
  return drafts.map((d, i) => ({
    position: i + 1,
    wger_exercise_id: d.wgerExerciseId,
    name_snapshot: d.name,
    sets: d.sets,
    reps: d.reps,
    rest_seconds: d.restSeconds,
    notes: d.notes ?? undefined,
    muscle_group: d.muscleGroup ?? undefined,
  }));
}
