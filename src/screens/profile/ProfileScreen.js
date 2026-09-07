import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Alert,
  Platform,
  StatusBar,
  Linking,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import colors from '../../theme/colors';
import { useTheme } from '../../context/ThemeContext';

const ProfileScreen = ({ navigation, route }) => {
  const { isDarkMode, theme, language, LANGUAGES } = useTheme();
  const currentLang = LANGUAGES.find((l) => l.code === language) || LANGUAGES[0];

  // User Profile State
  const [user, setUser] = useState({
    name: route?.params?.updatedUser?.name || 'Ramesh Kumar',
    email: route?.params?.updatedUser?.email || 'ramesh.kumar@example.com',
    phone: route?.params?.updatedUser?.phone || '+91 98450 12345',
    bloodGroup: 'O+ Positive',
    age: '32 Yrs',
    gender: 'Male',
    emergencyContact: '+91 98450 11223 (Family)',
  });

  const [walletBalance, setWalletBalance] = useState(1250);
  const [carePoints, setCarePoints] = useState(500);

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
      // Always load the Primary Account Holder's Profile
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

      // Check registered users directory
      const regUsersStr = await AsyncStorage.getItem('@unnathi_registered_users');
      let registeredUsers = {};
      if (regUsersStr) {
        try {
          registeredUsers = JSON.parse(regUsersStr);
        } catch (e) {}
      }

      const activeEmail = (parsedUser?.email || storedEmail || '').toLowerCase().trim();
      const regUser = registeredUsers[activeEmail];

      // Determine Full Name (strictly ensuring it is NEVER an email ID)
      let resolvedFullName = '';
      if (parsedUser?.name && !parsedUser.name.includes('@') && parsedUser.name.trim()) {
        resolvedFullName = parsedUser.name.trim();
      } else if (regUser?.name && !regUser.name.includes('@') && regUser.name.trim()) {
        resolvedFullName = regUser.name.trim();
      } else if (storedName && !storedName.includes('@') && storedName.trim()) {
        resolvedFullName = storedName.trim();
      } else if (parsedUser?.name) {
        const clean = parsedUser.name.split('@')[0].replace(/[._-]/g, ' ').replace(/[0-9]/g, '').trim() || parsedUser.name.split('@')[0].replace(/[._-]/g, ' ').trim();
        resolvedFullName = clean
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
    } catch (e) {
      console.log('Error loading profile data:', e);
    }
  };

  const handleEditProfile = () => {
    navigation.navigate('EditProfile', { user });
  };

  const handleLogout = () => {
    Alert.alert(
      'Logout from MediUnify',
      'Are you sure you want to securely log out of your healthcare account?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            try {
              await AsyncStorage.multiRemove([
                'userToken',
                '@unnathi_active_patient',
              ]);
            } catch (e) {
              console.log('Logout storage clear err:', e);
            }
            navigation.getParent()?.reset({
              index: 0,
              routes: [{ name: 'Auth' }],
            });
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <StatusBar
        barStyle={isDarkMode ? 'light-content' : 'dark-content'}
        backgroundColor={theme.headerBg}
      />

      {/* TOP HEADER BAR */}
      <View style={[styles.topHeader, { backgroundColor: theme.headerBg, borderBottomColor: theme.border }]}>
        <View>
          <Text style={styles.topHeaderBadge}>PATIENT DASHBOARD</Text>
          <Text style={[styles.topHeaderTitle, { color: isDarkMode ? '#F8FAFC' : colors.navyBlue }]}>
            My Health Profile
          </Text>
        </View>

        <View style={styles.headerActionRow}>
          <TouchableOpacity
            style={styles.headerIconBtn}
            onPress={() => navigation.navigate('Notifications')}
            activeOpacity={0.8}
          >
            <Ionicons name="notifications-outline" size={20} color="#1E293B" />
            <View style={styles.headerDotBadge} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.headerIconBtn}
            onPress={() => navigation.navigate('Settings')}
            activeOpacity={0.8}
          >
            <Ionicons name="settings-outline" size={20} color="#1E293B" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* ==========================================
            HERO PROFILE CARD (GRADIENT TEAL)
        ========================================== */}
        <View style={styles.heroCard}>
          <View style={styles.heroCardBgOrb1} />
          <View style={styles.heroCardBgOrb2} />

          <View style={styles.heroMainRow}>
            {/* AVATAR WITH VERIFIED BADGE */}
            <View style={styles.avatarWrap}>
              <View style={styles.avatarCircle}>
                <Ionicons name="person" size={38} color="#FFFFFF" />
              </View>
              <View style={styles.verifiedBadge}>
                <Ionicons name="checkmark-sharp" size={12} color="#FFFFFF" />
              </View>
            </View>

            {/* USER INFO */}
            <View style={styles.heroInfoColumn}>
              <View style={styles.verifiedTagRow}>
                <Text style={styles.verifiedTagText}>VERIFIED PATIENT PROFILE</Text>
              </View>
              <Text style={styles.heroUserName} numberOfLines={1}>
                {user.name}
              </Text>
              <Text style={styles.heroContactText} numberOfLines={1}>
                📞 {user.phone}
              </Text>
              <Text style={styles.heroContactText} numberOfLines={1}>
                ✉️ {user.email}
              </Text>
            </View>
          </View>

          {/* VITAL TAGS (BLOOD GROUP, AGE, GENDER) */}
          <View style={styles.vitalTagsRow}>
            <View style={styles.vitalPill}>
              <Ionicons name="water" size={13} color="#EF4444" />
              <Text style={styles.vitalPillText}>{user.bloodGroup}</Text>
            </View>

            <View style={styles.vitalPill}>
              <Ionicons name="calendar-outline" size={13} color="#0D9488" />
              <Text style={styles.vitalPillText}>{user.age}</Text>
            </View>

            <View style={styles.vitalPill}>
              <Ionicons name="male-female-outline" size={13} color="#3B82F6" />
              <Text style={styles.vitalPillText}>{user.gender}</Text>
            </View>
          </View>

          {/* ACTION BUTTONS (EDIT PROFILE & SECURITY) */}
          <View style={styles.heroActionsRow}>
            <TouchableOpacity
              style={styles.heroPrimaryBtn}
              onPress={handleEditProfile}
              activeOpacity={0.88}
            >
              <Ionicons name="create-outline" size={16} color={colors.teal} />
              <Text style={styles.heroPrimaryBtnText}>Edit Profile</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.heroSecondaryBtn}
              onPress={() => navigation.navigate('EditProfile', { user, openPassword: true })}
              activeOpacity={0.88}
            >
              <Ionicons name="lock-closed-outline" size={16} color="#FFFFFF" />
              <Text style={styles.heroSecondaryBtnText}>Change Password</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* ==========================================
            QUICK STATS & HEALTH STRIP
        ========================================== */}
        <View style={styles.quickStatsRow}>
          {/* WALLET CASH */}
          <TouchableOpacity
            style={styles.quickStatCard}
            onPress={() => navigation.navigate('Wallet')}
            activeOpacity={0.85}
          >
            <View style={[styles.statIconCircle, { backgroundColor: '#ECFDF5' }]}>
              <Ionicons name="wallet" size={18} color="#059669" />
            </View>
            <Text style={styles.statValue}>₹{walletBalance.toLocaleString('en-IN')}</Text>
            <Text style={styles.statLabel}>Health Cash ›</Text>
          </TouchableOpacity>

          {/* CARE POINTS */}
          <TouchableOpacity
            style={styles.quickStatCard}
            onPress={() => navigation.navigate('Wallet')}
            activeOpacity={0.85}
          >
            <View style={[styles.statIconCircle, { backgroundColor: '#FEF3C7' }]}>
              <Ionicons name="ribbon" size={18} color="#D97706" />
            </View>
            <Text style={styles.statValue}>{carePoints} Pts</Text>
            <Text style={styles.statLabel}>Care Rewards ›</Text>
          </TouchableOpacity>

          {/* HEALTH SCORE */}
          <TouchableOpacity
            style={styles.quickStatCard}
            onPress={() => navigation.navigate('HealthMonitor')}
            activeOpacity={0.85}
          >
            <View style={[styles.statIconCircle, { backgroundColor: '#EEF2FF' }]}>
              <Ionicons name="heart-circle" size={18} color="#4F46E5" />
            </View>
            <Text style={styles.statValue}>96%</Text>
            <Text style={styles.statLabel}>Vitals Score ›</Text>
          </TouchableOpacity>
        </View>

        {/* ==========================================
            SECTION 1: MEDICAL RECORDS & FAMILY
        ========================================== */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Medical Records & Family</Text>
          <Text style={styles.sectionSubtitle}>Appointments, prescriptions & loved ones</Text>
        </View>

        <View style={styles.cardGroup}>
          {/* FAMILY PROFILES */}
          <TouchableOpacity
            style={styles.groupItem}
            onPress={() => navigation.navigate('FamilyProfiles')}
            activeOpacity={0.7}
          >
            <View style={[styles.itemIconWrap, { backgroundColor: '#E0F2FE' }]}>
              <Ionicons name="people" size={20} color="#0284C7" />
            </View>
            <View style={styles.itemTextWrap}>
              <Text style={styles.itemTitle}>Family Members & Dependents</Text>
              <Text style={styles.itemSubtitle}>Manage 4 family profiles & medical history</Text>
            </View>
            <View style={styles.badgePill}>
              <Text style={styles.badgePillText}>4 Profiles</Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color="#CBD5E1" />
          </TouchableOpacity>

          <View style={styles.divider} />

          {/* MY APPOINTMENTS */}
          <TouchableOpacity
            style={styles.groupItem}
            onPress={() => navigation.navigate('Bookings')}
            activeOpacity={0.7}
          >
            <View style={[styles.itemIconWrap, { backgroundColor: '#F0FDF4' }]}>
              <Ionicons name="calendar" size={20} color="#16A34A" />
            </View>
            <View style={styles.itemTextWrap}>
              <Text style={styles.itemTitle}>My Appointments & Slips</Text>
              <Text style={styles.itemSubtitle}>Doctor visits, home lab tokens & scan slips</Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color="#CBD5E1" />
          </TouchableOpacity>

          <View style={styles.divider} />

          {/* HEALTH RECORDS & LAB REPORTS */}
          <TouchableOpacity
            style={styles.groupItem}
            onPress={() => navigation.navigate('HealthRecords')}
            activeOpacity={0.7}
          >
            <View style={[styles.itemIconWrap, { backgroundColor: '#FAF5FF' }]}>
              <Ionicons name="folder-open" size={20} color="#9333EA" />
            </View>
            <View style={styles.itemTextWrap}>
              <Text style={styles.itemTitle}>Prescriptions & Lab Reports</Text>
              <Text style={styles.itemSubtitle}>Encrypted PDF reports, 3T MRI & blood tests</Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color="#CBD5E1" />
          </TouchableOpacity>

          <View style={styles.divider} />

          {/* VITALS & HEALTH MONITOR */}
          <TouchableOpacity
            style={styles.groupItem}
            onPress={() => navigation.navigate('HealthMonitor')}
            activeOpacity={0.7}
          >
            <View style={[styles.itemIconWrap, { backgroundColor: '#FEF2F2' }]}>
              <Ionicons name="pulse" size={20} color="#DC2626" />
            </View>
            <View style={styles.itemTextWrap}>
              <Text style={styles.itemTitle}>Health Vitals Tracker</Text>
              <Text style={styles.itemSubtitle}>Daily Fasting Sugar, BP, SpO2 & BMI logs</Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color="#CBD5E1" />
          </TouchableOpacity>
        </View>

        {/* ==========================================
            SECTION 2: PAYMENTS, INSURANCE & REWARDS
        ========================================== */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Payments, Insurance & Rewards</Text>
          <Text style={styles.sectionSubtitle}>Claims, cashback & GST receipts</Text>
        </View>

        <View style={styles.cardGroup}>
          {/* HEALTH WALLET */}
          <TouchableOpacity
            style={styles.groupItem}
            onPress={() => navigation.navigate('Wallet')}
            activeOpacity={0.7}
          >
            <View style={[styles.itemIconWrap, { backgroundColor: '#ECFDF5' }]}>
              <Ionicons name="wallet-outline" size={20} color="#059669" />
            </View>
            <View style={styles.itemTextWrap}>
              <Text style={styles.itemTitle}>MediUnify Health Wallet</Text>
              <Text style={styles.itemSubtitle}>Add money, transfer & instant cashback</Text>
            </View>
            <View style={[styles.badgePill, { backgroundColor: '#D1FAE5' }]}>
              <Text style={[styles.badgePillText, { color: '#047857' }]}>₹{walletBalance}</Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color="#CBD5E1" />
          </TouchableOpacity>

          <View style={styles.divider} />

          {/* HEALTH INSURANCE */}
          <TouchableOpacity
            style={styles.groupItem}
            onPress={() => navigation.navigate('HealthInsurance')}
            activeOpacity={0.7}
          >
            <View style={[styles.itemIconWrap, { backgroundColor: '#EFF6FF' }]}>
              <Ionicons name="shield-outline" size={20} color="#2563EB" />
            </View>
            <View style={styles.itemTextWrap}>
              <Text style={styles.itemTitle}>Cashless Health Insurance</Text>
              <Text style={styles.itemSubtitle}>Pre-auth assistance, TPA & claim tracker</Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color="#CBD5E1" />
          </TouchableOpacity>

          <View style={styles.divider} />

          {/* TRANSACTION HISTORY */}
          <TouchableOpacity
            style={styles.groupItem}
            onPress={() => navigation.navigate('TransactionHistory')}
            activeOpacity={0.7}
          >
            <View style={[styles.itemIconWrap, { backgroundColor: '#FFF7ED' }]}>
              <Ionicons name="receipt-outline" size={20} color="#EA580C" />
            </View>
            <View style={styles.itemTextWrap}>
              <Text style={styles.itemTitle}>Transaction & Invoices</Text>
              <Text style={styles.itemSubtitle}>Download hospital & pharmacy GST bills</Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color="#CBD5E1" />
          </TouchableOpacity>

          <View style={styles.divider} />

          {/* REFER & EARN */}
          <TouchableOpacity
            style={styles.groupItem}
            onPress={() => navigation.navigate('ReferEarn')}
            activeOpacity={0.7}
          >
            <View style={[styles.itemIconWrap, { backgroundColor: '#FDF2F8' }]}>
              <Ionicons name="gift-outline" size={20} color="#DB2777" />
            </View>
            <View style={styles.itemTextWrap}>
              <Text style={styles.itemTitle}>Refer & Earn ₹250</Text>
              <Text style={styles.itemSubtitle}>Invite friends to receive free health cash</Text>
            </View>
            <View style={[styles.badgePill, { backgroundColor: '#FCE7F3' }]}>
              <Text style={[styles.badgePillText, { color: '#BE185D' }]}>Get ₹250</Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color="#CBD5E1" />
          </TouchableOpacity>
        </View>

        {/* ==========================================
            SECTION 3: SETTINGS & 24x7 SUPPORT
        ========================================== */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>App Settings & Helpline</Text>
          <Text style={styles.sectionSubtitle}>Security, emergency contact & 24/7 care</Text>
        </View>

        <View style={styles.cardGroup}>
          {/* SETTINGS */}
          <TouchableOpacity
            style={styles.groupItem}
            onPress={() => navigation.navigate('Settings')}
            activeOpacity={0.7}
          >
            <View style={[styles.itemIconWrap, { backgroundColor: isDarkMode ? '#1E293B' : '#F1F5F9' }]}>
              <Ionicons name="settings-outline" size={20} color={isDarkMode ? '#38BDF8' : '#475569'} />
            </View>
            <View style={styles.itemTextWrap}>
              <Text style={styles.itemTitle}>App Settings & Preferences</Text>
              <Text style={styles.itemSubtitle}>Language, Dark Mode, Security & Cache</Text>
            </View>
            <View style={[styles.badgePill, { backgroundColor: '#CCFBF1' }]}>
              <Text style={[styles.badgePillText, { color: '#0F766E' }]}>
                {currentLang.flag} {currentLang.code.toUpperCase()}
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color="#CBD5E1" />
          </TouchableOpacity>

          <View style={styles.divider} />

          {/* 24x7 HELPLINE */}
          <TouchableOpacity
            style={styles.groupItem}
            onPress={() => {
              Alert.alert(
                '24x7 MediUnify Doctor Support',
                'Call our medical support helpline for emergency or app assistance.',
                [
                  { text: 'Cancel', style: 'cancel' },
                  {
                    text: 'Call 1800-425-9999',
                    onPress: () => Linking.openURL('tel:18004259999'),
                  },
                ]
              );
            }}
            activeOpacity={0.7}
          >
            <View style={[styles.itemIconWrap, { backgroundColor: '#FEF2F2' }]}>
              <Ionicons name="call" size={20} color="#DC2626" />
            </View>
            <View style={styles.itemTextWrap}>
              <Text style={styles.itemTitle}>24x7 Doctor Helpline & SOS</Text>
              <Text style={styles.itemSubtitle}>Toll-free 1800-425-9999 • Instant Response</Text>
            </View>
            <View style={[styles.badgePill, { backgroundColor: '#FEE2E2' }]}>
              <Text style={[styles.badgePillText, { color: '#B91C1C' }]}>24x7 Live</Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color="#CBD5E1" />
          </TouchableOpacity>
        </View>

        {/* ==========================================
            LOGOUT CARD
        ========================================== */}
        <TouchableOpacity
          style={styles.logoutCard}
          onPress={handleLogout}
          activeOpacity={0.88}
        >
          <View style={styles.logoutIconCircle}>
            <Ionicons name="log-out-outline" size={22} color="#DC2626" />
          </View>
          <View style={styles.logoutTextWrap}>
            <Text style={styles.logoutTitle}>Sign Out from Account</Text>
            <Text style={styles.logoutSubtitle}>Safely disconnect on this device</Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color="#EF4444" />
        </TouchableOpacity>

        {/* COMPLIANCE & VERSION FOOTER */}
        <View style={styles.footerSection}>
          <Text style={styles.footerVersion}>MediUnify Patient App • v2.4.0 (Build 120)</Text>
          <Text style={styles.footerCompliance}>
            🔒 256-Bit Encrypted Health Records • NABH Certified 🇮🇳
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default ProfileScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },

  // TOP HEADER
  topHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    paddingTop: Platform.OS === 'android' ? 14 : 10,
    paddingBottom: 14,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  topHeaderBadge: {
    fontSize: 10,
    fontWeight: '800',
    color: colors.teal,
    letterSpacing: 0.6,
  },
  topHeaderTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: colors.navyBlue,
    marginTop: 1,
  },
  headerActionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerIconBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  headerDotBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: colors.coral,
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
  },

  scrollContent: {
    paddingBottom: 40,
  },

  // HERO CARD
  heroCard: {
    backgroundColor: colors.teal,
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 24,
    padding: 20,
    overflow: 'hidden',
    position: 'relative',
    shadowColor: colors.teal,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 8,
  },
  heroCardBgOrb1: {
    position: 'absolute',
    top: -30,
    right: -30,
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
  heroCardBgOrb2: {
    position: 'absolute',
    bottom: -40,
    left: -20,
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
  },
  heroMainRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarWrap: {
    position: 'relative',
  },
  avatarCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  verifiedBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    backgroundColor: colors.freshGreen,
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.teal,
  },
  heroInfoColumn: {
    flex: 1,
    marginLeft: 14,
  },
  verifiedTagRow: {
    backgroundColor: 'rgba(255, 255, 255, 0.18)',
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    marginBottom: 4,
  },
  verifiedTagText: {
    fontSize: 9.5,
    fontWeight: '800',
    color: '#CCFBF1',
    letterSpacing: 0.5,
  },
  heroUserName: {
    fontSize: 19,
    fontWeight: '900',
    color: '#FFFFFF',
  },
  heroContactText: {
    fontSize: 12,
    color: '#E6FFFA',
    marginTop: 2,
    fontWeight: '500',
  },

  // VITAL TAGS
  vitalTagsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.15)',
  },
  vitalPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 16,
    gap: 5,
  },
  vitalPillText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#0F172A',
  },

  // HERO ACTION BUTTONS
  heroActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 14,
  },
  heroPrimaryBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    paddingVertical: 10,
    borderRadius: 14,
    gap: 6,
  },
  heroPrimaryBtnText: {
    fontSize: 13,
    fontWeight: '800',
    color: colors.teal,
  },
  heroSecondaryBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingVertical: 10,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    gap: 6,
  },
  heroSecondaryBtnText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#FFFFFF',
  },

  // QUICK STATS STRIP
  quickStatsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginHorizontal: 16,
    marginTop: 14,
    gap: 10,
  },
  quickStatCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    paddingVertical: 12,
    paddingHorizontal: 10,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
  },
  statIconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  statValue: {
    fontSize: 14,
    fontWeight: '900',
    color: '#0F172A',
  },
  statLabel: {
    fontSize: 10.5,
    fontWeight: '700',
    color: '#64748B',
    marginTop: 2,
  },

  // SECTION HEADERS
  sectionHeader: {
    paddingHorizontal: 18,
    marginTop: 22,
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '900',
    color: '#0F172A',
  },
  sectionSubtitle: {
    fontSize: 11.5,
    fontWeight: '500',
    color: '#64748B',
    marginTop: 1,
  },

  // CARD GROUPS
  cardGroup: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 2,
  },
  groupItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  itemIconWrap: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemTextWrap: {
    flex: 1,
    marginLeft: 14,
  },
  itemTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#1E293B',
  },
  itemSubtitle: {
    fontSize: 11.5,
    color: '#64748B',
    marginTop: 2,
    fontWeight: '500',
  },
  badgePill: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: 6,
  },
  badgePillText: {
    fontSize: 10.5,
    fontWeight: '800',
    color: '#475569',
  },
  divider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginLeft: 68,
  },

  // LOGOUT CARD
  logoutCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF2F2',
    marginHorizontal: 16,
    marginTop: 22,
    padding: 16,
    borderRadius: 18,
    borderWidth: 1.5,
    borderColor: '#FEE2E2',
  },
  logoutIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#FEE2E2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoutTextWrap: {
    flex: 1,
    marginLeft: 12,
  },
  logoutTitle: {
    fontSize: 14,
    fontWeight: '900',
    color: '#DC2626',
  },
  logoutSubtitle: {
    fontSize: 11.5,
    color: '#EF4444',
    marginTop: 2,
  },

  // FOOTER
  footerSection: {
    alignItems: 'center',
    marginTop: 24,
    paddingHorizontal: 20,
  },
  footerVersion: {
    fontSize: 11,
    fontWeight: '700',
    color: '#94A3B8',
  },
  footerCompliance: {
    fontSize: 10,
    fontWeight: '600',
    color: '#64748B',
    marginTop: 4,
    textAlign: 'center',
  },
});