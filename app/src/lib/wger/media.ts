import type { ImageSourcePropType } from 'react-native';
import { WGER_IMAGES } from '../../../assets/wger/images';
import { wgerCatalog } from './catalog';

// Imagem local do exercício pelo wger_exercise_id; null quando não há (→ placeholder por grupo).
export function wgerImageSource(wgerId: number | null | undefined): ImageSourcePropType | null {
  if (wgerId == null) return null;
  return WGER_IMAGES[wgerId] ?? null;
}

// URL de vídeo do Wger (online) quando o exercício tem vídeo; senão null.
export function wgerVideoUrl(wgerId: number | null | undefined): string | null {
  if (wgerId == null) return null;
  const ex = wgerCatalog().getExercise(wgerId);
  if (!ex?.hasVideo) return null;
  return `https://wger.de/en/exercise/${wgerId}/view/`;
}
