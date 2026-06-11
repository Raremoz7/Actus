import { z } from 'zod';

// Shape REAL de web/public/wger/catalog.json (gerado de https://wger.de — ver app/assets/wger/ATTRIBUTION.md)
export const WgerExerciseSchema = z.object({
  id: z.number(),
  name_pt: z.string().nullable(),
  name_en: z.string().nullable(),
  category: z.string(),
  equipment: z.array(z.string()),
  muscles: z.array(z.string()),
  description_pt: z.string().nullable(),
  description_en: z.string().nullable(),
  hasImage: z.boolean(),
  hasVideo: z.boolean(),
});
export type WgerExercise = z.infer<typeof WgerExerciseSchema>;

export const WgerCatalogSchema = z.object({
  generated_at: z.string(),
  source: z.string(),
  exercises: z.array(WgerExerciseSchema),
});
export type WgerCatalog = z.infer<typeof WgerCatalogSchema>;

/** Nome de exibição: português quando existe, inglês como fallback. */
export function wgerName(ex: WgerExercise): string {
  return ex.name_pt ?? ex.name_en ?? `Exercício ${ex.id}`;
}

/** URL local da imagem (web/public/wger/images/<id>.webp) ou null quando não há. */
export function wgerImageUrl(ex: WgerExercise): string | null {
  return ex.hasImage ? `/wger/images/${ex.id}.webp` : null;
}

function normalize(s: string): string {
  return s
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

/** Busca case/acento-insensível em name_pt e name_en, com filtro opcional de categoria. */
export function searchExercises(
  exercises: WgerExercise[],
  term: string,
  category?: string,
): WgerExercise[] {
  const q = normalize(term.trim());
  return exercises.filter((ex) => {
    if (category && ex.category !== category) return false;
    if (q === '') return true;
    return (
      (ex.name_pt !== null && normalize(ex.name_pt).includes(q)) ||
      (ex.name_en !== null && normalize(ex.name_en).includes(q))
    );
  });
}
