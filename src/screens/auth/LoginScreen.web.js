import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Image,
  useWindowDimensions,
  Platform,
  Modal,
  KeyboardAvoidingView,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import colors from '../../theme/colors';
import { syncLogin, syncRegister, autoMigrateLocalAccountsToServer } from '../../services/dataSyncService';
import { safeNavigateToMain } from '../../utils/navigationHelper';
import { showAlert } from '../../utils/alert';
import { ALL_LOCATIONS, filterLocations } from '../../data/locations';
import { FEATURED_SPECIALTIES } from '../../data/featuredSpecialties';
import SpecialtyIcon from '../../components/common/SpecialtyIcon';
import { detectAutoLocation } from '../../utils/locationHelper';
import { REMAINING_SERVICES } from '../../data/remainingServices';
import PromotionalAdsSection from '../../components/web/PromotionalAdsSection';
import WebHeader from '../../components/web/WebHeader';

// 7 Service Cards — with accent colors, badges, creative design
const HERO_CARDS = [
  {
    id: 'video-consult',
    title: 'Video Consultation',
    subtitle: 'Connect with expert doctors from the comfort of your home.',
    bgColor: '#E8F4FD',
    gradientTop: 'linear-gradient(135deg, #C9E8F8 0%, #E0F3FD 100%)',
    accentColor: '#1170CF',
    accentBg: '#E8F4FD',
    availability: "Qualified Doctor's",
    iconFamily: 'MaterialCommunityIcons',
    iconName: 'stethoscope',
    route: 'VideoConsultation',
    image: require('../../../assets/services/service_video_consult.jpg'),
  },
  {
    id: 'lab-tests',
    title: 'Lab Tests',
    subtitle: 'Get accurate results with trusted labs. Home sample pickup.',
    bgColor: '#E6F8F2',
    gradientTop: 'linear-gradient(135deg, #C2EEE2 0%, #DCF5EE 100%)',
    accentColor: '#00A878',
    accentBg: '#E6F8F2',
    availability: 'Free Home Pickup',
    iconFamily: 'Ionicons',
    iconName: 'home',
    route: 'LabTests',
    image: require('../../../assets/services/service_lab_tests.jpg'),
  },
  {
    id: 'pharmacy',
    title: 'Pharmacy',
    subtitle: 'Order medicines and healthcare essentials, delivered fast.',
    bgColor: '#F0EBFF',
    gradientTop: 'linear-gradient(135deg, #DDD4FF 0%, #EDE6FF 100%)',
    accentColor: '#6B46C1',
    accentBg: '#F0EBFF',
    availability: 'Fast Delivery',
    iconFamily: 'MaterialCommunityIcons',
    iconName: 'truck-fast',
    route: 'Pharmacy',
    image: require('../../../assets/services/service_pharmacy.jpg'),
  },
  {
    id: 'radiology',
    title: 'Scans & X-Ray',
    subtitle: 'Advanced imaging diagnostics with certified radiologists.',
    bgColor: '#E8F4FD',
    gradientTop: 'linear-gradient(135deg, #BFD8F0 0%, #D8ECFA 100%)',
    accentColor: '#1E3A8A',
    accentBg: '#E8F4FD',
    availability: 'Same Day Reports',
    iconFamily: 'Ionicons',
    iconName: 'document-text',
    route: 'Imaging',
    image: require('../../../assets/services/service_radiology.jpg'),
  },
];


// Popular search tags matching reference design
const POPULAR_SEARCH_TAGS = [
  { label: 'Fever', query: 'Fever' },
  { label: 'General Physician', specialty: 'general-primary' },
  { label: 'Blood Test', route: 'LabTests' },
  { label: 'MRI Scan', route: 'Imaging' },
  { label: 'Cardiologist', specialty: 'cardiology-heart' },
  { label: 'Pharmacy', route: 'Pharmacy' },
  { label: 'Hospital', route: 'HospitalCare' },
];

const TRUST_PILLARS = [
  {
    id: 'tp-1',
    icon: 'shield-checkmark',
    color: '#00B894', // BRAND TEAL
    bg: '#ECF9F5',
    title: '100% Verified Specialists',
    desc: 'Every doctor undergoes multi-step Medical Council verification and clinical credential vetting.',
  },
  {
    id: 'tp-2',
    icon: 'flash',
    color: '#00C2CB', // AQUA
    bg: '#EEF7FC',
    title: 'Instant 60-Sec Connect',
    desc: 'Skip traffic and hospital waiting rooms. Connect directly with an active doctor from your home.',
  },
  {
    id: 'tp-3',
    icon: 'flask',
    color: '#00B894', // BRAND TEAL
    bg: '#ECFDF5',
    title: 'NABL Certified Diagnostics',
    desc: 'Hygienic home sample collection by certified phlebotomists with digital reports in 6 hours.',
  },
  {
    id: 'tp-4',
    icon: 'card',
    color: '#1E3A8A', // NAVY BLUE
    bg: '#E9F4F9',
    title: 'Cashless & Transparent',
    desc: 'Clear upfront pricing with no surprise bills. Dedicated cashless insurance desk for surgeries.',
  },
];

const CITIES = ['Bangalore', 'Mysore', 'Hubli', 'Mangalore', 'Belgaum', 'Delhi NCR', 'Mumbai'];

import LoginScreenMobile from './LoginScreen';

const LoginScreenWeb = ({ navigation, route = {} }) => {
  const { width } = useWindowDimensions();
  const isDesktop = width >= 992;
  const isTablet = width >= 640 && width < 992;
  const isMobile = width < 640;

  // Scroll ref for scrolling to top
  const scrollViewRef = useRef(null);

  // Search state
  const [selectedCity, setSelectedCity] = useState('Mysore');
  const [showCityPicker, setShowCityPicker] = useState(false);
  const [locationSearchText, setLocationSearchText] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [isDetectingLocation, setIsDetectingLocation] = useState(false);

  const filteredLocations = filterLocations(locationSearchText);

  // Automatically detect GPS / Network location where user is on initial mount
  useEffect(() => {
    (async () => {
      try {
        const savedCity = await AsyncStorage.getItem('@mediunify_selected_city');
        if (savedCity) {
          setSelectedCity(savedCity);
        } else {
          setSelectedCity('Mysore');
        }
      } catch (e) {
        setSelectedCity('Mysore');
      }
    })();
  }, []);

  const handleSelectLocation = async (locName) => {
    setSelectedCity(locName);
    setShowCityPicker(false);
    setLocationSearchText('');
    try {
      await AsyncStorage.setItem('@mediunify_selected_city', locName);
      await AsyncStorage.setItem('@unnathi_user_location', locName);
    } catch (e) { }
  };

  const handleDetectLocation = async () => {
    setIsDetectingLocation(true);
    try {
      const res = await detectAutoLocation();
      if (res && res.city) {
        setSelectedCity(res.city);
        setShowCityPicker(false);
        setLocationSearchText('');
        showAlert('Location Detected', `Your location has been set to ${res.city} (${res.source === 'gps' ? 'GPS' : 'Network'}).`);
      } else {
        showAlert('Location Notice', 'Could not detect GPS location. Defaulted to Bangalore.');
      }
    } catch (e) {
      console.warn('[Location] GPS detect error:', e);
    } finally {
      setIsDetectingLocation(false);
    }
  };

  // Auth Modal state
  const [showAuthModal, setShowAuthModal] = useState(
    Boolean(route?.params?.openAuthModal || route?.params?.openLogin)
  );

  const userHasTypedRef = useRef(false);

  useEffect(() => {
    if (route?.params?.openAuthModal || route?.params?.openLogin) {
      userHasTypedRef.current = false;
      setShowAuthModal(true);
      setAuthTab('login');
    }
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      const handleOpen = (e) => {
        userHasTypedRef.current = false;
        const targetTab = e?.detail?.tab || 'login';
        setAuthTab(targetTab);
        setEmail('');
        setPassword('');
        setRegName('');
        setRegEmail('');
        setRegPhone('');
        setRegPassword('');
        setRegConfirmPassword('');
        setRegReferralCode('');
        setIsOtpStep(false);
        setErrorMessage('');
        setShowAuthModal(true);
      };
      window.addEventListener('open-auth-modal', handleOpen);
      return () => window.removeEventListener('open-auth-modal', handleOpen);
    }
  }, [route?.params]);

  const [authTab, setAuthTab] = useState('login'); // 'login' | 'register'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [regName, setRegName] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirmPassword, setRegConfirmPassword] = useState('');
  const [showRegPassword, setShowRegPassword] = useState(false);
  const [showRegConfirmPassword, setShowRegConfirmPassword] = useState(false);
  const [regReferralCode, setRegReferralCode] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Guarantee all input fields are completely blank upon modal open or tab switch
  useEffect(() => {
    if (showAuthModal) {
      userHasTypedRef.current = false;
      setEmail('');
      setPassword('');
      setRegName('');
      setRegEmail('');
      setRegPhone('');
      setRegPassword('');
      setRegConfirmPassword('');
      setRegReferralCode('');
      setErrorMessage('');

      // Chrome/Edge password managers attempt to autofill credentials right after DOM render.
      // Clear values if user hasn't typed anything yet to ensure boxes start completely blank.
      if (Platform.OS === 'web') {
        const wipeAutofill = () => {
          if (!userHasTypedRef.current) {
            setEmail('');
            setPassword('');
            setRegName('');
            setRegEmail('');
            setRegPhone('');
            setRegPassword('');
            setRegConfirmPassword('');
            setRegReferralCode('');
          }
        };
        const t1 = setTimeout(wipeAutofill, 50);
        const t2 = setTimeout(wipeAutofill, 150);
        const t3 = setTimeout(wipeAutofill, 300);
        return () => {
          clearTimeout(t1);
          clearTimeout(t2);
          clearTimeout(t3);
        };
      }
    }
  }, [showAuthModal, authTab]);

  // Mobile Number OTP Verification state
  const [isOtpStep, setIsOtpStep] = useState(false);
  const [otpValue, setOtpValue] = useState('');
  const [pendingRegData, setPendingRegData] = useState(null);
  const [otpTimer, setOtpTimer] = useState(30);

  useEffect(() => {
    let interval = null;
    if (isOtpStep && otpTimer > 0) {
      interval = setInterval(() => {
        setOtpTimer((prev) => prev - 1);
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isOtpStep, otpTimer]);

  // Active User session state
  const [currentUser, setCurrentUser] = useState(null);

  // Info modal states
  const [infoModal, setInfoModal] = useState(null); // 'corporates' | 'providers' | 'security'
  const [isMoreServicesOpen, setIsMoreServicesOpen] = useState(false);

  // Specialties Horizontal Carousel state & scrolling
  const specialtiesScrollRef = useRef(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  const scrollSpecialties = (direction) => {
    const scrollAmount = isDesktop ? 650 : 360;
    const node =
      specialtiesScrollRef.current?.getScrollableNode?.() ||
      specialtiesScrollRef.current;

    if (node && typeof node.scrollBy === 'function') {
      node.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth',
      });
      setTimeout(() => {
        if (node) {
          setCanScrollLeft(node.scrollLeft > 15);
          setCanScrollRight(node.scrollLeft < node.scrollWidth - node.clientWidth - 15);
        }
      }, 350);
    } else if (specialtiesScrollRef.current?.scrollTo) {
      const currentOffset = node?.scrollLeft || 0;
      const targetOffset = direction === 'left' ? Math.max(0, currentOffset - scrollAmount) : currentOffset + scrollAmount;
      specialtiesScrollRef.current.scrollTo({ x: targetOffset, animated: true });
    }
  };

  const handleSpecialtiesScroll = (e) => {
    const { contentOffset, contentSize, layoutMeasurement } = e.nativeEvent;
    const currentX = contentOffset?.x || 0;
    const maxScroll = (contentSize?.width || 0) - (layoutMeasurement?.width || 0);

    setCanScrollLeft(currentX > 15);
    setCanScrollRight(currentX < maxScroll - 15);
  };

  useEffect(() => {
    const checkSession = async () => {
      try {
        const storedLoggedIn = await AsyncStorage.getItem('isLoggedIn');
        if (storedLoggedIn === 'true') {
          const userStr = await AsyncStorage.getItem('user');
          if (userStr) {
            setCurrentUser(JSON.parse(userStr));
          }
        }
        autoMigrateLocalAccountsToServer();
      } catch (e) { }
    };
    checkSession();
  }, []);

  // Web dynamic hover and animation styles using official brand palette
  useEffect(() => {
    if (Platform.OS === 'web' && typeof document !== 'undefined') {
      const styleId = 'mediunify-landing-styles';
      if (!document.getElementById(styleId)) {
        const style = document.createElement('style');
        style.id = styleId;
        style.innerHTML = `
          .mediunify-hero-card {
            transition: transform 0.24s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.24s cubic-bezier(0.16, 1, 0.3, 1) !important;
            cursor: pointer !important;
          }
          .mediunify-hero-card:hover {
            transform: translateY(-6px) !important;
            box-shadow: 0 20px 30px -8px rgba(30, 58, 138, 0.12), 0 8px 16px -4px rgba(30, 58, 138, 0.06) !important;
          }
          .mediunify-specialty-card, .practo-spec-card {
            transition: transform 0.26s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.26s cubic-bezier(0.16, 1, 0.3, 1), border-color 0.26s ease !important;
            cursor: pointer !important;
          }
          .mediunify-specialty-card:hover, .practo-spec-card:hover {
            transform: translateY(-6px) !important;
            box-shadow: 0 18px 36px -10px rgba(0, 184, 148, 0.22), 0 4px 12px rgba(15, 23, 42, 0.05) !important;
            border-color: #00B894 !important;
          }
          .mediunify-specialty-card img, .practo-spec-card img {
            transition: transform 0.35s ease !important;
          }
          .mediunify-specialty-card:hover img, .practo-spec-card:hover img {
            transform: scale(1.08) !important;
          }
          .mediunify-specialty-card:hover .consult-btn-hover, .practo-spec-card:hover .consult-btn-hover {
            background-color: #00B894 !important;
            border-color: #00B894 !important;
          }
          .mediunify-specialty-card:hover .consult-btn-hover span, .practo-spec-card:hover .consult-btn-hover span,
          .mediunify-specialty-card:hover .consult-btn-hover div, .practo-spec-card:hover .consult-btn-hover div {
            color: #FFFFFF !important;
          }
          .carousel-arrow-btn {
            transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1) !important;
            cursor: pointer !important;
          }
          .carousel-arrow-btn:hover:not(:disabled) {
            background-color: #00B894 !important;
            border-color: #00B894 !important;
            transform: scale(1.1) !important;
            box-shadow: 0 8px 22px rgba(0, 184, 148, 0.35) !important;
          }
          .carousel-arrow-btn:hover:not(:disabled) svg,
          .carousel-arrow-btn:hover:not(:disabled) * {
            color: #FFFFFF !important;
          }
          .mediunify-login-btn {
            transition: transform 0.18s ease, box-shadow 0.18s ease, background-color 0.18s ease !important;
            cursor: pointer !important;
          }
          .mediunify-login-btn:hover {
            transform: translateY(-2px) !important;
            box-shadow: 0 6px 16px -2px rgba(0, 184, 148, 0.35) !important;
            background-color: #009E7E !important;
          }
          .mediunify-nav-link {
            transition: color 0.15s ease, background-color 0.15s ease !important;
            cursor: pointer !important;
            border-radius: 8px !important;
          }
          .mediunify-nav-link:hover {
            color: #00B894 !important;
            background-color: #E6F8F4 !important;
          }
          .mediunify-tag-chip {
            transition: all 0.18s ease !important;
            cursor: pointer !important;
          }
          .mediunify-tag-chip:hover {
            background-color: #E6F8F4 !important;
            border-color: #00B894 !important;
            color: #00B894 !important;
            transform: translateY(-2px) !important;
          }
          .mediunify-search-btn {
            transition: background-color 0.18s ease, transform 0.18s ease, box-shadow 0.18s ease !important;
            cursor: pointer !important;
          }
          .mediunify-search-btn:hover {
            background-color: #009E7E !important;
            transform: translateY(-1px) !important;
            box-shadow: 0 4px 12px rgba(0, 184, 148, 0.35) !important;
          }
          .mediunify-login-btn {
            transition: all 0.18s ease !important;
            cursor: pointer !important;
          }
          .mediunify-login-btn:hover {
            background-color: #009E7E !important;
            transform: translateY(-1px) !important;
            box-shadow: 0 6px 16px rgba(0, 184, 148, 0.35) !important;
          }
          .mediunify-search-box {
            transition: border-color 0.2s ease, box-shadow 0.2s ease !important;
          }
          .mediunify-search-box:focus-within {
            border-color: #00B894 !important;
            box-shadow: 0 14px 34px -4px rgba(0, 184, 148, 0.15), 0 0 0 3px rgba(0, 184, 148, 0.18) !important;
          }
          .practo-profile-item {
            transition: background-color 0.12s ease !important;
            cursor: pointer !important;
          }
          .practo-profile-item:hover {
            background-color: #F8FAFC !important;
          }
          .practo-provider-footer:hover {
            background-color: #F1F5F9 !important;
          }
          .search-btn-hover {
            transition: background-color 0.2s ease, transform 0.15s ease !important;
          }
          .search-btn-hover:hover {
            background-color: #00A884 !important;
            transform: translateY(-1px) !important;
          }
          .popular-chip-hover {
            transition: all 0.2s ease !important;
          }
          .popular-chip-hover:hover {
            border-color: #00B894 !important;
            background-color: #ECFDF5 !important;
            color: #00B894 !important;
            transform: translateY(-1px) !important;
          }
          .medi-ai-btn-hover {
            transition: background-color 0.2s ease, transform 0.15s ease !important;
          }
          .medi-ai-btn-hover:hover {
            background-color: #08284d !important;
            transform: translateY(-1px) !important;
          }
          /* =============================================
             SERVICE CARDS — RICH HOVER ANIMATIONS
          ============================================= */
          .service-card {
            transition:
              transform 0.32s cubic-bezier(0.16, 1, 0.3, 1),
              box-shadow 0.32s cubic-bezier(0.16, 1, 0.3, 1) !important;
          }
          .service-card:hover {
            transform: translateY(-10px) scale(1.015) !important;
            box-shadow:
              0 24px 48px -12px rgba(12, 59, 107, 0.14),
              0 8px 20px -6px rgba(12, 59, 107, 0.07) !important;
          }
          .service-card:active {
            transform: translateY(-4px) scale(1.005) !important;
          }
          .service-card-image {
            transition: transform 0.45s cubic-bezier(0.16, 1, 0.3, 1) !important;
          }
          .service-card:hover .service-card-image {
            transform: scale(1.1) !important;
          }
          .service-card-btn {
            transition: transform 0.18s ease !important;
          }
          .service-card:hover .service-card-btn {
            transform: translateX(3px) !important;
          }
          /* Hero search banner gradient visible on all desktop and laptop monitors */
          .hero-search-section-bg {
            background-color: #D8EEF6 !important;
            background-image: linear-gradient(135deg, #CCE8F5 0%, #D4F3EB 45%, #DFFAF3 100%) !important;
            border-bottom: 1px solid #BFDFEB !important;
          }
          /* Promotional offer cards hover */
          .mediunify-promo-ad-card {
            transition: transform 0.28s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.28s cubic-bezier(0.16, 1, 0.3, 1), border-color 0.28s ease !important;
            cursor: pointer !important;
          }
          .mediunify-promo-ad-card:hover {
            transform: translateY(-6px) !important;
            box-shadow: 0 20px 32px -8px rgba(12, 59, 107, 0.14), 0 6px 16px -4px rgba(12, 59, 107, 0.05) !important;
          }
          /* Prevent Chrome / Edge blue autofill background overlay */
          input:-webkit-autofill,
          input:-webkit-autofill:hover, 
          input:-webkit-autofill:focus, 
          input:-webkit-autofill:active,
          input[type="text"]:-webkit-autofill,
          input[type="password"]:-webkit-autofill,
          input[type="email"]:-webkit-autofill,
          input[type="tel"]:-webkit-autofill {
            -webkit-box-shadow: 0 0 0 1000px #FAFCFD inset !important;
            box-shadow: 0 0 0 1000px #FAFCFD inset !important;
            -webkit-text-fill-color: #1E3A8A !important;
            caret-color: #1E3A8A !important;
            transition: background-color 5000s ease-in-out 0s !important;
          }
        `;
        document.head.appendChild(style);
      }
    }
  }, []);

  useEffect(() => {
    if (Platform.OS === 'web' && typeof document !== 'undefined') {
      const handleClickOutside = (e) => {
        if (!showCityPicker) return;
        const pickerEl = document.getElementById('login-city-picker-box');
        if (pickerEl && !pickerEl.contains(e.target)) {
          setShowCityPicker(false);
        }
      };
      const handleKeyDown = (e) => {
        if (e.key === 'Escape') {
          setShowCityPicker(false);
        }
      };
      const timer = setTimeout(() => {
        document.addEventListener('click', handleClickOutside);
        window.addEventListener('keydown', handleKeyDown);
      }, 50);
      return () => {
        clearTimeout(timer);
        document.removeEventListener('click', handleClickOutside);
        window.removeEventListener('keydown', handleKeyDown);
      };
    }
  }, [showCityPicker]);

  useEffect(() => {
    if (Platform.OS === 'web' && typeof document !== 'undefined') {
      const handleClickOutside = (e) => {
        if (!isMoreServicesOpen) return;
        const trigger = document.getElementById('login-more-services-wrap');
        if (trigger && !trigger.contains(e.target)) {
          setIsMoreServicesOpen(false);
        }
      };
      const handleKeyDown = (e) => {
        if (e.key === 'Escape') {
          setIsMoreServicesOpen(false);
        }
      };
      const timer = setTimeout(() => {
        document.addEventListener('click', handleClickOutside);
        window.addEventListener('keydown', handleKeyDown);
      }, 50);
      return () => {
        clearTimeout(timer);
        document.removeEventListener('click', handleClickOutside);
        window.removeEventListener('keydown', handleKeyDown);
      };
    }
  }, [isMoreServicesOpen]);

  // ==========================================
  // NAVIGATION ACTIONS
  // ==========================================
  const handleNavigateToService = async (route, params = {}) => {
    if (!currentUser) {
      try {
        await AsyncStorage.setItem('isLoggedIn', 'false');
      } catch (e) { }
    }
    safeNavigateToMain(navigation);
    setTimeout(() => {
      navigation.navigate('MainApp', { screen: route, params });
    }, 100);
  };

  const handleConsultNow = (specialty) => {
    handleNavigateToService('DoctorList', { specialty });
  };

  const handlePopularTagClick = (tag) => {
    if (tag.specialty) {
      handleConsultNow(tag.specialty);
    } else if (tag.route) {
      handleNavigateToService(tag.route);
    } else if (tag.query) {
      setSearchQuery(tag.query);
      handleNavigateToService('DoctorList', { searchQuery: tag.query, city: selectedCity });
    } else {
      setSearchQuery(tag.label);
      handleNavigateToService('DoctorList', { searchQuery: tag.label, city: selectedCity });
    }
  };

  const handleSearchSubmit = () => {
    if (searchQuery.trim()) {
      handleNavigateToService('DoctorList', { searchQuery: searchQuery.trim(), city: selectedCity });
    } else {
      handleNavigateToService('DoctorList', { city: selectedCity });
    }
  };

  // ==========================================
  // LOGIN SUBMISSION
  // ==========================================
  const handleLogin = async () => {
    const inputVal = email.trim();
    const inputPassword = password.trim();
    setErrorMessage('');

    if (!inputVal) {
      setErrorMessage('Enter a valid email or 10-digit mobile number.');
      return;
    }
    const cleanPhone = inputVal.replace(/[^0-9]/g, '');
    const isEmail = inputVal.includes('@') && inputVal.includes('.');
    const isPhone = cleanPhone.length === 10;
    if (!isEmail && !isPhone) {
      setErrorMessage('Enter a valid email or 10-digit mobile number.');
      return;
    }
    if (!inputPassword) {
      setErrorMessage('Password is required.');
      return;
    }

    setIsSubmitting(true);

    try {
      // 1. Central sync server
      try {
        const syncRes = await syncLogin(inputVal, inputPassword);
        if (syncRes.success && syncRes.user) {
          await AsyncStorage.setItem('isLoggedIn', 'true');
          await AsyncStorage.setItem('@unnathi_is_guest', 'false');
          setShowAuthModal(false);
          safeNavigateToMain(navigation);
          return;
        } else if (syncRes.status === 401) {
          setIsSubmitting(false);
          setErrorMessage('Incorrect password. Please verify and try again.');
          return;
        }
      } catch (e) { }

      // 2. Local fallback verification
      const cleanPhone = inputVal.replace(/[^0-9]/g, '');
      const cleanPhone10 = cleanPhone.length >= 10 ? cleanPhone.slice(-10) : cleanPhone;
      const lowerEmail = inputVal.toLowerCase();

      const regCredsStr = await AsyncStorage.getItem('@unnathi_registered_credentials');
      let registeredCreds = {};
      if (regCredsStr) {
        try { registeredCreds = JSON.parse(regCredsStr); } catch (e) { }
      }

      const allCreds = { ...registeredCreds };
      const matchingCred = allCreds[lowerEmail] || (cleanPhone10.length === 10 ? allCreds[cleanPhone10] : null);
      if (matchingCred && matchingCred.password && matchingCred.password !== inputPassword) {
        setIsSubmitting(false);
        setErrorMessage('Incorrect password. Please verify and try again.');
        return;
      }

      // Format User Data
      const regUsersStr = await AsyncStorage.getItem('@unnathi_registered_users');
      let registeredUsers = {};
      if (regUsersStr) {
        try { registeredUsers = JSON.parse(regUsersStr); } catch (e) { }
      }
      const foundReg = (matchingCred && matchingCred.userData) || registeredUsers[lowerEmail] || registeredUsers[cleanPhone10];

      const userName = foundReg?.name || (lowerEmail.includes('@') ? lowerEmail.split('@')[0] : `User ${cleanPhone10.slice(-4)}`);
      const userData = {
        name: userName,
        email: lowerEmail.includes('@') ? lowerEmail : (foundReg?.email || 'user@example.com'),
        phone: cleanPhone10.length === 10 ? `+91 ${cleanPhone10}` : '+91 98450 12345',
        gender: foundReg?.gender || 'Male',
        bloodGroup: foundReg?.bloodGroup || 'O+ Positive',
        age: foundReg?.age || '28 Yrs',
      };

      await AsyncStorage.setItem('user', JSON.stringify(userData));
      await AsyncStorage.setItem('@unnathi_primary_user', JSON.stringify(userData));
      await AsyncStorage.setItem('userName', userData.name);
      await AsyncStorage.setItem('userEmail', userData.email);
      await AsyncStorage.setItem('isLoggedIn', 'true');
      await AsyncStorage.setItem('@unnathi_is_guest', 'false');

      try { syncRegister(userData, inputPassword); } catch (e) { }

      setIsSubmitting(false);
      setShowAuthModal(false);
      safeNavigateToMain(navigation);
    } catch (err) {
      setIsSubmitting(false);
      setErrorMessage('An error occurred during login. Please try again.');
    }
  };

  // ==========================================
  // REGISTER SUBMISSION -> TRIGGER OTP
  // ==========================================
  const handleRegister = async () => {
    const nameVal = regName.trim();
    const emailVal = regEmail.trim().toLowerCase();
    const phoneVal = regPhone.trim().replace(/[^0-9]/g, '');
    const passVal = regPassword.trim();
    const confirmVal = regConfirmPassword.trim();
    setErrorMessage('');

    if (!nameVal || !emailVal || !phoneVal || !passVal || !confirmVal) {
      setErrorMessage('Please fill in all registration fields including password confirmation.');
      return;
    }

    if (phoneVal.length < 10) {
      setErrorMessage('Please enter a valid 10-digit mobile number.');
      return;
    }

    if (passVal.length < 6) {
      setErrorMessage('Password must be at least 6 characters long.');
      return;
    }

    if (passVal !== confirmVal) {
      setErrorMessage('Passwords do not match. Please verify and re-enter.');
      return;
    }

    const cleanPhone10 = phoneVal.slice(-10);
    const cleanFirstName = nameVal.trim().split(' ')[0].toUpperCase().replace(/[^A-Z0-9]/g, '') || 'USER';
    const myReferralCode = `${cleanFirstName}250`;
    const enteredReferral = regReferralCode.trim().toUpperCase();

    const userData = {
      name: nameVal,
      email: emailVal,
      phone: `+91 ${cleanPhone10}`,
      gender: 'Not specified',
      bloodGroup: 'B+',
      age: '28 Yrs',
      myReferralCode,
      referralCode: enteredReferral || null,
    };

    setPendingRegData({
      userData,
      password: passVal,
      cleanPhone10,
      emailVal,
      myReferralCode,
      enteredReferral,
    });
    setOtpValue('');
    setOtpTimer(30);
    setIsOtpStep(true);
    setErrorMessage('');
  };

  // ==========================================
  // OTP VERIFICATION SUBMISSION
  // ==========================================
  const handleVerifyOtp = async () => {
    const trimmed = otpValue.trim();
    if (!trimmed) {
      setErrorMessage('Please enter the 6-digit OTP sent to your mobile number.');
      return;
    }

    if (trimmed !== '123456') {
      setErrorMessage('Invalid OTP. Please enter the demo verification code 123456.');
      return;
    }

    if (!pendingRegData) {
      setIsOtpStep(false);
      return;
    }

    setIsSubmitting(true);
    setErrorMessage('');

    try {
      const { userData, password: passVal, cleanPhone10, emailVal, myReferralCode, enteredReferral } = pendingRegData;

      // Save credentials map
      const regCredsStr = await AsyncStorage.getItem('@unnathi_registered_credentials');
      let registeredCreds = {};
      if (regCredsStr) {
        try { registeredCreds = JSON.parse(regCredsStr); } catch (e) { }
      }
      registeredCreds[emailVal] = { password: passVal, userData };
      registeredCreds[cleanPhone10] = { password: passVal, userData };
      await AsyncStorage.setItem('@unnathi_registered_credentials', JSON.stringify(registeredCreds));

      // Save user & unique referral code
      await AsyncStorage.setItem('user', JSON.stringify(userData));
      await AsyncStorage.setItem('@unnathi_primary_user', JSON.stringify(userData));
      await AsyncStorage.setItem('userName', userData.name);
      await AsyncStorage.setItem('userEmail', userData.email);
      await AsyncStorage.setItem('userPhone', userData.phone);
      if (myReferralCode) {
        await AsyncStorage.setItem('@unnathi_user_referral_code', myReferralCode);
      }
      await AsyncStorage.setItem('isLoggedIn', 'true');
      await AsyncStorage.setItem('@unnathi_is_guest', 'false');

      // If user entered a friend's referral code, credit ₹250 welcome bonus into wallet!
      if (enteredReferral) {
        const curBal = await AsyncStorage.getItem('@unnathi_wallet_balance');
        const balance = curBal ? parseInt(curBal, 10) : 1000;
        const newBal = balance + 250;
        await AsyncStorage.setItem('@unnathi_wallet_balance', newBal.toString());

        const storedTxStr = await AsyncStorage.getItem('@unnathi_wallet_transactions');
        let existingTx = [];
        if (storedTxStr) {
          try { existingTx = JSON.parse(storedTxStr); } catch (e) { }
        }
        const refTx = {
          id: `tx-ref-${Date.now()}`,
          title: 'Referral Welcome Bonus',
          subtitle: `Code "${enteredReferral}" applied on registration`,
          amount: '+₹250',
          type: 'credit',
          date: 'Just now',
          icon: 'gift-outline',
        };
        await AsyncStorage.setItem('@unnathi_wallet_transactions', JSON.stringify([refTx, ...existingTx]));
      }

      try { syncRegister(userData, passVal); } catch (e) { }

      setIsSubmitting(false);
      setIsOtpStep(false);
      setShowAuthModal(false);

      showAlert(
        'Account Created Successfully',
        `Welcome to MediUnify, ${userData.name}!\n\nYour personal referral code is: ${myReferralCode}\n\nShare it with friends & family to earn ₹250 for every referral who joins!`
      );

      safeNavigateToMain(navigation);
    } catch (err) {
      setIsSubmitting(false);
      setErrorMessage('Could not complete registration. Please try again.');
    }
  };

  const handleContinueAsGuest = async () => {
    try {
      await AsyncStorage.setItem('isLoggedIn', 'false');
      await AsyncStorage.setItem('@unnathi_is_guest', 'true');
      await AsyncStorage.removeItem('user');
      await AsyncStorage.removeItem('userToken');
      await AsyncStorage.removeItem('userName');
      await AsyncStorage.removeItem('userEmail');
      await AsyncStorage.removeItem('userPhone');
      await AsyncStorage.removeItem('@unnathi_primary_user');
      await AsyncStorage.removeItem('@mediunify_membership');
      await AsyncStorage.removeItem('@unnathi_active_patient');
      if (Platform.OS === 'web' && typeof window !== 'undefined') {
        window.dispatchEvent(new Event('storage'));
      }
    } catch (e) {}
    setShowAuthModal(false);
    await safeNavigateToMain(navigation);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* ==================================================
          1. TOP NAVIGATION HEADER (MATCHING EXACT USER SCREENSHOT)
      ================================================== */}
      <WebHeader
        navigation={navigation}
        currentRoute="Login"
      />

      <ScrollView
        ref={scrollViewRef}
        style={styles.container}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ==================================================
              2. HERO SEARCH HUB (AMBIENT BACKDROP + DUAL SEARCH + POPULAR PILLS)
          ================================================== */}
        <View
          style={[
            styles.heroSearchSection,
            Platform.OS === 'web' ? {
              backgroundColor: '#D8EEF6',
              backgroundImage: 'linear-gradient(135deg, #CCE8F5 0%, #D4F3EB 45%, #DFFAF3 100%)',
              borderBottomColor: '#BFDFEB',
            } : {},
          ]}
          // @ts-ignore
          className="hero-search-section-bg"
        >
          <View
            style={[
              styles.heroBannerWrap,
              {
                maxWidth: isDesktop ? 1340 : '96%',
                flexDirection: isDesktop ? 'row' : 'column',
                alignItems: isDesktop ? 'center' : 'stretch',
                flexWrap: isDesktop ? 'nowrap' : 'wrap',
                gap: isDesktop ? (width < 1280 ? 18 : 24) : 20,
              },
            ]}
          >
            {/* Left Column: Headlines, Unified Search Bar & Popular Searches */}
            <View style={[styles.heroLeftCol, isDesktop ? { flex: 1, minWidth: 340, maxWidth: width < 1280 ? 560 : 660 } : { width: '100%' }]}>
              {/* 1. Badge */}
              <View style={styles.trustedBadge}>
                <Ionicons name="shield-checkmark" size={13} color="#059669" style={{ marginRight: 6 }} />
                <Text style={styles.trustedBadgeText}>TRUSTED BY PATIENTS ACROSS INDIA</Text>
              </View>

              {/* 2. Main Title */}
              <View style={styles.heroTitleWrap}>
                <Text style={styles.heroTitleNavy}>Your Healthcare.</Text>
                <Text style={styles.heroTitleTeal}>One Intelligent Platform.</Text>
              </View>

              {/* 3. Subtitle */}
              <Text style={styles.heroSubtitle}>
                Find doctors, book lab tests, order medicines, access Scans & X-Ray and connect with trusted hospitals — all in one place.
              </Text>

              {/* 4. Unified Search Bar */}
              <View style={styles.unifiedSearchBar} nativeID="login-unified-search-box">
                {/* Location selector wrapper */}
                <View style={styles.citySelectorWrap} nativeID="login-city-picker-box">
                  <TouchableOpacity
                    style={styles.citySelector}
                    onPress={() => setShowCityPicker(!showCityPicker)}
                    activeOpacity={0.8}
                    accessibilityRole="button"
                    accessibilityLabel={`Selected location: ${selectedCity}`}
                  >
                    <Ionicons name="location-sharp" size={18} color="#1E3A8A" />
                    <Text style={styles.cityText} numberOfLines={1}>{selectedCity}</Text>
                    <Ionicons name="chevron-down" size={13} color="#64748B" />
                  </TouchableOpacity>

                  {/* City / Locality Search Dropdown Menu */}
                  {showCityPicker && (
                    <View style={styles.cityDropdown}>
                      {/* Search Bar inside Location Picker */}
                      <View style={styles.locationSearchInputWrap}>
                        <Ionicons name="search" size={15} color="#00B894" />
                        <TextInput
                          style={styles.locationSearchInput}
                          placeholder="Search city, area, locality..."
                          placeholderTextColor="#94A3B8"
                          value={locationSearchText}
                          onChangeText={setLocationSearchText}
                          autoFocus
                        />
                        {locationSearchText ? (
                          <TouchableOpacity onPress={() => setLocationSearchText('')} style={{ padding: 2 }}>
                            <Ionicons name="close-circle" size={15} color="#94A3B8" />
                          </TouchableOpacity>
                        ) : null}
                      </View>

                      {/* Detect GPS Location Button */}
                      <TouchableOpacity
                        style={[styles.detectLocationBtn, isDetectingLocation && { opacity: 0.7 }]}
                        onPress={handleDetectLocation}
                        disabled={isDetectingLocation}
                        activeOpacity={0.8}
                      >
                        {isDetectingLocation ? (
                          <ActivityIndicator size="small" color="#00B894" style={{ marginRight: 6 }} />
                        ) : (
                          <Ionicons name="locate" size={15} color="#00B894" />
                        )}
                        <Text style={styles.detectLocationText}>
                          {isDetectingLocation ? 'Detecting your GPS location...' : 'Use Current Location (GPS)'}
                        </Text>
                      </TouchableOpacity>

                      {/* Filtered Locations List */}
                      <ScrollView style={styles.locationListScroll} nestedScrollEnabled showsVerticalScrollIndicator>
                        {locationSearchText.trim() && !filteredLocations.some(l => l.name.toLowerCase() === locationSearchText.trim().toLowerCase()) && (
                          <TouchableOpacity
                            style={styles.customLocationItem}
                            onPress={() => handleSelectLocation(locationSearchText.trim())}
                          >
                            <Ionicons name="pin" size={14} color="#00B894" style={{ marginRight: 8 }} />
                            <Text style={styles.customLocationText}>
                              Use <Text style={{ fontWeight: '800' }}>"{locationSearchText.trim()}"</Text>
                            </Text>
                          </TouchableOpacity>
                        )}

                        {filteredLocations.map((loc) => (
                          <TouchableOpacity
                            key={loc.id}
                            style={[
                              styles.cityOption,
                              selectedCity === loc.name && styles.cityOptionActive,
                            ]}
                            onPress={() => handleSelectLocation(loc.name)}
                          >
                            <Ionicons
                              name={loc.type === 'city' ? 'business-outline' : 'navigate-outline'}
                              size={14}
                              color={selectedCity === loc.name ? '#00B894' : '#64748B'}
                              style={{ marginRight: 8 }}
                            />
                            <View style={{ flex: 1 }}>
                              <Text
                                style={[
                                  styles.cityOptionText,
                                  selectedCity === loc.name && styles.cityOptionTextActive,
                                ]}
                              >
                                {loc.full}
                              </Text>
                            </View>
                            {selectedCity === loc.name && (
                              <Ionicons name="checkmark-circle" size={15} color="#00B894" />
                            )}
                          </TouchableOpacity>
                        ))}
                      </ScrollView>
                    </View>
                  )}
                </View>

                <View style={styles.searchDivider} />

                {/* Keyword Search Input */}
                <View style={styles.searchInputContainer}>
                  <Ionicons name="search-outline" size={18} color="#64748B" style={styles.searchIcon} />
                  <TextInput
                    style={styles.searchInput}
                    placeholder="Search doctors, symptoms, tests, medicines, hospitals or services..."
                    placeholderTextColor="#94A3B8"
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                    onSubmitEditing={handleSearchSubmit}
                    returnKeyType="search"
                  />
                  {searchQuery ? (
                    <TouchableOpacity onPress={() => setSearchQuery('')} style={{ padding: 4 }}>
                      <Ionicons name="close-circle" size={16} color="#94A3B8" />
                    </TouchableOpacity>
                  ) : null}
                </View>

                {/* Dedicated Search Action Button */}
                <TouchableOpacity
                  style={styles.searchSubmitBtn}
                  // @ts-ignore
                  className="search-btn-hover"
                  onPress={handleSearchSubmit}
                  activeOpacity={0.85}
                  accessibilityRole="button"
                  accessibilityLabel="Search"
                >
                  <Ionicons name="search" size={15} color="#FFFFFF" style={{ marginRight: 6 }} />
                  <Text style={styles.searchSubmitBtnText}>Search</Text>
                </TouchableOpacity>
              </View>

              {/* Popular Searches Row */}
              <View style={styles.popularSearchesRow}>
                <Text style={styles.popularSearchesLabel}>Popular searches:</Text>
                <View style={styles.popularChipsContainer}>
                  {POPULAR_SEARCH_TAGS.map((tag, idx) => (
                    <TouchableOpacity
                      key={idx}
                      style={styles.popularChip}
                      // @ts-ignore
                      className="popular-chip-hover"
                      onPress={() => handlePopularTagClick(tag)}
                      activeOpacity={0.75}
                    >
                      <Text style={styles.popularChipText}>{tag.label}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Guest Exploration Strip */}
              <View style={styles.guestStrip}>
                <View style={{ flex: 1, minWidth: 220 }}>
                  <Text style={styles.guestStripHeading}>Explore MediUnify as Guest</Text>
                  <Text style={styles.guestStripText}>Browse doctors, lab tests, radiology scans and medicine prices with full transparency.</Text>
                </View>
                <TouchableOpacity
                  style={styles.guestStripBtn}
                  onPress={handleContinueAsGuest}
                  activeOpacity={0.85}
                >
                  <Text style={styles.guestStripBtnText}>Continue as Guest →</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Right Visual Cluster: Family Image & MediUnify AI Card */}
            {isDesktop ? (
              <View style={[styles.heroRightVisualCluster, { gap: width < 1280 ? 12 : 16 }]}>
                {/* Smiling Indian Family Photo */}
                <View style={[styles.heroFamilyPhotoWrap, { width: width < 1280 ? 210 : 260, height: width < 1280 ? 245 : 275 }]}>
                  <Image
                    source={require('../../../assets/images/hero_family.jpg')}
                    style={styles.heroFamilyPhoto}
                    resizeMode="cover"
                  />
                </View>

                {/* MediUnify AI Guide Card */}
                <View style={[styles.mediAiCard, { width: width < 1280 ? 245 : 285, padding: width < 1280 ? 13 : 16 }]}>
                  <View style={styles.mediAiCardHeader}>
                    <View style={styles.mediAiHeaderLeft}>
                      <Image
                        source={require('../../../assets/bot-icon.png')}
                        style={styles.mediAiAvatar}
                        resizeMode="contain"
                      />
                      <Text style={styles.mediAiTitle}>MediUnify AI</Text>
                    </View>
                    <View style={styles.mediAiBadge}>
                      <Text style={styles.mediAiBadgeText}>Your Health Guide 24/7</Text>
                    </View>
                  </View>

                  <Text style={styles.mediAiQuestion}>Not sure where to start?</Text>
                  <Text style={styles.mediAiPrompt}>
                    Tell us what you're experiencing and we'll help you find the right doctor, test or service.
                  </Text>

                  <TouchableOpacity
                    style={styles.mediAiBtn}
                    // @ts-ignore
                    className="medi-ai-btn-hover"
                    onPress={() => handleNavigateToService('Chatbot')}
                    activeOpacity={0.88}
                    accessibilityRole="button"
                    accessibilityLabel="Chat with MediUnify AI"
                  >
                    <Text style={styles.mediAiBtnText}>Chat with MediUnify AI →</Text>
                  </TouchableOpacity>

                  <View style={styles.mediAiFeaturesList}>
                    <View style={styles.mediAiFeatureItem}>
                      <Ionicons name="checkmark-circle" size={13} color="#00B894" style={{ marginRight: 6 }} />
                      <Text style={styles.mediAiFeatureText}>Symptom guidance</Text>
                    </View>
                    <View style={styles.mediAiFeatureItem}>
                      <Ionicons name="checkmark-circle" size={13} color="#00B894" style={{ marginRight: 6 }} />
                      <Text style={styles.mediAiFeatureText}>Service recommendations</Text>
                    </View>
                    <View style={styles.mediAiFeatureItem}>
                      <Ionicons name="checkmark-circle" size={13} color="#00B894" style={{ marginRight: 6 }} />
                      <Text style={styles.mediAiFeatureText}>Care navigation (not a diagnosis)</Text>
                    </View>
                  </View>
                </View>
              </View>
            ) : (
              <View style={styles.heroMobileCardsWrap}>
                <View style={styles.mediAiCard}>
                  <View style={styles.mediAiCardHeader}>
                    <View style={styles.mediAiHeaderLeft}>
                      <Image
                        source={require('../../../assets/bot-icon.png')}
                        style={styles.mediAiAvatar}
                        resizeMode="contain"
                      />
                      <Text style={styles.mediAiTitle}>MediUnify AI</Text>
                    </View>
                    <View style={styles.mediAiBadge}>
                      <Text style={styles.mediAiBadgeText}>Your Health Guide 24/7</Text>
                    </View>
                  </View>

                  <Text style={styles.mediAiQuestion}>Not sure where to start?</Text>
                  <Text style={styles.mediAiPrompt}>
                    Tell us what you're experiencing and we'll help you find the right doctor, test or service.
                  </Text>

                  <TouchableOpacity
                    style={styles.mediAiBtn}
                    onPress={() => handleNavigateToService('Chatbot')}
                    activeOpacity={0.88}
                  >
                    <Text style={styles.mediAiBtnText}>Chat with MediUnify AI →</Text>
                  </TouchableOpacity>

                  <View style={styles.mediAiFeaturesList}>
                    <View style={styles.mediAiFeatureItem}>
                      <Ionicons name="checkmark-circle" size={13} color="#00B894" style={{ marginRight: 6 }} />
                      <Text style={styles.mediAiFeatureText}>Symptom guidance</Text>
                    </View>
                    <View style={styles.mediAiFeatureItem}>
                      <Ionicons name="checkmark-circle" size={13} color="#00B894" style={{ marginRight: 6 }} />
                      <Text style={styles.mediAiFeatureText}>Service recommendations</Text>
                    </View>
                    <View style={styles.mediAiFeatureItem}>
                      <Ionicons name="checkmark-circle" size={13} color="#00B894" style={{ marginRight: 6 }} />
                      <Text style={styles.mediAiFeatureText}>Care navigation (not a diagnosis)</Text>
                    </View>
                  </View>
                </View>
              </View>
            )}
          </View>

        </View>

        {/* ==================================================
            3. SEVEN SERVICE CARDS — CREATIVE ILLUSTRATED DESIGN
        ================================================== */}
        <View style={[styles.heroCardsSection, { maxWidth: isDesktop ? 1340 : '96%' }]}>
          {/* Section Header */}
          <View style={styles.serviceCardsHeader}>
            <View style={styles.sectionBadgeWrap}>
              <Text style={styles.sectionBadge}>OUR SERVICES</Text>
            </View>
            <Text style={styles.serviceCardsTitle}>Everything Healthcare,{`\n`}All in One Place</Text>
            <Text style={styles.serviceCardsSubtitle}>
              From consultations to home care — seamlessly connected for your health journey.
            </Text>
          </View>

          <View
            style={[
              styles.heroGrid,
              isDesktop
                ? styles.heroGridDesktop
                : isTablet
                  ? styles.heroGridTablet
                  : styles.heroGridMobile,
            ]}
          >
            {HERO_CARDS.map((card) => (
              <TouchableOpacity
                key={card.id}
                style={[
                  styles.heroCard,
                  isDesktop ? { flex: 1, minWidth: 0 } : isTablet ? { width: '48%' } : { width: '100%' },
                ]}
                // @ts-ignore
                className="service-card"
                activeOpacity={0.92}
                onPress={() => handleNavigateToService(card.route)}
              >
                {/* Photo Top Container */}
                <View style={styles.heroCardTop}>
                  {/* Availability Badge */}
                  <View
                    style={styles.serviceAvailBadge}
                    // @ts-ignore
                    className="service-card-avail-badge"
                  >
                    {card.iconFamily === 'MaterialCommunityIcons' ? (
                      <MaterialCommunityIcons name={card.iconName} size={13} color={card.accentColor} />
                    ) : (
                      <Ionicons name={card.iconName} size={13} color={card.accentColor} />
                    )}
                    <Text style={[styles.serviceAvailText, { color: card.accentColor }]}>{card.availability}</Text>
                  </View>

                  {/* Uniform Service Photo */}
                  <View
                    style={styles.serviceImgWrap}
                    // @ts-ignore
                    className="service-card-image"
                  >
                    <Image
                      source={card.image}
                      style={styles.heroCardImage}
                      resizeMode="cover"
                    />
                  </View>
                </View>

                {/* Card Content */}
                <View style={styles.heroCardBottom}>
                  <Text style={styles.heroCardTitle}>{card.title}</Text>
                  <Text style={styles.heroCardSubtitle}>{card.subtitle}</Text>

                  {/* Book Now CTA Button */}
                  <View
                    style={[styles.serviceBookBtn, { backgroundColor: card.accentBg, borderColor: card.accentColor + '30' }]}
                    // @ts-ignore
                    className="service-card-btn"
                  >
                    <Text
                      style={[styles.serviceBookBtnText, { color: card.accentColor }]}
                      // @ts-ignore
                      className="service-card-btn-text"
                    >
                      Book Now
                    </Text>
                    <Ionicons name="arrow-forward" size={13} color={card.accentColor} style={{ marginLeft: 5 }} />
                  </View>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* ============================================================
            PROMOTIONAL HEALTH OFFERS & ADVERTS (PRACTO / APOLLO STYLE)
        ============================================================ */}
        <PromotionalAdsSection onNavigate={handleNavigateToService} />

        {/* ==================================================
            4. CONSULT TOP DOCTORS SPECIALTIES SECTION
        ================================================== */}
        <View style={[styles.specialtiesSection, { maxWidth: isDesktop ? 1340 : '96%' }]}>
          {/* Header Row */}
          <View style={styles.specialtiesHeaderRow}>
            <View style={{ flex: 1 }}>
              <View style={styles.sectionBadgeWrap}>
                <Text style={styles.sectionBadge}>VERIFIED CLINICAL DEPARTMENTS</Text>
              </View>
              <Text style={styles.specialtiesTitle}>
                Consult Top Doctors Online for Any Health Concern
              </Text>
              <Text style={styles.specialtiesSubtitle}>
                Private online & in-clinic consultations with certified doctors in all specialties
              </Text>
            </View>

            <TouchableOpacity
              style={styles.viewAllBtn}
              onPress={() => handleNavigateToService('DoctorList')}
              activeOpacity={0.8}
            >
              <Text style={styles.viewAllBtnText}>View All Specialities</Text>
              <Ionicons name="arrow-forward" size={14} color="#00B894" style={{ marginLeft: 6 }} />
            </TouchableOpacity>
          </View>

          {/* Top Specializations Single-Row Horizontal Carousel */}
          <View style={styles.specialtiesCarouselWrap}>
            {/* Left Floating Navigation Arrow */}
            <TouchableOpacity
              style={[
                styles.carouselArrowBtn,
                styles.carouselArrowLeft,
                !canScrollLeft && styles.carouselArrowDisabled,
                isMobile && { display: 'none' },
              ]}
              // @ts-ignore
              className="carousel-arrow-btn"
              onPress={() => scrollSpecialties('left')}
              disabled={!canScrollLeft}
              activeOpacity={0.85}
              accessibilityLabel="Previous specialties"
            >
              <Ionicons
                name="chevron-back"
                size={22}
                color={canScrollLeft ? '#0F172A' : '#94A3B8'}
              />
            </TouchableOpacity>

            {/* Horizontal Scroll Track */}
            <ScrollView
              ref={specialtiesScrollRef}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.specialtiesScrollContent}
              style={styles.specialtiesScrollView}
              onScroll={handleSpecialtiesScroll}
              scrollEventThrottle={16}
            >
              {FEATURED_SPECIALTIES.map((spec) => (
                <TouchableOpacity
                  key={spec.id}
                  style={[
                    styles.specialtyItem,
                    isDesktop
                      ? styles.specialtyItemDesktop
                      : isTablet
                        ? styles.specialtyItemTablet
                        : styles.specialtyItemMobile,
                    spec.cardBg ? { backgroundColor: spec.cardBg } : null,
                    spec.cardBorder ? { borderColor: spec.cardBorder } : null,
                  ]}
                  // @ts-ignore
                  className="practo-spec-card mediunify-specialty-card"
                  activeOpacity={0.88}
                  onPress={() => handleConsultNow(spec.specialtyId)}
                >
                  {/* Unified Medical Specialty Icon / Illustration */}
                  <View style={styles.specialtyIconWrap}>
                    {spec.image ? (
                      <Image
                        source={spec.image}
                        style={styles.specialtyImage}
                        resizeMode="contain"
                      />
                    ) : (
                      <SpecialtyIcon id={spec.id} size={46} color={spec.accentColor || '#00B894'} />
                    )}
                  </View>

                  {/* Specialty Title */}
                  <Text style={[styles.specialtyItemTitle, { color: '#1E3A8A' }]} numberOfLines={1}>
                    {spec.title}
                  </Text>

                  {/* Subtitle / Common Symptoms */}
                  <Text style={styles.specialtyItemSubtitle} numberOfLines={2}>
                    {spec.subtitle}
                  </Text>

                  {/* Consult Now CTA */}
                  <View
                    style={[
                      styles.consultNowTouch,
                      spec.btnBg ? { backgroundColor: spec.btnBg, borderColor: spec.btnBorder || spec.cardBorder } : null,
                    ]}
                    // @ts-ignore
                    className="consult-btn-hover"
                  >
                    <Text style={[styles.consultNowText, spec.btnText ? { color: spec.btnText } : null]}>CONSULT NOW</Text>
                    <Ionicons name="arrow-forward" size={10} color={spec.btnText || '#00B894'} style={{ marginLeft: 3 }} />
                  </View>
                </TouchableOpacity>
              ))}
            </ScrollView>

            {/* Right Floating Navigation Arrow */}
            <TouchableOpacity
              style={[
                styles.carouselArrowBtn,
                styles.carouselArrowRight,
                !canScrollRight && styles.carouselArrowDisabled,
                isMobile && { display: 'none' },
              ]}
              // @ts-ignore
              className="carousel-arrow-btn"
              onPress={() => scrollSpecialties('right')}
              disabled={!canScrollRight}
              activeOpacity={0.85}
              accessibilityLabel="Next specialties"
            >
              <Ionicons
                name="chevron-forward"
                size={22}
                color={canScrollRight ? '#0F172A' : '#94A3B8'}
              />
            </TouchableOpacity>
          </View>
        </View>

        {/* ==================================================
            5. RICH WEB FOOTER
        ================================================== */}
        <footer style={webStyles.footerContainer}>
          <View style={[styles.footerInner, { maxWidth: isDesktop ? 1340 : '96%' }]}>
            <View style={styles.footerColBrand}>
              <View style={[styles.brandRow, { marginBottom: 8 }]}>
                <View style={styles.brandTitleRow}>
                  <Text style={[styles.brandTitle, { color: '#1E3A8A' }]}>Medi</Text>
                  <Text style={styles.brandTitleAccent}>Unify</Text>
                </View>
              </View>
              <Text style={styles.footerBrandDesc}>
                All your healthcare. One intelligent platform. Connecting millions of patients with India's best verified doctors, diagnostic laboratories, and NABH accredited hospitals.
              </Text>
              <View style={styles.complianceRow}>
                <View style={styles.compliancePill}>
                  <Ionicons name="shield-checkmark" size={12} color="#7BC96F" />
                  <Text style={styles.compliancePillText}>NABH Compliant</Text>
                </View>
                <View style={styles.compliancePill}>
                  <Ionicons name="lock-closed" size={12} color="#00C2CB" />
                  <Text style={styles.compliancePillText}>256-Bit SSL</Text>
                </View>
                <View style={styles.compliancePill}>
                  <Ionicons name="ribbon" size={12} color="#00B894" />
                  <Text style={styles.compliancePillText}>ISO 27001</Text>
                </View>
              </View>
            </View>

            <View style={styles.footerCol}>
              <Text style={styles.footerColTitle}>Patient Services</Text>
              <TouchableOpacity onPress={() => handleNavigateToService('FindDoctors')}>
                <Text style={styles.footerLink}>Find Doctors Near You</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => handleNavigateToService('VideoConsultation')}>
                <Text style={styles.footerLink}>Instant Video Consultation</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => handleNavigateToService('LabTests')}>
                <Text style={styles.footerLink}>Book Diagnostic Lab Tests</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => handleNavigateToService('Pharmacy')}>
                <Text style={styles.footerLink}>Order Medicines Online</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => handleNavigateToService('HospitalCare')}>
                <Text style={styles.footerLink}>Surgeries & Hospital Care</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.footerCol}>
              <Text style={styles.footerColTitle}>Top Specialties</Text>
              <TouchableOpacity onPress={() => handleConsultNow('general-primary')}>
                <Text style={styles.footerLink}>General Physician</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => handleConsultNow('dermatology-skin')}>
                <Text style={styles.footerLink}>Dermatologist</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => handleConsultNow('pediatrics-child-health')}>
                <Text style={styles.footerLink}>Pediatrician</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => handleConsultNow('womens-health-group')}>
                <Text style={styles.footerLink}>Women's Health</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => handleConsultNow('cardiology-heart')}>
                <Text style={styles.footerLink}>Cardiologist</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.footerCol}>
              <Text style={styles.footerColTitle}>Support & Trust</Text>
              <TouchableOpacity onPress={() => setInfoModal('security')}>
                <Text style={styles.footerLink}>24/7 Patient Helpline</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setInfoModal('corporates')}>
                <Text style={styles.footerLink}>Corporate Health Plans</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setInfoModal('providers')}>
                <Text style={styles.footerLink}>Join as Doctor or Lab</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setInfoModal('security')}>
                <Text style={styles.footerLink}>Privacy Policy & HIPAA</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setInfoModal('security')}>
                <Text style={styles.footerLink}>Terms of Service</Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.footerBottomBar}>
            <Text style={styles.footerBottomText}>
              © 2026 Unnathi Healthcare / MediUnify • All rights reserved. Registered Telemedicine Network in India.
            </Text>
          </View>
        </footer>
      </ScrollView>

      {/* ==================================================
          5. LOGIN & REGISTRATION MODAL
      ================================================== */}
      <Modal
        visible={showAuthModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowAuthModal(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.modalOverlay}
        >
          <View style={styles.modalContainer}>
            {/* Modal Header */}
            <View style={styles.modalHeader}>
              <View style={styles.modalLogoWrap}>
                <View style={[styles.brandRow, { marginBottom: 2 }]}>
                  <View style={styles.brandTitleRow}>
                    <Text style={[styles.brandTitle, { fontSize: 20 }]}>Medi</Text>
                    <Text style={[styles.brandTitleAccent, { fontSize: 20 }]}>Unify</Text>
                  </View>
                </View>
                <Text style={styles.brandTagline} numberOfLines={1}>
                  All your healthcare. One intelligent platform.
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => {
                  setShowAuthModal(false);
                  setIsOtpStep(false);
                  setErrorMessage('');
                }}
                style={styles.modalCloseBtn}
              >
                <Ionicons name="close" size={22} color="#64748B" />
              </TouchableOpacity>
            </View>

            {/* Tab Switcher */}
            <View style={styles.authTabRow}>
              <TouchableOpacity
                style={[styles.authTab, authTab === 'login' && styles.authTabActive]}
                onPress={() => {
                  userHasTypedRef.current = false;
                  setAuthTab('login');
                  setIsOtpStep(false);
                  setErrorMessage('');
                  setEmail('');
                  setPassword('');
                }}
              >
                <Text style={[styles.authTabText, authTab === 'login' && styles.authTabTextActive]}>
                  Login
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.authTab, authTab === 'register' && styles.authTabActive]}
                onPress={() => {
                  userHasTypedRef.current = false;
                  setAuthTab('register');
                  setIsOtpStep(false);
                  setErrorMessage('');
                  setRegName('');
                  setRegEmail('');
                  setRegPhone('');
                  setRegPassword('');
                  setRegConfirmPassword('');
                  setRegReferralCode('');
                }}
              >
                <Text style={[styles.authTabText, authTab === 'register' && styles.authTabTextActive]}>
                  Create Account
                </Text>
              </TouchableOpacity>
            </View>

            {/* Error Banner */}
            {errorMessage ? (
              <View style={styles.errorBox}>
                <Ionicons name="alert-circle" size={18} color="#FF7F50" />
                <Text style={styles.errorText}>{errorMessage}</Text>
              </View>
            ) : null}

            {/* Form Fields: LOGIN */}
            {authTab === 'login' ? (
              <View style={styles.formContainer}>
                {/* Offscreen decoy inputs to capture aggressive browser autofill */}
                {Platform.OS === 'web' && (
                  <View
                    style={{
                      position: 'absolute',
                      top: -9999,
                      left: -9999,
                      width: 0,
                      height: 0,
                      opacity: 0,
                      overflow: 'hidden',
                      pointerEvents: 'none',
                    }}
                  >
                    <TextInput tabIndex={-1} autoComplete="off" />
                    <TextInput secureTextEntry tabIndex={-1} autoComplete="new-password" />
                  </View>
                )}

                <Text style={styles.inputLabel}>Email or Mobile Number</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="Enter email or 10-digit mobile number"
                  placeholderTextColor="#94A3B8"
                  value={email}
                  onChangeText={(val) => {
                    userHasTypedRef.current = true;
                    setEmail(val);
                  }}
                  autoCapitalize="none"
                  autoComplete="off"
                  name="user_login_identity"
                  id="user_login_identity"
                />

                <Text style={[styles.inputLabel, { marginTop: 14 }]}>Password</Text>
                <View style={styles.passwordWrap}>
                  <TextInput
                    style={[styles.textInput, { flex: 1, borderWidth: 0 }]}
                    placeholder="Enter your password"
                    placeholderTextColor="#94A3B8"
                    value={password}
                    onChangeText={(val) => {
                      userHasTypedRef.current = true;
                      setPassword(val);
                    }}
                    secureTextEntry={!showPassword}
                    autoComplete="new-password"
                    name="user_login_secret"
                    id="user_login_secret"
                  />
                  <TouchableOpacity
                    onPress={() => setShowPassword(!showPassword)}
                    style={styles.eyeBtn}
                  >
                    <Ionicons
                      name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                      size={20}
                      color="#64748B"
                    />
                  </TouchableOpacity>
                </View>

                <TouchableOpacity
                  onPress={() => {
                    setShowAuthModal(false);
                    navigation.navigate('ForgotPassword');
                  }}
                  style={styles.forgotBtn}
                >
                  <Text style={styles.forgotText}>Forgot Password?</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.submitBtn, isSubmitting && styles.submitBtnDisabled]}
                  onPress={handleLogin}
                  disabled={isSubmitting}
                >
                  <Text style={styles.submitBtnText}>
                    {isSubmitting ? 'Signing in...' : 'Login'}
                  </Text>
                </TouchableOpacity>
              </View>
            ) : isOtpStep ? (
              /* OTP VERIFICATION STEP */
              <View style={styles.formContainer}>
                <View style={{ alignItems: 'center', marginBottom: 14 }}>
                  <View style={{
                    width: 52,
                    height: 52,
                    borderRadius: 26,
                    backgroundColor: '#E6F8F4',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: 10,
                  }}>
                    <Ionicons name="shield-checkmark" size={28} color="#00B894" />
                  </View>
                  <Text style={{ fontSize: 18, fontWeight: '800', color: '#1E3A8A', marginBottom: 4 }}>
                    Verify Mobile Number
                  </Text>
                  <Text style={{ fontSize: 13, color: '#64748B', textAlign: 'center', lineHeight: 18 }}>
                    We sent a 6-digit verification code to{'\n'}
                    <Text style={{ fontWeight: '700', color: '#0F172A' }}>+91 {pendingRegData?.cleanPhone10}</Text>
                  </Text>
                </View>

                {/* Demo OTP Pill */}
                <View style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  backgroundColor: '#F0FDF4',
                  borderWidth: 1,
                  borderColor: '#BBF7D0',
                  borderRadius: 10,
                  paddingHorizontal: 12,
                  paddingVertical: 8,
                  marginBottom: 14,
                }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <Ionicons name="key-outline" size={14} color="#00B894" />
                    <Text style={{ fontSize: 12, fontWeight: '700', color: '#166534' }}>Demo OTP: 123456</Text>
                  </View>
                  <TouchableOpacity
                    onPress={() => {
                      setOtpValue('123456');
                      setErrorMessage('');
                    }}
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: 4,
                      backgroundColor: '#00B894',
                      paddingHorizontal: 9,
                      paddingVertical: 3.5,
                      borderRadius: 6,
                    }}
                    activeOpacity={0.8}
                  >
                    <Ionicons name="flash" size={11} color="#FFFFFF" />
                    <Text style={{ fontSize: 11, fontWeight: '700', color: '#FFFFFF' }}>Auto-Fill</Text>
                  </TouchableOpacity>
                </View>

                {/* OTP Input */}
                <Text style={styles.inputLabel}>Enter 6-Digit OTP</Text>
                <TextInput
                  style={{
                    height: 52,
                    borderWidth: 1.5,
                    borderColor: '#00B894',
                    borderRadius: 12,
                    backgroundColor: '#FAFCFD',
                    textAlign: 'center',
                    fontSize: 22,
                    fontWeight: '800',
                    letterSpacing: 8,
                    color: '#0F172A',
                    marginBottom: 6,
                    ...(Platform.OS === 'web' ? { outlineStyle: 'none' } : {}),
                  }}
                  placeholder="123456"
                  placeholderTextColor="#94A3B8"
                  value={otpValue}
                  onChangeText={(text) => {
                    const cleaned = text.replace(/[^0-9]/g, '').slice(0, 6);
                    setOtpValue(cleaned);
                    if (errorMessage) setErrorMessage('');
                  }}
                  keyboardType="number-pad"
                  maxLength={6}
                  autoFocus
                />

                {/* Timer & Edit Number */}
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 4, marginBottom: 16 }}>
                  <TouchableOpacity
                    onPress={() => {
                      if (otpTimer === 0) {
                        setOtpTimer(30);
                        setErrorMessage('');
                        showAlert('OTP Resent', `A new verification code 123456 was sent to +91 ${pendingRegData?.cleanPhone10}`);
                      }
                    }}
                    disabled={otpTimer > 0}
                    activeOpacity={0.7}
                  >
                    <Text style={{ fontSize: 12, fontWeight: '700', color: otpTimer > 0 ? '#94A3B8' : '#00B894' }}>
                      {otpTimer > 0 ? `Resend OTP in ${otpTimer}s` : 'Resend OTP via SMS'}
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => {
                      setIsOtpStep(false);
                      setErrorMessage('');
                    }}
                    activeOpacity={0.7}
                  >
                    <Text style={{ fontSize: 12, fontWeight: '600', color: '#64748B' }}>
                      ← Edit Number
                    </Text>
                  </TouchableOpacity>
                </View>

                {/* Verify Button */}
                <TouchableOpacity
                  style={[styles.submitBtn, isSubmitting && styles.submitBtnDisabled]}
                  onPress={handleVerifyOtp}
                  disabled={isSubmitting}
                  activeOpacity={0.85}
                >
                  <Text style={styles.submitBtnText}>
                    {isSubmitting ? 'Verifying...' : 'Verify & Complete Registration'}
                  </Text>
                </TouchableOpacity>
              </View>
            ) : (
              /* Form Fields: REGISTER */
              <View style={styles.formContainer}>
                {/* Offscreen decoy inputs to capture aggressive browser autofill */}
                {Platform.OS === 'web' && (
                  <View
                    style={{
                      position: 'absolute',
                      top: -9999,
                      left: -9999,
                      width: 0,
                      height: 0,
                      opacity: 0,
                      overflow: 'hidden',
                      pointerEvents: 'none',
                    }}
                  >
                    <TextInput tabIndex={-1} autoComplete="off" />
                    <TextInput secureTextEntry tabIndex={-1} autoComplete="new-password" />
                  </View>
                )}

                <Text style={styles.inputLabel}>Full Name</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="Enter your full name"
                  placeholderTextColor="#94A3B8"
                  value={regName}
                  onChangeText={(val) => {
                    userHasTypedRef.current = true;
                    setRegName(val);
                  }}
                  autoCapitalize="words"
                  autoComplete="off"
                  name="user_reg_fullname"
                  id="user_reg_fullname"
                />

                <Text style={[styles.inputLabel, { marginTop: 12 }]}>Email Address</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="name@gmail.com"
                  placeholderTextColor="#94A3B8"
                  value={regEmail}
                  onChangeText={(val) => {
                    userHasTypedRef.current = true;
                    setRegEmail(val);
                  }}
                  autoCapitalize="none"
                  keyboardType="email-address"
                  autoComplete="off"
                  name="user_reg_email"
                  id="user_reg_email"
                />

                <Text style={[styles.inputLabel, { marginTop: 12 }]}>Mobile Number (10 digits)</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="9xxxxxxx01"
                  placeholderTextColor="#94A3B8"
                  value={regPhone}
                  onChangeText={(val) => {
                    userHasTypedRef.current = true;
                    setRegPhone(val);
                  }}
                  keyboardType="phone-pad"
                  maxLength={14}
                  autoComplete="off"
                  name="user_reg_phone"
                  id="user_reg_phone"
                />

                <Text style={[styles.inputLabel, { marginTop: 12 }]}>Create Password</Text>
                <View style={styles.passwordWrap}>
                  <TextInput
                    style={[styles.textInput, { flex: 1, borderWidth: 0 }]}
                    placeholder="Enter a secure password (min 6 characters)"
                    placeholderTextColor="#94A3B8"
                    value={regPassword}
                    onChangeText={(val) => {
                      userHasTypedRef.current = true;
                      setRegPassword(val);
                    }}
                    secureTextEntry={!showRegPassword}
                    autoComplete="new-password"
                    name="user_reg_newpwd"
                    id="user_reg_newpwd"
                  />
                  <TouchableOpacity
                    onPress={() => setShowRegPassword(!showRegPassword)}
                    style={styles.eyeBtn}
                  >
                    <Ionicons
                      name={showRegPassword ? 'eye-off-outline' : 'eye-outline'}
                      size={20}
                      color="#64748B"
                    />
                  </TouchableOpacity>
                </View>

                <Text style={[styles.inputLabel, { marginTop: 12 }]}>Confirm Password</Text>
                <View style={styles.passwordWrap}>
                  <TextInput
                    style={[styles.textInput, { flex: 1, borderWidth: 0 }]}
                    placeholder="Re-enter your password to confirm"
                    placeholderTextColor="#94A3B8"
                    value={regConfirmPassword}
                    onChangeText={(val) => {
                      userHasTypedRef.current = true;
                      setRegConfirmPassword(val);
                    }}
                    secureTextEntry={!showRegConfirmPassword}
                    autoComplete="new-password"
                    name="user_reg_confirmpwd"
                    id="user_reg_confirmpwd"
                  />
                  <TouchableOpacity
                    onPress={() => setShowRegConfirmPassword(!showRegConfirmPassword)}
                    style={styles.eyeBtn}
                  >
                    <Ionicons
                      name={showRegConfirmPassword ? 'eye-off-outline' : 'eye-outline'}
                      size={20}
                      color="#64748B"
                    />
                  </TouchableOpacity>
                </View>
                {regConfirmPassword.length > 0 && (
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 }}>
                    <Ionicons
                      name={regPassword === regConfirmPassword ? 'checkmark-circle' : 'alert-circle'}
                      size={13}
                      color={regPassword === regConfirmPassword ? '#00B894' : '#FF7F50'}
                    />
                    <Text style={{ fontSize: 11.5, fontWeight: '600', color: regPassword === regConfirmPassword ? '#00B894' : '#FF7F50' }}>
                      {regPassword === regConfirmPassword ? 'Passwords match' : 'Passwords do not match yet'}
                    </Text>
                  </View>
                )}

                {/* Optional Friend Referral Code Input */}
                <Text style={[styles.inputLabel, { marginTop: 12 }]}>Have a Referral Code? (Optional)</Text>
                <View style={{ position: 'relative' }}>
                  <TextInput
                    style={[styles.textInput, regReferralCode.trim() ? { borderColor: '#00B894', backgroundColor: '#F0FDF4' } : null]}
                    placeholder="e.g. PRIYA250 (Get ₹250 Welcome Bonus)"
                    placeholderTextColor="#94A3B8"
                    value={regReferralCode}
                    onChangeText={(val) => {
                      userHasTypedRef.current = true;
                      setRegReferralCode(val);
                    }}
                    autoCapitalize="characters"
                    autoComplete="off"
                    name="user_reg_refcode"
                    id="user_reg_refcode"
                  />
                  {regReferralCode.trim().length > 0 && (
                    <View style={{ position: 'absolute', right: 12, top: 11, backgroundColor: '#00B894', paddingHorizontal: 7, paddingVertical: 2, borderRadius: 4 }}>
                      <Text style={{ fontSize: 10, fontWeight: '800', color: '#FFFFFF' }}>+₹250 BONUS</Text>
                    </View>
                  )}
                </View>

                <TouchableOpacity
                  style={[styles.submitBtn, { marginTop: 18 }, isSubmitting && styles.submitBtnDisabled]}
                  onPress={handleRegister}
                  disabled={isSubmitting}
                >
                  <Text style={styles.submitBtnText}>
                    {isSubmitting ? 'Sending OTP...' : 'Register & Verify Mobile →'}
                  </Text>
                </TouchableOpacity>
              </View>
            )}

            {/* Quick Guest Continue */}
            <TouchableOpacity
              onPress={handleContinueAsGuest}
              style={styles.skipGuestModalBtn}
            >
              <Text style={styles.skipGuestModalText}>Continue as Guest →</Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* ==================================================
          6. CORPORATE / PROVIDERS / SECURITY MODAL
      ================================================== */}
      <Modal
        visible={!!infoModal}
        transparent
        animationType="fade"
        onRequestClose={() => setInfoModal(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContainer, { maxWidth: 500 }]}>
            <View style={styles.modalHeader}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                {infoModal === 'corporates' && <Ionicons name="business-outline" size={20} color="#00B894" />}
                {infoModal === 'providers' && <Ionicons name="medical-outline" size={20} color="#00B894" />}
                {infoModal === 'security' && <Ionicons name="shield-checkmark-outline" size={20} color="#00B894" />}
                <Text style={{ fontSize: 18, fontWeight: '800', color: '#0F172A' }}>
                  {infoModal === 'corporates' && 'Unnathi for Corporates'}
                  {infoModal === 'providers' && 'Partner with Unnathi Healthcare'}
                  {infoModal === 'security' && 'Security, Privacy & 24/7 Helpline'}
                </Text>
              </View>
              <TouchableOpacity onPress={() => setInfoModal(null)} style={styles.modalCloseBtn}>
                <Ionicons name="close" size={22} color="#64748B" />
              </TouchableOpacity>
            </View>

            <View style={{ paddingVertical: 16 }}>
              {infoModal === 'corporates' && (
                <Text style={styles.infoModalBody}>
                  Empower your workforce with comprehensive corporate health benefits. We provide annual executive checkups, on-site vaccination camps, 24/7 unlimited teleconsultation, and group cashless health insurance management.
                </Text>
              )}
              {infoModal === 'providers' && (
                <Text style={styles.infoModalBody}>
                  Are you a Doctor, Diagnostic Lab, or Specialty Hospital? Join Unnathi Healthcare to connect with thousands of active patients across Karnataka, manage digital prescriptions, and streamline OPD appointments.
                </Text>
              )}
              {infoModal === 'security' && (
                <View>
                  <Text style={styles.infoModalBody}>
                    Your health records and consultations are protected with end-to-end 256-bit encryption in compliance with Indian Telemedicine & NABH guidelines.
                  </Text>
                  <View style={{ marginTop: 12, padding: 12, backgroundColor: '#F0FDF4', borderRadius: 10, borderWidth: 1, borderColor: '#86EFAC' }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                      <Ionicons name="call" size={15} color="#166534" />
                      <Text style={{ fontWeight: '800', color: '#166534', fontSize: 13 }}>
                        24/7 Patient Emergency Helpline:
                      </Text>
                    </View>
                    <Text style={{ fontWeight: '700', color: '#15803D', fontSize: 15, marginTop: 4 }}>
                      1800-425-0099 / +91 80 2345 6789
                    </Text>
                  </View>
                </View>
              )}
            </View>

            <TouchableOpacity
              style={[styles.submitBtn, { marginTop: 10 }]}
              onPress={() => setInfoModal(null)}
            >
              <Text style={styles.submitBtnText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

// Web DOM CSS for header sticky & pointer cursor
const webStyles = {
  headerContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.98)',
    backdropFilter: 'blur(16px)',
    WebkitBackdropFilter: 'blur(16px)',
    borderBottom: '1px solid #DCE7EC',
    width: '100%',
    position: 'sticky',
    top: 0,
    zIndex: 10000,
    boxShadow: '0 2px 10px rgba(0, 0, 0, 0.04)',
  },
  footerContainer: {
    backgroundColor: '#E0ECF6',
    backgroundImage: 'linear-gradient(180deg, #DDEAF5 0%, #E5F0F8 45%, #DCE8F3 100%)',
    width: '100%',
    borderTop: '1.5px solid #C4D8E7',
    marginTop: 56,
  },
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  scrollContent: {
    paddingBottom: 0,
  },

  // ==========================================
  // HEADER
  // ==========================================
  headerInner: {
    width: '100%',
    maxWidth: '100%',
    alignSelf: 'stretch',
    height: 74,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 36,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 32,
  },
  logoTouch: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    ...(Platform.OS === 'web' ? { cursor: 'pointer' } : {}),
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  logoImg: {
    width: 36,
    height: 36,
  },
  brandTextCol: {
    justifyContent: 'center',
  },
  brandTitleRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  brandTitle: {
    fontSize: 23,
    fontWeight: '900',
    color: '#1E3A8A',
    letterSpacing: -0.6,
  },
  brandTitleAccent: {
    fontSize: 23,
    fontWeight: '900',
    color: '#00B894',
    letterSpacing: -0.6,
  },
  brandTagline: {
    fontSize: 10.5,
    color: '#64748B',
    fontWeight: '600',
    marginTop: -2,
    letterSpacing: -0.1,
  },
  navLinks: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  navItem: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
  },
  navText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#334155',
    letterSpacing: -0.1,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 20,
  },
  utilityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 6,
    paddingHorizontal: 6,
    ...(Platform.OS === 'web' ? { cursor: 'pointer' } : {}),
  },
  newBadge: {
    backgroundColor: '#1E3A8A',
    borderRadius: 4,
    paddingHorizontal: 5,
    paddingVertical: 2,
    marginRight: 3,
  },
  newBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  utilityText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#475569',
  },
  loginBtn: {
    backgroundColor: '#00B894',
    borderRadius: 10,
    paddingHorizontal: 18,
    paddingVertical: 9,
    shadowColor: '#00B894',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.22,
    shadowRadius: 6,
    elevation: 3,
    ...(Platform.OS === 'web' ? { cursor: 'pointer' } : {}),
  },
  loginBtnText: {
    fontSize: 13.5,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.1,
  },
  userDashboardBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#ECFDF5',
    borderWidth: 1,
    borderColor: '#DCE7EC',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  userAvatar: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#00B894',
    alignItems: 'center',
    justifyContent: 'center',
  },
  userNameText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1E3A8A',
    maxWidth: 100,
  },

  // ==========================================
  // HERO SEARCH SECTION
  // ==========================================
  heroSearchSection: {
    width: '100%',
    alignItems: 'center',
    paddingTop: 36,
    paddingBottom: 36,
    paddingHorizontal: 16,
    backgroundColor: '#D8EEF6',
    borderBottomWidth: 1,
    borderBottomColor: '#BFDFEB',
    position: 'relative',
    zIndex: 9999,
  },
  heroBannerWrap: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 20,
    flexWrap: 'wrap',
  },
  heroLeftCol: {
    alignItems: 'flex-start',
  },
  trustedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#D1FAE5',
    borderWidth: 1,
    borderColor: '#A7F3D0',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 20,
    marginBottom: 14,
  },
  trustedBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#047857',
    letterSpacing: 0.6,
  },
  heroTitleWrap: {
    marginBottom: 10,
  },
  heroTitleNavy: {
    fontSize: 36,
    fontWeight: '900',
    color: '#1E3A8A',
    letterSpacing: -0.8,
    lineHeight: 44,
  },
  heroTitleTeal: {
    fontSize: 36,
    fontWeight: '900',
    color: '#00B894',
    letterSpacing: -0.8,
    lineHeight: 44,
  },
  heroSubtitle: {
    fontSize: 14.5,
    fontWeight: '500',
    color: '#475569',
    lineHeight: 22,
    maxWidth: 620,
    marginBottom: 22,
  },
  unifiedSearchBar: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#DCE7EC',
    borderRadius: 16,
    height: 56,
    paddingLeft: 12,
    paddingRight: 6,
    shadowColor: '#1E3A8A',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.07,
    shadowRadius: 18,
    elevation: 4,
    position: 'relative',
    zIndex: 9999,
  },
  searchBox: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#DCE7EC',
    borderRadius: 16,
    height: 56,
    paddingLeft: 12,
    paddingRight: 6,
    shadowColor: '#1E3A8A',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.07,
    shadowRadius: 18,
    elevation: 4,
    position: 'relative',
    zIndex: 9999,
  },
  citySelectorWrap: {
    position: 'relative',
    zIndex: 10000,
    height: '100%',
    justifyContent: 'center',
  },
  citySelector: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    paddingHorizontal: 8,
    height: '100%',
    minWidth: 125,
    ...(Platform.OS === 'web' ? { cursor: 'pointer' } : {}),
  },
  cityText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1E3A8A',
  },
  cityDropdown: {
    position: 'absolute',
    top: 56,
    left: 0,
    width: 300,
    maxHeight: 340,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#DCE7EC',
    shadowColor: '#1E3A8A',
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.14,
    shadowRadius: 28,
    elevation: 99999,
    zIndex: 99999,
    padding: 8,
  },
  locationSearchInputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FAFCFD',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 7,
    gap: 8,
    borderWidth: 1,
    borderColor: '#DCE7EC',
    marginBottom: 6,
  },
  locationSearchInput: {
    flex: 1,
    fontSize: 12.5,
    color: '#1E3A8A',
    padding: 0,
    outlineStyle: 'none',
  },
  detectLocationBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 7,
    paddingHorizontal: 10,
    backgroundColor: '#ECFDF5',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#DCE7EC',
    marginBottom: 6,
    ...(Platform.OS === 'web' ? { cursor: 'pointer' } : {}),
  },
  detectLocationText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#00B894',
  },
  locationListScroll: {
    maxHeight: 220,
  },
  customLocationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 10,
    backgroundColor: '#ECFDF5',
    borderRadius: 6,
    marginBottom: 4,
    ...(Platform.OS === 'web' ? { cursor: 'pointer' } : {}),
  },
  customLocationText: {
    fontSize: 12.5,
    color: '#00B894',
  },
  cityOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 9,
    paddingHorizontal: 10,
    borderRadius: 6,
    marginBottom: 2,
    ...(Platform.OS === 'web' ? { cursor: 'pointer' } : {}),
  },
  cityOptionActive: {
    backgroundColor: '#ECFDF5',
  },
  cityOptionText: {
    fontSize: 13,
    color: '#334155',
  },
  cityOptionTextActive: {
    color: '#00B894',
    fontWeight: '700',
  },
  searchDivider: {
    width: 1.5,
    height: 28,
    backgroundColor: '#DCE7EC',
    marginHorizontal: 8,
  },
  searchInputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingRight: 6,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: '#0F172A',
    paddingVertical: 8,
    outlineStyle: 'none',
  },
  searchSubmitBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#00B894',
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 11,
    shadowColor: '#00B894',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.22,
    shadowRadius: 5,
    ...(Platform.OS === 'web' ? { cursor: 'pointer' } : {}),
  },
  searchSubmitBtnText: {
    fontSize: 13.5,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  popularSearchesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 14,
    flexWrap: 'wrap',
    gap: 8,
  },
  popularSearchesLabel: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#475569',
    marginRight: 4,
  },
  popularChipsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    alignItems: 'center',
  },
  popularChip: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#DCE7EC',
    borderRadius: 20,
    paddingHorizontal: 13,
    paddingVertical: 5.5,
    shadowColor: '#1E3A8A',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 3,
    ...(Platform.OS === 'web' ? { cursor: 'pointer' } : {}),
  },
  popularChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#475569',
  },
  heroRightVisualCluster: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginLeft: 16,
  },
  heroFamilyPhotoWrap: {
    width: 270,
    height: 280,
    borderRadius: 16,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  heroFamilyPhoto: {
    width: '100%',
    height: '100%',
    borderRadius: 16,
  },
  mediAiCard: {
    width: 285,
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    borderWidth: 1.5,
    borderColor: '#DCE7EC',
    padding: 16,
    shadowColor: '#1E3A8A',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.08,
    shadowRadius: 24,
    elevation: 6,
  },
  mediAiCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  mediAiHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  mediAiAvatar: {
    width: 30,
    height: 30,
    borderRadius: 15,
  },
  mediAiTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#1E3A8A',
  },
  mediAiBadge: {
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  mediAiBadgeText: {
    fontSize: 9.5,
    fontWeight: '800',
    color: '#047857',
  },
  mediAiQuestion: {
    fontSize: 14.5,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 4,
  },
  mediAiPrompt: {
    fontSize: 12,
    color: '#475569',
    lineHeight: 17,
    marginBottom: 12,
  },
  mediAiBtn: {
    backgroundColor: '#1E3A8A',
    borderRadius: 10,
    paddingVertical: 9,
    paddingHorizontal: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    ...(Platform.OS === 'web' ? { cursor: 'pointer' } : {}),
  },
  mediAiBtnText: {
    fontSize: 12.5,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  mediAiFeaturesList: {
    gap: 5,
  },
  mediAiFeatureItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  mediAiFeatureText: {
    fontSize: 11.5,
    color: '#334155',
    fontWeight: '500',
  },
  heroMobileCardsWrap: {
    width: '100%',
    marginTop: 18,
  },
  trustHighlightsRow: {
    width: '100%',
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 22,
    marginTop: 20,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#DCE7EC',
  },
  trustHighlightItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  trustHighlightText: {
    fontSize: 12.5,
    fontWeight: '600',
    color: '#475569',
  },

  // ==========================================
  // SECTION HEADERS
  // ==========================================
  sectionHeaderCompact: {
    width: '100%',
    alignItems: 'center',
    marginBottom: 26,
    textAlign: 'center',
  },
  sectionBadgeWrap: {
    alignSelf: 'flex-start',
    backgroundColor: '#ECFDF5',
    borderWidth: 1,
    borderColor: '#DCE7EC',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 3.5,
    marginBottom: 8,
  },
  sectionBadge: {
    fontSize: 11,
    fontWeight: '800',
    color: '#00B894',
    letterSpacing: 0.6,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: '900',
    color: '#1E3A8A',
    letterSpacing: -0.4,
    textAlign: 'center',
    marginBottom: 5,
  },
  sectionSubtitle: {
    fontSize: 14,
    fontWeight: '500',
    color: '#64748B',
    textAlign: 'center',
  },

  // ==========================================
  // 7 SERVICE CARDS — CREATIVE ILLUSTRATED DESIGN
  // ==========================================
  heroCardsSection: {
    width: '100%',
    alignSelf: 'center',
    paddingHorizontal: 16,
    marginTop: 48,
    marginBottom: 16,
    position: 'relative',
    zIndex: 1,
  },
  serviceCardsHeader: {
    marginBottom: 32,
  },
  serviceCardsTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#1E3A8A',
    letterSpacing: -0.6,
    marginBottom: 8,
    lineHeight: 36,
  },
  serviceCardsSubtitle: {
    fontSize: 14.5,
    color: '#64748B',
    fontWeight: '400',
    lineHeight: 22,
    maxWidth: 520,
  },
  heroGrid: {
    width: '100%',
  },
  heroGridDesktop: {
    flexDirection: 'row',
    alignItems: 'stretch',
    gap: 16,
    width: '100%',
  },
  heroGridTablet: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  heroGridMobile: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 14,
  },
  heroCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E2EEF3',
    overflow: 'hidden',
    shadowColor: '#1E3A8A',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.07,
    shadowRadius: 18,
    elevation: 4,
    ...(Platform.OS === 'web' ? { cursor: 'pointer' } : {}),
  },
  heroCardTop: {
    height: 180,
    width: '100%',
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: '#F1F5F9',
  },
  serviceAvailBadge: {
    position: 'absolute',
    top: 12,
    left: 12,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    gap: 5,
    zIndex: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.94)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.8)',
    shadowColor: '#1E3A8A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.14,
    shadowRadius: 6,
    elevation: 3,
    ...(Platform.OS === 'web' ? {
      backdropFilter: 'blur(8px)',
    } : {}),
  },
  serviceAvailIcon: {
    fontSize: 11,
  },
  serviceAvailText: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  serviceImgWrap: {
    width: '100%',
    height: '100%',
    overflow: 'hidden',
  },
  heroCardImage: {
    width: '100%',
    height: '100%',
  },
  heroCardBottom: {
    padding: 18,
    paddingTop: 14,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#F0F5F8',
  },
  heroCardTitle: {
    fontSize: 15.5,
    fontWeight: '700',
    color: '#1E3A8A',
    marginBottom: 5,
    letterSpacing: -0.2,
  },
  heroCardSubtitle: {
    fontSize: 12,
    fontWeight: '400',
    color: '#7B8FA6',
    lineHeight: 17,
    marginBottom: 14,
  },
  serviceBookBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 22,
    borderWidth: 1,
    gap: 2,
  },
  serviceBookBtnText: {
    fontSize: 12.5,
    fontWeight: '700',
    letterSpacing: 0.1,
  },
  consultNowRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  consultNowText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1170CF',
  },

  // ==========================================
  // SPECIALTIES SECTION
  // ==========================================
  specialtiesSection: {
    width: '100%',
    alignSelf: 'center',
    paddingHorizontal: 16,
    marginTop: 56,
    marginBottom: 64,
  },
  specialtiesHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  specialtiesTitle: {
    fontSize: 23,
    fontWeight: '900',
    color: '#1E3A8A',
    letterSpacing: -0.4,
    marginBottom: 4,
  },
  specialtiesSubtitle: {
    fontSize: 14,
    color: '#64748B',
    fontWeight: '500',
  },
  viewAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#00B894',
    borderRadius: 9,
    paddingHorizontal: 15,
    paddingVertical: 8,
    backgroundColor: '#FFFFFF',
    ...(Platform.OS === 'web' ? { cursor: 'pointer' } : {}),
  },
  viewAllBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#00B894',
  },
  specialtiesCarouselWrap: {
    position: 'relative',
    width: '100%',
    marginVertical: 4,
    justifyContent: 'center',
  },
  specialtiesScrollView: {
    width: '100%',
    ...(Platform.OS === 'web' ? {
      scrollBehavior: 'smooth',
      WebkitOverflowScrolling: 'touch',
    } : {}),
  },
  specialtiesScrollContent: {
    flexDirection: 'row',
    alignItems: 'stretch',
    paddingVertical: 14,
    paddingHorizontal: 6,
    gap: 16,
  },
  carouselArrowBtn: {
    position: 'absolute',
    top: '50%',
    marginTop: -22,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#DCE7EC',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 30,
    shadowColor: '#1E3A8A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 10,
    elevation: 8,
    ...(Platform.OS === 'web' ? {
      cursor: 'pointer',
      userSelect: 'none',
      boxShadow: '0 4px 14px rgba(30, 58, 138, 0.10)',
    } : {}),
  },
  carouselArrowLeft: {
    left: -14,
  },
  carouselArrowRight: {
    right: -14,
  },
  carouselArrowDisabled: {
    opacity: 0.28,
    ...(Platform.OS === 'web' ? {
      cursor: 'not-allowed',
      pointerEvents: 'none',
      boxShadow: 'none',
    } : {}),
  },
  specialtiesRow: {
    width: '100%',
  },
  specialtiesRowDesktop: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    rowGap: 20,
    justifyContent: 'space-between',
  },
  specialtiesRowTablet: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
    justifyContent: 'space-between',
  },
  specialtiesRowMobile: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    justifyContent: 'space-between',
  },
  specialtiesRowWrapped: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 14,
  },
  specialtyItem: {
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#DCE7EC',
    paddingTop: 18,
    paddingBottom: 16,
    paddingHorizontal: 12,
    shadowColor: '#1E3A8A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 10,
    elevation: 2,
    marginBottom: 6,
    flexShrink: 0,
    ...(Platform.OS === 'web' ? { cursor: 'pointer', boxSizing: 'border-box' } : {}),
  },
  specialtyItemDesktop: {
    width: 202,
  },
  specialtyItemTablet: {
    width: 175,
  },
  specialtyItemMobile: {
    width: 152,
    paddingHorizontal: 8,
  },
  specialtyIconWrap: {
    width: 86,
    height: 86,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    backgroundColor: 'transparent',
    overflow: 'hidden',
  },
  specialtyImage: {
    width: '100%',
    height: '100%',
  },
  specialtyItemTitle: {
    fontSize: 14.5,
    fontWeight: '800',
    color: '#1E3A8A',
    textAlign: 'center',
    marginBottom: 4,
    letterSpacing: -0.2,
  },
  specialtyItemSubtitle: {
    fontSize: 11.5,
    fontWeight: '500',
    color: '#475569',
    textAlign: 'center',
    marginBottom: 12,
    lineHeight: 16,
    minHeight: 32,
    paddingHorizontal: 2,
  },
  consultNowTouch: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 5.5,
    paddingHorizontal: 14,
    borderRadius: 20,
    backgroundColor: '#ECFDF5',
    borderWidth: 1,
    borderColor: '#DCE7EC',
  },
  consultNowText: {
    fontSize: 10.5,
    fontWeight: '800',
    color: '#00B894',
    letterSpacing: 0.4,
  },

  // ==========================================
  // TRUST SECTION
  // ==========================================
  trustSection: {
    width: '100%',
    alignSelf: 'center',
    paddingHorizontal: 16,
    marginTop: 56,
  },
  trustGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 18,
  },
  trustCard: {
    flex: 1,
    minWidth: 240,
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 22,
    borderWidth: 1,
    borderColor: '#DCE7EC',
    shadowColor: '#1E3A8A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 10,
    elevation: 2,
  },
  trustIconWrap: {
    width: 46,
    height: 46,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  trustCardTitle: {
    fontSize: 15.5,
    fontWeight: '800',
    color: '#1E3A8A',
    marginBottom: 5,
  },
  trustCardDesc: {
    fontSize: 13,
    color: '#64748B',
    lineHeight: 19,
  },

  // ==========================================
  // EMERGENCY BANNER
  // ==========================================
  emergencyBanner: {
    width: '100%',
    alignSelf: 'center',
    marginTop: 48,
    backgroundColor: '#FFF2ED',
    borderRadius: 18,
    paddingVertical: 18,
    paddingHorizontal: 24,
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1.5,
    borderColor: '#FFD7C7',
    gap: 16,
  },
  emergencyLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    minWidth: 260,
  },
  emergencyIconPulse: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FFE5DC',
    alignItems: 'center',
    justifyContent: 'center',
  },
  emergencyTitle: {
    fontSize: 15.5,
    fontWeight: '800',
    color: '#1E3A8A',
    marginBottom: 2,
  },
  emergencySubtitle: {
    fontSize: 12.5,
    color: '#FF7F50',
    lineHeight: 17,
  },
  emergencyRight: {
    alignItems: 'flex-end',
  },
  emergencyCallBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FF7F50',
    paddingHorizontal: 18,
    paddingVertical: 9,
    borderRadius: 9,
    shadowColor: '#FF7F50',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    ...(Platform.OS === 'web' ? { cursor: 'pointer' } : {}),
  },
  emergencyCallText: {
    fontSize: 13.5,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.3,
  },

  // ==========================================
  // GUEST STRIP
  // ==========================================
  guestStrip: {
    width: '100%',
    alignSelf: 'center',
    marginTop: 36,
    backgroundColor: '#ECFDF5',
    borderRadius: 16,
    paddingVertical: 18,
    paddingHorizontal: 24,
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1.5,
    borderColor: '#DCE7EC',
    gap: 14,
  },
  guestStripHeading: {
    fontSize: 15,
    fontWeight: '800',
    color: '#1E3A8A',
    marginBottom: 2,
  },
  guestStripText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#64748B',
  },
  guestStripBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#1E3A8A',
    borderWidth: 1,
    borderColor: '#1E3A8A',
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 9,
    shadowColor: '#1E3A8A',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    ...(Platform.OS === 'web' ? { cursor: 'pointer' } : {}),
  },
  guestStripBtnText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#FFFFFF',
  },

  // ==========================================
  // RICH FOOTER
  // ==========================================
  footerInner: {
    width: '100%',
    alignSelf: 'center',
    paddingTop: 48,
    paddingBottom: 40,
    paddingHorizontal: 24,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 36,
    justifyContent: 'space-between',
  },
  footerColBrand: {
    flex: 1.6,
    minWidth: 260,
  },
  footerBrandDesc: {
    fontSize: 13,
    color: '#4A6572',
    lineHeight: 20,
    marginTop: 12,
    marginBottom: 18,
    maxWidth: 340,
  },
  complianceRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  compliancePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderWidth: 1,
    borderColor: '#C4D8E7',
  },
  compliancePillText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#1E3A8A',
  },
  footerCol: {
    flex: 1,
    minWidth: 160,
  },
  footerColTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#1E3A8A',
    marginBottom: 14,
    letterSpacing: 0.2,
  },
  footerLink: {
    fontSize: 13,
    color: '#334155',
    marginBottom: 10,
    ...(Platform.OS === 'web' ? { cursor: 'pointer' } : {}),
  },
  footerBottomBar: {
    borderTopWidth: 1,
    borderTopColor: '#C4D8E7',
    paddingVertical: 18,
    alignItems: 'center',
  },
  footerBottomText: {
    fontSize: 12,
    color: '#475569',
    fontWeight: '500',
  },

  // ==========================================
  // MODAL STYLES
  // ==========================================
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(30, 58, 138, 0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    width: '100%',
    maxWidth: 440,
    maxHeight: '92%',
    padding: 28,
    borderWidth: 1,
    borderColor: '#DCE7EC',
    shadowColor: '#1E3A8A',
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.15,
    shadowRadius: 32,
    elevation: 8,
    ...(Platform.OS === 'web' ? { overflowY: 'auto' } : {}),
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  modalLogoWrap: {
    alignItems: 'flex-start',
  },
  modalCloseBtn: {
    padding: 6,
    ...(Platform.OS === 'web' ? { cursor: 'pointer' } : {}),
  },
  authTabRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#DCE7EC',
    marginBottom: 18,
  },
  authTab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
    ...(Platform.OS === 'web' ? { cursor: 'pointer' } : {}),
  },
  authTabActive: {
    borderBottomColor: '#00B894',
  },
  authTabText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748B',
  },
  authTabTextActive: {
    color: '#00B894',
    fontWeight: '800',
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FFF2ED',
    borderWidth: 1,
    borderColor: '#FFD7C7',
    borderRadius: 8,
    padding: 10,
    marginBottom: 14,
  },
  errorText: {
    fontSize: 12.5,
    color: '#FF7F50',
    fontWeight: '600',
    flex: 1,
  },
  formContainer: {
    width: '100%',
  },
  inputLabel: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#1E3A8A',
    marginBottom: 6,
  },
  textInput: {
    backgroundColor: '#FAFCFD',
    borderWidth: 1,
    borderColor: '#DCE7EC',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: '#1E3A8A',
    outlineStyle: 'none',
  },
  passwordWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FAFCFD',
    borderWidth: 1,
    borderColor: '#DCE7EC',
    borderRadius: 8,
  },
  eyeBtn: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    ...(Platform.OS === 'web' ? { cursor: 'pointer' } : {}),
  },
  forgotBtn: {
    alignSelf: 'flex-end',
    marginTop: 8,
    marginBottom: 16,
    ...(Platform.OS === 'web' ? { cursor: 'pointer' } : {}),
  },
  forgotText: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#00B894',
  },
  submitBtn: {
    backgroundColor: '#00B894',
    borderRadius: 9,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#00B894',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    ...(Platform.OS === 'web' ? { cursor: 'pointer' } : {}),
  },
  submitBtnDisabled: {
    opacity: 0.6,
  },
  submitBtnText: {
    fontSize: 14.5,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  skipGuestModalBtn: {
    marginTop: 18,
    alignSelf: 'center',
    padding: 6,
    ...(Platform.OS === 'web' ? { cursor: 'pointer' } : {}),
  },
  skipGuestModalText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748B',
  },
  infoModalBody: {
    fontSize: 14,
    lineHeight: 22,
    color: '#334155',
  },
  moreServicesWrapper: {
    position: 'relative',
    zIndex: 10000,
  },
  moreServicesDropdown: {
    position: 'absolute',
    top: 40,
    left: 0,
    width: 260,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#DCE7EC',
    shadowColor: '#1E3A8A',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.1,
    shadowRadius: 24,
    elevation: 20,
    zIndex: 99999,
    overflow: 'hidden',
  },
  moreServicesMenuList: {
    paddingVertical: 6,
  },
  moreServiceMenuItem: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    ...(Platform.OS === 'web' ? { cursor: 'pointer' } : {}),
  },
  moreServiceMenuText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#334155',
  },
  moreServicesDivider: {
    height: 1,
    backgroundColor: '#DCE7EC',
    width: '100%',
  },
  moreServicesFooter: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#F1F8FB',
    borderTopWidth: 1,
    borderTopColor: '#DCE7EC',
    ...(Platform.OS === 'web' ? { cursor: 'pointer' } : {}),
  },
  moreServicesFooterTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#00B894',
  },
  moreServicesFooterDesc: {
    fontSize: 11,
    color: '#64748B',
    lineHeight: 15,
    marginTop: 2,
  },
  demoCredsBox: {
    marginTop: 14,
    marginBottom: 6,
    padding: 12,
    backgroundColor: '#F0FDF9',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  demoCredsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  demoCredsTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#065F46',
  },
  demoFillBtn: {
    backgroundColor: '#00B894',
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 6,
    ...(Platform.OS === 'web' ? { cursor: 'pointer' } : {}),
  },
  demoFillBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  demoCredsText: {
    fontSize: 12,
    color: '#475569',
    lineHeight: 18,
  },
});

const LoginScreenResponsive = (props) => {
  const { width } = useWindowDimensions();
  if (width < 768) {
    return <LoginScreenMobile {...props} />;
  }
  return <LoginScreenWeb {...props} />;
};

export default LoginScreenResponsive;
