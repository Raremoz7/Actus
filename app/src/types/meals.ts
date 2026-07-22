import { z } from 'zod';

// Comentário do profissional numa refeição (read-only no mobile).
export const MealCommentSchema = z.object({
  id: z.string(),
  author_id: z.string(),
  author_name: z.string().nullable().optional(),
  body: z.string(),
  created_at: z.string(),
});
export type MealComment = z.infer<typeof MealCommentSchema>;

// Refeição registrada pelo aluno. tags é extensão do contrato (ver pendências backend).
export const MealLogSchema = z.object({
  id: z.string(),
  student_id: z.string(),
  photo_url: z.string().nullable(),
  eaten_at: z.string(), // ISO datetime
  description: z.string().nullable(),
  tags: z.array(z.string()).default([]),
  created_at: z.string(),
  comments: z.array(MealCommentSchema).default([]),
});
export type MealLog = z.infer<typeof MealLogSchema>;

export const MealLogsResponseSchema = z.object({
  meals: z.array(MealLogSchema),
});
export type MealLogsResponse = z.infer<typeof MealLogsResponseSchema>;

// Entrada para criar/editar (o front decide photoUri; o hook monta o multipart).
export interface MealInput {
  photoUri: string | null;
  description: string | null;
  tags: string[];
  eatenAt: string; // ISO datetime
}
