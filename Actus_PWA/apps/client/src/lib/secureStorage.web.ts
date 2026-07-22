// Variante WEB do secureStorage: mesma assinatura, backed por localStorage.
// (Não é "seguro" como o Keychain nativo; para tokens de sessão web é o padrão
// aceitável — migrar para cookie httpOnly é uma evolução futura da camada de auth.)
const PREFIX = 'actus.secure.';

export async function getItemAsync(key: string): Promise<string | null> {
  try {
    return globalThis.localStorage?.getItem(PREFIX + key) ?? null;
  } catch {
    return null;
  }
}

export async function setItemAsync(key: string, value: string): Promise<void> {
  try {
    globalThis.localStorage?.setItem(PREFIX + key, value);
  } catch {
    // storage indisponível (modo privado etc.) — no-op
  }
}

export async function deleteItemAsync(key: string): Promise<void> {
  try {
    globalThis.localStorage?.removeItem(PREFIX + key);
  } catch {
    // no-op
  }
}
