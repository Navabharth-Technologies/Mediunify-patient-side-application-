import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Platform,
  StatusBar,
  Linking,
  useWindowDimensions,
} from 'react-native';
import { showAlert } from '../../utils/alert';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import colors from '../../theme/colors';
import { useTheme } from '../../context/ThemeContext';
import { syncActiveUser } from '../../services/dataSyncService';

const ProfileScreen = ({ navigation, route }) => {
  const { isDarkMode, language, LANGUAGES } = useTheme();
  const currentLang = LANGUAGES.find((l) => l.code === language) || LANGUAGES[0];
  const { width } = useWindowDimensions();

  // User Profile State
  const [user, setUser] = useState({
    name: route?.params?.updatedUser?.name || 'Ramesh Kumar',
    email: route?.params?.updatedUser?.email || 'ramesh.kumar@example.com',
    phone: route?.params?.updatedUser?.phone || '+91 98450 12345',
    bloodGroup: 'O+ Positive',
    age: '32 Yrs',
    gender: 'Male',
    emergencyContact: '+91 98450 11223 (Family)',
    uhid: 'MU-84920',
  });

  const [walletBalance, setWalletBalance] = useState(1250);
  const [carePoints, setCarePoints] = useState(500);
  const [familyCount, setFamilyCount] = useState(1);

  // Load Saved Data on Mount & Screen Focus
  useEffect(() => {
    loadProfileData();
    const unsubscribe = navigation.addListener('focus', () => {
      loadProfileData();
    });
    return unsubscribe;
  }, [navigation]);

  useEffect(() => {
    if (route?.params?.updatedUser) {
      setUser((prev) => ({
        ...prev,
        name: route.params.updatedUser.name || prev.name,
        email: route.params.updatedUser.email || prev.email,
        phone: route.params.updatedUser.phone || prev.phone,
        bloodGroup: route.params.updatedUser.bloodGroup || prev.bloodGroup,
        gender: route.params.updatedUser.gender || prev.gender,
        age: route.params.updatedUser.age || prev.age,
        emergencyContact: route.params.updatedUser.emergencyContact || prev.emergencyContact,
      }));
    }
  }, [route?.params?.updatedUser]);

  const loadProfileData = async () => {
    try {
      const storedPrimary = await AsyncStorage.getItem('@unnathi_primary_user');
      const storedUser = await AsyncStorage.getItem('user');
      const storedName = await AsyncStorage.getItem('userName');
      const storedEmail = await AsyncStorage.getItem('userEmail');
      const storedPhone = await AsyncStorage.getItem('userPhone');
      const savedWallet = await AsyncStorage.getItem('@unnathi_wallet_balance');

      let parsedUser = null;
      if (storedPrimary) {
        try {
          parsedUser = JSON.parse(storedPrimary);
        } catch (e) {}
      } else if (storedUser) {
        try {
          parsedUser = JSON.parse(storedUser);
        } catch (e) {}
      }

      const regUsersStr = await AsyncStorage.getItem('@unnathi_registered_users');
      let registeredUsers = {};
      if (regUsersStr) {
        try {
          registeredUsers = JSON.parse(regUsersStr);
        } catch (e) {}
      }

      const activeEmail = (parsedUser?.email || storedEmail || '').toLowerCase().trim();
      const regUser = registeredUsers[activeEmail];

      let resolvedFullName = '';
      if (parsedUser?.name && !parsedUser.name.includes('@') && parsedUser.name.trim()) {
        resolvedFullName = parsedUser.name.trim();
      } else if (regUser?.name && !regUser.name.includes('@') && regUser.name.trim()) {
        resolvedFullName = regUser.name.trim();
      } else if (storedName && !storedName.includes('@') && storedName.trim()) {
        resolvedFullName = storedName.trim();
      } else if (parsedUser?.name) {
        const clean =
          parsedUser.name.split('@')[0].replace(/[._-]/g, ' ').replace(/[0-9]/g, '').trim() ||
          parsedUser.name.split('@')[0].replace(/[._-]/g, ' ').trim();
        resolvedFullName =
          clean
            .split(' ')
            .filter(Boolean)
            .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
            .join(' ') || '';
      }

      setUser((prev) => ({
        ...prev,
        name: resolvedFullName || prev.name,
        email: parsedUser?.email || (storedEmail && storedEmail.trim() ? storedEmail.trim() : prev.email),
        phone: parsedUser?.phone || (storedPhone && storedPhone.trim() ? storedPhone.trim() : prev.phone),
        bloodGroup: parsedUser?.bloodGroup || regUser?.bloodGroup || prev.bloodGroup,
        age: parsedUser?.age || regUser?.age || prev.age,
        gender: parsedUser?.gender || regUser?.gender || prev.gender,
        emergencyContact: parsedUser?.emergencyContact || regUser?.emergencyContact || prev.emergencyContact,
        dob: parsedUser?.dob || regUser?.dob || prev.dob || '',
      }));

      if (savedWallet) {
        setWalletBalance(parseInt(savedWallet, 10) || 1250);
      }

      try {
        const famStr = await AsyncStorage.getItem('@unnathi_family_members');
        if (famStr) {
          const parsedFam = JSON.parse(famStr);
          if (Array.isArray(parsedFam) && parsedFam.length > 0) {
            setFamilyCount(parsedFam.length);
          }
        }
      } catch (e) {}

      try {
        syncActiveUser().then((latest) => {
          if (latest) {
            setUser((prev) => ({
              ...prev,
              name: latest.name || prev.name,
              email: latest.email || prev.email,
              phone: latest.phone || prev.phone,
              bloodGroup: latest.bloodGroup || prev.bloodGroup,
              age: latest.age || prev.age,
              gender: latest.gender || prev.gender,
              emergencyContact: latest.emergencyContact || prev.emergencyContact,
              dob: latest.dob || prev.dob || '',
            }));
            if (latest.walletBalance !== undefined) {
              setWalletBalance(latest.walletBalance);
            }
            if (latest.familyMembers && Array.isArray(latest.familyMembers) && latest.familyMembers.length > 0) {
              setFamilyCount(latest.familyMembers.length);
            }
          }
        });
      } catch (syncErr) {}
    } catch (e) {
      console.log('Error loading profile data:', e);
    }
  };

  const handleEditProfile = () => {
    navigation.navigate('EditProfile', { user });
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

      if (Platform.OS === 'web' && typeof window !== 'undefined') {
        setTimeout(() => {
          if (window.location) {
            window.location.href = '/';
          }
        }, 150);
      }
    };

    showAlert(
      'Logout from MediUnify',
      'Are you sure you want to securely log out of your healthcare account?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: doLogout,
        },
      ]
    );
  };

  const userInitial = user.name?.trim() ? user.name.trim().charAt(0).toUpperCase() : 'U';

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: isDarkMode ? '#0B0F19' : '#F8FAFC' }]}>
      <StatusBar
        barStyle={isDarkMode ? 'light-content' : 'dark-content'}
        backgroundColor={isDarkMode ? '#0B0F19' : '#FFFFFF'}
      />

      {/* TOP HEADER BAR (HOMESCREEN MATCHED) */}
      <View style={styles.headerBar}>
        {navigation.canGoBack() ? (
          <TouchableOpacity
            style={styles.headerBtn}
            onPress={() => navigation.goBack()}
            activeOpacity={0.8}
          >
            <Ionicons name="arrow-back" size={22} color="#0F172A" />
          </TouchableOpacity>
        ) : (
          <View style={styles.headerBrandBadge}>
            <Ionicons name="shield-checkmark" size={16} color="#0D9488" />
            <Text style={styles.headerBrandText}>MediUnify</Text>
          </View>
        )}

        <Text style={styles.headerTitle}>My Profile</Text>

        <View style={styles.headerRightActions}>
          <TouchableOpacity
            style={styles.headerBtn}
            onPress={() => navigation.navigate('Notifications')}
            activeOpacity={0.8}
          >
            <Ionicons name="notifications-outline" size={20} color="#0F172A" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.pageInnerContainer}>
          {/* ============================================================
              1. MAIN USER PROFILE CARD (HOMESCREEN CLEAN AESTHETIC)
          ============================================================ */}
          <View style={styles.profileCard}>
            <View style={styles.profileHeaderRow}>
              <View style={styles.avatarContainer}>
                <View style={styles.avatarCircle}>
                  <Text style={styles.avatarText}>{userInitial}</Text>
                </View>
                <TouchableOpacity
                  style={styles.avatarBadge}
                  onPress={handleEditProfile}
                  activeOpacity={0.85}
                >
                  <Ionicons name="camera" size={12} color="#FFFFFF" />
                </TouchableOpacity>
              </View>

              <View style={styles.profileInfoCol}>
                <View style={styles.nameRow}>
                  <Text style={styles.userNameText} numberOfLines={1}>
                    {user.name}
                  </Text>
                  <Ionicons name="checkmark-circle" size={18} color="#0D9488" />
                </View>
                <Text style={styles.userContactText}>📞 {user.phone}</Text>
                <Text style={styles.userContactText} numberOfLines={1}>
                  ✉️ {user.email}
                </Text>

                <View style={styles.uhidPill}>
                  <Ionicons name="finger-print" size={12} color="#0D9488" />
                  <Text style={styles.uhidPillText}>UHID: {user.uhid || 'MU-84920'}</Text>
                </View>
              </View>
            </View>

            {/* QUICK HEALTH TAGS */}
            <View style={styles.healthTagsRow}>
              <View style={styles.healthTag}>
                <Ionicons name="water" size={12} color="#DC2626" />
                <Text style={styles.healthTagText}>{user.bloodGroup || 'O+'}</Text>
              </View>
              <View style={styles.healthTag}>
                <Ionicons name="person" size={12} color="#2563EB" />
                <Text style={styles.healthTagText}>{user.age} • {user.gender}</Text>
              </View>
              <View style={styles.healthTag}>
                <Ionicons name="call" size={12} color="#D97706" />
                <Text style={styles.healthTagText}>SOS Contact</Text>
              </View>
            </View>

            {/* ACTION PILLS */}
            <View style={styles.profileActionsRow}>
              <TouchableOpacity
                style={styles.editProfileBtn}
                onPress={handleEditProfile}
                activeOpacity={0.85}
              >
                <Ionicons name="create-outline" size={15} color="#0D9488" />
                <Text style={styles.editProfileBtnText}>Edit Profile</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.passwordBtn}
                onPress={() => navigation.navigate('EditProfile', { user, openPassword: true })}
                activeOpacity={0.85}
              >
                <Ionicons name="lock-closed-outline" size={15} color="#475569" />
                <Text style={styles.passwordBtnText}>Security</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* ============================================================
              2. 3-TILE SUMMARY METRICS (HOMESCREEN 3x3 STYLE)
          ============================================================ */}
          <View style={styles.metricsRow}>
            {/* CARE WALLET */}
            <TouchableOpacity
              style={styles.metricTile}
              onPress={() => navigation.navigate('Wallet')}
              activeOpacity={0.85}
            >
              <View style={[styles.metricIconBox, { backgroundColor: '#F0FDFA' }]}>
                <Ionicons name="wallet" size={20} color="#0D9488" />
              </View>
              <Text style={styles.metricLabel}>Wallet</Text>
              <Text style={styles.metricValue}>₹{walletBalance.toLocaleString('en-IN')}</Text>
              <Text style={[styles.metricSub, { color: '#0D9488' }]}>Top Up ›</Text>
            </TouchableOpacity>

            {/* HEALTH POINTS */}
            <TouchableOpacity
              style={styles.metricTile}
              onPress={() => navigation.navigate('ReferEarn')}
              activeOpacity={0.85}
            >
              <View style={[styles.metricIconBox, { backgroundColor: '#FEF3C7' }]}>
                <Ionicons name="ribbon" size={20} color="#D97706" />
              </View>
              <Text style={styles.metricLabel}>Care Points</Text>
              <Text style={styles.metricValue}>{carePoints} Pts</Text>
              <Text style={[styles.metricSub, { color: '#D97706' }]}>Redeem ›</Text>
            </TouchableOpacity>

            {/* FAMILY MEMBERS */}
            <TouchableOpacity
              style={styles.metricTile}
              onPress={() => navigation.navigate('FamilyProfiles')}
              activeOpacity={0.85}
            >
              <View style={[styles.metricIconBox, { backgroundColor: '#FAF5FF' }]}>
                <Ionicons name="people" size={20} color="#7C3AED" />
              </View>
              <Text style={styles.metricLabel}>Family</Text>
              <Text style={styles.metricValue}>{familyCount} Members</Text>
              <Text style={[styles.metricSub, { color: '#7C3AED' }]}>+ Add ›</Text>
            </TouchableOpacity>
          </View>

          {/* ============================================================
              3. GROUP 1: HEALTHCARE SERVICES & RECORDS
          ============================================================ */}
          <Text style={styles.groupHeaderTitle}>Healthcare Services</Text>
          <View style={styles.menuCard}>
            {/* 1. APPOINTMENTS */}
            <TouchableOpacity
              style={styles.menuRow}
              onPress={() => navigation.navigate('Bookings')}
              activeOpacity={0.75}
            >
              <View style={[styles.menuIconCircle, { backgroundColor: '#E0F2FE' }]}>
                <Ionicons name="calendar-outline" size={19} color="#0284C7" />
              </View>
              <View style={styles.menuTextCol}>
                <Text style={styles.menuItemTitle}>My Appointments & Visits</Text>
                <Text style={styles.menuItemSubtitle}>Doctor consultations, token slips & video calls</Text>
              </View>
              <Ionicons name="chevron-forward" size={17} color="#CBD5E1" />
            </TouchableOpacity>

            {/* 2. MEDICAL RECORDS */}
            <TouchableOpacity
              style={styles.menuRow}
              onPress={() => navigation.navigate('HealthRecords')}
              activeOpacity={0.75}
            >
              <View style={[styles.menuIconCircle, { backgroundColor: '#FAF5FF' }]}>
                <Ionicons name="folder-open-outline" size={19} color="#7C3AED" />
              </View>
              <View style={styles.menuTextCol}>
                <Text style={styles.menuItemTitle}>Medical Records & Prescriptions</Text>
                <Text style={styles.menuItemSubtitle}>Stored PDFs, lab results & diagnostic scans</Text>
              </View>
              <Ionicons name="chevron-forward" size={17} color="#CBD5E1" />
            </TouchableOpacity>

            {/* 3. PHARMACY ORDERS */}
            <TouchableOpacity
              style={styles.menuRow}
              onPress={() => navigation.navigate('MyOrders')}
              activeOpacity={0.75}
            >
              <View style={[styles.menuIconCircle, { backgroundColor: '#FFF7ED' }]}>
                <Ionicons name="cart-outline" size={19} color="#EA580C" />
              </View>
              <View style={styles.menuTextCol}>
                <Text style={styles.menuItemTitle}>Pharmacy & Medicine Orders</Text>
                <Text style={styles.menuItemSubtitle}>Live order tracking, reorders & invoices</Text>
              </View>
              <Ionicons name="chevron-forward" size={17} color="#CBD5E1" />
            </TouchableOpacity>

            {/* 4. HEALTH VITALS MONITOR */}
            <TouchableOpacity
              style={[styles.menuRow, { borderBottomWidth: 0 }]}
              onPress={() => navigation.navigate('HealthMonitor')}
              activeOpacity={0.75}
            >
              <View style={[styles.menuIconCircle, { backgroundColor: '#FEE2E2' }]}>
                <Ionicons name="pulse-outline" size={19} color="#DC2626" />
              </View>
              <View style={styles.menuTextCol}>
                <Text style={styles.menuItemTitle}>Health Monitor & Vitals</Text>
                <Text style={styles.menuItemSubtitle}>Track blood pressure, sugar, pulse & BMI</Text>
              </View>
              <Ionicons name="chevron-forward" size={17} color="#CBD5E1" />
            </TouchableOpacity>
          </View>

          {/* ============================================================
              4. GROUP 2: PAYMENTS & INSURANCE
          ============================================================ */}
          <Text style={styles.groupHeaderTitle}>Payments & Insurance</Text>
          <View style={styles.menuCard}>
            {/* WALLET */}
            <TouchableOpacity
              style={styles.menuRow}
              onPress={() => navigation.navigate('Wallet')}
              activeOpacity={0.75}
            >
              <View style={[styles.menuIconCircle, { backgroundColor: '#F0FDFA' }]}>
                <Ionicons name="wallet-outline" size={19} color="#0D9488" />
              </View>
              <View style={styles.menuTextCol}>
                <Text style={styles.menuItemTitle}>MediUnify Care Wallet</Text>
                <Text style={styles.menuItemSubtitle}>Balance ₹{walletBalance} • Add Money & Passbook</Text>
              </View>
              <Ionicons name="chevron-forward" size={17} color="#CBD5E1" />
            </TouchableOpacity>

            {/* INSURANCE */}
            <TouchableOpacity
              style={styles.menuRow}
              onPress={() => navigation.navigate('HealthInsurance')}
              activeOpacity={0.75}
            >
              <View style={[styles.menuIconCircle, { backgroundColor: '#EFF6FF' }]}>
                <Ionicons name="shield-checkmark-outline" size={19} color="#2563EB" />
              </View>
              <View style={styles.menuTextCol}>
                <Text style={styles.menuItemTitle}>Cashless Health Insurance</Text>
                <Text style={styles.menuItemSubtitle}>TPA cashless pre-auth & claim desk</Text>
              </View>
              <Ionicons name="chevron-forward" size={17} color="#CBD5E1" />
            </TouchableOpacity>

            {/* INVOICES */}
            <TouchableOpacity
              style={[styles.menuRow, { borderBottomWidth: 0 }]}
              onPress={() => navigation.navigate('TransactionHistory')}
              activeOpacity={0.75}
            >
              <View style={[styles.menuIconCircle, { backgroundColor: '#FEF3C7' }]}>
                <Ionicons name="receipt-outline" size={19} color="#D97706" />
              </View>
              <View style={styles.menuTextCol}>
                <Text style={styles.menuItemTitle}>Invoices & GST Receipts</Text>
                <Text style={styles.menuItemSubtitle}>Download medical billing receipts</Text>
              </View>
              <Ionicons name="chevron-forward" size={17} color="#CBD5E1" />
            </TouchableOpacity>
          </View>

          {/* ============================================================
              5. GROUP 3: APP SETTINGS & PREFERENCES
          ============================================================ */}
          <Text style={styles.groupHeaderTitle}>App & Security</Text>
          <View style={styles.menuCard}>
            {/* NOTIFICATIONS */}
            <TouchableOpacity
              style={styles.menuRow}
              onPress={() => navigation.navigate('Notifications')}
              activeOpacity={0.75}
            >
              <View style={[styles.menuIconCircle, { backgroundColor: '#EEF2FF' }]}>
                <Ionicons name="notifications-outline" size={19} color="#4F46E5" />
              </View>
              <View style={styles.menuTextCol}>
                <Text style={styles.menuItemTitle}>Notification Preferences</Text>
                <Text style={styles.menuItemSubtitle}>Reminders, test reports & offers</Text>
              </View>
              <Ionicons name="chevron-forward" size={17} color="#CBD5E1" />
            </TouchableOpacity>

            {/* LANGUAGE */}
            <TouchableOpacity
              style={styles.menuRow}
              onPress={() => navigation.navigate('Settings')}
              activeOpacity={0.75}
            >
              <View style={[styles.menuIconCircle, { backgroundColor: '#F0FDFA' }]}>
                <Ionicons name="globe-outline" size={19} color="#0D9488" />
              </View>
              <View style={styles.menuTextCol}>
                <Text style={styles.menuItemTitle}>App Language / ಭಾಷೆ</Text>
                <Text style={styles.menuItemSubtitle}>{currentLang?.name || 'English'}</Text>
              </View>
              <View style={styles.langTag}>
                <Text style={styles.langTagText}>{currentLang?.code?.toUpperCase() || 'EN'}</Text>
              </View>
            </TouchableOpacity>

            {/* SECURITY */}
            <TouchableOpacity
              style={[styles.menuRow, { borderBottomWidth: 0 }]}
              onPress={() => navigation.navigate('EditProfile', { user, openPassword: true })}
              activeOpacity={0.75}
            >
              <View style={[styles.menuIconCircle, { backgroundColor: '#F1F5F9' }]}>
                <Ionicons name="lock-closed-outline" size={19} color="#475569" />
              </View>
              <View style={styles.menuTextCol}>
                <Text style={styles.menuItemTitle}>Change Password & PIN</Text>
                <Text style={styles.menuItemSubtitle}>Biometric lock & account security</Text>
              </View>
              <Ionicons name="chevron-forward" size={17} color="#CBD5E1" />
            </TouchableOpacity>
          </View>

          {/* ============================================================
              6. GROUP 4: 24x7 EMERGENCY & SUPPORT
          ============================================================ */}
          <Text style={styles.groupHeaderTitle}>Support & Emergency</Text>
          <View style={styles.menuCard}>
            {/* SOS AMBULANCE 108 */}
            <TouchableOpacity
              style={styles.menuRow}
              onPress={() => Linking.openURL('tel:108')}
              activeOpacity={0.75}
            >
              <View style={[styles.menuIconCircle, { backgroundColor: '#FEE2E2' }]}>
                <Ionicons name="medical" size={19} color="#DC2626" />
              </View>
              <View style={styles.menuTextCol}>
                <Text style={styles.menuItemTitle}>Call 108 Ambulance SOS</Text>
                <Text style={styles.menuItemSubtitle}>Government Emergency Transport (Free)</Text>
              </View>
              <View style={styles.sosCallPill}>
                <Ionicons name="call" size={12} color="#DC2626" />
                <Text style={styles.sosCallPillText}>108</Text>
              </View>
            </TouchableOpacity>

            {/* 24x7 DOCTOR HELPLINE */}
            <TouchableOpacity
              style={[styles.menuRow, { borderBottomWidth: 0 }]}
              onPress={() => Linking.openURL('tel:18004259999')}
              activeOpacity={0.75}
            >
              <View style={[styles.menuIconCircle, { backgroundColor: '#F0FDFA' }]}>
                <Ionicons name="call-outline" size={19} color="#0D9488" />
              </View>
              <View style={styles.menuTextCol}>
                <Text style={styles.menuItemTitle}>24x7 Doctor Helpline</Text>
                <Text style={styles.menuItemSubtitle}>Toll-free instant clinical consultation</Text>
              </View>
              <View style={styles.helplineCallPill}>
                <Text style={styles.helplineCallPillText}>1800-425-9999</Text>
              </View>
            </TouchableOpacity>
          </View>

          {/* ============================================================
              7. SIGN OUT ACTION BUTTON
          ============================================================ */}
          <TouchableOpacity
            style={styles.logoutBtn}
            onPress={handleLogout}
            activeOpacity={0.85}
          >
            <Ionicons name="log-out-outline" size={20} color="#DC2626" />
            <Text style={styles.logoutBtnText}>Sign Out of Account</Text>
          </TouchableOpacity>

          {/* 8. COMPLIANCE & VERSION FOOTER */}
          <View style={styles.footerContainer}>
            <Text style={styles.footerVersion}>MediUnify Healthcare • Version 2.4.0 (Build 120)</Text>
            <Text style={styles.footerSecurity}>
              🔒 256-Bit SSL Encrypted • NABH & NABL Partnered 🇮🇳
            </Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  headerBrandBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#F0FDFA',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#CCFBF1',
  },
  headerBrandText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0D9488',
  },
  headerBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '900',
    color: '#0F172A',
    letterSpacing: -0.3,
  },
  headerRightActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  pageInnerContainer: {
    maxWidth: 720,
    width: '100%',
    alignSelf: 'center',
    paddingHorizontal: 16,
    paddingTop: 12,
  },

  // 1. PROFILE CARD
  profileCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
    marginBottom: 14,
  },
  profileHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarContainer: {
    position: 'relative',
  },
  avatarCircle: {
    width: 66,
    height: 66,
    borderRadius: 33,
    backgroundColor: '#00B894',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: '#E6FFFA',
    shadowColor: '#00B894',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 5,
    elevation: 3,
  },
  avatarText: {
    fontSize: 26,
    fontWeight: '900',
    color: '#FFFFFF',
  },
  avatarBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#0D9488',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  profileInfoCol: {
    flex: 1,
    marginLeft: 14,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  userNameText: {
    fontSize: 18,
    fontWeight: '900',
    color: '#0F172A',
    letterSpacing: -0.3,
  },
  userContactText: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
    fontWeight: '500',
  },
  uhidPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#F0FDFA',
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    marginTop: 6,
    borderWidth: 1,
    borderColor: '#CCFBF1',
  },
  uhidPillText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#0D9488',
    letterSpacing: 0.2,
  },
  healthTagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  healthTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#F8FAFC',
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  healthTagText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#475569',
  },
  profileActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 14,
  },
  editProfileBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#F0FDFA',
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#CCFBF1',
  },
  editProfileBtnText: {
    fontSize: 12.5,
    fontWeight: '800',
    color: '#0D9488',
  },
  passwordBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#F8FAFC',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  passwordBtnText: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#475569',
  },

  // 2. SUMMARY METRICS TILES
  metricsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  metricTile: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
  },
  metricIconBox: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  metricLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748B',
  },
  metricValue: {
    fontSize: 13.5,
    fontWeight: '900',
    color: '#0F172A',
    marginTop: 2,
  },
  metricSub: {
    fontSize: 10.5,
    fontWeight: '800',
    marginTop: 4,
  },

  // 3. GROUPED MENU CARDS
  groupHeaderTitle: {
    fontSize: 13,
    fontWeight: '900',
    color: '#64748B',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginBottom: 8,
    marginLeft: 4,
  },
  menuCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 5,
    elevation: 2,
    marginBottom: 16,
  },
  menuRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  menuIconCircle: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  menuTextCol: {
    flex: 1,
  },
  menuItemTitle: {
    fontSize: 13.5,
    fontWeight: '800',
    color: '#0F172A',
  },
  menuItemSubtitle: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '500',
    marginTop: 2,
  },
  langTag: {
    backgroundColor: '#F0FDFA',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#CCFBF1',
  },
  langTagText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#0D9488',
  },
  sosCallPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#FEE2E2',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  sosCallPillText: {
    fontSize: 11,
    fontWeight: '900',
    color: '#DC2626',
  },
  helplineCallPill: {
    backgroundColor: '#F0FDFA',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  helplineCallPillText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#0D9488',
  },

  // SIGN OUT BUTTON
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    borderRadius: 14,
    paddingVertical: 13,
    marginTop: 4,
    marginBottom: 16,
  },
  logoutBtnText: {
    fontSize: 13.5,
    fontWeight: '800',
    color: '#DC2626',
  },

  // FOOTER
  footerContainer: {
    alignItems: 'center',
    paddingVertical: 8,
    gap: 4,
  },
  footerVersion: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#94A3B8',
  },
  footerSecurity: {
    fontSize: 10.5,
    fontWeight: '600',
    color: '#CBD5E1',
  },
});

export default ProfileScreen;