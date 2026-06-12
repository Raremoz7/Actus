export type Exercise = {
  id: string;
  name_pt: string;
  name_en: string;
  category: string | null;
  equipment: string | null;
  level: string | null;
  mechanic: string | null;
  force: string | null;
  primary_muscles: string[];
  secondary_muscles: string[];
  image_0_url: string | null;
  image_1_url: string | null;
};

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
