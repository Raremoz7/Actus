import { WgerCatalogSchema } from './types';
import sample from './__fixtures__/catalog.sample.json';

describe('WgerCatalogSchema', () => {
  it('valida o fixture de catálogo', () => {
    const parsed = WgerCatalogSchema.parse(sample);
    expect(parsed.exercises.length).toBeGreaterThan(0);
    expect(parsed.exercises[0]!.id).toBeGreaterThan(0);
  });

  it('rejeita exercício sem id', () => {
    expect(() =>
      WgerCatalogSchema.parse({ generated_at: 'x', source: 'wger', exercises: [{ name_en: 'x' }] }),
    ).toThrow();
  });
});
