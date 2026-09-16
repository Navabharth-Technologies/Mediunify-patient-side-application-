import React, { useState, useMemo, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  Image,
  Linking,
  ActivityIndicator,
  useWindowDimensions,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import colors from '../../../theme/colors';
import { certifiedNurses } from '../../../data/nurseCareData';
import { pushAppointment } from '../../../services/dataSyncService';
import WebFooter from '../../../components/web/WebFooter';
import { showAlert } from '../../../utils/alert';

// ==================================================
// CONSTANTS & DATA
// ==================================================

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

const DAYS_SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

// 1. Clinical Purpose / Patient Condition Filter
const CLINICAL_PURPOSES = [
  {
    id: 'all',
    label: 'All Nursing Services',
    icon: 'shield-checkmark',
    color: '#0D9488',
    bg: '#F0FDFA',
    desc: 'Comprehensive bedside care, procedural visits & vital monitoring',
  },
  {
    id: 'postop',
    label: 'Post-Surgery Recovery',
    icon: 'medkit',
    color: '#2563EB',
    bg: '#EFF6FF',
    recommendedShift: 'shift-12-day',
    desc: 'Surgical wound dressing, drain management, pain relief & mobility assistance',
  },
  {
    id: 'elderly',
    label: 'Elderly & Bedridden Care',
    icon: 'heart',
    color: '#DB2777',
    bg: '#FFF1F2',
    recommendedShift: 'shift-24-round',
    desc: 'Bathing, diaper care, feeding, bed sore prevention & full-day companionship',
  },
  {
    id: 'wound',
    label: 'Wound Dressing & IV Infusion',
    icon: 'bandage',
    color: '#D97706',
    bg: '#FFFBEB',
    recommendedShift: 'visit-2hr',
    desc: 'Sterile dressing for diabetic ulcers, cannula insertions & antibiotic IV drips',
  },
  {
    id: 'night',
    label: 'Overnight Vital Monitoring',
    icon: 'moon',
    color: '#7C3AED',
    bg: '#FAF5FF',
    recommendedShift: 'shift-12-night',
    desc: 'Continuous nighttime oxygen, BP, sugar checks & emergency distress vigilance',
  },
  {
    id: 'icu',
    label: 'ICU at Home & Tracheostomy',
    icon: 'pulse',
    color: '#E11D48',
    bg: '#FFE4E6',
    recommendedShift: 'shift-24-round',
    desc: 'Ventilator/BiPAP assistance, tracheostomy suctioning & Ryle’s tube feeding',
  },
];

// 2. Duty Shifts
const STAFF_SHIFTS = [
  {
    id: 'shift-12-day',
    label: '12-Hour Day Shift',
    badge: 'POPULAR CHOICE',
    badgeBg: '#CCFBF1',
    badgeColor: '#0F766E',
    timing: '08:00 AM – 08:00 PM',
    hours: '12 Hours',
    dailyRate: 1499,
    icon: 'sunny',
    desc: 'Daytime administration of medications, vitals charting, feeding assistance, sponge bath & daily physiotherapy routine.',
    features: [
      'Medicines & insulin administration',
      'Blood pressure, pulse & sugar charting',
      'Oral feeding & bed mobility aid',
      'Daily supervisor tele-checkin',
    ],
  },
  {
    id: 'shift-12-night',
    label: '12-Hour Night Shift',
    badge: 'CRITICAL CARE',
    badgeBg: '#F3E8FF',
    badgeColor: '#7C3AED',
    timing: '08:00 PM – 08:00 AM',
    hours: '12 Hours',
    dailyRate: 1499,
    icon: 'moon',
    desc: 'Vigilant overnight vital monitoring, catheter/IV care, nighttime medication schedules, and peaceful patient sleep comfort.',
    features: [
      'Continuous overnight oxygen check',
      'Catheter bag emptying & IV lines',
      'Repositioning to prevent bed sores',
      'Immediate family emergency alerting',
    ],
  },
  {
    id: 'shift-24-round',
    label: '24x7 Round-The-Clock',
    badge: 'BEST VALUE • INTENSIVE',
    badgeBg: '#DCFCE7',
    badgeColor: '#15803D',
    timing: '24 Hours Residential',
    hours: '24 Hours',
    dailyRate: 2699,
    icon: 'infinite',
    desc: 'Full-time dedicated registered nurse residing at home to provide hospital-grade continuous clinical nursing assistance.',
    features: [
      'Round-the-clock bedside nursing',
      'Tracheostomy & Ryle’s tube care',
      'Complete hygiene & personal care',
      'Daily physician supervisor review',
    ],
  },
  {
    id: 'visit-2hr',
    label: 'Short Procedure Visit',
    badge: 'QUICK RELIEF',
    badgeBg: '#FEF3C7',
    badgeColor: '#B45309',
    timing: 'Custom 2-Hour Slot',
    hours: '2 Hours',
    dailyRate: 599,
    icon: 'medkit',
    desc: 'Targeted single-procedure home visit for surgical dressing, injections, urinary catheter insertion, or nebulization.',
    features: [
      'Sterile post-op surgical dressing',
      'IM / IV injections & cannula fix',
      'Foley catheter insertion / flush',
      'Nebulization & vitals check',
    ],
  },
];

// 3. Package Deals
const STAFF_PACKAGES = [
  {
    days: 1,
    title: '1 Day Visit',
    subtitle: 'Standard Daily Trial',
    discountPercent: 0,
    tag: null,
  },
  {
    days: 2,
    title: '2 Days Deal',
    subtitle: 'Weekend & Post-Op Recovery',
    discountPercent: 10,
    tag: 'SAVE 10%',
    isHot: true,
  },
  {
    days: 3,
    title: '3 Days Care',
    subtitle: 'Surgical Step-Down Care',
    discountPercent: 15,
    tag: 'SAVE 15%',
  },
  {
    days: 7,
    title: '7 Days (1 Week)',
    subtitle: 'Weekly Palliative / Elderly Support',
    discountPercent: 25,
    tag: 'SAVE 25% • POPULAR',
    isBest: true,
  },
  {
    days: 14,
    title: '14 Days (Fortnight)',
    subtitle: 'Rehabilitation & Chronic Care',
    discountPercent: 30,
    tag: 'SAVE 30%',
  },
  {
    days: 30,
    title: '30 Days (1 Month)',
    subtitle: 'Long-Term Bedside Home Nursing',
    discountPercent: 40,
    tag: 'SAVE 40% • MAX VALUE',
  },
];

// 4. Clinical Quality Assurance Pillars
const CLINICAL_PILLARS = [
  {
    id: 'p-1',
    icon: 'shield-checkmark',
    color: '#0D9488',
    bg: '#F0FDFA',
    title: 'INC & KNC Certified Nurses',
    desc: 'All nursing officers hold valid Karnataka Nursing Council registrations with verified GNM or B.Sc Nursing degrees.',
  },
  {
    id: 'p-2',
    icon: 'finger-print',
    color: '#2563EB',
    bg: '#EFF6FF',
    title: '100% Police Background Checked',
    desc: 'Comprehensive Aadhaar, address, and criminal background verifications done for total family safety and peace of mind.',
  },
  {
    id: 'p-3',
    icon: 'sync',
    color: '#7C3AED',
    bg: '#FAF5FF',
    title: '2-Hour Free Replacement',
    desc: 'Guaranteed seamless nurse replacement within 2 hours in Mysore if your assigned staff is ever indisposed.',
  },
  {
    id: 'p-4',
    icon: 'medkit',
    color: '#059669',
    bg: '#ECFDF5',
    title: 'Doctor Tele-Supervision Included',
    desc: 'Senior physician tele-review of daily bedside vital charts and medication logs at zero additional cost.',
  },
];

// 5. Mysore Localities
const MYSORE_AREAS = [
  'Gokulam',
  'Kuvempunagar',
  'Vijayanagar 1st-4th Stage',
  'Jayalakshmipuram',
  'Saraswathipuram',
  'Hebbal',
  'Vidyaranyapuram',
  'Bannimantap',
  'Siddhartha Layout',
  'Ramakrishnanagar',
];

// 6. Testimonials
const TESTIMONIALS = [
  {
    id: 't-1',
    name: 'Ranganath Swamy',
    area: 'Jayalakshmipuram, Mysuru',
    service: '24x7 Round-The-Clock Nursing (14 Days)',
    comment:
      'After my mother’s hip replacement at Apollo BGS, we booked Sister Anitha for 2 weeks. Her gentle handling, strict vital monitoring, and sterile dressing helped my mother recover without any hospital readmission.',
    rating: 5,
    date: 'Booked 5 days ago',
  },
  {
    id: 't-2',
    name: 'Dr. Vasudeva Murthy',
    area: 'Kuvempunagar, Mysuru',
    service: '12-Hour Day Shift (30 Days)',
    comment:
      'As a doctor myself, I was very impressed by Unnathi’s clinical charting protocols. Nurse Ramesh was extremely punctual, maintained accurate glucose and BP records, and kept our family reassured throughout.',
    rating: 5,
    date: 'Booked 2 weeks ago',
  },
  {
    id: 't-3',
    name: 'Poornima S.',
    area: 'Vijayanagar 2nd Stage, Mysuru',
    service: 'Short Procedure Visits (Wound Dressing)',
    comment:
      'Needed IV infusion and surgical dressing for my father twice a day. The nurse arrived strictly on time with hospital-grade PPE and sterile disposables. Very professional and polite staff.',
    rating: 5,
    date: 'Booked last week',
  },
];

// 7. FAQs
const FAQS = [
  {
    q: 'How quickly can a verified nurse reach our home in Mysuru?',
    a: 'We maintain 14+ certified nurses on-duty across Mysore city. For urgent requirements, nurses can be dispatched within 60 to 90 minutes. For planned post-discharge care, you can schedule your preferred date and exact reporting hour.',
  },
  {
    q: 'Are the nurses qualified and background-verified?',
    a: 'Yes, 100%. Every nurse on MediUnify Unnathi is an INC (Indian Nursing Council) and KNC (Karnataka Nursing Council) certified GNM or B.Sc graduate with minimum 3+ years of hospital ICU or bedside experience. They undergo full criminal background checks.',
  },
  {
    q: 'What is the difference between 12-hour and 24x7 home nursing?',
    a: 'In a 12-hour shift (Day or Night), the nurse attends to the patient for 12 hours and returns home. In 24x7 round-the-clock care, a dedicated nurse resides with your family full-time to provide intensive continuous bedside care.',
  },
  {
    q: 'What if we are not satisfied or the nurse takes sick leave?',
    a: 'We offer an unconditional 2-Hour Free Replacement Guarantee in Mysuru. If your assigned nurse is ever unavailable or does not meet your clinical expectations, our supervisor assigns an alternate verified nurse immediately at no extra charge.',
  },
  {
    q: 'What clinical tasks are covered by the home nurse?',
    a: 'Our nurses administer oral & IV medications, insulin, monitor vitals (BP, sugar, SpO2, temp), handle surgical wound dressing, Foley catheters, tracheostomy suctioning, Ryle’s tube feeding, stoma care, and patient bed mobility.',
  },
];

// ==================================================
// MAIN WEB SCREEN COMPONENT
// ==================================================

const NurseBookingScreenWeb = ({ navigation }) => {
  const { width } = useWindowDimensions();
  const isDesktop = width >= 1024;

  // Selection States
  const [selectedPurposeId, setSelectedPurposeId] = useState('all');
  const [selectedShiftId, setSelectedShiftId] = useState('shift-12-day');
  const [daysCount, setDaysCount] = useState(2); // Default to 2 days deal

  // Booking Drawer / Modal State
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
  const [bookingStep, setBookingStep] = useState(1); // 1: Shift & Days, 2: Dates, Time & Patient, 3: Review & Pay

  // Patient & Family details
  const [patientName, setPatientName] = useState('Hemanth');
  const [patientPhone, setPatientPhone] = useState('9845012345');
  const [patientRelation, setPatientRelation] = useState('Self');
  const [patientAddress, setPatientAddress] = useState('Flat 402, Royal Palms, Kuvempunagar, Mysuru');
  const [selectedFamilyId, setSelectedFamilyId] = useState('self');
  const [familyList, setFamilyList] = useState([]);

  useEffect(() => {
    loadSavedData();
  }, []);

  const loadSavedData = async () => {
    try {
      const storedPrimary = await AsyncStorage.getItem('@unnathi_primary_user');
      const storedUser = await AsyncStorage.getItem('user');
      const storedName = await AsyncStorage.getItem('userName');
      const storedPhone = await AsyncStorage.getItem('userPhone');
      const storedEmail = await AsyncStorage.getItem('userEmail');
      let primaryName = 'Hemanth';
      let primaryPhone = '9845012345';

      if (storedPrimary) {
        try {
          const p = JSON.parse(storedPrimary);
          if (p?.name && p.name.trim()) primaryName = p.name.trim();
          if (p?.phone) primaryPhone = p.phone;
        } catch (e) {}
      }
      if (!storedPrimary && storedUser) {
        try {
          const u = JSON.parse(storedUser);
          if (u?.name && u.name.trim()) primaryName = u.name.trim();
          if (u?.phone) primaryPhone = u.phone;
        } catch (e) {}
      }
      if (storedName && storedName.trim()) {
        primaryName = storedName.trim();
      }
      if (storedPhone && storedPhone.trim()) {
        primaryPhone = storedPhone.trim();
      }

      const cleanFirst = primaryName.split(' ')[0];
      setPatientName(primaryName);
      setPatientPhone(primaryPhone);

      // Account-specific family members isolation (Strictly True Family Members Only)
      const userKey = (storedEmail || primaryPhone || primaryName).toLowerCase().replace(/[^a-z0-9]/g, '_');
      const userFamKey = `@unnathi_family_members_${userKey}`;
      const savedUserFam = await AsyncStorage.getItem(userFamKey);
      let rawFamily = null;

      if (savedUserFam) {
        try {
          const parsed = JSON.parse(savedUserFam);
          if (Array.isArray(parsed) && parsed.length > 0) {
            rawFamily = parsed;
          }
        } catch (e) {}
      }

      if (!rawFamily) {
        const famStr = await AsyncStorage.getItem('@unnathi_family_members');
        if (famStr) {
          try {
            const parsedFam = JSON.parse(famStr);
            if (Array.isArray(parsedFam) && parsedFam.length > 0) {
              rawFamily = parsedFam;
            }
          } catch (e) {}
        }
      }

      // Strictly construct ONLY the logged-in user (Self) and authentic family members (exclude 'Other')
      const trueFamily = [];
      trueFamily.push({
        id: 'self',
        name: primaryName,
        displayName: `${cleanFirst} (Self)`,
        relation: 'Self',
        phone: primaryPhone,
        isPrimary: true,
      });

      if (Array.isArray(rawFamily)) {
        rawFamily.forEach((m) => {
          // Strictly exclude 'self', 'isPrimary', or relation 'Other'
          if (
            m &&
            m.id !== 'self' &&
            !m.isPrimary &&
            m.relation !== 'Self' &&
            m.relation !== 'Other' &&
            m.name
          ) {
            const cleanName = m.name.replace(/\s*\([^)]*\)/g, '').trim();
            if (
              cleanName &&
              !trueFamily.some((p) => p.name.toLowerCase() === cleanName.toLowerCase())
            ) {
              trueFamily.push({
                id: m.id || `fam-${trueFamily.length}`,
                name: cleanName,
                displayName: m.displayName || `${cleanName} (${m.relation || 'Family'})`,
                relation: m.relation || 'Family',
                phone: m.phone || primaryPhone,
              });
            }
          }
        });
      }

      setFamilyList(trueFamily);
      setSelectedFamilyId('self');

      const wb = await AsyncStorage.getItem('@unnathi_wallet_balance');
      if (wb !== null) setWalletBalance(Number(wb));
    } catch (e) {}
  };

  // Dates & Times
  const [startDate, setStartDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 1); // Tomorrow
    return d;
  });
  const [selectedTimeStr, setSelectedTimeStr] = useState('08:00 AM');
  const [timeNote, setTimeNote] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('WALLET');
  const [walletBalance, setWalletBalance] = useState(4850);
  const [isProcessing, setIsProcessing] = useState(false);
  const [confirmedBooking, setConfirmedBooking] = useState(null);
  const [successModalVisible, setSuccessModalVisible] = useState(false);
  const [faqExpanded, setFaqExpanded] = useState({});

  // End Date calculation
  const endDate = useMemo(() => {
    const d = new Date(startDate);
    d.setDate(d.getDate() + Math.max(1, daysCount) - 1);
    return d;
  }, [startDate, daysCount]);

  // Selected Shift Object
  const selectedShift = useMemo(() => {
    return STAFF_SHIFTS.find((s) => s.id === selectedShiftId) || STAFF_SHIFTS[0];
  }, [selectedShiftId]);

  // Price Calculation with Package Discounts
  const priceCalculation = useMemo(() => {
    const dailyRate = selectedShift.dailyRate;
    const gross = dailyRate * daysCount;

    // Find applicable discount
    let discountPercent = 0;
    let dealName = 'Standard Rate';

    if (daysCount >= 30) {
      discountPercent = 40;
      dealName = 'Monthly Deal (40% OFF)';
    } else if (daysCount >= 14) {
      discountPercent = 30;
      dealName = 'Fortnight Deal (30% OFF)';
    } else if (daysCount >= 7) {
      discountPercent = 25;
      dealName = 'Weekly Deal (25% OFF)';
    } else if (daysCount >= 3) {
      discountPercent = 15;
      dealName = '3-Day Deal (15% OFF)';
    } else if (daysCount >= 2) {
      discountPercent = 10;
      dealName = '2-Day Special (10% OFF)';
    }

    const discountAmt = Math.round((gross * discountPercent) / 100);
    const afterDiscount = gross - discountAmt;
    const gstAmt = Math.round(afterDiscount * 0.18);
    const total = afterDiscount + gstAmt;

    return {
      dailyRate,
      gross,
      grossFormatted: `₹${gross.toLocaleString('en-IN')}`,
      discountPercent,
      discountAmt,
      discountFormatted: `₹${discountAmt.toLocaleString('en-IN')}`,
      dealName,
      afterDiscount,
      gstAmt,
      gstFormatted: `₹${gstAmt.toLocaleString('en-IN')}`,
      total,
      totalFormatted: `₹${total.toLocaleString('en-IN')}`,
    };
  }, [selectedShift, daysCount]);

  // Handle Days Count Adjustment
  const setDaysCountSafe = (count) => {
    const valid = Math.max(1, Math.min(count, 90));
    setDaysCount(valid);
  };

  // Format Dates
  const formatShortDate = (d) => {
    return `${d.getDate()} ${MONTH_NAMES[d.getMonth()].slice(0, 3)} ${d.getFullYear()}`;
  };

  // Toggle FAQ
  const toggleFaq = (idx) => {
    setFaqExpanded((prev) => ({ ...prev, [idx]: !prev[idx] }));
  };

  // Trigger Booking Confirmation
  const handleConfirmAndPay = async () => {
    if (!patientName.trim()) {
      showAlert('Patient Required', 'Please enter patient full name.');
      return;
    }
    if (!patientAddress.trim()) {
      showAlert('Address Required', 'Please provide delivery address in Mysuru.');
      return;
    }

    setIsProcessing(true);

    try {
      const bookingId = `NC-${Date.now().toString().slice(-6)}`;
      const assignedNurse = certifiedNurses[0] || {
        id: 'n-1',
        name: 'Sister Anitha K.',
        qualification: 'B.Sc Nursing (INC / KNC)',
        experience: '8+ Years',
        phone: '+91 82125 68888',
      };

      const bookingRecord = {
        id: bookingId,
        bookingId,
        serviceType: 'Home Care',
        serviceName: 'Verified Home Nursing Care',
        shift: selectedShift.label,
        shiftTiming: selectedShift.timing,
        purpose: CLINICAL_PURPOSES.find((p) => p.id === selectedPurposeId)?.label || 'General Nursing Care',
        daysCount,
        startDate: formatShortDate(startDate),
        endDate: formatShortDate(endDate),
        reportingTime: selectedTimeStr,
        timeNote: timeNote.trim() || 'Standard reporting',
        patient: {
          name: patientName,
          phone: patientPhone,
          relation: patientRelation,
          address: patientAddress,
        },
        assignedNurse: {
          name: assignedNurse.name,
          qualification: assignedNurse.qualification,
          experience: assignedNurse.experience,
        },
        payment: {
          method: paymentMethod,
          gross: priceCalculation.grossFormatted,
          discount: priceCalculation.discountFormatted,
          total: priceCalculation.totalFormatted,
          status: paymentMethod === 'PayOnArrival' ? 'Pay on Arrival' : 'Paid Online',
        },
        status: 'Confirmed',
        createdAt: new Date().toISOString(),
      };

      // Push to Unified Appointments Storage
      await pushAppointment(bookingRecord);

      // Deduct wallet if used
      if (paymentMethod === 'WALLET') {
        const remaining = Math.max(0, walletBalance - priceCalculation.total);
        setWalletBalance(remaining);
      }

      setConfirmedBooking(bookingRecord);
      setIsBookingModalOpen(false);
      setSuccessModalVisible(true);
    } catch (err) {
      console.error('Error confirming nurse booking:', err);
      showAlert('Booking Error', 'Could not finalize booking. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ============================================================
            1. DESKTOP BREADCRUMB & HERO SHOWCASE BANNER
        ============================================================ */}
        <View style={styles.heroSectionWrap}>
          <View style={styles.heroInner}>
            {/* Breadcrumb Row */}
            <View style={styles.breadcrumbRow}>
              <TouchableOpacity onPress={() => navigation?.navigate('Home')} activeOpacity={0.7}>
                <Text style={styles.breadcrumbLink}>Home</Text>
              </TouchableOpacity>
              <Ionicons name="chevron-forward" size={13} color="#94A3B8" />
              <TouchableOpacity onPress={() => navigation?.navigate('AllServices')} activeOpacity={0.7}>
                <Text style={styles.breadcrumbLink}>Services</Text>
              </TouchableOpacity>
              <Ionicons name="chevron-forward" size={13} color="#94A3B8" />
              <Text style={styles.breadcrumbActive}>24/7 Verified Home Nursing & Care</Text>

              <View style={{ flex: 1 }} />

              {/* On-Duty Counter Badge */}
              <View style={styles.liveDutyBadgeTop}>
                <View style={styles.livePulseDot} />
                <Text style={styles.liveDutyBadgeText}>14 ON DUTY IN MYSURU</Text>
              </View>
            </View>

            {/* Split Hero Main Row */}
            <View style={[styles.heroSplitRow, !isDesktop && { flexDirection: 'column' }]}>
              {/* Left Column: Heading, Trust Badges, CTAs */}
              <View style={styles.heroLeftCol}>
                <View style={styles.heroAccreditedPill}>
                  <Ionicons name="shield-checkmark" size={14} color="#0D9488" />
                  <Text style={styles.heroAccreditedPillText}>INC & KNC REGISTERED NURSES • 100% VERIFIED</Text>
                </View>

                <Text style={styles.heroHeading}>
                  Hospital-Grade Nursing Care{'\n'}
                  <Text style={styles.heroHeadingTeal}>in Your Mysore Home</Text>
                </Text>

                <Text style={styles.heroSubtitle}>
                  Certified GNM and B.Sc nurses providing 12-hour shifts, 24x7 residential bedside care, post-surgical recovery, IV infusion, and vital monitoring with 2-hour free replacement.
                </Text>

                {/* 4 Trust Badges Strip */}
                <View style={styles.heroPillarsGrid}>
                  <View style={styles.heroPillarCard}>
                    <View style={[styles.heroPillarIconBox, { backgroundColor: '#ECFDF5' }]}>
                      <Ionicons name="checkmark-done-circle" size={18} color="#059669" />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.heroPillarTitle}>100% Police Verified</Text>
                      <Text style={styles.heroPillarSub}>Aadhaar & criminal check</Text>
                    </View>
                  </View>

                  <View style={styles.heroPillarCard}>
                    <View style={[styles.heroPillarIconBox, { backgroundColor: '#EFF6FF' }]}>
                      <Ionicons name="pulse" size={18} color="#2563EB" />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.heroPillarTitle}>Bedside Vitals Charting</Text>
                      <Text style={styles.heroPillarSub}>BP, Sugar & SpO2 logs</Text>
                    </View>
                  </View>

                  <View style={styles.heroPillarCard}>
                    <View style={[styles.heroPillarIconBox, { backgroundColor: '#FAF5FF' }]}>
                      <Ionicons name="sync" size={18} color="#7C3AED" />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.heroPillarTitle}>2-Hr Free Replacement</Text>
                      <Text style={styles.heroPillarSub}>Guaranteed backup nurse</Text>
                    </View>
                  </View>

                  <View style={styles.heroPillarCard}>
                    <View style={[styles.heroPillarIconBox, { backgroundColor: '#FFFBEB' }]}>
                      <Ionicons name="medkit" size={18} color="#D97706" />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.heroPillarTitle}>Doctor Tele-Supervision</Text>
                      <Text style={styles.heroPillarSub}>Senior physician reviews</Text>
                    </View>
                  </View>
                </View>

                {/* Hero Actions Row */}
                <View style={styles.heroActionsRow}>
                  <TouchableOpacity
                    style={styles.heroPrimaryBtn}
                    onPress={() => setIsBookingModalOpen(true)}
                    activeOpacity={0.88}
                  >
                    <Ionicons name="calendar" size={18} color="#FFFFFF" />
                    <Text style={styles.heroPrimaryBtnText}>Book Nursing Staff Online</Text>
                    <Ionicons name="arrow-forward" size={16} color="#FFFFFF" />
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.heroSecondaryBtn}
                    onPress={() => Linking.openURL('tel:+918212568888')}
                    activeOpacity={0.85}
                  >
                    <Ionicons name="call" size={17} color="#0F766E" />
                    <View>
                      <Text style={styles.heroSecondaryBtnTitle}>Speak to Clinical Supervisor</Text>
                      <Text style={styles.heroSecondaryBtnSub}>+91 82125 68888 (Free Consult)</Text>
                    </View>
                  </TouchableOpacity>
                </View>
              </View>

              {/* Right Column: Hero Visual & Floating Highlights */}
              <View style={styles.heroRightCol}>
                <View style={styles.heroImgWrap}>
                  <Image
                    source={{
                      uri: 'https://images.unsplash.com/photo-1576091160550-2173dba999ef?w=900&auto=format&fit=crop&q=80',
                    }}
                    style={styles.heroNurseImg}
                    resizeMode="cover"
                  />

                  {/* Floating Guarantee Card */}
                  <View style={styles.floatingTrustCard}>
                    <View style={styles.floatingTrustIconCircle}>
                      <Ionicons name="shield-checkmark" size={24} color="#059669" />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.floatingTrustTitle}>Unnathi Clinical Guarantee</Text>
                      <Text style={styles.floatingTrustSub}>
                        Hospital-grade sterile PPE kits, daily clinical vital charting, and guaranteed 2-hour nurse replacement in Mysuru.
                      </Text>
                    </View>
                  </View>

                  {/* Rating Floating Badge */}
                  <View style={styles.floatingRatingBadge}>
                    <Ionicons name="star" size={16} color="#F59E0B" />
                    <View>
                      <Text style={styles.floatingRatingScore}>4.9 / 5.0</Text>
                      <Text style={styles.floatingRatingCount}>1,200+ Mysore Families</Text>
                    </View>
                  </View>
                </View>
              </View>
            </View>
          </View>
        </View>

        {/* ============================================================
            2. CLINICAL NEED / PURPOSE FILTER TABS
        ============================================================ */}
        <View style={styles.sectionWrap}>
          <View style={styles.sectionHeaderRow}>
            <View style={[styles.sectionIconBox, { backgroundColor: '#EFF6FF' }]}>
              <Ionicons name="medkit" size={20} color="#2563EB" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.sectionHeading}>1. What is the Patient's Primary Care Need?</Text>
              <Text style={styles.sectionSub}>Select clinical condition to filter recommended nurse shifts and clinical scope</Text>
            </View>
          </View>

          <View style={styles.purposesGrid}>
            {CLINICAL_PURPOSES.map((purpose) => {
              const isSelected = selectedPurposeId === purpose.id;
              return (
                <TouchableOpacity
                  key={purpose.id}
                  style={[styles.purposeCard, isSelected && styles.purposeCardActive]}
                  onPress={() => {
                    setSelectedPurposeId(purpose.id);
                    if (purpose.recommendedShift) {
                      setSelectedShiftId(purpose.recommendedShift);
                    }
                  }}
                  activeOpacity={0.85}
                >
                  <View style={[styles.purposeIconWrap, { backgroundColor: isSelected ? '#0D9488' : purpose.bg }]}>
                    <Ionicons
                      name={purpose.icon}
                      size={18}
                      color={isSelected ? '#FFFFFF' : purpose.color}
                    />
                  </View>
                  <Text style={[styles.purposeCardTitle, isSelected && styles.purposeCardTitleActive]}>
                    {purpose.label}
                  </Text>
                  <Text style={styles.purposeCardDesc} numberOfLines={2}>
                    {purpose.desc}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* ============================================================
            3. DUTY SHIFTS & TIMING (DESKTOP 4-COLUMN CARDS)
        ============================================================ */}
        <View style={[styles.sectionWrap, { backgroundColor: '#F8FAFC' }]}>
          <View style={styles.sectionHeaderRow}>
            <View style={[styles.sectionIconBox, { backgroundColor: '#F0FDF4' }]}>
              <Ionicons name="time" size={20} color="#059669" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.sectionHeading}>2. Choose Nurse Shift & Duty Scope</Text>
              <Text style={styles.sectionSub}>Select appropriate duty duration for your home recovery requirement</Text>
            </View>
          </View>

          <View style={styles.shiftsGridDesktop}>
            {STAFF_SHIFTS.map((shift) => {
              const isSelected = selectedShiftId === shift.id;
              return (
                <View
                  key={shift.id}
                  style={[styles.shiftCardDesktop, isSelected && styles.shiftCardDesktopActive]}
                >
                  {/* Top Badge */}
                  <View style={styles.shiftCardTopRow}>
                    <View style={[styles.shiftBadgePill, { backgroundColor: shift.badgeBg }]}>
                      <Text style={[styles.shiftBadgePillText, { color: shift.badgeColor }]}>
                        {shift.badge}
                      </Text>
                    </View>
                    <Ionicons name={shift.icon} size={20} color={isSelected ? '#0D9488' : '#64748B'} />
                  </View>

                  <Text style={styles.shiftCardTitle}>{shift.label}</Text>
                  <View style={styles.shiftTimingRow}>
                    <Ionicons name="alarm-outline" size={14} color="#64748B" />
                    <Text style={styles.shiftTimingText}>{shift.timing}</Text>
                  </View>

                  <Text style={styles.shiftCardDesc}>{shift.desc}</Text>

                  {/* Feature Checklist */}
                  <View style={styles.shiftFeatureList}>
                    {shift.features.map((feat, fIdx) => (
                      <View key={fIdx} style={styles.shiftFeatureRow}>
                        <Ionicons name="checkmark-circle" size={14} color="#059669" />
                        <Text style={styles.shiftFeatureText}>{feat}</Text>
                      </View>
                    ))}
                  </View>

                  {/* Price & Select Action */}
                  <View style={styles.shiftCardFooter}>
                    <View>
                      <Text style={styles.shiftPriceText}>
                        ₹{shift.dailyRate.toLocaleString('en-IN')}
                      </Text>
                      <Text style={styles.shiftPriceSub}>per day / shift</Text>
                    </View>

                    <TouchableOpacity
                      style={[styles.shiftSelectBtn, isSelected && styles.shiftSelectBtnActive]}
                      onPress={() => {
                        setSelectedShiftId(shift.id);
                        setIsBookingModalOpen(true);
                      }}
                      activeOpacity={0.88}
                    >
                      <Text style={[styles.shiftSelectBtnText, isSelected && styles.shiftSelectBtnTextActive]}>
                        {isSelected ? 'Selected' : 'Select Shift'}
                      </Text>
                      <Ionicons
                        name={isSelected ? 'checkmark' : 'arrow-forward'}
                        size={14}
                        color={isSelected ? '#FFFFFF' : '#0D9488'}
                      />
                    </TouchableOpacity>
                  </View>
                </View>
              );
            })}
          </View>
        </View>

        {/* ============================================================
            4. PACKAGE DEALS & DURATION (SAVE UP TO 40%)
        ============================================================ */}
        <View style={styles.sectionWrap}>
          <View style={styles.sectionHeaderRow}>
            <View style={[styles.sectionIconBox, { backgroundColor: '#FFFBEB' }]}>
              <Ionicons name="gift" size={20} color="#D97706" />
            </View>
            <View style={{ flex: 1 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Text style={styles.sectionHeading}>3. Care Duration & Package Savings</Text>
                <View style={styles.hotDealTagPill}>
                  <Text style={styles.hotDealTagPillText}>SAVE UP TO 40%</Text>
                </View>
              </View>
              <Text style={styles.sectionSub}>Book 2 or more days to unlock instant package discounts</Text>
            </View>
          </View>

          {/* 2-Day Deal Alert Box */}
          <View style={styles.dealHighlightAlert}>
            <Ionicons name="sparkles" size={18} color="#E11D48" />
            <Text style={styles.dealHighlightAlertText}>
              <Text style={{ fontWeight: '800' }}>Special Mysore Care Offer:</Text> Book for 2 or more days and save 10% to 40% instantly! All packages include free nurse PPE kit and daily supervisor review.
            </Text>
          </View>

          <View style={styles.packagesGridDesktop}>
            {STAFF_PACKAGES.map((pkg) => {
              const isSelected = daysCount === pkg.days;
              const pkgGross = selectedShift.dailyRate * pkg.days;
              const pkgDisc = Math.round((pkgGross * pkg.discountPercent) / 100);
              const pkgNet = pkgGross - pkgDisc;

              return (
                <TouchableOpacity
                  key={pkg.days}
                  style={[styles.pkgCardDesktop, isSelected && styles.pkgCardDesktopActive]}
                  onPress={() => setDaysCountSafe(pkg.days)}
                  activeOpacity={0.88}
                >
                  <View style={styles.pkgCardTop}>
                    <Text style={[styles.pkgCardTitle, isSelected && styles.pkgCardTitleActive]}>
                      {pkg.title}
                    </Text>
                    {pkg.tag && (
                      <View style={[styles.pkgBadgeTag, pkg.isHot && { backgroundColor: '#FFE4E6' }]}>
                        <Text style={[styles.pkgBadgeTagText, pkg.isHot && { color: '#E11D48' }]}>
                          {pkg.tag}
                        </Text>
                      </View>
                    )}
                  </View>

                  <Text style={styles.pkgCardSubtitle}>{pkg.subtitle}</Text>

                  <View style={styles.pkgCardPriceRow}>
                    <Text style={[styles.pkgCardNetPrice, isSelected && styles.pkgCardNetPriceActive]}>
                      ₹{pkgNet.toLocaleString('en-IN')}
                    </Text>
                    {pkg.discountPercent > 0 && (
                      <Text style={styles.pkgCardGrossPrice}>
                        ₹{pkgGross.toLocaleString('en-IN')}
                      </Text>
                    )}
                  </View>

                  {pkg.discountPercent > 0 ? (
                    <Text style={styles.pkgCardSavingsText}>
                      Save ₹{pkgDisc.toLocaleString('en-IN')} ({pkg.discountPercent}% OFF)
                    </Text>
                  ) : (
                    <Text style={styles.pkgCardSavingsTextMuted}>Standard Daily Rate</Text>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Stepper for Custom Days */}
          <View style={styles.customDaysStepperBox}>
            <View>
              <Text style={styles.stepperBoxTitle}>Need Custom Days?</Text>
              <Text style={styles.stepperBoxSub}>Adjust exact number of nursing days required</Text>
            </View>

            <View style={styles.stepperControlsWrap}>
              <TouchableOpacity
                style={styles.stepperBtn}
                onPress={() => setDaysCountSafe(daysCount - 1)}
                activeOpacity={0.8}
              >
                <Ionicons name="remove" size={18} color="#0F172A" />
              </TouchableOpacity>

              <View style={styles.stepperDisplay}>
                <Text style={styles.stepperDisplayText}>
                  {daysCount} {daysCount === 1 ? 'Day' : 'Days'}
                </Text>
              </View>

              <TouchableOpacity
                style={styles.stepperBtn}
                onPress={() => setDaysCountSafe(daysCount + 1)}
                activeOpacity={0.8}
              >
                <Ionicons name="add" size={18} color="#0F172A" />
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* ============================================================
            5. CERTIFIED NURSES DIRECTORY (MYSURU CLINICAL TEAM)
        ============================================================ */}
        <View style={[styles.sectionWrap, { backgroundColor: '#F8FAFC' }]}>
          <View style={styles.sectionHeaderRow}>
            <View style={[styles.sectionIconBox, { backgroundColor: '#FAF5FF' }]}>
              <Ionicons name="people" size={20} color="#7C3AED" />
            </View>
            <View style={{ flex: 1 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Text style={styles.sectionHeading}>Featured Certified Nurses on Duty</Text>
                <View style={[styles.hotDealTagPill, { backgroundColor: '#F0FDF4' }]}>
                  <Text style={[styles.hotDealTagPillText, { color: '#059669' }]}>MYSORE ACCREDITED</Text>
                </View>
              </View>
              <Text style={styles.sectionSub}>All staff verified with Karnataka Nursing Council and Mysore Police Commissioner check</Text>
            </View>
          </View>

          <View style={styles.nurseDirectoryGrid}>
            {certifiedNurses.map((nurse, index) => {
              const avatarUrl =
                index === 0
                  ? 'https://images.unsplash.com/photo-1594824813576-92f70b79873a?auto=format&fit=crop&q=80&w=350'
                  : index === 1
                  ? 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&q=80&w=350'
                  : 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&q=80&w=350';

              return (
                <View key={nurse.id} style={styles.nurseProfileCardDesktop}>
                  <View style={styles.nurseCardHeader}>
                    <Image source={{ uri: avatarUrl }} style={styles.nurseAvatarDesktop} />
                    <View style={{ flex: 1 }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                        <Text style={styles.nurseNameDesktop}>{nurse.name}</Text>
                        <Ionicons name="checkmark-circle" size={16} color="#0D9488" />
                      </View>
                      <Text style={styles.nurseDegreeDesktop}>{nurse.qualification}</Text>
                      <View style={styles.nurseRatingBox}>
                        <Ionicons name="star" size={13} color="#F59E0B" />
                        <Text style={styles.nurseRatingScoreText}>{nurse.rating} ★</Text>
                        <Text style={styles.nurseReviewCount}>(94+ bookings)</Text>
                      </View>
                    </View>
                  </View>

                  <View style={styles.nurseCardDivider} />

                  <View style={styles.nurseMetaRow}>
                    <Ionicons name="briefcase-outline" size={14} color="#64748B" />
                    <Text style={styles.nurseMetaLabel}>Experience:</Text>
                    <Text style={styles.nurseMetaValue}>{nurse.experience}</Text>
                  </View>

                  <View style={styles.nurseMetaRow}>
                    <Ionicons name="medkit-outline" size={14} color="#0D9488" />
                    <Text style={styles.nurseMetaLabel}>Specialties:</Text>
                    <Text style={styles.nurseMetaValue} numberOfLines={1}>{nurse.specialties}</Text>
                  </View>

                  <View style={styles.nurseMetaRow}>
                    <Ionicons name="chatbubbles-outline" size={14} color="#64748B" />
                    <Text style={styles.nurseMetaLabel}>Languages:</Text>
                    <Text style={styles.nurseMetaValue}>{nurse.languages}</Text>
                  </View>

                  <TouchableOpacity
                    style={styles.nurseBookBtn}
                    onPress={() => setIsBookingModalOpen(true)}
                    activeOpacity={0.85}
                  >
                    <Text style={styles.nurseBookBtnText}>Request This Nurse</Text>
                    <Ionicons name="arrow-forward" size={14} color="#FFFFFF" />
                  </TouchableOpacity>
                </View>
              );
            })}
          </View>
        </View>

        {/* ============================================================
            6. CLINICAL SAFETY GUARANTEE PILLARS
        ============================================================ */}
        <View style={styles.sectionWrap}>
          <Text style={styles.sectionHeadingCentered}>Why Mysore Families Trust Unnathi Home Nursing</Text>
          <Text style={styles.sectionSubCentered}>Highest clinical standards delivered safely to your home</Text>

          <View style={styles.pillarsGridDesktop}>
            {CLINICAL_PILLARS.map((pillar) => (
              <View key={pillar.id} style={styles.pillarCardDesktop}>
                <View style={[styles.pillarIconBoxLarge, { backgroundColor: pillar.bg }]}>
                  <Ionicons name={pillar.icon} size={24} color={pillar.color} />
                </View>
                <Text style={styles.pillarTitleLarge}>{pillar.title}</Text>
                <Text style={styles.pillarDescLarge}>{pillar.desc}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* ============================================================
            7. PATIENT & FAMILY TESTIMONIALS
        ============================================================ */}
        <View style={[styles.sectionWrap, { backgroundColor: '#F8FAFC' }]}>
          <Text style={styles.sectionHeadingCentered}>Patient Experiences in Mysuru</Text>
          <Text style={styles.sectionSubCentered}>Hear from families who trusted our certified home nurses</Text>

          <View style={styles.testimonialsGridDesktop}>
            {TESTIMONIALS.map((t) => (
              <View key={t.id} style={styles.testimonialCardDesktop}>
                <View style={styles.testimonialRatingRow}>
                  {[1, 2, 3, 4, 5].map((s) => (
                    <Ionicons key={s} name="star" size={14} color="#F59E0B" />
                  ))}
                  <Text style={styles.testimonialDateText}>{t.date}</Text>
                </View>

                <Text style={styles.testimonialCommentText}>"{t.comment}"</Text>

                <View style={styles.testimonialDivider} />

                <View style={styles.testimonialAuthorRow}>
                  <View style={styles.testimonialAvatar}>
                    <Text style={styles.testimonialAvatarText}>{t.name[0]}</Text>
                  </View>
                  <View>
                    <Text style={styles.testimonialAuthorName}>{t.name}</Text>
                    <Text style={styles.testimonialAuthorArea}>{t.area}</Text>
                    <Text style={styles.testimonialServiceText}>{t.service}</Text>
                  </View>
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* ============================================================
            8. FREQUENTLY ASKED QUESTIONS (FAQ)
        ============================================================ */}
        <View style={styles.sectionWrap}>
          <Text style={styles.sectionHeadingCentered}>Frequently Asked Questions</Text>
          <Text style={styles.sectionSubCentered}>Clear answers to assist your home healthcare decisions</Text>

          <View style={styles.faqListWrap}>
            {FAQS.map((faq, idx) => {
              const isOpen = !!faqExpanded[idx];
              return (
                <View key={idx} style={styles.faqCardDesktop}>
                  <TouchableOpacity
                    style={styles.faqHeaderBtn}
                    onPress={() => toggleFaq(idx)}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.faqQuestionText}>{faq.q}</Text>
                    <Ionicons
                      name={isOpen ? 'chevron-up' : 'chevron-down'}
                      size={18}
                      color="#64748B"
                    />
                  </TouchableOpacity>
                  {isOpen && (
                    <View style={styles.faqBodyBox}>
                      <Text style={styles.faqAnswerText}>{faq.a}</Text>
                    </View>
                  )}
                </View>
              );
            })}
          </View>
        </View>

        {/* ============================================================
            9. FOOTER
        ============================================================ */}
        <WebFooter navigation={navigation} />
      </ScrollView>

      {/* ============================================================
          STICKY BOTTOM BAR FOR FAST DESKTOP ACTION
      ============================================================ */}
      <View style={styles.webStickyBottomBar}>
        <View style={styles.webStickyBottomInner}>
          <View>
            <Text style={styles.stickyBarLabel}>
              Selected: <Text style={{ fontWeight: '800', color: '#0F172A' }}>{selectedShift.label}</Text> ({daysCount} {daysCount === 1 ? 'Day' : 'Days'})
            </Text>
            <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 6 }}>
              <Text style={styles.stickyBarPrice}>{priceCalculation.totalFormatted}</Text>
              {priceCalculation.discountPercent > 0 && (
                <Text style={styles.stickyBarDealBadge}>
                  🎉 {priceCalculation.discountPercent}% Package Deal Applied
                </Text>
              )}
            </View>
          </View>

          <View style={{ flexDirection: 'row', gap: 12, alignItems: 'center' }}>
            <TouchableOpacity
              style={styles.stickyCallBtn}
              onPress={() => Linking.openURL('tel:+918212568888')}
              activeOpacity={0.85}
            >
              <Ionicons name="call" size={16} color="#0D9488" />
              <Text style={styles.stickyCallBtnText}>Talk to Supervisor</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.stickyBookBtn}
              onPress={() => setIsBookingModalOpen(true)}
              activeOpacity={0.88}
            >
              <Text style={styles.stickyBookBtnText}>Proceed to Book</Text>
              <Ionicons name="arrow-forward" size={16} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* ============================================================
          INTERACTIVE BOOKING MODAL (DESKTOP)
      ============================================================ */}
      <Modal
        visible={isBookingModalOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setIsBookingModalOpen(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCardDesktop}>
            {/* Modal Header */}
            <View style={styles.modalHeaderRow}>
              <View>
                <Text style={styles.modalTitleText}>Book Certified Home Nursing</Text>
                <Text style={styles.modalSubText}>INC/KNC registered staff dispatched across Mysuru</Text>
              </View>
              <TouchableOpacity
                style={styles.modalCloseBtn}
                onPress={() => setIsBookingModalOpen(false)}
                activeOpacity={0.8}
              >
                <Ionicons name="close" size={20} color="#64748B" />
              </TouchableOpacity>
            </View>

            {/* Step Pills in Modal */}
            <View style={styles.modalStepPillsRow}>
              {[
                { num: 1, label: '1. Service & Shift' },
                { num: 2, label: '2. Dates & Mysore Address' },
                { num: 3, label: '3. Review & Confirm' },
              ].map((s) => (
                <TouchableOpacity
                  key={s.num}
                  style={[styles.modalStepPill, bookingStep === s.num && styles.modalStepPillActive]}
                  onPress={() => setBookingStep(s.num)}
                >
                  <Text style={[styles.modalStepPillText, bookingStep === s.num && styles.modalStepPillTextActive]}>
                    {s.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Modal Step Content */}
            <ScrollView style={{ maxHeight: 520 }} showsVerticalScrollIndicator={false}>
              {bookingStep === 1 && (
                <View style={{ gap: 14 }}>
                  <Text style={styles.fieldSectionHeading}>Selected Nurse Shift:</Text>
                  <View style={{ gap: 8 }}>
                    {STAFF_SHIFTS.map((s) => (
                      <TouchableOpacity
                        key={s.id}
                        style={[styles.modalShiftOption, selectedShiftId === s.id && styles.modalShiftOptionActive]}
                        onPress={() => setSelectedShiftId(s.id)}
                      >
                        <View style={{ flex: 1 }}>
                          <Text style={styles.modalShiftOptionTitle}>{s.label}</Text>
                          <Text style={styles.modalShiftOptionTiming}>{s.timing}</Text>
                        </View>
                        <Text style={styles.modalShiftOptionPrice}>₹{s.dailyRate}/day</Text>
                      </TouchableOpacity>
                    ))}
                  </View>

                  <Text style={[styles.fieldSectionHeading, { marginTop: 10 }]}>Duration ({daysCount} Days):</Text>
                  <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap' }}>
                    {STAFF_PACKAGES.map((pkg) => (
                      <TouchableOpacity
                        key={pkg.days}
                        style={[styles.modalPkgBtn, daysCount === pkg.days && styles.modalPkgBtnActive]}
                        onPress={() => setDaysCountSafe(pkg.days)}
                      >
                        <Text style={[styles.modalPkgBtnText, daysCount === pkg.days && styles.modalPkgBtnTextActive]}>
                          {pkg.days} {pkg.days === 1 ? 'Day' : 'Days'} {pkg.tag ? `(${pkg.tag})` : ''}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              )}

              {bookingStep === 2 && (
                <View style={{ gap: 12 }}>
                  <Text style={styles.fieldSectionHeading}>Who is this booking for? (Family Members):</Text>
                  <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap' }}>
                    {familyList.map((m) => {
                      const isSel = selectedFamilyId === m.id;
                      return (
                        <TouchableOpacity
                          key={m.id}
                          style={[styles.familyMemberChip, isSel && styles.familyMemberChipActive]}
                          onPress={() => {
                            setSelectedFamilyId(m.id);
                            setPatientName(m.name);
                            setPatientRelation(m.relation);
                            if (m.phone) setPatientPhone(m.phone);
                          }}
                        >
                          <Ionicons name="person" size={13} color={isSel ? '#FFFFFF' : '#0D9488'} />
                          <Text style={[styles.familyMemberChipText, isSel && styles.familyMemberChipTextActive]}>
                            {m.displayName || (m.relation === 'Self' ? `${m.name} (Self)` : `${m.name} (${m.relation})`)}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}

                    <TouchableOpacity
                      style={styles.addFamilyMiniBtn}
                      onPress={() => {
                        setIsBookingModalOpen(false);
                        navigation?.navigate('FamilyProfiles');
                      }}
                    >
                      <Ionicons name="add-circle-outline" size={13} color="#0D9488" />
                      <Text style={styles.addFamilyMiniBtnText}>+ Add Member</Text>
                    </TouchableOpacity>
                  </View>

                  <Text style={styles.inputLabel}>Patient Full Name:</Text>
                  <TextInput
                    style={styles.modalInput}
                    value={patientName}
                    onChangeText={setPatientName}
                    placeholder="Patient Full Name"
                  />

                  <Text style={styles.inputLabel}>Contact Mobile (10 Digits):</Text>
                  <TextInput
                    style={styles.modalInput}
                    value={patientPhone}
                    onChangeText={setPatientPhone}
                    keyboardType="phone-pad"
                    maxLength={10}
                    placeholder="Phone number"
                  />

                  <Text style={styles.inputLabel}>Daily Staff Arrival Time:</Text>
                  <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap' }}>
                    {['08:00 AM (Morning)', '09:30 AM (Standard)', '08:00 PM (Night)', '02:00 PM (Afternoon)'].map((t) => (
                      <TouchableOpacity
                        key={t}
                        style={[styles.timeChip, selectedTimeStr === t.split(' ')[0] && styles.timeChipActive]}
                        onPress={() => setSelectedTimeStr(t.split(' ')[0])}
                      >
                        <Text style={[styles.timeChipText, selectedTimeStr === t.split(' ')[0] && styles.timeChipTextActive]}>
                          {t}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>

                  <Text style={styles.inputLabel}>Mysore Residential Address:</Text>
                  <TextInput
                    style={[styles.modalInput, { height: 60 }]}
                    multiline
                    value={patientAddress}
                    onChangeText={setPatientAddress}
                    placeholder="Flat/House number, landmark, Mysore"
                  />

                  {/* Quick Locality Chips */}
                  <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
                    {MYSORE_AREAS.slice(0, 5).map((area) => (
                      <TouchableOpacity
                        key={area}
                        style={styles.localityMiniChip}
                        onPress={() => {
                          if (!patientAddress.includes(area)) {
                            setPatientAddress(patientAddress ? `${patientAddress}, ${area}` : `${area}, Mysuru`);
                          }
                        }}
                      >
                        <Text style={styles.localityMiniChipText}>+ {area}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              )}

              {bookingStep === 3 && (
                <View style={{ gap: 14 }}>
                  <View style={styles.invoiceSummaryCard}>
                    <Text style={styles.invoiceHeaderTitle}>Booking & Invoice Breakdown</Text>
                    <View style={styles.invoiceRowItem}>
                      <Text style={styles.invoiceLabel}>Service Shift:</Text>
                      <Text style={styles.invoiceValue}>{selectedShift.label}</Text>
                    </View>
                    <View style={styles.invoiceRowItem}>
                      <Text style={styles.invoiceLabel}>Duration:</Text>
                      <Text style={styles.invoiceValue}>
                        {daysCount} Days ({formatShortDate(startDate)} to {formatShortDate(endDate)})
                      </Text>
                    </View>
                    <View style={styles.invoiceRowItem}>
                      <Text style={styles.invoiceLabel}>Daily Arrival:</Text>
                      <Text style={styles.invoiceValue}>{selectedTimeStr}</Text>
                    </View>
                    <View style={styles.invoiceRowItem}>
                      <Text style={styles.invoiceLabel}>Patient:</Text>
                      <Text style={styles.invoiceValue}>{patientName} ({patientRelation})</Text>
                    </View>
                    <View style={styles.invoiceRowItem}>
                      <Text style={styles.invoiceLabel}>Address:</Text>
                      <Text style={styles.invoiceValue}>{patientAddress}</Text>
                    </View>

                    <View style={styles.invoiceDivider} />

                    <View style={styles.invoiceRowItem}>
                      <Text style={styles.invoiceLabel}>Gross Charge:</Text>
                      <Text style={styles.invoiceValue}>{priceCalculation.grossFormatted}</Text>
                    </View>

                    {priceCalculation.discountAmt > 0 && (
                      <View style={styles.invoiceRowItem}>
                        <Text style={[styles.invoiceLabel, { color: '#059669', fontWeight: '800' }]}>
                          {priceCalculation.dealName}:
                        </Text>
                        <Text style={[styles.invoiceValue, { color: '#059669', fontWeight: '800' }]}>
                          -{priceCalculation.discountFormatted}
                        </Text>
                      </View>
                    )}

                    <View style={styles.invoiceRowItem}>
                      <Text style={styles.invoiceLabel}>Sterile PPE Kit & Travel:</Text>
                      <Text style={[styles.invoiceValue, { color: '#059669', fontWeight: '800' }]}>FREE</Text>
                    </View>

                    <View style={styles.invoiceRowItem}>
                      <Text style={styles.invoiceLabel}>GST (18%):</Text>
                      <Text style={styles.invoiceValue}>{priceCalculation.gstFormatted}</Text>
                    </View>

                    <View style={styles.invoiceDivider} />

                    <View style={styles.invoiceTotalRow}>
                      <Text style={styles.invoiceTotalLabel}>Net Amount Payable</Text>
                      <Text style={styles.invoiceTotalValue}>{priceCalculation.totalFormatted}</Text>
                    </View>
                  </View>

                  {/* Payment Method Selector */}
                  <Text style={styles.fieldSectionHeading}>Select Payment Method:</Text>
                  <View style={{ gap: 8 }}>
                    {[
                      {
                        id: 'WALLET',
                        title: 'MediUnify Health Wallet',
                        sub: `Balance: ₹${walletBalance.toLocaleString('en-IN')} (Instant deduction)`,
                        icon: 'wallet',
                      },
                      {
                        id: 'PayOnArrival',
                        title: 'Pay on Nurse Arrival',
                        sub: 'Pay Cash or UPI to the nurse upon arrival at your Mysore home',
                        icon: 'cash',
                      },
                      {
                        id: 'UPI',
                        title: 'Instant Online UPI',
                        sub: 'Google Pay, PhonePe, Paytm or Netbanking',
                        icon: 'phone-portrait',
                      },
                    ].map((p) => {
                      const isSel = paymentMethod === p.id;
                      return (
                        <TouchableOpacity
                          key={p.id}
                          style={[styles.payMethodOption, isSel && styles.payMethodOptionActive]}
                          onPress={() => setPaymentMethod(p.id)}
                        >
                          <Ionicons name={p.icon} size={18} color={isSel ? '#0D9488' : '#64748B'} />
                          <View style={{ flex: 1, marginLeft: 10 }}>
                            <Text style={styles.payMethodOptionTitle}>{p.title}</Text>
                            <Text style={styles.payMethodOptionSub}>{p.sub}</Text>
                          </View>
                          <View style={[styles.modalRadioCircle, isSel && styles.modalRadioCircleActive]}>
                            {isSel && <View style={styles.modalRadioDot} />}
                          </View>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>
              )}
            </ScrollView>

            {/* Modal Bottom Footer Action */}
            <View style={styles.modalFooterRow}>
              {bookingStep > 1 && (
                <TouchableOpacity
                  style={styles.modalBackBtn}
                  onPress={() => setBookingStep(bookingStep - 1)}
                  activeOpacity={0.8}
                >
                  <Ionicons name="arrow-back" size={16} color="#0F172A" />
                  <Text style={styles.modalBackBtnText}>Back</Text>
                </TouchableOpacity>
              )}

              <View style={{ flex: 1 }} />

              {bookingStep < 3 ? (
                <TouchableOpacity
                  style={styles.modalNextBtn}
                  onPress={() => setBookingStep(bookingStep + 1)}
                  activeOpacity={0.88}
                >
                  <Text style={styles.modalNextBtnText}>
                    {bookingStep === 1 ? 'Next: Dates & Address' : 'Next: Review & Pay'}
                  </Text>
                  <Ionicons name="arrow-forward" size={16} color="#FFFFFF" />
                </TouchableOpacity>
              ) : (
                <TouchableOpacity
                  style={[styles.modalNextBtn, isProcessing && { opacity: 0.7 }]}
                  onPress={handleConfirmAndPay}
                  disabled={isProcessing}
                  activeOpacity={0.88}
                >
                  {isProcessing ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <>
                      <Text style={styles.modalNextBtnText}>
                        {paymentMethod === 'PayOnArrival' ? 'Confirm Booking' : 'Pay & Assign Nurse'}
                      </Text>
                      <Ionicons name="checkmark-circle" size={16} color="#FFFFFF" />
                    </>
                  )}
                </TouchableOpacity>
              )}
            </View>
          </View>
        </View>
      </Modal>

      {/* ============================================================
          SUCCESS MODAL
      ============================================================ */}
      <Modal
        visible={successModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setSuccessModalVisible(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={[styles.modalCardDesktop, { maxWidth: 480, alignItems: 'center', padding: 24 }]}>
            <View style={styles.successIconCircle}>
              <Ionicons name="checkmark-circle" size={48} color="#059669" />
            </View>
            <Text style={styles.successTitleText}>Home Nurse Assigned!</Text>
            <Text style={styles.successSubText}>
              Booking ID: <Text style={{ fontWeight: '800', color: '#0F172A' }}>{confirmedBooking?.id}</Text>
            </Text>

            {confirmedBooking && (
              <View style={styles.successSummaryBox}>
                <Text style={styles.successSummaryLine}>
                  <Text style={{ fontWeight: '800' }}>Staff:</Text> {confirmedBooking.assignedNurse.name} ({confirmedBooking.shift})
                </Text>
                <Text style={styles.successSummaryLine}>
                  <Text style={{ fontWeight: '800' }}>Dates:</Text> {confirmedBooking.startDate} to {confirmedBooking.endDate} ({confirmedBooking.daysCount} Days)
                </Text>
                <Text style={styles.successSummaryLine}>
                  <Text style={{ fontWeight: '800' }}>Reporting Time:</Text> {confirmedBooking.reportingTime}
                </Text>
                <Text style={styles.successSummaryLine}>
                  <Text style={{ fontWeight: '800' }}>Patient:</Text> {confirmedBooking.patient.name} ({confirmedBooking.patient.address})
                </Text>
                <Text style={[styles.successSummaryLine, { color: '#059669', fontWeight: '800' }]}>
                  Amount: {confirmedBooking.payment.total} ({confirmedBooking.payment.status})
                </Text>
              </View>
            )}

            <TouchableOpacity
              style={styles.successDoneBtn}
              onPress={() => {
                setSuccessModalVisible(false);
                navigation?.navigate('Bookings', {
                  newAppointment: confirmedBooking,
                  initialTab: 'Home Care',
                  timestamp: Date.now(),
                });
              }}
              activeOpacity={0.88}
            >
              <Text style={styles.successDoneBtnText}>Go to My Bookings</Text>
              <Ionicons name="arrow-forward" size={16} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

// ==================================================
// STYLES (MATCHING DESKTOP LAB & PHARMACY STANDARD)
// ==================================================

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  scrollContent: {
    paddingBottom: 110,
  },

  // 1. HERO SECTION
  heroSectionWrap: {
    backgroundColor: '#F0FDFA',
    borderBottomWidth: 1,
    borderBottomColor: '#CCFBF1',
    paddingVertical: 24,
    paddingHorizontal: 24,
  },
  heroInner: {
    maxWidth: 1320,
    width: '100%',
    alignSelf: 'center',
  },
  breadcrumbRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 20,
    flexWrap: 'wrap',
  },
  breadcrumbLink: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1E3A8A',
  },
  breadcrumbActive: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
  },
  liveDutyBadgeTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  livePulseDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: '#10B981',
  },
  liveDutyBadgeText: {
    fontSize: 10,
    fontWeight: '900',
    color: '#047857',
    letterSpacing: 0.5,
  },

  heroSplitRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 36,
  },
  heroLeftCol: {
    flex: 1,
  },
  heroAccreditedPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#CCFBF1',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    alignSelf: 'flex-start',
    marginBottom: 12,
  },
  heroAccreditedPillText: {
    fontSize: 10.5,
    fontWeight: '800',
    color: '#0F766E',
    letterSpacing: 0.5,
  },
  heroHeading: {
    fontSize: 34,
    fontWeight: '900',
    color: '#0F172A',
    lineHeight: 42,
    marginBottom: 10,
  },
  heroHeadingTeal: {
    color: '#0D9488',
  },
  heroSubtitle: {
    fontSize: 14.5,
    color: '#475569',
    lineHeight: 22,
    marginBottom: 20,
  },

  heroPillarsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 24,
  },
  heroPillarCard: {
    width: '48%',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#FFFFFF',
    padding: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  heroPillarIconBox: {
    width: 34,
    height: 34,
    borderRadius: 17,
    justifyContent: 'center',
    alignItems: 'center',
  },
  heroPillarTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: '#0F172A',
  },
  heroPillarSub: {
    fontSize: 10,
    color: '#64748B',
  },

  heroActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    flexWrap: 'wrap',
  },
  heroPrimaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#0D9488',
    paddingHorizontal: 22,
    paddingVertical: 14,
    borderRadius: 12,
    shadowColor: '#0D9488',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
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
    gap: 10,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#99F6E4',
  },
  heroSecondaryBtnTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: '#0F766E',
  },
  heroSecondaryBtnSub: {
    fontSize: 10.5,
    color: '#64748B',
  },

  heroRightCol: {
    flex: 0.9,
    justifyContent: 'center',
    alignItems: 'center',
  },
  heroImgWrap: {
    position: 'relative',
    width: '100%',
    maxWidth: 520,
    height: 380,
    borderRadius: 24,
    overflow: 'hidden',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 4,
  },
  heroNurseImg: {
    width: '100%',
    height: '100%',
  },
  floatingTrustCard: {
    position: 'absolute',
    bottom: 16,
    left: 16,
    right: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 16,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  floatingTrustIconCircle: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#ECFDF5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  floatingTrustTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#065F46',
    marginBottom: 2,
  },
  floatingTrustSub: {
    fontSize: 11,
    color: '#047857',
    lineHeight: 15,
  },
  floatingRatingBadge: {
    position: 'absolute',
    top: 16,
    right: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  floatingRatingScore: {
    fontSize: 12,
    fontWeight: '900',
    color: '#B45309',
  },
  floatingRatingCount: {
    fontSize: 9.5,
    color: '#64748B',
  },

  // COMMON SECTION WRAPPER
  sectionWrap: {
    maxWidth: 1320,
    width: '100%',
    alignSelf: 'center',
    paddingHorizontal: 24,
    paddingVertical: 32,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    marginBottom: 20,
  },
  sectionIconBox: {
    width: 38,
    height: 38,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sectionHeading: {
    fontSize: 20,
    fontWeight: '900',
    color: '#0F172A',
  },
  sectionSub: {
    fontSize: 13,
    color: '#64748B',
    marginTop: 2,
  },
  sectionHeadingCentered: {
    fontSize: 24,
    fontWeight: '900',
    color: '#0F172A',
    textAlign: 'center',
    marginBottom: 4,
  },
  sectionSubCentered: {
    fontSize: 13.5,
    color: '#64748B',
    textAlign: 'center',
    marginBottom: 28,
  },

  // 2. PURPOSE CHIPS GRID
  purposesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  purposeCard: {
    flex: 1,
    minWidth: 180,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
  },
  purposeCardActive: {
    borderColor: '#0D9488',
    backgroundColor: '#F0FDFA',
  },
  purposeIconWrap: {
    width: 34,
    height: 34,
    borderRadius: 17,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  purposeCardTitle: {
    fontSize: 13.5,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 4,
  },
  purposeCardTitleActive: {
    color: '#0F766E',
  },
  purposeCardDesc: {
    fontSize: 11,
    color: '#64748B',
    lineHeight: 15,
  },

  // 3. SHIFTS GRID (DESKTOP)
  shiftsGridDesktop: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  shiftCardDesktop: {
    flex: 1,
    minWidth: 260,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 18,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 1,
  },
  shiftCardDesktopActive: {
    borderColor: '#0D9488',
    backgroundColor: '#FAFCFD',
    shadowColor: '#0D9488',
    shadowOpacity: 0.12,
  },
  shiftCardTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  shiftBadgePill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  shiftBadgePillText: {
    fontSize: 9.5,
    fontWeight: '800',
    letterSpacing: 0.4,
  },
  shiftCardTitle: {
    fontSize: 16,
    fontWeight: '900',
    color: '#0F172A',
    marginBottom: 4,
  },
  shiftTimingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginBottom: 10,
  },
  shiftTimingText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
  },
  shiftCardDesc: {
    fontSize: 12,
    color: '#475569',
    lineHeight: 17,
    marginBottom: 14,
    minHeight: 34,
  },
  shiftFeatureList: {
    gap: 6,
    marginBottom: 16,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    paddingTop: 12,
  },
  shiftFeatureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  shiftFeatureText: {
    fontSize: 11.5,
    color: '#334155',
  },
  shiftCardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    paddingTop: 12,
    marginTop: 'auto',
  },
  shiftPriceText: {
    fontSize: 18,
    fontWeight: '900',
    color: '#0F172A',
  },
  shiftPriceSub: {
    fontSize: 10.5,
    color: '#64748B',
  },
  shiftSelectBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#F0FDFA',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#99F6E4',
  },
  shiftSelectBtnActive: {
    backgroundColor: '#0D9488',
    borderColor: '#0D9488',
  },
  shiftSelectBtnText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#0F766E',
  },
  shiftSelectBtnTextActive: {
    color: '#FFFFFF',
  },

  // 4. PACKAGES GRID
  hotDealTagPill: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  hotDealTagPillText: {
    fontSize: 10,
    fontWeight: '900',
    color: '#B45309',
  },
  dealHighlightAlert: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#FFF1F2',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FECDD3',
    marginBottom: 20,
  },
  dealHighlightAlertText: {
    fontSize: 13,
    color: '#9F1239',
    flex: 1,
    lineHeight: 18,
  },
  packagesGridDesktop: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 14,
    marginBottom: 20,
  },
  pkgCardDesktop: {
    flex: 1,
    minWidth: 180,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
  },
  pkgCardDesktopActive: {
    borderColor: '#0D9488',
    backgroundColor: '#F0FDFA',
  },
  pkgCardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  pkgCardTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
  },
  pkgCardTitleActive: {
    color: '#0F766E',
  },
  pkgBadgeTag: {
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  pkgBadgeTagText: {
    fontSize: 9.5,
    fontWeight: '800',
    color: '#15803D',
  },
  pkgCardSubtitle: {
    fontSize: 11,
    color: '#64748B',
    marginBottom: 10,
    minHeight: 28,
  },
  pkgCardPriceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 6,
    marginBottom: 4,
  },
  pkgCardNetPrice: {
    fontSize: 18,
    fontWeight: '900',
    color: '#0F172A',
  },
  pkgCardNetPriceActive: {
    color: '#0F766E',
  },
  pkgCardGrossPrice: {
    fontSize: 12,
    color: '#94A3B8',
    textDecorationLine: 'line-through',
  },
  pkgCardSavingsText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#15803D',
  },
  pkgCardSavingsTextMuted: {
    fontSize: 11,
    color: '#94A3B8',
  },

  customDaysStepperBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  stepperBoxTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0F172A',
  },
  stepperBoxSub: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  stepperControlsWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
    overflow: 'hidden',
  },
  stepperBtn: {
    width: 38,
    height: 38,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
  },
  stepperDisplay: {
    paddingHorizontal: 16,
    minWidth: 80,
    alignItems: 'center',
  },
  stepperDisplayText: {
    fontSize: 14,
    fontWeight: '900',
    color: '#0F172A',
  },

  // 5. NURSE DIRECTORY
  nurseDirectoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 18,
  },
  nurseProfileCardDesktop: {
    flex: 1,
    minWidth: 280,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 18,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 1,
  },
  nurseCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  nurseAvatarDesktop: {
    width: 56,
    height: 56,
    borderRadius: 28,
    borderWidth: 2,
    borderColor: '#0D9488',
  },
  nurseNameDesktop: {
    fontSize: 15,
    fontWeight: '900',
    color: '#0F172A',
  },
  nurseDegreeDesktop: {
    fontSize: 11.5,
    color: '#64748B',
    marginTop: 1,
  },
  nurseRatingBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 3,
  },
  nurseRatingScoreText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#B45309',
  },
  nurseReviewCount: {
    fontSize: 10.5,
    color: '#94A3B8',
  },
  nurseCardDivider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginVertical: 12,
  },
  nurseMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },
  nurseMetaLabel: {
    fontSize: 11.5,
    fontWeight: '600',
    color: '#64748B',
  },
  nurseMetaValue: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#1E293B',
    flex: 1,
  },
  nurseBookBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#0D9488',
    paddingVertical: 10,
    borderRadius: 8,
    marginTop: 12,
  },
  nurseBookBtnText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#FFFFFF',
  },

  // 6. CLINICAL QUALITY PILLARS
  pillarsGridDesktop: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 18,
  },
  pillarCardDesktop: {
    flex: 1,
    minWidth: 240,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  pillarIconBoxLarge: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  pillarTitleLarge: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 6,
  },
  pillarDescLarge: {
    fontSize: 12.5,
    color: '#64748B',
    lineHeight: 18,
  },

  // 7. TESTIMONIALS
  testimonialsGridDesktop: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 18,
  },
  testimonialCardDesktop: {
    flex: 1,
    minWidth: 280,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  testimonialRatingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 10,
  },
  testimonialDateText: {
    fontSize: 11,
    color: '#94A3B8',
    marginLeft: 'auto',
  },
  testimonialCommentText: {
    fontSize: 13,
    color: '#334155',
    lineHeight: 20,
    fontStyle: 'italic',
    marginBottom: 14,
  },
  testimonialDivider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginBottom: 12,
  },
  testimonialAuthorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  testimonialAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#CCFBF1',
    justifyContent: 'center',
    alignItems: 'center',
  },
  testimonialAvatarText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0F766E',
  },
  testimonialAuthorName: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0F172A',
  },
  testimonialAuthorArea: {
    fontSize: 11,
    color: '#64748B',
  },
  testimonialServiceText: {
    fontSize: 10.5,
    color: '#0D9488',
    fontWeight: '600',
  },

  // 8. FAQS
  faqListWrap: {
    gap: 12,
    maxWidth: 900,
    width: '100%',
    alignSelf: 'center',
  },
  faqCardDesktop: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    overflow: 'hidden',
  },
  faqHeaderBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
  },
  faqQuestionText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0F172A',
    flex: 1,
    paddingRight: 10,
  },
  faqBodyBox: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    borderTopWidth: 1,
    borderTopColor: '#F8FAFC',
  },
  faqAnswerText: {
    fontSize: 12.5,
    color: '#475569',
    lineHeight: 19,
    paddingTop: 8,
  },

  // STICKY BOTTOM BAR (DESKTOP)
  webStickyBottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    paddingVertical: 12,
    paddingHorizontal: 24,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 4,
  },
  webStickyBottomInner: {
    maxWidth: 1320,
    width: '100%',
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  stickyBarLabel: {
    fontSize: 12,
    color: '#64748B',
  },
  stickyBarPrice: {
    fontSize: 20,
    fontWeight: '900',
    color: '#0F172A',
  },
  stickyBarDealBadge: {
    fontSize: 11,
    fontWeight: '800',
    color: '#15803D',
  },
  stickyCallBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: '#99F6E4',
    backgroundColor: '#F0FDFA',
  },
  stickyCallBtnText: {
    fontSize: 12.5,
    fontWeight: '800',
    color: '#0F766E',
  },
  stickyBookBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#0D9488',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  stickyBookBtnText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#FFFFFF',
  },

  // MODAL STYLES (DESKTOP)
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalCardDesktop: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    maxWidth: 680,
    width: '100%',
    padding: 24,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 5,
  },
  modalHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  modalTitleText: {
    fontSize: 18,
    fontWeight: '900',
    color: '#0F172A',
  },
  modalSubText: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  modalCloseBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalStepPillsRow: {
    flexDirection: 'row',
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    padding: 4,
    marginBottom: 16,
    gap: 6,
  },
  modalStepPill: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: 'center',
  },
  modalStepPillActive: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  modalStepPillText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748B',
  },
  modalStepPillTextActive: {
    color: '#0D9488',
    fontWeight: '800',
  },

  fieldSectionHeading: {
    fontSize: 13.5,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 6,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#334155',
  },
  modalInput: {
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 13,
    color: '#0F172A',
  },
  modalShiftOption: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    padding: 12,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
  },
  modalShiftOptionActive: {
    borderColor: '#0D9488',
    backgroundColor: '#F0FDFA',
  },
  modalShiftOptionTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0F172A',
  },
  modalShiftOptionTiming: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
  },
  modalShiftOptionPrice: {
    fontSize: 14,
    fontWeight: '900',
    color: '#0F766E',
  },
  modalPkgBtn: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    backgroundColor: '#FFFFFF',
  },
  modalPkgBtnActive: {
    borderColor: '#0D9488',
    backgroundColor: '#F0FDFA',
  },
  modalPkgBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#475569',
  },
  modalPkgBtnTextActive: {
    color: '#0F766E',
    fontWeight: '800',
  },
  familyMemberChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#99F6E4',
    backgroundColor: '#F0FDFA',
  },
  familyMemberChipActive: {
    backgroundColor: '#0D9488',
    borderColor: '#0D9488',
  },
  familyMemberChipText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#0F766E',
  },
  familyMemberChipTextActive: {
    color: '#FFFFFF',
  },
  addFamilyMiniBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#99F6E4',
    borderStyle: 'dashed',
    backgroundColor: '#F0FDFA',
  },
  addFamilyMiniBtnText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#0D9488',
  },
  timeChip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    backgroundColor: '#FFFFFF',
  },
  timeChipActive: {
    borderColor: '#0D9488',
    backgroundColor: '#F0FDFA',
  },
  timeChipText: {
    fontSize: 11.5,
    color: '#475569',
  },
  timeChipTextActive: {
    color: '#0F766E',
    fontWeight: '800',
  },
  localityMiniChip: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
  },
  localityMiniChipText: {
    fontSize: 10.5,
    color: '#475569',
  },

  // INVOICE SUMMARY
  invoiceSummaryCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 6,
  },
  invoiceHeaderTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 4,
  },
  invoiceRowItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  invoiceLabel: {
    fontSize: 11.5,
    color: '#64748B',
  },
  invoiceValue: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0F172A',
  },
  invoiceDivider: {
    height: 1,
    backgroundColor: '#E2E8F0',
    marginVertical: 4,
  },
  invoiceTotalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 2,
  },
  invoiceTotalLabel: {
    fontSize: 13,
    fontWeight: '900',
    color: '#0F172A',
  },
  invoiceTotalValue: {
    fontSize: 16,
    fontWeight: '900',
    color: '#0F766E',
  },

  payMethodOption: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    padding: 12,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
  },
  payMethodOptionActive: {
    borderColor: '#0D9488',
    backgroundColor: '#F0FDFA',
  },
  payMethodOptionTitle: {
    fontSize: 12.5,
    fontWeight: '800',
    color: '#0F172A',
  },
  payMethodOptionSub: {
    fontSize: 10.5,
    color: '#64748B',
    marginTop: 1,
  },
  modalRadioCircle: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 2,
    borderColor: '#CBD5E1',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalRadioCircleActive: {
    borderColor: '#0D9488',
  },
  modalRadioDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#0D9488',
  },

  modalFooterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    paddingTop: 16,
    marginTop: 16,
  },
  modalBackBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
  },
  modalBackBtnText: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#0F172A',
  },
  modalNextBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#0D9488',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 10,
  },
  modalNextBtnText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#FFFFFF',
  },

  // SUCCESS MODAL
  successIconCircle: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: '#ECFDF5',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  successTitleText: {
    fontSize: 18,
    fontWeight: '900',
    color: '#0F172A',
  },
  successSubText: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
    marginBottom: 14,
  },
  successSummaryBox: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 12,
    width: '100%',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 4,
    marginBottom: 16,
  },
  successSummaryLine: {
    fontSize: 11.5,
    color: '#334155',
  },
  successDoneBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#0D9488',
    paddingVertical: 11,
    paddingHorizontal: 24,
    borderRadius: 10,
  },
  successDoneBtnText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#FFFFFF',
  },
});

export default NurseBookingScreenWeb;
