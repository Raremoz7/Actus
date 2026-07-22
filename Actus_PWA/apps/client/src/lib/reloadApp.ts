// Reload do app (nativo). Usado pelo switcher de área do bypass de dev.
import { DevSettings } from 'react-native';

export function reloadApp(): void {
  DevSettings.reload();
}
