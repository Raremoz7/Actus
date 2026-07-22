import * as Sentry from '@sentry/react-native';
import type { ErrorEvent } from '@sentry/react-native';
// Contexts/EventHint não são re-exportados pelo pacote RN; vêm do core (dep transitiva resolvível).
import type { Contexts, EventHint } from '@sentry/core';

// Campos sensíveis que NUNCA podem sair do dispositivo. Comparação sempre em lowercase.
const PII_KEYS = ['email', 'cpf', 'phone', 'full_name', 'password'] as const;
const PII_KEY_SET = new Set<string>(PII_KEYS);
const REDACTED = '[redacted]';

// Remove recursivamente qualquer chave de PII de um objeto desconhecido.
// Retorna uma cópia rasa por nível para não mutar o evento original do Sentry.
function scrubDeep(value: unknown, depth = 0): unknown {
  // Trava de profundidade contra ciclos/estruturas patológicas.
  if (depth > 6 || value === null || typeof value !== 'object') return value;

  if (Array.isArray(value)) {
    return value.map((item) => scrubDeep(item, depth + 1));
  }

  const source = value as Record<string, unknown>;
  const result: Record<string, unknown> = {};
  for (const key of Object.keys(source)) {
    if (PII_KEY_SET.has(key.toLowerCase())) {
      result[key] = REDACTED;
      continue;
    }
    result[key] = scrubDeep(source[key], depth + 1);
  }
  return result;
}

// Remove o header Authorization (qualquer capitalização) de um dicionário de headers.
function scrubHeaders(headers: Record<string, string>): Record<string, string> {
  const result: Record<string, string> = {};
  for (const key of Object.keys(headers)) {
    if (key.toLowerCase() === 'authorization') {
      result[key] = REDACTED;
      continue;
    }
    result[key] = headers[key] ?? '';
  }
  return result;
}

// beforeSend: higieniza request (headers + data), contexts, extra e user antes do envio.
function scrubPii(event: ErrorEvent, _hint: EventHint): ErrorEvent {
  if (event.request) {
    const { headers, data, ...restRequest } = event.request;
    event.request = {
      ...restRequest,
      ...(headers ? { headers: scrubHeaders(headers) } : {}),
      ...(data !== undefined ? { data: scrubDeep(data) } : {}),
    };
  }

  if (event.contexts) {
    // scrubDeep preserva a forma de Contexts (Record<string, Context | undefined>).
    event.contexts = scrubDeep(event.contexts) as Contexts;
  }

  if (event.extra) {
    event.extra = scrubDeep(event.extra) as Record<string, unknown>;
  }

  if (event.user) {
    // user tem campos tipados (email etc.); scrubDeep cobre todos via chave.
    event.user = scrubDeep(event.user) as ErrorEvent['user'];
  }

  return event;
}

// Inicializa o Sentry. Desligado em DEV e quando não há DSN configurado.
export function initSentry(): void {
  const dsn = process.env.EXPO_PUBLIC_SENTRY_DSN;
  Sentry.init({
    dsn,
    enabled: !__DEV__ && !!dsn,
    sendDefaultPii: false,
    tracesSampleRate: 0.1,
    beforeSend: scrubPii,
  });
}

export { Sentry };
