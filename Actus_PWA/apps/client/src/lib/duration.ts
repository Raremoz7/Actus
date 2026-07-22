// Estimativa simples de duração de um treino. ~3s por repetição + descanso, por série.
type ExerciseTiming = { sets: number; reps: number; rest_seconds: number };
const SECONDS_PER_REP = 3;

export function estimatedMinutes(exercises: ExerciseTiming[]): number {
  const totalSeconds = exercises.reduce(
    (acc, e) => acc + e.sets * (e.reps * SECONDS_PER_REP + e.rest_seconds),
    0,
  );
  return Math.round(totalSeconds / 60);
}
