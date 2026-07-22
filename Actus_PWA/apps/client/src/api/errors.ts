import type { ApiErrorCode } from '@/types/error';

// Opções de construção do ApiError. Tudo opcional — o código de erro é o único obrigatório.
interface ApiErrorOptions {
  httpStatus?: number | null;
  extras?: Record<string, unknown>;
  message?: string;
  cause?: unknown;
}

// Erro normalizado de toda a camada de API.
// REGRA MESTRE: `code` carrega a branch real do backend (campo "error" do body),
// nunca o HTTP status — quem trata decide sempre pelo `code`.
// `code` é tipado como ApiErrorCode | string porque o backend pode introduzir
// códigos novos antes do app conhecê-los; ainda assim sempre tratamos como string.
export class ApiError extends Error {
  readonly code: ApiErrorCode | string;
  readonly httpStatus: number | null;
  readonly extras: Record<string, unknown>;

  constructor(code: ApiErrorCode | string, opts: ApiErrorOptions = {}) {
    super(opts.message ?? code, opts.cause !== undefined ? { cause: opts.cause } : undefined);
    this.name = 'ApiError';
    this.code = code;
    this.httpStatus = opts.httpStatus ?? null;
    this.extras = opts.extras ?? {};

    // Mantém a cadeia de protótipos correta ao estender Error (TS/Babel).
    Object.setPrototypeOf(this, ApiError.prototype);
  }
}

// Type guard para estreitar `unknown` em catch blocks sem usar `any`.
export function isApiError(e: unknown): e is ApiError {
  return e instanceof ApiError;
}
