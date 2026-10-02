import React, { useEffect, useState, useMemo, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  ActivityIndicator,
  Platform,
  Linking,
  Image,
  StatusBar,
  useWindowDimensions,
  FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { showAlert } from '../../utils/alert';
import {
  requestLocationPermissionWebSafe,
  getCurrentPositionWebSafe,
  reverseGeocodeWebSafe,
  detectAutoLocation,
  normalizeCityName,
} from '../../utils/locationHelper';

import colors from '../../theme/colors';
import { useCart } from '../../context/CartContext';

const CITIES = ['Mysuru', 'Bengaluru', 'Mangaluru', 'Hubballi', 'Belagavi'];

const SPECIALIZED_PROGRAMS = [
  {
    id: 'prog-ivf',
    pillText: '0% EMI PLANS',
    pillBg: '#FFF2ED',
    pillColor: '#EA580C',
    title: 'Fertility & IVF Specialists',
    subtitle: '73% Success Rate • Confidential Counseling Program',
    priceText: 'From ₹1,200',
    badgeText: 'Explore IVF',
    bgColor: '#FFF8F5',
    borderColor: '#FFDBC8',
    route: 'FertilityIvf',
  },
  {
    id: 'prog-checkup',
    pillText: 'FLAT 50% OFF',
    pillBg: '#E0F2FE',
    pillColor: '#0284C7',
    title: 'Executive Health Checkup',
    subtitle: '68 Vital Tests • Free Home Sample Pickup',
    priceText: 'From ₹999*',
    badgeText: 'Book Test',
    bgColor: '#F0F9FF',
    borderColor: '#BAE6FD',
    route: 'LabTests',
  },
  {
    id: 'prog-ayurveda',
    pillText: 'AYUSH CERTIFIED',
    pillBg: '#DCFCE7',
    pillColor: '#16A34A',
    title: 'Ayurveda & Panchakarma',
    subtitle: 'Nadi Pariksha, Shirodhara & Dosha Balancing',
    priceText: 'From ₹400',
    badgeText: 'Consult Vaidya',
    bgColor: '#F2FBF4',
    borderColor: '#BBF7D0',
    route: 'AyurvedaWellness',
  },
  {
    id: 'prog-equipment',
    pillText: 'FREE SETUP IN 4H',
    pillBg: '#E0F7F4',
    pillColor: '#0F766E',
    title: 'ICU Beds & Oxygen Rental',
    subtitle: 'Electric Hospital Beds & 10L Concentrators',
    priceText: 'From ₹80/day',
    badgeText: 'Rent Equipment',
    bgColor: '#F0FDFB',
    borderColor: '#99F6E4',
    route: 'EquipmentRental',
  },
];

const HomeScreen = ({ navigation }) => {
  const { width } = useWindowDimensions();
  const isTablet = width >= 600;
  const isLargeTablet = width >= 900;
  const maxContentWidth = 780;

  // Single Banner width: Available width with 16px margins on each side
  const contentWidth = isTablet ? Math.min(width, maxContentWidth) : width;
  const bannerWidth = contentWidth - 32;

  // Carousel State & Ref for Specialized Care & Programs
  const [activeProgramIndex, setActiveProgramIndex] = useState(0);
  const programCarouselRef = useRef(null);

  // Automatic Rotating Carousel: Rotates every 4 seconds
  useEffect(() => {
    const timer = setInterval(() => {
      setActiveProgramIndex((prev) => {
        const next = (prev + 1) % SPECIALIZED_PROGRAMS.length;
        try {
          programCarouselRef.current?.scrollToIndex({ index: next, animated: true });
        } catch (e) {}
        return next;
      });
    }, 4000);
    return () => clearInterval(timer);
  }, []);

  // User & Profile State
  const [userName, setUserName] = useState('Hemanth');
  const [selectedCity, setSelectedCity] = useState('Mysuru');
  const [locationName, setLocationName] = useState('Mysuru');
  const [locationModalVisible, setLocationModalVisible] = useState(false);
  const [loadingLocation, setLoadingLocation] = useState(false);
  const [locationToast, setLocationToast] = useState(null);

  // Wallet & Emergency State
  const [walletBalance, setWalletBalance] = useState(744);
  const [carePoints, setCarePoints] = useState(500);
  const [walletModalVisible, setWalletModalVisible] = useState(false);
  const [quickTopUpAmount, setQuickTopUpAmount] = useState('500');
  const [emergencyModalVisible, setEmergencyModalVisible] = useState(false);

  // Load User Info & Sync on Screen Focus
  useEffect(() => {
    loadUserData();
    const unsubscribe = navigation.addListener('focus', () => {
      loadUserData();
    });
    return unsubscribe;
  }, [navigation]);

  const loadUserData = async () => {
    try {
      const savedActive = await AsyncStorage.getItem('@unnathi_active_patient');
      let foundName = '';
      if (savedActive) {
        try {
          const parsedActive = JSON.parse(savedActive);
          if (parsedActive && (parsedActive.displayName || parsedActive.name)) {
            const raw = (parsedActive.displayName || parsedActive.name).trim();
            foundName = raw.replace(/\s*\([Ss]elf\)/g, '').split(' ')[0] || raw;
          }
        } catch (e) {
          console.log('Error parsing active patient:', e);
        }
      }

      if (foundName) {
        setUserName(foundName);
      } else {
        const storedName = await AsyncStorage.getItem('userName');
        if (storedName && storedName.trim()) {
          setUserName(storedName.trim());
        }
      }

      const savedCity = await AsyncStorage.getItem('@mediunify_selected_city');
      const savedLoc = await AsyncStorage.getItem('@unnathi_user_location');
      if (savedCity && CITIES.includes(savedCity)) {
        setSelectedCity(savedCity);
        setLocationName(savedCity);
      } else if (savedLoc && savedLoc.trim()) {
        const found = CITIES.find((c) => savedLoc.toLowerCase().includes(c.toLowerCase()));
        if (found) {
          setSelectedCity(found);
          setLocationName(found);
        } else {
          setLocationName(savedLoc.trim());
        }
      } else {
        try {
          const autoLoc = await detectAutoLocation();
          if (autoLoc && autoLoc.city) {
            setSelectedCity(autoLoc.city);
            setLocationName(autoLoc.city);
          }
        } catch (e) {}
      }

      const savedWallet = await AsyncStorage.getItem('@unnathi_wallet_balance');
      if (savedWallet) {
        setWalletBalance(parseInt(savedWallet, 10) || 744);
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

  const handleQuickAddMoney = async (amt) => {
    const num = parseInt(amt, 10);
    if (isNaN(num) || num <= 0) return;
    const newBal = walletBalance + num;
    setWalletBalance(newBal);
    await AsyncStorage.setItem('@unnathi_wallet_balance', newBal.toString());
    setWalletModalVisible(false);
    showToast(`₹${num.toLocaleString('en-IN')} added to Care Wallet!`);
  };

  // GPS Location Detection
  const handleDetectGPSLocation = async () => {
    try {
      setLoadingLocation(true);
      const perm = await requestLocationPermissionWebSafe();
      if (!perm.granted && perm.status !== 'granted') {
        showAlert('Permission Denied', 'Please grant location permission to detect your city.');
        setLoadingLocation(false);
        return;
      }
      const loc = await getCurrentPositionWebSafe({ accuracy: Location.Accuracy.Balanced });
      const addresses = await reverseGeocodeWebSafe({
        latitude: loc.coords.latitude,
        longitude: loc.coords.longitude,
      });

      const geocode = addresses && addresses.length > 0 ? addresses[0] : null;
      if (geocode) {
        const rawCity = geocode.city || geocode.subregion || geocode.district || 'Mysuru';
        const normalized = normalizeCityName(rawCity);
        const matchedCity = CITIES.find((c) => normalized.toLowerCase().includes(c.toLowerCase().slice(0, 4))) || normalized;
        setSelectedCity(matchedCity);
        setLocationName(matchedCity);
        await AsyncStorage.setItem('@mediunify_selected_city', matchedCity);
        await AsyncStorage.setItem('@unnathi_user_location', matchedCity);
        setLocationModalVisible(false);
        showToast(`City set to ${matchedCity}`);
      }
      setLoadingLocation(false);
    } catch (e) {
      setLoadingLocation(false);
      showAlert('Location Error', 'Could not detect GPS location. Please select your city from the list.');
    }
  };

  return (
    <SafeAreaView style={[styles.container, isTablet && styles.tabletContainer]} edges={['top', 'left', 'right']}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* ============================================================
          TOP APP HEADER BAR
          - Left: Logo Mark
          - Center: City / Location selector pill
          - Right: User Profile Avatar
      ============================================================ */}
      <View style={[styles.topHeaderBar, isTablet && { maxWidth: maxContentWidth, width: '100%', alignSelf: 'center' }]}>
        {/* Left: Brand Logo Mark */}
        <Image
          source={require('../../../assets/logo-mark.png')}
          style={styles.brandLogoMark}
          resizeMode="contain"
        />

        {/* Center: Location Selector Pill */}
        <TouchableOpacity
          style={styles.locationPill}
          activeOpacity={0.8}
          onPress={() => setLocationModalVisible(true)}
        >
          <Ionicons name="location-sharp" size={14} color="#007D69" />
          <Text style={styles.locationText} numberOfLines={1}>
            {selectedCity || locationName || 'Mysuru'}
          </Text>
          <Ionicons name="chevron-down" size={13} color="#64748B" />
        </TouchableOpacity>

        {/* Right: User Avatar */}
        <TouchableOpacity
          style={styles.avatarButton}
          activeOpacity={0.85}
          onPress={() => navigation.navigate('Profile')}
        >
          <View style={styles.avatarCircle}>
            <Ionicons name="person" size={20} color="#64748B" />
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
        style={[styles.scrollView, isTablet && styles.tabletScrollView]}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.scrollContent,
          isTablet && styles.scrollContentTablet,
        ]}
      >
        {/* ============================================================
            1. ASK MEDIUNIFY AI BANNER (TOP HERO)
        ============================================================ */}
        <View style={styles.aiBannerCard}>
          <View style={styles.aiBannerLeft}>
            <View style={styles.aiPillBadge}>
              <Ionicons name="sparkles" size={11} color="#007D69" />
              <Text style={styles.aiPillText}>AI ASSISTANT</Text>
            </View>
            <Text style={styles.aiBannerTitle}>Ask MediUnify AI</Text>
            <Text style={styles.aiBannerSubtitle}>
              Get instant answers to your symptoms, medications & medical reports.
            </Text>
            <TouchableOpacity
              style={styles.aiChatButton}
              activeOpacity={0.85}
              onPress={() => navigation.navigate('Chatbot')}
            >
              <Text style={styles.aiChatButtonText}>Chat with AI →</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.aiBannerRight}>
            <Image
              source={require('../../../assets/ai-bot-avatar.png')}
              style={styles.aiBannerAvatar}
              resizeMode="contain"
            />
            <View style={styles.aiSpeechBubble}>
              <Text style={styles.aiSpeechText}>Hi!</Text>
            </View>
            <View style={styles.aiMiniDotsRow}>
              <View style={[styles.aiMiniDot, styles.aiMiniDotActive]} />
              <View style={styles.aiMiniDot} />
              <View style={styles.aiMiniDot} />
              <View style={styles.aiMiniDot} />
            </View>
          </View>
        </View>

        {/* ============================================================
            2. SEARCH BAR
        ============================================================ */}
        <View style={styles.searchBarWrapper}>
          <TouchableOpacity
            style={styles.searchBarBox}
            activeOpacity={0.88}
            onPress={() => navigation.navigate('GlobalSearch')}
          >
            <Ionicons name="search-outline" size={19} color="#64748B" />
            <Text style={styles.searchPlaceholder} numberOfLines={1}>
              Search doctors, tests, medicines, clinics...
            </Text>
            <Ionicons name="mic-outline" size={19} color="#64748B" />
          </TouchableOpacity>
        </View>

        {/* ============================================================
            3. CARE HUB
            - Header: "Care Hub \n Instant & Secure"
            - Right badge: "Invite Friends + Get Rewards"
            - 4 Circular Action Buttons:
                1. Video Call Consultation (Replaced Instant Care)
                2. Lab Tests
                3. Care Wallet
                4. Health Records
            - Highlight Cards (Smart Health Checkups & Partner Benefits)
        ============================================================ */}
        <View style={styles.hubSection}>
          <View style={styles.hubHeaderRow}>
            <View>
              <Text style={styles.hubTitle}>Care Hub</Text>
              <Text style={styles.hubSubtitle}>Instant & Secure</Text>
            </View>

            {/* Orange / Peach Pill Reward Badge */}
            <TouchableOpacity
              style={styles.rewardsPillBadge}
              activeOpacity={0.82}
              onPress={() => navigation.navigate('ReferEarn')}
            >
              <View style={styles.rewardIconBadge}>
                <Ionicons name="gift" size={10} color="#FFFFFF" />
              </View>
              <Text style={styles.rewardsPillText}>Invite Friends + Get Rewards</Text>
            </TouchableOpacity>
          </View>

          {/* 4 Circular Action Buttons in a Balanced Row */}
          <View style={styles.circularActionsRow}>
            {/* 1. Video Call Consultation */}
            <TouchableOpacity
              style={styles.circularActionItem}
              activeOpacity={0.82}
              onPress={() => navigation.navigate('VideoConsultation')}
            >
              <View style={styles.actionCircle}>
                <Ionicons name="videocam-outline" size={26} color="#007D69" />
              </View>
              <Text style={styles.actionLabel}>Video Call{'\n'}Consultation</Text>
            </TouchableOpacity>

            {/* 2. Lab Tests */}
            <TouchableOpacity
              style={styles.circularActionItem}
              activeOpacity={0.82}
              onPress={() => navigation.navigate('LabTests')}
            >
              <View style={styles.actionCircle}>
                <Ionicons name="flask-outline" size={25} color="#007D69" />
              </View>
              <Text style={styles.actionLabel}>Lab{'\n'}Tests</Text>
            </TouchableOpacity>

            {/* 3. Care Wallet */}
            <TouchableOpacity
              style={styles.circularActionItem}
              activeOpacity={0.82}
              onPress={() => setWalletModalVisible(true)}
            >
              <View style={styles.actionCircle}>
                <MaterialCommunityIcons name="wallet-outline" size={26} color="#007D69" />
              </View>
              <Text style={styles.actionLabel}>Care{'\n'}Wallet</Text>
            </TouchableOpacity>

            {/* 4. Health Records */}
            <TouchableOpacity
              style={styles.circularActionItem}
              activeOpacity={0.82}
              onPress={() => navigation.navigate('HealthRecords')}
            >
              <View style={styles.actionCircle}>
                <Ionicons name="documents-outline" size={25} color="#007D69" />
              </View>
              <Text style={styles.actionLabel}>Health{'\n'}Records</Text>
            </TouchableOpacity>
          </View>

          {/* Highlight Cards (Directly below 4 circular items in Care Hub) */}
          <View style={styles.highlightStrip}>
            {/* Card 1: Smart Checkups */}
            <TouchableOpacity
              style={styles.highlightCard}
              activeOpacity={0.85}
              onPress={() => navigation.navigate('LabTests')}
            >
              <View style={[styles.highlightIconSquare, { backgroundColor: '#E0F7F4' }]}>
                <Ionicons name="shield-checkmark" size={17} color="#007D69" />
              </View>
              <View style={{ flex: 1, marginLeft: 8 }}>
                <Text style={styles.highlightTitle} numberOfLines={1}>Smart Health Checkups</Text>
                <Text style={styles.highlightSub} numberOfLines={1}>Save up to 50% on tests</Text>
              </View>
              <Ionicons name="chevron-forward" size={15} color="#007D69" />
            </TouchableOpacity>

            {/* Card 2: Partner Benefits */}
            <TouchableOpacity
              style={styles.highlightCard}
              activeOpacity={0.85}
              onPress={() => navigation.navigate('HealthInsurance')}
            >
              <View style={[styles.highlightIconSquare, { backgroundColor: '#EEF2FF' }]}>
                <Ionicons name="card" size={17} color="#1E3A8A" />
              </View>
              <View style={{ flex: 1, marginLeft: 8 }}>
                <Text style={styles.highlightTitle} numberOfLines={1}>Partner Benefits</Text>
                <Text style={styles.highlightSub} numberOfLines={1}>100% Cashless Claims</Text>
              </View>
              <Ionicons name="chevron-forward" size={15} color="#1E3A8A" />
            </TouchableOpacity>
          </View>
        </View>

        {/* ============================================================
            4. HEALTHCARE & SERVICES
            - In-Clinic Visit
            - Home Nursing & Caregiver
            - Scans & X-Ray
            - Order Medicine
            - Sub-Row: Order with Doctor's Prescription + More →
        ============================================================ */}
        <View style={styles.billsSection}>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.billsSectionTitle}>Healthcare & Services</Text>
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => navigation.navigate('AllServices')}
            >
              <Text style={styles.viewAllLink}>View All →</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.billsGrid}>
            {/* Tile 1: In-Clinic Visit */}
            <TouchableOpacity
              style={styles.billTile}
              activeOpacity={0.82}
              onPress={() => navigation.navigate('DoctorList')}
            >
              <View style={styles.billTileIconBox}>
                <MaterialCommunityIcons name="hospital-building" size={26} color="#007D69" />
              </View>
              <Text style={styles.billTileText}>In-Clinic{'\n'}Visit</Text>
            </TouchableOpacity>

            {/* Tile 2: Home Nursing & Caregiver */}
            <TouchableOpacity
              style={styles.billTile}
              activeOpacity={0.82}
              onPress={() => navigation.navigate('NurseBooking')}
            >
              <View style={styles.billTileIconBox}>
                <MaterialCommunityIcons name="home-heart" size={26} color="#007D69" />
              </View>
              <Text style={styles.billTileText}>Home Nursing &{'\n'}Caregiver</Text>
            </TouchableOpacity>

            {/* Tile 3: Scans & X-Ray */}
            <TouchableOpacity
              style={styles.billTile}
              activeOpacity={0.82}
              onPress={() => navigation.navigate('RadiologyLabs')}
            >
              <View style={styles.billTileIconBox}>
                <Ionicons name="scan-outline" size={25} color="#007D69" />
              </View>
              <Text style={styles.billTileText}>Scans &{'\n'}X-Ray</Text>
            </TouchableOpacity>

            {/* Tile 4: Order Medicine */}
            <TouchableOpacity
              style={styles.billTile}
              activeOpacity={0.82}
              onPress={() => navigation.navigate('Pharmacy')}
            >
              <View style={styles.billTileIconBox}>
                <MaterialCommunityIcons name="pill" size={26} color="#007D69" />
              </View>
              <Text style={styles.billTileText}>Order{'\n'}Medicine</Text>
            </TouchableOpacity>
          </View>

          {/* Sub-Banner Row: Order with Doctor's Prescription + More -> button */}
          <View style={styles.billsSubRow}>
            <TouchableOpacity
              style={styles.billsWidePill}
              activeOpacity={0.85}
              onPress={() => navigation.navigate('Pharmacy')}
            >
              <View style={styles.billsCardMiniIconBox}>
                <MaterialCommunityIcons name="card-bulleted-outline" size={20} color="#007D69" />
              </View>
              <Text style={styles.billsWidePillText}>Order with Doctor's Prescription</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.billsMoreBtn}
              activeOpacity={0.82}
              onPress={() => navigation.navigate('AllServices')}
            >
              <Text style={styles.billsMoreBtnText}>More →</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* ============================================================
            5. SPECIALIZED CARE & PROGRAMS (SINGLE BANNER ROTATING CAROUSEL)
            - Show ONLY ONE promotional banner at a time
            - Automatically rotates every 4 seconds
            - Swipeable manually
            - Fixed height (140px) to prevent screen jumps
            - Pagination dots at bottom
        ============================================================ */}
        <View style={styles.programsSection}>
          <View style={styles.programsHeaderRow}>
            <Text style={styles.programsTitle}>Specialized Care & Programs</Text>
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => navigation.navigate('AllServices')}
            >
              <Text style={styles.viewAllLink}>View All →</Text>
            </TouchableOpacity>
          </View>

          <FlatList
            ref={programCarouselRef}
            data={SPECIALIZED_PROGRAMS}
            keyExtractor={(item) => item.id}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            snapToInterval={bannerWidth}
            snapToAlignment="start"
            decelerationRate="fast"
            contentContainerStyle={styles.singleBannerCarouselContainer}
            onMomentumScrollEnd={(e) => {
              const idx = Math.round(e.nativeEvent.contentOffset.x / bannerWidth);
              if (idx >= 0 && idx < SPECIALIZED_PROGRAMS.length) {
                setActiveProgramIndex(idx);
              }
            }}
            getItemLayout={(data, index) => ({
              length: bannerWidth,
              offset: bannerWidth * index,
              index,
            })}
            renderItem={({ item }) => (
              <View style={{ width: bannerWidth, paddingHorizontal: 0 }}>
                <TouchableOpacity
                  style={[
                    styles.singleProgramCard,
                    { backgroundColor: item.bgColor, borderColor: item.borderColor },
                  ]}
                  activeOpacity={0.9}
                  onPress={() => navigation.navigate(item.route)}
                >
                  <View style={styles.programCardHeader}>
                    <View style={[styles.programPillBadge, { backgroundColor: item.pillBg }]}>
                      <Text style={[styles.programPillText, { color: item.pillColor }]}>
                        {item.pillText}
                      </Text>
                    </View>
                    <Text style={styles.programPrice}>{item.priceText}</Text>
                  </View>

                  <Text style={styles.programCardTitle} numberOfLines={1}>
                    {item.title}
                  </Text>
                  <Text style={styles.programCardSubtitle} numberOfLines={2}>
                    {item.subtitle}
                  </Text>

                  <View style={styles.programCardFooter}>
                    <Text style={styles.programActionText}>{item.badgeText} →</Text>
                    <View style={styles.programCircleArrow}>
                      <Ionicons name="arrow-forward" size={14} color="#FFFFFF" />
                    </View>
                  </View>
                </TouchableOpacity>
              </View>
            )}
          />

          {/* Small pagination dots */}
          <View style={styles.carouselDotsRow}>
            {SPECIALIZED_PROGRAMS.map((_, i) => (
              <TouchableOpacity
                key={i}
                onPress={() => {
                  setActiveProgramIndex(i);
                  try {
                    programCarouselRef.current?.scrollToIndex({ index: i, animated: true });
                  } catch (e) {}
                }}
                activeOpacity={0.7}
              >
                <View
                  style={[
                    styles.carouselDot,
                    activeProgramIndex === i && styles.carouselDotActive,
                  ]}
                />
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Extra Bottom Spacing for Bottom Navigation Bar */}
        <View style={{ height: isTablet ? 0 : 85 }} />
      </ScrollView>

      {/* ============================================================
          EMERGENCY & 24x7 HELPLINE MODAL
      ============================================================ */}
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
                <Text style={styles.modalTitle}>Emergency & 24x7 Support</Text>
                <Text style={styles.modalSubtitle}>Immediate medical transport & assistance</Text>
              </View>
              <TouchableOpacity onPress={() => setEmergencyModalVisible(false)}>
                <Ionicons name="close" size={24} color="#64748B" />
              </TouchableOpacity>
            </View>

            {/* 1. 108 AMBULANCE SOS */}
            <TouchableOpacity
              style={styles.emergencyCard}
              onPress={() => {
                setEmergencyModalVisible(false);
                Linking.openURL('tel:108');
              }}
              activeOpacity={0.85}
            >
              <View style={[styles.emergencyIconSquare, { backgroundColor: '#FF7F50' }]}>
                <Ionicons name="medical" size={22} color="#FFFFFF" />
              </View>
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={styles.emergencyCardTitle}>Call 108 Ambulance SOS</Text>
                <Text style={styles.emergencyCardSub}>Government Emergency Medical Services (Free)</Text>
              </View>
              <View style={[styles.callPill, { backgroundColor: '#FFF2ED' }]}>
                <Ionicons name="call" size={13} color="#FF7F50" />
                <Text style={[styles.callPillText, { color: '#FF7F50' }]}>108</Text>
              </View>
            </TouchableOpacity>

            {/* 2. 24x7 DOCTOR HELPLINE */}
            <TouchableOpacity
              style={styles.emergencyCard}
              onPress={() => {
                setEmergencyModalVisible(false);
                Linking.openURL('tel:18001089999');
              }}
              activeOpacity={0.85}
            >
              <View style={[styles.emergencyIconSquare, { backgroundColor: '#007D69' }]}>
                <Ionicons name="headset" size={22} color="#FFFFFF" />
              </View>
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={styles.emergencyCardTitle}>24x7 Doctor Helpline</Text>
                <Text style={styles.emergencyCardSub}>Speak with an on-duty general physician</Text>
              </View>
              <View style={[styles.callPill, { backgroundColor: '#E0F7F4' }]}>
                <Ionicons name="call" size={13} color="#007D69" />
                <Text style={[styles.callPillText, { color: '#007D69' }]}>Call</Text>
              </View>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* ============================================================
          CITY SELECTION MODAL
      ============================================================ */}
      <Modal
        visible={locationModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setLocationModalVisible(false)}
      >
        <TouchableOpacity
          style={styles.cityModalOverlay}
          activeOpacity={1}
          onPress={() => setLocationModalVisible(false)}
        >
          <TouchableOpacity
            style={styles.cityModalCard}
            activeOpacity={1}
            onPress={() => {}}
          >
            <View style={styles.cityModalHeader}>
              <Text style={styles.cityModalTitle}>Select Your City</Text>
              <TouchableOpacity onPress={() => setLocationModalVisible(false)}>
                <Ionicons name="close" size={22} color="#64748B" />
              </TouchableOpacity>
            </View>

            <Text style={styles.cityModalSub}>
              Verified clinics, labs & home delivery available across Karnataka
            </Text>

            <View style={styles.cityList}>
              {CITIES.map((city) => {
                const isSelected = selectedCity === city || locationName === city;
                return (
                  <TouchableOpacity
                    key={city}
                    style={[styles.cityItem, isSelected && styles.cityItemActive]}
                    onPress={async () => {
                      setSelectedCity(city);
                      setLocationName(city);
                      await AsyncStorage.setItem('@mediunify_selected_city', city);
                      await AsyncStorage.setItem('@unnathi_user_location', city);
                      setLocationModalVisible(false);
                      showToast(`City changed to ${city}`);
                    }}
                    activeOpacity={0.75}
                  >
                    <Ionicons
                      name="business-outline"
                      size={18}
                      color={isSelected ? '#007D69' : '#64748B'}
                    />
                    <Text style={[styles.cityItemText, isSelected && styles.cityItemTextActive]}>
                      {city}
                    </Text>
                    {isSelected && (
                      <Ionicons
                        name="checkmark-circle"
                        size={18}
                        color="#007D69"
                        style={{ marginLeft: 'auto' }}
                      />
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* GPS QUICK DETECT */}
            <TouchableOpacity
              style={styles.cityGpsOption}
              onPress={handleDetectGPSLocation}
              disabled={loadingLocation}
              activeOpacity={0.8}
            >
              {loadingLocation ? (
                <ActivityIndicator size="small" color="#007D69" />
              ) : (
                <>
                  <Ionicons name="locate" size={16} color="#007D69" />
                  <Text style={styles.cityGpsOptionText}>Use Current GPS Location</Text>
                </>
              )}
            </TouchableOpacity>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

      {/* ============================================================
          CARE WALLET TOP-UP MODAL
      ============================================================ */}
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

            <View style={styles.walletCard}>
              <Text style={styles.walletCardLabel}>Available Balance</Text>
              <Text style={styles.walletCardVal}>₹{walletBalance.toLocaleString('en-IN')}</Text>
              <Text style={styles.walletCardPts}>🎁 {carePoints} Health Care Points</Text>
            </View>

            <Text style={styles.walletModalSectionLabel}>Quick Top-Up Amount</Text>
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
    backgroundColor: '#FFFFFF',
  },
  tabletContainer: {
    flex: 1,
    width: '100%',
  },
  scrollView: {
    flex: 1,
    width: '100%',
  },
  tabletScrollView: {
    flex: 1,
    width: '100%',
  },
  scrollContent: {
    paddingBottom: 24,
  },
  scrollContentTablet: {
    maxWidth: 780,
    width: '100%',
    alignSelf: 'center',
    flexGrow: 1,
    paddingBottom: 76,
  },

  // ============================================================
  // TOP APP HEADER BAR
  // ============================================================
  topHeaderBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 8,
    backgroundColor: '#FFFFFF',
  },
  brandLogoMark: {
    width: 44,
    height: 38,
  },
  locationPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    gap: 5,
  },
  locationText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
    maxWidth: 120,
  },
  avatarButton: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // ============================================================
  // 1. ASK MEDIUNIFY AI BANNER (TOP HERO)
  // ============================================================
  aiBannerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#EBF8F5',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#D0F2E9',
    marginHorizontal: 16,
    marginTop: 10,
    padding: 16,
    position: 'relative',
    overflow: 'hidden',
  },
  aiBannerLeft: {
    flex: 1,
    paddingRight: 10,
    zIndex: 2,
  },
  aiPillBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#D0F2E9',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    alignSelf: 'flex-start',
    gap: 4,
    marginBottom: 6,
  },
  aiPillText: {
    fontSize: 10,
    fontWeight: '900',
    color: '#007D69',
    letterSpacing: 0.3,
  },
  aiBannerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
    letterSpacing: -0.2,
  },
  aiBannerSubtitle: {
    fontSize: 12,
    color: '#475569',
    marginTop: 4,
    lineHeight: 17,
  },
  aiChatButton: {
    backgroundColor: '#007D69',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 18,
    alignSelf: 'flex-start',
    marginTop: 12,
    shadowColor: '#007D69',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.18,
    shadowRadius: 4,
    elevation: 2,
  },
  aiChatButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
  },
  aiBannerRight: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    width: 90,
    height: 90,
  },
  aiBannerAvatar: {
    width: 82,
    height: 82,
  },
  aiSpeechBubble: {
    position: 'absolute',
    top: 0,
    right: 0,
    backgroundColor: '#007D69',
    borderRadius: 12,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  aiSpeechText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '800',
  },
  aiMiniDotsRow: {
    position: 'absolute',
    bottom: -2,
    right: 2,
    flexDirection: 'row',
    gap: 3,
  },
  aiMiniDot: {
    width: 4.5,
    height: 4.5,
    borderRadius: 2.5,
    backgroundColor: '#94A3B8',
    opacity: 0.6,
  },
  aiMiniDotActive: {
    backgroundColor: '#007D69',
    opacity: 1,
    width: 7,
  },

  // ============================================================
  // 2. SEARCH BAR
  // ============================================================
  searchBarWrapper: {
    paddingHorizontal: 16,
    marginTop: 14,
  },
  searchBarBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 14,
    paddingVertical: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
    gap: 8,
  },
  searchPlaceholder: {
    flex: 1,
    fontSize: 13,
    color: '#64748B',
    fontWeight: '500',
  },

  // ============================================================
  // 3. CARE HUB
  // ============================================================
  hubSection: {
    paddingHorizontal: 16,
    marginTop: 20,
  },
  hubHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  hubTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
  },
  hubSubtitle: {
    fontSize: 12,
    fontWeight: '500',
    color: '#64748B',
    marginTop: 1,
  },
  rewardsPillBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF0E6',
    borderWidth: 1,
    borderColor: '#FFDCC7',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 18,
    gap: 5,
  },
  rewardIconBadge: {
    width: 17,
    height: 17,
    borderRadius: 8.5,
    backgroundColor: '#EA580C',
    alignItems: 'center',
    justifyContent: 'center',
  },
  rewardsPillText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#C2410C',
  },

  // 4 CIRCULAR ACTIONS
  circularActionsRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginTop: 16,
  },
  circularActionItem: {
    alignItems: 'center',
    width: '23%',
  },
  actionCircle: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: '#E8F6F6',
    borderWidth: 1.2,
    borderColor: '#C0ECE9',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#007D69',
    shadowOffset: { width: 0, height: 1.5 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 2,
  },
  actionLabel: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#0F172A',
    textAlign: 'center',
    marginTop: 6,
    lineHeight: 15,
  },

  // HIGHLIGHT STRIP (SMART CHECKUPS & PARTNER BENEFITS)
  highlightStrip: {
    flexDirection: 'row',
    marginTop: 16,
    gap: 10,
  },
  highlightCard: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 10,
    paddingVertical: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  highlightIconSquare: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  highlightTitle: {
    fontSize: 11.5,
    fontWeight: '800',
    color: '#0F172A',
  },
  highlightSub: {
    fontSize: 10,
    fontWeight: '600',
    color: '#64748B',
    marginTop: 1,
  },

  // ============================================================
  // 4. HEALTHCARE & SERVICES
  // ============================================================
  billsSection: {
    paddingHorizontal: 16,
    marginTop: 22,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  billsSectionTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#0F172A',
  },
  viewAllLink: {
    fontSize: 12.5,
    fontWeight: '800',
    color: '#007D69',
  },
  billsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  billTile: {
    width: '23%',
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingVertical: 14,
    paddingHorizontal: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  billTileIconBox: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  billTileText: {
    fontSize: 10.5,
    fontWeight: '700',
    color: '#0F172A',
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 14,
  },

  // SUB-ROW (PRESCRIPTION + MORE)
  billsSubRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    gap: 10,
  },
  billsWidePill: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 8,
  },
  billsWidePillText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0F172A',
    flex: 1,
  },
  billsCardMiniIconBox: {
    width: 28,
    height: 28,
    borderRadius: 6,
    backgroundColor: '#E0F7F4',
    alignItems: 'center',
    justifyContent: 'center',
  },
  billsMoreBtn: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#007D69',
    paddingHorizontal: 14,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  billsMoreBtnText: {
    fontSize: 12.5,
    fontWeight: '800',
    color: '#007D69',
  },

  // ============================================================
  // 5. SPECIALIZED CARE & PROGRAMS (SINGLE BANNER CAROUSEL)
  // ============================================================
  programsSection: {
    marginTop: 22,
    paddingHorizontal: 16,
  },
  programsHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  programsTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#0F172A',
  },
  singleBannerCarouselContainer: {
    paddingHorizontal: 0,
  },
  singleProgramCard: {
    width: '100%',
    minHeight: 140,
    height: 140,
    borderRadius: 18,
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 14,
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1.5 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  programCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  programPillBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3.5,
    borderRadius: 8,
  },
  programPillText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.2,
  },
  programPrice: {
    fontSize: 12.5,
    fontWeight: '800',
    color: '#0F172A',
  },
  programCardTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
    marginTop: 2,
  },
  programCardSubtitle: {
    fontSize: 11.5,
    color: '#64748B',
    marginTop: 2,
    lineHeight: 16,
  },
  programCardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.05)',
  },
  programActionText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#007D69',
  },
  programCircleArrow: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#007D69',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // CAROUSEL PAGINATION DOTS
  carouselDotsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
    gap: 6,
  },
  carouselDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#CBD5E1',
  },
  carouselDotActive: {
    backgroundColor: '#007D69',
    width: 18,
    borderRadius: 4,
  },

  // ============================================================
  // TOAST NOTIFICATION
  // ============================================================
  toastCard: {
    position: 'absolute',
    top: 60,
    alignSelf: 'center',
    backgroundColor: '#1E293B',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
    zIndex: 9999,
  },
  toastText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },

  // ============================================================
  // MODALS
  // ============================================================
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    maxHeight: '85%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#0F172A',
  },
  modalSubtitle: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  emergencyCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 12,
    marginBottom: 10,
  },
  emergencyIconSquare: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emergencyCardTitle: {
    fontSize: 13.5,
    fontWeight: '800',
    color: '#0F172A',
  },
  emergencyCardSub: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
  },
  callPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 14,
    gap: 4,
  },
  callPillText: {
    fontSize: 12,
    fontWeight: '800',
  },

  // CITY MODAL
  cityModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  cityModalCard: {
    width: '100%',
    maxWidth: 380,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
  },
  cityModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cityModalTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
  },
  cityModalSub: {
    fontSize: 11.5,
    color: '#64748B',
    marginTop: 4,
    marginBottom: 14,
  },
  cityList: {
    gap: 8,
  },
  cityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 12,
    backgroundColor: '#F8FAFC',
    gap: 10,
  },
  cityItemActive: {
    backgroundColor: '#E0F7F4',
    borderWidth: 1,
    borderColor: '#99F6E4',
  },
  cityItemText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#334155',
  },
  cityItemTextActive: {
    color: '#007D69',
    fontWeight: '800',
  },
  cityGpsOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F0FDF4',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#BBF7D0',
    paddingVertical: 10,
    marginTop: 14,
    gap: 6,
  },
  cityGpsOptionText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#007D69',
  },

  // WALLET MODAL
  walletCard: {
    backgroundColor: '#007D69',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  walletCardLabel: {
    fontSize: 11,
    color: '#A7F3D0',
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  walletCardVal: {
    fontSize: 26,
    fontWeight: '900',
    color: '#FFFFFF',
    marginTop: 4,
  },
  walletCardPts: {
    fontSize: 12,
    color: '#E6F8F4',
    marginTop: 6,
    fontWeight: '600',
  },
  walletModalSectionLabel: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 10,
  },
  topUpChipsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  topUpChip: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    paddingVertical: 10,
    alignItems: 'center',
  },
  topUpChipActive: {
    backgroundColor: '#E0F7F4',
    borderColor: '#007D69',
  },
  topUpChipText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#334155',
  },
  topUpChipTextActive: {
    color: '#007D69',
  },
  addMoneyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#007D69',
    borderRadius: 14,
    paddingVertical: 12,
    gap: 6,
  },
  addMoneyBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
  },
});

export default HomeScreen;
