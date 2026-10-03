import React, { useState, useEffect } from 'react';
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
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { showAlert } from '../../utils/alert';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import colors from '../../theme/colors';
import { useTheme } from '../../context/ThemeContext';
import { syncActiveUser } from '../../services/dataSyncService';
import WebFooter from '../../components/web/WebFooter';
import PatientPageBanner from '../../components/web/PatientPageBanner';

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

const ProfileScreenWeb = ({ navigation, route }) => {
  const { isDarkMode, language, LANGUAGES } = useTheme();
  const currentLang = LANGUAGES.find((l) => l.code === language) || LANGUAGES[0];
  const { width } = useWindowDimensions();
  const isDesktop = width >= 992;
  const isTablet = width >= 640 && width < 992;

  // User Profile State
  const [user, setUser] = useState({
    name: route?.params?.updatedUser?.name || 'Hemanth Gowda T N',
    email: route?.params?.updatedUser?.email || 'hemanthtn888@gmail.com',
    phone: route?.params?.updatedUser?.phone || '+91 9741422544',
    bloodGroup: 'B+ Positive',
    age: '23 Yrs',
    gender: 'Male',
    dob: '2003-07-02',
    address: '#42, 4th Cross, Green Glen Layout, Bellandur, Bengaluru - 560103',
    emergencyContact: '+91 8061452468 (Emergency)',
    uhid: 'MU-84920',
    photoUri: null,
  });

  // View / Edit Mode State
  const [isEditMode, setIsEditMode] = useState(Boolean(route?.params?.editMode));
  const [editForm, setEditForm] = useState({
    name: route?.params?.updatedUser?.name || 'Hemanth Gowda T N',
    email: route?.params?.updatedUser?.email || 'hemanthtn888@gmail.com',
    phone: route?.params?.updatedUser?.phone || '+91 9741422544',
    bloodGroup: 'B+ Positive',
    age: '23 Yrs',
    gender: 'Male',
    dob: '2003-07-02',
    address: '#42, 4th Cross, Green Glen Layout, Bellandur, Bengaluru - 560103',
    emergencyContact: '+91 8061452468 (Emergency)',
    photoUri: null,
  });
  const [formErrors, setFormErrors] = useState({});
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState('');

  const [walletBalance, setWalletBalance] = useState(1250);
  const [carePoints, setCarePoints] = useState(500);
  const [familyCount, setFamilyCount] = useState(1);
  const [membershipData, setMembershipData] = useState(null);

  // Self Health Monitoring & Family Profiles State
  const [familyMembers, setFamilyMembers] = useState([
    { id: 'self', name: 'Hemanth Gowda (Self)', relation: 'Self', age: '28 Yrs', gender: 'Male', bloodGroup: 'B+' },
    { id: 'spouse', name: 'Kavitha Gowda', relation: 'Spouse', age: '26 Yrs', gender: 'Female', bloodGroup: 'O+' },
  ]);
  const [latestVitals, setLatestVitals] = useState([
    { id: 'v-1', type: 'bp', title: 'Blood Pressure', value: '120/80', unit: 'mmHg', sub: 'Pulse: 72 bpm', status: 'Optimal', icon: 'heart-outline' },
    { id: 'v-2', type: 'sugar', title: 'Blood Sugar (Fasting)', value: '95', unit: 'mg/dL', sub: 'Fasting 8h', status: 'Normal', icon: 'water-outline' },
    { id: 'v-3', type: 'spo2', title: 'Blood Oxygen (SpO2)', value: '98', unit: '%', sub: 'Resting pulse', status: 'Healthy', icon: 'speedometer-outline' },
    { id: 'v-4', type: 'temp', title: 'Body Temperature', value: '98.4', unit: '°F', sub: 'Normal range', status: 'Optimal', icon: 'thermometer-outline' },
  ]);

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

      const activePatientStr = await AsyncStorage.getItem('@unnathi_active_patient');
      let activePatient = null;
      if (activePatientStr) {
        try { activePatient = JSON.parse(activePatientStr); } catch (e) {}
      }

      const activeEmail = (parsedUser?.email || activePatient?.email || storedEmail || '').toLowerCase().trim();
      const regUser = registeredUsers[activeEmail];

      let resolvedFullName = '';
      if (parsedUser?.name && !parsedUser.name.includes('@') && parsedUser.name.trim()) {
        resolvedFullName = parsedUser.name.trim();
      } else if (activePatient?.name && !activePatient.name.includes('@') && activePatient.name.trim()) {
        resolvedFullName = activePatient.name.trim();
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

      const resolvedProfile = {
        name: resolvedFullName || parsedUser?.name || activePatient?.name || storedName || 'Hemanth Gowda T N',
        email: parsedUser?.email || activePatient?.email || (storedEmail && storedEmail.trim() ? storedEmail.trim() : 'hemanthtn888@gmail.com'),
        phone: parsedUser?.phone || activePatient?.phone || (storedPhone && storedPhone.trim() ? storedPhone.trim() : '+91 9741422544'),
        bloodGroup: parsedUser?.bloodGroup || activePatient?.bloodGroup || regUser?.bloodGroup || 'B+ Positive',
        age: parsedUser?.age || activePatient?.age || regUser?.age || '23 Yrs',
        gender: parsedUser?.gender || activePatient?.gender || regUser?.gender || 'Male',
        emergencyContact: parsedUser?.emergencyContact || activePatient?.emergencyContact || regUser?.emergencyContact || '+91 8061452468 (Emergency)',
        dob: parsedUser?.dob || activePatient?.dob || regUser?.dob || '2003-07-02',
        address: parsedUser?.address || activePatient?.address || regUser?.address || '#42, 4th Cross, Green Glen Layout, Bellandur, Bengaluru - 560103',
        uhid: parsedUser?.uhid || activePatient?.uhid || 'MU-84920',
        photoUri: parsedUser?.photoUri || activePatient?.photoUri || null,
      };

      setUser((prev) => ({ ...prev, ...resolvedProfile }));
      setEditForm((prev) => ({ ...prev, ...resolvedProfile }));

      if (savedWallet) {
        setWalletBalance(parseInt(savedWallet, 10) || 1250);
      }

      try {
        const famStr = await AsyncStorage.getItem('@unnathi_family_members');
        if (famStr) {
          const parsedFam = JSON.parse(famStr);
          if (Array.isArray(parsedFam) && parsedFam.length > 0) {
            setFamilyMembers(parsedFam);
            setFamilyCount(parsedFam.length);
          }
        }
      } catch (e) {}

      try {
        const vitalsStr = await AsyncStorage.getItem('@unnathi_health_vitals');
        if (vitalsStr) {
          const parsedVitals = JSON.parse(vitalsStr);
          if (Array.isArray(parsedVitals) && parsedVitals.length > 0) {
            setLatestVitals(parsedVitals.slice(0, 4));
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
            const syncedProfile = {
              name: latest.name || resolvedProfile.name,
              email: latest.email || resolvedProfile.email,
              phone: latest.phone || resolvedProfile.phone,
              bloodGroup: latest.bloodGroup || resolvedProfile.bloodGroup,
              age: latest.age || resolvedProfile.age,
              gender: latest.gender || resolvedProfile.gender,
              emergencyContact: latest.emergencyContact || resolvedProfile.emergencyContact,
              dob: latest.dob || resolvedProfile.dob,
              address: latest.address || resolvedProfile.address,
              photoUri: latest.photoUri || resolvedProfile.photoUri,
            };
            setUser((prev) => ({ ...prev, ...syncedProfile }));
            setEditForm((prev) => ({ ...prev, ...syncedProfile }));
            if (latest.walletBalance !== undefined) {
              setWalletBalance(latest.walletBalance);
            }
            if (latest.familyMembers && Array.isArray(latest.familyMembers) && latest.familyMembers.length > 0) {
              setFamilyMembers(latest.familyMembers);
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
    setEditForm({
      name: user.name || 'Hemanth Gowda T N',
      email: user.email || 'hemanthtn888@gmail.com',
      phone: user.phone || '+91 9741422544',
      bloodGroup: user.bloodGroup || 'B+ Positive',
      age: user.age || '23 Yrs',
      gender: user.gender || 'Male',
      dob: user.dob || '2003-07-02',
      address: user.address || '#42, 4th Cross, Green Glen Layout, Bellandur, Bengaluru - 560103',
      emergencyContact: user.emergencyContact || '+91 8061452468 (Emergency)',
      photoUri: user.photoUri || null,
    });
    setFormErrors({});
    setIsEditMode(true);
  };

  const handleCancelEdit = () => {
    setFormErrors({});
    setIsEditMode(false);
  };

  const handleSaveProfile = async () => {
    const errors = {};
    if (!editForm.name || editForm.name.trim().length < 2) {
      errors.name = 'Please enter a valid full name (at least 2 characters)';
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!editForm.email || !emailRegex.test(editForm.email.trim())) {
      errors.email = 'Please enter a valid email address';
    }
    const phoneDigits = (editForm.phone || '').replace(/[^0-9]/g, '');
    if (phoneDigits.length < 10) {
      errors.phone = 'Please enter a valid 10-digit mobile number';
    }
    if (!editForm.emergencyContact || editForm.emergencyContact.trim().length < 5) {
      errors.emergencyContact = 'Please provide an emergency contact name & phone';
    }

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    setFormErrors({});
    setIsSaving(true);

    try {
      const updatedUserObj = {
        ...user,
        name: editForm.name.trim(),
        email: editForm.email.trim(),
        phone: editForm.phone.trim(),
        bloodGroup: editForm.bloodGroup,
        age: editForm.age.trim(),
        gender: editForm.gender,
        dob: editForm.dob.trim(),
        address: editForm.address.trim(),
        emergencyContact: editForm.emergencyContact.trim(),
        photoUri: editForm.photoUri,
      };

      setUser(updatedUserObj);

      await AsyncStorage.setItem('@unnathi_primary_user', JSON.stringify(updatedUserObj));
      await AsyncStorage.setItem('user', JSON.stringify(updatedUserObj));
      await AsyncStorage.setItem('userName', updatedUserObj.name);
      await AsyncStorage.setItem('userEmail', updatedUserObj.email);
      await AsyncStorage.setItem('userPhone', updatedUserObj.phone);
      await AsyncStorage.setItem('@unnathi_active_patient', JSON.stringify(updatedUserObj));

      try {
        await syncActiveUser();
      } catch (e) {}

      setIsSaving(false);
      setIsEditMode(false);
      setSaveSuccessMsg('Profile updated successfully!');
      setTimeout(() => setSaveSuccessMsg(''), 4000);
    } catch (err) {
      setIsSaving(false);
      showAlert('Error', 'Failed to save profile changes. Please try again.');
    }
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
          {/* Page Header Banner */}
          <PatientPageBanner
            title="My Health Profile & Account"
            subtitle="Manage your primary identity, linked family health records, digital emergency card, and login security credentials."
            badgeText="AUTHENTICATED PATIENT IDENTITY • NABH SECURE"
            badgeIcon="shield-checkmark"
            iconName="person"
            theme="navy"
            pills={[
              {
                label: 'Account Verified',
                bgColor: '#DCFCE7',
                borderColor: '#86EFAC',
                textColor: '#166534',
                icon: 'checkmark-circle',
              },
              {
                label: `Family Members: ${familyCount}`,
                bgColor: '#E0F2FE',
                borderColor: '#BAE6FD',
                textColor: '#0369A1',
                icon: 'people-outline',
              },
            ]}
            rightContent={
              <TouchableOpacity
                style={styles.primaryEditBtn}
                onPress={handleEditProfile}
                activeOpacity={0.88}
              >
                <Ionicons name="create-outline" size={15} color="#FFFFFF" style={{ marginRight: 6 }} />
                <Text style={styles.primaryEditBtnText}>Update Profile</Text>
              </TouchableOpacity>
            }
          />

          {/* ============================================================
              2. HERO IDENTITY & HEALTH WALLET DUAL BANNER (HOMESCREEN STYLE)
          ============================================================ */}
          <View style={[styles.heroDualRow, isDesktop ? styles.heroDualRowDesktop : null]}>
            {/* Left Card: Patient Digital Health Card */}
            <View style={[styles.patientIdentityCard, isDesktop ? { flex: 1.1 } : null]}>
              {saveSuccessMsg ? (
                <View style={styles.successAlertBanner}>
                  <Ionicons name="checkmark-circle" size={18} color="#059669" />
                  <Text style={styles.successAlertText}>{saveSuccessMsg}</Text>
                </View>
              ) : null}

              {!isEditMode ? (
                <>
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
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 2 }}>
                        <Ionicons name="call-outline" size={13} color="#64748B" />
                        <Text style={styles.userSubTextWeb}>{user.phone}</Text>
                      </View>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 2 }}>
                        <Ionicons name="mail-outline" size={13} color="#64748B" />
                        <Text style={styles.userSubTextWeb} numberOfLines={1}>{user.email}</Text>
                      </View>
                    </View>
                  </View>

                  {/* Patient Vitals & Demographics Chips */}
                  <View style={styles.vitalsPillRow}>
                    <View style={styles.vitalTag}>
                      <Ionicons name="water" size={13} color="#FF7F50" />
                      <Text style={styles.vitalTagText}>{user.bloodGroup || 'O+ Positive'}</Text>
                    </View>
                    <View style={styles.vitalTag}>
                      <Ionicons name="person" size={13} color="#1E3A8A" />
                      <Text style={styles.vitalTagText}>{user.age} • {user.gender}</Text>
                    </View>
                    <View style={styles.vitalTag}>
                      <Ionicons name="calendar-outline" size={13} color="#00C2CB" />
                      <Text style={styles.vitalTagText}>DOB: {user.dob || '14 May 1992'}</Text>
                    </View>
                    <View style={styles.vitalTag}>
                      <Ionicons name="call" size={13} color="#FF7F50" />
                      <Text style={styles.vitalTagText}>SOS: {user.emergencyContact || 'Active'}</Text>
                    </View>
                  </View>

                  {/* Address Summary */}
                  <View style={styles.profileAddressCard}>
                    <Ionicons name="location-outline" size={16} color="#00B894" />
                    <View style={{ flex: 1 }}>
                      <Text style={styles.profileAddressTitle}>Registered Patient Address</Text>
                      <Text style={styles.profileAddressText}>{user.address || '#42, 4th Cross, Green Glen Layout, Bellandur, Bengaluru - 560103'}</Text>
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
                </>
              ) : (
                /* ============================================================
                   INTERACTIVE PATIENT PROFILE EDIT MODE
                ============================================================ */
                <View style={styles.editModeContainer}>
                  <View style={styles.editModeHeaderRow}>
                    <View style={styles.editModeTitleBadge}>
                      <Ionicons name="pencil" size={14} color="#00B894" />
                      <Text style={styles.editModeTitleText}>EDIT PATIENT PROFILE</Text>
                    </View>
                    <TouchableOpacity onPress={handleCancelEdit} style={styles.editCancelIconBtn}>
                      <Ionicons name="close" size={18} color="#64748B" />
                    </TouchableOpacity>
                  </View>

                  {/* Profile Avatar Bar with Change Photo Action */}
                  <View style={styles.editAvatarRow}>
                    <View style={styles.avatarWrapWeb}>
                      <View style={[styles.avatarCircleWeb, { width: 56, height: 56 }]}>
                        <Text style={[styles.avatarTextWeb, { fontSize: 22 }]}>{userInitial}</Text>
                      </View>
                    </View>
                    <View style={{ flex: 1, marginLeft: 14 }}>
                      <Text style={styles.editAvatarTitle}>Profile Photo / Picture</Text>
                      <Text style={styles.editAvatarSub}>JPG, PNG up to 5MB. Visible to attending clinicians.</Text>
                      <TouchableOpacity
                        style={styles.changePhotoBtn}
                        onPress={() => showAlert('Upload Photo', 'Patient photo upload dialog is ready. Using profile avatar.')}
                      >
                        <Ionicons name="camera-outline" size={13} color="#00B894" />
                        <Text style={styles.changePhotoBtnText}>Update Photo</Text>
                      </TouchableOpacity>
                    </View>
                  </View>

                  {/* Form Fields */}
                  <View style={styles.editFormGrid}>
                    {/* Full Name */}
                    <View style={styles.formFieldGroup}>
                      <Text style={styles.formLabel}>Full Name *</Text>
                      <TextInput
                        style={[styles.formInput, formErrors.name && styles.formInputError]}
                        value={editForm.name}
                        onChangeText={(txt) => {
                          setEditForm((prev) => ({ ...prev, name: txt }));
                          if (formErrors.name) setFormErrors((prev) => ({ ...prev, name: null }));
                        }}
                        placeholder="e.g. Ramesh Kumar"
                        placeholderTextColor="#94A3B8"
                      />
                      {formErrors.name ? <Text style={styles.errorSubText}>{formErrors.name}</Text> : null}
                    </View>

                    {/* Email */}
                    <View style={styles.formFieldGroup}>
                      <Text style={styles.formLabel}>Email Address *</Text>
                      <TextInput
                        style={[styles.formInput, formErrors.email && styles.formInputError]}
                        value={editForm.email}
                        onChangeText={(txt) => {
                          setEditForm((prev) => ({ ...prev, email: txt }));
                          if (formErrors.email) setFormErrors((prev) => ({ ...prev, email: null }));
                        }}
                        placeholder="patient@example.com"
                        placeholderTextColor="#94A3B8"
                        keyboardType="email-address"
                        autoCapitalize="none"
                      />
                      {formErrors.email ? <Text style={styles.errorSubText}>{formErrors.email}</Text> : null}
                    </View>

                    {/* Phone Number */}
                    <View style={styles.formFieldGroup}>
                      <Text style={styles.formLabel}>Mobile Number *</Text>
                      <TextInput
                        style={[styles.formInput, formErrors.phone && styles.formInputError]}
                        value={editForm.phone}
                        onChangeText={(txt) => {
                          setEditForm((prev) => ({ ...prev, phone: txt }));
                          if (formErrors.phone) setFormErrors((prev) => ({ ...prev, phone: null }));
                        }}
                        placeholder="+91 98450 12345"
                        placeholderTextColor="#94A3B8"
                        keyboardType="phone-pad"
                      />
                      {formErrors.phone ? <Text style={styles.errorSubText}>{formErrors.phone}</Text> : null}
                    </View>

                    {/* Date of Birth & Age */}
                    <View style={styles.formFieldRow}>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.formLabel}>Date of Birth</Text>
                        <TextInput
                          style={styles.formInput}
                          value={editForm.dob}
                          onChangeText={(txt) => setEditForm((prev) => ({ ...prev, dob: txt }))}
                          placeholder="YYYY-MM-DD"
                          placeholderTextColor="#94A3B8"
                        />
                      </View>
                      <View style={{ width: 100 }}>
                        <Text style={styles.formLabel}>Age</Text>
                        <TextInput
                          style={styles.formInput}
                          value={editForm.age}
                          onChangeText={(txt) => setEditForm((prev) => ({ ...prev, age: txt }))}
                          placeholder="32 Yrs"
                          placeholderTextColor="#94A3B8"
                        />
                      </View>
                    </View>

                    {/* Gender Selector */}
                    <View style={styles.formFieldGroup}>
                      <Text style={styles.formLabel}>Gender</Text>
                      <View style={styles.chipsRow}>
                        {GENDERS.map((g) => (
                          <TouchableOpacity
                            key={g}
                            style={[styles.genderChip, editForm.gender === g && styles.genderChipActive]}
                            onPress={() => setEditForm((prev) => ({ ...prev, gender: g }))}
                          >
                            <Text style={[styles.genderChipText, editForm.gender === g && styles.genderChipTextActive]}>{g}</Text>
                          </TouchableOpacity>
                        ))}
                      </View>
                    </View>

                    {/* Blood Group Selector */}
                    <View style={styles.formFieldGroup}>
                      <Text style={styles.formLabel}>Blood Group</Text>
                      <View style={styles.chipsRow}>
                        {BLOOD_GROUPS.map((bg) => (
                          <TouchableOpacity
                            key={bg}
                            style={[styles.bloodChip, editForm.bloodGroup === bg && styles.bloodChipActive]}
                            onPress={() => setEditForm((prev) => ({ ...prev, bloodGroup: bg }))}
                          >
                            <Text style={[styles.bloodChipText, editForm.bloodGroup === bg && styles.bloodChipTextActive]}>{bg}</Text>
                          </TouchableOpacity>
                        ))}
                      </View>
                    </View>

                    {/* Address */}
                    <View style={styles.formFieldGroup}>
                      <Text style={styles.formLabel}>Residential Delivery Address</Text>
                      <TextInput
                        style={[styles.formInput, { minHeight: 60, textAlignVertical: 'top' }]}
                        value={editForm.address}
                        onChangeText={(txt) => setEditForm((prev) => ({ ...prev, address: txt }))}
                        placeholder="House no, street, locality, pincode"
                        placeholderTextColor="#94A3B8"
                        multiline
                      />
                    </View>

                    {/* Emergency Contact */}
                    <View style={styles.formFieldGroup}>
                      <Text style={styles.formLabel}>Emergency SOS Contact *</Text>
                      <TextInput
                        style={[styles.formInput, formErrors.emergencyContact && styles.formInputError]}
                        value={editForm.emergencyContact}
                        onChangeText={(txt) => {
                          setEditForm((prev) => ({ ...prev, emergencyContact: txt }));
                          if (formErrors.emergencyContact) setFormErrors((prev) => ({ ...prev, emergencyContact: null }));
                        }}
                        placeholder="e.g. +91 98450 11223 (Family)"
                        placeholderTextColor="#94A3B8"
                      />
                      {formErrors.emergencyContact ? <Text style={styles.errorSubText}>{formErrors.emergencyContact}</Text> : null}
                    </View>
                  </View>

                  {/* Edit Form Actions */}
                  <View style={styles.editFormActionsRow}>
                    <TouchableOpacity
                      style={styles.cancelEditBtn}
                      onPress={handleCancelEdit}
                      disabled={isSaving}
                    >
                      <Text style={styles.cancelEditBtnText}>Cancel</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.saveEditBtn}
                      onPress={handleSaveProfile}
                      disabled={isSaving}
                    >
                      {isSaving ? (
                        <ActivityIndicator size="small" color="#FFFFFF" />
                      ) : (
                        <>
                          <Ionicons name="save-outline" size={15} color="#FFFFFF" />
                          <Text style={styles.saveEditBtnText}>Save Profile Changes</Text>
                        </>
                      )}
                    </TouchableOpacity>
                  </View>
                </View>
              )}
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
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 }}>
                    <Ionicons name="ribbon-outline" size={14} color="#00B894" />
                    <Text style={styles.carePointsValue}>{carePoints} Pts</Text>
                  </View>
                </View>
              </View>

              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginVertical: 8 }}>
                <Ionicons name="flash-outline" size={14} color="#00B894" />
                <Text style={styles.walletBenefitNote}>
                  Save 5% cashback on medicine orders, full body health packages & clinic consultation fees.
                </Text>
              </View>

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
              3. SELF HEALTH MONITORING & DAILY VITALS
          ============================================================ */}
          <View style={styles.sectionHeaderWeb}>
            <View style={styles.sectionHeaderLeft}>
              <View style={styles.sectionBadgePill}>
                <Ionicons name="pulse" size={13} color="#00B894" />
                <Text style={styles.sectionBadgeText}>SELF HEALTH MONITORING</Text>
              </View>
              <Text style={styles.sectionHeadingTitle}>Daily Health Vitals & Telemetry</Text>
              <Text style={styles.sectionSubHeading}>
                Monitor your essential clinical metrics, blood pressure, fasting sugar, and blood oxygen levels.
              </Text>
            </View>
            <TouchableOpacity
              style={styles.sectionCtaBtn}
              onPress={() => navigation?.navigate('HealthMonitor')}
              activeOpacity={0.85}
            >
              <Ionicons name="analytics-outline" size={16} color="#00B894" />
              <Text style={styles.sectionCtaBtnText}>Open Health Monitor</Text>
              <Ionicons name="arrow-forward" size={14} color="#00B894" />
            </TouchableOpacity>
          </View>

          {/* Vitals 4-Card Responsive Grid */}
          <View style={styles.vitalsGridWeb}>
            {latestVitals.map((vital) => (
              <TouchableOpacity
                key={vital.id}
                style={styles.vitalCardWeb}
                onPress={() => navigation?.navigate('HealthMonitor')}
                activeOpacity={0.88}
              >
                <View style={styles.vitalCardHeader}>
                  <View style={styles.vitalIconWrap}>
                    <Ionicons name={vital.icon || 'pulse-outline'} size={20} color="#00B894" />
                  </View>
                  <View style={styles.vitalStatusBadge}>
                    <View style={styles.vitalStatusDot} />
                    <Text style={styles.vitalStatusText}>{vital.status || 'Normal'}</Text>
                  </View>
                </View>
                <Text style={styles.vitalCardTitle}>{vital.title}</Text>
                <View style={styles.vitalValueRow}>
                  <Text style={styles.vitalValueNumber}>{vital.value}</Text>
                  <Text style={styles.vitalValueUnit}>{vital.unit}</Text>
                </View>
                <Text style={styles.vitalCardSub}>{vital.sub || 'Clinical Range'}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* ============================================================
              4. FAMILY MEMBERS & DEPENDENTS (LINKED PROFILES)
          ============================================================ */}
          <View style={[styles.sectionHeaderWeb, { marginTop: 28 }]}>
            <View style={styles.sectionHeaderLeft}>
              <View style={styles.sectionBadgePill}>
                <Ionicons name="people" size={13} color="#00B894" />
                <Text style={styles.sectionBadgeText}>LINKED FAMILY PROFILES</Text>
              </View>
              <Text style={styles.sectionHeadingTitle}>Family Members & Dependents</Text>
              <Text style={styles.sectionSubHeading}>
                Book clinic visits, video consultations, and diagnostic tests for parents, spouse, or children under secure profiles.
              </Text>
            </View>
            <TouchableOpacity
              style={styles.sectionPrimaryBtn}
              onPress={() => navigation?.navigate('FamilyProfiles')}
              activeOpacity={0.85}
            >
              <Ionicons name="person-add-outline" size={15} color="#FFFFFF" />
              <Text style={styles.sectionPrimaryBtnText}>+ Add Family Member</Text>
            </TouchableOpacity>
          </View>

          {/* Family Members Grid */}
          <View style={styles.familyGridWeb}>
            {familyMembers.map((member, idx) => (
              <TouchableOpacity
                key={member.id || idx}
                style={styles.familyMemberCardWeb}
                onPress={() => navigation?.navigate('FamilyProfiles')}
                activeOpacity={0.88}
              >
                <View style={styles.familyAvatarWrap}>
                  <Text style={styles.familyAvatarText}>
                    {(member.name || 'M').charAt(0).toUpperCase()}
                  </Text>
                </View>
                <View style={styles.familyInfoCol}>
                  <View style={styles.familyNameRow}>
                    <Text style={styles.familyMemberName} numberOfLines={1}>{member.name}</Text>
                    <View style={styles.familyRelationPill}>
                      <Text style={styles.familyRelationText}>{member.relation || 'Member'}</Text>
                    </View>
                  </View>
                  <View style={styles.familyTagsRow}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                      <Ionicons name="calendar-outline" size={12} color="#64748B" />
                      <Text style={styles.familyDetailTagText}>{member.age || 'Adult'}</Text>
                    </View>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                      <Ionicons name="person-outline" size={12} color="#64748B" />
                      <Text style={styles.familyDetailTagText}>{member.gender || 'Not specified'}</Text>
                    </View>
                    {member.bloodGroup ? (
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                        <Ionicons name="water" size={12} color="#00B894" />
                        <Text style={[styles.familyDetailTagText, { color: '#00B894', fontWeight: '700' }]}>
                          {member.bloodGroup}
                        </Text>
                      </View>
                    ) : null}
                  </View>
                </View>
                <Ionicons name="chevron-forward" size={18} color="#94A3B8" />
              </TouchableOpacity>
            ))}

            {/* Quick Add Member Shortcut Card */}
            <TouchableOpacity
              style={styles.addMemberCardWeb}
              onPress={() => navigation?.navigate('FamilyProfiles')}
              activeOpacity={0.85}
            >
              <View style={styles.addMemberIconCircle}>
                <Ionicons name="add" size={24} color="#00B894" />
              </View>
              <Text style={styles.addMemberTitle}>Add Another Member</Text>
              <Text style={styles.addMemberSub}>Parent, Child or Spouse profile</Text>
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
              6. WEB SIGN OUT ACTION (SINGLE BUTTON MATCHING DESIGN)
          ============================================================ */}
          <View style={styles.webLogoutSection}>
            <TouchableOpacity
              style={styles.webLogoutBtn}
              onPress={handleLogout}
              activeOpacity={0.88}
            >
              <Ionicons name="log-out-outline" size={19} color="#FF7F50" />
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
    backgroundColor: '#E8F1F8',
    backgroundImage: 'linear-gradient(180deg, #E6F0F7 0%, #EBF4FA 35%, #F0F6FA 100%)',
  },
  scrollContent: {
    flexGrow: 1,
    backgroundColor: 'transparent',
  },

  // 1. BREADCRUMB BAR
  breadcrumbBarWrap: {
    backgroundColor: 'transparent',
    borderBottomWidth: 0,
    paddingTop: 16,
    paddingBottom: 4,
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
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#DCE7EC',
  },
  securityBadgeWebText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#00B894',
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
    color: '#1E3A8A',
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
    borderColor: '#DCE7EC',
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
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#DCE7EC',
  },
  brandPillWebText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#00B894',
    letterSpacing: 0.4,
  },
  uhidBadgePill: {
    backgroundColor: '#F1F8FB',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#DCE7EC',
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
    borderColor: '#ECFDF5',
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
    backgroundColor: '#7BC96F',
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
    borderColor: '#DCE7EC',
    marginBottom: 14,
  },
  vitalTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#F1F8FB',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#DCE7EC',
  },
  vitalTagText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#1E3A8A',
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
    backgroundColor: '#F1F8FB',
    borderWidth: 1,
    borderColor: '#DCE7EC',
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

  // SUCCESS ALERT & ADDRESS CARD
  successAlertBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#ECFDF5',
    borderWidth: 1,
    borderColor: '#A7F3D0',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 8,
    marginBottom: 14,
  },
  successAlertText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#065F46',
  },
  profileAddressCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 10,
    padding: 12,
    marginBottom: 14,
  },
  profileAddressTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748B',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  profileAddressText: {
    fontSize: 12.5,
    color: '#1E293B',
    fontWeight: '500',
    marginTop: 2,
    lineHeight: 18,
  },

  // EDIT MODE STYLES
  editModeContainer: {
    width: '100%',
  },
  editModeHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderColor: '#E2E8F0',
  },
  editModeTitleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  editModeTitleText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#00B894',
    letterSpacing: 0.5,
  },
  editCancelIconBtn: {
    padding: 4,
  },
  editAvatarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    backgroundColor: '#F8FAFC',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  editAvatarTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1E293B',
  },
  editAvatarSub: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
  },
  changePhotoBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#E6FAF5',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    alignSelf: 'flex-start',
    marginTop: 6,
  },
  changePhotoBtnText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#00B894',
  },
  editFormGrid: {
    gap: 12,
  },
  formFieldGroup: {
    marginBottom: 2,
  },
  formFieldRow: {
    flexDirection: 'row',
    gap: 12,
  },
  formLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#475569',
    marginBottom: 4,
  },
  formInput: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 13,
    color: '#0F172A',
  },
  formInputError: {
    borderColor: '#EF4444',
    backgroundColor: '#FEF2F2',
  },
  errorSubText: {
    fontSize: 11,
    color: '#EF4444',
    marginTop: 3,
    fontWeight: '600',
  },
  chipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 4,
  },
  genderChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  genderChipActive: {
    backgroundColor: '#00B894',
    borderColor: '#00B894',
  },
  genderChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#475569',
  },
  genderChipTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  bloodChip: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  bloodChipActive: {
    backgroundColor: '#DC2626',
    borderColor: '#DC2626',
  },
  bloodChipText: {
    fontSize: 11.5,
    fontWeight: '600',
    color: '#475569',
  },
  bloodChipTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  editFormActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderColor: '#E2E8F0',
  },
  cancelEditBtn: {
    flex: 0.8,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    cursor: 'pointer',
  },
  cancelEditBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#64748B',
  },
  saveEditBtn: {
    flex: 1.2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#00B894',
    paddingVertical: 10,
    borderRadius: 8,
    cursor: 'pointer',
  },
  saveEditBtnText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#FFFFFF',
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
    color: '#FF7F50',
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

  // 3 & 4. SELF HEALTH MONITORING & FAMILY PROFILES (CLEAN, USER-FRIENDLY SHOWCASE)
  sectionHeaderWeb: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: 12,
    marginTop: 24,
    marginBottom: 14,
  },
  sectionHeaderLeft: {
    flex: 1,
    minWidth: 280,
  },
  sectionBadgePill: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 6,
    backgroundColor: '#D1FAE5',
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#A7F3D0',
    marginBottom: 6,
  },
  sectionBadgeText: {
    fontSize: 10.5,
    fontWeight: '800',
    color: '#00B894',
    letterSpacing: 0.5,
  },
  sectionHeadingTitle: {
    fontSize: 21,
    fontWeight: '900',
    color: '#0C3B6B',
    letterSpacing: -0.4,
  },
  sectionSubHeading: {
    fontSize: 13,
    color: '#64748B',
    marginTop: 3,
    maxWidth: 680,
    lineHeight: 18,
  },
  sectionCtaBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#A7F3D0',
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 10,
    cursor: 'pointer',
    boxShadow: '0 2px 6px rgba(0, 184, 148, 0.08)',
  },
  sectionCtaBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#00B894',
  },
  sectionPrimaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#00B894',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
    cursor: 'pointer',
    boxShadow: '0 4px 12px rgba(0, 184, 148, 0.25)',
  },
  sectionPrimaryBtnText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#FFFFFF',
  },

  // VITALS GRID
  vitalsGridWeb: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
    marginBottom: 10,
  },
  vitalCardWeb: {
    flex: 1,
    minWidth: 230,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 18,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    boxShadow: '0 2px 8px rgba(12, 59, 107, 0.04)',
    cursor: 'pointer',
  },
  vitalCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  vitalIconWrap: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: '#E6F8F4',
    borderWidth: 1,
    borderColor: '#A7F3D0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  vitalStatusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#D1FAE5',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  vitalStatusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#00B894',
  },
  vitalStatusText: {
    fontSize: 10.5,
    fontWeight: '800',
    color: '#00B894',
  },
  vitalCardTitle: {
    fontSize: 13.5,
    fontWeight: '700',
    color: '#475569',
    marginBottom: 6,
  },
  vitalValueRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 5,
    marginBottom: 4,
  },
  vitalValueNumber: {
    fontSize: 24,
    fontWeight: '900',
    color: '#0C3B6B',
  },
  vitalValueUnit: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
  },
  vitalCardSub: {
    fontSize: 11.5,
    color: '#94A3B8',
  },

  // FAMILY MEMBERS GRID
  familyGridWeb: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
    marginBottom: 24,
  },
  familyMemberCardWeb: {
    flex: 1,
    minWidth: 310,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    boxShadow: '0 2px 8px rgba(12, 59, 107, 0.04)',
    cursor: 'pointer',
  },
  familyAvatarWrap: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: '#E6F8F4',
    borderWidth: 1.5,
    borderColor: '#A7F3D0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  familyAvatarText: {
    fontSize: 17,
    fontWeight: '900',
    color: '#00B894',
  },
  familyInfoCol: {
    flex: 1,
  },
  familyNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  familyMemberName: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0C3B6B',
  },
  familyRelationPill: {
    backgroundColor: '#D1FAE5',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 4,
  },
  familyRelationText: {
    fontSize: 10.5,
    fontWeight: '800',
    color: '#00B894',
  },
  familyTagsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flexWrap: 'wrap',
  },
  familyDetailTag: {
    fontSize: 12,
    color: '#64748B',
  },
  familyDetailTagText: {
    fontSize: 12,
    color: '#64748B',
  },
  addMemberCardWeb: {
    minWidth: 240,
    backgroundColor: '#F8FCFA',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1.5,
    borderColor: '#A7F3D0',
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
  },
  addMemberIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#E6F8F4',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  addMemberTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#00B894',
  },
  addMemberSub: {
    fontSize: 11,
    color: '#64748B',
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

  // WEB SIGN OUT ACTION (SINGLE BUTTON MATCHING DESIGN)
  webLogoutSection: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    marginBottom: 26,
  },
  webLogoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#FFD7C7',
    borderRadius: 12,
    paddingVertical: 13,
    paddingHorizontal: 36,
    minWidth: 260,
    shadowColor: '#FF7F50',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 2,
    cursor: 'pointer',
  },
  webLogoutBtnText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#FF7F50',
    letterSpacing: 0.2,
  },
});

export default ProfileScreenWeb;
