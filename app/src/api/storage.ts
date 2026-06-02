import * as SecureStore from 'expo-secure-store';

// Chaves SEPARADAS no SecureStore — access e refresh nunca compartilham slot.
const ACCESS_KEY = 'actus.access_token';
const REFRESH_KEY = 'actus.refresh_token';

// Persistência segura dos tokens. Os tokens vivem APENAS aqui, nunca no estado da app.
export const tokenStorage = {
  getAccess(): Promise<string | null> {
    return SecureStore.getItemAsync(ACCESS_KEY);
  },

  getRefresh(): Promise<string | null> {
    return SecureStore.getItemAsync(REFRESH_KEY);
  },

  // Grava o par completo (login/register/refresh rotacionado).
  async setTokens(access: string, refresh: string): Promise<void> {
    await Promise.all([
      SecureStore.setItemAsync(ACCESS_KEY, access),
      SecureStore.setItemAsync(REFRESH_KEY, refresh),
    ]);
  },

  // change-password: rotaciona só o access, NÃO toca no refresh_token.
  setAccessOnly(access: string): Promise<void> {
    return SecureStore.setItemAsync(ACCESS_KEY, access);
  },

  // Logout / sessão inválida: remove ambas as chaves.
  async clear(): Promise<void> {
    await Promise.all([
      SecureStore.deleteItemAsync(ACCESS_KEY),
      SecureStore.deleteItemAsync(REFRESH_KEY),
    ]);
  },
};
