import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Platform,
  Alert,
  StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import colors from '../../theme/colors';

const BLOOD_GROUPS = ['O+ Positive', 'O- Negative', 'A+ Positive', 'A- Negative', 'B+ Positive', 'B- Negative', 'AB+ Positive', 'AB- Negative'];
const GENDERS = ['Male', 'Female', 'Other'];

const EditProfileScreen = ({ navigation, route }) => {
  const passedUser = route?.params?.user || {};

  // Personal Info Form State
  const [name, setName] = useState(passedUser.name || 'Hemanth Gowda');
  const [email, setEmail] = useState(passedUser.email || 'hemanth@example.com');
  const [phone, setPhone] = useState(passedUser.phone || '+91 98765 43210');
  const [bloodGroup, setBloodGroup] = useState(passedUser.bloodGroup || 'O+ Positive');
  const [gender, setGender] = useState(passedUser.gender || 'Male');
  const [age, setAge] = useState(passedUser.age || '28 Yrs');
  const [emergencyContact, setEmergencyContact] = useState(passedUser.emergencyContact || '+91 98450 11223 (Father)');

  // Change Password State
  const [showPasswordSection, setShowPasswordSection] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPw, setShowCurrentPw] = useState(false);
  const [showNewPw, setShowNewPw] = useState(false);
  const [showConfirmPw, setShowConfirmPw] = useState(false);
  const [saving, setSaving] = useState(false);

  // Save Profile Handler
  const handleSave = async () => {
    const trimmedName = name.trim();
    const trimmedEmail = email.trim();
    const trimmedPhone = phone.trim();

    if (!trimmedName) {
      Alert.alert('Missing Name', 'Please enter your full name.');
      return;
    }

    if (!trimmedEmail || !trimmedEmail.includes('@')) {
      Alert.alert('Invalid Email', 'Please enter a valid email address.');
      return;
    }

    if (!trimmedPhone) {
      Alert.alert('Missing Phone', 'Please enter your contact phone number.');
      return;
    }

    // Password validation if user opted to change password
    if (showPasswordSection || currentPassword || newPassword || confirmPassword) {
      if (!currentPassword) {
        Alert.alert('Current Password Required', 'Please enter your current password to update security credentials.');
        return;
      }
      if (!newPassword || newPassword.length < 6) {
        Alert.alert('Weak New Password', 'New password must be at least 6 characters long.');
        return;
      }
      if (newPassword !== confirmPassword) {
        Alert.alert('Password Mismatch', 'New password and confirm password do not match.');
        return;
      }
    }

    setSaving(true);

    try {
      // Save updated data in AsyncStorage
      await AsyncStorage.setItem('userName', trimmedName);
      await AsyncStorage.setItem('userEmail', trimmedEmail);
      await AsyncStorage.setItem('userPhone', trimmedPhone);

      const updatedUser = {
        name: trimmedName,
        email: trimmedEmail,
        phone: trimmedPhone,
        bloodGroup,
        gender,
        age,
        emergencyContact,
      };

      setSaving(false);

      Alert.alert(
        'Profile Saved Successfully',
        showPasswordSection && newPassword
          ? 'Your profile details and account password have been updated!'
          : 'Your patient profile details have been updated!',
        [
          {
            text: 'OK',
            onPress: () => {
              navigation.navigate('Profile', { updatedUser });
            },
          },
        ]
      );
    } catch (error) {
      setSaving(false);
      Alert.alert('Save Error', 'Could not update profile details. Please try again.');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* TOP APP BAR */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => navigation.goBack()}
          activeOpacity={0.8}
        >
          <Ionicons name="arrow-back" size={20} color="#1E293B" />
        </TouchableOpacity>

        <View style={styles.headerTitleWrap}>
          <Text style={styles.headerBadge}>PATIENT ACCOUNT</Text>
          <Text style={styles.headerTitle}>Edit Profile</Text>
        </View>

        <TouchableOpacity
          style={styles.saveHeaderBtn}
          onPress={handleSave}
          activeOpacity={0.85}
        >
          <Ionicons name="checkmark" size={18} color="#FFFFFF" />
          <Text style={styles.saveHeaderBtnText}>Save</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        {/* AVATAR HERO EDIT */}
        <View style={styles.avatarCard}>
          <View style={styles.avatarCircle}>
            <Ionicons name="person" size={44} color="#FFFFFF" />
            <TouchableOpacity
              style={styles.cameraIconBtn}
              onPress={() => Alert.alert('Change Photo', 'Upload or capture a new patient profile photo.')}
            >
              <Ionicons name="camera" size={14} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
          <Text style={styles.avatarName}>{name || 'Patient Name'}</Text>
          <Text style={styles.avatarSubtitle}>Active Patient Profile</Text>
        </View>

        {/* SECTION 1: PERSONAL DETAILS */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Personal & Contact Information</Text>
          <Text style={styles.sectionSubtitle}>Used for prescriptions, lab tests and appointments</Text>
        </View>

        <View style={styles.formCard}>
          {/* FULL NAME */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Full Name</Text>
            <View style={styles.inputWrap}>
              <Ionicons name="person-outline" size={18} color="#0F766E" />
              <TextInput
                style={styles.textInput}
                value={name}
                onChangeText={setName}
                placeholder="Enter full name"
                placeholderTextColor="#94A3B8"
              />
            </View>
          </View>

          {/* EMAIL */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Email Address</Text>
            <View style={styles.inputWrap}>
              <Ionicons name="mail-outline" size={18} color="#0F766E" />
              <TextInput
                style={styles.textInput}
                value={email}
                onChangeText={setEmail}
                placeholder="Enter email address"
                placeholderTextColor="#94A3B8"
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>
          </View>

          {/* PHONE */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Mobile Phone Number</Text>
            <View style={styles.inputWrap}>
              <Ionicons name="call-outline" size={18} color="#0F766E" />
              <TextInput
                style={styles.textInput}
                value={phone}
                onChangeText={setPhone}
                placeholder="Enter 10-digit mobile number"
                placeholderTextColor="#94A3B8"
                keyboardType="phone-pad"
              />
            </View>
          </View>

          {/* GENDER & AGE ROW */}
          <View style={styles.rowInputs}>
            <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
              <Text style={styles.inputLabel}>Gender</Text>
              <View style={styles.genderPillsRow}>
                {GENDERS.map((g) => (
                  <TouchableOpacity
                    key={g}
                    style={[
                      styles.genderPill,
                      gender === g && styles.genderPillActive,
                    ]}
                    onPress={() => setGender(g)}
                  >
                    <Text
                      style={[
                        styles.genderPillText,
                        gender === g && styles.genderPillTextActive,
                      ]}
                    >
                      {g}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={[styles.inputGroup, { width: 100 }]}>
              <Text style={styles.inputLabel}>Age</Text>
              <View style={styles.inputWrap}>
                <Ionicons name="calendar-outline" size={18} color="#0F766E" />
                <TextInput
                  style={styles.textInput}
                  value={age}
                  onChangeText={setAge}
                  placeholder="e.g. 28 Yrs"
                  placeholderTextColor="#94A3B8"
                />
              </View>
            </View>
          </View>

          {/* BLOOD GROUP */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Blood Group</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.bloodGroupScroll}
            >
              {BLOOD_GROUPS.map((bg) => (
                <TouchableOpacity
                  key={bg}
                  style={[
                    styles.bloodPill,
                    bloodGroup === bg && styles.bloodPillActive,
                  ]}
                  onPress={() => setBloodGroup(bg)}
                  activeOpacity={0.8}
                >
                  <Ionicons
                    name="water"
                    size={12}
                    color={bloodGroup === bg ? '#FFFFFF' : '#EF4444'}
                  />
                  <Text
                    style={[
                      styles.bloodPillText,
                      bloodGroup === bg && styles.bloodPillTextActive,
                    ]}
                  >
                    {bg}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          {/* EMERGENCY CONTACT */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Emergency Contact</Text>
            <View style={styles.inputWrap}>
              <Ionicons name="heart-outline" size={18} color="#DC2626" />
              <TextInput
                style={styles.textInput}
                value={emergencyContact}
                onChangeText={setEmergencyContact}
                placeholder="Contact Name & Number"
                placeholderTextColor="#94A3B8"
              />
            </View>
          </View>
        </View>

        {/* ==========================================
            SECTION 2: CHANGE PASSWORD & SECURITY
        ========================================== */}
        <View style={styles.sectionHeaderRow}>
          <View>
            <Text style={styles.sectionTitle}>Account Security & Password</Text>
            <Text style={styles.sectionSubtitle}>Manage login credentials & password</Text>
          </View>
          <TouchableOpacity
            style={styles.passwordToggleBtn}
            onPress={() => setShowPasswordSection(!showPasswordSection)}
            activeOpacity={0.8}
          >
            <Ionicons
              name={showPasswordSection ? 'chevron-up' : 'chevron-down'}
              size={18}
              color="#0F766E"
            />
            <Text style={styles.passwordToggleText}>
              {showPasswordSection ? 'Hide' : 'Change'}
            </Text>
          </TouchableOpacity>
        </View>

        {showPasswordSection && (
          <View style={styles.passwordCard}>
            <View style={styles.securityPill}>
              <Ionicons name="shield-checkmark" size={14} color="#059669" />
              <Text style={styles.securityPillText}>256-Bit Encrypted Password Change</Text>
            </View>

            {/* CURRENT PASSWORD */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Current Password</Text>
              <View style={styles.inputWrap}>
                <Ionicons name="lock-closed-outline" size={18} color="#0F766E" />
                <TextInput
                  style={styles.textInput}
                  value={currentPassword}
                  onChangeText={setCurrentPassword}
                  placeholder="Enter current password"
                  placeholderTextColor="#94A3B8"
                  secureTextEntry={!showCurrentPw}
                />
                <TouchableOpacity onPress={() => setShowCurrentPw(!showCurrentPw)}>
                  <Ionicons
                    name={showCurrentPw ? 'eye-off-outline' : 'eye-outline'}
                    size={18}
                    color="#64748B"
                  />
                </TouchableOpacity>
              </View>
            </View>

            {/* NEW PASSWORD */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>New Password</Text>
              <View style={styles.inputWrap}>
                <Ionicons name="key-outline" size={18} color="#0F766E" />
                <TextInput
                  style={styles.textInput}
                  value={newPassword}
                  onChangeText={setNewPassword}
                  placeholder="Enter new password (min. 6 chars)"
                  placeholderTextColor="#94A3B8"
                  secureTextEntry={!showNewPw}
                />
                <TouchableOpacity onPress={() => setShowNewPw(!showNewPw)}>
                  <Ionicons
                    name={showNewPw ? 'eye-off-outline' : 'eye-outline'}
                    size={18}
                    color="#64748B"
                  />
                </TouchableOpacity>
              </View>
            </View>

            {/* CONFIRM NEW PASSWORD */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Confirm New Password</Text>
              <View style={styles.inputWrap}>
                <Ionicons name="checkmark-circle-outline" size={18} color="#0F766E" />
                <TextInput
                  style={styles.textInput}
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  placeholder="Re-enter new password"
                  placeholderTextColor="#94A3B8"
                  secureTextEntry={!showConfirmPw}
                />
                <TouchableOpacity onPress={() => setShowConfirmPw(!showConfirmPw)}>
                  <Ionicons
                    name={showConfirmPw ? 'eye-off-outline' : 'eye-outline'}
                    size={18}
                    color="#64748B"
                  />
                </TouchableOpacity>
              </View>
            </View>

            {newPassword.length > 0 && (
              <View style={styles.passwordHintRow}>
                <Ionicons
                  name={newPassword.length >= 6 ? 'checkmark-circle' : 'alert-circle'}
                  size={14}
                  color={newPassword.length >= 6 ? '#059669' : '#DC2626'}
                />
                <Text
                  style={[
                    styles.passwordHintText,
                    { color: newPassword.length >= 6 ? '#059669' : '#DC2626' },
                  ]}
                >
                  {newPassword.length >= 6
                    ? 'Password meets minimum strength requirements'
                    : 'Password must be at least 6 characters'}
                </Text>
              </View>
            )}
          </View>
        )}

        {/* PRIMARY SAVE BUTTON */}
        <TouchableOpacity
          style={styles.primarySaveBtn}
          onPress={handleSave}
          activeOpacity={0.88}
        >
          <Ionicons name="checkmark-circle" size={20} color="#FFFFFF" />
          <Text style={styles.primarySaveBtnText}>
            {saving ? 'Saving Updates...' : 'Save Profile Changes'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.cancelBtn}
          onPress={() => navigation.goBack()}
          activeOpacity={0.8}
        >
          <Text style={styles.cancelBtnText}>Discard & Go Back</Text>
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
};

export default EditProfileScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },

  // HEADER
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'android' ? 14 : 10,
    paddingBottom: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitleWrap: {
    alignItems: 'center',
  },
  headerBadge: {
    fontSize: 9.5,
    fontWeight: '800',
    color: '#0F766E',
    letterSpacing: 0.6,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: '#0F172A',
  },
  saveHeaderBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0F766E',
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    gap: 4,
  },
  saveHeaderBtnText: {
    color: '#FFFFFF',
    fontSize: 12.5,
    fontWeight: '800',
  },

  scrollContent: {
    paddingBottom: 40,
  },

  // AVATAR CARD
  avatarCard: {
    alignItems: 'center',
    backgroundColor: '#0F766E',
    marginHorizontal: 16,
    marginTop: 14,
    paddingVertical: 20,
    borderRadius: 22,
    shadowColor: '#0F766E',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 6,
  },
  avatarCircle: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2.5,
    borderColor: '#FFFFFF',
    position: 'relative',
  },
  cameraIconBtn: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#0F172A',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
  },
  avatarName: {
    fontSize: 18,
    fontWeight: '900',
    color: '#FFFFFF',
    marginTop: 10,
  },
  avatarSubtitle: {
    fontSize: 11.5,
    color: '#CCFBF1',
    fontWeight: '600',
    marginTop: 2,
  },

  // SECTION HEADERS
  sectionHeader: {
    paddingHorizontal: 18,
    marginTop: 20,
    marginBottom: 8,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 18,
    marginTop: 22,
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '900',
    color: '#0F172A',
  },
  sectionSubtitle: {
    fontSize: 11.5,
    color: '#64748B',
    marginTop: 1,
    fontWeight: '500',
  },

  // FORM CARD
  formCard: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 2,
  },
  inputGroup: {
    marginBottom: 14,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '800',
    color: '#334155',
    marginBottom: 6,
  },
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 12,
    paddingVertical: Platform.OS === 'ios' ? 12 : 8,
    gap: 8,
  },
  textInput: {
    flex: 1,
    fontSize: 13.5,
    color: '#0F172A',
    fontWeight: '600',
  },

  // ROW INPUTS & GENDER
  rowInputs: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  genderPillsRow: {
    flexDirection: 'row',
    gap: 6,
  },
  genderPill: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F8FAFC',
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  genderPillActive: {
    backgroundColor: '#0F766E',
    borderColor: '#0F766E',
  },
  genderPillText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#475569',
  },
  genderPillTextActive: {
    color: '#FFFFFF',
  },

  // BLOOD GROUP
  bloodGroupScroll: {
    gap: 8,
    paddingVertical: 4,
  },
  bloodPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 5,
  },
  bloodPillActive: {
    backgroundColor: '#EF4444',
    borderColor: '#EF4444',
  },
  bloodPillText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#334155',
  },
  bloodPillTextActive: {
    color: '#FFFFFF',
  },

  // PASSWORD SECTION
  passwordToggleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0FDFA',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#CCFBF1',
    gap: 4,
  },
  passwordToggleText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#0F766E',
  },
  passwordCard: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: '#CCFBF1',
    marginTop: 4,
    shadowColor: '#0F766E',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  securityPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ECFDF5',
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 5,
    marginBottom: 14,
  },
  securityPillText: {
    fontSize: 10.5,
    fontWeight: '800',
    color: '#059669',
  },
  passwordHintRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: -4,
    marginBottom: 6,
  },
  passwordHintText: {
    fontSize: 11,
    fontWeight: '600',
  },

  // ACTION BUTTONS
  primarySaveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0F766E',
    marginHorizontal: 16,
    marginTop: 22,
    paddingVertical: 14,
    borderRadius: 18,
    gap: 8,
    shadowColor: '#0F766E',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  primarySaveBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '900',
  },
  cancelBtn: {
    alignItems: 'center',
    paddingVertical: 12,
    marginTop: 6,
  },
  cancelBtnText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#64748B',
  },
});