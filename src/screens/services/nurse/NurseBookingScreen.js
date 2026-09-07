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
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Location from 'expo-location';
import colors from '../../../theme/colors';
import {
  nursingDurations,
  nursingPurposes,
  certifiedNurses,
} from '../../../data/nurseCareData';

const generateBookingDates = () => {
  const dates = [];
  const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  for (let i = 0; i < 14; i++) {
    const d = new Date();
    d.setDate(d.getDate() + i);
    dates.push({
      id: `date-${i}`,
      dateStr: d.toISOString().split('T')[0],
      dayName: i === 0 ? 'Today' : i === 1 ? 'Tmrw' : daysOfWeek[d.getDay()],
      dayNum: d.getDate(),
      month: months[d.getMonth()],
      fullText: `${daysOfWeek[d.getDay()]}, ${d.getDate()} ${months[d.getMonth()]}`,
      isToday: i === 0,
    });
  }
  return dates;
};

const NURSE_TIME_SLOTS = {
  hourly: [
    { id: 'h-urg', label: '⚡ Urgent (Within 45-60 Mins)', desc: 'Immediate arrival for emergencies', period: 'Urgent', icon: 'flash' },
    { id: 'h-1', label: '06:30 AM - 07:30 AM', desc: 'Early Morning Vitals & Meds', period: 'Morning', icon: 'sunny' },
    { id: 'h-2', label: '08:00 AM - 09:30 AM', desc: 'Morning Dressing & Injections', period: 'Morning', icon: 'sunny' },
    { id: 'h-3', label: '10:00 AM - 11:30 AM', desc: 'Wound Care & Physiotherapy', period: 'Morning', icon: 'sunny' },
    { id: 'h-4', label: '12:30 PM - 01:30 PM', desc: 'Lunch & Tube Feeding', period: 'Afternoon', icon: 'restaurant' },
    { id: 'h-5', label: '03:30 PM - 05:00 PM', desc: 'Post-Op Drip & Medication', period: 'Afternoon', icon: 'medkit' },
    { id: 'h-6', label: '06:00 PM - 07:30 PM', desc: 'Evening Vitals & Catheter Care', period: 'Evening', icon: 'partly-sunny' },
    { id: 'h-7', label: '08:30 PM - 09:30 PM', desc: 'Night Medication & Sleep Support', period: 'Night', icon: 'moon' },
  ],
  shift: [
    { id: 's-1', label: '08:00 AM - 08:00 PM (12-Hr Day Shift)', desc: 'Full daytime nursing & monitoring', period: 'Day Shift', icon: 'sunny' },
    { id: 's-2', label: '08:00 PM - 08:00 AM (12-Hr Night Shift)', desc: 'Overnight patient monitoring & care', period: 'Night Shift', icon: 'moon' },
    { id: 's-3', label: '06:00 AM - 06:00 PM (12-Hr Early Shift)', desc: 'Early morning to early evening', period: 'Day Shift', icon: 'time' },
    { id: 's-4', label: '06:00 PM - 06:00 AM (12-Hr Evening Shift)', desc: 'Evening to early morning bedside care', period: 'Night Shift', icon: 'moon' },
  ],
  daily: [
    { id: 'd-1', label: 'Starts 08:00 AM (24x7 Round-The-Clock)', desc: 'Continuous 24-hour bedside ICU/Post-Op care', period: '24x7 Care', icon: 'infinite' },
    { id: 'd-2', label: 'Starts 08:00 PM (24x7 Round-The-Clock)', desc: 'Begins from tonight for continuous care', period: '24x7 Care', icon: 'moon' },
    { id: 'd-3', label: '⚡ Urgent Start (Within 60 Mins for 24x7)', desc: 'Immediate emergency start by certified nurse', period: 'Urgent 24x7', icon: 'flash' },
  ],
};

const NurseBookingScreen = ({ navigation }) => {
  // Step 1: Duration
  const [selectedDurationId, setSelectedDurationId] = useState('hourly-1');

  // Step 2: Purpose & Description
  const [selectedPurposes, setSelectedPurposes] = useState(['Post-Surgery Recovery']);
  const [careDescription, setCareDescription] = useState('');

  // Step 3: Date & Time Schedule Selection
  const bookingDates = useMemo(() => generateBookingDates(), []);
  const [selectedDate, setSelectedDate] = useState(bookingDates[0]);
  const [selectedTimeSlot, setSelectedTimeSlot] = useState(NURSE_TIME_SLOTS.hourly[0]);
  const [customTimeNote, setCustomTimeNote] = useState('');
  const [timeFilterPeriod, setTimeFilterPeriod] = useState('ALL'); // 'ALL' | 'Morning' | 'Afternoon' | 'Night'

  // Step 4: Patient Details & Family Members
  const [familyList, setFamilyList] = useState([]);
  const [selectedFamilyId, setSelectedFamilyId] = useState('self');
  const [patientName, setPatientName] = useState('Ramesh Kumar');
  const [patientRelation, setPatientRelation] = useState('Self');
  const [patientAge, setPatientAge] = useState('32');
  const [patientGender, setPatientGender] = useState('Male');
  const [patientPhone, setPatientPhone] = useState('9876543210');
  const [patientAddress, setPatientAddress] = useState('House #142, 5th Cross, Kuvempunagar, Mysore');
  const [locationLoading, setLocationLoading] = useState(false);

  // Step 5: Payment
  const [paymentMethod, setPaymentMethod] = useState('WALLET'); // 'WALLET' | 'UPI' | 'Card' | 'PayOnArrival'
  const [walletBalance, setWalletBalance] = useState(1250);
  const [isProcessing, setIsProcessing] = useState(false);

  // Success Confirmation Modal
  const [successModalVisible, setSuccessModalVisible] = useState(false);
  const [confirmedBooking, setConfirmedBooking] = useState(null);

  useEffect(() => {
    loadSavedData();
  }, []);

  // Update selected time slot whenever duration type changes
  useEffect(() => {
    const dur = nursingDurations.find((d) => d.id === selectedDurationId);
    if (dur) {
      if (dur.type === 'hourly') {
        setSelectedTimeSlot(NURSE_TIME_SLOTS.hourly[0]);
      } else if (dur.type === 'shift') {
        setSelectedTimeSlot(NURSE_TIME_SLOTS.shift[0]);
      } else {
        setSelectedTimeSlot(NURSE_TIME_SLOTS.daily[0]);
      }
    }
  }, [selectedDurationId]);

  const loadSavedData = async () => {
    try {
      // 1. Get primary user info
      const storedPrimary = await AsyncStorage.getItem('@unnathi_primary_user');
      const storedName = await AsyncStorage.getItem('userName');
      let primaryName = 'Ramesh Kumar';
      let primaryAge = '32';
      let primaryGender = 'Male';
      let primaryPhone = '9876543210';

      if (storedPrimary) {
        try {
          const p = JSON.parse(storedPrimary);
          if (p?.name) primaryName = p.name;
          if (p?.age) primaryAge = p.age;
          if (p?.gender) primaryGender = p.gender;
          if (p?.phone) primaryPhone = p.phone;
        } catch (e) {}
      } else if (storedName && storedName.trim()) {
        primaryName = storedName.trim();
      }

      setPatientName(primaryName);
      setPatientAge(primaryAge);
      setPatientGender(primaryGender);
      setPatientPhone(primaryPhone);

      // 2. Load address
      const savedLoc = await AsyncStorage.getItem('@unnathi_user_location');
      if (savedLoc && savedLoc.trim()) {
        setPatientAddress(savedLoc.trim());
      }

      // 3. Load wallet balance
      const storedWallet = await AsyncStorage.getItem('@unnathi_wallet_balance');
      if (storedWallet !== null) {
        setWalletBalance(parseInt(storedWallet, 10) || 0);
      } else {
        await AsyncStorage.setItem('@unnathi_wallet_balance', '1250');
        setWalletBalance(1250);
      }

      // 4. Load family members list
      const savedFam = await AsyncStorage.getItem('@unnathi_family_members');
      let loadedFam = [];
      if (savedFam) {
        try {
          const parsed = JSON.parse(savedFam);
          if (Array.isArray(parsed) && parsed.length > 0) {
            loadedFam = parsed;
          }
        } catch (e) {}
      }

      if (!loadedFam || loadedFam.length === 0) {
        loadedFam = [
          { id: 'self', name: `${primaryName} (Self)`, relation: 'Self', age: primaryAge, gender: primaryGender, isPrimary: true },
        ];
      }
      setFamilyList(loadedFam);
    } catch (e) {
      console.log('Error loading nurse booking saved data:', e);
    }
  };

  const handleSelectFamilyMember = (member) => {
    setSelectedFamilyId(member.id);
    const cleanName = member.name.replace(/\s*\(.*?\)\s*/g, '').trim();
    setPatientName(cleanName);
    setPatientRelation(member.relation || 'Self');
    if (member.age) setPatientAge(String(member.age).replace(/\D/g, '') || '32');
    if (member.gender) setPatientGender(member.gender);
  };

  const detectGPSLocation = async () => {
    try {
      setLocationLoading(true);
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setLocationLoading(false);
        Alert.alert('Permission Denied', 'Location permission is required to detect your address.');
        return;
      }
      const position = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      const reverse = await Location.reverseGeocodeAsync({
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
      });
      if (reverse && reverse.length > 0) {
        const item = reverse[0];
        const formatted = `${item.name || ''} ${item.street || ''}, ${item.subregion || item.district || ''}, ${item.city || 'Mysore'} - ${item.postalCode || '570023'}`.trim();
        setPatientAddress(formatted);
      }
    } catch (e) {
      console.log('GPS error in nurse booking:', e);
    } finally {
      setLocationLoading(false);
    }
  };

  const selectedDuration = useMemo(() => {
    return (
      nursingDurations.find((d) => d.id === selectedDurationId) ||
      nursingDurations[0]
    );
  }, [selectedDurationId]);

  // LIVE PRICE CALCULATION
  const priceCalculation = useMemo(() => {
    const base = selectedDuration.basePrice;
    const gst = Math.round(base * 0.18);
    const total = base + gst;

    return {
      base,
      gst,
      total,
      totalFormatted: `₹${total.toLocaleString('en-IN')}`,
      baseFormatted: `₹${base.toLocaleString('en-IN')}`,
      gstFormatted: `₹${gst.toLocaleString('en-IN')}`,
    };
  }, [selectedDuration]);

  // Available time slots based on selected duration
  const availableTimeSlots = useMemo(() => {
    const type = selectedDuration.type;
    const rawSlots = NURSE_TIME_SLOTS[type] || NURSE_TIME_SLOTS.hourly;

    if (timeFilterPeriod === 'ALL') return rawSlots;
    return rawSlots.filter(
      (s) => s.period.toLowerCase().includes(timeFilterPeriod.toLowerCase()) || s.type === 'urgent'
    );
  }, [selectedDuration, timeFilterPeriod]);

  const togglePurpose = (purpose) => {
    if (selectedPurposes.includes(purpose)) {
      if (selectedPurposes.length === 1) {
        Alert.alert('Required', 'Please select at least 1 nursing care requirement.');
        return;
      }
      setSelectedPurposes(selectedPurposes.filter((p) => p !== purpose));
    } else {
      setSelectedPurposes([...selectedPurposes, purpose]);
    }
  };

  const handleConfirmAndPay = async () => {
    if (!patientName.trim()) {
      Alert.alert('Patient Name Required', 'Please enter patient full name.');
      return;
    }
    if (!patientPhone.trim() || patientPhone.length < 10) {
      Alert.alert('Valid Mobile Number Required', 'Please enter a 10-digit contact phone number.');
      return;
    }
    if (!patientAddress.trim()) {
      Alert.alert('Address Required', 'Please enter the home visit address for the nurse.');
      return;
    }

    // Wallet balance validation & deduction
    if (paymentMethod === 'WALLET') {
      if (walletBalance < priceCalculation.total) {
        Alert.alert(
          'Insufficient MediUnify Wallet Balance',
          `Your wallet balance is ₹${walletBalance}, but this booking requires ${priceCalculation.totalFormatted}.\n\nPlease top up your wallet or choose another payment option.`,
          [
            { text: 'Top Up Wallet', onPress: () => navigation.navigate('Wallet') },
            { text: 'OK', style: 'cancel' }
          ]
        );
        return;
      }

      // Deduct from wallet
      const newBal = walletBalance - priceCalculation.total;
      await AsyncStorage.setItem('@unnathi_wallet_balance', String(newBal));
      setWalletBalance(newBal);

      // Record wallet transaction
      try {
        const existingTxJson = await AsyncStorage.getItem('@unnathi_wallet_transactions');
        const existingTx = existingTxJson ? JSON.parse(existingTxJson) : [];
        const newTx = {
          id: `tx-nurse-${Date.now()}`,
          title: `Home Nurse: ${selectedDuration.label}`,
          subtitle: `Patient: ${patientName} (${selectedDate.dayName}, ${selectedTimeSlot.label})`,
          amount: `-${priceCalculation.totalFormatted}`,
          type: 'debit',
          date: 'Just now',
          icon: 'medkit-outline',
        };
        await AsyncStorage.setItem('@unnathi_wallet_transactions', JSON.stringify([newTx, ...existingTx]));
      } catch (eTx) {
        console.log('Error recording wallet transaction:', eTx);
      }
    }

    setIsProcessing(true);

    setTimeout(async () => {
      try {
        const bookingId = `NURSE-${Math.floor(100000 + Math.random() * 900000)}`;
        const assignedNurse = certifiedNurses[Math.floor(Math.random() * certifiedNurses.length)];

        const bookingRecord = {
          id: bookingId,
          bookingId,
          serviceName: `Home Nurse Care (${selectedDuration.durationText})`,
          duration: selectedDuration.durationText,
          purposes: selectedPurposes,
          description: careDescription.trim() || 'General post-op & vital monitoring support.',
          patient: {
            name: patientName,
            relation: patientRelation,
            age: patientAge,
            gender: patientGender,
            phone: patientPhone,
            address: patientAddress,
          },
          schedule: {
            startDate: selectedDate.fullText,
            preferredTime: selectedTimeSlot.label,
            customTimeNote: customTimeNote.trim() || null,
          },
          assignedNurse: {
            name: assignedNurse.name,
            qualification: assignedNurse.qualification,
            experience: assignedNurse.experience,
            phone: '+91 98765 12345',
          },
          payment: {
            method:
              paymentMethod === 'WALLET'
                ? 'MediUnify Health Wallet'
                : paymentMethod === 'PayOnArrival'
                ? 'Pay on Nurse Arrival'
                : paymentMethod === 'UPI'
                ? 'Instant UPI'
                : 'Credit/Debit Card',
            amount: priceCalculation.totalFormatted,
            status:
              paymentMethod === 'WALLET'
                ? 'Paid via MediUnify Wallet'
                : paymentMethod === 'PayOnArrival'
                ? 'Pending (Pay on Arrival)'
                : 'Paid Online (Verified)',
          },
          bookedAt: new Date().toLocaleString('en-IN'),
          status: 'Confirmed & Nurse Assigned',
        };

        // 1. Save to @unnathi_nurse_bookings
        const existing = await AsyncStorage.getItem('@unnathi_nurse_bookings');
        const list = existing ? JSON.parse(existing) : [];
        list.unshift(bookingRecord);
        await AsyncStorage.setItem('@unnathi_nurse_bookings', JSON.stringify(list));

        // 2. Save to @unnathi_appointments
        const existingAppts = await AsyncStorage.getItem('@unnathi_appointments');
        const apptsList = existingAppts ? JSON.parse(existingAppts) : [];
        const appointmentObj = {
          id: bookingId,
          tokenNumber: `NR-${Math.floor(10 + Math.random() * 90)}`,
          type: 'Home Nursing Care',
          doctor: {
            name: assignedNurse.name,
            specialty: `Certified Nurse (${assignedNurse.qualification})`,
            clinicName: 'Unnathi Home Care Services',
          },
          day: selectedDate.dayName,
          date: selectedDate.fullText,
          time: selectedTimeSlot.label,
          status: 'Confirmed',
          paidAmount: priceCalculation.total,
          paymentStatus:
            paymentMethod === 'WALLET'
              ? 'Paid via MediUnify Wallet'
              : paymentMethod === 'PayOnArrival'
              ? 'Pay on Arrival'
              : 'Paid Online',
          patient: {
            name: patientName,
            phone: patientPhone,
          },
        };
        apptsList.unshift(appointmentObj);
        await AsyncStorage.setItem('@unnathi_appointments', JSON.stringify(apptsList));

        setIsProcessing(false);
        setConfirmedBooking(bookingRecord);
        setSuccessModalVisible(true);
      } catch (e) {
        setIsProcessing(false);
        console.log('Error saving nurse booking:', e);
        Alert.alert('Booking Error', 'Could not complete booking. Please try again.');
      }
    }, 1000);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* ==================================================
          APP BAR
      ================================================== */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
          activeOpacity={0.8}
        >
          <Ionicons name="arrow-back" size={20} color={colors.secondary} />
        </TouchableOpacity>

        <View style={styles.headerCenter}>
          <Text style={styles.headerBadge}>VERIFIED HOME HEALTHCARE</Text>
          <Text style={styles.headerTitle}>Book Certified Nurse</Text>
        </View>

        <TouchableOpacity
          style={styles.helplineBtn}
          activeOpacity={0.85}
          onPress={() => Linking.openURL('tel:+918212568888')}
        >
          <Ionicons name="call" size={15} color="#FFFFFF" />
          <Text style={styles.helplineBtnText}>24x7 Help</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* ==================================================
            LUXURY HERO BANNER
        ================================================== */}
        <View style={styles.heroCard}>
          <View style={styles.heroOrb1} />
          <View style={styles.heroOrb2} />

          <View style={styles.heroStatusRow}>
            <View style={styles.livePulseDot} />
            <Text style={styles.heroStatusText}>14 INC Certified Nurses Active in Mysore</Text>
            <View style={styles.heroSpeedBadge}>
              <Ionicons name="flash" size={10} color="#FDE047" />
              <Text style={styles.heroSpeedText}>45m Arrival</Text>
            </View>
          </View>

          <Text style={styles.heroHeading}>Hospital-Grade Nursing at Home</Text>
          <Text style={styles.heroSubHeading}>
            Post-op surgical recovery, IV drip infusion, wound care dressing, vitals monitoring & bedridden patient care.
          </Text>

          <View style={styles.heroBadgesRow}>
            <View style={styles.heroTag}>
              <Ionicons name="shield-checkmark" size={12} color="#2DD4BF" />
              <Text style={styles.heroTagText}>KSNC / INC Registered</Text>
            </View>
            <View style={styles.heroTag}>
              <Ionicons name="medkit" size={12} color="#2DD4BF" />
              <Text style={styles.heroTagText}>Sterile Kit Included</Text>
            </View>
            <View style={styles.heroTag}>
              <Ionicons name="document-text" size={12} color="#2DD4BF" />
              <Text style={styles.heroTagText}>Doctor Rx Sync</Text>
            </View>
          </View>
        </View>

        {/* ==================================================
            SECTION 1: SELECT CARE DURATION
        ================================================== */}
        <View style={styles.cardSection}>
          <View style={styles.cardHeaderRow}>
            <View style={styles.stepNumPill}>
              <Text style={styles.stepNumText}>1</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.cardTitle}>Choose Care Duration</Text>
              <Text style={styles.cardSubTitle}>Select hourly visit, 12-hour shift, or 24x7 multi-day care</Text>
            </View>
          </View>

          <View style={styles.durationsGrid}>
            {nursingDurations.map((dur) => {
              const isSelected = selectedDurationId === dur.id;
              return (
                <TouchableOpacity
                  key={dur.id}
                  style={[
                    styles.durationItem,
                    isSelected && styles.durationItemActive,
                  ]}
                  activeOpacity={0.88}
                  onPress={() => setSelectedDurationId(dur.id)}
                >
                  <View style={styles.durationHeader}>
                    <View
                      style={[
                        styles.durBadge,
                        isSelected && styles.durBadgeActive,
                      ]}
                    >
                      <Text
                        style={[
                          styles.durBadgeText,
                          isSelected && styles.durBadgeTextActive,
                        ]}
                      >
                        {dur.badge}
                      </Text>
                    </View>
                    <View style={[styles.durRadio, isSelected && styles.durRadioActive]}>
                      {isSelected && <View style={styles.durRadioInner} />}
                    </View>
                  </View>

                  <Text
                    style={[
                      styles.durPrice,
                      isSelected && styles.durPriceActive,
                    ]}
                  >
                    ₹{dur.basePrice.toLocaleString('en-IN')}
                  </Text>

                  <Text
                    style={[
                      styles.durLabel,
                      isSelected && styles.durLabelActive,
                    ]}
                  >
                    {dur.label}
                  </Text>
                  <Text
                    style={[
                      styles.durDesc,
                      isSelected && styles.durDescActive,
                    ]}
                    numberOfLines={2}
                  >
                    {dur.description}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* ==================================================
            SECTION 2: NURSING PURPOSE & CARE REQUIREMENTS
        ================================================== */}
        <View style={styles.cardSection}>
          <View style={styles.cardHeaderRow}>
            <View style={styles.stepNumPill}>
              <Text style={styles.stepNumText}>2</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.cardTitle}>Nursing Requirements</Text>
              <Text style={styles.cardSubTitle}>Select the primary procedures needed</Text>
            </View>
          </View>

          <View style={styles.purposesWrap}>
            {nursingPurposes.map((p) => {
              const isSelected = selectedPurposes.includes(p.label);
              return (
                <TouchableOpacity
                  key={p.id}
                  style={[
                    styles.purposeChip,
                    isSelected && styles.purposeChipActive,
                  ]}
                  activeOpacity={0.8}
                  onPress={() => togglePurpose(p.label)}
                >
                  <Ionicons
                    name={isSelected ? 'checkmark-circle' : p.icon}
                    size={14}
                    color={isSelected ? '#FFFFFF' : '#0F766E'}
                  />
                  <Text
                    style={[
                      styles.purposeChipText,
                      isSelected && styles.purposeChipTextActive,
                    ]}
                  >
                    {p.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <Text style={styles.inputHeading}>Detailed Instructions for Nurse (Optional):</Text>
          <TextInput
            style={styles.textArea}
            multiline
            numberOfLines={3}
            placeholder="e.g. Post knee surgery. Needs IV drip, aseptic wound dressing and vital signs chart..."
            placeholderTextColor="#94A3B8"
            value={careDescription}
            onChangeText={setCareDescription}
          />
        </View>

        {/* ==================================================
            SECTION 3: CARE SCHEDULE & SHIFT TIMING
        ================================================== */}
        <View style={styles.cardSection}>
          <View style={styles.cardHeaderRow}>
            <View style={styles.stepNumPill}>
              <Text style={styles.stepNumText}>3</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.cardTitle}>Date & Preferred Timing</Text>
              <Text style={styles.cardSubTitle}>Choose nurse arrival day and shift time</Text>
            </View>
          </View>

          {/* 1. START DATE SELECTION */}
          <View style={styles.subHeaderRow}>
            <Ionicons name="calendar-outline" size={15} color={colors.primary} />
            <Text style={styles.subTitleText}>1. Select Starting Day:</Text>
            <View style={styles.selectedDayBadge}>
              <Text style={styles.selectedDayBadgeText}>{selectedDate.fullText}</Text>
            </View>
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.datesScroll}
          >
            {bookingDates.map((d) => {
              const isSelected = selectedDate.id === d.id;
              return (
                <TouchableOpacity
                  key={d.id}
                  style={[
                    styles.datePill,
                    isSelected && styles.datePillActive,
                  ]}
                  onPress={() => setSelectedDate(d)}
                  activeOpacity={0.8}
                >
                  <Text
                    style={[
                      styles.dateDay,
                      isSelected && styles.dateDayActive,
                    ]}
                  >
                    {d.dayName}
                  </Text>
                  <Text
                    style={[
                      styles.dateNum,
                      isSelected && styles.dateNumActive,
                    ]}
                  >
                    {d.dayNum}
                  </Text>
                  <Text
                    style={[
                      styles.dateMonth,
                      isSelected && styles.dateMonthActive,
                    ]}
                  >
                    {d.month}
                  </Text>
                  {d.isToday && (
                    <View style={styles.todayPillBadge}>
                      <Text style={styles.todayPillBadgeText}>NOW</Text>
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          {/* 2. SHIFT & TIME SLOT SELECTION */}
          <View style={[styles.subHeaderRow, { marginTop: 16 }]}>
            <Ionicons name="time-outline" size={15} color={colors.secondary} />
            <Text style={styles.subTitleText}>2. Select Arrival Shift / Time Slot:</Text>
          </View>

          <View style={styles.timeFilterRow}>
            {['ALL', 'Morning', 'Afternoon', 'Night'].map((tab) => (
              <TouchableOpacity
                key={tab}
                style={[
                  styles.timeTab,
                  timeFilterPeriod === tab && styles.timeTabActive,
                ]}
                onPress={() => setTimeFilterPeriod(tab)}
                activeOpacity={0.8}
              >
                <Text
                  style={[
                    styles.timeTabText,
                    timeFilterPeriod === tab && styles.timeTabTextActive,
                  ]}
                >
                  {tab === 'ALL' ? 'All Slots' : tab}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <View style={styles.slotsGrid}>
            {availableTimeSlots.map((slot) => {
              const isSelected = selectedTimeSlot.id === slot.id;
              const isUrgent = slot.type === 'urgent';
              return (
                <TouchableOpacity
                  key={slot.id}
                  style={[
                    styles.slotCard,
                    isSelected && styles.slotCardActive,
                    isUrgent && styles.slotCardUrgent,
                    isUrgent && isSelected && styles.slotCardUrgentActive,
                  ]}
                  onPress={() => setSelectedTimeSlot(slot)}
                  activeOpacity={0.85}
                >
                  <View style={styles.slotLeft}>
                    <View
                      style={[
                        styles.slotIconBox,
                        isSelected && styles.slotIconBoxActive,
                        isUrgent && { backgroundColor: '#FEE2E2' },
                      ]}
                    >
                      <Ionicons
                        name={slot.icon || 'time'}
                        size={15}
                        color={
                          isSelected
                            ? '#FFFFFF'
                            : isUrgent
                            ? '#DC2626'
                            : '#0F766E'
                        }
                      />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text
                        style={[
                          styles.slotLabel,
                          isSelected && styles.slotLabelActive,
                          isUrgent && { color: '#DC2626' },
                        ]}
                      >
                        {slot.label}
                      </Text>
                      <Text
                        style={[
                          styles.slotDesc,
                          isSelected && styles.slotDescActive,
                        ]}
                      >
                        {slot.desc}
                      </Text>
                    </View>
                  </View>

                  <View
                    style={[
                      styles.slotRadio,
                      isSelected && styles.slotRadioActive,
                      isUrgent && isSelected && { borderColor: '#DC2626' },
                    ]}
                  >
                    {isSelected && (
                      <View
                        style={[
                          styles.slotRadioInner,
                          isUrgent && { backgroundColor: '#DC2626' },
                        ]}
                      />
                    )}
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* 3. DOCTOR SPECIFIC TIMING NOTE */}
          <Text style={[styles.inputHeading, { marginTop: 12 }]}>
            Special Timing Note (e.g. Doctor's Exact Hour):
          </Text>
          <TextInput
            style={styles.singleInput}
            placeholder="e.g. Administer injection strictly at 2:30 PM"
            placeholderTextColor="#94A3B8"
            value={customTimeNote}
            onChangeText={setCustomTimeNote}
          />
        </View>

        {/* ==================================================
            SECTION 4: PATIENT DETAILS & ADDRESS
        ================================================== */}
        <View style={styles.cardSection}>
          <View style={styles.cardHeaderRow}>
            <View style={styles.stepNumPill}>
              <Text style={styles.stepNumText}>4</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.cardTitle}>Patient & Home Address</Text>
              <Text style={styles.cardSubTitle}>Select family member or enter visit details</Text>
            </View>
          </View>

          {/* 1-TAP FAMILY PROFILE SELECTOR */}
          <Text style={styles.inputHeading}>Choose Family Member Profile:</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.familyChipsWrap}
          >
            {familyList.map((m) => {
              const isSelected = selectedFamilyId === m.id;
              return (
                <TouchableOpacity
                  key={m.id}
                  style={[
                    styles.familyChip,
                    isSelected && styles.familyChipActive,
                  ]}
                  onPress={() => handleSelectFamilyMember(m)}
                  activeOpacity={0.8}
                >
                  <Ionicons
                    name="person"
                    size={12}
                    color={isSelected ? '#FFFFFF' : '#0F766E'}
                  />
                  <Text
                    style={[
                      styles.familyChipText,
                      isSelected && styles.familyChipTextActive,
                    ]}
                  >
                    {m.name}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          <Text style={styles.inputHeading}>Patient Full Name:</Text>
          <TextInput
            style={styles.singleInput}
            value={patientName}
            onChangeText={setPatientName}
            placeholder="Patient full name"
          />

          <View style={styles.inputRow}>
            <View style={{ flex: 1, marginRight: 8 }}>
              <Text style={styles.inputHeading}>Relation:</Text>
              <TextInput
                style={styles.singleInput}
                value={patientRelation}
                onChangeText={setPatientRelation}
                placeholder="Self / Father"
              />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.inputHeading}>Age & Gender:</Text>
              <TextInput
                style={styles.singleInput}
                value={`${patientAge} Yrs, ${patientGender}`}
                onChangeText={(text) => {
                  const parts = text.split(',');
                  setPatientAge(parts[0] || '32');
                  if (parts[1]) setPatientGender(parts[1].trim());
                }}
                placeholder="Age, Gender"
              />
            </View>
          </View>

          <Text style={styles.inputHeading}>Contact Phone Number (10 Digits):</Text>
          <TextInput
            style={styles.singleInput}
            keyboardType="phone-pad"
            maxLength={10}
            value={patientPhone}
            onChangeText={setPatientPhone}
            placeholder="10-digit mobile number"
          />

          <View style={styles.addressHeaderRow}>
            <Text style={styles.inputHeading}>Home Visit Address & Landmark:</Text>
            <TouchableOpacity
              style={styles.gpsBtn}
              onPress={detectGPSLocation}
              activeOpacity={0.8}
            >
              {locationLoading ? (
                <ActivityIndicator size="small" color="#0F766E" />
              ) : (
                <>
                  <Ionicons name="navigate" size={12} color="#0F766E" />
                  <Text style={styles.gpsBtnText}>GPS Detect</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
          <TextInput
            style={[styles.singleInput, { height: 55 }]}
            multiline
            value={patientAddress}
            onChangeText={setPatientAddress}
            placeholder="Street address, flat number, landmark, Mysore"
          />
        </View>

        {/* ==================================================
            SECTION 5: PAYMENT & CHECKOUT
        ================================================== */}
        <View style={styles.cardSection}>
          <View style={styles.cardHeaderRow}>
            <View style={styles.stepNumPill}>
              <Text style={styles.stepNumText}>5</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.cardTitle}>Payment Method</Text>
              <Text style={styles.cardSubTitle}>1-Click MediUnify Wallet, UPI, or Pay on Arrival</Text>
            </View>
          </View>

          {/* 1. MEDIUNIFY HEALTH WALLET */}
          <TouchableOpacity
            style={[
              styles.payCard,
              paymentMethod === 'WALLET' && styles.payCardWalletActive,
            ]}
            activeOpacity={0.85}
            onPress={() => setPaymentMethod('WALLET')}
          >
            <View style={styles.walletIconCircle}>
              <Ionicons name="wallet" size={18} color="#0F766E" />
            </View>
            <View style={{ flex: 1, marginLeft: 10 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Text style={styles.payCardTitle}>MediUnify Health Wallet</Text>
                <View style={styles.fast1ClickBadge}>
                  <Ionicons name="flash" size={8} color="#FFFFFF" />
                  <Text style={styles.fast1ClickText}>1-CLICK</Text>
                </View>
              </View>
              <Text
                style={[
                  styles.walletBalSub,
                  {
                    color:
                      walletBalance >= priceCalculation.total
                        ? '#059669'
                        : '#DC2626',
                  },
                ]}
              >
                Available: ₹{walletBalance}{' '}
                {walletBalance < priceCalculation.total
                  ? '(Insufficient Balance)'
                  : '✓ Instant Checkout'}
              </Text>
            </View>
            {paymentMethod === 'WALLET' && (
              <Ionicons name="checkmark-circle" size={18} color="#059669" />
            )}
          </TouchableOpacity>

          {/* TOP UP BANNER IF WALLET INSUFFICIENT */}
          {paymentMethod === 'WALLET' && walletBalance < priceCalculation.total && (
            <View style={styles.topUpCard}>
              <View style={{ flex: 1 }}>
                <Text style={styles.topUpTitle}>Add money to complete booking</Text>
                <Text style={styles.topUpSub}>
                  Need ₹{priceCalculation.total - walletBalance} more in your wallet
                </Text>
              </View>
              <TouchableOpacity
                style={styles.topUpBtn}
                onPress={() => navigation.navigate('Wallet')}
                activeOpacity={0.8}
              >
                <Text style={styles.topUpBtnText}>+ Top Up</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* OTHER PAYMENT CHOICES */}
          {[
            { id: 'UPI', label: 'Instant UPI (Google Pay / PhonePe / Paytm)', icon: 'phone-portrait-outline', sub: 'Instant QR / UPI verification' },
            { id: 'Card', label: 'Debit / Credit Card & NetBanking', icon: 'card-outline', sub: 'All major banks supported' },
            { id: 'PayOnArrival', label: 'Pay on Nurse Arrival (Cash / UPI)', icon: 'cash-outline', sub: 'Pay directly after the nurse arrives' },
          ].map((method) => {
            const isSelected = paymentMethod === method.id;
            return (
              <TouchableOpacity
                key={method.id}
                style={[
                  styles.payCard,
                  isSelected && styles.payCardActive,
                ]}
                activeOpacity={0.85}
                onPress={() => setPaymentMethod(method.id)}
              >
                <View style={styles.payIconCircle}>
                  <Ionicons
                    name={method.icon}
                    size={17}
                    color={isSelected ? '#0F766E' : '#64748B'}
                  />
                </View>
                <View style={{ flex: 1, marginLeft: 10 }}>
                  <Text
                    style={[
                      styles.payCardTitle,
                      isSelected && styles.payCardTitleActive,
                    ]}
                  >
                    {method.label}
                  </Text>
                  <Text style={styles.payCardSub}>{method.sub}</Text>
                </View>
                {isSelected && (
                  <Ionicons name="checkmark-circle" size={18} color="#0F766E" />
                )}
              </TouchableOpacity>
            );
          })}

          {/* PRICE BREAKDOWN INVOICE */}
          <View style={styles.invoiceCard}>
            <Text style={styles.invoiceTitle}>Invoice Summary</Text>
            <View style={styles.invoiceRow}>
              <Text style={styles.invoiceLabel}>{selectedDuration.label} Base Care:</Text>
              <Text style={styles.invoiceValue}>{priceCalculation.baseFormatted}</Text>
            </View>
            <View style={styles.invoiceRow}>
              <Text style={styles.invoiceLabel}>Sterile Medical PPE Kit & Travel:</Text>
              <Text style={[styles.invoiceValue, { color: '#059669', fontWeight: '800' }]}>
                FREE
              </Text>
            </View>
            <View style={styles.invoiceRow}>
              <Text style={styles.invoiceLabel}>GST & Service Tax (18%):</Text>
              <Text style={styles.invoiceValue}>{priceCalculation.gstFormatted}</Text>
            </View>
            <View style={styles.invoiceDivider} />
            <View style={styles.invoiceTotalRow}>
              <View>
                <Text style={styles.invoiceTotalLabel}>Net Amount Payable</Text>
                <Text style={styles.invoiceTaxNote}>All taxes & safety kit included</Text>
              </View>
              <Text style={styles.invoiceTotalAmount}>{priceCalculation.totalFormatted}</Text>
            </View>
          </View>
        </View>

        <View style={{ height: 90 }} />
      </ScrollView>

      {/* ==================================================
          STICKY BOTTOM BAR
      ================================================== */}
      <View style={styles.stickyBottomBar}>
        <View>
          <Text style={styles.bottomPriceLabel}>Total Payable</Text>
          <Text style={styles.bottomPriceValue}>{priceCalculation.totalFormatted}</Text>
          <Text style={styles.bottomScheduleText}>
            {selectedDate.dayName} • {selectedDuration.durationText}
          </Text>
        </View>

        <TouchableOpacity
          style={[styles.bottomCtaBtn, isProcessing && styles.bottomCtaBtnDisabled]}
          activeOpacity={0.88}
          onPress={handleConfirmAndPay}
          disabled={isProcessing}
        >
          {isProcessing ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <>
              <Text style={styles.bottomCtaText}>
                {paymentMethod === 'PayOnArrival' ? 'Confirm Booking' : 'Pay & Book Nurse'}
              </Text>
              <Ionicons name="arrow-forward" size={16} color="#FFFFFF" />
            </>
          )}
        </TouchableOpacity>
      </View>

      {/* ==================================================
          SUCCESS CONFIRMATION MODAL
      ================================================== */}
      <Modal
        visible={successModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setSuccessModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.successIconBox}>
              <Ionicons name="checkmark-circle" size={40} color="#FFFFFF" />
            </View>

            <Text style={styles.successTitle}>Home Nurse Booked! 🩺</Text>
            <Text style={styles.successSub}>
              A certified nurse has been assigned to your patient and will arrive on schedule.
            </Text>

            <View style={styles.summaryBox}>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Order ID:</Text>
                <Text style={styles.summaryVal}>{confirmedBooking?.bookingId}</Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Schedule Date:</Text>
                <Text style={[styles.summaryVal, { color: '#0F766E', fontWeight: '800' }]}>
                  {confirmedBooking?.schedule.startDate}
                </Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Arrival Time / Shift:</Text>
                <Text style={[styles.summaryVal, { color: '#059669', fontWeight: '800' }]}>
                  {confirmedBooking?.schedule.preferredTime}
                </Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Duration:</Text>
                <Text style={styles.summaryVal}>{confirmedBooking?.duration}</Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Patient:</Text>
                <Text style={styles.summaryVal}>
                  {confirmedBooking?.patient.name} ({confirmedBooking?.patient.relation})
                </Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Assigned Nurse:</Text>
                <Text style={[styles.summaryVal, { color: colors.secondary, fontWeight: '800' }]}>
                  {confirmedBooking?.assignedNurse.name}
                </Text>
              </View>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Payment:</Text>
                <Text style={[styles.summaryVal, { color: '#059669', fontWeight: '800' }]}>
                  {confirmedBooking?.payment.amount} ({confirmedBooking?.payment.status})
                </Text>
              </View>
            </View>

            <TouchableOpacity
              style={styles.nurseCallBtn}
              activeOpacity={0.88}
              onPress={() => Linking.openURL('tel:+919876512345')}
            >
              <Ionicons name="call" size={16} color="#FFFFFF" />
              <Text style={styles.nurseCallBtnText}>Call Assigned Nurse Desk</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.doneBtn}
              onPress={() => {
                setSuccessModalVisible(false);
                navigation.navigate('Bookings');
              }}
            >
              <Text style={styles.doneBtnText}>View in My Bookings</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

// ==================================================
// STYLES
// ==================================================

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },

  // HEADER
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  backButton: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerCenter: {
    flex: 1,
    marginLeft: 10,
    marginRight: 8,
  },
  headerBadge: {
    fontSize: 9,
    fontWeight: '800',
    color: '#0F766E',
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

  scrollContent: {
    paddingBottom: 20,
  },

  // LUXURY HERO BANNER
  heroCard: {
    backgroundColor: '#0F766E',
    marginHorizontal: 16,
    marginTop: 14,
    borderRadius: 20,
    padding: 18,
    position: 'relative',
    overflow: 'hidden',
    shadowColor: '#0F766E',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  heroOrb1: {
    position: 'absolute',
    top: -30,
    right: -20,
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
  heroOrb2: {
    position: 'absolute',
    bottom: -30,
    left: -20,
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  heroStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 6,
  },
  livePulseDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#4ADE80',
  },
  heroStatusText: {
    color: '#CCFBF1',
    fontSize: 11,
    fontWeight: '700',
    flex: 1,
  },
  heroSpeedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.25)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
    gap: 3,
  },
  heroSpeedText: {
    color: '#FDE047',
    fontSize: 10,
    fontWeight: '800',
  },
  heroHeading: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '900',
    marginBottom: 4,
  },
  heroSubHeading: {
    color: '#CCFBF1',
    fontSize: 11.5,
    lineHeight: 16,
    marginBottom: 14,
  },
  heroBadgesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  heroTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 4,
  },
  heroTagText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '700',
  },

  // CARD SECTIONS
  cardSection: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginTop: 14,
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 5,
    elevation: 2,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
    gap: 10,
  },
  stepNumPill: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#CCFBF1',
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepNumText: {
    color: '#0F766E',
    fontSize: 13,
    fontWeight: '900',
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '900',
    color: '#0F172A',
  },
  cardSubTitle: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 1,
  },

  // DURATION 2x2 GRID
  durationsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  durationItem: {
    width: '48%',
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
  },
  durationItemActive: {
    backgroundColor: '#F0FDFA',
    borderColor: '#0F766E',
  },
  durationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  durBadge: {
    backgroundColor: '#E2E8F0',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  durBadgeActive: {
    backgroundColor: '#0F766E',
  },
  durBadgeText: {
    fontSize: 8.5,
    fontWeight: '800',
    color: '#475569',
  },
  durBadgeTextActive: {
    color: '#FFFFFF',
  },
  durRadio: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
    justifyContent: 'center',
    alignItems: 'center',
  },
  durRadioActive: {
    borderColor: '#0F766E',
  },
  durRadioInner: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#0F766E',
  },
  durPrice: {
    fontSize: 17,
    fontWeight: '900',
    color: '#0F172A',
    marginBottom: 2,
  },
  durPriceActive: {
    color: '#0F766E',
  },
  durLabel: {
    fontSize: 12,
    fontWeight: '800',
    color: '#334155',
  },
  durLabelActive: {
    color: '#0F172A',
  },
  durDesc: {
    fontSize: 10,
    color: '#64748B',
    marginTop: 2,
    lineHeight: 14,
  },
  durDescActive: {
    color: '#0F766E',
  },

  // PURPOSE REQUIREMENTS
  purposesWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 7,
    marginBottom: 12,
  },
  purposeChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 20,
    paddingHorizontal: 11,
    paddingVertical: 7,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 5,
  },
  purposeChipActive: {
    backgroundColor: '#0F766E',
    borderColor: '#0F766E',
  },
  purposeChipText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#334155',
  },
  purposeChipTextActive: {
    color: '#FFFFFF',
  },
  inputHeading: {
    fontSize: 11.5,
    fontWeight: '800',
    color: '#334155',
    marginBottom: 6,
    marginTop: 4,
  },
  textArea: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    padding: 10,
    height: 65,
    fontSize: 12,
    color: '#0F172A',
    textAlignVertical: 'top',
  },
  singleInput: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 42,
    fontSize: 12.5,
    color: '#0F172A',
    marginBottom: 8,
  },
  inputRow: {
    flexDirection: 'row',
  },

  // SCHEDULE SUB-SECTIONS
  subHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 6,
  },
  subTitleText: {
    fontSize: 12.5,
    fontWeight: '800',
    color: '#0F172A',
    flex: 1,
  },
  selectedDayBadge: {
    backgroundColor: '#CCFBF1',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  selectedDayBadgeText: {
    fontSize: 10.5,
    fontWeight: '800',
    color: '#0F766E',
  },

  // DATE PILLS
  datesScroll: {
    gap: 8,
    paddingBottom: 4,
  },
  datePill: {
    width: 60,
    height: 70,
    borderRadius: 14,
    backgroundColor: '#F8FAFC',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  datePillActive: {
    backgroundColor: '#0F766E',
    borderColor: '#0F766E',
  },
  dateDay: {
    fontSize: 10,
    fontWeight: '700',
    color: '#64748B',
  },
  dateDayActive: {
    color: '#FFFFFF',
  },
  dateNum: {
    fontSize: 16,
    fontWeight: '900',
    color: '#0F172A',
    marginVertical: 1,
  },
  dateNumActive: {
    color: '#FFFFFF',
  },
  dateMonth: {
    fontSize: 10,
    color: '#64748B',
    fontWeight: '600',
  },
  dateMonthActive: {
    color: '#FFFFFF',
  },
  todayPillBadge: {
    position: 'absolute',
    top: -5,
    backgroundColor: '#DC2626',
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 4,
  },
  todayPillBadgeText: {
    color: '#FFFFFF',
    fontSize: 7.5,
    fontWeight: '900',
  },

  // TIME TABS
  timeFilterRow: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 8,
  },
  timeTab: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
  },
  timeTabActive: {
    backgroundColor: '#0F766E',
  },
  timeTabText: {
    fontSize: 10.5,
    fontWeight: '700',
    color: '#64748B',
  },
  timeTabTextActive: {
    color: '#FFFFFF',
  },

  // SLOTS
  slotsGrid: {
    gap: 6,
  },
  slotCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    padding: 10,
  },
  slotCardActive: {
    backgroundColor: '#F0FDFA',
    borderColor: '#0F766E',
  },
  slotCardUrgent: {
    borderColor: '#FECACA',
    backgroundColor: '#FFF5F5',
  },
  slotCardUrgentActive: {
    borderColor: '#DC2626',
    backgroundColor: '#FEF2F2',
  },
  slotLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 10,
  },
  slotIconBox: {
    width: 30,
    height: 30,
    borderRadius: 8,
    backgroundColor: '#CCFBF1',
    justifyContent: 'center',
    alignItems: 'center',
  },
  slotIconBoxActive: {
    backgroundColor: '#0F766E',
  },
  slotLabel: {
    fontSize: 12,
    fontWeight: '800',
    color: '#0F172A',
  },
  slotLabelActive: {
    color: '#0F766E',
  },
  slotDesc: {
    fontSize: 10,
    color: '#64748B',
    marginTop: 1,
  },
  slotDescActive: {
    color: '#059669',
  },
  slotRadio: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
    justifyContent: 'center',
    alignItems: 'center',
  },
  slotRadioActive: {
    borderColor: '#0F766E',
  },
  slotRadioInner: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#0F766E',
  },

  // FAMILY CHIPS
  familyChipsWrap: {
    gap: 8,
    paddingBottom: 8,
  },
  familyChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 5,
  },
  familyChipActive: {
    backgroundColor: '#0F766E',
    borderColor: '#0F766E',
  },
  familyChipText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#334155',
  },
  familyChipTextActive: {
    color: '#FFFFFF',
  },
  addressHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  gpsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#CCFBF1',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    gap: 4,
  },
  gpsBtnText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#0F766E',
  },

  // PAYMENT CARDS
  payCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    marginBottom: 8,
  },
  payCardActive: {
    backgroundColor: '#F0FDFA',
    borderColor: '#0F766E',
  },
  payCardWalletActive: {
    backgroundColor: '#F0FDF4',
    borderColor: '#059669',
  },
  walletIconCircle: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: '#CCFBF1',
    justifyContent: 'center',
    alignItems: 'center',
  },
  payIconCircle: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  payCardTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: '#0F172A',
  },
  payCardTitleActive: {
    color: '#0F766E',
  },
  payCardSub: {
    fontSize: 10,
    color: '#64748B',
    marginTop: 2,
  },
  fast1ClickBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#059669',
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 4,
    gap: 2,
  },
  fast1ClickText: {
    color: '#FFFFFF',
    fontSize: 8,
    fontWeight: '900',
  },
  walletBalSub: {
    fontSize: 10,
    fontWeight: '700',
    marginTop: 2,
  },
  topUpCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    borderRadius: 10,
    padding: 10,
    marginBottom: 8,
    marginTop: -4,
  },
  topUpTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: '#DC2626',
  },
  topUpSub: {
    fontSize: 10,
    color: '#991B1B',
    marginTop: 1,
  },
  topUpBtn: {
    backgroundColor: '#DC2626',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 6,
  },
  topUpBtnText: {
    color: '#FFFFFF',
    fontSize: 10.5,
    fontWeight: '800',
  },

  // INVOICE
  invoiceCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginTop: 6,
  },
  invoiceTitle: {
    fontSize: 12.5,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 6,
  },
  invoiceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  invoiceLabel: {
    fontSize: 11,
    color: '#64748B',
  },
  invoiceValue: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#0F172A',
  },
  invoiceDivider: {
    height: 1,
    backgroundColor: '#E2E8F0',
    marginVertical: 6,
  },
  invoiceTotalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  invoiceTotalLabel: {
    fontSize: 13,
    fontWeight: '900',
    color: '#0F172A',
  },
  invoiceTaxNote: {
    fontSize: 9.5,
    color: '#059669',
    fontWeight: '700',
  },
  invoiceTotalAmount: {
    fontSize: 17,
    fontWeight: '900',
    color: '#0F766E',
  },

  // STICKY BOTTOM BAR
  stickyBottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.08,
    shadowRadius: 5,
  },
  bottomPriceLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#64748B',
  },
  bottomPriceValue: {
    fontSize: 18,
    fontWeight: '900',
    color: '#0F766E',
  },
  bottomScheduleText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#334155',
  },
  bottomCtaBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0F766E',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 14,
    gap: 8,
    shadowColor: '#0F766E',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 4,
  },
  bottomCtaBtnDisabled: {
    opacity: 0.7,
  },
  bottomCtaText: {
    fontSize: 13.5,
    fontWeight: '900',
    color: '#FFFFFF',
  },

  // SUCCESS MODAL
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    paddingBottom: 35,
  },
  successIconBox: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#059669',
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'center',
    marginBottom: 10,
  },
  successTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: colors.secondary,
    textAlign: 'center',
  },
  successSub: {
    fontSize: 11.5,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: 3,
    marginBottom: 14,
  },
  summaryBox: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 6,
    marginBottom: 14,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  summaryLabel: {
    fontSize: 11,
    color: colors.textSecondary,
  },
  summaryVal: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.secondary,
    maxWidth: '65%',
  },
  nurseCallBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0F766E',
    paddingVertical: 12,
    borderRadius: 12,
    gap: 6,
    marginBottom: 8,
  },
  nurseCallBtnText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  doneBtn: {
    paddingVertical: 8,
    alignItems: 'center',
  },
  doneBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textSecondary,
  },
});

export default NurseBookingScreen;
