import { createCatalog, exerciseName, exerciseDescription } from './catalog';
import type { WgerExercise } from './types';

const EX: WgerExercise[] = [
  { id: 1, name_pt: 'Supino reto', name_en: 'Bench Press', category: 'Peito', equipment: ['Barra'], muscles: [], description_pt: 'Empurre a barra.', description_en: 'Press the bar.', hasImage: true, hasVideo: false },
  { id: 2, name_pt: null, name_en: 'Incline Press', category: 'Peito', equipment: ['Halter'], muscles: [], description_pt: null, description_en: 'Incline.', hasImage: false, hasVideo: false },
  { id: 3, name_pt: 'Agachamento', name_en: 'Squat', category: 'Pernas', equipment: [], muscles: [], description_pt: null, description_en: null, hasImage: false, hasVideo: false },
];

describe('createCatalog', () => {
  const cat = createCatalog(EX);

  it('acha por nome PT ignorando acento/caixa', () => {
    const r = cat.search('supino');
    expect(r[0]!.id).toBe(1);
  });

  it('faz fallback do nome PT para EN na busca', () => {
    const r = cat.search('incline');
    expect(r.map((e) => e.id)).toContain(2);
  });

  it('prioriza prefixo sobre substring', () => {
    const r = cat.search('agach');
    expect(r[0]!.id).toBe(3);
  });

  it('respeita o limite', () => {
    expect(cat.search('e', 1).length).toBe(1);
  });

  it('getExercise por id', () => {
    expect(cat.getExercise(2)!.name_en).toBe('Incline Press');
    expect(cat.getExercise(999)).toBeNull();
  });
});

describe('resolvers de idioma', () => {
  it('exerciseName: PT quando existe, senão EN', () => {
    expect(exerciseName(EX[0]!)).toBe('Supino reto');
    expect(exerciseName(EX[1]!)).toBe('Incline Press');
  });
  it('exerciseDescription: PT, senão EN, senão null', () => {
    expect(exerciseDescription(EX[0]!)).toBe('Empurre a barra.');
    expect(exerciseDescription(EX[1]!)).toBe('Incline.');
    expect(exerciseDescription(EX[2]!)).toBeNull();
  });
});
