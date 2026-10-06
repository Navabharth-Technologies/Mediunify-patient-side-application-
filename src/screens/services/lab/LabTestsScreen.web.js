import React, { useState, useMemo, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  Platform,
  useWindowDimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import colors from '../../../theme/colors';
import {
  LAB_CATEGORIES,
  LAB_TESTS_MASTER,
  LAB_PACKAGES,
  DIAGNOSTIC_CENTRES,
  ALL_CITY_DIAGNOSTIC_CENTRES,
  getCentresByCity,
  getGoogleMapsDirectionsUrl,
  getAvailableDates,
  TIME_SLOTS,
  INITIAL_SAVED_ADDRESSES,
  INITIAL_LAB_BOOKINGS,
  INITIAL_LAB_REPORTS,
} from '../../../data/labTestData';
import { getSlotStatus, validateAndBookSlot, subscribeToSlotChanges } from '../../../services/slotBookingService';
import WebFooter from '../../../components/web/WebFooter';
import Pagination from '../../../components/common/Pagination';
import { showAlert } from '../../../utils/alert';
import {
  NOVUS_POPULAR_PACKAGES,
  NOVUS_CURATED_PACKAGES,
  NOVUS_PACKAGE_CATEGORIES,
} from '../../../data/novusPackagesData';
import { useCart } from '../../../context/CartContext';
import { useAuthGuard } from '../../../context/AuthGuardContext';

const LabTestsScreenWeb = (props) => {
  const { navigation, route } = props;
  const { width } = useWindowDimensions();
  const isDesktop = width >= 1024;
  const isTablet = width >= 768 && width < 1024;
  const { requireLogin } = useAuthGuard();

  // Open Google Maps Directions for Clinical Lab / Diagnostic Centre
  const handleOpenDirections = (centre, e) => {
    if (e && e.stopPropagation) {
      e.stopPropagation();
    }
    const url = getGoogleMapsDirectionsUrl(centre);
    if (typeof window !== 'undefined' && window.open) {
      window.open(url, '_blank', 'noopener,noreferrer');
    }
  };

  // Cart integration
  const { labCart = [], addToCart, removeFromCart, labCartCount = 0, labFinalTotal = 0 } = useCart();

  const isTestInCart = (id) => labCart?.some((item) => item.id === id);

  const handleToggleCartTest = (test) => {
    if (isTestInCart(test.id)) {
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
        centerName: 'Unnathi Certified Clinical Labs',
        reportTime: test.reportTAT || 'Within 24 Hours',
        sampleType: test.sampleType || 'Blood Sample',
        homeSample: Boolean(test.homeCollection),
        fastingRequired: test.fastingRequired,
      };
      addToCart(cartItem, 1, 'lab');
      showAlert('Added to Cart', `${test.name} has been added to your cart.`);
    }
  };

  const handleToggleCartPackage = (pkg) => {
    if (isTestInCart(pkg.id)) {
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
        centerName: 'Unnathi Comprehensive Care Lab',
        reportTime: 'Within 24-48 Hours',
        sampleType: `${pkg.includedCount || 'Multiple'} Tests Included`,
        homeSample: true,
        isPackage: true,
      };
      addToCart(cartItem, 1, 'lab');
      showAlert('Added to Cart', `${pkg.name} has been added to your cart.`);
    }
  };

  // Root Tabs: 'BROWSE' | 'BOOKINGS' | 'REPORTS'
  const [activeTab, setActiveTab] = useState(route?.params?.initialTab || 'BROWSE');

  // Search & Filter States
  const [searchQuery, setSearchQuery] = useState(route?.params?.query || route?.params?.search || '');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedSubCategory, setSelectedSubCategory] = useState('all');
  const [selectedGenderFilter, setSelectedGenderFilter] = useState('ALL');
  const [selectedSampleFilter, setSelectedSampleFilter] = useState('ALL');
  const [selectedCollectionFilter, setSelectedCollectionFilter] = useState('ALL');
  const [selectedPriceFilter, setSelectedPriceFilter] = useState('ALL');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedSort, setSelectedSort] = useState('RECOMMENDED'); // 'RECOMMENDED' | 'PRICE_LOW_HIGH' | 'PRICE_HIGH_LOW' | 'MOST_TESTS'
  const [selectedInclusions, setSelectedInclusions] = useState([]); // ['VITAMINS', 'ECG_IMAGING', 'ECHO', 'IRON', 'HBA1C']

  const toggleInclusion = (id) => {
    setSelectedInclusions((prev) => {
      if (prev.includes(id)) {
        return prev.filter((item) => item !== id);
      } else {
        return [...prev, id];
      }
    });
    setCurrentPage(1);
  };
  const ITEMS_PER_PAGE = 4;
  const [packageSubView, setPackageSubView] = useState('ALL'); // 'ALL' | 'PACKAGES' | 'TESTS'
  const [expandedTestIndex, setExpandedTestIndex] = useState(null);
  const DEFAULT_PATIENT_PROFILES = [
    { id: 'p-self', name: 'User Profile', relation: 'Self', age: 28, gender: 'Not specified', phone: '' },
  ];

  const [patientProfiles, setPatientProfiles] = useState(DEFAULT_PATIENT_PROFILES);
  const [selectedPatientId, setSelectedPatientId] = useState('p-self');

  // Modals & Details State
  const [selectedTest, setSelectedTest] = useState(null);
  const [selectedPackage, setSelectedPackage] = useState(null);

  // Selected City & Location Filtering (Synchronized with Home Screen / Web Header)
  const [currentCity, setCurrentCity] = useState('Mysuru');

  useEffect(() => {
    const loadCity = async () => {
      try {
        const saved =
          (await AsyncStorage.getItem('@mediunify_selected_city')) ||
          (await AsyncStorage.getItem('@unnathi_user_location'));
        if (saved) {
          const s = saved.toLowerCase();
          const norm =
            s.includes('bengal') || s.includes('bangal')
              ? 'Bengaluru'
              : s.includes('hassan')
              ? 'Hassan'
              : s.includes('mandya')
              ? 'Mandya'
              : s.includes('mangal')
              ? 'Mangaluru'
              : s.includes('hubli') || s.includes('hubballi')
              ? 'Hubballi'
              : s.includes('belgaum') || s.includes('belagavi')
              ? 'Belagavi'
              : 'Mysuru';
          setCurrentCity(norm);
        }
      } catch (e) {}
    };
    loadCity();

    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      const handleStorage = (e) => {
        if (!e || e.key === '@mediunify_selected_city' || e.key === '@unnathi_user_location') {
          loadCity();
        }
      };
      window.addEventListener('storage', handleStorage);
      return () => window.removeEventListener('storage', handleStorage);
    }
  }, []);

  const availableCentres = useMemo(() => {
    return getCentresByCity(currentCity);
  }, [currentCity]);

  // Booking Flow State
  const [bookingFlowStep, setBookingFlowStep] = useState(1);
  const [activeBookingTest, setActiveBookingTest] = useState(null);
  const [collectionMethod, setCollectionMethod] = useState('HOME');
  const [selectedCentreId, setSelectedCentreId] = useState('centre-unnathi-main');

  useEffect(() => {
    if (availableCentres.length > 0 && !availableCentres.some((c) => c.id === selectedCentreId)) {
      setSelectedCentreId(availableCentres[0].id);
    }
  }, [availableCentres, selectedCentreId]);

  const [selectedDate, setSelectedDate] = useState(getAvailableDates()[0].dateStr);
  const [selectedSlotId, setSelectedSlotId] = useState('slot-2');
  const [paymentMethod, setPaymentMethod] = useState('UPI');
  const [confirmedBookingData, setConfirmedBookingData] = useState(null);
  const [slotTick, setSlotTick] = useState(0);

  // Subscribe to real-time clock advancement & slot booking updates
  useEffect(() => {
    const unsub = subscribeToSlotChanges(() => {
      setSlotTick((prev) => prev + 1);
    });
    return unsub;
  }, []);

  // Ensure an available slot is selected when date/collection method changes or slots update
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
      const firstAvail = TIME_SLOTS.find((s) => {
        return getSlotStatus({
          date: selectedDate,
          time: s.label,
          serviceType: 'lab',
          providerId,
        }).available;
      });
      if (firstAvail) {
        setSelectedSlotId(firstAvail.id);
      }
    }
  }, [selectedDate, collectionMethod, selectedCentreId, slotTick, selectedSlotId]);

  // Manual Home Collection Address Form
  const [homeAddressName, setHomeAddressName] = useState('');
  const [homeAddressPhone, setHomeAddressPhone] = useState('');
  const [homeAddressFlat, setHomeAddressFlat] = useState('Flat 402, Green Meadows');
  const [homeAddressCity, setHomeAddressCity] = useState('Mysuru');
  const [homeAddressPincode, setHomeAddressPincode] = useState('570023');
  const [homeAddressLandmark, setHomeAddressLandmark] = useState('');

  // Automatically load logged in user's profile and family details
  const loadUserProfiles = async () => {
    try {
      const storedPrimary = await AsyncStorage.getItem('@unnathi_primary_user');
      const storedUser = await AsyncStorage.getItem('user');
      const storedName = await AsyncStorage.getItem('userName');
      const storedPhone = await AsyncStorage.getItem('userPhone');
      const storedEmail = await AsyncStorage.getItem('userEmail');

      let userName = '';
      let userPhone = storedPhone || '';
      let userAge = '28';
      let userGender = 'Not specified';
      let userEmail = storedEmail || '';

      if (storedPrimary) {
        try {
          const p = JSON.parse(storedPrimary);
          if (p?.name && p.name.trim()) userName = p.name.replace(/\s*\(Self\)$/i, '').trim();
          if (p?.phone && p.phone.trim()) userPhone = p.phone.trim();
          if (p?.email && p.email.trim()) userEmail = p.email.trim();
          if (p?.age) userAge = p.age.toString().replace(/[^0-9]/g, '') || '28';
          if (p?.gender) userGender = p.gender;
        } catch (e) {}
      }
      if (!userName && storedUser) {
        try {
          const u = JSON.parse(storedUser);
          if (u?.name && u.name.trim()) userName = u.name.replace(/\s*\(Self\)$/i, '').trim();
          if (u?.phone && u.phone.trim()) userPhone = u.phone.trim();
          if (u?.email && u.email.trim()) userEmail = u.email.trim();
          if (u?.age) userAge = u.age.toString().replace(/[^0-9]/g, '') || '28';
          if (u?.gender) userGender = u.gender;
        } catch (e) {}
      }
      if (!userName && storedName && storedName.trim()) {
        userName = storedName.replace(/\s*\(Self\)$/i, '').trim();
      }

      const effectiveName = userName || 'User Profile';
      const selfProfile = {
        id: 'p-self',
        name: effectiveName,
        relation: 'Self',
        age: parseInt(userAge, 10) || 28,
        gender: userGender || 'Not specified',
        phone: userPhone || '',
      };

      // Query family members specific to current user account
      const userKey = (userEmail || userPhone || effectiveName).toLowerCase().replace(/[^a-z0-9]/g, '_');
      const userFamKey = `@unnathi_family_members_${userKey}`;
      const savedUserFam = await AsyncStorage.getItem(userFamKey);
      let familyList = [];

      if (savedUserFam) {
        try {
          const parsed = JSON.parse(savedUserFam);
          if (Array.isArray(parsed) && parsed.length > 0) {
            familyList = parsed;
          }
        } catch (e) {}
      }

      // Fallback: check session family members only if it belongs to this user
      if (familyList.length === 0) {
        const storedFam = await AsyncStorage.getItem('@unnathi_family_members');
        if (storedFam) {
          try {
            const parsedG = JSON.parse(storedFam);
            if (Array.isArray(parsedG) && parsedG.length > 0) {
              const firstMem = parsedG[0];
              if (firstMem?.name && firstMem.name.toLowerCase().includes(effectiveName.split(' ')[0].toLowerCase())) {
                familyList = parsedG;
              }
            }
          } catch (e) {}
        }
      }

      // Filter out self/primary, ONLY take family members explicitly added by user
      const otherProfiles = (Array.isArray(familyList) && familyList.length > 0)
        ? familyList
            .filter(m => m && m.id !== 'self' && m.relation !== 'Self' && !m.isPrimary)
            .map((m, idx) => ({
              id: m.id || `p-${idx + 2}`,
              name: (m.name || m.displayName || 'Family Member').replace(/\s*\(.*?\)$/, '').trim(),
              relation: m.relation || 'Family',
              age: parseInt(m.age, 10) || 30,
              gender: m.gender || 'Not specified',
              phone: m.phone || userPhone || '',
            }))
        : [];

      const combined = [selfProfile, ...otherProfiles];
      setPatientProfiles(combined);
      setSelectedPatientId('p-self');
      setHomeAddressName(effectiveName);
      if (userPhone) setHomeAddressPhone(userPhone);
    } catch (err) {
      console.warn('[LabTestsScreen] Failed to load user profiles:', err);
    }
  };

  useEffect(() => {
    loadUserProfiles();
  }, [activeBookingTest]);

  // Bookings & Reports State
  const [bookingsList, setBookingsList] = useState(INITIAL_LAB_BOOKINGS);

  useEffect(() => {
    const loadStoredLabBookings = async () => {
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
    };
    loadStoredLabBookings();
  }, []);
  const [bookingsFilter, setBookingsFilter] = useState('ALL');
  const [selectedTrackingBooking, setSelectedTrackingBooking] = useState(null);

  const [reportsList, setReportsList] = useState(INITIAL_LAB_REPORTS);
  const [selectedReport, setSelectedReport] = useState(null);
  const [showDownloadToast, setShowDownloadToast] = useState(false);

  // Scroll ref
  const mainScrollRef = useRef(null);

  // ---------------------------------------------------------------------------
  // FILTERING LOGIC
  // ---------------------------------------------------------------------------
  const filteredTests = useMemo(() => {
    return LAB_TESTS_MASTER.filter((test) => {
      if (selectedCategory !== 'all' && test.category !== selectedCategory) return false;
      if (selectedSubCategory !== 'all' && test.subCategory !== selectedSubCategory) return false;

      if (selectedGenderFilter !== 'ALL' && test.genderApplicability !== 'All') {
        if (selectedGenderFilter === 'MALE' && test.genderApplicability !== 'Male') return false;
        if (selectedGenderFilter === 'FEMALE' && test.genderApplicability !== 'Female') return false;
      }

      if (selectedSampleFilter !== 'ALL' && test.sampleType !== selectedSampleFilter) return false;
      if (selectedCollectionFilter === 'HOME' && !test.homeCollection) return false;
      if (selectedCollectionFilter === 'CENTRE' && !test.centreCollection) return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesName = test.name.toLowerCase().includes(q);
        const matchesDesc = test.description.toLowerCase().includes(q);
        const matchesKeywords = test.keywords?.some((k) => k.toLowerCase().includes(q));
        const matchesSynonyms = test.synonyms?.some((s) => s.toLowerCase().includes(q));
        const matchesAlternate = test.alternateNames?.some((a) => a.toLowerCase().includes(q));
        const matchesConsumer = test.consumerTerms?.some((c) => c.toLowerCase().includes(q));

        if (!matchesName && !matchesDesc && !matchesKeywords && !matchesSynonyms && !matchesAlternate && !matchesConsumer) {
          return false;
        }
      }
      return true;
    });
  }, [
    searchQuery,
    selectedCategory,
    selectedSubCategory,
    selectedGenderFilter,
    selectedSampleFilter,
    selectedCollectionFilter,
  ]);

  const activeCategoryObj = useMemo(() => {
    return LAB_CATEGORIES.find((c) => c.id === selectedCategory);
  }, [selectedCategory]);

  const filteredPackages = useMemo(() => {
    const list = NOVUS_POPULAR_PACKAGES.filter((pkg) => {
      // Category filter
      if (selectedCategory !== 'all') {
        if (selectedCategory === 'most-popular') {
          return (
            pkg.isMostPopularBooked ||
            pkg.badge?.toLowerCase().includes('popular') ||
            ['POP-FB-01', 'POP-EXE-01', 'POP-DIA-01', 'POP-HRT-01'].includes(pkg.id)
          );
        }
        if (selectedCategory === 'curated') {
          return pkg.type === 'curated';
        }
        if (pkg.categoryId !== selectedCategory) {
          return false;
        }
      }

      // Price filter
      if (selectedPriceFilter === 'UNDER_1000' && pkg.price >= 1000) return false;
      if (selectedPriceFilter === '1000_2000' && (pkg.price < 1000 || pkg.price > 2000)) return false;
      if (selectedPriceFilter === 'ABOVE_2000' && pkg.price <= 2000) return false;

      // Key Inclusions Filter
      if (selectedInclusions.includes('VITAMINS')) {
        const hasVit = pkg.tests.some(
          (t) =>
            t.name.toLowerCase().includes('vitamin') ||
            t.parameters.toLowerCase().includes('vitamin')
        );
        if (!hasVit) return false;
      }

      if (selectedInclusions.includes('ECG_IMAGING')) {
        const hasEcgorUsg = pkg.tests.some(
          (t) =>
            t.name.toLowerCase().includes('ecg') ||
            t.name.toLowerCase().includes('ultrasound')
        );
        if (!hasEcgorUsg) return false;
      }

      if (selectedInclusions.includes('ECHO')) {
        const hasEcho = pkg.tests.some((t) => t.name.toLowerCase().includes('echo'));
        if (!hasEcho) return false;
      }

      if (selectedInclusions.includes('IRON')) {
        const hasIron = pkg.tests.some(
          (t) =>
            t.name.toLowerCase().includes('iron') ||
            t.name.toLowerCase().includes('ferritin')
        );
        if (!hasIron) return false;
      }

      if (selectedInclusions.includes('HBA1C')) {
        const hasHba1c = pkg.tests.some((t) => t.name.toLowerCase().includes('hba1c'));
        if (!hasHba1c) return false;
      }

      // Search query across name, code, category, tests, parameters, notes
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesName = pkg.name.toLowerCase().includes(q);
        const matchesCode = pkg.code.toLowerCase().includes(q);
        const matchesCategory = pkg.category.toLowerCase().includes(q);
        const matchesTests = pkg.tests.some(
          (t) =>
            t.name.toLowerCase().includes(q) ||
            t.parameters.toLowerCase().includes(q) ||
            t.sample.toLowerCase().includes(q) ||
            t.preparation.toLowerCase().includes(q)
        );
        const matchesNote = pkg.clinicalNote?.toLowerCase().includes(q);
        if (!matchesName && !matchesCode && !matchesCategory && !matchesTests && !matchesNote) {
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
  }, [selectedCategory, selectedPriceFilter, selectedInclusions, selectedSort, searchQuery]);

  const totalPages = Math.ceil(filteredPackages.length / ITEMS_PER_PAGE) || 1;

  const paginatedPackages = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredPackages.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [filteredPackages, currentPage]);

  const popularTests = useMemo(() => {
    return LAB_TESTS_MASTER.filter((t) => t.popular).sort((a, b) => a.popularRank - b.popularRank);
  }, []);

  const startBooking = (item, preferredMethod = null) => {
    requireLogin(() => _doStartBooking(item, preferredMethod));
  };

  const _doStartBooking = (item, preferredMethod = null) => {

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
    setActiveBookingTest(bookingItem);
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
  };

  const handleSimulatePayment = () => {
    requireLogin(() => _doSimulatePayment());
  };

  const _doSimulatePayment = async () => {

    const isHome = collectionMethod === 'HOME';
    if (isHome && (!homeAddressName.trim() || !homeAddressPhone.trim() || !homeAddressFlat.trim() || !homeAddressCity.trim() || !homeAddressPincode.trim())) {
      return;
    }
    const testPrice = activeBookingTest.price;
    const collectionFee = isHome ? 100 : 0;
    const total = testPrice + collectionFee;
    const selectedCentre =
      availableCentres.find((c) => c.id === selectedCentreId) ||
      ALL_CITY_DIAGNOSTIC_CENTRES.find((c) => c.id === selectedCentreId) ||
      availableCentres[0];
    const selectedSlot = TIME_SLOTS.find((s) => s.id === selectedSlotId);

    // Real-Time Atomic Slot Validation (Rules 2, 3, 6)
    const slotValidation = await validateAndBookSlot({
      date: selectedDate,
      time: selectedSlot?.label || '8:30 AM – 9:30 AM',
      serviceType: 'lab',
      providerId: isHome ? 'home-collection' : selectedCentreId,
      slotId: selectedSlotId,
      patientName: homeAddressName.trim() || 'Patient',
    });

    if (!slotValidation.success) {
      showAlert('Slot Unavailable', 'This slot is no longer available. Please select another time.');
      return;
    }

    const manualAddr = isHome
      ? `${homeAddressFlat.trim()}, ${homeAddressCity.trim()} - ${homeAddressPincode.trim()}${homeAddressLandmark.trim() ? ` (${homeAddressLandmark.trim()})` : ''}`
      : null;

    const newBookingId = `LAB-2026-00${Math.floor(100 + Math.random() * 900)}`;

    const newBooking = {
      id: newBookingId,
      testId: activeBookingTest.id,
      testName: activeBookingTest.name,
      collectionMethod: collectionMethod,
      collectionAddress: manualAddr,
      collectionContactName: isHome ? homeAddressName.trim() : null,
      collectionContactPhone: isHome ? homeAddressPhone.trim() : null,
      diagnosticCentre: isHome ? null : { name: selectedCentre?.name, location: selectedCentre?.location },
      bookingDate: selectedDate,
      timeSlot: selectedSlot?.label || '8:30 AM – 9:30 AM',
      amountPaid: total,
      testPrice: testPrice,
      collectionFee: collectionFee,
      status: 'CONFIRMED',
      trackingStage: 1,
      patientName: homeAddressName.trim() || 'Patient',
      phlebotomistName: isHome ? 'Muralidhar Rao (Senior Phlebotomist)' : null,
      phlebotomistPhone: isHome ? '+91 98452 33110' : null,
      reportReady: false,
    };

    setConfirmedBookingData(newBooking);
    setBookingsList([newBooking, ...bookingsList]);
    setBookingFlowStep(5);

    try {
      // 1. Save to @labBookings and labBookings
      for (const k of ['@labBookings', 'labBookings']) {
        const existingRaw = await AsyncStorage.getItem(k);
        const existingList = existingRaw ? JSON.parse(existingRaw) : [];
        const nextList = [newBooking, ...(Array.isArray(existingList) ? existingList : [])];
        await AsyncStorage.setItem(k, JSON.stringify(nextList));
      }

      // 2. Format for @mediunify_patient_booked_tests (for MyTestsScreen)
      const dashboardBooking = {
        id: newBookingId,
        bookingRef: newBookingId,
        testName: newBooking.testName,
        modality: 'Pathology & Blood',
        modalityType: 'Blood Test',
        testCategory: 'Pathology & Blood',
        testType: isHome ? 'Home Sample Collection' : 'Centre Visit',
        centerName: newBooking.diagnosticCentre?.name || 'Unnathi Central Pathology & Diagnostic Center',
        department: 'Automated Clinical Pathology',
        location: isHome ? (manualAddr || 'Mysuru') : (newBooking.diagnosticCentre?.location || 'Kuvempunagar, Mysuru'),
        address: isHome ? (manualAddr || 'Mysuru') : (newBooking.diagnosticCentre?.location || 'Kuvempunagar, Mysuru'),
        appointmentDate: selectedDate,
        timeSlot: selectedSlot?.label || '08:30 AM – 09:30 AM',
        patientId: selectedPatientId || 'self',
        patientName: homeAddressName.trim() || 'Hemanth Gowda (Self)',
        age: 28,
        gender: 'Male',
        status: 'Slot Confirmed',
        badgeColor: '#00B894',
        price: total,
        paymentStatus: 'Paid Online via UPI',
        instructions: 'Fasting of 10-12 hours required prior to sample collection. Water is permitted.',
        doctorPrescription: 'Diagnostic Lab Screening Referral',
        contactPhone: '+91 821 245 9901',
        canReschedule: true,
        canCancel: true,
        phlebotomist: isHome ? {
          name: newBooking.phlebotomistName || 'Muralidhar Rao (Senior Phlebotomist)',
          phone: newBooking.phlebotomistPhone || '+91 98452 33110',
          vehicle: 'Two-Wheeler (KA-09-ER-5521)',
          eta: '15 mins',
        } : null,
      };

      const existingBookedTestsRaw = await AsyncStorage.getItem('@mediunify_patient_booked_tests');
      const existingBookedTests = existingBookedTestsRaw ? JSON.parse(existingBookedTestsRaw) : [];
      const updatedBookedTests = [dashboardBooking, ...(Array.isArray(existingBookedTests) ? existingBookedTests : [])];
      await AsyncStorage.setItem('@mediunify_patient_booked_tests', JSON.stringify(updatedBookedTests));

      // 3. Save to @unnathi_appointments
      const existingApptsRaw = await AsyncStorage.getItem('@unnathi_appointments');
      const existingAppts = existingApptsRaw ? JSON.parse(existingApptsRaw) : [];
      await AsyncStorage.setItem('@unnathi_appointments', JSON.stringify([dashboardBooking, ...(Array.isArray(existingAppts) ? existingAppts : [])]));
    } catch (saveErr) {
      console.warn('Error saving lab booking to AsyncStorage:', saveErr);
    }
  };

  // ===========================================================================
  // RENDER: DESKTOP CARD
  // ===========================================================================
  const renderDesktopCard = (test) => {
    return (
      <View key={test.id} style={styles.webTestCard}>
        <View style={styles.webCardBadgesRow}>
          {test.popular && (
            <View style={styles.webPopularBadge}>
              <Ionicons name="flame" size={11} color="#FFFFFF" />
              <Text style={styles.webPopularBadgeText}>Popular #{test.popularRank}</Text>
            </View>
          )}
          {test.recommended && (
            <View style={styles.webRecommendedBadge}>
              <Ionicons name="thumbs-up" size={11} color="#1E3A8A" />
              <Text style={styles.webRecommendedBadgeText}>Recommended</Text>
            </View>
          )}
          <View style={styles.webSampleBadge}>
            <Text style={styles.webSampleBadgeText}>{test.sampleType}</Text>
          </View>
        </View>

        <TouchableOpacity onPress={() => setSelectedTest(test)}>
          <Text style={styles.webCardTitle} numberOfLines={2}>{test.name}</Text>
        </TouchableOpacity>
        <Text style={styles.webCardDesc} numberOfLines={2}>{test.description}</Text>

        <View style={styles.webAvailBox}>
          <View style={styles.webAvailItem}>
            <Ionicons name={test.homeCollection ? 'checkmark-circle' : 'close-circle'} size={14} color={test.homeCollection ? '#00B894' : '#94A3B8'} />
            <Text style={[styles.webAvailText, !test.homeCollection && styles.webAvailTextDisabled]}>
              {test.homeCollection ? 'Home Collection' : 'No Home Collection'}
            </Text>
          </View>
          <View style={styles.webAvailItem}>
            <Ionicons name={test.centreCollection ? 'checkmark-circle' : 'close-circle'} size={14} color={test.centreCollection ? '#00B894' : '#94A3B8'} />
            <Text style={[styles.webAvailText, !test.centreCollection && styles.webAvailTextDisabled]}>
              {test.centreCollection ? 'Lab Visit' : 'No Lab Visit'}
            </Text>
          </View>
        </View>

        <View style={styles.webCardFooter}>
          <View>
            <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 6 }}>
              <Text style={styles.webPriceText}>₹{test.price}</Text>
              {test.mrp && <Text style={styles.webMrpText}>₹{test.mrp}</Text>}
            </View>
            <Text style={styles.webTatText}>TAT: {test.reportTAT}</Text>
          </View>

          <View style={{ flexDirection: 'row', gap: 6, alignItems: 'center' }}>
            <TouchableOpacity
              style={[styles.webAddToCartBtn, isTestInCart(test.id) && styles.webAddToCartBtnActive]}
              onPress={() => handleToggleCartTest(test)}
              activeOpacity={0.8}
            >
              <Ionicons
                name={isTestInCart(test.id) ? 'checkmark-circle' : 'cart-outline'}
                size={13}
                color={isTestInCart(test.id) ? '#FFFFFF' : '#00B894'}
              />
              <Text
                style={[
                  styles.webAddToCartBtnText,
                  isTestInCart(test.id) && styles.webAddToCartBtnTextActive,
                ]}
              >
                {isTestInCart(test.id) ? 'In Cart' : 'Add'}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.webDetailsBtn} onPress={() => setSelectedTest(test)}>
              <Text style={styles.webDetailsBtnText}>Details</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.webBookBtn} onPress={() => startBooking(test)}>
              <Text style={styles.webBookBtnText}>Book</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  };

  // ===========================================================================
  // RENDER: BROWSE VIEW (WEB)
  // ===========================================================================
  const renderWebBrowse = () => {
    return (
      <View style={styles.webMainContentWrapper}>
        {/* Top Hero Banner */}
        <View
          style={[
            styles.webHeroBanner,
            {
              paddingVertical: 34,
              paddingHorizontal: 32,
              borderRadius: 24,
              marginBottom: 24,
              backgroundColor: '#E6FBF2',
              ...(Platform.OS === 'web'
                ? {
                    backgroundImage: 'linear-gradient(135deg, #E6FBF2 0%, #D4F7EC 50%, #E2F9F0 100%)',
                  }
                : {}),
              borderWidth: 1.5,
              borderColor: '#A7F3D0',
              boxShadow: '0 12px 32px -8px rgba(0, 184, 148, 0.12), 0 4px 12px -2px rgba(0, 0, 0, 0.03)',
            },
          ]}
        >
          <View style={styles.webHeroTextCol}>
            <View style={[styles.webHeroBadge, { backgroundColor: '#FFFFFF', borderColor: '#A7F3D0', borderWidth: 1, boxShadow: '0 2px 6px rgba(0, 184, 148, 0.08)' }]}>
              <Ionicons name="shield-checkmark" size={15} color="#059669" />
              <Text style={[styles.webHeroBadgeText, { color: '#059669', fontWeight: '800' }]}>
                NABL & ICMR Certified Clinical Partner Labs • Doorstep Collection
              </Text>
            </View>
            <Text style={[styles.webHeroTitle, { fontSize: 32, fontWeight: '900', color: '#0C3B6B', marginTop: 10, marginBottom: 6, letterSpacing: -0.6 }]}>
              Lab Tests & Health Checkup Packages
            </Text>
            <Text style={[styles.webHeroSubtitle, { fontSize: 14.5, color: '#334155', maxWidth: 680, lineHeight: 22 }]}>
              Choose from 13 doctor-verified health checkups with free doorstep sample collection, automated lab testing, and digital reports delivered in 6–8 hours.
            </Text>
          </View>

          {/* Search Box on Hero */}
          <View
            style={[
              styles.webSearchWrap,
              {
                maxWidth: 640,
                marginTop: 18,
                backgroundColor: '#FFFFFF',
                borderWidth: 1.5,
                borderColor: '#A7F3D0',
                borderRadius: 14,
                boxShadow: '0 6px 20px -4px rgba(0, 184, 148, 0.14)',
              },
            ]}
          >
            <Ionicons name="search" size={21} color="#00B894" />
            <TextInput
              style={[styles.webSearchInput, { fontSize: 14 }]}
              placeholder="Search checkup (e.g. Executive, Full Body, Diabetes, Vitamin D, POP-EXE-01)..."
              placeholderTextColor="#94A3B8"
              value={searchQuery}
              onChangeText={(text) => { setSearchQuery(text); setCurrentPage(1); }}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => { setSearchQuery(''); setCurrentPage(1); }}>
                <Ionicons name="close-circle" size={19} color="#94A3B8" />
              </TouchableOpacity>
            )}
          </View>

          {/* Quick Search Tag Suggestions */}
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 16, flexWrap: 'wrap' }}>
            <Text style={{ fontSize: 12, fontWeight: '700', color: '#475569' }}>Popular searches:</Text>
            {[
              'Full Body Checkup',
              'Executive Health',
              'Diabetes Basic',
              'Heart Risk',
              'Vitamin D',
            ].map((tag) => (
              <TouchableOpacity
                key={tag}
                style={{
                  paddingVertical: 5,
                  paddingHorizontal: 12,
                  borderRadius: 16,
                  backgroundColor: '#FFFFFF',
                  borderWidth: 1,
                  borderColor: '#A7F3D0',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
                }}
                onPress={() => {
                  setSearchQuery(tag === 'Full Body Checkup' ? 'Full Body' : tag);
                  setCurrentPage(1);
                }}
              >
                <Text style={{ fontSize: 12, fontWeight: '700', color: '#059669' }}>{tag}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Trust Value Badges Strip */}
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginTop: 22, paddingTop: 18, borderTopWidth: 1, borderTopColor: 'rgba(0, 184, 148, 0.18)' }}>
            {[
              { icon: 'home-outline', title: 'Free Home Collection', desc: 'Doorstep phlebotomy' },
              { icon: 'time-outline', title: '6–8 Hours TAT', desc: 'Fast digital reports' },
              { icon: 'ribbon-outline', title: '100% NABL Accredited', desc: 'Quality assured' },
              { icon: 'chatbubbles-outline', title: 'Doctor Consultation', desc: 'Free report review' },
            ].map((feature, i) => (
              <View
                key={i}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 10,
                  flex: 1,
                  minWidth: 160,
                  backgroundColor: '#FFFFFF',
                  paddingVertical: 10,
                  paddingHorizontal: 12,
                  borderRadius: 12,
                  borderWidth: 1,
                  borderColor: '#A7F3D0',
                  boxShadow: '0 2px 6px rgba(0,0,0,0.03)',
                }}
              >
                <View style={{ width: 34, height: 34, borderRadius: 17, backgroundColor: '#ECFDF5', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#A7F3D0' }}>
                  <Ionicons name={feature.icon} size={17} color="#059669" />
                </View>
                <View>
                  <Text style={{ fontSize: 12.5, fontWeight: '800', color: '#0F172A' }}>{feature.title}</Text>
                  <Text style={{ fontSize: 11, color: '#64748B', fontWeight: '500' }}>{feature.desc}</Text>
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* Categories Bar - Novus Checkup Categories */}
        <View style={styles.webCategoriesRow}>
          {NOVUS_PACKAGE_CATEGORIES.map((cat) => {
            const isSel = selectedCategory === cat.id;
            return (
              <TouchableOpacity
                key={cat.id}
                style={[styles.webCategoryPill, isSel && styles.webCategoryPillActive]}
                onPress={() => {
                  setSelectedCategory(cat.id);
                  setCurrentPage(1);
                }}
              >
                <Ionicons name={cat.icon} size={16} color={isSel ? '#FFFFFF' : '#00B894'} />
                <Text style={[styles.webCategoryPillText, isSel && styles.webCategoryPillTextActive]}>
                  {cat.name}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Quick-Tap Filter Chips */}
        <View style={{ paddingHorizontal: 20, paddingBottom: 14 }}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ gap: 8, flexDirection: 'row', alignItems: 'center' }}
          >
            <Text style={{ fontSize: 12, fontWeight: '700', color: '#64748B', marginRight: 4 }}>Quick Filters:</Text>
            {[
              {
                id: 'CHIP_UNDER_1000',
                icon: 'flash-outline',
                label: 'Under ₹1,000',
                active: selectedPriceFilter === 'UNDER_1000',
                onToggle: () => {
                  setSelectedPriceFilter(selectedPriceFilter === 'UNDER_1000' ? 'ALL' : 'UNDER_1000');
                  setCurrentPage(1);
                },
              },
              {
                id: 'CHIP_VITAMINS',
                icon: 'medkit-outline',
                label: 'Includes Vitamins D & B12',
                active: selectedInclusions.includes('VITAMINS'),
                onToggle: () => toggleInclusion('VITAMINS'),
              },
              {
                id: 'CHIP_ECG',
                icon: 'heart-outline',
                label: 'Includes ECG / Imaging',
                active: selectedInclusions.includes('ECG_IMAGING'),
                onToggle: () => toggleInclusion('ECG_IMAGING'),
              },
              {
                id: 'CHIP_ECHO',
                icon: 'pulse-outline',
                label: '2D Echo Included',
                active: selectedInclusions.includes('ECHO'),
                onToggle: () => toggleInclusion('ECHO'),
              },
              {
                id: 'CHIP_IRON',
                icon: 'water-outline',
                label: 'Iron Profile',
                active: selectedInclusions.includes('IRON'),
                onToggle: () => toggleInclusion('IRON'),
              },
              {
                id: 'CHIP_HBA1C',
                icon: 'analytics-outline',
                label: 'Sugar & HbA1c',
                active: selectedInclusions.includes('HBA1C'),
                onToggle: () => toggleInclusion('HBA1C'),
              },
            ].map((chip) => (
              <TouchableOpacity
                key={chip.id}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 6,
                  paddingVertical: 6,
                  paddingHorizontal: 12,
                  borderRadius: 20,
                  backgroundColor: chip.active ? '#00B894' : '#FFFFFF',
                  borderWidth: 1,
                  borderColor: chip.active ? '#00B894' : '#CBD5E1',
                }}
                onPress={chip.onToggle}
              >
                <Ionicons name={chip.icon} size={13} color={chip.active ? '#FFFFFF' : '#64748B'} />
                <Text
                  style={{
                    fontSize: 12,
                    fontWeight: chip.active ? '700' : '600',
                    color: chip.active ? '#FFFFFF' : '#334155',
                  }}
                >
                  {chip.label}
                </Text>
                {chip.active && (
                  <Ionicons name="close-circle" size={14} color="#FFFFFF" style={{ marginLeft: 5 }} />
                )}
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Main Two-Column Layout: Sidebar Filters + Test Grid */}
        <View style={styles.webTwoColumnLayout}>
          {/* Sidebar Filters */}
          <View style={styles.webSidebar}>
            <Text style={styles.sidebarHeading}>Filter Packages</Text>

            {/* Category Filter */}
            <View style={styles.filterGroup}>
              <Text style={styles.filterGroupTitle}>Checkup Category</Text>
              {NOVUS_PACKAGE_CATEGORIES.map((cat) => (
                <TouchableOpacity
                  key={cat.id}
                  style={styles.radioRow}
                  onPress={() => {
                    setSelectedCategory(cat.id);
                    setCurrentPage(1);
                  }}
                >
                  <Ionicons
                    name={selectedCategory === cat.id ? 'radio-button-on' : 'radio-button-off'}
                    size={16}
                    color="#00B894"
                  />
                  <Text style={styles.radioRowLabel}>{cat.name}</Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Price Range Filter */}
            <View style={styles.filterGroup}>
              <Text style={styles.filterGroupTitle}>Package Price Range</Text>
              {[
                { id: 'ALL', label: 'All Price Ranges' },
                { id: 'UNDER_1000', label: 'Under ₹1,000 (2 packages)' },
                { id: '1000_2000', label: '₹1,000 – ₹2,000 (8 packages)' },
                { id: 'ABOVE_2000', label: 'Above ₹2,000 (3 packages)' },
              ].map((p) => (
                <TouchableOpacity
                  key={p.id}
                  style={styles.radioRow}
                  onPress={() => {
                    setSelectedPriceFilter(p.id);
                    setCurrentPage(1);
                  }}
                >
                  <Ionicons
                    name={selectedPriceFilter === p.id ? 'radio-button-on' : 'radio-button-off'}
                    size={16}
                    color="#00B894"
                  />
                  <Text style={styles.radioRowLabel}>{p.label}</Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Key Inclusions Filter */}
            <View style={styles.filterGroup}>
              <Text style={styles.filterGroupTitle}>Key Test Inclusions</Text>
              {[
                { id: 'VITAMINS', label: 'Vitamins D & B12' },
                { id: 'ECG_IMAGING', label: '12-Lead ECG / USG' },
                { id: 'ECHO', label: '2D Echocardiography' },
                { id: 'IRON', label: 'Iron & Ferritin' },
                { id: 'HBA1C', label: 'HbA1c Sugar Control' },
              ].map((inc) => {
                const isChecked = selectedInclusions.includes(inc.id);
                return (
                  <TouchableOpacity
                    key={inc.id}
                    style={styles.radioRow}
                    onPress={() => toggleInclusion(inc.id)}
                  >
                    <Ionicons
                      name={isChecked ? 'checkbox' : 'square-outline'}
                      size={18}
                      color={isChecked ? '#00B894' : '#94A3B8'}
                    />
                    <Text style={[styles.radioRowLabel, isChecked && { fontWeight: '700', color: '#0F172A' }]}>
                      {inc.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Collection Filter */}
            <View style={styles.filterGroup}>
              <Text style={styles.filterGroupTitle}>Collection Method</Text>
              {[
                { id: 'ALL', label: 'All Methods' },
                { id: 'HOME', label: 'Home Collection', icon: 'home-outline' },
                { id: 'CENTRE', label: 'Diagnostic Centre', icon: 'business-outline' },
              ].map((m) => (
                <TouchableOpacity
                  key={m.id}
                  style={styles.radioRow}
                  onPress={() => setSelectedCollectionFilter(m.id)}
                >
                  <Ionicons
                    name={selectedCollectionFilter === m.id ? 'radio-button-on' : 'radio-button-off'}
                    size={16}
                    color="#00B894"
                  />
                  {m.icon ? <Ionicons name={m.icon} size={14} color="#64748B" style={{ marginLeft: 6, marginRight: 2 }} /> : null}
                  <Text style={styles.radioRowLabel}>{m.label}</Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Reset */}
            <TouchableOpacity
              style={styles.resetFiltersBtn}
              onPress={() => {
                setSelectedCategory('all');
                setSelectedSubCategory('all');
                setSelectedPriceFilter('ALL');
                setSelectedInclusions([]);
                setSelectedSort('RECOMMENDED');
                setSelectedCollectionFilter('ALL');
                setSearchQuery('');
                setCurrentPage(1);
              }}
            >
              <Text style={styles.resetFiltersBtnText}>Reset All Filters</Text>
            </TouchableOpacity>
          </View>

          {/* Test Cards Grid - Dedicated Packages Only */}
          <View style={styles.webContentCol}>
            <View style={styles.webSectionBlock}>
              <View style={[styles.webSectionHeader, { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }]}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <Ionicons name="shield-checkmark" size={24} color="#00B894" />
                  <View>
                    <Text style={styles.webSectionTitle}>Novus Health Checkup Packages</Text>
                    <Text style={styles.webSectionSub}>
                      {filteredPackages.length === 0
                        ? '0 packages found'
                        : `Showing ${(currentPage - 1) * ITEMS_PER_PAGE + 1}–${Math.min(currentPage * ITEMS_PER_PAGE, filteredPackages.length)} of ${filteredPackages.length} packages (Page ${currentPage} of ${totalPages})`}
                    </Text>
                  </View>
                </View>

                {/* Sort Bar */}
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                  <Text style={{ fontSize: 12, fontWeight: '700', color: '#64748B' }}>Sort:</Text>
                  {[
                    { id: 'RECOMMENDED', label: 'Featured' },
                    { id: 'PRICE_LOW_HIGH', label: 'Price: Low to High' },
                    { id: 'PRICE_HIGH_LOW', label: 'Price: High to Low' },
                    { id: 'MOST_TESTS', label: 'Most Tests' },
                  ].map((s) => {
                    const isS = selectedSort === s.id;
                    return (
                      <TouchableOpacity
                        key={s.id}
                        style={{
                          paddingVertical: 5,
                          paddingHorizontal: 9,
                          borderRadius: 6,
                          backgroundColor: isS ? '#0F172A' : '#F1F5F9',
                          borderWidth: 1,
                          borderColor: isS ? '#0F172A' : '#E2E8F0',
                        }}
                        onPress={() => {
                          setSelectedSort(s.id);
                          setCurrentPage(1);
                        }}
                      >
                        <Text
                          style={{
                            fontSize: 11.5,
                            fontWeight: isS ? '700' : '600',
                            color: isS ? '#FFFFFF' : '#475569',
                          }}
                        >
                          {s.label}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>

              {filteredPackages.length === 0 ? (
                <View style={styles.webEmptyState}>
                  <Ionicons name="search-outline" size={54} color="#94A3B8" />
                  <Text style={styles.webEmptyTitle}>No matching packages found</Text>
                  <Text style={styles.webEmptyDesc}>Try clearing your search query or price filter to view all 13 verified packages.</Text>
                  <TouchableOpacity
                    style={[styles.modalPrimaryBtn, { marginTop: 14 }]}
                    onPress={() => {
                      setSelectedCategory('all');
                      setSelectedPriceFilter('ALL');
                      setSearchQuery('');
                      setCurrentPage(1);
                    }}
                  >
                    <Text style={styles.modalPrimaryBtnText}>Show All 13 Packages</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <>
                  <View style={styles.webPackagesGrid}>
                    {paginatedPackages.map((pkg) => (
                      <View
                        key={pkg.id}
                        // @ts-ignore
                        className="novus-card"
                        style={[
                          styles.webPackageCard,
                          {
                            borderRadius: 18,
                            borderWidth: 1.5,
                            borderColor: '#E2E8F0',
                            backgroundColor: '#FFFFFF',
                            padding: 22,
                            position: 'relative',
                            shadowColor: '#0F172A',
                            shadowOffset: { width: 0, height: 4 },
                            shadowOpacity: 0.05,
                            shadowRadius: 12,
                          },
                        ]}
                      >
                        {/* Top Code & Category Badges */}
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                          <View style={{ backgroundColor: '#00B894', paddingHorizontal: 9, paddingVertical: 3.5, borderRadius: 6 }}>
                            <Text style={{ fontSize: 11, fontWeight: '800', color: '#FFFFFF', letterSpacing: 0.3 }}>
                              {pkg.code}
                            </Text>
                          </View>
                          <View style={{ flexDirection: 'row', gap: 6, alignItems: 'center', flexWrap: 'wrap' }}>
                            {(['POP-FB-01', 'POP-EXE-01', 'POP-DIA-01', 'POP-HRT-01'].includes(pkg.id) || pkg.isMostPopularBooked) && (
                              <View style={{ backgroundColor: '#FFF2ED', borderWidth: 1, borderColor: '#FFD7C7', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 12, flexDirection: 'row', alignItems: 'center' }}>
                                <Ionicons name="flame" size={11} color="#FF7F50" style={{ marginRight: 3 }} />
                                <Text style={{ fontSize: 10.5, fontWeight: '800', color: '#FF7F50' }}>Most Popular</Text>
                              </View>
                            )}
                            <View style={{ backgroundColor: '#F2FAF0', borderWidth: 1, borderColor: '#C6F6D5', paddingHorizontal: 9, paddingVertical: 3, borderRadius: 12 }}>
                              <Text style={{ fontSize: 11, fontWeight: '700', color: '#7BC96F' }}>{pkg.category}</Text>
                            </View>
                            <View style={{ backgroundColor: '#F2FAF0', paddingHorizontal: 7, paddingVertical: 3, borderRadius: 12 }}>
                              <Text style={{ fontSize: 10.5, fontWeight: '800', color: '#7BC96F' }}>{pkg.discount}</Text>
                            </View>
                          </View>
                        </View>

                        {/* Title */}
                        <Text style={{ fontSize: 18, fontWeight: '800', color: '#0F172A', marginBottom: 8, lineHeight: 24 }}>
                          {pkg.name}
                        </Text>

                        {/* Key Specs Pills */}
                        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 12 }}>
                          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#EEF2FF', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 }}>
                            <Ionicons name="flask-outline" size={13} color="#4338CA" />
                            <Text style={{ fontSize: 11.5, color: '#4338CA', fontWeight: '700' }}>{pkg.testsCount} Tests Included</Text>
                          </View>
                          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#ECFDF5', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 }}>
                            <Ionicons name="time-outline" size={13} color="#047857" />
                            <Text style={{ fontSize: 11.5, color: '#047857', fontWeight: '700' }}>{pkg.tatSummary}</Text>
                          </View>
                          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#FFFBEB', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 }}>
                            <Ionicons name="restaurant-outline" size={13} color="#B45309" />
                            <Text style={{ fontSize: 11.5, color: '#B45309', fontWeight: '700' }}>{pkg.preparationSummary}</Text>
                          </View>
                        </View>

                        {/* Clinical Note Excerpt */}
                        {Boolean(pkg.clinicalNote) && (
                          <View style={{ backgroundColor: '#F8FAFC', borderRadius: 8, padding: 9, marginBottom: 12, borderWidth: 1, borderColor: '#E2E8F0', flexDirection: 'row', gap: 6 }}>
                            <Ionicons name="information-circle-outline" size={15} color="#0284C7" style={{ marginTop: 1 }} />
                            <Text style={{ fontSize: 11.5, color: '#475569', lineHeight: 16, flex: 1 }} numberOfLines={2}>
                              {pkg.clinicalNote}
                            </Text>
                          </View>
                        )}

                        {/* Tests preview chips */}
                        <View style={{ marginBottom: 16 }}>
                          <Text style={{ fontSize: 11, fontWeight: '700', color: '#64748B', marginBottom: 5 }}>INCLUDED TESTS PREVIEW:</Text>
                          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 5 }}>
                            {pkg.tests.slice(0, 4).map((t, ti) => (
                              <View key={ti} style={{ backgroundColor: '#F1F5F9', paddingHorizontal: 7, paddingVertical: 3, borderRadius: 5 }}>
                                <Text style={{ fontSize: 11, color: '#334155' }}>{t.name.split('(')[0].trim()}</Text>
                              </View>
                            ))}
                            {pkg.tests.length > 4 && (
                              <TouchableOpacity
                                onPress={() => setSelectedPackage(pkg)}
                                style={{ flexDirection: 'row', alignItems: 'center', gap: 3, backgroundColor: '#E2E8F0', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 5 }}
                              >
                                <Text style={{ fontSize: 11, color: '#0F172A', fontWeight: '700' }}>
                                  +{pkg.tests.length - 4} more tests
                                </Text>
                                <Ionicons name="arrow-forward" size={11} color="#0F172A" />
                              </TouchableOpacity>
                            )}
                          </View>
                        </View>

                        {/* Price & Action Row */}
                        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: 14, borderTopWidth: 1, borderTopColor: '#F1F5F9', marginTop: 'auto' }}>
                          <View>
                            <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 6 }}>
                              <Text style={{ fontSize: 22, fontWeight: '800', color: '#0F172A' }}>₹{pkg.price}</Text>
                              <Text style={{ fontSize: 13, textDecorationLine: 'line-through', color: '#94A3B8' }}>₹{pkg.mrp}</Text>
                            </View>
                            <Text style={{ fontSize: 11, fontWeight: '700', color: '#00B894' }}>
                              Save ₹{pkg.mrp - pkg.price} ({pkg.discount})
                            </Text>
                          </View>

                          <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
                            <TouchableOpacity
                              // @ts-ignore
                              className="novus-pill-btn"
                              style={{
                                paddingVertical: 8,
                                paddingHorizontal: 12,
                                borderRadius: 8,
                                borderWidth: 1,
                                borderColor: '#CBD5E1',
                                backgroundColor: '#FFFFFF',
                              }}
                              onPress={() => setSelectedPackage(pkg)}
                            >
                              <Text style={{ fontSize: 12, fontWeight: '700', color: '#334155' }}>View Tests</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                              // @ts-ignore
                              className="novus-btn-cta"
                              style={{
                                flexDirection: 'row',
                                alignItems: 'center',
                                gap: 4,
                                paddingVertical: 8,
                                paddingHorizontal: 16,
                                borderRadius: 8,
                                backgroundColor: '#00B894',
                              }}
                              onPress={() => startBooking(pkg)}
                            >
                              <Text style={{ fontSize: 13, fontWeight: '700', color: '#FFFFFF' }}>Book Now</Text>
                              <Ionicons name="arrow-forward" size={13} color="#FFFFFF" />
                            </TouchableOpacity>
                          </View>
                        </View>
                      </View>
                    ))}
                  </View>

                  {/* Pagination Controls */}
                  {totalPages > 1 && (
                    <Pagination
                      currentPage={currentPage}
                      totalPages={totalPages}
                      onPageChange={(pageNum) => {
                        setCurrentPage(pageNum);
                        mainScrollRef.current?.scrollTo({ y: 0, animated: true });
                      }}
                    />
                  )}
                </>
              )}
            </View>
          </View>
        </View>

        {/* ─── PARTNER CLINICAL LABS & DIAGNOSTIC CENTRES SECTION ─── */}
        <View style={styles.webCentresSectionWrap}>
          <View style={styles.webSectionHeaderRow}>
            <View style={{ flex: 1 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Ionicons name="business" size={22} color="#00B894" />
                <Text style={styles.webSectionTitle}>Partner Clinical Labs & Diagnostic Centres</Text>
              </View>
              <Text style={styles.webSectionSubtitle}>
                Visit our certified partner diagnostic centres in {currentCity} for in-person tests, high-precision scans, and direct sample collection.
              </Text>
            </View>
            <View style={styles.webLocationBadge}>
              <Ionicons name="location-outline" size={14} color="#059669" />
              <Text style={styles.webLocationBadgeText}>{currentCity}, Karnataka</Text>
            </View>
          </View>

          <View style={styles.webCentresGrid}>
            {availableCentres.map((centre) => (
              <View key={centre.id} style={styles.webCentreCard}>
                <View style={styles.webCentreCardHeader}>
                  <View style={styles.webCentreIconBox}>
                    <Ionicons name="business-outline" size={20} color="#00B894" />
                  </View>
                  <View style={{ flex: 1, marginLeft: 12 }}>
                    <Text style={styles.webCentreName}>{centre.name}</Text>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 3 }}>
                      <Ionicons name="location-sharp" size={13} color="#00B894" />
                      <Text style={styles.webCentreLocation}>{centre.location}, Karnataka</Text>
                    </View>
                  </View>
                </View>

                <View style={styles.webCentreAddressBox}>
                  <Text style={styles.webCentreAddressLabel}>Address:</Text>
                  <Text style={styles.webCentreAddressText}>{centre.address}</Text>
                </View>

                <View style={styles.webCentreMetaRow}>
                  <View style={styles.webCentreMetaPill}>
                    <Ionicons name="star" size={12} color="#FF7F50" />
                    <Text style={styles.webCentreMetaPillText}>{centre.rating} ({centre.reviewsCount}+ reviews)</Text>
                  </View>
                  <View style={styles.webCentreMetaPill}>
                    <Ionicons name="navigate-outline" size={12} color="#0284C7" />
                    <Text style={styles.webCentreMetaPillText}>{centre.distanceKm} km away</Text>
                  </View>
                  <View style={styles.webCentreMetaPill}>
                    <Ionicons name="time-outline" size={12} color="#059669" />
                    <Text style={styles.webCentreMetaPillText}>{centre.timings}</Text>
                  </View>
                </View>

                <View style={styles.webCentreServicesRow}>
                  {centre.services.map((svc, si) => (
                    <View key={si} style={styles.webCentreServiceTag}>
                      <Text style={styles.webCentreServiceTagText}>✓ {svc}</Text>
                    </View>
                  ))}
                </View>

                <View style={styles.webCentreActionRow}>
                  <TouchableOpacity
                    style={styles.webCentreDirectionsBtn}
                    onPress={(e) => handleOpenDirections(centre, e)}
                    activeOpacity={0.85}
                  >
                    <Ionicons name="navigate" size={14} color="#FFFFFF" style={{ marginRight: 6 }} />
                    <Text style={styles.webCentreDirectionsBtnText}>Get Directions</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.webCentreBookBtn}
                    onPress={() => {
                      setSelectedCentreId(centre.id);
                      setCollectionMethod('CENTRE');
                      startBooking(NOVUS_POPULAR_PACKAGES[0]);
                    }}
                    activeOpacity={0.85}
                  >
                    <Text style={styles.webCentreBookBtnText}>Book at this Centre</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </View>
        </View>
      </View>
    );
  };

  // ===========================================================================
  // RENDER: BOOKINGS & REPORTS VIEW (WEB)
  // ===========================================================================
  const renderWebBookings = () => {
    return (
      <View style={styles.webTabContentBox}>
        <View style={styles.webTabHeader}>
          <Text style={styles.webTabHeaderTitle}>My Lab Test Bookings</Text>
          <View style={styles.tabFiltersRow}>
            {['ALL', 'UPCOMING', 'COMPLETED', 'CANCELLED'].map((tab) => (
              <TouchableOpacity
                key={tab}
                style={[styles.tabFilterBtn, bookingsFilter === tab && styles.tabFilterBtnActive]}
                onPress={() => setBookingsFilter(tab)}
              >
                <Text style={[styles.tabFilterText, bookingsFilter === tab && styles.tabFilterTextActive]}>
                  {tab === 'ALL' ? 'All' : tab.charAt(0) + tab.slice(1).toLowerCase()}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.webBookingsGrid}>
          {bookingsList.map((b) => (
            <View key={b.id} style={styles.webBookingCard}>
              <View style={styles.bookingCardHeader}>
                <Text style={styles.bookingIdText}>{b.id}</Text>
                <Text style={styles.statusBadgeText}>{b.status}</Text>
              </View>
              <Text style={styles.bookingTestName}>{b.testName}</Text>
              <Text style={styles.bookingDetailLabel}>Date & Time: {b.bookingDate} ({b.timeSlot})</Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginVertical: 3 }}>
                <Ionicons
                  name={b.collectionMethod === 'HOME' ? 'home-outline' : 'business-outline'}
                  size={14}
                  color="#64748B"
                />
                <Text style={styles.bookingDetailLabel}>
                  Method: {b.collectionMethod === 'HOME' ? `Home Collection (${b.collectionAddress})` : `Diagnostic Centre (${b.diagnosticCentre?.name})`}
                </Text>
              </View>
              {b.collectionMethod === 'CENTRE' && (() => {
                const c = DIAGNOSTIC_CENTRES.find(dc => dc.name === b.diagnosticCentre?.name) || b.diagnosticCentre;
                return (
                  <View style={{ backgroundColor: '#F0FDFA', borderWidth: 1, borderColor: '#CCFBF1', borderRadius: 8, padding: 10, marginTop: 8, marginBottom: 8 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                      <Text style={{ fontSize: 12.5, fontWeight: '700', color: '#0F172A' }}>
                        🏥 {c?.name || 'Diagnostic Centre'}
                      </Text>
                      <TouchableOpacity
                        style={{ flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: '#0D9488', paddingVertical: 5, paddingHorizontal: 10, borderRadius: 6 }}
                        onPress={() => handleOpenDirections(c)}
                        accessibilityRole="link"
                        accessibilityLabel="Get Directions to Centre"
                      >
                        <Ionicons name="navigate" size={13} color="#FFFFFF" />
                        <Text style={{ fontSize: 12, fontWeight: '700', color: '#FFFFFF' }}>Get Directions</Text>
                      </TouchableOpacity>
                    </View>
                    <Text style={{ fontSize: 11.5, color: '#475569', lineHeight: 16 }}>
                      📍 {c?.address || b.diagnosticCentre?.location || 'Mysuru Centre'}
                    </Text>
                  </View>
                );
              })()}
              <Text style={styles.bookingPriceVal}>Paid: ₹{b.amountPaid}</Text>
              <View style={{ flexDirection: 'row', gap: 10, marginTop: 10 }}>
                {b.collectionMethod === 'CENTRE' && (() => {
                  const c = DIAGNOSTIC_CENTRES.find(dc => dc.name === b.diagnosticCentre?.name) || b.diagnosticCentre;
                  return (
                    <TouchableOpacity
                      style={[styles.modalSecondaryBtn, { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, borderColor: '#0D9488' }]}
                      onPress={() => handleOpenDirections(c)}
                    >
                      <Ionicons name="navigate-outline" size={14} color="#0D9488" />
                      <Text style={[styles.modalSecondaryBtnText, { color: '#0D9488' }]}>Directions</Text>
                    </TouchableOpacity>
                  );
                })()}
                <TouchableOpacity
                  style={[styles.modalPrimaryBtn, { flex: 1, marginTop: 0 }]}
                  onPress={() => setSelectedTrackingBooking(b)}
                >
                  <Text style={styles.modalPrimaryBtnText}>Track Sample Status</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </View>
      </View>
    );
  };

  const renderWebReports = () => {
    return (
      <View style={styles.webTabContentBox}>
        <View style={styles.webTabHeader}>
          <Text style={styles.webTabHeaderTitle}>My Lab Test Reports</Text>
          <Text style={styles.webSectionSub}>Download digitally signed clinical test reports</Text>
        </View>

        <View style={styles.webBookingsGrid}>
          {reportsList.map((rep) => (
            <View key={rep.id} style={styles.webReportCard}>
              <View style={styles.reportCardTop}>
                <Text style={styles.reportCardId}>{rep.id}</Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                  <Ionicons name="checkmark-circle" size={13} color="#00B894" />
                  <Text style={styles.reportReadyPillText}>Verified & Released</Text>
                </View>
              </View>
              <Text style={styles.reportTestName}>{rep.testName}</Text>
              <Text style={styles.reportMetaLabel}>Lab: {rep.labName}</Text>
              <Text style={styles.reportMetaLabel}>Collected: {rep.sampleCollectionDate}</Text>
              <Text style={styles.reportMetaLabel}>Reported: {rep.reportDate}</Text>
              <View style={{ flexDirection: 'row', gap: 10, marginTop: 12 }}>
                <TouchableOpacity style={styles.reportDownloadBtn} onPress={() => setShowDownloadToast(true)}>
                  <Ionicons name="download" size={14} color="#00B894" />
                  <Text style={styles.reportDownloadBtnText}>Download</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.reportViewFullBtn} onPress={() => setSelectedReport(rep)}>
                  <Text style={styles.reportViewFullBtnText}>View Full Report</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safeContainer}>
      <ScrollView ref={mainScrollRef} style={styles.scrollContainer} contentContainerStyle={{ paddingBottom: 60 }}>
        {renderWebBrowse()}
        {activeTab === 'BOOKINGS' && renderWebBookings()}
        {activeTab === 'REPORTS' && renderWebReports()}

        {/* Integrated MediUnify Web Footer */}
        <WebFooter navigation={navigation} />
      </ScrollView>

      {/* ─── MODAL 1: TEST DETAILS ─── */}
      {selectedTest && (
        <Modal visible={!!selectedTest} animationType="fade" transparent onRequestClose={() => setSelectedTest(null)}>
          <View style={styles.modalOverlay}>
            <View style={styles.detailsModalContent}>
              <View style={styles.modalHeaderRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.modalHeaderTitle} numberOfLines={2}>{selectedTest.name}</Text>
                  <Text style={styles.modalHeaderSubtitle}>Clinical Laboratory Assay</Text>
                </View>
                <TouchableOpacity onPress={() => setSelectedTest(null)}>
                  <Ionicons name="close" size={24} color="#0F172A" />
                </TouchableOpacity>
              </View>
              <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 420 }}>
                <View style={styles.detailsSectionBlock}>
                  <Text style={styles.detailsBlockTitle}>Clinical Overview</Text>
                  <Text style={styles.detailsBlockDesc}>{selectedTest.description}</Text>
                </View>
                <View style={styles.applicabilityRow}>
                  <View style={styles.appliBadge}><Text style={styles.appliBadgeText}>Gender: {selectedTest.genderApplicability}</Text></View>
                  <View style={styles.appliBadge}><Text style={styles.appliBadgeText}>Sample: {selectedTest.sampleType}</Text></View>
                </View>
                <View style={styles.instructionCard}>
                  <Text style={styles.instructionTitle}>Fasting Requirement</Text>
                  <Text style={styles.instructionBody}>{selectedTest.fastingRequirement}</Text>
                </View>
                <View style={styles.instructionCard}>
                  <Text style={styles.instructionTitle}>Preparation Instructions</Text>
                  <Text style={styles.instructionBody}>{selectedTest.preparation}</Text>
                </View>
                <View style={styles.detailsTwoColGrid}>
                  <View style={styles.detailsColBox}>
                    <Text style={styles.colBoxTitle}>Timing</Text>
                    <Text style={styles.colBoxVal}>{selectedTest.timingInstructions}</Text>
                  </View>
                  <View style={styles.detailsColBox}>
                    <Text style={styles.colBoxTitle}>Expected Report TAT</Text>
                    <Text style={styles.colBoxVal}>{selectedTest.reportTAT}</Text>
                  </View>
                </View>
              </ScrollView>
              <View style={styles.modalFooterRow}>
                <View>
                  <Text style={styles.modalPriceText}>₹{selectedTest.price}</Text>
                  {selectedTest.mrp && <Text style={styles.modalMrpText}>₹{selectedTest.mrp}</Text>}
                </View>
                <View style={{ flexDirection: 'row', gap: 10, alignItems: 'center' }}>
                  <TouchableOpacity
                    style={[
                      styles.webAddToCartBtn,
                      isTestInCart(selectedTest.id) && styles.webAddToCartBtnActive,
                      { paddingVertical: 10, paddingHorizontal: 16 },
                    ]}
                    onPress={() => handleToggleCartTest(selectedTest)}
                    activeOpacity={0.85}
                  >
                    <Ionicons
                      name={isTestInCart(selectedTest.id) ? 'checkmark-circle' : 'cart-outline'}
                      size={15}
                      color={isTestInCart(selectedTest.id) ? '#FFFFFF' : '#00B894'}
                    />
                    <Text
                      style={[
                        styles.webAddToCartBtnText,
                        isTestInCart(selectedTest.id) && styles.webAddToCartBtnTextActive,
                        { fontSize: 13 },
                      ]}
                    >
                      {isTestInCart(selectedTest.id) ? 'In Cart' : 'Add to Cart'}
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.modalPrimaryBtn}
                    onPress={() => { const t = selectedTest; setSelectedTest(null); startBooking(t); }}
                  >
                    <Text style={styles.modalPrimaryBtnText}>Proceed to Book →</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </View>
        </Modal>
      )}

      {/* ─── MODAL 2: PACKAGE DETAILS ─── */}
      {selectedPackage && (
        <Modal visible={!!selectedPackage} animationType="fade" transparent onRequestClose={() => setSelectedPackage(null)}>
          <View style={styles.modalOverlay}>
            <View style={[styles.detailsModalContent, { maxWidth: 680 }]}>
              {/* Header */}
              <View style={styles.modalHeaderRow}>
                <View style={{ flex: 1 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                    <View style={{ backgroundColor: '#00B894', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6 }}>
                      <Text style={{ fontSize: 11, fontWeight: '700', color: '#FFFFFF' }}>{selectedPackage.code}</Text>
                    </View>
                    <Text style={{ fontSize: 11.5, fontWeight: '600', color: '#64748B' }}>{selectedPackage.category}</Text>
                  </View>
                  <Text style={styles.modalHeaderTitle}>{selectedPackage.name}</Text>
                  <Text style={styles.modalHeaderSubtitle}>
                    {selectedPackage.testsCount || selectedPackage.tests?.length || selectedPackage.includedCount} Tests Included • {selectedPackage.tatSummary || 'Same Day Reports'}
                  </Text>
                </View>
                <TouchableOpacity onPress={() => { setSelectedPackage(null); setExpandedTestIndex(null); }}>
                  <Ionicons name="close" size={24} color="#0F172A" />
                </TouchableOpacity>
              </View>

              <ScrollView style={{ maxHeight: 420 }} showsVerticalScrollIndicator={false}>
                {/* Clinical / Pricing Note Box */}
                {Boolean(selectedPackage.clinicalNote) && (
                  <View style={{ backgroundColor: '#F8FAFC', borderWidth: 1, borderColor: '#CBD5E1', borderRadius: 10, padding: 12, marginBottom: 14 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                      <Ionicons name="information-circle" size={16} color="#0284C7" />
                      <Text style={{ fontSize: 12, fontWeight: '700', color: '#0F172A' }}>Clinical / Pricing Note</Text>
                    </View>
                    <Text style={{ fontSize: 12, color: '#475569', lineHeight: 18 }}>{selectedPackage.clinicalNote}</Text>
                  </View>
                )}

                {/* Key Spec Grid */}
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 }}>
                  <View style={{ flex: 1, minWidth: 140, backgroundColor: '#F0FDF4', borderRadius: 8, padding: 10, borderWidth: 1, borderColor: '#DCFCE7' }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
                      <Ionicons name="time-outline" size={13} color="#059669" />
                      <Text style={{ fontSize: 11, color: '#059669', fontWeight: '700' }}>Turnaround Time (TAT)</Text>
                    </View>
                    <Text style={{ fontSize: 12, color: '#0F172A', fontWeight: '600', marginTop: 2 }}>{selectedPackage.tatSummary || '6–8 Hours'}</Text>
                  </View>
                  <View style={{ flex: 1, minWidth: 140, backgroundColor: '#EFF6FF', borderRadius: 8, padding: 10, borderWidth: 1, borderColor: '#DBEAFE' }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
                      <Ionicons name="flask-outline" size={13} color="#2563EB" />
                      <Text style={{ fontSize: 11, color: '#2563EB', fontWeight: '700' }}>Sample Required</Text>
                    </View>
                    <Text style={{ fontSize: 12, color: '#0F172A', fontWeight: '600', marginTop: 2 }}>{selectedPackage.sampleSummary || 'Blood / Urine'}</Text>
                  </View>
                  <View style={{ width: '100%', backgroundColor: '#FFFBEB', borderRadius: 8, padding: 10, borderWidth: 1, borderColor: '#FEF3C7' }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
                      <Ionicons name="restaurant-outline" size={13} color="#D97706" />
                      <Text style={{ fontSize: 11, color: '#D97706', fontWeight: '700' }}>Preparation Instructions</Text>
                    </View>
                    <Text style={{ fontSize: 12, color: '#0F172A', marginTop: 2 }}>{selectedPackage.preparationSummary || 'No special fasting required.'}</Text>
                  </View>
                </View>

                {/* Expandable Test Parameters Section */}
                <Text style={[styles.includedSectionHeader, { marginBottom: 6 }]}>
                  Included Tests & Panels ({selectedPackage.tests?.length || selectedPackage.testsCount})
                </Text>
                <Text style={{ fontSize: 11.5, color: '#64748B', marginBottom: 12 }}>
                  Tap any test to expand its parameters, sample tube, and clinical preparation requirements.
                </Text>

                {selectedPackage.tests && selectedPackage.tests.map((testItem, idx) => {
                  const isExpanded = expandedTestIndex === idx;
                  return (
                    <View
                      key={idx}
                      style={{
                        backgroundColor: isExpanded ? '#F8FAFC' : '#FFFFFF',
                        borderWidth: 1,
                        borderColor: isExpanded ? '#00B894' : '#E2E8F0',
                        borderRadius: 10,
                        marginBottom: 8,
                        overflow: 'hidden',
                      }}
                    >
                      <TouchableOpacity
                        style={{
                          flexDirection: 'row',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: 12,
                        }}
                        onPress={() => setExpandedTestIndex(isExpanded ? null : idx)}
                      >
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 }}>
                          <Ionicons name="checkmark-circle" size={18} color="#00B894" />
                          <View style={{ flex: 1 }}>
                            <Text style={{ fontSize: 13, fontWeight: '700', color: '#0F172A' }}>{testItem.name}</Text>
                            <Text style={{ fontSize: 11, color: '#64748B', marginTop: 1 }} numberOfLines={isExpanded ? undefined : 1}>
                              {testItem.parameters}
                            </Text>
                          </View>
                        </View>
                        <Ionicons name={isExpanded ? 'chevron-up' : 'chevron-down'} size={18} color="#64748B" />
                      </TouchableOpacity>

                      {isExpanded && (
                        <View style={{ borderTopWidth: 1, borderTopColor: '#E2E8F0', padding: 12, backgroundColor: '#FFFFFF' }}>
                          <View style={{ marginBottom: 6 }}>
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
                              <Ionicons name="list-outline" size={13} color="#475569" />
                              <Text style={{ fontSize: 11, fontWeight: '700', color: '#475569' }}>Included Parameters:</Text>
                            </View>
                            <Text style={{ fontSize: 12, color: '#0F172A', marginTop: 2, lineHeight: 17 }}>{testItem.parameters}</Text>
                          </View>
                          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginTop: 6, paddingTop: 6, borderTopWidth: 1, borderTopColor: '#F1F5F9' }}>
                            <View style={{ minWidth: 120 }}>
                              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                                <Ionicons name="flask-outline" size={12} color="#64748B" />
                                <Text style={{ fontSize: 10.5, fontWeight: '700', color: '#64748B' }}>Sample Required:</Text>
                              </View>
                              <Text style={{ fontSize: 11.5, color: '#0F172A' }}>{testItem.sample}</Text>
                            </View>
                            <View style={{ minWidth: 120 }}>
                              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                                <Ionicons name="flask-outline" size={12} color="#64748B" />
                                <Text style={{ fontSize: 10.5, fontWeight: '700', color: '#64748B' }}>Tube / Container:</Text>
                              </View>
                              <Text style={{ fontSize: 11.5, color: '#0F172A' }}>{testItem.tube}</Text>
                            </View>
                            <View style={{ minWidth: 120 }}>
                              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                                <Ionicons name="time-outline" size={12} color="#64748B" />
                                <Text style={{ fontSize: 10.5, fontWeight: '700', color: '#64748B' }}>Turnaround Time:</Text>
                              </View>
                              <Text style={{ fontSize: 11.5, color: '#0F172A' }}>{testItem.tat}</Text>
                            </View>
                            <View style={{ width: '100%' }}>
                              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                                <Ionicons name="restaurant-outline" size={12} color="#64748B" />
                                <Text style={{ fontSize: 10.5, fontWeight: '700', color: '#64748B' }}>Preparation:</Text>
                              </View>
                              <Text style={{ fontSize: 11.5, color: '#0F172A' }}>{testItem.preparation}</Text>
                            </View>
                          </View>
                        </View>
                      )}
                    </View>
                  );
                })}
              </ScrollView>

              <View style={styles.modalFooterRow}>
                <View>
                  <Text style={styles.modalPriceText}>₹{selectedPackage.price}</Text>
                  <Text style={styles.modalMrpText}>₹{selectedPackage.mrp || Math.round(selectedPackage.price * 1.5)}</Text>
                  {Boolean(selectedPackage.discount) && (
                    <Text style={{ fontSize: 11, fontWeight: '700', color: '#00B894' }}>{selectedPackage.discount}</Text>
                  )}
                </View>
                <View style={{ flexDirection: 'row', gap: 10, alignItems: 'center' }}>
                  <TouchableOpacity
                    style={[
                      styles.webAddToCartBtn,
                      isTestInCart(selectedPackage.id) && styles.webAddToCartBtnActive,
                      { paddingVertical: 10, paddingHorizontal: 16 },
                    ]}
                    onPress={() => handleToggleCartPackage(selectedPackage)}
                    activeOpacity={0.85}
                  >
                    <Ionicons
                      name={isTestInCart(selectedPackage.id) ? 'checkmark-circle' : 'cart-outline'}
                      size={15}
                      color={isTestInCart(selectedPackage.id) ? '#FFFFFF' : '#00B894'}
                    />
                    <Text
                      style={[
                        styles.webAddToCartBtnText,
                        isTestInCart(selectedPackage.id) && styles.webAddToCartBtnTextActive,
                        { fontSize: 13 },
                      ]}
                    >
                      {isTestInCart(selectedPackage.id) ? 'In Cart' : 'Add to Cart'}
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.modalPrimaryBtn}
                    onPress={() => {
                      const pkgToBook = selectedPackage;
                      setSelectedPackage(null);
                      setExpandedTestIndex(null);
                      startBooking(pkgToBook);
                    }}
                  >
                    <Text style={styles.modalPrimaryBtnText}>Book Package Now →</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </View>
        </Modal>
      )}

      {/* ─── MODAL 3: BOOKING FLOW ─── */}
      {activeBookingTest && (() => {
        const test = activeBookingTest;
        const isHome = collectionMethod === 'HOME';
        const testPrice = test.price;
        const collectionFee = isHome ? 100 : 0;
        const totalPrice = testPrice + collectionFee;
        const availableDates = getAvailableDates();
        const selectedCentre =
          availableCentres.find((c) => c.id === selectedCentreId) ||
          ALL_CITY_DIAGNOSTIC_CENTRES.find((c) => c.id === selectedCentreId) ||
          availableCentres[0];
        return (
          <Modal visible={!!activeBookingTest} animationType="fade" transparent onRequestClose={() => setActiveBookingTest(null)}>
            <View style={styles.modalOverlay}>
              <View style={styles.bookingModalContent}>
                <View style={styles.modalHeaderRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.bookingStepHeaderTitle}>
                      {bookingFlowStep === 1 ? '1. Collection Method' : bookingFlowStep === 2 ? '2. Date & Slot' : bookingFlowStep === 3 ? '3. Summary' : bookingFlowStep === 4 ? '4. Payment' : 'Confirmed!'}
                    </Text>
                    <Text style={styles.bookingStepHeaderSub}>{test.name}</Text>
                  </View>
                  <TouchableOpacity onPress={() => setActiveBookingTest(null)}>
                    <Ionicons name="close" size={24} color="#0F172A" />
                  </TouchableOpacity>
                </View>

                {/* STEP 1 */}
                {bookingFlowStep === 1 && (
                  <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 380 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                      <Text style={[styles.stepPromptText, { marginBottom: 0 }]}>1. Select Patient Profile</Text>
                      <TouchableOpacity
                        onPress={() => {
                          setActiveBookingTest(null);
                          if (navigation && navigation.navigate) {
                            navigation.navigate('FamilyProfiles');
                          }
                        }}
                        style={{
                          flexDirection: 'row',
                          alignItems: 'center',
                          paddingVertical: 5,
                          paddingHorizontal: 10,
                          borderRadius: 8,
                          backgroundColor: '#E6F8F4',
                          borderWidth: 1,
                          borderColor: '#A3E9D9',
                          cursor: 'pointer',
                        }}
                      >
                        <Ionicons name="person-add-outline" size={13} color="#00B894" />
                        <Text style={{ fontSize: 12, fontWeight: '700', color: '#00B894', marginLeft: 4 }}>+ Add Family Member</Text>
                      </TouchableOpacity>
                    </View>
                    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 14 }}>
                      {patientProfiles.map((p) => {
                        const isP = selectedPatientId === p.id;
                        return (
                          <TouchableOpacity
                            key={p.id}
                            style={[
                              styles.methodSelectCard,
                              isP && styles.methodSelectCardActive,
                              { flex: 1, minWidth: 180, marginVertical: 0, paddingVertical: 8, paddingHorizontal: 10 },
                            ]}
                            onPress={() => {
                              setSelectedPatientId(p.id);
                              setHomeAddressName(p.name);
                              setHomeAddressPhone(p.phone);
                            }}
                          >
                            <View style={[styles.methodRadio, isP && styles.methodRadioActive]}>
                              {isP && <View style={styles.methodRadioInner} />}
                            </View>
                            <View style={{ flex: 1, marginLeft: 8 }}>
                              <Text style={[styles.methodSelectTitle, { fontSize: 13 }]}>{p.name} ({p.relation})</Text>
                              <Text style={styles.methodSelectSub}>{p.age} yrs • {p.gender}</Text>
                            </View>
                          </TouchableOpacity>
                        );
                      })}
                    </View>

                    <Text style={[styles.stepPromptText, { marginTop: 8 }]}>2. How would you like to provide your sample?</Text>
                    {test.homeCollection && (
                      <TouchableOpacity style={[styles.methodSelectCard, isHome && styles.methodSelectCardActive]} onPress={() => setCollectionMethod('HOME')}>
                        <View style={[styles.methodRadio, isHome && styles.methodRadioActive]}>{isHome && <View style={styles.methodRadioInner} />}</View>
                        <View style={{ flex: 1, marginLeft: 10 }}>
                          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                            <Ionicons name="home-outline" size={16} color="#00B894" />
                            <Text style={styles.methodSelectTitle}>Home Sample Collection</Text>
                          </View>
                          <Text style={styles.methodSelectSub}>Trained phlebotomist visits your address.</Text>
                          <Text style={styles.methodFeeTag}>Doorstep Fee: ₹100</Text>
                        </View>
                      </TouchableOpacity>
                    )}
                    {test.centreCollection && (
                      <TouchableOpacity style={[styles.methodSelectCard, !isHome && styles.methodSelectCardActive]} onPress={() => setCollectionMethod('CENTRE')}>
                        <View style={[styles.methodRadio, !isHome && styles.methodRadioActive]}>{!isHome && <View style={styles.methodRadioInner} />}</View>
                        <View style={{ flex: 1, marginLeft: 10 }}>
                          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                            <Ionicons name="business-outline" size={16} color="#00B894" />
                            <Text style={styles.methodSelectTitle}>Diagnostic Centre Visit</Text>
                          </View>
                          <Text style={styles.methodSelectSub}>Walk into any verified lab partner in Mysuru.</Text>
                          <Text style={[styles.methodFeeTag, { color: '#00B894' }]}>Collection Fee: FREE</Text>
                        </View>
                      </TouchableOpacity>
                    )}
                  </ScrollView>
                )}

                  {/* STEP 2 */}
                {bookingFlowStep === 2 && (
                  <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 380 }}>
                    {isHome ? (
                      <View style={styles.stepBlock}>
                        <View style={styles.manualAddressHeader}>
                          <Ionicons name="home" size={18} color="#00B894" />
                          <Text style={styles.stepBlockTitle}>Sample Collection Address</Text>
                        </View>
                        <Text style={styles.manualAddressSubtitle}>Enter the address where the phlebotomist should visit</Text>

                        <Text style={styles.addressFieldLabel}>Patient / Contact Name *</Text>
                        <TextInput
                          style={styles.addressFieldInput}
                          placeholder="e.g. Hemanth Gowda"
                          placeholderTextColor="#94A3B8"
                          value={homeAddressName}
                          onChangeText={setHomeAddressName}
                        />

                        <Text style={styles.addressFieldLabel}>Contact Phone *</Text>
                        <TextInput
                          style={styles.addressFieldInput}
                          placeholder="e.g. 9741422544"
                          placeholderTextColor="#94A3B8"
                          value={homeAddressPhone}
                          onChangeText={setHomeAddressPhone}
                        />

                        <Text style={styles.addressFieldLabel}>Flat / House No., Street, Area *</Text>
                        <TextInput
                          style={styles.addressFieldInput}
                          placeholder="e.g. 12/A, 3rd Cross, Vijayanagar"
                          placeholderTextColor="#94A3B8"
                          value={homeAddressFlat}
                          onChangeText={setHomeAddressFlat}
                        />

                        <View style={styles.addressRowFields}>
                          <View style={{ flex: 1 }}>
                            <Text style={styles.addressFieldLabel}>City *</Text>
                            <TextInput
                              style={styles.addressFieldInput}
                              placeholder="e.g. Mysuru"
                              placeholderTextColor="#94A3B8"
                              value={homeAddressCity}
                              onChangeText={setHomeAddressCity}
                            />
                          </View>
                          <View style={{ flex: 1, marginLeft: 10 }}>
                            <Text style={styles.addressFieldLabel}>Pincode *</Text>
                            <TextInput
                              style={styles.addressFieldInput}
                              placeholder="e.g. 570023"
                              placeholderTextColor="#94A3B8"
                              value={homeAddressPincode}
                              onChangeText={setHomeAddressPincode}
                            />
                          </View>
                        </View>

                        <Text style={styles.addressFieldLabel}>Landmark (Optional)</Text>
                        <TextInput
                          style={styles.addressFieldInput}
                          placeholder="e.g. Near City Hospital"
                          placeholderTextColor="#94A3B8"
                          value={homeAddressLandmark}
                          onChangeText={setHomeAddressLandmark}
                        />
                      </View>
                    ) : (
                      <View style={styles.stepBlock}>
                        <Text style={styles.stepBlockTitle}>Select Diagnostic Centre ({currentCity})</Text>
                        {availableCentres.map((centre) => {
                          const isSel = selectedCentreId === centre.id;
                          return (
                            <View key={centre.id} style={[styles.centreSelectCard, isSel && styles.centreSelectCardActive]}>
                              <TouchableOpacity
                                style={{ flex: 1, flexDirection: 'row', alignItems: 'flex-start' }}
                                onPress={() => setSelectedCentreId(centre.id)}
                              >
                                <Ionicons name="business-outline" size={20} color={isSel ? '#00B894' : '#64748B'} style={{ marginTop: 2 }} />
                                <View style={{ flex: 1, marginLeft: 10, marginRight: 8 }}>
                                  <Text style={styles.centreSelectName}>{centre.name}</Text>
                                  <Text style={styles.centreSelectAddress}>{centre.address}</Text>
                                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4, flexWrap: 'wrap' }}>
                                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3 }}>
                                      <Ionicons name="star" size={12} color="#FF7F50" />
                                      <Text style={styles.centreMetaText}>{centre.rating} • {centre.distanceKm} km away</Text>
                                    </View>
                                    <Text style={styles.centreMetaText}>•</Text>
                                    <Text style={[styles.centreMetaText, { color: '#059669', fontWeight: '600' }]}>{centre.timings}</Text>
                                  </View>
                                </View>
                                {isSel && <Ionicons name="checkmark-circle" size={18} color="#00B894" />}
                              </TouchableOpacity>

                              <View style={styles.centreCardActionsRow}>
                                <TouchableOpacity
                                  style={styles.modalGetDirectionsBtn}
                                  onPress={(e) => handleOpenDirections(centre, e)}
                                  activeOpacity={0.8}
                                >
                                  <Ionicons name="navigate-outline" size={13} color="#059669" style={{ marginRight: 4 }} />
                                  <Text style={styles.modalGetDirectionsBtnText}>Get Directions</Text>
                                </TouchableOpacity>
                              </View>
                            </View>
                          );
                        })}
                      </View>
                    )}
                    <View style={styles.stepBlock}>
                      <Text style={styles.stepBlockTitle}>Select Date</Text>
                      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.datePillsRow}>
                        {availableDates.map((item) => {
                          const isSel = selectedDate === item.dateStr;
                          return (
                            <TouchableOpacity key={item.dateStr} style={[styles.datePill, isSel && styles.datePillActive]} onPress={() => setSelectedDate(item.dateStr)}>
                              <Text style={[styles.datePillDay, isSel && styles.datePillDayActive]}>{item.dayName}</Text>
                              <Text style={[styles.datePillDate, isSel && styles.datePillDateActive]}>{item.dateStr}</Text>
                            </TouchableOpacity>
                          );
                        })}
                      </ScrollView>
                    </View>
                    <View style={styles.stepBlock}>
                      <Text style={styles.stepBlockTitle}>Available Time Slots</Text>
                      <View style={styles.slotGrid}>
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
                                styles.slotCard,
                                isSel && styles.slotCardActive,
                                !isAvail && styles.slotCardDisabled,
                              ]}
                              onPress={() => isAvail && setSelectedSlotId(slot.id)}
                            >
                              <Text style={[styles.slotLabel, isSel && styles.slotLabelActive, !isAvail && styles.slotLabelDisabled]}>
                                {slot.label}
                              </Text>
                              <Text style={[styles.slotPeriod, !isAvail && styles.slotPeriodDisabled]}>
                                {!isAvail ? (statusObj.status === 'BOOKED' ? 'Booked' : 'Passed') : slot.period}
                              </Text>
                            </TouchableOpacity>
                          );
                        })}
                      </View>
                    </View>
                  </ScrollView>
                )}

                {/* STEP 3 */}
                {bookingFlowStep === 3 && (
                  <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 380 }}>
                    <View style={styles.summaryCard}>
                      <Text style={styles.summaryHeading}>Booking & Package Summary</Text>
                      {Boolean(test.code) && (
                        <View style={styles.summaryRow}>
                          <Text style={styles.summaryLabel}>Package Code:</Text>
                          <Text style={[styles.summaryVal, { fontWeight: '700', color: '#00B894' }]}>{test.code}</Text>
                        </View>
                      )}
                      <View style={styles.summaryRow}>
                        <Text style={styles.summaryLabel}>Package / Test:</Text>
                        <Text style={[styles.summaryVal, { fontWeight: '700', flex: 1, textAlign: 'right' }]}>{test.name}</Text>
                      </View>
                      {Boolean(test.testsCount) && (
                        <View style={styles.summaryRow}>
                          <Text style={styles.summaryLabel}>Tests Included:</Text>
                          <Text style={styles.summaryVal}>{test.testsCount} Diagnostic Tests & Panels</Text>
                        </View>
                      )}
                      <View style={styles.summaryRow}>
                        <Text style={styles.summaryLabel}>Patient Name:</Text>
                        <Text style={styles.summaryVal}>{homeAddressName || patientProfiles.find((p) => p.id === selectedPatientId)?.name || 'Patient'} ({patientProfiles.find((p) => p.id === selectedPatientId)?.relation || 'Self'})</Text>
                      </View>
                      <View style={styles.summaryRow}>
                        <Text style={styles.summaryLabel}>Method:</Text>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                          <Ionicons name={isHome ? 'home-outline' : 'business-outline'} size={14} color="#00B894" />
                          <Text style={styles.summaryVal}>{isHome ? 'Home' : 'Diagnostic Centre'}</Text>
                        </View>
                      </View>
                      {isHome ? (
                        <View style={styles.summaryRow}>
                          <Text style={styles.summaryLabel}>Address:</Text>
                          <Text style={styles.summaryVal}>
                            {homeAddressFlat ? `${homeAddressFlat}, ${homeAddressCity} - ${homeAddressPincode}` : 'Not provided'}
                          </Text>
                        </View>
                      ) : (
                        <View style={styles.summaryRow}>
                          <Text style={styles.summaryLabel}>Centre:</Text>
                          <View style={{ flex: 1, alignItems: 'flex-end' }}>
                            <Text style={styles.summaryVal}>{selectedCentre?.name}</Text>
                            <Text style={[styles.summaryVal, { fontSize: 11.5, color: '#64748B', marginTop: 2, textAlign: 'right' }]}>
                              {selectedCentre?.address}
                            </Text>
                            <TouchableOpacity
                              style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 }}
                              onPress={() => handleOpenDirections(selectedCentre)}
                            >
                              <Ionicons name="navigate-outline" size={12} color="#00B894" />
                              <Text style={{ fontSize: 11.5, fontWeight: '700', color: '#00B894' }}>Get Directions</Text>
                            </TouchableOpacity>
                          </View>
                        </View>
                      )}
                      <View style={styles.summaryRow}><Text style={styles.summaryLabel}>Date & Time:</Text><Text style={styles.summaryVal}>{selectedDate} • {TIME_SLOTS.find((s) => s.id === selectedSlotId)?.label}</Text></View>
                      <View style={styles.summaryDivider} />
                      <View style={styles.summaryRow}><Text style={styles.summaryLabel}>Test Fee:</Text><Text style={styles.summaryVal}>₹{testPrice}</Text></View>
                      <View style={styles.summaryRow}><Text style={styles.summaryLabel}>Collection:</Text><Text style={styles.summaryVal}>{collectionFee === 0 ? 'FREE' : `₹${collectionFee}`}</Text></View>
                      <View style={styles.summaryDivider} />
                      <View style={styles.summaryTotalRow}><Text style={styles.summaryTotalLabel}>Total:</Text><Text style={styles.summaryTotalVal}>₹{totalPrice}</Text></View>
                    </View>
                  </ScrollView>
                )}

                {/* STEP 4 */}
                {bookingFlowStep === 4 && (
                  <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 380 }}>
                    <View style={styles.demoPaymentAlert}>
                      <Ionicons name="information-circle" size={18} color="#0284C7" />
                      <Text style={styles.demoPaymentAlertText}>Frontend prototype: No real payment will occur.</Text>
                    </View>
                    <Text style={styles.stepBlockTitle}>Select Payment Method</Text>
                    {[
                      { id: 'UPI', label: 'UPI / Google Pay / PhonePe', icon: 'flash' },
                      { id: 'CARD', label: 'Credit / Debit Card', icon: 'card' },
                      { id: 'NET_BANKING', label: 'Net Banking', icon: 'globe' },
                      { id: 'WALLET', label: 'Pay at Sample Collection', icon: 'wallet' },
                    ].map((m) => {
                      const isSel = paymentMethod === m.id;
                      return (
                        <TouchableOpacity key={m.id} style={[styles.paymentMethodCard, isSel && styles.paymentMethodCardActive]} onPress={() => setPaymentMethod(m.id)}>
                          <Ionicons name={m.icon} size={20} color={isSel ? '#00B894' : '#64748B'} />
                          <Text style={[styles.paymentMethodLabel, isSel && styles.paymentMethodLabelActive]}>{m.label}</Text>
                          {isSel && <Ionicons name="checkmark-circle" size={18} color="#00B894" />}
                        </TouchableOpacity>
                      );
                    })}
                  </ScrollView>
                )}

                {/* STEP 5: CONFIRMED */}
                {bookingFlowStep === 5 && confirmedBookingData && (
                  <View style={styles.confirmedBox}>
                    <Ionicons name="checkmark-circle" size={60} color="#00B894" />
                    <Text style={styles.confirmedTitle}>Booking Confirmed!</Text>
                    <Text style={styles.confirmedBookingId}>Booking ID: {confirmedBookingData.id}</Text>
                    <Text style={styles.confirmedDesc}>
                      {confirmedBookingData.testName} booked for {confirmedBookingData.bookingDate} ({confirmedBookingData.timeSlot}).
                    </Text>

                    {confirmedBookingData.collectionMethod === 'CENTRE' && selectedCentre && (
                      <View style={{ backgroundColor: '#F8FAFC', borderRadius: 10, padding: 12, marginVertical: 12, borderWidth: 1, borderColor: '#E2E8F0', width: '100%', alignItems: 'center' }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                          <Ionicons name="business" size={16} color="#00B894" />
                          <Text style={{ fontSize: 13.5, fontWeight: '800', color: '#0F172A' }}>{selectedCentre.name}</Text>
                        </View>
                        <Text style={{ fontSize: 11.5, color: '#64748B', textAlign: 'center', marginBottom: 8 }}>{selectedCentre.address}</Text>
                        <TouchableOpacity
                          style={{ flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#00B894', paddingVertical: 8, paddingHorizontal: 16, borderRadius: 8 }}
                          onPress={() => handleOpenDirections(selectedCentre)}
                          activeOpacity={0.85}
                        >
                          <Ionicons name="navigate" size={14} color="#FFFFFF" />
                          <Text style={{ fontSize: 12, fontWeight: '700', color: '#FFFFFF' }}>Get Directions in Google Maps</Text>
                        </TouchableOpacity>
                      </View>
                    )}

                    <TouchableOpacity
                      style={styles.viewBookingsConfirmedBtn}
                      onPress={() => {
                        setActiveBookingTest(null);
                        if (navigation?.navigate) {
                          navigation.navigate('MyTests', { initialTab: 'lab' });
                        } else {
                          setActiveTab('BOOKINGS');
                        }
                      }}
                    >
                      <Text style={styles.viewBookingsConfirmedBtnText}>View My Lab Test Bookings →</Text>
                    </TouchableOpacity>
                  </View>
                )}

                {bookingFlowStep < 5 && (
                  <View style={styles.modalFooterRow}>
                    {bookingFlowStep > 1 && (
                      <TouchableOpacity style={styles.stepBackBtn} onPress={() => setBookingFlowStep(bookingFlowStep - 1)}>
                        <Text style={styles.stepBackBtnText}>Back</Text>
                      </TouchableOpacity>
                    )}
                    <TouchableOpacity
                      style={[styles.modalPrimaryBtn, { flex: 1, marginLeft: bookingFlowStep > 1 ? 10 : 0 }]}
                      onPress={() => {
                        if (bookingFlowStep === 1) setBookingFlowStep(2);
                        else if (bookingFlowStep === 2) {
                          if (collectionMethod === 'HOME' && (!homeAddressName.trim() || !homeAddressPhone.trim() || !homeAddressFlat.trim() || !homeAddressCity.trim() || !homeAddressPincode.trim())) {
                            showAlert('Incomplete Details', 'Please fill in Patient Name, Phone, Address, City and Pincode for home sample collection.');
                            return;
                          }
                          setBookingFlowStep(3);
                        }
                        else if (bookingFlowStep === 3) setBookingFlowStep(4);
                        else if (bookingFlowStep === 4) handleSimulatePayment();
                      }}
                    >
                      <Text style={styles.modalPrimaryBtnText}>
                        {bookingFlowStep === 1 ? 'Continue to Slots' : bookingFlowStep === 2 ? 'Review Summary' : bookingFlowStep === 3 ? 'Proceed to Pay' : `Pay ₹${totalPrice}`}
                      </Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            </View>
          </Modal>
        );
      })()}

      {/* ─── MODAL 4: TRACKING ─── */}
      {selectedTrackingBooking && (() => {
        const b = selectedTrackingBooking;
        const stages = [
          { id: 1, title: 'Test Booked', desc: 'Booking confirmed' },
          { id: 2, title: 'Sample Collection Scheduled', desc: `${b.bookingDate}, ${b.timeSlot}` },
          { id: 3, title: 'Sample Collected', desc: 'Barcoded, temperature transport' },
          { id: 4, title: 'Lab Processing', desc: 'Automated clinical analyzers' },
          { id: 5, title: 'Report Ready', desc: 'Verified by Pathologist & available online' },
        ];
        return (
          <Modal visible={!!selectedTrackingBooking} animationType="fade" transparent onRequestClose={() => setSelectedTrackingBooking(null)}>
            <View style={styles.modalOverlay}>
              <View style={styles.detailsModalContent}>
                <View style={styles.modalHeaderRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.modalHeaderTitle}>Sample Tracking</Text>
                    <Text style={styles.modalHeaderSubtitle}>Booking ID: {b.id}</Text>
                  </View>
                  <TouchableOpacity onPress={() => setSelectedTrackingBooking(null)}>
                    <Ionicons name="close" size={24} color="#0F172A" />
                  </TouchableOpacity>
                </View>
                <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 380 }}>
                  <Text style={styles.trackingTestTitle}>{b.testName}</Text>
                  {b.collectionMethod === 'CENTRE' && b.diagnosticCentre && (
                    <View style={{ backgroundColor: '#F8FAFC', borderRadius: 10, padding: 12, marginVertical: 10, borderWidth: 1, borderColor: '#E2E8F0', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
                      <View style={{ flex: 1 }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5, marginBottom: 2 }}>
                          <Ionicons name="business" size={15} color="#00B894" />
                          <Text style={{ fontSize: 13, fontWeight: '700', color: '#0F172A' }}>{b.diagnosticCentre.name}</Text>
                        </View>
                        <Text style={{ fontSize: 11.5, color: '#64748B' }}>{b.diagnosticCentre.location || b.diagnosticCentre.address}</Text>
                      </View>
                      <TouchableOpacity
                        style={{ flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: '#00B894', paddingVertical: 7, paddingHorizontal: 12, borderRadius: 8 }}
                        onPress={() => {
                          const c = DIAGNOSTIC_CENTRES.find(dc => dc.name === b.diagnosticCentre?.name) || b.diagnosticCentre;
                          handleOpenDirections(c);
                        }}
                        activeOpacity={0.85}
                      >
                        <Ionicons name="navigate" size={13} color="#FFFFFF" />
                        <Text style={{ fontSize: 11.5, fontWeight: '700', color: '#FFFFFF' }}>Get Directions</Text>
                      </TouchableOpacity>
                    </View>
                  )}
                  <View style={styles.timelineContainer}>
                    {stages.map((stage, idx) => {
                      const isDone = b.trackingStage >= stage.id;
                      const isCurr = b.trackingStage === stage.id;
                      return (
                        <View key={stage.id} style={styles.timelineStepRow}>
                          <View style={styles.timelineIconCol}>
                            <View style={[styles.timelineNode, isDone && styles.timelineNodeDone, isCurr && styles.timelineNodeCurr]}>
                              <Ionicons name={isDone ? 'checkmark' : 'ellipse'} size={12} color="#FFFFFF" />
                            </View>
                            {idx < stages.length - 1 && <View style={[styles.timelineLine, isDone && styles.timelineLineDone]} />}
                          </View>
                          <View style={styles.timelineTextCol}>
                            <Text style={[styles.timelineStepTitle, isCurr && styles.timelineStepTitleCurr]}>{stage.title}</Text>
                            <Text style={styles.timelineStepDesc}>{stage.desc}</Text>
                          </View>
                        </View>
                      );
                    })}
                  </View>
                </ScrollView>
                <TouchableOpacity style={styles.modalPrimaryBtn} onPress={() => setSelectedTrackingBooking(null)}>
                  <Text style={styles.modalPrimaryBtnText}>Close Tracker</Text>
                </TouchableOpacity>
              </View>
            </View>
          </Modal>
        );
      })()}

      {/* ─── MODAL 5: REPORT VIEWER ─── */}
      {selectedReport && (() => {
        const r = selectedReport;
        return (
          <Modal visible={!!selectedReport} animationType="fade" transparent onRequestClose={() => setSelectedReport(null)}>
            <View style={styles.modalOverlay}>
              <View style={styles.reportModalContent}>
                <View style={styles.modalHeaderRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.reportModalTitle}>{r.testName}</Text>
                    <Text style={styles.reportModalSub}>{r.labName}</Text>
                  </View>
                  <TouchableOpacity onPress={() => setSelectedReport(null)}>
                    <Ionicons name="close" size={24} color="#0F172A" />
                  </TouchableOpacity>
                </View>
                <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 420 }}>
                  <View style={styles.reportPatientCard}>
                    <View style={styles.reportPatientRow}><Text style={styles.repPatientLabel}>Patient:</Text><Text style={styles.repPatientVal}>{r.patientName} ({r.patientAge}, {r.patientGender})</Text></View>
                    <View style={styles.reportPatientRow}><Text style={styles.repPatientLabel}>Referred By:</Text><Text style={styles.repPatientVal}>{r.doctorReferred}</Text></View>
                    <View style={styles.reportPatientRow}><Text style={styles.repPatientLabel}>Collection Date:</Text><Text style={styles.repPatientVal}>{r.sampleCollectionDate}</Text></View>
                    <View style={styles.reportPatientRow}>
                      <Text style={styles.repPatientLabel}>Status:</Text>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                        <Ionicons name="checkmark-circle" size={13} color="#00B894" />
                        <Text style={[styles.repPatientVal, { color: '#00B894', fontWeight: '700' }]}>Verified & Released</Text>
                      </View>
                    </View>
                  </View>
                  <Text style={styles.tableHeading}>Observed Test Parameters</Text>
                  <View style={styles.paramsTable}>
                    <View style={styles.paramsTableHeader}>
                      <Text style={[styles.paramsTableColHeader, { flex: 2.2 }]}>Parameter</Text>
                      <Text style={[styles.paramsTableColHeader, { flex: 1.2, textAlign: 'right' }]}>Result</Text>
                      <Text style={[styles.paramsTableColHeader, { flex: 1.8, textAlign: 'right' }]}>Ref Range</Text>
                    </View>
                    {r.parameters.map((param, pIdx) => (
                      <View key={pIdx} style={styles.paramTableRow}>
                        <View style={{ flex: 2.2 }}>
                          <Text style={styles.paramNameText}>{param.name}</Text>
                          <Text style={styles.paramUnitText}>{param.unit}</Text>
                        </View>
                        <View style={{ flex: 1.2, alignItems: 'flex-end' }}>
                          <Text style={[styles.paramResultText, param.status === 'BORDERLINE' && { color: '#D97706' }]}>{param.observed}</Text>
                        </View>
                        <Text style={[styles.paramRefText, { flex: 1.8 }]}>{param.reference}</Text>
                      </View>
                    ))}
                  </View>
                  {r.clinicalConclusion && (
                    <View style={styles.conclusionCard}>
                      <Text style={styles.conclusionTitle}>Pathologist Impression:</Text>
                      <Text style={styles.conclusionText}>{r.clinicalConclusion}</Text>
                    </View>
                  )}
                </ScrollView>
                <View style={styles.reportModalFooter}>
                  <TouchableOpacity style={styles.reportDownloadModalBtn} onPress={() => { setShowDownloadToast(true); setTimeout(() => setShowDownloadToast(false), 3000); }}>
                    <Ionicons name="download" size={16} color="#00B894" />
                    <Text style={styles.reportDownloadModalBtnText}>Download PDF</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.reportMyHealthBtn} onPress={() => { setSelectedReport(null); navigation?.navigate?.('HealthRecords'); }}>
                    <Ionicons name="heart" size={16} color="#FFFFFF" />
                    <Text style={styles.reportMyHealthBtnText}>View in My Health</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </Modal>
        );
      })()}


      {/* FLOATING LAB CART BAR */}
      {labCartCount > 0 && (
        <View style={[styles.webFloatingCartBar, !isDesktop && { bottom: 88 }]}>
          <View style={styles.floatingCartLeft}>
            <View style={styles.floatingCartIconCircle}>
              <Ionicons name="flask" size={18} color="#FFFFFF" />
            </View>
            <View>
              <Text style={styles.floatingCartTitle}>
                {labCartCount} Diagnostic Test{labCartCount > 1 ? 's' : ''} in Cart
              </Text>
              <Text style={styles.floatingCartSubtitle}>
                Total: ₹{labFinalTotal.toLocaleString('en-IN')} • Doorstep Sample Collection
              </Text>
            </View>
          </View>
          <TouchableOpacity
            style={styles.floatingCartBtn}
            onPress={() => navigation.navigate('Cart', { initialTab: 'lab' })}
            activeOpacity={0.88}
          >
            <Text style={styles.floatingCartBtnText}>View Lab Cart</Text>
            <Ionicons name="arrow-forward" size={16} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      )}

      {/* Download Toast */}
      {showDownloadToast && (
        <View style={styles.downloadToast}>
          <Ionicons name="cloud-download" size={16} color="#FFFFFF" />
          <Text style={styles.downloadToastText}>Report downloaded successfully.</Text>
        </View>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  webAddToCartBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#00B894',
    backgroundColor: '#F0FDF4',
  },
  webAddToCartBtnActive: {
    backgroundColor: '#00B894',
    borderColor: '#00B894',
  },
  webAddToCartBtnText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#00B894',
  },
  webAddToCartBtnTextActive: {
    color: '#FFFFFF',
  },
  webFloatingCartBar: {
    position: 'absolute',
    bottom: 24,
    left: 20,
    right: 20,
    maxWidth: 680,
    alignSelf: 'center',
    marginHorizontal: 'auto',
    backgroundColor: '#0F172A',
    borderRadius: 14,
    paddingHorizontal: 18,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 10,
    zIndex: 999,
  },
  floatingCartLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  floatingCartIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#00B894',
    justifyContent: 'center',
    alignItems: 'center',
  },
  floatingCartTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  floatingCartSubtitle: {
    fontSize: 12,
    color: '#94A3B8',
    marginTop: 2,
  },
  floatingCartBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#00B894',
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 8,
  },
  floatingCartBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  safeContainer: {
    flex: 1,
    backgroundColor: '#FAFCFD',
  },
  webHeaderBar: {
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#DCE7EC',
    paddingVertical: 14,
    paddingHorizontal: 24,
  },
  webHeaderInner: {
    maxWidth: 1280,
    width: '100%',
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  webHeaderLogoCol: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F1F8FB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  webHeaderTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#1E3A8A',
  },
  webHeaderSub: {
    fontSize: 12,
    color: '#64748B',
  },
  webTabsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  webTabBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#FAFCFD',
    gap: 6,
  },
  webTabBtnActive: {
    backgroundColor: '#ECFDF5',
    borderWidth: 1,
    borderColor: '#00B894',
  },
  webTabBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748B',
  },
  webTabBtnTextActive: {
    color: '#00B894',
    fontWeight: '700',
  },
  scrollContainer: {
    flex: 1,
  },
  webMainContentWrapper: {
    maxWidth: 1280,
    width: '100%',
    alignSelf: 'center',
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 140,
  },
  webHeroBanner: {
    backgroundColor: '#E6FBF2',
    borderRadius: 24,
    padding: 28,
    borderWidth: 1.5,
    borderColor: '#A7F3D0',
    marginBottom: 24,
  },
  webHeroTextCol: {
    marginBottom: 16,
  },
  webHeroBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ECFDF5',
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    gap: 6,
    marginBottom: 8,
  },
  webHeroBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#00B894',
  },
  webHeroTitle: {
    fontSize: 26,
    fontWeight: '800',
    color: '#1E3A8A',
  },
  webHeroSubtitle: {
    fontSize: 14,
    color: '#4A6572',
    marginTop: 4,
    maxWidth: 700,
  },
  webSearchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FAFCFD',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#DCE7EC',
    maxWidth: 650,
  },
  webSearchInput: {
    flex: 1,
    marginLeft: 10,
    fontSize: 14,
    color: '#1E3A8A',
  },
  webCategoriesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 16,
  },
  webCategoryPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#DCE7EC',
    gap: 6,
  },
  webCategoryPillActive: {
    backgroundColor: '#00B894',
    borderColor: '#00B894',
  },
  webCategoryPillText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#334155',
  },
  webCategoryPillTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  webSubCategoriesBar: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    backgroundColor: '#FFFFFF',
    padding: 12,
    borderRadius: 10,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#DCE7EC',
  },
  webSubCatPill: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 14,
    backgroundColor: '#FAFCFD',
    borderWidth: 1,
    borderColor: '#DCE7EC',
  },
  webSubCatPillActive: {
    backgroundColor: '#00B894',
    borderColor: '#00B894',
  },
  webSubCatPillText: {
    fontSize: 12,
    color: '#475569',
    fontWeight: '600',
  },
  webSubCatPillTextActive: {
    color: '#FFFFFF',
  },
  webTwoColumnLayout: {
    flexDirection: 'row',
    gap: 24,
  },
  webSidebar: {
    width: 260,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 18,
    borderWidth: 1,
    borderColor: '#DCE7EC',
    alignSelf: 'flex-start',
  },
  sidebarHeading: {
    fontSize: 15,
    fontWeight: '800',
    color: '#1E3A8A',
    marginBottom: 14,
  },
  filterGroup: {
    marginBottom: 18,
  },
  filterGroupTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748B',
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  radioRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 5,
  },
  radioRowLabel: {
    fontSize: 13,
    color: '#334155',
    fontWeight: '500',
  },
  resetFiltersBtn: {
    backgroundColor: '#F1F8FB',
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 6,
  },
  resetFiltersBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1E3A8A',
  },
  webContentCol: {
    flex: 1,
  },
  webSectionBlock: {
    marginBottom: 28,
  },
  webSectionHeader: {
    marginBottom: 14,
  },
  webSectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
  },
  webSectionSub: {
    fontSize: 13,
    color: '#64748B',
    marginTop: 2,
  },
  webPackagesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  webPackageCard: {
    width: '48%',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  packageCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  packageBadgePill: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  packageBadgePillText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#D97706',
  },
  packageParamCount: {
    fontSize: 12,
    color: '#00B894',
    fontWeight: '700',
  },
  packageName: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 4,
  },
  packageDesc: {
    fontSize: 12,
    color: '#64748B',
    lineHeight: 17,
    marginBottom: 12,
  },
  packagePriceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    paddingTop: 10,
  },
  packagePrice: {
    fontSize: 18,
    fontWeight: '800',
    color: '#00B894',
  },
  packageMrp: {
    fontSize: 12,
    color: '#94A3B8',
    textDecorationLine: 'line-through',
  },
  packageViewBtn: {
    backgroundColor: '#00B894',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
  },
  packageViewBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  webTestsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  webTestCard: {
    width: '48%',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  webCardBadgesRow: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 8,
  },
  webPopularBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EF4444',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    gap: 4,
  },
  webPopularBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '800',
  },
  webRecommendedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E0F2FE',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    gap: 4,
  },
  webRecommendedBadgeText: {
    color: '#0284C7',
    fontSize: 10,
    fontWeight: '700',
  },
  webSampleBadge: {
    backgroundColor: '#F0FDF4',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  webSampleBadgeText: {
    color: '#15803D',
    fontSize: 10,
    fontWeight: '700',
  },
  webCardTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#1E3A8A',
    marginBottom: 4,
  },
  webCardDesc: {
    fontSize: 12,
    color: '#64748B',
    lineHeight: 17,
    marginBottom: 10,
  },
  webAvailBox: {
    flexDirection: 'row',
    backgroundColor: '#F1F8FB',
    borderRadius: 8,
    padding: 8,
    gap: 12,
    marginBottom: 12,
  },
  webAvailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  webAvailText: {
    fontSize: 11,
    color: '#1E3A8A',
    fontWeight: '600',
  },
  webAvailTextDisabled: {
    color: '#94A3B8',
  },
  webCardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#DCE7EC',
    paddingTop: 10,
  },
  webPriceText: {
    fontSize: 18,
    fontWeight: '800',
    color: '#00B894',
  },
  webMrpText: {
    fontSize: 12,
    color: '#94A3B8',
    textDecorationLine: 'line-through',
  },
  webTatText: {
    fontSize: 11,
    color: '#64748B',
  },
  webDetailsBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#F1F8FB',
    borderWidth: 1,
    borderColor: '#DCE7EC',
  },
  webDetailsBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1E3A8A',
  },
  webBookBtn: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#00B894',
  },
  webBookBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  webEmptyState: {
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 40,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#DCE7EC',
  },
  webEmptyTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#1E3A8A',
    marginTop: 10,
  },
  webEmptyDesc: {
    fontSize: 13,
    color: '#64748B',
    marginTop: 4,
  },
  webPaginationBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    marginTop: 32,
    marginBottom: 20,
    paddingVertical: 18,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    width: '100%',
  },
  webPageNavBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 9,
    paddingHorizontal: 16,
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    boxShadow: '0 2px 5px rgba(0,0,0,0.04)',
    cursor: 'pointer',
  },
  webPageNavBtnDisabled: {
    backgroundColor: '#F8FAFC',
    borderColor: '#E2E8F0',
    opacity: 0.5,
    cursor: 'not-allowed',
  },
  webPageNavBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
  },
  webPageNavBtnTextDisabled: {
    color: '#94A3B8',
  },
  webPageNumBtn: {
    minWidth: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0 2px 4px rgba(0,0,0,0.03)',
    cursor: 'pointer',
  },
  webPageNumBtnActive: {
    backgroundColor: '#00B894',
    borderColor: '#00B894',
    boxShadow: '0 4px 10px rgba(0, 184, 148, 0.28)',
  },
  webPageNumText: {
    fontSize: 13.5,
    fontWeight: '800',
    color: '#334155',
  },
  webPageNumTextActive: {
    color: '#FFFFFF',
    fontWeight: '900',
  },
  webTabContentBox: {
    maxWidth: 1280,
    width: '100%',
    alignSelf: 'center',
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 140,
  },
  webTabHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  webTabHeaderTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#0F172A',
  },
  tabFiltersRow: {
    flexDirection: 'row',
    gap: 8,
  },
  tabFilterBtn: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CBD5E1',
  },
  tabFilterBtnActive: {
    backgroundColor: '#00B894',
    borderColor: '#00B894',
  },
  tabFilterText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#475569',
  },
  tabFilterTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  webBookingsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  webBookingCard: {
    width: '48%',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  bookingCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  bookingIdText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#00B894',
  },
  statusBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#0284C7',
    backgroundColor: '#E0F2FE',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  bookingTestName: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 6,
  },
  bookingDetailLabel: {
    fontSize: 12,
    color: '#64748B',
    marginBottom: 3,
  },
  bookingPriceVal: {
    fontSize: 15,
    fontWeight: '800',
    color: '#00B894',
    marginTop: 4,
  },
  modalPrimaryBtn: {
    backgroundColor: '#00B894',
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  modalPrimaryBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  webReportCard: {
    width: '48%',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  reportCardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  reportCardId: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748B',
  },
  reportReadyPillText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#15803D',
    backgroundColor: '#F0FDF4',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  reportTestName: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 6,
  },
  reportMetaLabel: {
    fontSize: 12,
    color: '#64748B',
    marginBottom: 2,
  },
  reportDownloadBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#CBD5E1',
  },
  reportDownloadBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#00B894',
  },
  reportViewFullBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#00B894',
  },
  reportViewFullBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },

  // ─── MODAL SHARED ───────────────────────────────────────────────
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  detailsModalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    width: '100%',
    maxWidth: 600,
    maxHeight: '90%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.18,
    shadowRadius: 24,
    elevation: 20,
  },
  bookingModalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    width: '100%',
    maxWidth: 620,
    maxHeight: '92%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.18,
    shadowRadius: 24,
    elevation: 20,
  },
  reportModalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    width: '100%',
    maxWidth: 680,
    maxHeight: '92%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.18,
    shadowRadius: 24,
    elevation: 20,
  },
  addAddressModalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    width: '100%',
    maxWidth: 480,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.18,
    shadowRadius: 20,
    elevation: 20,
  },
  modalHeaderRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  modalHeaderTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 2,
  },
  modalHeaderSubtitle: {
    fontSize: 12,
    color: '#64748B',
  },
  modalFooterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  modalPriceText: {
    fontSize: 22,
    fontWeight: '800',
    color: '#00B894',
  },
  modalMrpText: {
    fontSize: 13,
    color: '#94A3B8',
    textDecorationLine: 'line-through',
  },
  modalPrimaryBtn: {
    backgroundColor: '#00B894',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  modalPrimaryBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },

  // ─── TEST DETAILS MODAL ───────────────────────────────────────────
  detailsSectionBlock: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
  },
  detailsBlockTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 6,
  },
  detailsBlockDesc: {
    fontSize: 13,
    color: '#475569',
    lineHeight: 20,
  },
  applicabilityRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  appliBadge: {
    backgroundColor: '#F0FDF4',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  appliBadgeText: {
    fontSize: 12,
    color: '#166534',
    fontWeight: '600',
  },
  instructionCard: {
    backgroundColor: '#FFFBEB',
    borderRadius: 10,
    padding: 12,
    marginBottom: 10,
  },
  instructionTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#92400E',
    marginBottom: 4,
  },
  instructionBody: {
    fontSize: 12,
    color: '#78350F',
    lineHeight: 18,
  },
  detailsTwoColGrid: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 12,
  },
  detailsColBox: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    padding: 12,
  },
  colBoxTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748B',
    marginBottom: 4,
  },
  colBoxVal: {
    fontSize: 13,
    color: '#0F172A',
    fontWeight: '600',
  },

  // ─── PACKAGE MODAL ───────────────────────────────────────────────
  packageModalDesc: {
    fontSize: 13,
    color: '#475569',
    lineHeight: 20,
    marginBottom: 14,
  },
  includedSectionHeader: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 10,
  },
  includedItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  includedItemName: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
  },
  includedItemDesc: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
  },
  includedItemDetailsLink: {
    fontSize: 11,
    fontWeight: '700',
    color: '#00B894',
    marginLeft: 8,
  },

  // ─── BOOKING FLOW ────────────────────────────────────────────────
  bookingStepHeaderTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
  },
  bookingStepHeaderSub: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  stepPromptText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0F172A',
    marginBottom: 14,
    marginTop: 4,
  },
  methodSelectCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
    backgroundColor: '#FFFFFF',
  },
  methodSelectCardActive: {
    borderColor: '#00B894',
    backgroundColor: '#F0FDF9',
  },
  methodRadio: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 2,
    borderColor: '#CBD5E1',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  methodRadioActive: { borderColor: '#00B894' },
  methodRadioInner: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#00B894',
  },
  methodSelectTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 2,
  },
  methodSelectSub: {
    fontSize: 12,
    color: '#64748B',
    lineHeight: 17,
    marginBottom: 6,
  },
  methodFeeTag: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748B',
  },
  stepBlock: {
    marginBottom: 16,
  },
  stepBlockHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  stepBlockTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 10,
  },
  addAddressLink: {
    fontSize: 13,
    fontWeight: '700',
    color: '#00B894',
  },
  addressCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    borderRadius: 10,
    padding: 12,
    marginBottom: 10,
    backgroundColor: '#FFFFFF',
  },
  addressCardActive: {
    borderColor: '#00B894',
    backgroundColor: '#F0FDF9',
  },
  addressTagText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 2,
  },
  addressLineText: {
    fontSize: 12,
    color: '#64748B',
  },
  centreSelectCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    borderRadius: 10,
    padding: 12,
    marginBottom: 10,
    backgroundColor: '#FFFFFF',
  },
  centreSelectCardActive: {
    borderColor: '#00B894',
    backgroundColor: '#F0FDF9',
  },
  centreSelectName: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 2,
  },
  centreSelectAddress: {
    fontSize: 11,
    color: '#64748B',
    marginBottom: 3,
  },
  centreMetaRow: {
    flexDirection: 'row',
    gap: 6,
  },
  centreMetaText: {
    fontSize: 11,
    color: '#00B894',
    fontWeight: '600',
  },
  datePillsRow: {
    gap: 8,
    paddingVertical: 4,
  },
  datePill: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    minWidth: 60,
  },
  datePillActive: {
    borderColor: '#00B894',
    backgroundColor: '#00B894',
  },
  datePillDay: {
    fontSize: 10,
    fontWeight: '600',
    color: '#64748B',
    marginBottom: 2,
  },
  datePillDayActive: { color: '#FFFFFF' },
  datePillDate: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
  },
  datePillDateActive: { color: '#FFFFFF' },
  slotGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  slotCard: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    backgroundColor: '#FFFFFF',
    minWidth: 120,
    alignItems: 'center',
  },
  slotCardActive: {
    borderColor: '#00B894',
    backgroundColor: '#F0FDF9',
  },
  slotCardDisabled: {
    borderColor: '#E2E8F0',
    backgroundColor: '#F1F5F9',
    opacity: 0.65,
    cursor: 'not-allowed',
  },
  slotLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 2,
  },
  slotLabelActive: { color: '#00B894' },
  slotLabelDisabled: {
    color: '#94A3B8',
    textDecorationLine: 'line-through',
  },
  slotPeriod: {
    fontSize: 10,
    color: '#64748B',
  },
  slotPeriodDisabled: {
    color: '#EF4444',
    fontWeight: '700',
  },

  // ─── SUMMARY ─────────────────────────────────────────────────────
  summaryCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 16,
    marginBottom: 10,
  },
  summaryHeading: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 12,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  summaryLabel: {
    fontSize: 13,
    color: '#64748B',
  },
  summaryVal: {
    fontSize: 13,
    fontWeight: '600',
    color: '#0F172A',
    maxWidth: '55%',
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
    marginTop: 4,
  },
  summaryTotalLabel: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
  },
  summaryTotalVal: {
    fontSize: 18,
    fontWeight: '800',
    color: '#00B894',
  },

  // ─── PAYMENT ─────────────────────────────────────────────────────
  demoPaymentAlert: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EFF6FF',
    borderRadius: 10,
    padding: 12,
    gap: 8,
    marginBottom: 14,
  },
  demoPaymentAlertText: {
    fontSize: 12,
    color: '#1D4ED8',
    flex: 1,
  },
  paymentMethodCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    borderRadius: 10,
    padding: 14,
    marginBottom: 10,
    gap: 12,
    backgroundColor: '#FFFFFF',
  },
  paymentMethodCardActive: {
    borderColor: '#00B894',
    backgroundColor: '#F0FDF9',
  },
  paymentMethodLabel: {
    flex: 1,
    fontSize: 13,
    fontWeight: '600',
    color: '#0F172A',
  },
  paymentMethodLabelActive: { color: '#00B894' },
  stepBackBtn: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    backgroundColor: '#F8FAFC',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepBackBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#64748B',
  },

  // ─── CONFIRMED ───────────────────────────────────────────────────
  confirmedBox: {
    alignItems: 'center',
    paddingVertical: 24,
    paddingHorizontal: 16,
  },
  confirmedTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#0F172A',
    marginTop: 14,
    marginBottom: 6,
  },
  confirmedBookingId: {
    fontSize: 13,
    fontWeight: '700',
    color: '#00B894',
    marginBottom: 10,
  },
  confirmedDesc: {
    fontSize: 13,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 16,
  },
  viewBookingsConfirmedBtn: {
    backgroundColor: '#00B894',
    paddingHorizontal: 24,
    paddingVertical: 13,
    borderRadius: 12,
  },
  viewBookingsConfirmedBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },

  // ─── TRACKING ────────────────────────────────────────────────────
  trackingTestTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 16,
  },
  timelineContainer: {
    paddingLeft: 8,
  },
  timelineStepRow: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  timelineIconCol: {
    alignItems: 'center',
    width: 28,
  },
  timelineNode: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#CBD5E1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  timelineNodeDone: { backgroundColor: '#00B894' },
  timelineNodeCurr: { backgroundColor: '#0284C7' },
  timelineLine: {
    width: 2,
    flex: 1,
    backgroundColor: '#E2E8F0',
    marginTop: 2,
    minHeight: 20,
  },
  timelineLineDone: { backgroundColor: '#00B894' },
  timelineTextCol: {
    flex: 1,
    marginLeft: 10,
    paddingBottom: 16,
  },
  timelineStepTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 2,
  },
  timelineStepTitleCurr: { color: '#0284C7' },
  timelineStepDesc: {
    fontSize: 11,
    color: '#64748B',
  },

  // ─── REPORT VIEWER ───────────────────────────────────────────────
  reportModalTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 2,
  },
  reportModalSub: {
    fontSize: 12,
    color: '#64748B',
  },
  reportPatientCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    padding: 14,
    marginBottom: 14,
  },
  reportPatientRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  repPatientLabel: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '600',
  },
  repPatientVal: {
    fontSize: 12,
    color: '#0F172A',
    fontWeight: '700',
    maxWidth: '60%',
    textAlign: 'right',
  },
  tableHeading: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 8,
  },
  paramsTable: {
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 10,
    overflow: 'hidden',
    marginBottom: 14,
  },
  paramsTableHeader: {
    flexDirection: 'row',
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  paramsTableColHeader: {
    fontSize: 11,
    fontWeight: '700',
    color: '#475569',
  },
  paramTableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  paramNameText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0F172A',
  },
  paramUnitText: {
    fontSize: 10,
    color: '#94A3B8',
  },
  paramUnitSub: {
    fontSize: 10,
    color: '#94A3B8',
  },
  paramResultText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#00B894',
  },
  paramRefText: {
    fontSize: 11,
    color: '#64748B',
    textAlign: 'right',
  },
  conclusionCard: {
    backgroundColor: '#FFFBEB',
    borderRadius: 10,
    padding: 14,
    marginBottom: 10,
  },
  conclusionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#92400E',
    marginBottom: 4,
  },
  conclusionText: {
    fontSize: 12,
    color: '#78350F',
    lineHeight: 18,
  },
  reportModalFooter: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  reportDownloadModalBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 11,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: '#00B894',
    backgroundColor: '#F0FDF9',
  },
  reportDownloadModalBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#00B894',
  },
  reportMyHealthBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 11,
    borderRadius: 10,
    backgroundColor: '#00B894',
  },
  reportMyHealthBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },

  // ─── ADD ADDRESS ─────────────────────────────────────────────────
  addAddressTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 14,
  },
  tagToggleRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 14,
  },
  tagToggleBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    backgroundColor: '#F8FAFC',
  },
  tagToggleBtnActive: {
    borderColor: '#00B894',
    backgroundColor: '#F0FDF9',
  },
  tagToggleText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748B',
  },
  tagToggleTextActive: { color: '#00B894' },
  addressInput: {
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    color: '#0F172A',
    backgroundColor: '#F8FAFC',
    marginBottom: 10,
  },
  addAddressBtnRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 6,
  },
  cancelAddressBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
  },
  cancelAddressBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#64748B',
  },
  saveAddressBtn: {
    flex: 1.5,
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: '#00B894',
    alignItems: 'center',
  },
  saveAddressBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },

  // ─── TOAST ───────────────────────────────────────────────────────
  downloadToast: {
    position: 'absolute',
    bottom: 24,
    left: '50%',
    transform: [{ translateX: -130 }],
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#1E3A8A',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    width: 260,
    shadowColor: '#1E3A8A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 10,
  },
  downloadToastText: {
    fontSize: 13,
    color: '#FFFFFF',
    fontWeight: '600',
    flex: 1,
  },

  // ─── MANUAL ADDRESS FORM ───────────────────────────────────────
  manualAddressHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  manualAddressSubtitle: {
    fontSize: 12,
    color: '#64748B',
    marginBottom: 14,
  },
  addressFieldLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1E3A8A',
    marginBottom: 5,
    marginTop: 10,
  },
  addressFieldInput: {
    borderWidth: 1.5,
    borderColor: '#DCE7EC',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 11,
    fontSize: 14,
    color: '#1E3A8A',
    backgroundColor: '#FAFCFD',
  },
  addressRowFields: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 2,
  },

  // ─── PARTNER DIAGNOSTIC CENTRES SECTION ────────────────────────────
  webCentresSectionWrap: {
    marginTop: 40,
    marginBottom: 20,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 28,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    ...(Platform.OS === 'web' ? { boxShadow: '0 8px 24px -4px rgba(0, 0, 0, 0.05)' } : {}),
  },
  webSectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 24,
    flexWrap: 'wrap',
    gap: 12,
  },
  webSectionSubtitle: {
    fontSize: 13.5,
    color: '#64748B',
    marginTop: 4,
    maxWidth: 620,
    lineHeight: 20,
  },
  webLocationBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#ECFDF5',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  webLocationBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#059669',
  },
  webCentresGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 20,
  },
  webCentreCard: {
    flex: 1,
    minWidth: 320,
    maxWidth: 580,
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    ...(Platform.OS === 'web' ? { boxShadow: '0 4px 12px rgba(0,0,0,0.03)' } : {}),
  },
  webCentreCardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  webCentreIconBox: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: '#ECFDF5',
    borderWidth: 1,
    borderColor: '#A7F3D0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  webCentreName: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
    lineHeight: 20,
  },
  webCentreLocation: {
    fontSize: 12,
    fontWeight: '600',
    color: '#00B894',
  },
  webCentreAddressBox: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 12,
  },
  webCentreAddressLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748B',
    marginBottom: 2,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  webCentreAddressText: {
    fontSize: 12.5,
    color: '#334155',
    lineHeight: 18,
  },
  webCentreMetaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  webCentreMetaPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FFFFFF',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  webCentreMetaPillText: {
    fontSize: 11.5,
    fontWeight: '600',
    color: '#475569',
  },
  webCentreServicesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 16,
  },
  webCentreServiceTag: {
    backgroundColor: '#F0FDF4',
    paddingVertical: 3,
    paddingHorizontal: 7,
    borderRadius: 5,
    borderWidth: 1,
    borderColor: '#DCFCE7',
  },
  webCentreServiceTagText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#15803D',
  },
  webCentreActionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 'auto',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
  },
  webCentreDirectionsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#00B894',
    paddingVertical: 9,
    paddingHorizontal: 14,
    borderRadius: 8,
    ...(Platform.OS === 'web' ? { boxShadow: '0 2px 6px rgba(0, 184, 148, 0.25)' } : {}),
  },
  webCentreDirectionsBtnText: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  webCentreBookBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#00B894',
    paddingVertical: 9,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  webCentreBookBtnText: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#00B894',
  },
  centreCardActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  modalGetDirectionsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ECFDF5',
    borderWidth: 1,
    borderColor: '#A7F3D0',
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 6,
  },
  modalGetDirectionsBtnText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#059669',
  },
});

export default LabTestsScreenWeb;
