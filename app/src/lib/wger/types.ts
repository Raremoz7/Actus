import { z } from 'zod';

// Um exercício do snapshot do Wger. `id` = id da "exercise base" (chave das imagens
// e do wger_exercise_id enviado ao backend). name/description podem faltar num idioma.
export const WgerExerciseSchema = z.object({
  id: z.number().int().positive(),
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
