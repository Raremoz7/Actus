// Variante WEB do Sentry: no-op. Observabilidade web (via @sentry/react) fica
// para fase posterior; aqui só mantemos o contrato (initSentry + Sentry.wrap).
export function initSentry(): void {
  // no-op na web por enquanto
}

export const Sentry = {
  wrap<T>(component: T): T {
    return component;
  },
  captureException(_e: unknown): void {},
  captureMessage(_m: string): void {},
  setUser(_u: unknown): void {},
};
