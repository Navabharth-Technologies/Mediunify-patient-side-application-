import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Alert } from 'react-native';

export const LANGUAGES = [
  { id: 'en', code: 'en', name: 'English (Default)', native: 'English', flag: '🇬🇧' },
  { id: 'kn', code: 'kn', name: 'Kannada', native: 'ಕನ್ನಡ', flag: '🇮🇳' },
  { id: 'hi', code: 'hi', name: 'Hindi', native: 'हिन्दी', flag: '🇮🇳' },
  { id: 'te', code: 'te', name: 'Telugu', native: 'తెలుగు', flag: '🇮🇳' },
  { id: 'ta', code: 'ta', name: 'Tamil', native: 'தமிழ்', flag: '🇮🇳' },
];

export const TRANSLATIONS = {
  en: {
    app_settings: 'App Settings',
    settings_subtitle: 'Preferences, security & system',
    notifications_alerts: 'Notifications & Alerts',
    push_notifications: 'Push Notifications',
    push_sub: 'Appointment reminders & health tips',
    whatsapp_updates: 'WhatsApp Prescription & Bills',
    whatsapp_sub: 'Receive order tracking on WhatsApp',
    sms_alerts: 'SMS Notifications',
    sms_sub: 'Critical OTPs and hospital confirmations',
    security_auth: 'Security & Authentication',
    change_password: 'Change Password',
    change_pass_sub: 'Update your account login password',
    biometric_unlock: 'Biometric & Face ID Unlock',
    biometric_sub: 'Fast biometric authentication',
    regional_display: 'Regional & Display',
    app_language: 'App Language',
    dark_mode: 'Dark Mode Theme',
    dark_mode_sub: 'Switch between light and dark themes',
    data_storage: 'Data & Storage',
    clear_cache: 'Clear App Cache',
    clear_cache_sub: 'Free up temporary cache & images',
    logout_btn: 'Log Out of MediUnify Care',
    app_version: 'MediUnify Healthcare App • v2.4.0 (Build 420)',
    select_language: 'Select App Language',
    cancel: 'Cancel',
    save: 'Save',
    current_password: 'Current Password',
    new_password: 'New Password',
    confirm_password: 'Confirm New Password',
    update_password_btn: 'Update Password',
    cache_cleared_title: 'Cache Cleared! 🧹',
    cache_cleared_msg: 'Temporary cache and cached assets have been freed successfully.',
    lang_changed_msg: 'App language updated to',
    theme_switched_dark: 'Dark mode activated 🌙',
    theme_switched_light: 'Light mode activated ☀️',
  },
  kn: {
    app_settings: 'ಆ್ಯಪ್ ಸೆಟ್ಟಿಂಗ್ಸ್',
    settings_subtitle: 'ಆದ್ಯತೆಗಳು, ಭದ್ರತೆ ಮತ್ತು ವ್ಯವಸ್ಥೆ',
    notifications_alerts: 'ಸೂಚನೆಗಳು ಮತ್ತು ಎಚ್ಚರಿಕೆಗಳು',
    push_notifications: 'ಪುಶ್ ನೋಟಿಫಿಕೇಶನ್‌ಗಳು',
    push_sub: 'ನೇಮಕಾತಿ ಜ್ಞಾಪನೆಗಳು ಮತ್ತು ಆರೋಗ್ಯ ಸಲಹೆಗಳು',
    whatsapp_updates: 'ವಾಟ್ಸಾಪ್ ಪ್ರಿಸ್ಕ್ರಿಪ್ಷನ್ & ಬಿಲ್‌ಗಳು',
    whatsapp_sub: 'ವಾಟ್ಸಾಪ್‌ನಲ್ಲಿ ಆರ್ಡರ್ ಟ್ರ್ಯಾಕಿಂಗ್ ಪಡೆಯಿರಿ',
    sms_alerts: 'SMS ಸಂದೇಶಗಳು',
    sms_sub: 'ಪ್ರಮುಖ OTP ಮತ್ತು ಆಸ್ಪತ್ರೆ ದೃಢೀಕರಣಗಳು',
    security_auth: 'ಭದ್ರತೆ ಮತ್ತು ದೃಢೀಕರಣ',
    change_password: 'ಪಾಸ್‌ವರ್ಡ್ ಬದಲಾಯಿಸಿ',
    change_pass_sub: 'ನಿಮ್ಮ ಖಾತೆಯ ಲಾಗಿನ್ ಪಾಸ್‌ವರ್ಡ್ ನವೀಕರಿಸಿ',
    biometric_unlock: 'ಬಯೋಮೆಟ್ರಿಕ್ & ಫೇಸ್ ಐಡಿ ಅನ್‌ಲಾಕ್',
    biometric_sub: 'ವೇಗದ ಬಯೋಮೆಟ್ರಿಕ್ ದೃಢೀಕರಣ',
    regional_display: 'ಪ್ರಾದೇಶಿಕ ಮತ್ತು ಪ್ರದರ್ಶನ',
    app_language: 'ಆ್ಯಪ್ ಭಾಷೆ',
    dark_mode: 'ಡಾರ್ಕ್ ಮೋಡ್ ಥೀಮ್',
    dark_mode_sub: 'ಲೈಟ್ ಮತ್ತು ಡಾರ್ಕ್ ಥೀಮ್ ನಡುವೆ ಬದಲಾಯಿಸಿ',
    data_storage: 'ಡೇಟಾ ಮತ್ತು ಸಂಗ್ರಹಣೆ',
    clear_cache: 'ಆ್ಯಪ್ ಕ್ಯಾಶ್ ತೆರವುಗೊಳಿಸಿ',
    clear_cache_sub: 'ತಾತ್ಕಾಲಿಕ ಸಂಗ್ರಹಣೆ ಮತ್ತು ಚಿತ್ರಗಳನ್ನು ತೆರವುಗೊಳಿಸಿ',
    logout_btn: 'MediUnify ನಿಂದ ಲಾಗ್‌ಔಟ್ ಆಗಿ',
    app_version: 'MediUnify ಆರೋಗ್ಯ ಆ್ಯಪ್ • v2.4.0 (ಕನ್ನಡ)',
    select_language: 'ಆ್ಯಪ್ ಭಾಷೆಯನ್ನು ಆಯ್ಕೆಮಾಡಿ',
    cancel: 'ರದ್ದುಮಾಡಿ',
    save: 'ಉಳಿಸಿ',
    current_password: 'ಪ್ರಸ್ತುತ ಪಾಸ್‌ವರ್ಡ್',
    new_password: 'ಹೊಸ ಪಾಸ್‌ವರ್ಡ್',
    confirm_password: 'ಹೊಸ ಪಾಸ್‌ವರ್ಡ್ ದೃಢೀಕರಿಸಿ',
    update_password_btn: 'ಪಾಸ್‌ವರ್ಡ್ ನವೀಕರಿಸಿ',
    cache_cleared_title: 'ಕ್ಯಾಶ್ ತೆರವುಗೊಳಿಸಲಾಗಿದೆ! 🧹',
    cache_cleared_msg: 'ತಾತ್ಕಾಲಿಕ ಮೆಮೊರಿ ಯಶಸ್ವಿಯಾಗಿ ತೆರವುಗೊಂಡಿದೆ.',
    lang_changed_msg: 'ಆ್ಯಪ್ ಭಾಷೆ ಕನ್ನಡಕ್ಕೆ ಬದಲಾಯಿಸಲಾಗಿದೆ',
    theme_switched_dark: 'ಡಾರ್ಕ್ ಮೋಡ್ ಸಕ್ರಿಯಗೊಳಿಸಲಾಗಿದೆ 🌙',
    theme_switched_light: 'ಲೈಟ್ ಮೋಡ್ ಸಕ್ರಿಯಗೊಳಿಸಲಾಗಿದೆ ☀️',
  },
  hi: {
    app_settings: 'ऐप सेटिंग्स',
    settings_subtitle: 'प्राथमिकताएं, सुरक्षा और सिस्टम',
    notifications_alerts: 'सूचनाएं और अलर्ट',
    push_notifications: 'पुश नोटिफिकेशन्स',
    push_sub: 'अपॉइंटमेंट रिमाइंडर और स्वास्थ्य टिप्स',
    whatsapp_updates: 'व्हाट्सएप पर्ची और बिल',
    whatsapp_sub: 'व्हाट्सएप पर ऑर्डर ट्रैकिंग प्राप्त करें',
    sms_alerts: 'एसएमएस अलर्ट',
    sms_sub: 'महत्वपूर्ण ओटीपी और अस्पताल की पुष्टि',
    security_auth: 'सुरक्षा और प्रमाणीकरण',
    change_password: 'पासवर्ड बदलें',
    change_pass_sub: 'अपना खाता लॉगिन पासवर्ड अपडेट करें',
    biometric_unlock: 'बायोमेट्रिक और फेस आईडी अनलॉक',
    biometric_sub: 'त्वरित बायोमेट्रिक प्रमाणीकरण',
    regional_display: 'क्षेत्रीय और डिस्प्ले',
    app_language: 'ऐप की भाषा',
    dark_mode: 'डार्क मोड थीम',
    dark_mode_sub: 'लाइट और डार्क थीम के बीच स्विच करें',
    data_storage: 'डेटा और स्टोरेज',
    clear_cache: 'ऐप कैश साफ़ करें',
    clear_cache_sub: 'अस्थायी कैश और छवियां साफ़ करें',
    logout_btn: 'MediUnify से लॉग आउट करें',
    app_version: 'MediUnify हेल्थकेयर ऐप • v2.4.0 (हिन्दी)',
    select_language: 'ऐप भाषा चुनें',
    cancel: 'रद्द करें',
    save: 'सहेजें',
    current_password: 'वर्तमान पासवर्ड',
    new_password: 'नया पासवर्ड',
    confirm_password: 'नए पासवर्ड की पुष्टि करें',
    update_password_btn: 'पासवर्ड अपडेट करें',
    cache_cleared_title: 'कैश साफ़ हो गया! 🧹',
    cache_cleared_msg: 'अस्थायी स्टोरेज सफलतापूर्वक साफ़ कर दिया गया है।',
    lang_changed_msg: 'ऐप की भाषा हिन्दी में बदल दी गई है',
    theme_switched_dark: 'डार्क मोड सक्रिय किया गया 🌙',
    theme_switched_light: 'लाइट मोड सक्रिय किया गया ☀️',
  },
  te: {
    app_settings: 'యాప్ సెట్టింగ్స్',
    settings_subtitle: 'ప్రాధాన్యతలు, భద్రత & సిస్టమ్',
    notifications_alerts: 'నోటిఫికేషన్లు & హెచ్చరికలు',
    push_notifications: 'పుష్ నోటిఫికేషన్లు',
    push_sub: 'అపాయింట్‌మెంట్ రిమైండర్లు & ఆరోగ్య చిట్కాలు',
    whatsapp_updates: 'వాట్సాప్ ప్రిస్క్రిప్షన్ & బిల్లులు',
    whatsapp_sub: 'వాట్సాప్‌లో ఆర్డర్ ట్రాకింగ్ పొందండి',
    sms_alerts: 'SMS నోటిఫికేషన్లు',
    sms_sub: 'ముఖ్యమైన OTPలు మరియు ఆసుపత్రి నిర్ధారణలు',
    security_auth: 'భద్రత & ధృవీకరణ',
    change_password: 'పాస్‌వర్డ్ మార్చండి',
    change_pass_sub: 'ఖాతా లాగిన్ పాస్‌వర్డ్‌ను అప్‌డేట్ చేయండి',
    biometric_unlock: 'బయోమెట్రిక్ & ఫేస్ అన్‌లాక్',
    biometric_sub: 'వేగవంతమైన బయోమెట్రిక్ ప్రమాణీకరణ',
    regional_display: 'ప్రాంతీయ & ప్రదర్శన',
    app_language: 'యాప్ భాష',
    dark_mode: 'డార్క్ మోడ్ థీమ్',
    dark_mode_sub: 'లైట్ మరియు డార్క్ థీమ్‌ల మధ్య మారండి',
    data_storage: 'డేటా & నిల్వ',
    clear_cache: 'యాప్ కాష్ క్లియర్ చేయండి',
    clear_cache_sub: 'తాత్కాలిక కాష్ & చిత్రాలను తొలగించండి',
    logout_btn: 'MediUnify నుండి లాగౌట్ అవ్వండి',
    app_version: 'MediUnify హెల్త్‌కేర్ యాప్ • v2.4.0 (తెలుగు)',
    select_language: 'యాప్ భాషను ఎంచుకోండి',
    cancel: 'రద్దు చేయండి',
    save: 'సేవ్ చేయండి',
    current_password: 'ప్రస్తుత పాస్‌వర్డ్',
    new_password: 'కొత్త పాస్‌వర్డ్',
    confirm_password: 'కొత్త పాస్‌వర్డ్‌ను నిర్ధారించండి',
    update_password_btn: 'పాస్‌వర్డ్ అప్‌డేట్ చేయండి',
    cache_cleared_title: 'కాష్ క్లియర్ చేయబడింది! 🧹',
    cache_cleared_msg: 'తాత్కాలిక మెమరీ విజయవంతంగా క్లియర్ చేయబడింది.',
    lang_changed_msg: 'యాప్ భాష తెలుగుగా నవీకరించబడింది',
    theme_switched_dark: 'డార్క్ మోడ్ ఆన్ చేయబడింది 🌙',
    theme_switched_light: 'లైట్ మోడ్ ఆన్ చేయబడింది ☀️',
  },
  ta: {
    app_settings: 'செயலி அமைப்புகள்',
    settings_subtitle: 'விருப்பத்தேர்வுகள், பாதுகாப்பு & அமைப்பு',
    notifications_alerts: 'அறிவிப்புகள் & எச்சரிக்கைகள்',
    push_notifications: 'புஷ் அறிவிப்புகள்',
    push_sub: 'முன்பதிவு நினைவூட்டல்கள் & சுகாதார குறிப்புகள்',
    whatsapp_updates: 'வாட்ஸ்அப் மருந்துச்சீட்டு & ரசீதுகள்',
    whatsapp_sub: 'வாட்ஸ்அப்பில் ஆர்டர் விவரங்களைப் பெறுங்கள்',
    sms_alerts: 'SMS அறிவிப்புகள்',
    sms_sub: 'முக்கியமான OTP மற்றும் மருத்துவமனை உறுதிப்படுத்தல்கள்',
    security_auth: 'பாதுகாப்பு & அங்கீகாரம்',
    change_password: 'கடவுச்சொல்லை மாற்றவும்',
    change_pass_sub: 'உங்கள் உள்நுழைவு கடவுச்சொல்லை மாற்றவும்',
    biometric_unlock: 'பயோமெட்ரிக் & ஃபேஸ் அன்லாக்',
    biometric_sub: 'விரைவான பயோமெட்ரிக் அங்கீகாரம்',
    regional_display: 'பிராந்திய & காட்சி',
    app_language: 'செயலி மொழி',
    dark_mode: 'டார்க் மோட் தீம்',
    dark_mode_sub: 'லைட் மற்றும் டார்க் தீம்களுக்கு இடையே மாறவும்',
    data_storage: 'தரவு & சேமிப்பகம்',
    clear_cache: 'செயலி தற்காலிக சேமிப்பை அழிக்கவும்',
    clear_cache_sub: 'தற்காலிக கோப்புகளை நீக்கவும்',
    logout_btn: 'MediUnify இலிருந்து வெளியேறு',
    app_version: 'MediUnify ஹெல்த்கேர் • v2.4.0 (தமிழ்)',
    select_language: 'செயலி மொழியைத் தேர்ந்தெடுக்கவும்',
    cancel: 'ரத்துசெய்',
    save: 'சேமி',
    current_password: 'தற்போதைய கடவுச்சொல்',
    new_password: 'புதிய கடவுச்சொல்',
    confirm_password: 'புதிய கடவுச்சொல்லை உறுதிப்படுத்தவும்',
    update_password_btn: 'கடவுச்சொல்லைப் புதுப்பிக்கவும்',
    cache_cleared_title: 'தற்காலிக சேமிப்பு அழிக்கப்பட்டது! 🧹',
    cache_cleared_msg: 'தற்காலிக நினைவகம் வெற்றிகரமாக அழிக்கப்பட்டது.',
    lang_changed_msg: 'செயலி மொழி தமிழுக்கு மாற்றப்பட்டது',
    theme_switched_dark: 'டார்க் மோட் செயல்படுத்தப்பட்டது 🌙',
    theme_switched_light: 'லைட் மோட் செயல்படுத்தப்பட்டது ☀️',
  },
};

const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [language, setLanguage] = useState('en');
  const [notifications, setNotifications] = useState({
    push: true,
    whatsapp: true,
    sms: false,
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

      const savedLang = await AsyncStorage.getItem('@unnathi_app_language');
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
      setLanguage(langCode);
      await AsyncStorage.setItem('@unnathi_app_language', langCode);
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

  // Translation helper function
  const t = (key) => {
    const langObj = TRANSLATIONS[language] || TRANSLATIONS.en;
    return langObj[key] || TRANSLATIONS.en[key] || key;
  };

  // Dynamic Theme Palette
  const theme = {
    isDark: isDarkMode,
    background: isDarkMode ? '#0B1120' : '#F4F8FA',
    card: isDarkMode ? '#1E293B' : '#FFFFFF',
    cardSubtle: isDarkMode ? '#172554' : '#F8FAFC',
    headerBg: isDarkMode ? '#0F172A' : '#FFFFFF',
    text: isDarkMode ? '#F8FAFC' : '#1E293B',
    textSecondary: isDarkMode ? '#94A3B8' : '#64748B',
    border: isDarkMode ? '#334155' : '#E2E8F0',
    divider: isDarkMode ? '#1E293B' : '#F1F5F9',
    inputBg: isDarkMode ? '#0F172A' : '#F8FAFC',
    primary: '#00B894',
    teal: '#00B894',
    navyBlue: isDarkMode ? '#60A5FA' : '#1E3A8A',
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
        t,
        notifications,
        updateNotifications,
        biometricEnabled,
        toggleBiometric,
        theme,
        LANGUAGES,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    // Fallback default if rendered outside provider
    return {
      isDarkMode: false,
      toggleDarkMode: () => {},
      language: 'en',
      changeLanguage: () => {},
      t: (key) => TRANSLATIONS.en[key] || key,
      notifications: { push: true, whatsapp: true, sms: false },
      updateNotifications: () => {},
      biometricEnabled: true,
      toggleBiometric: () => {},
      theme: {
        isDark: false,
        background: '#F4F8FA',
        card: '#FFFFFF',
        cardSubtle: '#F8FAFC',
        headerBg: '#FFFFFF',
        text: '#1E293B',
        textSecondary: '#64748B',
        border: '#E2E8F0',
        divider: '#F1F5F9',
        inputBg: '#F8FAFC',
        primary: '#00B894',
        teal: '#00B894',
        navyBlue: '#1E3A8A',
        modalBg: '#FFFFFF',
        statusBar: 'dark-content',
      },
      LANGUAGES,
    };
  }
  return context;
};
