import React, { useEffect, useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  FlatList,
  TouchableOpacity,
  Alert,
  StatusBar,
  Linking,
  Platform,
  Image,
  Modal,
  TextInput,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import colors from '../../../theme/colors';
import labTests from '../../../data/labTests';

const DEFAULT_SAMPLE_APPOINTMENTS = [
  {
    id: 'appt-demo-1',
    tokenNumber: 'TK-24',
    type: 'In-Person',
    doctor: {
      name: 'Dr. Ananya Rao',
      specialty: 'General Physician',
      qualification: 'MBBS, MD - General Medicine',
      experienceYears: '12',
      clinicName: 'Unnathi Multispeciality Clinic',
      clinicAddress: 'No. 24, 5th Cross, Near Vishwamanava Double Road, Kuvempunagar, Mysore - 570023',
      clinicArea: 'Kuvempunagar, Mysore',
      phone: '+91 821 245 9901',
      latitude: 12.2858,
      longitude: 76.6341,
      distance: '0.8 km away',
      fee: 500,
      image: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&q=80&w=300',
    },
    day: 'Today',
    date: 'Today, 04:30 PM',
    time: '04:30 PM',
    status: 'Confirmed',
    paidAmount: 500,
    paymentStatus: 'Pay at Clinic Reception',
    patient: {
      name: 'Ramesh (Self)',
      age: '28',
      gender: 'Male',
      reason: 'Regular Health Checkup & Fever Consultation',
    },
  },
  {
    id: 'appt-demo-3',
    tokenNumber: 'LAB-48',
    type: 'Lab Test',
    collectionMode: 'Home Sample Collection',
    tests: [
      { name: 'Complete Blood Count (CBC)' },
      { name: 'HbA1c Glycated Hemoglobin' },
      { name: 'Lipid Profile Comprehensive' },
    ],
    doctor: {
      name: 'Unnathi Pathology & Diagnostics Hub',
      specialty: 'Pathology • CBC, HbA1c & Lipid Screen',
      qualification: 'NABL & ICMR Certified Diagnostics',
      clinicName: 'Unnathi Pathology Lab',
      clinicAddress: 'Doorstep Sample Collection (Kuvempunagar, Mysore)',
      clinicArea: 'Kuvempunagar, Mysore',
      phone: '+91 821 245 9902',
      latitude: 12.2858,
      longitude: 76.6341,
      fee: 699,
      image: 'https://images.unsplash.com/photo-1579154204601-01588f351e67?auto=format&fit=crop&q=80&w=300',
    },
    day: 'Tomorrow',
    date: 'Tomorrow, 07:30 AM',
    time: '07:30 AM - 08:30 AM',
    status: 'Confirmed',
    paidAmount: 699,
    paymentStatus: 'Paid Online via UPI',
    patient: {
      name: 'Ramesh (Self)',
      age: '28',
      gender: 'Male',
      reason: 'Fasting Blood Sample Collection for Preventive Health',
    },
  },
  {
    id: 'appt-demo-2',
    tokenNumber: 'RAD-109',
    type: 'Radiology',
    doctor: {
      name: 'Unnathi Diagnostic & Imaging Center',
      specialty: 'Radiology • 3T Brain MRI with Contrast',
      qualification: 'NABL & NABH Accredited Center',
      clinicName: 'Unnathi Diagnostic Center',
      clinicAddress: 'No. 112, Kalidasa Road, Jayalakshmipuram, Mysore - 570012',
      clinicArea: 'Jayalakshmipuram, Mysore',
      phone: '+91 821 251 4400',
      latitude: 12.3168,
      longitude: 76.6321,
      distance: '1.4 km away',
      fee: 3499,
      image: 'https://images.unsplash.com/photo-1516549655169-df83a0774514?auto=format&fit=crop&q=80&w=300',
    },
    day: 'Tomorrow',
    date: 'Tomorrow, 10:00 AM',
    time: '10:00 AM',
    status: 'Confirmed',
    paidAmount: 3499,
    paymentStatus: 'Paid Online via UPI',
    patient: {
      name: 'Ramesh (Self)',
      age: '28',
      gender: 'Male',
      reason: 'Doctor Prescribed Brain Imaging Scan',
    },
  },
];

const BookingsScreen = ({ navigation, route }) => {
  const [appointments, setAppointments] = useState(DEFAULT_SAMPLE_APPOINTMENTS);
  const [selectedTab, setSelectedTab] = useState('All');
  const [activeBookingForAddTest, setActiveBookingForAddTest] = useState(null);
  const [testSearchQuery, setTestSearchQuery] = useState('');

  // Normalize an appointment item so lab tests, radiology, and doctor visits are all correctly structured
  const normalizeAppointment = (item) => {
    const isLab =
      item.type === 'Lab Test' ||
      item.type === 'Diagnostic Lab Test' ||
      item.type === 'Lab' ||
      (Array.isArray(item.tests) && item.tests.length > 0);

    const isRad = item.type === 'Radiology';

    if (isLab) {
      const testsList = Array.isArray(item.tests) ? item.tests : [];
      const testNames = testsList.map((t) => (typeof t === 'string' ? t : t.name)).filter(Boolean);
      const centerName =
        item.labCenter?.name ||
        item.doctor?.name ||
        'MediUnify Pathology & Diagnostics Hub';
      const clinicAddress =
        item.address ||
        item.labCenter?.address ||
        item.doctor?.clinicAddress ||
        (item.collectionMode?.includes('Home') ? 'Doorstep Home Sample Collection, Mysore' : 'Kuvempunagar, Mysore');

      return {
        ...item,
        type: 'Diagnostic Lab Test',
        tokenNumber: item.tokenNumber || 'LAB-88',
        collectionMode:
          item.collectionMode ||
          (item.address ? 'Home Sample Collection' : 'Visit Diagnostic Center'),
        tests: testsList,
        doctor: {
          name: centerName,
          specialty:
            testNames.length > 0
              ? `Lab Tests • ${testNames.join(', ')}`
              : item.doctor?.specialty || 'Diagnostic Profile Screening',
          qualification: 'NABL & ICMR Certified Diagnostics',
          clinicName: item.labCenter?.name || item.doctor?.clinicName || 'MediUnify Pathology Hub',
          clinicAddress: clinicAddress,
          clinicArea: item.labCenter?.area || item.doctor?.clinicArea || 'Mysore',
          phone: item.labCenter?.phone || item.doctor?.phone || '+91 821 245 9901',
          latitude: 12.2858,
          longitude: 76.6341,
          fee: item.totalAmount || item.paidAmount || item.doctor?.fee || 499,
          image:
            item.doctor?.image ||
            'https://images.unsplash.com/photo-1579154204601-01588f351e67?auto=format&fit=crop&q=80&w=300',
        },
        day: item.day || 'Scheduled',
        date: item.date || 'Scheduled Date',
        time: item.slot || item.time || 'Morning Slot',
        status: item.status || 'Confirmed',
        paidAmount: item.totalAmount || item.paidAmount || 499,
        paymentStatus: item.paymentStatus || 'Paid Online',
        patient: item.patient || { name: 'Patient (Self)', age: '28', gender: 'Male' },
        details: item,
      };
    }

    if (isRad) {
      return {
        ...item,
        type: 'Radiology',
        tokenNumber: item.tokenNumber || 'RAD-101',
        doctor: {
          name: item.lab?.name || item.doctor?.name || 'MediUnify Diagnostic & Imaging Center',
          specialty:
            item.doctor?.specialty ||
            `Radiology • ${item.tests?.map((t) => t.categoryLabel || t.name).join(', ') || '3T Scan'}`,
          qualification: 'NABL & NABH Accredited Center',
          clinicName: item.lab?.name || item.doctor?.clinicName || 'MediUnify Diagnostic Center',
          clinicAddress: item.lab?.address || item.doctor?.clinicAddress || 'Kalidasa Road, Mysore',
          clinicArea: item.lab?.area || item.doctor?.clinicArea || 'Mysore',
          phone: item.lab?.phone || item.doctor?.phone || '+91 821 245 9901',
          latitude: 12.2958,
          longitude: 76.6394,
          fee: item.payment?.paidAmount || item.paidAmount || item.doctor?.fee || 1999,
          image:
            item.doctor?.image ||
            'https://images.unsplash.com/photo-1516549655169-df83a0774514?auto=format&fit=crop&q=80&w=300',
        },
        day: item.day || item.appointmentDate?.split(',')[0] || 'Scheduled',
        date: item.date || item.appointmentDate || 'Scheduled Date',
        time: item.time || item.appointmentSlot || 'Scheduled Slot',
        status: item.status || 'Confirmed',
        paidAmount: item.payment?.paidAmount || item.paidAmount || 1999,
        paymentStatus:
          item.paymentStatus ||
          (item.payment?.method ? `Paid via ${item.payment.method}` : 'Paid Online'),
        patient: item.patient || item.patientDetails || { name: 'Self', age: '28', gender: 'Male' },
        details: item,
      };
    }

    // Default Doctor appointment
    return {
      ...item,
      type: item.type || 'Doctor Consultation',
      doctor: {
        name: item.doctor?.name || 'Medical Specialist',
        specialty: item.doctor?.specialty || 'General Medicine',
        qualification: item.doctor?.qualification || 'MBBS, MD',
        clinicName: item.doctor?.clinicName || 'MediUnify Healthcare Clinic',
        clinicAddress: item.doctor?.clinicAddress || 'Kuvempunagar, Mysore',
        clinicArea: item.doctor?.clinicArea || 'Mysore',
        phone: item.doctor?.phone || '+91 821 245 9901',
        fee: item.paidAmount || item.doctor?.fee || 500,
        image:
          item.doctor?.image ||
          'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&q=80&w=300',
      },
      day: item.day || 'Today',
      date: item.date || 'Today, 04:30 PM',
      time: item.time || '04:30 PM',
      status: item.status || 'Confirmed',
      paidAmount: item.paidAmount || 500,
      paymentStatus: item.paymentStatus || 'Pay at Clinic',
      patient: item.patient || { name: 'Self', age: '28', gender: 'Male' },
    };
  };

  const loadAppointments = async () => {
    try {
      // 1. Load doctor & direct bookings
      const apptJson = await AsyncStorage.getItem('@unnathi_appointments');
      const storedAppts = apptJson ? JSON.parse(apptJson) : [];

      // 2. Load lab bookings
      const labJson = await AsyncStorage.getItem('@labBookings');
      const storedLabs = labJson ? JSON.parse(labJson) : [];

      // 3. Load radiology bookings
      const radJson = await AsyncStorage.getItem('@radiologyBookings');
      const storedRad = radJson ? JSON.parse(radJson) : [];

      // Combine and eliminate duplicates
      const rawAll = [...storedAppts, ...storedLabs, ...storedRad];
      if (rawAll.length === 0) {
        rawAll.push(...DEFAULT_SAMPLE_APPOINTMENTS);
      }

      const uniqueMap = new Map();
      rawAll.forEach((item) => {
        if (!uniqueMap.has(item.id)) {
          uniqueMap.set(item.id, normalizeAppointment(item));
        }
      });

      // Also include route.params.newAppointment if passed
      if (route?.params?.newAppointment) {
        const normNew = normalizeAppointment(route.params.newAppointment);
        uniqueMap.set(normNew.id, normNew);
      }

      setAppointments(Array.from(uniqueMap.values()));
    } catch (e) {
      console.log('Error loading appointments:', e);
    }
  };

  useEffect(() => {
    loadAppointments();
  }, []);

  // Reload when screen gains focus
  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      loadAppointments();
    });
    return unsubscribe;
  }, [navigation]);

  // Tab Filtering
  const filteredAppointments = useMemo(() => {
    return appointments.filter((item) => {
      const isLab =
        item.type === 'Lab Test' ||
        item.type === 'Diagnostic Lab Test' ||
        item.type === 'Lab';
      const isRad = item.type === 'Radiology';
      const isDoc = !isLab && !isRad;

      if (selectedTab === 'Doctor Visits') {
        return isDoc;
      }
      if (selectedTab === 'Lab Tests') {
        return isLab;
      }
      if (selectedTab === 'Radiology Scans') {
        return isRad;
      }
      if (selectedTab === 'Confirmed') {
        return item.status === 'Confirmed' || item.status === 'Rescheduled';
      }
      if (selectedTab === 'Cancelled') {
        return item.status === 'Cancelled';
      }
      return true; // 'All'
    });
  }, [appointments, selectedTab]);

  // Appointment Counters
  const counts = useMemo(() => {
    return {
      all: appointments.length,
      doctors: appointments.filter(
        (a) =>
          a.type !== 'Radiology' &&
          a.type !== 'Lab Test' &&
          a.type !== 'Diagnostic Lab Test' &&
          a.type !== 'Lab'
      ).length,
      labTests: appointments.filter(
        (a) =>
          a.type === 'Lab Test' ||
          a.type === 'Diagnostic Lab Test' ||
          a.type === 'Lab'
      ).length,
      radiology: appointments.filter((a) => a.type === 'Radiology').length,
      confirmed: appointments.filter((a) => a.status === 'Confirmed' || a.status === 'Rescheduled').length,
      cancelled: appointments.filter((a) => a.status === 'Cancelled').length,
    };
  }, [appointments]);

  // Handle GPS Directions
  const handleOpenDirections = (item) => {
    const address = item.doctor?.clinicAddress || item.doctor?.clinicName || 'Mysore';
    const lat = item.doctor?.latitude || 12.2858;
    const lng = item.doctor?.longitude || 76.6341;
    const mapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}&query=${encodeURIComponent(address)}`;
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      window.open(mapsUrl, '_blank');
    } else {
      Linking.openURL(mapsUrl);
    }
  };

  // Quick Cancel Appointment Handler
  const handleQuickCancel = (item) => {
    Alert.alert(
      'Cancel Appointment?',
      `Are you sure you want to cancel your appointment with ${item.doctor?.name}? Any paid fees will be refunded to your MediUnnathi Wallet.`,
      [
        { text: 'Keep Booking', style: 'cancel' },
        {
          text: 'Yes, Cancel',
          style: 'destructive',
          onPress: async () => {
            const updated = appointments.map((a) =>
              a.id === item.id ? { ...a, status: 'Cancelled' } : a
            );
            setAppointments(updated);
            await AsyncStorage.setItem('@unnathi_appointments', JSON.stringify(updated));

            // Refund if paid
            if (item.paidAmount) {
              const curBalStr = await AsyncStorage.getItem('@unnathi_wallet_balance');
              const curBal = parseInt(curBalStr, 10) || 1250;
              const newBal = curBal + parseInt(item.paidAmount, 10);
              await AsyncStorage.setItem('@unnathi_wallet_balance', newBal.toString());
            }

            Alert.alert('Appointment Cancelled', 'Your booking has been cancelled and refunded.');
          },
        },
      ]
    );
  };

  // Remove a test from an appointment
  const handleRemoveTest = (appointment, testIndexToRemove) => {
    const testToRemove = appointment.tests[testIndexToRemove];
    const testName = typeof testToRemove === 'string' ? testToRemove : testToRemove.name;

    if (appointment.tests.length === 1) {
      Alert.alert(
        'Remove Single Test',
        `"${testName}" is the only test in this booking. Removing it will cancel this booking. Do you want to proceed?`,
        [
          { text: 'Keep Test', style: 'cancel' },
          {
            text: 'Cancel Booking',
            style: 'destructive',
            onPress: () => handleQuickCancel(appointment),
          },
        ]
      );
      return;
    }

    Alert.alert(
      'Remove Test from Booking',
      `Remove "${testName}" from booking #${appointment.tokenNumber || appointment.id}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Yes, Remove',
          style: 'destructive',
          onPress: async () => {
            const updatedTests = appointment.tests.filter((_, idx) => idx !== testIndexToRemove);
            const removedPrice = typeof testToRemove === 'object' && testToRemove.price ? testToRemove.price : 0;
            const updatedAmount = Math.max(0, (appointment.paidAmount || appointment.totalAmount || 0) - removedPrice);

            const updatedAppointments = appointments.map((a) => {
              if (a.id === appointment.id) {
                return normalizeAppointment({
                  ...a,
                  tests: updatedTests,
                  paidAmount: updatedAmount,
                  totalAmount: updatedAmount,
                });
              }
              return a;
            });

            setAppointments(updatedAppointments);
            await AsyncStorage.setItem('@unnathi_appointments', JSON.stringify(updatedAppointments));
            await AsyncStorage.setItem(
              '@labBookings',
              JSON.stringify(updatedAppointments.filter((a) => a.type === 'Diagnostic Lab Test'))
            );

            Alert.alert(
              'Test Removed',
              `"${testName}" has been removed. Updated booking amount: ₹${updatedAmount}`
            );
          },
        },
      ]
    );
  };

  // Add a test to an appointment
  const handleAddTestToBooking = async (appointment, testToAdd) => {
    const currentTests = appointment.tests || [];
    const isAlreadyAdded = currentTests.some(
      (t) => (typeof t === 'string' ? t : t.name) === testToAdd.name
    );

    if (isAlreadyAdded) {
      Alert.alert('Test Already Included', `"${testToAdd.name}" is already in this appointment.`);
      return;
    }

    const newTests = [
      ...currentTests,
      {
        name: testToAdd.name,
        price: testToAdd.price,
        sampleType: testToAdd.sampleType,
        fastingRequired: testToAdd.fastingRequired,
      },
    ];

    const addedPrice = testToAdd.price || 0;
    const updatedAmount = (appointment.paidAmount || appointment.totalAmount || 0) + addedPrice;

    const updatedAppointments = appointments.map((a) => {
      if (a.id === appointment.id) {
        return normalizeAppointment({
          ...a,
          tests: newTests,
          paidAmount: updatedAmount,
          totalAmount: updatedAmount,
        });
      }
      return a;
    });

    setAppointments(updatedAppointments);
    await AsyncStorage.setItem('@unnathi_appointments', JSON.stringify(updatedAppointments));
    await AsyncStorage.setItem(
      '@labBookings',
      JSON.stringify(updatedAppointments.filter((a) => a.type === 'Diagnostic Lab Test'))
    );

    setActiveBookingForAddTest(null);
    setTestSearchQuery('');

    Alert.alert(
      'Test Added Successfully',
      `"${testToAdd.name}" (+₹${addedPrice}) was added to booking #${appointment.tokenNumber || appointment.id}.\nTotal Amount: ₹${updatedAmount}`
    );
  };

  // Render Card
  const renderAppointmentCard = ({ item }) => {
    const isRadiology = item.type === 'Radiology';
    const isLabTest =
      item.type === 'Lab Test' ||
      item.type === 'Diagnostic Lab Test' ||
      item.type === 'Lab';
    const isCancelled = item.status === 'Cancelled';
    const isRescheduled = item.status === 'Rescheduled';

    return (
      <TouchableOpacity
        style={[styles.card, isCancelled && styles.cardCancelled]}
        activeOpacity={0.92}
        onPress={() => {
          if (isRadiology && item.details) {
            navigation.navigate('RadiologyOrderSuccess', { booking: item.details });
          } else {
            navigation.navigate('BookingDetails', { appointment: item });
          }
        }}
      >
        {/* CARD TOP BAR: TYPE, TOKEN & STATUS */}
        <View style={styles.cardHeader}>
          <View style={styles.cardHeaderLeft}>
            <View
              style={[
                styles.typeBadge,
                isRadiology
                  ? { backgroundColor: '#F3E8FF', borderColor: '#E9D5FF' }
                  : isLabTest
                  ? { backgroundColor: '#ECFDF5', borderColor: '#A7F3D0' }
                  : { backgroundColor: '#EFF6FF', borderColor: '#DBEAFE' },
              ]}
            >
              <Ionicons
                name={isRadiology ? 'radio' : isLabTest ? 'flask' : 'person'}
                size={12}
                color={isRadiology ? '#7C3AED' : isLabTest ? colors.teal : '#2563EB'}
              />
              <Text
                style={[
                  styles.typeBadgeText,
                  isRadiology
                    ? { color: '#7C3AED' }
                    : isLabTest
                    ? { color: colors.teal }
                    : { color: '#2563EB' },
                ]}
              >
                {isRadiology
                  ? 'Radiology Scan'
                  : isLabTest
                  ? 'Diagnostic Lab'
                  : 'Doctor Consultation'}
              </Text>
            </View>

            {item.tokenNumber ? (
              <View style={styles.tokenPill}>
                <Text style={styles.tokenPillText}>#{item.tokenNumber}</Text>
              </View>
            ) : null}
          </View>

          {/* STATUS PILL */}
          <View
            style={[
              styles.statusPill,
              isCancelled
                ? styles.statusPillCancelled
                : isRescheduled
                ? styles.statusPillRescheduled
                : styles.statusPillConfirmed,
            ]}
          >
            <View
              style={[
                styles.statusDot,
                isCancelled
                  ? { backgroundColor: colors.coral }
                  : isRescheduled
                  ? { backgroundColor: colors.aqua }
                  : { backgroundColor: colors.freshGreen },
              ]}
            />
            <Text
              style={[
                styles.statusPillText,
                isCancelled
                  ? { color: colors.coral }
                  : isRescheduled
                  ? { color: colors.aqua }
                  : { color: colors.freshGreen },
              ]}
            >
              {item.status}
            </Text>
          </View>
        </View>

        {/* LAB COLLECTION MODE ROW */}
        {isLabTest && item.collectionMode && (
          <View style={styles.collectionModeRow}>
            <Ionicons
              name={item.collectionMode.includes('Home') ? 'home' : 'business'}
              size={12}
              color={item.collectionMode.includes('Home') ? colors.freshGreen : '#D97706'}
            />
            <Text style={styles.collectionModeRowText} numberOfLines={1}>
              {item.collectionMode} • {item.doctor?.clinicAddress || 'Mysore'}
            </Text>
          </View>
        )}

        {/* DOCTOR / CENTER INFO ROW */}
        <View style={styles.doctorInfoRow}>
          <Image
            source={{
              uri:
                item.doctor?.image ||
                (isRadiology
                  ? 'https://images.unsplash.com/photo-1516549655169-df83a0774514?auto=format&fit=crop&q=80&w=300'
                  : isLabTest
                  ? 'https://images.unsplash.com/photo-1579154204601-01588f351e67?auto=format&fit=crop&q=80&w=300'
                  : 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&q=80&w=300'),
            }}
            style={styles.doctorAvatar}
          />

          <View style={styles.doctorDetailsWrap}>
            <Text style={styles.doctorName} numberOfLines={1}>
              {item.doctor?.name || 'MediUnify Healthcare Hub'}
            </Text>
            <Text style={styles.doctorSpecialty} numberOfLines={2}>
              {item.doctor?.specialty || (isLabTest ? 'Diagnostic Screening' : 'General Consultation')}
            </Text>
            {item.doctor?.qualification ? (
              <Text style={styles.doctorQual} numberOfLines={1}>
                {item.doctor.qualification}
              </Text>
            ) : null}

            <View style={styles.clinicLocationRow}>
              <Ionicons
                name={isLabTest && item.collectionMode?.includes('Home') ? 'home' : 'location'}
                size={12}
                color={colors.primary}
              />
              <Text style={styles.clinicLocationText} numberOfLines={1}>
                {item.doctor?.clinicAddress || item.doctor?.clinicName || 'Mysore'}
              </Text>
            </View>
          </View>
        </View>

        {/* LAB TESTS INCLUDED PILLS GRID WITH REMOVE & ADD BUTTONS */}
        {(isLabTest || (item.tests && item.tests.length > 0)) && (
          <View style={styles.testsListWrap}>
            <View style={styles.testsListHeaderRow}>
              <Text style={styles.testsListTitle}>
                Tests Booked ({item.tests ? item.tests.length : 0}):
              </Text>
              {!isCancelled && (
                <TouchableOpacity
                  style={styles.addTestSmallBtn}
                  onPress={() => {
                    setActiveBookingForAddTest(item);
                    setTestSearchQuery('');
                  }}
                  activeOpacity={0.8}
                >
                  <Ionicons name="add-circle" size={13} color={colors.teal} />
                  <Text style={styles.addTestSmallBtnText}>+ Add Test</Text>
                </TouchableOpacity>
              )}
            </View>

            <View style={styles.testsPillsRow}>
              {item.tests && item.tests.length > 0 ? (
                item.tests.map((t, tIdx) => (
                  <View key={tIdx} style={styles.testBadgePill}>
                    <Ionicons name="flask" size={10} color={colors.teal} />
                    <Text style={styles.testBadgePillText} numberOfLines={1}>
                      {typeof t === 'string' ? t : t.name}
                    </Text>
                    {!isCancelled && (
                      <TouchableOpacity
                        style={styles.removeTestChipBtn}
                        onPress={() => handleRemoveTest(item, tIdx)}
                        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                        activeOpacity={0.7}
                      >
                        <Ionicons name="close-circle" size={14} color="#DC2626" />
                      </TouchableOpacity>
                    )}
                  </View>
                ))
              ) : (
                <TouchableOpacity
                  style={styles.emptyAddTestPrompt}
                  onPress={() => {
                    setActiveBookingForAddTest(item);
                    setTestSearchQuery('');
                  }}
                  activeOpacity={0.8}
                >
                  <Ionicons name="add-circle-outline" size={14} color={colors.teal} />
                  <Text style={styles.emptyAddTestPromptText}>
                    No tests in this booking. Tap to add tests.
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        )}

        {/* SCHEDULED DATE & TIME HIGHLIGHT BOX */}
        <View style={styles.scheduleBox}>
          <View style={styles.scheduleBoxItem}>
            <Ionicons name="calendar" size={14} color={colors.teal} />
            <Text style={styles.scheduleLabel}>Date</Text>
            <Text style={styles.scheduleValue} numberOfLines={2}>
              {item.day ? `${item.day}, ` : ''}{item.date?.split(',')[0] || item.date}
            </Text>
          </View>

          <View style={styles.scheduleDivider} />

          <View style={[styles.scheduleBoxItem, { flex: 1.2 }]}>
            <Ionicons name="time" size={14} color="#0284C7" />
            <Text style={styles.scheduleLabel}>Time Slot</Text>
            <Text style={styles.scheduleValue} numberOfLines={2}>
              {item.time?.replace(' (Fasting)', '') || 'Morning Slot'}
            </Text>
          </View>

          <View style={styles.scheduleDivider} />

          <View style={styles.scheduleBoxItem}>
            <Ionicons name="cash" size={14} color={colors.freshGreen} />
            <Text style={styles.scheduleLabel}>Amount</Text>
            <Text
              style={[
                styles.scheduleValue,
                isCancelled && { textDecorationLine: 'line-through', color: '#94A3B8' },
              ]}
              numberOfLines={1}
            >
              ₹{item.paidAmount || item.doctor?.fee || 500}
            </Text>
          </View>
        </View>

        {/* PATIENT PROFILE CHIP */}
        {item.patient?.name && (
          <View style={styles.patientRow}>
            <Ionicons name="person-circle-outline" size={15} color={colors.slate} />
            <Text style={styles.patientText} numberOfLines={2}>
              Patient: <Text style={{ fontWeight: '700', color: '#1E293B' }}>{item.patient.name}</Text>
              {item.patient.gender ? ` • ${item.patient.gender}, ${item.patient.age || '28'} Yrs` : ''}
            </Text>
          </View>
        )}

        {/* ACTION BUTTONS */}
        <View style={styles.cardActionsContainer}>
          {!isCancelled ? (
            <>
              {/* ROW 1: 3 EQUAL ACTION PILLS */}
              <View style={styles.actionPillsRow}>
                {/* 1. GPS DIRECTIONS / TECHNICIAN CONTACT */}
                <TouchableOpacity
                  style={styles.actionPillBtn}
                  onPress={() => {
                    if (isLabTest && item.collectionMode?.includes('Home')) {
                      Alert.alert(
                        'Lab Technician Assigned',
                        `Technician Phlebotomist will arrive during ${item.time || 'your scheduled slot'} with sealed sterile sample collection kits.\n\nHelpline: +91 821 245 9902`,
                        [
                          { text: 'Call Lab Support', onPress: () => Linking.openURL('tel:18001089999') },
                          { text: 'OK' },
                        ]
                      );
                    } else {
                      handleOpenDirections(item);
                    }
                  }}
                  activeOpacity={0.8}
                >
                  <Ionicons
                    name={isLabTest && item.collectionMode?.includes('Home') ? 'call-outline' : 'navigate'}
                    size={14}
                    color="#0284C7"
                  />
                  <Text style={styles.actionPillTextBlue} numberOfLines={1}>
                    {isLabTest && item.collectionMode?.includes('Home') ? 'Tech Info' : 'Directions'}
                  </Text>
                </TouchableOpacity>

                {/* 2. RESCHEDULE */}
                <TouchableOpacity
                  style={styles.actionPillBtn}
                  onPress={() => {
                    if (isRadiology && item.details) {
                      navigation.navigate('RadiologyOrderSuccess', { booking: item.details });
                    } else {
                      navigation.navigate('BookingDetails', { appointment: item });
                    }
                  }}
                  activeOpacity={0.8}
                >
                  <Ionicons name="calendar-outline" size={14} color={colors.primary} />
                  <Text style={styles.actionPillTextPrimary} numberOfLines={1}>Reschedule</Text>
                </TouchableOpacity>

                {/* 3. CANCEL */}
                <TouchableOpacity
                  style={styles.actionPillBtnCancel}
                  onPress={() => handleQuickCancel(item)}
                  activeOpacity={0.8}
                >
                  <Ionicons name="close-circle-outline" size={14} color="#DC2626" />
                  <Text style={styles.actionPillTextRed} numberOfLines={1}>Cancel</Text>
                </TouchableOpacity>
              </View>

              {/* ROW 2: FULL WIDTH DETAILS BUTTON */}
              <TouchableOpacity
                style={styles.fullDetailsBtn}
                onPress={() => {
                  if (isRadiology && item.details) {
                    navigation.navigate('RadiologyOrderSuccess', { booking: item.details });
                  } else {
                    navigation.navigate('BookingDetails', { appointment: item });
                  }
                }}
                activeOpacity={0.85}
              >
                <Ionicons name="receipt-outline" size={14} color={colors.primary} />
                <Text style={styles.fullDetailsBtnText}>View Booking Slip & Details</Text>
                <Ionicons name="chevron-forward" size={14} color={colors.primary} />
              </TouchableOpacity>
            </>
          ) : (
            <>
              {/* CANCELLED ROW */}
              <View style={styles.actionPillsRow}>
                <TouchableOpacity
                  style={styles.rebookBtnFilled}
                  onPress={() =>
                    navigation.navigate(
                      isRadiology ? 'RadiologyLabs' : isLabTest ? 'LabTests' : 'DoctorList'
                    )
                  }
                  activeOpacity={0.85}
                >
                  <Ionicons name="refresh" size={14} color="#FFFFFF" />
                  <Text style={styles.rebookBtnFilledText}>Book Again</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.viewSummaryBtn}
                  onPress={() => navigation.navigate('BookingDetails', { appointment: item })}
                  activeOpacity={0.8}
                >
                  <Ionicons name="receipt-outline" size={14} color="#64748B" />
                  <Text style={styles.viewSummaryBtnText}>View Summary</Text>
                </TouchableOpacity>
              </View>
            </>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* TOP HEADER (CLEAN & CENTERED WITHOUT +BOOK BUTTON) */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
          activeOpacity={0.8}
        >
          <Ionicons name="arrow-back" size={20} color="#1E293B" />
        </TouchableOpacity>

        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>My Appointments</Text>
          <Text style={styles.headerSubtitle}>
            {counts.all} Total • {counts.confirmed} Active
          </Text>
        </View>

        {/* BALANCED PLACEHOLDER */}
        <View style={styles.headerRightPlaceholder} />
      </View>

      {/* FILTER TABS (WITH LAB TEST FILTER) */}
      <View style={styles.tabsContainer}>
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={[
            { key: 'All', label: `All (${counts.all})`, icon: 'apps' },
            { key: 'Doctor Visits', label: `Doctors (${counts.doctors})`, icon: 'person' },
            { key: 'Lab Tests', label: `Lab Tests (${counts.labTests})`, icon: 'flask' },
            { key: 'Radiology Scans', label: `Scans (${counts.radiology})`, icon: 'radio' },
            { key: 'Confirmed', label: `Upcoming (${counts.confirmed})`, icon: 'checkmark-circle' },
            { key: 'Cancelled', label: `Cancelled (${counts.cancelled})`, icon: 'close-circle' },
          ]}
          keyExtractor={(item) => item.key}
          contentContainerStyle={{ paddingHorizontal: 16, gap: 8 }}
          renderItem={({ item }) => {
            const isSelected = selectedTab === item.key;
            return (
              <TouchableOpacity
                style={[styles.filterTab, isSelected && styles.filterTabActive]}
                onPress={() => setSelectedTab(item.key)}
                activeOpacity={0.85}
              >
                <Ionicons
                  name={item.icon}
                  size={14}
                  color={isSelected ? '#FFFFFF' : '#64748B'}
                />
                <Text style={[styles.filterTabText, isSelected && styles.filterTabTextActive]}>
                  {item.label}
                </Text>
              </TouchableOpacity>
            );
          }}
        />
      </View>

      {/* APPOINTMENTS LIST OR EMPTY STATE */}
      {filteredAppointments.length === 0 ? (
        <View style={styles.emptyContainer}>
          <View style={styles.emptyIconCircle}>
            <Ionicons name="flask-outline" size={54} color={colors.primary} />
          </View>
          <Text style={styles.emptyTitle}>No Bookings Found</Text>
          <Text style={styles.emptySubtitle}>
            You have no appointments or tests scheduled under "{selectedTab}".
          </Text>

          <View style={styles.emptyActionRow}>
            <TouchableOpacity
              style={styles.emptyPrimaryBtn}
              onPress={() => navigation.navigate('LabTests')}
              activeOpacity={0.88}
            >
              <Ionicons name="flask" size={16} color="#FFFFFF" />
              <Text style={styles.emptyPrimaryBtnText}>Book Blood & Lab Tests</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.emptySecondaryBtn}
              onPress={() => navigation.navigate('DoctorList')}
              activeOpacity={0.88}
            >
              <Ionicons name="person" size={16} color={colors.primary} />
              <Text style={styles.emptySecondaryBtnText}>Consult a Doctor</Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : (
        <FlatList
          data={filteredAppointments}
          keyExtractor={(item) => item.id}
          renderItem={renderAppointmentCard}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      )}

      {/* ====================================================
          ADD TEST MODAL (OFFERS ALL CATALOG TESTS)
      ==================================================== */}
      <Modal
        visible={!!activeBookingForAddTest}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setActiveBookingForAddTest(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            {/* MODAL HEADER */}
            <View style={styles.modalHeader}>
              <View style={{ flex: 1 }}>
                <Text style={styles.modalTitle}>Add Test to Booking</Text>
                <Text style={styles.modalSubtitle}>
                  Booking #{activeBookingForAddTest?.tokenNumber || activeBookingForAddTest?.id}
                </Text>
              </View>
              <TouchableOpacity
                style={styles.modalCloseBtn}
                onPress={() => setActiveBookingForAddTest(null)}
                activeOpacity={0.8}
              >
                <Ionicons name="close" size={20} color="#64748B" />
              </TouchableOpacity>
            </View>

            {/* SEARCH INPUT */}
            <View style={styles.modalSearchWrap}>
              <Ionicons name="search" size={16} color="#94A3B8" />
              <TextInput
                style={styles.modalSearchInput}
                placeholder="Search blood, organ or package tests..."
                placeholderTextColor="#94A3B8"
                value={testSearchQuery}
                onChangeText={setTestSearchQuery}
              />
              {testSearchQuery ? (
                <TouchableOpacity onPress={() => setTestSearchQuery('')}>
                  <Ionicons name="close-circle" size={16} color="#94A3B8" />
                </TouchableOpacity>
              ) : null}
            </View>

            {/* TESTS LIST */}
            <FlatList
              data={labTests.filter((test) =>
                test.name.toLowerCase().includes(testSearchQuery.toLowerCase()) ||
                (test.description && test.description.toLowerCase().includes(testSearchQuery.toLowerCase()))
              )}
              keyExtractor={(item) => item.id}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.modalListContent}
              renderItem={({ item: testItem }) => {
                const isAlreadyIn = activeBookingForAddTest?.tests?.some(
                  (t) => (typeof t === 'string' ? t : t.name) === testItem.name
                );

                return (
                  <View style={styles.modalTestItem}>
                    <View style={styles.modalTestInfo}>
                      <Text style={styles.modalTestName}>{testItem.name}</Text>
                      <View style={styles.modalTestMeta}>
                        <Text style={styles.modalTestPrice}>₹{testItem.price}</Text>
                        {testItem.mrp ? (
                          <Text style={styles.modalTestMrp}>₹{testItem.mrp}</Text>
                        ) : null}
                        {testItem.parametersCount ? (
                          <Text style={styles.modalTestParams}>
                            • {testItem.parametersCount} Parameters
                          </Text>
                        ) : null}
                      </View>
                      {testItem.fastingRequired && (
                        <Text style={styles.modalFastingNotice}>• Fasting Required</Text>
                      )}
                    </View>

                    <TouchableOpacity
                      style={[
                        styles.modalAddBtn,
                        isAlreadyIn && styles.modalAddBtnDisabled,
                      ]}
                      onPress={() => {
                        if (!isAlreadyIn) {
                          handleAddTestToBooking(activeBookingForAddTest, testItem);
                        }
                      }}
                      disabled={isAlreadyIn}
                      activeOpacity={0.8}
                    >
                      <Ionicons
                        name={isAlreadyIn ? 'checkmark' : 'add'}
                        size={14}
                        color={isAlreadyIn ? '#059669' : '#FFFFFF'}
                      />
                      <Text
                        style={[
                          styles.modalAddBtnText,
                          isAlreadyIn && styles.modalAddBtnTextDisabled,
                        ]}
                      >
                        {isAlreadyIn ? 'Added' : 'Add'}
                      </Text>
                    </TouchableOpacity>
                  </View>
                );
              }}
            />
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

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
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerCenter: {
    flex: 1,
    marginLeft: 12,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.navyBlue,
  },
  headerSubtitle: {
    fontSize: 11.5,
    color: '#64748B',
    marginTop: 1,
  },
  newBookingBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 10,
    gap: 4,
  },
  newBookingBtnText: {
    color: '#FFFFFF',
    fontSize: 12.5,
    fontWeight: '800',
  },

  // TABS
  tabsContainer: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  filterTab: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 6,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  filterTabActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  filterTabText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#475569',
  },
  filterTabTextActive: {
    color: '#FFFFFF',
  },

  // LIST CONTENT
  listContent: {
    padding: 16,
    paddingBottom: 40,
  },

  // CARD ARCHITECTURE
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  cardCancelled: {
    backgroundColor: '#FAF5F5',
    borderColor: '#FEE2E2',
    opacity: 0.88,
  },

  // CARD HEADER
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  cardHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexWrap: 'wrap',
  },
  typeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    borderWidth: 1,
    gap: 4,
  },
  typeBadgeText: {
    fontSize: 10.5,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  tokenPill: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 8,
  },
  tokenPillText: {
    fontSize: 10.5,
    fontWeight: '800',
    color: '#475569',
  },
  collectionModeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#D1FAE5',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 6,
    gap: 3,
  },
  collectionModeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#065F46',
  },
  collectionModeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0FDF4',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#DCFCE7',
    marginBottom: 10,
    gap: 5,
  },
  collectionModeRowText: {
    flex: 1,
    fontSize: 11,
    fontWeight: '700',
    color: '#15803D',
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 5,
  },
  statusPillConfirmed: {
    backgroundColor: '#ECFDF5',
  },
  statusPillRescheduled: {
    backgroundColor: colors.lightTeal,
  },
  statusPillCancelled: {
    backgroundColor: '#FEF2F2',
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusPillText: {
    fontSize: 11,
    fontWeight: '800',
  },

  // DOCTOR INFO ROW
  doctorInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  doctorAvatar: {
    width: 58,
    height: 58,
    borderRadius: 14,
    backgroundColor: '#E2E8F0',
  },
  doctorDetailsWrap: {
    flex: 1,
    marginLeft: 12,
  },
  doctorName: {
    fontSize: 14.5,
    fontWeight: '800',
    color: '#1E293B',
  },
  doctorSpecialty: {
    fontSize: 11.5,
    fontWeight: '700',
    color: colors.primary,
    marginTop: 1,
    lineHeight: 16,
  },
  doctorQual: {
    fontSize: 10.5,
    color: '#64748B',
    marginTop: 1,
  },
  clinicLocationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    marginTop: 3,
  },
  clinicLocationText: {
    flex: 1,
    fontSize: 11,
    color: '#475569',
  },

  // TESTS LIST CHIPS
  testsListWrap: {
    backgroundColor: '#F0FDFA',
    borderRadius: 12,
    padding: 10,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#CCFBF1',
  },
  testsListHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  testsListTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: colors.teal,
  },
  addTestSmallBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#CCFBF1',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    gap: 3,
  },
  addTestSmallBtnText: {
    fontSize: 10.5,
    fontWeight: '800',
    color: colors.teal,
  },
  testsPillsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  testBadgePill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#99F6E4',
    gap: 4,
    maxWidth: '100%',
  },
  testBadgePillText: {
    fontSize: 10.5,
    fontWeight: '700',
    color: '#0F172A',
    flexShrink: 1,
  },
  removeTestChipBtn: {
    marginLeft: 2,
    padding: 1,
  },
  emptyAddTestPrompt: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: colors.teal,
    gap: 4,
  },
  emptyAddTestPromptText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.teal,
  },

  // MODAL STYLES FOR ADD TEST
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '80%',
    minHeight: 400,
    paddingTop: 16,
    paddingBottom: 24,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.navyBlue,
  },
  modalSubtitle: {
    fontSize: 11.5,
    fontWeight: '600',
    color: '#64748B',
    marginTop: 1,
  },
  modalCloseBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalSearchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    marginHorizontal: 16,
    marginTop: 12,
    marginBottom: 8,
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 8,
  },
  modalSearchInput: {
    flex: 1,
    fontSize: 13,
    color: '#1E293B',
    paddingVertical: 0,
  },
  modalListContent: {
    paddingHorizontal: 16,
    paddingTop: 6,
    paddingBottom: 20,
    gap: 8,
  },
  modalTestItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 10,
  },
  modalTestInfo: {
    flex: 1,
  },
  modalTestName: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 3,
  },
  modalTestMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  modalTestPrice: {
    fontSize: 13,
    fontWeight: '800',
    color: colors.teal,
  },
  modalTestMrp: {
    fontSize: 11,
    color: '#94A3B8',
    textDecorationLine: 'line-through',
  },
  modalTestParams: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '600',
  },
  modalFastingNotice: {
    fontSize: 10,
    color: '#D97706',
    fontWeight: '600',
    marginTop: 2,
  },
  modalAddBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.teal,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
    gap: 4,
  },
  modalAddBtnDisabled: {
    backgroundColor: '#ECFDF5',
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  modalAddBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
  },
  modalAddBtnTextDisabled: {
    color: '#059669',
  },

  // SCHEDULE HIGHLIGHT BOX
  scheduleBox: {
    flexDirection: 'row',
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 6,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'space-around',
    marginBottom: 10,
  },
  scheduleBoxItem: {
    alignItems: 'center',
    flex: 1,
    paddingHorizontal: 2,
  },
  scheduleLabel: {
    fontSize: 9.5,
    color: '#64748B',
    fontWeight: '700',
    textTransform: 'uppercase',
    marginTop: 2,
  },
  scheduleValue: {
    fontSize: 11.5,
    fontWeight: '800',
    color: '#1E293B',
    marginTop: 1,
    textAlign: 'center',
    lineHeight: 15,
  },
  scheduleDivider: {
    width: 1,
    height: 28,
    backgroundColor: '#CBD5E1',
  },

  // PATIENT ROW
  patientRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    gap: 6,
    marginBottom: 12,
  },
  patientText: {
    flex: 1,
    fontSize: 11,
    color: '#475569',
    lineHeight: 16,
  },

  headerRightPlaceholder: {
    width: 38,
  },

  // CARD ACTIONS ROW
  cardActionsContainer: {
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    paddingTop: 10,
    gap: 8,
  },
  actionPillsRow: {
    flexDirection: 'row',
    gap: 6,
    alignItems: 'center',
  },
  actionPillBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F8FAFC',
    paddingVertical: 7,
    paddingHorizontal: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 4,
  },
  actionPillBtnCancel: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FEF2F2',
    paddingVertical: 7,
    paddingHorizontal: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FEE2E2',
    gap: 4,
  },
  actionPillTextBlue: {
    fontSize: 11,
    fontWeight: '700',
    color: '#0284C7',
  },
  actionPillTextPrimary: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.primary,
  },
  actionPillTextRed: {
    fontSize: 11,
    fontWeight: '700',
    color: '#DC2626',
  },
  fullDetailsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.lightTeal,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 6,
  },
  fullDetailsBtnText: {
    fontSize: 11.5,
    fontWeight: '800',
    color: colors.primary,
  },
  rebookBtnFilled: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 4,
  },
  rebookBtnFilledText: {
    fontSize: 11.5,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  viewSummaryBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F8FAFC',
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 4,
  },
  viewSummaryBtnText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#64748B',
  },

  // EMPTY CONTAINER
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 30,
  },
  emptyIconCircle: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: colors.lightTeal,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#1E293B',
  },
  emptySubtitle: {
    fontSize: 13,
    color: '#64748B',
    textAlign: 'center',
    marginTop: 4,
    marginBottom: 24,
    lineHeight: 18,
  },
  emptyActionRow: {
    flexDirection: 'column',
    width: '100%',
    gap: 10,
  },
  emptyPrimaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    paddingVertical: 13,
    borderRadius: 12,
    gap: 8,
  },
  emptyPrimaryBtnText: {
    color: '#FFFFFF',
    fontSize: 13.5,
    fontWeight: '800',
  },
  emptySecondaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.lightTeal,
    paddingVertical: 13,
    borderRadius: 12,
    gap: 8,
  },
  emptySecondaryBtnText: {
    color: colors.primary,
    fontSize: 13.5,
    fontWeight: '800',
  },
});

export default BookingsScreen;