import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  StatusBar,
  Platform,
  KeyboardAvoidingView,
  Keyboard,
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

const RegisterScreen = ({ navigation }) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [dob, setDob] = useState('');
  const [age, setAge] = useState('');
  const [gender, setGender] = useState('Male');
  const [bloodGroup, setBloodGroup] = useState('O+ Positive');
  const [emergencyContact, setEmergencyContact] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Helper: Calculate age from DOB (DD/MM/YYYY)
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

  // DOB Formatter while typing (DD/MM/YYYY)
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
    } else if (formatted.length < 10) {
      setAge('');
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

  const handleRegister = async () => {
    const trimmedName = name.trim();
    const trimmedEmail = email.trim().toLowerCase();
    const cleanPhone10 = phone.replace(/[^0-9]/g, '').slice(0, 10);
    const trimmedPassword = password.trim();

    // 1. Check for required fields
    if (!trimmedName || !trimmedEmail || !cleanPhone10 || !trimmedPassword) {
      Alert.alert(
        'Missing Information',
        'Please enter your full name, email, 10-digit mobile number, and password.'
      );
      return;
    }

    // 2. Validate Full Name (letters, spaces, minimum 2 characters)
    if (trimmedName.length < 2 || !/^[a-zA-Z\s.]+$/.test(trimmedName)) {
      Alert.alert(
        'Invalid Full Name',
        'Please enter a valid full name containing only letters and spaces (minimum 2 characters).'
      );
      return;
    }

    // 3. Validate Email Format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmedEmail)) {
      Alert.alert(
        'Invalid Email Address',
        'Please enter a valid email address (e.g. yourname@example.com).'
      );
      return;
    }

    // 4. Validate Exactly 10-Digit Mobile Number
    if (cleanPhone10.length < 10) {
      Alert.alert(
        'Incomplete Mobile Number',
        `Mobile number must contain exactly 10 digits. You entered only ${cleanPhone10.length} ${cleanPhone10.length === 1 ? 'digit' : 'digits'}.`
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

    // 5. Validate Password Length
    if (trimmedPassword.length < 6) {
      Alert.alert(
        'Weak Password',
        'Password must be at least 6 characters long for account security.'
      );
      return;
    }

    try {
      // 6. Check for DUPLICATE ACCOUNTS (Email, Phone, or Name already exists)
      const regCredsStr = await AsyncStorage.getItem('@unnathi_registered_credentials');
      let registeredCreds = {};
      if (regCredsStr) {
        try {
          registeredCreds = JSON.parse(regCredsStr);
        } catch (e) {}
      }

      const regUsersStr = await AsyncStorage.getItem('@unnathi_registered_users');
      let registeredUsers = {};
      if (regUsersStr) {
        try {
          registeredUsers = JSON.parse(regUsersStr);
        } catch (e) {}
      }

      // Check if Email already registered
      if (registeredCreds[trimmedEmail] || registeredUsers[trimmedEmail]) {
        Alert.alert(
          'Email Already in Use',
          `An account with email "${trimmedEmail}" already exists. Multiple accounts with the same email are not allowed. Please sign in instead.`,
          [
            { text: 'Sign In', onPress: () => navigation.navigate('Login') },
            { text: 'Cancel', style: 'cancel' },
          ]
        );
        return;
      }

      // Check if Phone already registered
      if (registeredCreds[cleanPhone10] || registeredUsers[cleanPhone10]) {
        Alert.alert(
          'Phone Number Already in Use',
          `An account with mobile number "+91 ${cleanPhone10}" already exists. Multiple accounts with the same phone number are not allowed. Please sign in instead.`,
          [
            { text: 'Sign In', onPress: () => navigation.navigate('Login') },
            { text: 'Cancel', style: 'cancel' },
          ]
        );
        return;
      }

      // Check if Username / Full Name already registered
      const existingNames = Object.values(registeredUsers)
        .map((u) => (u?.name ? u.name.trim().toLowerCase() : ''))
        .filter(Boolean);

      if (existingNames.includes(trimmedName.toLowerCase())) {
        Alert.alert(
          'Username Already Registered',
          `An account under the name "${trimmedName}" is already registered. Please use your distinct full name or sign in to your existing account.`,
          [
            { text: 'Sign In', onPress: () => navigation.navigate('Login') },
            { text: 'Change Name', style: 'cancel' },
          ]
        );
        return;
      }

      // Determine final age
      const calculatedAge = calculateAgeFromDob(dob);
      const finalAge = calculatedAge || (age.trim() ? `${age.replace(/[^0-9]/g, '')} Yrs` : '28 Yrs');
      const formattedPhone = `+91 ${cleanPhone10}`;

      const userData = {
        name: trimmedName,
        email: trimmedEmail,
        phone: formattedPhone,
        dob: dob || '15/08/1998',
        age: finalAge,
        gender: gender || 'Male',
        bloodGroup: bloodGroup || 'O+ Positive',
        emergencyContact: emergencyContact.trim() || `${formattedPhone} (Family)`,
      };

      const accountCredentials = {
        email: trimmedEmail,
        phone: cleanPhone10,
        password: trimmedPassword,
        userData,
        createdAt: Date.now(),
      };

      // 1. Save directly into AsyncStorage
      await AsyncStorage.setItem('user', JSON.stringify(userData));
      await AsyncStorage.setItem('@unnathi_primary_user', JSON.stringify(userData));
      await AsyncStorage.setItem('userName', trimmedName);
      await AsyncStorage.setItem('userEmail', trimmedEmail);
      await AsyncStorage.setItem('userPhone', formattedPhone);

      // 2. Save into registered credentials & users dictionary
      registeredCreds[trimmedEmail] = accountCredentials;
      registeredCreds[cleanPhone10] = accountCredentials;
      await AsyncStorage.setItem('@unnathi_registered_credentials', JSON.stringify(registeredCreds));

      registeredUsers[trimmedEmail] = userData;
      registeredUsers[cleanPhone10] = userData;
      await AsyncStorage.setItem('@unnathi_registered_users', JSON.stringify(registeredUsers));

      // 3. Primary family profile (Self)
      const primaryMember = {
        id: 'self',
        name: `${trimmedName} (Self)`,
        displayName: trimmedName.split(' ')[0],
        relation: 'Self',
        age: finalAge,
        gender: gender || 'Male',
        bloodGroup: bloodGroup ? bloodGroup.split(' ')[0] : 'O+',
        allergies: 'None',
        conditions: 'None',
        icon: 'person',
        themeColor: '#00B894',
        bgLight: '#E6F8F4',
        isPrimary: true,
      };
      await AsyncStorage.setItem('@unnathi_active_patient', JSON.stringify(primaryMember));

      // 4. Update @unnathi_family_members list
      const savedFam = await AsyncStorage.getItem('@unnathi_family_members');
      let currentFam = [];
      if (savedFam) {
        try {
          const parsed = JSON.parse(savedFam);
          if (Array.isArray(parsed) && parsed.length > 0) {
            currentFam = parsed.filter((m) => m.id !== 'self' && !m.isPrimary && m.relation !== 'Self');
          }
        } catch (e) {}
      }
      const updatedFam = [primaryMember, ...currentFam];
      await AsyncStorage.setItem('@unnathi_family_members', JSON.stringify(updatedFam));

      // 5. Navigate to OTP with created account details
      navigation.navigate('OTP', { userData, credentials: accountCredentials });
    } catch (e) {
      console.log('Register save error:', e);
      navigation.navigate('OTP');
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          showsVerticalScrollIndicator={false}
        >
        {/* HEADER */}
        <View style={styles.header}>
          <View style={styles.badgePill}>
            <Ionicons name="shield-checkmark" size={14} color={colors.primary} />
            <Text style={styles.badgePillText}>MEDIUNIFY REGISTRATION</Text>
          </View>
          <Text style={styles.title}>Create Health Account</Text>
          <Text style={styles.subtitle}>
            Enter your details to create your verified patient health record.
          </Text>
        </View>

        {/* SECTION 1: ACCOUNT CREDENTIALS */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionHeading}>👤 Basic Account Information</Text>

          {/* FULL NAME */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>
              Full Name <Text style={styles.requiredStar}>*</Text>
            </Text>
            <View style={styles.inputWrapper}>
              <Ionicons name="person-outline" size={18} color="#64748B" style={styles.inputIcon} />
              <TextInput
                style={styles.textInput}
                placeholder="Enter your full name"
                placeholderTextColor="#94A3B8"
                value={name}
                onChangeText={setName}
                autoCapitalize="words"
              />
            </View>
          </View>

          {/* EMAIL */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>
              Email Address <Text style={styles.requiredStar}>*</Text>
            </Text>
            <View style={styles.inputWrapper}>
              <Ionicons name="mail-outline" size={18} color="#64748B" style={styles.inputIcon} />
              <TextInput
                style={styles.textInput}
                placeholder="Enter your email address"
                placeholderTextColor="#94A3B8"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>
          </View>

          {/* PHONE */}
          <View style={styles.inputGroup}>
            <View style={styles.labelRow}>
              <Text style={styles.inputLabel}>
                Phone Number <Text style={styles.requiredStar}>*</Text>
              </Text>
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
                styles.inputWrapper,
                phone.length > 0 && phone.length < 10
                  ? styles.inputWrapperWarning
                  : phone.length === 10
                  ? styles.inputWrapperValid
                  : null,
              ]}
            >
              <View style={styles.countryCodeBadge}>
                <Text style={styles.countryCodeText}>+91</Text>
              </View>
              <TextInput
                style={styles.textInput}
                placeholder="10-digit mobile number"
                placeholderTextColor="#94A3B8"
                value={phone}
                onChangeText={handlePhoneChange}
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
                ⚠️ Please enter all 10 digits ({10 - phone.length} more {10 - phone.length === 1 ? 'digit' : 'digits'} needed)
              </Text>
            ) : null}
          </View>

          {/* PASSWORD */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>
              Account Password <Text style={styles.requiredStar}>*</Text>
            </Text>
            <View style={styles.inputWrapper}>
              <Ionicons name="lock-closed-outline" size={18} color="#64748B" style={styles.inputIcon} />
              <TextInput
                style={[styles.textInput, { flex: 1 }]}
                placeholder="Create a secure password"
                placeholderTextColor="#94A3B8"
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
              />
              <TouchableOpacity
                onPress={() => setShowPassword(!showPassword)}
                style={styles.eyeBtn}
              >
                <Ionicons
                  name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                  size={18}
                  color="#64748B"
                />
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* SECTION 2: HEALTH & PERSONAL PROFILE */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionHeading}>🩺 Health & Medical Details</Text>

          {/* DATE OF BIRTH (DOB) */}
          <View style={styles.inputGroup}>
            <View style={styles.labelRow}>
              <Text style={styles.inputLabel}>Date of Birth (DOB)</Text>
              <Text style={styles.helperFormat}>DD/MM/YYYY</Text>
            </View>
            <View style={styles.inputWrapper}>
              <Ionicons name="calendar-outline" size={18} color={colors.primary} style={styles.inputIcon} />
              <TextInput
                style={styles.textInput}
                placeholder="DD/MM/YYYY"
                placeholderTextColor="#94A3B8"
                value={dob}
                onChangeText={handleDobChange}
                keyboardType="number-pad"
                maxLength={10}
              />
            </View>

            {/* LIVE AGE CALCULATION BADGE */}
            {age ? (
              <View style={styles.ageBadge}>
                <Ionicons name="sparkles" size={14} color="#059669" />
                <Text style={styles.ageBadgeText}>
                  Calculated Age: <Text style={styles.ageBold}>{age}</Text>
                </Text>
              </View>
            ) : null}
          </View>

          {/* GENDER SELECTOR */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Gender</Text>
            <View style={styles.genderRow}>
              {GENDERS.map((g) => {
                const isSelected = gender === g;
                return (
                  <TouchableOpacity
                    key={g}
                    style={[styles.genderBtn, isSelected && styles.genderBtnActive]}
                    onPress={() => setGender(g)}
                    activeOpacity={0.8}
                  >
                    <Ionicons
                      name={g === 'Male' ? 'male' : g === 'Female' ? 'female' : 'male-female'}
                      size={16}
                      color={isSelected ? '#FFFFFF' : '#475569'}
                    />
                    <Text style={[styles.genderText, isSelected && styles.genderTextActive]}>
                      {g}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* BLOOD GROUP SELECTOR */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Blood Group</Text>
            <View style={styles.bloodGrid}>
              {BLOOD_GROUPS.map((bg) => {
                const isSelected = bloodGroup === bg;
                return (
                  <TouchableOpacity
                    key={bg}
                    style={[styles.bloodChip, isSelected && styles.bloodChipActive]}
                    onPress={() => setBloodGroup(bg)}
                    activeOpacity={0.8}
                  >
                    <Ionicons
                      name="water"
                      size={13}
                      color={isSelected ? '#FFFFFF' : '#EF4444'}
                    />
                    <Text style={[styles.bloodText, isSelected && styles.bloodTextActive]}>
                      {bg.replace(' Positive', '+').replace(' Negative', '-')}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* EMERGENCY CONTACT */}
          <View style={styles.inputGroup}>
            <View style={styles.labelRow}>
              <Text style={styles.inputLabel}>Emergency Contact Number (Optional)</Text>
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
            <View
              style={[
                styles.inputWrapper,
                emergencyContact.length > 0 && emergencyContact.length < 10
                  ? styles.inputWrapperWarning
                  : emergencyContact.length === 10
                  ? styles.inputWrapperValid
                  : null,
              ]}
            >
              <Ionicons name="medkit-outline" size={18} color="#EF4444" style={styles.inputIcon} />
              <TextInput
                style={styles.textInput}
                placeholder="10-digit emergency contact"
                placeholderTextColor="#94A3B8"
                value={emergencyContact}
                onChangeText={handleEmergencyContactChange}
                keyboardType="number-pad"
                maxLength={10}
              />
              {emergencyContact.length === 10 ? (
                <Ionicons name="checkmark-circle" size={18} color="#10B981" />
              ) : null}
            </View>
          </View>
        </View>

        {/* SUBMIT BUTTON */}
        <TouchableOpacity
          style={styles.createAccountBtn}
          onPress={handleRegister}
          activeOpacity={0.88}
        >
          <Text style={styles.createAccountText}>Create Account & Verify</Text>
          <Ionicons name="arrow-forward" size={18} color="#FFFFFF" />
        </TouchableOpacity>

        {/* LOGIN LINK */}
        <View style={styles.loginContainer}>
          <Text style={styles.loginText}>Already have an account?</Text>
          <TouchableOpacity onPress={() => navigation.navigate('Login')}>
            <Text style={styles.loginLink}> Sign In</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 40,
  },
  header: {
    marginBottom: 20,
  },
  badgePill: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: '#E6F8F4',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    gap: 5,
    marginBottom: 10,
  },
  badgePillText: {
    fontSize: 10.5,
    fontWeight: '800',
    color: colors.primary,
    letterSpacing: 0.5,
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 14,
    color: '#64748B',
    lineHeight: 20,
  },
  sectionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  sectionHeading: {
    fontSize: 15,
    fontWeight: '800',
    color: '#1E293B',
    marginBottom: 14,
  },
  inputGroup: {
    marginBottom: 14,
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#334155',
    marginBottom: 6,
  },
  requiredStar: {
    color: '#EF4444',
  },
  helperFormat: {
    fontSize: 11,
    fontWeight: '600',
    color: '#94A3B8',
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 48,
  },
  inputIcon: {
    marginRight: 10,
  },
  textInput: {
    flex: 1,
    fontSize: 14,
    color: '#0F172A',
    fontWeight: '600',
  },
  eyeBtn: {
    padding: 6,
  },
  ageBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ECFDF5',
    borderWidth: 1,
    borderColor: '#A7F3D0',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    marginTop: 6,
    gap: 6,
  },
  ageBadgeText: {
    fontSize: 12,
    color: '#065F46',
    fontWeight: '600',
  },
  ageBold: {
    fontWeight: '800',
    color: '#047857',
  },
  genderRow: {
    flexDirection: 'row',
    gap: 8,
  },
  genderBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#F1F5F9',
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  genderBtnActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  genderText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#475569',
  },
  genderTextActive: {
    color: '#FFFFFF',
  },
  bloodGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  bloodChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 10,
  },
  bloodChipActive: {
    backgroundColor: '#EF4444',
    borderColor: '#EF4444',
  },
  bloodText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#334155',
  },
  bloodTextActive: {
    color: '#FFFFFF',
  },
  createAccountBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: colors.primary,
    paddingVertical: 15,
    borderRadius: 14,
    marginTop: 8,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 4,
  },
  createAccountText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
  },
  loginContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20,
  },
  loginText: {
    color: '#64748B',
    fontSize: 14,
  },
  loginLink: {
    color: colors.primary,
    fontSize: 14,
    fontWeight: '800',
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
  inputWrapperWarning: {
    borderColor: '#F59E0B',
    backgroundColor: '#FFFBEB',
  },
  inputWrapperValid: {
    borderColor: '#10B981',
    backgroundColor: '#F0FDF4',
  },
  inlineWarningText: {
    fontSize: 11.5,
    color: '#D97706',
    fontWeight: '600',
    marginTop: 5,
  },
});

export default RegisterScreen;