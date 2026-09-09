/**
 * Cross-platform alert utility for React Native + Web
 * On native: delegates to Alert.alert
 * On web: uses window.alert / window.confirm
 */

import { Alert, Platform } from 'react-native';

export const showAlert = (title, message, buttons) => {
  if (Platform.OS !== 'web') {
    Alert.alert(title, message, buttons);
    return;
  }
  const text = message ? title + '\n\n' + message : title;
  if (!buttons || buttons.length === 0) {
    window.alert(text);
    return;
  }
  const nonCancelButtons = buttons.filter((b) => b.style !== 'cancel');
  const cancelButton = buttons.find((b) => b.style === 'cancel');
  if (nonCancelButtons.length === 1 && cancelButton) {
    const confirmed = window.confirm(text);
    if (confirmed) { nonCancelButtons[0]?.onPress?.(); }
    else { cancelButton?.onPress?.(); }
    return;
  }
  window.alert(text);
  const primary = nonCancelButtons.find((b) => b.style !== 'destructive') || nonCancelButtons[0];
  primary?.onPress?.();
};

export const showConfirm = (title, message) => {
  return new Promise((resolve) => {
    if (Platform.OS !== 'web') {
      Alert.alert(title, message, [
        { text: 'Cancel', style: 'cancel', onPress: () => resolve(false) },
        { text: 'Confirm', onPress: () => resolve(true) },
      ]);
    } else {
      const text = message ? title + '\n\n' + message : title;
      const result = window.confirm(text);
      resolve(result);
    }
  });
};

export default showAlert;
