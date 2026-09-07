import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  Alert,
  StatusBar,
  Platform,
  Keyboard,
  KeyboardAvoidingView,
  TouchableWithoutFeedback,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import colors from '../../theme/colors';

const BLOOD_GROUPS = [
  'O+ Positive',
  'O- Negative',
  'A+ Positive',
  'A- Negative',
  'B+ Positive',
  'B- Negative',
  'AB+ Positive',
  'AB- Negative',
];
const GENDERS = ['Male', 'Female', 'Other'];

const EditProfileScreen = ({ navigation, route }) => {
  const passedUser = route?.params?.user || {};

  // Store initial credentials to detect changes requiring OTP verification
  const initialEmail = (passedUser.email || '').trim().toLowerCase();
  const rawInitialPhone = (passedUser.phone || '').replace(/[^0-9]/g, '');
  const initialPhoneDigits = rawInitialPhone.length >= 10 ? rawInitialPhone.slice(-10) : rawInitialPhone;

  // Personal Info Form State
  const [name, setName] = useState(passedUser.name || 'Ramesh Kumar');
  const [email, setEmail] = useState(passedUser.email || 'ramesh.kumar@example.com');
  const [phone, setPhone] = useState(initialPhoneDigits || '9845012345');
  const [dob, setDob] = useState(passedUser.dob || '');
  const [bloodGroup, setBloodGroup] = useState(passedUser.bloodGroup || 'O+ Positive');
  const [gender, setGender] = useState(passedUser.gender || 'Male');
  const [age, setAge] = useState(passedUser.age || '32 Yrs');
  const [emergencyContact, setEmergencyContact] = useState(
    (passedUser.emergencyContact || '').replace(/[^0-9]/g, '').slice(-10) || ''
  );

  // OTP Verification Modal State (when changing Phone or Email)
  const [otpModalVisible, setOtpModalVisible] = useState(false);
  const [securityOtp, setSecurityOtp] = useState('');
  const [otpError, setOtpError] = useState('');

  // Change Password State
  const [showPasswordSection, setShowPasswordSection] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPw, setShowCurrentPw] = useState(false);
  const [showNewPw, setShowNewPw] = useState(false);
  const [showConfirmPw, setShowConfirmPw] = useState(false);
  const [saving, setSaving] = useState(false);

  // Helper: Calculate age from DOB
  const calculateAgeFromDob = (dobStr) => {
    if (!dobStr) return '';
    const parts = dobStr.replace(/[^0-9/\\-]/g, '').split(/[/\\-]/);
    if (parts.length === 3) {
      let day, month, year;
      if (parts[0].length === 4) {
        year = parseInt(parts[0], 10);
        month = parseInt(parts[1], 10) - 1;
        day = parseInt(parts[2], 10);
      } else {
        day = parseInt(parts[0], 10);
        month = parseInt(parts[1], 10) - 1;
        year = parseInt(parts[2], 10);
      }
      if (!isNaN(day) && !isNaN(month) && !isNaN(year) && year > 1900 && year <= new Date().getFullYear()) {
        const birthDate = new Date(year, month, day);
        const today = new Date();
        let calculatedAge = today.getFullYear() - birthDate.getFullYear();
        const m = today.getMonth() - birthDate.getMonth();
        if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
          calculatedAge--;
        }
        if (calculatedAge >= 0 && calculatedAge <= 120) {
          return `${calculatedAge} Yrs`;
        }
      }
    }
    return '';
  };

  const handleDobChange = (text) => {
    const cleaned = text.replace(/[^0-9]/g, '');
    let formatted = cleaned;
    if (cleaned.length > 2 && cleaned.length <= 4) {
      formatted = `${cleaned.slice(0, 2)}/${cleaned.slice(2)}`;
    } else if (cleaned.length > 4) {
      formatted = `${cleaned.slice(0, 2)}/${cleaned.slice(2, 4)}/${cleaned.slice(4, 8)}`;
    }
    setDob(formatted);
    const calculated = calculateAgeFromDob(formatted);
    if (calculated) {
      setAge(calculated);
    }
  };

  // Strictly accept only numeric digits and cap at exactly 10 digits
  const handlePhoneChange = (text) => {
    const cleaned = text.replace(/[^0-9]/g, '').slice(0, 10);
    setPhone(cleaned);
  };

  const handleEmergencyContactChange = (text) => {
    const cleaned = text.replace(/[^0-9]/g, '').slice(0, 10);
    setEmergencyContact(cleaned);
  };

  // Save Profile Handler
  const handleSave = async () => {
    const trimmedName = name.trim();
    const trimmedEmail = email.trim().toLowerCase();
    const cleanPhone10 = phone.replace(/[^0-9]/g, '').slice(0, 10);

    if (!trimmedName) {
      Alert.alert('Missing Name', 'Please enter your full name.');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!trimmedEmail || !emailRegex.test(trimmedEmail)) {
      Alert.alert('Invalid Email', 'Please enter a valid email address.');
      return;
    }

    if (cleanPhone10.length < 10) {
      Alert.alert(
        'Incomplete Mobile Number',
        cleanPhone10.length === 0
          ? 'Please enter your 10-digit mobile number.'
          : `Mobile number must be exactly 10 digits. You entered only ${cleanPhone10.length} digits.`
      );
      return;
    }

    if (!/^[6-9]\d{9}$/.test(cleanPhone10)) {
      Alert.alert(
        'Invalid Mobile Number',
        'Please enter a valid 10-digit mobile number starting with 6, 7, 8, or 9.'
      );
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

    // ----------------------------------------------------
    // CHECK DUPLICATE EMAIL, PHONE & NAME WITH OTHER USERS
    // ----------------------------------------------------
    try {
      const regCredsStr = await AsyncStorage.getItem('@unnathi_registered_credentials');
      let registeredCreds = {};
      if (regCredsStr) {
        try { registeredCreds = JSON.parse(regCredsStr); } catch (e) {}
      }

      const regUsersStr = await AsyncStorage.getItem('@unnathi_registered_users');
      let registeredUsers = {};
      if (regUsersStr) {
        try { registeredUsers = JSON.parse(regUsersStr); } catch (e) {}
      }

      // Check if Email changed and already belongs to another user
      if (trimmedEmail !== initialEmail) {
        const existingEmailEntry = registeredCreds[trimmedEmail] || registeredUsers[trimmedEmail];
        if (existingEmailEntry) {
          const entryPhone = (existingEmailEntry.phone || '').replace(/[^0-9]/g, '').slice(-10);
          const entryEmail = (existingEmailEntry.email || '').trim().toLowerCase();
          // If it does not belong to current user
          if (entryPhone !== initialPhoneDigits && entryEmail !== initialEmail) {
            Alert.alert(
              'Email Already in Use',
              `The email address "${trimmedEmail}" is already registered to another user account. Multiple accounts cannot have the same email address.`
            );
            return;
          }
        }
      }

      // Check if Phone changed and already belongs to another user
      if (cleanPhone10 !== initialPhoneDigits) {
        const existingPhoneEntry = registeredCreds[cleanPhone10] || registeredUsers[cleanPhone10];
        if (existingPhoneEntry) {
          const entryPhone = (existingPhoneEntry.phone || '').replace(/[^0-9]/g, '').slice(-10);
          const entryEmail = (existingPhoneEntry.email || '').trim().toLowerCase();
          // If it does not belong to current user
          if (entryEmail !== initialEmail && entryPhone !== initialPhoneDigits) {
            Alert.alert(
              'Mobile Number Already Registered',
              `The mobile number "+91 ${cleanPhone10}" is already registered to another user account. Multiple accounts cannot share the same phone number.`
            );
            return;
          }
        }
      }

      // Check if Name changed and is taken by another distinct user
      const currentInitialName = (passedUser.name || '').trim().toLowerCase();
      if (trimmedName.toLowerCase() !== currentInitialName) {
        const otherUserNames = Object.entries(registeredUsers)
          .filter(([key, u]) => {
            const uEmail = (u?.email || '').trim().toLowerCase();
            const uPhone = (u?.phone || '').replace(/[^0-9]/g, '').slice(-10);
            return uEmail !== initialEmail && uPhone !== initialPhoneDigits;
          })
          .map(([_, u]) => (u?.name ? u.name.trim().toLowerCase() : ''))
          .filter(Boolean);

        if (otherUserNames.includes(trimmedName.toLowerCase())) {
          Alert.alert(
            'Full Name Already Registered',
            `An account under the name "${trimmedName}" already exists. Please use your unique full name.`
          );
          return;
        }
      }
    } catch (err) {
      console.log('Duplicate check warning:', err);
    }

    // Check if Email OR Phone changed from initial credentials
    const isEmailChanged = initialEmail && trimmedEmail !== initialEmail;
    const isPhoneChanged = initialPhoneDigits && cleanPhone10 !== initialPhoneDigits;

    if (isEmailChanged || isPhoneChanged) {
      // Prompt OTP Verification Modal before saving credentials change
      setSecurityOtp('');
      setOtpError('');
      setOtpModalVisible(true);
      return;
    }

    // If contact credentials haven't changed, save directly
    performProfileUpdate();
  };

  // Perform actual profile update in storage
  const performProfileUpdate = async () => {
    setSaving(true);
    const trimmedName = name.trim();
    const trimmedEmail = email.trim().toLowerCase();
    const cleanPhone10 = phone.replace(/[^0-9]/g, '').slice(0, 10);
    const formattedPhone = `+91 ${cleanPhone10}`;
    const cleanEmergency10 = emergencyContact.replace(/[^0-9]/g, '').slice(0, 10);
    const formattedEmergency = cleanEmergency10 ? `+91 ${cleanEmergency10} (Emergency)` : `${formattedPhone} (Family)`;

    try {
      const calculatedAge = calculateAgeFromDob(dob);
      const finalAge = calculatedAge || age || '28 Yrs';

      const updatedUser = {
        name: trimmedName,
        email: trimmedEmail,
        phone: formattedPhone,
        dob,
        bloodGroup,
        gender,
        age: finalAge,
        emergencyContact: formattedEmergency,
      };

      // Save updated data in AsyncStorage
      await AsyncStorage.setItem('userName', trimmedName);
      await AsyncStorage.setItem('userEmail', trimmedEmail);
      await AsyncStorage.setItem('userPhone', formattedPhone);
      await AsyncStorage.setItem('user', JSON.stringify(updatedUser));
      await AsyncStorage.setItem('@unnathi_primary_user', JSON.stringify(updatedUser));

      // Keep registered users dictionary in sync (remove old keys if changed)
      const regUsersStr = await AsyncStorage.getItem('@unnathi_registered_users');
      let registeredUsers = {};
      if (regUsersStr) {
        try {
          registeredUsers = JSON.parse(regUsersStr);
        } catch (e) {}
      }
      if (initialEmail && initialEmail !== trimmedEmail) {
        delete registeredUsers[initialEmail];
      }
      if (initialPhoneDigits && initialPhoneDigits !== cleanPhone10) {
        delete registeredUsers[initialPhoneDigits];
      }
      registeredUsers[trimmedEmail] = updatedUser;
      registeredUsers[cleanPhone10] = updatedUser;
      await AsyncStorage.setItem('@unnathi_registered_users', JSON.stringify(registeredUsers));

      // Keep registered credentials in sync (remove old keys if changed)
      const regCredsStr = await AsyncStorage.getItem('@unnathi_registered_credentials');
      let registeredCreds = {};
      if (regCredsStr) {
        try {
          registeredCreds = JSON.parse(regCredsStr);
        } catch (e) {}
      }
      const existingCred = registeredCreds[initialEmail] || registeredCreds[initialPhoneDigits] || registeredCreds[trimmedEmail] || registeredCreds[cleanPhone10] || {};
      const updatedCred = {
        ...existingCred,
        email: trimmedEmail,
        phone: cleanPhone10,
        password: (showPasswordSection && newPassword) ? newPassword.trim() : (existingCred.password || '123456'),
        userData: updatedUser,
        updatedAt: Date.now(),
      };
      if (initialEmail && initialEmail !== trimmedEmail) {
        delete registeredCreds[initialEmail];
      }
      if (initialPhoneDigits && initialPhoneDigits !== cleanPhone10) {
        delete registeredCreds[initialPhoneDigits];
      }
      registeredCreds[trimmedEmail] = updatedCred;
      registeredCreds[cleanPhone10] = updatedCred;
      await AsyncStorage.setItem('@unnathi_registered_credentials', JSON.stringify(registeredCreds));

      // Sync family members self profile
      const savedFam = await AsyncStorage.getItem('@unnathi_family_members');
      if (savedFam) {
        try {
          const parsed = JSON.parse(savedFam);
          if (Array.isArray(parsed) && parsed.length > 0) {
            const updatedFam = parsed.map((m) => {
              if (m.id === 'self' || m.isPrimary || m.relation === 'Self') {
                return {
                  ...m,
                  name: `${trimmedName} (Self)`,
                  displayName: `${trimmedName.split(' ')[0]} (Self)`,
                  age: finalAge,
                  gender: gender || m.gender,
                  bloodGroup: bloodGroup ? bloodGroup.split(' ')[0] : m.bloodGroup,
                };
              }
              return m;
            });
            await AsyncStorage.setItem('@unnathi_family_members', JSON.stringify(updatedFam));
          }
        } catch (e) {}
      }

      setSaving(false);
      setOtpModalVisible(false);

      Alert.alert(
        'Profile Saved Successfully 🎉',
        'Your profile details have been verified and updated!',
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

  const handleVerifyOtpAndSubmit = () => {
    if (securityOtp.trim() === '123456') {
      performProfileUpdate();
    } else {
      setOtpError('Invalid OTP code. Please enter demo OTP 123456.');
    }
  };

  const isEmailChanged = initialEmail && email.trim().toLowerCase() !== initialEmail;
  const isPhoneChanged = initialPhoneDigits && phone.replace(/[^0-9]/g, '').slice(0, 10) !== initialPhoneDigits;

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
              <Ionicons name="person-outline" size={18} color={colors.teal} />
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
            <View style={styles.labelRow}>
              <Text style={styles.inputLabel}>Email Address</Text>
              {isEmailChanged ? (
                <View style={styles.otpBadgeTag}>
                  <Ionicons name="key-outline" size={11} color="#0284C7" />
                  <Text style={styles.otpBadgeTagText}>OTP Required to change</Text>
                </View>
              ) : null}
            </View>
            <View style={[styles.inputWrap, isEmailChanged && styles.inputWrapHighlight]}>
              <Ionicons name="mail-outline" size={18} color={colors.teal} />
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

          {/* PHONE (10 DIGITS ONLY) */}
          <View style={styles.inputGroup}>
            <View style={styles.labelRow}>
              <Text style={styles.inputLabel}>Mobile Phone Number</Text>
              <Text
                style={[
                  styles.charCountText,
                  phone.length === 10
                    ? styles.charCountValid
                    : phone.length > 0
                    ? styles.charCountWarning
                    : null,
                ]}
              >
                {phone.length}/10 digits
              </Text>
            </View>
            <View
              style={[
                styles.inputWrap,
                phone.length > 0 && phone.length < 10
                  ? styles.inputWrapWarning
                  : phone.length === 10
                  ? styles.inputWrapValid
                  : null,
                isPhoneChanged && styles.inputWrapHighlight,
              ]}
            >
              <View style={styles.countryCodeBadge}>
                <Text style={styles.countryCodeText}>+91</Text>
              </View>
              <TextInput
                style={styles.textInput}
                value={phone}
                onChangeText={handlePhoneChange}
                placeholder="10-digit mobile number"
                placeholderTextColor="#94A3B8"
                keyboardType="number-pad"
                maxLength={10}
              />
              {phone.length === 10 ? (
                <Ionicons name="checkmark-circle" size={18} color="#10B981" />
              ) : phone.length > 0 ? (
                <Ionicons name="alert-circle" size={18} color="#F59E0B" />
              ) : null}
            </View>
            {phone.length > 0 && phone.length < 10 ? (
              <Text style={styles.inlineWarningText}>
                ⚠️ Please enter all 10 digits ({10 - phone.length} more needed)
              </Text>
            ) : isPhoneChanged ? (
              <Text style={styles.inlineInfoText}>
                🔒 Security OTP verification required when saving mobile change
              </Text>
            ) : null}
          </View>

          {/* DATE OF BIRTH & AGE ROW */}
          <View style={styles.rowInputs}>
            <View style={[styles.inputGroup, { flex: 1.2, marginRight: 8 }]}>
              <Text style={styles.inputLabel}>Date of Birth (DOB)</Text>
              <View style={styles.inputWrap}>
                <Ionicons name="calendar-outline" size={18} color={colors.teal} />
                <TextInput
                  style={styles.textInput}
                  value={dob}
                  onChangeText={handleDobChange}
                  placeholder="DD/MM/YYYY"
                  placeholderTextColor="#94A3B8"
                  keyboardType="number-pad"
                  maxLength={10}
                />
              </View>
            </View>

            <View style={[styles.inputGroup, { flex: 0.8 }]}>
              <Text style={styles.inputLabel}>Age</Text>
              <View style={styles.inputWrap}>
                <Ionicons name="hourglass-outline" size={18} color={colors.teal} />
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

          {/* GENDER */}
          <View style={styles.inputGroup}>
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

          {/* EMERGENCY CONTACT (10 DIGITS ONLY) */}
          <View style={styles.inputGroup}>
            <View style={styles.labelRow}>
              <Text style={styles.inputLabel}>Emergency Contact</Text>
              {emergencyContact.length > 0 ? (
                <Text
                  style={[
                    styles.charCountText,
                    emergencyContact.length === 10
                      ? styles.charCountValid
                      : styles.charCountWarning,
                  ]}
                >
                  {emergencyContact.length}/10 digits
                </Text>
              ) : null}
            </View>
            <View style={styles.inputWrap}>
              <Ionicons name="heart-outline" size={18} color="#DC2626" />
              <TextInput
                style={styles.textInput}
                value={emergencyContact}
                onChangeText={handleEmergencyContactChange}
                placeholder="10-digit emergency phone"
                placeholderTextColor="#94A3B8"
                keyboardType="number-pad"
                maxLength={10}
              />
              {emergencyContact.length === 10 ? (
                <Ionicons name="checkmark-circle" size={18} color="#10B981" />
              ) : null}
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
              color={colors.teal}
            />
            <Text style={styles.passwordToggleText}>
              {showPasswordSection ? 'Hide' : 'Change'}
            </Text>
          </TouchableOpacity>
        </View>

        {showPasswordSection && (
          <View style={styles.passwordCard}>
            <View style={styles.securityPill}>
              <Ionicons name="shield-checkmark" size={14} color={colors.freshGreen} />
              <Text style={styles.securityPillText}>256-BIT ENCRYPTED CREDENTIALS</Text>
            </View>

            {/* CURRENT PASSWORD */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Current Password</Text>
              <View style={styles.inputWrap}>
                <Ionicons name="lock-closed-outline" size={18} color={colors.teal} />
                <TextInput
                  style={[styles.textInput, { flex: 1 }]}
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
                <Ionicons name="key-outline" size={18} color={colors.teal} />
                <TextInput
                  style={[styles.textInput, { flex: 1 }]}
                  value={newPassword}
                  onChangeText={setNewPassword}
                  placeholder="Minimum 6 characters"
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
                <Ionicons name="checkmark-done-outline" size={18} color={colors.teal} />
                <TextInput
                  style={[styles.textInput, { flex: 1 }]}
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
          </View>
        )}

        {/* PRIMARY SAVE BUTTON */}
        <TouchableOpacity
          style={styles.primarySaveBtn}
          onPress={handleSave}
          disabled={saving}
          activeOpacity={0.88}
        >
          <Ionicons name="save-outline" size={20} color="#FFFFFF" />
          <Text style={styles.primarySaveBtnText}>
            {saving ? 'Saving Details...' : 'Save Profile Changes'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.cancelBtn}
          onPress={() => navigation.goBack()}
          activeOpacity={0.7}
        >
          <Text style={styles.cancelBtnText}>Discard & Go Back</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* ==========================================
          SECURITY OTP VERIFICATION MODAL
      ========================================== */}
      <Modal
        visible={otpModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => {
          Keyboard.dismiss();
          setOtpModalVisible(false);
        }}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.modalKbdAvoid}
        >
          <TouchableOpacity
            style={styles.modalOverlay}
            activeOpacity={1}
            onPress={Keyboard.dismiss}
          >
            <TouchableOpacity
              style={styles.modalContent}
              activeOpacity={1}
              onPress={() => {}}
            >
              <ScrollView
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
                bounces={false}
                contentContainerStyle={{ paddingBottom: 6 }}
              >
                {/* MODAL HEADER */}
                <View style={styles.modalHeaderRow}>
                  <View style={styles.modalIconWrap}>
                    <Ionicons name="shield-checkmark" size={24} color={colors.teal} />
                  </View>
                  <TouchableOpacity
                    style={styles.modalCloseBtn}
                    onPress={() => {
                      Keyboard.dismiss();
                      setOtpModalVisible(false);
                    }}
                  >
                    <Ionicons name="close" size={20} color="#64748B" />
                  </TouchableOpacity>
                </View>

                <Text style={styles.modalTitle}>Security Verification</Text>
                <Text style={styles.modalSubtitle}>
                  You are updating sensitive contact credentials. Please verify with OTP to complete the change.
                </Text>

                {/* CHANGED CREDENTIALS SUMMARY */}
                <View style={styles.changedItemsBox}>
                  {isEmailChanged ? (
                    <View style={styles.changedRow}>
                      <Ionicons name="mail" size={16} color="#0284C7" />
                      <Text style={styles.changedRowLabel}>New Email:</Text>
                      <Text style={styles.changedRowVal} numberOfLines={1}>
                        {email}
                      </Text>
                    </View>
                  ) : null}

                  {isPhoneChanged ? (
                    <View style={styles.changedRow}>
                      <Ionicons name="call" size={16} color="#16A34A" />
                      <Text style={styles.changedRowLabel}>New Mobile:</Text>
                      <Text style={styles.changedRowVal}>+91 {phone}</Text>
                    </View>
                  ) : null}
                </View>

                {/* DEMO OTP HINT */}
                <View style={styles.demoOtpBox}>
                  <Ionicons name="information-circle" size={16} color="#0284C7" />
                  <Text style={styles.demoOtpText}>
                    Demo Verification OTP: <Text style={styles.demoOtpBold}>123456</Text>
                  </Text>
                </View>

                {/* OTP INPUT */}
                <View style={styles.otpInputGroup}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                    <Text style={styles.otpInputLabel}>Enter 6-Digit Verification Code</Text>
                    <TouchableOpacity
                      onPress={Keyboard.dismiss}
                      style={styles.dismissKbdBadge}
                    >
                      <Ionicons name="chevron-down-circle-outline" size={13} color={colors.teal} />
                      <Text style={styles.dismissKbdText}>Hide Keyboard</Text>
                    </TouchableOpacity>
                  </View>
                  <TextInput
                    style={styles.otpInput}
                    placeholder="123456"
                    placeholderTextColor="#94A3B8"
                    value={securityOtp}
                    onChangeText={(t) => {
                      const cleaned = t.replace(/[^0-9]/g, '').slice(0, 6);
                      setSecurityOtp(cleaned);
                      setOtpError('');
                      if (cleaned.length === 6) {
                        Keyboard.dismiss();
                      }
                    }}
                    keyboardType="number-pad"
                    maxLength={6}
                    autoFocus
                  />
                  {otpError ? <Text style={styles.otpErrorText}>{otpError}</Text> : null}
                </View>

                {/* MODAL ACTION BUTTONS */}
                <TouchableOpacity
                  style={styles.modalVerifyBtn}
                  onPress={() => {
                    Keyboard.dismiss();
                    handleVerifyOtpAndSubmit();
                  }}
                  activeOpacity={0.88}
                >
                  <Ionicons name="checkmark-done" size={18} color="#FFFFFF" />
                  <Text style={styles.modalVerifyBtnText}>Verify & Save Changes</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.modalCancelBtn}
                  onPress={() => {
                    Keyboard.dismiss();
                    setOtpModalVisible(false);
                  }}
                >
                  <Text style={styles.modalCancelBtnText}>Cancel</Text>
                </TouchableOpacity>
              </ScrollView>
            </TouchableOpacity>
          </TouchableOpacity>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  backBtn: {
    padding: 8,
    borderRadius: 12,
    backgroundColor: '#F1F5F9',
  },
  headerTitleWrap: {
    alignItems: 'center',
  },
  headerBadge: {
    fontSize: 9.5,
    fontWeight: '800',
    color: colors.teal,
    letterSpacing: 0.5,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
  },
  saveHeaderBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.teal,
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 12,
    gap: 4,
  },
  saveHeaderBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
  },
  scrollContent: {
    paddingBottom: 40,
  },
  avatarCard: {
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  avatarCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.teal,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
    position: 'relative',
  },
  cameraIconBtn: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#0F766E',
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  avatarName: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
  },
  avatarSubtitle: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '600',
    marginTop: 2,
  },
  sectionHeader: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 18,
    paddingBottom: 8,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#1E293B',
  },
  sectionSubtitle: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  formCard: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  inputGroup: {
    marginBottom: 14,
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#334155',
  },
  charCountText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#94A3B8',
  },
  charCountWarning: {
    color: '#D97706',
  },
  charCountValid: {
    color: '#10B981',
  },
  countryCodeBadge: {
    backgroundColor: '#E2E8F0',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    marginRight: 8,
  },
  countryCodeText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#334155',
  },
  otpBadgeTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#E0F2FE',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
  },
  otpBadgeTagText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#0284C7',
  },
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 48,
    gap: 8,
  },
  inputWrapHighlight: {
    borderColor: '#38BDF8',
    backgroundColor: '#F0F9FF',
  },
  inputWrapWarning: {
    borderColor: '#F59E0B',
    backgroundColor: '#FFFBEB',
  },
  inputWrapValid: {
    borderColor: '#10B981',
    backgroundColor: '#F0FDF4',
  },
  inlineWarningText: {
    fontSize: 11,
    color: '#D97706',
    fontWeight: '600',
    marginTop: 4,
  },
  inlineInfoText: {
    fontSize: 11,
    color: '#0284C7',
    fontWeight: '600',
    marginTop: 4,
  },
  textInput: {
    flex: 1,
    fontSize: 14,
    color: '#0F172A',
    fontWeight: '600',
  },
  rowInputs: {
    flexDirection: 'row',
  },
  genderPillsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  genderPill: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F1F5F9',
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  genderPillActive: {
    backgroundColor: colors.teal,
    borderColor: colors.teal,
  },
  genderPillText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#475569',
  },
  genderPillTextActive: {
    color: '#FFFFFF',
  },
  bloodGroupScroll: {
    gap: 8,
    paddingVertical: 2,
  },
  bloodPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
  },
  bloodPillActive: {
    backgroundColor: '#EF4444',
    borderColor: '#EF4444',
  },
  bloodPillText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#334155',
  },
  bloodPillTextActive: {
    color: '#FFFFFF',
  },
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
    color: colors.teal,
  },
  passwordCard: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: '#CCFBF1',
    marginTop: 4,
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
    color: colors.freshGreen,
  },
  primarySaveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.teal,
    marginHorizontal: 16,
    marginTop: 20,
    paddingVertical: 14,
    borderRadius: 16,
    gap: 8,
    shadowColor: colors.teal,
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

  // SECURITY OTP MODAL STYLES
  modalKbdAvoid: {
    flex: 1,
    justifyContent: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 16,
    width: '100%',
    maxWidth: 400,
    maxHeight: '90%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 10,
  },
  dismissKbdBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#F0FDFA',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  dismissKbdText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.teal,
  },
  modalHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  modalIconWrap: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: '#F0FDFA',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#CCFBF1',
  },
  modalCloseBtn: {
    padding: 6,
    borderRadius: 10,
    backgroundColor: '#F1F5F9',
  },
  modalTitle: {
    fontSize: 19,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 6,
  },
  modalSubtitle: {
    fontSize: 13,
    color: '#64748B',
    lineHeight: 18,
    marginBottom: 14,
  },
  changedItemsBox: {
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 8,
    marginBottom: 12,
  },
  changedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  changedRowLabel: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#334155',
  },
  changedRowVal: {
    fontSize: 12.5,
    fontWeight: '800',
    color: '#0F172A',
    flex: 1,
  },
  demoOtpBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 10,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#DBEAFE',
  },
  demoOtpText: {
    fontSize: 12,
    color: '#1E40AF',
    fontWeight: '600',
  },
  demoOtpBold: {
    fontWeight: '800',
    color: '#1D4ED8',
  },
  otpInputGroup: {
    marginBottom: 18,
  },
  otpInputLabel: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#334155',
    marginBottom: 6,
  },
  otpInput: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1.5,
    borderColor: colors.teal,
    borderRadius: 14,
    fontSize: 20,
    fontWeight: '800',
    color: '#0F172A',
    textAlign: 'center',
    letterSpacing: 6,
    paddingVertical: 10,
  },
  otpErrorText: {
    fontSize: 11.5,
    color: '#EF4444',
    fontWeight: '600',
    marginTop: 5,
    textAlign: 'center',
  },
  modalVerifyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: colors.teal,
    paddingVertical: 14,
    borderRadius: 14,
  },
  modalVerifyBtnText: {
    color: '#FFFFFF',
    fontSize: 14.5,
    fontWeight: '800',
  },
  modalCancelBtn: {
    alignItems: 'center',
    paddingVertical: 10,
    marginTop: 6,
  },
  modalCancelBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#64748B',
  },
});

export default EditProfileScreen;