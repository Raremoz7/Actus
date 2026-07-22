import { z } from 'zod';

// Códigos de erro reais do backend (campo "error" do body, NUNCA no HTTP status).
// REGRA MESTRE: a branch de tratamento decide sempre por este código, não pelo status.
export const API_ERROR_CODES = [
  'invalid_body',
  'invalid_invite',
  'invite_expired',
  'invite_exhausted',
  'invalid_invite_professional',
  'email_already_in_use',
  'cpf_already_in_use',
  'invalid_credentials',
  'invalid_refresh_token',
  'invalid_token',
  'missing_authorization',
  'must_change_password',
  'profile_not_found',
  'user_basic_info_not_found',
  'only_student_can_consume',
  'already_has_active_professional_for_role',
  'internal_error',
  'invalid_query',
  'invalid_params',
  'workout_session_not_found',
  'session_not_found',
  'session_not_editable',
  'session_not_startable',
  'session_not_finishable',
  'session_exercises_incomplete',
  'invalid_session_transition',
  'duplicate_set_index',
  'student_workout_not_found',
  'student_workout_inactive',
  'student_diet_not_found',
  'migration_required',
  'not_professional',
  'only_personal',
  'only_nutritionist',
  'workout_not_found',
  'diet_template_not_found',
  'invite_not_found',
  'invite_limit_reached',
  'student_not_linked',
  'not_found',
  'challenge_ended',
  'not_invited',
  'ranking_private',
  'forbidden_not_participant',
  'forbidden_not_student',
  'forbidden_not_personal',
  'invalid_challenge_id',
  'invalid_response_shape',
  'network_error',
] as const;

export type ApiErrorCode = (typeof API_ERROR_CODES)[number];

// Body de erro: o backend sempre devolve { error: string } e pode incluir campos extras.
// passthrough() preserva os extras (ex.: detalhes de validação) para o ApiError.
export const ApiErrorBodySchema = z.object({ error: z.string() }).passthrough();

export type ApiErrorBody = z.infer<typeof ApiErrorBodySchema>;
