import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Image,
  Platform,
  KeyboardAvoidingView,
  Keyboard,
  useWindowDimensions,
  StatusBar,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { showAlert } from '../../utils/alert';
import colors from '../../theme/colors';
import { safeNavigateToMain } from '../../utils/navigationHelper';
import { syncLogin, syncRegister, autoMigrateLocalAccountsToServer } from '../../services/dataSyncService';

const PRE_SEEDED_CREDENTIALS = {
  'user@mediunify.com': {
    password: 'password123',
    userData: {
      name: 'Demo Patient',
      email: 'user@mediunify.com',
      phone: '+91 98765 43210',
      gender: 'Male',
      bloodGroup: 'O+ Positive',
      age: '29 Yrs',
    },
  },
  '9876543210': {
    password: 'password123',
    userData: {
      name: 'Demo Patient',
      email: 'user@mediunify.com',
      phone: '+91 98765 43210',
      gender: 'Male',
      bloodGroup: 'O+ Positive',
      age: '29 Yrs',
    },
  },
  'admin@unnathi.com': {
    password: 'password123',
    userData: {
      name: 'Dr. Unnathi Admin',
      email: 'admin@unnathi.com',
      phone: '+91 98450 12345',
      gender: 'Female',
      bloodGroup: 'A+ Positive',
      age: '34 Yrs',
    },
  },
  '9845012345': {
    password: 'password123',
    userData: {
      name: 'Dr. Unnathi Admin',
      email: 'admin@unnathi.com',
      phone: '+91 98450 12345',
      gender: 'Female',
      bloodGroup: 'A+ Positive',
      age: '34 Yrs',
    },
  },
};

const LoginScreen = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();
  const isSmallDevice = width < 375 || height < 680;
  const isTablet = width >= 600;
  const scrollViewRef = useRef(null);

  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);

  useEffect(() => {
    const showSub = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
      () => setIsKeyboardVisible(true)
    );
    const hideSub = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide',
      () => setIsKeyboardVisible(false)
    );
    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  // On Android, ensure status bar area is never overlapped even if insets report 0
  const androidExtraTop = Platform.OS === 'android' && insets.top === 0 ? (StatusBar.currentHeight || 24) : 0;

  // Vertical centering: Center when vertical height allows comfortable viewing without clipping header.
  // When keyboard is open, align to flex-start and add padding so fields and buttons are freely scrollable.
  const minHeightForCentering = isSmallDevice ? 520 : 620;
  const canCenterVertically = !isKeyboardVisible && height >= minHeightForCentering;

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  useEffect(() => {
    try {
      autoMigrateLocalAccountsToServer();
    } catch (e) {}
  }, []);



  const handleLogin = async () => {
    const inputVal = email.trim();
    const inputPassword = password.trim();
    setErrorMessage('');

    if (!inputVal || !inputPassword) {
      setErrorMessage('Please enter your registered email/phone and password.');
      showAlert(
        'Missing Information',
        'Please enter your registered email/phone and password.'
      );
      return;
    }

    setIsLoggingIn(true);

    try {
      // 0. Connect directly to Central Sync Server (live Web <-> Mobile shared data)
      try {
        const syncRes = await syncLogin(inputVal, inputPassword);
        if (syncRes && syncRes.success && syncRes.user) {
          console.log('[LoginScreen] Logged in via Central Sync Server:', syncRes.user.name);
          await AsyncStorage.setItem('isLoggedIn', 'true');
          await safeNavigateToMain(navigation);
          return;
        } else if (syncRes && syncRes.status === 401) {
          setIsLoggingIn(false);
          setErrorMessage('The password you entered is incorrect. Please verify and try again.');
          showAlert(
            'Incorrect Password',
            'The password you entered is incorrect. Please verify and try again.',
            [
              { text: 'Try Again' },
              { text: 'Forgot Password?', onPress: () => navigation.navigate('ForgotPassword') },
            ]
          );
          return;
        }
      } catch (syncErr) {
        console.warn('[LoginScreen] Central Sync Server unreachable, falling back to local storage:', syncErr);
      }

      const cleanPhone = inputVal.replace(/[^0-9]/g, '');
      const cleanPhone10 = cleanPhone.length >= 10 ? cleanPhone.slice(-10) : cleanPhone;
      const lowerEmail = inputVal.toLowerCase();

      // 1. Check registered credentials store
      const regCredsStr = await AsyncStorage.getItem('@unnathi_registered_credentials');
      let registeredCreds = {};
      if (regCredsStr) {
        try {
          registeredCreds = JSON.parse(regCredsStr);
        } catch (e) {}
      }

      const allCreds = { ...PRE_SEEDED_CREDENTIALS, ...registeredCreds };
      const matchingCred =
        allCreds[lowerEmail] ||
        (cleanPhone10.length === 10 ? allCreds[cleanPhone10] : null);

      if (matchingCred) {
        // Enforce password match
        if (matchingCred.password && matchingCred.password !== inputPassword) {
          setIsLoggingIn(false);
          setErrorMessage('The password you entered is incorrect. Please try again.');
          showAlert(
            'Incorrect Password',
            'The password you entered is incorrect. Please verify and try again.',
            [
              { text: 'Try Again' },
              { text: 'Forgot Password?', onPress: () => navigation.navigate('ForgotPassword') },
            ]
          );
          return;
        }
      }

      // 2. Load registered user data
      const regUsersStr = await AsyncStorage.getItem('@unnathi_registered_users');
      let registeredUsers = {};
      if (regUsersStr) {
        try {
          registeredUsers = JSON.parse(regUsersStr);
        } catch (e) {}
      }

      const foundReg =
        (matchingCred && matchingCred.userData) ||
        registeredUsers[lowerEmail] ||
        (cleanPhone10.length === 10 ? registeredUsers[cleanPhone10] : null);

      let userFullName = '';
      let existingEmail = lowerEmail.includes('@') ? lowerEmail : (foundReg?.email || 'user@example.com');
      let existingPhone = cleanPhone10.length === 10 ? `+91 ${cleanPhone10}` : (foundReg?.phone || '+91 98450 12345');
      let existingBlood = 'O+ Positive';
      let existingAge = '28 Yrs';
      let existingGender = 'Male';
      let existingEmergency = `${existingPhone} (Family)`;
      let existingDob = '15/08/1998';

      if (foundReg && foundReg.name && !foundReg.name.includes('@')) {
        userFullName = foundReg.name.trim();
        if (foundReg.email) existingEmail = foundReg.email;
        if (foundReg.phone) existingPhone = foundReg.phone;
        if (foundReg.bloodGroup) existingBlood = foundReg.bloodGroup;
        if (foundReg.age) existingAge = foundReg.age;
        if (foundReg.gender) existingGender = foundReg.gender;
        if (foundReg.emergencyContact) existingEmergency = foundReg.emergencyContact;
        if (foundReg.dob) existingDob = foundReg.dob;
      }

      // Check existing storage if not in registered map
      if (!userFullName) {
        const storedPrimary = await AsyncStorage.getItem('@unnathi_primary_user');
        const storedUser = await AsyncStorage.getItem('user');
        const storedName = await AsyncStorage.getItem('userName');

        let parsed = null;
        if (storedPrimary) {
          try { parsed = JSON.parse(storedPrimary); } catch (e) {}
        } else if (storedUser) {
          try { parsed = JSON.parse(storedUser); } catch (e) {}
        }

        if (parsed?.name && !parsed.name.includes('@') && (!parsed?.email || parsed.email.toLowerCase() === lowerEmail)) {
          userFullName = parsed.name.trim();
          if (parsed.email) existingEmail = parsed.email;
          if (parsed.phone) existingPhone = parsed.phone;
          if (parsed.bloodGroup) existingBlood = parsed.bloodGroup;
          if (parsed.age) existingAge = parsed.age;
          if (parsed.gender) existingGender = parsed.gender;
          if (parsed.emergencyContact) existingEmergency = parsed.emergencyContact;
          if (parsed.dob) existingDob = parsed.dob;
        } else if (storedName && !storedName.includes('@') && storedName.trim()) {
          userFullName = storedName.trim();
        }
      }

      // Fallback: format clean readable full name
      if (!userFullName) {
        const rawPart = lowerEmail.includes('@')
          ? lowerEmail.split('@')[0].replace(/[._-]/g, ' ').replace(/[0-9]/g, '').trim() || lowerEmail.split('@')[0].replace(/[._-]/g, ' ').trim()
          : `User ${cleanPhone10.slice(-4)}`;
        userFullName = rawPart
          .split(' ')
          .filter(Boolean)
          .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
          .join(' ') || 'User Profile';
      }

      // 3. Save User Data
      const userData = {
        name: userFullName,
        email: existingEmail,
        phone: existingPhone,
        dob: existingDob,
        bloodGroup: existingBlood,
        age: existingAge,
        gender: existingGender,
        emergencyContact: existingEmergency,
      };

      await AsyncStorage.setItem('user', JSON.stringify(userData));
      await AsyncStorage.setItem('@unnathi_primary_user', JSON.stringify(userData));
      await AsyncStorage.setItem('userName', userFullName);
      await AsyncStorage.setItem('userEmail', existingEmail);
      await AsyncStorage.setItem('userPhone', existingPhone);

      // Account-specific family members isolation
      const userKey = (existingEmail || cleanPhone10 || 'default').toLowerCase().replace(/[^a-z0-9]/g, '_');
      const userFamKey = `@unnathi_family_members_${userKey}`;
      const savedFam = await AsyncStorage.getItem(userFamKey);
      let userFamilyList = [];
      if (savedFam) {
        try {
          userFamilyList = JSON.parse(savedFam);
        } catch (e) {}
      }

      const primaryMember = {
        id: 'self',
        name: `${userFullName} (Self)`,
        displayName: userFullName.split(' ')[0],
        relation: 'Self',
        age: existingAge || '28 Yrs',
        gender: existingGender || 'Male',
        bloodGroup: existingBlood ? existingBlood.split(' ')[0] : 'O+',
        allergies: 'None',
        conditions: 'None',
        icon: 'person',
        themeColor: '#00B894',
        bgLight: '#E6F8F4',
        isPrimary: true,
      };

      if (!Array.isArray(userFamilyList) || userFamilyList.length === 0) {
        userFamilyList = [primaryMember];
      } else {
        let foundSelf = false;
        userFamilyList = userFamilyList.map((m) => {
          if (m.id === 'self' || m.isPrimary || m.relation === 'Self') {
            foundSelf = true;
            return {
              ...m,
              name: `${userFullName} (Self)`,
              displayName: `${userFullName.split(' ')[0]} (Self)`,
              bloodGroup: existingBlood ? existingBlood.split(' ')[0] : m.bloodGroup,
              age: existingAge || m.age,
              gender: existingGender || m.gender,
            };
          }
          return m;
        });
        if (!foundSelf) {
          userFamilyList.unshift(primaryMember);
        }
      }

      await AsyncStorage.setItem(userFamKey, JSON.stringify(userFamilyList));
      await AsyncStorage.setItem('@unnathi_family_members', JSON.stringify(userFamilyList));
      await AsyncStorage.setItem('@unnathi_active_patient', JSON.stringify(userFamilyList[0] || primaryMember));

      // 4. Save login status
      await AsyncStorage.setItem('isLoggedIn', 'true');

      // Background push to Central Sync Server
      try {
        syncRegister(userData, inputPassword);
      } catch (e) {}

      // 5. Navigate to Main App
      await safeNavigateToMain(navigation);
    } catch (error) {
      setIsLoggingIn(false);
      console.log('Login storage error:', error);
      setErrorMessage('Something went wrong while logging in. Please check your connection and try again.');
      showAlert('Login Error', 'Something went wrong while logging in.');
    }
  };

  return (
    <SafeAreaView
      style={[
        styles.safeArea,
        androidExtraTop > 0 && { paddingTop: androidExtraTop },
      ]}
      edges={['top', 'left', 'right', 'bottom']}
    >
      <StatusBar barStyle="dark-content" backgroundColor="#F8FAFC" />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? (insets.top > 0 ? insets.top : 20) : 0}
        style={{ flex: 1 }}
      >
        <ScrollView
          ref={scrollViewRef}
          contentContainerStyle={[
            styles.scrollContent,
            {
              justifyContent: canCenterVertically ? 'center' : 'flex-start',
              paddingBottom: isKeyboardVisible ? (Platform.OS === 'ios' ? 140 : 100) : (isSmallDevice ? 12 : 20),
            },
            isSmallDevice && styles.scrollContentSmall,
            isTablet && styles.scrollContentTablet,
          ]}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          automaticallyAdjustKeyboardInsets={Platform.OS === 'ios'}
          showsVerticalScrollIndicator={false}
          bounces={false}
        >
          <View
            style={[
              styles.authCard,
              isSmallDevice && styles.authCardSmall,
              isTablet && styles.authCardTablet,
            ]}
          >
            {/* BRAND LOGO & TAGLINE */}
            <View style={[styles.logoSection, isSmallDevice && styles.logoSectionSmall]}>
              <Image
                source={require('../../../assets/logo.png')}
                style={[styles.logoImage, isSmallDevice && styles.logoImageSmall]}
                resizeMode="contain"
              />
              <Text style={styles.taglineText}>Healthcare Unified • Mobile Care</Text>
            </View>

            {/* AUTH SEGMENTED SWITCHER (LOGIN / SIGN UP) */}
            <View style={[styles.segmentedContainer, isSmallDevice && styles.segmentedContainerSmall]}>
              <TouchableOpacity
                style={[styles.segmentBtn, styles.segmentBtnActive]}
                activeOpacity={0.9}
              >
                <Text style={styles.segmentTextActive}>Sign In</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.segmentBtn}
                activeOpacity={0.8}
                onPress={() => navigation.navigate('Register')}
              >
                <Text style={styles.segmentTextInactive}>Create Account</Text>
              </TouchableOpacity>
            </View>

            {/* CARD HEADING */}
            <View style={[styles.cardHeader, isSmallDevice && styles.cardHeaderSmall]}>
              <Text style={[styles.cardTitle, isSmallDevice && styles.cardTitleSmall]}>Welcome Back</Text>
              <Text style={[styles.cardSubtitle, isSmallDevice && styles.cardSubtitleSmall]}>
                Sign in with your registered email or mobile number to access your health records.
              </Text>
            </View>

            {/* INPUT: EMAIL OR PHONE */}
            <View style={[styles.fieldGroup, isSmallDevice && styles.fieldGroupSmall]}>
              <Text style={styles.fieldLabel}>
                Email or Mobile Number <Text style={styles.requiredMark}>*</Text>
              </Text>
              <View style={[styles.inputBox, isSmallDevice && styles.inputBoxSmall, email ? styles.inputBoxFilled : null]}>
                <Ionicons
                  name={email.includes('@') ? 'mail-outline' : 'call-outline'}
                  size={18}
                  color={email ? colors.primary : colors.slate}
                  style={styles.inputPrefixIcon}
                />
                <TextInput
                  style={styles.textInput}
                  placeholder="Enter email or 10-digit mobile"
                  placeholderTextColor="#94A3B8"
                  value={email}
                  onChangeText={setEmail}
                  onFocus={() => {
                    setTimeout(() => {
                      scrollViewRef.current?.scrollTo({ y: 0, animated: true });
                    }, 100);
                  }}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                />
                {email.length > 0 && (
                  <TouchableOpacity
                    onPress={() => setEmail('')}
                    style={styles.clearBtn}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  >
                    <Ionicons name="close-circle" size={16} color="#94A3B8" />
                  </TouchableOpacity>
                )}
              </View>
            </View>

            {/* INPUT: PASSWORD */}
            <View style={[styles.fieldGroup, isSmallDevice && styles.fieldGroupSmall]}>
              <View style={styles.fieldLabelRow}>
                <Text style={styles.fieldLabel}>
                  Password <Text style={styles.requiredMark}>*</Text>
                </Text>
                <TouchableOpacity
                  onPress={() => navigation.navigate('ForgotPassword')}
                  activeOpacity={0.7}
                >
                  <Text style={styles.forgotPassLink}>Forgot Password?</Text>
                </TouchableOpacity>
              </View>
              <View style={[styles.inputBox, isSmallDevice && styles.inputBoxSmall, password ? styles.inputBoxFilled : null]}>
                <Ionicons
                  name="lock-closed-outline"
                  size={18}
                  color={password ? colors.primary : colors.slate}
                  style={styles.inputPrefixIcon}
                />
                <TextInput
                  style={styles.textInput}
                  placeholder="Enter account password"
                  placeholderTextColor="#94A3B8"
                  value={password}
                  onChangeText={setPassword}
                  onFocus={() => {
                    setTimeout(() => {
                      scrollViewRef.current?.scrollTo({ y: isSmallDevice ? 140 : 170, animated: true });
                    }, 100);
                  }}
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                  autoCorrect={false}
                />
                <TouchableOpacity
                  style={styles.eyeBtn}
                  onPress={() => setShowPassword(!showPassword)}
                  activeOpacity={0.7}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <Ionicons
                    name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                    size={20}
                    color={showPassword ? colors.primary : colors.slate}
                  />
                </TouchableOpacity>
              </View>
            </View>

            {/* REMEMBER ME TOGGLE */}
            <TouchableOpacity
              style={[styles.rememberMeRow, isSmallDevice && styles.rememberMeRowSmall]}
              activeOpacity={0.8}
              onPress={() => setRememberMe(!rememberMe)}
            >
              <View style={[styles.checkboxBox, rememberMe && styles.checkboxBoxChecked]}>
                {rememberMe && <Ionicons name="checkmark" size={13} color="#FFFFFF" />}
              </View>
              <Text style={styles.rememberMeText}>Remember login on this device</Text>
            </TouchableOpacity>

            {/* INLINE ERROR BOX */}
            {errorMessage ? (
              <View style={styles.errorBox}>
                <Ionicons name="alert-circle" size={17} color="#FF7F50" />
                <Text style={styles.errorBoxText}>{errorMessage}</Text>
              </View>
            ) : null}

            {/* PRIMARY SIGN IN BUTTON */}
            <TouchableOpacity
              style={[
                styles.primarySubmitBtn,
                isSmallDevice && styles.primarySubmitBtnSmall,
                isLoggingIn && styles.primarySubmitBtnDisabled,
              ]}
              onPress={() => {
                Keyboard.dismiss();
                handleLogin();
              }}
              disabled={isLoggingIn}
              activeOpacity={0.85}
            >
              {isLoggingIn ? (
                <View style={styles.btnRow}>
                  <ActivityIndicator size="small" color="#FFFFFF" style={{ marginRight: 8 }} />
                  <Text style={styles.primarySubmitBtnText}>Verifying Credentials...</Text>
                </View>
              ) : (
                <View style={styles.btnRow}>
                  <Text style={styles.primarySubmitBtnText}>Sign In to MediUnify</Text>
                  <Ionicons name="arrow-forward" size={18} color="#FFFFFF" style={{ marginLeft: 6 }} />
                </View>
              )}
            </TouchableOpacity>

            {/* REGISTER PROMPT */}
            <View style={[styles.signupFooter, isSmallDevice && styles.signupFooterSmall]}>
              <Text style={styles.signupFooterText}>Don't have a verified health account?</Text>
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={() => navigation.navigate('Register')}
                style={styles.signupFooterBtn}
              >
                <Text style={styles.signupFooterLink}> Create New Account</Text>
                <Ionicons name="chevron-forward" size={13} color={colors.teal} />
              </TouchableOpacity>
            </View>
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
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 20,
    backgroundColor: '#F8FAFC',
  },
  scrollContentSmall: {
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  scrollContentTablet: {
    paddingHorizontal: 24,
    paddingVertical: 32,
  },
  authCard: {
    width: '100%',
    maxWidth: 440,
    alignSelf: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 22,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#1E3A8A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 14,
    elevation: 3,
  },
  authCardSmall: {
    padding: 16,
    borderRadius: 16,
  },
  authCardTablet: {
    padding: 28,
    borderRadius: 22,
    maxWidth: 450,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 20,
    elevation: 4,
  },
  logoSection: {
    alignItems: 'center',
    marginBottom: 14,
  },
  logoSectionSmall: {
    marginBottom: 10,
  },
  logoImage: {
    width: 175,
    height: 48,
  },
  logoImageSmall: {
    width: 150,
    height: 40,
  },
  taglineText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748B',
    marginTop: 3,
    letterSpacing: 0.2,
  },
  segmentedContainer: {
    flexDirection: 'row',
    backgroundColor: '#F1F5F9',
    borderRadius: 12,
    padding: 4,
    marginBottom: 16,
  },
  segmentedContainerSmall: {
    marginBottom: 12,
  },
  segmentBtn: {
    flex: 1,
    paddingVertical: 9,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 9,
  },
  segmentBtnActive: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  segmentTextActive: {
    fontSize: 13,
    fontWeight: '800',
    color: '#1E3A8A',
  },
  segmentTextInactive: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748B',
  },
  cardHeader: {
    marginBottom: 16,
  },
  cardHeaderSmall: {
    marginBottom: 12,
  },
  cardTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: '#1E3A8A',
    letterSpacing: -0.3,
  },
  cardTitleSmall: {
    fontSize: 20,
  },
  cardSubtitle: {
    fontSize: 12,
    color: '#64748B',
    lineHeight: 18,
    marginTop: 4,
  },
  cardSubtitleSmall: {
    fontSize: 11.5,
    lineHeight: 16,
  },
  fieldGroup: {
    marginBottom: 14,
  },
  fieldGroupSmall: {
    marginBottom: 10,
  },
  fieldLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1E3A8A',
    marginBottom: 6,
  },
  requiredMark: {
    color: '#FF7F50',
    fontWeight: '800',
  },
  forgotPassLink: {
    fontSize: 12,
    fontWeight: '700',
    color: '#00B894',
  },
  inputBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    borderRadius: 14,
    paddingHorizontal: 12,
    height: 48,
  },
  inputBoxSmall: {
    height: 44,
    borderRadius: 12,
  },
  inputBoxFilled: {
    borderColor: '#A7F3D0',
    backgroundColor: '#FFFFFF',
  },
  inputPrefixIcon: {
    marginRight: 10,
  },
  textInput: {
    flex: 1,
    fontSize: 14,
    color: '#0F172A',
    paddingVertical: 0,
  },
  clearBtn: {
    padding: 4,
  },
  eyeBtn: {
    padding: 4,
  },
  rememberMeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
    marginTop: 2,
  },
  rememberMeRowSmall: {
    marginBottom: 12,
  },
  checkboxBox: {
    width: 18,
    height: 18,
    borderRadius: 5,
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
  },
  checkboxBoxChecked: {
    backgroundColor: '#00B894',
    borderColor: '#00B894',
  },
  rememberMeText: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '600',
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FFF2ED',
    borderWidth: 1,
    borderColor: '#FFD7C7',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 9,
    marginBottom: 14,
  },
  errorBoxText: {
    fontSize: 12,
    color: '#FF7F50',
    fontWeight: '600',
    flex: 1,
    lineHeight: 17,
  },
  primarySubmitBtn: {
    backgroundColor: '#00B894',
    borderRadius: 14,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#00B894',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 3,
  },
  primarySubmitBtnSmall: {
    height: 44,
    borderRadius: 12,
  },
  primarySubmitBtnDisabled: {
    opacity: 0.65,
  },
  btnRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  primarySubmitBtnText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.2,
  },
  signupFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    flexWrap: 'wrap',
    marginTop: 18,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  signupFooterSmall: {
    marginTop: 14,
    paddingTop: 10,
  },
  signupFooterText: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '500',
  },
  signupFooterBtn: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  signupFooterLink: {
    fontSize: 12,
    fontWeight: '800',
    color: '#00B894',
  },
});

export default LoginScreen;