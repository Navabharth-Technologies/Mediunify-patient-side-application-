// AuthGuardContext.js - Global reusable authentication guard for MediUnify
// Usage: const { requireLogin } = useAuthGuard(); requireLogin(() => proceedWithBooking());
import React, { createContext, useContext, useState, useRef, useCallback, useEffect } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, TextInput, Platform, KeyboardAvoidingView, ActivityIndicator } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { syncLogin, syncRegister } from '../services/dataSyncService';

const AuthGuardContext = createContext(null);

const PRE_SEEDED_CREDENTIALS = {
  'user@mediunify.com': { password: 'password123', userData: { name: 'Demo Patient', email: 'user@mediunify.com', phone: '+91 98765 43210', gender: 'Male', bloodGroup: 'O+ Positive', age: '29 Yrs' } },
  '9876543210': { password: 'password123', userData: { name: 'Demo Patient', email: 'user@mediunify.com', phone: '+91 98765 43210', gender: 'Male', bloodGroup: 'O+ Positive', age: '29 Yrs' } },
  'admin@unnathi.com': { password: 'password123', userData: { name: 'Dr. Unnathi Admin', email: 'admin@unnathi.com', phone: '+91 98450 12345', gender: 'Female', bloodGroup: 'A+ Positive', age: '34 Yrs' } },
  '9845012345': { password: 'password123', userData: { name: 'Dr. Unnathi Admin', email: 'admin@unnathi.com', phone: '+91 98450 12345', gender: 'Female', bloodGroup: 'A+ Positive', age: '34 Yrs' } },
};

export const AuthGuardProvider = ({ children }) => {
  const [gateVisible, setGateVisible] = useState(false);
  const [loginVisible, setLoginVisible] = useState(false);
  const [gateTitle, setGateTitle] = useState('Login Required');
  const [gateMessage, setGateMessage] = useState('You need to login first to book an appointment with the doctor.');
  const pendingActionRef = useRef(null);

  const [authTab, setAuthTab] = useState('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (Platform.OS === 'web' && typeof document !== 'undefined') {
      const id = 'mediunify-auth-guard-css';
      let s = document.getElementById(id);
      if (!s) {
        s = document.createElement('style');
        s.id = id;
        document.head.appendChild(s);
      }
      s.innerHTML = `
        .ag-login-btn-hover { transition: background-color 0.18s ease, transform 0.15s ease !important; }
        .ag-login-btn-hover:hover { background-color: #009E7E !important; transform: translateY(-1px) !important; }
        .ag-tab-hover { transition: color 0.15s ease !important; cursor: pointer !important; }
        .ag-cancel-btn-hover { transition: background-color 0.15s ease !important; }
        .ag-cancel-btn-hover:hover { background-color: #F1F5F9 !important; }

        /* Modal portal stacking rules: AuthGuard modals always stack above background modals without re-rendering DOM */
        div:has(#ag-auth-gate-root),
        div:has(#ag-auth-login-root),
        div:has(> #ag-auth-gate-root),
        div:has(> #ag-auth-login-root) {
          z-index: 999999 !important;
        }
        div:has(#doctor-booking-modal-overlay) {
          z-index: 9990 !important;
        }
        #ag-auth-gate-root,
        #ag-auth-login-root {
          z-index: 999999 !important;
        }
      `;
    }
  }, []);

  // Ensure AuthGuard modal ancestors have high z-index without moving DOM nodes (eliminates any blinking)
  useEffect(() => {
    if (Platform.OS === 'web' && typeof document !== 'undefined') {
      if (gateVisible || loginVisible) {
        const targetId = gateVisible ? 'ag-auth-gate-root' : 'ag-auth-login-root';
        const el = document.getElementById(targetId);
        if (el) {
          let curr = el;
          while (curr && curr !== document.body) {
            curr.style.setProperty('z-index', '999999', 'important');
            curr = curr.parentElement;
          }
        }
      }
    }
  }, [gateVisible, loginVisible]);

  const resetForm = useCallback(() => {
    setEmail('');
    setPassword('');
    setShowPassword(false);
    setRegName('');
    setRegEmail('');
    setRegPhone('');
    setRegPassword('');
    setErrorMessage('');
    setIsSubmitting(false);
    setAuthTab('login');
  }, []);

  const requireLogin = useCallback(async (pendingAction, customMessage, customTitle) => {
    try {
      const stored = await AsyncStorage.getItem('isLoggedIn');
      if (stored === 'true') {
        if (pendingAction) pendingAction();
        return;
      }
    } catch (e) {}
    pendingActionRef.current = pendingAction || null;
    setGateTitle(customTitle || 'Login Required');
    setGateMessage(customMessage || 'You need to login first to book an appointment with the doctor.');
    setGateVisible(true);
  }, []);

  const handleGateOK = useCallback(() => {
    setGateVisible(false);
    resetForm();
    setLoginVisible(true);
  }, [resetForm]);

  const handleGateCancel = useCallback(() => {
    setGateVisible(false);
    pendingActionRef.current = null;
  }, []);

  const handleCloseLogin = useCallback(() => {
    setLoginVisible(false);
    pendingActionRef.current = null;
  }, []);

  const onLoginSuccess = async () => {
    setIsSubmitting(false);
    setLoginVisible(false);
    const action = pendingActionRef.current;
    pendingActionRef.current = null;
    if (action) {
      setTimeout(() => {
        try { action(); } catch (e) { console.warn('[AuthGuard] pending action error:', e); }
      }, 350);
    }
  };

  const handleLogin = async () => {
    const inputVal = email.trim();
    const inputPassword = password.trim();
    setErrorMessage('');
    if (!inputVal || !inputPassword) {
      setErrorMessage('Please enter your email/phone and password.');
      return;
    }
    setIsSubmitting(true);
    try {
      try {
        const syncRes = await syncLogin(inputVal, inputPassword);
        if (syncRes.success && syncRes.user) {
          await AsyncStorage.setItem('isLoggedIn', 'true');
          await onLoginSuccess();
          return;
        } else if (syncRes.status === 401) {
          setIsSubmitting(false);
          setErrorMessage('Incorrect password. Please verify and try again.');
          return;
        }
      } catch (e) {}

      const cleanPhone = inputVal.replace(/[^0-9]/g, '');
      const cleanPhone10 = cleanPhone.length >= 10 ? cleanPhone.slice(-10) : cleanPhone;
      const lowerEmail = inputVal.toLowerCase();

      const regCredsStr = await AsyncStorage.getItem('@unnathi_registered_credentials');
      let registeredCreds = {};
      if (regCredsStr) { try { registeredCreds = JSON.parse(regCredsStr); } catch (e) {} }

      const allCreds = { ...PRE_SEEDED_CREDENTIALS, ...registeredCreds };
      const matchingCred = allCreds[lowerEmail] || (cleanPhone10.length === 10 ? allCreds[cleanPhone10] : null);

      if (matchingCred && matchingCred.password && matchingCred.password !== inputPassword) {
        setIsSubmitting(false);
        setErrorMessage('Incorrect password. Please verify and try again.');
        return;
      }

      const regUsersStr = await AsyncStorage.getItem('@unnathi_registered_users');
      let registeredUsers = {};
      if (regUsersStr) { try { registeredUsers = JSON.parse(regUsersStr); } catch (e) {} }

      const foundReg = (matchingCred && matchingCred.userData) || registeredUsers[lowerEmail] || registeredUsers[cleanPhone10];
      const userName = foundReg?.name || (lowerEmail.includes('@') ? lowerEmail.split('@')[0] : ('User ' + cleanPhone10.slice(-4)));
      const userData = {
        name: userName,
        email: lowerEmail.includes('@') ? lowerEmail : (foundReg?.email || 'user@example.com'),
        phone: cleanPhone10.length === 10 ? ('+91 ' + cleanPhone10) : '+91 98450 12345',
        gender: foundReg?.gender || 'Male',
        bloodGroup: foundReg?.bloodGroup || 'O+ Positive',
        age: foundReg?.age || '28 Yrs',
      };

      await AsyncStorage.setItem('user', JSON.stringify(userData));
      await AsyncStorage.setItem('@unnathi_primary_user', JSON.stringify(userData));
      await AsyncStorage.setItem('userName', userData.name);
      await AsyncStorage.setItem('userEmail', userData.email);
      await AsyncStorage.setItem('isLoggedIn', 'true');
      try { syncRegister(userData, inputPassword); } catch (e) {}
      await onLoginSuccess();
    } catch (err) {
      setIsSubmitting(false);
      setErrorMessage('An error occurred during login. Please try again.');
    }
  };

  const handleRegister = async () => {
    const nameVal = regName.trim();
    const emailVal = regEmail.trim().toLowerCase();
    const phoneVal = regPhone.trim().replace(/[^0-9]/g, '');
    const passVal = regPassword.trim();
    setErrorMessage('');
    if (!nameVal || !emailVal || !phoneVal || !passVal) {
      setErrorMessage('Please fill in all registration fields.');
      return;
    }
    if (phoneVal.length < 10) {
      setErrorMessage('Please enter a valid 10-digit mobile number.');
      return;
    }
    setIsSubmitting(true);
    try {
      const cleanPhone10 = phoneVal.slice(-10);
      const userData = { name: nameVal, email: emailVal, phone: ('+91 ' + cleanPhone10), gender: 'Not specified', bloodGroup: 'B+', age: '28 Yrs' };
      const regCredsStr = await AsyncStorage.getItem('@unnathi_registered_credentials');
      let registeredCreds = {};
      if (regCredsStr) { try { registeredCreds = JSON.parse(regCredsStr); } catch (e) {} }
      registeredCreds[emailVal] = { password: passVal, userData };
      registeredCreds[cleanPhone10] = { password: passVal, userData };
      await AsyncStorage.setItem('@unnathi_registered_credentials', JSON.stringify(registeredCreds));
      await AsyncStorage.setItem('user', JSON.stringify(userData));
      await AsyncStorage.setItem('@unnathi_primary_user', JSON.stringify(userData));
      await AsyncStorage.setItem('userName', userData.name);
      await AsyncStorage.setItem('userEmail', userData.email);
      await AsyncStorage.setItem('isLoggedIn', 'true');
      try { syncRegister(userData, passVal); } catch (e) {}
      await onLoginSuccess();
    } catch (err) {
      setIsSubmitting(false);
      setErrorMessage('Could not complete registration. Please try again.');
    }
  };

  const contextValue = {
    requireLogin,
    openLoginModal: () => {
      resetForm();
      setLoginVisible(true);
    },
  };

  return (
    <AuthGuardContext.Provider value={contextValue}>
      {children}

      {/* GATE MODAL */}
      <Modal visible={gateVisible} transparent animationType="fade" onRequestClose={handleGateCancel}>
        <View style={styles.overlay} nativeID="ag-auth-gate-root">
          <View style={styles.gateCard}>
            <View style={styles.gateIconCircle}>
              <Ionicons name="lock-closed" size={28} color="#FFFFFF" />
            </View>
            <Text style={styles.gateTitle}>{gateTitle}</Text>
            <Text style={styles.gateMessage}>
              {gateMessage}
            </Text>
            <View style={styles.gateActions}>
              <TouchableOpacity
                style={styles.gateCancelBtn}
                className="ag-cancel-btn-hover"
                onPress={handleGateCancel}
                activeOpacity={0.8}
              >
                <Text style={styles.gateCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.gateOKBtn}
                className="ag-login-btn-hover"
                onPress={handleGateOK}
                activeOpacity={0.85}
              >
                <Text style={styles.gateOKText}>OK</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* FULL LOGIN MODAL */}
      <Modal visible={loginVisible} transparent animationType="fade" onRequestClose={handleCloseLogin}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.overlay} nativeID="ag-auth-login-root">
          <View style={styles.loginContainer}>
            <View style={styles.loginHeader}>
              <View>
                <View style={styles.brandRow}>
                  <Text style={styles.brandMedi}>Medi</Text>
                  <Text style={styles.brandUnify}>Unify</Text>
                </View>
                <Text style={styles.brandTagline}>All your healthcare. One intelligent platform.</Text>
              </View>
              <TouchableOpacity onPress={handleCloseLogin} style={styles.closeBtn} activeOpacity={0.7}>
                <Ionicons name="close" size={22} color="#64748B" />
              </TouchableOpacity>
            </View>

            <View style={styles.tabRow}>
              <TouchableOpacity
                style={[styles.tab, authTab === 'login' && styles.tabActive]}
                className="ag-tab-hover"
                onPress={() => { setAuthTab('login'); setErrorMessage(''); }}
              >
                <Text style={[styles.tabText, authTab === 'login' && styles.tabTextActive]}>Login</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.tab, authTab === 'register' && styles.tabActive]}
                className="ag-tab-hover"
                onPress={() => { setAuthTab('register'); setErrorMessage(''); }}
              >
                <Text style={[styles.tabText, authTab === 'register' && styles.tabTextActive]}>Create Account</Text>
              </TouchableOpacity>
            </View>

            {!!errorMessage && (
              <View style={styles.errorBox}>
                <Ionicons name="alert-circle" size={16} color="#EF4444" style={{ marginRight: 6 }} />
                <Text style={styles.errorText}>{errorMessage}</Text>
              </View>
            )}

            {authTab === 'login' ? (
              <View style={styles.formBody}>
                <Text style={styles.inputLabel}>Email or Mobile Number</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="Enter email or 10-digit mobile"
                  placeholderTextColor="#94A3B8"
                  value={email}
                  onChangeText={setEmail}
                  autoCapitalize="none"
                  keyboardType="email-address"
                />
                <Text style={[styles.inputLabel, { marginTop: 12 }]}>Password</Text>
                <View style={styles.passwordWrap}>
                  <TextInput
                    style={[styles.textInput, { flex: 1, borderWidth: 0 }]}
                    placeholder="Enter your password"
                    placeholderTextColor="#94A3B8"
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry={!showPassword}
                  />
                  <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeBtn}>
                    <Ionicons name={showPassword ? 'eye-off-outline' : 'eye-outline'} size={20} color="#64748B" />
                  </TouchableOpacity>
                </View>
                <View style={{ flexDirection: 'row', justifyContent: 'flex-end', marginTop: 8, marginBottom: 4 }}>
                  <TouchableOpacity
                    onPress={() => {
                      setErrorMessage('Password reset instructions will be sent to your registered email/phone.');
                    }}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
                  </TouchableOpacity>
                </View>
                <TouchableOpacity
                  style={[styles.submitBtn, { marginTop: 14 }, isSubmitting && styles.submitBtnDisabled]}
                  className="ag-login-btn-hover"
                  onPress={handleLogin}
                  disabled={isSubmitting}
                  activeOpacity={0.85}
                >
                  {isSubmitting
                    ? <ActivityIndicator size="small" color="#FFFFFF" />
                    : <Text style={styles.submitBtnText}>Login</Text>
                  }
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.formBody}>
                <Text style={styles.inputLabel}>Full Name</Text>
                <TextInput style={styles.textInput} placeholder="e.g. Ramesh Kumar" placeholderTextColor="#94A3B8" value={regName} onChangeText={setRegName} />
                <Text style={[styles.inputLabel, { marginTop: 12 }]}>Email Address</Text>
                <TextInput style={styles.textInput} placeholder="e.g. ramesh@example.com" placeholderTextColor="#94A3B8" value={regEmail} onChangeText={setRegEmail} autoCapitalize="none" keyboardType="email-address" />
                <Text style={[styles.inputLabel, { marginTop: 12 }]}>Mobile Number (10 digits)</Text>
                <TextInput style={styles.textInput} placeholder="e.g. 9845012345" placeholderTextColor="#94A3B8" value={regPhone} onChangeText={setRegPhone} keyboardType="phone-pad" maxLength={10} />
                <Text style={[styles.inputLabel, { marginTop: 12 }]}>Create Password</Text>
                <TextInput style={styles.textInput} placeholder="Enter a secure password" placeholderTextColor="#94A3B8" value={regPassword} onChangeText={setRegPassword} secureTextEntry />
                <TouchableOpacity
                  style={[styles.submitBtn, { marginTop: 16 }, isSubmitting && styles.submitBtnDisabled]}
                  className="ag-login-btn-hover"
                  onPress={handleRegister}
                  disabled={isSubmitting}
                  activeOpacity={0.85}
                >
                  {isSubmitting
                    ? <ActivityIndicator size="small" color="#FFFFFF" />
                    : <Text style={styles.submitBtnText}>Register & Get Started</Text>
                  }
                </TouchableOpacity>
              </View>
            )}

            <TouchableOpacity onPress={handleCloseLogin} style={styles.guestBtn} activeOpacity={0.7}>
              <Text style={styles.guestBtnText}>Skip login & explore as Guest</Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </AuthGuardContext.Provider>
  );
};

export const useAuthGuard = () => {
  const ctx = useContext(AuthGuardContext);
  if (!ctx) throw new Error('useAuthGuard must be used inside AuthGuardProvider');
  return ctx;
};

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(15,23,42,0.55)', justifyContent: 'center', alignItems: 'center', paddingHorizontal: 20, ...(Platform.OS === 'web' ? { zIndex: 999999 } : {}) },
  gateCard: { width: '100%', maxWidth: 420, backgroundColor: '#FFFFFF', borderRadius: 20, padding: 28, alignItems: 'center', shadowColor: '#0F172A', shadowOffset: { width: 0, height: 20 }, shadowOpacity: 0.18, shadowRadius: 40, elevation: 12, ...(Platform.OS === 'web' ? { zIndex: 999999 } : {}) },
  gateIconCircle: { width: 64, height: 64, borderRadius: 32, backgroundColor: '#00B894', alignItems: 'center', justifyContent: 'center', marginBottom: 16, shadowColor: '#00B894', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.3, shadowRadius: 12, elevation: 6 },
  gateTitle: { fontSize: 20, fontWeight: '800', color: '#0F172A', marginBottom: 10, textAlign: 'center', letterSpacing: -0.3 },
  gateMessage: { fontSize: 14, color: '#475569', lineHeight: 21, textAlign: 'center', marginBottom: 24, maxWidth: 340 },
  gateActions: { flexDirection: 'row', gap: 12, width: '100%' },
  gateCancelBtn: { flex: 1, paddingVertical: 13, borderRadius: 11, borderWidth: 1.5, borderColor: '#DCE7EC', alignItems: 'center', backgroundColor: '#FAFCFD', ...(Platform.OS === 'web' ? { cursor: 'pointer' } : {}) },
  gateCancelText: { fontSize: 14, fontWeight: '700', color: '#475569' },
  gateOKBtn: { flex: 1, flexDirection: 'row', paddingVertical: 13, borderRadius: 11, backgroundColor: '#00B894', alignItems: 'center', justifyContent: 'center', shadowColor: '#00B894', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.28, shadowRadius: 8, elevation: 4, ...(Platform.OS === 'web' ? { cursor: 'pointer' } : {}) },
  gateOKText: { fontSize: 14, fontWeight: '700', color: '#FFFFFF' },
  forgotPasswordText: { fontSize: 12, color: '#00B894', fontWeight: '600', ...(Platform.OS === 'web' ? { cursor: 'pointer' } : {}) },
  loginContainer: { width: '100%', maxWidth: 460, backgroundColor: '#FFFFFF', borderRadius: 20, overflow: 'hidden', shadowColor: '#0F172A', shadowOffset: { width: 0, height: 24 }, shadowOpacity: 0.18, shadowRadius: 48, elevation: 14, ...(Platform.OS === 'web' ? { zIndex: 999999 } : {}) },
  loginHeader: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', paddingHorizontal: 24, paddingTop: 22, paddingBottom: 16, borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
  brandRow: { flexDirection: 'row', alignItems: 'baseline' },
  brandMedi: { fontSize: 21, fontWeight: '900', color: '#1E3A8A', letterSpacing: -0.5 },
  brandUnify: { fontSize: 21, fontWeight: '900', color: '#00B894', letterSpacing: -0.5 },
  brandTagline: { fontSize: 11, color: '#64748B', fontWeight: '600', marginTop: 2 },
  closeBtn: { padding: 4, borderRadius: 8, ...(Platform.OS === 'web' ? { cursor: 'pointer' } : {}) },
  tabRow: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
  tab: { flex: 1, paddingVertical: 13, alignItems: 'center', borderBottomWidth: 2, borderBottomColor: 'transparent', ...(Platform.OS === 'web' ? { cursor: 'pointer' } : {}) },
  tabActive: { borderBottomColor: '#00B894' },
  tabText: { fontSize: 14, fontWeight: '600', color: '#64748B' },
  tabTextActive: { color: '#00B894', fontWeight: '700' },
  errorBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FEF2F2', borderWidth: 1, borderColor: '#FECACA', borderRadius: 10, paddingHorizontal: 14, paddingVertical: 10, marginHorizontal: 24, marginTop: 14 },
  errorText: { flex: 1, fontSize: 13, color: '#EF4444', fontWeight: '500' },
  formBody: { paddingHorizontal: 24, paddingTop: 18, paddingBottom: 4 },
  inputLabel: { fontSize: 13, fontWeight: '700', color: '#334155', marginBottom: 6 },
  textInput: { borderWidth: 1.5, borderColor: '#DCE7EC', borderRadius: 10, paddingHorizontal: 14, paddingVertical: 11, fontSize: 14, color: '#0F172A', backgroundColor: '#FAFCFD', ...(Platform.OS === 'web' ? { outlineStyle: 'none' } : {}) },
  passwordWrap: { flexDirection: 'row', alignItems: 'center', borderWidth: 1.5, borderColor: '#DCE7EC', borderRadius: 10, backgroundColor: '#FAFCFD', paddingLeft: 14, paddingRight: 6 },
  eyeBtn: { padding: 8, ...(Platform.OS === 'web' ? { cursor: 'pointer' } : {}) },
  submitBtn: { marginTop: 16, backgroundColor: '#00B894', borderRadius: 11, paddingVertical: 13, alignItems: 'center', justifyContent: 'center', shadowColor: '#00B894', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.25, shadowRadius: 8, elevation: 4, ...(Platform.OS === 'web' ? { cursor: 'pointer' } : {}) },
  submitBtnDisabled: { backgroundColor: '#94A3B8', shadowOpacity: 0 },
  submitBtnText: { fontSize: 15, fontWeight: '700', color: '#FFFFFF' },
  guestBtn: { paddingVertical: 14, alignItems: 'center', ...(Platform.OS === 'web' ? { cursor: 'pointer' } : {}) },
  guestBtnText: { fontSize: 13, color: '#64748B', fontWeight: '500' },
});
