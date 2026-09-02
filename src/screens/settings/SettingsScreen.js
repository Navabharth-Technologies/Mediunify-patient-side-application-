import React, { useState } from 'react';
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
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import colors from '../../theme/colors';

const LANGUAGES = [
  { id: 'en', name: 'English (Default)' },
  { id: 'kn', name: 'ಕನ್ನಡ (Kannada)' },
  { id: 'hi', name: 'हिन्दी (Hindi)' },
  { id: 'te', name: 'తెలుగు (Telugu)' },
  { id: 'ta', name: 'தமிழ் (Tamil)' },
];

const SettingsScreen = ({ navigation }) => {
  // Notification toggles
  const [pushNotifs, setPushNotifs] = useState(true);
  const [whatsappUpdates, setWhatsappUpdates] = useState(true);
  const [smsAlerts, setSmsAlerts] = useState(false);

  // Security toggles
  const [biometricEnabled, setBiometricEnabled] = useState(true);
  const [darkMode, setDarkMode] = useState(false);

  // Language state
  const [selectedLanguage, setSelectedLanguage] = useState('English (Default)');
  const [showLangModal, setShowLangModal] = useState(false);

  // Password Modal
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const handleClearCache = () => {
    Alert.alert('Clear Cache', 'Do you want to clear temporary offline cache and cached images (28.4 MB)?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Clear',
        style: 'destructive',
        onPress: () => Alert.alert('Cache Cleared! 🧹', '28.4 MB temporary storage freed.'),
      },
    ]);
  };

  const handleUpdatePassword = () => {
    if (!oldPassword || !newPassword || !confirmPassword) {
      Alert.alert('Error', 'Please fill all password fields.');
      return;
    }
    if (newPassword !== confirmPassword) {
      Alert.alert('Error', 'New password and confirm password do not match.');
      return;
    }
    setShowPasswordModal(false);
    setOldPassword('');
    setNewPassword('');
    setConfirmPassword('');
    Alert.alert('Password Updated! 🔒', 'Your account password has been changed successfully.');
  };

  const handleLogout = () => {
    Alert.alert('Logout', 'Are you sure you want to logout from Unnathi Healthcare?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Logout',
        style: 'destructive',
        onPress: () => {
          navigation.getParent()?.reset({
            index: 0,
            routes: [{ name: 'Auth' }],
          });
        },
      },
    ]);
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => navigation.goBack()}
          activeOpacity={0.8}
        >
          <Ionicons name="arrow-back" size={22} color={colors.secondary} />
        </TouchableOpacity>

        <View style={styles.headerTitleWrap}>
          <Text style={styles.headerTitle}>App Settings</Text>
          <Text style={styles.headerSubtitle}>Preferences, security & system</Text>
        </View>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* NOTIFICATIONS SECTION */}
        <Text style={styles.sectionHeader}>Notifications & Alerts</Text>
        <View style={styles.card}>
          <View style={styles.settingRow}>
            <View style={styles.settingLeft}>
              <Ionicons name="notifications-outline" size={20} color={colors.primary} />
              <View style={styles.settingInfo}>
                <Text style={styles.settingTitle}>Push Notifications</Text>
                <Text style={styles.settingSub}>Appointment reminders & health tips</Text>
              </View>
            </View>
            <Switch
              value={pushNotifs}
              onValueChange={setPushNotifs}
              trackColor={{ false: '#E0E0E0', true: '#B3EFE6' }}
              thumbColor={pushNotifs ? colors.primary : '#FFFFFF'}
            />
          </View>

          <View style={styles.divider} />

          <View style={styles.settingRow}>
            <View style={styles.settingLeft}>
              <Ionicons name="logo-whatsapp" size={20} color="#25D366" />
              <View style={styles.settingInfo}>
                <Text style={styles.settingTitle}>WhatsApp Prescription & Bills</Text>
                <Text style={styles.settingSub}>Receive order tracking on WhatsApp</Text>
              </View>
            </View>
            <Switch
              value={whatsappUpdates}
              onValueChange={setWhatsappUpdates}
              trackColor={{ false: '#E0E0E0', true: '#B3EFE6' }}
              thumbColor={whatsappUpdates ? colors.primary : '#FFFFFF'}
            />
          </View>

          <View style={styles.divider} />

          <View style={styles.settingRow}>
            <View style={styles.settingLeft}>
              <Ionicons name="chatbubble-ellipses-outline" size={20} color={colors.secondary} />
              <View style={styles.settingInfo}>
                <Text style={styles.settingTitle}>SMS Notifications</Text>
                <Text style={styles.settingSub}>Critical OTPs and hospital confirmations</Text>
              </View>
            </View>
            <Switch
              value={smsAlerts}
              onValueChange={setSmsAlerts}
              trackColor={{ false: '#E0E0E0', true: '#B3EFE6' }}
              thumbColor={smsAlerts ? colors.primary : '#FFFFFF'}
            />
          </View>
        </View>

        {/* SECURITY SECTION */}
        <Text style={styles.sectionHeader}>Security & Authentication</Text>
        <View style={styles.card}>
          <TouchableOpacity
            style={styles.settingRow}
            activeOpacity={0.7}
            onPress={() => setShowPasswordModal(true)}
          >
            <View style={styles.settingLeft}>
              <Ionicons name="key-outline" size={20} color={colors.primary} />
              <View style={styles.settingInfo}>
                <Text style={styles.settingTitle}>Change Password</Text>
                <Text style={styles.settingSub}>Update your account login password</Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={18} color={colors.slate} />
          </TouchableOpacity>

          <View style={styles.divider} />

          <View style={styles.settingRow}>
            <View style={styles.settingLeft}>
              <Ionicons name="finger-print-outline" size={20} color={colors.primary} />
              <View style={styles.settingInfo}>
                <Text style={styles.settingTitle}>Biometric & Face ID Unlock</Text>
                <Text style={styles.settingSub}>Fast biometric authentication</Text>
              </View>
            </View>
            <Switch
              value={biometricEnabled}
              onValueChange={setBiometricEnabled}
              trackColor={{ false: '#E0E0E0', true: '#B3EFE6' }}
              thumbColor={biometricEnabled ? colors.primary : '#FFFFFF'}
            />
          </View>
        </View>

        {/* PREFERENCES & LANGUAGE */}
        <Text style={styles.sectionHeader}>Regional & Display</Text>
        <View style={styles.card}>
          <TouchableOpacity
            style={styles.settingRow}
            activeOpacity={0.7}
            onPress={() => setShowLangModal(true)}
          >
            <View style={styles.settingLeft}>
              <Ionicons name="language-outline" size={20} color={colors.primary} />
              <View style={styles.settingInfo}>
                <Text style={styles.settingTitle}>App Language</Text>
                <Text style={styles.settingSub}>{selectedLanguage}</Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={18} color={colors.slate} />
          </TouchableOpacity>

          <View style={styles.divider} />

          <View style={styles.settingRow}>
            <View style={styles.settingLeft}>
              <Ionicons name="moon-outline" size={20} color={colors.secondary} />
              <View style={styles.settingInfo}>
                <Text style={styles.settingTitle}>Dark Mode (Beta)</Text>
                <Text style={styles.settingSub}>Switch between light and dark themes</Text>
              </View>
            </View>
            <Switch
              value={darkMode}
              onValueChange={setDarkMode}
              trackColor={{ false: '#E0E0E0', true: '#B3EFE6' }}
              thumbColor={darkMode ? colors.primary : '#FFFFFF'}
            />
          </View>
        </View>

        {/* STORAGE & DATA */}
        <Text style={styles.sectionHeader}>Data & Storage</Text>
        <View style={styles.card}>
          <TouchableOpacity
            style={styles.settingRow}
            activeOpacity={0.7}
            onPress={handleClearCache}
          >
            <View style={styles.settingLeft}>
              <Ionicons name="trash-bin-outline" size={20} color="#E53935" />
              <View style={styles.settingInfo}>
                <Text style={styles.settingTitle}>Clear App Cache</Text>
                <Text style={styles.settingSub}>Free up 28.4 MB of temporary storage</Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={18} color={colors.slate} />
          </TouchableOpacity>
        </View>

        {/* LOGOUT & ACCOUNT */}
        <TouchableOpacity
          style={styles.logoutBtn}
          activeOpacity={0.85}
          onPress={handleLogout}
        >
          <Ionicons name="log-out-outline" size={20} color="#E53935" />
          <Text style={styles.logoutText}>Log Out of Unnathi Care</Text>
        </TouchableOpacity>

        <Text style={styles.appVersion}>Unnathi OneCare Healthcare App • v2.4.0 (Build 418)</Text>

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* LANGUAGE SELECTOR MODAL */}
      <Modal
        visible={showLangModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowLangModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select App Language</Text>
              <TouchableOpacity onPress={() => setShowLangModal(false)}>
                <Ionicons name="close" size={22} color={colors.secondary} />
              </TouchableOpacity>
            </View>

            {LANGUAGES.map((lang) => (
              <TouchableOpacity
                key={lang.id}
                style={styles.langOption}
                activeOpacity={0.8}
                onPress={() => {
                  setSelectedLanguage(lang.name);
                  setShowLangModal(false);
                }}
              >
                <Text
                  style={[
                    styles.langText,
                    selectedLanguage === lang.name && styles.langTextActive,
                  ]}
                >
                  {lang.name}
                </Text>
                {selectedLanguage === lang.name && (
                  <Ionicons name="checkmark-circle" size={20} color={colors.primary} />
                )}
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </Modal>

      {/* CHANGE PASSWORD MODAL */}
      <Modal
        visible={showPasswordModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowPasswordModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Change Password</Text>
              <TouchableOpacity onPress={() => setShowPasswordModal(false)}>
                <Ionicons name="close" size={22} color={colors.secondary} />
              </TouchableOpacity>
            </View>

            <Text style={styles.inputLabel}>Current Password</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="Enter current password"
              secureTextEntry
              value={oldPassword}
              onChangeText={setOldPassword}
            />

            <Text style={styles.inputLabel}>New Password</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="Min 8 characters"
              secureTextEntry
              value={newPassword}
              onChangeText={setNewPassword}
            />

            <Text style={styles.inputLabel}>Confirm New Password</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="Re-enter new password"
              secureTextEntry
              value={confirmPassword}
              onChangeText={setConfirmPassword}
            />

            <TouchableOpacity
              style={styles.savePassBtn}
              activeOpacity={0.85}
              onPress={handleUpdatePassword}
            >
              <Text style={styles.savePassText}>Update Password</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F4F8FA',
  },
  header: {
    minHeight: 60,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F4F8FA',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitleWrap: {
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '900',
    color: colors.secondary,
  },
  headerSubtitle: {
    fontSize: 10,
    color: colors.slate,
    fontWeight: '600',
  },
  scrollContent: {
    padding: 16,
  },
  sectionHeader: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.slate,
    textTransform: 'uppercase',
    marginBottom: 8,
    marginTop: 10,
  },
  card: {
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: 14,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: colors.border,
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
  settingInfo: {
    flex: 1,
  },
  settingTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: colors.secondary,
  },
  settingSub: {
    fontSize: 10,
    color: colors.slate,
    marginTop: 2,
  },
  divider: {
    height: 1,
    backgroundColor: '#F0F4F6',
    marginVertical: 10,
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFF0F0',
    height: 48,
    borderRadius: 14,
    gap: 8,
    marginTop: 12,
    borderWidth: 1,
    borderColor: '#FFD6D6',
  },
  logoutText: {
    fontSize: 13,
    fontWeight: '900',
    color: '#E53935',
  },
  appVersion: {
    textAlign: 'center',
    fontSize: 10,
    color: colors.slate,
    marginTop: 18,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: colors.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '900',
    color: colors.secondary,
  },
  langOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F4F6',
  },
  langText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.secondary,
  },
  langTextActive: {
    color: colors.primary,
    fontWeight: '900',
  },
  inputLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: colors.slate,
    marginBottom: 4,
    marginTop: 8,
    textTransform: 'uppercase',
  },
  modalInput: {
    backgroundColor: '#F8FAFB',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 12,
    height: 44,
    fontSize: 13,
    color: colors.secondary,
    fontWeight: '600',
    marginBottom: 8,
  },
  savePassBtn: {
    backgroundColor: colors.primary,
    height: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
    marginBottom: 16,
  },
  savePassText: {
    color: colors.white,
    fontSize: 13,
    fontWeight: '900',
  },
});

export default SettingsScreen;
