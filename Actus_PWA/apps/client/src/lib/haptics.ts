// Haptics sobre react-native-haptic-feedback com a MESMA assinatura do
// expo-haptics (selectionAsync/impactAsync/notificationAsync + enums) —
// os consumidores trocam apenas o import. Tudo best-effort: falha vira no-op.
import { trigger } from 'react-native-haptic-feedback';

export enum ImpactFeedbackStyle {
  Light = 'impactLight',
  Medium = 'impactMedium',
  Heavy = 'impactHeavy',
}

export enum NotificationFeedbackType {
  Success = 'notificationSuccess',
  Warning = 'notificationWarning',
  Error = 'notificationError',
}

function fire(type: string): Promise<void> {
  try {
    trigger(type as Parameters<typeof trigger>[0]);
  } catch {
    // dispositivo/dev build sem o módulo nativo — segue sem vibração.
  }
  return Promise.resolve();
}

export function selectionAsync(): Promise<void> {
  return fire('selection');
}

export function impactAsync(style: ImpactFeedbackStyle = ImpactFeedbackStyle.Medium): Promise<void> {
  return fire(style);
}

export function notificationAsync(
  type: NotificationFeedbackType = NotificationFeedbackType.Success,
): Promise<void> {
  return fire(type);
}
