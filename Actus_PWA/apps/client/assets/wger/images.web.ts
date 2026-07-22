// Variante WEB do mapa de imagens wger. Em vez de require() (metro), usa
// import.meta.glob do Vite para resolver cada .webp em uma URL, montando o mesmo
// Record<number, ImageSourcePropType> que o consumidor (lib/wger/media.ts) espera.
import type { ImageSourcePropType } from 'react-native';

const modules = import.meta.glob('./images/*.webp', {
  eager: true,
  query: '?url',
  import: 'default',
}) as Record<string, string>;

export const WGER_IMAGES: Record<number, ImageSourcePropType> = {};

for (const [path, url] of Object.entries(modules)) {
  const match = path.match(/(\d+)\.webp$/);
  if (match) {
    WGER_IMAGES[Number(match[1])] = { uri: url } as ImageSourcePropType;
  }
}
