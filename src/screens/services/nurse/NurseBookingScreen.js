import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  Alert,
  StatusBar,
  Linking,
  ActivityIndicator,
  Platform,
  Image,
  useWindowDimensions,
} from 'react-native';
import { showAlert } from '../../../utils/alert';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Location from 'expo-location';
import { requestLocationPermissionWebSafe, getCurrentPositionWebSafe, reverseGeocodeWebSafe } from '../../../utils/locationHelper';
import colors from '../../../theme/colors';
import { certifiedNurses, nursingPurposes } from '../../../data/nurseCareData';
import { pushAppointment } from '../../../services/dataSyncService';
import WebFooter from '../../../components/web/WebFooter';

// ==========================================
// DATA & DEFINITIONS
// ==========================================

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const DAYS_SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

// 1. Staff Shift Options
const STAFF_SHIFTS = [
  {
    id: 'shift-12-day',
    label: '12-Hr Day Shift',
    timing: '08:00 AM - 08:00 PM',
    dailyRate: 1499,
    icon: 'sunny',
    badge: 'POPULAR',
    desc: 'Daytime medicine, meals, mobility assistance & vitals chart',
  },
  {
    id: 'shift-12-night',
    label: '12-Hr Night Shift',
    timing: '08:00 PM - 08:00 AM',
    dailyRate: 1499,
    icon: 'moon',
    badge: 'NIGHT CARE',
    desc: 'Nighttime vital monitoring, IV/catheter care & sleep comfort',
  },
  {
    id: 'shift-24-round',
    label: '24x7 Round-The-Clock',
    timing: '24 Hours Bedside Care',
    dailyRate: 2699,
    icon: 'infinite',
    badge: 'INTENSIVE',
    desc: 'Dedicated nurse staying at home full-time for intensive care',
  },
  {
    id: 'visit-2hr',
    label: 'Short Procedure Visit (2 Hrs)',
    timing: 'Custom 2-Hour Visit',
    dailyRate: 599,
    icon: 'medkit',
    badge: 'QUICK VISIT',
    desc: 'Wound dressing, injections, catheter change or nebulization',
  },
];

// 2. Curated Packages From Our Side
const STAFF_PACKAGES = [
  {
    days: 1,
    title: '1 Day',
    subtitle: 'Standard daily rate',
    discountPercent: 0,
    tag: null,
  },
  {
    days: 2,
    title: '2 Days Deal',
    subtitle: 'Save 10% on total cost',
    discountPercent: 10,
    tag: '10% OFF',
    isHot: true,
  },
  {
    days: 3,
    title: '3 Days Recovery',
    subtitle: 'Save 15% on total cost',
    discountPercent: 15,
    tag: '15% OFF',
  },
  {
    days: 7,
    title: '7 Days (1 Week)',
    subtitle: 'Save 25% • Best Value',
    discountPercent: 25,
    tag: '25% OFF',
    isBest: true,
  },
  {
    days: 14,
    title: '14 Days Fortnight',
    subtitle: 'Save 30% on total cost',
    discountPercent: 30,
    tag: '30% OFF',
  },
  {
    days: 30,
    title: '30 Days (1 Month)',
    subtitle: 'Save 40% • Max Savings',
    discountPercent: 40,
    tag: '40% OFF',
  },
];

// 3. Clinical Purposes / Conditions
const CLINICAL_PURPOSES = [
  { id: 'all', label: 'All Nursing Needs', icon: 'shield-checkmark', color: '#0D9488', bg: '#F0FDFA' },
  { id: 'postop', label: 'Post-Surgery Recovery', icon: 'medkit', color: '#2563EB', bg: '#EFF6FF', recommendedShift: 'shift-12-day' },
  { id: 'elderly', label: 'Elderly & Bedridden Care', icon: 'heart', color: '#DB2777', bg: '#FFF1F2', recommendedShift: 'shift-24-round' },
  { id: 'wound', label: 'Wound Dressing & Injections', icon: 'bandage', color: '#D97706', bg: '#FFFBEB', recommendedShift: 'visit-2hr' },
  { id: 'night', label: 'Overnight Vital Monitoring', icon: 'moon', color: '#7C3AED', bg: '#FAF5FF', recommendedShift: 'shift-12-night' },
  { id: 'icu', label: 'ICU at Home & Tracheostomy', icon: 'pulse', color: '#E11D48', bg: '#FFE4E6', recommendedShift: 'shift-24-round' },
];

const TIME_PRESETS = [
  { label: '08:00 AM (Morning)', hour: '08', minute: '00', period: 'AM' },
  { label: '09:30 AM (Standard)', hour: '09', minute: '30', period: 'AM' },
  { label: '02:00 PM (Afternoon)', hour: '02', minute: '00', period: 'PM' },
  { label: '08:00 PM (Night)', hour: '08', minute: '00', period: 'PM' },
];

const MYSORE_AREAS = [
  'Kuvempunagar',
  'Gokulam',
  'Jayalakshmipuram',
  'Saraswathipuram',
  'Vijayanagar',
  'Hebbal',
];

// Helpers
const cleanDate = (d) => {
  const c = new Date(d);
  c.setHours(0, 0, 0, 0);
  return c;
};

const formatFullDate = (d) => {
  if (!d) return '';
  return `${DAYS_SHORT[d.getDay()]}, ${d.getDate()} ${MONTH_NAMES[d.getMonth()].slice(0, 3)} ${d.getFullYear()}`;
};

const formatShortDate = (d) => {
  if (!d) return '';
  return `${d.getDate()} ${MONTH_NAMES[d.getMonth()].slice(0, 3)}`;
};

const isSameDay = (d1, d2) => {
  if (!d1 || !d2) return false;
  return (
    d1.getFullYear() === d2.getFullYear() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getDate() === d2.getDate()
  );
};

// ==========================================
// MAIN COMPONENT
// ==========================================

const NurseBookingScreen = ({ navigation }) => {
  const { width } = useWindowDimensions();
  const isDesktopWeb = Platform.OS === 'web' && width >= 768;

  // 3-Step Wizard: 1: Service & Package | 2: Dates & Time | 3: Review & Pay
  const [currentStep, setCurrentStep] = useState(1);

  // Step 1: Selected Service & Duration
  const [selectedShiftId, setSelectedShiftId] = useState('shift-12-day');
  const [selectedPurposeId, setSelectedPurposeId] = useState('all');
  const [daysCount, setDaysCount] = useState(2); // Default to 2 days to immediately highlight the deal!

  // Step 2: Calendar Starting & End Date
  const today = useMemo(() => cleanDate(new Date()), []);
  const [calMonth, setCalMonth] = useState(() => new Date(today.getFullYear(), today.getMonth(), 1));
  const [startDate, setStartDate] = useState(today);
  const [endDate, setEndDate] = useState(() => {
    const d = new Date(today);
    d.setDate(d.getDate() + 1);
    return d;
  });

  // Calendar Picking Mode: 'start' or 'end'
  const [activeDateTarget, setActiveDateTarget] = useState('start');

  // Step 2: Manual Time Selection
  const [selectedTimeStr, setSelectedTimeStr] = useState('09:00 AM');
  const [manualHour, setManualHour] = useState('09');
  const [manualMinute, setManualMinute] = useState('00');
  const [manualPeriod, setManualPeriod] = useState('AM');
  const [showCustomTime, setShowCustomTime] = useState(false);
  const [timeNote, setTimeNote] = useState('');

  // Step 2: Patient & Address
  const [familyList, setFamilyList] = useState([]);
  const [selectedFamilyId, setSelectedFamilyId] = useState('self');
  const [patientName, setPatientName] = useState('Hemanth');
  const [patientRelation, setPatientRelation] = useState('Self');
  const [patientPhone, setPatientPhone] = useState('9876543210');
  const [patientAddress, setPatientAddress] = useState('House #142, 5th Cross, Kuvempunagar, Mysore');
  const [locationLoading, setLocationLoading] = useState(false);

  // Step 3: Payment
  const [paymentMethod, setPaymentMethod] = useState('WALLET');
  const [walletBalance, setWalletBalance] = useState(1250);
  const [isProcessing, setIsProcessing] = useState(false);

  // Success Modal
  const [successModalVisible, setSuccessModalVisible] = useState(false);
  const [confirmedBooking, setConfirmedBooking] = useState(null);

  useEffect(() => {
    loadSavedData();
  }, []);

  const loadSavedData = async () => {
    try {
      const storedPrimary = await AsyncStorage.getItem('@unnathi_primary_user');
      const storedUser = await AsyncStorage.getItem('user');
      const storedName = await AsyncStorage.getItem('userName');
      const storedPhone = await AsyncStorage.getItem('userPhone');
      let primaryName = 'Hemanth';
      let primaryPhone = '9876543210';

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
      const storedEmail = await AsyncStorage.getItem('userEmail');
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
          // Strictly exclude 'self', 'isPrimary', or relation 'Other' (only show actual family members)
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

  const selectedShift = useMemo(() => {
    return STAFF_SHIFTS.find((s) => s.id === selectedShiftId) || STAFF_SHIFTS[0];
  }, [selectedShiftId]);

  // Adjust Days Count and automatically update End Date
  const applyDaysCount = (count) => {
    const days = Math.max(1, Math.min(90, count));
    setDaysCount(days);
    const newEnd = new Date(startDate);
    newEnd.setDate(newEnd.getDate() + (days - 1));
    setEndDate(newEnd);
  };

  // Calendar Date Click: Dead simple logic
  const handleCalendarDayClick = (clickedDate) => {
    const c = cleanDate(clickedDate);
    if (c < today) return; // Ignore past dates

    if (activeDateTarget === 'start') {
      setStartDate(c);
      // Auto-set End Date based on current daysCount
      const newEnd = new Date(c);
      newEnd.setDate(newEnd.getDate() + (daysCount - 1));
      setEndDate(newEnd);
      // Switch target to end so next tap can change end date if desired
      setActiveDateTarget('end');
    } else {
      // Setting End Date
      if (c >= startDate) {
        setEndDate(c);
        const diffDays = Math.round((c.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;
        setDaysCount(diffDays);
      } else {
        // If clicked earlier than start date, make this the new start date
        setStartDate(c);
        setEndDate(c);
        setDaysCount(1);
      }
    }
  };

  // Manual Time Picker logic
  const handleTimePresetClick = (preset) => {
    setManualHour(preset.hour);
    setManualMinute(preset.minute);
    setManualPeriod(preset.period);
    setSelectedTimeStr(`${preset.hour}:${preset.minute} ${preset.period}`);
    setShowCustomTime(false);
  };

  const updateManualTimeParts = (h, m, p) => {
    const hour = h !== undefined ? h : manualHour;
    const min = m !== undefined ? m : manualMinute;
    const period = p !== undefined ? p : manualPeriod;
    if (h !== undefined) setManualHour(h);
    if (m !== undefined) setManualMinute(m);
    if (p !== undefined) setManualPeriod(p);
    setSelectedTimeStr(`${hour}:${min} ${period}`);
  };

  // GPS auto-detect
  const detectGPSLocation = async () => {
    try {
      setLocationLoading(true);
      const perm = await requestLocationPermissionWebSafe();
      if (!perm.granted && perm.status !== 'granted') {
        setLocationLoading(false);
        showAlert('Permission Denied', 'Location permission is required.');
        return;
      }
      const pos = await getCurrentPositionWebSafe({ accuracy: Location.Accuracy.Balanced });
      const addresses = await reverseGeocodeWebSafe({ latitude: pos.coords.latitude, longitude: pos.coords.longitude });
      if (addresses && addresses.length > 0) {
        const item = addresses[0];
        const formatted = item.formattedAddress || `${item.name || ''} ${item.street || ''}, ${item.district || 'Mysore'} - ${item.postalCode || '570023'}`.trim();
        setPatientAddress(formatted);
      }
    } catch (e) {
      showAlert('GPS Notice', 'Could not fetch live GPS position. Please enter your address manually.');
    } finally {
      setLocationLoading(false);
    }
  };

  // Pricing Calculation (Transparent and 100% clear)
  const priceCalculation = useMemo(() => {
    const daily = selectedShift.dailyRate;
    const days = daysCount;
    const gross = daily * days;

    let discountPercent = 0;
    let dealName = `${days} Days Care`;

    if (days === 2) {
      discountPercent = 10;
      dealName = '2-Day Special Package (10% Off)';
    } else if (days === 3) {
      discountPercent = 15;
      dealName = '3-Day Healing Package (15% Off)';
    } else if (days >= 7 && days < 14) {
      discountPercent = 25;
      dealName = '7-Day Weekly Package (25% Off)';
    } else if (days >= 14 && days < 30) {
      discountPercent = 30;
      dealName = '14-Day Package (30% Off)';
    } else if (days >= 30) {
      discountPercent = 40;
      dealName = '30-Day Monthly Package (40% Off)';
    }

    const discountAmt = Math.round((gross * discountPercent) / 100);
    const netBase = gross - discountAmt;
    const gst = Math.round(netBase * 0.18);
    const total = netBase + gst;

    return {
      daily,
      days,
      gross,
      discountPercent,
      discountAmt,
      netBase,
      gst,
      total,
      dealName,
      totalFormatted: `₹${total.toLocaleString('en-IN')}`,
      grossFormatted: `₹${gross.toLocaleString('en-IN')}`,
      discountFormatted: `₹${discountAmt.toLocaleString('en-IN')}`,
      netBaseFormatted: `₹${netBase.toLocaleString('en-IN')}`,
      gstFormatted: `₹${gst.toLocaleString('en-IN')}`,
    };
  }, [selectedShift, daysCount]);

  const goToNextStep = () => {
    if (currentStep === 1) {
      setCurrentStep(2);
    } else if (currentStep === 2) {
      if (!patientName.trim()) {
        showAlert('Name Required', 'Please enter patient name.');
        return;
      }
      if (!patientPhone.trim() || patientPhone.length < 10) {
        showAlert('Phone Required', 'Please enter a valid 10-digit phone number.');
        return;
      }
      if (!patientAddress.trim()) {
        showAlert('Address Required', 'Please enter your Mysore home address.');
        return;
      }
      setCurrentStep(3);
    }
  };

  const handleConfirmAndPay = async () => {
    if (paymentMethod === 'WALLET') {
      if (walletBalance < priceCalculation.total) {
        showAlert(
          'Insufficient Wallet Balance',
          `Your wallet balance is ₹${walletBalance}, but this booking is ${priceCalculation.totalFormatted}.\n\nPlease choose Pay on Arrival or UPI.`,
          [
            { text: 'Top Up Wallet', onPress: () => navigation.navigate('Wallet') },
            { text: 'OK', style: 'cancel' }
          ]
        );
        return;
      }

      const newBal = walletBalance - priceCalculation.total;
      await AsyncStorage.setItem('@unnathi_wallet_balance', String(newBal));
      setWalletBalance(newBal);
    }

    setIsProcessing(true);

    setTimeout(async () => {
      try {
        const bookingId = `NURSE-${Math.floor(100000 + Math.random() * 900000)}`;
        const assignedNurse = certifiedNurses[Math.floor(Math.random() * certifiedNurses.length)];

        const bookingRecord = {
          id: bookingId,
          bookingId,
          serviceName: `Home Staff: ${selectedShift.label}`,
          duration: `${daysCount} Days (${formatShortDate(startDate)} to ${formatShortDate(endDate)})`,
          schedule: {
            startDate: formatFullDate(startDate),
            endDate: formatFullDate(endDate),
            daysCount,
            time: selectedTimeStr,
          },
          patient: {
            name: patientName,
            relation: patientRelation,
            phone: patientPhone,
            address: patientAddress,
          },
          assignedNurse: {
            name: assignedNurse.name,
            qualification: assignedNurse.qualification,
            experience: assignedNurse.experience,
          },
          payment: {
            method: paymentMethod === 'WALLET' ? 'MediUnify Wallet' : paymentMethod === 'PayOnArrival' ? 'Pay on Arrival' : 'UPI',
            amount: priceCalculation.totalFormatted,
          },
          bookedAt: new Date().toLocaleString('en-IN'),
        };

        const existing = await AsyncStorage.getItem('@unnathi_nurse_bookings');
        const list = existing ? JSON.parse(existing) : [];
        list.unshift(bookingRecord);
        await AsyncStorage.setItem('@unnathi_nurse_bookings', JSON.stringify(list));

        // Also save to @unnathi_appointments for global visibility
        const existingAppts = await AsyncStorage.getItem('@unnathi_appointments');
        const apptList = existingAppts ? JSON.parse(existingAppts) : [];
        await AsyncStorage.setItem('@unnathi_appointments', JSON.stringify([bookingRecord, ...apptList]));

        // Push to central server database
        try {
          await pushAppointment(bookingRecord);
        } catch (pushErr) {
          console.warn('Could not push nurse booking:', pushErr);
        }

        setIsProcessing(false);
        setConfirmedBooking(bookingRecord);
        setSuccessModalVisible(true);
      } catch (e) {
        setIsProcessing(false);
        showAlert('Error', 'Could not complete booking.');
      }
    }, 700);
  };

  // Calendar Component
  const renderCalendar = () => {
    const year = calMonth.getFullYear();
    const month = calMonth.getMonth();

    const firstDayIndex = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    const cells = [];
    for (let i = 0; i < firstDayIndex; i++) {
      cells.push(<View key={`empty-${i}`} style={styles.calCellEmpty} />);
    }

    for (let d = 1; d <= daysInMonth; d++) {
      const cellDate = new Date(year, month, d);
      cellDate.setHours(0, 0, 0, 0);

      const isPast = cellDate < today;
      const isStart = isSameDay(cellDate, startDate);
      const isEnd = isSameDay(cellDate, endDate);
      const inRange = cellDate > startDate && cellDate < endDate;

      cells.push(
        <TouchableOpacity
          key={`day-${d}`}
          style={[
            styles.calCell,
            inRange && styles.calCellInRange,
            isStart && styles.calCellStart,
            isEnd && styles.calCellEnd,
            isPast && styles.calCellDisabled,
          ]}
          disabled={isPast}
          onPress={() => handleCalendarDayClick(cellDate)}
          activeOpacity={0.7}
        >
          <View
            style={[
              styles.calCircle,
              (isStart || isEnd) && styles.calCircleActive,
            ]}
          >
            <Text
              style={[
                styles.calDayText,
                isPast && styles.calDayTextDisabled,
                inRange && styles.calDayTextInRange,
                (isStart || isEnd) && styles.calDayTextActive,
              ]}
            >
              {d}
            </Text>
          </View>
        </TouchableOpacity>
      );
    }

    return (
      <View style={styles.calContainer}>
        {/* Month Navigation */}
        <View style={styles.calNavRow}>
          <TouchableOpacity
            style={styles.calArrowBtn}
            onPress={() => {
              const prev = new Date(year, month - 1, 1);
              if (prev.getMonth() >= today.getMonth() || prev.getFullYear() > today.getFullYear()) {
                setCalMonth(prev);
              }
            }}
            activeOpacity={0.8}
          >
            <Ionicons name="chevron-back" size={18} color={colors.secondary} />
          </TouchableOpacity>

          <Text style={styles.calMonthText}>
            {MONTH_NAMES[month]} {year}
          </Text>

          <TouchableOpacity
            style={styles.calArrowBtn}
            onPress={() => setCalMonth(new Date(year, month + 1, 1))}
            activeOpacity={0.8}
          >
            <Ionicons name="chevron-forward" size={18} color={colors.secondary} />
          </TouchableOpacity>
        </View>

        {/* Days Header */}
        <View style={styles.calDayNamesRow}>
          {DAYS_SHORT.map((d) => (
            <Text key={d} style={styles.calDayNameText}>
              {d}
            </Text>
          ))}
        </View>

        {/* Days Grid */}
        <View style={styles.calGrid}>{cells}</View>
      </View>
    );
  };

  // ==========================================
  // STEP 1: SERVICE & PACKAGES (REDESIGNED)
  // ==========================================
  const renderStep1 = () => (
    <View style={styles.stepWrap}>
      {/* 1. CLINICAL TRUST HERO BANNER */}
      <View style={styles.nurseHeroCardRedesigned}>
        <View style={styles.nurseHeroTopTagRow}>
          <View style={styles.nurseAccreditedBadge}>
            <Ionicons name="shield-checkmark" size={12} color="#0D9488" />
            <Text style={styles.nurseAccreditedBadgeText}>INC & KNC REGISTERED NURSES</Text>
          </View>
          <View style={styles.liveDutyBadge}>
            <View style={styles.liveDutyPulseDot} />
            <Text style={styles.liveDutyBadgeText}>14 ON DUTY IN MYSORE</Text>
          </View>
        </View>

        <Text style={styles.nurseHeroHeading}>
          Hospital-Grade Nursing Care in Your Home
        </Text>
        <Text style={styles.nurseHeroSubheading}>
          Licensed GNM & B.Sc nurses providing 12hr/24hr bedside care, post-surgical recovery, IV administration, and vitals monitoring in Mysore.
        </Text>

        {/* 3 Clinical Pillars */}
        <View style={styles.nursePillarsRow}>
          <View style={styles.nursePillarItem}>
            <View style={styles.nursePillarIconBox}>
              <Ionicons name="checkmark-done" size={14} color="#059669" />
            </View>
            <Text style={styles.nursePillarText}>100% Police Verified</Text>
          </View>
          <View style={styles.nursePillarItem}>
            <View style={styles.nursePillarIconBox}>
              <Ionicons name="pulse" size={14} color="#2563EB" />
            </View>
            <Text style={styles.nursePillarText}>Hospital Vitals Chart</Text>
          </View>
          <View style={styles.nursePillarItem}>
            <View style={styles.nursePillarIconBox}>
              <Ionicons name="sync" size={14} color="#7C3AED" />
            </View>
            <Text style={styles.nursePillarText}>2-Hr Free Replacement</Text>
          </View>
        </View>

        {/* Quick Call Action */}
        <TouchableOpacity
          style={styles.nurseHeroCallBanner}
          onPress={() => Linking.openURL('tel:+918212568888')}
          activeOpacity={0.88}
        >
          <View style={styles.nurseHeroCallLeft}>
            <View style={styles.nurseHeroCallIconBox}>
              <Ionicons name="headset" size={16} color="#FFFFFF" />
            </View>
            <View>
              <Text style={styles.nurseHeroCallTitle}>Need help selecting a nurse?</Text>
              <Text style={styles.nurseHeroCallSub}>Talk to our Clinical Nursing Supervisor (Free Consult)</Text>
            </View>
          </View>
          <Ionicons name="chevron-forward" size={16} color="#0D9488" />
        </TouchableOpacity>
      </View>

      {/* 2. CLINICAL NEED / PURPOSE SELECTOR */}
      <View style={styles.sectionCard}>
        <View style={styles.sectionHeaderRow}>
          <View style={[styles.sectionIconBox, { backgroundColor: '#EFF6FF' }]}>
            <Ionicons name="medkit" size={16} color="#2563EB" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.sectionTitle}>1. What is the Patient's Primary Need?</Text>
            <Text style={styles.sectionSub}>Select clinical condition to highlight recommended shift</Text>
          </View>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.purposesScroll}
        >
          {CLINICAL_PURPOSES.map((purpose) => {
            const isSelected = selectedPurposeId === purpose.id;
            return (
              <TouchableOpacity
                key={purpose.id}
                style={[
                  styles.purposeChip,
                  isSelected && styles.purposeChipActive,
                ]}
                onPress={() => {
                  setSelectedPurposeId(purpose.id);
                  if (purpose.recommendedShift) {
                    setSelectedShiftId(purpose.recommendedShift);
                  }
                }}
                activeOpacity={0.8}
              >
                <View style={[styles.purposeIconWrap, { backgroundColor: isSelected ? '#0D9488' : purpose.bg }]}>
                  <Ionicons
                    name={purpose.icon}
                    size={14}
                    color={isSelected ? '#FFFFFF' : purpose.color}
                  />
                </View>
                <Text
                  style={[
                    styles.purposeChipText,
                    isSelected && styles.purposeChipTextActive,
                  ]}
                >
                  {purpose.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* 3. CHOOSE NURSE DUTY SHIFT */}
      <View style={styles.sectionCard}>
        <View style={styles.sectionHeaderRow}>
          <View style={[styles.sectionIconBox, { backgroundColor: '#F0FDF4' }]}>
            <Ionicons name="time" size={16} color="#059669" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.sectionTitle}>2. Choose Nurse Shift & Timing</Text>
            <Text style={styles.sectionSub}>Select required duty hours for your home</Text>
          </View>
        </View>

        <View style={styles.modernShiftsGrid}>
          {STAFF_SHIFTS.map((shift) => {
            const isSelected = selectedShiftId === shift.id;
            return (
              <TouchableOpacity
                key={shift.id}
                style={[
                  styles.modernShiftCard,
                  isSelected && styles.modernShiftCardActive,
                ]}
                onPress={() => setSelectedShiftId(shift.id)}
                activeOpacity={0.88}
              >
                <View style={styles.modernShiftTop}>
                  <View style={[styles.modernShiftBadge, isSelected && styles.modernShiftBadgeActive]}>
                    <Ionicons
                      name={shift.icon}
                      size={12}
                      color={isSelected ? '#FFFFFF' : colors.primary}
                    />
                    <Text
                      style={[
                        styles.modernShiftBadgeText,
                        isSelected && styles.modernShiftBadgeTextActive,
                      ]}
                    >
                      {shift.badge}
                    </Text>
                  </View>

                  <View style={[styles.radioCircle, isSelected && styles.radioCircleActive]}>
                    {isSelected && <View style={styles.radioDotInner} />}
                  </View>
                </View>

                <Text
                  style={[
                    styles.modernShiftName,
                    isSelected && styles.modernShiftNameActive,
                  ]}
                >
                  {shift.label}
                </Text>

                <View style={styles.modernShiftTimingRow}>
                  <Ionicons name="alarm-outline" size={13} color="#64748B" />
                  <Text style={styles.modernShiftTimingText}>{shift.timing}</Text>
                </View>

                <Text style={styles.modernShiftDesc} numberOfLines={2}>
                  {shift.desc}
                </Text>

                <View style={styles.modernShiftPriceRow}>
                  <Text style={styles.modernShiftRateText}>
                    ₹{shift.dailyRate.toLocaleString('en-IN')}
                  </Text>
                  <Text style={styles.modernShiftRateSub}>/ day</Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* 4. PACKAGE DEALS & DURATION */}
      <View style={styles.sectionCard}>
        <View style={styles.sectionHeaderRow}>
          <View style={[styles.sectionIconBox, { backgroundColor: '#FFFBEB' }]}>
            <Ionicons name="gift" size={16} color="#D97706" />
          </View>
          <View style={{ flex: 1 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Text style={styles.sectionTitle}>3. Care Duration & Deals</Text>
              <View style={styles.hotPillBadge}>
                <Text style={styles.hotPillBadgeText}>SAVE UP TO 40%</Text>
              </View>
            </View>
            <Text style={styles.sectionSub}>Book 2 or more days to unlock instant package savings</Text>
          </View>
        </View>

        {/* 2-Day Deal Callout Banner */}
        <View style={styles.dealCalloutBanner}>
          <Ionicons name="sparkles" size={16} color="#E11D48" />
          <Text style={styles.dealCalloutBannerText}>
            <Text style={{ fontWeight: '900' }}>Special Deal:</Text> Book for 2 days and save 10% instantly!
          </Text>
        </View>

        {/* Package Duration Cards */}
        <View style={styles.packageCardsList}>
          {STAFF_PACKAGES.map((pkg) => {
            const isSelected = daysCount === pkg.days;
            const pkgGross = selectedShift.dailyRate * pkg.days;
            const pkgDisc = Math.round((pkgGross * pkg.discountPercent) / 100);
            const pkgNet = pkgGross - pkgDisc;

            return (
              <TouchableOpacity
                key={pkg.days}
                style={[
                  styles.packageCardItem,
                  isSelected && styles.packageCardItemActive,
                ]}
                onPress={() => applyDaysCount(pkg.days)}
                activeOpacity={0.88}
              >
                <View style={[styles.radioCircle, isSelected && styles.radioCircleActive, { marginRight: 10 }]}>
                  {isSelected && <View style={styles.radioDotInner} />}
                </View>

                <View style={{ flex: 1 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <Text
                      style={[
                        styles.packageCardTitle,
                        isSelected && styles.packageCardTitleActive,
                      ]}
                    >
                      {pkg.title}
                    </Text>
                    {pkg.tag && (
                      <View style={[styles.packageDiscountTag, pkg.isHot && { backgroundColor: '#FFE4E6' }]}>
                        <Text style={[styles.packageDiscountTagText, pkg.isHot && { color: '#E11D48' }]}>
                          {pkg.tag}
                        </Text>
                      </View>
                    )}
                  </View>
                  <Text style={styles.packageCardSubtitle}>{pkg.subtitle}</Text>
                </View>

                <View style={{ alignItems: 'flex-end' }}>
                  <Text
                    style={[
                      styles.packageCardPrice,
                      isSelected && styles.packageCardPriceActive,
                    ]}
                  >
                    ₹{pkgNet.toLocaleString('en-IN')}
                  </Text>
                  {pkg.discountPercent > 0 && (
                    <Text style={styles.packageSaveAmountBadge}>
                      Save ₹{pkgDisc.toLocaleString('en-IN')}
                    </Text>
                  )}
                </View>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Custom Days Stepper */}
        <View style={styles.stepperContainer}>
          <View>
            <Text style={styles.stepperPromptTitle}>Custom Days:</Text>
            <Text style={styles.stepperPromptSub}>Set exact duration needed</Text>
          </View>
          <View style={styles.stepperRow}>
            <TouchableOpacity
              style={styles.stepperActionBtn}
              onPress={() => applyDaysCount(daysCount - 1)}
              activeOpacity={0.8}
            >
              <Ionicons name="remove" size={16} color="#0F172A" />
            </TouchableOpacity>
            <View style={styles.stepperNumberDisplay}>
              <Text style={styles.stepperNumberText}>
                {daysCount} {daysCount === 1 ? 'Day' : 'Days'}
              </Text>
            </View>
            <TouchableOpacity
              style={styles.stepperActionBtn}
              onPress={() => applyDaysCount(daysCount + 1)}
              activeOpacity={0.8}
            >
              <Ionicons name="add" size={16} color="#0F172A" />
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* 5. VERIFIED NURSES SPOTLIGHT CAROUSEL */}
      <View style={styles.sectionCard}>
        <View style={styles.sectionHeaderRow}>
          <View style={[styles.sectionIconBox, { backgroundColor: '#FAF5FF' }]}>
            <Ionicons name="people" size={16} color="#7C3AED" />
          </View>
          <View style={{ flex: 1 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Text style={styles.sectionTitle}>Featured Certified Nurses</Text>
              <View style={[styles.hotPillBadge, { backgroundColor: '#F0FDF4' }]}>
                <Text style={[styles.hotPillBadgeText, { color: '#059669' }]}>MYSORE ON-DUTY</Text>
              </View>
            </View>
            <Text style={styles.sectionSub}>All staff verified with police check and Karnataka Nursing Council</Text>
          </View>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.nursesCarouselScroll}
        >
          {certifiedNurses.map((nurse, index) => {
            const avatarUrl = index === 0
              ? 'https://images.unsplash.com/photo-1594824813576-92f70b79873a?auto=format&fit=crop&q=80&w=250'
              : index === 1
              ? 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&q=80&w=250'
              : 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&q=80&w=250';

            return (
              <View key={nurse.id} style={styles.nurseProfileCard}>
                <View style={styles.nurseProfileHeader}>
                  <Image source={{ uri: avatarUrl }} style={styles.nurseAvatarImg} />
                  <View style={{ flex: 1, minWidth: 0 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                      <Text style={styles.nurseProfileName} numberOfLines={1}>
                        {nurse.name}
                      </Text>
                      <Ionicons name="checkmark-circle" size={14} color="#0D9488" />
                    </View>
                    <Text style={styles.nurseProfileDegree} numberOfLines={1}>
                      {nurse.qualification}
                    </Text>
                    <View style={styles.nurseRatingRow}>
                      <Ionicons name="star" size={12} color="#F59E0B" />
                      <Text style={styles.nurseRatingText}>{nurse.rating}</Text>
                    </View>
                  </View>
                </View>

                <View style={styles.nurseProfileDivider} />

                <View style={styles.nurseMetaLine}>
                  <Ionicons name="briefcase-outline" size={12} color="#64748B" />
                  <Text style={styles.nurseMetaText}>{nurse.experience}</Text>
                </View>
                <View style={styles.nurseMetaLine}>
                  <Ionicons name="medkit-outline" size={12} color="#0D9488" />
                  <Text style={styles.nurseMetaText} numberOfLines={1}>{nurse.specialties}</Text>
                </View>
                <View style={styles.nurseMetaLine}>
                  <Ionicons name="chatbubbles-outline" size={12} color="#64748B" />
                  <Text style={styles.nurseMetaText}>{nurse.languages}</Text>
                </View>
              </View>
            );
          })}
        </ScrollView>
      </View>

      {/* 6. CLINICAL SAFETY GUARANTEE */}
      <View style={styles.clinicalAssuranceCard}>
        <Ionicons name="shield-checkmark" size={24} color="#059669" />
        <View style={{ flex: 1 }}>
          <Text style={styles.clinicalAssuranceTitle}>Unnathi Clinical Guarantee</Text>
          <Text style={styles.clinicalAssuranceBody}>
            Hospital-grade sterile PPE kits, daily vital charting, medication verification, and guaranteed free nurse replacement within 2 hours if required.
          </Text>
        </View>
      </View>
    </View>
  );

  // ==========================================
  // STEP 2: DATES, TIME & ADDRESS
  // ==========================================
  const renderStep2 = () => (
    <View style={styles.stepWrap}>
      {/* 1. Date Selection with Calendar */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <View style={styles.cardHeaderIcon}>
            <Ionicons name="calendar" size={16} color={colors.primary} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.cardTitle}>1. Starting Date & End Date</Text>
            <Text style={styles.cardSub}>Tap below to change Start Date or End Date on calendar</Text>
          </View>
        </View>

        {/* Interactive Start Date & End Date Tabs */}
        <View style={styles.dateTabsRow}>
          <TouchableOpacity
            style={[styles.dateTab, activeDateTarget === 'start' && styles.dateTabActive]}
            onPress={() => setActiveDateTarget('start')}
            activeOpacity={0.85}
          >
            <Text style={styles.dateTabLabel}>🟢 STARTING DATE</Text>
            <Text style={styles.dateTabVal}>{formatShortDate(startDate)}</Text>
            <Text style={styles.dateTabSub}>{DAYS_SHORT[startDate.getDay()]}</Text>
          </TouchableOpacity>

          <View style={styles.dateTabArrow}>
            <Ionicons name="arrow-forward" size={16} color={colors.primary} />
            <Text style={styles.dateTabDaysText}>{daysCount} Days</Text>
          </View>

          <TouchableOpacity
            style={[styles.dateTab, activeDateTarget === 'end' && styles.dateTabActive]}
            onPress={() => setActiveDateTarget('end')}
            activeOpacity={0.85}
          >
            <Text style={styles.dateTabLabel}>🏁 END DATE</Text>
            <Text style={styles.dateTabVal}>{formatShortDate(endDate)}</Text>
            <Text style={styles.dateTabSub}>{DAYS_SHORT[endDate.getDay()]}</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.calHintText}>
          {activeDateTarget === 'start'
            ? '👉 Tap a date below to set STARTING DATE'
            : '👉 Tap a date below to set END DATE'}
        </Text>

        {/* Calendar */}
        {renderCalendar()}
      </View>

      {/* 2. Manual Time Selection */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <View style={styles.cardHeaderIcon}>
            <Ionicons name="time" size={16} color={colors.primary} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.cardTitle}>2. Staff Daily Arrival Time</Text>
            <Text style={styles.cardSub}>What time should the staff report at your home?</Text>
          </View>
        </View>

        {/* Selected Time Banner */}
        <View style={styles.timePreviewStrip}>
          <Ionicons name="alarm" size={18} color={colors.primary} />
          <Text style={styles.timePreviewText}>
            Reporting Daily at: <Text style={{ fontWeight: '900', color: colors.secondary }}>{selectedTimeStr}</Text>
          </Text>
        </View>

        {/* Quick Time Presets */}
        <Text style={styles.fieldLabel}>Select standard reporting time:</Text>
        <View style={styles.timePresetsGrid}>
          {TIME_PRESETS.map((preset) => {
            const isMatch = selectedTimeStr === `${preset.hour}:${preset.minute} ${preset.period}`;
            return (
              <TouchableOpacity
                key={preset.label}
                style={[styles.timePresetBtn, isMatch && styles.timePresetBtnActive]}
                onPress={() => handleTimePresetClick(preset)}
                activeOpacity={0.8}
              >
                <Ionicons
                  name={isMatch ? 'checkmark-circle' : 'time-outline'}
                  size={13}
                  color={isMatch ? '#FFF' : colors.primary}
                />
                <Text style={[styles.timePresetBtnText, isMatch && styles.timePresetBtnTextActive]}>
                  {preset.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Toggle Custom Time */}
        <TouchableOpacity
          style={styles.customTimeToggleBtn}
          onPress={() => setShowCustomTime(!showCustomTime)}
          activeOpacity={0.8}
        >
          <Ionicons name={showCustomTime ? 'chevron-up' : 'create-outline'} size={14} color={colors.primary} />
          <Text style={styles.customTimeToggleText}>
            {showCustomTime ? 'Hide Custom Time Controls' : 'Or Set Custom Hour & Minute...'}
          </Text>
        </TouchableOpacity>

        {/* Custom Time Selector */}
        {showCustomTime && (
          <View style={styles.customTimeBox}>
            <Text style={styles.fieldLabel}>Select Hour:</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6, marginBottom: 10 }}>
              {['06', '07', '08', '09', '10', '11', '12', '01', '02', '03', '04', '05'].map((h) => {
                const isH = manualHour === h;
                return (
                  <TouchableOpacity
                    key={h}
                    style={[styles.hourPill, isH && styles.hourPillActive]}
                    onPress={() => updateManualTimeParts(h, undefined, undefined)}
                  >
                    <Text style={[styles.hourPillText, isH && styles.hourPillTextActive]}>{h}</Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <View style={{ flex: 1 }}>
                <Text style={styles.fieldLabel}>Minute:</Text>
                <View style={{ flexDirection: 'row', gap: 6 }}>
                  {['00', '15', '30', '45'].map((m) => {
                    const isM = manualMinute === m;
                    return (
                      <TouchableOpacity
                        key={m}
                        style={[styles.hourPill, isM && styles.hourPillActive, { flex: 1 }]}
                        onPress={() => updateManualTimeParts(undefined, m, undefined)}
                      >
                        <Text style={[styles.hourPillText, isM && styles.hourPillTextActive]}>:{m}</Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>

              <View style={{ width: 100 }}>
                <Text style={styles.fieldLabel}>AM / PM:</Text>
                <View style={styles.ampmWrap}>
                  {['AM', 'PM'].map((p) => {
                    const isP = manualPeriod === p;
                    return (
                      <TouchableOpacity
                        key={p}
                        style={[styles.ampmBtn, isP && styles.ampmBtnActive]}
                        onPress={() => updateManualTimeParts(undefined, undefined, p)}
                      >
                        <Text style={[styles.ampmBtnText, isP && styles.ampmBtnTextActive]}>{p}</Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            </View>
          </View>
        )}

        {/* Timing Note */}
        <TextInput
          style={styles.textInput}
          placeholder="Arrival instruction (e.g. Ring bell twice, patient wakes at 8am)"
          placeholderTextColor={colors.textMuted}
          value={timeNote}
          onChangeText={setTimeNote}
        />
      </View>

      {/* 3. Patient & Mysore Address */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <View style={styles.cardHeaderIcon}>
            <Ionicons name="location" size={16} color={colors.primary} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.cardTitle}>3. Patient & Mysore Address</Text>
            <Text style={styles.cardSub}>Where should the verified nurse arrive?</Text>
          </View>
        </View>

        {/* Quick Family Member Chips (Strictly Family Members Only) */}
        <Text style={styles.fieldLabel}>Who is this booking for? (Family Members):</Text>
        <View style={styles.familyRow}>
          {familyList.map((m) => {
            const isSelected = selectedFamilyId === m.id;
            return (
              <TouchableOpacity
                key={m.id}
                style={[styles.familyChip, isSelected && styles.familyChipActive]}
                onPress={() => {
                  setSelectedFamilyId(m.id);
                  setPatientName(m.name);
                  setPatientRelation(m.relation);
                  if (m.phone) setPatientPhone(m.phone);
                }}
                activeOpacity={0.8}
              >
                <Ionicons
                  name="person"
                  size={12}
                  color={isSelected ? '#FFFFFF' : colors.primary}
                />
                <Text style={[styles.familyChipText, isSelected && styles.familyChipTextActive]}>
                  {m.displayName || (m.relation === 'Self' ? `${m.name} (Self)` : `${m.name} (${m.relation})`)}
                </Text>
              </TouchableOpacity>
            );
          })}

          <TouchableOpacity
            style={styles.addFamilyChip}
            onPress={() => navigation?.navigate('FamilyProfiles')}
            activeOpacity={0.8}
          >
            <Ionicons name="add-circle-outline" size={13} color={colors.primary} />
            <Text style={styles.addFamilyChipText}>+ Add Member</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.fieldLabel}>Patient Full Name:</Text>
        <TextInput
          style={styles.textInput}
          value={patientName}
          onChangeText={setPatientName}
          placeholder="Patient Full Name"
          placeholderTextColor={colors.textMuted}
        />

        <Text style={styles.fieldLabel}>Contact Mobile (10 Digits):</Text>
        <TextInput
          style={styles.textInput}
          keyboardType="phone-pad"
          maxLength={10}
          value={patientPhone}
          onChangeText={setPatientPhone}
          placeholder="10-digit phone number"
          placeholderTextColor={colors.textMuted}
        />

        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <Text style={styles.fieldLabel}>Mysore Address:</Text>
          <TouchableOpacity
            style={styles.gpsButton}
            onPress={detectGPSLocation}
            activeOpacity={0.8}
          >
            {locationLoading ? (
              <ActivityIndicator size="small" color={colors.primary} />
            ) : (
              <>
                <Ionicons name="navigate" size={12} color={colors.primary} />
                <Text style={styles.gpsButtonText}>Auto GPS</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
        <TextInput
          style={[styles.textInput, { height: 50 }]}
          multiline
          value={patientAddress}
          onChangeText={setPatientAddress}
          placeholder="House/flat number, landmark, Mysore"
          placeholderTextColor={colors.textMuted}
        />

        {/* Quick Mysore Chips */}
        <View style={styles.quickAreaRow}>
          {MYSORE_AREAS.map((area) => (
            <TouchableOpacity
              key={area}
              style={styles.areaChip}
              onPress={() => {
                if (!patientAddress.includes(area)) {
                  setPatientAddress(patientAddress ? `${patientAddress}, ${area}` : `${area}, Mysore`);
                }
              }}
              activeOpacity={0.8}
            >
              <Ionicons name="add" size={10} color={colors.primary} />
              <Text style={styles.areaChipText}>{area}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </View>
  );

  // ==========================================
  // STEP 3: REVIEW & PAY
  // ==========================================
  const renderStep3 = () => (
    <View style={styles.stepWrap}>
      {/* 1. Summary Card */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <View style={styles.cardHeaderIcon}>
            <Ionicons name="document-text" size={16} color={colors.primary} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.cardTitle}>Review Booking Summary</Text>
            <Text style={styles.cardSub}>Confirm all details before assigning certified staff</Text>
          </View>
        </View>

        <View style={styles.summaryBox}>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Staff Service:</Text>
            <Text style={styles.summaryVal}>{selectedShift.label}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Package Selected:</Text>
            <Text style={[styles.summaryVal, { color: colors.primary, fontWeight: '800' }]}>
              {priceCalculation.dealName}
            </Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Dates:</Text>
            <Text style={styles.summaryVal}>
              {daysCount} Days ({formatShortDate(startDate)} to {formatShortDate(endDate)})
            </Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Daily Arrival:</Text>
            <Text style={styles.summaryVal}>{selectedTimeStr}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Patient:</Text>
            <Text style={styles.summaryVal}>{patientName} ({patientRelation})</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Address:</Text>
            <Text style={styles.summaryVal} numberOfLines={2}>{patientAddress}</Text>
          </View>
        </View>
      </View>

      {/* 2. Payment Selector */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <View style={styles.cardHeaderIcon}>
            <Ionicons name="card" size={16} color={colors.primary} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.cardTitle}>Payment Method</Text>
            <Text style={styles.cardSub}>Choose how you would like to pay</Text>
          </View>
        </View>

        {/* Health Wallet */}
        <TouchableOpacity
          style={[styles.payRow, paymentMethod === 'WALLET' && styles.payRowActive]}
          onPress={() => setPaymentMethod('WALLET')}
          activeOpacity={0.85}
        >
          <View style={styles.payIconCircle}>
            <Ionicons name="wallet" size={16} color={colors.primary} />
          </View>
          <View style={{ flex: 1, marginLeft: 10 }}>
            <Text style={styles.payTitle}>MediUnify Health Wallet</Text>
            <Text style={[styles.paySub, { color: walletBalance >= priceCalculation.total ? colors.freshGreen : colors.coral }]}>
              Balance: ₹{walletBalance.toLocaleString('en-IN')} {walletBalance >= priceCalculation.total ? '• Sufficient' : '• Needs Top Up'}
            </Text>
          </View>
          <View style={[styles.radio, paymentMethod === 'WALLET' && styles.radioActive]}>
            {paymentMethod === 'WALLET' && <View style={styles.radioDot} />}
          </View>
        </TouchableOpacity>

        {/* Pay on Arrival */}
        <TouchableOpacity
          style={[styles.payRow, paymentMethod === 'PayOnArrival' && styles.payRowActive]}
          onPress={() => setPaymentMethod('PayOnArrival')}
          activeOpacity={0.85}
        >
          <View style={styles.payIconCircle}>
            <Ionicons name="cash" size={16} color={colors.primary} />
          </View>
          <View style={{ flex: 1, marginLeft: 10 }}>
            <Text style={styles.payTitle}>Pay on Nurse Arrival</Text>
            <Text style={styles.paySub}>Pay via Cash or UPI when the nurse reaches your home</Text>
          </View>
          <View style={[styles.radio, paymentMethod === 'PayOnArrival' && styles.radioActive]}>
            {paymentMethod === 'PayOnArrival' && <View style={styles.radioDot} />}
          </View>
        </TouchableOpacity>

        {/* Instant UPI */}
        <TouchableOpacity
          style={[styles.payRow, paymentMethod === 'UPI' && styles.payRowActive]}
          onPress={() => setPaymentMethod('UPI')}
          activeOpacity={0.85}
        >
          <View style={styles.payIconCircle}>
            <Ionicons name="phone-portrait" size={16} color={colors.primary} />
          </View>
          <View style={{ flex: 1, marginLeft: 10 }}>
            <Text style={styles.payTitle}>Instant UPI (GPay / PhonePe / Paytm)</Text>
            <Text style={styles.paySub}>Pay online via UPI gateway</Text>
          </View>
          <View style={[styles.radio, paymentMethod === 'UPI' && styles.radioActive]}>
            {paymentMethod === 'UPI' && <View style={styles.radioDot} />}
          </View>
        </TouchableOpacity>

        {/* Invoice Breakdown */}
        <View style={styles.invoiceCard}>
          <Text style={styles.invoiceTitle}>Transparent Price Breakdown</Text>
          <View style={styles.invoiceRow}>
            <Text style={styles.invoiceLabel}>
              {selectedShift.label} (₹{selectedShift.dailyRate}/day × {daysCount} Days):
            </Text>
            <Text style={styles.invoiceVal}>{priceCalculation.grossFormatted}</Text>
          </View>

          {priceCalculation.discountAmt > 0 && (
            <View style={styles.invoiceRow}>
              <Text style={[styles.invoiceLabel, { color: '#059669', fontWeight: '800' }]}>
                {priceCalculation.dealName}:
              </Text>
              <Text style={[styles.invoiceVal, { color: '#059669', fontWeight: '900' }]}>
                -{priceCalculation.discountFormatted}
              </Text>
            </View>
          )}

          <View style={styles.invoiceRow}>
            <Text style={styles.invoiceLabel}>Sterile PPE Kit & Travel to Mysore Home:</Text>
            <Text style={[styles.invoiceVal, { color: colors.freshGreen, fontWeight: '800' }]}>FREE</Text>
          </View>

          <View style={styles.invoiceRow}>
            <Text style={styles.invoiceLabel}>GST & Service Tax (18%):</Text>
            <Text style={styles.invoiceVal}>{priceCalculation.gstFormatted}</Text>
          </View>

          <View style={styles.invoiceDivider} />

          <View style={styles.invoiceTotalRow}>
            <View>
              <Text style={styles.invoiceTotalLabel}>Net Amount Payable</Text>
              <Text style={styles.invoiceTotalSub}>All taxes & nurse PPE kit included</Text>
            </View>
            <Text style={styles.invoiceTotalVal}>{priceCalculation.totalFormatted}</Text>
          </View>
        </View>

        {/* UNIFIED PRIVACY & CLINICAL ASSURANCE BOX */}
        <View style={styles.privacyAssuranceBoxUnified}>
          <Ionicons name="shield-checkmark" size={17} color="#059669" />
          <Text style={styles.privacyAssuranceTextUnified}>
            100% verified & background-checked GNM/B.Sc nurses. Hospital-grade clinical protocols, bedside vital chart monitoring, and guaranteed free replacement within 2 hours if required.
          </Text>
        </View>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* HEADER (MOBILE ONLY) */}
      {!isDesktopWeb && (
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backBtn}
            onPress={() => {
              if (currentStep > 1) {
                setCurrentStep(currentStep - 1);
              } else {
                navigation.goBack();
              }
            }}
            activeOpacity={0.8}
          >
            <Ionicons name="arrow-back" size={20} color={colors.secondary} />
          </TouchableOpacity>

          <View style={styles.headerCenter}>
            <Text style={styles.headerStepBadge}>
              {currentStep === 1
                ? 'STEP 1 OF 3 • SERVICE & PACKAGES'
                : currentStep === 2
                ? 'STEP 2 OF 3 • DATES & TIME'
                : 'STEP 3 OF 3 • REVIEW & PAY'}
            </Text>
            <Text style={styles.headerTitle}>Home Nursing</Text>
          </View>

          <TouchableOpacity
            style={styles.helplineBtn}
            activeOpacity={0.85}
            onPress={() => Linking.openURL('tel:+918212568888')}
          >
            <Ionicons name="call" size={13} color="#FFFFFF" />
            <Text style={styles.helplineBtnText}>24x7</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* DESKTOP BREADCRUMB */}
      {isDesktopWeb && (
        <View style={styles.desktopBreadcrumbWrap}>
          <View style={styles.desktopBreadcrumbInner}>
            <TouchableOpacity onPress={() => navigation.navigate('Home')} activeOpacity={0.7}>
              <Text style={styles.breadcrumbLink}>Home</Text>
            </TouchableOpacity>
            <Ionicons name="chevron-forward" size={14} color="#94A3B8" />
            <Text style={styles.breadcrumbCurrent}>Services</Text>
            <Ionicons name="chevron-forward" size={14} color="#94A3B8" />
            <Text style={styles.breadcrumbActive}>24/7 Verified Home Nursing & Care</Text>

            <View style={{ flex: 1 }} />

            <View style={styles.nurseVerifiedBadge}>
              <Ionicons name="shield-checkmark" size={14} color="#059669" />
              <Text style={styles.nurseVerifiedBadgeText}>INC / KNC Certified Nurses</Text>
            </View>
          </View>
        </View>
      )}

      {/* 3-STEP PROGRESS STRIP */}
      <View style={styles.stepStrip}>
        {[
          { num: 1, label: '1. Service & Deal' },
          { num: 2, label: '2. Dates & Time' },
          { num: 3, label: '3. Review & Pay' },
        ].map((s, idx) => {
          const isActive = currentStep === s.num;
          const isPassed = currentStep > s.num;

          return (
            <React.Fragment key={s.num}>
              <TouchableOpacity
                style={styles.stepStripItem}
                onPress={() => {
                  if (s.num < currentStep) setCurrentStep(s.num);
                }}
                disabled={s.num >= currentStep}
              >
                <View
                  style={[
                    styles.stepStripCircle,
                    isActive && styles.stepStripCircleActive,
                    isPassed && styles.stepStripCirclePassed,
                  ]}
                >
                  {isPassed ? (
                    <Ionicons name="checkmark" size={11} color="#FFFFFF" />
                  ) : (
                    <Text style={[styles.stepStripNum, isActive && styles.stepStripNumActive]}>
                      {s.num}
                    </Text>
                  )}
                </View>
                <Text style={[styles.stepStripLabel, isActive && styles.stepStripLabelActive]}>
                  {s.label}
                </Text>
              </TouchableOpacity>

              {idx < 2 && (
                <View style={[styles.stepStripLine, currentStep > s.num && styles.stepStripLineActive]} />
              )}
            </React.Fragment>
          );
        })}
      </View>

      {/* MAIN SCROLL CONTENT */}
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContainer}>
        {currentStep === 1 && renderStep1()}
        {currentStep === 2 && renderStep2()}
        {currentStep === 3 && renderStep3()}
        <View style={{ height: 110 }} />
        {isDesktopWeb && <WebFooter navigation={navigation} />}
      </ScrollView>

      {/* STICKY BOTTOM ACTION BAR (Clean & Un-confusing) */}
      <View style={styles.bottomBar}>
        <View style={styles.bottomBarInner}>
          <View>
            <Text style={styles.bottomBarLabel}>
              Total ({daysCount} {daysCount === 1 ? 'Day' : 'Days'})
            </Text>
            <Text style={styles.bottomBarPrice}>{priceCalculation.totalFormatted}</Text>
            {priceCalculation.discountPercent > 0 ? (
              <Text style={styles.bottomBarDealText}>
                🎉 {priceCalculation.discountPercent}% Package Deal Applied
              </Text>
            ) : (
              <Text style={styles.bottomBarSubText}>
                {selectedShift.label}
              </Text>
            )}
          </View>

          {currentStep < 3 ? (
            <TouchableOpacity
              style={styles.bottomCtaBtn}
              onPress={goToNextStep}
              activeOpacity={0.88}
            >
              <Text style={styles.bottomCtaText}>
                {currentStep === 1 ? 'Next: Dates & Time' : 'Next: Review & Pay'}
              </Text>
              <Ionicons name="arrow-forward" size={16} color="#FFFFFF" />
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={[styles.bottomCtaBtn, isProcessing && { opacity: 0.7 }]}
              onPress={handleConfirmAndPay}
              disabled={isProcessing}
              activeOpacity={0.88}
            >
              {isProcessing ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <>
                  <Text style={styles.bottomCtaText}>
                    {paymentMethod === 'PayOnArrival' ? 'Confirm Booking' : 'Pay & Book Staff'}
                  </Text>
                  <Ionicons name="checkmark-circle" size={16} color="#FFFFFF" />
                </>
              )}
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* SUCCESS CONFIRMATION MODAL */}
      <Modal
        visible={successModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setSuccessModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalIconBox}>
              <Ionicons name="checkmark-circle" size={40} color="#FFFFFF" />
            </View>

            <Text style={styles.modalTitle}>Staff Care Confirmed!</Text>
            <Text style={styles.modalSub}>
              A certified hospital-trained nurse has been assigned to your address.
            </Text>

            {confirmedBooking && (
              <View style={styles.modalSummary}>
                <View style={styles.modalRow}>
                  <Text style={styles.modalRowLabel}>Booking ID:</Text>
                  <Text style={styles.modalRowVal}>{confirmedBooking.bookingId}</Text>
                </View>
                <View style={styles.modalRow}>
                  <Text style={styles.modalRowLabel}>Duration:</Text>
                  <Text style={styles.modalRowVal}>{confirmedBooking.duration}</Text>
                </View>
                <View style={styles.modalRow}>
                  <Text style={styles.modalRowLabel}>Daily Arrival:</Text>
                  <Text style={styles.modalRowVal}>{confirmedBooking.schedule.time}</Text>
                </View>
                <View style={styles.modalRow}>
                  <Text style={styles.modalRowLabel}>Assigned Staff:</Text>
                  <Text style={[styles.modalRowVal, { color: colors.primary }]}>
                    {confirmedBooking.assignedNurse.name}
                  </Text>
                </View>
                <View style={styles.modalRow}>
                  <Text style={styles.modalRowLabel}>Total Amount:</Text>
                  <Text style={[styles.modalRowVal, { color: colors.freshGreen }]}>
                    {confirmedBooking.payment.amount} ({confirmedBooking.payment.method})
                  </Text>
                </View>
              </View>
            )}

            <TouchableOpacity
              style={styles.modalDoneBtn}
              onPress={() => {
                setSuccessModalVisible(false);
                navigation.navigate('Bookings', {
                  newAppointment: confirmedBooking,
                  initialTab: 'Home Care',
                  timestamp: Date.now(),
                });
              }}
              activeOpacity={0.88}
            >
              <Text style={styles.modalDoneBtnText}>Go to My Bookings</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

// ==========================================
// STYLES
// ==========================================

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },

  // DESKTOP BREADCRUMB
  desktopBreadcrumbWrap: {
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    paddingHorizontal: 24,
    paddingVertical: 12,
  },
  desktopBreadcrumbInner: {
    maxWidth: 1320,
    width: '100%',
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  breadcrumbLink: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1E3A8A',
  },
  breadcrumbCurrent: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748B',
  },
  breadcrumbActive: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
  },
  nurseVerifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#F0FDF4',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#BBF7D0',
  },
  nurseVerifiedBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#059669',
  },

  // HEADER (ELEVATED MOBILE HEADER)
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: '#F8FAFC',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  headerCenter: {
    flex: 1,
    marginLeft: 12,
    marginRight: 8,
  },
  headerStepBadge: {
    fontSize: 9.5,
    fontWeight: '800',
    color: '#0D9488',
    letterSpacing: 0.5,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '900',
    color: '#0F172A',
  },
  helplineBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0F766E',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 4,
  },
  helplineBtnText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '800',
  },

  // 3-STEP PROGRESS STRIP (ELEVATED)
  stepStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 11,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  stepStripItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  stepStripCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepStripCircleActive: {
    backgroundColor: '#0D9488',
    borderColor: '#0D9488',
  },
  stepStripCirclePassed: {
    backgroundColor: '#0F172A',
    borderColor: '#0F172A',
  },
  stepStripNum: {
    fontSize: 10,
    fontWeight: '800',
    color: '#64748B',
  },
  stepStripNumActive: {
    color: '#FFFFFF',
  },
  stepStripLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748B',
  },
  stepStripLabelActive: {
    color: '#0D9488',
    fontWeight: '800',
  },
  stepStripLine: {
    flex: 1,
    height: 2,
    backgroundColor: '#E2E8F0',
    marginHorizontal: 4,
  },
  stepStripLineActive: {
    backgroundColor: '#0D9488',
  },

  scrollContainer: {
    paddingHorizontal: 16,
    paddingTop: 12,
    maxWidth: 1320,
    width: '100%',
    alignSelf: 'center',
  },
  stepWrap: {
    width: '100%',
    gap: 12,
  },

  // 1. CLINICAL TRUST HERO BANNER (REDESIGNED)
  nurseHeroCardRedesigned: {
    backgroundColor: '#F0FDFA',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1.5,
    borderColor: '#99F6E4',
    shadowColor: '#0D9488',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 3,
    marginBottom: 4,
  },
  nurseHeroTopTagRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
    flexWrap: 'wrap',
    gap: 6,
  },
  nurseAccreditedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#CCFBF1',
    paddingHorizontal: 8,
    paddingVertical: 3.5,
    borderRadius: 12,
  },
  nurseAccreditedBadgeText: {
    fontSize: 9.5,
    fontWeight: '800',
    color: '#0F766E',
    letterSpacing: 0.4,
  },
  liveDutyBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 8,
    paddingVertical: 3.5,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  liveDutyPulseDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: '#10B981',
  },
  liveDutyBadgeText: {
    fontSize: 9.5,
    fontWeight: '900',
    color: '#047857',
    letterSpacing: 0.4,
  },
  nurseHeroHeading: {
    fontSize: 17,
    fontWeight: '900',
    color: '#0F172A',
    lineHeight: 23,
    marginBottom: 6,
  },
  nurseHeroSubheading: {
    fontSize: 12,
    color: '#475569',
    lineHeight: 18,
    marginBottom: 14,
  },
  nursePillarsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 14,
  },
  nursePillarItem: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 2,
  },
  nursePillarIconBox: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#F8FAFC',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
  },
  nursePillarText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#1E293B',
    textAlign: 'center',
    lineHeight: 13,
  },
  nurseHeroCallBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#0F766E',
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  nurseHeroCallLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  nurseHeroCallIconBox: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  nurseHeroCallTitle: {
    fontSize: 12.5,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  nurseHeroCallSub: {
    fontSize: 10.5,
    color: '#CCFBF1',
    marginTop: 1,
  },

  // COMMON SECTION CARD STYLES
  sectionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#64748B',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 1,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    marginBottom: 14,
  },
  sectionIconBox: {
    width: 32,
    height: 32,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: 14.5,
    fontWeight: '900',
    color: '#0F172A',
  },
  sectionSub: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
  },

  // 2. CLINICAL NEED CHIPS
  purposesScroll: {
    gap: 8,
    paddingVertical: 2,
  },
  purposeChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#F8FAFC',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
  },
  purposeChipActive: {
    backgroundColor: '#F0FDFA',
    borderColor: '#0D9488',
  },
  purposeIconWrap: {
    width: 22,
    height: 22,
    borderRadius: 11,
    justifyContent: 'center',
    alignItems: 'center',
  },
  purposeChipText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#475569',
  },
  purposeChipTextActive: {
    color: '#0F766E',
    fontWeight: '800',
  },

  // 3. MODERN SHIFT CARDS
  modernShiftsGrid: {
    gap: 10,
  },
  modernShiftCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    padding: 14,
  },
  modernShiftCardActive: {
    borderColor: '#0D9488',
    backgroundColor: '#F0FDFA',
    shadowColor: '#0D9488',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 2,
  },
  modernShiftTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  modernShiftBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  modernShiftBadgeActive: {
    backgroundColor: '#0D9488',
  },
  modernShiftBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#475569',
  },
  modernShiftBadgeTextActive: {
    color: '#FFFFFF',
  },
  radioCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#CBD5E1',
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioCircleActive: {
    borderColor: '#0D9488',
  },
  radioDotInner: {
    width: 9,
    height: 9,
    borderRadius: 4.5,
    backgroundColor: '#0D9488',
  },
  modernShiftName: {
    fontSize: 14.5,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 4,
  },
  modernShiftNameActive: {
    color: '#0F766E',
  },
  modernShiftTimingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginBottom: 5,
  },
  modernShiftTimingText: {
    fontSize: 11.5,
    fontWeight: '600',
    color: '#64748B',
  },
  modernShiftDesc: {
    fontSize: 11,
    color: '#64748B',
    lineHeight: 16,
    marginBottom: 8,
  },
  modernShiftPriceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'flex-end',
    gap: 2,
  },
  modernShiftRateText: {
    fontSize: 17,
    fontWeight: '900',
    color: '#0F172A',
  },
  modernShiftRateSub: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '600',
  },

  // 4. PACKAGE DEALS & STEPPER
  hotPillBadge: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  hotPillBadgeText: {
    fontSize: 9,
    fontWeight: '900',
    color: '#B45309',
  },
  dealCalloutBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF1F2',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    marginBottom: 12,
    gap: 8,
    borderWidth: 1,
    borderColor: '#FECDD3',
  },
  dealCalloutBannerText: {
    fontSize: 11.5,
    color: '#9F1239',
    flex: 1,
    lineHeight: 16,
  },
  packageCardsList: {
    gap: 8,
  },
  packageCardItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    padding: 12,
  },
  packageCardItemActive: {
    borderColor: '#0D9488',
    backgroundColor: '#F0FDFA',
  },
  packageCardTitle: {
    fontSize: 13.5,
    fontWeight: '800',
    color: '#0F172A',
  },
  packageCardTitleActive: {
    color: '#0F766E',
  },
  packageDiscountTag: {
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  packageDiscountTagText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#15803D',
  },
  packageCardSubtitle: {
    fontSize: 10.5,
    color: '#64748B',
    marginTop: 2,
  },
  packageCardPrice: {
    fontSize: 14.5,
    fontWeight: '900',
    color: '#0F172A',
  },
  packageCardPriceActive: {
    color: '#0F766E',
  },
  packageSaveAmountBadge: {
    fontSize: 10,
    fontWeight: '800',
    color: '#15803D',
    marginTop: 1,
  },
  stepperContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F8FAFC',
    padding: 12,
    borderRadius: 10,
    marginTop: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  stepperPromptTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: '#0F172A',
  },
  stepperPromptSub: {
    fontSize: 10,
    color: '#64748B',
    marginTop: 1,
  },
  stepperRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
    overflow: 'hidden',
  },
  stepperActionBtn: {
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
  },
  stepperNumberDisplay: {
    paddingHorizontal: 12,
    minWidth: 70,
    alignItems: 'center',
  },
  stepperNumberText: {
    fontSize: 13,
    fontWeight: '900',
    color: '#0F172A',
  },

  // 5. VERIFIED NURSES SPOTLIGHT CAROUSEL
  nursesCarouselScroll: {
    gap: 12,
    paddingVertical: 4,
  },
  nurseProfileCard: {
    width: 250,
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 12,
  },
  nurseProfileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  nurseAvatarImg: {
    width: 46,
    height: 46,
    borderRadius: 23,
    borderWidth: 1.5,
    borderColor: '#0D9488',
  },
  nurseProfileName: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0F172A',
  },
  nurseProfileDegree: {
    fontSize: 10.5,
    color: '#64748B',
    marginTop: 1,
  },
  nurseRatingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    marginTop: 2,
  },
  nurseRatingText: {
    fontSize: 10.5,
    fontWeight: '800',
    color: '#B45309',
  },
  nurseProfileDivider: {
    height: 1,
    backgroundColor: '#E2E8F0',
    marginVertical: 8,
  },
  nurseMetaLine: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 3,
  },
  nurseMetaText: {
    fontSize: 10.5,
    color: '#475569',
    flex: 1,
  },

  // 6. CLINICAL SAFETY GUARANTEE
  clinicalAssuranceCard: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
    backgroundColor: '#ECFDF5',
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#A7F3D0',
    marginBottom: 4,
  },
  clinicalAssuranceTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#065F46',
    marginBottom: 2,
  },
  clinicalAssuranceBody: {
    fontSize: 11,
    color: '#047857',
    lineHeight: 16,
  },

  // SHARED CARDS & RADIO (FOR STEPS 2 & 3)
  card: {
    backgroundColor: colors.cardBg,
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 10,
  },
  cardHeaderIcon: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: colors.lightTeal,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: '900',
    color: colors.secondary,
  },
  cardSub: {
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: 1,
  },
  radio: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 2,
    borderColor: colors.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioActive: {
    borderColor: colors.primary,
  },
  radioDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.primary,
  },

  // STEP 2: DATES & CALENDAR
  dateTabsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
    gap: 8,
  },
  dateTab: {
    flex: 1,
    backgroundColor: colors.white,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: colors.border,
    padding: 10,
    alignItems: 'center',
  },
  dateTabActive: {
    borderColor: colors.primary,
    backgroundColor: colors.lightTeal,
  },
  dateTabLabel: {
    fontSize: 9,
    fontWeight: '800',
    color: colors.textSecondary,
    marginBottom: 2,
  },
  dateTabVal: {
    fontSize: 15,
    fontWeight: '900',
    color: colors.secondary,
  },
  dateTabSub: {
    fontSize: 10,
    color: colors.textMuted,
  },
  dateTabArrow: {
    alignItems: 'center',
  },
  dateTabDaysText: {
    fontSize: 9.5,
    fontWeight: '800',
    color: colors.primary,
    marginTop: 2,
  },
  calHintText: {
    fontSize: 10.5,
    fontWeight: '700',
    color: colors.primary,
    textAlign: 'center',
    marginBottom: 8,
  },
  calContainer: {
    backgroundColor: colors.white,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 10,
  },
  calNavRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  calArrowBtn: {
    width: 28,
    height: 28,
    borderRadius: 6,
    backgroundColor: colors.lightSlate,
    justifyContent: 'center',
    alignItems: 'center',
  },
  calMonthText: {
    fontSize: 13,
    fontWeight: '900',
    color: colors.secondary,
  },
  calDayNamesRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    paddingBottom: 4,
    marginBottom: 4,
  },
  calDayNameText: {
    width: `${100 / 7}%`,
    textAlign: 'center',
    fontSize: 10,
    fontWeight: '800',
    color: colors.textSecondary,
  },
  calGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  calCellEmpty: {
    width: `${100 / 7}%`,
    height: 36,
  },
  calCell: {
    width: `${100 / 7}%`,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 1,
  },
  calCellInRange: {
    backgroundColor: '#E0F2FE',
  },
  calCellStart: {
    backgroundColor: '#E0F2FE',
    borderTopLeftRadius: 14,
    borderBottomLeftRadius: 14,
  },
  calCellEnd: {
    backgroundColor: '#E0F2FE',
    borderTopRightRadius: 14,
    borderBottomRightRadius: 14,
  },
  calCellDisabled: {
    opacity: 0.3,
  },
  calCircle: {
    width: 26,
    height: 26,
    borderRadius: 13,
    justifyContent: 'center',
    alignItems: 'center',
  },
  calCircleActive: {
    backgroundColor: colors.primary,
  },
  calDayText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: colors.secondary,
  },
  calDayTextActive: {
    color: '#FFFFFF',
    fontWeight: '900',
  },
  calDayTextInRange: {
    color: colors.secondary,
    fontWeight: '800',
  },
  calDayTextDisabled: {
    color: colors.textMuted,
  },

  // TIME SELECTION
  timePreviewStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.lightTeal,
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 8,
    gap: 8,
    marginBottom: 10,
  },
  timePreviewText: {
    fontSize: 11.5,
    color: colors.textDark,
  },
  timePresetsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 8,
  },
  timePresetBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    paddingHorizontal: 9,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 5,
  },
  timePresetBtnActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  timePresetBtnText: {
    fontSize: 10.5,
    fontWeight: '700',
    color: colors.textDark,
  },
  timePresetBtnTextActive: {
    color: '#FFFFFF',
  },
  customTimeToggleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
    gap: 4,
    marginBottom: 6,
  },
  customTimeToggleText: {
    fontSize: 10.5,
    fontWeight: '800',
    color: colors.primary,
  },
  customTimeBox: {
    backgroundColor: colors.white,
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 8,
  },
  hourPill: {
    backgroundColor: colors.background,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
  },
  hourPillActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  hourPillText: {
    fontSize: 11,
    fontWeight: '800',
    color: colors.secondary,
  },
  hourPillTextActive: {
    color: '#FFFFFF',
  },
  ampmWrap: {
    flexDirection: 'row',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 6,
    overflow: 'hidden',
  },
  ampmBtn: {
    flex: 1,
    paddingVertical: 6,
    alignItems: 'center',
    backgroundColor: colors.white,
  },
  ampmBtnActive: {
    backgroundColor: colors.secondary,
  },
  ampmBtnText: {
    fontSize: 11,
    fontWeight: '900',
    color: colors.secondary,
  },
  ampmBtnTextActive: {
    color: '#FFFFFF',
  },

  // FORM INPUTS
  fieldLabel: {
    fontSize: 10.5,
    fontWeight: '800',
    color: colors.secondary,
    marginBottom: 4,
    marginTop: 4,
  },
  textInput: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    paddingHorizontal: 10,
    height: 38,
    fontSize: 11.5,
    color: colors.textDark,
    marginBottom: 6,
  },
  familyRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 8,
  },
  familyChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 4,
  },
  familyChipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  familyChipText: {
    fontSize: 10.5,
    fontWeight: '700',
    color: colors.text,
  },
  familyChipTextActive: {
    color: '#FFFFFF',
  },
  addFamilyChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0FDFA',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#99F6E4',
    borderStyle: 'dashed',
    gap: 4,
  },
  addFamilyChipText: {
    fontSize: 10.5,
    fontWeight: '800',
    color: colors.primary,
  },
  gpsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.lightTeal,
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 5,
    gap: 3,
  },
  gpsButtonText: {
    fontSize: 9.5,
    fontWeight: '800',
    color: colors.primary,
  },
  quickAreaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
    marginTop: 2,
  },
  areaChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.lightSlate,
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 5,
    gap: 2,
  },
  areaChipText: {
    fontSize: 10,
    color: colors.textSecondary,
    fontWeight: '600',
  },

  // STEP 3: REVIEW & PAY
  summaryBox: {
    backgroundColor: colors.white,
    borderRadius: 10,
    padding: 10,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 6,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  summaryLabel: {
    fontSize: 10.5,
    color: colors.textSecondary,
  },
  summaryVal: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.secondary,
    maxWidth: '65%',
    textAlign: 'right',
  },
  payRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: colors.border,
    padding: 10,
    marginBottom: 8,
  },
  payRowActive: {
    borderColor: colors.primary,
    backgroundColor: '#F0FDF4',
  },
  payIconCircle: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: colors.lightTeal,
    justifyContent: 'center',
    alignItems: 'center',
  },
  payTitle: {
    fontSize: 11.5,
    fontWeight: '800',
    color: colors.secondary,
  },
  paySub: {
    fontSize: 9.5,
    color: colors.textSecondary,
    marginTop: 1,
  },

  // INVOICE
  invoiceCard: {
    backgroundColor: colors.white,
    borderRadius: 10,
    padding: 10,
    borderWidth: 1,
    borderColor: colors.border,
    marginTop: 4,
  },
  invoiceTitle: {
    fontSize: 12,
    fontWeight: '900',
    color: colors.secondary,
    marginBottom: 6,
  },
  invoiceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 5,
  },
  invoiceLabel: {
    fontSize: 10.5,
    color: colors.textSecondary,
  },
  invoiceVal: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.secondary,
  },
  invoiceDivider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: 6,
  },
  invoiceTotalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  invoiceTotalLabel: {
    fontSize: 12.5,
    fontWeight: '900',
    color: colors.secondary,
  },
  invoiceTotalSub: {
    fontSize: 9,
    color: colors.textMuted,
  },
  invoiceTotalVal: {
    fontSize: 16,
    fontWeight: '900',
    color: colors.primary,
  },

  // BOTTOM STICKY BAR
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: colors.white,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.08,
    shadowRadius: 5,
  },
  bottomBarInner: {
    maxWidth: 1320,
    width: '100%',
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  bottomBarLabel: {
    fontSize: 9.5,
    fontWeight: '700',
    color: colors.textSecondary,
  },
  bottomBarPrice: {
    fontSize: 16,
    fontWeight: '900',
    color: colors.primary,
  },
  bottomBarDealText: {
    fontSize: 9.5,
    fontWeight: '800',
    color: '#059669',
  },
  bottomBarSubText: {
    fontSize: 9.5,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  bottomCtaBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary,
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 8,
    gap: 6,
  },
  bottomCtaText: {
    fontSize: 12.5,
    fontWeight: '800',
    color: '#FFFFFF',
  },

  // MODAL
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    backgroundColor: colors.white,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 16,
    paddingBottom: 28,
    maxWidth: 550,
    width: '100%',
    alignSelf: 'center',
  },
  modalIconBox: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: colors.freshGreen,
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'center',
    marginBottom: 6,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '900',
    color: colors.secondary,
    textAlign: 'center',
  },
  modalSub: {
    fontSize: 11,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: 2,
    marginBottom: 10,
  },
  modalSummary: {
    backgroundColor: colors.background,
    borderRadius: 8,
    padding: 10,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 4,
    marginBottom: 10,
  },
  modalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  modalRowLabel: {
    fontSize: 10,
    color: colors.textSecondary,
  },
  modalRowVal: {
    fontSize: 10.5,
    fontWeight: '700',
    color: colors.secondary,
  },
  modalDoneBtn: {
    backgroundColor: colors.primary,
    paddingVertical: 11,
    borderRadius: 8,
    alignItems: 'center',
  },
  modalDoneBtnText: {
    fontSize: 12.5,
    fontWeight: '800',
    color: '#FFFFFF',
  },

  // UNIFIED REFERENCE DESIGN STYLES
  confidentialBadgePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#F0FDFA',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    alignSelf: 'flex-start',
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#CCFBF1',
  },
  confidentialBadgePillText: {
    fontSize: 9.5,
    fontWeight: '800',
    color: '#0D9488',
    letterSpacing: 0.5,
  },
  privacyAssuranceBoxUnified: {
    flexDirection: 'row',
    gap: 8,
    backgroundColor: '#ECFDF5',
    padding: 12,
    borderRadius: 12,
    marginTop: 14,
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  privacyAssuranceTextUnified: {
    fontSize: 11,
    color: '#065F46',
    flex: 1,
    lineHeight: 16,
  },
});

export default NurseBookingScreen;
