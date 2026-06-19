import { Platform, Alert } from 'react-native';

/**
 * Confirmation cross-plateforme.
 * Sur le web, `Alert.alert` (react-native-web) ne gère pas les boutons →
 * on utilise `window.confirm`. Sur natif, on garde `Alert.alert`.
 */
export function confirmAction(
  title: string,
  message: string,
  onConfirm: () => void,
  options?: { confirmLabel?: string; cancelLabel?: string },
) {
  const confirmLabel = options?.confirmLabel ?? 'OK';
  const cancelLabel = options?.cancelLabel ?? 'Annuler';

  if (Platform.OS === 'web') {
    if (typeof window !== 'undefined' && window.confirm(message ? `${title}\n\n${message}` : title)) {
      onConfirm();
    }
    return;
  }
  Alert.alert(title, message, [
    { text: cancelLabel, style: 'cancel' },
    { text: confirmLabel, style: 'destructive', onPress: onConfirm },
  ]);
}

/** Message d'information simple, cross-plateforme. */
export function notify(title: string, message = '') {
  if (Platform.OS === 'web') {
    if (typeof window !== 'undefined') window.alert(message ? `${title}\n\n${message}` : title);
    return;
  }
  Alert.alert(title, message);
}
