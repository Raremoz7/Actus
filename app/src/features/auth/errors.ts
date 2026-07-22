import { messageForErrorCode } from '@/lib/apiErrorMessage';

// Traduz um código de erro de auth para mensagem amigável; cai no fallback se desconhecido.
// Alias fino sobre a central (src/lib/apiErrorMessage.ts) — mantém a assinatura
// (code: string) => string que login.tsx/contaForm.ts já usam.
export function authErrorMessage(code: string): string {
  return messageForErrorCode(code);
}
