import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Image,
  Alert,
  StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import colors from '../../theme/colors';

// Generate next 14 days for appointment scheduling
const generateDates = () => {
  const dates = [];
  const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  for (let i = 0; i < 14; i++) {
    const d = new Date();
    d.setDate(d.getDate() + i);
    dates.push({
      dateStr: d.toISOString().split('T')[0],
      dayName: i === 0 ? 'Today' : i === 1 ? 'Tmrw' : daysOfWeek[d.getDay()],
      dayNum: d.getDate(),
      month: months[d.getMonth()],
      fullDateText: `${daysOfWeek[d.getDay()]}, ${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`,
    });
  }
  return dates;
};

const TIME_SLOTS = {
  morning: [
    { id: 'm1', time: '07:30 AM', available: true },
    { id: 'm2', time: '09:00 AM', available: true },
    { id: 'm3', time: '10:30 AM', available: true },
    { id: 'm4', time: '11:45 AM', available: true },
  ],
  afternoon: [
    { id: 'a1', time: '01:15 PM', available: true },
    { id: 'a2', time: '02:45 PM', available: true },
    { id: 'a3', time: '04:00 PM', available: true },
  ],
  evening: [
    { id: 'e1', time: '05:30 PM', available: true },
    { id: 'e2', time: '07:00 PM', available: true },
    { id: 'e3', time: '08:15 PM', available: true },
  ],
};

const RadiologyBookingScreen = ({ route, navigation }) => {
  const { lab, test, selectedTests = [] } = route.params || {};

  // All tests to be booked
  const testsToBook = selectedTests.length > 0 ? selectedTests : test ? [test] : [];

  const availableDates = generateDates();
  const [selectedDate, setSelectedDate] = useState(availableDates[0]);
  const [selectedSlot, setSelectedSlot] = useState(TIME_SLOTS.morning[1].time);

  // Patient Info State
  const [patientName, setPatientName] = useState('Ramesh Kumar');
  const [patientAge, setPatientAge] = useState('32');
  const [patientGender, setPatientGender] = useState('Male');
  const [patientPhone, setPatientPhone] = useState('9876543210');
  const [symptomsNotes, setSymptomsNotes] = useState('');
  const [prescriptionImage, setPrescriptionImage] = useState(null);

  // Price calculations
  const subtotalMrp = testsToBook.reduce((acc, t) => acc + (t.mrp || t.price || 0), 0);
  const totalOfferPrice = testsToBook.reduce((acc, t) => acc + (t.price || 0), 0);
  const totalSavings = Math.max(0, subtotalMrp - totalOfferPrice);

  // Upload prescription image
  const pickPrescription = async (useCamera = false) => {
    try {
      let result;
      if (useCamera) {
        const { status } = await ImagePicker.requestCameraPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert('Permission Required', 'Camera permission is needed to take a photo of your prescription.');
          return;
        }
        result = await ImagePicker.launchCameraAsync({
          quality: 0.8,
          allowsEditing: true,
        });
      } else {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert('Permission Required', 'Gallery access is needed to upload your prescription.');
          return;
        }
        result = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
          quality: 0.8,
          allowsEditing: true,
        });
      }

      if (!result.canceled && result.assets && result.assets.length > 0) {
        setPrescriptionImage(result.assets[0].uri);
      }
    } catch (e) {
      console.log('Error picking prescription:', e);
      Alert.alert('Upload Error', 'Could not select image.');
    }
  };

  const handleProceedToPayment = () => {
    if (!patientName.trim()) {
      Alert.alert('Patient Name Required', 'Please enter the patient full name.');
      return;
    }
    if (!patientPhone.trim() || patientPhone.length < 10) {
      Alert.alert('Valid Phone Required', 'Please enter a valid 10-digit mobile number.');
      return;
    }
    if (!selectedSlot) {
      Alert.alert('Select Time Slot', 'Please choose an appointment time slot.');
      return;
    }

    const bookingDetails = {
      lab,
      tests: testsToBook,
      date: selectedDate,
      timeSlot: selectedSlot,
      patient: {
        name: patientName,
        age: patientAge,
        gender: patientGender,
        phone: patientPhone,
        notes: symptomsNotes,
        prescriptionUri: prescriptionImage,
      },
      pricing: {
        mrpTotal: subtotalMrp,
        totalOfferPrice,
        totalSavings,
        facilityFee: 0,
        digitalReportFee: 0,
        finalPayable: totalOfferPrice,
      },
    };

    navigation.navigate('RadiologyPayment', {
      bookingDetails,
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* ==================================================
          HEADER
      ================================================== */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
          activeOpacity={0.8}
        >
          <Ionicons name="arrow-back" size={22} color={colors.secondary} />
        </TouchableOpacity>

        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Schedule Scan Slot</Text>
          <Text style={styles.headerSubtitle}>Step 1 of 2: Appointment Details</Text>
        </View>

        <View style={styles.stepBadge}>
          <Text style={styles.stepBadgeText}>1/2</Text>
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* ==================================================
            SELECTED LAB & TESTS SUMMARY
        ================================================== */}
        <View style={styles.summaryCard}>
          <View style={styles.summaryLabHeader}>
            <View style={styles.summaryLabIcon}>
              <Ionicons name="business" size={20} color={colors.primary} />
            </View>
            <View style={styles.summaryLabInfo}>
              <Text style={styles.summaryLabName}>{lab?.name || 'Diagnostic Center'}</Text>
              <Text style={styles.summaryLabArea}>{lab?.area || 'Mysore'}</Text>
            </View>
          </View>

          <View style={styles.summaryDivider} />

          <Text style={styles.summaryTestsTitle}>Selected Scans & Tests:</Text>
          {testsToBook.map((t, idx) => (
            <View key={idx} style={styles.testItemRow}>
              <View style={styles.testItemBullet}>
                <Ionicons name="scan" size={14} color={colors.primary} />
              </View>
              <View style={styles.testItemContent}>
                <Text style={styles.testItemName}>{t.name}</Text>
                <Text style={styles.testItemMeta}>{t.categoryLabel || t.modalityCode} • {t.duration}</Text>
              </View>
              <Text style={styles.testItemPrice}>₹{t.price}</Text>
            </View>
          ))}
        </View>

        {/* ==================================================
            1. SELECT APPOINTMENT DATE
        ================================================== */}
        <View style={styles.sectionBox}>
          <View style={styles.sectionTitleRow}>
            <Ionicons name="calendar-outline" size={18} color={colors.secondary} />
            <Text style={styles.sectionHeading}>1. Select Appointment Date</Text>
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.datesScroll}
          >
            {availableDates.map((item, index) => {
              const isSelected = selectedDate.dateStr === item.dateStr;
              return (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.dateCard,
                    isSelected && styles.dateCardActive,
                  ]}
                  activeOpacity={0.8}
                  onPress={() => setSelectedDate(item)}
                >
                  <Text style={[styles.dayNameText, isSelected && styles.dayNameTextActive]}>
                    {item.dayName}
                  </Text>
                  <Text style={[styles.dayNumText, isSelected && styles.dayNumTextActive]}>
                    {item.dayNum}
                  </Text>
                  <Text style={[styles.monthText, isSelected && styles.monthTextActive]}>
                    {item.month}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          <View style={styles.selectedDateBanner}>
            <Ionicons name="calendar" size={14} color={colors.primary} />
            <Text style={styles.selectedDateBannerText}>
              Selected: {selectedDate.fullDateText}
            </Text>
          </View>
        </View>

        {/* ==================================================
            2. SELECT TIME SLOT
        ================================================== */}
        <View style={styles.sectionBox}>
          <View style={styles.sectionTitleRow}>
            <Ionicons name="time-outline" size={18} color={colors.secondary} />
            <Text style={styles.sectionHeading}>2. Select Time Slot</Text>
          </View>

          {/* MORNING */}
          <Text style={styles.slotGroupTitle}>Morning Slots (07:00 AM - 12:00 PM)</Text>
          <View style={styles.slotsGrid}>
            {TIME_SLOTS.morning.map((slot) => {
              const isSelected = selectedSlot === slot.time;
              return (
                <TouchableOpacity
                  key={slot.id}
                  style={[
                    styles.slotPill,
                    isSelected && styles.slotPillActive,
                  ]}
                  onPress={() => setSelectedSlot(slot.time)}
                >
                  <Ionicons
                    name="sunny-outline"
                    size={13}
                    color={isSelected ? '#FFFFFF' : colors.primary}
                  />
                  <Text
                    style={[
                      styles.slotPillText,
                      isSelected && styles.slotPillTextActive,
                    ]}
                  >
                    {slot.time}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* AFTERNOON */}
          <Text style={styles.slotGroupTitle}>Afternoon Slots (12:00 PM - 05:00 PM)</Text>
          <View style={styles.slotsGrid}>
            {TIME_SLOTS.afternoon.map((slot) => {
              const isSelected = selectedSlot === slot.time;
              return (
                <TouchableOpacity
                  key={slot.id}
                  style={[
                    styles.slotPill,
                    isSelected && styles.slotPillActive,
                  ]}
                  onPress={() => setSelectedSlot(slot.time)}
                >
                  <Ionicons
                    name="partly-sunny-outline"
                    size={13}
                    color={isSelected ? '#FFFFFF' : colors.primary}
                  />
                  <Text
                    style={[
                      styles.slotPillText,
                      isSelected && styles.slotPillTextActive,
                    ]}
                  >
                    {slot.time}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* EVENING */}
          <Text style={styles.slotGroupTitle}>Evening Slots (05:00 PM - 09:00 PM)</Text>
          <View style={styles.slotsGrid}>
            {TIME_SLOTS.evening.map((slot) => {
              const isSelected = selectedSlot === slot.time;
              return (
                <TouchableOpacity
                  key={slot.id}
                  style={[
                    styles.slotPill,
                    isSelected && styles.slotPillActive,
                  ]}
                  onPress={() => setSelectedSlot(slot.time)}
                >
                  <Ionicons
                    name="moon-outline"
                    size={13}
                    color={isSelected ? '#FFFFFF' : colors.primary}
                  />
                  <Text
                    style={[
                      styles.slotPillText,
                      isSelected && styles.slotPillTextActive,
                    ]}
                  >
                    {slot.time}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* ==================================================
            3. PATIENT DETAILS FORM
        ================================================== */}
        <View style={styles.sectionBox}>
          <View style={styles.sectionTitleRow}>
            <Ionicons name="person-outline" size={18} color={colors.secondary} />
            <Text style={styles.sectionHeading}>3. Patient Information</Text>
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

          <View style={styles.rowTwoInputs}>
            <View style={[styles.formGroup, { flex: 1, marginRight: 8 }]}>
              <Text style={styles.inputLabel}>Age *</Text>
              <TextInput
                style={styles.textInput}
                placeholder="e.g. 32"
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
                      style={[
                        styles.genderPill,
                        isSelected && styles.genderPillActive,
                      ]}
                      onPress={() => setPatientGender(g)}
                    >
                      <Text
                        style={[
                          styles.genderPillText,
                          isSelected && styles.genderPillTextActive,
                        ]}
                      >
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
            <View style={styles.phoneInputContainer}>
              <Text style={styles.countryCode}>+91</Text>
              <TextInput
                style={styles.phoneInput}
                placeholder="9876543210"
                keyboardType="phone-pad"
                maxLength={10}
                value={patientPhone}
                onChangeText={setPatientPhone}
              />
            </View>
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.inputLabel}>Symptoms / Referring Doctor Note (Optional)</Text>
            <TextInput
              style={[styles.textInput, styles.textArea]}
              placeholder="Describe symptoms, referral details, or scan instructions..."
              multiline
              numberOfLines={3}
              value={symptomsNotes}
              onChangeText={setSymptomsNotes}
            />
          </View>
        </View>

        {/* ==================================================
            4. UPLOAD PRESCRIPTION / REFERRAL (OPTIONAL)
        ================================================== */}
        <View style={styles.sectionBox}>
          <View style={styles.sectionTitleRow}>
            <Ionicons name="document-attach-outline" size={18} color={colors.secondary} />
            <Text style={styles.sectionHeading}>4. Doctor Prescription (Optional)</Text>
          </View>
          <Text style={styles.sectionSubDesc}>
            Upload your doctor referral or prescription slip for the radiologist's reference.
          </Text>

          {prescriptionImage ? (
            <View style={styles.uploadedImageCard}>
              <Image source={{ uri: prescriptionImage }} style={styles.previewImage} />
              <View style={styles.imageActionCol}>
                <Text style={styles.uploadedText}>Prescription Attached</Text>
                <TouchableOpacity
                  style={styles.removeImageBtn}
                  onPress={() => setPrescriptionImage(null)}
                >
                  <Ionicons name="trash-outline" size={14} color="#EF4444" />
                  <Text style={styles.removeImageText}>Remove</Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <View style={styles.uploadButtonsRow}>
              <TouchableOpacity
                style={styles.uploadActionBtn}
                activeOpacity={0.8}
                onPress={() => pickPrescription(false)}
              >
                <Ionicons name="images-outline" size={20} color={colors.primary} />
                <Text style={styles.uploadActionText}>Upload from Gallery</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.uploadActionBtn}
                activeOpacity={0.8}
                onPress={() => pickPrescription(true)}
              >
                <Ionicons name="camera-outline" size={20} color={colors.secondary} />
                <Text style={styles.uploadActionText}>Take a Photo</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* ==================================================
            5. BILL BREAKDOWN
        ================================================== */}
        <View style={styles.sectionBox}>
          <View style={styles.sectionTitleRow}>
            <Ionicons name="receipt-outline" size={18} color={colors.secondary} />
            <Text style={styles.sectionHeading}>5. Estimated Bill Breakdown</Text>
          </View>

          <View style={styles.billRow}>
            <Text style={styles.billLabel}>Standard MRP Rate</Text>
            <Text style={styles.billValue}>₹{subtotalMrp}</Text>
          </View>

          <View style={styles.billRow}>
            <Text style={[styles.billLabel, { color: '#059669' }]}>Diagnostic Centre Discount</Text>
            <Text style={[styles.billValue, { color: '#059669', fontWeight: '800' }]}>
              - ₹{totalSavings}
            </Text>
          </View>

          <View style={styles.billRow}>
            <Text style={styles.billLabel}>Lab Sanitization & Facility Fee</Text>
            <Text style={[styles.billValue, { color: '#059669' }]}>FREE</Text>
          </View>

          <View style={styles.billRow}>
            <Text style={styles.billLabel}>Consultant Radiologist Digital Report</Text>
            <Text style={[styles.billValue, { color: '#059669' }]}>INCLUDED</Text>
          </View>

          <View style={styles.billDivider} />

          <View style={styles.billTotalRow}>
            <View>
              <Text style={styles.billTotalLabel}>Total Amount Payable</Text>
              <Text style={styles.billTotalSavings}>You save ₹{totalSavings} today</Text>
            </View>
            <Text style={styles.billTotalAmount}>₹{totalOfferPrice}</Text>
          </View>
        </View>
      </ScrollView>

      {/* ==================================================
          BOTTOM ACTION BAR
      ================================================== */}
      <View style={styles.bottomBar}>
        <View style={styles.bottomPriceCol}>
          <Text style={styles.bottomTotalLabel}>Total Payable</Text>
          <Text style={styles.bottomTotalValue}>₹{totalOfferPrice}</Text>
        </View>

        <TouchableOpacity
          style={styles.proceedButton}
          activeOpacity={0.88}
          onPress={handleProceedToPayment}
        >
          <Text style={styles.proceedButtonText}>Proceed to Payment</Text>
          <Ionicons name="arrow-forward" size={18} color="#FFFFFF" />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

// ==================================================
// STYLES
// ==================================================

const styles = StyleSheet.create({
  container: {
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
    borderBottomColor: '#E2E8F0',
  },
  backButton: {
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
  stepBadge: {
    backgroundColor: colors.lightTeal,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
  },
  stepBadgeText: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.primary,
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
  summaryLabHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  summaryLabIcon: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: colors.lightTeal,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  summaryLabInfo: {
    flex: 1,
  },
  summaryLabName: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.secondary,
  },
  summaryLabArea: {
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: 2,
  },
  summaryDivider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginVertical: 10,
  },
  summaryTestsTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.secondary,
    marginBottom: 8,
  },
  testItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  testItemBullet: {
    marginRight: 8,
  },
  testItemContent: {
    flex: 1,
  },
  testItemName: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.text,
  },
  testItemMeta: {
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: 1,
  },
  testItemPrice: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.primary,
  },

  // SECTION BOX
  sectionBox: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 14,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 8,
  },
  sectionHeading: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.secondary,
  },
  sectionSubDesc: {
    fontSize: 11,
    color: colors.textSecondary,
    marginBottom: 10,
    lineHeight: 16,
  },

  // DATES SCROLL
  datesScroll: {
    gap: 8,
    paddingBottom: 8,
  },
  dateCard: {
    width: 60,
    height: 75,
    borderRadius: 12,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  dateCardActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  dayNameText: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.textSecondary,
  },
  dayNameTextActive: {
    color: '#FFFFFF',
  },
  dayNumText: {
    fontSize: 17,
    fontWeight: '800',
    color: colors.text,
    marginVertical: 2,
  },
  dayNumTextActive: {
    color: '#FFFFFF',
  },
  monthText: {
    fontSize: 10,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  monthTextActive: {
    color: '#FFFFFF',
  },

  selectedDateBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.lightTeal,
    padding: 8,
    borderRadius: 8,
    marginTop: 6,
    gap: 6,
  },
  selectedDateBannerText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.primary,
  },

  // TIME SLOTS
  slotGroupTitle: {
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
  slotPill: {
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
  slotPillActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  slotPillText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.text,
  },
  slotPillTextActive: {
    color: '#FFFFFF',
  },

  // FORM INPUTS
  formGroup: {
    marginBottom: 10,
  },
  rowTwoInputs: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  inputLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.secondary,
    marginBottom: 5,
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
    height: 70,
    textAlignVertical: 'top',
    paddingTop: 8,
  },
  genderRow: {
    flexDirection: 'row',
    gap: 6,
  },
  genderPill: {
    flex: 1,
    height: 42,
    borderRadius: 10,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  genderPillActive: {
    backgroundColor: colors.lightTeal,
    borderColor: colors.primary,
  },
  genderPillText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textSecondary,
  },
  genderPillTextActive: {
    color: colors.primary,
  },
  phoneInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    height: 42,
    paddingHorizontal: 10,
  },
  countryCode: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.secondary,
    marginRight: 6,
  },
  phoneInput: {
    flex: 1,
    fontSize: 13,
    color: colors.text,
  },

  // UPLOAD PRESCRIPTION
  uploadButtonsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  uploadActionBtn: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderStyle: 'dashed',
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  uploadActionText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.secondary,
  },
  uploadedImageCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    padding: 10,
    gap: 12,
  },
  previewImage: {
    width: 60,
    height: 60,
    borderRadius: 8,
  },
  imageActionCol: {
    flex: 1,
  },
  uploadedText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.primary,
    marginBottom: 4,
  },
  removeImageBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  removeImageText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#EF4444',
  },

  // BILL BREAKDOWN
  billRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  billLabel: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  billValue: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.text,
  },
  billDivider: {
    height: 1,
    backgroundColor: '#E2E8F0',
    marginVertical: 8,
  },
  billTotalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
  },
  billTotalLabel: {
    fontSize: 13,
    fontWeight: '800',
    color: colors.secondary,
  },
  billTotalSavings: {
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

  // BOTTOM ACTION BAR
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
  bottomPriceCol: {},
  bottomTotalLabel: {
    fontSize: 11,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  bottomTotalValue: {
    fontSize: 19,
    fontWeight: '800',
    color: colors.primary,
  },
  proceedButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
    gap: 8,
  },
  proceedButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },
});

export default RadiologyBookingScreen;
