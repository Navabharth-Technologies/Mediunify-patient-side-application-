import React, { useState, useEffect } from 'react';
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
  Platform,
  useWindowDimensions,
} from 'react-native';
import { showAlert } from '../../../utils/alert';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import colors from '../../../theme/colors';
import { getLabById } from '../../../data/radiologyLabsData';
import WebFooter from '../../../components/web/WebFooter';

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
  const { width } = useWindowDimensions();
  const isDesktopWeb = Platform.OS === 'web' && width >= 768;
  const { lab, test, selectedTests = [] } = route.params || {};

  const activeLab =
    lab ||
    (selectedTests.length > 0 && selectedTests[0]?.labId
      ? getLabById(selectedTests[0].labId) || {
          id: selectedTests[0].labId,
          name: selectedTests[0].labName || 'Diagnostic Center',
          area: selectedTests[0].labArea || 'Mysore',
          address: selectedTests[0].labAddress || '',
          phone: selectedTests[0].labPhone || '',
        }
      : getLabById('lab-unnathi-main'));
  const defaultTest = activeLab?.availableTests ? activeLab.availableTests[0] : null;

  // All tests to be booked (reactive state)
  const [testsToBook, setTestsToBook] = useState(
    selectedTests.length > 0
      ? selectedTests
      : test
      ? [test]
      : defaultTest
      ? [defaultTest]
      : []
  );

  useEffect(() => {
    if (selectedTests && selectedTests.length > 0) {
      setTestsToBook(selectedTests);
    } else if (test) {
      setTestsToBook([test]);
    }
  }, [selectedTests, test]);

  const availableDates = generateDates();
  const [selectedDate, setSelectedDate] = useState(availableDates[0]);
  const [selectedSlot, setSelectedSlot] = useState(TIME_SLOTS.morning[1].time);

  // Patient Info State
  const [patientName, setPatientName] = useState('Patient');
  const [patientAge, setPatientAge] = useState('28');
  const [patientGender, setPatientGender] = useState('Male');
  const [patientPhone, setPatientPhone] = useState('');
  const [symptomsNotes, setSymptomsNotes] = useState('');
  const [prescriptionImage, setPrescriptionImage] = useState(null);
  const [familyMembers, setFamilyMembers] = useState([]);
  const [selectedMemberId, setSelectedMemberId] = useState('self');

  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    try {
      const storedPrimary = await AsyncStorage.getItem('@unnathi_primary_user');
      const storedUser = await AsyncStorage.getItem('user');
      const storedPhone = await AsyncStorage.getItem('userPhone');
      const storedName = await AsyncStorage.getItem('userName');
      const storedFamily = await AsyncStorage.getItem('@unnathi_family_members');

      let parsed = null;
      if (storedPrimary) {
        parsed = JSON.parse(storedPrimary);
      } else if (storedUser) {
        parsed = JSON.parse(storedUser);
      }

      if (parsed?.name || storedName) {
        setPatientName(parsed?.name || storedName || 'Patient');
      }
      if (parsed?.phone || storedPhone) {
        setPatientPhone(parsed?.phone || storedPhone || '');
      }
      if (parsed?.age) {
        setPatientAge(parsed.age.toString().replace(/[^0-9]/g, '') || '28');
      }
      if (parsed?.gender) {
        setPatientGender(parsed.gender);
      }

      if (storedFamily) {
        const famList = JSON.parse(storedFamily);
        if (Array.isArray(famList)) setFamilyMembers(famList);
      }
    } catch (e) {
      console.log('Error loading patient info in radiology:', e);
    }
  };

  const handleSelectFamilyMember = (member) => {
    if (member === 'self') {
      setSelectedMemberId('self');
      loadUserData();
    } else {
      setSelectedMemberId(member.id);
      setPatientName(member.name);
      setPatientAge(member.age?.toString().replace(/[^0-9]/g, '') || '28');
      setPatientGender(member.gender || 'Male');
      if (member.phone) setPatientPhone(member.phone);
    }
  };

  // Price calculations
  const subtotalMrp = testsToBook.reduce((acc, t) => acc + (t.mrp || t.price || 0), 0);
  const totalOfferPrice = testsToBook.reduce((acc, t) => acc + (t.price || 0), 0);
  const totalSavings = Math.max(0, subtotalMrp - totalOfferPrice);

  // Remove a scan from selection
  const handleRemoveScan = (indexToRemove) => {
    const scanToRemove = testsToBook[indexToRemove];
    if (testsToBook.length === 1) {
      showAlert(
        'Remove Scan',
        `"${scanToRemove.name}" is the only scan in this booking. Removing it will return to diagnostic center. Proceed?`,
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Remove', style: 'destructive', onPress: () => navigation.goBack() },
        ]
      );
      return;
    }

    showAlert(
      'Remove Scan',
      `Remove "${scanToRemove.name}" from this appointment?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: () => {
            setTestsToBook((prev) => prev.filter((_, idx) => idx !== indexToRemove));
          },
        },
      ]
    );
  };

  // Upload prescription image
  const pickPrescription = async (useCamera = false) => {
    try {
      let result;
      if (useCamera) {
        const { status } = await ImagePicker.requestCameraPermissionsAsync();
        if (status !== 'granted') {
          showAlert('Permission Required', 'Camera permission is needed to take a photo of your prescription.');
          return;
        }
        result = await ImagePicker.launchCameraAsync({
          quality: 0.8,
          allowsEditing: true,
        });
      } else {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
          showAlert('Permission Required', 'Gallery access is needed to upload your prescription.');
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
      showAlert('Upload Error', 'Could not select image.');
    }
  };

  const handleProceedToPayment = () => {
    if (!patientName.trim()) {
      showAlert('Patient Name Required', 'Please enter the patient full name.');
      return;
    }
    if (!patientPhone.trim() || patientPhone.length < 10) {
      showAlert('Valid Phone Required', 'Please enter a valid 10-digit mobile number.');
      return;
    }
    if (!selectedSlot) {
      showAlert('Select Time Slot', 'Please choose an appointment time slot.');
      return;
    }

    const bookingDetails = {
      lab: activeLab,
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
        {/* DESKTOP BREADCRUMBS */}
        {isDesktopWeb && (
          <View style={styles.breadcrumbsRow}>
            <TouchableOpacity onPress={() => navigation.navigate('Home')}>
              <Text style={styles.breadcrumbLink}>Home</Text>
            </TouchableOpacity>
            <Text style={styles.breadcrumbSlash}>/</Text>
            <TouchableOpacity onPress={() => navigation.navigate('Imaging')}>
              <Text style={styles.breadcrumbLink}>Radiology & Scans</Text>
            </TouchableOpacity>
            <Text style={styles.breadcrumbSlash}>/</Text>
            <Text style={styles.breadcrumbCurrent}>Diagnostic Booking</Text>
          </View>
        )}

        {/* ==================================================
            SELECTED LAB & TESTS SUMMARY
        ================================================== */}
        <View style={styles.summaryCard}>
          <View style={styles.confidentialBadgePill}>
            <Ionicons name="shield-checkmark" size={11} color="#0D9488" />
            <Text style={styles.confidentialBadgePillText}>100% ACCREDITED 3T SCANNING CENTER</Text>
          </View>
          <View style={styles.summaryLabHeader}>
            <View style={styles.summaryLabIcon}>
              <Ionicons name="business" size={20} color={colors.primary} />
            </View>
            <View style={styles.summaryLabInfo}>
              <Text style={styles.summaryLabName}>{activeLab?.name || lab?.name || 'Diagnostic Center'}</Text>
              <Text style={styles.summaryLabArea}>{activeLab?.area || lab?.area || 'Mysore'}</Text>
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
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Text style={styles.testItemPrice}>₹{t.price}</Text>
                <TouchableOpacity
                  style={styles.scanRemoveBtn}
                  onPress={() => handleRemoveScan(idx)}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  activeOpacity={0.7}
                >
                  <Ionicons name="trash-outline" size={16} color="#DC2626" />
                </TouchableOpacity>
              </View>
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
            <Text style={styles.inputLabel}>Who is this scan for?</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingBottom: 6 }}>
              <TouchableOpacity
                style={[
                  styles.patientChip,
                  selectedMemberId === 'self' && styles.patientChipActive,
                ]}
                onPress={() => handleSelectFamilyMember('self')}
                activeOpacity={0.8}
              >
                <Ionicons
                  name="person"
                  size={12}
                  color={selectedMemberId === 'self' ? '#FFFFFF' : colors.primary}
                />
                <Text
                  style={[
                    styles.patientChipText,
                    selectedMemberId === 'self' && styles.patientChipTextActive,
                  ]}
                >
                  Myself
                </Text>
              </TouchableOpacity>

              {familyMembers.map((m) => {
                const isSelected = selectedMemberId === m.id;
                return (
                  <TouchableOpacity
                    key={m.id}
                    style={[
                      styles.patientChip,
                      isSelected && styles.patientChipActive,
                    ]}
                    onPress={() => handleSelectFamilyMember(m)}
                    activeOpacity={0.8}
                  >
                    <Ionicons
                      name="person-outline"
                      size={12}
                      color={isSelected ? '#FFFFFF' : '#475569'}
                    />
                    <Text
                      style={[
                        styles.patientChipText,
                        isSelected && styles.patientChipTextActive,
                      ]}
                    >
                      {m.name} ({m.relation || 'Family'})
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
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

        {/* UNIFIED PRIVACY & ACCREDITATION ASSURANCE BOX */}
        <View style={styles.privacyAssuranceBoxUnified}>
          <Ionicons name="shield-checkmark" size={17} color="#059669" />
          <Text style={styles.privacyAssuranceTextUnified}>
            Precision high-tesla 3T MRI & low-dose multi-slice CT scanning. Prioritized scan slot with zero center waiting time, verified by senior MD radiologist report.
          </Text>
        </View>

        {isDesktopWeb && (
          <View style={{ width: '100%', marginTop: 20, marginHorizontal: -16 }}>
            <WebFooter />
          </View>
        )}

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* ==================================================
          BOTTOM ACTION BAR
      ================================================== */}
      <View style={styles.bottomBar}>
        <View style={styles.bottomBarInner}>
          <View style={styles.bottomPriceCol}>
            <Text style={styles.bottomTotalLabel}>Total Payable</Text>
            <Text style={styles.bottomTotalValue}>₹{totalOfferPrice}</Text>
          </View>

          <TouchableOpacity
            style={styles.proceedButton}
            activeOpacity={0.88}
            onPress={handleProceedToPayment}
          >
            <Text style={styles.proceedButtonText}>Proceed to Online Payment</Text>
            <Ionicons name="lock-closed" size={16} color="#FFFFFF" style={{ marginLeft: 6 }} />
          </TouchableOpacity>
        </View>
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
    width: '100%',
    maxWidth: 1100,
    alignSelf: 'center',
  },
  breadcrumbsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 6,
  },
  breadcrumbLink: {
    fontSize: 12,
    color: '#00B894',
    fontWeight: '600',
  },
  breadcrumbSlash: {
    fontSize: 12,
    color: '#94A3B8',
  },
  breadcrumbCurrent: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '500',
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
  scanRemoveBtn: {
    width: 28,
    height: 28,
    borderRadius: 6,
    backgroundColor: '#FEF2F2',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#FEE2E2',
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
  patientChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 5,
  },
  patientChipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  patientChipText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#475569',
  },
  patientChipTextActive: {
    color: '#FFFFFF',
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
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
  },
  bottomBarInner: {
    width: '100%',
    maxWidth: 1100,
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
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
    height: 44,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    paddingHorizontal: 22,
    borderRadius: 10,
    gap: 8,
  },
  proceedButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
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

export default RadiologyBookingScreen;
