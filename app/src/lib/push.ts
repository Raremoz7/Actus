import Constants from 'expo-constants';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

// Obtém o Expo push token, pedindo permissão se necessário.
// Defensivo: em simulador / Expo Go o `getExpoPushTokenAsync` pode falhar — nesse caso
// retornamos null e o app segue normalmente (registro de push é best-effort).
export async function getExpoPushToken(): Promise<{ token: string; platform: 'ios' | 'android' } | null> {
  try {
    const settings = await Notifications.getPermissionsAsync();
    let granted = settings.granted;
    if (!granted) {
      granted = (await Notifications.requestPermissionsAsync()).granted;
    }
    if (!granted) return null;

    const projectId =
      Constants.expoConfig?.extra?.eas?.projectId ?? Constants.easConfig?.projectId;
    const { data } = await Notifications.getExpoPushTokenAsync(
      projectId ? { projectId } : undefined,
    );
    return { token: data, platform: Platform.OS === 'ios' ? 'ios' : 'android' };
  } catch {
    return null;
  }
}
