import { z } from 'zod';

// GET /health → liveness do backend.
export const HealthSchema = z.object({ ok: z.literal(true) });

export type Health = z.infer<typeof HealthSchema>;
