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
import WebFooter from '../../components/web/WebFooter';

const ProfileScreenWeb = ({ navigation, route }) => {
  const { isDarkMode, language, LANGUAGES } = useTheme();
  const currentLang = LANGUAGES.find((l) => l.code === language) || LANGUAGES[0];
  const { width } = useWindowDimensions();
  const isDesktop = width >= 992;
  const isTablet = width >= 640 && width < 992;

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
  const [membershipData, setMembershipData] = useState(null);

  // Load Saved Data on Mount & Screen Focus
  useEffect(() => {
    loadProfileData();
    const unsubscribe = navigation?.addListener?.('focus', () => {
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

      const memStr = await AsyncStorage.getItem('@mediunify_membership');
      if (memStr) {
        try {
          setMembershipData(JSON.parse(memStr));
        } catch (e) {}
      }

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
      console.log('Error loading web profile data:', e);
    }
  };

  const handleEditProfile = () => {
    navigation?.navigate('EditProfile', { user });
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

      if (!navigated && Platform.OS === 'web' && typeof window !== 'undefined' && window?.location) {
        const basePath = (window.location.pathname || '').includes('Mediunify-patient-side-application-')
          ? '/Mediunify-patient-side-application-/'
          : '/';
        window.location.href = basePath;
      }
    };

    showAlert(
      'Logout from MediUnify',
      'Are you sure you want to securely log out of your healthcare account on this browser?',
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
    <SafeAreaView style={[styles.container, { backgroundColor: isDarkMode ? '#0B0F19' : '#F1F5F9' }]}>
      <StatusBar
        barStyle={isDarkMode ? 'light-content' : 'dark-content'}
        backgroundColor={isDarkMode ? '#0B0F19' : '#FFFFFF'}
      />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* ============================================================
            1. WEB BREADCRUMB & PAGE HEADER
        ============================================================ */}
        <View style={styles.breadcrumbBarWrap}>
          <View style={styles.breadcrumbBarInner}>
            <View style={styles.breadcrumbLeft}>
              <TouchableOpacity onPress={() => navigation?.navigate('Home')} activeOpacity={0.8}>
                <Text style={styles.breadcrumbLink}>Home</Text>
              </TouchableOpacity>
              <Ionicons name="chevron-forward" size={13} color="#94A3B8" />
              <Text style={styles.breadcrumbCurrent}>My Profile & Health Account</Text>
            </View>

            <View style={styles.securityBadgeWeb}>
              <Ionicons name="shield-checkmark" size={14} color="#00B894" />
              <Text style={styles.securityBadgeWebText}>256-Bit SSL Encrypted • NABH Verified</Text>
            </View>
          </View>
        </View>

        <View style={styles.webContainer}>
          {/* ============================================================
              2. HERO IDENTITY & HEALTH WALLET DUAL BANNER (HOMESCREEN STYLE)
          ============================================================ */}
          <View style={[styles.heroDualRow, isDesktop ? styles.heroDualRowDesktop : null]}>
            {/* Left Card: Patient Digital Health Card */}
            <View style={[styles.patientIdentityCard, isDesktop ? { flex: 1.1 } : null]}>
              <View style={styles.cardHeaderRow}>
                <View style={styles.brandPillWeb}>
                  <Ionicons name="finger-print" size={13} color="#00B894" />
                  <Text style={styles.brandPillWebText}>DIGITAL HEALTH ID</Text>
                </View>
                <View style={styles.uhidBadgePill}>
                  <Text style={styles.uhidBadgePillText}>UHID: {user.uhid || 'MU-84920'}</Text>
                </View>
              </View>

              <View style={styles.userMainInfoRow}>
                <View style={styles.avatarWrapWeb}>
                  <View style={styles.avatarCircleWeb}>
                    <Text style={styles.avatarTextWeb}>{userInitial}</Text>
                  </View>
                  <View style={styles.verifiedCheckBadge}>
                    <Ionicons name="checkmark" size={12} color="#FFFFFF" />
                  </View>
                </View>

                <View style={styles.userInfoColWeb}>
                  <Text style={styles.userNameWeb} numberOfLines={1}>{user.name}</Text>
                  <Text style={styles.userSubTextWeb}>📞 {user.phone}</Text>
                  <Text style={styles.userSubTextWeb} numberOfLines={1}>✉️ {user.email}</Text>
                </View>
              </View>

              {/* Patient Vitals Chips */}
              <View style={styles.vitalsPillRow}>
                <View style={styles.vitalTag}>
                  <Ionicons name="water" size={13} color="#DC2626" />
                  <Text style={styles.vitalTagText}>{user.bloodGroup || 'O+ Positive'}</Text>
                </View>
                <View style={styles.vitalTag}>
                  <Ionicons name="person" size={13} color="#2563EB" />
                  <Text style={styles.vitalTagText}>{user.age} • {user.gender}</Text>
                </View>
                <View style={styles.vitalTag}>
                  <Ionicons name="call" size={13} color="#D97706" />
                  <Text style={styles.vitalTagText}>SOS Contact Active</Text>
                </View>
              </View>

              {/* Action Buttons */}
              <View style={styles.identityActionsRow}>
                <TouchableOpacity
                  style={styles.primaryEditBtn}
                  onPress={handleEditProfile}
                  activeOpacity={0.88}
                >
                  <Ionicons name="create-outline" size={15} color="#FFFFFF" />
                  <Text style={styles.primaryEditBtnText}>Edit Profile Details</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.secondarySecurityBtn}
                  onPress={() => navigation?.navigate('EditProfile', { user, openPassword: true })}
                  activeOpacity={0.85}
                >
                  <Ionicons name="lock-closed-outline" size={14} color="#1E3A8A" />
                  <Text style={styles.secondarySecurityBtnText}>Security & Password</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Right Card: Health Wallet & Care Points (Exact HomeScreen.web.js Aesthetic) */}
            <View style={[styles.walletCardWeb, isDesktop ? { flex: 0.9 } : null]}>
              <View style={styles.walletHeaderRow}>
                <View style={styles.walletTitleGroup}>
                  <View style={styles.walletIconCircle}>
                    <Ionicons name="wallet" size={24} color="#00B894" />
                  </View>
                  <View>
                    <Text style={styles.walletTitleWeb}>MediUnify Care Wallet</Text>
                    <Text style={styles.walletSubtitleWeb}>Instant 1-Click Cashless Payments</Text>
                  </View>
                </View>
                <View style={styles.statusActivePill}>
                  <View style={styles.statusActiveDot} />
                  <Text style={styles.statusActiveText}>Active</Text>
                </View>
              </View>

              <View style={styles.walletBalanceBigRow}>
                <View>
                  <Text style={styles.balanceLabelWeb}>Available Balance</Text>
                  <Text style={styles.balanceAmountWeb}>₹{walletBalance.toLocaleString('en-IN')}</Text>
                </View>
                <View style={styles.carePointsCard}>
                  <Text style={styles.carePointsLabel}>Care Points</Text>
                  <Text style={styles.carePointsValue}>🪙 {carePoints} Pts</Text>
                </View>
              </View>

              <Text style={styles.walletBenefitNote}>
                ⚡ Save 5% cashback on medicine orders, full body health packages & clinic consultation fees.
              </Text>

              <View style={styles.walletActionButtonsRow}>
                <TouchableOpacity
                  style={styles.topUpWalletBtnWeb}
                  onPress={() => navigation?.navigate('Wallet')}
                  activeOpacity={0.88}
                >
                  <Ionicons name="add-circle" size={16} color="#FFFFFF" />
                  <Text style={styles.topUpWalletBtnTextWeb}>Top Up Wallet</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.viewPassbookBtnWeb}
                  onPress={() => navigation?.navigate('Wallet')}
                  activeOpacity={0.85}
                >
                  <Ionicons name="receipt-outline" size={15} color="#1E3A8A" />
                  <Text style={styles.viewPassbookBtnTextWeb}>Passbook & History</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>

          {/* ============================================================
              2.5 MEDIUNIFY CARE+ VIP MEMBERSHIP BANNER CARD
          ============================================================ */}
          <View style={styles.webVipMembershipBanner}>
            <View style={styles.webVipBannerLeft}>
              <View style={styles.webVipBadgeRow}>
                <View style={styles.webVipCrownCircle}>
                  <Ionicons name="ribbon" size={22} color="#D97706" />
                </View>
                <View style={{ flex: 1 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    <Text style={styles.webVipTitle}>
                      {membershipData?.status === 'active' ? `${membershipData.tierName} VIP Member` : 'MediUnify Care+ VIP Membership'}
                    </Text>
                    <View style={[styles.webVipBadgePill, membershipData?.status === 'active' && { backgroundColor: '#DCFCE7' }]}>
                      <Text style={[styles.webVipBadgeText, membershipData?.status === 'active' && { color: '#15803D' }]}>
                        {membershipData?.status === 'active' ? 'ACTIVE VIP' : 'UPGRADE NOW'}
                      </Text>
                    </View>
                  </View>
                  <Text style={styles.webVipSub}>
                    {membershipData?.status === 'active'
                      ? `Valid until ${new Date(membershipData.expiresAt).toLocaleDateString()} • Total Saved: ₹${membershipData.savingsToDate?.toLocaleString('en-IN') || '1,850'}`
                      : 'Flat 15% Extra OFF on Pharmacy & Lab Tests • 4 Free Specialist Doctor Calls • Free 60m Delivery'}
                  </Text>
                </View>
              </View>
            </View>

            <TouchableOpacity
              style={styles.webVipCtaBtn}
              onPress={() => navigation?.navigate('Membership')}
              activeOpacity={0.88}
            >
              <Text style={styles.webVipCtaBtnText}>
                {membershipData?.status === 'active' ? 'View VIP Perks & Vouchers' : 'Explore VIP Plans'}
              </Text>
              <Ionicons name="arrow-forward" size={16} color="#FFFFFF" />
            </TouchableOpacity>
          </View>

          {/* ============================================================
              3. 4 MAJOR HEALTHCARE HUBS (HOMESCREEN.WEB.JS 2x2 / 4-COL GRID)
          ============================================================ */}
          <View style={styles.sectionHeaderWeb}>
            <View>
              <Text style={styles.sectionHeadingTitle}>Healthcare Services & Telemetry</Text>
              <Text style={styles.sectionSubHeading}>Access your appointments, prescriptions, diagnostic records and daily vitals</Text>
            </View>
          </View>

          <View style={styles.hubsGridWeb}>
            {/* Hub 1: Doctor Consultations */}
            <TouchableOpacity
              style={styles.hubTileCard}
              onPress={() => navigation?.navigate('Bookings')}
              activeOpacity={0.9}
            >
              <View style={styles.hubTileTop}>
                <View style={[styles.hubTileIconCircle, { backgroundColor: '#EFF6FF' }]}>
                  <Ionicons name="calendar" size={24} color="#2563EB" />
                </View>
                <View style={[styles.hubTagPill, { backgroundColor: '#EFF6FF' }]}>
                  <Text style={[styles.hubTagText, { color: '#2563EB' }]}>Active Slips</Text>
                </View>
              </View>
              <Text style={styles.hubTileTitle}>My Appointments</Text>
              <Text style={styles.hubTileSub}>In-clinic appointments, video calls, doctor token status & prescription slips</Text>
              <View style={styles.hubTileFooter}>
                <Text style={[styles.hubTileActionText, { color: '#2563EB' }]}>View Bookings ›</Text>
              </View>
            </TouchableOpacity>

            {/* Hub 2: Diagnostic Lab Reports */}
            <TouchableOpacity
              style={styles.hubTileCard}
              onPress={() => navigation?.navigate('HealthRecords')}
              activeOpacity={0.9}
            >
              <View style={styles.hubTileTop}>
                <View style={[styles.hubTileIconCircle, { backgroundColor: '#F0FDF4' }]}>
                  <Ionicons name="flask" size={24} color="#16A34A" />
                </View>
                <View style={[styles.hubTagPill, { backgroundColor: '#DCFCE7' }]}>
                  <Text style={[styles.hubTagText, { color: '#15803D' }]}>NABL Certified</Text>
                </View>
              </View>
              <Text style={styles.hubTileTitle}>Medical Records & Tests</Text>
              <Text style={styles.hubTileSub}>Blood test PDF reports, digital prescriptions, vaccination charts & 3T MRI scans</Text>
              <View style={styles.hubTileFooter}>
                <Text style={[styles.hubTileActionText, { color: '#16A34A' }]}>Open Records ›</Text>
              </View>
            </TouchableOpacity>

            {/* Hub 3: Pharmacy Orders */}
            <TouchableOpacity
              style={styles.hubTileCard}
              onPress={() => navigation?.navigate('MyOrders')}
              activeOpacity={0.9}
            >
              <View style={styles.hubTileTop}>
                <View style={[styles.hubTileIconCircle, { backgroundColor: '#FFF7ED' }]}>
                  <Ionicons name="cart" size={24} color="#EA580C" />
                </View>
                <View style={[styles.hubTagPill, { backgroundColor: '#FFEDD5' }]}>
                  <Text style={[styles.hubTagText, { color: '#C2410C' }]}>60-Min Express</Text>
                </View>
              </View>
              <Text style={styles.hubTileTitle}>Pharmacy Orders</Text>
              <Text style={styles.hubTileSub}>Active deliveries, monthly medicine refill schedule, order invoices & Jan Aushadhi</Text>
              <View style={styles.hubTileFooter}>
                <Text style={[styles.hubTileActionText, { color: '#EA580C' }]}>Track Orders ›</Text>
              </View>
            </TouchableOpacity>

            {/* Hub 4: Health Monitor & Vitals */}
            <TouchableOpacity
              style={styles.hubTileCard}
              onPress={() => navigation?.navigate('HealthMonitor')}
              activeOpacity={0.9}
            >
              <View style={styles.hubTileTop}>
                <View style={[styles.hubTileIconCircle, { backgroundColor: '#FAF5FF' }]}>
                  <Ionicons name="pulse" size={24} color="#7C3AED" />
                </View>
                <View style={[styles.hubTagPill, { backgroundColor: '#F3E8FF' }]}>
                  <Text style={[styles.hubTagText, { color: '#7E22CE' }]}>Telemetry Log</Text>
                </View>
              </View>
              <Text style={styles.hubTileTitle}>Health Monitor & Vitals</Text>
              <Text style={styles.hubTileSub}>Track blood pressure, fasting glucose, SpO2 pulse and BMI with telemetry graphs</Text>
              <View style={styles.hubTileFooter}>
                <Text style={[styles.hubTileActionText, { color: '#7C3AED' }]}>Log Vitals ›</Text>
              </View>
            </TouchableOpacity>
          </View>

          {/* ============================================================
              4. BENEFITS, INSURANCE & FAMILY SHOWCASE (HOMESCREEN 2-COLUMN)
          ============================================================ */}
          <View style={styles.sectionHeaderWeb}>
            <View>
              <Text style={styles.sectionHeadingTitle}>Benefits, Insurance & Family</Text>
              <Text style={styles.sectionSubHeading}>Manage health insurance claims, family dependents and GST invoices</Text>
            </View>
          </View>

          <View style={styles.secondaryGridWeb}>
            {/* 1. Cashless Health Insurance */}
            <TouchableOpacity
              style={styles.secondaryCardWeb}
              onPress={() => navigation?.navigate('HealthInsurance')}
              activeOpacity={0.9}
            >
              <View style={styles.secondaryCardHeader}>
                <View style={[styles.secondaryIconCircle, { backgroundColor: '#ECFDF5' }]}>
                  <Ionicons name="shield-checkmark" size={22} color="#059669" />
                </View>
                <View style={[styles.badgePillWeb, { backgroundColor: '#DCFCE7' }]}>
                  <Text style={[styles.badgePillWebText, { color: '#15803D' }]}>IRDAI Cashless</Text>
                </View>
              </View>
              <Text style={styles.secondaryTitleWeb}>Health Insurance & TPA Desk</Text>
              <Text style={styles.secondaryDescWeb}>
                Guaranteed cashless hospital admission across 10,000+ top hospitals with fast 20-min pre-authorization.
              </Text>
              <View style={styles.secondaryCardFooter}>
                <Text style={[styles.secondaryActionText, { color: '#059669' }]}>View Coverage & E-Card ›</Text>
              </View>
            </TouchableOpacity>

            {/* 2. Family Health Profiles */}
            <TouchableOpacity
              style={styles.secondaryCardWeb}
              onPress={() => navigation?.navigate('FamilyProfiles')}
              activeOpacity={0.9}
            >
              <View style={styles.secondaryCardHeader}>
                <View style={[styles.secondaryIconCircle, { backgroundColor: '#EFF6FF' }]}>
                  <Ionicons name="people" size={22} color="#2563EB" />
                </View>
                <View style={[styles.badgePillWeb, { backgroundColor: '#DBEAFE' }]}>
                  <Text style={[styles.badgePillWebText, { color: '#1D4ED8' }]}>{familyCount} Profiles</Text>
                </View>
              </View>
              <Text style={styles.secondaryTitleWeb}>Family Members & Dependents</Text>
              <Text style={styles.secondaryDescWeb}>
                Book appointments and medical orders for parents, spouse, or children with separate encrypted profiles.
              </Text>
              <View style={styles.secondaryCardFooter}>
                <Text style={[styles.secondaryActionText, { color: '#2563EB' }]}>Manage Family ({familyCount}) ›</Text>
              </View>
            </TouchableOpacity>

            {/* 3. Invoices & GST Receipts */}
            <TouchableOpacity
              style={styles.secondaryCardWeb}
              onPress={() => navigation?.navigate('TransactionHistory')}
              activeOpacity={0.9}
            >
              <View style={styles.secondaryCardHeader}>
                <View style={[styles.secondaryIconCircle, { backgroundColor: '#FEF3C7' }]}>
                  <Ionicons name="receipt" size={22} color="#D97706" />
                </View>
                <View style={[styles.badgePillWeb, { backgroundColor: '#FEF3C7' }]}>
                  <Text style={[styles.badgePillWebText, { color: '#B45309' }]}>Tax Deductible</Text>
                </View>
              </View>
              <Text style={styles.secondaryTitleWeb}>Invoices & Medical Bills</Text>
              <Text style={styles.secondaryDescWeb}>
                Download tax receipts and token statements eligible for 80D medical expenditure tax deductions.
              </Text>
              <View style={styles.secondaryCardFooter}>
                <Text style={[styles.secondaryActionText, { color: '#D97706' }]}>Download Tax Invoices ›</Text>
              </View>
            </TouchableOpacity>

            {/* 4. Refer Friends & Rewards */}
            <TouchableOpacity
              style={styles.secondaryCardWeb}
              onPress={() => navigation?.navigate('ReferEarn')}
              activeOpacity={0.9}
            >
              <View style={styles.secondaryCardHeader}>
                <View style={[styles.secondaryIconCircle, { backgroundColor: '#FDF2F8' }]}>
                  <Ionicons name="gift" size={22} color="#DB2777" />
                </View>
                <View style={[styles.badgePillWeb, { backgroundColor: '#FCE7F3' }]}>
                  <Text style={[styles.badgePillWebText, { color: '#BE185D' }]}>Get ₹250</Text>
                </View>
              </View>
              <Text style={styles.secondaryTitleWeb}>Refer Friends & Earn Health Cash</Text>
              <Text style={styles.secondaryDescWeb}>
                Invite friends and family to MediUnify. You each get ₹250 wallet credit on their first completed booking.
              </Text>
              <View style={styles.secondaryCardFooter}>
                <Text style={[styles.secondaryActionText, { color: '#DB2777' }]}>Invite & Earn Now ›</Text>
              </View>
            </TouchableOpacity>
          </View>

          {/* ============================================================
              5. 24x7 EMERGENCY & HELPLINE ROW (HOMESCREEN STYLE)
          ============================================================ */}
          <View style={styles.emergencyBannerRowWeb}>
            <TouchableOpacity
              style={styles.emergencyCardItemWeb}
              onPress={() => Linking.openURL('tel:108')}
              activeOpacity={0.9}
            >
              <View style={[styles.emergencyIconWrap, { backgroundColor: '#DC2626' }]}>
                <Ionicons name="medical" size={24} color="#FFFFFF" />
              </View>
              <View style={styles.emergencyTextCol}>
                <View style={styles.emergencyHeaderRow}>
                  <Text style={styles.emergencyCardTitle}>24x7 Ambulance SOS</Text>
                  <View style={styles.emergencyCallPill}>
                    <Ionicons name="call" size={12} color="#DC2626" />
                    <Text style={styles.emergencyCallPillText}>Call 108</Text>
                  </View>
                </View>
                <Text style={styles.emergencyCardSub}>Government emergency response & rapid dispatch</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.emergencyCardItemWeb}
              onPress={() => Linking.openURL('tel:18004259999')}
              activeOpacity={0.9}
            >
              <View style={[styles.emergencyIconWrap, { backgroundColor: '#0D9488' }]}>
                <Ionicons name="call" size={24} color="#FFFFFF" />
              </View>
              <View style={styles.emergencyTextCol}>
                <View style={styles.emergencyHeaderRow}>
                  <Text style={styles.emergencyCardTitle}>Doctor Helpline Desk</Text>
                  <View style={[styles.emergencyCallPill, { backgroundColor: '#F0FDFA' }]}>
                    <Text style={[styles.emergencyCallPillText, { color: '#0D9488' }]}>1800-425-9999</Text>
                  </View>
                </View>
                <Text style={styles.emergencyCardSub}>Toll-free 24x7 medical triage & clinical advisory</Text>
              </View>
            </TouchableOpacity>
          </View>

          {/* ============================================================
              6. WEB SIGN OUT ACTION CARD (MATCHING DESIGN)
          ============================================================ */}
          <View style={styles.webLogoutCard}>
            <View style={styles.webLogoutCardLeft}>
              <View style={styles.webLogoutIconCircle}>
                <Ionicons name="log-out-outline" size={22} color="#DC2626" />
              </View>
              <View style={styles.webLogoutTextCol}>
                <Text style={styles.webLogoutCardTitle}>Sign Out of Your Account</Text>
                <Text style={styles.webLogoutCardSub}>
                  Securely terminate your current session on this device. You can log back in anytime.
                </Text>
              </View>
            </View>

            <TouchableOpacity
              style={styles.webLogoutBtn}
              onPress={handleLogout}
              activeOpacity={0.88}
            >
              <Ionicons name="log-out-outline" size={17} color="#DC2626" />
              <Text style={styles.webLogoutBtnText}>Log Out of Account</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* ============================================================
            7. WEB APPLICATION FOOTER (MATCHING HOMESCREEN.WEB.JS)
        ============================================================ */}
        <WebFooter navigation={navigation} />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F1F5F9',
  },
  scrollContent: {
    flexGrow: 1,
  },

  // 1. BREADCRUMB BAR
  breadcrumbBarWrap: {
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    paddingVertical: 10,
    paddingHorizontal: 24,
  },
  breadcrumbBarInner: {
    maxWidth: 1320,
    width: '100%',
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  breadcrumbLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  breadcrumbLink: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#00B894',
    cursor: 'pointer',
  },
  breadcrumbCurrent: {
    fontSize: 12.5,
    fontWeight: '600',
    color: '#64748B',
  },
  securityBadgeWeb: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#F0FDFA',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#CCFBF1',
  },
  securityBadgeWebText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#0D9488',
  },

  // 2. MAIN WEB CONTAINER
  webContainer: {
    maxWidth: 1320,
    width: '100%',
    alignSelf: 'center',
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 40,
  },

  // HERO DUAL ROW
  heroDualRow: {
    flexDirection: 'column',
    gap: 18,
    marginBottom: 16,
  },
  heroDualRowDesktop: {
    flexDirection: 'row',
    alignItems: 'stretch',
  },

  // VIP MEMBERSHIP BANNER
  webVipMembershipBanner: {
    backgroundColor: '#FFFBEB',
    borderRadius: 16,
    padding: 18,
    borderWidth: 1.5,
    borderColor: '#FDE68A',
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 16,
    marginBottom: 26,
    shadowColor: '#D97706',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
  },
  webVipBannerLeft: {
    flex: 2,
    minWidth: 320,
  },
  webVipBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  webVipCrownCircle: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: '#FEF3C7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  webVipTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
  },
  webVipBadgePill: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  webVipBadgeText: {
    fontSize: 10,
    fontWeight: '900',
    color: '#B45309',
  },
  webVipSub: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 3,
  },
  webVipCtaBtn: {
    backgroundColor: '#D97706',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
  },
  webVipCtaBtnText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#FFFFFF',
  },

  // PATIENT DIGITAL HEALTH CARD
  patientIdentityCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#1E3A8A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 3,
    justifyContent: 'space-between',
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  brandPillWeb: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#F0FDFA',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#CCFBF1',
  },
  brandPillWebText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#00B894',
    letterSpacing: 0.4,
  },
  uhidBadgePill: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  uhidBadgePillText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#475569',
  },
  userMainInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },
  avatarWrapWeb: {
    position: 'relative',
  },
  avatarCircleWeb: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: '#00B894',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: '#E6FAF5',
    shadowColor: '#00B894',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 5,
  },
  avatarTextWeb: {
    fontSize: 28,
    fontWeight: '900',
    color: '#FFFFFF',
  },
  verifiedCheckBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#1E3A8A',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  userInfoColWeb: {
    flex: 1,
    marginLeft: 16,
  },
  userNameWeb: {
    fontSize: 21,
    fontWeight: '900',
    color: '#1E3A8A',
    letterSpacing: -0.4,
  },
  userSubTextWeb: {
    fontSize: 12.5,
    color: '#64748B',
    marginTop: 3,
    fontWeight: '500',
  },
  vitalsPillRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#F1F5F9',
    marginBottom: 14,
  },
  vitalTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#F8FAFC',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  vitalTagText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#334155',
  },
  identityActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  primaryEditBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#00B894',
    paddingVertical: 10,
    borderRadius: 8,
    cursor: 'pointer',
  },
  primaryEditBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  secondarySecurityBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 8,
    cursor: 'pointer',
  },
  secondarySecurityBtnText: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#1E3A8A',
  },

  // HEALTH WALLET CARD
  walletCardWeb: {
    backgroundColor: '#F0F9FF',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    shadowColor: '#1E3A8A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 3,
    justifyContent: 'space-between',
  },
  walletHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  walletTitleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  walletIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#1E3A8A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  walletTitleWeb: {
    fontSize: 16,
    fontWeight: '800',
    color: '#1E3A8A',
    letterSpacing: -0.2,
  },
  walletSubtitleWeb: {
    fontSize: 11.5,
    color: '#64748B',
    marginTop: 1,
  },
  statusActivePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#E6FAF5',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
  },
  statusActiveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#00B894',
  },
  statusActiveText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#00B894',
  },
  walletBalanceBigRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  balanceLabelWeb: {
    fontSize: 11.5,
    fontWeight: '600',
    color: '#64748B',
  },
  balanceAmountWeb: {
    fontSize: 26,
    fontWeight: '900',
    color: '#00B894',
    letterSpacing: -0.5,
  },
  carePointsCard: {
    backgroundColor: '#FFF3E0',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    alignItems: 'flex-end',
    borderWidth: 1,
    borderColor: '#FFE0B2',
  },
  carePointsLabel: {
    fontSize: 10.5,
    fontWeight: '700',
    color: '#FF7F50',
  },
  carePointsValue: {
    fontSize: 13,
    fontWeight: '900',
    color: '#EA580C',
    marginTop: 1,
  },
  walletBenefitNote: {
    fontSize: 12,
    color: '#64748B',
    lineHeight: 18,
    marginBottom: 14,
  },
  walletActionButtonsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  topUpWalletBtnWeb: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#00B894',
    paddingVertical: 10,
    borderRadius: 8,
    cursor: 'pointer',
  },
  topUpWalletBtnTextWeb: {
    fontSize: 12.5,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  viewPassbookBtnWeb: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingVertical: 10,
    borderRadius: 8,
    cursor: 'pointer',
  },
  viewPassbookBtnTextWeb: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#1E3A8A',
  },

  // 3. SECTION HEADINGS (HOMESCREEN STYLE)
  sectionHeaderWeb: {
    marginTop: 8,
    marginBottom: 14,
  },
  sectionHeadingTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: '#1E3A8A',
    letterSpacing: -0.4,
  },
  sectionSubHeading: {
    fontSize: 13,
    color: '#64748B',
    marginTop: 2,
    fontWeight: '500',
  },

  // HUBS 4-COLUMN / 2x2 GRID
  hubsGridWeb: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
    marginBottom: 26,
  },
  hubTileCard: {
    flex: 1,
    minWidth: 260,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 18,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#1E3A8A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
    justifyContent: 'space-between',
    cursor: 'pointer',
  },
  hubTileTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  hubTileIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  hubTagPill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  hubTagText: {
    fontSize: 10.5,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  hubTileTitle: {
    fontSize: 15.5,
    fontWeight: '800',
    color: '#1E3A8A',
    marginBottom: 4,
  },
  hubTileSub: {
    fontSize: 12,
    color: '#64748B',
    lineHeight: 18,
    marginBottom: 14,
  },
  hubTileFooter: {
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    paddingTop: 10,
  },
  hubTileActionText: {
    fontSize: 12.5,
    fontWeight: '800',
  },

  // SECONDARY 4-CARD BENEFITS GRID
  secondaryGridWeb: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
    marginBottom: 24,
  },
  secondaryCardWeb: {
    flex: 1,
    minWidth: 260,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 18,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#1E3A8A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
    justifyContent: 'space-between',
    cursor: 'pointer',
  },
  secondaryCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  secondaryIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgePillWeb: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  badgePillWebText: {
    fontSize: 10.5,
    fontWeight: '800',
  },
  secondaryTitleWeb: {
    fontSize: 15,
    fontWeight: '800',
    color: '#1E3A8A',
    marginBottom: 4,
  },
  secondaryDescWeb: {
    fontSize: 12,
    color: '#64748B',
    lineHeight: 18,
    marginBottom: 14,
  },
  secondaryCardFooter: {
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    paddingTop: 10,
  },
  secondaryActionText: {
    fontSize: 12.5,
    fontWeight: '800',
  },

  // EMERGENCY ROW
  emergencyBannerRowWeb: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
    marginBottom: 22,
  },
  emergencyCardItemWeb: {
    flex: 1,
    minWidth: 280,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#1E3A8A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
    cursor: 'pointer',
  },
  emergencyIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  emergencyTextCol: {
    flex: 1,
  },
  emergencyHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 3,
  },
  emergencyCardTitle: {
    fontSize: 14.5,
    fontWeight: '800',
    color: '#1E3A8A',
  },
  emergencyCallPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FEE2E2',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  emergencyCallPillText: {
    fontSize: 11,
    fontWeight: '900',
  },
  emergencyCardSub: {
    fontSize: 11.5,
    color: '#64748B',
  },

  // WEB SIGN OUT ACTION CARD (MATCHING DESIGN)
  webLogoutCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 18,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 24,
    flexWrap: 'wrap',
    gap: 16,
    shadowColor: '#1E3A8A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  webLogoutCardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    flex: 1,
    minWidth: 260,
  },
  webLogoutIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#FEE2E2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  webLogoutTextCol: {
    flex: 1,
  },
  webLogoutCardTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#1E3A8A',
    marginBottom: 3,
  },
  webLogoutCardSub: {
    fontSize: 12,
    color: '#64748B',
    lineHeight: 18,
  },
  webLogoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FEF2F2',
    borderWidth: 1.5,
    borderColor: '#FECACA',
    paddingHorizontal: 20,
    paddingVertical: 11,
    borderRadius: 10,
    cursor: 'pointer',
    alignSelf: 'center',
  },
  webLogoutBtnText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#DC2626',
  },
});

export default ProfileScreenWeb;
