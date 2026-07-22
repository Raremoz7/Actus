import { wgerCatalog } from './catalog';

describe('catálogo empacotado', () => {
  it('carrega e busca exercícios reais', () => {
    const cat = wgerCatalog();
    expect(cat.search('press').length).toBeGreaterThan(0);
  });
});
