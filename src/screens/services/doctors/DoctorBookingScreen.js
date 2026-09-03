import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import colors from '../../../theme/colors';

const generateBookingDates = () => {
  const dates = [];
  const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  for (let i = 0; i < 10; i++) {
    const d = new Date();
    d.setDate(d.getDate() + i);
    dates.push({
      dateStr: d.toISOString().split('T')[0],
      dayName: i === 0 ? 'Today' : i === 1 ? 'Tmrw' : daysOfWeek[d.getDay()],
      dayNum: d.getDate(),
      month: months[d.getMonth()],
      fullText: `${daysOfWeek[d.getDay()]}, ${d.getDate()} ${months[d.getMonth()]}`,
    });
  }
  return dates;
};

const IN_CLINIC_SLOTS = {
  morning: ['09:30 AM', '10:30 AM', '11:45 AM', '12:30 PM'],
  evening: ['04:30 PM', '05:30 PM', '06:45 PM', '07:45 PM', '08:30 PM'],
};

const DoctorBookingScreen = ({ route, navigation }) => {
  const doctor = route?.params?.doctor;

  const dates = generateBookingDates();
  const [selectedDate, setSelectedDate] = useState(dates[0]);
  const [selectedTime, setSelectedTime] = useState(
    doctor?.slots?.[0] || IN_CLINIC_SLOTS.morning[0]
  );

  // Patient Info
  const [patientName, setPatientName] = useState('Ramesh Kumar');
  const [patientAge, setPatientAge] = useState('32');
  const [patientGender, setPatientGender] = useState('Male');
  const [patientPhone, setPatientPhone] = useState('9876543210');
  const [consultReason, setConsultReason] = useState('');

  // Payment method
  const [paymentOption, setPaymentOption] = useState('PAY_AT_CLINIC');
  const [isBooking, setIsBooking] = useState(false);

  if (!doctor) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={60} color="#D32F2F" />
          <Text style={styles.errorTitle}>Doctor Information Unavailable</Text>
          <Text style={styles.errorText}>Please go back and select a doctor again.</Text>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.backButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const handleBooking = async () => {
    if (!patientName.trim()) {
      Alert.alert('Patient Name Required', 'Please enter patient full name.');
      return;
    }
    if (!patientPhone.trim() || patientPhone.length < 10) {
      Alert.alert('Mobile Number Required', 'Please enter a valid 10-digit mobile number.');
      return;
    }
    if (!selectedTime) {
      Alert.alert('Select Time', 'Please choose an in-clinic appointment time slot.');
      return;
    }

    setIsBooking(true);

    try {
      await new Promise((resolve) => setTimeout(resolve, 800));

      const bookingId = `DOC-${Math.floor(100000 + Math.random() * 900000)}`;
      const tokenNumber = `TK-${Math.floor(10 + Math.random() * 90)}`;

      const newAppointment = {
        id: bookingId,
        tokenNumber,
        type: 'In-Person',
        doctor: {
          name: doctor.name,
          specialty: doctor.specialty,
          clinicName: doctor.clinicName || 'Unnathi Multispeciality Clinic',
          clinicAddress: doctor.clinicAddress || 'No. 24, 5th Cross, Near Vishwamanava Double Road, Kuvempunagar, Mysore - 570023',
          clinicArea: doctor.clinicArea || 'Kuvempunagar, Mysore',
          phone: doctor.phone || '+91 821 245 9901',
          latitude: doctor.latitude || 12.2858,
          longitude: doctor.longitude || 76.6341,
          distance: doctor.distance || '0.8 km away',
        },
        day: selectedDate.dayName,
        date: selectedDate.fullText,
        time: selectedTime,
        status: 'Confirmed',
        paidAmount: doctor.fee || 500,
        paymentStatus: paymentOption === 'PAY_AT_CLINIC' ? 'Pay at Clinic Reception' : 'Paid Online (UPI)',
        patient: {
          name: patientName,
          age: patientAge,
          gender: patientGender,
          phone: patientPhone,
          reason: consultReason,
        },
      };

      // Save to AsyncStorage
      const existingJson = await AsyncStorage.getItem('@unnathi_appointments');
      const existing = existingJson ? JSON.parse(existingJson) : [];
      await AsyncStorage.setItem(
        '@unnathi_appointments',
        JSON.stringify([newAppointment, ...existing])
      );

      setIsBooking(false);

      Alert.alert(
        'In-Person Appointment Booked! 🎉',
        `Your clinic visit with ${doctor.name} at ${doctor.clinicName} has been confirmed for ${selectedDate.fullText} at ${selectedTime}.\n\nToken: ${tokenNumber}`,
        [
          {
            text: 'View Appointments',
            onPress: () => {
              navigation.navigate('Bookings', {
                newAppointment,
              });
            },
          },
          {
            text: 'Done',
            onPress: () => {
              navigation.navigate('Home');
            },
          },
        ]
      );
    } catch (e) {
      console.log('Error saving doctor booking:', e);
      setIsBooking(false);
      Alert.alert('Booking Error', 'Could not save appointment. Please try again.');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.headerBackButton}
          onPress={() => navigation.goBack()}
          activeOpacity={0.8}
        >
          <Ionicons name="arrow-back" size={22} color={colors.secondary} />
        </TouchableOpacity>

        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Book In-Person Visit</Text>
          <Text style={styles.headerSubtitle}>{doctor.clinicName}</Text>
        </View>

        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* DOCTOR & CLINIC SUMMARY CARD */}
        <View style={styles.summaryCard}>
          <View style={styles.summaryHeader}>
            <View style={styles.summaryIconBox}>
              <Ionicons name="person" size={22} color={colors.primary} />
            </View>
            <View style={styles.summaryInfoCol}>
              <Text style={styles.summaryDocName}>{doctor.name}</Text>
              <Text style={styles.summaryDocSpec}>{doctor.specialty} • {doctor.experience || `${doctor.experienceYears} Yrs Exp`}</Text>
              <Text style={styles.summaryClinicLoc}>🏥 {doctor.clinicName} ({doctor.clinicArea})</Text>
            </View>
          </View>
        </View>

        {/* 1. APPOINTMENT DATE */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeaderRow}>
            <Ionicons name="calendar-outline" size={18} color={colors.secondary} />
            <Text style={styles.sectionTitle}>1. Select Consultation Date</Text>
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.datesScroll}
          >
            {dates.map((item, index) => {
              const isSelected = selectedDate.dateStr === item.dateStr;
              return (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.datePill,
                    isSelected && styles.datePillActive,
                  ]}
                  activeOpacity={0.8}
                  onPress={() => setSelectedDate(item)}
                >
                  <Text style={[styles.datePillDay, isSelected && styles.datePillDayActive]}>
                    {item.dayName}
                  </Text>
                  <Text style={[styles.datePillNum, isSelected && styles.datePillNumActive]}>
                    {item.dayNum}
                  </Text>
                  <Text style={[styles.datePillMonth, isSelected && styles.datePillMonthActive]}>
                    {item.month}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          <View style={styles.selectedDateBadge}>
            <Ionicons name="calendar" size={13} color={colors.primary} />
            <Text style={styles.selectedDateBadgeText}>
              Selected: {selectedDate.fullText}
            </Text>
          </View>
        </View>

        {/* 2. TIME SLOT */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeaderRow}>
            <Ionicons name="time-outline" size={18} color={colors.secondary} />
            <Text style={styles.sectionTitle}>2. In-Clinic Slot</Text>
          </View>

          <Text style={styles.slotGroupLabel}>Morning Sessions (09:00 AM - 01:00 PM)</Text>
          <View style={styles.slotsGrid}>
            {(doctor.slots && doctor.slots.length > 0 ? doctor.slots.slice(0, 3) : IN_CLINIC_SLOTS.morning).map((slot, sIdx) => {
              const isSelected = selectedTime === slot;
              return (
                <TouchableOpacity
                  key={sIdx}
                  style={[styles.slotItem, isSelected && styles.slotItemActive]}
                  onPress={() => setSelectedTime(slot)}
                >
                  <Ionicons name="sunny-outline" size={13} color={isSelected ? '#FFFFFF' : colors.primary} />
                  <Text style={[styles.slotItemText, isSelected && styles.slotItemTextActive]}>
                    {slot}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <Text style={styles.slotGroupLabel}>Evening Sessions (04:30 PM - 08:30 PM)</Text>
          <View style={styles.slotsGrid}>
            {(doctor.slots && doctor.slots.length > 3 ? doctor.slots.slice(3) : IN_CLINIC_SLOTS.evening).map((slot, sIdx) => {
              const isSelected = selectedTime === slot;
              return (
                <TouchableOpacity
                  key={sIdx}
                  style={[styles.slotItem, isSelected && styles.slotItemActive]}
                  onPress={() => setSelectedTime(slot)}
                >
                  <Ionicons name="moon-outline" size={13} color={isSelected ? '#FFFFFF' : colors.primary} />
                  <Text style={[styles.slotItemText, isSelected && styles.slotItemTextActive]}>
                    {slot}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* 3. PATIENT DETAILS */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeaderRow}>
            <Ionicons name="person-outline" size={18} color={colors.secondary} />
            <Text style={styles.sectionTitle}>3. Patient Information</Text>
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.inputLabel}>Patient Full Name *</Text>
            <TextInput
              style={styles.textInput}
              placeholder="Full name"
              value={patientName}
              onChangeText={setPatientName}
            />
          </View>

          <View style={styles.rowTwo}>
            <View style={[styles.formGroup, { flex: 1, marginRight: 8 }]}>
              <Text style={styles.inputLabel}>Age *</Text>
              <TextInput
                style={styles.textInput}
                placeholder="Age"
                keyboardType="numeric"
                value={patientAge}
                onChangeText={setPatientAge}
              />
            </View>

            <View style={[styles.formGroup, { flex: 1.5 }]}>
              <Text style={styles.inputLabel}>Gender *</Text>
              <View style={styles.genderRow}>
                {['Male', 'Female', 'Other'].map((g) => {
                  const isSelected = patientGender === g;
                  return (
                    <TouchableOpacity
                      key={g}
                      style={[styles.genderBtn, isSelected && styles.genderBtnActive]}
                      onPress={() => setPatientGender(g)}
                    >
                      <Text style={[styles.genderBtnText, isSelected && styles.genderBtnTextActive]}>
                        {g}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.inputLabel}>Phone Number *</Text>
            <TextInput
              style={styles.textInput}
              placeholder="10-digit mobile number"
              keyboardType="phone-pad"
              maxLength={10}
              value={patientPhone}
              onChangeText={setPatientPhone}
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.inputLabel}>Symptoms / Health Concern (Optional)</Text>
            <TextInput
              style={[styles.textInput, styles.textArea]}
              placeholder="Describe symptoms or reason for in-person consultation..."
              multiline
              numberOfLines={3}
              value={consultReason}
              onChangeText={setConsultReason}
            />
          </View>
        </View>

        {/* 4. PAYMENT METHOD */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeaderRow}>
            <Ionicons name="card-outline" size={18} color={colors.secondary} />
            <Text style={styles.sectionTitle}>4. Payment Option</Text>
          </View>

          <TouchableOpacity
            style={[styles.payOption, paymentOption === 'PAY_AT_CLINIC' && styles.payOptionActive]}
            onPress={() => setPaymentOption('PAY_AT_CLINIC')}
          >
            <View style={styles.radio}>
              {paymentOption === 'PAY_AT_CLINIC' && <View style={styles.radioInner} />}
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.payOptionTitle}>Pay at Clinic Reception</Text>
              <Text style={styles.payOptionSub}>Pay cash, UPI, or card on your appointment visit</Text>
            </View>
            <Ionicons name="cash-outline" size={20} color="#059669" />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.payOption, paymentOption === 'PAY_ONLINE' && styles.payOptionActive]}
            onPress={() => setPaymentOption('PAY_ONLINE')}
          >
            <View style={styles.radio}>
              {paymentOption === 'PAY_ONLINE' && <View style={styles.radioInner} />}
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.payOptionTitle}>Pay Online (Instant UPI / Card)</Text>
              <Text style={styles.payOptionSub}>Google Pay, PhonePe, Paytm, Cards</Text>
            </View>
            <Ionicons name="phone-portrait-outline" size={20} color={colors.primary} />
          </TouchableOpacity>
        </View>

        {/* 5. BILL SUMMARY */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Consultation Bill</Text>
          <View style={styles.billLine}>
            <Text style={styles.billLabel}>Doctor Consultation Fee</Text>
            <Text style={styles.billVal}>₹{doctor.fee || 500}</Text>
          </View>
          <View style={styles.billLine}>
            <Text style={styles.billLabel}>Clinic Registration & Token Fee</Text>
            <Text style={[styles.billVal, { color: '#059669' }]}>FREE</Text>
          </View>
          <View style={styles.billDivider} />
          <View style={styles.billTotalLine}>
            <Text style={styles.billTotalLabel}>Total Payable</Text>
            <Text style={styles.billTotalAmount}>₹{doctor.fee || 500}</Text>
          </View>
        </View>
      </ScrollView>

      {/* BOTTOM ACTION BAR */}
      <View style={styles.bottomBar}>
        <View style={styles.bottomCol}>
          <Text style={styles.bottomFeeLabel}>Total Fee</Text>
          <Text style={styles.bottomFeeValue}>₹{doctor.fee || 500}</Text>
        </View>

        <TouchableOpacity
          style={[styles.confirmBtn, isBooking && styles.confirmBtnDisabled]}
          activeOpacity={0.88}
          disabled={isBooking}
          onPress={handleBooking}
        >
          {isBooking ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <>
              <Text style={styles.confirmBtnText}>Confirm In-Person Visit</Text>
              <Ionicons name="checkmark-circle" size={18} color="#FFFFFF" />
            </>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  headerBackButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
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
    color: colors.secondary,
  },
  headerSubtitle: {
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: 1,
  },

  scrollContent: {
    padding: 16,
    paddingBottom: 110,
  },

  // SUMMARY CARD
  summaryCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 14,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  summaryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  summaryIconBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: colors.lightTeal,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  summaryInfoCol: {
    flex: 1,
  },
  summaryDocName: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.secondary,
  },
  summaryDocSpec: {
    fontSize: 12,
    color: colors.primary,
    fontWeight: '700',
    marginTop: 2,
  },
  summaryClinicLoc: {
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: 2,
  },

  // SECTION CARD
  sectionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 14,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    gap: 6,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.secondary,
  },

  // DATES
  datesScroll: {
    gap: 8,
    paddingBottom: 6,
  },
  datePill: {
    width: 60,
    height: 72,
    borderRadius: 12,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  datePillActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  datePillDay: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.textSecondary,
  },
  datePillDayActive: {
    color: '#FFFFFF',
  },
  datePillNum: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.text,
    marginVertical: 2,
  },
  datePillNumActive: {
    color: '#FFFFFF',
  },
  datePillMonth: {
    fontSize: 10,
    color: colors.textSecondary,
  },
  datePillMonthActive: {
    color: '#FFFFFF',
  },
  selectedDateBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.lightTeal,
    padding: 8,
    borderRadius: 8,
    marginTop: 6,
    gap: 6,
  },
  selectedDateBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.primary,
  },

  // SLOTS
  slotGroupLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textSecondary,
    marginTop: 8,
    marginBottom: 6,
  },
  slotsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 4,
  },
  slotItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 5,
  },
  slotItemActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  slotItemText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.text,
  },
  slotItemTextActive: {
    color: '#FFFFFF',
  },

  // FORM
  formGroup: {
    marginBottom: 10,
  },
  rowTwo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  inputLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.secondary,
    marginBottom: 4,
  },
  textInput: {
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 12,
    height: 42,
    fontSize: 13,
    color: colors.text,
  },
  textArea: {
    height: 65,
    textAlignVertical: 'top',
    paddingTop: 8,
  },
  genderRow: {
    flexDirection: 'row',
    gap: 6,
  },
  genderBtn: {
    flex: 1,
    height: 42,
    borderRadius: 10,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  genderBtnActive: {
    backgroundColor: colors.lightTeal,
    borderColor: colors.primary,
  },
  genderBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textSecondary,
  },
  genderBtnTextActive: {
    color: colors.primary,
  },

  // PAY OPTIONS
  payOption: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 10,
  },
  payOptionActive: {
    backgroundColor: '#FFFFFF',
    borderColor: colors.primary,
  },
  radio: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 2,
    borderColor: '#CBD5E1',
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioInner: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.primary,
  },
  payOptionTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.secondary,
  },
  payOptionSub: {
    fontSize: 10,
    color: colors.textSecondary,
    marginTop: 2,
  },

  // BILL
  billLine: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  billLabel: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  billVal: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.text,
  },
  billDivider: {
    height: 1,
    backgroundColor: '#E2E8F0',
    marginVertical: 8,
  },
  billTotalLine: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  billTotalLabel: {
    fontSize: 13,
    fontWeight: '800',
    color: colors.secondary,
  },
  billTotalAmount: {
    fontSize: 17,
    fontWeight: '800',
    color: colors.primary,
  },

  // BOTTOM BAR
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
  },
  bottomCol: {},
  bottomFeeLabel: {
    fontSize: 11,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  bottomFeeValue: {
    fontSize: 19,
    fontWeight: '800',
    color: colors.primary,
  },
  confirmBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
    gap: 8,
  },
  confirmBtnDisabled: {
    opacity: 0.7,
  },
  confirmBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
  },

  // ERROR
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 30,
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#D32F2F',
    marginTop: 12,
  },
  errorText: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 6,
  },
  backButton: {
    marginTop: 16,
    backgroundColor: colors.secondary,
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 10,
  },
  backButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
});

export default DoctorBookingScreen;