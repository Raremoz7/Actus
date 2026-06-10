// src/types/workoutLibrary.ts
// Contrato da biblioteca de treinos (Banco de Treinos). Schema da forma RESOLVIDA
// (exercícios já com nome/grupo vindos do catálogo Wger). Valida o seed e, no futuro,
// a resposta de GET /workouts/library.
import { z } from 'zod';

export const ObjetivoSchema = z.enum([
  'hipertrofia',
  'emagrecimento',
  'forca',
  'resistencia',
  'mobilidade',
]);
export type Objetivo = z.infer<typeof ObjetivoSchema>;

export const NivelSchema = z.enum(['iniciante', 'intermediario', 'avancado']);
export type Nivel = z.infer<typeof NivelSchema>;

export const LibraryExerciseSchema = z.object({
  wger_exercise_id: z.number().int().min(1),
  name: z.string().min(1),
  muscle_group: z.string().nullable(),
  sets: z.number().int().min(1),
  reps: z.number().int().min(1),
  rest_seconds: z.number().int().min(0),
  notes: z.string().nullable(),
});
export type LibraryExercise = z.infer<typeof LibraryExerciseSchema>;

export const LibraryWorkoutSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  objetivo: ObjetivoSchema,
  nivel: NivelSchema,
  // Resumo legível dos grupos, ex.: "Peito · Ombros · Braços".
  muscle_groups: z.string(),
  notes: z.string().nullable(),
  exercises: z.array(LibraryExerciseSchema).min(1),
});
export type LibraryWorkout = z.infer<typeof LibraryWorkoutSchema>;

// Rótulos pt-BR (com acento) para a UI.
export const OBJETIVO_LABEL: Record<Objetivo, string> = {
  hipertrofia: 'Hipertrofia',
  emagrecimento: 'Emagrecimento',
  forca: 'Força',
  resistencia: 'Resistência',
  mobilidade: 'Mobilidade',
};
export const NIVEL_LABEL: Record<Nivel, string> = {
  iniciante: 'Iniciante',
  intermediario: 'Intermediário',
  avancado: 'Avançado',
};
// Ordem dos chips de filtro.
export const OBJETIVOS: Objetivo[] = [
  'hipertrofia',
  'forca',
  'emagrecimento',
  'resistencia',
  'mobilidade',
];
