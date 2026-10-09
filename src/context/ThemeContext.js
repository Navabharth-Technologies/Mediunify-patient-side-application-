import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Alert, Platform } from 'react-native';
import { LANGUAGES, TRANSLATIONS, translate } from '../translations/index';

export { LANGUAGES, TRANSLATIONS, translate };

const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [language, setLanguage] = useState('en');
  const [notifications, setNotifications] = useState({
    push: true,
    whatsapp: true,
    sms: true,
  });
  const [biometricEnabled, setBiometricEnabled] = useState(true);

  // Load preferences from storage on mount
  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const savedDark = await AsyncStorage.getItem('@unnathi_dark_mode');
      if (savedDark !== null) {
        setIsDarkMode(savedDark === 'true');
      }

      let savedLang = await AsyncStorage.getItem('@unnathi_app_language');
      if (!savedLang && Platform.OS === 'web' && typeof localStorage !== 'undefined') {
        savedLang = localStorage.getItem('@unnathi_app_language');
      }
      // Automatic fallback if previously saved language was not one of en, kn, hi
      if (savedLang && !['en', 'kn', 'hi'].includes(savedLang)) {
        savedLang = 'en';
        await AsyncStorage.setItem('@unnathi_app_language', 'en');
        if (Platform.OS === 'web' && typeof localStorage !== 'undefined') {
          try {
            localStorage.setItem('@unnathi_app_language', 'en');
          } catch (e) {}
        }
      }
      if (savedLang) {
        setLanguage(savedLang);
      }

      const savedNotifs = await AsyncStorage.getItem('@unnathi_notification_settings');
      if (savedNotifs) {
        setNotifications(JSON.parse(savedNotifs));
      }

      const savedBio = await AsyncStorage.getItem('@unnathi_biometric_enabled');
      if (savedBio !== null) {
        setBiometricEnabled(savedBio === 'true');
      }
    } catch (e) {
      console.log('Error loading settings from storage:', e);
    }
  };

  const toggleDarkMode = async (value) => {
    try {
      setIsDarkMode(value);
      await AsyncStorage.setItem('@unnathi_dark_mode', value ? 'true' : 'false');
    } catch (e) {
      console.log('Error saving dark mode:', e);
    }
  };

  const changeLanguage = async (langCode) => {
    try {
      const validCode = ['en', 'kn', 'hi'].includes(langCode) ? langCode : 'en';
      setLanguage(validCode);
      await AsyncStorage.setItem('@unnathi_app_language', validCode);
      if (Platform.OS === 'web' && typeof localStorage !== 'undefined') {
        try {
          localStorage.setItem('@unnathi_app_language', validCode);
          window.dispatchEvent(new CustomEvent('app-language-changed', { detail: validCode }));
        } catch (e) {}
      }
    } catch (e) {
      console.log('Error saving language:', e);
    }
  };

  const updateNotifications = async (key, val) => {
    try {
      const updated = { ...notifications, [key]: val };
      setNotifications(updated);
      await AsyncStorage.setItem('@unnathi_notification_settings', JSON.stringify(updated));
    } catch (e) {
      console.log('Error saving notification settings:', e);
    }
  };

  const toggleBiometric = async (val) => {
    try {
      setBiometricEnabled(val);
      await AsyncStorage.setItem('@unnathi_biometric_enabled', val ? 'true' : 'false');
    } catch (e) {
      console.log('Error saving biometric settings:', e);
    }
  };

  // Centralized translation helper function with dual-lookup & interpolation
  const t = (keyOrText, fallback, params) => {
    return translate(language, keyOrText, fallback, params);
  };

  // Adaptive Typography & Layout system (Section 17A)
  const isIndic = ['kn', 'hi'].includes(language);
  const isNonEnglish = language !== 'en';

  const getAdaptiveFontSize = (baseSize, options = {}) => {
    if (!isIndic) return baseSize;
    const minSize = options.minSize ?? (baseSize > 14 ? baseSize - 1.5 : baseSize - 1);
    if (options.compact) {
      return Math.max(minSize, baseSize - (options.scaleDown || 1));
    }
    return baseSize;
  };

  const getAdaptiveLineHeight = (fontSize, customLineHeight) => {
    if (!isIndic) return customLineHeight || Math.round(fontSize * 1.3);
    const minLineHeight = Math.round(fontSize * 1.38);
    return customLineHeight ? Math.max(customLineHeight, minLineHeight) : minLineHeight;
  };

  const adaptiveTextStyle = (baseStyle = {}, options = {}) => {
    const rawSize = baseStyle.fontSize || 14;
    const adaptedSize = getAdaptiveFontSize(rawSize, options);
    const adaptedLineHeight = getAdaptiveLineHeight(adaptedSize, baseStyle.lineHeight);
    return {
      ...baseStyle,
      fontSize: adaptedSize,
      lineHeight: adaptedLineHeight,
    };
  };

  // Dynamic Theme Palette
  const theme = {
    isDark: isDarkMode,
    background: isDarkMode ? '#0B1120' : '#FAFCFD',
    card: isDarkMode ? '#1E293B' : '#FFFFFF',
    cardSubtle: isDarkMode ? '#172554' : '#F0F9FF',
    headerBg: isDarkMode ? '#0F172A' : '#FFFFFF',
    text: isDarkMode ? '#F8FAFC' : '#1E3A8A',
    textSecondary: isDarkMode ? '#94A3B8' : '#64748B',
    border: isDarkMode ? '#334155' : '#DCE7EC',
    divider: isDarkMode ? '#1E293B' : '#F1F8FB',
    inputBg: isDarkMode ? '#0F172A' : '#FAFCFD',
    primary: '#00B894',
    teal: '#00B894',
    navyBlue: isDarkMode ? '#60A5FA' : '#1E3A8A',
    aqua: '#00C2CB',
    freshGreen: '#7BC96F',
    coral: '#FF7F50',
    slate: '#64748B',
    modalBg: isDarkMode ? '#1E293B' : '#FFFFFF',
    statusBar: isDarkMode ? 'light-content' : 'dark-content',
  };

  return (
    <ThemeContext.Provider
      value={{
        isDarkMode,
        toggleDarkMode,
        language,
        changeLanguage,
        isIndic,
        isNonEnglish,
        getAdaptiveFontSize,
        getAdaptiveLineHeight,
        adaptiveTextStyle,
        t,
        notifications,
        updateNotifications,
        biometricEnabled,
        toggleBiometric,
        theme,
        LANGUAGES,
        TRANSLATIONS,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    return {
      isDarkMode: false,
      toggleDarkMode: () => {},
      language: 'en',
      changeLanguage: () => {},
      isIndic: false,
      isNonEnglish: false,
      getAdaptiveFontSize: (s) => s,
      getAdaptiveLineHeight: (s, l) => l || Math.round(s * 1.3),
      adaptiveTextStyle: (s) => s,
      t: (k, fb, p) => translate('en', k, fb, p),
      notifications: { push: true, whatsapp: true, sms: true },
      updateNotifications: () => {},
      biometricEnabled: true,
      toggleBiometric: () => {},
      theme: {
        isDark: false,
        background: '#FAFCFD',
        card: '#FFFFFF',
        text: '#1E3A8A',
        primary: '#00B894',
        border: '#DCE7EC',
      },
      LANGUAGES,
      TRANSLATIONS,
    };
  }
  return context;
};

export default ThemeContext;
