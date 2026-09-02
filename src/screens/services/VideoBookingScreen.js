import React, { useEffect, useState } from 'react';
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
  Image,
  StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImagePicker from 'expo-image-picker';
import colors from '../../theme/colors';

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

const DEFAULT_VIDEO_SLOTS = {
  morning: ['09:30 AM', '10:45 AM', '11:30 AM', '12:15 PM'],
  afternoon: ['02:30 PM', '03:45 PM', '04:30 PM'],
  evening: ['05:30 PM', '06:45 PM', '07:30 PM', '08:15 PM'],
};

const UPI_OPTIONS = [
  { id: 'gpay', name: 'Google Pay', icon: 'logo-google', color: '#4285F4' },
  { id: 'phonepe', name: 'PhonePe', icon: 'phone-portrait', color: '#5F259F' },
  { id: 'paytm', name: 'Paytm UPI', icon: 'wallet', color: '#00BAF2' },
  { id: 'bhim', name: 'BHIM UPI', icon: 'flash', color: '#00875A' },
];

const VideoBookingScreen = ({ route, navigation }) => {
  const doctor = route?.params?.doctor;

  const dates = generateBookingDates();
  const [selectedDate, setSelectedDate] = useState(dates[0]);
  const [selectedTime, setSelectedTime] = useState(
    doctor?.slots?.[0] || DEFAULT_VIDEO_SLOTS.morning[0]
  );

  // Patient Info
  const [patientName, setPatientName] = useState('Ramesh Kumar');
  const [patientAge, setPatientAge] = useState('32');
  const [patientGender, setPatientGender] = useState('Male');
  const [patientPhone, setPatientPhone] = useState('9876543210');
  const [consultReason, setConsultReason] = useState('');
  const [uploadedReport, setUploadedReport] = useState(null);

  // Payment
  const [selectedUpi, setSelectedUpi] = useState('gpay');
  const [paymentMethod, setPaymentMethod] = useState('UPI'); // 'UPI' | 'CARD'
  const [isBooking, setIsBooking] = useState(false);

  // Load saved user
  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    try {
      const storedName = await AsyncStorage.getItem('userName');
      if (storedName && storedName.trim()) {
        setPatientName(storedName.trim());
      }
    } catch (e) {
      console.log('Error loading user data:', e);
    }
  };

  // Upload Medical Report / Prescription
  const pickReportImage = async (useCamera = false) => {
    try {
      let result;
      if (useCamera) {
        const { status } = await ImagePicker.requestCameraPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert('Permission Needed', 'Camera permission is required.');
          return;
        }
        result = await ImagePicker.launchCameraAsync({
          quality: 0.8,
          allowsEditing: true,
        });
      } else {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert('Permission Needed', 'Gallery access is required.');
          return;
        }
        result = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
          quality: 0.8,
          allowsEditing: true,
        });
      }

      if (!result.canceled && result.assets?.[0]) {
        setUploadedReport(result.assets[0].uri);
      }
    } catch (e) {
      console.log('Error uploading report:', e);
    }
  };

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

  const handleConfirmAndPay = async () => {
    if (!patientName.trim()) {
      Alert.alert('Patient Name Required', 'Please enter patient full name.');
      return;
    }
    if (!patientPhone.trim() || patientPhone.length < 10) {
      Alert.alert('Mobile Number Required', 'Please enter a valid 10-digit mobile number.');
      return;
    }
    if (!selectedTime) {
      Alert.alert('Select Time Slot', 'Please choose an online video slot.');
      return;
    }

    setIsBooking(true);

    try {
      await new Promise((resolve) => setTimeout(resolve, 1000));

      const bookingId = `VID-${Math.floor(100000 + Math.random() * 900000)}`;
      const tokenNumber = `TK-${Math.floor(10 + Math.random() * 90)}`;
      const videoRoomLink = `https://telehealth.unnathi.org/room/${bookingId}`;

      const newVideoBooking = {
        id: bookingId,
        tokenNumber,
        type: 'Video Consultation',
        doctor: {
          name: doctor.name,
          specialty: doctor.specialty,
          qualification: doctor.qualification,
          languages: doctor.languages,
          image: doctor.image,
        },
        day: selectedDate.dayName,
        date: selectedDate.fullText,
        time: selectedTime,
        status: 'Confirmed',
        paidAmount: doctor.fee || 450,
        paymentStatus: 'Paid Online (UPI)',
        videoRoomLink,
        patient: {
          name: patientName,
          age: patientAge,
          gender: patientGender,
          phone: patientPhone,
          reason: consultReason,
          reportUri: uploadedReport,
        },
      };

      // 1. Save to @unnathi_appointments
      const existingApptJson = await AsyncStorage.getItem('@unnathi_appointments');
      const existingAppt = existingApptJson ? JSON.parse(existingApptJson) : [];
      await AsyncStorage.setItem(
        '@unnathi_appointments',
        JSON.stringify([newVideoBooking, ...existingAppt])
      );

      // 2. Save to @videoBookings
      const existingVidJson = await AsyncStorage.getItem('@videoBookings');
      const existingVid = existingVidJson ? JSON.parse(existingVidJson) : [];
      await AsyncStorage.setItem(
        '@videoBookings',
        JSON.stringify([newVideoBooking, ...existingVid])
      );

      setIsBooking(false);

      Alert.alert(
        'Video Consultation Confirmed! 📹',
        `Your online appointment with ${doctor.name} is booked for ${selectedDate.fullText} at ${selectedTime}.\n\nBooking ID: ${bookingId}\nToken: ${tokenNumber}\n\nJoin link will be available in your appointments and SMS.`,
        [
          {
            text: 'View Appointments',
            onPress: () => {
              navigation.navigate('Bookings', {
                newAppointment: newVideoBooking,
              });
            },
          },
          {
            text: 'Back to Home',
            onPress: () => {
              navigation.navigate('Home');
            },
          },
        ]
      );
    } catch (e) {
      console.log('Error booking video consultation:', e);
      setIsBooking(false);
      Alert.alert('Payment Error', 'Could not process transaction. Please try again.');
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
          <Text style={styles.headerTitle}>Schedule Video Call</Text>
          <Text style={styles.headerSubtitle}>100% Private HD Tele-Consultation</Text>
        </View>

        <View style={styles.secureBadge}>
          <Ionicons name="shield-checkmark" size={12} color="#059669" />
          <Text style={styles.secureBadgeText}>Encrypted</Text>
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* DOCTOR SUMMARY CARD */}
        <View style={styles.doctorSummaryCard}>
          <View style={styles.doctorSummaryRow}>
            <Image source={{ uri: doctor.image }} style={styles.summaryAvatar} />
            <View style={styles.summaryInfoCol}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                <Text style={styles.summaryDocName}>{doctor.name}</Text>
                <Ionicons name="checkmark-circle" size={15} color={colors.primary} />
              </View>
              <Text style={styles.summaryDocSpec}>{doctor.specialty} • {doctor.experience}</Text>
              <Text style={styles.summaryLanguages}>
                🗣 {doctor.languages ? doctor.languages.join(', ') : 'English, Kannada, Hindi'}
              </Text>
            </View>
          </View>

          <View style={styles.summaryDivider} />

          <View style={styles.summaryInclusionsRow}>
            <View style={styles.inclusionItem}>
              <Ionicons name="videocam" size={14} color={colors.primary} />
              <Text style={styles.inclusionText}>HD Video Call</Text>
            </View>
            <View style={styles.inclusionItem}>
              <Ionicons name="document-text" size={14} color={colors.secondary} />
              <Text style={styles.inclusionText}>e-Prescription</Text>
            </View>
            <View style={styles.inclusionItem}>
              <Ionicons name="refresh" size={14} color="#059669" />
              <Text style={styles.inclusionText}>3 Days Free Chat</Text>
            </View>
          </View>
        </View>

        {/* 1. SELECT DATE */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeaderRow}>
            <Ionicons name="calendar-outline" size={18} color={colors.secondary} />
            <Text style={styles.sectionTitle}>1. Select Video Date</Text>
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
                  style={[styles.datePill, isSelected && styles.datePillActive]}
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
              Selected Date: {selectedDate.fullText}
            </Text>
          </View>
        </View>

        {/* 2. SELECT TIME SLOT */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeaderRow}>
            <Ionicons name="time-outline" size={18} color={colors.secondary} />
            <Text style={styles.sectionTitle}>2. Choose Video Call Time Slot</Text>
          </View>

          <Text style={styles.slotGroupLabel}>Available Slots for {selectedDate.dayName}</Text>
          <View style={styles.slotsGrid}>
            {(doctor.slots && doctor.slots.length > 0 ? doctor.slots : DEFAULT_VIDEO_SLOTS.morning.concat(DEFAULT_VIDEO_SLOTS.evening)).map((slot, sIdx) => {
              const isSelected = selectedTime === slot;
              return (
                <TouchableOpacity
                  key={sIdx}
                  style={[styles.slotItem, isSelected && styles.slotItemActive]}
                  onPress={() => setSelectedTime(slot)}
                >
                  <Ionicons name="videocam-outline" size={13} color={isSelected ? '#FFFFFF' : colors.primary} />
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
              placeholder="e.g. Ramesh Kumar"
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
            <Text style={styles.inputLabel}>Mobile Phone Number *</Text>
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
            <Text style={styles.inputLabel}>Health Problem / Symptoms for Doctor</Text>
            <TextInput
              style={[styles.textInput, styles.textArea]}
              placeholder="Describe your health issue, symptoms, or medications you're taking..."
              multiline
              numberOfLines={3}
              value={consultReason}
              onChangeText={setConsultReason}
            />
          </View>

          {/* ATTACH PREVIOUS REPORT */}
          <Text style={styles.inputLabel}>Attach Medical Report / Photo (Optional)</Text>
          {uploadedReport ? (
            <View style={styles.reportPreviewRow}>
              <Image source={{ uri: uploadedReport }} style={styles.reportImg} />
              <View style={{ flex: 1 }}>
                <Text style={styles.reportAttachedText}>Report File Attached</Text>
                <TouchableOpacity onPress={() => setUploadedReport(null)}>
                  <Text style={styles.removeReportText}>Remove File</Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <View style={styles.uploadBtnsRow}>
              <TouchableOpacity
                style={styles.uploadBtn}
                onPress={() => pickReportImage(false)}
              >
                <Ionicons name="images-outline" size={18} color={colors.primary} />
                <Text style={styles.uploadBtnText}>Upload from Gallery</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.uploadBtn}
                onPress={() => pickReportImage(true)}
              >
                <Ionicons name="camera-outline" size={18} color={colors.secondary} />
                <Text style={styles.uploadBtnText}>Snap Photo</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* 4. PAYMENT METHOD */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeaderRow}>
            <Ionicons name="card-outline" size={18} color={colors.secondary} />
            <Text style={styles.sectionTitle}>4. Instant Online Payment</Text>
          </View>

          <View style={styles.upiGrid}>
            {UPI_OPTIONS.map((upi) => {
              const isSelected = selectedUpi === upi.id;
              return (
                <TouchableOpacity
                  key={upi.id}
                  style={[styles.upiItem, isSelected && styles.upiItemActive]}
                  onPress={() => setSelectedUpi(upi.id)}
                >
                  <Ionicons name={upi.icon} size={18} color={upi.color} />
                  <Text style={[styles.upiItemText, isSelected && styles.upiItemTextActive]}>
                    {upi.name}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* 5. INVOICE BREAKDOWN */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Consultation Bill</Text>
          <View style={styles.billLine}>
            <Text style={styles.billLabel}>Standard Tele-Consult Fee</Text>
            <Text style={styles.billVal}>₹{doctor.mrpFee || 650}</Text>
          </View>
          <View style={styles.billLine}>
            <Text style={[styles.billLabel, { color: '#059669' }]}>TeleHealth Special Discount</Text>
            <Text style={[styles.billVal, { color: '#059669', fontWeight: '700' }]}>
              - ₹{(doctor.mrpFee || 650) - (doctor.fee || 450)}
            </Text>
          </View>
          <View style={styles.billLine}>
            <Text style={styles.billLabel}>Digital Prescription & Follow-up</Text>
            <Text style={[styles.billVal, { color: '#059669' }]}>FREE</Text>
          </View>
          <View style={styles.billDivider} />
          <View style={styles.billTotalLine}>
            <View>
              <Text style={styles.billTotalLabel}>Total Amount</Text>
              <Text style={styles.billSavedText}>
                You save ₹{(doctor.mrpFee || 650) - (doctor.fee || 450)}
              </Text>
            </View>
            <Text style={styles.billTotalAmount}>₹{doctor.fee || 450}</Text>
          </View>
        </View>
      </ScrollView>

      {/* BOTTOM ACTION BAR */}
      <View style={styles.bottomBar}>
        <View style={styles.bottomCol}>
          <Text style={styles.bottomFeeLabel}>Total Payable</Text>
          <Text style={styles.bottomFeeValue}>₹{doctor.fee || 450}</Text>
        </View>

        <TouchableOpacity
          style={[styles.confirmBtn, isBooking && styles.confirmBtnDisabled]}
          activeOpacity={0.88}
          disabled={isBooking}
          onPress={handleConfirmAndPay}
        >
          {isBooking ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <>
              <Text style={styles.confirmBtnText}>Pay & Start Video Slot</Text>
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
  secureBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 4,
  },
  secureBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#059669',
  },

  scrollContent: {
    padding: 16,
    paddingBottom: 110,
  },

  // DOCTOR SUMMARY
  doctorSummaryCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 14,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  doctorSummaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  summaryAvatar: {
    width: 58,
    height: 58,
    borderRadius: 14,
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
  summaryLanguages: {
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: 2,
  },
  summaryDivider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginVertical: 10,
  },
  summaryInclusionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  inclusionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  inclusionText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.text,
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
    marginBottom: 8,
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

  // REPORT UPLOAD
  uploadBtnsRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 4,
  },
  uploadBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderStyle: 'dashed',
    borderRadius: 10,
    paddingVertical: 10,
    gap: 6,
  },
  uploadBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.secondary,
  },
  reportPreviewRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    padding: 8,
    gap: 10,
    marginTop: 4,
  },
  reportImg: {
    width: 44,
    height: 44,
    borderRadius: 8,
  },
  reportAttachedText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.primary,
  },
  removeReportText: {
    fontSize: 10,
    color: '#EF4444',
    fontWeight: '700',
    marginTop: 2,
  },

  // UPI GRID
  upiGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  upiItem: {
    flex: 1,
    minWidth: '45%',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 8,
  },
  upiItemActive: {
    backgroundColor: colors.lightTeal,
    borderColor: colors.primary,
  },
  upiItemText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.text,
  },
  upiItemTextActive: {
    color: colors.primary,
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
  billSavedText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#059669',
    marginTop: 2,
  },
  billTotalAmount: {
    fontSize: 18,
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

export default VideoBookingScreen;