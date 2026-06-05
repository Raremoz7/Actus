import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';

// Chaves SEPARADAS no SecureStore — access e refresh nunca compartilham slot.
const ACCESS_KEY = 'actus.access_token';
const REFRESH_KEY = 'actus.refresh_token';

// expo-secure-store é um stub vazio no web (export default {}), então qualquer
// chamada quebra no navegador. Para iterar UI no web durante o dev usamos
// localStorage como fallback. NÃO é armazenamento seguro — apenas dev/web.
const isWeb = Platform.OS === 'web';

async function getItem(key: string): Promise<string | null> {
  if (isWeb) return globalThis.localStorage?.getItem(key) ?? null;
  return SecureStore.getItemAsync(key);
}

async function setItem(key: string, value: string): Promise<void> {
  if (isWeb) {
    globalThis.localStorage?.setItem(key, value);
    return;
  }
  await SecureStore.setItemAsync(key, value);
}

async function removeItem(key: string): Promise<void> {
  if (isWeb) {
    globalThis.localStorage?.removeItem(key);
    return;
  }
  await SecureStore.deleteItemAsync(key);
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
