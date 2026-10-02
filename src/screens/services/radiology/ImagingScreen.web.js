import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  Image,
  ScrollView,
  TextInput,
  useWindowDimensions,
  Platform,
  Modal,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import colors from '../../../theme/colors';
import { showAlert } from '../../../utils/alert';
import WebFooter from '../../../components/web/WebFooter';
import {
  RADIOLOGY_CATEGORIES,
  RADIOLOGY_TESTS,
  RADIOLOGY_PROVIDERS,
  INITIAL_RADIOLOGY_BOOKINGS,
  RADIOLOGY_3D_ICONS,
  getTestsByCategory,
  getCategoryById,
  getTestById,
  getProvidersForTest,
  RADIOLOGY_CENTRES_FILTERED,
} from '../../../data/radiologyCatalogData';
import {
  getSlotStatus,
  validateAndBookSlot,
  cancelBookedSlot,
  subscribeToSlotChanges,
} from '../../../services/slotBookingService';

const ASYNC_STORAGE_KEY = '@mediunify_radiology_bookings';

// Mock Patient Directory
const DEFAULT_PATIENTS = [
  { id: 'pat-self', name: 'User Profile', relation: 'Self', age: 28, gender: 'Male', phone: '' },
];

const CITIES = ['Mysuru', 'Bengaluru', 'Hassan', 'All Cities'];

const POPULAR_SEARCH_CHIPS = [
  'MRI Brain',
  'CT Chest',
  '2D Echo',
  'Ultrasound Abdomen',
  'Digital X-Ray Chest',
  'HRCT Chest',
  'Mammography',
  '12-Lead ECG',
];

export default function ImagingScreenWeb({ navigation, route }) {
  const { width } = useWindowDimensions();
  const isDesktop = width >= 1024;
  const isTablet = width >= 768 && width < 1024;
  const isMobile = width < 768;

  const mainScrollRef = useRef(null);

  // ==================================================
  // PRIMARY NAVIGATION STATE MACHINE
  // 'categories' | 'tests' | 'providers' | 'booking' | 'payment' | 'confirmation' | 'my-bookings'
  // ==================================================
  const [viewMode, setViewMode] = useState('categories');
  const [selectedCity, setSelectedCity] = useState('Mysuru');
  const [globalSearch, setGlobalSearch] = useState('');

  // Selected Entities
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [selectedTest, setSelectedTest] = useState(null);
  const [selectedProvider, setSelectedProvider] = useState(null);

  // Filters & Sorting in Provider List
  const [sortBy, setSortBy] = useState('price-low'); // 'price-low' | 'price-high' | 'distance' | 'rating' | 'earliest'
  const [filterRating, setFilterRating] = useState(0); // 0 or 4.5
  const [filterOpen24x7, setFilterOpen24x7] = useState(false);
  const [filterCashless, setFilterCashless] = useState(false);
  const [providerSearch, setProviderSearch] = useState('');
  const [maxDistance, setMaxDistance] = useState(50); // km

  // Booking Wizard State
  const [bookingStep, setBookingStep] = useState(1); // 1: Patient, 2: Date & Slot, 3: Review
  const [patientsList, setPatientsList] = useState(DEFAULT_PATIENTS);
  const [selectedPatient, setSelectedPatient] = useState(DEFAULT_PATIENTS[0]);
  const [showAddPatientForm, setShowAddPatientForm] = useState(false);
  const [newPatient, setNewPatient] = useState({ name: '', relation: 'Family', age: '', gender: 'Male', phone: '' });

  // Date & Slot
  const [selectedDateIndex, setSelectedDateIndex] = useState(0); // 0 = Today, 1 = Tomorrow, etc.
  const [selectedTimeSlot, setSelectedTimeSlot] = useState('');

  // Real-time slot update ticker
  const [slotRefreshTick, setSlotRefreshTick] = useState(0);
  useEffect(() => {
    const unsub = subscribeToSlotChanges(() => {
      setSlotRefreshTick((t) => t + 1);
    });
    return unsub;
  }, []);

  const getFirstAvailableSlot = (dateIso, providerId, preferredSlot = null) => {
    const allSlots = [
      '08:30 AM', '09:30 AM', '10:30 AM', '11:30 AM',
      '12:30 PM', '01:30 PM', '02:30 PM', '03:30 PM',
      '04:30 PM', '05:30 PM', '06:30 PM', '07:30 PM',
    ];
    if (preferredSlot) {
      const prefStatus = getSlotStatus({
        date: dateIso,
        time: preferredSlot,
        serviceType: 'radiology',
        providerId,
      });
      if (prefStatus.available) return preferredSlot;
    }
    for (const s of allSlots) {
      const st = getSlotStatus({
        date: dateIso,
        time: s,
        serviceType: 'radiology',
        providerId,
      });
      if (st.available) return s;
    }
    return '';
  };

  // Payment State
  const [paymentMethod, setPaymentMethod] = useState('upi'); // 'upi' | 'card' | 'netbanking' | 'pay_at_centre'
  const [upiId, setUpiId] = useState('');
  const [cardNumber, setCardNumber] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvv, setCardCvv] = useState('');
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);

  // Confirmed Order
  const [latestBooking, setLatestBooking] = useState(null);

  // My Bookings
  const [userBookings, setUserBookings] = useState([]);
  const [myBookingsTab, setMyBookingsTab] = useState('Upcoming'); // 'Upcoming' | 'Completed' | 'Cancelled'

  // Modals
  const [testDetailsModal, setTestDetailsModal] = useState(null);
  const [reportModal, setReportModal] = useState(null);
  const [receiptModal, setReceiptModal] = useState(null);
  const [rescheduleModal, setRescheduleModal] = useState(null);
  const [rescheduleDateIndex, setRescheduleDateIndex] = useState(0);
  const [rescheduleSlot, setRescheduleSlot] = useState('');

  // Load Bookings & User Info from Storage on Mount
  useEffect(() => {
    loadBookingsFromStorage();
    loadUserData();
  }, []);

  const loadUserData = async () => {
    try {
      const storedPrimary = await AsyncStorage.getItem('@unnathi_primary_user');
      const storedUser = await AsyncStorage.getItem('user');
      const storedName = await AsyncStorage.getItem('userName');
      const storedPhone = await AsyncStorage.getItem('userPhone');

      let userName = '';
      let userPhone = storedPhone || '';
      let userAge = 28;
      let userGender = 'Male';

      if (storedPrimary) {
        try {
          const p = JSON.parse(storedPrimary);
          if (p?.name && p.name.trim()) userName = p.name.replace(/\s*\(Self\)$/i, '').trim();
          if (p?.phone && p.phone.trim()) userPhone = p.phone.trim();
          if (p?.age) userAge = parseInt(p.age, 10) || 28;
          if (p?.gender) userGender = p.gender;
        } catch (e) {}
      }
      if (!userName && storedUser) {
        try {
          const u = JSON.parse(storedUser);
          if (u?.name && u.name.trim()) userName = u.name.replace(/\s*\(Self\)$/i, '').trim();
          if (u?.phone && u.phone.trim()) userPhone = u.phone.trim();
          if (u?.age) userAge = parseInt(u.age, 10) || 28;
          if (u?.gender) userGender = u.gender;
        } catch (e) {}
      }
      if (!userName && storedName && storedName.trim()) {
        userName = storedName.replace(/\s*\(Self\)$/i, '').trim();
      }

      const effectiveName = userName || 'User Profile';
      const selfPat = {
        id: 'pat-self',
        name: effectiveName,
        relation: 'Self',
        age: userAge,
        gender: userGender,
        phone: userPhone || '',
      };

      const storedEmail = await AsyncStorage.getItem('userEmail');
      const userKey = (storedEmail || userPhone || effectiveName).toLowerCase().replace(/[^a-z0-9]/g, '_');
      const userFamKey = `@unnathi_family_members_${userKey}`;
      const savedUserFam = await AsyncStorage.getItem(userFamKey);
      let familyList = [];

      if (savedUserFam) {
        try {
          const parsed = JSON.parse(savedUserFam);
          if (Array.isArray(parsed) && parsed.length > 0) familyList = parsed;
        } catch (e) {}
      }

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

      const otherPats = (Array.isArray(familyList) && familyList.length > 0)
        ? familyList
            .filter(m => m && m.id !== 'self' && m.relation !== 'Self' && !m.isPrimary)
            .map((m, idx) => ({
              id: m.id || `pat-${idx + 2}`,
              name: (m.name || m.displayName || 'Family Member').replace(/\s*\(.*?\)$/, '').trim(),
              relation: m.relation || 'Family',
              age: parseInt(m.age, 10) || 30,
              gender: m.gender || 'Female',
              phone: m.phone || userPhone || '',
            }))
        : [];

      const list = [selfPat, ...otherPats];
      setPatientsList(list);
      setSelectedPatient(selfPat);
    } catch (e) {
      console.warn('[ImagingScreenWeb] Error loading user data:', e);
    }
  };

  const loadBookingsFromStorage = async () => {
    try {
      const stored = await AsyncStorage.getItem(ASYNC_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setUserBookings(parsed);
          return;
        }
      }
      // Initialize with default mock data
      setUserBookings(INITIAL_RADIOLOGY_BOOKINGS);
      await AsyncStorage.setItem(ASYNC_STORAGE_KEY, JSON.stringify(INITIAL_RADIOLOGY_BOOKINGS));
    } catch (e) {
      setUserBookings(INITIAL_RADIOLOGY_BOOKINGS);
    }
  };

  const saveBookingsToStorage = async (newList) => {
    try {
      setUserBookings(newList);
      await AsyncStorage.setItem(ASYNC_STORAGE_KEY, JSON.stringify(newList));
    } catch (e) {}
  };

  // Sync route params
  useEffect(() => {
    if (route?.params?.initialCategory) {
      const cat = getCategoryById(route.params.initialCategory);
      if (cat) {
        setSelectedCategory(cat);
        setViewMode('tests');
      }
    }
    if (route?.params?.initialView === 'my-bookings') {
      setViewMode('my-bookings');
    }
  }, [route?.params]);

  // Generate Next 7 Days for Slot Picking
  const appointmentDays = useMemo(() => {
    const days = [];
    const today = new Date();
    for (let i = 0; i < 7; i++) {
      const d = new Date(today);
      d.setDate(today.getDate() + i);
      const isToday = i === 0;
      const isTomorrow = i === 1;
      const dayName = isToday ? 'Today' : isTomorrow ? 'Tomorrow' : d.toLocaleDateString('en-US', { weekday: 'short' });
      const dateNum = d.getDate();
      const monthName = d.toLocaleDateString('en-US', { month: 'short' });
      const fullLabel = d.toLocaleDateString('en-US', { weekday: 'long', day: 'numeric', month: 'short', year: 'numeric' });
      const isoDate = d.toISOString().split('T')[0];
      days.push({
        index: i,
        dayName,
        dateNum,
        monthName,
        fullLabel,
        isoDate,
      });
    }
    return days;
  }, []);

  // Scroll to top on view changes
  const scrollToTop = () => {
    if (mainScrollRef.current) {
      try {
        mainScrollRef.current.scrollTo({ y: 0, animated: true });
      } catch (e) {}
    }
    if (typeof window !== 'undefined') {
      try {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } catch (e) {}
    }
  };

  // Switch View Helper
  const navigateToView = (newView) => {
    setViewMode(newView);
    scrollToTop();
  };

  // --------------------------------------------------
  // 1. CATEGORY CLICK -> SHOW TESTS
  // --------------------------------------------------
  const handleSelectCategory = (category) => {
    setSelectedCategory(category);
    setSelectedTest(null);
    setSelectedProvider(null);
    navigateToView('tests');
  };

  // --------------------------------------------------
  // 2. TEST CLICK -> SHOW PROVIDERS
  // --------------------------------------------------
  const handleSelectTest = (test) => {
    setSelectedTest(test);
    setSelectedProvider(null);
    navigateToView('providers');
  };

  // --------------------------------------------------
  // 3. BOOK PROVIDER CLICK -> OPEN BOOKING WIZARD
  // --------------------------------------------------
  const handleStartBooking = (provider, test = null) => {
    const activeTest = test || selectedTest || getTestsByCategory(selectedCategory?.id)[0];
    setSelectedTest(activeTest);
    setSelectedProvider(provider);
    setBookingStep(1);
    setSelectedDateIndex(0);
    // Auto pick first available slot for today
    const chosenDay = appointmentDays[0] || { isoDate: new Date().toISOString().split('T')[0] };
    const preferred = (provider.availableSlots && provider.availableSlots[0]) || '10:00 AM';
    const validSlot = getFirstAvailableSlot(chosenDay.isoDate, provider.id, preferred);
    setSelectedTimeSlot(validSlot);
    navigateToView('booking');
  };

  // --------------------------------------------------
  // 4. ADD NEW PATIENT
  // --------------------------------------------------
  const handleAddNewPatient = () => {
    if (!newPatient.name.trim()) {
      showAlert('Required', 'Please enter patient full name.');
      return;
    }
    if (!newPatient.age || isNaN(newPatient.age)) {
      showAlert('Required', 'Please enter a valid age.');
      return;
    }
    const created = {
      id: `pat-${Date.now()}`,
      name: newPatient.name.trim(),
      relation: newPatient.relation || 'Family',
      age: parseInt(newPatient.age, 10),
      gender: newPatient.gender || 'Male',
      phone: newPatient.phone.trim() || selectedPatient.phone,
    };
    const updated = [...patientsList, created];
    setPatientsList(updated);
    setSelectedPatient(created);
    setShowAddPatientForm(false);
    setNewPatient({ name: '', relation: 'Family', age: '', gender: 'Male', phone: '' });
  };

  // --------------------------------------------------
  // 5. PROCEED TO PAYMENT
  // --------------------------------------------------
  const handleProceedToPayment = () => {
    if (!selectedPatient) {
      showAlert('Patient Missing', 'Please select a patient.');
      return;
    }
    if (!selectedTimeSlot) {
      showAlert('Slot Missing', 'Please select an appointment time slot.');
      return;
    }
    const chosenDay = appointmentDays[selectedDateIndex] || appointmentDays[0];
    const status = getSlotStatus({
      date: chosenDay.isoDate,
      time: selectedTimeSlot,
      serviceType: 'radiology',
      providerId: selectedProvider?.id,
    });
    if (!status.available) {
      showAlert('Slot Unavailable', 'This slot is no longer available. Please select another time.');
      return;
    }
    navigateToView('payment');
  };

  // --------------------------------------------------
  // 6. PROCESS PAYMENT & CONFIRM
  // --------------------------------------------------
  const handleExecutePayment = async () => {
    const chosenDay = appointmentDays[selectedDateIndex] || appointmentDays[0];
    const slotValidation = await validateAndBookSlot({
      date: chosenDay.isoDate,
      time: selectedTimeSlot,
      serviceType: 'radiology',
      providerId: selectedProvider?.id || selectedProvider?.name,
      bookingDetails: {
        testName: selectedTest?.name,
        patientName: selectedPatient?.name,
      },
    });

    if (!slotValidation.success) {
      showAlert('Slot Unavailable', slotValidation.message || 'This slot is no longer available. Please select another time.');
      return;
    }

    setIsProcessingPayment(true);

    setTimeout(async () => {
      setIsProcessingPayment(false);

      const chosenDay = appointmentDays[selectedDateIndex] || appointmentDays[0];
      const basePrice = selectedTest.mrp || 3000;
      const finalPrice = Math.round(selectedTest.typicalPrice * selectedProvider.discountMultiplier);
      const discountAmount = basePrice - finalPrice;

      const randomSuffix = Math.floor(10000 + Math.random() * 90000);
      const cityPrefix = (selectedCity.slice(0, 3) || 'MYS').toUpperCase();
      const bookingId = `RAD-${cityPrefix}-${randomSuffix}`;
      const isSelf = selectedPatient.relation === 'Self' || selectedPatient.id === 'pat-self';
      const patientDisplayName = `${selectedPatient.name} (${selectedPatient.relation || 'Self'})`;
      const familyName = !isSelf ? selectedPatient.name : '';

      const newBookingRecord = {
        id: bookingId,
        bookingRef: bookingId,
        testName: selectedTest.name,
        bookingType: 'Radiology',
        modality: 'Radiology & Scans',
        modalityType: (selectedCategory?.name ? selectedCategory.name.split(' ')[0] : 'Radiology') || 'Radiology',
        testCategory: selectedCategory?.name || 'Radiology Scan',
        categoryLabel: selectedCategory?.name || 'Radiology Scan',
        testType: 'Centre Visit',
        providerName: selectedProvider.name,
        centerName: selectedProvider.name,
        department: 'Department of Radiology & Advanced Imaging',
        providerAddress: `${selectedProvider.area}, ${selectedProvider.city}`,
        address: `${selectedProvider.area}, ${selectedProvider.city}`,
        location: `${selectedProvider.area}, ${selectedProvider.city}`,
        patientId: isSelf ? 'self' : (selectedPatient.id || 'fam'),
        patientName: patientDisplayName,
        familyMemberName: familyName,
        patientAge: selectedPatient.age,
        patientGender: selectedPatient.gender,
        patientPhone: selectedPatient.phone,
        date: chosenDay.isoDate,
        appointmentDate: chosenDay.fullLabel || chosenDay.isoDate,
        formattedDate: chosenDay.fullLabel,
        timeSlot: selectedTimeSlot,
        basePrice,
        discountAmount,
        price: finalPrice,
        paidAmount: finalPrice,
        paymentStatus: paymentMethod === 'pay_at_centre' ? 'Pay at Centre' : `Paid Online (${paymentMethod.toUpperCase()})`,
        bookingStatus: 'Confirmed',
        status: 'Scan Scheduled',
        reportStatus: 'Scheduled',
        bookingDate: new Date().toISOString().split('T')[0],
        instructions: selectedTest.preparation || 'Wear loose comfortable clothing without metal fasteners or jewelry.',
        doctorPrescription: 'Diagnostic Radiologist Referral',
        contactPhone: selectedPatient.phone || '+91 80 4342 0100',
        canReschedule: true,
        canCancel: true,
      };

      const updated = [newBookingRecord, ...userBookings];
      await saveBookingsToStorage(updated);

      // Save to @mediunify_patient_booked_tests for My Tests screen
      try {
        const storedRaw = await AsyncStorage.getItem('@mediunify_patient_booked_tests');
        const existingList = storedRaw ? JSON.parse(storedRaw) : [];
        const nextList = [newBookingRecord, ...(Array.isArray(existingList) ? existingList : [])];
        await AsyncStorage.setItem('@mediunify_patient_booked_tests', JSON.stringify(nextList));
      } catch (e) {}

      // Save to @radiologyBookings & radiologyBookings
      for (const k of ['@radiologyBookings', 'radiologyBookings']) {
        try {
          const exRaw = await AsyncStorage.getItem(k);
          const exList = exRaw ? JSON.parse(exRaw) : [];
          const nList = [newBookingRecord, ...(Array.isArray(exList) ? exList : [])];
          await AsyncStorage.setItem(k, JSON.stringify(nList));
        } catch (e) {}
      }

      // Save to @unnathi_appointments for global appointments
      try {
        const apptRaw = await AsyncStorage.getItem('@unnathi_appointments');
        const existingAppts = apptRaw ? JSON.parse(apptRaw) : [];
        const newAppt = {
          id: bookingId,
          type: 'radiology',
          serviceType: 'Radiology Scan',
          testName: selectedTest.name,
          bookingType: 'Radiology',
          facilityName: selectedProvider.name,
          date: chosenDay.isoDate,
          day: chosenDay.fullLabel,
          time: selectedTimeSlot,
          timeSlot: selectedTimeSlot,
          patientName: patientDisplayName,
          patient: { name: selectedPatient.name, relation: selectedPatient.relation, age: selectedPatient.age, gender: selectedPatient.gender },
          amount: finalPrice,
          status: 'Confirmed',
          paymentStatus: newBookingRecord.paymentStatus,
        };
        await AsyncStorage.setItem('@unnathi_appointments', JSON.stringify([newAppt, ...(Array.isArray(existingAppts) ? existingAppts : [])]));
      } catch (e) {}

      setLatestBooking(newBookingRecord);
      navigateToView('confirmation');
    }, 1200);
  };

  // --------------------------------------------------
  // 7. CANCEL BOOKING
  // --------------------------------------------------
  const handleCancelBooking = async (bookingId) => {
    const targetBooking = userBookings.find((b) => b.id === bookingId);
    if (targetBooking) {
      cancelBookedSlot({
        date: targetBooking.date || targetBooking.appointmentDate,
        time: targetBooking.timeSlot || targetBooking.time,
        serviceType: 'radiology',
        providerId: targetBooking.providerName || targetBooking.centerName,
      });
    }

    const updated = userBookings.map((b) => {
      if (b.id === bookingId) {
        return {
          ...b,
          bookingStatus: 'Cancelled',
          status: 'Cancelled',
          reportStatus: 'Cancelled by patient',
          canReschedule: false,
          canCancel: false,
          paymentStatus: b.paymentStatus.includes('Paid Online') ? `Refunded (₹${b.paidAmount})` : 'Cancelled',
        };
      }
      return b;
    });
    await saveBookingsToStorage(updated);

    // Sync cancelled status with @mediunify_patient_booked_tests
    try {
      const storedRaw = await AsyncStorage.getItem('@mediunify_patient_booked_tests');
      if (storedRaw) {
        const existing = JSON.parse(storedRaw);
        if (Array.isArray(existing)) {
          const synced = existing.map(item => item.id === bookingId ? { ...item, status: 'Cancelled', bookingStatus: 'Cancelled', canReschedule: false, canCancel: false } : item);
          await AsyncStorage.setItem('@mediunify_patient_booked_tests', JSON.stringify(synced));
        }
      }
    } catch (e) {}

    showAlert('Booking Cancelled', `Appointment #${bookingId} has been successfully cancelled. Refund has been initiated.`);
  };

  // --------------------------------------------------
  // 8. RESCHEDULE BOOKING
  // --------------------------------------------------
  const handleOpenReschedule = (booking) => {
    setRescheduleModal(booking);
    setRescheduleDateIndex(1);
    setRescheduleSlot(booking.timeSlot || '10:00 AM');
  };

  const handleConfirmReschedule = async () => {
    if (!rescheduleModal) return;
    const chosenDay = appointmentDays[rescheduleDateIndex] || appointmentDays[1];

    const bookValidation = await validateAndBookSlot({
      date: chosenDay.isoDate,
      time: rescheduleSlot,
      serviceType: 'radiology',
      providerId: rescheduleModal.centerName || rescheduleModal.providerName,
      bookingDetails: {
        testName: rescheduleModal.testName,
        patientName: rescheduleModal.patientName,
      },
    });

    if (!bookValidation.success) {
      showAlert('Slot Unavailable', bookValidation.message || 'This slot is no longer available. Please select another time.');
      return;
    }

    cancelBookedSlot({
      date: rescheduleModal.date || rescheduleModal.appointmentDate,
      time: rescheduleModal.timeSlot,
      serviceType: 'radiology',
      providerId: rescheduleModal.centerName || rescheduleModal.providerName,
    });

    const updated = userBookings.map((b) => {
      if (b.id === rescheduleModal.id) {
        return {
          ...b,
          date: chosenDay.isoDate,
          appointmentDate: chosenDay.fullLabel,
          formattedDate: chosenDay.fullLabel,
          timeSlot: rescheduleSlot,
        };
      }
      return b;
    });
    await saveBookingsToStorage(updated);

    // Sync reschedule with @mediunify_patient_booked_tests
    try {
      const storedRaw = await AsyncStorage.getItem('@mediunify_patient_booked_tests');
      if (storedRaw) {
        const existing = JSON.parse(storedRaw);
        if (Array.isArray(existing)) {
          const synced = existing.map(item => item.id === rescheduleModal.id ? { ...item, date: chosenDay.isoDate, appointmentDate: chosenDay.fullLabel, formattedDate: chosenDay.fullLabel, timeSlot: rescheduleSlot } : item);
          await AsyncStorage.setItem('@mediunify_patient_booked_tests', JSON.stringify(synced));
        }
      }
    } catch (e) {}

    setRescheduleModal(null);
    showAlert('Rescheduled!', `Appointment rescheduled to ${chosenDay.fullLabel} at ${rescheduleSlot}.`);
  };

  // --------------------------------------------------
  // FILTERED DATA HELPERS
  // --------------------------------------------------
  // Filtered categories for main view
  const displayedCategories = useMemo(() => {
    if (!globalSearch.trim()) return RADIOLOGY_CATEGORIES;
    const q = globalSearch.toLowerCase().trim();
    return RADIOLOGY_CATEGORIES.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.description.toLowerCase().includes(q) ||
        c.tagline.toLowerCase().includes(q)
    );
  }, [globalSearch]);

  // Filtered tests in active category
  const displayedTests = useMemo(() => {
    if (!selectedCategory) return [];
    let list = getTestsByCategory(selectedCategory.id);
    if (globalSearch.trim()) {
      const q = globalSearch.toLowerCase().trim();
      list = list.filter(
        (t) =>
          t.name.toLowerCase().includes(q) ||
          t.summary.toLowerCase().includes(q) ||
          t.purpose.toLowerCase().includes(q)
      );
    }
    return list;
  }, [selectedCategory, globalSearch]);

  // Filtered providers for active test
  const displayedProviders = useMemo(() => {
    if (!selectedTest) return [];
    let list = getProvidersForTest(selectedTest, selectedCity);

    // Search filter
    if (providerSearch.trim()) {
      const q = providerSearch.toLowerCase().trim();
      list = list.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.area.toLowerCase().includes(q) ||
          p.city.toLowerCase().includes(q)
      );
    }

    // Rating filter
    if (filterRating > 0) {
      list = list.filter((p) => p.rating >= filterRating);
    }

    // Open 24x7 filter
    if (filterOpen24x7) {
      list = list.filter((p) => p.openHours && p.openHours.toLowerCase().includes('24x7'));
    }

    // Cashless filter
    if (filterCashless) {
      list = list.filter((p) => p.cashlessSupported);
    }

    // Distance filter
    list = list.filter((p) => parseFloat(p.distance) <= maxDistance);

    // Sorting
    list.sort((a, b) => {
      if (sortBy === 'price-low') return a.price - b.price;
      if (sortBy === 'price-high') return b.price - a.price;
      if (sortBy === 'rating') return b.rating - a.rating;
      if (sortBy === 'distance') return parseFloat(a.distance) - parseFloat(b.distance);
      if (sortBy === 'earliest') return (a.availableSlots[0] || '').localeCompare(b.availableSlots[0] || '');
      return 0;
    });

    return list;
  }, [selectedTest, selectedCity, providerSearch, filterRating, filterOpen24x7, filterCashless, maxDistance, sortBy]);

  // Filtered My Bookings
  const displayedUserBookings = useMemo(() => {
    return userBookings.filter((b) => {
      if (myBookingsTab === 'Upcoming') return b.bookingStatus === 'Confirmed';
      if (myBookingsTab === 'Completed') return b.bookingStatus === 'Completed';
      if (myBookingsTab === 'Cancelled') return b.bookingStatus === 'Cancelled';
      return true;
    });
  }, [userBookings, myBookingsTab]);

  return (
    <SafeAreaView style={styles.safeContainer}>
      <ScrollView
        ref={mainScrollRef}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ============================================================
            GLOBAL HEADER HERO & BREADCRUMB
        ============================================================ */}
        <View
          style={[
            styles.heroBannerWrap,
            Platform.OS === 'web'
              ? {
                  backgroundImage:
                    'linear-gradient(135deg, #E0F2FE 0%, #E6F8F2 50%, #F0FDF4 100%)',
                }
              : { backgroundColor: '#E0F2FE' },
          ]}
        >
          <View style={styles.heroInnerContainer}>
            {/* Top Navigation Row: Breadcrumb & Utility Links */}
            <View style={styles.topNavRow}>
              <View style={styles.breadcrumbTrail}>
                <TouchableOpacity
                  onPress={() => navigation?.navigate('Home')}
                  style={styles.crumbTouch}
                  activeOpacity={0.7}
                >
                  <Ionicons name="home-outline" size={14} color="#0369A1" />
                  <Text style={styles.crumbLink}>Home</Text>
                </TouchableOpacity>

                <Ionicons name="chevron-forward" size={12} color="#64748B" />

                <TouchableOpacity
                  onPress={() => navigateToView('categories')}
                  style={styles.crumbTouch}
                  activeOpacity={0.7}
                >
                  <Text
                    style={[
                      styles.crumbLink,
                      viewMode === 'categories' && styles.crumbActive,
                    ]}
                  >
                    Radiology
                  </Text>
                </TouchableOpacity>

                {selectedCategory && viewMode !== 'categories' && (
                  <>
                    <Ionicons name="chevron-forward" size={12} color="#64748B" />
                    <TouchableOpacity
                      onPress={() => navigateToView('tests')}
                      style={styles.crumbTouch}
                      activeOpacity={0.7}
                    >
                      <Text
                        style={[
                          styles.crumbLink,
                          viewMode === 'tests' && styles.crumbActive,
                        ]}
                      >
                        {selectedCategory.name}
                      </Text>
                    </TouchableOpacity>
                  </>
                )}

                {selectedTest && (viewMode === 'providers' || viewMode === 'booking' || viewMode === 'payment') && (
                  <>
                    <Ionicons name="chevron-forward" size={12} color="#64748B" />
                    <TouchableOpacity
                      onPress={() => navigateToView('providers')}
                      style={styles.crumbTouch}
                      activeOpacity={0.7}
                    >
                      <Text
                        style={[
                          styles.crumbLink,
                          viewMode === 'providers' && styles.crumbActive,
                        ]}
                      >
                        {selectedTest.name}
                      </Text>
                    </TouchableOpacity>
                  </>
                )}

                {viewMode === 'booking' && (
                  <>
                    <Ionicons name="chevron-forward" size={12} color="#64748B" />
                    <Text style={styles.crumbActive}>Book Appointment</Text>
                  </>
                )}

                {viewMode === 'payment' && (
                  <>
                    <Ionicons name="chevron-forward" size={12} color="#64748B" />
                    <Text style={styles.crumbActive}>Secure Payment</Text>
                  </>
                )}

                {viewMode === 'confirmation' && (
                  <>
                    <Ionicons name="chevron-forward" size={12} color="#64748B" />
                    <Text style={styles.crumbActive}>Confirmation</Text>
                  </>
                )}

                {viewMode === 'my-bookings' && (
                  <>
                    <Ionicons name="chevron-forward" size={12} color="#64748B" />
                    <Text style={styles.crumbActive}>My Radiology Bookings</Text>
                  </>
                )}
              </View>

              {/* Utility Badges: City Selector & My Bookings Button */}
              <View style={styles.topUtilityRow}>
                {/* City Selector */}
                <View style={styles.citySelectorPill}>
                  <Ionicons name="location-sharp" size={15} color="#00B894" />
                  <Text style={styles.cityLabel}>City:</Text>
                  <View style={styles.cityPillOptions}>
                    {CITIES.map((city) => (
                      <TouchableOpacity
                        key={city}
                        style={[
                          styles.cityOptionBtn,
                          selectedCity === city && styles.cityOptionBtnActive,
                        ]}
                        onPress={() => setSelectedCity(city)}
                        activeOpacity={0.8}
                      >
                        <Text
                          style={[
                            styles.cityOptionText,
                            selectedCity === city && styles.cityOptionTextActive,
                          ]}
                        >
                          {city}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>

                {/* My Bookings Quick Button */}
                <TouchableOpacity
                  style={[
                    styles.myBookingsHeaderBtn,
                    viewMode === 'my-bookings' && styles.myBookingsHeaderBtnActive,
                  ]}
                  onPress={() => {
                    if (navigation && navigation.navigate) {
                      navigation.navigate('MyTests', { initialTab: 'radiology' });
                    } else {
                      navigateToView('my-bookings');
                    }
                  }}
                  activeOpacity={0.8}
                >
                  <Ionicons
                    name="calendar-outline"
                    size={16}
                    color={viewMode === 'my-bookings' ? '#FFFFFF' : '#0369A1'}
                  />
                  <Text
                    style={[
                      styles.myBookingsHeaderBtnText,
                      viewMode === 'my-bookings' && styles.myBookingsHeaderBtnTextActive,
                    ]}
                  >
                    My Bookings
                  </Text>
                  {userBookings.length > 0 && (
                    <View style={styles.bookingCountBadge}>
                      <Text style={styles.bookingCountBadgeText}>{userBookings.length}</Text>
                    </View>
                  )}
                </TouchableOpacity>
              </View>
            </View>

            {/* Hero Main Titles & Search Bar */}
            <View style={styles.heroContentBlock}>
              <View style={styles.heroBadgeRow}>
                <View style={styles.accreditedTag}>
                  <Ionicons name="shield-checkmark" size={14} color="#00B894" />
                  <Text style={styles.accreditedTagText}>NABH & NABL Accredited Radiology Network</Text>
                </View>
                <View style={styles.pacsTag}>
                  <Ionicons name="document-text-outline" size={14} color="#0369A1" />
                  <Text style={styles.pacsTagText}>Digital PACS Portal + WhatsApp Report</Text>
                </View>
              </View>

              <Text style={styles.heroHeading}>
                Precision Radiology & Diagnostic Scans
              </Text>
              <Text style={styles.heroSubheading}>
                Book advanced 3T MRI, 128-Slice CT, 3D Ultrasound, Digital X-Ray & Cardiology Diagnostics in {selectedCity} with up to 25% MediUnify partner savings.
              </Text>

              {/* Integrated Search Bar */}
              <View style={styles.heroSearchBox}>
                <Ionicons name="search" size={20} color="#00B894" style={styles.searchIcon} />
                <TextInput
                  style={styles.heroSearchInput}
                  placeholder="Search by Scan Name (e.g. MRI Brain, CT Chest, 2D Echo, Ultrasound)..."
                  placeholderTextColor="#94A3B8"
                  value={globalSearch}
                  onChangeText={setGlobalSearch}
                />
                {globalSearch.length > 0 && (
                  <TouchableOpacity
                    onPress={() => setGlobalSearch('')}
                    style={styles.clearSearchBtn}
                  >
                    <Ionicons name="close-circle" size={18} color="#94A3B8" />
                  </TouchableOpacity>
                )}
              </View>

              {/* Popular Search Chips */}
              <View style={styles.popularChipsWrap}>
                <Text style={styles.popularChipsLabel}>Popular Scans:</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.popularChipsScroll}>
                  {POPULAR_SEARCH_CHIPS.map((chip) => (
                    <TouchableOpacity
                      key={chip}
                      style={styles.popularChipPill}
                      onPress={() => {
                        setGlobalSearch(chip);
                        // If on categories, search might reveal specific items
                      }}
                      activeOpacity={0.7}
                    >
                      <Text style={styles.popularChipText}>{chip}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            </View>
          </View>
        </View>

        {/* ============================================================
            MAIN CONTENT AREA BASED ON VIEW MODE
        ============================================================ */}
        <View style={styles.mainBodyContainer}>
          {/* VIEW 1: ALL 12 CATEGORIES (MAIN PAGE) */}
          {viewMode === 'categories' && (
            <View style={styles.sectionWrap}>
              <View style={styles.sectionHeaderRow}>
                <View>
                  <Text style={styles.sectionTitle}>Radiology Scan Categories</Text>
                  <Text style={styles.sectionSubtitle}>
                    Select an imaging category to browse all available scans, clinical guidelines & diagnostic centres
                  </Text>
                </View>
                <Text style={styles.categoryCountLabel}>
                  {displayedCategories.length} Categories Available
                </Text>
              </View>

              {/* Categories Grid (Responsive 4/3/2/1 cols) */}
              <View style={styles.categoriesGrid}>
                {displayedCategories.map((cat) => (
                  <TouchableOpacity
                    key={cat.id}
                    style={[
                      styles.categoryCard,
                      {
                        borderColor: cat.border || '#E2E8F0',
                      },
                    ]}
                    onPress={() => handleSelectCategory(cat)}
                    activeOpacity={0.88}
                  >
                    {/* Top Row: 3D Rendered Icon & Badge */}
                    <View style={styles.catCardTopRow}>
                      <View style={[styles.catIconWrap, { backgroundColor: cat.bg }]}>
                        {RADIOLOGY_3D_ICONS[cat.id] ? (
                          <Image
                            source={RADIOLOGY_3D_ICONS[cat.id]}
                            style={styles.cat3DIconImage}
                            resizeMode="cover"
                          />
                        ) : (
                          <Ionicons name={cat.icon} size={28} color={cat.color} />
                        )}
                      </View>
                      <View style={[styles.catBadgePill, { backgroundColor: cat.bg }]}>
                        <Text style={[styles.catBadgeText, { color: cat.color }]}>
                          {cat.badge}
                        </Text>
                      </View>
                    </View>

                    {/* Category Title & Tagline */}
                    <Text style={styles.catCardTitle}>{cat.name}</Text>
                    <Text style={styles.catCardTagline}>{cat.tagline}</Text>
                    <Text style={styles.catCardDescription} numberOfLines={3}>
                      {cat.description}
                    </Text>

                    {/* Bottom Row: Test Count & CTA */}
                    <View style={styles.catCardBottomRow}>
                      <View style={styles.catCountBadge}>
                        <Ionicons name="list-outline" size={14} color="#64748B" />
                        <Text style={styles.catCountText}>{cat.testCount} Tests</Text>
                      </View>
                      <View style={styles.catExploreBtn}>
                        <Text style={styles.catExploreBtnText}>View Tests</Text>
                        <Ionicons name="arrow-forward" size={14} color="#00B894" />
                      </View>
                    </View>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Quality & Trust Banner */}
              <View style={styles.trustHighlightsSection}>
                <View style={styles.trustItem}>
                  <View style={[styles.trustIconWrap, { backgroundColor: '#E0F2FE' }]}>
                    <Ionicons name="shield-checkmark" size={24} color="#0369A1" />
                  </View>
                  <View style={styles.trustTextCol}>
                    <Text style={styles.trustTitle}>Certified Radiologists</Text>
                    <Text style={styles.trustDesc}>All scans reviewed and dual-signed by MD/DNB certified radiologists.</Text>
                  </View>
                </View>

                <View style={styles.trustItem}>
                  <View style={[styles.trustIconWrap, { backgroundColor: '#ECFDF5' }]}>
                    <Ionicons name="flash" size={24} color="#00B894" />
                  </View>
                  <View style={styles.trustTextCol}>
                    <Text style={styles.trustTitle}>Fastest Turnaround</Text>
                    <Text style={styles.trustDesc}>Digital PACS reports delivered via WhatsApp and Patient Portal within 4-12 hrs.</Text>
                  </View>
                </View>

                <View style={styles.trustItem}>
                  <View style={[styles.trustIconWrap, { backgroundColor: '#FEF3C7' }]}>
                    <Ionicons name="pricetag" size={24} color="#D97706" />
                  </View>
                  <View style={styles.trustTextCol}>
                    <Text style={styles.trustTitle}>Transparent Pricing</Text>
                    <Text style={styles.trustDesc}>No hidden lab charges. Guaranteed up to 25% lower than direct hospital walk-in.</Text>
                  </View>
                </View>
              </View>
            </View>
          )}

          {/* VIEW 2: TESTS IN SELECTED CATEGORY */}
          {viewMode === 'tests' && selectedCategory && (
            <View style={styles.sectionWrap}>
              {/* Category Header Hero Card */}
              <View
                style={[
                  styles.categoryBannerHero,
                  { backgroundColor: selectedCategory.bg, borderColor: selectedCategory.border },
                ]}
              >
                <View style={styles.catBannerLeft}>
                  <View style={[styles.catLargeIconWrap, { backgroundColor: '#FFFFFF' }]}>
                    {RADIOLOGY_3D_ICONS[selectedCategory.id] ? (
                      <Image
                        source={RADIOLOGY_3D_ICONS[selectedCategory.id]}
                        style={styles.catBanner3DImage}
                        resizeMode="cover"
                      />
                    ) : (
                      <Ionicons name={selectedCategory.icon} size={36} color={selectedCategory.color} />
                    )}
                  </View>
                  <View style={styles.catBannerInfo}>
                    <View style={styles.catBannerTagRow}>
                      <Text style={[styles.catBannerBadge, { color: selectedCategory.color }]}>
                        {selectedCategory.badge}
                      </Text>
                      <Text style={styles.catBannerDot}>•</Text>
                      <Text style={styles.catBannerTestCount}>
                        {displayedTests.length} Tests Available
                      </Text>
                    </View>
                    <Text style={styles.catBannerTitle}>{selectedCategory.name} Tests</Text>
                    <Text style={styles.catBannerDesc}>{selectedCategory.description}</Text>
                  </View>
                </View>

                <TouchableOpacity
                  style={styles.changeCategoryBtn}
                  onPress={() => navigateToView('categories')}
                  activeOpacity={0.8}
                >
                  <Ionicons name="grid-outline" size={15} color="#0369A1" />
                  <Text style={styles.changeCategoryBtnText}>All Categories</Text>
                </TouchableOpacity>
              </View>

              {/* Tests Grid */}
              <View style={styles.sectionHeaderRow}>
                <View>
                  <Text style={styles.sectionTitle}>Available {selectedCategory.name} Procedures</Text>
                  <Text style={styles.sectionSubtitle}>
                    Select a test to compare prices across diagnostic centres in {selectedCity}
                  </Text>
                </View>
              </View>

              <View style={styles.testsGrid}>
                {displayedTests.map((test) => (
                  <View key={test.id} style={styles.testCard}>
                    {/* Top Row: Name and Fasting Badge */}
                    <View style={styles.testCardTopRow}>
                      <View style={styles.testCategoryTag}>
                        {RADIOLOGY_3D_ICONS[selectedCategory.id] && (
                          <Image
                            source={RADIOLOGY_3D_ICONS[selectedCategory.id]}
                            style={styles.testCardMini3DIcon}
                            resizeMode="cover"
                          />
                        )}
                        <Text style={styles.testCategoryTagText}>{selectedCategory.name}</Text>
                      </View>
                      <View
                        style={[
                          styles.fastingPill,
                          test.fastingRequired ? styles.fastingPillActive : styles.fastingPillNone,
                        ]}
                      >
                        <Ionicons
                          name={test.fastingRequired ? 'restaurant-outline' : 'checkmark-circle-outline'}
                          size={12}
                          color={test.fastingRequired ? '#D97706' : '#059669'}
                        />
                        <Text
                          style={[
                            styles.fastingPillText,
                            test.fastingRequired ? styles.fastingPillTextActive : styles.fastingPillTextNone,
                          ]}
                        >
                          {test.fastingRequired ? `Fasting (${test.fastingHours}h)` : 'No Fasting'}
                        </Text>
                      </View>
                    </View>

                    <Text style={styles.testCardName}>{test.name}</Text>
                    <Text style={styles.testCardSummary} numberOfLines={2}>
                      {test.summary}
                    </Text>

                    {/* Clinical Details Row */}
                    <View style={styles.testKeyParamsRow}>
                      <View style={styles.testParamItem}>
                        <Ionicons name="time-outline" size={13} color="#64748B" />
                        <Text style={styles.testParamText}>{test.duration}</Text>
                      </View>
                      <View style={styles.testParamItem}>
                        <Ionicons name="document-text-outline" size={13} color="#64748B" />
                        <Text style={styles.testParamText}>{test.reportTime}</Text>
                      </View>
                      {test.contrastUsed && (
                        <View style={styles.contrastTag}>
                          <Text style={styles.contrastTagText}>Contrast</Text>
                        </View>
                      )}
                    </View>

                    {/* Price and Action Row */}
                    <View style={styles.testCardPriceRow}>
                      <View style={styles.testPriceCol}>
                        <Text style={styles.startsAtLabel}>Starts at</Text>
                        <View style={styles.priceNumbersRow}>
                          <Text style={styles.discountedPrice}>
                            ₹{test.typicalPrice.toLocaleString('en-IN')}
                          </Text>
                          <Text style={styles.mrpPrice}>
                            ₹{test.mrp.toLocaleString('en-IN')}
                          </Text>
                        </View>
                      </View>

                      <View style={styles.testCardActions}>
                        <TouchableOpacity
                          style={styles.viewDetailsBtn}
                          onPress={() => setTestDetailsModal(test)}
                          activeOpacity={0.7}
                        >
                          <Text style={styles.viewDetailsBtnText}>Details</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                          style={styles.compareCentresBtn}
                          onPress={() => handleSelectTest(test)}
                          activeOpacity={0.8}
                        >
                          <Text style={styles.compareCentresBtnText}>Compare Centres</Text>
                          <Ionicons name="chevron-forward" size={14} color="#FFFFFF" />
                        </TouchableOpacity>
                      </View>
                    </View>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* VIEW 3: PROVIDERS / LABS COMPARISON FOR SELECTED TEST */}
          {viewMode === 'providers' && selectedTest && (
            <View style={styles.sectionWrap}>
              {/* Selected Test Summary Banner */}
              <View style={styles.selectedTestHeroCard}>
                <View style={styles.selectedTestHeroLeft}>
                  <View style={styles.selectedTestModalityPill}>
                    {RADIOLOGY_3D_ICONS[selectedCategory?.id] ? (
                      <Image
                        source={RADIOLOGY_3D_ICONS[selectedCategory.id]}
                        style={styles.heroModalityMini3DIcon}
                        resizeMode="cover"
                      />
                    ) : (
                      <Ionicons name="scan" size={14} color="#00B894" />
                    )}
                    <Text style={styles.selectedTestModalityText}>
                      {selectedCategory?.name || 'Radiology Scan'}
                    </Text>
                  </View>
                  <Text style={styles.selectedTestHeroTitle}>{selectedTest.name}</Text>
                  <Text style={styles.selectedTestHeroPurpose}>{selectedTest.purpose}</Text>
                  <View style={styles.selectedTestHeroBadges}>
                    <View style={styles.heroMiniBadge}>
                      <Ionicons name="time" size={12} color="#0369A1" />
                      <Text style={styles.heroMiniBadgeText}>Duration: {selectedTest.duration}</Text>
                    </View>
                    <View style={styles.heroMiniBadge}>
                      <Ionicons name="calendar" size={12} color="#059669" />
                      <Text style={styles.heroMiniBadgeText}>Reports in {selectedTest.reportTime}</Text>
                    </View>
                    <View style={styles.heroMiniBadge}>
                      <Ionicons name="information-circle" size={12} color="#D97706" />
                      <Text style={styles.heroMiniBadgeText}>
                        {selectedTest.fastingRequired ? `Fasting: ${selectedTest.fastingHours} hrs` : 'No Fasting'}
                      </Text>
                    </View>
                  </View>
                </View>

                <View style={styles.selectedTestHeroRight}>
                  <TouchableOpacity
                    style={styles.changeTestPillBtn}
                    onPress={() => navigateToView('tests')}
                    activeOpacity={0.8}
                  >
                    <Ionicons name="swap-horizontal" size={14} color="#0369A1" />
                    <Text style={styles.changeTestPillBtnText}>Choose Another Scan</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.viewProtocolBtn}
                    onPress={() => setTestDetailsModal(selectedTest)}
                    activeOpacity={0.8}
                  >
                    <Ionicons name="reader-outline" size={14} color="#00B894" />
                    <Text style={styles.viewProtocolBtnText}>View Clinical Protocol</Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* Filters & Sorting Toolbar */}
              <View style={styles.filterToolbarCard}>
                {/* Search in providers */}
                <View style={styles.providerSearchInputWrap}>
                  <Ionicons name="search" size={16} color="#64748B" />
                  <TextInput
                    style={styles.providerSearchInput}
                    placeholder="Search diagnostic centres or hospitals by name or area..."
                    placeholderTextColor="#94A3B8"
                    value={providerSearch}
                    onChangeText={setProviderSearch}
                  />
                  {providerSearch.length > 0 && (
                    <TouchableOpacity onPress={() => setProviderSearch('')}>
                      <Ionicons name="close" size={16} color="#94A3B8" />
                    </TouchableOpacity>
                  )}
                </View>

                {/* Filter Chips */}
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterChipsRow}>
                  {/* Rating Filter */}
                  <TouchableOpacity
                    style={[styles.filterChip, filterRating > 0 && styles.filterChipActive]}
                    onPress={() => setFilterRating((prev) => (prev > 0 ? 0 : 4.5))}
                    activeOpacity={0.7}
                  >
                    <Ionicons
                      name="star"
                      size={13}
                      color={filterRating > 0 ? '#FFFFFF' : '#F59E0B'}
                    />
                    <Text style={[styles.filterChipText, filterRating > 0 && styles.filterChipTextActive]}>
                      Top Rated (4.5+)
                    </Text>
                  </TouchableOpacity>

                  {/* Open 24x7 */}
                  <TouchableOpacity
                    style={[styles.filterChip, filterOpen24x7 && styles.filterChipActive]}
                    onPress={() => setFilterOpen24x7((prev) => !prev)}
                    activeOpacity={0.7}
                  >
                    <Ionicons
                      name="time"
                      size={13}
                      color={filterOpen24x7 ? '#FFFFFF' : '#0369A1'}
                    />
                    <Text style={[styles.filterChipText, filterOpen24x7 && styles.filterChipTextActive]}>
                      Open 24x7
                    </Text>
                  </TouchableOpacity>

                  {/* Cashless TPA */}
                  <TouchableOpacity
                    style={[styles.filterChip, filterCashless && styles.filterChipActive]}
                    onPress={() => setFilterCashless((prev) => !prev)}
                    activeOpacity={0.7}
                  >
                    <Ionicons
                      name="card-outline"
                      size={13}
                      color={filterCashless ? '#FFFFFF' : '#059669'}
                    />
                    <Text style={[styles.filterChipText, filterCashless && styles.filterChipTextActive]}>
                      Cashless Insurance
                    </Text>
                  </TouchableOpacity>

                  {/* Sort Selector */}
                  <View style={styles.sortSelectorWrap}>
                    <Text style={styles.sortLabel}>Sort By:</Text>
                    {[
                      { key: 'price-low', label: 'Price: Low to High' },
                      { key: 'price-high', label: 'Price: High to Low' },
                      { key: 'rating', label: 'Highest Rated' },
                      { key: 'distance', label: 'Nearest' },
                      { key: 'earliest', label: 'Earliest Slot' },
                    ].map((s) => (
                      <TouchableOpacity
                        key={s.key}
                        style={[styles.sortOptionBtn, sortBy === s.key && styles.sortOptionBtnActive]}
                        onPress={() => setSortBy(s.key)}
                        activeOpacity={0.8}
                      >
                        <Text style={[styles.sortOptionText, sortBy === s.key && styles.sortOptionTextActive]}>
                          {s.label}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </ScrollView>
              </View>

              {/* Providers Comparison List */}
              <View style={styles.providersListingHeader}>
                <Text style={styles.providersListingTitle}>
                  Available Centres for {selectedTest.name} in {selectedCity} ({displayedProviders.length})
                </Text>
                <Text style={styles.providersListingHint}>
                  Compare facilities, slot timings, and discounted package prices.
                </Text>
              </View>

              {displayedProviders.length === 0 ? (
                <View style={styles.emptyStateBox}>
                  <Ionicons name="medical-outline" size={48} color="#94A3B8" />
                  <Text style={styles.emptyStateTitle}>No Diagnostic Centres Matched</Text>
                  <Text style={styles.emptyStateSubtitle}>
                    Try clearing some filters or switch city location to Mysuru or Bengaluru.
                  </Text>
                  <TouchableOpacity
                    style={styles.emptyResetBtn}
                    onPress={() => {
                      setFilterRating(0);
                      setFilterOpen24x7(false);
                      setFilterCashless(false);
                      setProviderSearch('');
                      setSelectedCity('Mysuru');
                    }}
                  >
                    <Text style={styles.emptyResetBtnText}>Reset All Filters</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <View style={styles.providersList}>
                  {displayedProviders.map((provider) => (
                    <View key={provider.id} style={styles.providerCard}>
                      {/* Provider Header: Name, Location, Distance, Rating */}
                      <View style={styles.providerCardHeader}>
                        <View style={styles.providerIdentity}>
                          <View style={styles.providerNameRow}>
                            <Text style={styles.providerName}>{provider.name}</Text>
                            {provider.accreditations?.map((acc) => (
                              <View key={acc} style={styles.providerAccredPill}>
                                <Text style={styles.providerAccredText}>{acc}</Text>
                              </View>
                            ))}
                          </View>
                          <View style={styles.providerLocationRow}>
                            <Ionicons name="location-outline" size={14} color="#64748B" />
                            <Text style={styles.providerAddressText}>
                              {provider.area}, {provider.city}
                            </Text>
                            <Text style={styles.providerDot}>•</Text>
                            <Ionicons name="navigate-outline" size={13} color="#0369A1" />
                            <Text style={styles.providerDistanceText}>{provider.distance} away</Text>
                            <Text style={styles.providerDot}>•</Text>
                            <Text style={styles.providerTypeText}>{provider.type}</Text>
                          </View>
                        </View>

                        {/* Rating Badge */}
                        <View style={styles.providerRatingBox}>
                          <View style={styles.ratingNumberRow}>
                            <Ionicons name="star" size={15} color="#F59E0B" />
                            <Text style={styles.ratingScore}>{provider.rating}</Text>
                          </View>
                          <Text style={styles.reviewsCountText}>{provider.reviewsCount} reviews</Text>
                        </View>
                      </View>

                      {/* Facilities & Machinery Chips */}
                      <View style={styles.providerFacilitiesRow}>
                        {provider.facilities?.map((fac) => (
                          <View key={fac} style={styles.facilityChip}>
                            <Ionicons name="checkmark-circle" size={12} color="#00B894" />
                            <Text style={styles.facilityChipText}>{fac}</Text>
                          </View>
                        ))}
                        {provider.cashlessSupported && (
                          <View style={[styles.facilityChip, { backgroundColor: '#ECFDF5' }]}>
                            <Ionicons name="shield-checkmark" size={12} color="#059669" />
                            <Text style={[styles.facilityChipText, { color: '#059669' }]}>Cashless Insurance</Text>
                          </View>
                        )}
                        <View style={styles.facilityChip}>
                          <Ionicons name="time-outline" size={12} color="#64748B" />
                          <Text style={styles.facilityChipText}>{provider.openHours}</Text>
                        </View>
                      </View>

                      {/* Available Slots Preview */}
                      <View style={styles.providerSlotsBlock}>
                        <View style={styles.slotsLabelRow}>
                          <Ionicons name="time" size={14} color="#00B894" />
                          <Text style={styles.slotsLabelText}>Available Today & Tomorrow Slots:</Text>
                        </View>
                        <View style={styles.slotsPillsRow}>
                          {provider.availableSlots?.map((slot) => {
                            const todayIso = new Date().toISOString().split('T')[0];
                            const st = getSlotStatus({
                              date: todayIso,
                              time: slot,
                              serviceType: 'radiology',
                              providerId: provider.id,
                            });
                            return (
                              <View
                                key={slot}
                                style={[
                                  styles.miniSlotPill,
                                  !st.available && { opacity: 0.5, backgroundColor: '#F1F5F9' },
                                ]}
                              >
                                <Text
                                  style={[
                                    styles.miniSlotText,
                                    !st.available && { color: '#94A3B8', textDecorationLine: 'line-through' },
                                  ]}
                                >
                                  {slot}
                                </Text>
                              </View>
                            );
                          })}
                        </View>
                      </View>

                      {/* Pricing & Booking CTA Footer */}
                      <View style={styles.providerCardFooter}>
                        {/* Report Delivery Info */}
                        <View style={styles.reportDeliveryNote}>
                          <Ionicons name="flash-outline" size={15} color="#D97706" />
                          <Text style={styles.reportDeliveryNoteText}>
                            Report: <Text style={styles.reportDeliveryBold}>{provider.turnaroundTime}</Text>
                          </Text>
                        </View>

                        {/* Price Details */}
                        <View style={styles.providerPriceBlock}>
                          <View style={styles.discountBadgeWrap}>
                            <Text style={styles.discountBadgeWrapText}>{provider.discountPercent}% OFF</Text>
                          </View>
                          <View style={styles.priceNumbersCol}>
                            <Text style={styles.providerFinalPrice}>
                              ₹{provider.price.toLocaleString('en-IN')}
                            </Text>
                            <Text style={styles.providerMrpPrice}>
                              ₹{provider.mrp.toLocaleString('en-IN')}
                            </Text>
                          </View>
                        </View>

                        {/* Action Buttons */}
                        <View style={styles.providerActionButtons}>
                          <TouchableOpacity
                            style={styles.providerDetailsBtn}
                            onPress={() => setTestDetailsModal({ ...selectedTest, provider })}
                            activeOpacity={0.7}
                          >
                            <Ionicons name="information-circle-outline" size={16} color="#0369A1" />
                            <Text style={styles.providerDetailsBtnText}>View Details</Text>
                          </TouchableOpacity>

                          <TouchableOpacity
                            style={styles.providerBookBtn}
                            onPress={() => handleStartBooking(provider, selectedTest)}
                            activeOpacity={0.8}
                          >
                            <Text style={styles.providerBookBtnText}>Book Appointment</Text>
                            <Ionicons name="calendar" size={15} color="#FFFFFF" />
                          </TouchableOpacity>
                        </View>
                      </View>
                    </View>
                  ))}
                </View>
              )}
            </View>
          )}

          {/* VIEW 4: APPOINTMENT BOOKING FLOW (4 STEPS) */}
          {viewMode === 'booking' && selectedTest && selectedProvider && (
            <View style={styles.bookingFlowContainer}>
              {/* Stepper Header */}
              <View style={styles.stepperHeader}>
                <View style={styles.stepperProgressRow}>
                  {[
                    { num: 1, label: 'Select Patient' },
                    { num: 2, label: 'Date & Time Slot' },
                    { num: 3, label: 'Review Booking' },
                  ].map((s) => (
                    <React.Fragment key={s.num}>
                      <TouchableOpacity
                        style={styles.stepItem}
                        onPress={() => {
                          if (s.num < bookingStep) setBookingStep(s.num);
                        }}
                        activeOpacity={0.8}
                      >
                        <View
                          style={[
                            styles.stepCircle,
                            bookingStep === s.num && styles.stepCircleActive,
                            bookingStep > s.num && styles.stepCircleCompleted,
                          ]}
                        >
                          {bookingStep > s.num ? (
                            <Ionicons name="checkmark" size={14} color="#FFFFFF" />
                          ) : (
                            <Text
                              style={[
                                styles.stepCircleNum,
                                bookingStep === s.num && styles.stepCircleNumActive,
                              ]}
                            >
                              {s.num}
                            </Text>
                          )}
                        </View>
                        <Text
                          style={[
                            styles.stepLabel,
                            bookingStep === s.num && styles.stepLabelActive,
                          ]}
                        >
                          {s.label}
                        </Text>
                      </TouchableOpacity>
                      {s.num < 3 && (
                        <View
                          style={[
                            styles.stepConnector,
                            bookingStep > s.num && styles.stepConnectorActive,
                          ]}
                        />
                      )}
                    </React.Fragment>
                  ))}
                </View>
              </View>

              {/* Main Booking Content Grid (Left Wizard, Right Summary) */}
              <View style={styles.bookingMainLayout}>
                {/* Left Column: Active Step Content */}
                <View style={styles.bookingWizardLeftCol}>
                  {/* STEP 1: SELECT PATIENT */}
                  {bookingStep === 1 && (
                    <View style={styles.wizardCard}>
                      <View style={styles.wizardStepTitleRow}>
                        <Ionicons name="person-circle-outline" size={24} color="#00B894" />
                        <View>
                          <Text style={styles.wizardStepHeading}>Step 1: Select Patient</Text>
                          <Text style={styles.wizardStepSub}>
                            Choose who this scan appointment is for or add a new dependent
                          </Text>
                        </View>
                      </View>

                      {/* Patients List */}
                      <View style={styles.patientCardsList}>
                        {patientsList.map((pat) => {
                          const isSelected = selectedPatient?.id === pat.id;
                          return (
                            <TouchableOpacity
                              key={pat.id}
                              style={[
                                styles.patientCard,
                                isSelected && styles.patientCardSelected,
                              ]}
                              onPress={() => setSelectedPatient(pat)}
                              activeOpacity={0.8}
                            >
                              <View style={styles.patientRadioWrap}>
                                <View
                                  style={[
                                    styles.radioOuter,
                                    isSelected && styles.radioOuterSelected,
                                  ]}
                                >
                                  {isSelected && <View style={styles.radioInner} />}
                                </View>
                              </View>

                              <View style={styles.patientInfoCol}>
                                <View style={styles.patientNameRelationRow}>
                                  <Text style={styles.patientNameText}>{pat.name}</Text>
                                  <View style={styles.relationBadge}>
                                    <Text style={styles.relationBadgeText}>{pat.relation}</Text>
                                  </View>
                                </View>
                                <Text style={styles.patientMetaText}>
                                  {pat.age} Years • {pat.gender} • {pat.phone}
                                </Text>
                              </View>

                              {isSelected && (
                                <Ionicons name="checkmark-circle" size={20} color="#00B894" />
                              )}
                            </TouchableOpacity>
                          );
                        })}
                      </View>

                      {/* Add New Patient Form Toggle */}
                      {!showAddPatientForm ? (
                        <TouchableOpacity
                          style={styles.addNewPatientBtn}
                          onPress={() => setShowAddPatientForm(true)}
                          activeOpacity={0.8}
                        >
                          <Ionicons name="add-circle-outline" size={18} color="#00B894" />
                          <Text style={styles.addNewPatientBtnText}>+ Add New Patient / Family Member</Text>
                        </TouchableOpacity>
                      ) : (
                        <View style={styles.newPatientFormBox}>
                          <Text style={styles.formSectionTitle}>Add Dependent Information</Text>
                          <View style={styles.formRow}>
                            <View style={styles.formInputGroup}>
                              <Text style={styles.inputLabel}>Full Name *</Text>
                              <TextInput
                                style={styles.textInputBox}
                                placeholder="e.g. Ananya Kumar"
                                placeholderTextColor="#94A3B8"
                                value={newPatient.name}
                                onChangeText={(t) => setNewPatient((p) => ({ ...p, name: t }))}
                              />
                            </View>
                            <View style={styles.formInputGroupSmall}>
                              <Text style={styles.inputLabel}>Age *</Text>
                              <TextInput
                                style={styles.textInputBox}
                                placeholder="Age"
                                placeholderTextColor="#94A3B8"
                                keyboardType="numeric"
                                value={newPatient.age}
                                onChangeText={(t) => setNewPatient((p) => ({ ...p, age: t }))}
                              />
                            </View>
                          </View>

                          <View style={styles.formRow}>
                            <View style={styles.formInputGroup}>
                              <Text style={styles.inputLabel}>Gender</Text>
                              <View style={styles.genderSelectRow}>
                                {['Male', 'Female', 'Other'].map((g) => (
                                  <TouchableOpacity
                                    key={g}
                                    style={[
                                      styles.genderPill,
                                      newPatient.gender === g && styles.genderPillActive,
                                    ]}
                                    onPress={() => setNewPatient((p) => ({ ...p, gender: g }))}
                                  >
                                    <Text
                                      style={[
                                        styles.genderPillText,
                                        newPatient.gender === g && styles.genderPillTextActive,
                                      ]}
                                    >
                                      {g}
                                    </Text>
                                  </TouchableOpacity>
                                ))}
                              </View>
                            </View>

                            <View style={styles.formInputGroup}>
                              <Text style={styles.inputLabel}>Relationship</Text>
                              <TextInput
                                style={styles.textInputBox}
                                placeholder="e.g. Mother, Father, Child"
                                placeholderTextColor="#94A3B8"
                                value={newPatient.relation}
                                onChangeText={(t) => setNewPatient((p) => ({ ...p, relation: t }))}
                              />
                            </View>
                          </View>

                          <View style={styles.formInputGroup}>
                            <Text style={styles.inputLabel}>Contact Phone Number</Text>
                            <TextInput
                              style={styles.textInputBox}
                              placeholder="+91 Mobile Number"
                              placeholderTextColor="#94A3B8"
                              keyboardType="phone-pad"
                              value={newPatient.phone}
                              onChangeText={(t) => setNewPatient((p) => ({ ...p, phone: t }))}
                            />
                          </View>

                          <View style={styles.formActionsRow}>
                            <TouchableOpacity
                              style={styles.cancelFormBtn}
                              onPress={() => setShowAddPatientForm(false)}
                            >
                              <Text style={styles.cancelFormBtnText}>Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                              style={styles.savePatientBtn}
                              onPress={handleAddNewPatient}
                            >
                              <Text style={styles.savePatientBtnText}>Save Patient</Text>
                            </TouchableOpacity>
                          </View>
                        </View>
                      )}

                      {/* Step 1 Next Action */}
                      <View style={styles.wizardFooterBtnRow}>
                        <TouchableOpacity
                          style={styles.wizardNextBtn}
                          onPress={() => setBookingStep(2)}
                          activeOpacity={0.85}
                        >
                          <Text style={styles.wizardNextBtnText}>Continue to Date & Slot →</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  )}

                  {/* STEP 2: SELECT DATE & TIME SLOT */}
                  {bookingStep === 2 && (
                    <View style={styles.wizardCard}>
                      <View style={styles.wizardStepTitleRow}>
                        <Ionicons name="calendar-outline" size={24} color="#00B894" />
                        <View>
                          <Text style={styles.wizardStepHeading}>Step 2: Select Date & Time Slot</Text>
                          <Text style={styles.wizardStepSub}>
                            Choose an available appointment slot at {selectedProvider.name}
                          </Text>
                        </View>
                      </View>

                      {/* Next 7 Days Horizontal Bar */}
                      <Text style={styles.subSectionTitle}>Select Appointment Date</Text>
                      <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        contentContainerStyle={styles.datesScrollRow}
                      >
                        {appointmentDays.map((d) => {
                          const isSelected = selectedDateIndex === d.index;
                          return (
                            <TouchableOpacity
                              key={d.index}
                              style={[
                                styles.datePillCard,
                                isSelected && styles.datePillCardActive,
                              ]}
                              onPress={() => setSelectedDateIndex(d.index)}
                              activeOpacity={0.8}
                            >
                              <Text
                                style={[
                                  styles.datePillDayName,
                                  isSelected && styles.datePillDayNameActive,
                                ]}
                              >
                                {d.dayName}
                              </Text>
                              <Text
                                style={[
                                  styles.datePillDateNum,
                                  isSelected && styles.datePillDateNumActive,
                                ]}
                              >
                                {d.dateNum}
                              </Text>
                              <Text
                                style={[
                                  styles.datePillMonthName,
                                  isSelected && styles.datePillMonthNameActive,
                                ]}
                              >
                                {d.monthName}
                              </Text>
                            </TouchableOpacity>
                          );
                        })}
                      </ScrollView>

                      {/* Selected Date Indicator */}
                      <View style={styles.selectedDateNotice}>
                        <Ionicons name="checkmark-circle-outline" size={16} color="#00B894" />
                        <Text style={styles.selectedDateNoticeText}>
                          Appointment Date: <Text style={styles.boldText}>{appointmentDays[selectedDateIndex]?.fullLabel}</Text>
                        </Text>
                      </View>

                      {/* Time Slots Categorized */}
                      <Text style={[styles.subSectionTitle, { marginTop: 24 }]}>
                        Select Available Time Slot
                      </Text>

                      {/* Morning Slots */}
                      <View style={styles.slotCategoryGroup}>
                        <View style={styles.slotCategoryHeader}>
                          <Ionicons name="sunny-outline" size={15} color="#D97706" />
                          <Text style={styles.slotCategoryTitle}>Morning Slots (08:00 AM - 12:00 PM)</Text>
                        </View>
                        <View style={styles.slotsPillsGrid}>
                          {['08:30 AM', '09:30 AM', '10:30 AM', '11:30 AM'].map((slot) => {
                            const chosenDay = appointmentDays[selectedDateIndex] || appointmentDays[0];
                            const slotStatus = getSlotStatus({
                              date: chosenDay?.isoDate,
                              time: slot,
                              serviceType: 'radiology',
                              providerId: selectedProvider?.id,
                            });
                            const isAvailable = slotStatus.available;
                            const isSelected = selectedTimeSlot === slot;
                            return (
                              <TouchableOpacity
                                key={slot}
                                style={[
                                  styles.timeSlotBtn,
                                  isSelected && styles.timeSlotBtnActive,
                                  !isAvailable && styles.timeSlotBtnDisabled,
                                ]}
                                disabled={!isAvailable}
                                onPress={() => setSelectedTimeSlot(slot)}
                                activeOpacity={0.8}
                              >
                                <Text
                                  style={[
                                    styles.timeSlotText,
                                    isSelected && styles.timeSlotTextActive,
                                    !isAvailable && styles.timeSlotTextDisabled,
                                  ]}
                                >
                                  {slot}
                                </Text>
                                {!isAvailable && (
                                  <View style={styles.slotStatusBadge}>
                                    <Text style={styles.slotStatusBadgeText}>
                                      {slotStatus.status === 'PASSED' ? 'Passed' : 'Booked'}
                                    </Text>
                                  </View>
                                )}
                                {isSelected && isAvailable && (
                                  <Ionicons name="checkmark" size={14} color="#FFFFFF" />
                                )}
                              </TouchableOpacity>
                            );
                          })}
                        </View>
                      </View>

                      {/* Afternoon Slots */}
                      <View style={styles.slotCategoryGroup}>
                        <View style={styles.slotCategoryHeader}>
                          <Ionicons name="partly-sunny-outline" size={15} color="#0284C7" />
                          <Text style={styles.slotCategoryTitle}>Afternoon Slots (12:00 PM - 04:00 PM)</Text>
                        </View>
                        <View style={styles.slotsPillsGrid}>
                          {['12:30 PM', '01:30 PM', '02:30 PM', '03:30 PM'].map((slot) => {
                            const chosenDay = appointmentDays[selectedDateIndex] || appointmentDays[0];
                            const slotStatus = getSlotStatus({
                              date: chosenDay?.isoDate,
                              time: slot,
                              serviceType: 'radiology',
                              providerId: selectedProvider?.id,
                            });
                            const isAvailable = slotStatus.available;
                            const isSelected = selectedTimeSlot === slot;
                            return (
                              <TouchableOpacity
                                key={slot}
                                style={[
                                  styles.timeSlotBtn,
                                  isSelected && styles.timeSlotBtnActive,
                                  !isAvailable && styles.timeSlotBtnDisabled,
                                ]}
                                disabled={!isAvailable}
                                onPress={() => setSelectedTimeSlot(slot)}
                                activeOpacity={0.8}
                              >
                                <Text
                                  style={[
                                    styles.timeSlotText,
                                    isSelected && styles.timeSlotTextActive,
                                    !isAvailable && styles.timeSlotTextDisabled,
                                  ]}
                                >
                                  {slot}
                                </Text>
                                {!isAvailable && (
                                  <View style={styles.slotStatusBadge}>
                                    <Text style={styles.slotStatusBadgeText}>
                                      {slotStatus.status === 'PASSED' ? 'Passed' : 'Booked'}
                                    </Text>
                                  </View>
                                )}
                                {isSelected && isAvailable && (
                                  <Ionicons name="checkmark" size={14} color="#FFFFFF" />
                                )}
                              </TouchableOpacity>
                            );
                          })}
                        </View>
                      </View>

                      {/* Evening Slots */}
                      <View style={styles.slotCategoryGroup}>
                        <View style={styles.slotCategoryHeader}>
                          <Ionicons name="moon-outline" size={15} color="#1E3A8A" />
                          <Text style={styles.slotCategoryTitle}>Evening Slots (04:00 PM - 08:00 PM)</Text>
                        </View>
                        <View style={styles.slotsPillsGrid}>
                          {['04:30 PM', '05:30 PM', '06:30 PM', '07:30 PM'].map((slot) => {
                            const chosenDay = appointmentDays[selectedDateIndex] || appointmentDays[0];
                            const slotStatus = getSlotStatus({
                              date: chosenDay?.isoDate,
                              time: slot,
                              serviceType: 'radiology',
                              providerId: selectedProvider?.id,
                            });
                            const isAvailable = slotStatus.available;
                            const isSelected = selectedTimeSlot === slot;
                            return (
                              <TouchableOpacity
                                key={slot}
                                style={[
                                  styles.timeSlotBtn,
                                  isSelected && styles.timeSlotBtnActive,
                                  !isAvailable && styles.timeSlotBtnDisabled,
                                ]}
                                disabled={!isAvailable}
                                onPress={() => setSelectedTimeSlot(slot)}
                                activeOpacity={0.8}
                              >
                                <Text
                                  style={[
                                    styles.timeSlotText,
                                    isSelected && styles.timeSlotTextActive,
                                    !isAvailable && styles.timeSlotTextDisabled,
                                  ]}
                                >
                                  {slot}
                                </Text>
                                {!isAvailable && (
                                  <View style={styles.slotStatusBadge}>
                                    <Text style={styles.slotStatusBadgeText}>
                                      {slotStatus.status === 'PASSED' ? 'Passed' : 'Booked'}
                                    </Text>
                                  </View>
                                )}
                                {isSelected && isAvailable && (
                                  <Ionicons name="checkmark" size={14} color="#FFFFFF" />
                                )}
                              </TouchableOpacity>
                            );
                          })}
                        </View>
                      </View>

                      {/* Navigation Buttons */}
                      <View style={styles.wizardFooterBtnRow}>
                        <TouchableOpacity
                          style={styles.wizardBackBtn}
                          onPress={() => setBookingStep(1)}
                        >
                          <Ionicons name="arrow-back" size={16} color="#64748B" />
                          <Text style={styles.wizardBackBtnText}>Back</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                          style={styles.wizardNextBtn}
                          onPress={() => setBookingStep(3)}
                          activeOpacity={0.85}
                        >
                          <Text style={styles.wizardNextBtnText}>Review Booking Details →</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  )}

                  {/* STEP 3: REVIEW BOOKING */}
                  {bookingStep === 3 && (
                    <View style={styles.wizardCard}>
                      <View style={styles.wizardStepTitleRow}>
                        <Ionicons name="checkmark-done-circle-outline" size={24} color="#00B894" />
                        <View>
                          <Text style={styles.wizardStepHeading}>Step 3: Review Booking Summary</Text>
                          <Text style={styles.wizardStepSub}>
                            Please verify all patient, test, and schedule details before proceeding to payment
                          </Text>
                        </View>
                      </View>

                      {/* Summary Blocks */}
                      <View style={styles.reviewBlocksWrap}>
                        {/* Patient Block */}
                        <View style={styles.reviewCard}>
                          <View style={styles.reviewCardHeader}>
                            <Ionicons name="person-outline" size={16} color="#0369A1" />
                            <Text style={styles.reviewCardTitle}>Patient Information</Text>
                            <TouchableOpacity onPress={() => setBookingStep(1)}>
                              <Text style={styles.reviewEditLink}>Edit</Text>
                            </TouchableOpacity>
                          </View>
                          <Text style={styles.reviewMainText}>{selectedPatient?.name}</Text>
                          <Text style={styles.reviewSubText}>
                            {selectedPatient?.relation} • {selectedPatient?.age} Years • {selectedPatient?.gender}
                          </Text>
                          <Text style={styles.reviewSubText}>Phone: {selectedPatient?.phone}</Text>
                        </View>

                        {/* Test & Provider Block */}
                        <View style={styles.reviewCard}>
                          <View style={styles.reviewCardHeader}>
                            <Ionicons name="scan-outline" size={16} color="#00B894" />
                            <Text style={styles.reviewCardTitle}>Scan & Diagnostic Centre</Text>
                          </View>
                          <Text style={styles.reviewMainText}>{selectedTest.name}</Text>
                          <Text style={styles.reviewSubText}>Modality: {selectedCategory?.name || 'Radiology'}</Text>
                          <View style={styles.dividerSubtle} />
                          <Text style={styles.reviewMainText}>{selectedProvider.name}</Text>
                          <Text style={styles.reviewSubText}>{selectedProvider.area}, {selectedProvider.city}</Text>
                        </View>

                        {/* Appointment Time Block */}
                        <View style={styles.reviewCard}>
                          <View style={styles.reviewCardHeader}>
                            <Ionicons name="time-outline" size={16} color="#D97706" />
                            <Text style={styles.reviewCardTitle}>Appointment Schedule</Text>
                            <TouchableOpacity onPress={() => setBookingStep(2)}>
                              <Text style={styles.reviewEditLink}>Change</Text>
                            </TouchableOpacity>
                          </View>
                          <Text style={styles.reviewMainText}>{appointmentDays[selectedDateIndex]?.fullLabel}</Text>
                          <Text style={styles.reviewSubText}>Time Slot: <Text style={styles.boldText}>{selectedTimeSlot}</Text></Text>
                          <Text style={styles.reviewSubText}>Expected Report Turnaround: {selectedProvider.turnaroundTime}</Text>
                        </View>

                        {/* Clinical Prep Instructions */}
                        <View style={styles.instructionsAlertBox}>
                          <Ionicons name="alert-circle-outline" size={20} color="#0369A1" />
                          <View style={styles.instructionsAlertCol}>
                            <Text style={styles.instructionsAlertTitle}>Preparation Guidelines</Text>
                            <Text style={styles.instructionsAlertText}>
                              {selectedTest.preparation}
                            </Text>
                            {selectedTest.fastingRequired && (
                              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 }}>
                                <Ionicons name="warning-outline" size={14} color="#D97706" />
                                <Text style={styles.instructionsFastingWarning}>
                                  Requires {selectedTest.fastingHours} hours fasting before the scan. Water is allowed unless specified.
                                </Text>
                              </View>
                            )}
                          </View>
                        </View>
                      </View>

                      {/* Navigation Buttons */}
                      <View style={styles.wizardFooterBtnRow}>
                        <TouchableOpacity
                          style={styles.wizardBackBtn}
                          onPress={() => setBookingStep(2)}
                        >
                          <Ionicons name="arrow-back" size={16} color="#64748B" />
                          <Text style={styles.wizardBackBtnText}>Back</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                          style={styles.wizardNextBtn}
                          onPress={handleProceedToPayment}
                          activeOpacity={0.85}
                        >
                          <Text style={styles.wizardNextBtnText}>Proceed to Payment →</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  )}
                </View>

                {/* Right Column: Persistent Order Summary Breakdown */}
                <View style={styles.bookingSummaryRightCol}>
                  <View style={styles.summaryCard}>
                    <Text style={styles.summaryCardTitle}>Price Breakdown</Text>
                    <View style={styles.summaryDivider} />

                    <View style={styles.summaryRow}>
                      <Text style={styles.summaryRowLabel}>Test Standard MRP</Text>
                      <Text style={styles.summaryRowValue}>
                        ₹{selectedTest.mrp.toLocaleString('en-IN')}
                      </Text>
                    </View>

                    <View style={styles.summaryRow}>
                      <Text style={styles.summaryDiscountLabel}>MediUnify Diagnostic Discount</Text>
                      <Text style={styles.summaryDiscountValue}>
                        -₹{(selectedTest.mrp - Math.round(selectedTest.typicalPrice * selectedProvider.discountMultiplier)).toLocaleString('en-IN')}
                      </Text>
                    </View>

                    <View style={styles.summaryRow}>
                      <Text style={styles.summaryRowLabel}>PACS Digital Archival</Text>
                      <Text style={styles.summaryFreeValue}>FREE</Text>
                    </View>

                    <View style={styles.summaryRow}>
                      <Text style={styles.summaryRowLabel}>Platform Convenience Fee</Text>
                      <Text style={styles.summaryFreeValue}>FREE</Text>
                    </View>

                    <View style={styles.summaryDivider} />

                    <View style={styles.summaryTotalRow}>
                      <View>
                        <Text style={styles.summaryTotalLabel}>Final Amount Payable</Text>
                        <Text style={styles.summaryTaxesInc}>All taxes & film included</Text>
                      </View>
                      <Text style={styles.summaryTotalValue}>
                        ₹{Math.round(selectedTest.typicalPrice * selectedProvider.discountMultiplier).toLocaleString('en-IN')}
                      </Text>
                    </View>

                    {/* Guarantee Box */}
                    <View style={styles.guaranteeBox}>
                      <Ionicons name="shield-checkmark" size={18} color="#00B894" />
                      <Text style={styles.guaranteeText}>
                        100% Refund Guarantee. Free cancellation up to 2 hours before the scheduled time slot.
                      </Text>
                    </View>
                  </View>
                </View>
              </View>
            </View>
          )}

          {/* VIEW 5: SECURE PAYMENT PAGE */}
          {viewMode === 'payment' && selectedTest && selectedProvider && (
            <View style={styles.sectionWrap}>
              <View style={styles.paymentContainer}>
                {/* Left: Payment Method Selection */}
                <View style={styles.paymentMethodsCol}>
                  <View style={styles.paymentCard}>
                    <View style={styles.paymentHeaderRow}>
                      <Ionicons name="lock-closed" size={20} color="#00B894" />
                      <View>
                        <Text style={styles.paymentHeading}>MediUnify Secure Payment Gateway</Text>
                        <Text style={styles.paymentSub}>
                          Select your preferred payment method. 256-bit encrypted checkout.
                        </Text>
                      </View>
                    </View>

                    {/* Payment Tabs */}
                    <View style={styles.paymentTabOptions}>
                      {[
                        { id: 'upi', label: 'UPI / QR Code', icon: 'qr-code-outline' },
                        { id: 'card', label: 'Credit / Debit Card', icon: 'card-outline' },
                        { id: 'netbanking', label: 'Net Banking', icon: 'business-outline' },
                        { id: 'pay_at_centre', label: 'Pay at Centre', icon: 'cash-outline' },
                      ].map((tab) => {
                        const isSelected = paymentMethod === tab.id;
                        return (
                          <TouchableOpacity
                            key={tab.id}
                            style={[
                              styles.paymentTabBtn,
                              isSelected && styles.paymentTabBtnActive,
                            ]}
                            onPress={() => setPaymentMethod(tab.id)}
                            activeOpacity={0.8}
                          >
                            <Ionicons
                              name={tab.icon}
                              size={18}
                              color={isSelected ? '#00B894' : '#64748B'}
                            />
                            <Text
                              style={[
                                styles.paymentTabText,
                                isSelected && styles.paymentTabTextActive,
                              ]}
                            >
                              {tab.label}
                            </Text>
                          </TouchableOpacity>
                        );
                      })}
                    </View>

                    {/* Payment Method Details Form */}
                    <View style={styles.paymentMethodFormArea}>
                      {paymentMethod === 'upi' && (
                        <View style={styles.upiFormWrap}>
                          <Text style={styles.formLabelBold}>Pay via Instant UPI</Text>
                          <Text style={styles.formSub}>
                            Google Pay, PhonePe, Paytm, BHIM, or Enter any UPI ID
                          </Text>

                          <View style={styles.upiInputRow}>
                            <TextInput
                              style={styles.upiTextInput}
                              placeholder="Enter UPI ID (e.g. mobile@upi, name@okhdfcbank)"
                              placeholderTextColor="#94A3B8"
                              value={upiId}
                              onChangeText={setUpiId}
                            />
                            <TouchableOpacity
                              style={styles.verifyUpiBtn}
                              onPress={() => showAlert('UPI Verified', 'UPI handle verified successfully.')}
                            >
                              <Text style={styles.verifyUpiBtnText}>Verify</Text>
                            </TouchableOpacity>
                          </View>

                          <View style={styles.upiAppsRow}>
                            <View style={styles.upiAppBadge}>
                              <Text style={styles.upiAppBadgeText}>Google Pay</Text>
                            </View>
                            <View style={styles.upiAppBadge}>
                              <Text style={styles.upiAppBadgeText}>PhonePe</Text>
                            </View>
                            <View style={styles.upiAppBadge}>
                              <Text style={styles.upiAppBadgeText}>Paytm UPI</Text>
                            </View>
                            <View style={styles.upiAppBadge}>
                              <Text style={styles.upiAppBadgeText}>BHIM</Text>
                            </View>
                          </View>
                        </View>
                      )}

                      {paymentMethod === 'card' && (
                        <View style={styles.cardFormWrap}>
                          <Text style={styles.formLabelBold}>Enter Card Details</Text>
                          <Text style={styles.formSub}>All major Visa, MasterCard, RuPay, and Maestro accepted</Text>

                          <View style={styles.formInputGroup}>
                            <Text style={styles.inputLabel}>Card Number</Text>
                            <TextInput
                              style={styles.textInputBox}
                              placeholder="XXXX XXXX XXXX XXXX"
                              placeholderTextColor="#94A3B8"
                              keyboardType="numeric"
                              maxLength={19}
                              value={cardNumber}
                              onChangeText={setCardNumber}
                            />
                          </View>

                          <View style={styles.formRow}>
                            <View style={styles.formInputGroup}>
                              <Text style={styles.inputLabel}>Valid Thru (MM/YY)</Text>
                              <TextInput
                                style={styles.textInputBox}
                                placeholder="MM/YY"
                                placeholderTextColor="#94A3B8"
                                maxLength={5}
                                value={cardExpiry}
                                onChangeText={setCardExpiry}
                              />
                            </View>
                            <View style={styles.formInputGroup}>
                              <Text style={styles.inputLabel}>CVV / CVC</Text>
                              <TextInput
                                style={styles.textInputBox}
                                placeholder="3 digits"
                                placeholderTextColor="#94A3B8"
                                keyboardType="numeric"
                                maxLength={4}
                                secureTextEntry
                                value={cardCvv}
                                onChangeText={setCardCvv}
                              />
                            </View>
                          </View>
                        </View>
                      )}

                      {paymentMethod === 'netbanking' && (
                        <View style={styles.netbankingFormWrap}>
                          <Text style={styles.formLabelBold}>Select Your Bank</Text>
                          <Text style={styles.formSub}>Direct secure internet banking gateway</Text>
                          <View style={styles.bankPillsGrid}>
                            {['SBI', 'HDFC Bank', 'ICICI Bank', 'Axis Bank', 'Kotak Bank', 'Canara Bank'].map((b) => (
                              <TouchableOpacity key={b} style={styles.bankPill}>
                                <Ionicons name="business" size={14} color="#0369A1" />
                                <Text style={styles.bankPillText}>{b}</Text>
                              </TouchableOpacity>
                            ))}
                          </View>
                        </View>
                      )}

                      {paymentMethod === 'pay_at_centre' && (
                        <View style={styles.payAtCentreBox}>
                          <Ionicons name="cash" size={32} color="#00B894" />
                          <Text style={styles.payAtCentreHeading}>Pay Cash / Card at Centre Reception</Text>
                          <Text style={styles.payAtCentreText}>
                            Your scan slot will be reserved immediately. You can settle the bill of{' '}
                            <Text style={styles.boldText}>
                              ₹{Math.round(selectedTest.typicalPrice * selectedProvider.discountMultiplier).toLocaleString('en-IN')}
                            </Text>{' '}
                            upon arrival at the diagnostic centre desk.
                          </Text>
                        </View>
                      )}
                    </View>

                    {/* Pay CTA */}
                    <TouchableOpacity
                      style={styles.executePayBtn}
                      onPress={handleExecutePayment}
                      disabled={isProcessingPayment}
                      activeOpacity={0.88}
                    >
                      {isProcessingPayment ? (
                        <ActivityIndicator color="#FFFFFF" size="small" />
                      ) : (
                        <>
                          <Ionicons name="lock-closed" size={16} color="#FFFFFF" />
                          <Text style={styles.executePayBtnText}>
                            {paymentMethod === 'pay_at_centre'
                              ? 'Confirm Slot & Pay at Centre'
                              : `Pay ₹${Math.round(selectedTest.typicalPrice * selectedProvider.discountMultiplier).toLocaleString('en-IN')} Securely`}
                          </Text>
                        </>
                      )}
                    </TouchableOpacity>
                  </View>
                </View>

                {/* Right: Payment Recap */}
                <View style={styles.paymentRecapCol}>
                  <View style={styles.recapCard}>
                    <Text style={styles.recapCardTitle}>Appointment Details</Text>
                    <View style={styles.summaryDivider} />

                    <View style={styles.recapItem}>
                      <Text style={styles.recapLabel}>Patient</Text>
                      <Text style={styles.recapVal}>{selectedPatient?.name} ({selectedPatient?.relation})</Text>
                    </View>

                    <View style={styles.recapItem}>
                      <Text style={styles.recapLabel}>Scan Test</Text>
                      <Text style={styles.recapVal}>{selectedTest.name}</Text>
                    </View>

                    <View style={styles.recapItem}>
                      <Text style={styles.recapLabel}>Diagnostic Centre</Text>
                      <Text style={styles.recapVal}>{selectedProvider.name}</Text>
                    </View>

                    <View style={styles.recapItem}>
                      <Text style={styles.recapLabel}>Date & Time</Text>
                      <Text style={styles.recapVal}>
                        {appointmentDays[selectedDateIndex]?.fullLabel} at {selectedTimeSlot}
                      </Text>
                    </View>

                    <View style={styles.summaryDivider} />

                    <View style={styles.summaryRow}>
                      <Text style={styles.summaryRowLabel}>Base Price</Text>
                      <Text style={styles.summaryRowValue}>₹{selectedTest.mrp.toLocaleString('en-IN')}</Text>
                    </View>

                    <View style={styles.summaryRow}>
                      <Text style={styles.summaryDiscountLabel}>Discount</Text>
                      <Text style={styles.summaryDiscountValue}>
                        -₹{(selectedTest.mrp - Math.round(selectedTest.typicalPrice * selectedProvider.discountMultiplier)).toLocaleString('en-IN')}
                      </Text>
                    </View>

                    <View style={styles.summaryTotalRow}>
                      <Text style={styles.summaryTotalLabel}>Net Payable</Text>
                      <Text style={styles.summaryTotalValue}>
                        ₹{Math.round(selectedTest.typicalPrice * selectedProvider.discountMultiplier).toLocaleString('en-IN')}
                      </Text>
                    </View>
                  </View>
                </View>
              </View>
            </View>
          )}

          {/* VIEW 6: BOOKING CONFIRMATION */}
          {viewMode === 'confirmation' && latestBooking && (
            <View style={styles.confirmationWrap}>
              <View style={styles.confirmationCard}>
                {/* Success Animation & Badge */}
                <View style={styles.confirmIconWrap}>
                  <Ionicons name="checkmark-done" size={44} color="#FFFFFF" />
                </View>
                <Text style={styles.confirmTitle}>Appointment Confirmed!</Text>
                <Text style={styles.confirmSubtitle}>
                  Your radiology scan slot has been reserved. Centre notified and preparation instructions sent via SMS & WhatsApp.
                </Text>

                <View style={styles.bookingIdBadge}>
                  <Text style={styles.bookingIdLabel}>Booking ID:</Text>
                  <Text style={styles.bookingIdValue}>{latestBooking.id}</Text>
                </View>

                {/* Appointment Card Summary */}
                <View style={styles.confirmDetailsBox}>
                  <View style={styles.confirmDetailRow}>
                    <Text style={styles.confirmDetailLabel}>Patient Name:</Text>
                    <Text style={styles.confirmDetailVal}>{latestBooking.patientName}</Text>
                  </View>
                  <View style={styles.confirmDetailRow}>
                    <Text style={styles.confirmDetailLabel}>Scan / Test:</Text>
                    <Text style={styles.confirmDetailVal}>{latestBooking.testName}</Text>
                  </View>
                  <View style={styles.confirmDetailRow}>
                    <Text style={styles.confirmDetailLabel}>Diagnostic Centre:</Text>
                    <Text style={styles.confirmDetailVal}>{latestBooking.providerName}</Text>
                  </View>
                  <View style={styles.confirmDetailRow}>
                    <Text style={styles.confirmDetailLabel}>Centre Address:</Text>
                    <Text style={styles.confirmDetailVal}>{latestBooking.providerAddress}</Text>
                  </View>
                  <View style={styles.confirmDetailRow}>
                    <Text style={styles.confirmDetailLabel}>Date & Time:</Text>
                    <Text style={styles.confirmDetailVal}>
                      {latestBooking.formattedDate} at {latestBooking.timeSlot}
                    </Text>
                  </View>
                  <View style={styles.confirmDetailRow}>
                    <Text style={styles.confirmDetailLabel}>Amount Paid:</Text>
                    <Text style={styles.confirmDetailVal}>
                      ₹{latestBooking.paidAmount.toLocaleString('en-IN')} ({latestBooking.paymentStatus})
                    </Text>
                  </View>
                  <View style={styles.confirmDetailRow}>
                    <Text style={styles.confirmDetailLabel}>Booking Status:</Text>
                    <View style={styles.confirmedStatusPill}>
                      <Text style={styles.confirmedStatusText}>{latestBooking.bookingStatus}</Text>
                    </View>
                  </View>
                </View>

                {/* Instructions Box */}
                <View style={styles.patientArrivalNotice}>
                  <Ionicons name="information-circle" size={18} color="#0369A1" />
                  <Text style={styles.patientArrivalNoticeText}>
                    Please arrive 15 minutes before your scheduled time slot. Carry doctor's prescription and a valid government ID proof.
                  </Text>
                </View>

                {/* Confirmation Actions */}
                <View style={styles.confirmActionsRow}>
                  <TouchableOpacity
                    style={styles.confirmReceiptBtn}
                    onPress={() => setReceiptModal(latestBooking)}
                    activeOpacity={0.8}
                  >
                    <Ionicons name="receipt-outline" size={16} color="#0369A1" />
                    <Text style={styles.confirmReceiptBtnText}>Download Receipt</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.confirmCalendarBtn}
                    onPress={() => showAlert('Calendar', 'Appointment added to your device calendar.')}
                    activeOpacity={0.8}
                  >
                    <Ionicons name="calendar-outline" size={16} color="#00B894" />
                    <Text style={styles.confirmCalendarBtnText}>Add to Calendar</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.confirmMyBookingsBtn, { backgroundColor: '#1E3A8A' }]}
                    onPress={() => {
                      if (navigation && navigation.navigate) {
                        navigation.navigate('MyTests', { initialTab: 'radiology' });
                      } else {
                        navigateToView('my-bookings');
                      }
                    }}
                    activeOpacity={0.85}
                  >
                    <Ionicons name="documents-outline" size={16} color="#FFFFFF" style={{ marginRight: 6 }} />
                    <Text style={styles.confirmMyBookingsBtnText}>Go to My Tests</Text>
                    <Ionicons name="arrow-forward" size={16} color="#FFFFFF" />
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.confirmMyBookingsBtn}
                    onPress={() => navigateToView('my-bookings')}
                    activeOpacity={0.85}
                  >
                    <Text style={styles.confirmMyBookingsBtnText}>View Bookings</Text>
                    <Ionicons name="arrow-forward" size={16} color="#FFFFFF" />
                  </TouchableOpacity>
                </View>

                <TouchableOpacity
                  style={styles.backToRadioBtn}
                  onPress={() => navigateToView('categories')}
                >
                  <Text style={styles.backToRadioBtnText}>Back to Radiology Home</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* VIEW 7: MY RADIOLOGY BOOKINGS */}
          {viewMode === 'my-bookings' && (
            <View style={styles.sectionWrap}>
              <View style={styles.myBookingsHeaderRow}>
                <View>
                  <Text style={styles.sectionTitle}>My Radiology Bookings</Text>
                  <Text style={styles.sectionSubtitle}>
                    Track upcoming appointments, reschedule, download receipts and view certified PACS reports
                  </Text>
                </View>

                <TouchableOpacity
                  style={styles.bookNewScanBtn}
                  onPress={() => navigateToView('categories')}
                  activeOpacity={0.8}
                >
                  <Ionicons name="add" size={16} color="#FFFFFF" />
                  <Text style={styles.bookNewScanBtnText}>Book New Scan</Text>
                </TouchableOpacity>
              </View>

              {/* Tabs: Upcoming / Completed / Cancelled */}
              <View style={styles.myBookingsTabsRow}>
                {['Upcoming', 'Completed', 'Cancelled'].map((tab) => (
                  <TouchableOpacity
                    key={tab}
                    style={[
                      styles.myBookingsTabBtn,
                      myBookingsTab === tab && styles.myBookingsTabBtnActive,
                    ]}
                    onPress={() => setMyBookingsTab(tab)}
                    activeOpacity={0.8}
                  >
                    <Text
                      style={[
                        styles.myBookingsTabText,
                        myBookingsTab === tab && styles.myBookingsTabTextActive,
                      ]}
                    >
                      {tab}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Bookings List */}
              {displayedUserBookings.length === 0 ? (
                <View style={styles.emptyBookingsBox}>
                  <Ionicons name="calendar-outline" size={48} color="#94A3B8" />
                  <Text style={styles.emptyStateTitle}>No {myBookingsTab} Appointments</Text>
                  <Text style={styles.emptyStateSubtitle}>
                    You do not have any {myBookingsTab.toLowerCase()} radiology scans at this moment.
                  </Text>
                  <TouchableOpacity
                    style={styles.emptyExploreBtn}
                    onPress={() => navigateToView('categories')}
                  >
                    <Text style={styles.emptyExploreBtnText}>Browse Radiology Scans</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <View style={styles.userBookingsGrid}>
                  {displayedUserBookings.map((b) => (
                    <View key={b.id} style={styles.userBookingCard}>
                      {/* Top Row: ID, Category & Status */}
                      <View style={styles.userBookingTopRow}>
                        <View style={styles.bookingIdTag}>
                          <Text style={styles.bookingIdTagText}>{b.id}</Text>
                        </View>
                        <View
                          style={[
                            styles.userBookingStatusPill,
                            b.bookingStatus === 'Confirmed' && styles.statusConfirmed,
                            b.bookingStatus === 'Completed' && styles.statusCompleted,
                            b.bookingStatus === 'Cancelled' && styles.statusCancelled,
                          ]}
                        >
                          <Text
                            style={[
                              styles.userBookingStatusText,
                              b.bookingStatus === 'Confirmed' && styles.statusTextConfirmed,
                              b.bookingStatus === 'Completed' && styles.statusTextCompleted,
                              b.bookingStatus === 'Cancelled' && styles.statusTextCancelled,
                            ]}
                          >
                            {b.bookingStatus}
                          </Text>
                        </View>
                      </View>

                      {/* Main Info */}
                      <Text style={styles.userBookingTestTitle}>{b.testName}</Text>
                      <Text style={styles.userBookingCategory}>{b.categoryLabel}</Text>

                      <View style={styles.userBookingDetailsCol}>
                        <View style={styles.bookingMetaRow}>
                          <Ionicons name="business-outline" size={14} color="#64748B" />
                          <Text style={styles.bookingMetaText}>
                            {b.providerName} ({b.providerAddress})
                          </Text>
                        </View>
                        <View style={styles.bookingMetaRow}>
                          <Ionicons name="person-outline" size={14} color="#64748B" />
                          <Text style={styles.bookingMetaText}>{b.patientName}</Text>
                        </View>
                        <View style={styles.bookingMetaRow}>
                          <Ionicons name="time-outline" size={14} color="#64748B" />
                          <Text style={styles.bookingMetaText}>
                            {b.formattedDate} at <Text style={styles.boldText}>{b.timeSlot}</Text>
                          </Text>
                        </View>
                        <View style={styles.bookingMetaRow}>
                          <Ionicons name="cash-outline" size={14} color="#64748B" />
                          <Text style={styles.bookingMetaText}>
                            Amount: ₹{b.paidAmount.toLocaleString('en-IN')} • {b.paymentStatus}
                          </Text>
                        </View>
                        <View style={styles.bookingMetaRow}>
                          <Ionicons name="document-text-outline" size={14} color="#00B894" />
                          <Text style={[styles.bookingMetaText, { color: '#00B894', fontWeight: '600' }]}>
                            Report: {b.reportStatus}
                          </Text>
                        </View>
                      </View>

                      {/* Action Buttons */}
                      <View style={styles.userBookingActionsRow}>
                        <TouchableOpacity
                          style={styles.bookingActionReceiptBtn}
                          onPress={() => setReceiptModal(b)}
                          activeOpacity={0.7}
                        >
                          <Ionicons name="receipt-outline" size={14} color="#0369A1" />
                          <Text style={styles.bookingActionReceiptText}>Receipt</Text>
                        </TouchableOpacity>

                        {b.canReschedule && (
                          <TouchableOpacity
                            style={styles.bookingActionRescheduleBtn}
                            onPress={() => handleOpenReschedule(b)}
                            activeOpacity={0.7}
                          >
                            <Ionicons name="calendar-outline" size={14} color="#D97706" />
                            <Text style={styles.bookingActionRescheduleText}>Reschedule</Text>
                          </TouchableOpacity>
                        )}

                        {b.canCancel && (
                          <TouchableOpacity
                            style={styles.bookingActionCancelBtn}
                            onPress={() => handleCancelBooking(b.id)}
                            activeOpacity={0.7}
                          >
                            <Text style={styles.bookingActionCancelText}>Cancel</Text>
                          </TouchableOpacity>
                        )}

                        {b.bookingStatus === 'Completed' && (
                          <TouchableOpacity
                            style={styles.bookingActionReportBtn}
                            onPress={() => setReportModal(b)}
                            activeOpacity={0.8}
                          >
                            <Ionicons name="eye-outline" size={14} color="#FFFFFF" />
                            <Text style={styles.bookingActionReportText}>View Report</Text>
                          </TouchableOpacity>
                        )}
                      </View>
                    </View>
                  ))}
                </View>
              )}
            </View>
          )}
        </View>

        {/* ============================================================
            WEB FOOTER
        ============================================================ */}
        <WebFooter />
      </ScrollView>

      {/* ============================================================
          MODAL 1: TEST DETAILS & CLINICAL PROTOCOL MODAL
      ============================================================ */}
      <Modal
        visible={!!testDetailsModal}
        transparent
        animationType="fade"
        onRequestClose={() => setTestDetailsModal(null)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalContentCard}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalHeaderBadge}>Clinical Test Details & Guidelines</Text>
                <Text style={styles.modalHeaderTitle}>{testDetailsModal?.name}</Text>
              </View>
              <TouchableOpacity
                onPress={() => setTestDetailsModal(null)}
                style={styles.modalCloseBtn}
              >
                <Ionicons name="close" size={20} color="#64748B" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalScrollBody} showsVerticalScrollIndicator={false}>
              {/* Purpose */}
              <View style={styles.modalSection}>
                <Text style={styles.modalSectionTitle}>Purpose of the Test</Text>
                <Text style={styles.modalSectionText}>{testDetailsModal?.purpose}</Text>
              </View>

              {/* Fasting & Preparation */}
              <View style={styles.modalSection}>
                <Text style={styles.modalSectionTitle}>Preparation Instructions</Text>
                <Text style={styles.modalSectionText}>{testDetailsModal?.preparation}</Text>
                {testDetailsModal?.fastingRequired && (
                  <View style={styles.fastingAlert}>
                    <Ionicons name="alert-circle" size={18} color="#D97706" />
                    <Text style={styles.fastingAlertText}>
                      Strict fasting required: {testDetailsModal?.fastingHours} hours prior to appointment.
                    </Text>
                  </View>
                )}
              </View>

              {/* Procedure Details */}
              <View style={styles.modalSection}>
                <Text style={styles.modalSectionTitle}>Procedure Information</Text>
                <Text style={styles.modalSectionText}>{testDetailsModal?.procedure}</Text>
              </View>

              {/* Key Clinical Parameters */}
              <View style={styles.modalParamsGrid}>
                <View style={styles.modalParamBox}>
                  <Text style={styles.modalParamLabel}>Typical Duration</Text>
                  <Text style={styles.modalParamVal}>{testDetailsModal?.duration}</Text>
                </View>
                <View style={styles.modalParamBox}>
                  <Text style={styles.modalParamLabel}>Report Turnaround</Text>
                  <Text style={styles.modalParamVal}>{testDetailsModal?.reportTime}</Text>
                </View>
                <View style={styles.modalParamBox}>
                  <Text style={styles.modalParamLabel}>Contrast Used?</Text>
                  <Text style={styles.modalParamVal}>{testDetailsModal?.contrastUsed ? 'Yes (CECT/Contrast)' : 'No (Plain)'}</Text>
                </View>
                <View style={styles.modalParamBox}>
                  <Text style={styles.modalParamLabel}>Pricing</Text>
                  <Text style={styles.modalParamVal}>Starts at ₹{testDetailsModal?.typicalPrice?.toLocaleString('en-IN')}</Text>
                </View>
              </View>

              {/* Cancellation Policy */}
              <View style={styles.modalSection}>
                <Text style={styles.modalSectionTitle}>Cancellation & Rescheduling</Text>
                <Text style={styles.modalSectionText}>
                  Free cancellation and 100% instant refund up to 2 hours prior to scheduled appointment. Rescheduling is complimentary across available dates and slots.
                </Text>
              </View>
            </ScrollView>

            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={styles.modalCancelBtn}
                onPress={() => setTestDetailsModal(null)}
              >
                <Text style={styles.modalCancelBtnText}>Close</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.modalBookCtaBtn}
                onPress={() => {
                  const testToBook = testDetailsModal;
                  setTestDetailsModal(null);
                  if (testToBook.provider) {
                    handleStartBooking(testToBook.provider, testToBook);
                  } else {
                    handleSelectTest(testToBook);
                  }
                }}
              >
                <Text style={styles.modalBookCtaBtnText}>Compare Centres & Book Scan</Text>
                <Ionicons name="arrow-forward" size={16} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* ============================================================
          MODAL 2: CLINICAL PACS REPORT VIEWER
      ============================================================ */}
      <Modal
        visible={!!reportModal}
        transparent
        animationType="fade"
        onRequestClose={() => setReportModal(null)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalContentCard}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalHeaderBadge}>Certified PACS Diagnostic Report</Text>
                <Text style={styles.modalHeaderTitle}>{reportModal?.testName}</Text>
              </View>
              <TouchableOpacity
                onPress={() => setReportModal(null)}
                style={styles.modalCloseBtn}
              >
                <Ionicons name="close" size={20} color="#64748B" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalScrollBody} showsVerticalScrollIndicator={false}>
              {/* Report Header */}
              <View style={styles.reportLetterhead}>
                <View>
                  <Text style={styles.letterheadHospital}>{reportModal?.providerName}</Text>
                  <Text style={styles.letterheadSub}>Department of Radiodiagnosis & Imaging</Text>
                  <Text style={styles.letterheadAddress}>{reportModal?.providerAddress}</Text>
                </View>
                <View style={styles.nablSeal}>
                  <Text style={styles.nablSealText}>NABL & NABH ACCREDITED</Text>
                </View>
              </View>

              <View style={styles.reportDivider} />

              {/* Patient Demographics Table */}
              <View style={styles.reportPatientMeta}>
                <View style={styles.reportMetaCol}>
                  <Text style={styles.reportMetaLabel}>Patient Name:</Text>
                  <Text style={styles.reportMetaVal}>{reportModal?.patientName}</Text>
                  <Text style={styles.reportMetaLabel}>Age / Gender:</Text>
                  <Text style={styles.reportMetaVal}>{reportModal?.patientAge} Yrs / {reportModal?.patientGender}</Text>
                </View>
                <View style={styles.reportMetaCol}>
                  <Text style={styles.reportMetaLabel}>Scan Date:</Text>
                  <Text style={styles.reportMetaVal}>{reportModal?.formattedDate}</Text>
                  <Text style={styles.reportMetaLabel}>Report ID:</Text>
                  <Text style={styles.reportMetaVal}>{reportModal?.id}</Text>
                </View>
              </View>

              <View style={styles.reportDivider} />

              {/* Clinical Findings */}
              <View style={styles.clinicalFindingsBlock}>
                <Text style={styles.findingsHeading}>TECHNIQUE & SCAN PROTOCOL:</Text>
                <Text style={styles.findingsBody}>
                  Multi-slice high-resolution scan performed using standardized diagnostic protocols. Volumetric reformations in axial, coronal, and sagittal planes analyzed at 1mm thickness.
                </Text>

                <Text style={[styles.findingsHeading, { marginTop: 14 }]}>OBSERVATIONS & FINDINGS:</Text>
                <Text style={styles.findingsBody}>
                  • Normal anatomical contour and attenuation values observed across the examined region.{'\n'}
                  • No evidence of acute localized mass lesion, pathological enhancement, or abnormal calcification.{'\n'}
                  • Major vascular structures demonstrate normal caliber and patent flow signals.{'\n'}
                  • Visualized bony framework and adjacent soft tissue compartments are within normal physiological limits.
                </Text>

                <Text style={[styles.findingsHeading, { marginTop: 14 }]}>IMPRESSION & CLINICAL SUMMARY:</Text>
                <View style={styles.impressionBox}>
                  <Text style={styles.impressionText}>
                    NO ACUTE PATHOLOGICAL ABNORMALITY DETECTED. CORRELATE CLINICALLY WITH RELEVANT LAB MARKERS.
                  </Text>
                </View>

                {/* Radiologist Signature */}
                <View style={styles.signatureRow}>
                  <View style={styles.qrSeal}>
                    <Ionicons name="qr-code" size={40} color="#0369A1" />
                    <Text style={styles.qrText}>Digitally Verified</Text>
                  </View>
                  <View style={styles.doctorSignBlock}>
                    <Text style={styles.docSignature}>Dr. K. Srinivas, MD (Radio-Diagnosis)</Text>
                    <Text style={styles.docReg}>Consultant Radiologist • KMC Reg # 48291</Text>
                  </View>
                </View>
              </View>
            </ScrollView>

            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={styles.modalCancelBtn}
                onPress={() => setReportModal(null)}
              >
                <Text style={styles.modalCancelBtnText}>Close</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.modalBookCtaBtn}
                onPress={() => showAlert('Download Report', `PACS Report for ${reportModal?.id} downloaded to your device as PDF.`)}
              >
                <Ionicons name="download-outline" size={16} color="#FFFFFF" />
                <Text style={styles.modalBookCtaBtnText}>Download PDF Report</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* ============================================================
          MODAL 3: TAX INVOICE & RECEIPT MODAL
      ============================================================ */}
      <Modal
        visible={!!receiptModal}
        transparent
        animationType="fade"
        onRequestClose={() => setReceiptModal(null)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalContentCard}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalHeaderBadge}>Payment Receipt & Tax Invoice</Text>
                <Text style={styles.modalHeaderTitle}>Invoice #{receiptModal?.id}</Text>
              </View>
              <TouchableOpacity
                onPress={() => setReceiptModal(null)}
                style={styles.modalCloseBtn}
              >
                <Ionicons name="close" size={20} color="#64748B" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalScrollBody} showsVerticalScrollIndicator={false}>
              <View style={styles.receiptInvoiceBox}>
                <View style={styles.receiptHeader}>
                  <Text style={styles.receiptBrand}>MediUnify Healthcare Platform</Text>
                  <Text style={styles.receiptGst}>GSTIN: 29AABCM9124K1Z0</Text>
                </View>

                <View style={styles.receiptMetaGrid}>
                  <View>
                    <Text style={styles.receiptLabel}>Billed To:</Text>
                    <Text style={styles.receiptVal}>{receiptModal?.patientName}</Text>
                    <Text style={styles.receiptValSub}>{receiptModal?.patientPhone}</Text>
                  </View>
                  <View>
                    <Text style={styles.receiptLabel}>Centre Details:</Text>
                    <Text style={styles.receiptVal}>{receiptModal?.providerName}</Text>
                    <Text style={styles.receiptValSub}>{receiptModal?.providerAddress}</Text>
                  </View>
                </View>

                <View style={styles.receiptTable}>
                  <View style={styles.receiptTableHeader}>
                    <Text style={styles.thDesc}>Description</Text>
                    <Text style={styles.thAmount}>Amount (INR)</Text>
                  </View>
                  <View style={styles.receiptTableRow}>
                    <Text style={styles.tdDesc}>{receiptModal?.testName}</Text>
                    <Text style={styles.tdAmount}>₹{receiptModal?.basePrice?.toLocaleString('en-IN')}</Text>
                  </View>
                  <View style={styles.receiptTableRow}>
                    <Text style={styles.tdDiscount}>MediUnify Promotional Discount</Text>
                    <Text style={styles.tdDiscountAmount}>-₹{receiptModal?.discountAmount?.toLocaleString('en-IN')}</Text>
                  </View>
                  <View style={styles.receiptTableRow}>
                    <Text style={styles.tdDesc}>PACS Cloud Archival & Digital Film</Text>
                    <Text style={styles.tdAmount}>₹0 (FREE)</Text>
                  </View>
                </View>

                <View style={styles.receiptTotalRow}>
                  <Text style={styles.receiptTotalLabel}>Net Amount Paid:</Text>
                  <Text style={styles.receiptTotalAmount}>₹{receiptModal?.paidAmount?.toLocaleString('en-IN')}</Text>
                </View>
                <Text style={styles.receiptPaymentMode}>
                  Payment Mode: {receiptModal?.paymentStatus}
                </Text>
              </View>
            </ScrollView>

            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={styles.modalCancelBtn}
                onPress={() => setReceiptModal(null)}
              >
                <Text style={styles.modalCancelBtnText}>Close</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.modalBookCtaBtn}
                onPress={() => showAlert('Printed', 'Receipt sent to printer and saved as PDF.')}
              >
                <Ionicons name="print-outline" size={16} color="#FFFFFF" />
                <Text style={styles.modalBookCtaBtnText}>Print / Download Invoice</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* ============================================================
          MODAL 4: RESCHEDULE APPOINTMENT MODAL
      ============================================================ */}
      <Modal
        visible={!!rescheduleModal}
        transparent
        animationType="fade"
        onRequestClose={() => setRescheduleModal(null)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalContentCard}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalHeaderBadge}>Reschedule Appointment</Text>
                <Text style={styles.modalHeaderTitle}>{rescheduleModal?.testName}</Text>
              </View>
              <TouchableOpacity
                onPress={() => setRescheduleModal(null)}
                style={styles.modalCloseBtn}
              >
                <Ionicons name="close" size={20} color="#64748B" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalScrollBody} showsVerticalScrollIndicator={false}>
              <Text style={styles.subSectionTitle}>Select New Date</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.datesScrollRow}>
                {appointmentDays.map((d) => {
                  const isSelected = rescheduleDateIndex === d.index;
                  return (
                    <TouchableOpacity
                      key={d.index}
                      style={[
                        styles.datePillCard,
                        isSelected && styles.datePillCardActive,
                      ]}
                      onPress={() => setRescheduleDateIndex(d.index)}
                    >
                      <Text style={[styles.datePillDayName, isSelected && styles.datePillDayNameActive]}>
                        {d.dayName}
                      </Text>
                      <Text style={[styles.datePillDateNum, isSelected && styles.datePillDateNumActive]}>
                        {d.dateNum}
                      </Text>
                      <Text style={[styles.datePillMonthName, isSelected && styles.datePillMonthNameActive]}>
                        {d.monthName}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>

              <Text style={[styles.subSectionTitle, { marginTop: 20 }]}>Select New Time Slot</Text>
              <View style={styles.slotsPillsGrid}>
                {['08:30 AM', '10:00 AM', '11:30 AM', '02:00 PM', '04:00 PM', '05:30 PM'].map((slot) => {
                  const chosenDay = appointmentDays[rescheduleDateIndex] || appointmentDays[1];
                  const slotStatus = getSlotStatus({
                    date: chosenDay?.isoDate,
                    time: slot,
                    serviceType: 'radiology',
                    providerId: rescheduleModal?.centerName || rescheduleModal?.providerName,
                  });
                  const isAvailable = slotStatus.available;
                  const isSelected = rescheduleSlot === slot;
                  return (
                    <TouchableOpacity
                      key={slot}
                      style={[
                        styles.timeSlotBtn,
                        isSelected && styles.timeSlotBtnActive,
                        !isAvailable && styles.timeSlotBtnDisabled,
                      ]}
                      disabled={!isAvailable}
                      onPress={() => setRescheduleSlot(slot)}
                    >
                      <Text
                        style={[
                          styles.timeSlotText,
                          isSelected && styles.timeSlotTextActive,
                          !isAvailable && styles.timeSlotTextDisabled,
                        ]}
                      >
                        {slot}
                      </Text>
                      {!isAvailable && (
                        <View style={styles.slotStatusBadge}>
                          <Text style={styles.slotStatusBadgeText}>
                            {slotStatus.status === 'PASSED' ? 'Passed' : 'Booked'}
                          </Text>
                        </View>
                      )}
                    </TouchableOpacity>
                  );
                })}
              </View>
            </ScrollView>

            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={styles.modalCancelBtn}
                onPress={() => setRescheduleModal(null)}
              >
                <Text style={styles.modalCancelBtnText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.modalBookCtaBtn}
                onPress={handleConfirmReschedule}
              >
                <Text style={styles.modalBookCtaBtnText}>Confirm Reschedule</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

// ==================================================
// STYLES
// ==================================================
const styles = StyleSheet.create({
  safeContainer: {
    flex: 1,
    backgroundColor: '#FAFCFD',
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 40,
  },

  // Hero Section
  heroBannerWrap: {
    width: '100%',
    paddingVertical: 28,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#DCE7EC',
  },
  heroInnerContainer: {
    maxWidth: 1200,
    width: '100%',
    alignSelf: 'center',
  },
  topNavRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 20,
  },
  breadcrumbTrail: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexWrap: 'wrap',
  },
  crumbTouch: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  crumbLink: {
    fontSize: 13,
    color: '#0369A1',
    fontWeight: '500',
  },
  crumbActive: {
    fontSize: 13,
    color: '#1E293B',
    fontWeight: '700',
  },
  topUtilityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  citySelectorPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 6,
  },
  cityLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
  },
  cityPillOptions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  cityOptionBtn: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
  },
  cityOptionBtnActive: {
    backgroundColor: '#00B894',
  },
  cityOptionText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748B',
  },
  cityOptionTextActive: {
    color: '#FFFFFF',
  },
  myBookingsHeaderBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#BAE6FD',
    gap: 6,
  },
  myBookingsHeaderBtnActive: {
    backgroundColor: '#0369A1',
    borderColor: '#0369A1',
  },
  myBookingsHeaderBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0369A1',
  },
  myBookingsHeaderBtnTextActive: {
    color: '#FFFFFF',
  },
  bookingCountBadge: {
    backgroundColor: '#00B894',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 10,
  },
  bookingCountBadgeText: {
    fontSize: 10,
    color: '#FFFFFF',
    fontWeight: '800',
  },

  // Hero Content Block
  heroContentBlock: {
    marginTop: 6,
  },
  heroBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flexWrap: 'wrap',
    marginBottom: 10,
  },
  accreditedTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#A7F3D0',
    gap: 5,
  },
  accreditedTagText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#00B894',
  },
  pacsTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#BAE6FD',
    gap: 5,
  },
  pacsTagText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#0369A1',
  },
  heroHeading: {
    fontSize: 28,
    fontWeight: '800',
    color: '#0C3B6B',
    marginBottom: 8,
    letterSpacing: -0.5,
  },
  heroSubheading: {
    fontSize: 14,
    color: '#475569',
    lineHeight: 22,
    maxWidth: 820,
    marginBottom: 18,
  },
  heroSearchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#00B894',
    paddingHorizontal: 14,
    height: 50,
    shadowColor: '#00B894',
    shadowOpacity: 0.1,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    marginBottom: 12,
  },
  searchIcon: {
    marginRight: 10,
  },
  heroSearchInput: {
    flex: 1,
    fontSize: 14,
    color: '#1E293B',
    outlineStyle: 'none',
  },
  clearSearchBtn: {
    padding: 6,
  },
  popularChipsWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  popularChipsLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748B',
  },
  popularChipsScroll: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  popularChipPill: {
    backgroundColor: 'rgba(255, 255, 255, 0.85)',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 14,
  },
  popularChipText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#0369A1',
  },

  // Main Body
  mainBodyContainer: {
    maxWidth: 1200,
    width: '100%',
    alignSelf: 'center',
    paddingHorizontal: 16,
    paddingTop: 24,
  },
  sectionWrap: {
    width: '100%',
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginBottom: 18,
    flexWrap: 'wrap',
    gap: 10,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#0C3B6B',
    letterSpacing: -0.3,
  },
  sectionSubtitle: {
    fontSize: 13,
    color: '#64748B',
    marginTop: 3,
  },
  categoryCountLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#00B894',
    backgroundColor: '#E6F8F2',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },

  // Category Cards Grid
  categoriesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -8,
  },
  categoryCard: {
    width: '25%', // Default desktop 4 columns
    minWidth: 260,
    flexGrow: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 18,
    margin: 8,
    borderWidth: 1.5,
    shadowColor: '#64748B',
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    justifyContent: 'space-between',
  },
  catCardTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  catIconWrap: {
    width: 60,
    height: 60,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
  },
  cat3DIconImage: {
    width: '100%',
    height: '100%',
    borderRadius: 14,
  },
  catBadgePill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  catBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  catCardTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#1E293B',
    marginBottom: 3,
  },
  catCardTagline: {
    fontSize: 11,
    fontWeight: '700',
    color: '#0369A1',
    marginBottom: 8,
  },
  catCardDescription: {
    fontSize: 12,
    color: '#64748B',
    lineHeight: 18,
    marginBottom: 16,
  },
  catCardBottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  catCountBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  catCountText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
  },
  catExploreBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  catExploreBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#00B894',
  },

  // Trust Pillars Section
  trustHighlightsSection: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginTop: 30,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 20,
  },
  trustItem: {
    flex: 1,
    minWidth: 260,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  trustIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  trustTextCol: {
    flex: 1,
  },
  trustTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0C3B6B',
    marginBottom: 2,
  },
  trustDesc: {
    fontSize: 12,
    color: '#64748B',
    lineHeight: 16,
  },

  // VIEW 2: CATEGORY TESTS
  categoryBannerHero: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 22,
    borderRadius: 18,
    borderWidth: 1.5,
    marginBottom: 24,
    flexWrap: 'wrap',
    gap: 16,
  },
  catBannerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    flex: 1,
    minWidth: 280,
  },
  catLargeIconWrap: {
    width: 80,
    height: 80,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 10,
  },
  catBanner3DImage: {
    width: '100%',
    height: '100%',
    borderRadius: 18,
  },
  catBannerInfo: {
    flex: 1,
  },
  catBannerTagRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  catBannerBadge: {
    fontSize: 11,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  catBannerDot: {
    fontSize: 11,
    color: '#64748B',
  },
  catBannerTestCount: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748B',
  },
  catBannerTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#0C3B6B',
    marginBottom: 4,
  },
  catBannerDesc: {
    fontSize: 13,
    color: '#475569',
    lineHeight: 18,
  },
  changeCategoryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#BAE6FD',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
  },
  changeCategoryBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0369A1',
  },

  // Tests Grid
  testsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -8,
  },
  testCard: {
    width: '33.33%',
    minWidth: 290,
    flexGrow: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 18,
    margin: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#64748B',
    shadowOpacity: 0.05,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    justifyContent: 'space-between',
  },
  testCardTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  testCategoryTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  testCardMini3DIcon: {
    width: 16,
    height: 16,
    borderRadius: 4,
    marginRight: 5,
  },
  heroModalityMini3DIcon: {
    width: 20,
    height: 20,
    borderRadius: 4,
    marginRight: 6,
  },
  testCategoryTagText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#475569',
  },
  fastingPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    gap: 4,
  },
  fastingPillActive: {
    backgroundColor: '#FEF3C7',
  },
  fastingPillNone: {
    backgroundColor: '#ECFDF5',
  },
  fastingPillText: {
    fontSize: 10,
    fontWeight: '700',
  },
  fastingPillTextActive: {
    color: '#D97706',
  },
  fastingPillTextNone: {
    color: '#059669',
  },
  testCardName: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0C3B6B',
    marginBottom: 4,
  },
  testCardSummary: {
    fontSize: 12,
    color: '#64748B',
    lineHeight: 17,
    marginBottom: 12,
  },
  testKeyParamsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 16,
    flexWrap: 'wrap',
  },
  testParamItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  testParamText: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '500',
  },
  contrastTag: {
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  contrastTagText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#4F46E5',
  },
  testCardPriceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  testPriceCol: {},
  startsAtLabel: {
    fontSize: 10,
    color: '#94A3B8',
    fontWeight: '600',
  },
  priceNumbersRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 6,
  },
  discountedPrice: {
    fontSize: 18,
    fontWeight: '800',
    color: '#00B894',
  },
  mrpPrice: {
    fontSize: 12,
    color: '#94A3B8',
    textDecorationLine: 'line-through',
  },
  testCardActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  viewDetailsBtn: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#CBD5E1',
  },
  viewDetailsBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#475569',
  },
  compareCentresBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#00B894',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
    gap: 4,
  },
  compareCentresBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FFFFFF',
  },

  // VIEW 3: PROVIDERS
  selectedTestHeroCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 16,
    flexWrap: 'wrap',
    gap: 16,
  },
  selectedTestHeroLeft: {
    flex: 1,
    minWidth: 280,
  },
  selectedTestModalityPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#E6F8F2',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
    alignSelf: 'flex-start',
    marginBottom: 6,
  },
  selectedTestModalityText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#00B894',
  },
  selectedTestHeroTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#0C3B6B',
    marginBottom: 4,
  },
  selectedTestHeroPurpose: {
    fontSize: 13,
    color: '#475569',
    lineHeight: 18,
    marginBottom: 10,
  },
  selectedTestHeroBadges: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flexWrap: 'wrap',
  },
  heroMiniBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#F8FAFC',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  heroMiniBadgeText: {
    fontSize: 11,
    color: '#475569',
    fontWeight: '600',
  },
  selectedTestHeroRight: {
    flexDirection: 'column',
    gap: 8,
  },
  changeTestPillBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#E0F2FE',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 16,
  },
  changeTestPillBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0369A1',
  },
  viewProtocolBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#E6F8F2',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 16,
  },
  viewProtocolBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#00B894',
  },

  // Filter Toolbar
  filterToolbarCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 16,
    gap: 12,
  },
  providerSearchInputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    paddingHorizontal: 12,
    height: 40,
    gap: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  providerSearchInput: {
    flex: 1,
    fontSize: 13,
    color: '#1E293B',
    outlineStyle: 'none',
  },
  filterChipsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 5,
  },
  filterChipActive: {
    backgroundColor: '#00B894',
  },
  filterChipText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#475569',
  },
  filterChipTextActive: {
    color: '#FFFFFF',
  },
  sortSelectorWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginLeft: 10,
  },
  sortLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748B',
  },
  sortOptionBtn: {
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 12,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  sortOptionBtnActive: {
    backgroundColor: '#0369A1',
    borderColor: '#0369A1',
  },
  sortOptionText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#64748B',
  },
  sortOptionTextActive: {
    color: '#FFFFFF',
  },

  providersListingHeader: {
    marginBottom: 14,
  },
  providersListingTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0C3B6B',
  },
  providersListingHint: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },

  // Provider Card
  providersList: {
    gap: 14,
  },
  providerCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 18,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#64748B',
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
  },
  providerCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
    flexWrap: 'wrap',
    gap: 10,
  },
  providerIdentity: {
    flex: 1,
    minWidth: 260,
  },
  providerNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
    marginBottom: 4,
  },
  providerName: {
    fontSize: 17,
    fontWeight: '800',
    color: '#0C3B6B',
  },
  providerAccredPill: {
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  providerAccredText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#00B894',
  },
  providerLocationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    flexWrap: 'wrap',
  },
  providerAddressText: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '500',
  },
  providerDot: {
    fontSize: 12,
    color: '#94A3B8',
  },
  providerDistanceText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0369A1',
  },
  providerTypeText: {
    fontSize: 11,
    color: '#475569',
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  providerRatingBox: {
    alignItems: 'flex-end',
  },
  ratingNumberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FFFBEB',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  ratingScore: {
    fontSize: 13,
    fontWeight: '800',
    color: '#B45309',
  },
  reviewsCountText: {
    fontSize: 10,
    color: '#94A3B8',
    marginTop: 2,
  },
  providerFacilitiesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
    marginBottom: 12,
  },
  facilityChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#F8FAFC',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  facilityChipText: {
    fontSize: 11,
    color: '#475569',
    fontWeight: '500',
  },
  providerSlotsBlock: {
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    padding: 10,
    marginBottom: 14,
  },
  slotsLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginBottom: 6,
  },
  slotsLabelText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#475569',
  },
  slotsPillsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexWrap: 'wrap',
  },
  miniSlotPill: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  miniSlotText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#1E293B',
  },
  providerCardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    flexWrap: 'wrap',
    gap: 12,
  },
  reportDeliveryNote: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  reportDeliveryNoteText: {
    fontSize: 12,
    color: '#64748B',
  },
  reportDeliveryBold: {
    fontWeight: '700',
    color: '#0C3B6B',
  },
  providerPriceBlock: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  discountBadgeWrap: {
    backgroundColor: '#E6F8F2',
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 6,
  },
  discountBadgeWrapText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#00B894',
  },
  priceNumbersCol: {
    alignItems: 'flex-start',
  },
  providerFinalPrice: {
    fontSize: 20,
    fontWeight: '800',
    color: '#00B894',
  },
  providerMrpPrice: {
    fontSize: 11,
    color: '#94A3B8',
    textDecorationLine: 'line-through',
  },
  providerActionButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  providerDetailsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#BAE6FD',
    backgroundColor: '#F0F9FF',
  },
  providerDetailsBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0369A1',
  },
  providerBookBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#00B894',
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 8,
  },
  providerBookBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },

  // VIEW 4: BOOKING FLOW CONTAINER
  bookingFlowContainer: {
    width: '100%',
  },
  stepperHeader: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 20,
  },
  stepperProgressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  stepCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepCircleActive: {
    backgroundColor: '#00B894',
  },
  stepCircleCompleted: {
    backgroundColor: '#059669',
  },
  stepCircleNum: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748B',
  },
  stepCircleNumActive: {
    color: '#FFFFFF',
  },
  stepLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748B',
  },
  stepLabelActive: {
    fontWeight: '800',
    color: '#0C3B6B',
  },
  stepConnector: {
    width: 50,
    height: 2,
    backgroundColor: '#E2E8F0',
    marginHorizontal: 12,
  },
  stepConnectorActive: {
    backgroundColor: '#00B894',
  },

  bookingMainLayout: {
    flexDirection: 'row',
    gap: 20,
    alignItems: 'flex-start',
    flexWrap: 'wrap',
  },
  bookingWizardLeftCol: {
    flex: 2,
    minWidth: 320,
  },
  bookingSummaryRightCol: {
    flex: 1,
    minWidth: 280,
  },
  wizardCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 22,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#64748B',
    shadowOpacity: 0.05,
    shadowRadius: 8,
  },
  wizardStepTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  wizardStepHeading: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0C3B6B',
  },
  wizardStepSub: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },

  // Patients
  patientCardsList: {
    gap: 10,
    marginBottom: 16,
  },
  patientCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    backgroundColor: '#FAFCFD',
    gap: 12,
  },
  patientCardSelected: {
    borderColor: '#00B894',
    backgroundColor: '#F0FDF4',
  },
  patientRadioWrap: {},
  radioOuter: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 2,
    borderColor: '#CBD5E1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioOuterSelected: {
    borderColor: '#00B894',
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#00B894',
  },
  patientInfoCol: {
    flex: 1,
  },
  patientNameRelationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  patientNameText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1E293B',
  },
  relationBadge: {
    backgroundColor: '#E0F2FE',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  relationBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#0369A1',
  },
  patientMetaText: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  addNewPatientBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: '#00B894',
    borderRadius: 12,
    gap: 6,
    backgroundColor: '#F0FDF4',
  },
  addNewPatientBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#00B894',
  },
  newPatientFormBox: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 16,
  },
  formSectionTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0C3B6B',
    marginBottom: 12,
  },
  formRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  formInputGroup: {
    flex: 1,
  },
  formInputGroupSmall: {
    width: 80,
  },
  inputLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#475569',
    marginBottom: 4,
  },
  textInputBox: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 8,
    paddingHorizontal: 12,
    height: 40,
    fontSize: 13,
    color: '#1E293B',
  },
  genderSelectRow: {
    flexDirection: 'row',
    gap: 6,
  },
  genderPill: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    backgroundColor: '#FFFFFF',
  },
  genderPillActive: {
    borderColor: '#00B894',
    backgroundColor: '#E6F8F2',
  },
  genderPillText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#475569',
  },
  genderPillTextActive: {
    color: '#00B894',
    fontWeight: '700',
  },
  formActionsRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
    marginTop: 12,
  },
  cancelFormBtn: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
  },
  cancelFormBtnText: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '600',
  },
  savePatientBtn: {
    backgroundColor: '#00B894',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
  },
  savePatientBtnText: {
    fontSize: 12,
    color: '#FFFFFF',
    fontWeight: '700',
  },

  // Wizard Footer
  wizardFooterBtnRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 24,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  wizardBackBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  wizardBackBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#64748B',
  },
  wizardNextBtn: {
    backgroundColor: '#00B894',
    paddingHorizontal: 22,
    paddingVertical: 12,
    borderRadius: 10,
    marginLeft: 'auto',
  },
  wizardNextBtnText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#FFFFFF',
  },

  // STEP 2: DATES & SLOTS
  subSectionTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0C3B6B',
    marginBottom: 10,
  },
  datesScrollRow: {
    flexDirection: 'row',
    gap: 10,
    paddingBottom: 6,
  },
  datePillCard: {
    width: 72,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: '#F8FAFC',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    alignItems: 'center',
    gap: 2,
  },
  datePillCardActive: {
    backgroundColor: '#00B894',
    borderColor: '#00B894',
  },
  datePillDayName: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748B',
  },
  datePillDayNameActive: {
    color: '#FFFFFF',
  },
  datePillDateNum: {
    fontSize: 18,
    fontWeight: '800',
    color: '#1E293B',
  },
  datePillDateNumActive: {
    color: '#FFFFFF',
  },
  datePillMonthName: {
    fontSize: 10,
    fontWeight: '600',
    color: '#94A3B8',
  },
  datePillMonthNameActive: {
    color: '#FFFFFF',
  },
  selectedDateNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#ECFDF5',
    padding: 10,
    borderRadius: 8,
    marginTop: 10,
  },
  selectedDateNoticeText: {
    fontSize: 12,
    color: '#065F46',
  },
  boldText: {
    fontWeight: '700',
  },
  slotCategoryGroup: {
    marginBottom: 16,
  },
  slotCategoryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  slotCategoryTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#475569',
  },
  slotsPillsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  timeSlotBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CBD5E1',
  },
  timeSlotBtnActive: {
    backgroundColor: '#00B894',
    borderColor: '#00B894',
  },
  timeSlotBtnDisabled: {
    backgroundColor: '#F1F5F9',
    borderColor: '#E2E8F0',
    opacity: 0.65,
  },
  timeSlotText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1E293B',
  },
  timeSlotTextActive: {
    color: '#FFFFFF',
  },
  timeSlotTextDisabled: {
    color: '#94A3B8',
    textDecorationLine: 'line-through',
  },
  slotStatusBadge: {
    backgroundColor: '#FEE2E2',
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: 4,
    marginLeft: 2,
  },
  slotStatusBadgeText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#DC2626',
    textTransform: 'uppercase',
  },

  // STEP 3: REVIEW SUMMARY
  reviewBlocksWrap: {
    gap: 12,
  },
  reviewCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  reviewCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  reviewCardTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: '#475569',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  reviewEditLink: {
    fontSize: 12,
    fontWeight: '700',
    color: '#00B894',
  },
  reviewMainText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0C3B6B',
  },
  reviewSubText: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  dividerSubtle: {
    height: 1,
    backgroundColor: '#E2E8F0',
    marginVertical: 8,
  },
  instructionsAlertBox: {
    flexDirection: 'row',
    backgroundColor: '#F0F9FF',
    borderWidth: 1,
    borderColor: '#BAE6FD',
    borderRadius: 12,
    padding: 14,
    gap: 10,
  },
  instructionsAlertCol: {
    flex: 1,
  },
  instructionsAlertTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0369A1',
    marginBottom: 4,
  },
  instructionsAlertText: {
    fontSize: 12,
    color: '#475569',
    lineHeight: 17,
  },
  instructionsFastingWarning: {
    fontSize: 12,
    fontWeight: '700',
    color: '#D97706',
    marginTop: 6,
  },

  // Right Column Price Breakdown Card
  summaryCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 18,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#64748B',
    shadowOpacity: 0.05,
    shadowRadius: 8,
  },
  summaryCardTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0C3B6B',
  },
  summaryDivider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginVertical: 12,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  summaryRowLabel: {
    fontSize: 13,
    color: '#64748B',
  },
  summaryRowValue: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1E293B',
  },
  summaryDiscountLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#00B894',
  },
  summaryDiscountValue: {
    fontSize: 13,
    fontWeight: '800',
    color: '#00B894',
  },
  summaryFreeValue: {
    fontSize: 12,
    fontWeight: '800',
    color: '#059669',
  },
  summaryTotalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
    marginBottom: 12,
  },
  summaryTotalLabel: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0C3B6B',
  },
  summaryTaxesInc: {
    fontSize: 10,
    color: '#94A3B8',
  },
  summaryTotalValue: {
    fontSize: 22,
    fontWeight: '800',
    color: '#00B894',
  },
  guaranteeBox: {
    flexDirection: 'row',
    backgroundColor: '#ECFDF5',
    padding: 10,
    borderRadius: 8,
    gap: 8,
  },
  guaranteeText: {
    fontSize: 11,
    color: '#065F46',
    lineHeight: 16,
    flex: 1,
  },

  // VIEW 5: PAYMENT CONTAINER
  paymentContainer: {
    flexDirection: 'row',
    gap: 20,
    alignItems: 'flex-start',
    flexWrap: 'wrap',
  },
  paymentMethodsCol: {
    flex: 2,
    minWidth: 320,
  },
  paymentRecapCol: {
    flex: 1,
    minWidth: 280,
  },
  paymentCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 22,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  paymentHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 20,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  paymentHeading: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0C3B6B',
  },
  paymentSub: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  paymentTabOptions: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
    marginBottom: 18,
  },
  paymentTabBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#CBD5E1',
  },
  paymentTabBtnActive: {
    backgroundColor: '#E6F8F2',
    borderColor: '#00B894',
  },
  paymentTabText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
  },
  paymentTabTextActive: {
    color: '#00B894',
    fontWeight: '800',
  },
  paymentMethodFormArea: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 20,
  },
  upiFormWrap: {},
  formLabelBold: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0C3B6B',
  },
  formSub: {
    fontSize: 12,
    color: '#64748B',
    marginBottom: 12,
  },
  upiInputRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  upiTextInput: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 8,
    paddingHorizontal: 12,
    height: 42,
    fontSize: 13,
  },
  verifyUpiBtn: {
    backgroundColor: '#0369A1',
    paddingHorizontal: 16,
    justifyContent: 'center',
    borderRadius: 8,
  },
  verifyUpiBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  upiAppsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  upiAppBadge: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  upiAppBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#475569',
  },
  cardFormWrap: {
    gap: 12,
  },
  netbankingFormWrap: {},
  bankPillsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 8,
  },
  bankPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  bankPillText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0369A1',
  },
  payAtCentreBox: {
    alignItems: 'center',
    paddingVertical: 12,
    gap: 8,
  },
  payAtCentreHeading: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0C3B6B',
  },
  payAtCentreText: {
    fontSize: 12,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 18,
    maxWidth: 420,
  },
  executePayBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#00B894',
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
  },
  executePayBtnText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  recapCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 18,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  recapCardTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0C3B6B',
  },
  recapItem: {
    marginBottom: 8,
  },
  recapLabel: {
    fontSize: 11,
    color: '#94A3B8',
    fontWeight: '600',
  },
  recapVal: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1E293B',
    marginTop: 1,
  },

  // VIEW 6: CONFIRMATION
  confirmationWrap: {
    maxWidth: 700,
    width: '100%',
    alignSelf: 'center',
    paddingVertical: 20,
  },
  confirmationCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 28,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
    shadowColor: '#64748B',
    shadowOpacity: 0.08,
    shadowRadius: 12,
  },
  confirmIconWrap: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#00B894',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    shadowColor: '#00B894',
    shadowOpacity: 0.3,
    shadowRadius: 12,
  },
  confirmTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#0C3B6B',
    marginBottom: 6,
  },
  confirmSubtitle: {
    fontSize: 13,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 18,
    maxWidth: 480,
    marginBottom: 18,
  },
  bookingIdBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#F0F9FF',
    borderWidth: 1,
    borderColor: '#BAE6FD',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    marginBottom: 20,
  },
  bookingIdLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#0369A1',
  },
  bookingIdValue: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0369A1',
  },
  confirmDetailsBox: {
    width: '100%',
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    padding: 16,
    gap: 10,
    marginBottom: 16,
  },
  confirmDetailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  confirmDetailLabel: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '500',
  },
  confirmDetailVal: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1E293B',
  },
  confirmedStatusPill: {
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  confirmedStatusText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#059669',
  },
  patientArrivalNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#F0F9FF',
    borderRadius: 10,
    padding: 12,
    marginBottom: 20,
  },
  patientArrivalNoticeText: {
    fontSize: 11,
    color: '#0369A1',
    lineHeight: 16,
    flex: 1,
  },
  confirmActionsRow: {
    flexDirection: 'row',
    gap: 10,
    flexWrap: 'wrap',
    justifyContent: 'center',
    marginBottom: 14,
  },
  confirmReceiptBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#F0F9FF',
    borderWidth: 1,
    borderColor: '#BAE6FD',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 8,
  },
  confirmReceiptBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0369A1',
  },
  confirmCalendarBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#ECFDF5',
    borderWidth: 1,
    borderColor: '#A7F3D0',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 8,
  },
  confirmCalendarBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#00B894',
  },
  confirmMyBookingsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#00B894',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
  },
  confirmMyBookingsBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  backToRadioBtn: {
    paddingVertical: 6,
  },
  backToRadioBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748B',
  },

  // VIEW 7: MY RADIOLOGY BOOKINGS
  myBookingsHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    flexWrap: 'wrap',
    gap: 10,
  },
  bookNewScanBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#00B894',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
  },
  bookNewScanBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  myBookingsTabsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 18,
  },
  myBookingsTabBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CBD5E1',
  },
  myBookingsTabBtnActive: {
    backgroundColor: '#00B894',
    borderColor: '#00B894',
  },
  myBookingsTabText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#64748B',
  },
  myBookingsTabTextActive: {
    color: '#FFFFFF',
  },
  emptyBookingsBox: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 36,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  emptyExploreBtn: {
    backgroundColor: '#00B894',
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 8,
    marginTop: 14,
  },
  emptyExploreBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  userBookingsGrid: {
    gap: 14,
  },
  userBookingCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 18,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#64748B',
    shadowOpacity: 0.05,
    shadowRadius: 8,
  },
  userBookingTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  bookingIdTag: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  bookingIdTagText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#475569',
  },
  userBookingStatusPill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  statusConfirmed: {
    backgroundColor: '#ECFDF5',
  },
  statusCompleted: {
    backgroundColor: '#E0F2FE',
  },
  statusCancelled: {
    backgroundColor: '#FEF2F2',
  },
  userBookingStatusText: {
    fontSize: 11,
    fontWeight: '800',
  },
  statusTextConfirmed: {
    color: '#059669',
  },
  statusTextCompleted: {
    color: '#0369A1',
  },
  statusTextCancelled: {
    color: '#DC2626',
  },
  userBookingTestTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#0C3B6B',
  },
  userBookingCategory: {
    fontSize: 12,
    fontWeight: '600',
    color: '#00B894',
    marginBottom: 10,
  },
  userBookingDetailsCol: {
    gap: 4,
    marginBottom: 14,
  },
  bookingMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  bookingMetaText: {
    fontSize: 12,
    color: '#475569',
  },
  userBookingActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    flexWrap: 'wrap',
  },
  bookingActionReceiptBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#F0F9FF',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
  },
  bookingActionReceiptText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#0369A1',
  },
  bookingActionRescheduleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
  },
  bookingActionRescheduleText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#D97706',
  },
  bookingActionCancelBtn: {
    backgroundColor: '#FEF2F2',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
  },
  bookingActionCancelText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#DC2626',
  },
  bookingActionReportBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#00B894',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    marginLeft: 'auto',
  },
  bookingActionReportText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FFFFFF',
  },

  // Empty State Box
  emptyStateBox: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 32,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 8,
  },
  emptyStateTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0C3B6B',
  },
  emptyStateSubtitle: {
    fontSize: 12,
    color: '#64748B',
    textAlign: 'center',
    maxWidth: 380,
  },
  emptyResetBtn: {
    backgroundColor: '#0369A1',
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 8,
    marginTop: 6,
  },
  emptyResetBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },

  // MODAL SHARED STYLES
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContentCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    maxWidth: 620,
    width: '100%',
    maxHeight: '90%',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  modalHeaderBadge: {
    fontSize: 11,
    fontWeight: '800',
    color: '#00B894',
    textTransform: 'uppercase',
  },
  modalHeaderTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0C3B6B',
    marginTop: 2,
  },
  modalCloseBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalScrollBody: {
    padding: 20,
  },
  modalSection: {
    marginBottom: 16,
  },
  modalSectionTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0C3B6B',
    marginBottom: 4,
  },
  modalSectionText: {
    fontSize: 12,
    color: '#475569',
    lineHeight: 18,
  },
  fastingAlert: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FEF3C7',
    padding: 8,
    borderRadius: 8,
    marginTop: 6,
  },
  fastingAlertText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#D97706',
  },
  modalParamsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    backgroundColor: '#F8FAFC',
    padding: 12,
    borderRadius: 12,
    marginBottom: 16,
  },
  modalParamBox: {
    width: '46%',
    flexGrow: 1,
  },
  modalParamLabel: {
    fontSize: 10,
    color: '#94A3B8',
    fontWeight: '700',
  },
  modalParamVal: {
    fontSize: 12,
    fontWeight: '800',
    color: '#1E293B',
    marginTop: 1,
  },
  modalFooter: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    gap: 10,
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    backgroundColor: '#FAFCFD',
  },
  modalCancelBtn: {
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 8,
  },
  modalCancelBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748B',
  },
  modalBookCtaBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#00B894',
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 8,
  },
  modalBookCtaBtnText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#FFFFFF',
  },

  // REPORT LETTERHEAD
  reportLetterhead: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  letterheadHospital: {
    fontSize: 17,
    fontWeight: '800',
    color: '#0C3B6B',
  },
  letterheadSub: {
    fontSize: 11,
    fontWeight: '700',
    color: '#00B894',
  },
  letterheadAddress: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
  },
  nablSeal: {
    backgroundColor: '#ECFDF5',
    borderWidth: 1,
    borderColor: '#A7F3D0',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  nablSealText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#059669',
  },
  reportDivider: {
    height: 1,
    backgroundColor: '#E2E8F0',
    marginVertical: 10,
  },
  reportPatientMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  reportMetaCol: {
    gap: 2,
  },
  reportMetaLabel: {
    fontSize: 10,
    color: '#94A3B8',
    fontWeight: '600',
  },
  reportMetaVal: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 4,
  },
  clinicalFindingsBlock: {
    marginTop: 8,
  },
  findingsHeading: {
    fontSize: 11,
    fontWeight: '800',
    color: '#0369A1',
    letterSpacing: 0.5,
  },
  findingsBody: {
    fontSize: 12,
    color: '#334155',
    lineHeight: 18,
    marginTop: 4,
  },
  impressionBox: {
    backgroundColor: '#F0F9FF',
    borderLeftWidth: 3,
    borderLeftColor: '#00B894',
    padding: 10,
    marginVertical: 8,
  },
  impressionText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#0C3B6B',
    lineHeight: 16,
  },
  signatureRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 20,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  qrSeal: {
    alignItems: 'center',
  },
  qrText: {
    fontSize: 9,
    color: '#0369A1',
    fontWeight: '700',
  },
  doctorSignBlock: {
    alignItems: 'flex-end',
  },
  docSignature: {
    fontSize: 12,
    fontWeight: '800',
    color: '#0C3B6B',
  },
  docReg: {
    fontSize: 10,
    color: '#64748B',
    marginTop: 2,
  },

  // RECEIPT INVOICE
  receiptInvoiceBox: {
    backgroundColor: '#FAFCFD',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  receiptHeader: {
    marginBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    paddingBottom: 8,
  },
  receiptBrand: {
    fontSize: 15,
    fontWeight: '800',
    color: '#00B894',
  },
  receiptGst: {
    fontSize: 11,
    color: '#64748B',
  },
  receiptMetaGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  receiptLabel: {
    fontSize: 10,
    color: '#94A3B8',
    fontWeight: '700',
  },
  receiptVal: {
    fontSize: 12,
    fontWeight: '800',
    color: '#1E293B',
  },
  receiptValSub: {
    fontSize: 11,
    color: '#64748B',
  },
  receiptTable: {
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 8,
    overflow: 'hidden',
    marginBottom: 12,
  },
  receiptTableHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#F1F5F9',
    padding: 8,
  },
  thDesc: {
    fontSize: 11,
    fontWeight: '700',
    color: '#475569',
  },
  thAmount: {
    fontSize: 11,
    fontWeight: '700',
    color: '#475569',
  },
  receiptTableRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 8,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  tdDesc: {
    fontSize: 11,
    color: '#1E293B',
  },
  tdAmount: {
    fontSize: 11,
    fontWeight: '600',
    color: '#1E293B',
  },
  tdDiscount: {
    fontSize: 11,
    color: '#00B894',
    fontWeight: '600',
  },
  tdDiscountAmount: {
    fontSize: 11,
    fontWeight: '700',
    color: '#00B894',
  },
  receiptTotalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    marginBottom: 4,
  },
  receiptTotalLabel: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0C3B6B',
  },
  receiptTotalAmount: {
    fontSize: 15,
    fontWeight: '800',
    color: '#00B894',
  },
  receiptPaymentMode: {
    fontSize: 11,
    color: '#64748B',
    fontStyle: 'italic',
  },
});
