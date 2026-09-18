import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Image,
  Platform,
  useWindowDimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { showAlert } from '../../../utils/alert';
import {
  availableNursingServices,
  howItWorksSteps,
  careTimelineStages,
  assignedNursesData,
  initialNursingRequests,
} from '../../../data/homeNursingData';

const ASYNC_KEY_NURSING_REQUESTS = '@unnathi_home_nursing_requests';

// Extended pricing and duration metadata for services
const SERVICE_METADATA = {
  'ns-1': { price: '₹299', duration: '30 mins', shiftType: 'Per Visit', popular: true, tag: 'Most Booked' },
  'ns-2': { price: '₹349', duration: '45 mins', shiftType: 'Per Visit', popular: false },
  'ns-3': { price: '₹449', duration: '45 mins', shiftType: 'Per Visit', popular: true, tag: 'Post-Surgery Favorite' },
  'ns-4': { price: '₹249', duration: '30 mins', shiftType: 'Per Visit', popular: false },
  'ns-5': { price: '₹199', duration: '20 mins', shiftType: 'Per Visit', popular: false },
  'ns-6': { price: '₹799', duration: '90 mins', shiftType: 'Per Visit / Shift', popular: true, tag: 'Doctor Recommended' },
  'ns-7': { price: '₹549', duration: '45 mins', shiftType: 'Per Visit', popular: false },
  'ns-8': { price: '₹1,199', duration: '8 Hours', shiftType: 'Day Shift', popular: false },
  'ns-9': { price: '₹1,299', duration: '12 Hours', shiftType: 'Full Day / Night', popular: true, tag: 'Elderly Care' },
  'ns-10': { price: '₹999', duration: '2 Hours', shiftType: 'Transition Care', popular: false },
  'ns-11': { price: 'Custom Quote', duration: 'Flexible', shiftType: 'Tailored Scope', popular: false },
};

const SERVICE_NUMERIC_PRICES = {
  'ns-1': 299,
  'ns-2': 349,
  'ns-3': 449,
  'ns-4': 249,
  'ns-5': 199,
  'ns-6': 799,
  'ns-7': 549,
  'ns-8': 1199,
  'ns-9': 1299,
  'ns-10': 999,
  'ns-11': 899,
};

const getServicePriceByName = (srvName) => {
  const found = availableNursingServices.find((s) => s.name === srvName);
  if (found && SERVICE_NUMERIC_PRICES[found.id]) {
    return SERVICE_NUMERIC_PRICES[found.id];
  }
  return 299;
};

const CALENDAR_MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const SERVICE_CATEGORIES = [
  'All Services',
  'Post-Surgical',
  'Wound & Dressing',
  'Injections & IV',
  'Geriatric Care',
  'Monitoring',
  'Intensive & Bedridden',
];

const PATIENT_TESTIMONIALS = [
  {
    id: 't1',
    patient: 'S. Venkataram (76 yrs)',
    family: 'Booked by son Arun V.',
    location: 'Saraswathipuram, Mysuru',
    rating: 5,
    service: 'Post-Op Hip Surgery & Dressing',
    text: 'Nurse Anita was exceptionally gentle with my mother after her hip replacement. Sterile dressing, daily vitals, and very polite. Coordinator called in 10 mins. Truly hospital-grade care at home.',
    date: '3 days ago',
  },
  {
    id: 't2',
    patient: 'Savithri Devi (72 yrs)',
    family: 'Booked by daughter Deepa M.',
    location: 'Gokulam 3rd Stage, Mysuru',
    rating: 5,
    service: 'Daily Insulin & Vital Monitoring',
    text: 'We were struggling with managing morning insulin injections and blood sugar spikes. MediUnify assigned a licensed B.Sc nurse who arrives exactly at 8 AM every day. Zero advance deposit needed.',
    date: '1 week ago',
  },
  {
    id: 't3',
    patient: 'Anand Murthy (68 yrs)',
    family: 'Booked by spouse Lakshmi M.',
    location: 'Jayalakshmipuram, Mysuru',
    rating: 5,
    service: '12-Hour Night Nursing Care',
    text: 'Post-stroke night supervision was our biggest worry. Nurse Suresh is attentive, highly trained in catheter care and patient repositioning. Gives our family immense peace of mind.',
    date: '2 weeks ago',
  },
];

const FAQS = [
  {
    q: 'How quickly can a certified nurse visit our home?',
    a: 'For urgent requirements (injections, acute wound dressing, post-discharge catheter care), a verified nurse can arrive within 2 to 4 hours in Mysuru and Bengaluru. Routine shifts can be scheduled at your preferred time slot.',
  },
  {
    q: 'Are the nurses qualified and background-verified?',
    a: 'Yes, 100% of our nursing personnel are licensed GNM (General Nursing and Midwifery) or B.Sc Nursing degree holders registered with the Karnataka Nursing Council (KNC), with rigorous police verification and hospital experience.',
  },
  {
    q: 'Do nurses bring their own sterile medical consumables?',
    a: 'Yes! Nurses arrive equipped with sterile single-use medical kits including gloves, alcohol swabs, sterile gauze, betadine, disposable syringes, and digital vital instruments (BP, SpO2, thermometer).',
  },
  {
    q: 'Do I need to make an advance payment before booking?',
    a: 'No advance payment is required! You only pay after your care request is reviewed by our clinical coordinator and the visit is completed.',
  },
  {
    q: 'Can we request the same nurse for recurring daily visits?',
    a: 'Absolutely. In Step 3 of our booking flow, you can choose "Prefer the Same Nurse for Future Visits" to ensure continuity of care with a familiar clinician.',
  },
];

const NurseBookingScreen = ({ navigation, route }) => {
  const { width } = useWindowDimensions();

  // Active top-level view: 'LANDING' | 'REQUEST_FLOW' | 'MY_REQUESTS' | 'REQUEST_DETAILS'
  const [currentView, setCurrentView] = useState('LANDING');

  // Multi-step request flow: 1: Services, 2: Patient, 3: Preferences, 4: Review, 5: Confirmation
  const [flowStep, setFlowStep] = useState(1);

  // Filter & Search states on Landing
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('All Services');
  const [activeFaqIndex, setActiveFaqIndex] = useState(null);

  // Form State: Step 1 Services
  const [selectedServices, setSelectedServices] = useState(['Wound Dressing']);
  const [showAllServices, setShowAllServices] = useState(false);
  const [serviceError, setServiceError] = useState(null);

  // Form State: Step 2 Patient Details
  const [patientName, setPatientName] = useState('Ramesh Kumar');
  const [patientAge, setPatientAge] = useState('58');
  const [patientGender, setPatientGender] = useState('Male');
  const [relationship, setRelationship] = useState('Self');
  const [contactNumber, setContactNumber] = useState('+91 98450 12345');
  const [address, setAddress] = useState('No. 44, 2nd Cross, Saraswathipuram, Mysuru - 570009');
  const [careInfo, setCareInfo] = useState('Post-abdominal surgery stitch dressing and morning BP monitoring.');
  const [formErrors, setFormErrors] = useState({});

  // Form State: Step 3 Document Upload & Preferences
  const [uploadedDoc, setUploadedDoc] = useState(null);
  const [shiftDuration, setShiftDuration] = useState('Single Procedure Visit');
  const [startDateOption, setStartDateOption] = useState('Today');
  const [careDays, setCareDays] = useState(1);
  const [languagePreference, setLanguagePreference] = useState('Kannada / English');
  const [continuityPreference, setContinuityPreference] = useState('Prefer the Same Nurse for Future Visits');

  // Interactive Calendar State for Custom Date
  const [calMonth, setCalMonth] = useState(new Date().getMonth());
  const [calYear, setCalYear] = useState(new Date().getFullYear());
  const [selectedCalDate, setSelectedCalDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 2);
    return { year: d.getFullYear(), month: d.getMonth(), day: d.getDate() };
  });
  const [customStartDate, setCustomStartDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 2);
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;
  });

  const isCurrentMonthOrPast = useMemo(() => {
    const today = new Date();
    return calYear === today.getFullYear() && calMonth <= today.getMonth();
  }, [calYear, calMonth]);

  const handlePrevCalMonth = () => {
    const today = new Date();
    if (calYear === today.getFullYear() && calMonth <= today.getMonth()) return;
    if (calMonth === 0) {
      setCalMonth(11);
      setCalYear((y) => y - 1);
    } else {
      setCalMonth((m) => m - 1);
    }
  };

  const handleNextCalMonth = () => {
    if (calMonth === 11) {
      setCalMonth(0);
      setCalYear((y) => y + 1);
    } else {
      setCalMonth((m) => m + 1);
    }
  };

  const handleSelectCalendarDay = (day) => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const formatted = `${day} ${months[calMonth]} ${calYear}`;
    setSelectedCalDate({ year: calYear, month: calMonth, day });
    setCustomStartDate(formatted);
  };

  const calendarDays = useMemo(() => {
    const firstDayIndex = new Date(calYear, calMonth, 1).getDay();
    const totalDays = new Date(calYear, calMonth + 1, 0).getDate();
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const cells = [];
    for (let i = 0; i < firstDayIndex; i++) {
      cells.push({ type: 'empty', key: `empty-${i}` });
    }

    for (let day = 1; day <= totalDays; day++) {
      const cellDate = new Date(calYear, calMonth, day);
      cellDate.setHours(0, 0, 0, 0);
      const isPast = cellDate < today;
      const isToday =
        today.getDate() === day &&
        today.getMonth() === calMonth &&
        today.getFullYear() === calYear;
      const isSelected =
        selectedCalDate.year === calYear &&
        selectedCalDate.month === calMonth &&
        selectedCalDate.day === day;

      cells.push({
        type: 'day',
        day,
        isPast,
        isToday,
        isSelected,
        key: `day-${day}`,
      });
    }

    return cells;
  }, [calYear, calMonth, selectedCalDate]);

  // Confirmed Request after submission
  const [newlyCreatedRequest, setNewlyCreatedRequest] = useState(null);

  // Dynamic Pricing Details that vary as careDays or services change
  const pricingDetails = useMemo(() => {
    let dailyRate = 0;
    if (selectedServices && selectedServices.length > 0) {
      selectedServices.forEach((srvName) => {
        dailyRate += getServicePriceByName(srvName);
      });
    } else {
      dailyRate = 299;
    }

    if (shiftDuration === '4-Hour Care Shift') {
      dailyRate = Math.max(dailyRate, 699);
    } else if (shiftDuration === '12-Hour Day Shift') {
      dailyRate = Math.max(dailyRate, 1299);
    } else if (shiftDuration === '24-Hour Live-in Care') {
      dailyRate = Math.max(dailyRate, 2499);
    }

    const days = Math.max(1, parseInt(careDays, 10) || 1);
    const grossTotal = dailyRate * days;
    let discountPercent = 0;
    if (days >= 30) {
      discountPercent = 15;
    } else if (days >= 15) {
      discountPercent = 10;
    } else if (days >= 7) {
      discountPercent = 5;
    }

    const discountAmount = Math.round((grossTotal * discountPercent) / 100);
    const finalTotal = grossTotal - discountAmount;

    return {
      dailyRate,
      days,
      grossTotal,
      discountPercent,
      discountAmount,
      finalTotal,
    };
  }, [selectedServices, shiftDuration, careDays]);

  // Requests Data List
  const [requestsList, setRequestsList] = useState(initialNursingRequests);
  const [requestsTabFilter, setRequestsTabFilter] = useState('All');
  const [selectedRequestDetail, setSelectedRequestDetail] = useState(null);

  // Load stored requests from AsyncStorage on mount
  useEffect(() => {
    const loadStoredRequests = async () => {
      try {
        const stored = await AsyncStorage.getItem(ASYNC_KEY_NURSING_REQUESTS);
        if (stored) {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed) && parsed.length > 0) {
            const merged = [...parsed];
            initialNursingRequests.forEach((initialItem) => {
              if (!merged.some((m) => m.id === initialItem.id)) {
                merged.push(initialItem);
              }
            });
            setRequestsList(merged);
          }
        }
      } catch (err) {
        console.log('Error reading stored nursing requests:', err);
      }
    };
    loadStoredRequests();
  }, []);

  const saveRequests = async (updated, singleNewReq = null) => {
    try {
      await AsyncStorage.setItem(ASYNC_KEY_NURSING_REQUESTS, JSON.stringify(updated));

      if (singleNewReq) {
        // Also sync to @unnathi_nurse_bookings
        try {
          const rawNurseBookings = await AsyncStorage.getItem('@unnathi_nurse_bookings');
          const nurseBookings = rawNurseBookings ? JSON.parse(rawNurseBookings) : [];
          const updatedNurseBookings = [
            singleNewReq,
            ...(Array.isArray(nurseBookings) ? nurseBookings.filter((b) => b.id !== singleNewReq.id) : [])
          ];
          await AsyncStorage.setItem('@unnathi_nurse_bookings', JSON.stringify(updatedNurseBookings));
        } catch (e1) {
          console.log('Error syncing to @unnathi_nurse_bookings:', e1);
        }

        // Also sync to central @unnathi_appointments
        try {
          const rawAppts = await AsyncStorage.getItem('@unnathi_appointments');
          const appts = rawAppts ? JSON.parse(rawAppts) : [];
          const updatedAppts = [
            singleNewReq,
            ...(Array.isArray(appts) ? appts.filter((a) => a.id !== singleNewReq.id) : [])
          ];
          await AsyncStorage.setItem('@unnathi_appointments', JSON.stringify(updatedAppts));
        } catch (e2) {
          console.log('Error syncing to @unnathi_appointments:', e2);
        }
      }
    } catch (e) {
      console.log('Error writing nursing requests:', e);
    }
  };

  // Toggle service selection
  const handleToggleService = (serviceName) => {
    if (serviceError) setServiceError(null);
    if (selectedServices.includes(serviceName)) {
      if (selectedServices.length === 1) {
        showAlert('Requirement', 'Please keep at least one nursing service selected.');
        return;
      }
      setSelectedServices(selectedServices.filter((s) => s !== serviceName));
    } else {
      setSelectedServices([...selectedServices, serviceName]);
    }
  };

  // Start booking with specific service
  const handleStartBookingWithService = (serviceName) => {
    setSelectedServices([serviceName]);
    setShowAllServices(false);
    setServiceError(null);
    setFlowStep(1);
    setCurrentView('REQUEST_FLOW');
  };

  // Validate step 1
  const handleProceedFromServices = () => {
    if (selectedServices.length === 0) {
      setServiceError('Please select at least one nursing service to proceed.');
      return;
    }
    setServiceError(null);
    setFlowStep(2);
  };

  // Validate step 2
  const handleProceedFromPatient = () => {
    if (!patientName.trim()) {
      showAlert('Required Field', 'Please enter patient name.');
      return;
    }
    if (!contactNumber.trim() || contactNumber.trim().length < 10) {
      showAlert('Invalid Phone', 'Please enter a valid 10-digit contact number.');
      return;
    }
    if (!address.trim()) {
      showAlert('Required Field', 'Please enter service location address in Mysore.');
      return;
    }
    setFlowStep(3);
  };

  // Validate step 3
  const handleProceedFromPreferences = () => {
    if (startDateOption === 'Custom') {
      if (!customStartDate.trim()) {
        showAlert('Required Field', 'Please select a custom start date from the calendar.');
        return;
      }
    }
    setFlowStep(4);
  };

  // Simulated Document Upload
  const handleSimulateDocumentUpload = () => {
    const mockFiles = [
      { name: 'discharge_summary_columbia_asia.pdf', size: '1.4 MB', type: 'PDF' },
      { name: 'doctor_prescription_dressing.jpg', size: '2.1 MB', type: 'Image' },
      { name: 'post_op_wound_care_chart.pdf', size: '840 KB', type: 'PDF' },
    ];
    const picked = mockFiles[Math.floor(Math.random() * mockFiles.length)];
    setUploadedDoc(picked);
    showAlert('Document Attached 📄', `Attached "${picked.name}" to your care request.`);
  };

  // Submit Care Request
  const handleSubmitCareRequest = () => {
    const newId = `HN-2026-${Math.floor(10000 + Math.random() * 90000).toString().slice(0, 5)}`;
    const nowStr = 'Just now';

    const startDt = startDateOption === 'Custom' ? (customStartDate.trim() || 'Custom Date') : startDateOption;
    let formattedDate = startDt;
    if (startDt === 'Today') {
      formattedDate = new Date().toISOString().split('T')[0];
    } else if (startDt === 'Tomorrow') {
      formattedDate = new Date(Date.now() + 86400000).toISOString().split('T')[0];
    }

    const newReq = {
      id: newId,
      bookingId: newId,
      tokenNumber: newId,
      type: 'Home Nurse Care',
      serviceType: 'nurse',
      serviceName: selectedServices.join(', '),
      doctorName: 'Licensed Home Nurse',
      specialty: 'Home Nursing & Clinical Care',
      date: formattedDate,
      time: 'Morning (8 AM - 12 PM)',
      fee: pricingDetails.finalTotal,
      paidAmount: pricingDetails.finalTotal,
      hospitalName: 'MediUnify Home Care Network',
      requestDate: nowStr,
      patientName,
      patientAge,
      patientGender,
      relationship,
      contactNumber,
      phone: contactNumber,
      address,
      selectedServices: [...selectedServices],
      careInformation: careInfo || 'None specified',
      uploadedDoc: uploadedDoc ? uploadedDoc.name : null,
      preferences: {
        shiftDuration,
        startDate: startDt,
        careDays: pricingDetails.days,
        dailyRate: pricingDetails.dailyRate,
        estimatedTotalCost: pricingDetails.finalTotal,
        discountAmount: pricingDetails.discountAmount,
        discountPercent: pricingDetails.discountPercent,
        languagePreference,
        continuityPreference,
      },
      status: 'Care Team Will Call You',
      currentStageIndex: 0,
      assignedNurse: null,
      confirmedVisitDate: null,
      confirmedVisitTime: null,
      isRecurring: shiftDuration.includes('Shift') || shiftDuration.includes('Live-in'),
      timeline: [
        { stage: 'Request Received', completed: true, timestamp: 'Just now' },
        { stage: 'Care Team Contacted', completed: false, timestamp: 'Pending call from Care Coordinator' },
        { stage: 'Requirement Confirmed', completed: false, timestamp: 'Awaiting coordination' },
        { stage: 'Nurse Assigned', completed: false, timestamp: 'Pending qualification match' },
        { stage: 'Visit Confirmed', completed: false, timestamp: 'Care team will confirm timing' },
        { stage: 'Nursing Visit', completed: false, timestamp: 'Scheduled post confirmation' },
        { stage: 'Visit Completed', completed: false, timestamp: 'Pending visit' },
      ],
    };

    const updated = [newReq, ...requestsList];
    setRequestsList(updated);
    saveRequests(updated, newReq);
    setNewlyCreatedRequest(newReq);
    setFlowStep(5);
  };

  // Filter services on landing
  const filteredServices = useMemo(() => {
    return availableNursingServices.filter((srv) => {
      const matchesSearch =
        searchQuery.trim() === '' ||
        srv.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        srv.shortDesc.toLowerCase().includes(searchQuery.toLowerCase()) ||
        srv.equipmentProvided.toLowerCase().includes(searchQuery.toLowerCase());

      if (!matchesSearch) return false;

      if (activeCategory === 'All Services') return true;
      if (activeCategory === 'Post-Surgical' && (srv.name.includes('Post-Operative') || srv.name.includes('Wound') || srv.category === 'Specialized')) return true;
      if (activeCategory === 'Wound & Dressing' && (srv.name.includes('Wound') || srv.name.includes('Dressing'))) return true;
      if (activeCategory === 'Injections & IV' && (srv.name.includes('Injection') || srv.name.includes('Medication') || srv.category === 'Procedure')) return true;
      if (activeCategory === 'Geriatric Care' && (srv.name.includes('Elderly') || srv.name.includes('Bedridden'))) return true;
      if (activeCategory === 'Monitoring' && (srv.name.includes('Vital') || srv.name.includes('Blood Sugar') || srv.category === 'Monitoring')) return true;
      if (activeCategory === 'Intensive & Bedridden' && (srv.name.includes('Bedridden') || srv.name.includes('Catheter') || srv.category === 'Intensive')) return true;

      return srv.category === activeCategory;
    });
  }, [searchQuery, activeCategory]);

  // Filter requests list
  const filteredRequests = useMemo(() => {
    if (requestsTabFilter === 'All') return requestsList;
    if (requestsTabFilter === 'In Progress') {
      return requestsList.filter((r) =>
        ['Care Team Will Call You', 'Requirement Confirmed', 'Nurse Assigned'].includes(r.status)
      );
    }
    if (requestsTabFilter === 'Confirmed') {
      return requestsList.filter((r) =>
        ['Visit Confirmed', 'Schedule Confirmed'].includes(r.status)
      );
    }
    if (requestsTabFilter === 'Completed') {
      return requestsList.filter((r) => r.status === 'Visit Completed');
    }
    return requestsList;
  }, [requestsList, requestsTabFilter]);

  // =========================================================================
  // VIEW 1: PREMIUM MOBILE LANDING PAGE
  // =========================================================================
  const renderLandingView = () => (
    <ScrollView
      style={styles.scrollContainer}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
    >
      {/* Top Header Bar */}
      <View style={styles.topBarRow}>
        <View style={styles.headerLeftGroup}>
          <TouchableOpacity
            style={styles.backCircleBtn}
            onPress={() => {
              if (navigation?.canGoBack && navigation.canGoBack()) {
                navigation.goBack();
              } else {
                navigation?.navigate('Home');
              }
            }}
            activeOpacity={0.7}
          >
            <Ionicons name="arrow-back" size={20} color="#0F172A" />
          </TouchableOpacity>

          <View style={styles.headerTitleWrap}>
            <Text style={styles.headerTitle} numberOfLines={1}>Home Care & Nursing</Text>
            <View style={styles.liveVerifiedPill}>
              <View style={styles.livePulseDot} />
              <Text style={styles.liveVerifiedPillText}>24/7 Verified Care</Text>
            </View>
          </View>
        </View>

        <TouchableOpacity
          style={styles.helplineBtn}
          onPress={() => showAlert('Care Helpline', 'Connecting to 24/7 Clinical Support: 1800-425-0099')}
          activeOpacity={0.8}
        >
          <Ionicons name="call" size={12} color="#0D9488" />
          <Text style={styles.helplineBtnText}>1800-425-0099</Text>
        </TouchableOpacity>
      </View>

      {/* Hero Banner Card */}
      <View style={styles.heroBannerCard}>
        <View style={styles.heroBadgePill}>
          <Ionicons name="shield-checkmark" size={13} color="#5EEAD4" />
          <Text style={styles.heroBadgePillText}>NABH & KNC Certified Nurses</Text>
        </View>

        <Text style={styles.heroHeadline}>
          Hospital-Grade Nursing Care, <Text style={styles.heroHeadlineAccent}>In Your Home</Text>
        </Text>

        <Text style={styles.heroSubheadline}>
          Post-surgical recovery, sterile wound dressing, IV therapy, geriatric care, and vitals monitoring by verified nursing professionals.
        </Text>

        {/* Guarantees */}
        <View style={styles.heroValuePropsRow}>
          <View style={styles.heroValueItem}>
            <Ionicons name="checkmark-circle" size={14} color="#00B894" />
            <Text style={styles.heroValueText}>100% Background Verified</Text>
          </View>
          <View style={styles.heroValueItem}>
            <Ionicons name="checkmark-circle" size={14} color="#00B894" />
            <Text style={styles.heroValueText}>Sterile Care Kits Included</Text>
          </View>
          <View style={styles.heroValueItem}>
            <Ionicons name="checkmark-circle" size={14} color="#00B894" />
            <Text style={styles.heroValueText}>24/7 Coordinator Support</Text>
          </View>
        </View>

        {/* Hero Actions (Stacked for clear mobile readability and touch targets) */}
        <View style={styles.heroActionsRow}>
          <TouchableOpacity
            style={styles.heroPrimaryBtn}
            onPress={() => {
              setShowAllServices(false);
              setFlowStep(1);
              setCurrentView('REQUEST_FLOW');
            }}
            activeOpacity={0.88}
          >
            <Ionicons name="calendar" size={17} color="#FFFFFF" style={{ marginRight: 8 }} />
            <Text style={styles.heroPrimaryBtnText}>Request Home Nursing</Text>
            <Ionicons name="arrow-forward" size={15} color="#FFFFFF" style={{ marginLeft: 'auto' }} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.heroSecondaryBtn}
            onPress={() => setCurrentView('MY_REQUESTS')}
            activeOpacity={0.8}
          >
            <Ionicons name="time-outline" size={16} color="#CBD5E1" style={{ marginRight: 8 }} />
            <Text style={styles.heroSecondaryBtnText}>Track Existing Requests ({requestsList.length})</Text>
            <Ionicons name="chevron-forward" size={14} color="#94A3B8" style={{ marginLeft: 'auto' }} />
          </TouchableOpacity>
        </View>

        {/* Quick Match Floating Chips Box */}
        <View style={styles.quickMatchCard}>
          <View style={styles.quickMatchHeader}>
            <Ionicons name="flash" size={15} color="#F59E0B" />
            <Text style={styles.quickMatchTitle}>Need Quick Nursing?</Text>
            <Text style={styles.quickMatchSub}>• Coordinator calls in 15 mins</Text>
          </View>

          <View style={styles.quickMatchChipsRow}>
            {['Wound Dressing', 'Injection Administration', 'Vital Monitoring', 'Elderly Care'].map((srvName) => (
              <TouchableOpacity
                key={srvName}
                style={styles.quickChip}
                onPress={() => handleStartBookingWithService(srvName)}
                activeOpacity={0.75}
              >
                <Text style={styles.quickChipText}>{srvName}</Text>
                <Ionicons name="arrow-forward" size={11} color="#0D9488" />
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </View>

      {/* Trust & Stats Grid */}
      <View style={styles.statsGrid}>
        <View style={styles.statBox}>
          <Text style={styles.statValue}>15,000+</Text>
          <Text style={styles.statLabel}>Visits Completed</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={styles.statValue}>4.9 ★</Text>
          <Text style={styles.statLabel}>Family Rating</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={styles.statValue}>100%</Text>
          <Text style={styles.statLabel}>KNC Verified Nurses</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={styles.statValue}>&lt; 15m</Text>
          <Text style={styles.statLabel}>Coordinator Callback</Text>
        </View>
      </View>

      {/* Search & Category Filter Section */}
      <View style={styles.searchSectionWrap}>
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionHeading}>Available Nursing Services</Text>
          <Text style={styles.sectionSubheading}>Select any procedure to request a certified nurse</Text>
        </View>

        {/* Search Input */}
        <View style={styles.searchInputRow}>
          <Ionicons name="search" size={18} color="#64748B" style={{ marginLeft: 12 }} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search dressing, injection, post-op, catheter..."
            placeholderTextColor="#94A3B8"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')} style={{ padding: 8 }}>
              <Ionicons name="close-circle" size={17} color="#94A3B8" />
            </TouchableOpacity>
          )}
        </View>

        {/* Horizontal Category Filter Pills */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoryPillsScroll}
        >
          {SERVICE_CATEGORIES.map((cat) => {
            const isSelected = activeCategory === cat;
            return (
              <TouchableOpacity
                key={cat}
                style={[styles.categoryPillBtn, isSelected && styles.categoryPillBtnActive]}
                onPress={() => setActiveCategory(cat)}
                activeOpacity={0.75}
              >
                <Text style={[styles.categoryPillBtnText, isSelected && styles.categoryPillBtnTextActive]}>
                  {cat}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Services Cards List */}
      <View style={styles.servicesGrid}>
        {filteredServices.map((srv) => {
          const meta = SERVICE_METADATA[srv.id] || { price: 'From ₹299', duration: '30 mins', shiftType: 'Per Visit' };
          const isSelected = selectedServices.includes(srv.name);

          return (
            <View
              key={srv.id}
              style={[
                styles.serviceElevatedCard,
                isSelected && styles.serviceElevatedCardSelected,
              ]}
            >
              {/* Card Top Row: Category + Popular Tag */}
              <View style={styles.cardHeaderRow}>
                <View style={[styles.categoryBadge, { backgroundColor: srv.bgColor }]}>
                  <Text style={[styles.categoryBadgeText, { color: srv.color }]}>{srv.category}</Text>
                </View>

                {meta.tag && (
                  <View style={styles.tagBadge}>
                    <Ionicons name="sparkles" size={10} color="#0D9488" />
                    <Text style={styles.tagBadgeText}>{meta.tag}</Text>
                  </View>
                )}
              </View>

              {/* Service Icon & Title */}
              <View style={styles.serviceTitleRow}>
                <View style={[styles.serviceIconContainer, { backgroundColor: srv.bgColor }]}>
                  <Ionicons name={srv.icon} size={22} color={srv.color} />
                </View>
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <Text style={styles.serviceCardTitle}>{srv.name}</Text>
                  <Text style={styles.serviceCardDuration}>
                    <Ionicons name="time-outline" size={11} color="#64748B" /> {meta.duration} • {meta.shiftType}
                  </Text>
                </View>
              </View>

              {/* Description */}
              <Text style={styles.serviceCardDesc} numberOfLines={2}>
                {srv.shortDesc}
              </Text>

              {/* Equipment Kit Included Pill */}
              <View style={styles.consumablesPill}>
                <Ionicons name="medkit-outline" size={13} color="#00B894" />
                <Text style={styles.consumablesText} numberOfLines={1}>
                  <Text style={{ fontWeight: '700' }}>Kit:</Text> {srv.equipmentProvided}
                </Text>
              </View>

              {/* Footer: Indicative Pricing + Book CTA */}
              <View style={styles.serviceCardFooter}>
                <View style={styles.pricingCol}>
                  <Text style={styles.priceSub}>Starting from</Text>
                  <Text style={styles.priceValue}>{meta.price}</Text>
                </View>

                <TouchableOpacity
                  style={styles.bookServiceBtn}
                  onPress={() => handleStartBookingWithService(srv.name)}
                  activeOpacity={0.85}
                >
                  <Text style={styles.bookServiceBtnText}>Book Visit</Text>
                  <Ionicons name="arrow-forward" size={13} color="#FFFFFF" />
                </TouchableOpacity>
              </View>
            </View>
          );
        })}
      </View>

      {/* Staff Showcase */}
      <View style={styles.nursesSection}>
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionHeading}>Meet Our Home Care Nurses</Text>
          <Text style={styles.sectionSubheading}>
            Verified professionals registered with Karnataka Nursing Council (KNC)
          </Text>
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.nursesScrollRow}>
          {Object.values(assignedNursesData).map((nurse) => (
            <View key={nurse.id} style={styles.nurseCard}>
              <View style={styles.nursePhotoWrapper}>
                <Image source={{ uri: nurse.photo }} style={styles.nursePhoto} />
                <View style={styles.nurseVerifiedCheck}>
                  <Ionicons name="checkmark" size={10} color="#FFFFFF" />
                </View>
              </View>

              <View style={styles.nurseInfoCol}>
                <View style={styles.nurseNameRow}>
                  <Text style={styles.nurseName}>{nurse.name}</Text>
                  <View style={styles.nurseRatingPill}>
                    <Ionicons name="star" size={11} color="#D97706" />
                    <Text style={styles.nurseRatingText}>{nurse.rating}</Text>
                  </View>
                </View>

                <Text style={styles.nurseQualification}>{nurse.qualification} • {nurse.experience}</Text>
                <Text style={styles.nurseRegId}>Reg: {nurse.councilReg || nurse.regNumber || 'KNC Verified'}</Text>

                {nurse.specialization ? (
                  <View style={styles.nurseSpecializationRow}>
                    <Ionicons name="medical" size={11} color="#00B894" />
                    <Text style={styles.nurseSpecializationText} numberOfLines={1}>
                      {nurse.specialization}
                    </Text>
                  </View>
                ) : null}

                {Array.isArray(nurse.languages) && (
                  <Text style={styles.nurseLanguagesText}>
                    🗣 {nurse.languages.join(', ')}
                  </Text>
                )}
              </View>
            </View>
          ))}
        </ScrollView>
      </View>

      {/* 4-Step How It Works */}
      <View style={styles.howItWorksSection}>
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionHeading}>How Home Care Works</Text>
          <Text style={styles.sectionSubheading}>Simple, safe, and hospital-grade care at home</Text>
        </View>

        <View style={styles.stepsList}>
          {howItWorksSteps.map((step, idx) => (
            <View key={step.step || step.id || idx} style={styles.stepCard}>
              <View style={styles.stepNumberBadge}>
                <Text style={styles.stepNumberText}>{step.step || step.stepNumber || (idx + 1)}</Text>
              </View>
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={styles.stepTitle}>{step.title}</Text>
                <Text style={styles.stepDesc}>{step.desc || step.description}</Text>
              </View>
            </View>
          ))}
        </View>
      </View>

      {/* Patient Testimonials */}
      <View style={styles.testimonialsSection}>
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionHeading}>Patient & Family Stories</Text>
          <Text style={styles.sectionSubheading}>Trusted by 15,000+ families across Karnataka</Text>
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.testimonialsScrollRow}>
          {PATIENT_TESTIMONIALS.map((item) => (
            <View key={item.id} style={styles.testimonialCard}>
              <View style={styles.testimonialStarsRow}>
                {[1, 2, 3, 4, 5].map((s) => (
                  <Ionicons key={s} name="star" size={13} color="#F59E0B" style={{ marginRight: 2 }} />
                ))}
                <View style={styles.testimonialVerifiedPill}>
                  <Ionicons name="checkmark-circle" size={11} color="#059669" />
                  <Text style={styles.testimonialVerifiedText}>Verified Visit</Text>
                </View>
              </View>

              <Text style={styles.testimonialQuote}>"{item.text}"</Text>

              <View style={styles.testimonialAuthorRow}>
                <View style={styles.authorAvatarCircle}>
                  <Text style={styles.authorAvatarText}>{item.patient.charAt(0)}</Text>
                </View>
                <View style={{ flex: 1, marginLeft: 10 }}>
                  <Text style={styles.authorName}>{item.patient}</Text>
                  <Text style={styles.authorFamily}>{item.family} • {item.location}</Text>
                  <Text style={styles.authorServiceTag}>{item.service}</Text>
                </View>
              </View>
            </View>
          ))}
        </ScrollView>
      </View>

      {/* Interactive FAQ Accordion */}
      <View style={styles.faqSection}>
        <View style={styles.faqHeader}>
          <Text style={styles.faqTitle}>Frequently Asked Questions</Text>
          <Text style={styles.faqSub}>Clear answers regarding home nursing safety and bookings</Text>
        </View>

        <View style={styles.faqList}>
          {FAQS.map((faq, index) => {
            const isOpen = activeFaqIndex === index;
            return (
              <TouchableOpacity
                key={index}
                style={[styles.faqItemCard, isOpen && styles.faqItemCardOpen]}
                onPress={() => setActiveFaqIndex(isOpen ? null : index)}
                activeOpacity={0.7}
              >
                <View style={styles.faqQuestionRow}>
                  <Text style={[styles.faqQuestionText, isOpen && styles.faqQuestionTextActive]}>
                    {faq.q}
                  </Text>
                  <Ionicons
                    name={isOpen ? 'chevron-up' : 'chevron-down'}
                    size={16}
                    color={isOpen ? '#00B894' : '#64748B'}
                  />
                </View>

                {isOpen && (
                  <View style={styles.faqAnswerWrap}>
                    <Text style={styles.faqAnswerText}>{faq.a}</Text>
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* Emergency Strip */}
      <View style={styles.emergencyStrip}>
        <View style={styles.emergencyIconWrap}>
          <Ionicons name="call" size={22} color="#FFFFFF" />
        </View>
        <View style={{ flex: 1, marginLeft: 12 }}>
          <Text style={styles.emergencyTitle}>Have Questions or Need Urgent Care?</Text>
          <Text style={styles.emergencySub}>
            24/7 Clinical desk: <Text style={{ fontWeight: '800', color: '#FFFFFF' }}>1800-425-0099</Text>
          </Text>
        </View>
        <TouchableOpacity
          style={styles.emergencyCallNowBtn}
          onPress={() => showAlert('Calling Coordinator', 'Dialing MediUnify Home Care Desk: 1800-425-0099')}
          activeOpacity={0.85}
        >
          <Text style={styles.emergencyCallNowBtnText}>Call Now</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );

  // =========================================================================
  // VIEW 2: STEP-BY-STEP CARE REQUEST FLOW
  // =========================================================================
  const renderRequestFlowView = () => (
    <View style={styles.flowRoot}>
      {/* Top Flow Header */}
      <View style={styles.flowHeader}>
        <TouchableOpacity
          style={styles.flowBackBtn}
          onPress={() => {
            if (flowStep > 1 && flowStep < 5) {
              setFlowStep(flowStep - 1);
            } else {
              setCurrentView('LANDING');
            }
          }}
          activeOpacity={0.7}
        >
          <Ionicons name="arrow-back" size={20} color="#0F172A" />
        </TouchableOpacity>

        <View style={{ flex: 1, marginLeft: 12 }}>
          <Text style={styles.flowHeaderTitle}>
            {flowStep === 1 && 'Step 1: Care Requirement'}
            {flowStep === 2 && 'Step 2: Patient & Address'}
            {flowStep === 3 && 'Step 3: Shift & Preferences'}
            {flowStep === 4 && 'Step 4: Review Request'}
            {flowStep === 5 && 'Request Submitted'}
          </Text>
          <Text style={styles.flowHeaderSub}>
            {flowStep < 5 ? `Step ${flowStep} of 4 • Zero Advance Deposit Required` : 'MediUnify Care Coordination'}
          </Text>
        </View>

        {flowStep < 5 && (
          <TouchableOpacity
            style={styles.flowCloseBtn}
            onPress={() => setCurrentView('LANDING')}
            activeOpacity={0.7}
          >
            <Ionicons name="close" size={20} color="#64748B" />
          </TouchableOpacity>
        )}
      </View>

      {/* Stepper Progress Bar */}
      {flowStep < 5 && (
        <View style={styles.stepperContainer}>
          {[1, 2, 3, 4].map((stepNum) => {
            const isDone = flowStep > stepNum;
            const isCurrent = flowStep === stepNum;
            return (
              <View key={stepNum} style={styles.stepItemWrapper}>
                <View
                  style={[
                    styles.stepperCircle,
                    isDone && styles.stepperCircleDone,
                    isCurrent && styles.stepperCircleCurrent,
                  ]}
                >
                  {isDone ? (
                    <Ionicons name="checkmark" size={11} color="#FFFFFF" />
                  ) : (
                    <Text
                      style={[
                        styles.stepperCircleText,
                        isCurrent && styles.stepperCircleTextCurrent,
                      ]}
                    >
                      {stepNum}
                    </Text>
                  )}
                </View>
                <Text
                  style={[
                    styles.stepperLabelText,
                    isCurrent && styles.stepperLabelTextCurrent,
                  ]}
                >
                  {stepNum === 1 && 'Services'}
                  {stepNum === 2 && 'Patient'}
                  {stepNum === 3 && 'Schedule'}
                  {stepNum === 4 && 'Confirm'}
                </Text>
                {stepNum < 4 && (
                  <View
                    style={[
                      styles.stepperConnectingLine,
                      flowStep > stepNum && styles.stepperConnectingLineActive,
                    ]}
                  />
                )}
              </View>
            );
          })}
        </View>
      )}

      {/* Form Content Area */}
      <ScrollView
        style={styles.flowScroll}
        contentContainerStyle={styles.flowScrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* STEP 1: SELECT CARE SERVICES */}
        {flowStep === 1 && (
          <View>
            <View style={styles.stepTitleBox}>
              <Text style={styles.stepMainHeading}>
                {selectedServices.length > 0 && !showAllServices
                  ? 'Selected Home Care Service'
                  : 'What care do you need at home?'}
              </Text>
              <Text style={styles.stepSubHeading}>
                {selectedServices.length > 0 && !showAllServices
                  ? 'Review your selected nursing procedure below before entering patient details:'
                  : 'Select one or multiple nursing procedures required for the patient:'}
              </Text>
            </View>

            {serviceError && (
              <View style={styles.errorAlertBox}>
                <Ionicons name="alert-circle" size={16} color="#EF4444" style={{ marginRight: 6 }} />
                <Text style={styles.errorAlertText}>{serviceError}</Text>
              </View>
            )}

            {/* When a service is selected and not expanding, show ONLY the selected service(s) */}
            {selectedServices.length > 0 && !showAllServices ? (
              <View style={styles.selectedConfirmedWrap}>
                {selectedServices.map((srvName) => {
                  const item = availableNursingServices.find((s) => s.name === srvName) || {
                    id: 'srv-default',
                    name: srvName,
                    shortDesc: 'Professional nursing procedure administered at home by certified nurse.',
                    equipmentProvided: 'Sterile syringes, gloves, antiseptic kit',
                    icon: 'medkit-outline',
                    color: '#00B894',
                    bgColor: '#E6F9F4',
                  };
                  const meta = SERVICE_METADATA[item.id] || { price: '₹299', duration: '30 mins', shiftType: 'Per Visit' };

                  return (
                    <View key={srvName} style={styles.singleSelectedCard}>
                      <View style={styles.singleSelectedTopRow}>
                        <View style={[styles.selectCardIconWrap, { backgroundColor: item.bgColor, width: 42, height: 42, marginLeft: 0 }]}>
                          <Ionicons name={item.icon} size={20} color={item.color} />
                        </View>
                        <View style={{ flex: 1, marginLeft: 12 }}>
                          <View style={styles.selectCardHeaderRow}>
                            <Text style={styles.singleSelectedTitle}>{item.name}</Text>
                            <Text style={styles.singleSelectedPrice}>{meta.price}</Text>
                          </View>
                          <View style={styles.singleSelectedMetaRow}>
                            <View style={styles.greenCheckBadge}>
                              <Ionicons name="checkmark-circle" size={12} color="#00B894" />
                              <Text style={styles.greenCheckBadgeText}>Selected for Booking</Text>
                            </View>
                            <Text style={styles.singleSelectedDuration}>
                              • {meta.duration} • {meta.shiftType}
                            </Text>
                          </View>
                        </View>
                      </View>

                      <Text style={styles.singleSelectedDesc}>{item.shortDesc}</Text>

                      <View style={styles.singleSelectedKitRow}>
                        <Ionicons name="shield-checkmark" size={14} color="#0D9488" />
                        <Text style={styles.singleSelectedKitText}>
                          <Text style={{ fontWeight: '700' }}>Kit Provided:</Text> {item.equipmentProvided}
                        </Text>
                      </View>
                    </View>
                  );
                })}

                {/* Button to add another procedure or change */}
                <TouchableOpacity
                  style={styles.addMoreServicesBtn}
                  onPress={() => setShowAllServices(true)}
                  activeOpacity={0.75}
                >
                  <Ionicons name="add-circle-outline" size={17} color="#0D9488" />
                  <Text style={styles.addMoreServicesBtnText}>+ Add another procedure or change service</Text>
                </TouchableOpacity>

                {/* Trust & Pricing Guarantee Banner */}
                <View style={styles.bookingSelectedTrustBanner}>
                  <Ionicons name="shield-checkmark" size={17} color="#00B894" />
                  <View style={{ flex: 1, marginLeft: 10 }}>
                    <Text style={styles.bookingSelectedTrustTitle}>Zero Advance Deposit • Pay Post-Procedure</Text>
                    <Text style={styles.bookingSelectedTrustSub}>
                      KNC registered nurse assigned in 15 mins. Standard sterile care kit included.
                    </Text>
                  </View>
                </View>
              </View>
            ) : (
              /* Full Services List */
              <View>
                {selectedServices.length > 0 && (
                  <View style={styles.selectedCountBanner}>
                    <Ionicons name="checkbox" size={16} color="#00B894" />
                    <Text style={styles.selectedCountBannerText}>
                      <Text style={{ fontWeight: '800' }}>{selectedServices.length}</Text> service
                      {selectedServices.length === 1 ? '' : 's'} selected
                    </Text>
                    <TouchableOpacity
                      onPress={() => setShowAllServices(false)}
                      style={styles.doneAddingPill}
                    >
                      <Text style={styles.doneAddingPillText}>Done Selecting ✓</Text>
                    </TouchableOpacity>
                  </View>
                )}

                <View style={styles.servicesSelectList}>
                  {availableNursingServices.map((item) => {
                    const isChecked = selectedServices.includes(item.name);
                    const meta = SERVICE_METADATA[item.id] || { price: '₹299', duration: '30 mins' };

                    return (
                      <TouchableOpacity
                        key={item.id}
                        style={[
                          styles.serviceSelectCard,
                          isChecked && styles.serviceSelectCardChecked,
                        ]}
                        onPress={() => handleToggleService(item.name)}
                        activeOpacity={0.7}
                      >
                        <View
                          style={[
                            styles.customCheckbox,
                            isChecked && styles.customCheckboxChecked,
                          ]}
                        >
                          {isChecked && <Ionicons name="checkmark" size={13} color="#FFFFFF" />}
                        </View>

                        <View style={[styles.selectCardIconWrap, { backgroundColor: item.bgColor }]}>
                          <Ionicons name={item.icon} size={18} color={item.color} />
                        </View>

                        <View style={{ flex: 1, marginLeft: 10 }}>
                          <View style={styles.selectCardHeaderRow}>
                            <Text style={styles.selectCardTitle}>{item.name}</Text>
                            <Text style={styles.selectCardPrice}>{meta.price}</Text>
                          </View>
                          <Text style={styles.selectCardDesc}>{item.shortDesc}</Text>
                          <Text style={styles.selectCardKit}>
                            🩺 <Text style={{ fontWeight: '600' }}>Kit:</Text> {item.equipmentProvided}
                          </Text>
                        </View>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            )}

            {/* Step 1 Footer Action */}
            <View style={styles.stepActionFooter}>
              <TouchableOpacity
                style={styles.primaryProceedBtn}
                onPress={handleProceedFromServices}
                activeOpacity={0.85}
              >
                <Text style={styles.primaryProceedBtnText}>Continue to Patient Details</Text>
                <Ionicons name="arrow-forward" size={15} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* STEP 2: PATIENT & VISIT ADDRESS DETAILS */}
        {flowStep === 2 && (
          <View>
            <View style={styles.stepTitleBox}>
              <Text style={styles.stepMainHeading}>Patient & Visit Details</Text>
              <Text style={styles.stepSubHeading}>
                Tell us who will be receiving care so our coordinator can plan appropriately:
              </Text>
            </View>

            {/* Patient Name */}
            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Patient Full Name *</Text>
              <TextInput
                style={[styles.formInput, formErrors.name && styles.formInputError]}
                value={patientName}
                onChangeText={(t) => {
                  setPatientName(t);
                  if (formErrors.name) setFormErrors({ ...formErrors, name: null });
                }}
                placeholder="e.g. Ramesh Kumar"
                placeholderTextColor="#94A3B8"
              />
              {formErrors.name && <Text style={styles.formErrorText}>{formErrors.name}</Text>}
            </View>

            {/* Age & Gender Row */}
            <View style={styles.formRow}>
              <View style={[styles.formGroup, { flex: 1, marginRight: 10 }]}>
                <Text style={styles.formLabel}>Age *</Text>
                <TextInput
                  style={[styles.formInput, formErrors.age && styles.formInputError]}
                  value={patientAge}
                  onChangeText={(t) => {
                    setPatientAge(t);
                    if (formErrors.age) setFormErrors({ ...formErrors, age: null });
                  }}
                  placeholder="e.g. 58"
                  placeholderTextColor="#94A3B8"
                  keyboardType="numeric"
                />
                {formErrors.age && <Text style={styles.formErrorText}>{formErrors.age}</Text>}
              </View>

              <View style={[styles.formGroup, { flex: 1.5 }]}>
                <Text style={styles.formLabel}>Gender *</Text>
                <View style={styles.pillsRow}>
                  {['Male', 'Female', 'Other'].map((g) => (
                    <TouchableOpacity
                      key={g}
                      style={[styles.choicePill, patientGender === g && styles.choicePillActive]}
                      onPress={() => setPatientGender(g)}
                    >
                      <Text style={[styles.choicePillText, patientGender === g && styles.choicePillTextActive]}>
                        {g}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            </View>

            {/* Relationship */}
            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Relationship to Patient *</Text>
              <View style={styles.pillsRow}>
                {['Self', 'Mother', 'Father', 'Spouse', 'Child', 'Relative'].map((r) => (
                  <TouchableOpacity
                    key={r}
                    style={[styles.choicePill, relationship === r && styles.choicePillActive]}
                    onPress={() => setRelationship(r)}
                  >
                    <Text style={[styles.choicePillText, relationship === r && styles.choicePillTextActive]}>
                      {r}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Contact Number */}
            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Contact Number for Coordinator *</Text>
              <TextInput
                style={[styles.formInput, formErrors.phone && styles.formInputError]}
                value={contactNumber}
                onChangeText={(t) => {
                  setContactNumber(t);
                  if (formErrors.phone) setFormErrors({ ...formErrors, phone: null });
                }}
                placeholder="+91 98450 XXXXX"
                placeholderTextColor="#94A3B8"
                keyboardType="phone-pad"
              />
              {formErrors.phone && <Text style={styles.formErrorText}>{formErrors.phone}</Text>}
            </View>

            {/* Address */}
            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Complete Home Visit Address *</Text>
              <TextInput
                style={[styles.formInput, { height: 70, textAlignVertical: 'top' }, formErrors.address && styles.formInputError]}
                value={address}
                onChangeText={(t) => {
                  setAddress(t);
                  if (formErrors.address) setFormErrors({ ...formErrors, address: null });
                }}
                placeholder="House/flat number, building name, street, locality, Mysuru / Bengaluru..."
                placeholderTextColor="#94A3B8"
                multiline={true}
              />
              {formErrors.address && <Text style={styles.formErrorText}>{formErrors.address}</Text>}
            </View>

            {/* Clinical Background Info */}
            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>
                Patient Condition & History <Text style={{ fontWeight: '400', color: '#94A3B8' }}>(Optional)</Text>
              </Text>
              <TextInput
                style={[styles.formInput, { height: 65, textAlignVertical: 'top' }]}
                value={careInfo}
                onChangeText={setCareInfo}
                placeholder="e.g. Post-surgery dressing, diabetic, needs morning vitals check..."
                placeholderTextColor="#94A3B8"
                multiline={true}
              />
            </View>

            {/* Actions */}
            <View style={styles.stepDualActionsRow}>
              <TouchableOpacity
                style={styles.stepBackOutlineBtn}
                onPress={() => setFlowStep(1)}
              >
                <Text style={styles.stepBackOutlineBtnText}>← Back</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.primaryProceedBtn, { flex: 1 }]}
                onPress={handleProceedFromPatientDetails}
              >
                <Text style={styles.primaryProceedBtnText}>Continue to Schedule</Text>
                <Ionicons name="arrow-forward" size={15} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* STEP 3: SHIFT TIMING & PREFERENCES */}
        {flowStep === 3 && (
          <View>
            <View style={styles.stepTitleBox}>
              <Text style={styles.stepMainHeading}>Visit Schedule & Preferences</Text>
              <Text style={styles.stepSubHeading}>
                Configure your preferred duration and language to match the best nurse:
              </Text>
            </View>

            {/* Shift Duration Type */}
            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Required Shift Duration *</Text>
              <View style={styles.shiftDurationGrid}>
                {[
                  { title: 'Single Procedure Visit', desc: '30-45 mins for dressing or injection', icon: 'flash-outline' },
                  { title: '4-Hour Care Shift', desc: 'Half-day assistance & vitals', icon: 'time-outline' },
                  { title: '12-Hour Day Shift', desc: 'Daytime monitoring & medication', icon: 'sunny-outline' },
                  { title: '24-Hour Live-in Care', desc: 'Continuous round-the-clock bedside nursing', icon: 'moon-outline' },
                ].map((s) => (
                  <TouchableOpacity
                    key={s.title}
                    style={[styles.shiftCard, shiftDuration === s.title && styles.shiftCardActive]}
                    onPress={() => setShiftDuration(s.title)}
                    activeOpacity={0.75}
                  >
                    <View style={styles.shiftCardTop}>
                      <Ionicons
                        name={s.icon}
                        size={16}
                        color={shiftDuration === s.title ? '#00B894' : '#64748B'}
                      />
                      <Text style={[styles.shiftCardTitle, shiftDuration === s.title && styles.shiftCardTitleActive]}>
                        {s.title}
                      </Text>
                    </View>
                    <Text style={styles.shiftCardDesc}>{s.desc}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Care Start Date */}
            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Care Start Date *</Text>
              <View style={styles.dateOptionRow}>
                {[
                  { id: 'Today', label: 'Today', sub: 'Immediate / Urgent', icon: 'flash-outline' },
                  { id: 'Tomorrow', label: 'Tomorrow', sub: 'Next Day Planned', icon: 'calendar-outline' },
                  { id: 'Custom', label: 'Custom Date', sub: 'Choose Date', icon: 'calendar-number-outline' },
                ].map((d) => {
                  const isSelected = startDateOption === d.id;
                  return (
                    <TouchableOpacity
                      key={d.id}
                      style={[styles.dateOptionCard, isSelected && styles.dateOptionCardActive]}
                      onPress={() => setStartDateOption(d.id)}
                      activeOpacity={0.8}
                    >
                      <View style={styles.dateOptionTop}>
                        <Ionicons
                          name={d.icon}
                          size={15}
                          color={isSelected ? '#00B894' : '#64748B'}
                        />
                        <View style={[styles.dateRadioCircle, isSelected && styles.dateRadioCircleActive]}>
                          {isSelected && <View style={styles.dateRadioInnerCircle} />}
                        </View>
                      </View>
                      <Text style={[styles.dateOptionLabel, isSelected && styles.dateOptionLabelActive]}>
                        {d.label}
                      </Text>
                      <Text style={styles.dateOptionSub}>{d.sub}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {startDateOption === 'Custom' && (
                <View style={styles.calendarContainer}>
                  {/* Calendar Month Navigation Header */}
                  <View style={styles.calNavHeader}>
                    <TouchableOpacity
                      style={[styles.calNavBtn, isCurrentMonthOrPast && styles.calNavBtnDisabled]}
                      onPress={handlePrevCalMonth}
                      disabled={isCurrentMonthOrPast}
                      activeOpacity={0.7}
                    >
                      <Ionicons
                        name="chevron-back"
                        size={17}
                        color={isCurrentMonthOrPast ? '#CBD5E1' : '#0F172A'}
                      />
                    </TouchableOpacity>

                    <View style={styles.calMonthYearBox}>
                      <Ionicons name="calendar-outline" size={15} color="#00B894" style={{ marginRight: 5 }} />
                      <Text style={styles.calMonthYearText}>
                        {CALENDAR_MONTH_NAMES[calMonth]} {calYear}
                      </Text>
                    </View>

                    <TouchableOpacity
                      style={styles.calNavBtn}
                      onPress={handleNextCalMonth}
                      activeOpacity={0.7}
                    >
                      <Ionicons name="chevron-forward" size={17} color="#0F172A" />
                    </TouchableOpacity>
                  </View>

                  {/* Weekdays Row */}
                  <View style={styles.calWeekdaysRow}>
                    {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map((d) => (
                      <View key={d} style={styles.calWeekdayCell}>
                        <Text style={styles.calWeekdayText}>{d}</Text>
                      </View>
                    ))}
                  </View>

                  {/* Calendar Days Grid */}
                  <View style={styles.calGrid}>
                    {calendarDays.map((cell) => {
                      if (cell.type === 'empty') {
                        return <View key={cell.key} style={styles.calDayCell} />;
                      }

                      return (
                        <TouchableOpacity
                          key={cell.key}
                          style={[
                            styles.calDayCell,
                            cell.isSelected && styles.calDayCellSelected,
                            cell.isToday && !cell.isSelected && styles.calDayCellToday,
                          ]}
                          onPress={() => !cell.isPast && handleSelectCalendarDay(cell.day)}
                          disabled={cell.isPast}
                          activeOpacity={0.75}
                        >
                          <Text
                            style={[
                              styles.calDayText,
                              cell.isPast && styles.calDayTextPast,
                              cell.isToday && !cell.isSelected && styles.calDayTextToday,
                              cell.isSelected && styles.calDayTextSelected,
                            ]}
                          >
                            {cell.day}
                          </Text>
                          {cell.isToday && !cell.isSelected && <View style={styles.calTodayDot} />}
                        </TouchableOpacity>
                      );
                    })}
                  </View>

                  {/* Calendar Footer: Selected Date Banner */}
                  <View style={styles.calFooterBar}>
                    <View style={styles.calFooterLeft}>
                      <Ionicons name="checkmark-circle" size={15} color="#00B894" />
                      <Text style={styles.calFooterText}>
                        Selected Date: <Text style={{ fontWeight: '800', color: '#0F172A' }}>{customStartDate}</Text>
                      </Text>
                    </View>
                    <TouchableOpacity
                      style={styles.calQuickTodayBtn}
                      onPress={() => {
                        const now = new Date();
                        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
                        setCalMonth(now.getMonth());
                        setCalYear(now.getFullYear());
                        setSelectedCalDate({ year: now.getFullYear(), month: now.getMonth(), day: now.getDate() });
                        setCustomStartDate(`${now.getDate()} ${months[now.getMonth()]} ${now.getFullYear()}`);
                      }}
                      activeOpacity={0.75}
                    >
                      <Text style={styles.calQuickTodayText}>Today</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}
            </View>

            {/* Duration of Care - How Many Days */}
            <View style={styles.formGroup}>
              <View style={styles.labelWithOptional}>
                <Text style={styles.formLabel}>How Many Days is Care Required? *</Text>
                <View style={styles.daysBadge}>
                  <Ionicons name="time-outline" size={12} color="#0D9488" />
                  <Text style={styles.daysBadgeText}>
                    {careDays} {careDays === 1 ? 'Day (Single Visit)' : `Days (${careDays} Daily Visits)`}
                  </Text>
                </View>
              </View>

              {/* Quick Preset Days Pills */}
              <View style={styles.daysPresetsRow}>
                {[
                  { days: 1, label: '1 Day' },
                  { days: 3, label: '3 Days' },
                  { days: 7, label: '7 Days (1 Wk)' },
                  { days: 15, label: '15 Days' },
                  { days: 30, label: '30 Days' },
                ].map((preset) => {
                  const isSelected = careDays === preset.days;
                  return (
                    <TouchableOpacity
                      key={preset.days}
                      style={[styles.presetDayPill, isSelected && styles.presetDayPillActive]}
                      onPress={() => setCareDays(preset.days)}
                      activeOpacity={0.8}
                    >
                      <Text style={[styles.presetDayText, isSelected && styles.presetDayTextActive]}>
                        {preset.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* Interactive Counter Stepper */}
              <View style={styles.daysCounterContainer}>
                <Text style={styles.daysCounterTitle}>Adjust Exact Days:</Text>
                <View style={styles.daysCounterBox}>
                  <TouchableOpacity
                    style={[styles.daysCounterBtn, careDays <= 1 && styles.daysCounterBtnDisabled]}
                    onPress={() => setCareDays(Math.max(1, careDays - 1))}
                    disabled={careDays <= 1}
                    activeOpacity={0.7}
                  >
                    <Ionicons name="remove" size={17} color={careDays <= 1 ? '#CBD5E1' : '#0F172A'} />
                  </TouchableOpacity>

                  <View style={styles.daysCounterCenter}>
                    <Text style={styles.daysCounterNumber}>{careDays}</Text>
                    <Text style={styles.daysCounterUnit}>{careDays === 1 ? 'Day' : 'Days'}</Text>
                  </View>

                  <TouchableOpacity
                    style={[styles.daysCounterBtn, careDays >= 90 && styles.daysCounterBtnDisabled]}
                    onPress={() => setCareDays(Math.min(90, careDays + 1))}
                    disabled={careDays >= 90}
                    activeOpacity={0.7}
                  >
                    <Ionicons name="add" size={17} color={careDays >= 90 ? '#CBD5E1' : '#0F172A'} />
                  </TouchableOpacity>
                </View>
              </View>

              {/* Dynamic Estimated Pricing Card */}
              <View style={styles.pricingSummaryCard}>
                <View style={styles.pricingTopRow}>
                  <View style={{ flex: 1, paddingRight: 8 }}>
                    <View style={styles.pricingTagRow}>
                      <Ionicons name="calculator" size={15} color="#00B894" />
                      <Text style={styles.pricingTagText}>
                        Estimated Cost ({pricingDetails.days} {pricingDetails.days === 1 ? 'Day' : 'Days'})
                      </Text>
                      {pricingDetails.discountPercent > 0 && (
                        <View style={styles.discountBadge}>
                          <Text style={styles.discountBadgeText}>
                            {pricingDetails.discountPercent}% Off
                          </Text>
                        </View>
                      )}
                    </View>
                    <Text style={styles.pricingCalcSubtitle}>
                      ₹{pricingDetails.dailyRate.toLocaleString('en-IN')} / day × {pricingDetails.days} {pricingDetails.days === 1 ? 'visit' : 'daily visits'}
                    </Text>
                  </View>

                  <View style={styles.pricingAmountWrap}>
                    {pricingDetails.discountAmount > 0 && (
                      <Text style={styles.pricingStrikePrice}>
                        ₹{pricingDetails.grossTotal.toLocaleString('en-IN')}
                      </Text>
                    )}
                    <Text style={styles.pricingFinalAmount}>
                      ₹{pricingDetails.finalTotal.toLocaleString('en-IN')}
                    </Text>
                    <Text style={styles.pricingPerVisitNote}>Total for {pricingDetails.days} {pricingDetails.days === 1 ? 'Day' : 'Days'}</Text>
                  </View>
                </View>

                {pricingDetails.discountAmount > 0 && (
                  <View style={styles.pricingSavingsRow}>
                    <Ionicons name="sparkles" size={12} color="#059669" />
                    <Text style={styles.pricingSavingsText}>
                      Multi-day package discount: -₹{pricingDetails.discountAmount.toLocaleString('en-IN')} ({pricingDetails.discountPercent}% off)
                    </Text>
                  </View>
                )}

                <View style={styles.pricingDivider} />

                <View style={styles.pricingGuaranteeRow}>
                  <Ionicons name="shield-checkmark" size={13} color="#0D9488" />
                  <Text style={styles.pricingGuaranteeText}>
                    Zero advance deposit • Pay after visit completion
                  </Text>
                </View>
              </View>
            </View>

            {/* Document Upload */}
            <View style={styles.formGroup}>
              <View style={styles.labelWithOptional}>
                <Text style={styles.formLabel}>Prescription or Discharge Summary</Text>
                <View style={styles.optionalTag}>
                  <Text style={styles.optionalTagText}>Optional</Text>
                </View>
              </View>

              {uploadedDoc ? (
                <View style={styles.uploadedDocCard}>
                  <Ionicons name="document-text" size={22} color="#00B894" />
                  <View style={{ flex: 1, marginLeft: 10 }}>
                    <Text style={styles.uploadedDocName} numberOfLines={1}>{uploadedDoc.name}</Text>
                    <Text style={styles.uploadedDocSize}>{uploadedDoc.type} • {uploadedDoc.size}</Text>
                  </View>
                  <TouchableOpacity onPress={() => setUploadedDoc(null)} style={{ padding: 6 }}>
                    <Ionicons name="trash-outline" size={17} color="#EF4444" />
                  </TouchableOpacity>
                </View>
              ) : (
                <TouchableOpacity
                  style={styles.uploadDropZone}
                  onPress={handleSimulateDocumentUpload}
                  activeOpacity={0.7}
                >
                  <Ionicons name="cloud-upload-outline" size={26} color="#00B894" />
                  <Text style={styles.uploadDropTitle}>Attach Prescription / Doctor Notes</Text>
                  <Text style={styles.uploadDropSub}>PDF, JPG, PNG up to 10 MB</Text>
                </TouchableOpacity>
              )}
            </View>

            {/* Nurse Language Preference */}
            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Nurse Language Preference</Text>
              <View style={styles.pillsRow}>
                {['Kannada / English', 'Kannada', 'English', 'Hindi', 'No Preference'].map((lang) => (
                  <TouchableOpacity
                    key={lang}
                    style={[styles.choicePill, languagePreference === lang && styles.choicePillActive]}
                    onPress={() => setLanguagePreference(lang)}
                  >
                    <Text style={[styles.choicePillText, languagePreference === lang && styles.choicePillTextActive]}>
                      {lang}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Actions */}
            <View style={styles.stepDualActionsRow}>
              <TouchableOpacity
                style={styles.stepBackOutlineBtn}
                onPress={() => setFlowStep(2)}
              >
                <Text style={styles.stepBackOutlineBtnText}>← Back</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.primaryProceedBtn, { flex: 1 }]}
                onPress={() => setFlowStep(4)}
              >
                <Text style={styles.primaryProceedBtnText}>Review & Confirm</Text>
                <Ionicons name="arrow-forward" size={15} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* STEP 4: REVIEW & CONFIRM */}
        {flowStep === 4 && (
          <View>
            <View style={styles.stepTitleBox}>
              <Text style={styles.stepMainHeading}>Review Your Care Request</Text>
              <Text style={styles.stepSubHeading}>
                Please confirm details before our care coordinator contacts you:
              </Text>
            </View>

            {/* Summary Card */}
            <View style={styles.reviewCard}>
              <View style={styles.reviewSection}>
                <Text style={styles.reviewSectionTitle}>Selected Nursing Procedures</Text>
                <View style={styles.reviewPillsWrap}>
                  {selectedServices.map((s) => (
                    <View key={s} style={styles.reviewServicePill}>
                      <Ionicons name="checkmark-circle" size={13} color="#00B894" />
                      <Text style={styles.reviewServicePillText}>{s}</Text>
                    </View>
                  ))}
                </View>
              </View>

              <View style={styles.reviewDivider} />

              <View style={styles.reviewSection}>
                <Text style={styles.reviewSectionTitle}>Patient Information</Text>
                <View style={styles.reviewGrid}>
                  <View style={styles.reviewRow}>
                    <Text style={styles.reviewLabel}>Patient Name:</Text>
                    <Text style={styles.reviewValue}>{patientName} ({patientAge} yrs, {patientGender})</Text>
                  </View>
                  <View style={styles.reviewRow}>
                    <Text style={styles.reviewLabel}>Relationship:</Text>
                    <Text style={styles.reviewValue}>{relationship}</Text>
                  </View>
                  <View style={styles.reviewRow}>
                    <Text style={styles.reviewLabel}>Phone:</Text>
                    <Text style={styles.reviewValue}>{contactNumber}</Text>
                  </View>
                  <View style={styles.reviewRow}>
                    <Text style={styles.reviewLabel}>Address:</Text>
                    <Text style={styles.reviewValue}>{address}</Text>
                  </View>
                </View>
              </View>

              <View style={styles.reviewDivider} />

              <View style={styles.reviewSection}>
                <Text style={styles.reviewSectionTitle}>Shift & Schedule</Text>
                <View style={styles.reviewGrid}>
                  <View style={styles.reviewRow}>
                    <Text style={styles.reviewLabel}>Duration:</Text>
                    <Text style={styles.reviewValue}>{shiftDuration}</Text>
                  </View>
                  <View style={styles.reviewRow}>
                    <Text style={styles.reviewLabel}>Start Date:</Text>
                    <Text style={styles.reviewValue}>
                      {startDateOption === 'Custom' ? (customStartDate.trim() || 'Custom Date') : (startDateOption === 'Today' ? 'Today (Immediate)' : 'Tomorrow')}
                    </Text>
                  </View>
                  <View style={styles.reviewRow}>
                    <Text style={styles.reviewLabel}>Care Duration:</Text>
                    <Text style={styles.reviewValue}>
                      {careDays} {careDays === 1 ? 'Day (Single Visit)' : `Days (${careDays} Daily Visits)`}
                    </Text>
                  </View>
                  <View style={styles.reviewRow}>
                    <Text style={styles.reviewLabel}>Language:</Text>
                    <Text style={styles.reviewValue}>{languagePreference}</Text>
                  </View>
                </View>
              </View>

              <View style={styles.reviewDivider} />

              <View style={styles.reviewSection}>
                <Text style={styles.reviewSectionTitle}>Estimated Pricing & Payment</Text>
                <View style={styles.reviewGrid}>
                  <View style={styles.reviewRow}>
                    <Text style={styles.reviewLabel}>Daily Base Rate:</Text>
                    <Text style={styles.reviewValue}>₹{pricingDetails.dailyRate.toLocaleString('en-IN')} / day</Text>
                  </View>
                  <View style={styles.reviewRow}>
                    <Text style={styles.reviewLabel}>Care Duration:</Text>
                    <Text style={styles.reviewValue}>{pricingDetails.days} {pricingDetails.days === 1 ? 'Day (Single Visit)' : `Days (${pricingDetails.days} Daily Visits)`}</Text>
                  </View>
                  {pricingDetails.discountAmount > 0 && (
                    <View style={styles.reviewRow}>
                      <Text style={[styles.reviewLabel, { color: '#059669' }]}>Multi-Day Package Savings ({pricingDetails.discountPercent}%):</Text>
                      <Text style={[styles.reviewValue, { color: '#059669', fontWeight: '700' }]}>-₹{pricingDetails.discountAmount.toLocaleString('en-IN')}</Text>
                    </View>
                  )}
                  <View style={styles.reviewRow}>
                    <Text style={[styles.reviewLabel, { fontWeight: '800', color: '#0F172A' }]}>Estimated Total Cost:</Text>
                    <Text style={[styles.reviewValue, { fontWeight: '800', color: '#00B894', fontSize: 15 }]}>
                      ₹{pricingDetails.finalTotal.toLocaleString('en-IN')}
                    </Text>
                  </View>
                  <View style={styles.reviewRow}>
                    <Text style={styles.reviewLabel}>Payment Terms:</Text>
                    <Text style={styles.reviewValue}>Zero advance • Pay post visit</Text>
                  </View>
                </View>
              </View>

              {/* Zero Deposit Promise */}
              <View style={styles.zeroDepositNotice}>
                <Ionicons name="shield-checkmark" size={17} color="#00B894" />
                <View style={{ flex: 1, marginLeft: 10 }}>
                  <Text style={styles.zeroDepositTitle}>Zero Advance Payment Needed</Text>
                  <Text style={styles.zeroDepositSub}>
                    Our clinical care coordinator will call your registered number within 15 minutes to confirm nurse availability and exact schedule. Payment is due only after care delivery.
                  </Text>
                </View>
              </View>
            </View>

            {/* Step 4 Actions */}
            <View style={styles.stepDualActionsRow}>
              <TouchableOpacity
                style={styles.stepBackOutlineBtn}
                onPress={() => setFlowStep(3)}
              >
                <Text style={styles.stepBackOutlineBtnText}>← Edit</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.confirmFinalSubmitBtn, { flex: 1 }]}
                onPress={handleSubmitCareRequest}
                activeOpacity={0.88}
              >
                <Ionicons name="checkmark-circle" size={17} color="#FFFFFF" style={{ marginRight: 6 }} />
                <Text style={styles.confirmFinalSubmitBtnText}>Submit Care Request</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* STEP 5: SUCCESS STATE */}
        {flowStep === 5 && newlyCreatedRequest && (
          <View style={styles.successStateBox}>
            <View style={styles.successIconOuter}>
              <View style={styles.successIconInner}>
                <Ionicons name="checkmark" size={32} color="#FFFFFF" />
              </View>
            </View>

            <Text style={styles.successTitle}>Care Request Submitted!</Text>
            <Text style={styles.successSub}>
              Your request ID is <Text style={{ fontWeight: '800', color: '#0F172A' }}>{newlyCreatedRequest.id}</Text>
            </Text>

            <View style={styles.successPricingPill}>
              <Ionicons name="pricetag" size={15} color="#00B894" />
              <Text style={styles.successPricingPillText}>
                Estimated Total: <Text style={{ fontWeight: '800', color: '#0F172A' }}>₹{(newlyCreatedRequest.preferences?.estimatedTotalCost || pricingDetails.finalTotal).toLocaleString('en-IN')}</Text> ({newlyCreatedRequest.preferences?.careDays || pricingDetails.days} {newlyCreatedRequest.preferences?.careDays === 1 ? 'Day' : 'Days'}) • Pay after visit
              </Text>
            </View>

            <View style={styles.nextStepsCard}>
              <Text style={styles.nextStepsHeader}>What happens next?</Text>
              <View style={styles.nextStepItem}>
                <Text style={styles.nextStepNum}>1</Text>
                <Text style={styles.nextStepText}>
                  MediUnify clinical coordinator calls you at {newlyCreatedRequest.contactNumber} within 15 minutes.
                </Text>
              </View>
              <View style={styles.nextStepItem}>
                <Text style={styles.nextStepNum}>2</Text>
                <Text style={styles.nextStepText}>
                  A suitable licensed nurse (GNM / B.Sc) is assigned with sterile procedure kit.
                </Text>
              </View>
              <View style={styles.nextStepItem}>
                <Text style={styles.nextStepNum}>3</Text>
                <Text style={styles.nextStepText}>
                  Visit schedule and arrival time are confirmed via SMS and live notifications.
                </Text>
              </View>
            </View>

            <View style={styles.successActionsRow}>
              <TouchableOpacity
                style={[styles.trackRequestBtn, { backgroundColor: '#10B981' }]}
                onPress={() => {
                  if (navigation?.navigate) {
                    navigation.navigate('Bookings', { initialTab: 'upcoming', newAppointment: newlyCreatedRequest });
                  } else {
                    setSelectedRequestDetail(newlyCreatedRequest);
                    setCurrentView('MY_REQUESTS');
                  }
                }}
                activeOpacity={0.85}
              >
                <Ionicons name="calendar-outline" size={16} color="#FFFFFF" style={{ marginRight: 6 }} />
                <Text style={styles.trackRequestBtnText}>View in My Bookings</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.trackRequestBtn}
                onPress={() => {
                  setSelectedRequestDetail(newlyCreatedRequest);
                  setCurrentView('MY_REQUESTS');
                }}
                activeOpacity={0.85}
              >
                <Ionicons name="receipt-outline" size={16} color="#FFFFFF" style={{ marginRight: 6 }} />
                <Text style={styles.trackRequestBtnText}>Track My Request</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.backToHomeBtn}
                onPress={() => setCurrentView('LANDING')}
                activeOpacity={0.8}
              >
                <Text style={styles.backToHomeBtnText}>Back to Home Care</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </ScrollView>
    </View>
  );

  // =========================================================================
  // VIEW 3: MY REQUESTS & LIVE TRACKING
  // =========================================================================
  const renderMyRequestsView = () => (
    <ScrollView
      style={styles.scrollContainer}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
    >
      {/* Top Header */}
      <View style={styles.myRequestsHeaderRow}>
        <TouchableOpacity
          style={styles.flowBackBtn}
          onPress={() => setCurrentView('LANDING')}
          activeOpacity={0.7}
        >
          <Ionicons name="arrow-back" size={20} color="#0F172A" />
        </TouchableOpacity>

        <View style={{ flex: 1, marginLeft: 12 }}>
          <Text style={styles.myRequestsMainTitle}>My Home Care Requests</Text>
          <Text style={styles.myRequestsSub}>
            Track coordinator status and assigned nurse credentials
          </Text>
        </View>

        <TouchableOpacity
          style={styles.newRequestBtn}
          onPress={() => {
            setShowAllServices(false);
            setFlowStep(1);
            setCurrentView('REQUEST_FLOW');
          }}
          activeOpacity={0.85}
        >
          <Ionicons name="add" size={15} color="#FFFFFF" />
          <Text style={styles.newRequestBtnText}>New Request</Text>
        </TouchableOpacity>
      </View>

      {/* Filter Tabs */}
      <View style={styles.requestFilterTabsRow}>
        {['All', 'In Progress', 'Confirmed', 'Completed'].map((tab) => {
          const isSelected = requestsTabFilter === tab;
          return (
            <TouchableOpacity
              key={tab}
              style={[styles.requestFilterTab, isSelected && styles.requestFilterTabActive]}
              onPress={() => setRequestsTabFilter(tab)}
              activeOpacity={0.75}
            >
              <Text style={[styles.requestFilterTabText, isSelected && styles.requestFilterTabTextActive]}>
                {tab}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Requests Cards List */}
      {filteredRequests.length === 0 ? (
        <View style={styles.emptyRequestsBox}>
          <Ionicons name="clipboard-outline" size={44} color="#94A3B8" />
          <Text style={styles.emptyRequestsTitle}>No requests found in "{requestsTabFilter}"</Text>
          <Text style={styles.emptyRequestsSub}>
            Need professional nursing care at home? Submit a new request in 2 minutes.
          </Text>
          <TouchableOpacity
            style={styles.emptyStartBtn}
            onPress={() => {
              setShowAllServices(false);
              setFlowStep(1);
              setCurrentView('REQUEST_FLOW');
            }}
          >
            <Text style={styles.emptyStartBtnText}>Request a Nurse Now</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.requestsCardsList}>
          {filteredRequests.map((req) => (
            <View key={req.id} style={styles.requestItemCard}>
              <View style={styles.reqCardHeader}>
                <View>
                  <View style={styles.reqIdRow}>
                    <Text style={styles.reqIdText}>{req.id}</Text>
                    <View style={styles.reqStatusPill}>
                      <Text style={styles.reqStatusText}>{req.status}</Text>
                    </View>
                  </View>
                  <Text style={styles.reqDateText}>Requested: {req.requestDate}</Text>
                </View>

                <TouchableOpacity
                  style={styles.viewTimelineBtn}
                  onPress={() => {
                    setSelectedRequestDetail(req);
                    setCurrentView('REQUEST_DETAILS');
                  }}
                  activeOpacity={0.8}
                >
                  <Text style={styles.viewTimelineBtnText}>Timeline →</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.reqPatientRow}>
                <Ionicons name="person-outline" size={15} color="#64748B" />
                <Text style={styles.reqPatientText}>
                  Patient: <Text style={{ fontWeight: '700', color: '#0F172A' }}>{req.patientName}</Text> ({req.patientAge} yrs, {req.patientGender})
                </Text>
              </View>

              <View style={styles.reqAddressRow}>
                <Ionicons name="location-outline" size={15} color="#64748B" />
                <Text style={styles.reqAddressText} numberOfLines={1}>
                  {req.address}
                </Text>
              </View>

              {/* Services tags */}
              <View style={styles.reqServicesRow}>
                {req.selectedServices.map((s) => (
                  <View key={s} style={styles.reqServiceChip}>
                    <Text style={styles.reqServiceChipText}>{s}</Text>
                  </View>
                ))}
              </View>

              {/* Assigned Nurse Preview if available */}
              {req.assignedNurse && assignedNursesData[req.assignedNurse] && (
                <View style={styles.assignedNurseMiniCard}>
                  <Image
                    source={{ uri: assignedNursesData[req.assignedNurse].photo }}
                    style={styles.assignedNurseMiniPhoto}
                  />
                  <View style={{ flex: 1, marginLeft: 10 }}>
                    <Text style={styles.assignedNurseMiniTitle}>
                      Assigned: {assignedNursesData[req.assignedNurse].name} ({assignedNursesData[req.assignedNurse].qualification})
                    </Text>
                    <Text style={styles.assignedNurseMiniSub}>
                      Visit: {req.confirmedVisitDate || 'Today'} at {req.confirmedVisitTime || '11:00 AM'}
                    </Text>
                  </View>
                  <TouchableOpacity
                    style={styles.callNurseBtn}
                    onPress={() => showAlert('Contact Coordinator', 'Call Care Desk at 1800-425-0099 to coordinate with your nurse.')}
                  >
                    <Ionicons name="call" size={14} color="#00B894" />
                  </TouchableOpacity>
                </View>
              )}
            </View>
          ))}
        </View>
      )}
    </ScrollView>
  );

  // =========================================================================
  // VIEW 4: DETAILED REQUEST & STAGE TIMELINE
  // =========================================================================
  const renderRequestDetailsView = () => {
    if (!selectedRequestDetail) return null;
    const req = selectedRequestDetail;
    const assignedNurse = req.assignedNurse ? assignedNursesData[req.assignedNurse] : null;

    return (
      <ScrollView
        style={styles.scrollContainer}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.detailHeaderRow}>
          <TouchableOpacity
            style={styles.flowBackBtn}
            onPress={() => setCurrentView('MY_REQUESTS')}
            activeOpacity={0.7}
          >
            <Ionicons name="arrow-back" size={20} color="#0F172A" />
          </TouchableOpacity>

          <View style={{ flex: 1, marginLeft: 12 }}>
            <Text style={styles.detailMainTitle}>Care Request Details</Text>
            <Text style={styles.detailSub}>ID: {req.id} • {req.status}</Text>
          </View>
        </View>

        {/* Status Card */}
        <View style={styles.detailStatusCard}>
          <View style={styles.detailStatusTop}>
            <View style={styles.detailPulseWrap}>
              <View style={styles.detailLiveDot} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.detailStatusTitle}>{req.status}</Text>
              <Text style={styles.detailStatusDesc}>
                {req.status === 'Care Team Will Call You' && 'A clinical care coordinator is reviewing your request and will call within 15 minutes.'}
                {req.status === 'Visit Confirmed' && 'Visit timing confirmed. The assigned nurse will arrive with sterile supplies.'}
                {req.status === 'Visit Completed' && 'Care delivery completed and signed off.'}
              </Text>
            </View>
          </View>

          {/* Timeline Stages */}
          <View style={styles.timelineList}>
            {careTimelineStages.map((stage, idx) => {
              const isPast = idx <= req.currentStageIndex;
              const isCurrent = idx === req.currentStageIndex;

              return (
                <View key={stage.id} style={styles.timelineRow}>
                  <View style={styles.timelineLeftCol}>
                    <View
                      style={[
                        styles.timelineBullet,
                        isPast && styles.timelineBulletPast,
                        isCurrent && styles.timelineBulletCurrent,
                      ]}
                    >
                      {isPast ? (
                        <Ionicons name="checkmark" size={10} color="#FFFFFF" />
                      ) : (
                        <View style={styles.timelineBulletFuture} />
                      )}
                    </View>
                    {idx < careTimelineStages.length - 1 && (
                      <View
                        style={[
                          styles.timelineConnectingLine,
                          isPast && styles.timelineConnectingLinePast,
                        ]}
                      />
                    )}
                  </View>

                  <View style={styles.timelineContentCol}>
                    <Text style={[styles.timelineStageLabel, (isPast || isCurrent) && styles.timelineStageLabelActive]}>
                      {stage.label}
                    </Text>
                    <Text style={styles.timelineStageDesc}>{stage.description}</Text>
                  </View>
                </View>
              );
            })}
          </View>
        </View>

        {/* Assigned Nurse Card if available */}
        {assignedNurse && (
          <View style={styles.assignedNurseCard}>
            <Text style={styles.assignedCardHeader}>Assigned Clinical Nurse</Text>
            <View style={styles.assignedCardBody}>
              <Image source={{ uri: assignedNurse.photo }} style={styles.assignedPhotoLarge} />
              <View style={{ flex: 1, marginLeft: 14 }}>
                <Text style={styles.assignedNameLarge}>{assignedNurse.name}</Text>
                <Text style={styles.assignedQualLarge}>{assignedNurse.qualification} • {assignedNurse.experience} exp</Text>
                <Text style={styles.assignedSpecLarge}>
                  Specialty: {assignedNurse.specialization || (Array.isArray(assignedNurse.specialties) ? assignedNurse.specialties.join(', ') : 'General Nursing')}
                </Text>
                <Text style={styles.assignedRegLarge}>Council Reg: {assignedNurse.councilReg || assignedNurse.regNumber || 'KNC Verified'}</Text>
              </View>
            </View>
          </View>
        )}
      </ScrollView>
    );
  };

  return (
    <SafeAreaView style={styles.rootContainer}>
      {currentView === 'LANDING' && renderLandingView()}
      {currentView === 'REQUEST_FLOW' && renderRequestFlowView()}
      {currentView === 'MY_REQUESTS' && renderMyRequestsView()}
      {currentView === 'REQUEST_DETAILS' && renderRequestDetailsView()}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  rootContainer: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 40,
  },

  // Top Bar Row
  topBarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: Platform.OS === 'ios' ? 4 : 8,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    marginBottom: 16,
    gap: 8,
  },
  headerLeftGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  headerTitleWrap: {
    marginLeft: 8,
    flex: 1,
  },
  backCircleBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 15.5,
    fontWeight: '800',
    color: '#0F172A',
  },
  liveVerifiedPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#A7F3D0',
    gap: 4,
    marginTop: 2,
    alignSelf: 'flex-start',
  },
  livePulseDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: '#10B981',
  },
  liveVerifiedPillText: {
    fontSize: 9.5,
    fontWeight: '700',
    color: '#047857',
  },
  helplineBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0FDFA',
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#99F6E4',
    gap: 4,
  },
  helplineBtnText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#0D9488',
  },

  // Hero Banner Card
  heroBannerCard: {
    backgroundColor: '#0F172A',
    borderRadius: 18,
    padding: 18,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#1E293B',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.18,
    shadowRadius: 18,
    elevation: 6,
  },
  heroBadgePill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(94, 234, 212, 0.12)',
    alignSelf: 'flex-start',
    paddingHorizontal: 9,
    paddingVertical: 3.5,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(94, 234, 212, 0.25)',
    gap: 5,
    marginBottom: 12,
  },
  heroBadgePillText: {
    fontSize: 10.5,
    fontWeight: '800',
    color: '#5EEAD4',
  },
  heroHeadline: {
    fontSize: 22,
    fontWeight: '900',
    color: '#FFFFFF',
    lineHeight: 28,
    letterSpacing: -0.4,
    marginBottom: 8,
  },
  heroHeadlineAccent: {
    color: '#2DD4BF',
  },
  heroSubheadline: {
    fontSize: 13,
    color: '#CBD5E1',
    lineHeight: 19,
    marginBottom: 16,
  },
  heroValuePropsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 18,
  },
  heroValueItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  heroValueText: {
    fontSize: 11,
    color: '#E2E8F0',
    fontWeight: '600',
  },
  heroActionsRow: {
    flexDirection: 'column',
    gap: 10,
    marginBottom: 16,
  },
  heroPrimaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#00B894',
    paddingVertical: 13,
    paddingHorizontal: 16,
    borderRadius: 12,
    shadowColor: '#00B894',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 3,
  },
  heroPrimaryBtnText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  heroSecondaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.18)',
  },
  heroSecondaryBtnText: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#E2E8F0',
  },

  // Quick Match Box inside Hero
  quickMatchCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
  },
  quickMatchHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  quickMatchTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  quickMatchSub: {
    fontSize: 11,
    color: '#94A3B8',
  },
  quickMatchChipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 7,
  },
  quickChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(13, 148, 136, 0.22)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(45, 212, 191, 0.35)',
    gap: 5,
  },
  quickChipText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#5EEAD4',
  },

  // Stats Grid (2x2 on Mobile with clean card items)
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 24,
    justifyContent: 'space-between',
    gap: 10,
  },
  statBox: {
    width: '48%',
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  statValue: {
    fontSize: 18,
    fontWeight: '900',
    color: '#00B894',
    letterSpacing: -0.5,
  },
  statLabel: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '600',
    marginTop: 3,
    textAlign: 'center',
  },

  // Search & Filters
  searchSectionWrap: {
    marginBottom: 16,
  },
  sectionHeaderRow: {
    marginBottom: 12,
  },
  sectionHeading: {
    fontSize: 18,
    fontWeight: '900',
    color: '#0F172A',
    letterSpacing: -0.3,
  },
  sectionSubheading: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  searchInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    marginBottom: 12,
    height: 44,
  },
  searchInput: {
    flex: 1,
    paddingHorizontal: 10,
    fontSize: 13,
    color: '#0F172A',
  },
  categoryPillsScroll: {
    paddingVertical: 2,
    gap: 8,
  },
  categoryPillBtn: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CBD5E1',
  },
  categoryPillBtnActive: {
    backgroundColor: '#0F172A',
    borderColor: '#0F172A',
  },
  categoryPillBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#475569',
  },
  categoryPillBtnTextActive: {
    color: '#FFFFFF',
    fontWeight: '800',
  },

  // Services Grid
  servicesGrid: {
    gap: 14,
    marginBottom: 28,
  },
  serviceElevatedCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  serviceElevatedCardSelected: {
    borderColor: '#00B894',
    backgroundColor: '#F0FDFA',
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  categoryBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  categoryBadgeText: {
    fontSize: 10.5,
    fontWeight: '800',
  },
  tagBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0FDFA',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#99F6E4',
    gap: 3,
  },
  tagBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#0D9488',
  },
  serviceTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  serviceIconContainer: {
    width: 42,
    height: 42,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  serviceCardTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
  },
  serviceCardDuration: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
  },
  serviceCardDesc: {
    fontSize: 12.5,
    color: '#475569',
    lineHeight: 18,
    marginBottom: 10,
  },
  consumablesPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 6,
    marginBottom: 12,
  },
  consumablesText: {
    fontSize: 11,
    color: '#475569',
    flex: 1,
  },
  serviceCardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  pricingCol: {},
  priceSub: {
    fontSize: 10,
    color: '#94A3B8',
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  priceValue: {
    fontSize: 16,
    fontWeight: '900',
    color: '#00B894',
  },
  bookServiceBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0F172A',
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 10,
    gap: 5,
  },
  bookServiceBtnText: {
    fontSize: 12.5,
    fontWeight: '800',
    color: '#FFFFFF',
  },

  // Nurses Section
  nursesSection: {
    marginBottom: 28,
  },
  nursesScrollRow: {
    gap: 12,
    paddingVertical: 4,
  },
  nurseCard: {
    width: 260,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  nursePhotoWrapper: {
    position: 'relative',
  },
  nursePhoto: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: '#E2E8F0',
  },
  nurseVerifiedCheck: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 17,
    height: 17,
    borderRadius: 8.5,
    backgroundColor: '#00B894',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
  },
  nurseInfoCol: {
    flex: 1,
    marginLeft: 10,
  },
  nurseNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  nurseName: {
    fontSize: 13.5,
    fontWeight: '800',
    color: '#0F172A',
  },
  nurseRatingPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 5,
    gap: 2,
  },
  nurseRatingText: {
    fontSize: 10.5,
    fontWeight: '800',
    color: '#B45309',
  },
  nurseQualification: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
  },
  nurseRegId: {
    fontSize: 10,
    color: '#94A3B8',
    marginTop: 1,
  },
  nurseSpecializationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  nurseSpecializationText: {
    fontSize: 10.5,
    color: '#0F766E',
    fontWeight: '600',
    flex: 1,
  },
  nurseLanguagesText: {
    fontSize: 10,
    color: '#64748B',
    marginTop: 3,
  },

  // How It Works
  howItWorksSection: {
    marginBottom: 28,
  },
  stepsList: {
    gap: 10,
  },
  stepCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  stepNumberBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#ECFDF5',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  stepNumberText: {
    fontSize: 14,
    fontWeight: '900',
    color: '#00B894',
  },
  stepTitle: {
    fontSize: 13.5,
    fontWeight: '800',
    color: '#0F172A',
  },
  stepDesc: {
    fontSize: 11.5,
    color: '#64748B',
    marginTop: 2,
    lineHeight: 16,
  },

  // Testimonials
  testimonialsSection: {
    marginBottom: 28,
  },
  testimonialsScrollRow: {
    gap: 12,
    paddingVertical: 4,
  },
  testimonialCard: {
    width: 270,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    justifyContent: 'space-between',
  },
  testimonialStarsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  testimonialVerifiedPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 5,
    marginLeft: 'auto',
    gap: 2,
  },
  testimonialVerifiedText: {
    fontSize: 9.5,
    fontWeight: '700',
    color: '#059669',
  },
  testimonialQuote: {
    fontSize: 12,
    color: '#334155',
    lineHeight: 17,
    fontStyle: 'italic',
    marginBottom: 12,
  },
  testimonialAuthorRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  authorAvatarCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#00B894',
    alignItems: 'center',
    justifyContent: 'center',
  },
  authorAvatarText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  authorName: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0F172A',
  },
  authorFamily: {
    fontSize: 10,
    color: '#64748B',
  },
  authorServiceTag: {
    fontSize: 10,
    color: '#00B894',
    fontWeight: '700',
  },

  // FAQ
  faqSection: {
    marginBottom: 28,
  },
  faqHeader: {
    marginBottom: 12,
  },
  faqTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: '#0F172A',
  },
  faqSub: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  faqList: {
    gap: 8,
  },
  faqItemCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  faqItemCardOpen: {
    borderColor: '#00B894',
    backgroundColor: '#FCFDFE',
  },
  faqQuestionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  faqQuestionText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
    flex: 1,
  },
  faqQuestionTextActive: {
    color: '#00B894',
  },
  faqAnswerWrap: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  faqAnswerText: {
    fontSize: 12,
    color: '#475569',
    lineHeight: 18,
  },

  // Emergency Strip
  emergencyStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0D9488',
    borderRadius: 16,
    padding: 16,
    marginBottom: 24,
    gap: 10,
  },
  emergencyIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  emergencyTitle: {
    fontSize: 13.5,
    fontWeight: '900',
    color: '#FFFFFF',
  },
  emergencySub: {
    fontSize: 11.5,
    color: '#CCFBF1',
    marginTop: 1,
  },
  emergencyCallNowBtn: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
  },
  emergencyCallNowBtnText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#0F766E',
  },

  // =========================================================================
  // REQUEST FLOW WIZARD STYLES
  // =========================================================================
  flowRoot: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  flowHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  flowBackBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  flowHeaderTitle: {
    fontSize: 15,
    fontWeight: '900',
    color: '#0F172A',
  },
  flowHeaderSub: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 1,
  },
  flowCloseBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Stepper Container
  stepperContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    paddingVertical: 10,
    paddingHorizontal: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  stepItemWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  stepperCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
  },
  stepperCircleDone: {
    backgroundColor: '#00B894',
    borderColor: '#00B894',
  },
  stepperCircleCurrent: {
    backgroundColor: '#00B894',
    borderColor: '#00B894',
  },
  stepperCircleText: {
    fontSize: 9.5,
    fontWeight: '800',
    color: '#64748B',
  },
  stepperCircleTextCurrent: {
    color: '#FFFFFF',
  },
  stepperLabelText: {
    fontSize: 10.5,
    fontWeight: '600',
    color: '#64748B',
  },
  stepperLabelTextCurrent: {
    color: '#00B894',
    fontWeight: '800',
  },
  stepperConnectingLine: {
    width: 10,
    height: 2,
    backgroundColor: '#E2E8F0',
    marginLeft: 3,
  },
  stepperConnectingLineActive: {
    backgroundColor: '#00B894',
  },

  flowScroll: {
    flex: 1,
  },
  flowScrollContent: {
    padding: 16,
    paddingBottom: 50,
  },
  stepTitleBox: {
    marginBottom: 14,
  },
  stepMainHeading: {
    fontSize: 18,
    fontWeight: '900',
    color: '#0F172A',
  },
  stepSubHeading: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },

  // Selected Confirmed Card Styles
  selectedConfirmedWrap: {
    marginBottom: 16,
  },
  singleSelectedCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 16,
    borderWidth: 2,
    borderColor: '#00B894',
    marginBottom: 12,
    shadowColor: '#00B894',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  singleSelectedTopRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  singleSelectedTitle: {
    fontSize: 15,
    fontWeight: '900',
    color: '#0F172A',
  },
  singleSelectedPrice: {
    fontSize: 15,
    fontWeight: '900',
    color: '#00B894',
  },
  singleSelectedMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 3,
  },
  greenCheckBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 5,
    borderWidth: 1,
    borderColor: '#A7F3D0',
    gap: 3,
  },
  greenCheckBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#047857',
  },
  singleSelectedDuration: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '600',
  },
  singleSelectedDesc: {
    fontSize: 12,
    color: '#475569',
    lineHeight: 17,
    marginBottom: 10,
  },
  singleSelectedKitRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0FDFA',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#CCFBF1',
    gap: 6,
  },
  singleSelectedKitText: {
    fontSize: 11,
    color: '#0F766E',
    flex: 1,
  },
  addMoreServicesBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 10,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: '#0D9488',
    backgroundColor: '#F0FDFA',
    gap: 6,
    marginBottom: 12,
  },
  addMoreServicesBtnText: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#0D9488',
  },
  bookingSelectedTrustBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  bookingSelectedTrustTitle: {
    fontSize: 11.5,
    fontWeight: '800',
    color: '#0F172A',
  },
  bookingSelectedTrustSub: {
    fontSize: 10.5,
    color: '#64748B',
    marginTop: 1,
  },
  doneAddingPill: {
    marginLeft: 'auto',
    backgroundColor: '#00B894',
    paddingHorizontal: 9,
    paddingVertical: 3,
    borderRadius: 10,
  },
  doneAddingPillText: {
    fontSize: 10.5,
    fontWeight: '800',
    color: '#FFFFFF',
  },

  selectedCountBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ECFDF5',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: '#A7F3D0',
    gap: 6,
    marginBottom: 12,
  },
  selectedCountBannerText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#047857',
  },
  errorAlertBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF2F2',
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FECACA',
    marginBottom: 10,
  },
  errorAlertText: {
    fontSize: 11.5,
    color: '#DC2626',
    fontWeight: '600',
  },

  servicesSelectList: {
    gap: 8,
    marginBottom: 16,
  },
  serviceSelectCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
  },
  serviceSelectCardChecked: {
    borderColor: '#00B894',
    backgroundColor: '#F0FDFA',
  },
  customCheckbox: {
    width: 20,
    height: 20,
    borderRadius: 5,
    borderWidth: 2,
    borderColor: '#CBD5E1',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
    backgroundColor: '#FFFFFF',
  },
  customCheckboxChecked: {
    backgroundColor: '#00B894',
    borderColor: '#00B894',
  },
  selectCardIconWrap: {
    width: 34,
    height: 34,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
  selectCardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  selectCardTitle: {
    fontSize: 13.5,
    fontWeight: '800',
    color: '#0F172A',
  },
  selectCardPrice: {
    fontSize: 12.5,
    fontWeight: '800',
    color: '#00B894',
  },
  selectCardDesc: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
  },
  selectCardKit: {
    fontSize: 10.5,
    color: '#475569',
    marginTop: 3,
  },

  // Form Controls
  formGroup: {
    marginBottom: 14,
  },
  formLabel: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 5,
  },
  formInput: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 9,
    fontSize: 13,
    color: '#0F172A',
  },
  formInputError: {
    borderColor: '#EF4444',
  },
  formErrorText: {
    fontSize: 10.5,
    color: '#EF4444',
    marginTop: 3,
    fontWeight: '600',
  },
  formRow: {
    flexDirection: 'row',
  },
  pillsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  choicePill: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
  },
  choicePillActive: {
    backgroundColor: '#00B894',
    borderColor: '#00B894',
  },
  choicePillText: {
    fontSize: 11.5,
    fontWeight: '600',
    color: '#475569',
  },
  choicePillTextActive: {
    color: '#FFFFFF',
    fontWeight: '800',
  },

  // Shift Cards
  shiftDurationGrid: {
    gap: 8,
  },
  shiftCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    padding: 12,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
  },
  shiftCardActive: {
    borderColor: '#00B894',
    backgroundColor: '#F0FDFA',
  },
  shiftCardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  shiftCardTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0F172A',
  },
  shiftCardTitleActive: {
    color: '#0D9488',
  },
  shiftCardDesc: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
    marginLeft: 24,
  },

  labelWithOptional: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 5,
  },
  optionalTag: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 4,
  },
  optionalTagText: {
    fontSize: 9.5,
    color: '#64748B',
    fontWeight: '600',
  },

  uploadDropZone: {
    backgroundColor: '#F0FDFA',
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: '#0D9488',
    borderRadius: 10,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  uploadDropTitle: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#0F766E',
    marginTop: 4,
  },
  uploadDropSub: {
    fontSize: 10.5,
    color: '#64748B',
    marginTop: 2,
  },
  uploadedDocCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ECFDF5',
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  uploadedDocName: {
    fontSize: 12,
    fontWeight: '700',
    color: '#065F46',
  },
  uploadedDocSize: {
    fontSize: 10.5,
    color: '#047857',
  },

  // Action Footers
  stepActionFooter: {
    marginTop: 10,
  },
  stepDualActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 14,
  },
  stepBackOutlineBtn: {
    paddingHorizontal: 16,
    paddingVertical: 11,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
    backgroundColor: '#FFFFFF',
  },
  stepBackOutlineBtnText: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#475569',
  },
  primaryProceedBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#00B894',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 10,
    gap: 6,
  },
  primaryProceedBtnText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  confirmFinalSubmitBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#00B894',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 10,
  },
  confirmFinalSubmitBtnText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#FFFFFF',
  },

  // Review Screen
  reviewCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 16,
  },
  reviewSection: {
    marginVertical: 4,
  },
  reviewSectionTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 8,
  },
  reviewPillsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  reviewServicePill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    gap: 4,
  },
  reviewServicePillText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#065F46',
  },
  reviewDivider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginVertical: 10,
  },
  reviewGrid: {
    gap: 5,
  },
  reviewRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  reviewLabel: {
    fontSize: 11.5,
    color: '#64748B',
    fontWeight: '600',
    width: 100,
  },
  reviewValue: {
    fontSize: 11.5,
    color: '#0F172A',
    fontWeight: '700',
    flex: 1,
    textAlign: 'right',
  },
  zeroDepositNotice: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#F0FDFA',
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#CCFBF1',
    marginTop: 12,
  },
  zeroDepositTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: '#0F766E',
  },
  zeroDepositSub: {
    fontSize: 11,
    color: '#115E59',
    marginTop: 2,
    lineHeight: 16,
  },

  // Success Box
  successStateBox: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  successIconOuter: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: '#ECFDF5',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  successIconInner: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#00B894',
    alignItems: 'center',
    justifyContent: 'center',
  },
  successTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: '#0F172A',
    textAlign: 'center',
  },
  successSub: {
    fontSize: 13,
    color: '#64748B',
    marginTop: 4,
    textAlign: 'center',
  },
  nextStepsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    width: '100%',
    marginVertical: 18,
  },
  nextStepsHeader: {
    fontSize: 13.5,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 10,
  },
  nextStepItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  nextStepNum: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#ECFDF5',
    color: '#00B894',
    fontWeight: '800',
    fontSize: 11,
    textAlign: 'center',
    lineHeight: 20,
    marginRight: 8,
  },
  nextStepText: {
    fontSize: 12,
    color: '#475569',
    flex: 1,
    lineHeight: 17,
  },
  successActionsRow: {
    width: '100%',
    gap: 10,
  },
  trackRequestBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#00B894',
    paddingVertical: 12,
    borderRadius: 10,
  },
  trackRequestBtnText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  backToHomeBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 11,
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
  },
  backToHomeBtnText: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#475569',
  },

  // My Requests View
  myRequestsHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },
  myRequestsMainTitle: {
    fontSize: 16,
    fontWeight: '900',
    color: '#0F172A',
  },
  myRequestsSub: {
    fontSize: 11,
    color: '#64748B',
  },
  newRequestBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#00B894',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    gap: 3,
  },
  newRequestBtnText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  requestFilterTabsRow: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    padding: 3,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 14,
  },
  requestFilterTab: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 6,
    borderRadius: 8,
  },
  requestFilterTabActive: {
    backgroundColor: '#0F172A',
  },
  requestFilterTabText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748B',
  },
  requestFilterTabTextActive: {
    color: '#FFFFFF',
    fontWeight: '800',
  },
  emptyRequestsBox: {
    alignItems: 'center',
    paddingVertical: 40,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  emptyRequestsTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0F172A',
    marginTop: 8,
  },
  emptyRequestsSub: {
    fontSize: 11.5,
    color: '#64748B',
    textAlign: 'center',
    paddingHorizontal: 20,
    marginTop: 4,
    marginBottom: 14,
  },
  emptyStartBtn: {
    backgroundColor: '#00B894',
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 8,
  },
  emptyStartBtnText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  requestsCardsList: {
    gap: 12,
  },
  requestItemCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  reqCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  reqIdRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  reqIdText: {
    fontSize: 13,
    fontWeight: '900',
    color: '#0F172A',
  },
  reqStatusPill: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 6,
    paddingVertical: 1.5,
    borderRadius: 5,
  },
  reqStatusText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#92400E',
  },
  reqDateText: {
    fontSize: 10.5,
    color: '#94A3B8',
    marginTop: 2,
  },
  viewTimelineBtn: {
    backgroundColor: '#F8FAFC',
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  viewTimelineBtnText: {
    fontSize: 10.5,
    fontWeight: '700',
    color: '#0D9488',
  },
  reqPatientRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  reqPatientText: {
    fontSize: 11.5,
    color: '#475569',
  },
  reqAddressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 10,
  },
  reqAddressText: {
    fontSize: 11,
    color: '#64748B',
    flex: 1,
  },
  reqServicesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 5,
  },
  reqServiceChip: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 5,
  },
  reqServiceChipText: {
    fontSize: 10.5,
    fontWeight: '600',
    color: '#334155',
  },
  assignedNurseMiniCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0FDFA',
    padding: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#CCFBF1',
    marginTop: 10,
  },
  assignedNurseMiniPhoto: {
    width: 36,
    height: 36,
    borderRadius: 18,
  },
  assignedNurseMiniTitle: {
    fontSize: 11.5,
    fontWeight: '800',
    color: '#0F766E',
  },
  assignedNurseMiniSub: {
    fontSize: 10,
    color: '#14B8A6',
    marginTop: 1,
  },
  callNurseBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#99F6E4',
  },

  // Details & Timeline View
  detailHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },
  detailMainTitle: {
    fontSize: 16,
    fontWeight: '900',
    color: '#0F172A',
  },
  detailSub: {
    fontSize: 11,
    color: '#64748B',
  },
  detailStatusCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 16,
  },
  detailStatusTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    marginBottom: 16,
  },
  detailPulseWrap: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#DCFCE7',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  detailLiveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#16A34A',
  },
  detailStatusTitle: {
    fontSize: 14,
    fontWeight: '900',
    color: '#0F172A',
  },
  detailStatusDesc: {
    fontSize: 11.5,
    color: '#64748B',
    marginTop: 2,
    lineHeight: 16,
  },
  timelineList: {
    paddingLeft: 6,
  },
  timelineRow: {
    flexDirection: 'row',
    minHeight: 50,
  },
  timelineLeftCol: {
    alignItems: 'center',
    width: 20,
  },
  timelineBullet: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
  },
  timelineBulletPast: {
    backgroundColor: '#00B894',
  },
  timelineBulletCurrent: {
    backgroundColor: '#0F172A',
  },
  timelineBulletFuture: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#94A3B8',
  },
  timelineConnectingLine: {
    width: 2,
    flex: 1,
    backgroundColor: '#E2E8F0',
    marginVertical: 2,
  },
  timelineConnectingLinePast: {
    backgroundColor: '#00B894',
  },
  timelineContentCol: {
    flex: 1,
    marginLeft: 12,
    paddingBottom: 14,
  },
  timelineStageLabel: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#64748B',
  },
  timelineStageLabelActive: {
    color: '#0F172A',
    fontWeight: '800',
  },
  timelineStageDesc: {
    fontSize: 11,
    color: '#94A3B8',
    marginTop: 1,
  },
  assignedNurseCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 20,
  },
  assignedCardHeader: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 10,
  },
  assignedCardBody: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  assignedPhotoLarge: {
    width: 52,
    height: 52,
    borderRadius: 26,
  },
  assignedNameLarge: {
    fontSize: 13.5,
    fontWeight: '800',
    color: '#0F172A',
  },
  assignedQualLarge: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 1,
  },
  assignedSpecLarge: {
    fontSize: 11,
    fontWeight: '700',
    color: '#00B894',
    marginTop: 2,
  },
  assignedRegLarge: {
    fontSize: 10,
    color: '#94A3B8',
    marginTop: 1,
  },
  // Date Option Styles
  dateOptionRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 4,
  },
  dateOptionCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    padding: 10,
  },
  dateOptionCardActive: {
    borderColor: '#00B894',
    backgroundColor: '#F0FDF4',
  },
  dateOptionTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  dateRadioCircle: {
    width: 15,
    height: 15,
    borderRadius: 7.5,
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dateRadioCircleActive: {
    borderColor: '#00B894',
  },
  dateRadioInnerCircle: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: '#00B894',
  },
  dateOptionLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1E293B',
  },
  dateOptionLabelActive: {
    color: '#00B894',
  },
  dateOptionSub: {
    fontSize: 10,
    color: '#64748B',
    marginTop: 1,
  },
  customDateInputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#00B894',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 9,
    marginTop: 8,
  },
  customDateInput: {
    flex: 1,
    fontSize: 13,
    color: '#0F172A',
  },
  // Days Duration Styles
  daysBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#A7F3D0',
    gap: 4,
  },
  daysBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#0D9488',
  },
  daysPresetsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 4,
    marginBottom: 10,
  },
  presetDayPill: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    backgroundColor: '#F8FAFC',
  },
  presetDayPillActive: {
    backgroundColor: '#00B894',
    borderColor: '#00B894',
  },
  presetDayText: {
    fontSize: 11.5,
    fontWeight: '600',
    color: '#64748B',
  },
  presetDayTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  daysCounterContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  daysCounterTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#475569',
  },
  daysCounterBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 9,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    padding: 2,
  },
  daysCounterBtn: {
    width: 30,
    height: 30,
    borderRadius: 7,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  daysCounterBtnDisabled: {
    opacity: 0.4,
  },
  daysCounterCenter: {
    minWidth: 54,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
  daysCounterNumber: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
  },
  daysCounterUnit: {
    fontSize: 9.5,
    fontWeight: '600',
    color: '#64748B',
    textTransform: 'uppercase',
  },
  // Dynamic Pricing Card Styles
  pricingSummaryCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#CCFBF1',
    padding: 12,
    marginTop: 12,
    marginBottom: 6,
  },
  pricingTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  pricingTagRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginBottom: 3,
    flexWrap: 'wrap',
  },
  pricingTagText: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#0F172A',
  },
  discountBadge: {
    backgroundColor: '#ECFDF5',
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 1.5,
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  discountBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#059669',
  },
  pricingCalcSubtitle: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 1,
  },
  pricingAmountWrap: {
    alignItems: 'flex-end',
  },
  pricingStrikePrice: {
    fontSize: 11,
    color: '#94A3B8',
    textDecorationLine: 'line-through',
    fontWeight: '600',
  },
  pricingFinalAmount: {
    fontSize: 19,
    fontWeight: '800',
    color: '#00B894',
  },
  pricingPerVisitNote: {
    fontSize: 10,
    color: '#64748B',
    fontWeight: '600',
  },
  pricingSavingsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0FDF4',
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 6,
    marginTop: 8,
    gap: 5,
  },
  pricingSavingsText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#059669',
  },
  pricingDivider: {
    height: 1,
    backgroundColor: '#E2E8F0',
    marginVertical: 10,
  },
  pricingGuaranteeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  pricingGuaranteeText: {
    fontSize: 10.5,
    color: '#0D9488',
    fontWeight: '600',
    flex: 1,
  },
  successPricingPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0FDF4',
    borderWidth: 1,
    borderColor: '#A7F3D0',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 18,
    marginTop: 10,
    gap: 6,
  },
  successPricingPillText: {
    fontSize: 12,
    color: '#1E293B',
    fontWeight: '600',
  },
  // Mobile Calendar Widget Styles
  calendarContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    padding: 12,
    marginTop: 8,
  },
  calNavHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  calNavBtn: {
    width: 28,
    height: 28,
    borderRadius: 7,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  calNavBtnDisabled: {
    opacity: 0.35,
  },
  calMonthYearBox: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  calMonthYearText: {
    fontSize: 13.5,
    fontWeight: '800',
    color: '#0F172A',
  },
  calWeekdaysRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    paddingBottom: 5,
    marginBottom: 3,
  },
  calWeekdayCell: {
    width: '14.28%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  calWeekdayText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#94A3B8',
  },
  calGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  calDayCell: {
    width: '14.28%',
    height: 35,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    borderRadius: 8,
    marginVertical: 1,
  },
  calDayCellSelected: {
    backgroundColor: '#00B894',
  },
  calDayCellToday: {
    borderWidth: 1.5,
    borderColor: '#00B894',
    backgroundColor: '#F0FDF4',
  },
  calDayText: {
    fontSize: 12.5,
    fontWeight: '600',
    color: '#1E293B',
  },
  calDayTextPast: {
    color: '#CBD5E1',
  },
  calDayTextToday: {
    color: '#00B894',
    fontWeight: '800',
  },
  calDayTextSelected: {
    color: '#FFFFFF',
    fontWeight: '800',
  },
  calTodayDot: {
    position: 'absolute',
    bottom: 2.5,
    width: 3.5,
    height: 3.5,
    borderRadius: 1.75,
    backgroundColor: '#00B894',
  },
  calFooterBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    marginTop: 8,
    paddingTop: 8,
    flexWrap: 'wrap',
    gap: 6,
  },
  calFooterLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  calFooterText: {
    fontSize: 11.5,
    color: '#475569',
  },
  calQuickTodayBtn: {
    paddingHorizontal: 8,
    paddingVertical: 3.5,
    borderRadius: 6,
    backgroundColor: '#F1F5F9',
  },
  calQuickTodayText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#00B894',
  },
});

export default NurseBookingScreen;
