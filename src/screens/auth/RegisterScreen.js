import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  StatusBar,
  Platform,
  KeyboardAvoidingView,
  Keyboard,
  useWindowDimensions,
  Image,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { showAlert } from '../../utils/alert';
import colors from '../../theme/colors';
import { safeNavigateToMain } from '../../utils/navigationHelper';
import { autoMigrateLocalAccountsToServer } from '../../services/dataSyncService';

const RegisterScreen = ({ navigation, route }) => {
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

  // Android status bar safe margin
  const androidExtraTop = Platform.OS === 'android' && insets.top === 0 ? (StatusBar.currentHeight || 24) : 0;

  // Preserve registration information if returned from OTP or prefilled
  const initialData = route?.params?.userData || {};
  const initialCreds = route?.params?.credentials || {};

  const [name, setName] = useState(initialData.name || '');
  const [email, setEmail] = useState(initialData.email || '');
  const [phone, setPhone] = useState(
    initialData.phone ? initialData.phone.replace(/[^0-9]/g, '').slice(-10) : (initialCreds.phone || '')
  );
  const [password, setPassword] = useState(initialCreds.password || '');
  const [confirmPassword, setConfirmPassword] = useState(initialCreds.password || '');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [referralCode, setReferralCode] = useState(initialData.referralCode || '');
  const [agreedToTerms, setAgreedToTerms] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);

  useEffect(() => {
    try {
      autoMigrateLocalAccountsToServer();
    } catch (e) {}
  }, []);

  const handleSkipToHome = () => {
    safeNavigateToMain(navigation);
  };

  // Strictly accept numeric digits and cap at exactly 10 digits
  const handlePhoneChange = (text) => {
    const raw = text.replace(/[^0-9]/g, '');
    const cleaned = raw.length > 10 && raw.startsWith('91') ? raw.slice(2, 12) : raw.slice(0, 10);
    setPhone(cleaned);
  };

  const handleRegister = async () => {
    setErrorMessage('');
    const trimmedName = name.trim();
    const trimmedEmail = email.trim().toLowerCase();
    const rawPhone = phone.replace(/[^0-9]/g, '');
    const cleanPhone10 = rawPhone.length >= 10 ? rawPhone.slice(-10) : rawPhone;
    const trimmedPassword = password.trim();
    const trimmedConfirmPassword = confirmPassword.trim();
    const trimmedReferralCode = referralCode.trim().toUpperCase();

    // 1. Required fields validation
    if (!trimmedName || !trimmedEmail || !cleanPhone10 || !trimmedPassword || !trimmedConfirmPassword) {
      const msg = 'Please enter your Full Name, Email, 10-digit Mobile Number, and Password.';
      setErrorMessage(msg);
      showAlert('Missing Information', msg);
      return;
    }

    // 2. Validate Full Name
    if (trimmedName.length < 2 || !/^[a-zA-Z\s.]+$/.test(trimmedName)) {
      const msg = 'Please enter a valid full name containing letters only (minimum 2 characters).';
      setErrorMessage(msg);
      showAlert('Invalid Full Name', msg);
      return;
    }

    // 3. Validate Email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmedEmail)) {
      const msg = 'Please enter a valid email address (e.g. name@domain.com).';
      setErrorMessage(msg);
      showAlert('Invalid Email', msg);
      return;
    }

    // 4. Validate 10-digit mobile number
    if (cleanPhone10.length !== 10) {
      const msg = `Please enter a valid 10-digit mobile number (currently ${cleanPhone10.length} digits).`;
      setErrorMessage(msg);
      showAlert('Invalid Mobile Number', msg);
      return;
    }

    // 5. Validate Password length
    if (trimmedPassword.length < 6) {
      const msg = 'Password must be at least 6 characters long for your account security.';
      setErrorMessage(msg);
      showAlert('Weak Password', msg);
      return;
    }

    // 6. Validate Password match
    if (trimmedPassword !== trimmedConfirmPassword) {
      const msg = 'Passwords do not match. Please ensure both passwords match identically.';
      setErrorMessage(msg);
      showAlert('Password Mismatch', msg);
      return;
    }

    // 7. Terms agreement
    if (!agreedToTerms) {
      const msg = 'Please accept the MediUnify Terms of Service and Privacy Policy to proceed.';
      setErrorMessage(msg);
      showAlert('Terms Agreement Required', msg);
      return;
    }

    setIsRegistering(true);

    try {
      // Check existing accounts
      const regCredsStr = await AsyncStorage.getItem('@unnathi_registered_credentials');
      let registeredCreds = {};
      if (regCredsStr) {
        try { registeredCreds = JSON.parse(regCredsStr); } catch (e) {}
      }

      // Check if Email already registered
      if (registeredCreds[trimmedEmail]) {
        setIsRegistering(false);
        const msg = `An account with email "${trimmedEmail}" already exists. Please sign in instead.`;
        setErrorMessage(msg);
        showAlert(
          'Email Already in Use',
          msg,
          [
            { text: 'Sign In', onPress: () => navigation.navigate('Login') },
            { text: 'Cancel', style: 'cancel' },
          ]
        );
        return;
      }

      // Check if Phone already registered
      if (registeredCreds[cleanPhone10]) {
        setIsRegistering(false);
        const msg = `An account with mobile number "+91 ${cleanPhone10}" already exists. Please sign in instead.`;
        setErrorMessage(msg);
        showAlert(
          'Phone Number Already in Use',
          msg,
          [
            { text: 'Sign In', onPress: () => navigation.navigate('Login') },
            { text: 'Cancel', style: 'cancel' },
          ]
        );
        return;
      }

      // Prepare user data payload
      const formattedPhone = `+91 ${cleanPhone10}`;
      const cleanFirstName = trimmedName.split(' ')[0].toUpperCase().replace(/[^A-Z0-9]/g, '') || 'USER';
      const myReferralCode = `${cleanFirstName}250`;

      const userData = {
        name: trimmedName,
        email: trimmedEmail,
        phone: formattedPhone,
        dob: '15/08/1998',
        age: '28 Yrs',
        gender: 'Male',
        bloodGroup: 'O+ Positive',
        emergencyContact: `${formattedPhone} (Family)`,
        myReferralCode,
        referralCode: trimmedReferralCode || null,
      };

      const accountCredentials = {
        email: trimmedEmail,
        phone: cleanPhone10,
        password: trimmedPassword,
        myReferralCode,
        referralCode: trimmedReferralCode || null,
        userData,
        createdAt: Date.now(),
      };

      setIsRegistering(false);

      // Open existing OTP screen with user data & credentials
      navigation.navigate('OTP', { userData, credentials: accountCredentials });
    } catch (e) {
      console.warn('Registration validation warning:', e);
      setIsRegistering(false);
      const formattedPhone = `+91 ${cleanPhone10}`;
      navigation.navigate('OTP', {
        userData: {
          name: trimmedName,
          email: trimmedEmail,
          phone: formattedPhone,
          dob: '15/08/1998',
          age: '28 Yrs',
          gender: 'Male',
          bloodGroup: 'O+ Positive',
          emergencyContact: `${formattedPhone} (Family)`,
          referralCode: trimmedReferralCode || null,
        },
        credentials: {
          email: trimmedEmail,
          phone: cleanPhone10,
          password: trimmedPassword,
        },
      });
    }
  };

  const isPasswordFilled = password.length > 0;
  const isConfirmFilled = confirmPassword.length > 0;
  const isPasswordMatch = isPasswordFilled && isConfirmFilled && password === confirmPassword && password.length >= 6;
  const isPasswordMismatch = isPasswordFilled && isConfirmFilled && password !== confirmPassword;

  return (
    <SafeAreaView
      style={[
        styles.safeArea,
        androidExtraTop > 0 && { paddingTop: androidExtraTop },
      ]}
      edges={['top', 'left', 'right', 'bottom']}
    >
      <StatusBar barStyle="dark-content" backgroundColor="#F8FAFC" />

      {/* TOP COMPLIANCE & GUEST NAVIGATION BAR */}
      <View style={styles.topUtilityBar}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.navigate('Login')}
          activeOpacity={0.7}
        >
          <Ionicons name="arrow-back" size={18} color="#1E3A8A" />
          <Text style={styles.backButtonText}>Back to Login</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.guestLink}
          onPress={handleSkipToHome}
          activeOpacity={0.7}
        >
          <Text style={styles.guestLinkText}>Skip & Explore as Guest</Text>
          <Ionicons name="chevron-forward" size={14} color="#00B894" />
        </TouchableOpacity>
      </View>

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
              paddingBottom: isKeyboardVisible ? (Platform.OS === 'ios' ? 160 : 120) : (isSmallDevice ? 12 : 28),
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

            {/* AUTH SEGMENTED SWITCHER: LOGIN | CREATE ACCOUNT */}
            <View style={[styles.segmentedContainer, isSmallDevice && styles.segmentedContainerSmall]}>
              <TouchableOpacity
                style={styles.segmentBtn}
                activeOpacity={0.8}
                onPress={() => navigation.navigate('Login')}
              >
                <Text style={styles.segmentTextInactive}>Login</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.segmentBtn, styles.segmentBtnActive]}
                activeOpacity={0.9}
              >
                <Text style={styles.segmentTextActive}>Create Account</Text>
                <View style={styles.activeUnderlineTeal} />
              </TouchableOpacity>
            </View>

            {/* CARD HEADING */}
            <View style={[styles.cardHeader, isSmallDevice && styles.cardHeaderSmall]}>
              <Text style={[styles.cardTitle, isSmallDevice && styles.cardTitleSmall]}>Create Patient Account</Text>
              <Text style={[styles.cardSubtitle, isSmallDevice && styles.cardSubtitleSmall]}>
                Enter your details to create your secure MediUnify digital health record vault.
              </Text>
            </View>

            {/* FIELD 1: FULL NAME */}
            <View style={[styles.fieldGroup, isSmallDevice && styles.fieldGroupSmall]}>
              <Text style={styles.fieldLabel}>
                Full Name <Text style={styles.requiredMark}>*</Text>
              </Text>
              <View style={[styles.inputBox, isSmallDevice && styles.inputBoxSmall, name ? styles.inputBoxFilled : null]}>
                <Ionicons
                  name="person-outline"
                  size={18}
                  color={name ? colors.primary : colors.slate}
                  style={styles.inputPrefixIcon}
                />
                <TextInput
                  style={styles.textInput}
                  placeholder="Enter your full legal name"
                  placeholderTextColor="#94A3B8"
                  value={name}
                  onChangeText={setName}
                  onFocus={() => {
                    setTimeout(() => {
                      scrollViewRef.current?.scrollTo({ y: 0, animated: true });
                    }, 100);
                  }}
                  autoCapitalize="words"
                  autoCorrect={false}
                />
                {name.length > 0 && (
                  <TouchableOpacity
                    onPress={() => setName('')}
                    style={styles.clearBtn}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  >
                    <Ionicons name="close-circle" size={16} color="#94A3B8" />
                  </TouchableOpacity>
                )}
              </View>
            </View>

            {/* FIELD 2: EMAIL ADDRESS */}
            <View style={[styles.fieldGroup, isSmallDevice && styles.fieldGroupSmall]}>
              <Text style={styles.fieldLabel}>
                Email Address <Text style={styles.requiredMark}>*</Text>
              </Text>
              <View style={[styles.inputBox, isSmallDevice && styles.inputBoxSmall, email ? styles.inputBoxFilled : null]}>
                <Ionicons
                  name="mail-outline"
                  size={18}
                  color={email ? colors.primary : colors.slate}
                  style={styles.inputPrefixIcon}
                />
                <TextInput
                  style={styles.textInput}
                  placeholder="Enter your email address"
                  placeholderTextColor="#94A3B8"
                  value={email}
                  onChangeText={setEmail}
                  onFocus={() => {
                    setTimeout(() => {
                      scrollViewRef.current?.scrollTo({ y: isSmallDevice ? 40 : 60, animated: true });
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

            {/* FIELD 3: MOBILE NUMBER (10 DIGITS) */}
            <View style={[styles.fieldGroup, isSmallDevice && styles.fieldGroupSmall]}>
              <View style={styles.fieldLabelRow}>
                <Text style={styles.fieldLabel}>
                  Mobile Number (10 digits) <Text style={styles.requiredMark}>*</Text>
                </Text>
                <Text
                  style={[
                    styles.counterText,
                    phone.length === 10 ? styles.counterTextSuccess : phone.length > 0 ? styles.counterTextWarning : null,
                  ]}
                >
                  {phone.length}/10 digits
                </Text>
              </View>
              <View
                style={[
                  styles.inputBox,
                  isSmallDevice && styles.inputBoxSmall,
                  phone.length === 10 ? styles.inputBoxValid : phone.length > 0 ? styles.inputBoxFilled : null,
                ]}
              >
                <View style={styles.countryCodeBadge}>
                  <Text style={styles.countryCodeText}>+91</Text>
                </View>
                <Ionicons
                  name="call-outline"
                  size={18}
                  color={phone.length === 10 ? colors.primary : colors.slate}
                  style={styles.inputPrefixIcon}
                />
                <TextInput
                  style={styles.textInput}
                  placeholder="10-digit mobile number"
                  placeholderTextColor="#94A3B8"
                  value={phone}
                  onChangeText={handlePhoneChange}
                  onFocus={() => {
                    setTimeout(() => {
                      scrollViewRef.current?.scrollTo({ y: isSmallDevice ? 100 : 130, animated: true });
                    }, 100);
                  }}
                  keyboardType="number-pad"
                  maxLength={10}
                />
                {phone.length === 10 ? (
                  <Ionicons name="checkmark-circle" size={18} color="#00B894" />
                ) : phone.length > 0 ? (
                  <TouchableOpacity
                    onPress={() => setPhone('')}
                    style={styles.clearBtn}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  >
                    <Ionicons name="close-circle" size={16} color="#94A3B8" />
                  </TouchableOpacity>
                ) : null}
              </View>
            </View>

            {/* FIELD 4: CREATE PASSWORD */}
            <View style={[styles.fieldGroup, isSmallDevice && styles.fieldGroupSmall]}>
              <View style={styles.fieldLabelRow}>
                <Text style={styles.fieldLabel}>
                  Create Password <Text style={styles.requiredMark}>*</Text>
                </Text>
                {password.length > 0 && (
                  <Text
                    style={[
                      styles.counterText,
                      password.length >= 6 ? styles.counterTextSuccess : styles.counterTextWarning,
                    ]}
                  >
                    {password.length >= 6 ? 'Strong' : `${password.length}/6 chars`}
                  </Text>
                )}
              </View>
              <View
                style={[
                  styles.inputBox,
                  isSmallDevice && styles.inputBoxSmall,
                  password.length >= 6 ? styles.inputBoxValid : password.length > 0 ? styles.inputBoxFilled : null,
                ]}
              >
                <Ionicons
                  name="lock-closed-outline"
                  size={18}
                  color={password ? colors.primary : colors.slate}
                  style={styles.inputPrefixIcon}
                />
                <TextInput
                  style={styles.textInput}
                  placeholder="Minimum 6 characters"
                  placeholderTextColor="#94A3B8"
                  value={password}
                  onChangeText={setPassword}
                  onFocus={() => {
                    setTimeout(() => {
                      scrollViewRef.current?.scrollTo({ y: isSmallDevice ? 170 : 200, animated: true });
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

            {/* FIELD 5: CONFIRM PASSWORD */}
            <View style={[styles.fieldGroup, isSmallDevice && styles.fieldGroupSmall]}>
              <View style={styles.fieldLabelRow}>
                <Text style={styles.fieldLabel}>
                  Confirm Password <Text style={styles.requiredMark}>*</Text>
                </Text>
                {isPasswordMatch && (
                  <View style={styles.matchedBadge}>
                    <Ionicons name="checkmark-circle" size={13} color="#00B894" />
                    <Text style={styles.matchedBadgeText}>Passwords Match</Text>
                  </View>
                )}
                {isPasswordMismatch && (
                  <Text style={styles.counterTextWarning}>Mismatch</Text>
                )}
              </View>
              <View
                style={[
                  styles.inputBox,
                  isSmallDevice && styles.inputBoxSmall,
                  isPasswordMatch ? styles.inputBoxValid : isPasswordMismatch ? styles.inputBoxWarning : null,
                ]}
              >
                <Ionicons
                  name="shield-checkmark-outline"
                  size={18}
                  color={confirmPassword ? colors.primary : colors.slate}
                  style={styles.inputPrefixIcon}
                />
                <TextInput
                  style={styles.textInput}
                  placeholder="Re-enter your password"
                  placeholderTextColor="#94A3B8"
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  onFocus={() => {
                    setTimeout(() => {
                      scrollViewRef.current?.scrollTo({ y: isSmallDevice ? 240 : 280, animated: true });
                    }, 100);
                  }}
                  secureTextEntry={!showConfirmPassword}
                  autoCapitalize="none"
                  autoCorrect={false}
                />
                <TouchableOpacity
                  style={styles.eyeBtn}
                  onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                  activeOpacity={0.7}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <Ionicons
                    name={showConfirmPassword ? 'eye-off-outline' : 'eye-outline'}
                    size={20}
                    color={showConfirmPassword ? colors.primary : colors.slate}
                  />
                </TouchableOpacity>
              </View>
            </View>

            {/* FIELD 6: REFERRAL CODE (OPTIONAL) */}
            <View style={[styles.fieldGroup, isSmallDevice && styles.fieldGroupSmall]}>
              <View style={styles.fieldLabelRow}>
                <Text style={styles.fieldLabel}>Referral Code (Optional)</Text>
                <View style={styles.bonusHintBadge}>
                  <Ionicons name="gift-outline" size={12} color="#00B894" />
                  <Text style={styles.bonusHintBadgeText}>₹250 Bonus</Text>
                </View>
              </View>
              <View style={[styles.inputBox, isSmallDevice && styles.inputBoxSmall, referralCode ? styles.inputBoxFilled : null]}>
                <Ionicons
                  name="pricetag-outline"
                  size={18}
                  color={referralCode ? colors.primary : colors.slate}
                  style={styles.inputPrefixIcon}
                />
                <TextInput
                  style={styles.textInput}
                  placeholder="Have a referral code? (Optional)"
                  placeholderTextColor="#94A3B8"
                  value={referralCode}
                  onChangeText={setReferralCode}
                  onFocus={() => {
                    setTimeout(() => {
                      scrollViewRef.current?.scrollTo({ y: isSmallDevice ? 320 : 360, animated: true });
                    }, 100);
                  }}
                  autoCapitalize="characters"
                  autoCorrect={false}
                />
                {referralCode.length > 0 && (
                  <View style={styles.appliedTag}>
                    <Text style={styles.appliedTagText}>BONUS READY</Text>
                  </View>
                )}
              </View>
            </View>

            {/* TERMS & PRIVACY CHECKBOX */}
            <TouchableOpacity
              style={[styles.termsRow, isSmallDevice && styles.termsRowSmall]}
              onPress={() => setAgreedToTerms(!agreedToTerms)}
              activeOpacity={0.8}
            >
              <View style={[styles.checkboxBox, agreedToTerms && styles.checkboxBoxChecked]}>
                {agreedToTerms && <Ionicons name="checkmark" size={13} color="#FFFFFF" />}
              </View>
              <Text style={styles.termsText}>
                I agree to the <Text style={styles.termsLink}>MediUnify Terms</Text> and{' '}
                <Text style={styles.termsLink}>Privacy Policy</Text>.
              </Text>
            </TouchableOpacity>

            {/* INLINE ERROR BANNER */}
            {errorMessage ? (
              <View style={styles.errorBox}>
                <Ionicons name="alert-circle" size={17} color="#FF7F50" />
                <Text style={styles.errorBoxText}>{errorMessage}</Text>
              </View>
            ) : null}

            {/* PRIMARY SUBMIT BUTTON: REGISTER & VERIFY MOBILE */}
            <TouchableOpacity
              style={[
                styles.primarySubmitBtn,
                isSmallDevice && styles.primarySubmitBtnSmall,
                isRegistering && styles.primarySubmitBtnDisabled,
              ]}
              onPress={() => {
                Keyboard.dismiss();
                handleRegister();
              }}
              disabled={isRegistering}
              activeOpacity={0.85}
            >
              {isRegistering ? (
                <View style={styles.btnRow}>
                  <ActivityIndicator size="small" color="#FFFFFF" style={{ marginRight: 8 }} />
                  <Text style={styles.primarySubmitBtnText}>Validating Information...</Text>
                </View>
              ) : (
                <View style={styles.btnRow}>
                  <Text style={styles.primarySubmitBtnText}>Register & Verify Mobile</Text>
                  <Ionicons name="arrow-forward" size={18} color="#FFFFFF" style={{ marginLeft: 6 }} />
                </View>
              )}
            </TouchableOpacity>

            {/* SKIP LOGIN & EXPLORE AS GUEST BUTTON */}
            <TouchableOpacity
              style={[styles.guestActionBtn, isSmallDevice && styles.guestActionBtnSmall]}
              onPress={handleSkipToHome}
              activeOpacity={0.75}
            >
              <Text style={styles.guestActionBtnText}>Skip login & explore as Guest</Text>
              <Ionicons name="arrow-forward" size={14} color="#00B894" style={{ marginLeft: 4 }} />
            </TouchableOpacity>

            {/* SIGN IN FOOTER */}
            <View style={[styles.loginFooter, isSmallDevice && styles.loginFooterSmall]}>
              <Text style={styles.loginFooterText}>Already have a MediUnify account?</Text>
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={() => navigation.navigate('Login')}
                style={styles.loginFooterBtn}
              >
                <Text style={styles.loginFooterLink}> Sign In</Text>
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
  topUtilityBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    backgroundColor: '#FFFFFF',
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  backButtonText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1E3A8A',
  },
  guestLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  guestLinkText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#00B894',
  },
  scrollContent: {
    flexGrow: 1,
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 18,
    backgroundColor: '#F8FAFC',
  },
  scrollContentSmall: {
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  scrollContentTablet: {
    paddingHorizontal: 24,
    paddingVertical: 28,
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
    maxWidth: 360,
    padding: 16,
    borderRadius: 16,
  },
  authCardTablet: {
    maxWidth: 480,
    padding: 28,
    borderRadius: 22,
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
    color: '#00B894',
  },
  segmentTextInactive: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748B',
  },
  activeUnderlineTeal: {
    width: 24,
    height: 2.5,
    backgroundColor: '#00B894',
    borderRadius: 2,
    marginTop: 3,
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
    marginBottom: 13,
  },
  fieldGroupSmall: {
    marginBottom: 10,
  },
  fieldLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 5,
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1E3A8A',
    marginBottom: 5,
  },
  requiredMark: {
    color: '#FF7F50',
    fontWeight: '800',
  },
  counterText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#94A3B8',
  },
  counterTextSuccess: {
    color: '#00B894',
  },
  counterTextWarning: {
    color: '#FF7F50',
  },
  countryCodeBadge: {
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    marginRight: 6,
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  countryCodeText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#1E3A8A',
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
    paddingHorizontal: 10,
  },
  inputBoxFilled: {
    borderColor: '#CBD5E1',
    backgroundColor: '#FFFFFF',
  },
  inputBoxValid: {
    borderColor: '#A7F3D0',
    backgroundColor: '#FFFFFF',
  },
  inputBoxWarning: {
    borderColor: '#FFD7C7',
    backgroundColor: '#FFFBF9',
  },
  inputPrefixIcon: {
    marginRight: 8,
  },
  textInput: {
    flex: 1,
    fontSize: 13.5,
    color: '#0F172A',
    paddingVertical: 0,
  },
  clearBtn: {
    padding: 4,
  },
  eyeBtn: {
    padding: 4,
  },
  matchedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  matchedBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#00B894',
  },
  bonusHintBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#E6F8F4',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 8,
  },
  bonusHintBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#00B894',
  },
  appliedTag: {
    backgroundColor: '#E6F8F4',
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 6,
  },
  appliedTagText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#00B894',
  },
  termsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 2,
    marginBottom: 14,
  },
  termsRowSmall: {
    marginBottom: 10,
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
  termsText: {
    fontSize: 12,
    color: '#64748B',
    flex: 1,
    lineHeight: 17,
  },
  termsLink: {
    color: '#00B894',
    fontWeight: '700',
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
  guestActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: '#F0FDF9',
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  guestActionBtnSmall: {
    marginTop: 10,
    paddingVertical: 8,
  },
  guestActionBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#00B894',
  },
  loginFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    flexWrap: 'wrap',
    marginTop: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  loginFooterSmall: {
    marginTop: 12,
    paddingTop: 10,
  },
  loginFooterText: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '500',
  },
  loginFooterBtn: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  loginFooterLink: {
    fontSize: 12,
    fontWeight: '800',
    color: '#00B894',
  },
});

export default RegisterScreen;