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
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import colors from '../../../theme/colors';

const BookingDetailsScreen = ({ navigation, route }) => {
  const appointment = route?.params?.appointment;

  const [currentStatus, setCurrentStatus] = useState(appointment?.status || 'Confirmed');
  const [isCancelling, setIsCancelling] = useState(false);

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
      `Are you sure you want to cancel your appointment with ${doctor.name || 'the doctor'} on ${appointment.date}?`,
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
        {/* STATUS BADGE (CONFIRMED VS CANCELLED) */}
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
          <View style={styles.successCard}>
            <View style={styles.successIconCircle}>
              <Ionicons name="checkmark-circle" size={36} color="#10B981" />
            </View>
            <View style={{ flex: 1, marginLeft: 12 }}>
              <View style={styles.tokenRow}>
                <Text style={styles.confirmed}>Appointment Confirmed</Text>
                {appointment.tokenNumber ? (
                  <View style={styles.tokenBadge}>
                    <Text style={styles.tokenText}>Token {appointment.tokenNumber}</Text>
                  </View>
                ) : null}
              </View>
              <Text style={styles.confirmedSubtitle}>
                Your clinic visit is confirmed with {doctor.name}.
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
                {appointment.day ? `${appointment.day}, ` : ''}{appointment.date}
              </Text>
            </View>

            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Scheduled Time</Text>
              <Text style={styles.infoValue}>{appointment.time}</Text>
            </View>

            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Consultation Type</Text>
              <Text style={styles.infoValue}>{appointment.type || 'In-Person Visit'}</Text>
            </View>

            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Status</Text>
              <Text style={[styles.infoValue, { color: isCancelled ? '#DC2626' : '#10B981' }]}>
                {currentStatus}
              </Text>
            </View>
          </View>

          <View style={styles.feeRow}>
            <Text style={styles.feeLabel}>Total Consultation Fee:</Text>
            <Text style={styles.feeValue}>₹{appointment.paidAmount || doctor.fee || 500}</Text>
          </View>

          {appointment.paymentStatus ? (
            <View style={[styles.paymentStatusBadge, isCancelled && { backgroundColor: '#FEE2E2' }]}>
              <Ionicons
                name={isCancelled ? 'close-circle' : 'shield-checkmark'}
                size={15}
                color={isCancelled ? '#DC2626' : '#059669'}
              />
              <Text style={[styles.paymentStatusText, isCancelled && { color: '#DC2626' }]}>
                {isCancelled ? 'Booking Cancelled • Refund Initiated' : appointment.paymentStatus}
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
            ACTIONS: GET DIRECTIONS, REBOOK, OR CANCEL
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

            <TouchableOpacity
              style={styles.cancelButton}
              onPress={handleCancelAppointment}
              disabled={isCancelling}
              activeOpacity={0.85}
            >
              <Ionicons name="close-circle-outline" size={18} color="#DC2626" />
              <Text style={styles.cancelButtonText}>Cancel This Appointment</Text>
            </TouchableOpacity>
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
    backgroundColor: colors.primary,
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
  cancelButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    paddingVertical: 13,
    borderRadius: 14,
    gap: 6,
    marginBottom: 10,
  },
  cancelButtonText: {
    color: '#DC2626',
    fontSize: 14,
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
});

export default BookingDetailsScreen;