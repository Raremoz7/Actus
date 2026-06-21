import { z } from 'zod';

// Shape REAL de web/public/exercises/catalog.json (snapshot estático do catálogo PT-BR,
// mesma fonte do app — app/assets/exercises/catalog.json). Imagens locais em /exercises/<id>_N.jpg.
export const ExerciseSchema = z.object({
  id: z.string(),
  name_pt: z.string(),
  name_en: z.string(),
  category: z.string().nullable(),
  equipment: z.string().nullable(),
  level: z.string().nullable(),
  mechanic: z.string().nullable(),
  force: z.string().nullable(),
  primary_muscles: z.array(z.string()),
  secondary_muscles: z.array(z.string()),
  image_0_url: z.string().nullable(),
  image_1_url: z.string().nullable(),
  machine_type: z.string().nullable(),
});
export type Exercise = z.infer<typeof ExerciseSchema>;

export const ExerciseCatalogSchema = z.array(ExerciseSchema);

export type ExerciseListResponse = {
  total: number;
  exercises: Exercise[];
};

// ── Rótulos PT-BR ──────────────────────────────────────────────────────────

const CATEGORY_PT: Record<string, string> = {
  strength:                 'Força',
  cardio:                   'Cardio',
  stretching:               'Alongamento',
  plyometrics:              'Pliometria',
  powerlifting:             'Powerlifting',
  'olympic weightlifting':  'Levantamento Olímpico',
  strongman:                'Strongman',
};

const EQUIPMENT_PT: Record<string, string> = {
  'body only':     'Peso do Corpo',
  barbell:         'Barra',
  dumbbell:        'Halteres',
  cable:           'Cabo',
  machine:         'Máquina',
  bands:           'Faixas Elásticas',
  kettlebells:     'Kettlebell',
  'e-z curl bar':  'Barra W',
  'exercise ball': 'Bola de Ginástica',
  'medicine ball': 'Bola Medicinal',
  'foam roll':     'Rolo de Espuma',
  other:           'Outro',
};

const MUSCLE_PT: Record<string, string> = {
  abdominals:    'Abdômen',
  abductors:     'Abdutores',
  adductors:     'Adutores',
  biceps:        'Bíceps',
  calves:        'Panturrilhas',
  chest:         'Peito',
  forearms:      'Antebraços',
  glutes:        'Glúteos',
  hamstrings:    'Isquiotibiais',
  lats:          'Dorsais',
  'lower back':  'Lombar',
  'middle back': 'Meio das Costas',
  'upper back':  'Costas Superiores',
  neck:          'Pescoço',
  quadriceps:    'Quadríceps',
  shoulders:     'Ombros',
  traps:         'Trapézio',
  triceps:       'Tríceps',
};

const LEVEL_PT: Record<string, string> = {
  beginner:     'Iniciante',
  intermediate: 'Intermediário',
  expert:       'Avançado',
};

export const CATEGORIES = Object.keys(CATEGORY_PT);
export const EQUIPMENTS = Object.keys(EQUIPMENT_PT);
export const MUSCLES    = Object.keys(MUSCLE_PT);
export const LEVELS     = Object.keys(LEVEL_PT);

export const MACHINE_TYPES = [
  'Smith Machine',
  'Leg Press',
  'Hack Squat',
  'Mesa Flexora',
  'Extensora',
  'Leverage',
  'Bicicleta Ergométrica',
  'Peck Deck',
  'Panturrilha (Máquina)',
  'Esteira',
  'Remo Ergométrico',
  'Elíptico',
  'Stairmaster',
  'Escada Rolante',
  'Máquina de Abdominal',
  'Supino (Máquina)',
  'Rosca (Máquina)',
  'Tríceps (Máquina)',
  'Press Ombro (Máquina)',
  'Dip (Máquina)',
  'Remada T-Bar',
  'Glúteo e Isquiotibial (GHR)',
  'Extensão Lombar (Máquina)',
  'Agachamento (Máquina)',
] as const;

export function categoryLabel(key: string | null): string {
  if (!key) return '';
  return CATEGORY_PT[key] ?? key;
}
export function equipmentLabel(key: string | null): string {
  if (!key) return '';
  return EQUIPMENT_PT[key] ?? key;
}
export function muscleLabel(key: string): string {
  return MUSCLE_PT[key] ?? key;
}
export function levelLabel(key: string | null): string {
  if (!key) return '';
  return LEVEL_PT[key] ?? key;
}

export function exerciseMuscleGroup(ex: Exercise): string {
  const m = ex.primary_muscles[0];
  return m ? (MUSCLE_PT[m] ?? m) : (categoryLabel(ex.category) || '');
}
