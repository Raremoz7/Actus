import { z } from 'zod';
import { ApiError } from './errors';

// Valida a resposta do backend contra um schema Zod.
// Em caso de shape inesperado, lança ApiError('invalid_response_shape') com as issues
// nos extras — falha alto e cedo, em vez de propagar dados malformados pela app.
export function parseApi<S extends z.ZodTypeAny>(schema: S, data: unknown): z.infer<S> {
  const result = schema.safeParse(data);
  if (!result.success) {
    throw new ApiError('invalid_response_shape', {
      extras: { issues: result.error.issues },
    });
  }
  return result.data;
}
