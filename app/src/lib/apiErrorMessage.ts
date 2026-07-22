import { isApiError } from '@/api/errors';

// Mapa de códigos de erro da API → mensagens pt-BR (tom quiet luxury: curto, sem alarde).
// O código vem SEMPRE do campo "error" do body (ApiError.code), nunca do HTTP status.
// Fonte única para todo o app — features/auth/errors.ts reusa este mapa.
const ERROR_MESSAGES: Record<string, string> = {
  // Auth / conta
  invalid_credentials: 'E-mail ou senha não conferem.',
  invalid_invite: 'Convite não encontrado.',
  invite_expired: 'Convite expirado.',
  invite_exhausted: 'Convite já utilizado.',
  invalid_invite_professional: 'Convite inválido.',
  email_already_in_use: 'Este e-mail já tem conta.',
  cpf_already_in_use: 'Este CPF já tem conta.',

  // Sessão de treino
  session_not_found: 'Sessão não encontrada.',
  workout_session_not_found: 'Sessão não encontrada.',
  session_not_editable: 'Essa sessão não pode mais ser editada.',
  session_not_startable: 'Essa sessão não pode ser iniciada agora.',
  session_not_finishable: 'Essa sessão não pode ser finalizada agora.',
  session_exercises_incomplete: 'Ainda há exercícios pendentes nessa sessão.',
  invalid_session_transition: 'Essa ação não é permitida no estado atual da sessão.',
  duplicate_set_index: 'Essa série já foi registrada.',

  // Treino / dieta
  workout_not_found: 'Treino não encontrado.',
  diet_template_not_found: 'Dieta não encontrada.',
  student_workout_not_found: 'Atribuição de treino não encontrada.',
  student_workout_inactive: 'Esse treino não está mais ativo.',
  student_diet_not_found: 'Atribuição de dieta não encontrada.',

  // Convite / desafio
  invite_not_found: 'Convite não encontrado.',
  invite_limit_reached: 'Limite de convites atingido.',
  student_not_linked: 'Aluno não está vinculado a você.',
  challenge_ended: 'Esse desafio já terminou.',
  not_invited: 'Você não foi convidado para esse desafio.',
  forbidden_not_participant: 'Você não participa desse desafio.',
  forbidden_not_student: 'Essa ação é só para alunos.',
  forbidden_not_personal: 'Essa ação é só para personal trainers.',

  // Genéricos
  invalid_body: 'Alguns dados não são válidos. Confira e tente de novo.',
  not_found: 'Não encontramos o que você procurava.',
  forbidden: 'Você não tem permissão para essa ação.',
  internal_error: 'Algo deu errado do nosso lado. Tente de novo em instantes.',
  network_error: 'Sem conexão com o servidor.',
};

const FALLBACK_MESSAGE = 'Algo não saiu como esperado. Tente de novo.';

// Traduz um código de erro (ApiError.code) para mensagem amigável em pt-BR.
// `overrides` permite uma tela dar uma frase própria pra um código específico
// (ex.: usar-convite.tsx com already_has_active_professional_for_role) sem
// precisar de um switch manual.
export function messageForErrorCode(
  code: string,
  overrides?: Partial<Record<string, string>>,
): string {
  return overrides?.[code] ?? ERROR_MESSAGES[code] ?? FALLBACK_MESSAGE;
}

// Traduz um ApiError (ou erro desconhecido) para mensagem amigável em pt-BR.
export function apiErrorMessage(
  err: unknown,
  overrides?: Partial<Record<string, string>>,
): string {
  if (!isApiError(err)) return FALLBACK_MESSAGE;
  return messageForErrorCode(err.code, overrides);
}

export { ERROR_MESSAGES as API_ERROR_MESSAGES, FALLBACK_MESSAGE as API_FALLBACK_MESSAGE };
