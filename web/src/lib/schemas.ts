import { z } from 'zod';

// Shape REAL de POST /auth/login e POST /auth/refresh (backend/api/src/routes/auth.ts)
export const SessionResponseSchema = z.object({
  access_token: z.string(),
  access_token_expires_in: z.number(),
  refresh_token: z.string(),
});
export type SessionResponse = z.infer<typeof SessionResponseSchema>;

// Shape REAL de GET /me (backend/api/src/routes/me.ts): { id, tipo, display_name }
export const MeSchema = z.object({
  id: z.string(),
  tipo: z.string(),
  display_name: z.string().nullable(),
});
export type Me = z.infer<typeof MeSchema>;

// Payload do access token JWT — roles vêm daqui (não existem no GET /me).
const JwtPayloadSchema = z.object({
  roles: z.array(z.string()).optional(),
  must_change_password: z.boolean().optional(),
});

export function decodeJwtPayload(token: string): z.infer<typeof JwtPayloadSchema> {
  try {
    const base64 = token.split('.')[1]?.replace(/-/g, '+').replace(/_/g, '/');
    if (!base64) return {};
    const json = JSON.parse(atob(base64)) as unknown;
    const parsed = JwtPayloadSchema.safeParse(json);
    return parsed.success ? parsed.data : {};
  } catch {
    return {};
  }
}
