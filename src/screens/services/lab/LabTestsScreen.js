import React, { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  Platform,
  StatusBar,
  useWindowDimensions,
  ActivityIndicator,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { saveTransaction } from '../../../services/transactionService';
import colors from '../../../theme/colors';
import {
  LAB_CATEGORIES,
  LAB_TESTS_MASTER,
  DIAGNOSTIC_CENTRES as BASE_DIAGNOSTIC_CENTRES,
  ALL_CITY_DIAGNOSTIC_CENTRES,
  getCentresByCity,
  getAvailableDates,
  TIME_SLOTS,
  INITIAL_LAB_BOOKINGS,
  INITIAL_LAB_REPORTS,
  getGoogleMapsDirectionsUrl,
} from '../../../data/labTestData';
import {
  NOVUS_POPULAR_PACKAGES,
} from '../../../data/novusPackagesData';
import {
  getSlotStatus,
  validateAndBookSlot,
  subscribeToSlotChanges,
} from '../../../services/slotBookingService';
import LabTestsScreenWeb from './LabTestsScreen.web';
import { showAlert } from '../../../utils/alert';
import { useCart } from '../../../context/CartContext';
import { useAuthGuard } from '../../../context/AuthGuardContext';

// Helper to normalize city names
const normalizeCity = (cityStr) => {
  if (!cityStr) return '';
  const s = cityStr.toLowerCase().trim();
  if (s.includes('mysur') || s.includes('myso')) return 'Mysuru';
  if (s.includes('bengalur') || s.includes('bangal')) return 'Bengaluru';
  if (s.includes('hassan')) return 'Hassan';
  if (s.includes('mandya')) return 'Mandya';
  if (s.includes('mangal') || s.includes('mangalore')) return 'Mangaluru';
  if (s.includes('hubli') || s.includes('hubballi')) return 'Hubballi';
  if (s.includes('belgaum') || s.includes('belagavi')) return 'Belagavi';
  if (s.includes('tumkur') || s.includes('tumakuru')) return 'Tumakuru';
  return cityStr.trim();
};

const QUICK_TAGS = [
  'Complete Blood Count',
  'Diabetes HbA1c',
  'Full Body Checkup',
];

// =============================================================================
// MOBILE LAB TEST CATEGORIES (INCLUDES "POPULAR" CATEGORY)
// =============================================================================
const MOST_POPULAR_CATEGORY = {
  id: 'most-popular',
  name: 'Popular',
  icon: 'flame-outline',
  badge: 'Trending',
  description: 'Most frequently booked routine health checkups, blood tests, and vital panels',
  subCategories: [
    { id: 'pop-routine', name: 'Routine Checks' },
    { id: 'pop-vital', name: 'Vital Organs' },
    { id: 'pop-diabetes-heart', name: 'Diabetes & Heart' },
  ],
};

const MOBILE_LAB_CATEGORIES = [
  MOST_POPULAR_CATEGORY,
  ...LAB_CATEGORIES.map((cat) => ({
    ...cat,
    icon: (!cat.icon || cat.icon === 'heart-pulse-outline') ? 'pulse-outline' : cat.icon,
  })),
];

const POPULAR_CLINICAL_TEST_IDS = [
  'test-cbc',
  'test-hba1c',
  'test-fbs',
  'test-lipid',
  'test-thyroid',
  'test-vitamind',
  'test-vitaminb12',
  'test-lft',
  'test-kft',
  'test-ferritin',
];

const LabTestsScreen = (props) => {
  // 1. Strict Web delegation (Preserves Web Application completely)
  if (Platform.OS === 'web') {
    return <LabTestsScreenWeb {...props} />;
  }

  const { navigation, route } = props;
  const { width } = useWindowDimensions();
  const isTablet = width >= 600;
  const scrollViewRef = useRef(null);
  const { requireLogin } = useAuthGuard();

  // Cart Context
  const { labCart = [], addToCart, removeFromCart, labCartCount = 0 } = useCart();
  const isItemInCart = (id) => labCart?.some((item) => item.id === id);

  // ===========================================================================
  // 2. LOCATION AS SINGLE SOURCE OF TRUTH (READ ONLY FROM HOME SCREEN)
  // ===========================================================================
  const [currentCity, setCurrentCity] = useState('');
  const [hasResolvedLocation, setHasResolvedLocation] = useState(false);

  const syncHomeScreenLocation = useCallback(async () => {
    try {
      const savedCity = await AsyncStorage.getItem('@mediunify_selected_city');
      const savedLoc = await AsyncStorage.getItem('@unnathi_user_location');
      const raw = savedCity || savedLoc || route?.params?.city || '';
      const normalized = normalizeCity(raw);
      if (normalized) {
        setCurrentCity(normalized);
      } else {
        // No location found on Home Screen
        setCurrentCity('');
      }
    } catch (e) {
      setCurrentCity('');
    } finally {
      setHasResolvedLocation(true);
    }
  }, [route?.params?.city]);

  // Synchronize on mount and whenever screen gains focus
  useEffect(() => {
    syncHomeScreenLocation();
    const unsub = navigation.addListener('focus', () => {
      syncHomeScreenLocation();
    });
    return unsub;
  }, [navigation, syncHomeScreenLocation]);

  // City-specific diagnostic centres (STRICT LOCATION FILTERING)
  const cityDiagnosticCentres = useMemo(() => {
    if (!currentCity) return [];
    return ALL_CITY_DIAGNOSTIC_CENTRES.filter(
      (c) => c.city.toLowerCase() === currentCity.toLowerCase()
    );
  }, [currentCity]);

  // Top Tabs: 'BROWSE' | 'BOOKINGS' | 'REPORTS'
  const [activeTab, setActiveTab] = useState(route?.params?.initialTab || 'BROWSE');

  // Sub-view in Browse: 'ALL' | 'PACKAGES' | 'TESTS'
  const [browseSubView, setBrowseSubView] = useState('ALL');

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState(route?.params?.query || route?.params?.search || '');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedSubCategory, setSelectedSubCategory] = useState('all');
  const [filterModalVisible, setFilterModalVisible] = useState(false);
  const [sortModalVisible, setSortModalVisible] = useState(false);
  const [selectedGenderFilter, setSelectedGenderFilter] = useState('ALL');
  const [selectedSampleFilter, setSelectedSampleFilter] = useState('ALL');
  const [selectedCollectionFilter, setSelectedCollectionFilter] = useState('ALL');
  const [selectedPriceFilter, setSelectedPriceFilter] = useState('ALL');
  const [selectedSort, setSelectedSort] = useState('RECOMMENDED'); // 'RECOMMENDED' | 'PRICE_LOW_HIGH' | 'PRICE_HIGH_LOW' | 'MOST_TESTS'
  const [selectedInclusions, setSelectedInclusions] = useState([]); // ['VITAMINS', 'ECG_IMAGING', 'ECHO', 'IRON', 'HBA1C']

  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (selectedCategory !== 'all') count++;
    if (selectedSubCategory !== 'all') count++;
    if (selectedGenderFilter !== 'ALL') count++;
    if (selectedSampleFilter !== 'ALL') count++;
    if (selectedCollectionFilter !== 'ALL') count++;
    if (selectedPriceFilter !== 'ALL') count++;
    if (selectedInclusions.length > 0) count += selectedInclusions.length;
    return count;
  }, [selectedCategory, selectedSubCategory, selectedGenderFilter, selectedSampleFilter, selectedCollectionFilter, selectedPriceFilter, selectedInclusions]);

  const resetAllFilters = () => {
    setSelectedCategory('all');
    setSelectedSubCategory('all');
    setSelectedGenderFilter('ALL');
    setSelectedSampleFilter('ALL');
    setSelectedCollectionFilter('ALL');
    setSelectedPriceFilter('ALL');
    setSelectedInclusions([]);
    setSelectedSort('RECOMMENDED');
  };

  const getSortLabel = (id) => {
    switch (id) {
      case 'PRICE_LOW_HIGH': return 'Price: Low to High';
      case 'PRICE_HIGH_LOW': return 'Price: High to Low';
      case 'MOST_TESTS': return 'Most Tests';
      default: return 'Recommended';
    }
  };

  // Toggle inclusion for packages
  const toggleInclusion = (id) => {
    setSelectedInclusions((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  // Active Category Object
  const activeCategoryObj = useMemo(() => {
    return MOBILE_LAB_CATEGORIES.find((c) => c.id === selectedCategory);
  }, [selectedCategory]);

  // ===========================================================================
  // 3. PACKAGES & TESTS DATA FILTERING
  // ===========================================================================
  const filteredPackages = useMemo(() => {
    if (!cityDiagnosticCentres || cityDiagnosticCentres.length === 0) return [];

    let list = NOVUS_POPULAR_PACKAGES.filter((pkg) => {
      // Category filter
      if (selectedCategory !== 'all') {
        if (selectedCategory === 'most-popular') {
          const isPop =
            pkg.isMostPopularBooked ||
            pkg.badge?.toLowerCase().includes('popular') ||
            ['POP-FB-01', 'POP-EXE-01', 'POP-DIA-01', 'POP-HRT-01'].includes(pkg.id);
          if (!isPop) return false;
        } else if (pkg.categoryId !== selectedCategory) {
          return false;
        }
      }

      // Price filter
      if (selectedPriceFilter === 'UNDER_1000' && pkg.price >= 1000) return false;
      if (selectedPriceFilter === '1000_2000' && (pkg.price < 1000 || pkg.price > 2000)) return false;
      if (selectedPriceFilter === 'ABOVE_2000' && pkg.price <= 2000) return false;

      // Key Inclusions
      if (selectedInclusions.includes('VITAMINS')) {
        const hasVit = pkg.tests.some(
          (t) => t.name.toLowerCase().includes('vitamin') || t.parameters.toLowerCase().includes('vitamin')
        );
        if (!hasVit) return false;
      }
      if (selectedInclusions.includes('ECG_IMAGING')) {
        const hasEcg = pkg.tests.some(
          (t) => t.name.toLowerCase().includes('ecg') || t.name.toLowerCase().includes('ultrasound')
        );
        if (!hasEcg) return false;
      }
      if (selectedInclusions.includes('ECHO')) {
        const hasEcho = pkg.tests.some((t) => t.name.toLowerCase().includes('echo'));
        if (!hasEcho) return false;
      }
      if (selectedInclusions.includes('IRON')) {
        const hasIron = pkg.tests.some(
          (t) => t.name.toLowerCase().includes('iron') || t.name.toLowerCase().includes('ferritin')
        );
        if (!hasIron) return false;
      }
      if (selectedInclusions.includes('HBA1C')) {
        const hasHba1c = pkg.tests.some((t) => t.name.toLowerCase().includes('hba1c'));
        if (!hasHba1c) return false;
      }

      // Collection filter
      if (selectedCollectionFilter === 'HOME' && pkg.homeCollectionAvailable === false) return false;

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesName = pkg.name.toLowerCase().includes(q);
        const matchesCode = pkg.code.toLowerCase().includes(q);
        const matchesCategory = pkg.category.toLowerCase().includes(q);
        const matchesTests = pkg.tests.some(
          (t) =>
            t.name.toLowerCase().includes(q) ||
            t.parameters.toLowerCase().includes(q)
        );
        if (!matchesName && !matchesCode && !matchesCategory && !matchesTests) {
          return false;
        }
      }

      return true;
    });

    // Sorting
    const sorted = [...list];
    if (selectedSort === 'PRICE_LOW_HIGH') {
      sorted.sort((a, b) => a.price - b.price);
    } else if (selectedSort === 'PRICE_HIGH_LOW') {
      sorted.sort((a, b) => b.price - a.price);
    } else if (selectedSort === 'MOST_TESTS') {
      sorted.sort((a, b) => b.testsCount - a.testsCount);
    }
    return sorted;
  }, [
    cityDiagnosticCentres,
    selectedCategory,
    selectedPriceFilter,
    selectedInclusions,
    selectedCollectionFilter,
    searchQuery,
    selectedSort,
  ]);

  const filteredTests = useMemo(() => {
    if (!cityDiagnosticCentres || cityDiagnosticCentres.length === 0) return [];

    let list = LAB_TESTS_MASTER.filter((test) => {
      // Category filter
      if (selectedCategory !== 'all') {
        if (selectedCategory === 'most-popular') {
          const isPop =
            test.popular === true ||
            test.isPopular === true ||
            POPULAR_CLINICAL_TEST_IDS.includes(test.id);
          if (!isPop) return false;

          // Subcategory filter under Most Popular Tests
          if (selectedSubCategory !== 'all') {
            if (
              selectedSubCategory === 'pop-routine' &&
              !['test-cbc', 'test-lft', 'test-kft', 'test-ferritin'].includes(test.id)
            ) {
              return false;
            }
            if (
              selectedSubCategory === 'pop-vital' &&
              !['test-thyroid', 'test-vitamind', 'test-vitaminb12', 'test-lft', 'test-kft'].includes(test.id)
            ) {
              return false;
            }
            if (
              selectedSubCategory === 'pop-diabetes-heart' &&
              !['test-hba1c', 'test-fbs', 'test-lipid'].includes(test.id)
            ) {
              return false;
            }
          }
        } else if (test.category !== selectedCategory) {
          return false;
        } else if (selectedSubCategory !== 'all' && test.subCategory !== selectedSubCategory) {
          return false;
        }
      }

      if (selectedGenderFilter !== 'ALL' && test.genderApplicability !== 'All') {
        if (selectedGenderFilter === 'MALE' && test.genderApplicability !== 'Male') return false;
        if (selectedGenderFilter === 'FEMALE' && test.genderApplicability !== 'Female') return false;
      }

      if (selectedSampleFilter !== 'ALL' && test.sampleType !== selectedSampleFilter) return false;
      if (selectedCollectionFilter === 'HOME' && !test.homeCollection) return false;
      if (selectedCollectionFilter === 'CENTRE' && !test.centreCollection) return false;

      if (selectedPriceFilter === 'UNDER_1000' && test.price >= 1000) return false;
      if (selectedPriceFilter === '1000_2000' && (test.price < 1000 || test.price > 2000)) return false;
      if (selectedPriceFilter === 'ABOVE_2000' && test.price <= 2000) return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesName = test.name.toLowerCase().includes(q);
        const matchesDesc = test.description.toLowerCase().includes(q);
        const matchesKeywords = test.keywords?.some((k) => k.toLowerCase().includes(q));
        const matchesSynonyms = test.synonyms?.some((s) => s.toLowerCase().includes(q));
        const matchesConsumer = test.consumerTerms?.some((c) => c.toLowerCase().includes(q));

        if (!matchesName && !matchesDesc && !matchesKeywords && !matchesSynonyms && !matchesConsumer) {
          return false;
        }
      }
      return true;
    });

    const sorted = [...list];
    if (selectedSort === 'PRICE_LOW_HIGH') {
      sorted.sort((a, b) => a.price - b.price);
    } else if (selectedSort === 'PRICE_HIGH_LOW') {
      sorted.sort((a, b) => b.price - a.price);
    }
    return sorted;
  }, [
    cityDiagnosticCentres,
    searchQuery,
    selectedCategory,
    selectedSubCategory,
    selectedGenderFilter,
    selectedSampleFilter,
    selectedCollectionFilter,
    selectedPriceFilter,
    selectedSort,
  ]);

  // Details Modal States
  const [selectedTest, setSelectedTest] = useState(null);
  const [selectedPackage, setSelectedPackage] = useState(null);
  const [expandedTestIdx, setExpandedTestIdx] = useState(null);

  // Cart Handler for Tests
  const handleToggleCartTest = (test) => {
    if (isItemInCart(test.id)) {
      removeFromCart(test.id, 'lab');
      showAlert('Removed from Cart', `${test.name} removed from your diagnostic cart.`);
    } else {
      const cartItem = {
        id: test.id,
        name: test.name,
        category: 'Lab Test',
        itemType: 'lab',
        price: test.price,
        mrp: test.mrp || Math.round(test.price * 1.25),
        centerName: cityDiagnosticCentres[0]?.name || `${currentCity} Partner Laboratory`,
        reportTime: test.reportTAT || 'Within 24 Hours',
        sampleType: test.sampleType || 'Blood Sample',
        homeSample: Boolean(test.homeCollection),
        fastingRequired: test.fastingRequirement,
      };
      addToCart(cartItem, 1, 'lab');
      showAlert('Added to Cart', `${test.name} has been added to your cart.`);
    }
  };

  // Cart Handler for Packages
  const handleToggleCartPackage = (pkg) => {
    if (isItemInCart(pkg.id)) {
      removeFromCart(pkg.id, 'lab');
      showAlert('Removed from Cart', `${pkg.name} removed from your diagnostic cart.`);
    } else {
      const cartItem = {
        id: pkg.id,
        name: pkg.name,
        category: 'Lab Test',
        itemType: 'lab',
        price: pkg.price,
        mrp: pkg.mrp || Math.round(pkg.price * 1.3),
        centerName: cityDiagnosticCentres[0]?.name || `${currentCity} Health Care Lab`,
        reportTime: pkg.tatSummary || 'Within 24-48 Hours',
        sampleType: `${pkg.testsCount || 'Multiple'} Tests Included`,
        homeSample: true,
        isPackage: true,
      };
      addToCart(cartItem, 1, 'lab');
      showAlert('Added to Cart', `${pkg.name} has been added to your cart.`);
    }
  };

  // ===========================================================================
  // 4. BOOKING JOURNEY (5 STEPS - SOURCE OF TRUTH)
  // ===========================================================================
  const [activeBookingItem, setActiveBookingItem] = useState(null);
  const [bookingFlowStep, setBookingFlowStep] = useState(1);
  const [collectionMethod, setCollectionMethod] = useState('HOME');
  const [selectedCentreId, setSelectedCentreId] = useState('');
  const [selectedDate, setSelectedDate] = useState(getAvailableDates()[0].dateStr);
  const [selectedSlotId, setSelectedSlotId] = useState('slot-2');
  const [paymentMethod, setPaymentMethod] = useState('UPI');
  const [confirmedBookingData, setConfirmedBookingData] = useState(null);
  const [slotTick, setSlotTick] = useState(0);

  // Address fields for Home Sample Collection
  const [homeAddressName, setHomeAddressName] = useState('Hemanth Gowda');
  const [homeAddressPhone, setHomeAddressPhone] = useState('9741422544');
  const [homeAddressFlat, setHomeAddressFlat] = useState('Flat 402, Green Meadows');
  const [homeAddressPincode, setHomeAddressPincode] = useState('570023');
  const [homeAddressLandmark, setHomeAddressLandmark] = useState('Near Complex Circle');

  // Patient Profiles (Self + Family)
  const [patientProfiles, setPatientProfiles] = useState([
    { id: 'p-self', name: 'Hemanth Gowda', relation: 'Self', age: 28, gender: 'Male', phone: '9741422544' },
  ]);
  const [selectedPatientId, setSelectedPatientId] = useState('p-self');

  // Load patient profiles and family members
  useEffect(() => {
    (async () => {
      try {
        const storedName = await AsyncStorage.getItem('userName');
        const storedPhone = await AsyncStorage.getItem('userPhone');
        const storedPrimary = await AsyncStorage.getItem('@unnathi_primary_user');
        let effectiveName = storedName || 'Hemanth Gowda';
        let effectivePhone = storedPhone || '9741422544';

        if (storedPrimary) {
          try {
            const p = JSON.parse(storedPrimary);
            if (p?.name) effectiveName = p.name.replace(/\s*\(Self\)$/i, '').trim();
            if (p?.phone) effectivePhone = p.phone.trim();
          } catch (e) {}
        }

        const selfProfile = {
          id: 'p-self',
          name: effectiveName,
          relation: 'Self',
          age: 28,
          gender: 'Male',
          phone: effectivePhone,
        };

        const storedFam = await AsyncStorage.getItem('@unnathi_family_members');
        let familyList = [];
        if (storedFam) {
          try {
            const parsed = JSON.parse(storedFam);
            if (Array.isArray(parsed)) {
              familyList = parsed
                .filter((m) => m && m.relation !== 'Self' && !m.isPrimary)
                .map((m, idx) => ({
                  id: m.id || `p-fam-${idx + 1}`,
                  name: m.name || m.displayName || 'Family Member',
                  relation: m.relation || 'Family',
                  age: m.age || 32,
                  gender: m.gender || 'Not specified',
                  phone: m.phone || effectivePhone,
                }));
            }
          } catch (e) {}
        }

        setPatientProfiles([selfProfile, ...familyList]);
        setHomeAddressName(effectiveName);
        setHomeAddressPhone(effectivePhone);
      } catch (e) {}
    })();
  }, []);

  // Update default selected centre when city changes
  useEffect(() => {
    if (cityDiagnosticCentres.length > 0) {
      setSelectedCentreId(cityDiagnosticCentres[0].id);
    }
  }, [cityDiagnosticCentres]);

  // Subscribe to real-time slot bookings
  useEffect(() => {
    const unsub = subscribeToSlotChanges(() => {
      setSlotTick((prev) => prev + 1);
    });
    return unsub;
  }, []);

  // Ensure selected slot is available
  useEffect(() => {
    const providerId = collectionMethod === 'HOME' ? 'home-collection' : selectedCentreId;
    const currentSlot = TIME_SLOTS.find((s) => s.id === selectedSlotId);
    const status = getSlotStatus({
      date: selectedDate,
      time: currentSlot?.label || '',
      serviceType: 'lab',
      providerId,
    });
    if (!status.available) {
      const firstAvail = TIME_SLOTS.find(
        (s) =>
          getSlotStatus({
            date: selectedDate,
            time: s.label,
            serviceType: 'lab',
            providerId,
          }).available
      );
      if (firstAvail) {
        setSelectedSlotId(firstAvail.id);
      }
    }
  }, [selectedDate, collectionMethod, selectedCentreId, slotTick, selectedSlotId]);

  // Start booking flow for a test or package
  const startBooking = (item, preferredMethod = null) => {
    requireLogin(() => {
      const isPkg = Boolean(item.tests || item.code || item.isPackage);
      const bookingItem = {
        ...item,
        id: item.id || item.code,
        name: item.name,
        code: item.code,
        isPackage: isPkg,
        testsCount: item.testsCount || (item.tests ? item.tests.length : 1),
        price: item.price,
        mrp: item.mrp || Math.round(item.price * 1.5),
        homeCollection: item.homeCollectionAvailable !== false && item.homeCollection !== false,
        centreCollection: true,
        preparation: item.preparationSummary || item.preparation || 'No special fasting required',
      };
      setActiveBookingItem(bookingItem);
      const freshDates = getAvailableDates();
      if (!freshDates.some((d) => d.dateStr === selectedDate)) {
        setSelectedDate(freshDates[0].dateStr);
      }
      if (preferredMethod) {
        setCollectionMethod(preferredMethod);
      } else if (bookingItem.homeCollection) {
        setCollectionMethod('HOME');
      } else {
        setCollectionMethod('CENTRE');
      }
      setBookingFlowStep(1);
    });
  };

  // Simulate payment & save booking
  const handleSimulatePayment = async () => {
    const isHome = collectionMethod === 'HOME';
    if (
      isHome &&
      (!homeAddressName.trim() ||
        !homeAddressPhone.trim() ||
        !homeAddressFlat.trim() ||
        !homeAddressPincode.trim())
    ) {
      showAlert('Incomplete Address', 'Please fill in patient name, phone, address, and pincode.');
      return;
    }

    const testPrice = activeBookingItem.price;
    const collectionFee = isHome ? 100 : 0;
    const total = testPrice + collectionFee;
    const selectedCentre = cityDiagnosticCentres.find((c) => c.id === selectedCentreId) || cityDiagnosticCentres[0];
    const selectedSlot = TIME_SLOTS.find((s) => s.id === selectedSlotId);
    const selectedPat = patientProfiles.find((p) => p.id === selectedPatientId) || patientProfiles[0];

    // Real-Time Atomic Slot Validation
    const slotValidation = await validateAndBookSlot({
      date: selectedDate,
      time: selectedSlot?.label || '8:30 AM – 9:30 AM',
      serviceType: 'lab',
      providerId: isHome ? 'home-collection' : selectedCentreId,
      slotId: selectedSlotId,
      patientName: homeAddressName.trim() || selectedPat.name,
    });

    if (!slotValidation.success) {
      showAlert('Slot Unavailable', 'This slot is no longer available. Please select another time.');
      return;
    }

    const manualAddr = isHome
      ? `${homeAddressFlat.trim()}, ${currentCity} - ${homeAddressPincode.trim()}${
          homeAddressLandmark.trim() ? ` (Near ${homeAddressLandmark.trim()})` : ''
        }`
      : null;

    const newBookingId = `LAB-2026-00${Math.floor(100 + Math.random() * 900)}`;

    const newBooking = {
      id: newBookingId,
      testId: activeBookingItem.id,
      testName: activeBookingItem.name,
      city: currentCity,
      collectionMethod: collectionMethod,
      collectionAddress: manualAddr,
      collectionContactName: homeAddressName.trim() || selectedPat.name,
      collectionContactPhone: homeAddressPhone.trim() || selectedPat.phone,
      diagnosticCentre: isHome ? null : { name: selectedCentre?.name, location: selectedCentre?.location, address: selectedCentre?.address },
      bookingDate: selectedDate,
      timeSlot: selectedSlot?.label || '8:30 AM – 9:30 AM',
      amountPaid: total,
      testPrice: testPrice,
      collectionFee: collectionFee,
      status: 'CONFIRMED',
      trackingStage: 1,
      patientName: `${selectedPat.name} (${selectedPat.relation})`,
      phlebotomistName: isHome ? 'Muralidhar Rao (Certified Phlebotomist)' : null,
      phlebotomistPhone: isHome ? '+91 98452 33110' : null,
      reportReady: false,
    };

    setConfirmedBookingData(newBooking);
    setBookingsList((prev) => [newBooking, ...prev]);
    setBookingFlowStep(5);

    try {
      // 1. Save to @labBookings
      for (const k of ['@labBookings', 'labBookings']) {
        const existingRaw = await AsyncStorage.getItem(k);
        const existingList = existingRaw ? JSON.parse(existingRaw) : [];
        const nextList = [newBooking, ...(Array.isArray(existingList) ? existingList : [])];
        await AsyncStorage.setItem(k, JSON.stringify(nextList));
      }

      // 2. Save for MyTests dashboard
      const dashboardBooking = {
        id: newBookingId,
        bookingRef: newBookingId,
        testName: newBooking.testName,
        modality: 'Pathology & Blood',
        modalityType: 'Blood Test',
        testCategory: 'Pathology & Blood',
        testType: isHome ? 'Home Sample Collection' : 'Centre Visit',
        centerName: newBooking.diagnosticCentre?.name || `${currentCity} Clinical Diagnostic Centre`,
        department: 'Automated Clinical Pathology',
        location: isHome ? (manualAddr || currentCity) : (newBooking.diagnosticCentre?.location || currentCity),
        address: isHome ? (manualAddr || currentCity) : (newBooking.diagnosticCentre?.address || currentCity),
        appointmentDate: selectedDate,
        timeSlot: selectedSlot?.label || '08:30 AM – 09:30 AM',
        patientId: selectedPatientId || 'self',
        patientName: `${selectedPat.name} (${selectedPat.relation})`,
        age: selectedPat.age || 28,
        gender: selectedPat.gender || 'Not specified',
        status: 'Slot Confirmed',
        badgeColor: '#00B894',
        price: total,
        paymentStatus: paymentMethod === 'WALLET' ? 'Pay on Collection' : 'Paid Online via ' + paymentMethod,
        instructions: 'Fasting of 10-12 hours required prior to sample collection. Water is permitted.',
        contactPhone: selectedCentre?.phone || '+91 821 245 9901',
        canReschedule: true,
        canCancel: true,
      };

      const existingBookedTestsRaw = await AsyncStorage.getItem('@mediunify_patient_booked_tests');
      const existingBookedTests = existingBookedTestsRaw ? JSON.parse(existingBookedTestsRaw) : [];
      await AsyncStorage.setItem(
        '@mediunify_patient_booked_tests',
        JSON.stringify([dashboardBooking, ...(Array.isArray(existingBookedTests) ? existingBookedTests : [])])
      );

      const existingApptsRaw = await AsyncStorage.getItem('@unnathi_appointments');
      const existingAppts = existingApptsRaw ? JSON.parse(existingApptsRaw) : [];
      await AsyncStorage.setItem(
        '@unnathi_appointments',
        JSON.stringify([dashboardBooking, ...(Array.isArray(existingAppts) ? existingAppts : [])])
      );

      // ── Save to Payment History ──────────────────────────────────
      try {
        await saveTransaction({
          id:          `TXN-${newBookingId}`,
          refId:       newBookingId,
          service:     'Lab Test',
          serviceType: 'lab',
          title:       newBooking.testName || 'Lab Test',
          facility:    newBooking.diagnosticCentre?.name || `${currentCity} Diagnostic Centre`,
          rawDate:     new Date().toISOString(),
          amount:      Number(newBooking.amountPaid || newBooking.testPrice || total || 0),
          mrp:         Number(newBooking.testPrice || newBooking.amountPaid || total || 0),
          status:      'Paid',
          paymentMode: paymentMethod || 'Online UPI',
          gstin:       '29AABCU9603R1ZX',
          items:       [{ name: newBooking.testName || 'Lab Test', qty: 1, price: Number(newBooking.testPrice || total || 0) }],
        });
      } catch (_txErr) {}
      // ────────────────────────────────────────────────────────────
    } catch (saveErr) {
      console.warn('Error saving lab booking to AsyncStorage:', saveErr);
    }
  };

  // ===========================================================================
  // 5. BOOKINGS & REPORTS STATE
  // ===========================================================================
  const [bookingsList, setBookingsList] = useState(INITIAL_LAB_BOOKINGS);
  const [bookingsFilter, setBookingsFilter] = useState('ALL');
  const [selectedTrackingBooking, setSelectedTrackingBooking] = useState(null);

  const [reportsList, setReportsList] = useState(INITIAL_LAB_REPORTS);
  const [selectedReport, setSelectedReport] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem('@labBookings');
        if (raw) {
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed) && parsed.length > 0) {
            const map = new Map();
            parsed.forEach((b) => { if (b && b.id) map.set(b.id, b); });
            INITIAL_LAB_BOOKINGS.forEach((b) => { if (b && b.id && !map.has(b.id)) map.set(b.id, b); });
            setBookingsList(Array.from(map.values()));
          }
        }
      } catch (e) {}
    })();
  }, []);

  const filteredBookings = useMemo(() => {
    if (bookingsFilter === 'CONFIRMED') {
      return bookingsList.filter((b) => b.status === 'CONFIRMED' || b.status === 'PROCESSING');
    }
    if (bookingsFilter === 'COMPLETED') {
      return bookingsList.filter((b) => b.status === 'COMPLETED');
    }
    if (bookingsFilter === 'CANCELLED') {
      return bookingsList.filter((b) => b.status === 'CANCELLED');
    }
    return bookingsList;
  }, [bookingsList, bookingsFilter]);

  // Handle Booking Cancellation
  const handleCancelBooking = (bookingId) => {
    showAlert(
      'Cancel Booking',
      'Are you sure you want to cancel this lab test appointment?',
      [
        { text: 'No', style: 'cancel' },
        {
          text: 'Yes, Cancel',
          style: 'destructive',
          onPress: async () => {
            const updated = bookingsList.map((b) =>
              b.id === bookingId ? { ...b, status: 'CANCELLED' } : b
            );
            setBookingsList(updated);
            await AsyncStorage.setItem('@labBookings', JSON.stringify(updated));
            showAlert('Booking Cancelled', 'Your lab test booking has been cancelled successfully.');
          },
        },
      ]
    );
  };

  // Handle Opening Directions to Diagnostic Centre in Google Maps
  const handleOpenCentreDirections = (item) => {
    let centre = null;
    if (item?.diagnosticCentre) {
      const dcName = item.diagnosticCentre.name || item.diagnosticCentre;
      centre =
        ALL_CITY_DIAGNOSTIC_CENTRES.find(
          (c) => c.name === dcName || (item.diagnosticCentre.id && c.id === item.diagnosticCentre.id)
        ) || item.diagnosticCentre;
    } else if (item?.name || item?.address || item?.latitude) {
      centre = item;
    }
    if (!centre) {
      centre = { name: `${currentCity} Diagnostic Centre`, address: currentCity };
    }
    const url = getGoogleMapsDirectionsUrl(centre);
    if (Platform.OS === 'web' && typeof window !== 'undefined' && window.open) {
      window.open(url, '_blank', 'noopener,noreferrer');
    } else {
      Linking.openURL(url).catch((err) => {
        console.warn('Could not open Google Maps directions URL:', err);
      });
    }
  };

  // ===========================================================================
  // 6. IF NO LOCATION SELECTED STATE (SECTION 8 OF REQUIREMENT)
  // ===========================================================================
  if (!hasResolvedLocation) {
    return (
      <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
        <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color="#007D69" />
        </View>
      </SafeAreaView>
    );
  }

  if (hasResolvedLocation && !currentCity) {
    return (
      <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
        <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()} activeOpacity={0.8}>
            <Ionicons name="arrow-back" size={22} color={colors.secondary} />
          </TouchableOpacity>
          <View style={styles.headerCenter}>
            <Text style={styles.headerTitle}>Diagnostic Lab Tests</Text>
          </View>
        </View>

        <View style={styles.noLocationContainer}>
          <View style={styles.noLocationIconCircle}>
            <Ionicons name="location-outline" size={54} color="#007D69" />
          </View>
          <Text style={styles.noLocationTitle}>Location Required</Text>
          <Text style={styles.noLocationMsg}>
            Please select your location from the Home Screen to view available lab tests.
          </Text>
          <TouchableOpacity
            style={styles.noLocationBtn}
            activeOpacity={0.85}
            onPress={() => {
              if (navigation.canGoBack()) {
                navigation.goBack();
              } else {
                navigation.navigate('Home');
              }
            }}
          >
            <Ionicons name="home-outline" size={18} color="#FFFFFF" style={{ marginRight: 8 }} />
            <Text style={styles.noLocationBtnText}>Go to Home</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // ===========================================================================
  // 7. MAIN RENDER
  // ===========================================================================
  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* TOP HEADER */}
      <View style={[styles.header, isTablet && styles.tabletContainerWidth]}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()} activeOpacity={0.8}>
          <Ionicons name="arrow-back" size={22} color={colors.secondary} />
        </TouchableOpacity>

        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle} numberOfLines={1}>
            Diagnostic Lab Tests
          </Text>
          <View style={styles.headerCityBadge}>
            <Ionicons name="location-sharp" size={11} color="#007D69" />
            <Text style={styles.headerCityText} numberOfLines={1}>
              {currentCity || 'Mysuru'}
            </Text>
          </View>
        </View>

        {/* Cart Button */}
        {labCartCount > 0 && (
          <TouchableOpacity
            style={styles.cartHeaderBtn}
            activeOpacity={0.8}
            onPress={() => {
              if (navigation?.navigate) {
                navigation.navigate('Cart', { tab: 'lab' });
              }
            }}
          >
            <Ionicons name="cart" size={17} color="#007D69" />
            <View style={styles.cartBadge}>
              <Text style={styles.cartBadgeText}>{labCartCount}</Text>
            </View>
          </TouchableOpacity>
        )}
      </View>

      {/* NAVIGATION TABS: BROWSE | MY BOOKINGS | LAB REPORTS */}
      <View style={[styles.tabsRow, isTablet && styles.tabletContainerWidth]}>
        <TouchableOpacity
          style={[styles.tabBtn, activeTab === 'BROWSE' && styles.tabBtnActive]}
          onPress={() => setActiveTab('BROWSE')}
          activeOpacity={0.8}
        >
          <Ionicons name="flask-outline" size={14} color={activeTab === 'BROWSE' ? '#007D69' : '#64748B'} style={{ marginRight: 5 }} />
          <Text style={[styles.tabBtnText, activeTab === 'BROWSE' && styles.tabBtnTextActive]}>
            Browse Tests
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabBtn, activeTab === 'BOOKINGS' && styles.tabBtnActive]}
          onPress={() => setActiveTab('BOOKINGS')}
          activeOpacity={0.8}
        >
          <Ionicons name="calendar-outline" size={14} color={activeTab === 'BOOKINGS' ? '#007D69' : '#64748B'} style={{ marginRight: 5 }} />
          <Text style={[styles.tabBtnText, activeTab === 'BOOKINGS' && styles.tabBtnTextActive]}>
            My Bookings
          </Text>
          {bookingsList.length > 0 && (
            <View style={styles.tabBadge}>
              <Text style={styles.tabBadgeText}>{bookingsList.length}</Text>
            </View>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabBtn, activeTab === 'REPORTS' && styles.tabBtnActive]}
          onPress={() => setActiveTab('REPORTS')}
          activeOpacity={0.8}
        >
          <Ionicons name="document-text-outline" size={14} color={activeTab === 'REPORTS' ? '#007D69' : '#64748B'} style={{ marginRight: 5 }} />
          <Text style={[styles.tabBtnText, activeTab === 'REPORTS' && styles.tabBtnTextActive]}>
            Reports
          </Text>
          {reportsList.length > 0 && (
            <View style={styles.tabBadge}>
              <Text style={styles.tabBadgeText}>{reportsList.length}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      {/* ───────────────────────────────────────────────────────────────────────
          TAB 1: BROWSE TESTS & PACKAGES
      ──────────────────────────────────────────────────────────────────────── */}
      {activeTab === 'BROWSE' && (
        <ScrollView
          ref={scrollViewRef}
          contentContainerStyle={[styles.scrollContent, isTablet && styles.tabletContainerWidth]}
          showsVerticalScrollIndicator={false}
        >
          {/* SEARCH & ACTIONS BAR (SEARCH + COMPACT FILTER & SORT) */}
          <View style={styles.searchRowContainer}>
            <View style={styles.searchBox}>
              <Ionicons name="search-outline" size={17} color="#007D69" />
              <TextInput
                style={styles.searchInput}
                placeholder="Search tests or packages"
                placeholderTextColor="#94A3B8"
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
              {searchQuery.length > 0 && (
                <TouchableOpacity onPress={() => setSearchQuery('')} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                  <Ionicons name="close-circle" size={16} color="#94A3B8" />
                </TouchableOpacity>
              )}
            </View>

            <TouchableOpacity
              style={[styles.filterActionBtn, activeFiltersCount > 0 && styles.filterActionBtnActive]}
              onPress={() => setFilterModalVisible(true)}
              activeOpacity={0.8}
            >
              <Ionicons
                name="options-outline"
                size={16}
                color={activeFiltersCount > 0 ? '#FFFFFF' : '#007D69'}
                style={{ marginRight: 4 }}
              />
              <Text style={[styles.filterActionBtnText, activeFiltersCount > 0 && styles.filterActionBtnTextActive]}>
                Filter{activeFiltersCount > 0 ? ` (${activeFiltersCount})` : ''}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.sortActionBtn, selectedSort !== 'RECOMMENDED' && styles.sortActionBtnActive]}
              onPress={() => setSortModalVisible(true)}
              activeOpacity={0.8}
            >
              <Ionicons
                name="swap-vertical-outline"
                size={16}
                color={selectedSort !== 'RECOMMENDED' ? '#FFFFFF' : '#007D69'}
              />
            </TouchableOpacity>
          </View>

          {/* SUB-VIEW SWITCHER: ALL | PACKAGES | TESTS */}
          <View style={styles.subViewSwitcher}>
            {[
              { id: 'ALL', label: 'All', count: filteredPackages.length + filteredTests.length },
              { id: 'PACKAGES', label: 'Packages', count: filteredPackages.length },
              { id: 'TESTS', label: 'Tests', count: filteredTests.length },
            ].map((sub) => {
              const isSel = browseSubView === sub.id;
              return (
                <TouchableOpacity
                  key={sub.id}
                  style={[styles.subViewBtn, isSel && styles.subViewBtnActive]}
                  onPress={() => setBrowseSubView(sub.id)}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.subViewBtnText, isSel && styles.subViewBtnTextActive]}>
                    {sub.label}
                  </Text>
                  <View style={[styles.subViewBadge, isSel && styles.subViewBadgeActive]}>
                    <Text style={[styles.subViewBadgeText, isSel && styles.subViewBadgeTextActive]}>
                      {sub.count}
                    </Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* HEALTH CATEGORIES CAROUSEL */}
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionHeading}>Health Categories</Text>
            {selectedCategory !== 'all' && (
              <TouchableOpacity onPress={() => setSelectedCategory('all')}>
                <Text style={styles.resetLinkText}>Reset Category</Text>
              </TouchableOpacity>
            )}
          </View>

          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoriesScroll}>
            <TouchableOpacity
              style={[styles.categoryCard, selectedCategory === 'all' && styles.categoryCardActive]}
              onPress={() => { setSelectedCategory('all'); setSelectedSubCategory('all'); }}
              activeOpacity={0.8}
            >
              <View style={[styles.categoryIconWrap, selectedCategory === 'all' && styles.categoryIconWrapActive]}>
                <Ionicons name="apps-outline" size={17} color={selectedCategory === 'all' ? '#FFFFFF' : '#007D69'} />
              </View>
              <Text style={[styles.categoryName, selectedCategory === 'all' && styles.categoryNameActive]}>
                All Tests
              </Text>
            </TouchableOpacity>

            {MOBILE_LAB_CATEGORIES.map((cat) => {
              const isSel = selectedCategory === cat.id;
              const isPopular = cat.id === 'most-popular';
              return (
                <TouchableOpacity
                  key={cat.id}
                  style={[
                    styles.categoryCard,
                    isSel && styles.categoryCardActive,
                    isPopular && !isSel && styles.popularCategoryCard,
                  ]}
                  onPress={() => {
                    setSelectedCategory(isSel ? 'all' : cat.id);
                    setSelectedSubCategory('all');
                  }}
                  activeOpacity={0.8}
                >
                  <View
                    style={[
                      styles.categoryIconWrap,
                      isSel && styles.categoryIconWrapActive,
                      isPopular && !isSel && styles.popularCategoryIconWrap,
                    ]}
                  >
                    <Ionicons
                      name={cat.icon || 'flask-outline'}
                      size={17}
                      color={isSel ? '#FFFFFF' : isPopular ? '#EA580C' : '#007D69'}
                    />
                  </View>
                  <Text
                    style={[
                      styles.categoryName,
                      isSel && styles.categoryNameActive,
                      isPopular && !isSel && styles.popularCategoryText,
                    ]}
                    numberOfLines={1}
                  >
                    {cat.name}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          {/* SUBCATEGORIES (WHEN A CATEGORY IS SELECTED) */}
          {activeCategoryObj?.subCategories && (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.subCatScroll}>
              <TouchableOpacity
                style={[styles.subCatPill, selectedSubCategory === 'all' && styles.subCatPillActive]}
                onPress={() => setSelectedSubCategory('all')}
              >
                <Text style={[styles.subCatText, selectedSubCategory === 'all' && styles.subCatTextActive]}>
                  All {activeCategoryObj.name}
                </Text>
              </TouchableOpacity>
              {activeCategoryObj.subCategories.map((sub) => {
                const isSel = selectedSubCategory === sub.id;
                return (
                  <TouchableOpacity
                    key={sub.id}
                    style={[styles.subCatPill, isSel && styles.subCatPillActive]}
                    onPress={() => setSelectedSubCategory(isSel ? 'all' : sub.id)}
                  >
                    <Text style={[styles.subCatText, isSel && styles.subCatTextActive]}>
                      {sub.name}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          )}

          {/* AVAILABLE IN LOCATION STATUS */}
          <View style={styles.simpleLocationRow}>
            <Ionicons name="location-sharp" size={13} color="#007D69" style={{ marginRight: 5 }} />
            <Text style={styles.simpleLocationText}>Available in {currentCity || 'Mysuru'}</Text>
          </View>

          {/* ───────────────────────────────────────────────────────────────────
              PACKAGES SECTION
          ──────────────────────────────────────────────────────────────────── */}
          {(browseSubView === 'ALL' || browseSubView === 'PACKAGES') && filteredPackages.length > 0 && (
            <View style={styles.packagesSectionWrap}>
              <View style={styles.sectionHeaderRow}>
                <Text style={styles.sectionHeading}>Health Packages</Text>
              </View>

              {filteredPackages.map((pkg) => {
                const inCart = isItemInCart(pkg.id);
                return (
                  <View key={pkg.id} style={styles.packageCard}>
                    {/* Category Label */}
                    {pkg.category ? (
                      <Text style={styles.cardCategoryText}>{pkg.category}</Text>
                    ) : null}

                    {/* Package Name */}
                    <TouchableOpacity onPress={() => setSelectedPackage(pkg)} activeOpacity={0.88}>
                      <Text style={styles.cardTitle}>{pkg.name}</Text>
                    </TouchableOpacity>

                    {/* Key Info: 🧪 10 Tests   🏠 Home Sample */}
                    <View style={styles.pkgMetricsRow}>
                      <View style={styles.keyInfoItem}>
                        <Text style={styles.keyInfoIcon}>🧪</Text>
                        <Text style={styles.keyInfoText}>{pkg.testsCount || 10} Tests</Text>
                      </View>
                      <View style={styles.keyInfoItem}>
                        <Text style={styles.keyInfoIcon}>🏠</Text>
                        <Text style={styles.keyInfoText}>Home Sample</Text>
                      </View>
                      {pkg.tatSummary ? (
                        <View style={styles.keyInfoItem}>
                          <Text style={styles.keyInfoIcon}>⚡</Text>
                          <Text style={styles.keyInfoText} numberOfLines={1}>
                            {pkg.tatSummary.toLowerCase().includes('same day') ? 'Same Day' : '6-8 hrs'}
                          </Text>
                        </View>
                      ) : null}
                    </View>

                    {/* Price & Actions */}
                    <View style={styles.cardFooterRow}>
                      <View style={styles.priceRow}>
                        <Text style={styles.cardPrice}>₹{pkg.price}</Text>
                        {pkg.mrp && <Text style={styles.cardMrp}>₹{pkg.mrp}</Text>}
                        {pkg.discount && (
                          <View style={styles.discountBadge}>
                            <Text style={styles.discountBadgeText}>{pkg.discount}</Text>
                          </View>
                        )}
                      </View>

                      <View style={styles.cardActionBtnsRow}>
                        <TouchableOpacity
                          style={styles.detailsBtn}
                          onPress={() => setSelectedPackage(pkg)}
                          activeOpacity={0.8}
                        >
                          <Text style={styles.detailsBtnText}>Details</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                          style={[styles.cartIconBtn, inCart && styles.cartIconBtnActive]}
                          onPress={() => handleToggleCartPackage(pkg)}
                          activeOpacity={0.8}
                          hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                        >
                          <Ionicons
                            name={inCart ? 'checkmark-circle' : 'cart-outline'}
                            size={16}
                            color={inCart ? '#FFFFFF' : '#007D69'}
                          />
                        </TouchableOpacity>

                        <TouchableOpacity
                          style={styles.bookPrimaryBtn}
                          onPress={() => startBooking(pkg)}
                          activeOpacity={0.85}
                        >
                          <Text style={styles.bookPrimaryBtnText}>Book</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  </View>
                );
              })}
            </View>
          )}

          {/* ───────────────────────────────────────────────────────────────────
              CLINICAL TESTS SECTION
          ──────────────────────────────────────────────────────────────────── */}
          {(browseSubView === 'ALL' || browseSubView === 'TESTS') && filteredTests.length > 0 && (
            <View style={styles.testsSectionWrap}>
              <View style={styles.sectionHeaderRow}>
                <Text style={styles.sectionHeading}>Clinical Tests</Text>
              </View>

              {filteredTests.map((test) => {
                const inCart = isItemInCart(test.id);
                return (
                  <View key={test.id} style={styles.testCard}>
                    {/* Category Label */}
                    {test.popular || selectedCategory === 'most-popular' ? (
                      <Text style={styles.cardCategoryText}>Popular</Text>
                    ) : test.category ? (
                      <Text style={styles.cardCategoryText}>{test.category}</Text>
                    ) : null}

                    {/* Test Name */}
                    <TouchableOpacity onPress={() => setSelectedTest(test)} activeOpacity={0.88}>
                      <Text style={styles.cardTitle}>{test.name}</Text>
                    </TouchableOpacity>

                    {/* Key Info: 🧪 Sample   🏠 Home/Lab */}
                    <View style={styles.pkgMetricsRow}>
                      <View style={styles.keyInfoItem}>
                        <Text style={styles.keyInfoIcon}>🧪</Text>
                        <Text style={styles.keyInfoText}>{test.sampleType || 'Blood'}</Text>
                      </View>
                      <View style={styles.keyInfoItem}>
                        <Text style={styles.keyInfoIcon}>🏠</Text>
                        <Text style={styles.keyInfoText}>{test.homeCollection ? 'Home Sample' : 'Lab Visit'}</Text>
                      </View>
                      {test.reportTAT ? (
                        <View style={styles.keyInfoItem}>
                          <Text style={styles.keyInfoIcon}>⏱</Text>
                          <Text style={styles.keyInfoText} numberOfLines={1}>
                            {test.reportTAT.length > 10 ? test.reportTAT.split(' ')[0] + ' ' + (test.reportTAT.split(' ')[1] || '') : test.reportTAT}
                          </Text>
                        </View>
                      ) : null}
                    </View>

                    {/* Price & Actions */}
                    <View style={styles.cardFooterRow}>
                      <View style={styles.priceRow}>
                        <Text style={styles.cardPrice}>₹{test.price}</Text>
                        {test.mrp && <Text style={styles.cardMrp}>₹{test.mrp}</Text>}
                        {test.discount && (
                          <View style={styles.discountBadge}>
                            <Text style={styles.discountBadgeText}>{test.discount}</Text>
                          </View>
                        )}
                      </View>

                      <View style={styles.cardActionBtnsRow}>
                        <TouchableOpacity
                          style={styles.detailsBtn}
                          onPress={() => setSelectedTest(test)}
                          activeOpacity={0.8}
                        >
                          <Text style={styles.detailsBtnText}>Details</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                          style={[styles.cartIconBtn, inCart && styles.cartIconBtnActive]}
                          onPress={() => handleToggleCartTest(test)}
                          activeOpacity={0.8}
                          hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                        >
                          <Ionicons
                            name={inCart ? 'checkmark-circle' : 'cart-outline'}
                            size={16}
                            color={inCart ? '#FFFFFF' : '#007D69'}
                          />
                        </TouchableOpacity>

                        <TouchableOpacity
                          style={styles.bookPrimaryBtn}
                          onPress={() => startBooking(test)}
                          activeOpacity={0.85}
                        >
                          <Text style={styles.bookPrimaryBtnText}>Book</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  </View>
                );
              })}
            </View>
          )}


          {/* EMPTY SEARCH / FILTER STATE */}
          {filteredPackages.length === 0 && filteredTests.length === 0 && (
            <View style={styles.emptyContainer}>
              <Ionicons name="flask-outline" size={54} color="#CBD5E1" />
              <Text style={styles.emptyTitle}>No Matching Tests Found</Text>
              <Text style={styles.emptySub}>
                We couldn't find any diagnostic tests or packages matching your filters in {currentCity}.
              </Text>
              <TouchableOpacity style={styles.resetFilterBtn} onPress={resetAllFilters} activeOpacity={0.8}>
                <Text style={styles.resetFilterBtnText}>Reset All Filters</Text>
              </TouchableOpacity>
            </View>
          )}
        </ScrollView>
      )}

      {/* ───────────────────────────────────────────────────────────────────────
          TAB 2: MY BOOKINGS
      ──────────────────────────────────────────────────────────────────────── */}
      {activeTab === 'BOOKINGS' && (
        <ScrollView
          contentContainerStyle={[styles.scrollContent, isTablet && styles.tabletContainerWidth]}
          showsVerticalScrollIndicator={false}
        >
          {/* Filter Pills */}
          <View style={styles.bookingsFilterRow}>
            {[
              { id: 'ALL', label: 'All' },
              { id: 'CONFIRMED', label: 'Upcoming' },
              { id: 'COMPLETED', label: 'Completed' },
              { id: 'CANCELLED', label: 'Cancelled' },
            ].map((f) => (
              <TouchableOpacity
                key={f.id}
                style={[styles.bookingFilterPill, bookingsFilter === f.id && styles.bookingFilterPillActive]}
                onPress={() => setBookingsFilter(f.id)}
              >
                <Text style={[styles.bookingFilterText, bookingsFilter === f.id && styles.bookingFilterTextActive]}>
                  {f.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {filteredBookings.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Ionicons name="calendar-outline" size={50} color="#CBD5E1" />
              <Text style={styles.emptyTitle}>No Bookings Found</Text>
              <Text style={styles.emptySub}>You haven't scheduled any diagnostic tests in {currentCity} yet.</Text>
              <TouchableOpacity style={styles.resetFilterBtn} onPress={() => setActiveTab('BROWSE')}>
                <Text style={styles.resetFilterBtnText}>Browse Available Tests</Text>
              </TouchableOpacity>
            </View>
          ) : (
            filteredBookings.map((b) => {
              const isConfirmed = b.status === 'CONFIRMED' || b.status === 'PROCESSING';
              return (
                <View key={b.id} style={styles.bookingCard}>
                  <View style={styles.bookingCardHeader}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.bookingIdText}>ID: {b.id}</Text>
                      <Text style={styles.bookingTestTitle}>{b.testName}</Text>
                    </View>
                    <View
                      style={[
                        styles.statusBadge,
                        {
                          backgroundColor:
                            b.status === 'CONFIRMED'
                              ? '#ECFDF5'
                              : b.status === 'COMPLETED'
                              ? '#EFF6FF'
                              : '#FEF2F2',
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.statusBadgeText,
                          {
                            color:
                              b.status === 'CONFIRMED'
                                ? '#059669'
                                : b.status === 'COMPLETED'
                                ? '#2563EB'
                                : '#DC2626',
                          },
                        ]}
                      >
                        {b.status}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.bookingMetaRow}>
                    <Ionicons name="calendar-outline" size={14} color="#64748B" />
                    <Text style={styles.bookingMetaText}>{b.bookingDate} • {b.timeSlot}</Text>
                  </View>

                  <View style={styles.bookingMetaRow}>
                    <Ionicons
                      name={b.collectionMethod === 'HOME' ? 'home-outline' : 'business-outline'}
                      size={14}
                      color="#64748B"
                    />
                    <Text style={styles.bookingMetaText} numberOfLines={1}>
                      {b.collectionMethod === 'HOME'
                        ? b.collectionAddress || `Home Sample Collection (${currentCity})`
                        : b.diagnosticCentre?.name || `${currentCity} Partner Diagnostic Center`}
                    </Text>
                  </View>

                  {/* Centre Visit Card with Location & Direction Button */}
                  {b.collectionMethod === 'CENTRE' && (
                    <View style={styles.centreVisitCardBox}>
                      <View style={styles.centreVisitHeaderRow}>
                        <View style={styles.labVisitTag}>
                          <Ionicons name="location" size={11} color="#007D69" />
                          <Text style={styles.labVisitTagText}>Lab Visit Appointment</Text>
                        </View>
                        {(() => {
                          const matched = ALL_CITY_DIAGNOSTIC_CENTRES.find(c => c.name === b.diagnosticCentre?.name);
                          if (!matched?.distanceKm) return null;
                          return (
                            <Text style={styles.centreDistanceText}>{matched.distanceKm} km away</Text>
                          );
                        })()}
                      </View>

                      {(() => {
                        const matched = ALL_CITY_DIAGNOSTIC_CENTRES.find(c => c.name === b.diagnosticCentre?.name);
                        const fullAddr = matched?.address || b.diagnosticCentre?.address || b.diagnosticCentre?.location;
                        if (!fullAddr) return null;
                        return (
                          <Text style={styles.centreAddressFullText} numberOfLines={2}>
                            {fullAddr}
                          </Text>
                        );
                      })()}

                      <TouchableOpacity
                        style={styles.getDirectionsBtn}
                        onPress={() => handleOpenCentreDirections(b)}
                        activeOpacity={0.8}
                        accessibilityRole="button"
                        accessibilityLabel="Get Directions to Lab in Google Maps"
                      >
                        <Ionicons name="navigate" size={14} color="#FFFFFF" style={{ marginRight: 6 }} />
                        <Text style={styles.getDirectionsBtnText}>Get Directions to Lab</Text>
                      </TouchableOpacity>
                    </View>
                  )}

                  <View style={styles.bookingFooterRow}>
                    <Text style={styles.bookingAmountText}>₹{b.amountPaid}</Text>
                    <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
                      {b.collectionMethod === 'CENTRE' && (
                        <TouchableOpacity
                          style={styles.footerDirectionsBtn}
                          onPress={() => handleOpenCentreDirections(b)}
                          activeOpacity={0.8}
                        >
                          <Ionicons name="navigate-outline" size={13} color="#007D69" style={{ marginRight: 4 }} />
                          <Text style={styles.footerDirectionsBtnText}>Directions</Text>
                        </TouchableOpacity>
                      )}
                      {isConfirmed && (
                        <TouchableOpacity
                          style={styles.cancelBookingBtn}
                          onPress={() => handleCancelBooking(b.id)}
                        >
                          <Text style={styles.cancelBookingBtnText}>Cancel</Text>
                        </TouchableOpacity>
                      )}
                      <TouchableOpacity
                        style={styles.trackBookingBtn}
                        onPress={() => setSelectedTrackingBooking(b)}
                      >
                        <Ionicons name="navigate-outline" size={13} color="#FFFFFF" style={{ marginRight: 4 }} />
                        <Text style={styles.trackBookingBtnText}>Track Sample</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              );
            })
          )}
        </ScrollView>
      )}

      {/* ───────────────────────────────────────────────────────────────────────
          TAB 3: LAB REPORTS
      ──────────────────────────────────────────────────────────────────────── */}
      {activeTab === 'REPORTS' && (
        <ScrollView
          contentContainerStyle={[styles.scrollContent, isTablet && styles.tabletContainerWidth]}
          showsVerticalScrollIndicator={false}
        >
          {reportsList.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Ionicons name="document-text-outline" size={50} color="#CBD5E1" />
              <Text style={styles.emptyTitle}>No Test Reports Yet</Text>
              <Text style={styles.emptySub}>Your verified laboratory reports will appear here as soon as they are uploaded.</Text>
            </View>
          ) : (
            reportsList.map((r) => (
              <View key={r.id} style={styles.reportCard}>
                <View style={styles.reportIconCol}>
                  <Ionicons name="document-attach" size={26} color="#007D69" />
                </View>
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <Text style={styles.reportTestName}>{r.testName}</Text>
                  <Text style={styles.reportSubText}>{r.reportDate} • {r.diagnosticCentre || `${currentCity} Lab Partner`}</Text>
                  <View style={styles.reportVerifiedBadge}>
                    <Ionicons name="checkmark-circle" size={12} color="#059669" />
                    <Text style={styles.reportVerifiedBadgeText}>Verified by Pathologist</Text>
                  </View>
                </View>
                <TouchableOpacity
                  style={styles.downloadReportBtn}
                  onPress={() => setSelectedReport(r)}
                  activeOpacity={0.8}
                >
                  <Ionicons name="download-outline" size={16} color="#007D69" />
                </TouchableOpacity>
              </View>
            ))
          )}
        </ScrollView>
      )}

      {/* =======================================================================
          MODAL 1: FILTER BOTTOM SHEET (NO LOCATION SELECTOR - USER SELECTED HOME)
      ======================================================================= */}
      <Modal visible={filterModalVisible} transparent animationType="slide" onRequestClose={() => setFilterModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.sheetModalCard, isTablet && styles.tabletModalWidth]}>
            <View style={styles.modalHeaderRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.modalHeaderTitle}>Filter Lab Tests</Text>
                <Text style={styles.modalHeaderSub}>Refine by Gender, Collection & Price</Text>
              </View>
              <TouchableOpacity onPress={resetAllFilters}>
                <Text style={styles.resetModalText}>Reset</Text>
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 440 }}>
              {/* Gender */}
              <Text style={styles.filterSectionTitle}>Gender Applicability</Text>
              <View style={styles.filterOptionsGrid}>
                {['ALL', 'MALE', 'FEMALE'].map((g) => (
                  <TouchableOpacity
                    key={g}
                    style={[styles.filterPill, selectedGenderFilter === g && styles.filterPillActive]}
                    onPress={() => setSelectedGenderFilter(g)}
                  >
                    <Text style={[styles.filterPillText, selectedGenderFilter === g && styles.filterPillTextActive]}>
                      {g === 'ALL' ? 'All Genders' : g === 'MALE' ? 'Male' : 'Female'}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Collection Method */}
              <Text style={styles.filterSectionTitle}>Collection Method</Text>
              <View style={styles.filterOptionsGrid}>
                {[
                  { id: 'ALL', label: 'All Methods' },
                  { id: 'HOME', label: 'Home Collection' },
                  { id: 'CENTRE', label: 'Centre Visit' },
                ].map((m) => (
                  <TouchableOpacity
                    key={m.id}
                    style={[styles.filterPill, selectedCollectionFilter === m.id && styles.filterPillActive]}
                    onPress={() => setSelectedCollectionFilter(m.id)}
                  >
                    <Text style={[styles.filterPillText, selectedCollectionFilter === m.id && styles.filterPillTextActive]}>
                      {m.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Price Range */}
              <Text style={styles.filterSectionTitle}>Price Range</Text>
              <View style={styles.filterOptionsGrid}>
                {[
                  { id: 'ALL', label: 'All Prices' },
                  { id: 'UNDER_1000', label: 'Under ₹1,000' },
                  { id: '1000_2000', label: '₹1,000 – ₹2,000' },
                  { id: 'ABOVE_2000', label: 'Above ₹2,000' },
                ].map((p) => (
                  <TouchableOpacity
                    key={p.id}
                    style={[styles.filterPill, selectedPriceFilter === p.id && styles.filterPillActive]}
                    onPress={() => setSelectedPriceFilter(p.id)}
                  >
                    <Text style={[styles.filterPillText, selectedPriceFilter === p.id && styles.filterPillTextActive]}>
                      {p.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Key Inclusions (for Packages) */}
              <Text style={styles.filterSectionTitle}>Package Key Inclusions</Text>
              <View style={styles.filterOptionsGrid}>
                {[
                  { id: 'VITAMINS', label: 'Vitamins (D/B12)' },
                  { id: 'ECG_IMAGING', label: 'ECG / Ultrasound' },
                  { id: 'ECHO', label: 'ECHO Screening' },
                  { id: 'IRON', label: 'Iron & Ferritin' },
                  { id: 'HBA1C', label: 'HbA1c Sugar' },
                ].map((inc) => {
                  const isInc = selectedInclusions.includes(inc.id);
                  return (
                    <TouchableOpacity
                      key={inc.id}
                      style={[styles.filterPill, isInc && styles.filterPillActive]}
                      onPress={() => toggleInclusion(inc.id)}
                    >
                      <Text style={[styles.filterPillText, isInc && styles.filterPillTextActive]}>
                        {inc.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </ScrollView>

            <View style={styles.filterActionRow}>
              <TouchableOpacity style={styles.filterClearBtn} onPress={resetAllFilters}>
                <Text style={styles.filterClearBtnText}>Clear</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.filterApplyBtn} onPress={() => setFilterModalVisible(false)}>
                <Text style={styles.filterApplyBtnText}>Apply Filters</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* =======================================================================
          MODAL 2: SORT BOTTOM SHEET
      ======================================================================= */}
      <Modal visible={sortModalVisible} transparent animationType="slide" onRequestClose={() => setSortModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.sheetModalCard, isTablet && styles.tabletModalWidth]}>
            <View style={styles.modalHeaderRow}>
              <Text style={styles.modalHeaderTitle}>Sort Results</Text>
              <TouchableOpacity onPress={() => setSortModalVisible(false)}>
                <Ionicons name="close" size={20} color="#64748B" />
              </TouchableOpacity>
            </View>

            <View style={styles.sortOptionsList}>
              {[
                { id: 'RECOMMENDED', label: 'Recommended', icon: 'star-outline' },
                { id: 'PRICE_LOW_HIGH', label: 'Price: Low to High', icon: 'trending-up-outline' },
                { id: 'PRICE_HIGH_LOW', label: 'Price: High to Low', icon: 'trending-down-outline' },
                { id: 'MOST_TESTS', label: 'Most Tests Included', icon: 'list-outline' },
              ].map((opt) => {
                const isSel = selectedSort === opt.id;
                return (
                  <TouchableOpacity
                    key={opt.id}
                    style={[styles.sortOptionRow, isSel && styles.sortOptionRowActive]}
                    onPress={() => {
                      setSelectedSort(opt.id);
                      setSortModalVisible(false);
                    }}
                  >
                    <Ionicons name={opt.icon} size={18} color={isSel ? '#007D69' : '#64748B'} style={{ marginRight: 12 }} />
                    <Text style={[styles.sortOptionLabel, isSel && styles.sortOptionLabelActive]}>
                      {opt.label}
                    </Text>
                    <Ionicons
                      name={isSel ? 'radio-button-on' : 'radio-button-off'}
                      size={18}
                      color={isSel ? '#007D69' : '#CBD5E1'}
                      style={{ marginLeft: 'auto' }}
                    />
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        </View>
      </Modal>

      {/* =======================================================================
          MODAL 3: PACKAGE DETAILS MODAL (EXPANDABLE TEST PARAMETERS ACCORDION)
      ======================================================================= */}
      {selectedPackage && (
        <Modal visible={!!selectedPackage} transparent animationType="slide" onRequestClose={() => setSelectedPackage(null)}>
          <View style={styles.modalOverlay}>
            <View style={[styles.sheetModalCard, isTablet && styles.tabletModalWidth]}>
              <View style={styles.modalHeaderRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.modalHeaderTitle} numberOfLines={1}>{selectedPackage.name}</Text>
                  <Text style={styles.modalHeaderSub}>
                    {selectedPackage.testsCount} Tests • {selectedPackage.tatSummary || 'Same Day Reports'}
                  </Text>
                </View>
                <TouchableOpacity onPress={() => setSelectedPackage(null)}>
                  <Ionicons name="close" size={22} color="#64748B" />
                </TouchableOpacity>
              </View>

              <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 420 }}>
                {selectedPackage.clinicalNote && (
                  <View style={styles.clinicalNoteBox}>
                    <Ionicons name="information-circle-outline" size={16} color="#0284C7" />
                    <Text style={styles.clinicalNoteText}>{selectedPackage.clinicalNote}</Text>
                  </View>
                )}

                <Text style={styles.accordionHeaderTitle}>
                  Included Tests & Panels ({selectedPackage.tests?.length || selectedPackage.testsCount})
                </Text>

                {selectedPackage.tests?.map((t, idx) => {
                  const isExp = expandedTestIdx === idx;
                  return (
                    <View key={idx} style={[styles.accordionItem, isExp && styles.accordionItemActive]}>
                      <TouchableOpacity
                        style={styles.accordionTitleRow}
                        onPress={() => setExpandedTestIdx(isExp ? null : idx)}
                        activeOpacity={0.75}
                      >
                        <Ionicons name="checkmark-circle" size={16} color="#007D69" style={{ marginRight: 8 }} />
                        <Text style={styles.accordionTitleText} numberOfLines={1}>{t.name}</Text>
                        <Ionicons name={isExp ? 'chevron-up' : 'chevron-down'} size={16} color="#64748B" style={{ marginLeft: 'auto' }} />
                      </TouchableOpacity>

                      {isExp && (
                        <View style={styles.accordionBody}>
                          <Text style={styles.accordionParamLabel}>Parameters:</Text>
                          <Text style={styles.accordionParamValue}>{t.parameters}</Text>
                          <View style={styles.accordionMetaGrid}>
                            <Text style={styles.accordionMetaItem}>Sample: {t.sample}</Text>
                            <Text style={styles.accordionMetaItem}>Tube: {t.tube}</Text>
                            <Text style={styles.accordionMetaItem}>TAT: {t.tat}</Text>
                          </View>
                        </View>
                      )}
                    </View>
                  );
                })}
              </ScrollView>

              <View style={styles.detailsModalFooter}>
                <View>
                  <Text style={styles.detailsModalPrice}>₹{selectedPackage.price}</Text>
                  {selectedPackage.mrp && <Text style={styles.detailsModalMrp}>₹{selectedPackage.mrp}</Text>}
                </View>
                <View style={{ flexDirection: 'row', gap: 10 }}>
                  <TouchableOpacity
                    style={[styles.cartBtn, isItemInCart(selectedPackage.id) && styles.cartBtnActive]}
                    onPress={() => handleToggleCartPackage(selectedPackage)}
                  >
                    <Text style={[styles.cartBtnText, isItemInCart(selectedPackage.id) && styles.cartBtnTextActive]}>
                      {isItemInCart(selectedPackage.id) ? 'In Cart' : 'Add to Cart'}
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.bookPrimaryBtn}
                    onPress={() => {
                      const p = selectedPackage;
                      setSelectedPackage(null);
                      startBooking(p);
                    }}
                  >
                    <Text style={styles.bookPrimaryBtnText}>Book Package →</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </View>
        </Modal>
      )}

      {/* =======================================================================
          MODAL 4: CLINICAL TEST DETAILS MODAL
      ======================================================================= */}
      {selectedTest && (
        <Modal visible={!!selectedTest} transparent animationType="slide" onRequestClose={() => setSelectedTest(null)}>
          <View style={styles.modalOverlay}>
            <View style={[styles.sheetModalCard, isTablet && styles.tabletModalWidth]}>
              <View style={styles.modalHeaderRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.modalHeaderTitle} numberOfLines={1}>{selectedTest.name}</Text>
                  <Text style={styles.modalHeaderSub}>Clinical Diagnostic Assay • {currentCity}</Text>
                </View>
                <TouchableOpacity onPress={() => setSelectedTest(null)}>
                  <Ionicons name="close" size={22} color="#64748B" />
                </TouchableOpacity>
              </View>

              <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 400 }}>
                <Text style={styles.testModalDesc}>{selectedTest.description}</Text>

                <View style={styles.infoCard}>
                  <Text style={styles.infoCardTitle}>Fasting Requirement</Text>
                  <Text style={styles.infoCardBody}>{selectedTest.fastingRequirement}</Text>
                </View>

                <View style={styles.infoCard}>
                  <Text style={styles.infoCardTitle}>Preparation Instructions</Text>
                  <Text style={styles.infoCardBody}>{selectedTest.preparation}</Text>
                </View>

                <View style={styles.testMetaRow}>
                  <View style={styles.testMetaCol}>
                    <Text style={styles.testMetaColLabel}>Sample</Text>
                    <Text style={styles.testMetaColVal}>{selectedTest.sampleType}</Text>
                  </View>
                  <View style={styles.testMetaCol}>
                    <Text style={styles.testMetaColLabel}>TAT</Text>
                    <Text style={styles.testMetaColVal}>{selectedTest.reportTAT}</Text>
                  </View>
                  <View style={styles.testMetaCol}>
                    <Text style={styles.testMetaColLabel}>Gender</Text>
                    <Text style={styles.testMetaColVal}>{selectedTest.genderApplicability}</Text>
                  </View>
                </View>
              </ScrollView>

              <View style={styles.detailsModalFooter}>
                <View>
                  <Text style={styles.detailsModalPrice}>₹{selectedTest.price}</Text>
                  {selectedTest.mrp && <Text style={styles.detailsModalMrp}>₹{selectedTest.mrp}</Text>}
                </View>
                <View style={{ flexDirection: 'row', gap: 10 }}>
                  <TouchableOpacity
                    style={[styles.cartBtn, isItemInCart(selectedTest.id) && styles.cartBtnActive]}
                    onPress={() => handleToggleCartTest(selectedTest)}
                  >
                    <Text style={[styles.cartBtnText, isItemInCart(selectedTest.id) && styles.cartBtnTextActive]}>
                      {isItemInCart(selectedTest.id) ? 'In Cart' : 'Add to Cart'}
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.bookPrimaryBtn}
                    onPress={() => {
                      const t = selectedTest;
                      setSelectedTest(null);
                      startBooking(t);
                    }}
                  >
                    <Text style={styles.bookPrimaryBtnText}>Proceed to Book →</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </View>
        </Modal>
      )}

      {/* =======================================================================
          MODAL 5: BOOKING FLOW MODAL (5 STEPS - ADAPTED FROM WEB)
      ======================================================================= */}
      {activeBookingItem && (
        <Modal visible={!!activeBookingItem} transparent animationType="slide" onRequestClose={() => setActiveBookingItem(null)}>
          <View style={styles.modalOverlay}>
            <View style={[styles.bookingModalCard, isTablet && styles.tabletModalWidth]}>
              <View style={styles.modalHeaderRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.bookingStepTitle}>
                    {bookingFlowStep === 1
                      ? '1. Patient & Method'
                      : bookingFlowStep === 2
                      ? '2. Location & Slot'
                      : bookingFlowStep === 3
                      ? '3. Review Summary'
                      : bookingFlowStep === 4
                      ? '4. Payment'
                      : 'Booking Confirmed!'}
                  </Text>
                  <Text style={styles.bookingStepSub} numberOfLines={1}>{activeBookingItem.name}</Text>
                </View>
                <TouchableOpacity onPress={() => setActiveBookingItem(null)}>
                  <Ionicons name="close" size={22} color="#64748B" />
                </TouchableOpacity>
              </View>

              {/* STEP 1: PATIENT PROFILE & METHOD */}
              {bookingFlowStep === 1 && (
                <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 420 }}>
                  <Text style={styles.stepSectionHeader}>1. Select Patient</Text>
                  <View style={styles.patientProfilesGrid}>
                    {patientProfiles.map((p) => {
                      const isSel = selectedPatientId === p.id;
                      return (
                        <TouchableOpacity
                          key={p.id}
                          style={[styles.patientCard, isSel && styles.patientCardActive]}
                          onPress={() => {
                            setSelectedPatientId(p.id);
                            setHomeAddressName(p.name);
                            if (p.phone) setHomeAddressPhone(p.phone);
                          }}
                        >
                          <Ionicons
                            name={isSel ? 'radio-button-on' : 'radio-button-off'}
                            size={16}
                            color={isSel ? '#007D69' : '#94A3B8'}
                          />
                          <View style={{ flex: 1, marginLeft: 8 }}>
                            <Text style={styles.patientCardName}>{p.name} ({p.relation})</Text>
                            <Text style={styles.patientCardSub}>{p.age} yrs • {p.gender}</Text>
                          </View>
                        </TouchableOpacity>
                      );
                    })}
                  </View>

                  <Text style={[styles.stepSectionHeader, { marginTop: 14 }]}>2. How will you provide sample?</Text>
                  <TouchableOpacity
                    style={[styles.methodCard, collectionMethod === 'HOME' && styles.methodCardActive]}
                    onPress={() => setCollectionMethod('HOME')}
                  >
                    <Ionicons
                      name={collectionMethod === 'HOME' ? 'radio-button-on' : 'radio-button-off'}
                      size={18}
                      color={collectionMethod === 'HOME' ? '#007D69' : '#94A3B8'}
                    />
                    <View style={{ flex: 1, marginLeft: 10 }}>
                      <Text style={styles.methodCardTitle}>Home Sample Collection</Text>
                      <Text style={styles.methodCardDesc}>Certified phlebotomist visits your doorstep in {currentCity}.</Text>
                      <Text style={styles.methodCardFee}>Doorstep Convenience Fee: ₹100</Text>
                    </View>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.methodCard, collectionMethod === 'CENTRE' && styles.methodCardActive]}
                    onPress={() => setCollectionMethod('CENTRE')}
                  >
                    <Ionicons
                      name={collectionMethod === 'CENTRE' ? 'radio-button-on' : 'radio-button-off'}
                      size={18}
                      color={collectionMethod === 'CENTRE' ? '#007D69' : '#94A3B8'}
                    />
                    <View style={{ flex: 1, marginLeft: 10 }}>
                      <Text style={styles.methodCardTitle}>Diagnostic Centre Visit</Text>
                      <Text style={styles.methodCardDesc}>Visit any verified partner lab in {currentCity}.</Text>
                      <Text style={[styles.methodCardFee, { color: '#007D69' }]}>Collection Fee: FREE</Text>
                    </View>
                  </TouchableOpacity>
                </ScrollView>
              )}

              {/* STEP 2: LOCATION-SPECIFIC ADDRESS / LAB & DATE/SLOT */}
              {bookingFlowStep === 2 && (
                <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 420 }}>
                  {collectionMethod === 'HOME' ? (
                    <View style={styles.stepFormBlock}>
                      <Text style={styles.stepSectionHeader}>Sample Collection Address ({currentCity})</Text>
                      <Text style={styles.fieldLabel}>Contact Name *</Text>
                      <TextInput
                        style={styles.fieldInput}
                        value={homeAddressName}
                        onChangeText={setHomeAddressName}
                        placeholder="e.g. Hemanth Gowda"
                      />

                      <Text style={styles.fieldLabel}>Contact Phone *</Text>
                      <TextInput
                        style={styles.fieldInput}
                        value={homeAddressPhone}
                        onChangeText={setHomeAddressPhone}
                        placeholder="e.g. 9741422544"
                        keyboardType="phone-pad"
                      />

                      <Text style={styles.fieldLabel}>House/Flat No., Building & Street *</Text>
                      <TextInput
                        style={styles.fieldInput}
                        value={homeAddressFlat}
                        onChangeText={setHomeAddressFlat}
                        placeholder="e.g. #402, Green Meadows, 5th Main"
                      />

                      <View style={{ flexDirection: 'row', gap: 10 }}>
                        <View style={{ flex: 1 }}>
                          <Text style={styles.fieldLabel}>City (Home Location)</Text>
                          <TextInput
                            style={[styles.fieldInput, { backgroundColor: '#F1F5F9', color: '#0F172A', fontWeight: '700' }]}
                            value={currentCity}
                            editable={false}
                          />
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text style={styles.fieldLabel}>Pincode *</Text>
                          <TextInput
                            style={styles.fieldInput}
                            value={homeAddressPincode}
                            onChangeText={setHomeAddressPincode}
                            placeholder="e.g. 570023"
                            keyboardType="numeric"
                          />
                        </View>
                      </View>
                    </View>
                  ) : (
                    <View style={styles.stepFormBlock}>
                      <Text style={styles.stepSectionHeader}>Select Diagnostic Centre in {currentCity}</Text>
                      {cityDiagnosticCentres.map((c) => {
                        const isSel = selectedCentreId === c.id;
                        return (
                          <TouchableOpacity
                            key={c.id}
                            style={[styles.centreSelectCard, isSel && styles.centreSelectCardActive]}
                            onPress={() => setSelectedCentreId(c.id)}
                          >
                            <Ionicons name="business" size={18} color={isSel ? '#007D69' : '#64748B'} />
                            <View style={{ flex: 1, marginLeft: 8 }}>
                              <Text style={styles.centreSelectName}>{c.name}</Text>
                              <Text style={styles.centreSelectAddr}>{c.address}</Text>
                              <Text style={styles.centreSelectMeta}>⭐ {c.rating} • {c.distanceKm} km away</Text>
                            </View>
                            {isSel && <Ionicons name="checkmark-circle" size={18} color="#007D69" />}
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  )}

                  {/* Dates */}
                  <Text style={[styles.stepSectionHeader, { marginTop: 14 }]}>Select Date</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.datePillsScroll}>
                    {getAvailableDates().map((d) => {
                      const isSel = selectedDate === d.dateStr;
                      return (
                        <TouchableOpacity
                          key={d.dateStr}
                          style={[styles.datePill, isSel && styles.datePillActive]}
                          onPress={() => setSelectedDate(d.dateStr)}
                        >
                          <Text style={[styles.datePillDay, isSel && styles.datePillDayActive]}>{d.dayName}</Text>
                          <Text style={[styles.datePillVal, isSel && styles.datePillValActive]}>{d.dateStr}</Text>
                        </TouchableOpacity>
                      );
                    })}
                  </ScrollView>

                  {/* Slots */}
                  <Text style={[styles.stepSectionHeader, { marginTop: 14 }]}>Select Time Slot</Text>
                  <View style={styles.slotsGrid}>
                    {TIME_SLOTS.map((slot) => {
                      const isSel = selectedSlotId === slot.id;
                      const statusObj = getSlotStatus({
                        date: selectedDate,
                        time: slot.label,
                        serviceType: 'lab',
                        providerId: collectionMethod === 'HOME' ? 'home-collection' : selectedCentreId,
                      });
                      const isAvail = statusObj.available;
                      return (
                        <TouchableOpacity
                          key={slot.id}
                          disabled={!isAvail}
                          style={[
                            styles.slotBtn,
                            isSel && styles.slotBtnActive,
                            !isAvail && styles.slotBtnDisabled,
                          ]}
                          onPress={() => setSelectedSlotId(slot.id)}
                        >
                          <Text style={[styles.slotBtnLabel, isSel && styles.slotBtnLabelActive, !isAvail && styles.slotBtnLabelDisabled]}>
                            {slot.label}
                          </Text>
                          <Text style={[styles.slotBtnPeriod, !isAvail && styles.slotBtnLabelDisabled]}>
                            {!isAvail ? 'Booked' : slot.period}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </ScrollView>
              )}

              {/* STEP 3: SUMMARY */}
              {bookingFlowStep === 3 && (
                <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 420 }}>
                  <View style={styles.summaryBox}>
                    <Text style={styles.summaryTitle}>Appointment & Test Details</Text>
                    <View style={styles.summaryItemRow}>
                      <Text style={styles.summaryItemLabel}>Test / Package:</Text>
                      <Text style={styles.summaryItemVal} numberOfLines={2}>{activeBookingItem.name}</Text>
                    </View>
                    <View style={styles.summaryItemRow}>
                      <Text style={styles.summaryItemLabel}>Location City:</Text>
                      <Text style={[styles.summaryItemVal, { color: '#007D69', fontWeight: '800' }]}>{currentCity}</Text>
                    </View>
                    <View style={styles.summaryItemRow}>
                      <Text style={styles.summaryItemLabel}>Patient Name:</Text>
                      <Text style={styles.summaryItemVal}>{homeAddressName}</Text>
                    </View>
                    <View style={styles.summaryItemRow}>
                      <Text style={styles.summaryItemLabel}>Method:</Text>
                      <Text style={styles.summaryItemVal}>
                        {collectionMethod === 'HOME' ? 'Home Sample Collection' : 'Diagnostic Centre Visit'}
                      </Text>
                    </View>
                    {collectionMethod === 'HOME' ? (
                      <View style={styles.summaryItemRow}>
                        <Text style={styles.summaryItemLabel}>Home Address:</Text>
                        <Text style={styles.summaryItemVal}>
                          {homeAddressFlat}, {currentCity} - {homeAddressPincode}
                        </Text>
                      </View>
                    ) : (
                      <View style={styles.summaryItemRow}>
                        <Text style={styles.summaryItemLabel}>Centre:</Text>
                        <Text style={styles.summaryItemVal}>
                          {cityDiagnosticCentres.find((c) => c.id === selectedCentreId)?.name || cityDiagnosticCentres[0]?.name}
                        </Text>
                      </View>
                    )}
                    <View style={styles.summaryItemRow}>
                      <Text style={styles.summaryItemLabel}>Date & Slot:</Text>
                      <Text style={styles.summaryItemVal}>
                        {selectedDate} ({TIME_SLOTS.find((s) => s.id === selectedSlotId)?.label})
                      </Text>
                    </View>

                    <View style={styles.summaryDivider} />

                    <View style={styles.summaryItemRow}>
                      <Text style={styles.summaryItemLabel}>Test Fee:</Text>
                      <Text style={styles.summaryItemVal}>₹{activeBookingItem.price}</Text>
                    </View>
                    <View style={styles.summaryItemRow}>
                      <Text style={styles.summaryItemLabel}>Doorstep Collection:</Text>
                      <Text style={styles.summaryItemVal}>{collectionMethod === 'HOME' ? '₹100' : 'FREE'}</Text>
                    </View>

                    <View style={styles.summaryDivider} />

                    <View style={styles.summaryTotalRow}>
                      <Text style={styles.summaryTotalLabel}>Total Amount:</Text>
                      <Text style={styles.summaryTotalVal}>
                        ₹{activeBookingItem.price + (collectionMethod === 'HOME' ? 100 : 0)}
                      </Text>
                    </View>
                  </View>
                </ScrollView>
              )}

              {/* STEP 4: PAYMENT SIMULATION */}
              {bookingFlowStep === 4 && (
                <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 420 }}>
                  <Text style={styles.stepSectionHeader}>Select Payment Mode</Text>
                  {[
                    { id: 'UPI', label: 'UPI / Google Pay / PhonePe', icon: 'flash' },
                    { id: 'CARD', label: 'Credit / Debit Card', icon: 'card' },
                    { id: 'NET_BANKING', label: 'Net Banking', icon: 'globe' },
                    { id: 'WALLET', label: 'Pay at Sample Collection', icon: 'wallet' },
                  ].map((m) => (
                    <TouchableOpacity
                      key={m.id}
                      style={[styles.paymentCard, paymentMethod === m.id && styles.paymentCardActive]}
                      onPress={() => setPaymentMethod(m.id)}
                    >
                      <Ionicons name={m.icon} size={20} color={paymentMethod === m.id ? '#007D69' : '#64748B'} />
                      <Text style={[styles.paymentCardText, paymentMethod === m.id && styles.paymentCardTextActive]}>
                        {m.label}
                      </Text>
                      {paymentMethod === m.id && <Ionicons name="checkmark-circle" size={18} color="#007D69" style={{ marginLeft: 'auto' }} />}
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              )}

              {/* STEP 5: CONFIRMED */}
              {bookingFlowStep === 5 && confirmedBookingData && (
                <View style={styles.confirmedContainer}>
                  <Ionicons name="checkmark-circle" size={56} color="#007D69" />
                  <Text style={styles.confirmedHeading}>Booking Confirmed!</Text>
                  <Text style={styles.confirmedId}>Booking ID: {confirmedBookingData.id}</Text>
                  <Text style={styles.confirmedSub}>
                    {confirmedBookingData.testName} scheduled for {confirmedBookingData.bookingDate} ({confirmedBookingData.timeSlot}) in {currentCity}.
                  </Text>
                  <TouchableOpacity
                    style={styles.confirmedActionBtn}
                    onPress={() => {
                      setActiveBookingItem(null);
                      setActiveTab('BOOKINGS');
                    }}
                  >
                    <Text style={styles.confirmedActionBtnText}>View My Lab Bookings →</Text>
                  </TouchableOpacity>
                </View>
              )}

              {/* BOOKING MODAL ACTIONS (STEPS 1 - 4) */}
              {bookingFlowStep < 5 && (
                <View style={styles.bookingModalFooterRow}>
                  {bookingFlowStep > 1 && (
                    <TouchableOpacity style={styles.stepPrevBtn} onPress={() => setBookingFlowStep((s) => s - 1)}>
                      <Text style={styles.stepPrevBtnText}>Back</Text>
                    </TouchableOpacity>
                  )}
                  <TouchableOpacity
                    style={[styles.stepNextBtn, { flex: 1, marginLeft: bookingFlowStep > 1 ? 10 : 0 }]}
                    onPress={() => {
                      if (bookingFlowStep === 1) setBookingFlowStep(2);
                      else if (bookingFlowStep === 2) {
                        if (
                          collectionMethod === 'HOME' &&
                          (!homeAddressName.trim() || !homeAddressPhone.trim() || !homeAddressFlat.trim() || !homeAddressPincode.trim())
                        ) {
                          showAlert('Incomplete Address', 'Please fill in patient name, phone, address, and pincode.');
                          return;
                        }
                        setBookingFlowStep(3);
                      } else if (bookingFlowStep === 3) setBookingFlowStep(4);
                      else if (bookingFlowStep === 4) handleSimulatePayment();
                    }}
                  >
                    <Text style={styles.stepNextBtnText}>
                      {bookingFlowStep === 1
                        ? 'Continue to Location & Slot'
                        : bookingFlowStep === 2
                        ? 'Review Summary'
                        : bookingFlowStep === 3
                        ? 'Proceed to Payment'
                        : `Pay ₹${activeBookingItem.price + (collectionMethod === 'HOME' ? 100 : 0)}`}
                    </Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          </View>
        </Modal>
      )}

      {/* =======================================================================
          MODAL 6: SAMPLE TRACKING MODAL
      ======================================================================= */}
      {selectedTrackingBooking && (
        <Modal visible={!!selectedTrackingBooking} transparent animationType="slide" onRequestClose={() => setSelectedTrackingBooking(null)}>
          <View style={styles.modalOverlay}>
            <View style={[styles.sheetModalCard, isTablet && styles.tabletModalWidth]}>
              <View style={styles.modalHeaderRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.modalHeaderTitle}>Sample Tracking</Text>
                  <Text style={styles.modalHeaderSub}>Booking ID: {selectedTrackingBooking.id}</Text>
                </View>
                <TouchableOpacity onPress={() => setSelectedTrackingBooking(null)}>
                  <Ionicons name="close" size={22} color="#64748B" />
                </TouchableOpacity>
              </View>

              <View style={{ paddingVertical: 14 }}>
                {/* If lab centre visit, show centre info and Directions button */}
                {selectedTrackingBooking.collectionMethod === 'CENTRE' && (
                  <View style={styles.trackingCentreBox}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                      <Ionicons name="business" size={16} color="#007D69" />
                      <Text style={styles.trackingCentreName}>
                        {selectedTrackingBooking.diagnosticCentre?.name || 'Partner Diagnostic Centre'}
                      </Text>
                    </View>
                    <Text style={styles.trackingCentreAddress}>
                      {(() => {
                        const matched = ALL_CITY_DIAGNOSTIC_CENTRES.find(c => c.name === selectedTrackingBooking.diagnosticCentre?.name);
                        return matched?.address || selectedTrackingBooking.diagnosticCentre?.location || `${currentCity} Partner Center`;
                      })()}
                    </Text>
                    <TouchableOpacity
                      style={styles.trackingGetDirectionsBtn}
                      onPress={() => handleOpenCentreDirections(selectedTrackingBooking)}
                      activeOpacity={0.8}
                    >
                      <Ionicons name="navigate" size={14} color="#FFFFFF" style={{ marginRight: 6 }} />
                      <Text style={styles.trackingGetDirectionsBtnText}>Get Directions to Lab</Text>
                    </TouchableOpacity>
                  </View>
                )}

                {[
                  { step: 1, title: 'Test Booked', desc: `Confirmed for ${selectedTrackingBooking.bookingDate}` },
                  { step: 2, title: selectedTrackingBooking.collectionMethod === 'CENTRE' ? 'Lab Centre Prepared' : 'Phlebotomist Assigned', desc: selectedTrackingBooking.collectionMethod === 'CENTRE' ? `Visit ${selectedTrackingBooking.diagnosticCentre?.name || 'Diagnostic Centre'}` : `Assigned in ${currentCity}` },
                  { step: 3, title: 'Sample Collection Scheduled', desc: selectedTrackingBooking.timeSlot },
                  { step: 4, title: 'Laboratory Processing', desc: `Clinical analyzers in ${currentCity} partner lab` },
                  { step: 5, title: 'Certified Report Ready', desc: 'Pathologist verified digital report' },
                ].map((s, idx) => (
                  <View key={s.step} style={styles.trackStepRow}>
                    <View style={styles.trackDotCol}>
                      <View style={[styles.trackDot, idx <= 2 && styles.trackDotActive]}>
                        <Ionicons name="checkmark" size={11} color="#FFFFFF" />
                      </View>
                      {idx < 4 && <View style={[styles.trackLine, idx < 2 && styles.trackLineActive]} />}
                    </View>
                    <View style={{ flex: 1, marginLeft: 12, paddingBottom: 16 }}>
                      <Text style={styles.trackStepTitle}>{s.title}</Text>
                      <Text style={styles.trackStepDesc}>{s.desc}</Text>
                    </View>
                  </View>
                ))}
              </View>
            </View>
          </View>
        </Modal>
      )}

      {/* =======================================================================
          MODAL 7: REPORT VIEW MODAL
      ======================================================================= */}
      {selectedReport && (
        <Modal visible={!!selectedReport} transparent animationType="slide" onRequestClose={() => setSelectedReport(null)}>
          <View style={styles.modalOverlay}>
            <View style={[styles.sheetModalCard, isTablet && styles.tabletModalWidth]}>
              <View style={styles.modalHeaderRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.modalHeaderTitle}>{selectedReport.testName}</Text>
                  <Text style={styles.modalHeaderSub}>Report Ref: {selectedReport.id} • {currentCity}</Text>
                </View>
                <TouchableOpacity onPress={() => setSelectedReport(null)}>
                  <Ionicons name="close" size={22} color="#64748B" />
                </TouchableOpacity>
              </View>

              <View style={{ paddingVertical: 16 }}>
                <View style={styles.reportPreviewCard}>
                  <Ionicons name="document-text" size={32} color="#007D69" />
                  <Text style={styles.reportPreviewTitle}>{selectedReport.testName}</Text>
                  <Text style={styles.reportPreviewMeta}>
                    Date: {selectedReport.reportDate} | Lab: {selectedReport.diagnosticCentre || `${currentCity} Central Lab`}
                  </Text>
                  <Text style={styles.reportPreviewStatus}>Status: Certified & Signed by Chief Pathologist</Text>
                </View>

                <TouchableOpacity
                  style={styles.downloadFullBtn}
                  onPress={() => {
                    showAlert('Download Report', `Downloading certified PDF report for ${selectedReport.testName}...`);
                    setSelectedReport(null);
                  }}
                >
                  <Ionicons name="download" size={16} color="#FFFFFF" style={{ marginRight: 6 }} />
                  <Text style={styles.downloadFullBtnText}>Download Official PDF Report</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      )}
    </SafeAreaView>
  );
};

// =============================================================================
// STYLES
// =============================================================================
const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  scrollContent: {
    paddingBottom: 40,
    width: '100%',
    alignSelf: 'center',
  },
  tabletContainerWidth: {
    maxWidth: 780,
    width: '100%',
    alignSelf: 'center',
  },
  tabletModalWidth: {
    maxWidth: 640,
    width: '100%',
    alignSelf: 'center',
  },

  // HEADER
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerCenter: {
    flex: 1,
    marginLeft: 12,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
  },
  headerCityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  headerCityText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#007D69',
  },
  cartHeaderBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#E6F4F1',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  cartBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: '#FF7F50',
    borderRadius: 9,
    width: 18,
    height: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cartBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '800',
  },

  // TABS ROW
  tabsRow: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    paddingHorizontal: 16,
  },
  tabBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderBottomWidth: 2.5,
    borderBottomColor: 'transparent',
  },
  tabBtnActive: {
    borderBottomColor: '#007D69',
  },
  tabBtnText: {
    fontSize: 12.5,
    fontWeight: '600',
    color: '#64748B',
  },
  tabBtnTextActive: {
    color: '#007D69',
    fontWeight: '800',
  },
  tabBadge: {
    marginLeft: 6,
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 8,
  },
  tabBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748B',
  },

  // SEARCH & ACTIONS ROW (SEARCH + FILTER + SORT)
  searchRowContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    marginTop: 10,
    marginBottom: 8,
    gap: 8,
  },
  searchBox: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 12,
    height: 42,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 13,
    color: '#0F172A',
  },
  filterActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 42,
    paddingHorizontal: 12,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
  },
  filterActionBtnActive: {
    backgroundColor: '#007D69',
    borderColor: '#007D69',
  },
  filterActionBtnText: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#007D69',
  },
  filterActionBtnTextActive: {
    color: '#FFFFFF',
  },
  sortActionBtn: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sortActionBtnActive: {
    backgroundColor: '#007D69',
    borderColor: '#007D69',
  },

  // SUB-VIEW SWITCHER (ALL | PACKAGES | TESTS)
  subViewSwitcher: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginBottom: 10,
    backgroundColor: '#E2E8F0',
    padding: 3,
    borderRadius: 10,
    gap: 4,
  },
  subViewBtn: {
    flex: 1,
    flexDirection: 'row',
    paddingVertical: 7,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  subViewBtnActive: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 1,
  },
  subViewBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
  },
  subViewBtnTextActive: {
    color: '#007D69',
    fontWeight: '800',
  },
  subViewBadge: {
    marginLeft: 5,
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 6,
  },
  subViewBadgeActive: {
    backgroundColor: '#E6F4F1',
  },
  subViewBadgeText: {
    fontSize: 10.5,
    fontWeight: '700',
    color: '#64748B',
  },
  subViewBadgeTextActive: {
    color: '#007D69',
  },

  // CATEGORIES
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  sectionHeading: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
  },
  resetLinkText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FF7F50',
  },
  categoriesScroll: {
    paddingHorizontal: 16,
    paddingBottom: 8,
    gap: 10,
  },
  categoryCard: {
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    paddingVertical: 8,
    paddingHorizontal: 12,
    minWidth: 72,
  },
  categoryCardActive: {
    borderColor: '#007D69',
    backgroundColor: '#E6F4F1',
  },
  categoryIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  categoryIconWrapActive: {
    backgroundColor: '#007D69',
  },
  categoryName: {
    fontSize: 11,
    fontWeight: '600',
    color: '#475569',
  },
  categoryNameActive: {
    color: '#007D69',
    fontWeight: '800',
  },
  popularCategoryCard: {
    borderColor: '#FED7AA',
    backgroundColor: '#FFF7ED',
  },
  popularCategoryIconWrap: {
    backgroundColor: '#FFEDD5',
  },
  popularCategoryText: {
    color: '#C2410C',
    fontWeight: '700',
  },

  // SUBCATEGORIES
  subCatScroll: {
    paddingHorizontal: 16,
    paddingBottom: 10,
    gap: 8,
  },
  subCatPill: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    backgroundColor: '#F1F5F9',
  },
  subCatPillActive: {
    backgroundColor: '#007D69',
  },
  subCatText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748B',
  },
  subCatTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },

  // LOCATION STATUS (SIMPLE & CLEAN)
  simpleLocationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginTop: 6,
    marginBottom: 10,
  },
  simpleLocationText: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#007D69',
  },

  // CARDS: PACKAGE & TEST
  packagesSectionWrap: {
    paddingHorizontal: 16,
    marginBottom: 10,
  },
  testsSectionWrap: {
    paddingHorizontal: 16,
    marginBottom: 10,
  },
  packageCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 5,
    elevation: 2,
  },
  testCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 5,
    elevation: 2,
  },
  cardCategoryText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#007D69',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
    marginBottom: 3,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 6,
  },
  pkgMetricsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    rowGap: 6,
    columnGap: 6,
    marginBottom: 10,
  },
  keyInfoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    maxWidth: '100%',
  },
  keyInfoIcon: {
    fontSize: 12,
  },
  keyInfoText: {
    fontSize: 11.5,
    fontWeight: '600',
    color: '#334155',
    flexShrink: 1,
  },
  cardFooterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 6,
  },
  cardPrice: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
  },
  cardMrp: {
    fontSize: 12,
    color: '#94A3B8',
    textDecorationLine: 'line-through',
  },
  discountBadge: {
    backgroundColor: '#FFF2ED',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  discountBadgeText: {
    color: '#FF7F50',
    fontSize: 10.5,
    fontWeight: '800',
  },
  cardActionBtnsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  detailsBtn: {
    paddingHorizontal: 14,
    minHeight: 34,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  detailsBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#334155',
  },
  cartIconBtn: {
    width: 34,
    height: 34,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#E6F4F1',
    borderWidth: 1,
    borderColor: '#CCFBF1',
  },
  cartIconBtnActive: {
    backgroundColor: '#007D69',
    borderColor: '#007D69',
  },
  bookPrimaryBtn: {
    paddingHorizontal: 16,
    minHeight: 34,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#007D69',
    borderRadius: 8,
  },
  bookPrimaryBtnText: {
    fontSize: 12.5,
    fontWeight: '800',
    color: '#FFFFFF',
  },

  // EMPTY CONTAINER
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 30,
    marginTop: 20,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
    marginTop: 12,
  },
  emptySub: {
    fontSize: 12,
    color: '#64748B',
    textAlign: 'center',
    marginTop: 4,
    lineHeight: 18,
  },
  resetFilterBtn: {
    marginTop: 14,
    backgroundColor: '#007D69',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
  },
  resetFilterBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },

  // BOOKINGS TAB
  bookingsFilterRow: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 16,
    marginTop: 12,
    marginBottom: 10,
  },
  bookingFilterPill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  bookingFilterPillActive: {
    backgroundColor: '#007D69',
    borderColor: '#007D69',
  },
  bookingFilterText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
  },
  bookingFilterTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  bookingCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  bookingCardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  bookingIdText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748B',
  },
  bookingTestTitle: {
    fontSize: 14.5,
    fontWeight: '800',
    color: '#0F172A',
    marginTop: 2,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  statusBadgeText: {
    fontSize: 11,
    fontWeight: '800',
  },
  bookingMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  bookingMetaText: {
    fontSize: 12,
    color: '#475569',
    flex: 1,
  },
  bookingFooterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 10,
    marginTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  bookingAmountText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
  },
  trackBookingBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#007D69',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
  },
  trackBookingBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  cancelBookingBtn: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
    backgroundColor: '#FEE2E2',
  },
  cancelBookingBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#DC2626',
  },
  centreVisitCardBox: {
    backgroundColor: '#F0FDFA',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#CCFBF1',
    padding: 10,
    marginTop: 8,
    marginBottom: 6,
  },
  centreVisitHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  labVisitTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E6FFFA',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
    gap: 4,
  },
  labVisitTagText: {
    fontSize: 10.5,
    fontWeight: '700',
    color: '#007D69',
  },
  centreDistanceText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#0D9488',
  },
  centreAddressFullText: {
    fontSize: 11.5,
    color: '#334155',
    lineHeight: 16,
    marginBottom: 8,
  },
  getDirectionsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#007D69',
    paddingVertical: 7,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  getDirectionsBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  footerDirectionsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ECFDF5',
    borderWidth: 1,
    borderColor: '#A7F3D0',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  footerDirectionsBtnText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#007D69',
  },
  trackingCentreBox: {
    backgroundColor: '#F0FDFA',
    borderWidth: 1,
    borderColor: '#CCFBF1',
    borderRadius: 10,
    padding: 12,
    marginBottom: 14,
  },
  trackingCentreName: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
  },
  trackingCentreAddress: {
    fontSize: 11.5,
    color: '#475569',
    marginBottom: 8,
    marginTop: 2,
  },
  trackingGetDirectionsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#007D69',
    paddingVertical: 7,
    borderRadius: 8,
  },
  trackingGetDirectionsBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },

  // REPORTS TAB
  reportCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 14,
    marginHorizontal: 16,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  reportIconCol: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#E6F4F1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  reportTestName: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0F172A',
  },
  reportSubText: {
    fontSize: 11.5,
    color: '#64748B',
    marginTop: 2,
  },
  reportVerifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  reportVerifiedBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#059669',
  },
  downloadReportBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // NO LOCATION STATE
  noLocationContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  noLocationIconCircle: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: '#E6F4F1',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  noLocationTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 8,
  },
  noLocationMsg: {
    fontSize: 13.5,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  noLocationBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#007D69',
    paddingHorizontal: 22,
    paddingVertical: 12,
    borderRadius: 12,
  },
  noLocationBtnText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#FFFFFF',
  },

  // MODAL OVERLAY & BOTTOM SHEET
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  sheetModalCard: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    paddingBottom: 28,
    width: '100%',
  },
  bookingModalCard: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    paddingBottom: 28,
    width: '100%',
  },
  modalHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  modalHeaderTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
  },
  modalHeaderSub: {
    fontSize: 11.5,
    color: '#64748B',
    marginTop: 1,
  },
  resetModalText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FF7F50',
  },

  // FILTER MODAL CONTENT
  filterSectionTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0F172A',
    marginTop: 12,
    marginBottom: 8,
  },
  filterOptionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  filterPill: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 10,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  filterPillActive: {
    backgroundColor: '#E6F4F1',
    borderColor: '#007D69',
  },
  filterPillText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#475569',
  },
  filterPillTextActive: {
    color: '#007D69',
    fontWeight: '800',
  },
  filterActionRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  filterClearBtn: {
    flex: 1,
    minHeight: 44,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 12,
    backgroundColor: '#F1F5F9',
  },
  filterClearBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#64748B',
  },
  filterApplyBtn: {
    flex: 2,
    minHeight: 44,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 12,
    backgroundColor: '#007D69',
  },
  filterApplyBtnText: {
    fontSize: 13.5,
    fontWeight: '800',
    color: '#FFFFFF',
  },

  // SORT MODAL CONTENT
  sortOptionsList: {
    paddingVertical: 8,
    gap: 8,
  },
  sortOptionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 12,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  sortOptionRowActive: {
    backgroundColor: '#E6F4F1',
    borderColor: '#007D69',
  },
  sortOptionLabel: {
    fontSize: 13.5,
    fontWeight: '600',
    color: '#334155',
  },
  sortOptionLabelActive: {
    color: '#007D69',
    fontWeight: '800',
  },

  // PACKAGE DETAILS ACCORDION
  clinicalNoteBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#F0F9FF',
    padding: 10,
    borderRadius: 10,
    marginBottom: 12,
  },
  clinicalNoteText: {
    fontSize: 11.5,
    color: '#0369A1',
    flex: 1,
  },
  accordionHeaderTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 8,
  },
  accordionItem: {
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 10,
    marginBottom: 6,
    overflow: 'hidden',
  },
  accordionItemActive: {
    borderColor: '#007D69',
  },
  accordionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    backgroundColor: '#FFFFFF',
  },
  accordionTitleText: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#0F172A',
    flex: 1,
  },
  accordionBody: {
    padding: 10,
    backgroundColor: '#F8FAFC',
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
  },
  accordionParamLabel: {
    fontSize: 10.5,
    fontWeight: '700',
    color: '#64748B',
  },
  accordionParamValue: {
    fontSize: 11.5,
    color: '#1E293B',
    marginTop: 2,
    lineHeight: 16,
  },
  accordionMetaGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 6,
  },
  accordionMetaItem: {
    fontSize: 11,
    color: '#64748B',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  detailsModalFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 14,
    marginTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  detailsModalPrice: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
  },
  detailsModalMrp: {
    fontSize: 12,
    color: '#94A3B8',
    textDecorationLine: 'line-through',
  },

  // TEST MODAL
  testModalDesc: {
    fontSize: 13,
    color: '#475569',
    lineHeight: 19,
    marginBottom: 12,
  },
  infoCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    padding: 10,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  infoCardTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: '#007D69',
    marginBottom: 2,
  },
  infoCardBody: {
    fontSize: 12,
    color: '#334155',
  },
  testMetaRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 4,
  },
  testMetaCol: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 8,
    padding: 8,
    alignItems: 'center',
  },
  testMetaColLabel: {
    fontSize: 10,
    color: '#64748B',
    fontWeight: '600',
  },
  testMetaColVal: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0F172A',
    marginTop: 2,
  },

  // BOOKING JOURNEY
  bookingStepTitle: {
    fontSize: 15.5,
    fontWeight: '800',
    color: '#0F172A',
  },
  bookingStepSub: {
    fontSize: 11.5,
    color: '#007D69',
    fontWeight: '700',
    marginTop: 1,
  },
  stepSectionHeader: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 8,
  },
  patientProfilesGrid: {
    gap: 8,
  },
  patientCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderRadius: 10,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  patientCardActive: {
    backgroundColor: '#E6F4F1',
    borderColor: '#007D69',
  },
  patientCardName: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
  },
  patientCardSub: {
    fontSize: 11,
    color: '#64748B',
  },
  methodCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 12,
    borderRadius: 12,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 8,
  },
  methodCardActive: {
    backgroundColor: '#E6F4F1',
    borderColor: '#007D69',
  },
  methodCardTitle: {
    fontSize: 13.5,
    fontWeight: '800',
    color: '#0F172A',
  },
  methodCardDesc: {
    fontSize: 11.5,
    color: '#64748B',
    marginTop: 2,
  },
  methodCardFee: {
    fontSize: 11,
    fontWeight: '700',
    color: '#007D69',
    marginTop: 4,
  },

  // STEP 2 FORMS
  stepFormBlock: {
    marginBottom: 8,
  },
  fieldLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#475569',
    marginTop: 8,
    marginBottom: 3,
  },
  fieldInput: {
    height: 42,
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 10,
    fontSize: 13,
    color: '#0F172A',
  },
  centreSelectCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderRadius: 10,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 8,
  },
  centreSelectCardActive: {
    backgroundColor: '#E6F4F1',
    borderColor: '#007D69',
  },
  centreSelectName: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
  },
  centreSelectAddr: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 1,
  },
  centreSelectMeta: {
    fontSize: 10.5,
    fontWeight: '700',
    color: '#FF7F50',
    marginTop: 2,
  },
  datePillsScroll: {
    gap: 8,
    paddingVertical: 4,
  },
  datePill: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 10,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    minWidth: 64,
  },
  datePillActive: {
    backgroundColor: '#007D69',
  },
  datePillDay: {
    fontSize: 10,
    fontWeight: '600',
    color: '#64748B',
  },
  datePillDayActive: {
    color: '#FFFFFF',
  },
  datePillVal: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0F172A',
    marginTop: 1,
  },
  datePillValActive: {
    color: '#FFFFFF',
  },
  slotsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    paddingVertical: 4,
  },
  slotBtn: {
    flex: 1,
    minWidth: 130,
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 10,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
  },
  slotBtnActive: {
    backgroundColor: '#E6F4F1',
    borderColor: '#007D69',
  },
  slotBtnDisabled: {
    backgroundColor: '#F1F5F9',
    opacity: 0.5,
  },
  slotBtnLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0F172A',
  },
  slotBtnLabelActive: {
    color: '#007D69',
  },
  slotBtnLabelDisabled: {
    color: '#94A3B8',
  },
  slotBtnPeriod: {
    fontSize: 10,
    color: '#64748B',
    marginTop: 1,
  },

  // SUMMARY BOX
  summaryBox: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  summaryTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 10,
  },
  summaryItemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  summaryItemLabel: {
    fontSize: 12,
    color: '#64748B',
  },
  summaryItemVal: {
    fontSize: 12,
    fontWeight: '600',
    color: '#0F172A',
    flex: 1,
    textAlign: 'right',
  },
  summaryDivider: {
    height: 1,
    backgroundColor: '#E2E8F0',
    marginVertical: 8,
  },
  summaryTotalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  summaryTotalLabel: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0F172A',
  },
  summaryTotalVal: {
    fontSize: 17,
    fontWeight: '900',
    color: '#007D69',
  },

  // PAYMENT MODES
  paymentCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 10,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 8,
  },
  paymentCardActive: {
    backgroundColor: '#E6F4F1',
    borderColor: '#007D69',
  },
  paymentCardText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#334155',
    marginLeft: 10,
  },
  paymentCardTextActive: {
    color: '#007D69',
    fontWeight: '800',
  },

  // CONFIRMED
  confirmedContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
    paddingHorizontal: 16,
  },
  confirmedHeading: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
    marginTop: 10,
  },
  confirmedId: {
    fontSize: 12,
    fontWeight: '700',
    color: '#007D69',
    marginTop: 4,
  },
  confirmedSub: {
    fontSize: 12.5,
    color: '#475569',
    textAlign: 'center',
    marginTop: 6,
    lineHeight: 18,
  },
  confirmedActionBtn: {
    marginTop: 18,
    backgroundColor: '#007D69',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 10,
  },
  confirmedActionBtnText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#FFFFFF',
  },

  // FOOTER BUTTONS
  bookingModalFooterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  stepPrevBtn: {
    paddingHorizontal: 16,
    minHeight: 44,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    borderRadius: 10,
  },
  stepPrevBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#64748B',
  },
  stepNextBtn: {
    minHeight: 44,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#007D69',
    borderRadius: 10,
  },
  stepNextBtnText: {
    fontSize: 13.5,
    fontWeight: '800',
    color: '#FFFFFF',
  },

  // TRACKING MODAL
  trackStepRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  trackDotCol: {
    alignItems: 'center',
    width: 24,
  },
  trackDot: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  trackDotActive: {
    backgroundColor: '#007D69',
  },
  trackLine: {
    width: 2,
    height: 36,
    backgroundColor: '#E2E8F0',
    marginVertical: 2,
  },
  trackLineActive: {
    backgroundColor: '#007D69',
  },
  trackStepTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
  },
  trackStepDesc: {
    fontSize: 11.5,
    color: '#64748B',
    marginTop: 1,
  },

  // REPORT PREVIEW MODAL
  reportPreviewCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
    marginBottom: 14,
  },
  reportPreviewTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
    marginTop: 8,
  },
  reportPreviewMeta: {
    fontSize: 11.5,
    color: '#64748B',
    marginTop: 4,
  },
  reportPreviewStatus: {
    fontSize: 11,
    fontWeight: '700',
    color: '#059669',
    marginTop: 8,
  },
  downloadFullBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#007D69',
    paddingVertical: 12,
    borderRadius: 10,
  },
  downloadFullBtnText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#FFFFFF',
  },
});

export default LabTestsScreen;