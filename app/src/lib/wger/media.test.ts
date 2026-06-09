jest.mock('../../../assets/wger/images', () => ({ WGER_IMAGES: { 101: { uri: 'mock-101' } } }), { virtual: true });
import { wgerImageSource } from './media';

describe('wgerImageSource', () => {
  it('devolve a source quando há imagem', () => {
    expect(wgerImageSource(101)).toEqual({ uri: 'mock-101' });
  });
  it('devolve null quando não há imagem', () => {
    expect(wgerImageSource(999)).toBeNull();
  });
  it('null para id indefinido', () => {
    expect(wgerImageSource(null)).toBeNull();
  });
});
