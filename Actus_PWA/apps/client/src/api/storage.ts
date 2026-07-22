import * as SecureStore from '@/lib/secureStorage';

// Chaves SEPARADAS no armazenamento seguro — access e refresh nunca compartilham slot.
const ACCESS_KEY = 'actus.access_token';
const REFRESH_KEY = 'actus.refresh_token';

function getItem(key: string): Promise<string | null> {
  return SecureStore.getItemAsync(key);
}

function setItem(key: string, value: string): Promise<void> {
  return SecureStore.setItemAsync(key, value);
}

function removeItem(key: string): Promise<void> {
  return SecureStore.deleteItemAsync(key);
}

// Persistência segura dos tokens. Os tokens vivem APENAS aqui, nunca no estado da app.
export const tokenStorage = {
  getAccess(): Promise<string | null> {
    return getItem(ACCESS_KEY);
  },

  getRefresh(): Promise<string | null> {
    return getItem(REFRESH_KEY);
  },

  // Grava o par completo (login/register/refresh rotacionado).
  async setTokens(access: string, refresh: string): Promise<void> {
    await Promise.all([setItem(ACCESS_KEY, access), setItem(REFRESH_KEY, refresh)]);
  },

  // change-password: rotaciona só o access, NÃO toca no refresh_token.
  setAccessOnly(access: string): Promise<void> {
    return setItem(ACCESS_KEY, access);
  },

  // Logout / sessão inválida: remove ambas as chaves.
  async clear(): Promise<void> {
    await Promise.all([removeItem(ACCESS_KEY), removeItem(REFRESH_KEY)]);
  },
};
