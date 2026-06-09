import { toApiExercises } from './toApiExercises';
import type { ExerciseFormValue } from '@/components/builder';

const v = (over: Partial<ExerciseFormValue>): ExerciseFormValue => ({
  name: 'Supino', wgerExerciseId: 101, sets: 3, reps: 10, restSeconds: 60, notes: null, muscleGroup: 'Peito', ...over,
});

describe('toApiExercises', () => {
  it('usa o wger_exercise_id real e position sequencial', () => {
    const out = toApiExercises([v({ wgerExerciseId: 101 }), v({ wgerExerciseId: 202, name: 'Crucifixo' })]);
    expect(out[0]).toMatchObject({ position: 1, wger_exercise_id: 101, name_snapshot: 'Supino' });
    expect(out[1]).toMatchObject({ position: 2, wger_exercise_id: 202, name_snapshot: 'Crucifixo' });
  });
  it('omite notes/muscle_group vazios', () => {
    const out = toApiExercises([v({ notes: null, muscleGroup: null })]);
    expect(out[0]!.notes).toBeUndefined();
    expect(out[0]!.muscle_group).toBeUndefined();
  });
});
