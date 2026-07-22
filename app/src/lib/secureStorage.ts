// Armazenamento seguro key-value sobre react-native-keychain, com a MESMA
// assinatura do expo-secure-store (getItemAsync/setItemAsync/deleteItemAsync) —
// os consumidores trocam apenas o import.
// Cada chave vira um "service" próprio no Keychain/Keystore (equivalente ao slot
// por chave do SecureStore).
import * as Keychain from 'react-native-keychain';

export async function getItemAsync(key: string): Promise<string | null> {
  const creds = await Keychain.getGenericPassword({ service: key });
  return creds ? creds.password : null;
}

export async function setItemAsync(key: string, value: string): Promise<void> {
  await Keychain.setGenericPassword(key, value, { service: key });
}

export async function deleteItemAsync(key: string): Promise<void> {
  await Keychain.resetGenericPassword({ service: key });
}
