import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Switch,
  Modal,
  TextInput,
  Alert,
  StatusBar,
  Platform,
  ToastAndroid,
} from 'react-native';
import { showAlert } from '../../utils/alert';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';

import colors from '../../theme/colors';
import { useTheme } from '../../context/ThemeContext';

const SettingsScreen = ({ navigation }) => {
  const {
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
  } = useTheme();

  // Modals
  const [showLangModal, setShowLangModal] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);

  // Password fields
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showOldPass, setShowOldPass] = useState(false);
  const [showNewPass, setShowNewPass] = useState(false);
  const [showConfirmPass, setShowConfirmPass] = useState(false);

  // Toast / Status banner
  const [toastMessage, setToastMessage] = useState('');
  const [cacheSize, setCacheSize] = useState('28.4 MB');

  const showFeedback = (msg) => {
    setToastMessage(msg);
    if (Platform.OS === 'android') {
      ToastAndroid.show(msg, ToastAndroid.SHORT);
    }
    setTimeout(() => {
      setToastMessage('');
    }, 3000);
  };

  const handleClearCache = () => {
    showAlert(
      t('clear_cache'),
      'Do you want to clear temporary offline cache, search suggestions, and temporary images (' + cacheSize + ')?',
      [
        { text: t('cancel'), style: 'cancel' },
        {
          text: 'Clear Cache',
          style: 'destructive',
          onPress: async () => {
            try {
              // Clear temporary keys
              const allKeys = await AsyncStorage.getAllKeys();
              const tempKeys = allKeys.filter(
                (k) =>
                  k.startsWith('@unnathi_temp_') ||
                  k.startsWith('@unnathi_search_history') ||
                  k.startsWith('@unnathi_cached_')
              );
              if (tempKeys.length > 0) {
                await AsyncStorage.multiRemove(tempKeys);
              }
              setCacheSize('0.0 KB');
              showAlert(
                t('cache_cleared_title'),
                t('cache_cleared_msg')
              );
              showFeedback('Cache freed successfully! 🧹');
            } catch (e) {
              console.log('Error clearing cache:', e);
            }
          },
        },
      ]
    );
  };

  const handleUpdatePassword = async () => {
    if (!oldPassword.trim() || !newPassword.trim() || !confirmPassword.trim()) {
      showAlert('Error', 'Please fill in all password fields.');
      return;
    }
    if (newPassword.length < 6) {
      showAlert('Weak Password', 'New password must be at least 6 characters long.');
      return;
    }
    if (newPassword !== confirmPassword) {
      showAlert('Mismatch', 'New password and confirm password do not match.');
      return;
    }

    try {
      // Fetch stored primary user & registered users directory
      const storedPrimary = await AsyncStorage.getItem('@unnathi_primary_user');
      const regUsersStr = await AsyncStorage.getItem('@unnathi_registered_users');
      let registeredUsers = {};
      if (regUsersStr) {
        try {
          registeredUsers = JSON.parse(regUsersStr);
        } catch (e) {}
      }

      let activeEmail = '';
      if (storedPrimary) {
        const parsed = JSON.parse(storedPrimary);
        activeEmail = (parsed.email || '').toLowerCase().trim();
      }

      if (!activeEmail) {
        const storedEmail = await AsyncStorage.getItem('userEmail');
        if (storedEmail) activeEmail = storedEmail.toLowerCase().trim();
      }

      // Check existing password if user exists in registry
      if (activeEmail && registeredUsers[activeEmail]) {
        const currentSavedPass = registeredUsers[activeEmail].password;
        if (currentSavedPass && currentSavedPass !== oldPassword) {
          showAlert('Incorrect Password', 'The current password you entered is incorrect.');
          return;
        }

        // Update password in registry
        registeredUsers[activeEmail].password = newPassword;
        await AsyncStorage.setItem('@unnathi_registered_users', JSON.stringify(registeredUsers));
      }

      // Update primary user object
      if (storedPrimary) {
        const parsed = JSON.parse(storedPrimary);
        parsed.password = newPassword;
        await AsyncStorage.setItem('@unnathi_primary_user', JSON.stringify(parsed));
      }

      setShowPasswordModal(false);
      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
      showAlert('Password Updated! 🔒', 'Your account password has been updated securely.');
      showFeedback('Password changed successfully! 🔒');
    } catch (e) {
      console.log('Error updating password:', e);
      showAlert('Error', 'Could not update password. Please try again.');
    }
  };

  const handleLogout = () => {
    const doLogout = async () => {
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
      } catch (e) {
        console.log('Logout storage clear err:', e);
      }

      let navigated = false;
      const parent = navigation?.getParent?.();
      if (parent?.reset) {
        try {
          parent.reset({
            index: 0,
            routes: [{ name: 'Auth', state: { routes: [{ name: 'Login' }] } }],
          });
          navigated = true;
        } catch (e) {}
      }
      if (!navigated && parent?.navigate) {
        try {
          parent.navigate('Auth', { screen: 'Login' });
          navigated = true;
        } catch (e) {}
      }
      if (!navigated && navigation?.reset) {
        try {
          navigation.reset({
            index: 0,
            routes: [{ name: 'Auth' }],
          });
          navigated = true;
        } catch (e) {}
      }
      if (!navigated && navigation?.navigate) {
        try {
          navigation.navigate('Auth', { screen: 'Login' });
          navigated = true;
        } catch (e) {}
      }

      if (!navigated && Platform.OS === 'web' && typeof window !== 'undefined') {
        const basePath = window.location.pathname.includes('Mediunify-patient-side-application-')
          ? '/Mediunify-patient-side-application-/'
          : '/';
        window.location.href = basePath;
      }
    };

    showAlert('Logout', 'Are you sure you want to log out from Unnathi Healthcare?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Logout',
        style: 'destructive',
        onPress: doLogout,
      },
    ]);
  };

  const currentLangObj = LANGUAGES.find((l) => l.code === language) || LANGUAGES[0];

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <StatusBar
        barStyle={isDarkMode ? 'light-content' : 'dark-content'}
        backgroundColor={theme.headerBg}
      />

      {/* HEADER */}
      <View
        style={[
          styles.header,
          { backgroundColor: theme.headerBg, borderBottomColor: theme.border },
        ]}
      >
        <TouchableOpacity
          style={[styles.backBtn, { backgroundColor: isDarkMode ? '#1E293B' : '#F1F5F9' }]}
          onPress={() => navigation.goBack()}
          activeOpacity={0.8}
        >
          <Ionicons name="arrow-back" size={22} color={isDarkMode ? '#F8FAFC' : colors.secondary} />
        </TouchableOpacity>

        <View style={styles.headerTitleWrap}>
          <Text style={[styles.headerTitle, { color: isDarkMode ? '#F8FAFC' : colors.secondary }]}>
            {t('app_settings')}
          </Text>
          <Text style={[styles.headerSubtitle, { color: theme.textSecondary }]}>
            {t('settings_subtitle')}
          </Text>
        </View>
        <View style={{ width: 40 }} />
      </View>

      {/* FEEDBACK TOAST BANNER */}
      {!!toastMessage && (
        <View style={styles.toastBanner}>
          <Ionicons name="checkmark-circle" size={16} color="#FFFFFF" />
          <Text style={styles.toastText}>{toastMessage}</Text>
        </View>
      )}

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* ==================================================
            SECTION 1: REGIONAL & DISPLAY (DARK MODE + LANGUAGE)
        ================================================== */}
        <Text style={[styles.sectionHeader, { color: theme.textSecondary }]}>
          {t('regional_display')}
        </Text>
        <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
          {/* DARK MODE SWITCH */}
          <View style={styles.settingRow}>
            <View style={styles.settingLeft}>
              <View
                style={[
                  styles.iconWrap,
                  { backgroundColor: isDarkMode ? '#312E81' : '#EEF2FF' },
                ]}
              >
                <Ionicons
                  name={isDarkMode ? 'moon' : 'moon-outline'}
                  size={20}
                  color={isDarkMode ? '#818CF8' : '#4F46E5'}
                />
              </View>
              <View style={styles.settingInfo}>
                <View style={styles.titleWithBadge}>
                  <Text style={[styles.settingTitle, { color: theme.text }]}>
                    {t('dark_mode')}
                  </Text>
                  <View
                    style={[
                      styles.modeBadge,
                      { backgroundColor: isDarkMode ? '#064E3B' : '#F0FDF4' },
                    ]}
                  >
                    <Text
                      style={[
                        styles.modeBadgeText,
                        { color: isDarkMode ? '#34D399' : '#16A34A' },
                      ]}
                    >
                      {isDarkMode ? 'ON 🌙' : 'OFF ☀️'}
                    </Text>
                  </View>
                </View>
                <Text style={[styles.settingSub, { color: theme.textSecondary }]}>
                  {t('dark_mode_sub')}
                </Text>
              </View>
            </View>
            <Switch
              value={isDarkMode}
              onValueChange={(val) => {
                toggleDarkMode(val);
                showFeedback(val ? t('theme_switched_dark') : t('theme_switched_light'));
              }}
              trackColor={{ false: '#CBD5E1', true: '#00B894' }}
              thumbColor={isDarkMode ? '#FFFFFF' : '#FFFFFF'}
            />
          </View>

          <View style={[styles.divider, { backgroundColor: theme.border }]} />

          {/* APP LANGUAGE SELECTOR */}
          <TouchableOpacity
            style={styles.settingRow}
            activeOpacity={0.7}
            onPress={() => setShowLangModal(true)}
          >
            <View style={styles.settingLeft}>
              <View
                style={[
                  styles.iconWrap,
                  { backgroundColor: isDarkMode ? '#064E3B' : '#E6F8F4' },
                ]}
              >
                <Ionicons name="language-outline" size={20} color={colors.primary} />
              </View>
              <View style={styles.settingInfo}>
                <Text style={[styles.settingTitle, { color: theme.text }]}>
                  {t('app_language')}
                </Text>
                <Text style={[styles.settingSub, { color: theme.textSecondary }]}>
                  {currentLangObj.flag} {currentLangObj.native} ({currentLangObj.name})
                </Text>
              </View>
            </View>
            <View style={styles.langRightWrap}>
              <View style={styles.activeLangPill}>
                <Text style={styles.activeLangPillText}>{currentLangObj.code.toUpperCase()}</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={theme.textSecondary} />
            </View>
          </TouchableOpacity>
        </View>

        {/* ==================================================
            SECTION 2: NOTIFICATIONS & ALERTS
        ================================================== */}
        <Text style={[styles.sectionHeader, { color: theme.textSecondary }]}>
          {t('notifications_alerts')}
        </Text>
        <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
          {/* PUSH NOTIFICATIONS */}
          <View style={styles.settingRow}>
            <View style={styles.settingLeft}>
              <View
                style={[
                  styles.iconWrap,
                  { backgroundColor: isDarkMode ? '#064E3B' : '#E6F8F4' },
                ]}
              >
                <Ionicons name="notifications-outline" size={20} color={colors.primary} />
              </View>
              <View style={styles.settingInfo}>
                <Text style={[styles.settingTitle, { color: theme.text }]}>
                  {t('push_notifications')}
                </Text>
                <Text style={[styles.settingSub, { color: theme.textSecondary }]}>
                  {t('push_sub')}
                </Text>
              </View>
            </View>
            <Switch
              value={notifications.push}
              onValueChange={(val) => {
                updateNotifications('push', val);
                showFeedback(val ? 'Push alerts enabled 🔔' : 'Push alerts disabled 🔕');
              }}
              trackColor={{ false: '#CBD5E1', true: '#00B894' }}
              thumbColor="#FFFFFF"
            />
          </View>

          <View style={[styles.divider, { backgroundColor: theme.border }]} />

          {/* WHATSAPP UPDATES */}
          <View style={styles.settingRow}>
            <View style={styles.settingLeft}>
              <View style={[styles.iconWrap, { backgroundColor: '#DCFCE7' }]}>
                <Ionicons name="logo-whatsapp" size={20} color="#16A34A" />
              </View>
              <View style={styles.settingInfo}>
                <Text style={[styles.settingTitle, { color: theme.text }]}>
                  {t('whatsapp_updates')}
                </Text>
                <Text style={[styles.settingSub, { color: theme.textSecondary }]}>
                  {t('whatsapp_sub')}
                </Text>
              </View>
            </View>
            <Switch
              value={notifications.whatsapp}
              onValueChange={(val) => {
                updateNotifications('whatsapp', val);
                showFeedback(val ? 'WhatsApp updates on 💬' : 'WhatsApp updates off');
              }}
              trackColor={{ false: '#CBD5E1', true: '#00B894' }}
              thumbColor="#FFFFFF"
            />
          </View>

          <View style={[styles.divider, { backgroundColor: theme.border }]} />

          {/* SMS NOTIFICATIONS */}
          <View style={styles.settingRow}>
            <View style={styles.settingLeft}>
              <View
                style={[
                  styles.iconWrap,
                  { backgroundColor: isDarkMode ? '#1E3A8A' : '#EFF6FF' },
                ]}
              >
                <Ionicons name="chatbubble-ellipses-outline" size={20} color="#3B82F6" />
              </View>
              <View style={styles.settingInfo}>
                <Text style={[styles.settingTitle, { color: theme.text }]}>
                  {t('sms_alerts')}
                </Text>
                <Text style={[styles.settingSub, { color: theme.textSecondary }]}>
                  {t('sms_sub')}
                </Text>
              </View>
            </View>
            <Switch
              value={notifications.sms}
              onValueChange={(val) => {
                updateNotifications('sms', val);
                showFeedback(val ? 'SMS alerts enabled 📱' : 'SMS alerts disabled');
              }}
              trackColor={{ false: '#CBD5E1', true: '#00B894' }}
              thumbColor="#FFFFFF"
            />
          </View>
        </View>

        {/* ==================================================
            SECTION 3: SECURITY & AUTHENTICATION
        ================================================== */}
        <Text style={[styles.sectionHeader, { color: theme.textSecondary }]}>
          {t('security_auth')}
        </Text>
        <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
          {/* CHANGE PASSWORD */}
          <TouchableOpacity
            style={styles.settingRow}
            activeOpacity={0.7}
            onPress={() => setShowPasswordModal(true)}
          >
            <View style={styles.settingLeft}>
              <View
                style={[
                  styles.iconWrap,
                  { backgroundColor: isDarkMode ? '#701A75' : '#FDF4FF' },
                ]}
              >
                <Ionicons name="key-outline" size={20} color="#A855F7" />
              </View>
              <View style={styles.settingInfo}>
                <Text style={[styles.settingTitle, { color: theme.text }]}>
                  {t('change_password')}
                </Text>
                <Text style={[styles.settingSub, { color: theme.textSecondary }]}>
                  {t('change_pass_sub')}
                </Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={18} color={theme.textSecondary} />
          </TouchableOpacity>

          <View style={[styles.divider, { backgroundColor: theme.border }]} />

          {/* BIOMETRICS */}
          <View style={styles.settingRow}>
            <View style={styles.settingLeft}>
              <View
                style={[
                  styles.iconWrap,
                  { backgroundColor: isDarkMode ? '#064E3B' : '#E6F8F4' },
                ]}
              >
                <Ionicons name="finger-print-outline" size={20} color={colors.primary} />
              </View>
              <View style={styles.settingInfo}>
                <Text style={[styles.settingTitle, { color: theme.text }]}>
                  {t('biometric_unlock')}
                </Text>
                <Text style={[styles.settingSub, { color: theme.textSecondary }]}>
                  {t('biometric_sub')}
                </Text>
              </View>
            </View>
            <Switch
              value={biometricEnabled}
              onValueChange={(val) => {
                toggleBiometric(val);
                showFeedback(val ? 'Biometric login active 🔐' : 'Biometrics disabled');
              }}
              trackColor={{ false: '#CBD5E1', true: '#00B894' }}
              thumbColor="#FFFFFF"
            />
          </View>
        </View>

        {/* ==================================================
            SECTION 4: DATA & STORAGE
        ================================================== */}
        <Text style={[styles.sectionHeader, { color: theme.textSecondary }]}>
          {t('data_storage')}
        </Text>
        <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <TouchableOpacity
            style={styles.settingRow}
            activeOpacity={0.7}
            onPress={handleClearCache}
          >
            <View style={styles.settingLeft}>
              <View style={[styles.iconWrap, { backgroundColor: '#FEF2F2' }]}>
                <Ionicons name="trash-bin-outline" size={20} color="#EF4444" />
              </View>
              <View style={styles.settingInfo}>
                <Text style={[styles.settingTitle, { color: theme.text }]}>
                  {t('clear_cache')}
                </Text>
                <Text style={[styles.settingSub, { color: theme.textSecondary }]}>
                  {t('clear_cache_sub')} ({cacheSize})
                </Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={18} color={theme.textSecondary} />
          </TouchableOpacity>
        </View>

        {/* ==================================================
            LOGOUT BUTTON
        ================================================== */}
        <TouchableOpacity
          style={[styles.logoutBtn, { backgroundColor: isDarkMode ? '#1E293B' : '#FFFFFF', borderColor: '#FCA5A5' }]}
          activeOpacity={0.85}
          onPress={handleLogout}
        >
          <Ionicons name="log-out-outline" size={20} color="#DC2626" />
          <Text style={styles.logoutText}>{t('logout_btn')}</Text>
        </TouchableOpacity>

        <Text style={[styles.appVersion, { color: theme.textSecondary }]}>
          {t('app_version')}
        </Text>

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* ==================================================
          LANGUAGE SELECTOR MODAL
      ================================================== */}
      <Modal
        visible={showLangModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowLangModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={[styles.modalTitle, { color: theme.text }]}>
                  {t('select_language')}
                </Text>
                <Text style={[styles.modalSub, { color: theme.textSecondary }]}>
                  Choose your preferred regional language
                </Text>
              </View>
              <TouchableOpacity
                style={[styles.closeModalBtn, { backgroundColor: isDarkMode ? '#334155' : '#F1F5F9' }]}
                onPress={() => setShowLangModal(false)}
              >
                <Ionicons name="close" size={20} color={theme.text} />
              </TouchableOpacity>
            </View>

            {LANGUAGES.map((lang) => {
              const isSelected = language === lang.code;
              return (
                <TouchableOpacity
                  key={lang.id}
                  style={[
                    styles.langOption,
                    {
                      backgroundColor: isSelected
                        ? isDarkMode
                          ? '#064E3B'
                          : '#E6F8F4'
                        : isDarkMode
                        ? '#0F172A'
                        : '#F8FAFC',
                      borderColor: isSelected ? colors.primary : theme.border,
                    },
                  ]}
                  activeOpacity={0.8}
                  onPress={() => {
                    changeLanguage(lang.code);
                    setShowLangModal(false);
                    showFeedback(`${t('lang_changed_msg')} ${lang.native}! 🌐`);
                  }}
                >
                  <View style={styles.langOptionLeft}>
                    <Text style={styles.flagEmoji}>{lang.flag}</Text>
                    <View>
                      <Text
                        style={[
                          styles.langNativeText,
                          { color: isSelected ? colors.primary : theme.text },
                        ]}
                      >
                        {lang.native}
                      </Text>
                      <Text style={[styles.langSubName, { color: theme.textSecondary }]}>
                        {lang.name}
                      </Text>
                    </View>
                  </View>
                  {isSelected ? (
                    <Ionicons name="checkmark-circle" size={22} color={colors.primary} />
                  ) : (
                    <View style={[styles.radioCircle, { borderColor: theme.border }]} />
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      </Modal>

      {/* ==================================================
          CHANGE PASSWORD MODAL
      ================================================== */}
      <Modal
        visible={showPasswordModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowPasswordModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={[styles.modalTitle, { color: theme.text }]}>
                  {t('change_password')}
                </Text>
                <Text style={[styles.modalSub, { color: theme.textSecondary }]}>
                  Secure your healthcare records & account
                </Text>
              </View>
              <TouchableOpacity
                style={[styles.closeModalBtn, { backgroundColor: isDarkMode ? '#334155' : '#F1F5F9' }]}
                onPress={() => setShowPasswordModal(false)}
              >
                <Ionicons name="close" size={20} color={theme.text} />
              </TouchableOpacity>
            </View>

            {/* CURRENT PASSWORD */}
            <Text style={[styles.inputLabel, { color: theme.textSecondary }]}>
              {t('current_password')}
            </Text>
            <View style={[styles.inputBoxWrap, { backgroundColor: theme.inputBg, borderColor: theme.border }]}>
              <TextInput
                style={[styles.modalInput, { color: theme.text }]}
                placeholder="Enter current password"
                placeholderTextColor={theme.textSecondary}
                secureTextEntry={!showOldPass}
                value={oldPassword}
                onChangeText={setOldPassword}
              />
              <TouchableOpacity onPress={() => setShowOldPass(!showOldPass)}>
                <Ionicons
                  name={showOldPass ? 'eye-off-outline' : 'eye-outline'}
                  size={18}
                  color={theme.textSecondary}
                />
              </TouchableOpacity>
            </View>

            {/* NEW PASSWORD */}
            <Text style={[styles.inputLabel, { color: theme.textSecondary }]}>
              {t('new_password')}
            </Text>
            <View style={[styles.inputBoxWrap, { backgroundColor: theme.inputBg, borderColor: theme.border }]}>
              <TextInput
                style={[styles.modalInput, { color: theme.text }]}
                placeholder="Min 6 characters"
                placeholderTextColor={theme.textSecondary}
                secureTextEntry={!showNewPass}
                value={newPassword}
                onChangeText={setNewPassword}
              />
              <TouchableOpacity onPress={() => setShowNewPass(!showNewPass)}>
                <Ionicons
                  name={showNewPass ? 'eye-off-outline' : 'eye-outline'}
                  size={18}
                  color={theme.textSecondary}
                />
              </TouchableOpacity>
            </View>

            {/* CONFIRM PASSWORD */}
            <Text style={[styles.inputLabel, { color: theme.textSecondary }]}>
              {t('confirm_password')}
            </Text>
            <View style={[styles.inputBoxWrap, { backgroundColor: theme.inputBg, borderColor: theme.border }]}>
              <TextInput
                style={[styles.modalInput, { color: theme.text }]}
                placeholder="Re-enter new password"
                placeholderTextColor={theme.textSecondary}
                secureTextEntry={!showConfirmPass}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
              />
              <TouchableOpacity onPress={() => setShowConfirmPass(!showConfirmPass)}>
                <Ionicons
                  name={showConfirmPass ? 'eye-off-outline' : 'eye-outline'}
                  size={18}
                  color={theme.textSecondary}
                />
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={styles.savePassBtn}
              activeOpacity={0.85}
              onPress={handleUpdatePassword}
            >
              <Text style={styles.savePassText}>{t('update_password_btn')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

export default SettingsScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    minHeight: 60,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    borderBottomWidth: 1,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitleWrap: {
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '900',
  },
  headerSubtitle: {
    fontSize: 10,
    fontWeight: '600',
    marginTop: 2,
  },
  toastBanner: {
    backgroundColor: '#0F766E',
    paddingVertical: 10,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  toastText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
  },
  scrollContent: {
    padding: 16,
  },
  sectionHeader: {
    fontSize: 11,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 8,
    marginTop: 10,
  },
  card: {
    borderRadius: 18,
    padding: 14,
    marginBottom: 16,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 6,
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  iconWrap: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  settingInfo: {
    flex: 1,
  },
  titleWithBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  settingTitle: {
    fontSize: 13,
    fontWeight: '800',
  },
  modeBadge: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
  },
  modeBadgeText: {
    fontSize: 9,
    fontWeight: '900',
  },
  settingSub: {
    fontSize: 11,
    marginTop: 2,
    fontWeight: '500',
  },
  divider: {
    height: 1,
    marginVertical: 10,
  },
  langRightWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  activeLangPill: {
    backgroundColor: '#CCFBF1',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  activeLangPillText: {
    color: '#0F766E',
    fontSize: 11,
    fontWeight: '900',
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 14,
    marginTop: 8,
    borderWidth: 1,
  },
  logoutText: {
    color: '#DC2626',
    fontSize: 13,
    fontWeight: '800',
  },
  appVersion: {
    textAlign: 'center',
    fontSize: 11,
    marginTop: 18,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 20,
    borderWidth: 1,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingBottom: 10,
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '900',
  },
  modalSub: {
    fontSize: 11,
    marginTop: 2,
  },
  closeModalBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  langOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
    borderRadius: 14,
    marginBottom: 10,
    borderWidth: 1.5,
  },
  langOptionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  flagEmoji: {
    fontSize: 22,
  },
  langNativeText: {
    fontSize: 14,
    fontWeight: '800',
  },
  langSubName: {
    fontSize: 11,
    marginTop: 2,
    fontWeight: '500',
  },
  radioCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
  },
  inputLabel: {
    fontSize: 11,
    fontWeight: '800',
    marginTop: 10,
    marginBottom: 6,
    textTransform: 'uppercase',
  },
  inputBoxWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 48,
  },
  modalInput: {
    flex: 1,
    fontSize: 13,
    fontWeight: '600',
  },
  savePassBtn: {
    backgroundColor: '#00B894',
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
    marginTop: 20,
    shadowColor: '#00B894',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  savePassText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '900',
  },
});
