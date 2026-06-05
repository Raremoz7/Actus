import type { SessionExercise, SessionSet } from '@/types/sessions';

// Série a enviar no PUT de séries (campos opcionais quando não preenchidos).
export type SetPayload = {
  set_index: number;
  weight_kg?: number;
  reps_done?: number;
  rest_seconds_actual?: number;
};

// Lógica pura do player de sessão de treino — sem efeitos, sobre o array
// `exercises` (já ordenado por position) e seus `sets_logged`.

// Índice do primeiro exercício NÃO concluído (ordem do array). null se todos concluídos.
export function currentExerciseIndex(exercises: SessionExercise[]): number | null {
  const idx = exercises.findIndex((e) => !e.completed);
  return idx === -1 ? null : idx;
}

// Sessão completa = array não-vazio e todos os exercícios concluídos.
export function isSessionComplete(exercises: SessionExercise[]): boolean {
  return exercises.length > 0 && exercises.every((e) => e.completed);
}

// Progresso da sessão: quantos exercícios concluídos sobre o total.
export function sessionProgress(exercises: SessionExercise[]): { done: number; total: number } {
  const done = exercises.filter((e) => e.completed).length;
  return { done, total: exercises.length };
}

// Próximo set_index a logar (1-based) = quantidade já logada + 1.
export function nextSetIndex(exercise: SessionExercise): number {
  return exercise.sets_logged.length + 1;
}

// Exercício totalmente logado quando o nº de séries logadas alcança o prescrito.
export function isExerciseFullyLogged(exercise: SessionExercise): boolean {
  return exercise.sets_logged.length >= exercise.sets;
}

// O PUT .../sets faz FULL-REPLACE: apaga todas as séries do exercício e regrava
// só o que vem no body. Por isso o body precisa conter a lista ACUMULADA —
// as séries já logadas + a nova. Enviar só a nova apagaria as anteriores
// (o que prenderia o aluno re-logando a mesma série pra sempre).
export function buildSetsPayload(loggedSets: SessionSet[], newSet: SetPayload): SetPayload[] {
  const prior: SetPayload[] = loggedSets.map((s) => ({
    set_index: s.set_index,
    ...(s.weight_kg != null ? { weight_kg: s.weight_kg } : {}),
    ...(s.reps_done != null ? { reps_done: s.reps_done } : {}),
    ...(s.rest_seconds_actual != null ? { rest_seconds_actual: s.rest_seconds_actual } : {}),
  }));
  return [...prior, newSet];
}
