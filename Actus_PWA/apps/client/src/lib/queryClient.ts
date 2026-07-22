import { QueryClient } from '@tanstack/react-query';
import { isApiError } from '@/api/errors';

// Não faz sentido retentar erros 4xx (cliente): a resposta não muda ao repetir.
function shouldRetry(failureCount: number, error: unknown): boolean {
  if (isApiError(error)) {
    const status = error.httpStatus;
    if (status !== null && status >= 400 && status < 500) return false;
  }
  // Demais erros (rede/5xx): até 2 tentativas.
  return failureCount < 2;
}

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: shouldRetry,
      staleTime: 30_000,
    },
    mutations: {
      retry: false,
    },
  },
});
