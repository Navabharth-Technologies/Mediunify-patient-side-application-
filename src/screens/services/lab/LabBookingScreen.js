import React, { useEffect, useMemo, useState } from 'react';
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
  Linking,
  Platform,
  StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import labTests, { nearbyLabCenters } from '../../../data/labTests';
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

const HOME_SLOTS = [
  '06:30 AM - 07:30 AM (Fasting)',
  '07:30 AM - 08:30 AM (Fasting)',
  '08:30 AM - 09:30 AM (Fasting)',
  '09:30 AM - 10:30 AM',
  '10:30 AM - 11:30 AM',
  '04:30 PM - 05:30 PM',
  '05:30 PM - 06:30 PM',
];

const LAB_VISIT_SLOTS = [
  '07:00 AM - 08:30 AM',
  '08:30 AM - 10:00 AM',
  '10:00 AM - 11:30 AM',
  '11:30 AM - 01:00 PM',
  '04:00 PM - 05:30 PM',
  '05:30 PM - 07:00 PM',
];

const LabBookingScreen = ({ route, navigation }) => {
  // Support both single test object or selectedTests array as reactive state
  const initialTests = route?.params?.selectedTests || (route?.params?.test ? [route.params.test] : []);
  const [selectedTests, setSelectedTests] = useState(initialTests);

  const dates = generateBookingDates();
  const [selectedDate, setSelectedDate] = useState(dates[0]);

  // Check if any test strictly requires a Hospital/Lab visit
  const requiresHospitalVisit = useMemo(() => {
    return selectedTests.some(
      (t) =>
        t.homeCollectionAvailable === false ||
        t.category === 'Radiology' ||
        t.category === 'Diagnostic Scan' ||
        t.modality ||
        t.itemType === 'diagnostic' ||
        t.name?.toLowerCase().includes('mri') ||
        t.name?.toLowerCase().includes('ct scan') ||
        t.name?.toLowerCase().includes('x-ray') ||
        t.name?.toLowerCase().includes('ultrasound') ||
        t.name?.toLowerCase().includes('scan')
    );
  }, [selectedTests]);

  // Check if 6-in-1 Master Package is already active
  const is6in1PackageActive = useMemo(() => {
    return selectedTests.some((t) => t.id === 'pkg-6in1');
  }, [selectedTests]);

  // Upgrade handler
  const handleUpgradeTo6in1 = () => {
    const pkg = labTests.find((t) => t.id === 'pkg-6in1');
    if (pkg) {
      setSelectedTests([pkg]);
      setCollectionMode('HOME');
      setSelectedSlot(HOME_SLOTS[0]);
      Alert.alert(
        'Upgraded to 6-in-1 Master Package! 🌟',
        'Your booking now includes Complete Blood Count, Lipid Profile, Thyroid, Diabetes Sugar, Liver LFT & Kidney KFT (58 Parameters) for only ₹666!'
      );
    }
  };

  // Collection Mode: 'HOME' (Lab boy visits) or 'LAB_VISIT' (Patient visits diagnostic center)
  const [collectionMode, setCollectionMode] = useState(
    requiresHospitalVisit ? 'LAB_VISIT' : 'HOME'
  );

  // Selected Lab Center if visiting lab
  const [selectedLabCenter, setSelectedLabCenter] = useState(nearbyLabCenters[0]);

  // Selected slot
  const [selectedSlot, setSelectedSlot] = useState(
    requiresHospitalVisit ? LAB_VISIT_SLOTS[0] : HOME_SLOTS[0]
  );

  // Home Address
  const [addressLine, setAddressLine] = useState(
    'No. 42, 3rd Main, Near Double Road, Kuvempunagar, Mysore - 570023'
  );
  const [landmark, setLandmark] = useState('Opposite Govt School');
  const [locationLoading, setLocationLoading] = useState(false);

  // Patient Info
  const [patientName, setPatientName] = useState('Ramesh Kumar');
  const [patientAge, setPatientAge] = useState('32');
  const [patientGender, setPatientGender] = useState('Male');
  const [patientPhone, setPatientPhone] = useState('9876543210');
  const [uploadedPrescription, setUploadedPrescription] = useState(null);

  // Payment Option
  const [paymentOption, setPaymentOption] = useState('PAY_LATER'); // 'PAY_LATER' | 'PAY_ONLINE'
  const [isBooking, setIsBooking] = useState(false);

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

  // Detect GPS Address
  const detectGpsAddress = async () => {
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
        setAddressLine(formatted);
      }
    } catch (e) {
      console.log('GPS error:', e);
    } finally {
      setLocationLoading(false);
    }
  };

  // Prescription Upload
  const pickPrescriptionImage = async (useCamera = false) => {
    try {
      let result;
      if (useCamera) {
        const { status } = await ImagePicker.requestCameraPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert('Permission Needed', 'Camera access is required.');
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
        setUploadedPrescription(result.assets[0].uri);
      }
    } catch (e) {
      console.log('Prescription upload error:', e);
    }
  };

  // Open GPS Navigation to Lab
  const openLabNavigation = (lab) => {
    const lat = lab.latitude;
    const lng = lab.longitude;
    const label = encodeURIComponent(`${lab.name}, ${lab.address}`);

    const url = Platform.select({
      ios: `maps:0,0?q=${label}@${lat},${lng}`,
      android: `geo:0,0?q=${lat},${lng}(${label})`,
      default: `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}&destination_place_id=${label}`,
    });

    Linking.openURL(url).catch(() => {
      Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${lat},${lng}`);
    });
  };

  // Bill Totals
  const totalAmount = useMemo(() => {
    return selectedTests.reduce((sum, item) => sum + item.price, 0);
  }, [selectedTests]);

  const totalMrp = useMemo(() => {
    return selectedTests.reduce((sum, item) => sum + (item.mrp || item.price), 0);
  }, [selectedTests]);

  const handleRemoveTest = (indexToRemove) => {
    const testToRemove = selectedTests[indexToRemove];
    if (selectedTests.length === 1) {
      Alert.alert(
        'Remove Test',
        `"${testToRemove.name}" is the only test selected. Removing it will return to lab tests list. Proceed?`,
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Remove', style: 'destructive', onPress: () => navigation.goBack() },
        ]
      );
      return;
    }

    Alert.alert(
      'Remove Test from Booking',
      `Remove "${testToRemove.name}" from your selection?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: () => {
            setSelectedTests((prev) => prev.filter((_, idx) => idx !== indexToRemove));
          },
        },
      ]
    );
  };

  const handleBooking = async () => {
    if (!patientName.trim()) {
      Alert.alert('Patient Name Required', 'Please enter patient full name.');
      return;
    }
    if (!patientPhone.trim() || patientPhone.length < 10) {
      Alert.alert('Mobile Number Required', 'Please enter a valid 10-digit mobile number.');
      return;
    }
    if (collectionMode === 'HOME' && !addressLine.trim()) {
      Alert.alert('Address Required', 'Please enter your sample collection address.');
      return;
    }

    setIsBooking(true);

    try {
      await new Promise((resolve) => setTimeout(resolve, 900));

      const bookingId = `LAB-${Math.floor(100000 + Math.random() * 900000)}`;
      const tokenNumber = `TK-${Math.floor(10 + Math.random() * 90)}`;

      const newBooking = {
        id: bookingId,
        tokenNumber,
        type: 'Diagnostic Lab Test',
        collectionMode: collectionMode === 'HOME' ? 'Home Sample Collection' : 'Visit Diagnostic Center',
        tests: selectedTests.map((t) => ({
          name: t.name,
          price: t.price,
          sampleType: t.sampleType,
          fastingRequired: t.fastingRequired,
        })),
        day: selectedDate.dayName,
        date: selectedDate.fullText,
        slot: selectedSlot,
        status: 'Confirmed',
        totalAmount,
        paidAmount: totalAmount,
        paymentStatus:
          paymentOption === 'PAY_LATER'
            ? collectionMode === 'HOME'
              ? 'Pay to Lab Boy on Collection'
              : 'Pay at Lab Reception'
            : 'Paid Online (UPI)',
        patient: {
          name: patientName,
          age: patientAge,
          gender: patientGender,
          phone: patientPhone,
        },
        address: collectionMode === 'HOME' ? `${addressLine} (Landmark: ${landmark})` : null,
        labCenter: collectionMode === 'LAB_VISIT' ? selectedLabCenter : null,
        prescriptionUri: uploadedPrescription,
      };

      // 1. Save to @unnathi_appointments
      const existingApptJson = await AsyncStorage.getItem('@unnathi_appointments');
      const existingAppt = existingApptJson ? JSON.parse(existingApptJson) : [];
      await AsyncStorage.setItem(
        '@unnathi_appointments',
        JSON.stringify([newBooking, ...existingAppt])
      );

      // 2. Save to @labBookings
      const existingLabJson = await AsyncStorage.getItem('@labBookings');
      const existingLab = existingLabJson ? JSON.parse(existingLabJson) : [];
      await AsyncStorage.setItem(
        '@labBookings',
        JSON.stringify([newBooking, ...existingLab])
      );

      setIsBooking(false);

      Alert.alert(
        'Lab Booking Confirmed! 🧪',
        collectionMode === 'HOME'
          ? `Our certified Lab Technician will visit your address on ${selectedDate.fullText} during ${selectedSlot}.\n\nBooking ID: ${bookingId}\nToken: ${tokenNumber}`
          : `Your lab visit appointment at ${selectedLabCenter.name} is confirmed for ${selectedDate.fullText} (${selectedSlot}).\n\nBooking ID: ${bookingId}\nToken: ${tokenNumber}`,
        [
          {
            text: 'View Appointments',
            onPress: () => {
              navigation.navigate('Bookings', {
                newAppointment: newBooking,
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
      console.log('Error saving lab booking:', e);
      setIsBooking(false);
      Alert.alert('Booking Error', 'Could not process booking. Please try again.');
    }
  };

  if (selectedTests.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Ionicons name="flask-outline" size={60} color="#D32F2F" />
          <Text style={styles.errorTitle}>No Test Selected</Text>
          <Text style={styles.errorText}>Please select a lab test or package to schedule.</Text>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.backButtonText}>View Lab Tests</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

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
          <Text style={styles.headerTitle}>Schedule Lab Test</Text>
          <Text style={styles.headerSubtitle}>
            {selectedTests.length} {selectedTests.length === 1 ? 'Test' : 'Tests'} in Cart
          </Text>
        </View>

        <View style={styles.nablBadge}>
          <Ionicons name="shield-checkmark" size={12} color="#059669" />
          <Text style={styles.nablBadgeText}>NABL Lab</Text>
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* SELECTED TESTS SUMMARY CARD */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeaderRow}>
            <Ionicons name="flask" size={17} color={colors.primary} />
            <Text style={styles.sectionTitle}>Selected Diagnostic Tests</Text>
          </View>

          {selectedTests.map((t, idx) => (
            <View key={idx} style={styles.testItemRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.testItemName}>{t.name}</Text>
                <View style={styles.testItemBadgesRow}>
                  {t.homeCollectionAvailable ? (
                    <View style={styles.itemHomeTag}>
                      <Ionicons name="home" size={10} color="#059669" />
                      <Text style={styles.itemHomeTagText}>Home Collection</Text>
                    </View>
                  ) : (
                    <View style={styles.itemHospitalTag}>
                      <Ionicons name="business" size={10} color="#D97706" />
                      <Text style={styles.itemHospitalTagText}>Lab / Hospital Only</Text>
                    </View>
                  )}
                  {t.fastingRequired && (
                    <Text style={styles.itemFastingNotice}>• 10-12 hrs Fasting</Text>
                  )}
                </View>
              </View>

              <View style={styles.testItemRightWrap}>
                <Text style={styles.testItemPrice}>₹{t.price}</Text>
                <TouchableOpacity
                  style={styles.testItemRemoveBtn}
                  onPress={() => handleRemoveTest(idx)}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  activeOpacity={0.7}
                >
                  <Ionicons name="trash-outline" size={16} color="#DC2626" />
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </View>

        {/* ==========================================
            SMART UPGRADE RECOMMENDATION BANNER
        ========================================== */}
        {!is6in1PackageActive && (
          <View style={styles.bookingUpgradeCard}>
            <View style={styles.bookingUpgradeHeader}>
              <View style={styles.bookingUpgradeBadge}>
                <Ionicons name="sparkles" size={13} color="#FFFFFF" />
                <Text style={styles.bookingUpgradeBadgeText}>RECOMMENDED PACKAGE UPGRADE</Text>
              </View>
              <Text style={styles.bookingUpgradePrice}>₹666 Only</Text>
            </View>

            <Text style={styles.bookingUpgradeTitle}>
              Upgrade to MediUnify 6-in-1 Master Health Package
            </Text>
            <Text style={styles.bookingUpgradeDesc}>
              Includes all your selected tests ({selectedTests.map((t) => t.name.split('(')[0].trim()).join(', ')}) + additional vital organ screening covering CBC, Lipid Cholesterol, Thyroid, Sugar, Liver LFT & Kidney KFT (58 Parameters).
            </Text>

            <TouchableOpacity
              style={styles.bookingUpgradeBtn}
              onPress={handleUpgradeTo6in1}
              activeOpacity={0.88}
            >
              <Ionicons name="arrow-up-circle" size={18} color="#FFFFFF" />
              <Text style={styles.bookingUpgradeBtnText}>
                Switch & Upgrade to 6-in-1 Package (₹666)
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* COLLECTION MODE SWITCHER */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeaderRow}>
            <Ionicons name="swap-horizontal" size={18} color={colors.secondary} />
            <Text style={styles.sectionTitle}>Select Sample Collection Mode</Text>
          </View>

          {/* WARNING IF HOSPITAL ONLY TEST SELECTED */}
          {requiresHospitalVisit && (
            <View style={styles.hospitalOnlyWarning}>
              <Ionicons name="information-circle" size={16} color="#D97706" style={{ marginTop: 2 }} />
              <Text style={styles.hospitalOnlyWarningText}>
                One or more selected tests require specialized clinical equipment or sequential timed blood draws. You must visit the diagnostic center in person.
              </Text>
            </View>
          )}

          {/* OPTION 1: HOME SAMPLE COLLECTION */}
          <TouchableOpacity
            style={[
              styles.modeCard,
              collectionMode === 'HOME' && styles.modeCardActive,
              requiresHospitalVisit && styles.modeCardDisabled,
            ]}
            activeOpacity={requiresHospitalVisit ? 1 : 0.8}
            onPress={() => {
              if (requiresHospitalVisit) {
                Alert.alert(
                  'Lab Visit Required',
                  'One or more tests in your selection cannot be collected at home. Please visit our diagnostic center.'
                );
                return;
              }
              setCollectionMode('HOME');
              setSelectedSlot(HOME_SLOTS[0]);
            }}
          >
            <View style={styles.radioBox}>
              {collectionMode === 'HOME' && <View style={styles.radioInner} />}
            </View>
            <View style={styles.modeIconCircle}>
              <Ionicons name="bicycle" size={20} color={colors.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Text style={styles.modeTitle}>Home Sample Collection</Text>
                <View style={styles.freePill}>
                  <Text style={styles.freePillText}>FREE</Text>
                </View>
              </View>
              <Text style={styles.modeSub}>
                Certified Lab Boy visits your doorstep with sterile vacuum tube kit
              </Text>
            </View>
          </TouchableOpacity>

          {/* OPTION 2: VISIT NEARBY DIAGNOSTIC CENTER */}
          <TouchableOpacity
            style={[
              styles.modeCard,
              collectionMode === 'LAB_VISIT' && styles.modeCardActive,
            ]}
            activeOpacity={0.8}
            onPress={() => {
              setCollectionMode('LAB_VISIT');
              setSelectedSlot(LAB_VISIT_SLOTS[0]);
            }}
          >
            <View style={styles.radioBox}>
              {collectionMode === 'LAB_VISIT' && <View style={styles.radioInner} />}
            </View>
            <View style={[styles.modeIconCircle, { backgroundColor: '#EFF6FF' }]}>
              <Ionicons name="business" size={20} color={colors.secondary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.modeTitle}>Visit Diagnostic Lab / Hospital</Text>
              <Text style={styles.modeSub}>
                Walk into accredited partner diagnostic center directly (No waiting queue)
              </Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* DETAILS FOR HOME COLLECTION MODE */}
        {collectionMode === 'HOME' && (
          <View style={styles.sectionCard}>
            <View style={styles.sectionHeaderRow}>
              <Ionicons name="location-outline" size={18} color={colors.secondary} />
              <Text style={styles.sectionTitle}>Home Sample Collection Address</Text>
            </View>

            <View style={styles.formGroup}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
                <Text style={styles.inputLabel}>House No, Building, Street *</Text>
                <TouchableOpacity
                  style={styles.gpsDetectBtn}
                  onPress={detectGpsAddress}
                  disabled={locationLoading}
                >
                  <Ionicons name="navigate" size={11} color={colors.primary} />
                  <Text style={styles.gpsDetectBtnText}>
                    {locationLoading ? 'Detecting...' : 'Detect GPS'}
                  </Text>
                </TouchableOpacity>
              </View>
              <TextInput
                style={[styles.textInput, styles.textArea]}
                placeholder="Enter complete delivery / collection address..."
                multiline
                numberOfLines={3}
                value={addressLine}
                onChangeText={setAddressLine}
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.inputLabel}>Nearby Landmark (Optional)</Text>
              <TextInput
                style={styles.textInput}
                placeholder="e.g. Opposite Post Office"
                value={landmark}
                onChangeText={setLandmark}
              />
            </View>
          </View>
        )}

        {/* DETAILS FOR LAB / HOSPITAL VISIT MODE */}
        {collectionMode === 'LAB_VISIT' && (
          <View style={styles.sectionCard}>
            <View style={styles.sectionHeaderRow}>
              <Ionicons name="business-outline" size={18} color={colors.secondary} />
              <Text style={styles.sectionTitle}>Select Diagnostic Center</Text>
            </View>

            {nearbyLabCenters.map((lab) => {
              const isLabSelected = selectedLabCenter.id === lab.id;
              return (
                <TouchableOpacity
                  key={lab.id}
                  style={[styles.labCenterCard, isLabSelected && styles.labCenterCardActive]}
                  activeOpacity={0.85}
                  onPress={() => setSelectedLabCenter(lab)}
                >
                  <View style={styles.labCenterHeader}>
                    <View style={styles.radioBox}>
                      {isLabSelected && <View style={styles.radioInner} />}
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.labCenterName}>{lab.name}</Text>
                      <Text style={styles.labCenterArea}>{lab.area}</Text>
                    </View>
                    <View style={styles.distanceBadge}>
                      <Ionicons name="navigate-outline" size={11} color={colors.secondary} />
                      <Text style={styles.distanceBadgeText}>{lab.distance}</Text>
                    </View>
                  </View>

                  <Text style={styles.labCenterAddress}>{lab.address}</Text>

                  <View style={styles.labCenterFooter}>
                    <Text style={styles.labTimingsText}>⏱ {lab.timings}</Text>
                    <TouchableOpacity
                      style={styles.labDirectionsBtn}
                      onPress={() => openLabNavigation(lab)}
                    >
                      <Ionicons name="navigate" size={12} color="#FFFFFF" />
                      <Text style={styles.labDirectionsBtnText}>Directions (GPS)</Text>
                    </TouchableOpacity>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        )}

        {/* DATE & TIME SLOT PICKER */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeaderRow}>
            <Ionicons name="calendar-outline" size={18} color={colors.secondary} />
            <Text style={styles.sectionTitle}>
              {collectionMode === 'HOME' ? 'Sample Collection Date & Time' : 'Lab Visit Date & Time'}
            </Text>
          </View>

          {/* DATES HORIZONTAL SCROLL */}
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

          {/* SLOTS GRID */}
          <Text style={styles.slotGroupLabel}>
            {collectionMode === 'HOME' ? 'Doorstep Phlebotomist Slots' : 'Walk-in Center Slots'}
          </Text>
          <View style={styles.slotsGrid}>
            {(collectionMode === 'HOME' ? HOME_SLOTS : LAB_VISIT_SLOTS).map((slot, sIdx) => {
              const isSelected = selectedSlot === slot;
              return (
                <TouchableOpacity
                  key={sIdx}
                  style={[styles.slotItem, isSelected && styles.slotItemActive]}
                  onPress={() => setSelectedSlot(slot)}
                >
                  <Ionicons
                    name={collectionMode === 'HOME' ? 'bicycle-outline' : 'time-outline'}
                    size={12}
                    color={isSelected ? '#FFFFFF' : colors.primary}
                  />
                  <Text style={[styles.slotItemText, isSelected && styles.slotItemTextActive]}>
                    {slot}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* PATIENT DETAILS */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeaderRow}>
            <Ionicons name="person-outline" size={18} color={colors.secondary} />
            <Text style={styles.sectionTitle}>Patient Information</Text>
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

          {/* PRESCRIPTION UPLOAD */}
          <Text style={styles.inputLabel}>Attach Doctor's Prescription (Optional)</Text>
          {uploadedPrescription ? (
            <View style={styles.reportPreviewRow}>
              <Image source={{ uri: uploadedPrescription }} style={styles.reportImg} />
              <View style={{ flex: 1 }}>
                <Text style={styles.reportAttachedText}>Prescription Attached</Text>
                <TouchableOpacity onPress={() => setUploadedPrescription(null)}>
                  <Text style={styles.removeReportText}>Remove File</Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <View style={styles.uploadBtnsRow}>
              <TouchableOpacity
                style={styles.uploadBtn}
                onPress={() => pickPrescriptionImage(false)}
              >
                <Ionicons name="images-outline" size={17} color={colors.primary} />
                <Text style={styles.uploadBtnText}>Upload Image</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.uploadBtn}
                onPress={() => pickPrescriptionImage(true)}
              >
                <Ionicons name="camera-outline" size={17} color={colors.secondary} />
                <Text style={styles.uploadBtnText}>Take Photo</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* PAYMENT OPTIONS */}
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeaderRow}>
            <Ionicons name="card-outline" size={18} color={colors.secondary} />
            <Text style={styles.sectionTitle}>Payment Method</Text>
          </View>

          <TouchableOpacity
            style={[styles.payOption, paymentOption === 'PAY_LATER' && styles.payOptionActive]}
            onPress={() => setPaymentOption('PAY_LATER')}
          >
            <View style={styles.radioBox}>
              {paymentOption === 'PAY_LATER' && <View style={styles.radioInner} />}
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.payOptionTitle}>
                {collectionMode === 'HOME' ? 'Pay to Lab Boy on Sample Collection' : 'Pay at Diagnostic Center Counter'}
              </Text>
              <Text style={styles.payOptionSub}>Cash, UPI, or Card after service</Text>
            </View>
            <Ionicons name="cash-outline" size={20} color="#059669" />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.payOption, paymentOption === 'PAY_ONLINE' && styles.payOptionActive]}
            onPress={() => setPaymentOption('PAY_ONLINE')}
          >
            <View style={styles.radioBox}>
              {paymentOption === 'PAY_ONLINE' && <View style={styles.radioInner} />}
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.payOptionTitle}>Instant Online UPI / Cards</Text>
              <Text style={styles.payOptionSub}>Google Pay, PhonePe, Paytm, Cards</Text>
            </View>
            <Ionicons name="phone-portrait-outline" size={20} color={colors.primary} />
          </TouchableOpacity>
        </View>

        {/* INVOICE BREAKDOWN */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Price Breakdown</Text>
          <View style={styles.billLine}>
            <Text style={styles.billLabel}>Total Tests MRP</Text>
            <Text style={styles.billVal}>₹{totalMrp}</Text>
          </View>
          <View style={styles.billLine}>
            <Text style={[styles.billLabel, { color: '#059669' }]}>Diagnostic Package Savings</Text>
            <Text style={[styles.billVal, { color: '#059669', fontWeight: '700' }]}>
              - ₹{totalMrp - totalAmount}
            </Text>
          </View>
          <View style={styles.billLine}>
            <Text style={styles.billLabel}>
              {collectionMode === 'HOME' ? 'Home Sample Collection Charge' : 'Diagnostic Registration Fee'}
            </Text>
            <Text style={[styles.billVal, { color: '#059669' }]}>FREE</Text>
          </View>
          <View style={styles.billDivider} />
          <View style={styles.billTotalLine}>
            <View>
              <Text style={styles.billTotalLabel}>Net Amount</Text>
              <Text style={styles.billSavedText}>You save ₹{totalMrp - totalAmount}</Text>
            </View>
            <Text style={styles.billTotalAmount}>₹{totalAmount}</Text>
          </View>
        </View>
      </ScrollView>

      {/* BOTTOM CONFIRMATION BAR */}
      <View style={styles.bottomBar}>
        <View style={styles.bottomCol}>
          <Text style={styles.bottomFeeLabel}>Total Payable</Text>
          <Text style={styles.bottomFeeValue}>₹{totalAmount}</Text>
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
              <Text style={styles.confirmBtnText}>
                {collectionMode === 'HOME' ? 'Confirm Home Collection' : 'Confirm Lab Appointment'}
              </Text>
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
  nablBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 4,
  },
  nablBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#059669',
  },

  scrollContent: {
    padding: 16,
    paddingBottom: 110,
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

  // TEST ITEMS SUMMARY
  testItemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  testItemName: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.secondary,
  },
  testItemBadgesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    gap: 6,
  },
  itemHomeTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    gap: 3,
  },
  itemHomeTagText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#059669',
  },
  itemHospitalTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    gap: 3,
  },
  itemHospitalTagText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#D97706',
  },
  itemFastingNotice: {
    fontSize: 10,
    color: '#DC2626',
    fontWeight: '600',
  },
  testItemPrice: {
    fontSize: 14,
    fontWeight: '800',
    color: colors.secondary,
  },
  testItemRightWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginLeft: 8,
  },
  testItemRemoveBtn: {
    width: 28,
    height: 28,
    borderRadius: 6,
    backgroundColor: '#FEF2F2',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#FEE2E2',
  },

  // BOOKING SMART UPGRADE CARD
  bookingUpgradeCard: {
    backgroundColor: '#F0FDFA',
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 18,
    padding: 16,
    borderWidth: 1.5,
    borderColor: '#99F6E4',
    shadowColor: colors.teal,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
  },
  bookingUpgradeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  bookingUpgradeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.teal,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 4,
  },
  bookingUpgradeBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.4,
  },
  bookingUpgradePrice: {
    fontSize: 14,
    fontWeight: '900',
    color: colors.navyBlue,
  },
  bookingUpgradeTitle: {
    fontSize: 14,
    fontWeight: '900',
    color: '#0F172A',
    marginBottom: 4,
  },
  bookingUpgradeDesc: {
    fontSize: 11.5,
    color: colors.slate,
    lineHeight: 16,
    marginBottom: 12,
  },
  bookingUpgradeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.teal,
    paddingVertical: 11,
    borderRadius: 12,
    gap: 8,
  },
  bookingUpgradeBtnText: {
    color: '#FFFFFF',
    fontSize: 12.5,
    fontWeight: '800',
  },

  // HOSPITAL ONLY WARNING
  hospitalOnlyWarning: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#FFFBEB',
    borderRadius: 10,
    padding: 10,
    marginBottom: 12,
    gap: 8,
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  hospitalOnlyWarningText: {
    flex: 1,
    fontSize: 11,
    color: '#92400E',
    lineHeight: 16,
    fontWeight: '600',
  },

  // MODE CARD
  modeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    gap: 10,
  },
  modeCardActive: {
    backgroundColor: '#FFFFFF',
    borderColor: colors.primary,
  },
  modeCardDisabled: {
    opacity: 0.5,
    backgroundColor: '#F1F5F9',
  },
  radioBox: {
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
  modeIconCircle: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: colors.lightTeal,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modeTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: colors.secondary,
  },
  freePill: {
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  freePillText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#059669',
  },
  modeSub: {
    fontSize: 10,
    color: colors.textSecondary,
    marginTop: 2,
    lineHeight: 14,
  },

  // LAB CENTER CARD
  labCenterCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  labCenterCardActive: {
    backgroundColor: '#FFFFFF',
    borderColor: colors.primary,
    borderWidth: 1.5,
  },
  labCenterHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  labCenterName: {
    fontSize: 13,
    fontWeight: '800',
    color: colors.secondary,
  },
  labCenterArea: {
    fontSize: 11,
    color: colors.textSecondary,
  },
  distanceBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.lightTeal,
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 6,
    gap: 3,
  },
  distanceBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: colors.primary,
  },
  labCenterAddress: {
    fontSize: 11,
    color: colors.text,
    lineHeight: 15,
    marginVertical: 4,
  },
  labCenterFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 6,
    paddingTop: 6,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  labTimingsText: {
    fontSize: 11,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  labDirectionsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.secondary,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
    gap: 4,
  },
  labDirectionsBtnText: {
    fontSize: 10,
    fontWeight: '800',
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
  gpsDetectBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  gpsDetectBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.primary,
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
    height: 60,
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

  // DATES
  datesScroll: {
    gap: 8,
    paddingBottom: 6,
  },
  datePill: {
    width: 60,
    height: 70,
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

  // SLOTS
  slotGroupLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textSecondary,
    marginTop: 10,
    marginBottom: 6,
  },
  slotsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  slotItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 4,
  },
  slotItemActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  slotItemText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.text,
  },
  slotItemTextActive: {
    color: '#FFFFFF',
  },

  // PRESCRIPTION
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
    paddingHorizontal: 18,
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

export default LabBookingScreen;