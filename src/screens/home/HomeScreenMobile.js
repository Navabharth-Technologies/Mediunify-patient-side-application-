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
  Keyboard,
  KeyboardAvoidingView,
  TouchableWithoutFeedback,
  FlatList,
  useWindowDimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { showAlert } from '../../utils/alert';
import { requestLocationPermissionWebSafe, getCurrentPositionWebSafe, reverseGeocodeWebSafe } from '../../utils/locationHelper';

import colors from '../../theme/colors';
import { useCart } from '../../context/CartContext';
import doctors from '../../data/doctors';
import { radiologyLabs } from '../../data/radiologyLabsData';
import { labPackages, consultationServices, moreServices } from '../../data/homeData';

const CITIES = ['Mysuru', 'Bengaluru', 'Mangaluru', 'Hubballi', 'Belagavi'];

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


const SEARCH_KEYWORD_DICTIONARY = [
  // Doctors & Specialists
  { query: 'General Physician', label: 'General Physician (Fever, Cold, Cough)', category: 'Doctor', icon: 'person', route: 'DoctorList', aliases: ['dr', 'physician', 'fever', 'cold', 'cough', 'headache', 'general doctor', 'doc', 'docter', 'clinic'] },
  { query: 'Cardiologist', label: 'Cardiologist (Heart Care & ECG)', category: 'Doctor', icon: 'heart', route: 'DoctorList', aliases: ['cardio', 'heart', 'cardiology', 'ecg', 'bp', 'cardiologists', 'chest pain', 'cardiac'] },
  { query: 'Dermatologist', label: 'Dermatologist (Skin & Hair Care)', category: 'Doctor', icon: 'sparkles', route: 'DoctorList', aliases: ['skin', 'derma', 'dermatology', 'hair fall', 'acne', 'rash', 'dermitologist', 'eczema'] },
  { query: 'Pediatrician', label: 'Pediatrician (Child & Baby Care)', category: 'Doctor', icon: 'happy', route: 'DoctorList', aliases: ['child', 'baby', 'kids', 'pediatric', 'pedia', 'vaccination', 'infant', 'newborn'] },
  { query: 'Gynecologist', label: 'Gynecologist (Women Health & Pregnancy)', category: 'Doctor', icon: 'woman', route: 'DoctorList', aliases: ['gynae', 'gyno', 'women', 'pregnancy', 'period', 'gynecology'] },
  { query: 'Orthopedic', label: 'Orthopedic (Bone & Joint Pain)', category: 'Doctor', icon: 'fitness', route: 'DoctorList', aliases: ['ortho', 'bone', 'joint', 'knee pain', 'fracture', 'back pain'] },
  { query: 'Online Video Consult', label: 'Video Consult (Instant 10 Min Call)', category: 'Doctor', icon: 'videocam', route: 'VideoConsultation', aliases: ['video call', 'online consult', 'teleconsult', 'video doctor'] },

  // Medicines & Pharmacy
  { query: 'Dolo 650', label: 'Dolo 650mg Tablet (Paracetamol)', category: 'Medicine', icon: 'medkit', route: 'Pharmacy', aliases: ['dolo', 'paracetamol', 'fever tablet', 'dola', 'dolo650', 'paracetmol', 'crocin', 'calpol'] },
  { query: 'Azithromycin', label: 'Azithromycin 500mg Antibiotic', category: 'Medicine', icon: 'medkit', route: 'Pharmacy', aliases: ['azithro', 'azithral', 'antibiotic', 'throat', 'infection'] },
  { query: 'Vitamin C & Zinc', label: 'Vitamin C + Zinc Chewable Tablets', category: 'Medicine', icon: 'medkit', route: 'Pharmacy', aliases: ['vitamin c', 'limcee', 'immunity', 'zinc', 'vitamind', 'vitamins', 'multivitamin'] },
  { query: 'Pantocid 40', label: 'Pantocid 40mg (Acidity & Gas Relief)', category: 'Medicine', icon: 'medkit', route: 'Pharmacy', aliases: ['acidity', 'gas', 'pantoprazole', 'pan d', 'digene', 'antacid'] },
  { query: 'Online Pharmacy', label: 'Order Medicines (Flat 20% OFF)', category: 'Medicine', icon: 'medkit', route: 'Pharmacy', aliases: ['medicine', 'pharmacy', 'tablets', 'syrup', 'medicines', 'capsules', 'drugs'] },

  // Lab Tests & Diagnostic Packages
  { query: 'Complete Blood Count (CBC)', label: 'Complete Blood Count (CBC Test)', category: 'Lab Test', icon: 'flask', route: 'LabBooking', aliases: ['cbc', 'blood test', 'hemoglobin', 'platelets', 'wbc', 'rbc', 'blood'] },
  { query: 'Thyroid Profile', label: 'Thyroid Profile Total (T3, T4, TSH)', category: 'Lab Test', icon: 'flask', route: 'LabBooking', aliases: ['thyroid', 'tsh', 't3', 't4', 'thyrod', 'thyrocare'] },
  { query: 'Diabetes HbA1c', label: 'Diabetes HbA1c & Fasting Glucose', category: 'Lab Test', icon: 'flask', route: 'LabBooking', aliases: ['diabetes', 'sugar test', 'glucose', 'hba1c', 'fasting sugar', 'diabtes', 'suger'] },
  { query: 'Lipid Profile', label: 'Lipid Profile (Cholesterol Check)', category: 'Lab Test', icon: 'flask', route: 'LabBooking', aliases: ['lipid', 'cholesterol', 'triglycerides', 'heart test'] },
  { query: 'Full Body Health Checkup', label: 'Comprehensive Full Body Checkup (82 Tests)', category: 'Lab Test', icon: 'flask', route: 'LabBooking', aliases: ['full body', 'health package', 'master checkup', 'body test', 'checkup'] },

  // Scans & Radiology
  { query: 'MRI Scan Brain / Spine', label: 'MRI Scan (Brain, Spine, Joints)', category: 'Scan', icon: 'scan', route: 'Radiology', aliases: ['mri', 'mri scan', 'magnetic resonance', 'mri brain', 'mri spine'] },
  { query: 'CT Scan Chest / Abdomen', label: 'CT Scan (Chest, Abdomen, Head)', category: 'Scan', icon: 'scan', route: 'Radiology', aliases: ['ct scan', 'computed tomography', 'ct chest', 'hrct'] },
  { query: 'Digital X-Ray', label: 'Digital X-Ray (Chest, Bones, Joint)', category: 'Scan', icon: 'scan', route: 'Radiology', aliases: ['xray', 'x ray', 'chest xray', 'bone xray'] },
  { query: 'Ultrasound Scan', label: 'Ultrasound Sonography (USG)', category: 'Scan', icon: 'scan', route: 'Radiology', aliases: ['ultrasound', 'usg', 'sonography', 'abdomen usg', 'scan'] },

  // Care & Services
  { query: 'Home Nursing Care', label: 'Home Nursing & Attendant Care', category: 'Service', icon: 'bandage', route: 'NurseBooking', aliases: ['nurse', 'nursing', 'elderly care', 'attendant', 'home care', 'injection at home', 'nurce'] },
  { query: 'Ambulance SOS', label: 'Emergency 24/7 Ambulance SOS', category: 'Service', icon: 'car', route: 'Ambulance', aliases: ['ambulance', 'emergency', 'sos', 'urgent', '108', 'emergeny', 'ambulanc'] },
  { query: 'Ayurveda & Wellness', label: 'Ayurveda & Panchakarma (Nadi Pariksha)', category: 'Service', icon: 'leaf', route: 'AyurvedaWellness', aliases: ['ayurveda', 'ayurvedic', 'panchakarma', 'vaidya', 'nadi pariksha', 'shirodhara', 'abhyanga', 'dosha', 'vata', 'pitta', 'kapha', 'herbal', 'shilajit', 'ashwagandha'] },
  { query: 'Fertility & IVF Care', label: 'Fertility & IVF Specialists (0% EMI)', category: 'Service', icon: 'heart', route: 'FertilityIvf', aliases: ['fertility', 'ivf', 'iui', 'icsi', 'pregnancy', 'conceive', 'egg freezing', 'sperm', 'semen analysis', 'infertility', 'andrology', 'baby planning'] },
  { query: 'Medical Equipment Rental', label: 'Equipment Rental (Hospital Beds, Oxygen, Wheelchairs)', category: 'Service', icon: 'fitness', route: 'EquipmentRental', aliases: ['equipment', 'rental', 'wheelchair', 'oxygen', 'oxygen concentrator', 'hospital bed', 'bipap', 'cpap', 'walker', 'patient bed', 'medical equipment'] },
];

const COMMON_TYPOS_MAP = {
  dola: 'Dolo 650',
  dolo650: 'Dolo 650',
  paracetmol: 'Dolo 650 (Paracetamol)',
  paracitamol: 'Dolo 650 (Paracetamol)',
  crocin: 'Dolo 650',
  docter: 'General Physician',
  doctur: 'General Physician',
  doc: 'General Physician',
  cardio: 'Cardiologist',
  dermitologist: 'Dermatologist',
  pedia: 'Pediatrician',
  pediatric: 'Pediatrician',
  thyrod: 'Thyroid Profile',
  diabtes: 'Diabetes HbA1c',
  sugartest: 'Diabetes HbA1c',
  suger: 'Diabetes HbA1c',
  xray: 'Digital X-Ray',
  scane: 'MRI & CT Scan',
  nurce: 'Home Nursing Care',
  emergeny: 'Ambulance SOS',
  ambulanc: 'Ambulance SOS',
};

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

const MOBILE_HERO_ADS = [
  {
    id: 'm-ad-1',
    pillText: 'HEALTH CHECK',
    pillBg: '#FFE11B',
    pillColor: '#0F172A',
    title: 'Full Body Health Checkup',
    priceText: 'From ₹999*',
    priceColor: '#0071DC',
    subTitle: '68 Vital Tests • Free Home Sample Pickup',
    badgeText: 'Digital Reports in 12h',
    bgColor: '#FDF7E7',
    image: 'https://images.unsplash.com/photo-1579154204601-01588f351e67?w=400',
    route: 'LabTests',
  },
  {
    id: 'm-ad-2',
    pillText: '60-MIN EXPRESS',
    pillBg: '#EA580C',
    pillColor: '#FFFFFF',
    title: 'Doorstep Medicines',
    priceText: 'Flat 20% OFF',
    priceColor: '#EA580C',
    subTitle: '100% Genuine Branded Drugs & Jan Aushadhi',
    badgeText: 'Order with Prescription',
    bgColor: '#FFF7ED',
    image: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=400',
    route: 'Pharmacy',
  },
  {
    id: 'm-ad-3',
    pillText: 'VERIFIED DOCTORS',
    pillBg: '#2563EB',
    pillColor: '#FFFFFF',
    title: 'Instant Video Consult',
    priceText: 'From ₹299*',
    priceColor: '#38BDF8',
    titleColor: '#FFFFFF',
    subColor: '#94A3B8',
    subTitle: 'Zero Waiting • Top Specialists across Karnataka',
    badgeText: 'Connect in 10 mins',
    bgColor: '#0B0F19',
    image: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=400',
    route: 'VideoConsultation',
  },
  {
    id: 'm-ad-4',
    pillText: '3T SCANS & CARDIOLOGY',
    pillBg: '#7C3AED',
    pillColor: '#FFFFFF',
    title: 'Scans & 2D Echo Tests',
    priceText: 'Up to 40% OFF',
    priceColor: '#7C3AED',
    subTitle: '2D Echo, 12-Lead ECG, 3T MRI & CT Scans',
    badgeText: 'Instant Slot Confirmation',
    bgColor: '#FAF5FF',
    image: 'https://images.unsplash.com/photo-1516549655169-df83a0774514?w=400',
    route: 'RadiologyLabs',
  },
  {
    id: 'm-ad-5',
    pillText: 'CASHLESS CARE',
    pillBg: '#059669',
    pillColor: '#FFFFFF',
    title: 'Health Insurance Claims',
    priceText: 'Zero Deposit',
    priceColor: '#059669',
    subTitle: 'Pre-Approved Hospitalization & Instant E-Card',
    badgeText: '100% Cashless Support',
    bgColor: '#ECFDF5',
    image: 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=400',
    route: 'HealthInsurance',
  },
  {
    id: 'm-ad-6',
    pillText: 'AYUSH VAIDYA',
    pillBg: '#059669',
    pillColor: '#FFFFFF',
    title: 'Ayurveda & Panchakarma',
    priceText: 'From ₹400',
    priceColor: '#059669',
    subTitle: 'Nadi Pariksha, Shirodhara & Classical Therapies',
    badgeText: 'AYUSH Certified',
    bgColor: '#F0FDF4',
    image: 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=400',
    route: 'AyurvedaWellness',
  },
  {
    id: 'm-ad-7',
    pillText: 'IVF & FERTILITY',
    pillBg: '#DB2777',
    pillColor: '#FFFFFF',
    title: 'Fertility & IVF Care',
    priceText: '0% EMI Plans',
    priceColor: '#DB2777',
    subTitle: 'High 73% Success Rate • Confidential Guidance',
    badgeText: 'Zero Cost EMI',
    bgColor: '#FDF2F8',
    image: 'https://images.unsplash.com/photo-1584515979956-d9f6e5d09982?w=400',
    route: 'FertilityIvf',
  },
  {
    id: 'm-ad-8',
    pillText: 'EQUIPMENT RENTAL',
    pillBg: '#7C3AED',
    pillColor: '#FFFFFF',
    title: 'Hospital Beds & Oxygen',
    priceText: 'From ₹80/day',
    priceColor: '#7C3AED',
    subTitle: 'Electric ICU Beds, 10L Oxygen & Wheelchairs',
    badgeText: 'Free Setup in 4h',
    bgColor: '#FAF5FF',
    image: 'https://images.unsplash.com/photo-1516549655169-df83a0774514?w=400',
    route: 'EquipmentRental',
  },
];

const HomeScreen = ({ navigation }) => {
  const { totalCartCount } = useCart();
  const { width } = useWindowDimensions();

  // Auto-scrolling ads state & ref
  const [activeMobileAdIndex, setActiveMobileAdIndex] = useState(0);
  const mobileAdScrollRef = useRef(null);

  useEffect(() => {
    const timer = setInterval(() => {
      setActiveMobileAdIndex((prev) => {
        const next = (prev + 1) % MOBILE_HERO_ADS.length;
        if (mobileAdScrollRef.current) {
          try {
            mobileAdScrollRef.current.scrollToIndex({ index: next, animated: true });
          } catch (e) {}
        }
        return next;
      });
    }, 3500);
    return () => clearInterval(timer);
  }, []);

  // State
  const [search, setSearch] = useState('');
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [userName, setUserName] = useState('Ramesh');
  const [selectedCity, setSelectedCity] = useState('Mysuru');
  const [locationName, setLocationName] = useState('Mysuru');
  const [locationModalVisible, setLocationModalVisible] = useState(false);
  const [loadingLocation, setLoadingLocation] = useState(false);
  const [locationToast, setLocationToast] = useState(null);

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
      // 1. Check for active selected family member profile
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
      }
      const savedWallet = await AsyncStorage.getItem('@unnathi_wallet_balance');
      if (savedWallet) {
        setWalletBalance(parseInt(savedWallet, 10) || 1250);
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
    showToast(`₹${num.toLocaleString('en-IN')} added to Wallet!`);
  };

  // GPS Location Fetch
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
        const matchedCity = CITIES.find((c) => rawCity.toLowerCase().includes(c.toLowerCase().slice(0, 4))) || rawCity;
        setSelectedCity(matchedCity);
        setLocationName(matchedCity);
        await AsyncStorage.setItem('@mediunify_selected_city', matchedCity);
        await AsyncStorage.setItem('@unnathi_user_location', matchedCity);
        try {
          await AsyncStorage.setItem('@unnathi_user_coords', JSON.stringify({
            latitude: loc.coords.latitude,
            longitude: loc.coords.longitude,
          }));
        } catch (e) {}
        setLocationModalVisible(false);
        showToast(`City set to ${matchedCity}`);
      }
      setLoadingLocation(false);
    } catch (e) {
      setLoadingLocation(false);
      showAlert('Location Error', 'Could not detect GPS location. Please select your city from the list.');
    }
  };

  // Filtered live keyword suggestions & typo auto-corrections
  const searchSuggestions = useMemo(() => {
    const raw = search.trim().toLowerCase();
    if (!raw) return { typoSuggestion: null, matches: [] };

    // 1. Check for common typo auto-correction
    let typoSuggestion = null;
    const cleanWord = raw.replace(/[^a-z0-9]/g, '');
    if (COMMON_TYPOS_MAP[raw] || COMMON_TYPOS_MAP[cleanWord]) {
      typoSuggestion = COMMON_TYPOS_MAP[raw] || COMMON_TYPOS_MAP[cleanWord];
    }

    // 2. Keyword & semantic matches
    const matches = SEARCH_KEYWORD_DICTIONARY.filter((item) => {
      const qLower = item.query.toLowerCase();
      const lLower = item.label.toLowerCase();
      const cLower = item.category.toLowerCase();
      if (qLower.includes(raw) || lLower.includes(raw) || cLower.includes(raw)) return true;
      if (item.aliases.some((alias) => alias.includes(raw) || raw.includes(alias))) return true;
      return false;
    }).slice(0, 5);

    return { typoSuggestion, matches };
  }, [search]);

  // Handle Search Execution
  const handleSearchSubmit = (customQuery) => {
    const q = typeof customQuery === 'string' ? customQuery : search;
    setIsSearchFocused(false);
    navigation.navigate('GlobalSearch', { query: q ? q.trim() : '' });
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* ==========================================
      {/* ==========================================
          TOP APP BAR (LOGO, NAME, LOCATION, WALLET, NOTIFS, CART)
      ========================================== */}
      <View style={styles.topBar}>
        {/* BRAND LOGO & LOCATION SELECTOR (LEFT) */}
        <View style={styles.brandHeaderLeft}>
          <Image
            source={require('../../../assets/logo.png')}
            style={styles.brandLogoImg}
            resizeMode="contain"
          />
          <TouchableOpacity
            style={styles.mockupLocationPill}
            onPress={() => setLocationModalVisible(true)}
            activeOpacity={0.8}
          >
            <Ionicons name="location" size={13} color="#0D9488" />
            <Text style={styles.mockupLocationText} numberOfLines={1}>
              {selectedCity || locationName || 'Mysuru'}
            </Text>
            <Ionicons name="chevron-down" size={11} color="#64748B" />
          </TouchableOpacity>
        </View>

        {/* RIGHT ACTIONS: WALLET, NOTIFICATION BELL & USER AVATAR */}
        <View style={styles.topBarRight}>
          <TouchableOpacity
            style={styles.walletPill}
            onPress={() => setWalletModalVisible(true)}
            activeOpacity={0.85}
          >
            <Ionicons name="wallet-outline" size={15} color={colors.primary} />
            <Text style={styles.walletPillText}>₹{walletBalance}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.iconCircle}
            onPress={() => navigation.navigate('Notifications')}
            activeOpacity={0.85}
          >
            <Ionicons name="notifications-outline" size={20} color="#1E293B" />
            <View style={styles.notifBadgeDot} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.homeUserAvatarWrap}
            onPress={() => navigation.navigate('Profile')}
            activeOpacity={0.85}
          >
            <View style={styles.homeUserAvatarCircle}>
              <Text style={styles.homeUserAvatarLetter}>
                {userName?.trim()?.charAt(0)?.toUpperCase() || 'U'}
              </Text>
            </View>
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

        {/* ============================================================
            MOCKUP 1: GREETING BLOCK
        ============================================================ */}
        <View style={styles.mockupGreetingBlock}>
          <Text style={styles.mockupGreetingTitle}>Good Morning,</Text>
          <Text style={styles.mockupGreetingSub}>Your health matters. We're here for you.</Text>
        </View>

        {/* ============================================================
            MOCKUP 1: ASK MEDIUNIFY AI BANNER
        ============================================================ */}
        <View style={styles.mockupAiCard}>
          <View style={styles.mockupAiLeft}>
            <Text style={styles.mockupAiTitle}>Ask MediUnify AI</Text>
            <Text style={styles.mockupAiSub}>Tell us what you're experiencing.</Text>
            <TouchableOpacity
              style={styles.mockupAiChatBtn}
              onPress={() => navigation.navigate('Chatbot')}
              activeOpacity={0.85}
            >
              <Text style={styles.mockupAiChatBtnText}>Chat Now →</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.mockupAiRobotCircle}>
            <Ionicons name="chatbubble-ellipses" size={38} color="#0D9488" />
          </View>
        </View>

        {/* HOMESCREEN SEARCH BAR (BELOW CHAT NOW) */}
        <View style={styles.homeSearchBarContainer}>
          <TouchableOpacity
            style={styles.homeSearchBox}
            activeOpacity={0.88}
            onPress={() => navigation.navigate('GlobalSearch')}
          >
            <Ionicons name="search-outline" size={20} color="#64748B" />
            <Text style={styles.homeSearchPlaceholder}>
              Search doctors, medicines, tests, clinics...
            </Text>
            <View style={styles.homeSearchMicBtn}>
              <Ionicons name="mic-outline" size={17} color="#0D9488" />
            </View>
          </TouchableOpacity>
        </View>

        {/* QUICK SYMPTOM CHIPS */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.mockupSymptomChipsRow}
        >
          {['e.g. fever', 'knee pain', 'diabetes', 'skin problem'].map((chip, idx) => (
            <TouchableOpacity
              key={idx}
              style={styles.mockupSymptomChip}
              onPress={() => navigation.navigate('Chatbot', { initialQuery: chip.replace('e.g. ', '') })}
              activeOpacity={0.8}
            >
              <Text style={styles.mockupSymptomChipText}>{chip}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* ============================================================
            AUTO-MOVING PROMOTIONAL ADS CAROUSEL
        ============================================================ */}
        <View style={styles.mobileAdSection}>
          <FlatList
            ref={mobileAdScrollRef}
            data={MOBILE_HERO_ADS}
            keyExtractor={(item) => item.id}
            horizontal
            showsHorizontalScrollIndicator={false}
            pagingEnabled
            snapToInterval={width - 32}
            decelerationRate="fast"
            onMomentumScrollEnd={(e) => {
              const idx = Math.round(e.nativeEvent.contentOffset.x / (width - 32));
              if (idx >= 0 && idx < MOBILE_HERO_ADS.length) {
                setActiveMobileAdIndex(idx);
              }
            }}
            getItemLayout={(data, index) => ({
              length: width - 32,
              offset: (width - 32) * index,
              index,
            })}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[
                  styles.mobileAdCard,
                  {
                    width: width - 32,
                    backgroundColor: item.bgColor,
                  },
                ]}
                onPress={() => navigation.navigate(item.route)}
                activeOpacity={0.92}
              >
                <View style={styles.mobileAdBadgeRow}>
                  <View style={[styles.mobileAdPill, { backgroundColor: item.pillBg }]}>
                    <Text style={[styles.mobileAdPillText, { color: item.pillColor }]}>{item.pillText}</Text>
                  </View>
                  <Text style={styles.mobileAdNotice}>AD</Text>
                </View>

                <Text style={[styles.mobileAdTitle, item.titleColor ? { color: item.titleColor } : null]}>
                  {item.title}{'\n'}
                  <Text style={{ color: item.priceColor }}>{item.priceText}</Text>
                </Text>

                <Text
                  style={[styles.mobileAdSub, item.subColor ? { color: item.subColor } : null]}
                  numberOfLines={2}
                >
                  {item.subTitle}
                </Text>

                <View style={styles.mobileAdCtaRow}>
                  <Text style={[styles.mobileAdCtaBadge, { color: item.priceColor }]}>
                    {item.badgeText} →
                  </Text>
                </View>

                <Image
                  source={{ uri: item.image }}
                  style={styles.mobileAdImg}
                  resizeMode="cover"
                />
              </TouchableOpacity>
            )}
          />

          {/* Carousel Pagination Dots */}
          <View style={styles.mobileAdDotsRow}>
            {MOBILE_HERO_ADS.map((_, i) => (
              <TouchableOpacity
                key={i}
                onPress={() => {
                  setActiveMobileAdIndex(i);
                  try {
                    mobileAdScrollRef.current?.scrollToIndex({ index: i, animated: true });
                  } catch (err) {}
                }}
                activeOpacity={0.7}
              >
                <View
                  style={[
                    styles.mobileAdDot,
                    activeMobileAdIndex === i && styles.mobileAdDotActive,
                  ]}
                />
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* ============================================================
            CARE+ VIP MEMBERSHIP MOBILE BANNER
        ============================================================ */}
        <TouchableOpacity
          style={styles.mobileVipBanner}
          onPress={() => navigation.navigate('Membership')}
          activeOpacity={0.88}
        >
          <View style={styles.mobileVipLeft}>
            <View style={styles.mobileVipBadgeRow}>
              <View style={styles.mobileVipCrownPill}>
                <Ionicons name="ribbon" size={12} color="#B45309" />
                <Text style={styles.mobileVipCrownText}>CARE+ VIP</Text>
              </View>
              <Text style={styles.mobileVipSavingsNotice}>Save up to ₹10,000/yr</Text>
            </View>
            <Text style={styles.mobileVipTitle}>
              Extra 15% OFF + Free Doctor Calls
            </Text>
            <Text style={styles.mobileVipSub}>
              Free 60m medicine delivery & lab checkup vouchers
            </Text>
          </View>
          <View style={styles.mobileVipRight}>
            <View style={styles.mobileVipCtaCircle}>
              <Ionicons name="arrow-forward" size={18} color="#FFFFFF" />
            </View>
            <Text style={styles.mobileVipStartingPrice}>From ₹165</Text>
          </View>
        </TouchableOpacity>

        {/* ============================================================
            MOCKUP 1: 3x3 QUICK SERVICES GRID
        ============================================================ */}
        <View style={styles.mockupServicesGrid}>
          {/* 1. Consult a Doctor */}
          <TouchableOpacity
            style={styles.mockupServiceTile}
            onPress={() => navigation.navigate('DoctorList')}
            activeOpacity={0.8}
          >
            <View style={[styles.mockupServiceIconBox, { backgroundColor: '#E0F2FE' }]}>
              <Ionicons name="person" size={24} color="#0284C7" />
            </View>
            <Text style={styles.mockupServiceLabel}>Consult a{'\n'}Doctor</Text>
          </TouchableOpacity>

          {/* 2. Book a Lab Test */}
          <TouchableOpacity
            style={styles.mockupServiceTile}
            onPress={() => navigation.navigate('LabTests')}
            activeOpacity={0.8}
          >
            <View style={[styles.mockupServiceIconBox, { backgroundColor: '#F0FDF4' }]}>
              <Ionicons name="flask" size={24} color="#16A34A" />
            </View>
            <Text style={styles.mockupServiceLabel}>Book{'\n'}a Lab Test</Text>
          </TouchableOpacity>

          {/* 3. Order Medicines */}
          <TouchableOpacity
            style={styles.mockupServiceTile}
            onPress={() => navigation.navigate('Pharmacy')}
            activeOpacity={0.8}
          >
            <View style={[styles.mockupServiceIconBox, { backgroundColor: '#FFF7ED' }]}>
              <Ionicons name="medkit" size={24} color="#EA580C" />
            </View>
            <Text style={styles.mockupServiceLabel}>Order{'\n'}Medicines</Text>
          </TouchableOpacity>

          {/* 4. Video Call */}
          <TouchableOpacity
            style={styles.mockupServiceTile}
            onPress={() => navigation.navigate('VideoConsultation')}
            activeOpacity={0.8}
          >
            <View style={[styles.mockupServiceIconBox, { backgroundColor: '#EFF6FF' }]}>
              <Ionicons name="videocam" size={24} color="#2563EB" />
            </View>
            <Text style={styles.mockupServiceLabel}>Video{'\n'}Call</Text>
          </TouchableOpacity>

          {/* 5. Home Nursing */}
          <TouchableOpacity
            style={styles.mockupServiceTile}
            onPress={() => navigation.navigate('NurseBooking')}
            activeOpacity={0.8}
          >
            <View style={[styles.mockupServiceIconBox, { backgroundColor: '#F0FDFA' }]}>
              <Ionicons name="home" size={24} color="#0D9488" />
            </View>
            <Text style={styles.mockupServiceLabel}>Home{'\n'}Nursing</Text>
          </TouchableOpacity>

          {/* 6. Equipment Rental */}
          <TouchableOpacity
            style={styles.mockupServiceTile}
            onPress={() => navigation.navigate('EquipmentRental')}
            activeOpacity={0.8}
          >
            <View style={[styles.mockupServiceIconBox, { backgroundColor: '#FAF5FF' }]}>
              <Ionicons name="fitness" size={24} color="#7C3AED" />
            </View>
            <Text style={styles.mockupServiceLabel}>Equipment{'\n'}Rental</Text>
          </TouchableOpacity>

          {/* 7. Fertility & IVF */}
          <TouchableOpacity
            style={styles.mockupServiceTile}
            onPress={() => navigation.navigate('FertilityIvf')}
            activeOpacity={0.8}
          >
            <View style={[styles.mockupServiceIconBox, { backgroundColor: '#FDF2F8' }]}>
              <Ionicons name="heart" size={24} color="#DB2777" />
            </View>
            <Text style={styles.mockupServiceLabel}>Fertility{'\n'}& IVF</Text>
          </TouchableOpacity>

          {/* 8. Ayurveda & Wellness */}
          <TouchableOpacity
            style={styles.mockupServiceTile}
            onPress={() => navigation.navigate('AyurvedaWellness')}
            activeOpacity={0.8}
          >
            <View style={[styles.mockupServiceIconBox, { backgroundColor: '#ECFDF5' }]}>
              <Ionicons name="leaf" size={24} color="#059669" />
            </View>
            <Text style={styles.mockupServiceLabel}>Ayurveda &{'\n'}Wellness</Text>
          </TouchableOpacity>

          {/* 9. View All Services */}
          <TouchableOpacity
            style={styles.mockupServiceTile}
            onPress={() => navigation.navigate('AllServices')}
            activeOpacity={0.8}
          >
            <View style={[styles.mockupServiceIconBox, { backgroundColor: '#EEF2FF' }]}>
              <Ionicons name="apps" size={24} color="#4F46E5" />
            </View>
            <Text style={styles.mockupServiceLabel}>View{'\n'}All</Text>
          </TouchableOpacity>
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>

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
          </View>
        </View>
      </Modal>

      {/* ==========================================
          SELECT YOUR CITY MODAL (EXACT SPEC MATCH)
      ========================================== */}
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
              <TouchableOpacity
                onPress={() => setLocationModalVisible(false)}
                hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
              >
                <Ionicons name="close" size={20} color="#64748B" />
              </TouchableOpacity>
            </View>

            <Text style={styles.cityModalSub}>
              Services & home collection available across Karnataka
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
                      color={isSelected ? '#00A389' : '#64748B'}
                    />
                    <Text
                      style={[
                        styles.cityItemText,
                        isSelected && styles.cityItemTextActive,
                      ]}
                    >
                      {city}
                    </Text>
                    {isSelected && (
                      <Ionicons
                        name="checkmark-circle"
                        size={18}
                        color="#00A389"
                        style={{ marginLeft: 'auto' }}
                      />
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* GPS QUICK DETECT OPTION */}
            <TouchableOpacity
              style={styles.cityGpsOption}
              onPress={handleDetectGPSLocation}
              disabled={loadingLocation}
              activeOpacity={0.8}
            >
              {loadingLocation ? (
                <ActivityIndicator size="small" color="#00A389" />
              ) : (
                <>
                  <Ionicons name="locate" size={16} color="#00A389" />
                  <Text style={styles.cityGpsOptionText}>Use Current GPS Location</Text>
                </>
              )}
            </TouchableOpacity>
          </TouchableOpacity>
        </TouchableOpacity>
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
    paddingBottom: 10,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  brandHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 8,
  },
  brandLogoImg: {
    width: 38,
    height: 38,
    borderRadius: 10,
    marginRight: 10,
  },
  headerUserLocationWrap: {
    justifyContent: 'center',
    flex: 1,
  },
  headerUserName: {
    fontSize: 14,
    fontWeight: '900',
    color: '#0F172A',
    letterSpacing: -0.2,
  },
  headerLocationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    marginTop: 2,
  },
  headerLocationText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#64748B',
    maxWidth: 155,
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

  // SEARCH BAR
  searchContainer: {
    paddingHorizontal: 16,
    marginTop: 12,
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
  searchBarFocused: {
    borderColor: colors.primary,
    backgroundColor: '#FAFCFF',
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
  suggestionsDropdownContainer: {
    marginTop: 6,
    gap: 6,
  },
  typoCorrectionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FEF3C7',
    borderWidth: 1,
    borderColor: '#FDE68A',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  typoCorrectionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    flex: 1,
  },
  typoCorrectionLabel: {
    fontSize: 11.5,
    color: '#92400E',
    fontWeight: '600',
  },
  typoCorrectionKeyword: {
    fontSize: 12,
    color: '#78350F',
    fontWeight: '900',
  },
  typoApplyBadge: {
    backgroundColor: '#F59E0B',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  typoApplyBadgeText: {
    fontSize: 10.5,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  suggestionsListCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 3,
  },
  suggestionItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  suggestionItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
    marginRight: 8,
  },
  suggestionCategoryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#F0FDFA',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#CCFBF1',
  },
  suggestionCategoryText: {
    fontSize: 10,
    fontWeight: '800',
    color: colors.primary,
  },
  suggestionTitleText: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#1E293B',
    flex: 1,
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

  // LIVE MAP PICKER BUTTON
  liveMapPickBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0FDFA',
    padding: 12,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#99F6E4',
    marginBottom: 10,
  },
  liveMapIconBox: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 3,
  },
  liveMapBtnTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0F766E',
  },
  liveMapBtnSub: {
    fontSize: 11,
    color: '#0D9488',
    marginTop: 2,
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

  // HOMESCREEN SEARCH BAR (BELOW CHAT NOW)
  homeSearchBarContainer: {
    paddingHorizontal: 16,
    marginTop: 10,
    marginBottom: 10,
  },
  homeSearchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    paddingHorizontal: 14,
    height: 48,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 5,
    elevation: 2,
  },
  homeSearchPlaceholder: {
    flex: 1,
    marginLeft: 10,
    fontSize: 13.5,
    color: '#94A3B8',
    fontWeight: '500',
  },
  homeSearchMicBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#F0FDFA',
    justifyContent: 'center',
    alignItems: 'center',
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

  // AUTO-SCROLLING MOBILE ADS BANNER
  mobileAdSection: {
    marginHorizontal: 16,
    marginTop: 4,
    marginBottom: 16,
  },
  mobileAdCard: {
    borderRadius: 16,
    padding: 16,
    minHeight: 140,
    justifyContent: 'space-between',
    position: 'relative',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  mobileAdBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
    maxWidth: '65%',
  },
  mobileAdPill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 5,
  },
  mobileAdPillText: {
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.3,
  },
  mobileAdNotice: {
    fontSize: 9,
    fontWeight: '800',
    color: '#94A3B8',
  },
  mobileAdTitle: {
    fontSize: 16,
    fontWeight: '900',
    color: '#0F172A',
    lineHeight: 21,
    maxWidth: '65%',
    letterSpacing: -0.3,
  },
  mobileAdSub: {
    fontSize: 11.5,
    color: '#64748B',
    fontWeight: '500',
    marginTop: 2,
    maxWidth: '65%',
  },
  mobileAdCtaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 8,
  },
  mobileAdCtaBadge: {
    fontSize: 11.5,
    fontWeight: '800',
  },
  mobileAdImg: {
    position: 'absolute',
    right: -10,
    bottom: -10,
    width: 120,
    height: 130,
    borderRadius: 14,
    opacity: 0.88,
  },
  mobileAdDotsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
    marginTop: 10,
  },
  mobileAdDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#CBD5E1',
  },
  mobileAdDotActive: {
    width: 18,
    backgroundColor: colors.primary,
  },

  // MOCKUP SCREEN 1 STYLES
  mockupLocationPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#F0FDFA',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#CCFBF1',
  },
  mockupLocationText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0F766E',
    maxWidth: 110,
  },
  // CITY MODAL STYLES (MATCHING WEB POPUP)
  cityModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  cityModalCard: {
    width: '100%',
    maxWidth: 380,
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 22,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 8,
  },
  cityModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  cityModalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
    letterSpacing: -0.2,
  },
  cityModalSub: {
    fontSize: 12.5,
    color: '#64748B',
    marginBottom: 16,
    lineHeight: 17,
  },
  cityList: {
    gap: 8,
  },
  cityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 10,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  cityItemActive: {
    backgroundColor: '#F0F9FF',
    borderColor: '#00A389',
    borderWidth: 1.5,
  },
  cityItemText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1E3A8A',
  },
  cityItemTextActive: {
    color: '#00A389',
    fontWeight: '800',
  },
  cityGpsOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  cityGpsOptionText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#00A389',
  },
  homeUserAvatarWrap: {
    marginLeft: 4,
  },
  homeUserAvatarCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#00B894',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
    shadowColor: '#00B894',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  homeUserAvatarLetter: {
    fontSize: 14,
    fontWeight: '900',
    color: '#FFFFFF',
  },
  mockupGreetingBlock: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
  },
  mockupGreetingTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: '#1E3A8A',
    letterSpacing: -0.4,
  },
  mockupGreetingSub: {
    fontSize: 12.5,
    color: '#64748B',
    fontWeight: '500',
    marginTop: 2,
  },
  mockupAiCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#E0F2FE',
    marginHorizontal: 16,
    marginTop: 10,
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: '#BAE6FD',
  },
  mockupAiLeft: {
    flex: 1,
  },
  mockupAiTitle: {
    fontSize: 16,
    fontWeight: '900',
    color: '#0F172A',
  },
  mockupAiSub: {
    fontSize: 11.5,
    color: '#475569',
    marginTop: 3,
    fontWeight: '500',
  },
  mockupAiChatBtn: {
    backgroundColor: '#0D9488',
    alignSelf: 'flex-start',
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 10,
    marginTop: 10,
  },
  mockupAiChatBtnText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  mockupAiRobotCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#0D9488',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 3,
    marginLeft: 10,
  },
  mockupSymptomChipsRow: {
    paddingHorizontal: 16,
    gap: 8,
    marginTop: 10,
    marginBottom: 6,
  },
  mockupSymptomChip: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  mockupSymptomChipText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#475569',
  },
  // MOBILE CARE+ VIP BANNER
  mobileVipBanner: {
    backgroundColor: '#FFFBEB',
    marginHorizontal: 16,
    marginTop: 6,
    marginBottom: 4,
    borderRadius: 16,
    padding: 14,
    borderWidth: 1.5,
    borderColor: '#FDE68A',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#D97706',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 2,
  },
  mobileVipLeft: {
    flex: 1,
    paddingRight: 10,
  },
  mobileVipBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  mobileVipCrownPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  mobileVipCrownText: {
    fontSize: 9.5,
    fontWeight: '900',
    color: '#B45309',
    letterSpacing: 0.3,
  },
  mobileVipSavingsNotice: {
    fontSize: 10.5,
    fontWeight: '700',
    color: '#15803D',
  },
  mobileVipTitle: {
    fontSize: 13.5,
    fontWeight: '900',
    color: '#0F172A',
    letterSpacing: -0.2,
  },
  mobileVipSub: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
  },
  mobileVipRight: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  mobileVipCtaCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#D97706',
    alignItems: 'center',
    justifyContent: 'center',
  },
  mobileVipStartingPrice: {
    fontSize: 9.5,
    fontWeight: '800',
    color: '#B45309',
  },

  mockupServicesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 16,
    marginTop: 14,
    gap: 8,
    justifyContent: 'space-between',
  },
  mockupServiceTile: {
    width: '31%',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 6,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#F1F5F9',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
    marginBottom: 8,
  },
  mockupServiceIconBox: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  mockupServiceLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#1E293B',
    textAlign: 'center',
    lineHeight: 14,
  },
});

export default HomeScreen;
