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
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
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

  const doctor = appointment.doctor || {};
  const clinicName = doctor.clinicName || 'Unnathi Multispeciality Clinic';
  const clinicAddress =
    doctor.clinicAddress ||
    'No. 24, 5th Cross, Near Vishwamanava Double Road, Kuvempunagar, Mysore - 570023';
  const clinicArea = doctor.clinicArea || 'Kuvempunagar, Mysore';
  const clinicPhone = doctor.phone || '+91 821 245 9901';
  const distance = doctor.distance || '0.8 km away';
  const latitude = doctor.latitude || 12.2858;
  const longitude = doctor.longitude || 76.6341;
  const isCancelled = currentStatus === 'Cancelled';
  const isRescheduled = currentStatus === 'Rescheduled';

  // Open Google Maps / Apple Maps Directions
  const openDirections = () => {
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

              // 2. Update radiology bookings if applicable
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
                `Your appointment has been cancelled successfully.\n\nFee refund (₹${appointment.paidAmount || doctor.fee || 500}) has been initiated to your Unnathi Wallet.`
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

      // 2. Update in @radiologyBookings
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
        `Your clinic visit with ${doctor.name} has been rescheduled to ${newDateStr} at ${newTimeStr}.`
      );
    } catch (e) {
      setIsSavingReschedule(false);
      Alert.alert('Error', 'Failed to reschedule. Please try again.');
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

        <Text style={styles.title}>Appointment & Directions</Text>

        <TouchableOpacity
          style={styles.headerShareBtn}
          onPress={openDirections}
          activeOpacity={0.8}
        >
          <Ionicons name="navigate-circle-outline" size={26} color={colors.primary} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* STATUS BADGE (CONFIRMED VS RESCHEDULED VS CANCELLED) */}
        {isCancelled ? (
          <View style={styles.cancelledCard}>
            <View style={styles.cancelledIconCircle}>
              <Ionicons name="close-circle" size={36} color="#DC2626" />
            </View>
            <View style={{ flex: 1, marginLeft: 12 }}>
              <View style={styles.tokenRow}>
                <Text style={styles.cancelledTitle}>Appointment Cancelled</Text>
                <View style={styles.cancelledBadge}>
                  <Text style={styles.cancelledBadgeText}>CANCELLED</Text>
                </View>
              </View>
              <Text style={styles.cancelledSubtitle}>
                This clinic visit has been cancelled. You can re-book anytime.
              </Text>
            </View>
          </View>
        ) : (
          <View style={[styles.successCard, isRescheduled && { backgroundColor: '#EFF6FF', borderColor: '#BFDBFE' }]}>
            <View style={[styles.successIconCircle, isRescheduled && { backgroundColor: '#DBEAFE' }]}>
              <Ionicons
                name={isRescheduled ? 'calendar' : 'checkmark-circle'}
                size={34}
                color={isRescheduled ? colors.primary : '#10B981'}
              />
            </View>
            <View style={{ flex: 1, marginLeft: 12 }}>
              <View style={styles.tokenRow}>
                <Text style={[styles.confirmed, isRescheduled && { color: colors.primary }]}>
                  {isRescheduled ? 'Appointment Rescheduled' : 'Appointment Confirmed'}
                </Text>
                {appointment.tokenNumber ? (
                  <View style={[styles.tokenBadge, isRescheduled && { backgroundColor: colors.primary }]}>
                    <Text style={styles.tokenText}>Token {appointment.tokenNumber}</Text>
                  </View>
                ) : null}
              </View>
              <Text style={[styles.confirmedSubtitle, isRescheduled && { color: '#1E40AF' }]}>
                {isRescheduled
                  ? `Updated slot confirmed for ${currentDate} at ${currentTime}.`
                  : `Your clinic visit is confirmed with ${doctor.name}.`}
              </Text>
            </View>
          </View>
        )}

        {/* ==================================================
            📍 CLINIC LOCATION & DIRECTIONS CARD (HIGHLIGHTED)
        ================================================== */}
        <View style={styles.directionCard}>
          <View style={styles.directionCardHeader}>
            <View style={styles.mapIconCircle}>
              <Ionicons name="location" size={22} color="#FFFFFF" />
            </View>
            <View style={{ flex: 1, marginLeft: 10 }}>
              <Text style={styles.directionHeaderLabel}>CLINIC LOCATION & ROUTE</Text>
              <Text style={styles.clinicName}>{clinicName}</Text>
            </View>
            <View style={styles.distanceBadge}>
              <Ionicons name="car-outline" size={12} color="#059669" />
              <Text style={styles.distanceBadgeText}>{distance}</Text>
            </View>
          </View>

          {/* ADDRESS DETAILS */}
          <View style={styles.addressBox}>
            <Ionicons name="business-outline" size={18} color={colors.slate} style={{ marginTop: 2 }} />
            <View style={{ flex: 1, marginLeft: 10 }}>
              <Text style={styles.clinicAddressText}>{clinicAddress}</Text>
              <Text style={styles.clinicAreaText}>Area: {clinicArea}</Text>
            </View>
          </View>

          {/* MAP DIRECTION ACTION BUTTONS */}
          <View style={styles.directionBtnRow}>
            <TouchableOpacity
              style={styles.getDirectionsBtn}
              onPress={openDirections}
              activeOpacity={0.88}
            >
              <Ionicons name="navigate" size={18} color="#FFFFFF" />
              <Text style={styles.getDirectionsText}>Get Directions</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.callClinicBtn}
              onPress={callClinic}
              activeOpacity={0.88}
            >
              <Ionicons name="call" size={17} color={colors.primary} />
              <Text style={styles.callClinicText}>Call Clinic</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* DOCTOR INFO CARD */}
        <View style={styles.card}>
          <View style={styles.cardHeaderRow}>
            <Ionicons name="medkit-outline" size={20} color={colors.primary} />
            <Text style={styles.sectionTitle}>Doctor Details</Text>
          </View>

          <View style={styles.doctorInfoRow}>
            <View style={styles.doctorAvatarBox}>
              <Ionicons name="person" size={26} color={colors.primary} />
            </View>
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={styles.doctorName}>{doctor.name}</Text>
              <Text style={styles.specialty}>{doctor.specialty}</Text>
              <Text style={styles.doctorHospital}>{clinicName}</Text>
            </View>
          </View>
        </View>

        {/* APPOINTMENT SCHEDULE & TIME */}
        <View style={styles.card}>
          <View style={styles.cardHeaderRow}>
            <Ionicons name="calendar-outline" size={20} color={colors.primary} />
            <Text style={styles.sectionTitle}>Appointment Schedule</Text>
          </View>

          <View style={styles.infoGrid}>
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Date & Day</Text>
              <Text style={styles.infoValue}>
                {currentDay ? `${currentDay}, ` : ''}{currentDate}
              </Text>
            </View>

            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Scheduled Time</Text>
              <Text style={styles.infoValue}>{currentTime}</Text>
            </View>

            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Consultation Type</Text>
              <Text style={styles.infoValue}>{appointment.type || 'In-Person Visit'}</Text>
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
            <Text style={styles.feeLabel}>Total Consultation Fee:</Text>
            <Text style={styles.feeValue}>₹{appointment.paidAmount || doctor.fee || 500}</Text>
          </View>

          {appointment.paymentStatus ? (
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
                size={15}
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
                  ? 'Booking Cancelled • Refund Initiated'
                  : isRescheduled
                  ? 'Rescheduled • Confirmed Slot'
                  : appointment.paymentStatus}
              </Text>
            </View>
          ) : null}
        </View>

        {/* PATIENT INFO (IF AVAILABLE) */}
        {appointment.patient ? (
          <View style={styles.card}>
            <View style={styles.cardHeaderRow}>
              <Ionicons name="person-outline" size={20} color={colors.primary} />
              <Text style={styles.sectionTitle}>Patient Information</Text>
            </View>
            <View style={styles.infoGrid}>
              <View style={styles.infoItem}>
                <Text style={styles.infoLabel}>Patient Name</Text>
                <Text style={styles.infoValue}>{appointment.patient.name}</Text>
              </View>
              {appointment.patient.phone ? (
                <View style={styles.infoItem}>
                  <Text style={styles.infoLabel}>Contact Number</Text>
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
                  <Text style={styles.infoLabel}>Reason for Visit</Text>
                  <Text style={styles.infoValue}>{appointment.patient.reason}</Text>
                </View>
              ) : null}
            </View>
          </View>
        ) : null}

        {/* ==================================================
            ACTIONS: GET DIRECTIONS, RESCHEDULE, OR CANCEL
        ================================================== */}
        {!isCancelled ? (
          <>
            <TouchableOpacity
              style={styles.primaryActionBtn}
              onPress={openDirections}
              activeOpacity={0.88}
            >
              <Ionicons name="navigate-outline" size={20} color="#FFFFFF" />
              <Text style={styles.primaryActionText}>Get GPS Directions to Clinic</Text>
            </TouchableOpacity>

            {/* RESCHEDULE & CANCEL BUTTON ROW */}
            <View style={styles.actionsTwinRow}>
              <TouchableOpacity
                style={styles.rescheduleTwinBtn}
                onPress={() => setIsRescheduleOpen(true)}
                activeOpacity={0.88}
              >
                <Ionicons name="calendar" size={17} color={colors.primary} />
                <Text style={styles.rescheduleTwinText}>Reschedule Slot</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.cancelTwinBtn}
                onPress={handleCancelAppointment}
                disabled={isCancelling}
                activeOpacity={0.88}
              >
                <Ionicons name="close-circle-outline" size={17} color="#DC2626" />
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
            <Ionicons name="refresh" size={18} color="#FFFFFF" />
            <Text style={styles.rebookButtonText}>Book Another Appointment</Text>
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
});

export default BookingDetailsScreen;