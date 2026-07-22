import { z } from 'zod';

export const ExerciseSchema = z.object({
  id: z.string(),
  name_pt: z.string(),
  name_en: z.string(),
  category: z.string().nullable(),
  equipment: z.string().nullable(),
  level: z.string().nullable(),
  mechanic: z.string().nullable(),
  force: z.string().nullable(),
  primary_muscles: z.array(z.string()),
  secondary_muscles: z.array(z.string()),
  image_0_url: z.string().nullable(),
  image_1_url: z.string().nullable(),
  machine_type: z.string().nullable().optional(),
});

export type Exercise = z.infer<typeof ExerciseSchema>;

export const ExerciseCatalogSchema = z.array(ExerciseSchema);
