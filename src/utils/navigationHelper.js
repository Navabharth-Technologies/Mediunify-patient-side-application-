import { Platform } from 'react-native';
import { CommonActions } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Universal safe navigator that works reliably across both Web and Mobile
 * (React Navigation Stack, Web history, and full page fallback)
 */
export const safeNavigateToMain = async (navigation) => {
  try {
    await AsyncStorage.setItem('isLoggedIn', 'true');
  } catch (e) {}

  if (!navigation) {
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      window.location.href = '/';
    }
    return;
  }

  // 1. Try parent reset (root AppNavigator)
  try {
    const parent = navigation.getParent?.();
    if (parent?.reset) {
      parent.reset({
        index: 0,
        routes: [{ name: 'MainApp' }],
      });
      return;
    }
  } catch (e) {}

  // 2. Try parent navigate
  try {
    const parent = navigation.getParent?.();
    if (parent?.navigate) {
      parent.navigate('MainApp');
      return;
    }
  } catch (e) {}

  // 3. Try CommonActions reset on root or current navigation
  try {
    const target = navigation.getParent?.() || navigation;
    if (target?.dispatch) {
      target.dispatch(
        CommonActions.reset({
          index: 0,
          routes: [{ name: 'MainApp' }],
        })
      );
      return;
    }
  } catch (e) {}

  // 4. Try direct navigation
  try {
    if (navigation?.navigate) {
      navigation.navigate('MainApp');
      return;
    }
  } catch (e) {}

  // 5. Web fallback: force route to root which mounts MainApp if isLoggedIn is true
  if (Platform.OS === 'web' && typeof window !== 'undefined') {
    window.location.href = '/';
  }
};

export const safeNavigateToAuth = async (navigation, targetScreen = 'Login') => {
  try {
    await AsyncStorage.removeItem('isLoggedIn');
    await AsyncStorage.removeItem('userToken');
  } catch (e) {}

  if (!navigation) {
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      window.location.href = '/';
    }
    return;
  }

  try {
    const parent = navigation.getParent?.();
    if (parent?.reset) {
      parent.reset({
        index: 0,
        routes: [{ name: 'Auth', state: { routes: [{ name: targetScreen }] } }],
      });
      return;
    }
  } catch (e) {}

  try {
    const parent = navigation.getParent?.();
    if (parent?.navigate) {
      parent.navigate('Auth', { screen: targetScreen });
      return;
    }
  } catch (e) {}

  try {
    if (navigation?.navigate) {
      navigation.navigate('Auth', { screen: targetScreen });
      return;
    }
  } catch (e) {}

  if (Platform.OS === 'web' && typeof window !== 'undefined') {
    window.location.href = '/';
  }
};

export default {
  safeNavigateToMain,
  safeNavigateToAuth,
};
