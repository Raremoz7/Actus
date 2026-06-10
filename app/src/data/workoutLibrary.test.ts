import { getWorkoutLibrary, getLibraryWorkout, libraryToCreateBody } from './workoutLibrary';
import { CreateWorkoutBodySchema } from '@/types/workouts';
import { LibraryWorkoutSchema } from '@/types/workoutLibrary';

describe('workoutLibrary', () => {
  it('resolve 8 programas válidos a partir do catálogo Wger', () => {
    const lib = getWorkoutLibrary();
    expect(lib.length).toBe(8);
    for (const w of lib) {
      expect(() => LibraryWorkoutSchema.parse(w)).not.toThrow();
      expect(w.exercises.length).toBeGreaterThanOrEqual(1);
      for (const e of w.exercises) expect(e.name.length).toBeGreaterThan(0);
    }
  });

  it('todos os exercícios do seed resolveram no catálogo (nenhum descartado)', () => {
    // 8 programas com a contagem de exercícios curada (6,6,6,5,6,5,5,6 = 45).
    const total = getWorkoutLibrary().reduce((acc, w) => acc + w.exercises.length, 0);
    expect(total).toBe(45);
  });

  it('getLibraryWorkout acha por id e devolve null para inexistente', () => {
    const first = getWorkoutLibrary()[0]!;
    expect(getLibraryWorkout(first.id)?.id).toBe(first.id);
    expect(getLibraryWorkout('nao-existe')).toBeNull();
  });

  it('libraryToCreateBody gera body válido para POST /workouts', () => {
    const w = getWorkoutLibrary()[0]!;
    const body = libraryToCreateBody(w);
    expect(() => CreateWorkoutBodySchema.parse(body)).not.toThrow();
    expect(body.exercises[0]!.position).toBe(1);
    expect(body.name).toBe(w.name);
  });
});
