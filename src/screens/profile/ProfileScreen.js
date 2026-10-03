import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
  StatusBar,
  Linking,
  useWindowDimensions,
  Image,
  Modal,
  TextInput,
  Keyboard,
  TouchableWithoutFeedback,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { showAlert } from '../../utils/alert';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import colors from '../../theme/colors';
import { useTheme } from '../../context/ThemeContext';
import { syncActiveUser } from '../../services/dataSyncService';

const ProfileScreen = ({ navigation, route }) => {
  const { isDarkMode, language, changeLanguage, LANGUAGES } = useTheme();
  const currentLang = LANGUAGES.find((l) => l.code === language) || LANGUAGES[0];
  const { width } = useWindowDimensions();
  const isTablet = width >= 600;

  // User Profile State
  const [user, setUser] = useState({
    name: route?.params?.updatedUser?.name || 'Ramesh Kumar',
    email: route?.params?.updatedUser?.email || 'ramesh.kumar@example.com',
    phone: route?.params?.updatedUser?.phone || '+91 98450 12345',
    location: 'Mysuru, Karnataka',
    photo: route?.params?.updatedUser?.photo || '',
    bloodGroup: 'O+ Positive',
    age: '32 Yrs',
    gender: 'Male',
    emergencyContact: '+91 98450 11223 (Family)',
    uhid: 'MU-84920',
  });

  const [familyCount, setFamilyCount] = useState(1);

  // Modals state
  const [showLanguageModal, setShowLanguageModal] = useState(false);
  const [showAboutModal, setShowAboutModal] = useState(false);
  const [showAddressModal, setShowAddressModal] = useState(false);
  const [addressInput, setAddressInput] = useState('');
  const [addressCity, setAddressCity] = useState('Mysuru');
  const [userMembership, setUserMembership] = useState(null);

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
      const u = route.params.updatedUser;
      setUser((prev) => ({
        ...prev,
        name: u.name || prev.name,
        email: u.email || prev.email,
        phone: u.phone || prev.phone,
        location: u.location || prev.location,
        photo: u.photo !== undefined ? u.photo : prev.photo,
        bloodGroup: u.bloodGroup || prev.bloodGroup,
        gender: u.gender || prev.gender,
        age: u.age || prev.age,
        emergencyContact: u.emergencyContact || prev.emergencyContact,
        dob: u.dob || prev.dob,
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
      const storedLoc = await AsyncStorage.getItem('@unnathi_user_location');
      const storedCity = await AsyncStorage.getItem('@mediunify_selected_city');
      const storedPhoto = await AsyncStorage.getItem('@unnathi_user_photo');
      const storedAddress = await AsyncStorage.getItem('@unnathi_user_address');

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

      const resolvedLocation =
        storedLoc ||
        parsedUser?.location ||
        (storedCity ? `${storedCity}, Karnataka` : 'Mysuru, Karnataka');

      const resolvedPhoto =
        parsedUser?.photo ||
        regUser?.photo ||
        storedPhoto ||
        '';

      setUser((prev) => ({
        ...prev,
        name: resolvedFullName || prev.name,
        email: parsedUser?.email || (storedEmail && storedEmail.trim() ? storedEmail.trim() : prev.email),
        phone: parsedUser?.phone || (storedPhone && storedPhone.trim() ? storedPhone.trim() : prev.phone),
        location: resolvedLocation,
        photo: resolvedPhoto || prev.photo,
        bloodGroup: parsedUser?.bloodGroup || regUser?.bloodGroup || prev.bloodGroup,
        age: parsedUser?.age || regUser?.age || prev.age,
        gender: parsedUser?.gender || regUser?.gender || prev.gender,
        emergencyContact: parsedUser?.emergencyContact || regUser?.emergencyContact || prev.emergencyContact,
        dob: parsedUser?.dob || regUser?.dob || prev.dob || '',
      }));

      setAddressInput(storedAddress || resolvedLocation);
      setAddressCity(storedCity || 'Mysuru');

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
        const memStr = await AsyncStorage.getItem('@mediunify_membership');
        if (memStr) {
          setUserMembership(JSON.parse(memStr));
        } else {
          setUserMembership(null);
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
              location: latest.location || prev.location,
              photo: latest.photo || prev.photo,
              bloodGroup: latest.bloodGroup || prev.bloodGroup,
              age: latest.age || prev.age,
              gender: latest.gender || prev.gender,
              emergencyContact: latest.emergencyContact || prev.emergencyContact,
              dob: latest.dob || prev.dob || '',
            }));
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

  const handleSaveAddress = async () => {
    const trimmed = addressInput.trim();
    if (!trimmed) {
      showAlert('Address Required', 'Please enter your complete address.');
      return;
    }
    try {
      await AsyncStorage.setItem('@unnathi_user_address', trimmed);
      await AsyncStorage.setItem('@unnathi_user_location', trimmed);
      setUser((prev) => ({ ...prev, location: trimmed }));
      setShowAddressModal(false);
      showAlert('Address Updated', 'Your delivery & service address has been saved.');
    } catch (e) {
      showAlert('Error', 'Could not save address. Please try again.');
    }
  };

  const handleOpenMapAddress = () => {
    setShowAddressModal(false);
    navigation.navigate('PharmacyLocation');
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
    <SafeAreaView
      edges={['top', 'left', 'right']}
      style={[styles.container, { backgroundColor: isDarkMode ? '#0B0F19' : '#F8FAFC' }]}
    >
      <StatusBar
        barStyle={isDarkMode ? 'light-content' : 'dark-content'}
        backgroundColor={isDarkMode ? '#0B0F19' : '#FFFFFF'}
      />

      {/* TOP HEADER BAR */}
      <View style={[styles.headerBar, { backgroundColor: isDarkMode ? '#111827' : '#FFFFFF' }]}>
        {navigation.canGoBack() ? (
          <TouchableOpacity
            style={styles.headerBtn}
            onPress={() => navigation.goBack()}
            activeOpacity={0.8}
            accessibilityLabel="Go Back"
          >
            <Ionicons name="arrow-back" size={22} color={isDarkMode ? '#F8FAFC' : '#0F172A'} />
          </TouchableOpacity>
        ) : (
          <View style={{ width: 36 }} />
        )}

        <Text style={[styles.headerTitle, { color: isDarkMode ? '#F8FAFC' : '#0F172A' }]}>
          PROFILE
        </Text>

        <View style={{ width: 36 }} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={[styles.pageInnerContainer, isTablet && styles.pageInnerTablet]}>
          {/* ============================================================
              PROFILE HEADER SECTION
              [ Profile Photo ]
              User Name
              Phone Number
              Location
              [ Edit ]
          ============================================================ */}
          <View style={[styles.profileHeaderCard, { backgroundColor: isDarkMode ? '#111827' : '#FFFFFF' }]}>
            {/* PROFILE PHOTO */}
            <View style={styles.photoContainer}>
              <TouchableOpacity
                style={styles.avatarWrapper}
                onPress={handleEditProfile}
                activeOpacity={0.85}
              >
                {user.photo ? (
                  <Image source={{ uri: user.photo }} style={styles.avatarImg} />
                ) : (
                  <View style={styles.avatarFallback}>
                    <Text style={styles.avatarInitial}>{userInitial}</Text>
                  </View>
                )}
                <View style={styles.avatarEditBadge}>
                  <Ionicons name="camera" size={13} color="#FFFFFF" />
                </View>
              </TouchableOpacity>
            </View>

            {/* USER NAME */}
            <Text
              style={[styles.userName, { color: isDarkMode ? '#F8FAFC' : '#0F172A' }]}
              numberOfLines={1}
            >
              {user.name}
            </Text>

            {/* PHONE NUMBER */}
            <Text style={styles.userPhone}>
              {user.phone}
            </Text>

            {/* LOCATION */}
            <View style={styles.locationRow}>
              <Ionicons name="location-sharp" size={14} color="#0D9488" />
              <Text
                style={[styles.userLocation, { color: isDarkMode ? '#94A3B8' : '#64748B' }]}
                numberOfLines={1}
              >
                {user.location || 'Mysuru, Karnataka'}
              </Text>
            </View>

            {/* [ EDIT ] BUTTON */}
            <TouchableOpacity
              style={styles.editBtn}
              onPress={handleEditProfile}
              activeOpacity={0.85}
            >
              <Ionicons name="create-outline" size={15} color="#0D9488" />
              <Text style={styles.editBtnText}>Edit</Text>
            </TouchableOpacity>
          </View>

          {/* ============================================================
              QUICK ACCESS:
              [ Family Members ]
              [ Health Records ]
              [ Payment History ]
              [ Settings ]
          ============================================================ */}
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionHeading}>Quick access</Text>
          </View>

          <View style={[styles.quickAccessGrid, isTablet && styles.quickAccessGridTablet]}>
            {/* 1. FAMILY MEMBERS */}
            <TouchableOpacity
              style={[
                styles.quickAccessCard,
                isTablet && styles.quickAccessCardTablet,
                { backgroundColor: isDarkMode ? '#111827' : '#FFFFFF' },
              ]}
              onPress={() => navigation.navigate('FamilyProfiles')}
              activeOpacity={0.78}
            >
              <View style={[styles.quickAccessIconWrap, { backgroundColor: '#EFF6FF' }]}>
                <Ionicons name="people" size={24} color="#2563EB" />
              </View>
              <Text
                style={[styles.quickAccessTitle, { color: isDarkMode ? '#F8FAFC' : '#0F172A' }]}
                numberOfLines={1}
              >
                Family Members
              </Text>
            </TouchableOpacity>

            {/* 2. HEALTH RECORDS */}
            <TouchableOpacity
              style={[
                styles.quickAccessCard,
                isTablet && styles.quickAccessCardTablet,
                { backgroundColor: isDarkMode ? '#111827' : '#FFFFFF' },
              ]}
              onPress={() => navigation.navigate('HealthRecords')}
              activeOpacity={0.78}
            >
              <View style={[styles.quickAccessIconWrap, { backgroundColor: '#F0FDFA' }]}>
                <Ionicons name="folder-open" size={24} color="#0D9488" />
              </View>
              <Text
                style={[styles.quickAccessTitle, { color: isDarkMode ? '#F8FAFC' : '#0F172A' }]}
                numberOfLines={1}
              >
                Health Records
              </Text>
            </TouchableOpacity>

            {/* 3. PAYMENT HISTORY */}
            <TouchableOpacity
              style={[
                styles.quickAccessCard,
                isTablet && styles.quickAccessCardTablet,
                { backgroundColor: isDarkMode ? '#111827' : '#FFFFFF' },
              ]}
              onPress={() => navigation.navigate('TransactionHistory')}
              activeOpacity={0.78}
            >
              <View style={[styles.quickAccessIconWrap, { backgroundColor: '#ECFDF5' }]}>
                <Ionicons name="receipt-outline" size={24} color="#059669" />
              </View>
              <Text
                style={[styles.quickAccessTitle, { color: isDarkMode ? '#F8FAFC' : '#0F172A' }]}
                numberOfLines={1}
              >
                Payment History
              </Text>
            </TouchableOpacity>

            {/* 4. SETTINGS */}
            <TouchableOpacity
              style={[
                styles.quickAccessCard,
                isTablet && styles.quickAccessCardTablet,
                { backgroundColor: isDarkMode ? '#111827' : '#FFFFFF' },
              ]}
              onPress={() => navigation.navigate('Settings')}
              activeOpacity={0.78}
            >
              <View style={[styles.quickAccessIconWrap, { backgroundColor: '#F1F5F9' }]}>
                <Ionicons name="settings-outline" size={24} color="#475569" />
              </View>
              <Text
                style={[styles.quickAccessTitle, { color: isDarkMode ? '#F8FAFC' : '#0F172A' }]}
                numberOfLines={1}
              >
                Settings
              </Text>
            </TouchableOpacity>
          </View>

          {/* ============================================================
              NAVIGATION LIST:
              Personal Information →
              Address →
              Notifications →
              Language →
              Help & Support →
              About MediUnify →
          ============================================================ */}
          <View style={[styles.menuListCard, { backgroundColor: isDarkMode ? '#111827' : '#FFFFFF' }]}>
            {/* 1. PERSONAL INFORMATION */}
            <TouchableOpacity
              style={styles.menuRow}
              onPress={handleEditProfile}
              activeOpacity={0.75}
            >
              <View style={[styles.menuIconCircle, { backgroundColor: '#EFF6FF' }]}>
                <Ionicons name="person-outline" size={19} color="#2563EB" />
              </View>
              <View style={styles.menuTitleWrap}>
                <Text style={[styles.menuTitle, { color: isDarkMode ? '#F8FAFC' : '#0F172A' }]}>
                  Personal Information
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color="#94A3B8" />
            </TouchableOpacity>

            <View style={[styles.divider, { backgroundColor: isDarkMode ? '#1E293B' : '#F1F5F9' }]} />

            {/* 2. ADDRESS */}
            <TouchableOpacity
              style={styles.menuRow}
              onPress={() => setShowAddressModal(true)}
              activeOpacity={0.75}
            >
              <View style={[styles.menuIconCircle, { backgroundColor: '#F0FDFA' }]}>
                <Ionicons name="location-outline" size={19} color="#0D9488" />
              </View>
              <View style={styles.menuTitleWrap}>
                <Text style={[styles.menuTitle, { color: isDarkMode ? '#F8FAFC' : '#0F172A' }]}>
                  Address
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color="#94A3B8" />
            </TouchableOpacity>

            <View style={[styles.divider, { backgroundColor: isDarkMode ? '#1E293B' : '#F1F5F9' }]} />

            {/* MEMBERSHIP */}
            <TouchableOpacity
              style={styles.menuRow}
              onPress={() => navigation.navigate('Membership')}
              activeOpacity={0.75}
            >
              <View style={[styles.menuIconCircle, { backgroundColor: '#FEF3C7' }]}>
                <Ionicons name="ribbon-outline" size={19} color="#D97706" />
              </View>
              <View style={styles.menuTitleWrap}>
                <Text style={[styles.menuTitle, { color: isDarkMode ? '#F8FAFC' : '#0F172A' }]}>
                  Membership
                </Text>
              </View>
              {userMembership?.status === 'active' ? (
                <View style={styles.memberStatusPill}>
                  <Text style={styles.memberStatusPillText}>{userMembership.tierName} Active</Text>
                </View>
              ) : (
                <View style={styles.explorePill}>
                  <Text style={styles.explorePillText}>Explore Plans</Text>
                </View>
              )}
              <Ionicons name="chevron-forward" size={18} color="#94A3B8" />
            </TouchableOpacity>

            <View style={[styles.divider, { backgroundColor: isDarkMode ? '#1E293B' : '#F1F5F9' }]} />

            {/* 3. NOTIFICATIONS */}
            <TouchableOpacity
              style={styles.menuRow}
              onPress={() => navigation.navigate('Notifications')}
              activeOpacity={0.75}
            >
              <View style={[styles.menuIconCircle, { backgroundColor: '#FEF3C7' }]}>
                <Ionicons name="notifications-outline" size={19} color="#D97706" />
              </View>
              <View style={styles.menuTitleWrap}>
                <Text style={[styles.menuTitle, { color: isDarkMode ? '#F8FAFC' : '#0F172A' }]}>
                  Notifications
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color="#94A3B8" />
            </TouchableOpacity>

            <View style={[styles.divider, { backgroundColor: isDarkMode ? '#1E293B' : '#F1F5F9' }]} />

            {/* 4. LANGUAGE */}
            <TouchableOpacity
              style={styles.menuRow}
              onPress={() => setShowLanguageModal(true)}
              activeOpacity={0.75}
            >
              <View style={[styles.menuIconCircle, { backgroundColor: '#E0F2FE' }]}>
                <Ionicons name="globe-outline" size={19} color="#0284C7" />
              </View>
              <View style={styles.menuTitleWrap}>
                <Text style={[styles.menuTitle, { color: isDarkMode ? '#F8FAFC' : '#0F172A' }]}>
                  Language
                </Text>
              </View>
              <View style={styles.langPill}>
                <Text style={styles.langPillText}>{currentLang?.native || 'English'}</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color="#94A3B8" />
            </TouchableOpacity>

            <View style={[styles.divider, { backgroundColor: isDarkMode ? '#1E293B' : '#F1F5F9' }]} />

            {/* 5. HELP & SUPPORT */}
            <TouchableOpacity
              style={styles.menuRow}
              onPress={() => navigation.navigate('HelpSupport')}
              activeOpacity={0.75}
            >
              <View style={[styles.menuIconCircle, { backgroundColor: '#F3E8FF' }]}>
                <Ionicons name="help-circle-outline" size={19} color="#9333EA" />
              </View>
              <View style={styles.menuTitleWrap}>
                <Text style={[styles.menuTitle, { color: isDarkMode ? '#F8FAFC' : '#0F172A' }]}>
                  Help & Support
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color="#94A3B8" />
            </TouchableOpacity>

            <View style={[styles.divider, { backgroundColor: isDarkMode ? '#1E293B' : '#F1F5F9' }]} />

            {/* 6. ABOUT MEDIUNIFY */}
            <TouchableOpacity
              style={styles.menuRow}
              onPress={() => setShowAboutModal(true)}
              activeOpacity={0.75}
            >
              <View style={[styles.menuIconCircle, { backgroundColor: '#EEF2FF' }]}>
                <Ionicons name="information-circle-outline" size={19} color="#4F46E5" />
              </View>
              <View style={styles.menuTitleWrap}>
                <Text style={[styles.menuTitle, { color: isDarkMode ? '#F8FAFC' : '#0F172A' }]}>
                  About MediUnify
                </Text>
              </View>
              <View style={styles.versionPill}>
                <Text style={styles.versionPillText}>v2.4.0</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color="#94A3B8" />
            </TouchableOpacity>
          </View>

          {/* ============================================================
              LOG OUT BUTTON
          ============================================================ */}
          <TouchableOpacity
            style={styles.logoutBtn}
            onPress={handleLogout}
            activeOpacity={0.85}
          >
            <Ionicons name="log-out-outline" size={20} color="#EF4444" />
            <Text style={styles.logoutBtnText}>Log Out</Text>
          </TouchableOpacity>

          {/* FOOTER */}
          <View style={styles.footerWrap}>
            <Text style={styles.footerText}>
              MediUnify Healthcare • 256-Bit SSL Encrypted
            </Text>
          </View>
        </View>
      </ScrollView>

      {/* ============================================================
          LANGUAGE SELECTION MODAL
      ============================================================ */}
      <Modal
        visible={showLanguageModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowLanguageModal(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowLanguageModal(false)}
        >
          <View
            style={[styles.modalCard, { backgroundColor: isDarkMode ? '#111827' : '#FFFFFF' }]}
            onStartShouldSetResponder={() => true}
          >
            <View style={styles.modalHeader}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Ionicons name="globe-outline" size={22} color="#0D9488" />
                <Text style={[styles.modalTitle, { color: isDarkMode ? '#F8FAFC' : '#0F172A' }]}>
                  Select Language
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => setShowLanguageModal(false)}
                style={styles.modalCloseBtn}
              >
                <Ionicons name="close" size={20} color="#64748B" />
              </TouchableOpacity>
            </View>

            <View style={styles.modalContentList}>
              {LANGUAGES.map((langItem) => {
                const isSelected = language === langItem.code;
                return (
                  <TouchableOpacity
                    key={langItem.id || langItem.code}
                    style={[
                      styles.langOptionItem,
                      isSelected && styles.langOptionSelected,
                      { borderColor: isSelected ? '#0D9488' : isDarkMode ? '#1F2937' : '#E2E8F0' },
                    ]}
                    onPress={async () => {
                      await changeLanguage(langItem.code);
                      setShowLanguageModal(false);
                      showAlert('Language Updated', `App language set to ${langItem.name}.`);
                    }}
                    activeOpacity={0.8}
                  >
                    <View style={styles.langOptionLeft}>
                      <View
                        style={[
                          styles.langBadge,
                          { backgroundColor: isSelected ? '#CCFBF1' : '#F1F5F9' },
                        ]}
                      >
                        <Text
                          style={[
                            styles.langBadgeText,
                            { color: isSelected ? '#0D9488' : '#475569' },
                          ]}
                        >
                          {langItem.flag || langItem.code.toUpperCase()}
                        </Text>
                      </View>
                      <View>
                        <Text
                          style={[
                            styles.langNameText,
                            { color: isDarkMode ? '#F8FAFC' : '#0F172A', fontWeight: isSelected ? '800' : '600' },
                          ]}
                        >
                          {langItem.name}
                        </Text>
                        <Text style={styles.langNativeText}>{langItem.native}</Text>
                      </View>
                    </View>
                    {isSelected ? (
                      <Ionicons name="checkmark-circle" size={22} color="#0D9488" />
                    ) : (
                      <View style={styles.langRadioUnchecked} />
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* ============================================================
          ADDRESS MANAGEMENT MODAL
      ============================================================ */}
      <Modal
        visible={showAddressModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowAddressModal(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => {
            Keyboard.dismiss();
            setShowAddressModal(false);
          }}
        >
          <View
            style={[styles.modalCard, { backgroundColor: isDarkMode ? '#111827' : '#FFFFFF' }]}
            onStartShouldSetResponder={() => true}
          >
            <View style={styles.modalHeader}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Ionicons name="location-outline" size={22} color="#0D9488" />
                <Text style={[styles.modalTitle, { color: isDarkMode ? '#F8FAFC' : '#0F172A' }]}>
                  My Address
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => setShowAddressModal(false)}
                style={styles.modalCloseBtn}
              >
                <Ionicons name="close" size={20} color="#64748B" />
              </TouchableOpacity>
            </View>

            <View style={styles.addressModalBody}>
              <Text style={styles.addressInputLabel}>Delivery & Healthcare Address</Text>
              <TextInput
                style={[
                  styles.addressTextInput,
                  {
                    backgroundColor: isDarkMode ? '#1F2937' : '#F8FAFC',
                    color: isDarkMode ? '#F8FAFC' : '#0F172A',
                    borderColor: isDarkMode ? '#374151' : '#E2E8F0',
                  },
                ]}
                value={addressInput}
                onChangeText={setAddressInput}
                placeholder="Enter house/flat, street, area, city, pincode"
                placeholderTextColor="#94A3B8"
                multiline
                numberOfLines={3}
              />

              <TouchableOpacity
                style={styles.mapPinpointBtn}
                onPress={handleOpenMapAddress}
                activeOpacity={0.8}
              >
                <Ionicons name="map-outline" size={17} color="#0D9488" />
                <Text style={styles.mapPinpointBtnText}>Pick Location on Map</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.saveAddressBtn}
                onPress={handleSaveAddress}
                activeOpacity={0.88}
              >
                <Ionicons name="checkmark" size={18} color="#FFFFFF" />
                <Text style={styles.saveAddressBtnText}>Save Address</Text>
              </TouchableOpacity>
            </View>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* ============================================================
          ABOUT MEDIUNIFY MODAL
      ============================================================ */}
      <Modal
        visible={showAboutModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowAboutModal(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowAboutModal(false)}
        >
          <View
            style={[styles.modalCard, { backgroundColor: isDarkMode ? '#111827' : '#FFFFFF' }]}
            onStartShouldSetResponder={() => true}
          >
            <View style={styles.modalHeader}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Ionicons name="shield-checkmark" size={22} color="#0D9488" />
                <Text style={[styles.modalTitle, { color: isDarkMode ? '#F8FAFC' : '#0F172A' }]}>
                  About MediUnify
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => setShowAboutModal(false)}
                style={styles.modalCloseBtn}
              >
                <Ionicons name="close" size={20} color="#64748B" />
              </TouchableOpacity>
            </View>

            <View style={styles.aboutModalBody}>
              <View style={styles.aboutBrandCircle}>
                <Ionicons name="medical" size={32} color="#0D9488" />
              </View>
              <Text style={[styles.aboutBrandTitle, { color: isDarkMode ? '#F8FAFC' : '#0F172A' }]}>
                MediUnify Healthcare
              </Text>
              <Text style={styles.aboutVersionText}>
                Version 2.4.0 (Build 120) • Unified Mobile Application
              </Text>

              <View style={styles.aboutTrustBadge}>
                <Ionicons name="shield-checkmark" size={16} color="#0D9488" />
                <Text style={styles.aboutTrustText}>
                  NABH & NABL Partnered • HIPAA Compliant Security
                </Text>
              </View>

              <Text style={[styles.aboutDesc, { color: isDarkMode ? '#CBD5E1' : '#475569' }]}>
                MediUnify brings together top doctors, certified diagnostic labs, verified pharmacies, and emergency services into one unified healthcare platform.
              </Text>

              <TouchableOpacity
                style={styles.aboutDoneBtn}
                onPress={() => setShowAboutModal(false)}
                activeOpacity={0.88}
              >
                <Text style={styles.aboutDoneBtnText}>Done</Text>
              </TouchableOpacity>
            </View>
          </View>
        </TouchableOpacity>
      </Modal>
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
  headerBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
    letterSpacing: 1,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  pageInnerContainer: {
    width: '100%',
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  pageInnerTablet: {
    maxWidth: 620,
    alignSelf: 'center',
    paddingHorizontal: 24,
    paddingTop: 24,
  },

  // PROFILE HEADER CARD
  profileHeaderCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    alignItems: 'center',
    paddingVertical: 24,
    paddingHorizontal: 20,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
    marginBottom: 20,
  },
  photoContainer: {
    marginBottom: 14,
  },
  avatarWrapper: {
    width: 92,
    height: 92,
    borderRadius: 46,
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: '#CCFBF1',
  },
  avatarImg: {
    width: 86,
    height: 86,
    borderRadius: 43,
  },
  avatarFallback: {
    width: 86,
    height: 86,
    borderRadius: 43,
    backgroundColor: '#0D9488',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitial: {
    fontSize: 36,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  avatarEditBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#0F766E',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
  },
  userName: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 4,
    textAlign: 'center',
  },
  userPhone: {
    fontSize: 14,
    color: '#64748B',
    fontWeight: '600',
    marginBottom: 6,
    textAlign: 'center',
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 16,
  },
  userLocation: {
    fontSize: 13,
    color: '#64748B',
    fontWeight: '500',
  },
  editBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 20,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: '#F0FDFA',
    borderWidth: 1,
    borderColor: '#CCFBF1',
  },
  editBtnText: {
    fontSize: 13.5,
    fontWeight: '700',
    color: '#0D9488',
  },

  // QUICK ACCESS
  sectionHeaderRow: {
    marginBottom: 12,
    paddingHorizontal: 4,
  },
  sectionHeading: {
    fontSize: 13,
    fontWeight: '700',
    color: '#64748B',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  quickAccessGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 20,
    justifyContent: 'space-between',
  },
  quickAccessGridTablet: {
    flexWrap: 'nowrap',
    gap: 12,
  },
  quickAccessCard: {
    width: '48%',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    paddingVertical: 18,
    paddingHorizontal: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#F1F5F9',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 5,
    elevation: 1,
  },
  quickAccessCardTablet: {
    flex: 1,
    width: 'auto',
  },
  quickAccessIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  quickAccessTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
    textAlign: 'center',
  },

  // NAVIGATION MENU LIST
  menuListCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    paddingVertical: 4,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 2,
  },
  menuRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    minHeight: 56,
  },
  menuIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  menuTitleWrap: {
    flex: 1,
  },
  menuTitle: {
    fontSize: 14.5,
    fontWeight: '700',
    color: '#0F172A',
  },
  divider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginHorizontal: 16,
  },
  langPill: {
    backgroundColor: '#F0FDFA',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 12,
    marginRight: 6,
    borderWidth: 1,
    borderColor: '#CCFBF1',
  },
  langPillText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#0D9488',
  },
  memberStatusPill: {
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 9,
    paddingVertical: 3,
    borderRadius: 10,
    marginRight: 6,
    borderWidth: 1,
    borderColor: '#BBF7D0',
  },
  memberStatusPillText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#15803D',
  },
  explorePill: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 9,
    paddingVertical: 3,
    borderRadius: 10,
    marginRight: 6,
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  explorePillText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#B45309',
  },
  versionPill: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    marginRight: 6,
  },
  versionPillText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#64748B',
  },

  // LOG OUT BUTTON
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FEE2E2',
    paddingVertical: 15,
    borderRadius: 16,
    marginBottom: 16,
    minHeight: 52,
  },
  logoutBtnText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#EF4444',
  },

  // FOOTER
  footerWrap: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  footerText: {
    fontSize: 11.5,
    color: '#94A3B8',
    fontWeight: '500',
  },

  // MODAL SHARED STYLES
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.55)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  modalCard: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 8,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    marginBottom: 14,
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#0F172A',
  },
  modalCloseBtn: {
    padding: 6,
  },
  modalContentList: {
    gap: 10,
  },
  langOptionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 14,
    borderWidth: 1.5,
    backgroundColor: '#FFFFFF',
  },
  langOptionSelected: {
    backgroundColor: '#F0FDFA',
  },
  langOptionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  langBadge: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
  langBadgeText: {
    fontSize: 12,
    fontWeight: '800',
  },
  langNameText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
  },
  langNativeText: {
    fontSize: 12,
    color: '#64748B',
  },
  langRadioUnchecked: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 2,
    borderColor: '#CBD5E1',
  },

  // ADDRESS MODAL BODY
  addressModalBody: {
    gap: 14,
  },
  addressInputLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#475569',
  },
  addressTextInput: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
    color: '#0F172A',
    textAlignVertical: 'top',
    minHeight: 74,
  },
  mapPinpointBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 11,
    borderRadius: 12,
    backgroundColor: '#F0FDFA',
    borderWidth: 1,
    borderColor: '#CCFBF1',
  },
  mapPinpointBtnText: {
    fontSize: 13.5,
    fontWeight: '700',
    color: '#0D9488',
  },
  saveAddressBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#0D9488',
    paddingVertical: 13,
    borderRadius: 12,
  },
  saveAddressBtnText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#FFFFFF',
  },

  // ABOUT MODAL BODY
  aboutModalBody: {
    alignItems: 'center',
    paddingVertical: 6,
  },
  aboutBrandCircle: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: '#F0FDFA',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#CCFBF1',
  },
  aboutBrandTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 4,
  },
  aboutVersionText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
    marginBottom: 12,
    textAlign: 'center',
  },
  aboutTrustBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#F0FDFA',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
    marginBottom: 14,
  },
  aboutTrustText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#0D9488',
  },
  aboutDesc: {
    fontSize: 13,
    lineHeight: 19,
    color: '#475569',
    textAlign: 'center',
    marginBottom: 18,
  },
  aboutDoneBtn: {
    width: '100%',
    backgroundColor: '#0D9488',
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  aboutDoneBtnText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#FFFFFF',
  },
});

export default ProfileScreen;