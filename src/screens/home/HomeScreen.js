import React, { useEffect, useState, useMemo, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  Modal,
  ActivityIndicator,
  Platform,
  Linking,
  Image,
  StatusBar,
  Animated,
  PanResponder,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import AsyncStorage from '@react-native-async-storage/async-storage';

import colors from '../../theme/colors';
import { useCart } from '../../context/CartContext';
import doctors from '../../data/doctors';
import { radiologyLabs } from '../../data/radiologyLabsData';
import { labPackages, consultationServices, moreServices } from '../../data/homeData';

const POPULAR_MYSORE_AREAS = [
  'Kuvempunagar, Mysore',
  'Jayalakshmipuram, Mysore',
  'Saraswathipuram, Mysore',
  'Vijayanagar, Mysore',
  'Gokulam, Mysore',
  'V.V. Mohalla, Mysore',
  'Bannimantap, Mysore',
  'Nazarbad, Mysore',
  'Hebbal, Mysore',
  'Mysore Central',
  'Indiranagar, Bangalore',
  'Koramangala, Bangalore',
];

const CITY_AREAS_MAP = {
  Mysore: [
    { area: 'Kuvempunagar', cross: '3rd Cross, Vishwamanava Double Road', district: 'Mysuru District', pincode: '570023' },
    { area: 'Jayalakshmipuram', cross: 'Kalidasa Road, Premier Studio', district: 'Mysuru District', pincode: '570012' },
    { area: 'Saraswathipuram', cross: '7th Main Road, Near Swimming Pool', district: 'Mysuru District', pincode: '570009' },
    { area: 'Vijayanagar 2nd Stage', cross: 'High Tension Double Road', district: 'Mysuru District', pincode: '570017' },
    { area: 'Gokulam 3rd Stage', cross: 'Contour Road, Doctor Corner', district: 'Mysuru District', pincode: '570002' },
    { area: 'V.V. Mohalla', cross: 'Temple Road, Post Office Cross', district: 'Mysuru District', pincode: '570002' },
    { area: 'Bannimantap', cross: 'Highway Circle, Near St. Joseph', district: 'Mysuru District', pincode: '570015' },
    { area: 'Hebbal Industrial Area', cross: 'Ring Road Cross, Infosys Gate', district: 'Mysuru District', pincode: '570016' },
  ],
  Bangalore: [
    { area: 'Indiranagar', cross: '100 Feet Road, 12th Main Cross', district: 'Bengaluru Urban', pincode: '560038' },
    { area: 'Koramangala', cross: '5th Block, 80 Feet Road Cross', district: 'Bengaluru Urban', pincode: '560095' },
    { area: 'Jayanagar', cross: '4th Block, 11th Main Road', district: 'Bengaluru Urban', pincode: '560011' },
    { area: 'Whitefield', cross: 'ITPB Main Road, Hope Farm', district: 'Bengaluru Urban', pincode: '560066' },
    { area: 'HSR Layout', cross: 'Sector 2, 27th Main Cross', district: 'Bengaluru Urban', pincode: '560102' },
  ],
  Mangalore: [
    { area: 'Kodialbail', cross: 'MG Road, Near Lalbagh', district: 'Dakshina Kannada', pincode: '575003' },
    { area: 'Kadri', cross: 'Kadri Temple Road', district: 'Dakshina Kannada', pincode: '575002' },
    { area: 'Bejai', cross: 'KSRTC Bus Stand Road', district: 'Dakshina Kannada', pincode: '575004' },
  ],
  Mandya: [
    { area: 'Mandya City', cross: 'VV Road, Sugar Town Cross', district: 'Mandya District', pincode: '571401' },
    { area: 'Maddur', cross: 'Old Bus Stand Road', district: 'Mandya District', pincode: '571428' },
  ],
  Hassan: [
    { area: 'Hassan Central', cross: 'BM Road, Near Shankara Math', district: 'Hassan District', pincode: '573201' },
    { area: 'Vidyanagar', cross: 'Ring Road Cross', district: 'Hassan District', pincode: '573202' },
  ],
};

const HomeScreen = ({ navigation }) => {
  const { totalCartCount } = useCart();

  // State
  const [search, setSearch] = useState('');
  const [userName, setUserName] = useState('Ramesh');
  const [locationName, setLocationName] = useState('Kuvempunagar, Mysore');
  const [locationModalVisible, setLocationModalVisible] = useState(false);
  const [loadingLocation, setLoadingLocation] = useState(false);
  const [locationSearchQuery, setLocationSearchQuery] = useState('');
  const [locationToast, setLocationToast] = useState(null);

  // Detailed Custom Location States
  const [locationModalTab, setLocationModalTab] = useState('SEARCH'); // SEARCH vs CUSTOM
  const [selectedCityTab, setSelectedCityTab] = useState('Mysore');
  const [customBuildingCross, setCustomBuildingCross] = useState('No. 45, 3rd Cross, 2nd Main Road');
  const [customArea, setCustomArea] = useState('Kuvempunagar');
  const [customCity, setCustomCity] = useState('Mysore');
  const [customDistrict, setCustomDistrict] = useState('Mysuru District');
  const [customPincode, setCustomPincode] = useState('570023');
  const [customTag, setCustomTag] = useState('Home');

  // Patient Switcher
  const [familyMembers, setFamilyMembers] = useState([
    { id: 'self', name: 'Self', relation: 'Self', isPrimary: true, icon: 'person' },
    { id: 'fam-1', name: 'Sneha', relation: 'Spouse', isPrimary: false, icon: 'woman' },
    { id: 'fam-2', name: 'Suresh Kumar', relation: 'Father', isPrimary: false, icon: 'man' },
    { id: 'fam-3', name: 'Aarav', relation: 'Son', isPrimary: false, icon: 'happy' },
  ]);
  const [activePatient, setActivePatient] = useState({ id: 'self', name: 'Self', relation: 'Self' });

  // Wallet State
  const [walletBalance, setWalletBalance] = useState(1250);
  const [carePoints, setCarePoints] = useState(500);
  const [walletModalVisible, setWalletModalVisible] = useState(false);
  const [quickTopUpAmount, setQuickTopUpAmount] = useState('500');
  const [emergencyModalVisible, setEmergencyModalVisible] = useState(false);

  // Draggable Floating AI Chatbot
  const pan = useRef(new Animated.ValueXY({ x: 0, y: 0 })).current;

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: (_, gestureState) => {
          return Math.abs(gestureState.dx) > 3 || Math.abs(gestureState.dy) > 3;
        },
        onPanResponderGrant: () => {
          pan.setOffset({
            x: pan.x._value,
            y: pan.y._value,
          });
          pan.setValue({ x: 0, y: 0 });
        },
        onPanResponderMove: Animated.event(
          [null, { dx: pan.x, dy: pan.y }],
          { useNativeDriver: false }
        ),
        onPanResponderRelease: (_, gestureState) => {
          pan.flattenOffset();
          // If tap without significant drag, open Chatbot
          if (Math.abs(gestureState.dx) < 6 && Math.abs(gestureState.dy) < 6) {
            navigation.navigate('Chatbot');
          }
        },
      }),
    [navigation, pan]
  );

  // Load User Info
  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    try {
      const storedName = await AsyncStorage.getItem('userName');
      if (storedName && storedName.trim()) {
        setUserName(storedName.trim());
      }
      const savedLoc = await AsyncStorage.getItem('@unnathi_user_location');
      if (savedLoc && savedLoc.trim()) {
        setLocationName(savedLoc.trim());
      }
      const savedWallet = await AsyncStorage.getItem('@unnathi_wallet_balance');
      if (savedWallet) {
        setWalletBalance(parseInt(savedWallet, 10) || 1250);
      }
      const savedActive = await AsyncStorage.getItem('@unnathi_active_patient');
      if (savedActive) {
        setActivePatient(JSON.parse(savedActive));
      }
    } catch (e) {
      console.log('Error loading home user data:', e);
    }
  };

  const showToast = (msg) => {
    setLocationToast(msg);
    setTimeout(() => {
      setLocationToast(null);
    }, 2500);
  };

  const handleSelectPatient = async (patient) => {
    setActivePatient(patient);
    await AsyncStorage.setItem('@unnathi_active_patient', JSON.stringify(patient));
    showToast(`Active profile set to: ${patient.name} (${patient.relation})`);
  };

  const handleQuickAddMoney = async (amt) => {
    const num = parseInt(amt, 10);
    if (isNaN(num) || num <= 0) return;
    const newBal = walletBalance + num;
    setWalletBalance(newBal);
    await AsyncStorage.setItem('@unnathi_wallet_balance', newBal.toString());
    setWalletModalVisible(false);
    showToast(`₹${num.toLocaleString('en-IN')} added to Wallet!`);
  };

  // GPS Location Fetch
  const handleDetectGPSLocation = async () => {
    try {
      setLoadingLocation(true);
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Please grant location permission to detect your area.');
        setLoadingLocation(false);
        return;
      }
      const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      const [geocode] = await Location.reverseGeocodeAsync({
        latitude: loc.coords.latitude,
        longitude: loc.coords.longitude,
      });

      if (geocode) {
        const area = geocode.subregion || geocode.district || geocode.name || 'Kuvempunagar';
        const city = geocode.city || 'Mysore';
        const fullLoc = `${area}, ${city}`;
        setLocationName(fullLoc);
        await AsyncStorage.setItem('@unnathi_user_location', fullLoc);
        setLocationModalVisible(false);
        showToast(`Location set to: ${fullLoc}`);
      }
      setLoadingLocation(false);
    } catch (e) {
      setLoadingLocation(false);
      Alert.alert('Location Error', 'Could not detect GPS location. Please select manually.');
    }
  };

  // Save Custom Detailed Address
  const handleSaveCustomAddress = async () => {
    if (!customCity.trim() || !customArea.trim()) {
      Alert.alert('Incomplete Address', 'Please provide at least City and Area name.');
      return;
    }

    const shortLoc = `${customArea}, ${customCity}`;
    const fullFormatted = `${customBuildingCross ? `${customBuildingCross}, ` : ''}${customArea}, ${customCity}${customDistrict ? ` (${customDistrict})` : ''}${customPincode ? ` - ${customPincode}` : ''}`;
    
    setLocationName(shortLoc);
    await AsyncStorage.setItem('@unnathi_user_location', shortLoc);

    // Also update delivery address for cart orders
    const addressObj = {
      name: userName,
      addressLine: `${customBuildingCross ? `${customBuildingCross}, ` : ''}${customArea}`,
      city: customCity,
      state: 'Karnataka',
      district: customDistrict,
      pincode: customPincode,
      tag: customTag,
    };
    await AsyncStorage.setItem('@unnathi_delivery_address', JSON.stringify(addressObj));

    setLocationModalVisible(false);
    showToast(`Location set to: ${shortLoc}`);
  };

  // Filtered areas for location modal search
  const currentCityAreas = useMemo(() => {
    const areas = CITY_AREAS_MAP[selectedCityTab] || CITY_AREAS_MAP.Mysore;
    if (!locationSearchQuery.trim()) return areas;
    return areas.filter(
      (a) =>
        a.area.toLowerCase().includes(locationSearchQuery.toLowerCase()) ||
        a.cross.toLowerCase().includes(locationSearchQuery.toLowerCase()) ||
        a.district.toLowerCase().includes(locationSearchQuery.toLowerCase()) ||
        a.pincode.includes(locationSearchQuery)
    );
  }, [selectedCityTab, locationSearchQuery]);

  // Handle Search Execution
  const handleSearchSubmit = (customQuery) => {
    const q = typeof customQuery === 'string' ? customQuery : search;
    navigation.navigate('GlobalSearch', { query: q ? q.trim() : '' });
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* ==========================================
          TOP APP BAR (PROFILE NAME, WALLET, NOTIFS, CART)
      ========================================== */}
      <View style={styles.topBar}>
        {/* PROFILE ICON & USER NAME (LEFT) */}
        <TouchableOpacity
          style={styles.profileHeaderBtn}
          onPress={() => navigation.navigate('Profile')}
          activeOpacity={0.85}
        >
          <View style={styles.profileAvatarWrap}>
            <Image
              source={{
                uri: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200',
              }}
              style={styles.profileAvatarImg}
            />
            <View style={styles.profileOnlineDot} />
          </View>
          <View style={styles.profileTextWrap}>
            <Text style={styles.profileHelloText} numberOfLines={1}>
              Hello, {userName} 👋
            </Text>
            <Text style={styles.profileRoleText}>Patient Profile ›</Text>
          </View>
        </TouchableOpacity>

        {/* RIGHT ACTIONS: WALLET, NOTIFS & CART */}
        <View style={styles.topBarRight}>
          {/* WALLET BUTTON */}
          <TouchableOpacity
            style={styles.walletPill}
            onPress={() => setWalletModalVisible(true)}
            activeOpacity={0.85}
          >
            <Ionicons name="wallet-outline" size={15} color={colors.primary} />
            <Text style={styles.walletPillText}>₹{walletBalance.toLocaleString('en-IN')}</Text>
          </TouchableOpacity>

          {/* NOTIFICATIONS BUTTON */}
          <TouchableOpacity
            style={styles.iconCircle}
            onPress={() => navigation.navigate('Notifications')}
            activeOpacity={0.85}
          >
            <Ionicons name="notifications-outline" size={20} color="#1E293B" />
            <View style={styles.notifBadgeDot} />
          </TouchableOpacity>

          {/* CART BUTTON */}
          <TouchableOpacity
            style={styles.iconCircle}
            onPress={() => navigation.navigate('Cart')}
            activeOpacity={0.85}
          >
            <Ionicons name="cart-outline" size={20} color="#1E293B" />
            {totalCartCount > 0 && (
              <View style={styles.cartBadge}>
                <Text style={styles.cartBadgeText}>{totalCartCount}</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
      </View>

      {/* ==========================================
          LOCATION SELECTOR BAR (BELOW PROFILE HEADER)
      ========================================== */}
      <View style={styles.locationStripWrap}>
        <TouchableOpacity
          style={styles.locationPillFull}
          onPress={() => setLocationModalVisible(true)}
          activeOpacity={0.85}
        >
          <View style={styles.locationIconWrap}>
            <Ionicons name="location" size={16} color={colors.primary} />
          </View>
          <View style={styles.locationTextWrap}>
            <Text style={styles.locationLabel}>Delivering & Booking In</Text>
            <View style={styles.locationNameRow}>
              <Text style={styles.locationName} numberOfLines={1}>
                {locationName}
              </Text>
              <Ionicons name="chevron-down" size={14} color="#0F766E" />
            </View>
          </View>
          <View style={styles.locationChangeBtn}>
            <Text style={styles.locationChangeBtnText}>Change</Text>
          </View>
        </TouchableOpacity>
      </View>

      {/* TOAST NOTIFICATION */}
      {locationToast && (
        <View style={styles.toastCard}>
          <Ionicons name="checkmark-circle" size={16} color="#10B981" />
          <Text style={styles.toastText}>{locationToast}</Text>
        </View>
      )}

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >

        {/* PATIENT SWITCHER CHIPS */}
        <View style={styles.patientSwitcherRow}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingHorizontal: 16 }}>
            {familyMembers.map((member) => {
              const isSelected = activePatient.id === member.id;
              return (
                <TouchableOpacity
                  key={member.id}
                  style={[styles.patientChip, isSelected && styles.patientChipSelected]}
                  onPress={() => handleSelectPatient(member)}
                  activeOpacity={0.85}
                >
                  <Ionicons
                    name={member.icon || 'person'}
                    size={14}
                    color={isSelected ? '#FFFFFF' : colors.primary}
                  />
                  <Text style={[styles.patientChipText, isSelected && styles.patientChipTextSelected]}>
                    {member.name}
                  </Text>
                  {isSelected && <View style={styles.patientActiveDot} />}
                </TouchableOpacity>
              );
            })}

            <TouchableOpacity
              style={styles.addPatientChip}
              onPress={() => navigation.navigate('FamilyProfiles')}
              activeOpacity={0.85}
            >
              <Ionicons name="add" size={16} color={colors.primary} />
              <Text style={styles.addPatientText}>Add Member</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>

        {/* ==========================================
            SMART HERO SEARCH & SCAN BAR
        ========================================== */}
        <View style={styles.searchContainer}>
          <View style={styles.searchBar}>
            <TouchableOpacity
              onPress={() => handleSearchSubmit()}
              activeOpacity={0.7}
              style={{ padding: 4 }}
            >
              <Ionicons name="search" size={20} color={colors.primary} />
            </TouchableOpacity>

            <TextInput
              style={styles.searchInput}
              placeholder="Search doctors, medicines, tests, scans..."
              placeholderTextColor="#94A3B8"
              value={search}
              onChangeText={setSearch}
              onSubmitEditing={() => handleSearchSubmit()}
              returnKeyType="search"
            />

            {search.length > 0 ? (
              <TouchableOpacity onPress={() => setSearch('')} style={{ padding: 4 }}>
                <Ionicons name="close-circle" size={18} color="#94A3B8" />
              </TouchableOpacity>
            ) : null}

            {/* SEARCH BUTTON */}
            {search.trim().length > 0 && (
              <TouchableOpacity
                style={styles.searchGoBtn}
                onPress={() => handleSearchSubmit()}
                activeOpacity={0.8}
              >
                <Text style={styles.searchGoBtnText}>Search</Text>
              </TouchableOpacity>
            )}

            {/* RX CAMERA SCAN BUTTON */}
            <TouchableOpacity
              style={styles.scanSearchBtn}
              onPress={() => navigation.navigate('Chatbot')}
              activeOpacity={0.85}
            >
              <Ionicons name="camera-outline" size={18} color={colors.primary} />
            </TouchableOpacity>
          </View>

          {/* QUICK SEARCH SUGGESTION PILLS */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.quickSearchPillsRow}
          >
            {[
              { label: '🩺 Doctors', query: 'Doctor' },
              { label: '💊 Medicines', query: 'Medicine' },
              { label: '🧪 Blood Tests', query: 'Lab' },
              { label: '🔬 MRI & Scans', query: 'Radiology' },
              { label: '🏥 Hospitals', query: 'Hospital' },
              { label: '🎥 Video Consult', query: 'Video' },
            ].map((pill, idx) => (
              <TouchableOpacity
                key={idx}
                style={styles.quickSearchPill}
                onPress={() => handleSearchSubmit(pill.query)}
                activeOpacity={0.8}
              >
                <Text style={styles.quickSearchPillText}>{pill.label}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* ==========================================
            4 MAJOR HEALTHCARE HUBS (HERO GRID)
        ========================================== */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Healthcare Services</Text>
          <Text style={styles.sectionSubtitle}>Complete healthcare at your fingertips</Text>
        </View>

        <View style={styles.heroGrid}>
          {/* 1. DOCTOR APPOINTMENTS */}
          <TouchableOpacity
            style={[styles.heroCard, { backgroundColor: '#F0FDFA', borderColor: '#CCFBF1' }]}
            onPress={() => navigation.navigate('DoctorList')}
            activeOpacity={0.88}
          >
            <View style={[styles.heroIconCircle, { backgroundColor: colors.lightTeal }]}>
              <Ionicons name="person" size={24} color={colors.primary} />
            </View>
            <Text style={styles.heroCardTitle}>Book Doctors</Text>
            <Text style={styles.heroCardSubtitle}>50+ Verified Specialists</Text>
            <View style={styles.heroBadgeRow}>
              <Text style={styles.heroBadgeGreen}>Instant Slots</Text>
              <Ionicons name="arrow-forward-circle" size={20} color={colors.primary} />
            </View>
          </TouchableOpacity>

          {/* 2. PHARMACY STORE */}
          <TouchableOpacity
            style={[styles.heroCard, { backgroundColor: '#FFF7ED', borderColor: '#FFEDD5' }]}
            onPress={() => navigation.navigate('Pharmacy')}
            activeOpacity={0.88}
          >
            <View style={[styles.heroIconCircle, { backgroundColor: '#FFEDD5' }]}>
              <Ionicons name="medkit" size={24} color="#EA580C" />
            </View>
            <Text style={styles.heroCardTitle}>Order Medicines</Text>
            <Text style={styles.heroCardSubtitle}>Flat 20% OFF • 30 Mins</Text>
            <View style={styles.heroBadgeRow}>
              <Text style={[styles.heroBadgeGreen, { color: '#EA580C', backgroundColor: '#FFEDD5' }]}>
                Doorstep Delivery
              </Text>
              <Ionicons name="arrow-forward-circle" size={20} color="#EA580C" />
            </View>
          </TouchableOpacity>

          {/* 3. LAB TESTS */}
          <TouchableOpacity
            style={[styles.heroCard, { backgroundColor: '#EFF6FF', borderColor: '#DBEAFE' }]}
            onPress={() => navigation.navigate('LabTests')}
            activeOpacity={0.88}
          >
            <View style={[styles.heroIconCircle, { backgroundColor: '#DBEAFE' }]}>
              <Ionicons name="flask" size={24} color="#2563EB" />
            </View>
            <Text style={styles.heroCardTitle}>Lab & Blood Tests</Text>
            <Text style={styles.heroCardSubtitle}>Free Home Collection</Text>
            <View style={styles.heroBadgeRow}>
              <Text style={[styles.heroBadgeGreen, { color: '#2563EB', backgroundColor: '#DBEAFE' }]}>
                100% Certified
              </Text>
              <Ionicons name="arrow-forward-circle" size={20} color="#2563EB" />
            </View>
          </TouchableOpacity>

          {/* 4. RADIOLOGY & 3T SCANS */}
          <TouchableOpacity
            style={[styles.heroCard, { backgroundColor: '#FAF5FF', borderColor: '#F3E8FF' }]}
            onPress={() => navigation.navigate('RadiologyLabs')}
            activeOpacity={0.88}
          >
            <View style={[styles.heroIconCircle, { backgroundColor: '#F3E8FF' }]}>
              <Ionicons name="radio" size={24} color="#7C3AED" />
            </View>
            <Text style={styles.heroCardTitle}>Radiology & Scans</Text>
            <Text style={styles.heroCardSubtitle}>3T MRI, CT & Ultrasound</Text>
            <View style={styles.heroBadgeRow}>
              <Text style={[styles.heroBadgeGreen, { color: '#7C3AED', backgroundColor: '#F3E8FF' }]}>
                Hospital Visits
              </Text>
              <Ionicons name="arrow-forward-circle" size={20} color="#7C3AED" />
            </View>
          </TouchableOpacity>
        </View>

        {/* ==========================================
            HEALTH VITALS & SELF MONITOR WIDGET
        ========================================== */}
        <View style={styles.vitalsSection}>
          <View style={styles.vitalsHeaderRow}>
            <View>
              <Text style={styles.sectionTitle}>My Health Monitor</Text>
              <Text style={styles.sectionSubtitle}>Track your daily vital readings</Text>
            </View>
            <TouchableOpacity
              style={styles.vitalsActionBtn}
              onPress={() => navigation.navigate('HealthMonitor')}
            >
              <Ionicons name="add-circle" size={16} color={colors.primary} />
              <Text style={styles.vitalsActionBtnText}>Log Vitals</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.vitalsGrid}>
            <View style={styles.vitalCard}>
              <Ionicons name="water" size={18} color="#059669" />
              <Text style={styles.vitalValue}>108 <Text style={styles.vitalUnit}>mg/dL</Text></Text>
              <Text style={styles.vitalLabel}>Fasting Sugar (Normal)</Text>
            </View>

            <View style={styles.vitalCard}>
              <Ionicons name="heart" size={18} color="#DC2626" />
              <Text style={styles.vitalValue}>118/78 <Text style={styles.vitalUnit}>mmHg</Text></Text>
              <Text style={styles.vitalLabel}>Blood Pressure (Optimal)</Text>
            </View>

            <View style={styles.vitalCard}>
              <Ionicons name="pulse" size={18} color="#0284C7" />
              <Text style={styles.vitalValue}>99% <Text style={styles.vitalUnit}>SpO2</Text></Text>
              <Text style={styles.vitalLabel}>Oxygen Level (Good)</Text>
            </View>

            <View style={styles.vitalCard}>
              <Ionicons name="speedometer" size={18} color="#D97706" />
              <Text style={styles.vitalValue}>22.4 <Text style={styles.vitalUnit}>BMI</Text></Text>
              <Text style={styles.vitalLabel}>Body Mass Index</Text>
            </View>
          </View>
        </View>

        {/* ==========================================
            CONSULTATION MODES (IN-CLINIC & VIDEO)
        ========================================== */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Doctor Consultations</Text>
          <Text style={styles.sectionSubtitle}>Consult in person or via video call</Text>
        </View>

        <View style={styles.consultModesRow}>
          {consultationServices.map((service) => (
            <TouchableOpacity
              key={service.id}
              style={[styles.consultModeCard, { backgroundColor: service.background || '#F0FDFA' }]}
              onPress={() => navigation.navigate(service.route)}
              activeOpacity={0.88}
            >
              <View style={styles.consultModeHeader}>
                <Ionicons name={service.icon} size={26} color={service.iconColor || colors.primary} />
                <View style={[styles.arrowCircle, { backgroundColor: service.iconColor || colors.primary }]}>
                  <Ionicons name="arrow-forward" size={12} color="#FFFFFF" />
                </View>
              </View>
              <Text style={styles.consultModeTitle}>{service.title}</Text>
              <Text style={styles.consultModeSub}>{service.subtitle}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* ==========================================
            TOP DOCTORS NEAR YOU (CAROUSEL)
        ========================================== */}
        <View style={styles.sectionHeaderRow}>
          <View>
            <Text style={styles.sectionTitle}>Top Doctors Near You</Text>
            <Text style={styles.sectionSubtitle}>Verified clinicians in Mysore</Text>
          </View>
          <TouchableOpacity onPress={() => navigation.navigate('DoctorList')}>
            <Text style={styles.viewAllText}>View All ›</Text>
          </TouchableOpacity>
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.doctorsScroll}>
          {doctors.slice(0, 4).map((doc) => (
            <TouchableOpacity
              key={doc.id}
              style={styles.doctorCard}
              onPress={() => navigation.navigate('DoctorDetails', { doctor: doc })}
              activeOpacity={0.88}
            >
              <Image source={{ uri: doc.image }} style={styles.doctorImg} />
              <View style={styles.doctorCardBody}>
                <Text style={styles.doctorCardName} numberOfLines={1}>{doc.name}</Text>
                <Text style={styles.doctorCardSpec}>{doc.specialty}</Text>
                <View style={styles.doctorRatingRow}>
                  <Ionicons name="star" size={13} color="#F59E0B" />
                  <Text style={styles.doctorRatingText}>{doc.rating} • {doc.experienceYears} Yrs</Text>
                </View>
                <View style={styles.doctorCardFooter}>
                  <Text style={styles.doctorFeeText}>₹{doc.fee}</Text>
                  <View style={styles.bookMiniBtn}>
                    <Text style={styles.bookMiniBtnText}>Book</Text>
                  </View>
                </View>
              </View>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* ==========================================
            POPULAR HEALTH CHECKUP PACKAGES
        ========================================== */}
        <View style={styles.sectionHeaderRow}>
          <View>
            <Text style={styles.sectionTitle}>Preventive Health Packages</Text>
            <Text style={styles.sectionSubtitle}>Comprehensive full body checkups</Text>
          </View>
          <TouchableOpacity onPress={() => navigation.navigate('LabTests')}>
            <Text style={styles.viewAllText}>All Packages ›</Text>
          </TouchableOpacity>
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.packagesScroll}>
          {labPackages.map((pkg) => (
            <TouchableOpacity
              key={pkg.id}
              style={styles.pkgCard}
              onPress={() => navigation.navigate('LabTests')}
              activeOpacity={0.88}
            >
              <View style={styles.pkgBadge}>
                <Text style={styles.pkgBadgeText}>{pkg.discount}</Text>
              </View>
              <Ionicons name={pkg.icon || 'fitness'} size={28} color={colors.primary} style={{ marginVertical: 6 }} />
              <Text style={styles.pkgTitle} numberOfLines={1}>{pkg.title}</Text>
              <Text style={styles.pkgSub} numberOfLines={1}>{pkg.subtitle}</Text>
              <View style={styles.pkgPriceRow}>
                <Text style={styles.pkgPrice}>{pkg.priceStr}</Text>
                <Text style={styles.pkgOldPrice}>{pkg.oldPrice}</Text>
              </View>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* ==========================================
            MORE HEALTHCARE HUBS
        ========================================== */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>More Healthcare Services</Text>
          <Text style={styles.sectionSubtitle}>Insurance, surgeries & nursing care</Text>
        </View>

        <View style={styles.moreServicesGrid}>
          {moreServices.map((svc) => (
            <TouchableOpacity
              key={svc.id}
              style={styles.moreServiceCard}
              onPress={() => navigation.navigate(svc.route)}
              activeOpacity={0.85}
            >
              <View style={[styles.moreServiceIconCircle, { backgroundColor: svc.color || '#F0FDFA' }]}>
                <Ionicons name={svc.icon} size={22} color={svc.iconColor || colors.primary} />
              </View>
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={styles.moreServiceTitle}>{svc.title}</Text>
                <Text style={styles.moreServiceSubtitle} numberOfLines={1}>{svc.subtitle}</Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color="#CBD5E1" />
            </TouchableOpacity>
          ))}
        </View>

        {/* ==========================================
            COMBINED EMERGENCY SOS & 24x7 DOCTOR HELPLINE (BOTTOM)
        ========================================== */}
        <TouchableOpacity
          style={styles.combinedEmergencyCard}
          onPress={() => setEmergencyModalVisible(true)}
          activeOpacity={0.9}
        >
          <View style={styles.combinedEmergencyIconWrap}>
            <Ionicons name="medical" size={24} color="#FFFFFF" />
          </View>
          <View style={styles.combinedEmergencyTextWrap}>
            <View style={styles.emergencyPillBadge}>
              <View style={styles.emergencyPillDot} />
              <Text style={styles.emergencyPillBadgeText}>24x7 EMERGENCY RESPONSE</Text>
            </View>
            <Text style={styles.combinedEmergencyTitle}>Emergency SOS & Doctor Helpline</Text>
            <Text style={styles.combinedEmergencySubtitle}>Instant Ambulance (108), 24x7 Doctor Call & ER</Text>
          </View>
          <View style={styles.combinedEmergencyCallBtn}>
            <Ionicons name="call" size={16} color="#DC2626" />
            <Text style={styles.combinedEmergencyCallText}>Help</Text>
          </View>
        </TouchableOpacity>

        <View style={{ height: 75 }} />
      </ScrollView>

      {/* ==========================================
          DRAGGABLE / MOVABLE FLOATING CHATBOT AI BUTTON (FAB)
      ========================================== */}
      <Animated.View
        style={[
          styles.floatingChatbotFab,
          {
            transform: pan.getTranslateTransform(),
          },
        ]}
        {...panResponder.panHandlers}
      >
        <TouchableOpacity
          style={styles.fabInnerTouchable}
          onPress={() => navigation.navigate('Chatbot')}
          activeOpacity={0.85}
        >
          <View style={styles.fabIconCircle}>
            <Ionicons name="sparkles" size={20} color="#FFFFFF" />
            <View style={styles.fabOnlineBadge} />
          </View>
          <View style={styles.fabTextColumn}>
            <Text style={styles.fabTitle}>AI Doctor</Text>
            <Text style={styles.fabSub}>Drag / Tap AI</Text>
          </View>
        </TouchableOpacity>
      </Animated.View>

      {/* ==========================================
          EMERGENCY & 24x7 HELPLINE ACTION MODAL
      ========================================== */}
      <Modal
        visible={emergencyModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setEmergencyModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>🚨 Emergency & 24x7 Support</Text>
                <Text style={styles.modalSubtitle}>Immediate medical assistance & transport</Text>
              </View>
              <TouchableOpacity onPress={() => setEmergencyModalVisible(false)}>
                <Ionicons name="close" size={24} color="#64748B" />
              </TouchableOpacity>
            </View>

            {/* 1. CALL 108 AMBULANCE */}
            <TouchableOpacity
              style={styles.emergencyOptionCard}
              onPress={() => {
                setEmergencyModalVisible(false);
                Linking.openURL('tel:108');
              }}
              activeOpacity={0.85}
            >
              <View style={[styles.emergencyOptionIconBox, { backgroundColor: '#DC2626' }]}>
                <Ionicons name="medical" size={22} color="#FFFFFF" />
              </View>
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={styles.emergencyOptionTitle}>Call 108 Ambulance SOS</Text>
                <Text style={styles.emergencyOptionSubtitle}>Government Emergency Medical Services (Free)</Text>
              </View>
              <View style={[styles.callPill, { backgroundColor: '#FEE2E2' }]}>
                <Ionicons name="call" size={14} color="#DC2626" />
                <Text style={[styles.callPillText, { color: '#DC2626' }]}>108</Text>
              </View>
            </TouchableOpacity>

            {/* 2. 24x7 DOCTOR HELPLINE */}
            <TouchableOpacity
              style={styles.emergencyOptionCard}
              onPress={() => {
                setEmergencyModalVisible(false);
                Linking.openURL('tel:18001089999');
              }}
              activeOpacity={0.85}
            >
              <View style={[styles.emergencyOptionIconBox, { backgroundColor: colors.primary }]}>
                <Ionicons name="headset" size={22} color="#FFFFFF" />
              </View>
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={styles.emergencyOptionTitle}>24x7 Doctor Helpline</Text>
                <Text style={styles.emergencyOptionSubtitle}>Talk to on-duty general physician directly</Text>
              </View>
              <View style={[styles.callPill, { backgroundColor: colors.lightTeal }]}>
                <Ionicons name="call" size={14} color={colors.primary} />
                <Text style={[styles.callPillText, { color: colors.primary }]}>Call</Text>
              </View>
            </TouchableOpacity>

            {/* 3. NEAREST NABH HOSPITALS */}
            <TouchableOpacity
              style={styles.emergencyOptionCard}
              onPress={() => {
                setEmergencyModalVisible(false);
                navigation.navigate('HospitalList');
              }}
              activeOpacity={0.85}
            >
              <View style={[styles.emergencyOptionIconBox, { backgroundColor: '#2563EB' }]}>
                <Ionicons name="business" size={22} color="#FFFFFF" />
              </View>
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={styles.emergencyOptionTitle}>Nearby Hospital Emergency Rooms</Text>
                <Text style={styles.emergencyOptionSubtitle}>Locate accredited hospital ERs with 24/7 ICU</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color="#94A3B8" />
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* ==========================================
          LOCATION SELECTOR MODAL (SEARCH + CUSTOM ADDRESS)
      ========================================== */}
      <Modal
        visible={locationModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setLocationModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { maxHeight: '90%' }]}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>Change Location</Text>
                <Text style={styles.modalSubtitle}>Select city, area, cross & district</Text>
              </View>
              <TouchableOpacity
                onPress={() => setLocationModalVisible(false)}
                style={styles.modalCloseBtn}
              >
                <Ionicons name="close" size={22} color="#64748B" />
              </TouchableOpacity>
            </View>

            {/* TAB SELECTOR */}
            <View style={styles.locModalTabsRow}>
              <TouchableOpacity
                style={[
                  styles.locModalTabBtn,
                  locationModalTab === 'SEARCH' && styles.locModalTabBtnActive,
                ]}
                onPress={() => setLocationModalTab('SEARCH')}
              >
                <Ionicons
                  name="search"
                  size={15}
                  color={locationModalTab === 'SEARCH' ? colors.primary : '#64748B'}
                />
                <Text
                  style={[
                    styles.locModalTabText,
                    locationModalTab === 'SEARCH' && styles.locModalTabTextActive,
                  ]}
                >
                  Quick City & Area
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.locModalTabBtn,
                  locationModalTab === 'CUSTOM' && styles.locModalTabBtnActive,
                ]}
                onPress={() => setLocationModalTab('CUSTOM')}
              >
                <Ionicons
                  name="create-outline"
                  size={15}
                  color={locationModalTab === 'CUSTOM' ? colors.primary : '#64748B'}
                />
                <Text
                  style={[
                    styles.locModalTabText,
                    locationModalTab === 'CUSTOM' && styles.locModalTabTextActive,
                  ]}
                >
                  Custom Cross / District
                </Text>
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} style={{ marginTop: 10 }}>
              {/* ==========================================
                  TAB 1: QUICK SEARCH & CITY LOCALITIES
              ========================================== */}
              {locationModalTab === 'SEARCH' && (
                <>
                  {/* GPS DETECT */}
                  <TouchableOpacity
                    style={styles.gpsDetectBtn}
                    onPress={handleDetectGPSLocation}
                    disabled={loadingLocation}
                    activeOpacity={0.88}
                  >
                    {loadingLocation ? (
                      <ActivityIndicator size="small" color="#FFFFFF" />
                    ) : (
                      <>
                        <Ionicons name="locate" size={18} color="#FFFFFF" />
                        <Text style={styles.gpsDetectText}>Use Current GPS Location</Text>
                      </>
                    )}
                  </TouchableOpacity>

                  {/* SEARCH FILTER */}
                  <View style={styles.locSearchBar}>
                    <Ionicons name="search" size={18} color="#94A3B8" />
                    <TextInput
                      style={styles.locSearchInput}
                      placeholder="Search area, cross, district or pincode..."
                      placeholderTextColor="#94A3B8"
                      value={locationSearchQuery}
                      onChangeText={setLocationSearchQuery}
                    />
                    {locationSearchQuery.length > 0 && (
                      <TouchableOpacity onPress={() => setLocationSearchQuery('')}>
                        <Ionicons name="close-circle" size={16} color="#94A3B8" />
                      </TouchableOpacity>
                    )}
                  </View>

                  {/* CITY TABS */}
                  <Text style={styles.modalSectionLabel}>Select City / District</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 12 }}>
                    {Object.keys(CITY_AREAS_MAP).map((city) => {
                      const isSelected = selectedCityTab === city;
                      return (
                        <TouchableOpacity
                          key={city}
                          style={[
                            styles.cityPill,
                            isSelected && styles.cityPillActive,
                          ]}
                          onPress={() => setSelectedCityTab(city)}
                        >
                          <Text
                            style={[
                              styles.cityPillText,
                              isSelected && styles.cityPillTextActive,
                            ]}
                          >
                            {city}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </ScrollView>

                  {/* LOCALITIES LIST */}
                  <Text style={styles.modalSectionLabel}>
                    Localities in {selectedCityTab} ({currentCityAreas.length})
                  </Text>

                  <View style={styles.areaCardsList}>
                    {currentCityAreas.map((item, idx) => (
                      <TouchableOpacity
                        key={idx}
                        style={styles.areaCard}
                        onPress={async () => {
                          const full = `${item.area}, ${selectedCityTab}`;
                          setLocationName(full);
                          setCustomArea(item.area);
                          setCustomBuildingCross(item.cross);
                          setCustomCity(selectedCityTab);
                          setCustomDistrict(item.district);
                          setCustomPincode(item.pincode);

                          await AsyncStorage.setItem('@unnathi_user_location', full);
                          setLocationModalVisible(false);
                          showToast(`Location set to: ${full}`);
                        }}
                        activeOpacity={0.8}
                      >
                        <View style={styles.areaIconWrap}>
                          <Ionicons name="location" size={18} color={colors.primary} />
                        </View>
                        <View style={{ flex: 1, marginLeft: 10 }}>
                          <Text style={styles.areaCardTitle}>{item.area}</Text>
                          <Text style={styles.areaCardCross}>Cross: {item.cross}</Text>
                          <Text style={styles.areaCardDistrict}>
                            {item.district} • {item.pincode}
                          </Text>
                        </View>
                        <Ionicons name="chevron-forward" size={16} color="#CBD5E1" />
                      </TouchableOpacity>
                    ))}
                  </View>
                </>
              )}

              {/* ==========================================
                  TAB 2: CUSTOM ADDRESS & CROSS / DISTRICT
              ========================================== */}
              {locationModalTab === 'CUSTOM' && (
                <View style={styles.customFormBox}>
                  {/* BUILDING / CROSS / STREET */}
                  <Text style={styles.formInputLabel}>House / Building No. & Cross Street</Text>
                  <TextInput
                    style={styles.formTextInput}
                    placeholder="e.g. Flat 302, 4th Cross, 2nd Main Road"
                    placeholderTextColor="#94A3B8"
                    value={customBuildingCross}
                    onChangeText={setCustomBuildingCross}
                  />

                  {/* AREA / LOCALITY */}
                  <Text style={styles.formInputLabel}>Area / Locality / Layout</Text>
                  <TextInput
                    style={styles.formTextInput}
                    placeholder="e.g. Kuvempunagar, Jayalakshmipuram"
                    placeholderTextColor="#94A3B8"
                    value={customArea}
                    onChangeText={setCustomArea}
                  />

                  {/* CITY & DISTRICT IN ROW */}
                  <View style={styles.formRow}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.formInputLabel}>City / Town</Text>
                      <TextInput
                        style={styles.formTextInput}
                        placeholder="e.g. Mysore"
                        placeholderTextColor="#94A3B8"
                        value={customCity}
                        onChangeText={setCustomCity}
                      />
                    </View>

                    <View style={{ flex: 1, marginLeft: 10 }}>
                      <Text style={styles.formInputLabel}>District</Text>
                      <TextInput
                        style={styles.formTextInput}
                        placeholder="e.g. Mysuru District"
                        placeholderTextColor="#94A3B8"
                        value={customDistrict}
                        onChangeText={setCustomDistrict}
                      />
                    </View>
                  </View>

                  {/* PINCODE & ADDRESS TAG */}
                  <View style={styles.formRow}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.formInputLabel}>Pincode</Text>
                      <TextInput
                        style={styles.formTextInput}
                        placeholder="e.g. 570023"
                        placeholderTextColor="#94A3B8"
                        value={customPincode}
                        onChangeText={setCustomPincode}
                        keyboardType="numeric"
                      />
                    </View>

                    <View style={{ flex: 1, marginLeft: 10 }}>
                      <Text style={styles.formInputLabel}>Address Tag</Text>
                      <View style={styles.tagChipsRow}>
                        {['Home', 'Work', 'Other'].map((tag) => (
                          <TouchableOpacity
                            key={tag}
                            style={[
                              styles.tagChip,
                              customTag === tag && styles.tagChipActive,
                            ]}
                            onPress={() => setCustomTag(tag)}
                          >
                            <Text
                              style={[
                                styles.tagChipText,
                                customTag === tag && styles.tagChipTextActive,
                              ]}
                            >
                              {tag}
                            </Text>
                          </TouchableOpacity>
                        ))}
                      </View>
                    </View>
                  </View>

                  {/* SAVE LOCATION BUTTON */}
                  <TouchableOpacity
                    style={styles.saveLocBtn}
                    onPress={handleSaveCustomAddress}
                    activeOpacity={0.88}
                  >
                    <Ionicons name="checkmark-circle" size={18} color="#FFFFFF" />
                    <Text style={styles.saveLocBtnText}>Save & Apply Location</Text>
                  </TouchableOpacity>
                </View>
              )}

              <View style={{ height: 25 }} />
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* ==========================================
          WALLET TOP-UP MODAL
      ========================================== */}
      <Modal
        visible={walletModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setWalletModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>MediUnify Care Wallet</Text>
              <TouchableOpacity onPress={() => setWalletModalVisible(false)}>
                <Ionicons name="close" size={24} color="#64748B" />
              </TouchableOpacity>
            </View>

            <View style={styles.walletModalCard}>
              <Text style={styles.walletModalLabel}>Available Balance</Text>
              <Text style={styles.walletModalVal}>₹{walletBalance.toLocaleString('en-IN')}</Text>
              <Text style={styles.walletModalPts}>🪙 {carePoints} Health Care Points</Text>
            </View>

            <Text style={styles.modalSectionLabel}>Quick Top-Up Amount</Text>
            <View style={styles.topUpChipsRow}>
              {['200', '500', '1000', '2000'].map((amt) => (
                <TouchableOpacity
                  key={amt}
                  style={[styles.topUpChip, quickTopUpAmount === amt && styles.topUpChipActive]}
                  onPress={() => setQuickTopUpAmount(amt)}
                >
                  <Text style={[styles.topUpChipText, quickTopUpAmount === amt && styles.topUpChipTextActive]}>
                    + ₹{amt}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <TouchableOpacity
              style={styles.addMoneyBtn}
              onPress={() => handleQuickAddMoney(quickTopUpAmount)}
            >
              <Ionicons name="add-circle" size={18} color="#FFFFFF" />
              <Text style={styles.addMoneyBtnText}>Add ₹{quickTopUpAmount} to Wallet</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },

  // TOP BAR
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'android' ? 12 : 8,
    paddingBottom: 8,
    backgroundColor: '#FFFFFF',
  },
  profileHeaderBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    maxWidth: '52%',
  },
  profileAvatarWrap: {
    position: 'relative',
    width: 38,
    height: 38,
    borderRadius: 19,
    borderWidth: 1.5,
    borderColor: colors.primary,
  },
  profileAvatarImg: {
    width: '100%',
    height: '100%',
    borderRadius: 19,
  },
  profileOnlineDot: {
    position: 'absolute',
    bottom: -1,
    right: -1,
    width: 9,
    height: 9,
    borderRadius: 4.5,
    backgroundColor: '#10B981',
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
  },
  profileTextWrap: {
    marginLeft: 8,
    justifyContent: 'center',
  },
  profileHelloText: {
    fontSize: 13.5,
    fontWeight: '900',
    color: '#0F172A',
  },
  profileRoleText: {
    fontSize: 10.5,
    fontWeight: '700',
    color: '#0F766E',
    marginTop: 1,
  },
  locationStripWrap: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  locationPillFull: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  locationIconWrap: {
    width: 28,
    height: 28,
    borderRadius: 9,
    backgroundColor: colors.lightTeal,
    alignItems: 'center',
    justifyContent: 'center',
  },
  locationTextWrap: {
    flex: 1,
    marginLeft: 8,
  },
  locationLabel: {
    fontSize: 9.5,
    color: '#64748B',
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  locationNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  locationName: {
    fontSize: 12.5,
    fontWeight: '800',
    color: '#1E293B',
  },
  locationChangeBtn: {
    backgroundColor: '#CCFBF1',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  locationChangeBtnText: {
    fontSize: 10.5,
    fontWeight: '800',
    color: '#0F766E',
  },
  topBarRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  walletPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.lightTeal,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 4,
  },
  walletPillText: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.primary,
  },
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cartBadge: {
    position: 'absolute',
    top: -3,
    right: -3,
    backgroundColor: '#DC2626',
    borderRadius: 9,
    minWidth: 18,
    height: 18,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
  },
  cartBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '800',
  },
  notifBadgeDot: {
    position: 'absolute',
    top: 6,
    right: 7,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#DC2626',
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
  },

  toastCard: {
    position: 'absolute',
    top: 60,
    alignSelf: 'center',
    zIndex: 99,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#064E3B',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
  },
  toastText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },

  scrollContent: {
    paddingBottom: 30,
  },

  // GREETING
  greetingSection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 8,
  },
  greetingTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: '#1E293B',
  },
  greetingSubtitle: {
    fontSize: 12.5,
    color: '#64748B',
    marginTop: 2,
  },
  profileAvatarBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 2,
    borderColor: colors.primary,
    overflow: 'hidden',
  },
  profileAvatarImg: {
    width: '100%',
    height: '100%',
  },

  // PATIENT SWITCHER
  patientSwitcherRow: {
    marginVertical: 6,
  },
  patientChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 6,
  },
  patientChipSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  patientChipText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#475569',
  },
  patientChipTextSelected: {
    color: '#FFFFFF',
  },
  patientActiveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#A7F3D0',
  },
  addPatientChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.lightTeal,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 4,
  },
  addPatientText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.primary,
  },

  // SEARCH BAR
  searchContainer: {
    paddingHorizontal: 16,
    marginTop: 8,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 13,
    color: '#1E293B',
  },
  searchGoBtn: {
    backgroundColor: colors.primary,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    marginLeft: 4,
  },
  searchGoBtnText: {
    color: '#FFFFFF',
    fontSize: 11.5,
    fontWeight: '800',
  },
  scanSearchBtn: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: colors.lightTeal,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 6,
  },
  quickSearchPillsRow: {
    flexDirection: 'row',
    gap: 6,
    paddingTop: 8,
    paddingBottom: 2,
  },
  quickSearchPill: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  quickSearchPillText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#475569',
  },

  // EMERGENCY ROW
  emergencyRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    gap: 8,
    marginTop: 10,
  },
  sosCard: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF2F2',
    padding: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  sosIconBox: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: '#DC2626',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sosTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: '#991B1B',
  },
  sosSubtitle: {
    fontSize: 9.5,
    color: '#DC2626',
  },
  helplineCard: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0FDFA',
    padding: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#CCFBF1',
  },
  helplineIconBox: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  helplineTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: '#065F46',
  },
  helplineSubtitle: {
    fontSize: 9.5,
    color: colors.primary,
  },

  // SECTION HEADERS
  sectionHeader: {
    paddingHorizontal: 16,
    marginTop: 18,
    marginBottom: 8,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginTop: 18,
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '900',
    color: '#1E293B',
  },
  sectionSubtitle: {
    fontSize: 11.5,
    color: '#64748B',
    marginTop: 1,
  },
  viewAllText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.primary,
  },

  // HERO GRID (4 HUBS)
  heroGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 16,
    gap: 10,
  },
  heroCard: {
    width: '48.5%',
    borderRadius: 18,
    padding: 14,
    borderWidth: 1.5,
  },
  heroIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  heroCardTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#1E293B',
  },
  heroCardSubtitle: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
    marginBottom: 8,
  },
  heroBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  heroBadgeGreen: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.primary,
    backgroundColor: '#CCFBF1',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },

  // AI ASSISTANT BANNER
  aiBannerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0F766E',
    marginHorizontal: 16,
    borderRadius: 18,
    padding: 16,
    marginTop: 16,
  },
  aiBannerLeft: {
    flex: 1,
  },
  aiBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    gap: 4,
    marginBottom: 6,
  },
  aiBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '800',
  },
  aiBannerTitle: {
    fontSize: 15,
    fontWeight: '900',
    color: '#FFFFFF',
  },
  aiBannerSub: {
    fontSize: 11.5,
    color: '#CCFBF1',
    marginTop: 3,
    lineHeight: 15,
  },
  aiBannerBtn: {
    marginTop: 10,
    backgroundColor: '#FFFFFF',
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  aiBannerBtnText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#0F766E',
  },
  aiAvatarCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 10,
  },

  // HEALTH VITALS WIDGET
  vitalsSection: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    borderRadius: 18,
    padding: 14,
    marginTop: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  vitalsHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  vitalsActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.lightTeal,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    gap: 4,
  },
  vitalsActionBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.primary,
  },
  vitalsGrid: {
    flexDirection: 'row',
    gap: 8,
  },
  vitalCard: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  vitalValue: {
    fontSize: 13.5,
    fontWeight: '800',
    color: '#1E293B',
    marginTop: 4,
  },
  vitalUnit: {
    fontSize: 10,
    color: '#64748B',
    fontWeight: '600',
  },
  vitalLabel: {
    fontSize: 9.5,
    color: '#64748B',
    marginTop: 2,
  },

  // CONSULT MODES ROW
  consultModesRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    gap: 10,
  },
  consultModeCard: {
    flex: 1,
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  consultModeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  arrowCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  consultModeTitle: {
    fontSize: 13.5,
    fontWeight: '800',
    color: '#1E293B',
  },
  consultModeSub: {
    fontSize: 10.5,
    color: '#64748B',
    marginTop: 2,
  },

  // DOCTORS CAROUSEL
  doctorsScroll: {
    paddingHorizontal: 16,
    gap: 12,
  },
  doctorCard: {
    width: 155,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  doctorImg: {
    width: '100%',
    height: 110,
    backgroundColor: '#E2E8F0',
  },
  doctorCardBody: {
    padding: 10,
  },
  doctorCardName: {
    fontSize: 13,
    fontWeight: '800',
    color: '#1E293B',
  },
  doctorCardSpec: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 1,
  },
  doctorRatingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    marginVertical: 4,
  },
  doctorRatingText: {
    fontSize: 10.5,
    fontWeight: '600',
    color: '#475569',
  },
  doctorCardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
  },
  doctorFeeText: {
    fontSize: 13,
    fontWeight: '800',
    color: colors.primary,
  },
  bookMiniBtn: {
    backgroundColor: colors.primary,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  bookMiniBtnText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '700',
  },

  // PACKAGES CAROUSEL
  packagesScroll: {
    paddingHorizontal: 16,
    gap: 10,
  },
  pkgCard: {
    width: 165,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  pkgBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  pkgBadgeText: {
    fontSize: 9.5,
    fontWeight: '800',
    color: '#059669',
  },
  pkgTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#1E293B',
  },
  pkgSub: {
    fontSize: 10.5,
    color: '#64748B',
    marginTop: 2,
  },
  pkgPriceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 8,
  },
  pkgPrice: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.primary,
  },
  pkgOldPrice: {
    fontSize: 11,
    color: '#94A3B8',
    textDecorationLine: 'line-through',
  },

  // MORE SERVICES
  moreServicesGrid: {
    paddingHorizontal: 16,
    gap: 8,
  },
  moreServiceCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  moreServiceIconCircle: {
    width: 42,
    height: 42,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  moreServiceTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#1E293B',
  },
  moreServiceSubtitle: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 1,
  },

  // MODAL STYLES
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#1E293B',
  },
  modalSubtitle: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  modalCloseBtn: {
    padding: 4,
  },

  // LOC MODAL TABS
  locModalTabsRow: {
    flexDirection: 'row',
    backgroundColor: '#F1F5F9',
    borderRadius: 12,
    padding: 4,
    marginBottom: 10,
    gap: 4,
  },
  locModalTabBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    borderRadius: 10,
    gap: 6,
  },
  locModalTabBtnActive: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  locModalTabText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748B',
  },
  locModalTabTextActive: {
    color: colors.primary,
  },

  gpsDetectBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    paddingVertical: 12,
    borderRadius: 12,
    gap: 8,
    marginBottom: 12,
  },
  gpsDetectText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },

  locSearchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 12,
  },
  locSearchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 12.5,
    color: '#1E293B',
  },

  modalSectionLabel: {
    fontSize: 11.5,
    fontWeight: '800',
    color: '#64748B',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },

  // CITY PILLS
  cityPill: {
    backgroundColor: '#F8FAFC',
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginRight: 8,
  },
  cityPillActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  cityPillText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#475569',
  },
  cityPillTextActive: {
    color: '#FFFFFF',
  },

  // AREA CARDS
  areaCardsList: {
    gap: 8,
  },
  areaCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  areaIconWrap: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: colors.lightTeal,
    alignItems: 'center',
    justifyContent: 'center',
  },
  areaCardTitle: {
    fontSize: 13.5,
    fontWeight: '800',
    color: '#1E293B',
  },
  areaCardCross: {
    fontSize: 11.5,
    color: '#64748B',
    marginTop: 1,
  },
  areaCardDistrict: {
    fontSize: 10.5,
    color: '#94A3B8',
    marginTop: 1,
  },

  // CUSTOM FORM
  customFormBox: {
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  formInputLabel: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#475569',
    marginBottom: 4,
    marginTop: 8,
  },
  formTextInput: {
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    fontSize: 12.5,
    color: '#1E293B',
  },
  formRow: {
    flexDirection: 'row',
  },
  tagChipsRow: {
    flexDirection: 'row',
    gap: 4,
    marginTop: 2,
  },
  tagChip: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    paddingVertical: 9,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#CBD5E1',
  },
  tagChipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  tagChipText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#475569',
  },
  tagChipTextActive: {
    color: '#FFFFFF',
  },
  saveLocBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    paddingVertical: 13,
    borderRadius: 12,
    gap: 6,
    marginTop: 18,
  },
  saveLocBtnText: {
    color: '#FFFFFF',
    fontSize: 13.5,
    fontWeight: '800',
  },

  // WALLET MODAL
  walletModalCard: {
    backgroundColor: colors.lightTeal,
    padding: 16,
    borderRadius: 14,
    alignItems: 'center',
    marginBottom: 16,
  },
  walletModalLabel: {
    fontSize: 12,
    color: '#065F46',
    fontWeight: '600',
  },
  walletModalVal: {
    fontSize: 26,
    fontWeight: '900',
    color: colors.primary,
    marginVertical: 4,
  },
  walletModalPts: {
    fontSize: 12,
    fontWeight: '700',
    color: '#065F46',
  },
  topUpChipsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  topUpChip: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  topUpChipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  topUpChipText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#1E293B',
  },
  topUpChipTextActive: {
    color: '#FFFFFF',
  },
  addMoneyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    paddingVertical: 14,
    borderRadius: 12,
    gap: 6,
  },
  addMoneyBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },

  // COMBINED EMERGENCY CARD (BOTTOM)
  combinedEmergencyCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF2F2',
    marginHorizontal: 16,
    marginTop: 18,
    marginBottom: 10,
    padding: 14,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: '#FECACA',
    shadowColor: '#DC2626',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 3,
  },
  combinedEmergencyIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#DC2626',
    alignItems: 'center',
    justifyContent: 'center',
  },
  combinedEmergencyTextWrap: {
    flex: 1,
    marginLeft: 12,
  },
  emergencyPillBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 2,
  },
  emergencyPillDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#DC2626',
  },
  emergencyPillBadgeText: {
    fontSize: 9.5,
    fontWeight: '800',
    color: '#DC2626',
    letterSpacing: 0.5,
  },
  combinedEmergencyTitle: {
    fontSize: 13.5,
    fontWeight: '800',
    color: '#991B1B',
  },
  combinedEmergencySubtitle: {
    fontSize: 11,
    color: '#B91C1C',
    marginTop: 1,
  },
  combinedEmergencyCallBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#FCA5A5',
    gap: 4,
  },
  combinedEmergencyCallText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#DC2626',
  },

  // FLOATING CHATBOT FAB
  floatingChatbotFab: {
    position: 'absolute',
    bottom: 85,
    right: 16,
    zIndex: 9999,
    elevation: 12,
  },
  fabInnerTouchable: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0F766E',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 30,
    shadowColor: '#0F766E',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.45,
    shadowRadius: 10,
    elevation: 12,
    borderWidth: 2,
    borderColor: '#FFFFFF',
    gap: 8,
  },
  fabIconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  fabOnlineBadge: {
    position: 'absolute',
    top: -1,
    right: -1,
    width: 9,
    height: 9,
    borderRadius: 4.5,
    backgroundColor: '#34D399',
    borderWidth: 1.5,
    borderColor: '#0F766E',
  },
  fabTextColumn: {
    justifyContent: 'center',
  },
  fabTitle: {
    fontSize: 13,
    fontWeight: '900',
    color: '#FFFFFF',
  },
  fabSub: {
    fontSize: 9.5,
    fontWeight: '700',
    color: '#A7F3D0',
  },

  // EMERGENCY MODAL OPTIONS
  emergencyOptionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 10,
  },
  emergencyOptionIconBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emergencyOptionTitle: {
    fontSize: 13.5,
    fontWeight: '800',
    color: '#1E293B',
  },
  emergencyOptionSubtitle: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
  },
  callPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 4,
  },
  callPillText: {
    fontSize: 12,
    fontWeight: '800',
  },
});

export default HomeScreen;
