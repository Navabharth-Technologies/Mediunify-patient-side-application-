import { Platform } from 'react-native';
import { CommonActions } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const getAppBasePath = () => {
  if (Platform.OS === 'web' && typeof window !== 'undefined' && window?.location) {
    const pathname = window.location.pathname || '';
    if (pathname.includes('/mediunify-patient')) {
      return '/mediunify-patient/';
    }
    if (pathname.includes('/Mediunify-patient-side-application-')) {
      return '/Mediunify-patient-side-application-/';
    }
  }
  return '/';
};

/**
 * Universal safe navigator that works reliably across both Web and Mobile
 * (React Navigation Stack, Web history, and full page fallback)
 */
export const safeNavigateToMain = async (navigation, returnTo, returnParams) => {
  let navigated = false;

  const targetRoutes = [{ name: 'MainApp' }];
  if (returnTo && returnTo !== 'Home' && returnTo !== 'MainApp') {
    targetRoutes.push({ name: returnTo, params: returnParams });
  }

  if (navigation) {
    // 1. Try parent reset (root AppNavigator)
    try {
      const parent = navigation.getParent?.();
      if (parent?.reset) {
        parent.reset({
          index: targetRoutes.length - 1,
          routes: targetRoutes,
        });
        navigated = true;
        return;
      }
    } catch (e) {}

    // 2. Try parent navigate
    try {
      const parent = navigation.getParent?.();
      if (parent?.navigate) {
        parent.navigate('MainApp');
        if (returnTo && returnTo !== 'Home') {
          setTimeout(() => {
            try { parent.navigate(returnTo, returnParams); } catch (e) {}
          }, 100);
        }
        navigated = true;
        return;
      }
    } catch (e) {}

    // 3. Try CommonActions reset on root or current navigation
    try {
      const target = navigation.getParent?.() || navigation;
      if (target?.dispatch) {
        target.dispatch(
          CommonActions.reset({
            index: targetRoutes.length - 1,
            routes: targetRoutes,
          })
        );
        navigated = true;
        return;
      }
    } catch (e) {}

    // 4. Try direct navigation
    try {
      if (navigation?.navigate) {
        navigation.navigate('MainApp');
        if (returnTo && returnTo !== 'Home') {
          setTimeout(() => {
            try { navigation.navigate(returnTo, returnParams); } catch (e) {}
          }, 100);
        }
        navigated = true;
        return;
      }
    } catch (e) {}
  }

  // 5. Web fallback: force route to app base path if React Navigation could not navigate
  if (!navigated && Platform.OS === 'web' && typeof window !== 'undefined' && window?.location) {
    window.location.href = getAppBasePath();
  }
};

export const safeNavigateToAuth = async (navigation, targetScreen = 'Login') => {
  try {
    await AsyncStorage.multiRemove([
      'userToken',
      'isLoggedIn',
      '@unnathi_active_patient',
      'user',
      'userName',
      'userEmail',
      'userPhone',
    ]);
  } catch (e) {}

  let navigated = false;

  if (navigation) {
    try {
      const parent = navigation.getParent?.();
      if (parent?.reset) {
        parent.reset({
          index: 0,
          routes: [{ name: 'Auth', state: { routes: [{ name: targetScreen }] } }],
        });
        navigated = true;
        return;
      }
    } catch (e) {}

    try {
      const parent = navigation.getParent?.();
      if (parent?.navigate) {
        parent.navigate('Auth', { screen: targetScreen });
        navigated = true;
        return;
      }
    } catch (e) {}

    try {
      if (navigation?.reset) {
        navigation.reset({
          index: 0,
          routes: [{ name: 'Auth', state: { routes: [{ name: targetScreen }] } }],
        });
        navigated = true;
        return;
      }
    } catch (e) {}

    try {
      if (navigation?.navigate) {
        navigation.navigate('Auth', { screen: targetScreen });
        navigated = true;
        return;
      }
    } catch (e) {}
  }

  if (!navigated && Platform.OS === 'web' && typeof window !== 'undefined' && window?.location) {
    window.location.href = getAppBasePath();
  }
};

export default {
  safeNavigateToMain,
  safeNavigateToAuth,
  getAppBasePath,
};
