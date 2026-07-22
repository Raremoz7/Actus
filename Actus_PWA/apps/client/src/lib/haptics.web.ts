// Variante WEB do haptics: mesma API/enums; usa a Vibration API quando existe,
// senão no-op. Best-effort — nunca lança.
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

function vibrate(pattern: number | number[]): void {
  try {
    (navigator as Navigator & { vibrate?: (p: number | number[]) => boolean }).vibrate?.(pattern);
  } catch {
    // sem suporte — segue sem vibração
  }
}

export function selectionAsync(): Promise<void> {
  vibrate(8);
  return Promise.resolve();
}

export function impactAsync(style: ImpactFeedbackStyle = ImpactFeedbackStyle.Medium): Promise<void> {
  vibrate(style === ImpactFeedbackStyle.Heavy ? 20 : style === ImpactFeedbackStyle.Light ? 6 : 12);
  return Promise.resolve();
}

export function notificationAsync(
  _type: NotificationFeedbackType = NotificationFeedbackType.Success,
): Promise<void> {
  vibrate([8, 40, 8]);
  return Promise.resolve();
}
