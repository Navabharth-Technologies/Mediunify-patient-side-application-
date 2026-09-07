import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  ScrollView,
  Linking,
  Platform,
  Alert,
  Modal,
  TextInput,
  Image,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
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

const RESCHEDULE_SLOTS = {
  morning: ['09:30 AM', '10:30 AM', '11:45 AM', '12:30 PM'],
  evening: ['04:30 PM', '05:30 PM', '06:45 PM', '07:45 PM', '08:30 PM'],
};

const BookingDetailsScreen = ({ navigation, route }) => {
  const appointment = route?.params?.appointment;

  const [currentStatus, setCurrentStatus] = useState(appointment?.status || 'Confirmed');
  const [currentDate, setCurrentDate] = useState(appointment?.date || 'Today, 04:30 PM');
  const [currentDay, setCurrentDay] = useState(appointment?.day || 'Today');
  const [currentTime, setCurrentTime] = useState(appointment?.time || '04:30 PM');
  const [isCancelling, setIsCancelling] = useState(false);

  // Document Upload State
  const initialDocs = appointment?.documents || (appointment?.patient?.reportUri ? [{ id: 'doc-init', name: 'Prescription / Medical Record', uri: appointment.patient.reportUri, date: 'Attached with booking', type: 'Medical Report' }] : []);
  const [documents, setDocuments] = useState(initialDocs);
  const [isDocModalOpen, setIsDocModalOpen] = useState(false);
  const [isUploadingDoc, setIsUploadingDoc] = useState(false);
  const [previewDocUri, setPreviewDocUri] = useState(null);

  // Reschedule Modal State
  const bookingDates = generateBookingDates();
  const [isRescheduleOpen, setIsRescheduleOpen] = useState(false);
  const [rescheduleDate, setRescheduleDate] = useState(bookingDates[0]);
  const [rescheduleTime, setRescheduleTime] = useState(RESCHEDULE_SLOTS.evening[0]);
  const [rescheduleReason, setRescheduleReason] = useState('');
  const [isSavingReschedule, setIsSavingReschedule] = useState(false);

  if (!appointment) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorWrap}>
          <Ionicons name="alert-circle-outline" size={48} color={colors.warning} />
          <Text style={styles.errorText}>Appointment information unavailable.</Text>
          <TouchableOpacity
            style={styles.backHomeBtn}
            onPress={() => navigation.navigate('Home')}
          >
            <Text style={styles.backHomeText}>Go to Home</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const isRadiology =
    appointment.type === 'Radiology' ||
    appointment.bookingType === 'Radiology' ||
    appointment.type === 'Radiology Scan' ||
    appointment.details?.bookingType === 'Radiology' ||
    appointment.details?.type === 'Radiology';

  const isVideo =
    !isRadiology &&
    (appointment.type === 'Video Consultation' ||
    appointment.type === 'Video' ||
    appointment.type === 'TeleConsultation' ||
    !!appointment.videoRoomLink);

  const isLabTest =
    !isRadiology &&
    !isVideo &&
    (appointment.type === 'Lab Test' ||
    appointment.type === 'Diagnostic Lab Test' ||
    appointment.type === 'Lab' ||
    (Array.isArray(appointment.tests) && appointment.tests.length > 0));

  const testsList =
    Array.isArray(appointment.tests) && appointment.tests.length > 0
      ? appointment.tests
      : Array.isArray(appointment.details?.tests) && appointment.details.tests.length > 0
      ? appointment.details.tests
      : appointment.test
      ? [appointment.test]
      : [];

  const doctor = appointment.doctor || appointment.details?.doctor || {};
  const labInfo = appointment.lab || appointment.details?.lab || {};
  const clinicName =
    labInfo.name ||
    doctor.clinicName ||
    doctor.name ||
    (isVideo
      ? 'MediUnify Virtual TeleHealth Room'
      : isRadiology
      ? 'Unnathi Diagnostic & Imaging Center'
      : 'Unnathi Multispeciality Clinic');
  const clinicAddress =
    labInfo.address ||
    doctor.clinicAddress ||
    (isVideo
      ? 'Online Video Consultation Room (Live HD Encrypted)'
      : isRadiology
      ? 'No. 112, Kalidasa Road, Jayalakshmipuram, Mysore - 570012'
      : 'No. 24, 5th Cross, Near Vishwamanava Double Road, Kuvempunagar, Mysore - 570023');
  const clinicArea = labInfo.area || doctor.clinicArea || (isVideo ? 'Virtual Care Hub' : isRadiology ? 'Jayalakshmipuram, Mysore' : 'Kuvempunagar, Mysore');
  const clinicPhone = labInfo.phone || doctor.phone || '+91 821 251 4400';
  const distance = doctor.distance || (isVideo ? 'Instant Online' : isRadiology ? '1.4 km away' : '0.8 km away');
  const latitude = doctor.latitude || 12.2858;
  const longitude = doctor.longitude || 76.6341;
  const isCancelled = currentStatus === 'Cancelled';
  const isRescheduled = currentStatus === 'Rescheduled';

  // Open Google Maps / Apple Maps Directions
  const openDirections = () => {
    if (isVideo) {
      navigation.navigate('VideoMeeting', { appointment, doctor });
      return;
    }
    const destinationQuery = encodeURIComponent(`${clinicName}, ${clinicAddress}`);
    const webMapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}&query=${destinationQuery}`;

    if (Platform.OS === 'web') {
      if (typeof window !== 'undefined') {
        window.open(webMapsUrl, '_blank');
      } else {
        Linking.openURL(webMapsUrl);
      }
      return;
    }

    const nativeUrl = Platform.select({
      ios: `maps:0,0?q=${destinationQuery}@${latitude},${longitude}`,
      android: `geo:0,0?q=${latitude},${longitude}(${encodeURIComponent(clinicName)})`,
      default: webMapsUrl,
    });

    Linking.canOpenURL(nativeUrl)
      .then((supported) => {
        if (supported) {
          Linking.openURL(nativeUrl);
        } else {
          Linking.openURL(webMapsUrl);
        }
      })
      .catch(() => {
        Linking.openURL(webMapsUrl);
      });
  };

  // Call Clinic Reception
  const callClinic = () => {
    const cleanNumber = clinicPhone.replace(/[^0-9+]/g, '');
    const telUrl = `tel:${cleanNumber}`;
    Linking.canOpenURL(telUrl)
      .then((supported) => {
        if (supported) {
          Linking.openURL(telUrl);
        } else {
          Alert.alert('Clinic Contact', `Call clinic reception at: ${clinicPhone}`);
        }
      })
      .catch(() => {
        Alert.alert('Clinic Contact', `Call clinic reception at: ${clinicPhone}`);
      });
  };

  // Handle Cancel Appointment
  const handleCancelAppointment = () => {
    Alert.alert(
      'Cancel Appointment?',
      `Are you sure you want to cancel your appointment with ${doctor.name || 'the doctor'} on ${currentDate}?`,
      [
        { text: 'Keep Appointment', style: 'cancel' },
        {
          text: 'Yes, Cancel Appointment',
          style: 'destructive',
          onPress: async () => {
            try {
              setIsCancelling(true);

              // 1. Update doctor appointments in AsyncStorage
              const apptJson = await AsyncStorage.getItem('@unnathi_appointments');
              if (apptJson) {
                const storedAppts = JSON.parse(apptJson);
                const updated = storedAppts.map((a) =>
                  a.id === appointment.id ? { ...a, status: 'Cancelled' } : a
                );
                await AsyncStorage.setItem('@unnathi_appointments', JSON.stringify(updated));
              }

              // 2. Update video bookings if applicable
              const vidJson = await AsyncStorage.getItem('@videoBookings');
              if (vidJson) {
                const storedVid = JSON.parse(vidJson);
                const updatedVid = storedVid.map((v) =>
                  v.id === appointment.id ? { ...v, status: 'Cancelled' } : v
                );
                await AsyncStorage.setItem('@videoBookings', JSON.stringify(updatedVid));
              }

              // 3. Update radiology bookings if applicable
              const radJson = await AsyncStorage.getItem('@radiologyBookings');
              if (radJson) {
                const storedRad = JSON.parse(radJson);
                const updatedRad = storedRad.map((r) =>
                  r.id === appointment.id ? { ...r, status: 'Cancelled' } : r
                );
                await AsyncStorage.setItem('@radiologyBookings', JSON.stringify(updatedRad));
              }

              setCurrentStatus('Cancelled');
              setIsCancelling(false);

              Alert.alert(
                'Appointment Cancelled',
                `Your appointment has been cancelled successfully.\n\nFee refund (₹${appointment.paidAmount || doctor.fee || 450}) has been initiated to your MediUnify Wallet.`
              );
            } catch (err) {
              setIsCancelling(false);
              Alert.alert('Error', 'Unable to cancel appointment. Please try again.');
            }
          },
        },
      ]
    );
  };

  // Confirm Reschedule
  const handleConfirmReschedule = async () => {
    if (!rescheduleTime) {
      Alert.alert('Select Time Slot', 'Please select a new time slot.');
      return;
    }

    try {
      setIsSavingReschedule(true);

      const newDateStr = rescheduleDate.fullText;
      const newDayStr = rescheduleDate.dayName;
      const newTimeStr = rescheduleTime;

      // 1. Update in @unnathi_appointments
      const apptJson = await AsyncStorage.getItem('@unnathi_appointments');
      if (apptJson) {
        const storedAppts = JSON.parse(apptJson);
        const updated = storedAppts.map((a) =>
          a.id === appointment.id
            ? {
                ...a,
                date: newDateStr,
                day: newDayStr,
                time: newTimeStr,
                status: 'Rescheduled',
                rescheduleReason: rescheduleReason || undefined,
              }
            : a
        );
        await AsyncStorage.setItem('@unnathi_appointments', JSON.stringify(updated));
      }

      // 2. Update in @videoBookings
      const vidJson = await AsyncStorage.getItem('@videoBookings');
      if (vidJson) {
        const storedVid = JSON.parse(vidJson);
        const updatedVid = storedVid.map((v) =>
          v.id === appointment.id
            ? {
                ...v,
                date: newDateStr,
                day: newDayStr,
                time: newTimeStr,
                status: 'Rescheduled',
              }
            : v
        );
        await AsyncStorage.setItem('@videoBookings', JSON.stringify(updatedVid));
      }

      // 3. Update in @radiologyBookings
      const radJson = await AsyncStorage.getItem('@radiologyBookings');
      if (radJson) {
        const storedRad = JSON.parse(radJson);
        const updatedRad = storedRad.map((r) =>
          r.id === appointment.id
            ? {
                ...r,
                appointmentDate: newDateStr,
                appointmentSlot: newTimeStr,
                status: 'Rescheduled',
              }
            : r
        );
        await AsyncStorage.setItem('@radiologyBookings', JSON.stringify(updatedRad));
      }

      setCurrentDate(newDateStr);
      setCurrentDay(newDayStr);
      setCurrentTime(newTimeStr);
      setCurrentStatus('Rescheduled');
      setIsSavingReschedule(false);
      setIsRescheduleOpen(false);

      Alert.alert(
        'Appointment Rescheduled! 🎉',
        `Your consultation with ${doctor.name} has been rescheduled to ${newDateStr} at ${newTimeStr}.`
      );
    } catch (e) {
      setIsSavingReschedule(false);
      Alert.alert('Error', 'Failed to reschedule. Please try again.');
    }
  };

  // Pick Document / Photo
  const handlePickDocument = async (isCamera) => {
    try {
      setIsUploadingDoc(true);
      let result;
      if (isCamera) {
        const { status } = await ImagePicker.requestCameraPermissionsAsync();
        if (status !== 'granted') {
          setIsUploadingDoc(false);
          Alert.alert('Permission Needed', 'Please allow camera access to capture documents.');
          return;
        }
        result = await ImagePicker.launchCameraAsync({
          quality: 0.85,
          allowsEditing: true,
        });
      } else {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
          setIsUploadingDoc(false);
          Alert.alert('Permission Needed', 'Please allow photo library access to upload documents.');
          return;
        }
        result = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
          quality: 0.85,
          allowsEditing: true,
        });
      }

      setIsUploadingDoc(false);

      if (!result.canceled && result.assets?.[0]) {
        const newDoc = {
          id: `doc-${Date.now()}`,
          name: `${isCamera ? 'Photo_Scan_' : 'Medical_Doc_'}${Date.now().toString().slice(-4)}.jpg`,
          uri: result.assets[0].uri,
          date: 'Just now',
          type: 'Patient Record',
        };

        const updatedDocs = [newDoc, ...documents];
        setDocuments(updatedDocs);
        setIsDocModalOpen(false);

        // Update in AsyncStorage
        const apptJson = await AsyncStorage.getItem('@unnathi_appointments');
        if (apptJson) {
          const stored = JSON.parse(apptJson);
          const updated = stored.map((a) =>
            a.id === appointment.id ? { ...a, documents: updatedDocs } : a
          );
          await AsyncStorage.setItem('@unnathi_appointments', JSON.stringify(updated));
        }

        if (isVideo) {
          const vidJson = await AsyncStorage.getItem('@videoBookings');
          if (vidJson) {
            const storedVid = JSON.parse(vidJson);
            const updatedVid = storedVid.map((v) =>
              v.id === appointment.id ? { ...v, documents: updatedDocs } : v
            );
            await AsyncStorage.setItem('@videoBookings', JSON.stringify(updatedVid));
          }
        }

        Alert.alert(
          'Document Uploaded! 📄',
          `"${newDoc.name}" has been attached to your appointment record.`
        );
      }
    } catch (err) {
      setIsUploadingDoc(false);
      console.log('Error uploading document:', err);
      Alert.alert('Upload Error', 'Failed to upload document. Please try again.');
    }
  };

  // Delete Document
  const handleDeleteDocument = async (docId) => {
    const updatedDocs = documents.filter((d) => d.id !== docId);
    setDocuments(updatedDocs);

    const apptJson = await AsyncStorage.getItem('@unnathi_appointments');
    if (apptJson) {
      const stored = JSON.parse(apptJson);
      const updated = stored.map((a) =>
        a.id === appointment.id ? { ...a, documents: updatedDocs } : a
      );
      await AsyncStorage.setItem('@unnathi_appointments', JSON.stringify(updated));
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
          activeOpacity={0.8}
        >
          <Ionicons name="arrow-back" size={22} color={colors.secondary} />
        </TouchableOpacity>

        <Text style={styles.title}>{isVideo ? 'Video Consultation' : 'Appointment Details'}</Text>

        <TouchableOpacity
          style={styles.headerShareBtn}
          onPress={() => {
            if (isVideo) {
              navigation.navigate('VideoMeeting', { appointment, doctor });
            } else {
              openDirections();
            }
          }}
          activeOpacity={0.8}
        >
          <Ionicons name={isVideo ? 'videocam' : 'navigate-circle-outline'} size={24} color={isVideo ? '#7C3AED' : colors.primary} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* STATUS BADGE (CONFIRMED VS RESCHEDULED VS CANCELLED) */}
        {isCancelled ? (
          <View style={styles.cancelledCard}>
            <View style={styles.cancelledIconCircle}>
              <Ionicons name="close-circle" size={32} color="#DC2626" />
            </View>
            <View style={{ flex: 1, marginLeft: 12 }}>
              <View style={styles.tokenRow}>
                <Text style={styles.cancelledTitle}>Cancelled</Text>
                <View style={styles.cancelledBadge}>
                  <Text style={styles.cancelledBadgeText}>CANCELLED</Text>
                </View>
              </View>
              <Text style={styles.cancelledSubtitle}>
                This booking has been cancelled.
              </Text>
            </View>
          </View>
        ) : (
          <View style={[styles.statusBanner, isRescheduled && styles.statusBannerRescheduled]}>
            <View style={styles.statusLeft}>
              <View style={styles.tokenRow}>
                <Text style={styles.tokenNumber}>
                  #{appointment.tokenNumber || (isRadiology ? 'RAD-109' : isLabTest ? 'LAB-88' : 'APP-42')}
                </Text>
                <View style={[styles.confirmedBadge, isRescheduled && styles.rescheduledBadge]}>
                  <Text style={[styles.confirmedBadgeText, isRescheduled && styles.rescheduledBadgeText]}>
                    {currentStatus.toUpperCase()}
                  </Text>
                </View>
              </View>
              <Text style={styles.bookingIdText}>Booking ID: {appointment.id || 'BK-7890'}</Text>
            </View>
            <View style={[styles.statusIconCircle, isRescheduled && styles.statusIconCircleRescheduled]}>
              <Ionicons
                name={isRescheduled ? 'time' : 'checkmark-circle'}
                size={24}
                color={isRescheduled ? colors.primary : '#059669'}
              />
            </View>
          </View>
        )}

        {/* CLINIC / DIAGNOSTIC CENTER / VIDEO CONSULTATION DIRECTIONS & LOCATION */}
        {isVideo ? (
          <View style={[styles.directionCard, { borderColor: '#DDD6FE', backgroundColor: '#FAF5FF' }]}>
            <View style={styles.directionCardHeader}>
              <View style={[styles.mapIconCircle, { backgroundColor: '#7C3AED' }]}>
                <Ionicons name="videocam" size={20} color="#FFFFFF" />
              </View>
              <View style={{ flex: 1, marginLeft: 10 }}>
                <Text style={[styles.directionHeaderLabel, { color: '#7C3AED' }]}>LIVE TELEHEALTH CONSULTATION</Text>
                <Text style={styles.clinicName}>{clinicName}</Text>
              </View>
              <View style={[styles.distanceBadge, { backgroundColor: '#ECFDF5', borderColor: '#A7F3D0' }]}>
                <Ionicons name="shield-checkmark" size={12} color="#059669" />
                <Text style={[styles.distanceBadgeText, { color: '#059669' }]}>Encrypted</Text>
              </View>
            </View>

            {/* VIDEO ROOM FEATURES */}
            <View style={[styles.addressBox, { backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#EDE9FE' }]}>
              <Ionicons name="document-attach" size={18} color="#7C3AED" style={{ marginTop: 2 }} />
              <View style={{ flex: 1, marginLeft: 10 }}>
                <Text style={[styles.clinicAddressText, { color: '#1E293B', fontWeight: '700' }]}>
                  In-Call Document Upload Enabled
                </Text>
                <Text style={[styles.clinicAreaText, { color: '#64748B' }]}>
                  Upload reports or symptom photos to doctor in-call.
                </Text>
              </View>
            </View>

            {/* ENTER VIDEO ROOM ACTION BUTTON */}
            <View style={styles.directionBtnRow}>
              <TouchableOpacity
                style={[styles.getDirectionsBtn, { backgroundColor: '#7C3AED', flex: 1 }]}
                onPress={() => navigation.navigate('VideoMeeting', { appointment, doctor })}
                activeOpacity={0.88}
              >
                <Ionicons name="videocam" size={17} color="#FFFFFF" />
                <Text style={styles.getDirectionsText}>Join Video Call</Text>
                <Ionicons name="arrow-forward" size={15} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <View style={styles.directionCard}>
            <View style={styles.directionCardHeader}>
              <View style={[styles.mapIconCircle, isRadiology && { backgroundColor: '#7C3AED' }]}>
                <Ionicons name={isRadiology ? 'scan-outline' : 'location'} size={20} color="#FFFFFF" />
              </View>
              <View style={{ flex: 1, marginLeft: 10 }}>
                <Text style={[styles.directionHeaderLabel, isRadiology && { color: '#7C3AED' }]}>
                  {isRadiology ? 'IMAGING & SCAN CENTER LOCATION' : isLabTest ? 'DIAGNOSTIC CENTER LOCATION' : 'CLINIC LOCATION'}
                </Text>
                <Text style={styles.clinicName}>{clinicName}</Text>
              </View>
              <View style={styles.distanceBadge}>
                <Ionicons name="car-outline" size={12} color="#059669" />
                <Text style={styles.distanceBadgeText}>{distance}</Text>
              </View>
            </View>

            {/* ADDRESS DETAILS */}
            <View style={styles.addressBox}>
              <Ionicons name="business-outline" size={16} color={colors.slate} style={{ marginTop: 2 }} />
              <View style={{ flex: 1, marginLeft: 10 }}>
                <Text style={styles.clinicAddressText}>{clinicAddress}</Text>
                <Text style={styles.clinicAreaText}>{clinicArea}</Text>
              </View>
            </View>

            {/* MAP DIRECTION ACTION BUTTONS */}
            <View style={styles.directionBtnRow}>
              <TouchableOpacity
                style={[styles.getDirectionsBtn, isRadiology && { backgroundColor: '#7C3AED' }]}
                onPress={openDirections}
                activeOpacity={0.88}
              >
                <Ionicons name="navigate" size={16} color="#FFFFFF" />
                <Text style={styles.getDirectionsText}>Directions</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.callClinicBtn}
                onPress={callClinic}
                activeOpacity={0.88}
              >
                <Ionicons name="call" size={15} color={colors.primary} />
                <Text style={styles.callClinicText}>Call Center</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* DOCTOR / CENTER INFO CARD */}
        <View style={styles.card}>
          <View style={styles.cardHeaderRow}>
            <Ionicons name={isRadiology ? 'scan-outline' : isLabTest ? 'flask-outline' : 'medkit-outline'} size={18} color={isRadiology ? '#7C3AED' : colors.primary} />
            <Text style={styles.sectionTitle}>
              {isRadiology ? 'Diagnostic & Imaging Center' : isLabTest ? 'Pathology & Diagnostic Hub' : 'Doctor'}
            </Text>
          </View>

          <View style={styles.doctorInfoRow}>
            <View style={[styles.doctorAvatarBox, isRadiology && { backgroundColor: '#F3E8FF' }]}>
              <Ionicons name={isRadiology ? 'radio' : isLabTest ? 'flask' : 'person'} size={24} color={isRadiology ? '#7C3AED' : colors.primary} />
            </View>
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={styles.doctorName}>{clinicName || doctor.name}</Text>
              <Text style={styles.specialty}>{doctor.specialty || (isRadiology ? 'High-Precision 3T MRI, CT & Ultrasound Center' : 'Diagnostics')}</Text>
              <Text style={styles.doctorHospital}>{doctor.qualification || (isRadiology ? 'NABL & NABH Accredited Center' : clinicAddress)}</Text>
            </View>
          </View>
        </View>

        {/* APPOINTMENT SCHEDULE & TIME */}
        <View style={styles.card}>
          <View style={styles.cardHeaderRow}>
            <Ionicons name="calendar-outline" size={18} color={colors.primary} />
            <Text style={styles.sectionTitle}>Schedule</Text>
          </View>

          <View style={styles.infoGrid}>
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Date</Text>
              <Text style={styles.infoValue}>
                {currentDay ? `${currentDay}, ` : ''}{currentDate}
              </Text>
            </View>

            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Slot</Text>
              <Text style={styles.infoValue}>{currentTime}</Text>
            </View>

            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Type</Text>
              <Text style={styles.infoValue}>{isRadiology ? 'Radiology Scan' : isLabTest ? 'Diagnostic Lab Test' : appointment.type || 'In-Person'}</Text>
            </View>

            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Status</Text>
              <Text
                style={[
                  styles.infoValue,
                  {
                    color: isCancelled
                      ? '#DC2626'
                      : isRescheduled
                      ? colors.primary
                      : '#10B981',
                  },
                ]}
              >
                {currentStatus}
              </Text>
            </View>
          </View>

          <View style={styles.feeRow}>
            <Text style={styles.feeLabel}>Total Amount:</Text>
            <Text style={styles.feeValue}>₹{appointment.paidAmount || appointment.payment?.paidAmount || doctor.fee || 1999}</Text>
          </View>

          {appointment.paymentStatus || appointment.payment?.paymentStatus ? (
            <View
              style={[
                styles.paymentStatusBadge,
                isCancelled && { backgroundColor: '#FEE2E2' },
                isRescheduled && { backgroundColor: '#EFF6FF' },
              ]}
            >
              <Ionicons
                name={
                  isCancelled
                    ? 'close-circle'
                    : isRescheduled
                    ? 'time-outline'
                    : 'shield-checkmark'
                }
                size={14}
                color={
                  isCancelled
                    ? '#DC2626'
                    : isRescheduled
                    ? colors.primary
                    : '#059669'
                }
              />
              <Text
                style={[
                  styles.paymentStatusText,
                  isCancelled && { color: '#DC2626' },
                  isRescheduled && { color: colors.primary },
                ]}
              >
                {isCancelled
                  ? 'Cancelled • Refund Initiated'
                  : isRescheduled
                  ? 'Rescheduled Slot'
                  : appointment.paymentStatus || appointment.payment?.paymentStatus || 'Paid Online via UPI'}
              </Text>
            </View>
          ) : null}
        </View>

        {/* PATIENT INFO (IF AVAILABLE) */}
        {appointment.patient ? (
          <View style={styles.card}>
            <View style={styles.cardHeaderRow}>
              <Ionicons name="person-outline" size={18} color={colors.primary} />
              <Text style={styles.sectionTitle}>Patient</Text>
            </View>
            <View style={styles.infoGrid}>
              <View style={styles.infoItem}>
                <Text style={styles.infoLabel}>Name</Text>
                <Text style={styles.infoValue}>{appointment.patient.name}</Text>
              </View>
              {appointment.patient.phone ? (
                <View style={styles.infoItem}>
                  <Text style={styles.infoLabel}>Phone</Text>
                  <Text style={styles.infoValue}>{appointment.patient.phone}</Text>
                </View>
              ) : null}
              {appointment.patient.age ? (
                <View style={styles.infoItem}>
                  <Text style={styles.infoLabel}>Age & Gender</Text>
                  <Text style={styles.infoValue}>
                    {appointment.patient.age} Yrs • {appointment.patient.gender}
                  </Text>
                </View>
              ) : null}
              {appointment.patient.reason ? (
                <View style={[styles.infoItem, { width: '100%' }]}>
                  <Text style={styles.infoLabel}>Reason</Text>
                  <Text style={styles.infoValue}>{appointment.patient.reason}</Text>
                </View>
              ) : null}
            </View>
          </View>
        ) : null}

        {/* ==================================================
            🧪 INCLUDED LAB TESTS & RADIOLOGY SCANS
        ================================================== */}
        {(isRadiology || isLabTest || testsList.length > 0) && (
          <View style={styles.card}>
            <View style={styles.cardHeaderRow}>
              <View style={styles.testHeaderLeft}>
                <Ionicons
                  name={isRadiology ? 'scan-outline' : 'flask'}
                  size={18}
                  color={isRadiology ? '#7C3AED' : colors.teal}
                />
                <Text style={styles.sectionTitle}>
                  {isRadiology
                    ? `Included Radiology Scans (${testsList.length || 1})`
                    : `Included Diagnostic Tests (${testsList.length || 1})`}
                </Text>
              </View>
              <View
                style={[
                  styles.nablBadge,
                  isRadiology && { backgroundColor: '#F3E8FF', borderColor: '#DDD6FE' },
                ]}
              >
                <Ionicons
                  name="shield-checkmark"
                  size={12}
                  color={isRadiology ? '#7C3AED' : '#047857'}
                />
                <Text
                  style={[
                    styles.nablBadgeText,
                    isRadiology && { color: '#7C3AED' },
                  ]}
                >
                  {isRadiology ? 'NABH & NABL' : 'NABL & ICMR'}
                </Text>
              </View>
            </View>

            {/* TEST / SCAN ITEMS LIST */}
            <View style={styles.testItemsContainer}>
              {testsList.length > 0 ? (
                testsList.map((testItem, idx) => {
                  const testObj = typeof testItem === 'string' ? { name: testItem } : testItem;
                  const testName = testObj.name || testObj.title || testObj.testName || 'Diagnostic Scan';
                  const scanCategory = testObj.categoryLabel || testObj.modality || testObj.category || (isRadiology ? 'Radiology Scan' : 'Blood Test');
                  const duration = testObj.duration || (isRadiology ? '15-30 Mins' : '10 Mins');
                  const prep = testObj.instructions || testObj.preparation || (isRadiology ? 'Wear comfortable clothes, remove metal & jewelry' : (testObj.fastingRequired ? 'Fasting (8-10 Hrs)' : 'No Fasting Required'));

                  return (
                    <View key={idx} style={styles.testDetailRow}>
                      <View
                        style={[
                          styles.testNumberCircle,
                          isRadiology && { backgroundColor: '#F3E8FF' },
                        ]}
                      >
                        <Text
                          style={[
                            styles.testNumberText,
                            isRadiology && { color: '#7C3AED' },
                          ]}
                        >
                          {idx + 1}
                        </Text>
                      </View>
                      <View style={styles.testInfoCol}>
                        <Text style={styles.testDetailName}>{testName}</Text>
                        <View style={styles.testTagsWrap}>
                          <View
                            style={[
                              styles.sampleTagPill,
                              isRadiology && { backgroundColor: '#EDE9FE' },
                            ]}
                          >
                            <Ionicons
                              name={isRadiology ? 'radio-outline' : 'water-outline'}
                              size={10}
                              color={isRadiology ? '#7C3AED' : '#DC2626'}
                            />
                            <Text
                              style={[
                                styles.sampleTagText,
                                isRadiology && { color: '#7C3AED' },
                              ]}
                            >
                              {scanCategory}
                            </Text>
                          </View>
                          <View style={styles.fastingTagPill}>
                            <Ionicons name="time-outline" size={10} color="#D97706" />
                            <Text style={styles.fastingTagText}>
                              {duration}
                            </Text>
                          </View>
                          <View style={styles.tatTagPill}>
                            <Ionicons name="document-text-outline" size={10} color="#2563EB" />
                            <Text style={styles.tatTagText}>
                              {isRadiology ? 'HD Digital Film & Report' : 'Results in 12-24 Hrs'}
                            </Text>
                          </View>
                        </View>
                        {prep ? (
                          <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4 }}>
                            <Ionicons name="information-circle-outline" size={11} color="#64748B" />
                            <Text style={{ fontSize: 11, color: '#64748B', marginLeft: 3 }}>
                              Prep: {prep}
                            </Text>
                          </View>
                        ) : null}
                      </View>
                      {(testObj.price || testObj.mrp) ? (
                        <Text style={styles.testPriceText}>₹{testObj.price || testObj.mrp}</Text>
                      ) : null}
                    </View>
                  );
                })
              ) : (
                <View style={styles.testDetailRow}>
                  <View style={styles.testNumberCircle}>
                    <Text style={styles.testNumberText}>1</Text>
                  </View>
                  <View style={styles.testInfoCol}>
                    <Text style={styles.testDetailName}>
                      {isRadiology ? 'Radiology Scan & Imaging' : 'Comprehensive Diagnostic Profile'}
                    </Text>
                    <Text style={styles.sampleTagText}>
                      {isRadiology ? '3T MRI / CT / Ultrasound Scan • NABH Accredited' : 'Sample: Blood & Urine • NABL Certified'}
                    </Text>
                  </View>
                </View>
              )}
            </View>

            {/* ASSURANCE BANNER */}
            <View style={styles.labAssuranceBanner}>
              <Ionicons
                name="checkmark-circle"
                size={15}
                color={isRadiology ? '#7C3AED' : '#059669'}
              />
              <Text style={styles.labAssuranceText}>
                {isRadiology
                  ? 'High-precision 3T/128-Slice imaging verified by Senior MD Radiologists.'
                  : 'Barcoded & temperature-controlled vacutainers used for 100% sample integrity.'}
              </Text>
            </View>
          </View>
        )}

        {/* ==================================================
            📁 MEDICAL RECORDS & UPLOADED DOCUMENTS CARD
        ================================================== */}
        <View style={styles.card}>
          <View style={styles.cardHeaderRow}>
            <Ionicons name="document-text-outline" size={18} color={colors.primary} />
            <Text style={styles.sectionTitle}>Medical Records & Documents</Text>
          </View>

          <View style={styles.docsActionTopRow}>
            <Text style={styles.docsCountText}>
              {documents.length} File{documents.length === 1 ? '' : 's'} Attached
            </Text>
            <TouchableOpacity
              style={styles.uploadDocBtnSmall}
              onPress={() => setIsDocModalOpen(true)}
              activeOpacity={0.8}
            >
              <Ionicons name="cloud-upload-outline" size={14} color={colors.primary} />
              <Text style={styles.uploadDocBtnSmallText}>+ Upload File</Text>
            </TouchableOpacity>
          </View>

          {documents.length === 0 ? (
            <TouchableOpacity
              style={styles.emptyDocBox}
              onPress={() => setIsDocModalOpen(true)}
              activeOpacity={0.8}
            >
              <Ionicons name="cloud-upload-outline" size={32} color="#94A3B8" />
              <Text style={styles.emptyDocTitle}>Upload Previous Reports or Photos</Text>
              <Text style={styles.emptyDocSub}>
                Attach prescriptions, lab reports, or symptom images for doctor's review.
              </Text>
            </TouchableOpacity>
          ) : (
            <View style={styles.docsListWrap}>
              {documents.map((doc, dIdx) => (
                <View key={doc.id || dIdx} style={styles.docCardItem}>
                  {doc.uri ? (
                    <TouchableOpacity
                      onPress={() => setPreviewDocUri(doc.uri)}
                      activeOpacity={0.85}
                    >
                      <Image source={{ uri: doc.uri }} style={styles.docCardThumb} />
                    </TouchableOpacity>
                  ) : (
                    <View style={styles.docCardThumbPlaceholder}>
                      <Ionicons name="document-text" size={22} color={colors.primary} />
                    </View>
                  )}

                  <View style={styles.docCardMeta}>
                    <Text style={styles.docCardName} numberOfLines={1}>
                      {doc.name || `Document_${dIdx + 1}.jpg`}
                    </Text>
                    <Text style={styles.docCardDate}>{doc.date || 'Attached'}</Text>
                  </View>

                  <View style={styles.docCardBtnRow}>
                    {doc.uri ? (
                      <TouchableOpacity
                        style={styles.docActionIconBtn}
                        onPress={() => setPreviewDocUri(doc.uri)}
                        activeOpacity={0.8}
                      >
                        <Ionicons name="eye-outline" size={16} color={colors.primary} />
                      </TouchableOpacity>
                    ) : null}
                    <TouchableOpacity
                      style={styles.docActionIconBtnDelete}
                      onPress={() => handleDeleteDocument(doc.id)}
                      activeOpacity={0.8}
                    >
                      <Ionicons name="trash-outline" size={16} color="#DC2626" />
                    </TouchableOpacity>
                  </View>
                </View>
              ))}
            </View>
          )}
        </View>

        {/* ==================================================
            ACTIONS: GET DIRECTIONS, RESCHEDULE, OR CANCEL
        ================================================== */}
        {!isCancelled ? (
          <>
            <TouchableOpacity
              style={[styles.primaryActionBtn, isVideo && { backgroundColor: '#7C3AED' }]}
              onPress={() => {
                if (isVideo) {
                  navigation.navigate('VideoMeeting', { appointment, doctor });
                } else {
                  openDirections();
                }
              }}
              activeOpacity={0.88}
            >
              <Ionicons name={isVideo ? 'videocam' : 'navigate-outline'} size={18} color="#FFFFFF" />
              <Text style={styles.primaryActionText}>
                {isVideo ? 'Join Video Call Room' : 'Get Directions'}
              </Text>
            </TouchableOpacity>

            {/* RESCHEDULE & CANCEL BUTTON ROW */}
            <View style={styles.actionsTwinRow}>
              <TouchableOpacity
                style={styles.rescheduleTwinBtn}
                onPress={() => setIsRescheduleOpen(true)}
                activeOpacity={0.88}
              >
                <Ionicons name="calendar" size={16} color={colors.primary} />
                <Text style={styles.rescheduleTwinText}>Reschedule</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.cancelTwinBtn}
                onPress={handleCancelAppointment}
                disabled={isCancelling}
                activeOpacity={0.88}
              >
                <Ionicons name="close-circle-outline" size={16} color="#DC2626" />
                <Text style={styles.cancelTwinText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </>
        ) : (
          <TouchableOpacity
            style={styles.rebookButton}
            onPress={() => navigation.navigate('DoctorList')}
            activeOpacity={0.88}
          >
            <Ionicons name="refresh" size={17} color="#FFFFFF" />
            <Text style={styles.rebookButtonText}>Book Again</Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity
          style={styles.homeButton}
          onPress={() => navigation.navigate('Home')}
          activeOpacity={0.85}
        >
          <Text style={styles.homeButtonText}>Back to Home</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* ==================================================
          RESCHEDULE APPOINTMENT MODAL
      ================================================== */}
      <Modal
        visible={isRescheduleOpen}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setIsRescheduleOpen(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {/* MODAL HEADER */}
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>Reschedule Appointment</Text>
                <Text style={styles.modalSubtitle}>With {doctor.name || 'Doctor'}</Text>
              </View>
              <TouchableOpacity
                style={styles.modalCloseBtn}
                onPress={() => setIsRescheduleOpen(false)}
              >
                <Ionicons name="close" size={22} color="#64748B" />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              {/* SELECT DATE */}
              <Text style={styles.modalSectionLabel}>1. Select New Date</Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.dateScroll}
              >
                {bookingDates.map((item, index) => {
                  const isSelected = rescheduleDate.dateStr === item.dateStr;
                  return (
                    <TouchableOpacity
                      key={index}
                      style={[
                        styles.dateCard,
                        isSelected && styles.dateCardActive,
                      ]}
                      onPress={() => setRescheduleDate(item)}
                      activeOpacity={0.8}
                    >
                      <Text
                        style={[
                          styles.dayName,
                          isSelected && styles.dayNameActive,
                        ]}
                      >
                        {item.dayName}
                      </Text>
                      <Text
                        style={[
                          styles.dayNum,
                          isSelected && styles.dayNumActive,
                        ]}
                      >
                        {item.dayNum}
                      </Text>
                      <Text
                        style={[
                          styles.monthName,
                          isSelected && styles.monthNameActive,
                        ]}
                      >
                        {item.month}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>

              {/* SELECT TIME SLOT */}
              <Text style={styles.modalSectionLabel}>2. Select New Time Slot</Text>

              {/* MORNING */}
              <Text style={styles.slotCategoryLabel}>☀️ Morning Slots</Text>
              <View style={styles.slotsGrid}>
                {RESCHEDULE_SLOTS.morning.map((slot, index) => {
                  const isSelected = rescheduleTime === slot;
                  return (
                    <TouchableOpacity
                      key={index}
                      style={[
                        styles.slotChip,
                        isSelected && styles.slotChipActive,
                      ]}
                      onPress={() => setRescheduleTime(slot)}
                      activeOpacity={0.8}
                    >
                      <Ionicons
                        name="time-outline"
                        size={14}
                        color={isSelected ? '#FFFFFF' : '#64748B'}
                      />
                      <Text
                        style={[
                          styles.slotText,
                          isSelected && styles.slotTextActive,
                        ]}
                      >
                        {slot}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* EVENING */}
              <Text style={[styles.slotCategoryLabel, { marginTop: 12 }]}>🌆 Evening Slots</Text>
              <View style={styles.slotsGrid}>
                {RESCHEDULE_SLOTS.evening.map((slot, index) => {
                  const isSelected = rescheduleTime === slot;
                  return (
                    <TouchableOpacity
                      key={index}
                      style={[
                        styles.slotChip,
                        isSelected && styles.slotChipActive,
                      ]}
                      onPress={() => setRescheduleTime(slot)}
                      activeOpacity={0.8}
                    >
                      <Ionicons
                        name="time-outline"
                        size={14}
                        color={isSelected ? '#FFFFFF' : '#64748B'}
                      />
                      <Text
                        style={[
                          styles.slotText,
                          isSelected && styles.slotTextActive,
                        ]}
                      >
                        {slot}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* OPTIONAL REASON */}
              <Text style={[styles.modalSectionLabel, { marginTop: 16 }]}>
                3. Reason for Reschedule (Optional)
              </Text>
              <TextInput
                style={styles.modalInput}
                placeholder="e.g., Change in schedule, unexpected travel..."
                placeholderTextColor="#94A3B8"
                value={rescheduleReason}
                onChangeText={setRescheduleReason}
              />

              {/* SUMMARY BOX */}
              <View style={styles.modalSummaryBox}>
                <Ionicons name="information-circle-outline" size={18} color={colors.primary} />
                <Text style={styles.modalSummaryText}>
                  Your appointment will be shifted to{' '}
                  <Text style={{ fontWeight: '800', color: colors.primary }}>
                    {rescheduleDate.fullText} at {rescheduleTime}
                  </Text>
                  . No additional fee will be charged.
                </Text>
              </View>

              {/* MODAL ACTIONS */}
              <View style={styles.modalActionsRow}>
                <TouchableOpacity
                  style={styles.modalCancelBtn}
                  onPress={() => setIsRescheduleOpen(false)}
                >
                  <Text style={styles.modalCancelText}>Cancel</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.modalConfirmBtn}
                  onPress={handleConfirmReschedule}
                  disabled={isSavingReschedule}
                  activeOpacity={0.88}
                >
                  <Ionicons name="checkmark-circle" size={18} color="#FFFFFF" />
                  <Text style={styles.modalConfirmText}>Confirm Reschedule</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* ====================================================
          DOCUMENT UPLOAD ACTION MODAL
      ==================================================== */}
      <Modal
        visible={isDocModalOpen}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setIsDocModalOpen(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { maxHeight: '60%' }]}>
            {/* MODAL HEADER */}
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>Upload Medical File</Text>
                <Text style={styles.modalSubtitle}>Prescription, scan or symptom photo</Text>
              </View>
              <TouchableOpacity
                style={styles.modalCloseBtn}
                onPress={() => setIsDocModalOpen(false)}
              >
                <Ionicons name="close" size={22} color="#64748B" />
              </TouchableOpacity>
            </View>

            <View style={styles.uploadOptionsContainer}>
              <TouchableOpacity
                style={[styles.uploadOptionCard, { backgroundColor: '#F0FDF4', borderColor: '#BBF7D0' }]}
                onPress={() => handlePickDocument(true)}
                disabled={isUploadingDoc}
                activeOpacity={0.8}
              >
                <View style={[styles.uploadOptionIconBox, { backgroundColor: '#DCFCE7' }]}>
                  <Ionicons name="camera" size={24} color="#059669" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.uploadOptionTitle, { color: '#059669' }]}>Take Photo</Text>
                  <Text style={styles.uploadOptionSub}>Use camera to scan paper report or symptoms</Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color="#059669" />
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.uploadOptionCard, { backgroundColor: '#F0FDFA', borderColor: '#99F6E4' }]}
                onPress={() => handlePickDocument(false)}
                disabled={isUploadingDoc}
                activeOpacity={0.8}
              >
                <View style={[styles.uploadOptionIconBox, { backgroundColor: colors.lightTeal }]}>
                  <Ionicons name="images" size={24} color={colors.primary} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.uploadOptionTitle, { color: colors.primary }]}>Photo Library / Files</Text>
                  <Text style={styles.uploadOptionSub}>Select existing photos or scans from device</Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color={colors.primary} />
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* ====================================================
          FULL SCREEN DOCUMENT PREVIEW MODAL
      ==================================================== */}
      <Modal
        visible={!!previewDocUri}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setPreviewDocUri(null)}
      >
        <View style={styles.previewOverlay}>
          <TouchableOpacity
            style={styles.previewCloseBtn}
            onPress={() => setPreviewDocUri(null)}
            activeOpacity={0.8}
          >
            <Ionicons name="close-circle" size={34} color="#FFFFFF" />
          </TouchableOpacity>

          {previewDocUri ? (
            <Image
              source={{ uri: previewDocUri }}
              style={styles.previewImage}
              resizeMode="contain"
            />
          ) : null}
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
  header: {
    height: 60,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
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
  title: {
    fontSize: 17,
    fontWeight: '800',
    color: '#1E293B',
  },
  headerShareBtn: {
    width: 38,
    height: 38,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    padding: 16,
    paddingBottom: 40,
  },
  successCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ECFDF5',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#A7F3D0',
    marginBottom: 14,
  },
  successIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#D1FAE5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  tokenRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  confirmed: {
    fontSize: 15,
    fontWeight: '800',
    color: '#065F46',
  },
  tokenBadge: {
    backgroundColor: '#059669',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  tokenText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '800',
  },
  confirmedSubtitle: {
    fontSize: 12,
    color: '#047857',
    marginTop: 2,
  },

  // CANCELLED CARD
  cancelledCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF2F2',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#FECACA',
    marginBottom: 14,
  },
  cancelledIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FEE2E2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelledTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#991B1B',
  },
  cancelledBadge: {
    backgroundColor: '#DC2626',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  cancelledBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '800',
  },
  cancelledSubtitle: {
    fontSize: 12,
    color: '#B91C1C',
    marginTop: 2,
  },

  // DIRECTION CARD
  directionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1.5,
    borderColor: '#BAE6FD',
    shadowColor: '#0284C7',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 3,
  },
  directionCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  mapIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#0284C7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  directionHeaderLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: '#0284C7',
    letterSpacing: 0.5,
  },
  clinicName: {
    fontSize: 15,
    fontWeight: '800',
    color: '#1E293B',
    marginTop: 1,
  },
  distanceBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 4,
  },
  distanceBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#059669',
  },
  addressBox: {
    flexDirection: 'row',
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 14,
  },
  clinicAddressText: {
    fontSize: 13,
    color: '#1E293B',
    lineHeight: 18,
    fontWeight: '500',
  },
  clinicAreaText: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 3,
    fontWeight: '600',
  },
  directionBtnRow: {
    flexDirection: 'row',
    gap: 10,
  },
  getDirectionsBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0284C7',
    paddingVertical: 12,
    borderRadius: 12,
    gap: 6,
  },
  getDirectionsText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  callClinicBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.lightTeal,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 12,
    gap: 6,
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  callClinicText: {
    color: colors.primary,
    fontSize: 13,
    fontWeight: '700',
  },

  // CARD STYLES
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#1E293B',
  },
  doctorInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  doctorAvatarBox: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.lightTeal,
    alignItems: 'center',
    justifyContent: 'center',
  },
  doctorName: {
    fontSize: 16,
    fontWeight: '800',
    color: '#1E293B',
  },
  specialty: {
    fontSize: 13,
    color: colors.primary,
    fontWeight: '600',
    marginTop: 2,
  },
  doctorHospital: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  infoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  infoItem: {
    width: '47%',
  },
  infoLabel: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '500',
    marginBottom: 2,
  },
  infoValue: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1E293B',
  },
  feeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 10,
    marginTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  feeLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748B',
  },
  feeValue: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.primary,
  },
  paymentStatusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ECFDF5',
    padding: 10,
    borderRadius: 10,
    marginTop: 10,
    gap: 6,
  },
  paymentStatusText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#059669',
  },

  primaryActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0284C7',
    paddingVertical: 14,
    borderRadius: 14,
    gap: 8,
    marginTop: 4,
    marginBottom: 10,
  },
  primaryActionText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
  },

  // TWIN ACTIONS
  actionsTwinRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 10,
  },
  rescheduleTwinBtn: {
    flex: 1.3,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.lightTeal,
    borderWidth: 1,
    borderColor: '#99F6E4',
    paddingVertical: 13,
    borderRadius: 14,
    gap: 6,
  },
  rescheduleTwinText: {
    color: colors.primary,
    fontSize: 13.5,
    fontWeight: '700',
  },
  cancelTwinBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    paddingVertical: 13,
    borderRadius: 14,
    gap: 6,
  },
  cancelTwinText: {
    color: '#DC2626',
    fontSize: 13.5,
    fontWeight: '700',
  },

  rebookButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    paddingVertical: 14,
    borderRadius: 14,
    gap: 8,
    marginTop: 4,
    marginBottom: 10,
  },
  rebookButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
  },
  homeButton: {
    height: 48,
    borderRadius: 12,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  homeButtonText: {
    color: '#475569',
    fontSize: 14,
    fontWeight: '700',
  },
  errorWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 15,
    color: '#64748B',
    marginTop: 12,
    textAlign: 'center',
  },
  backHomeBtn: {
    marginTop: 16,
    backgroundColor: colors.primary,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 10,
  },
  backHomeText: {
    color: '#FFFFFF',
    fontWeight: '700',
  },

  // ==================================================
  // RESCHEDULE MODAL STYLES
  // ==================================================
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    maxHeight: '85%',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    paddingBottom: 12,
    marginBottom: 14,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#1E293B',
  },
  modalSubtitle: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  modalCloseBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalSectionLabel: {
    fontSize: 13.5,
    fontWeight: '800',
    color: '#1E293B',
    marginBottom: 10,
  },
  dateScroll: {
    gap: 8,
    paddingBottom: 14,
  },
  dateCard: {
    width: 65,
    height: 75,
    borderRadius: 14,
    backgroundColor: '#F8FAFC',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 4,
  },
  dateCardActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  dayName: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '600',
  },
  dayNameActive: {
    color: '#E0F2FE',
  },
  dayNum: {
    fontSize: 17,
    fontWeight: '800',
    color: '#1E293B',
    marginVertical: 2,
  },
  dayNumActive: {
    color: '#FFFFFF',
  },
  monthName: {
    fontSize: 10,
    color: '#94A3B8',
    fontWeight: '700',
  },
  monthNameActive: {
    color: '#E0F2FE',
  },
  slotCategoryLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#475569',
    marginBottom: 8,
  },
  slotsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  slotChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 10,
    gap: 6,
  },
  slotChipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  slotText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#334155',
  },
  slotTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  modalInput: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    padding: 12,
    fontSize: 13,
    color: '#1E293B',
  },
  modalSummaryBox: {
    flexDirection: 'row',
    backgroundColor: '#EFF6FF',
    borderRadius: 12,
    padding: 12,
    marginTop: 14,
    gap: 8,
    borderWidth: 1,
    borderColor: '#BFDBFE',
    alignItems: 'center',
  },
  modalSummaryText: {
    flex: 1,
    fontSize: 12,
    color: '#1E40AF',
    lineHeight: 17,
  },
  modalActionsRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 18,
    paddingBottom: 10,
  },
  modalCancelBtn: {
    flex: 1,
    backgroundColor: '#F1F5F9',
    paddingVertical: 13,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalCancelText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#64748B',
  },
  modalConfirmBtn: {
    flex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    paddingVertical: 13,
    borderRadius: 12,
    gap: 6,
  },
  modalConfirmText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#FFFFFF',
  },

  // MEDICAL DOCUMENTS SECTION STYLES
  docsActionTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  docsCountText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748B',
  },
  uploadDocBtnSmall: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0FDFA',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#99F6E4',
    gap: 4,
  },
  uploadDocBtnSmallText: {
    fontSize: 11.5,
    fontWeight: '800',
    color: colors.primary,
  },
  emptyDocBox: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
    paddingHorizontal: 16,
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderStyle: 'dashed',
  },
  emptyDocTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#475569',
    marginTop: 6,
  },
  emptyDocSub: {
    fontSize: 11.5,
    color: '#94A3B8',
    textAlign: 'center',
    marginTop: 4,
    lineHeight: 16,
  },
  docsListWrap: {
    gap: 8,
  },
  docCardItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 10,
    padding: 8,
    gap: 10,
  },
  docCardThumb: {
    width: 44,
    height: 44,
    borderRadius: 6,
    backgroundColor: '#E2E8F0',
  },
  docCardThumbPlaceholder: {
    width: 44,
    height: 44,
    borderRadius: 6,
    backgroundColor: colors.lightTeal,
    alignItems: 'center',
    justifyContent: 'center',
  },
  docCardMeta: {
    flex: 1,
  },
  docCardName: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#1E293B',
  },
  docCardDate: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
  },
  docCardBtnRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  docActionIconBtn: {
    padding: 6,
    borderRadius: 6,
    backgroundColor: '#F0FDFA',
  },
  docActionIconBtnDelete: {
    padding: 6,
    borderRadius: 6,
    backgroundColor: '#FEF2F2',
  },

  // UPLOAD OPTIONS MODAL
  uploadOptionsContainer: {
    gap: 12,
    marginTop: 16,
    paddingBottom: 10,
  },
  uploadOptionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 14,
    borderWidth: 1.5,
    gap: 12,
  },
  uploadOptionIconBox: {
    width: 46,
    height: 46,
    borderRadius: 23,
    alignItems: 'center',
    justifyContent: 'center',
  },
  uploadOptionTitle: {
    fontSize: 14,
    fontWeight: '800',
  },
  uploadOptionSub: {
    fontSize: 11.5,
    color: '#64748B',
    marginTop: 2,
  },

  // DIAGNOSTIC LAB TESTS STYLES
  testHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  nablBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  nablBadgeText: {
    fontSize: 10.5,
    fontWeight: '800',
    color: '#047857',
  },
  testItemsContainer: {
    marginTop: 10,
    gap: 10,
  },
  testDetailRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 10,
  },
  testNumberCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#CCFBF1',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 1,
  },
  testNumberText: {
    fontSize: 11,
    fontWeight: '900',
    color: '#0F766E',
  },
  testInfoCol: {
    flex: 1,
  },
  testDetailName: {
    fontSize: 13.5,
    fontWeight: '800',
    color: '#1E293B',
    lineHeight: 18,
  },
  testTagsWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 6,
  },
  sampleTagPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#FEF2F2',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  sampleTagText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#DC2626',
  },
  fastingTagPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  fastingTagText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#B45309',
  },
  tatTagPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  tatTagText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#1D4ED8',
  },
  testPriceText: {
    fontSize: 13.5,
    fontWeight: '900',
    color: '#0F766E',
    marginTop: 2,
  },
  labAssuranceBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#ECFDF5',
    padding: 10,
    borderRadius: 10,
    marginTop: 12,
    borderWidth: 1,
    borderColor: '#D1FAE5',
  },
  labAssuranceText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#065F46',
    flex: 1,
    lineHeight: 15,
  },

  // PREVIEW OVERLAY
  previewOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.92)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  previewCloseBtn: {
    position: 'absolute',
    top: 50,
    right: 20,
    zIndex: 10,
  },
  previewImage: {
    width: '100%',
    height: '80%',
  },
});

export default BookingDetailsScreen;