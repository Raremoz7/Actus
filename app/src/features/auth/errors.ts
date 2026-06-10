// Mapa de códigos de erro da API → mensagens pt-BR (tom quiet luxury: curto, sem alarde).
// O código vem SEMPRE do campo "error" do body (ApiError.code), nunca do HTTP status.
const AUTH_ERROR_MESSAGES: Record<string, string> = {
  invalid_credentials: 'E-mail ou senha não conferem.',
  invalid_invite: 'Convite não encontrado.',
  invite_expired: 'Convite expirado.',
  invite_exhausted: 'Convite já utilizado.',
  invalid_invite_professional: 'Convite inválido.',
  email_already_in_use: 'Este e-mail já tem conta.',
  cpf_already_in_use: 'Este CPF já tem conta.',
  network_error: 'Sem conexão com o servidor.',
};

const FALLBACK_MESSAGE = 'Algo não saiu como esperado. Tente de novo.';

// Traduz um código de erro de auth para mensagem amigável; cai no fallback se desconhecido.
export function authErrorMessage(code: string): string {
  return AUTH_ERROR_MESSAGES[code] ?? FALLBACK_MESSAGE;
}
