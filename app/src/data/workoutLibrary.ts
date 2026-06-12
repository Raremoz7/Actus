// src/data/workoutLibrary.ts
// [SEED — conteúdo-semente do futuro GET /workouts/library]
// Curadoria editorial: os PROGRAMAS (seleção + séries/reps) são autorais; os EXERCÍCIOS
// são reais do catálogo free-exercise-db (Unlicense) com nomes PT-BR do joao-gugel.
import { exerciseCatalog, exerciseMuscleGroup } from '@/lib/exercises/catalog';
import {
  LibraryWorkoutSchema,
  type LibraryWorkout,
  type LibraryExercise,
  type Objetivo,
  type Nivel,
} from '@/types/workoutLibrary';
import type { CreateWorkoutBody } from '@/types/workouts';

type SeedExercise = {
  exerciseId: string;
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
  exerciseId: string,
  sets: number,
  reps: number,
  restSeconds: number,
  notes?: string,
): SeedExercise => ({
  exerciseId,
  sets,
  reps,
  restSeconds,
  ...(notes ? { notes } : {}),
});

// 8 programas curados. Os ids são exercícios do catálogo free-exercise-db.
const SEED: Seed[] = [
  {
    id: 'hipertrofia-superior-push',
    name: 'Peito, Ombro e Tríceps',
    objetivo: 'hipertrofia',
    nivel: 'intermediario',
    notes: 'Treino de empurrar focado em volume para superiores.',
    exercises: [
      ex('Barbell_Bench_Press_-_Medium_Grip',         4, 10, 90),
      ex('Dumbbell_Shoulder_Press',                   3, 10, 90),
      ex('Barbell_Incline_Bench_Press_-_Medium_Grip', 3, 12, 60),
      ex('Cable_Seated_Lateral_Raise',                3, 15, 45),
      ex('Triceps_Pushdown',                          3, 12, 60),
      ex('EZ-Bar_Skullcrusher',                       3, 12, 60),
    ],
  },
  {
    id: 'hipertrofia-costas-biceps',
    name: 'Costas e Bíceps',
    objetivo: 'hipertrofia',
    nivel: 'intermediario',
    notes: 'Treino de puxar com ênfase em dorsais e bíceps.',
    exercises: [
      ex('Wide-Grip_Rear_Pull-Up',  4, 10, 90),
      ex('Bent_Over_Barbell_Row',   3, 10, 90),
      ex('Seated_Cable_Rows',       3, 10, 75),
      ex('Face_Pull',               3, 15, 45),
      ex('Barbell_Curl',            3, 12, 60),
      ex('Hammer_Curls',            3, 12, 60),
    ],
  },
  {
    id: 'hipertrofia-pernas',
    name: 'Pernas completo',
    objetivo: 'hipertrofia',
    nivel: 'intermediario',
    notes: 'Quadríceps, posterior e panturrilha num só treino.',
    exercises: [
      ex('Barbell_Full_Squat',   4,  8, 120),
      ex('Leg_Press',            4, 12,  90),
      ex('Romanian_Deadlift',    3, 10,  90),
      ex('Barbell_Lunge',        3, 12,  60),
      ex('Lying_Leg_Curls',      3, 15,  60),
      ex('Standing_Calf_Raises', 4, 15,  45),
    ],
  },
  {
    id: 'forca-full-body-5x5',
    name: 'Força full body 5×5',
    objetivo: 'forca',
    nivel: 'avancado',
    notes: 'Básicos pesados, 5 séries de 5 com descanso longo.',
    exercises: [
      ex('Barbell_Deadlift',             5, 5, 180),
      ex('Barbell_Bench_Press_-_Medium_Grip', 5, 5, 180),
      ex('Barbell_Squat',                5, 5, 180),
      ex('Barbell_Shoulder_Press',       3, 6, 150),
      ex('Bent_Over_Barbell_Row',        3, 6, 150),
    ],
  },
  {
    id: 'emagrecimento-circuito',
    name: 'Circuito queima',
    objetivo: 'emagrecimento',
    nivel: 'iniciante',
    notes: 'Circuito full body, descanso curto, ritmo contínuo.',
    exercises: [
      ex('Push-Up_Wide',          3, 15, 45),
      ex('Bodyweight_Squat',      3, 12, 45),
      ex('Rope_Jumping',          3,  1, 45, '1 minuto'),
      ex('Barbell_Walking_Lunge', 3, 12, 45),
      ex('Mountain_Climbers',     3, 20, 45),
      ex('Plank',                 3,  1, 45, 'Segure 30s'),
    ],
  },
  {
    id: 'resistencia-core',
    name: 'Core e estabilidade',
    objetivo: 'resistencia',
    nivel: 'intermediario',
    notes: 'Resistência de core e cadeia posterior.',
    exercises: [
      ex('Plank',                          3,  1, 45, 'Segure 40s'),
      ex('Crunch_-_Hands_Overhead',        3, 20, 45),
      ex('Hyperextensions_Back_Extensions',3, 15, 45),
      ex('Russian_Twist',                  3, 15, 60),
      ex('Cable_Crunch',                   3, 15, 60),
    ],
  },
  {
    id: 'mobilidade-recuperacao',
    name: 'Mobilidade e recuperação',
    objetivo: 'mobilidade',
    nivel: 'iniciante',
    notes: 'Sessão leve de mobilidade e liberação.',
    exercises: [
      ex('Cat_Stretch',               2, 12, 30),
      ex('Kneeling_Hip_Flexor',       2,  1, 30, '1 min cada lado'),
      ex('Seated_Hamstring',          2,  1, 20, '30s cada lado'),
      ex('IT_Band_and_Glute_Stretch', 2,  1, 20, '30s cada lado'),
      ex('Childs_Pose',               2,  1, 45, '1 min'),
    ],
  },
  {
    id: 'full-body-iniciante-maquinas',
    name: 'Full body iniciante (máquinas)',
    objetivo: 'hipertrofia',
    nivel: 'iniciante',
    notes: 'Primeira rotina em máquinas guiadas, corpo inteiro.',
    exercises: [
      ex('Leverage_Chest_Press',          3, 12, 60),
      ex('Close-Grip_Front_Lat_Pulldown', 3, 12, 60),
      ex('Leg_Press',                     3, 12, 60),
      ex('Lying_Leg_Curls',               3, 12, 60),
      ex('Machine_Shoulder_Military_Press',3, 12, 60),
      ex('Seated_Cable_Rows',             3, 12, 60),
    ],
  },
];

// Resolve um seed → LibraryWorkout. Exercício cujo id não existe no catálogo
// é descartado (warn em dev) — não quebra o programa.
function resolveSeed(seed: Seed): LibraryWorkout {
  const catalog = exerciseCatalog();
  const resolved: LibraryExercise[] = [];
  for (const s of seed.exercises) {
    const found = catalog.getById(s.exerciseId);
    if (!found) {
      if (__DEV__) {
        console.warn(
          `[workoutLibrary] exercício "${s.exerciseId}" ausente no catálogo (seed ${seed.id})`,
        );
      }
      continue;
    }
    resolved.push({
      exercise_id: s.exerciseId,
      name: found.name_pt,
      muscle_group: exerciseMuscleGroup(found),
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
      exercise_id: e.exercise_id,
      name_snapshot: e.name,
      sets: e.sets,
      reps: e.reps,
      rest_seconds: e.rest_seconds,
      ...(e.notes ? { notes: e.notes } : {}),
      muscle_group: e.muscle_group,
    })),
  };
}
