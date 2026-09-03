import React, { useEffect, useState, useMemo } from 'react';
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

  // Handle Search Execution
  const handleSearchSubmit = () => {
    if (!search.trim()) return;
    navigation.navigate('GlobalSearch', { query: search.trim() });
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* ==========================================
          TOP APP BAR (LOCATION, WALLET, NOTIFS, CART)
      ========================================== */}
      <View style={styles.topBar}>
        {/* LOCATION SELECTOR */}
        <TouchableOpacity
          style={styles.locationPill}
          onPress={() => setLocationModalVisible(true)}
          activeOpacity={0.85}
        >
          <View style={styles.locationIconWrap}>
            <Ionicons name="location" size={16} color={colors.primary} />
          </View>
          <View style={styles.locationTextWrap}>
            <Text style={styles.locationLabel}>Location</Text>
            <View style={styles.locationNameRow}>
              <Text style={styles.locationName} numberOfLines={1}>
                {locationName}
              </Text>
              <Ionicons name="chevron-down" size={14} color="#64748B" />
            </View>
          </View>
        </TouchableOpacity>

        {/* RIGHT ACTIONS: WALLET & CART */}
        <View style={styles.topBarRight}>
          {/* WALLET BUTTON */}
          <TouchableOpacity
            style={styles.walletPill}
            onPress={() => setWalletModalVisible(true)}
            activeOpacity={0.85}
          >
            <Ionicons name="wallet-outline" size={16} color={colors.primary} />
            <Text style={styles.walletPillText}>₹{walletBalance.toLocaleString('en-IN')}</Text>
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
        {/* ==========================================
            USER GREETING & PATIENT SWITCHER
        ========================================== */}
        <View style={styles.greetingSection}>
          <View>
            <Text style={styles.greetingTitle}>Hello, {userName} 👋</Text>
            <Text style={styles.greetingSubtitle}>How are you feeling today?</Text>
          </View>

          <TouchableOpacity
            style={styles.profileAvatarBtn}
            onPress={() => navigation.navigate('Profile')}
            activeOpacity={0.85}
          >
            <Image
              source={{
                uri: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200',
              }}
              style={styles.profileAvatarImg}
            />
          </TouchableOpacity>
        </View>

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
            <Ionicons name="search-outline" size={20} color="#94A3B8" />
            <TextInput
              style={styles.searchInput}
              placeholder="Search doctors, medicines, tests, scans..."
              placeholderTextColor="#94A3B8"
              value={search}
              onChangeText={setSearch}
              onSubmitEditing={handleSearchSubmit}
              returnKeyType="search"
            />
            {search.length > 0 ? (
              <TouchableOpacity onPress={() => setSearch('')}>
                <Ionicons name="close-circle" size={18} color="#94A3B8" />
              </TouchableOpacity>
            ) : null}

            <TouchableOpacity
              style={styles.scanSearchBtn}
              onPress={() => navigation.navigate('Chatbot')}
              activeOpacity={0.85}
            >
              <Ionicons name="camera-outline" size={18} color={colors.primary} />
            </TouchableOpacity>
          </View>
        </View>

        {/* ==========================================
            EMERGENCY SOS & 24x7 DOCTOR BAR
        ========================================== */}
        <View style={styles.emergencyRow}>
          <TouchableOpacity
            style={styles.sosCard}
            onPress={() => Linking.openURL('tel:108')}
            activeOpacity={0.85}
          >
            <View style={styles.sosIconBox}>
              <Ionicons name="medical" size={18} color="#FFFFFF" />
            </View>
            <View style={{ flex: 1, marginLeft: 8 }}>
              <Text style={styles.sosTitle}>Emergency SOS (108)</Text>
              <Text style={styles.sosSubtitle}>Instant Ambulance Response</Text>
            </View>
            <Ionicons name="call" size={16} color="#DC2626" />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.helplineCard}
            onPress={() => Linking.openURL('tel:18001089999')}
            activeOpacity={0.85}
          >
            <View style={styles.helplineIconBox}>
              <Ionicons name="headset" size={18} color="#FFFFFF" />
            </View>
            <View style={{ flex: 1, marginLeft: 8 }}>
              <Text style={styles.helplineTitle}>24x7 Doctor Helpline</Text>
              <Text style={styles.helplineSubtitle}>Free Instant Assistance</Text>
            </View>
          </TouchableOpacity>
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
            AI HEALTH ASSISTANT BANNER
        ========================================== */}
        <TouchableOpacity
          style={styles.aiBannerCard}
          onPress={() => navigation.navigate('Chatbot')}
          activeOpacity={0.9}
        >
          <View style={styles.aiBannerLeft}>
            <View style={styles.aiBadge}>
              <Ionicons name="sparkles" size={14} color="#FFFFFF" />
              <Text style={styles.aiBadgeText}>AI Health Assistant</Text>
            </View>
            <Text style={styles.aiBannerTitle}>Have Health Questions or Prescription?</Text>
            <Text style={styles.aiBannerSub}>
              Scan tablets, analyze symptoms, and get instant doctor suggestions.
            </Text>
            <View style={styles.aiBannerBtn}>
              <Text style={styles.aiBannerBtnText}>Chat with Health AI ›</Text>
            </View>
          </View>

          <View style={styles.aiAvatarCircle}>
            <Ionicons name="chatbubbles" size={36} color="#FFFFFF" />
          </View>
        </TouchableOpacity>

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

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* ==========================================
          LOCATION SELECTOR MODAL
      ========================================== */}
      <Modal
        visible={locationModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setLocationModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Your Location</Text>
              <TouchableOpacity onPress={() => setLocationModalVisible(false)}>
                <Ionicons name="close" size={24} color="#64748B" />
              </TouchableOpacity>
            </View>

            {/* GPS DETECT */}
            <TouchableOpacity
              style={styles.gpsDetectBtn}
              onPress={handleDetectGPSLocation}
              disabled={loadingLocation}
            >
              {loadingLocation ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <>
                  <Ionicons name="locate" size={18} color="#FFFFFF" />
                  <Text style={styles.gpsDetectText}>Detect Current GPS Location</Text>
                </>
              )}
            </TouchableOpacity>

            <Text style={styles.modalSectionLabel}>Popular Localities in Mysore</Text>
            <View style={styles.localityChipsGrid}>
              {POPULAR_MYSORE_AREAS.map((area, idx) => (
                <TouchableOpacity
                  key={idx}
                  style={[
                    styles.localityChip,
                    locationName === area && styles.localityChipActive,
                  ]}
                  onPress={async () => {
                    setLocationName(area);
                    await AsyncStorage.setItem('@unnathi_user_location', area);
                    setLocationModalVisible(false);
                    showToast(`Location set to: ${area}`);
                  }}
                >
                  <Ionicons
                    name="location-outline"
                    size={14}
                    color={locationName === area ? colors.primary : '#64748B'}
                  />
                  <Text
                    style={[
                      styles.localityChipText,
                      locationName === area && styles.localityChipTextActive,
                    ]}
                  >
                    {area}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
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
              <Text style={styles.modalTitle}>MediUnnathi Care Wallet</Text>
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
    paddingVertical: 10,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  locationPill: {
    flexDirection: 'row',
    alignItems: 'center',
    maxWidth: '55%',
  },
  locationIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: colors.lightTeal,
    alignItems: 'center',
    justifyContent: 'center',
  },
  locationTextWrap: {
    marginLeft: 8,
  },
  locationLabel: {
    fontSize: 10,
    color: '#64748B',
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  locationNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  locationName: {
    fontSize: 13,
    fontWeight: '800',
    color: '#1E293B',
  },
  topBarRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
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
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 13,
    color: '#1E293B',
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
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#1E293B',
  },
  gpsDetectBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    paddingVertical: 12,
    borderRadius: 12,
    gap: 8,
    marginBottom: 16,
  },
  gpsDetectText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  modalSectionLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748B',
    marginBottom: 10,
    textTransform: 'uppercase',
  },
  localityChipsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  localityChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 4,
  },
  localityChipActive: {
    backgroundColor: colors.lightTeal,
    borderColor: colors.primary,
  },
  localityChipText: {
    fontSize: 11.5,
    color: '#475569',
  },
  localityChipTextActive: {
    color: colors.primary,
    fontWeight: '700',
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
});

export default HomeScreen;
