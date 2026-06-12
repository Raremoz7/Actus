import type { Exercise } from './types';
import { ExerciseCatalogSchema } from './types';
import catalogJson from '../../../assets/exercises/catalog.json';

export const MUSCLE_PT: Record<string, string> = {
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

export const CATEGORY_PT: Record<string, string> = {
  strength:                 'Força',
  cardio:                   'Cardio',
  stretching:               'Alongamento',
  plyometrics:              'Pliometria',
  powerlifting:             'Powerlifting',
  'olympic weightlifting':  'Levantamento Olímpico',
  strongman:                'Strongman',
};

export function musclePt(key: string): string {
  return MUSCLE_PT[key] ?? key;
}

export function exerciseMuscleGroup(ex: Exercise): string {
  const m = ex.primary_muscles[0];
  if (m) return musclePt(m);
  return CATEGORY_PT[ex.category ?? ''] ?? ex.category ?? '';
}

export interface ExerciseCatalog {
  getById: (id: string) => Exercise | null;
  search: (term: string, limit?: number) => Exercise[];
}

function normalize(s: string): string {
  return s
    .toLowerCase()
    .replace(/[áàâãä]/g, 'a')
    .replace(/[éèêë]/g, 'e')
    .replace(/[íìîï]/g, 'i')
    .replace(/[óòôõö]/g, 'o')
    .replace(/[úùûü]/g, 'u')
    .replace(/ç/g, 'c')
    .trim();
}

function createCatalog(exercises: Exercise[]): ExerciseCatalog {
  const byId = new Map<string, Exercise>(exercises.map((e) => [e.id, e]));
  const index = exercises.map((e) => ({
    ex: e,
    hay: normalize(`${e.name_pt} ${e.name_en}`),
  }));

  function getById(id: string): Exercise | null {
    return byId.get(id) ?? null;
  }

  function search(term: string, limit = 30): Exercise[] {
    const q = normalize(term);
    if (q.length === 0) return exercises.slice(0, limit);
    const hits: { ex: Exercise; rank: number }[] = [];
    for (const { ex, hay } of index) {
      const pos = hay.indexOf(q);
      if (pos < 0) continue;
      hits.push({ ex, rank: pos === 0 ? -1 : pos });
    }
    return hits
      .sort((a, b) => a.rank - b.rank)
      .slice(0, limit)
      .map((h) => h.ex);
  }

  return { getById, search };
}

let _catalog: ExerciseCatalog | null = null;

export function exerciseCatalog(): ExerciseCatalog {
  if (_catalog) return _catalog;
  const parsed = ExerciseCatalogSchema.parse(catalogJson);
  _catalog = createCatalog(parsed);
  return _catalog;
}
