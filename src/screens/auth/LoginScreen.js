import React, { useState } from 'react';

import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Alert,
  Image,
  Platform,
  KeyboardAvoidingView,
  Keyboard,
  TouchableWithoutFeedback,
  useWindowDimensions,
} from 'react-native';
import { showAlert } from '../../utils/alert';

import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';

import CustomInput from '../../components/CustomInput';
import CustomButton from '../../components/CustomButton';

import colors from '../../theme/colors';
import { syncLogin, syncRegister, autoMigrateLocalAccountsToServer } from '../../services/dataSyncService';
import { safeNavigateToMain } from '../../utils/navigationHelper';

const LoginScreen = ({ navigation }) => {
  const { width } = useWindowDimensions();
  const isDesktopWeb = Platform.OS === 'web' && width >= 768;

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  const handleSkipToHome = () => {
    safeNavigateToMain(navigation);
  };

  React.useEffect(() => {
    const loadLastSaved = async () => {
      try {
        const storedEmail = await AsyncStorage.getItem('userEmail');
        if (storedEmail && storedEmail.trim()) {
          setEmail(storedEmail.trim());
        }
      } catch (e) {}
      // Automatically sync any existing local mobile accounts to server in background
      try {
        autoMigrateLocalAccountsToServer();
      } catch (e) {}
    };
    loadLastSaved();
  }, []);

  // ==========================================
  // LOGIN
  // ==========================================

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
        if (syncRes.success && syncRes.user) {
          console.log('[LoginScreen] Logged in via Central Sync Server:', syncRes.user.name);
          await AsyncStorage.setItem('isLoggedIn', 'true');
          await safeNavigateToMain(navigation);
          return;
        } else if (syncRes.status === 401) {
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

      const matchingCred =
        registeredCreds[lowerEmail] ||
        (cleanPhone10.length === 10 ? registeredCreds[cleanPhone10] : null);

      if (matchingCred) {
        // Enforce password match
        if (matchingCred.password && matchingCred.password !== inputPassword) {
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

      // ==========================================
      // SAVE USER DATA
      // ==========================================

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
        // Sync self profile
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


      // ==========================================
      // SAVE LOGIN STATUS
      // ==========================================

      await AsyncStorage.setItem(
        'isLoggedIn',
        'true'
      );

      console.log(
        'User saved:',
        userData
      );

      // Background push to Central Sync Server
      try {
        syncRegister(userData, inputPassword);
      } catch (e) {}

      // ==========================================
      // GO TO MAIN APP (Safe on both Web & Mobile)
      // ==========================================

      await safeNavigateToMain(navigation);

    } catch (error) {
      setIsLoggingIn(false);
      console.log('Login storage error:', error);
      setErrorMessage('Something went wrong while logging in. Please check your connection and try again.');
      showAlert(
        'Login Error',
        'Something went wrong while logging in.'
      );
    }

  };


  // ==========================================
  // FORGOT PASSWORD
  // ==========================================

  const handleForgotPassword = () => {

    navigation.navigate(
      'ForgotPassword'
    );

  };


  // ==========================================
  // CREATE ACCOUNT
  // ==========================================

  const handleRegister = () => {

    navigation.navigate(
      'Register'
    );

  };


  return (
    <SafeAreaView style={[styles.safeArea, isDesktopWeb && styles.safeAreaDesktop]}>
      {isDesktopWeb && (
        <View style={styles.webTopBar}>
          <View style={styles.webTopBarInner}>
            <TouchableOpacity onPress={handleSkipToHome} activeOpacity={0.8}>
              <Image
                source={require('../../../assets/logo.png')}
                style={styles.webLogo}
                resizeMode="contain"
              />
            </TouchableOpacity>

            <View style={styles.webTopRight}>
              <TouchableOpacity
                style={styles.skipToHomeBtn}
                onPress={handleSkipToHome}
                activeOpacity={0.8}
              >
                <Text style={styles.skipToHomeText}>Explore as Guest / Skip to Home</Text>
                <Ionicons name="arrow-forward" size={15} color={colors.teal} />
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={[styles.content, isDesktopWeb && styles.contentDesktop]}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          showsVerticalScrollIndicator={false}
          bounces={false}
        >
          <View style={[styles.authCard, isDesktopWeb && styles.authCardDesktop]}>
            {/* LOGO */}
            <View style={styles.logoContainer}>
              <Image
                source={require('../../../assets/logo.png')}
                style={styles.logo}
                resizeMode="contain"
              />
            </View>

            {/* HEADER */}
            <View style={styles.header}>
              <Text style={styles.title}>Welcome Back</Text>
              <Text style={styles.subtitle}>
                Login to your Unnathi Healthcare account.
              </Text>
            </View>

            {/* EMAIL OR PHONE */}
            <CustomInput
              label="Email or Mobile Phone"
              placeholder="Enter your email or 10-digit phone"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
            />

            {/* PASSWORD WITH EYE TOGGLE */}
            <CustomInput
              label="Password"
              placeholder="Enter your password"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              isPassword
            />

            {/* FORGOT PASSWORD */}
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={handleForgotPassword}
              style={styles.forgotBtn}
            >
              <Text style={styles.forgot}>Forgot Password?</Text>
            </TouchableOpacity>

            {/* INLINE ERROR BANNER */}
            {errorMessage ? (
              <View style={styles.errorBox}>
                <Ionicons name="alert-circle" size={18} color="#DC2626" />
                <Text style={styles.errorText}>{errorMessage}</Text>
              </View>
            ) : null}

            {/* LOGIN BUTTON */}
            <CustomButton
              title={isLoggingIn ? 'Logging In...' : 'Login'}
              disabled={isLoggingIn}
              onPress={() => {
                Keyboard.dismiss();
                handleLogin();
              }}
            />

            {/* REGISTER */}
            <View style={styles.registerContainer}>
              <Text style={styles.registerText}>Don't have an account?</Text>
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={handleRegister}
              >
                <Text style={styles.registerLink}> Create Account</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={styles.skipHomeLink}
              onPress={handleSkipToHome}
              activeOpacity={0.8}
            >
              <Text style={styles.skipHomeLinkText}>
                Explore as Guest / Skip to Home &gt;
              </Text>
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
    backgroundColor: colors.white,
  },
  safeAreaDesktop: {
    backgroundColor: colors.background,
  },
  webTopBar: {
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    paddingVertical: 12,
    paddingHorizontal: 24,
  },
  webTopBarInner: {
    maxWidth: 1320,
    width: '100%',
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  webLogo: {
    width: 150,
    height: 44,
  },
  webTopRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  skipToHomeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: colors.lightTeal,
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  skipToHomeText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.teal,
  },
  content: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingVertical: 24,
  },
  contentDesktop: {
    paddingVertical: 48,
    justifyContent: 'center',
    alignItems: 'center',
  },
  authCard: {
    width: '100%',
    maxWidth: 440,
    alignSelf: 'center',
  },
  authCardDesktop: {
    backgroundColor: colors.white,
    borderRadius: 24,
    padding: 36,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.07,
    shadowRadius: 28,
    elevation: 4,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  logo: {
    width: 220,
    height: 90,
  },
  header: {
    marginBottom: 24,
    alignItems: 'center',
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
    color: colors.secondary, // Navy Blue
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: colors.slate, // Slate
    lineHeight: 20,
    textAlign: 'center',
  },
  forgotBtn: {
    alignSelf: 'flex-end',
    marginBottom: 16,
    marginTop: 2,
  },
  forgot: {
    textAlign: 'right',
    color: colors.teal, // Teal
    fontWeight: '700',
    fontSize: 13,
  },
  registerContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 22,
  },
  registerText: {
    color: colors.slate,
    fontSize: 14,
  },
  registerLink: {
    color: colors.teal,
    fontWeight: '700',
    fontSize: 14,
  },
  skipHomeLink: {
    marginTop: 20,
    alignSelf: 'center',
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  skipHomeLinkText: {
    fontSize: 13,
    color: colors.slate,
    fontWeight: '700',
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FCA5A5',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginTop: 8,
    marginBottom: 4,
  },
  errorText: {
    fontSize: 13,
    color: '#B91C1C',
    fontWeight: '600',
    flex: 1,
    lineHeight: 18,
  },
});

export default LoginScreen;