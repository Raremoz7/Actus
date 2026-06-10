// src/data/workoutLibrary.ts
// [SEED — conteúdo-semente do futuro GET /workouts/library]
// Curadoria editorial: os PROGRAMAS (seleção + séries/reps) são autorais; os EXERCÍCIOS
// são reais do catálogo Wger empacotado (id/nome/imagem). O resolver monta a forma final.
import { wgerCatalog, exerciseName } from '@/lib/wger/catalog';
import {
  LibraryWorkoutSchema,
  type LibraryWorkout,
  type LibraryExercise,
  type Objetivo,
  type Nivel,
} from '@/types/workoutLibrary';
import type { CreateWorkoutBody } from '@/types/workouts';

// Categoria do Wger (EN) → rótulo pt-BR de grupo muscular.
const CATEGORY_PT: Record<string, string> = {
  Chest: 'Peito',
  Back: 'Costas',
  Legs: 'Pernas',
  Shoulders: 'Ombros',
  Arms: 'Braços',
  Abs: 'Abdômen',
  Calves: 'Panturrilhas',
  Cardio: 'Cardio',
};

type SeedExercise = {
  wgerExerciseId: number;
  sets: number;
  reps: number;
  restSeconds: number;
  notes?: string;
};
type Seed = {
  id: string;
  name: string;
  objetivo: Objetivo;
  nivel: Nivel;
  notes?: string;
  exercises: SeedExercise[];
};

// Atalho para reduzir ruído na tabela de seed.
const ex = (
  wgerExerciseId: number,
  sets: number,
  reps: number,
  restSeconds: number,
  notes?: string,
): SeedExercise => ({
  wgerExerciseId,
  sets,
  reps,
  restSeconds,
  ...(notes ? { notes } : {}),
});

// 8 programas curados. Os ids são exercícios REAIS do catálogo Wger empacotado.
const SEED: Seed[] = [
  {
    id: 'hipertrofia-superior-push',
    name: 'Peito, Ombro e Tríceps',
    objetivo: 'hipertrofia',
    nivel: 'intermediario',
    notes: 'Treino de empurrar focado em volume para superiores.',
    exercises: [
      ex(73, 4, 10, 90),
      ex(538, 3, 10, 90),
      ex(238, 3, 12, 60),
      ex(567, 3, 10, 90),
      ex(348, 3, 15, 45),
      ex(1185, 3, 12, 60),
    ],
  },
  {
    id: 'hipertrofia-costas-biceps',
    name: 'Costas e Bíceps',
    objetivo: 'hipertrofia',
    nivel: 'intermediario',
    notes: 'Treino de puxar com ênfase em dorsais e bíceps.',
    exercises: [
      ex(158, 4, 10, 90),
      ex(921, 3, 10, 90),
      ex(81, 3, 10, 75),
      ex(1732, 3, 15, 45),
      ex(92, 3, 12, 60),
      ex(1567, 3, 12, 60),
    ],
  },
  {
    id: 'hipertrofia-pernas',
    name: 'Pernas completo',
    objetivo: 'hipertrofia',
    nivel: 'intermediario',
    notes: 'Quadríceps, posterior e panturrilha num só treino.',
    exercises: [
      ex(257, 4, 8, 120),
      ex(371, 4, 12, 90),
      ex(1652, 3, 10, 90),
      ex(364, 3, 12, 60),
      ex(369, 3, 15, 60),
      ex(622, 4, 15, 45),
    ],
  },
  {
    id: 'forca-full-body-5x5',
    name: 'Força full body 5×5',
    objetivo: 'forca',
    nivel: 'avancado',
    notes: 'Básicos pesados, 5 séries de 5 com descanso longo.',
    exercises: [
      ex(630, 5, 5, 180),
      ex(73, 5, 5, 180),
      ex(257, 5, 5, 180),
      ex(566, 3, 6, 150),
      ex(921, 3, 6, 150),
    ],
  },
  {
    id: 'emagrecimento-circuito',
    name: 'Circuito queima',
    objetivo: 'emagrecimento',
    nivel: 'iniciante',
    notes: 'Circuito full body, descanso curto, ritmo contínuo.',
    exercises: [
      ex(203, 3, 15, 45),
      ex(1551, 3, 12, 45),
      ex(206, 3, 12, 45),
      ex(1725, 3, 15, 45),
      ex(960, 3, 20, 45),
      ex(1091, 3, 1, 45, 'Segure 30s'),
    ],
  },
  {
    id: 'resistencia-core',
    name: 'Core e estabilidade',
    objetivo: 'resistencia',
    nivel: 'intermediario',
    notes: 'Resistência de core e cadeia posterior.',
    exercises: [
      ex(1091, 3, 1, 45, 'Segure 40s'),
      ex(1193, 3, 20, 45),
      ex(377, 3, 15, 45),
      ex(301, 3, 15, 60),
      ex(1642, 3, 15, 60),
    ],
  },
  {
    id: 'mobilidade-recuperacao',
    name: 'Mobilidade e recuperação',
    objetivo: 'mobilidade',
    nivel: 'iniciante',
    notes: 'Sessão leve de mobilidade e liberação.',
    exercises: [
      ex(1865, 2, 12, 30),
      ex(1859, 2, 1, 30, '1 min cada lado'),
      ex(1230, 2, 1, 20, '30s cada lado'),
      ex(1232, 2, 1, 20, '30s cada lado'),
      ex(268, 2, 12, 45, 'Carga leve'),
    ],
  },
  {
    id: 'full-body-iniciante-maquinas',
    name: 'Full body iniciante (máquinas)',
    objetivo: 'hipertrofia',
    nivel: 'iniciante',
    notes: 'Primeira rotina em máquinas guiadas, corpo inteiro.',
    exercises: [
      ex(371, 3, 12, 60),
      ex(1725, 3, 12, 60),
      ex(543, 3, 12, 60),
      ex(364, 3, 12, 60),
      ex(135, 3, 12, 60),
      ex(95, 3, 12, 60),
    ],
  },
];

// Resolve um seed → LibraryWorkout (nome/grupo do catálogo). Exercício cujo id não
// existe no catálogo é descartado (dev warn) — não quebra o programa.
function resolveSeed(seed: Seed): LibraryWorkout {
  const catalog = wgerCatalog();
  const resolved: LibraryExercise[] = [];
  for (const s of seed.exercises) {
    const found = catalog.getExercise(s.wgerExerciseId);
    if (!found) {
      if (__DEV__) {
        console.warn(
          `[workoutLibrary] exercício ${s.wgerExerciseId} ausente no catálogo Wger (seed ${seed.id})`,
        );
      }
      continue;
    }
    const muscle = CATEGORY_PT[found.category] ?? found.category;
    resolved.push({
      wger_exercise_id: s.wgerExerciseId,
      name: exerciseName(found),
      muscle_group: muscle,
      sets: s.sets,
      reps: s.reps,
      rest_seconds: s.restSeconds,
      notes: s.notes ?? null,
    });
  }
  const groups = [
    ...new Set(resolved.map((e) => e.muscle_group).filter((g): g is string => !!g)),
  ];
  return LibraryWorkoutSchema.parse({
    id: seed.id,
    name: seed.name,
    objetivo: seed.objetivo,
    nivel: seed.nivel,
    muscle_groups: groups.join(' · '),
    notes: seed.notes ?? null,
    exercises: resolved,
  });
}

let _lib: LibraryWorkout[] | null = null;
export function getWorkoutLibrary(): LibraryWorkout[] {
  if (_lib) return _lib;
  _lib = SEED.map(resolveSeed);
  return _lib;
}

export function getLibraryWorkout(id: string): LibraryWorkout | null {
  return getWorkoutLibrary().find((w) => w.id === id) ?? null;
}

// Converte um programa da biblioteca no corpo de POST /workouts (clone).
export function libraryToCreateBody(w: LibraryWorkout): CreateWorkoutBody {
  return {
    name: w.name,
    ...(w.notes ? { notes: w.notes } : {}),
    exercises: w.exercises.map((e, i) => ({
      position: i + 1,
      wger_exercise_id: e.wger_exercise_id,
      name_snapshot: e.name,
      sets: e.sets,
      reps: e.reps,
      rest_seconds: e.rest_seconds,
      ...(e.notes ? { notes: e.notes } : {}),
      muscle_group: e.muscle_group,
    })),
  };
}
