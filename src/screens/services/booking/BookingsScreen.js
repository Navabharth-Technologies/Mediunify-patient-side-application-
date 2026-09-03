import React, { useEffect, useState } from 'react';
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
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import colors from '../../../theme/colors';

const DEFAULT_SAMPLE_APPOINTMENTS = [
  {
    id: 'appt-demo-1',
    tokenNumber: 'TK-24',
    type: 'In-Person',
    doctor: {
      name: 'Dr. Ananya Rao',
      specialty: 'General Physician',
      clinicName: 'Unnathi Multispeciality Clinic',
      clinicAddress: 'No. 24, 5th Cross, Near Vishwamanava Double Road, Kuvempunagar, Mysore - 570023',
      clinicArea: 'Kuvempunagar, Mysore',
      phone: '+91 821 245 9901',
      latitude: 12.2858,
      longitude: 76.6341,
      distance: '0.8 km away',
      fee: 500,
    },
    day: 'Today',
    date: 'Today, 04:30 PM',
    time: '04:30 PM',
    status: 'Confirmed',
    paidAmount: 500,
    paymentStatus: 'Pay at Clinic Reception',
    patient: {
      name: 'User',
      age: '28',
      gender: 'Male',
      reason: 'Regular Health Checkup & Fever Consultation',
    },
  },
];

const BookingsScreen = ({ navigation, route }) => {
  const [appointments, setAppointments] = useState(DEFAULT_SAMPLE_APPOINTMENTS);
  const [selectedTab, setSelectedTab] = useState('All');

  const loadAppointments = async () => {
    try {
      // 1. Load doctor appointments
      const apptJson = await AsyncStorage.getItem('@unnathi_appointments');
      const storedAppts = apptJson ? JSON.parse(apptJson) : [];

      // 2. Load radiology bookings
      const radJson = await AsyncStorage.getItem('@radiologyBookings');
      const storedRad = radJson ? JSON.parse(radJson) : [];

      const formattedRad = storedRad.map((r) => ({
        id: r.id,
        doctor: {
          name: r.lab?.name || 'Diagnostic Center',
          specialty: `Radiology • ${r.tests?.map((t) => t.categoryLabel || t.name).join(', ')}`,
          clinicName: r.lab?.name || 'Diagnostic Center',
          clinicAddress: r.lab?.address || 'Mysore Diagnostic Hub',
          clinicArea: r.lab?.area || 'Mysore',
          phone: r.lab?.phone || '+91 821 245 9901',
          latitude: r.lab?.latitude || 12.2958,
          longitude: r.lab?.longitude || 76.6394,
        },
        day: r.appointmentDate?.split(',')[0] || 'Scheduled',
        date: r.appointmentDate,
        time: r.appointmentSlot,
        status: r.status || 'Confirmed',
        type: 'Radiology',
        tokenNumber: r.tokenNumber,
        paidAmount: r.payment?.paidAmount,
        details: r,
      }));

      // Combine and eliminate duplicates
      const all = [...storedAppts, ...formattedRad];
      if (all.length === 0) {
        all.push(...DEFAULT_SAMPLE_APPOINTMENTS);
      }

      const uniqueMap = new Map();
      all.forEach((item) => {
        if (!uniqueMap.has(item.id)) {
          uniqueMap.set(item.id, item);
        }
      });

      // Also include route.params.newAppointment if passed
      if (route?.params?.newAppointment) {
        uniqueMap.set(route.params.newAppointment.id, route.params.newAppointment);
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

  const filteredAppointments = appointments.filter((item) => {
    if (selectedTab === 'Radiology Scans') {
      return item.type === 'Radiology';
    }
    if (selectedTab === 'Doctor Visits') {
      return item.type !== 'Radiology';
    }
    return true;
  });

  const renderAppointment = ({ item }) => {
    const isRadiology = item.type === 'Radiology';

    return (
      <TouchableOpacity
        style={styles.card}
        activeOpacity={0.88}
        onPress={() => {
          if (isRadiology && item.details) {
            navigation.navigate('RadiologyOrderSuccess', {
              booking: item.details,
            });
          } else {
            navigation.navigate('BookingDetails', {
              appointment: item,
            });
          }
        }}
      >
        <View
          style={[
            styles.iconContainer,
            isRadiology && { backgroundColor: colors.lightTeal },
          ]}
        >
          <Ionicons
            name={isRadiology ? 'scan-outline' : 'calendar-outline'}
            size={26}
            color={isRadiology ? colors.primary : '#1976D2'}
          />
        </View>

        <View style={styles.info}>
          {/* BADGE */}
          <View style={styles.topBadgeRow}>
            <View
              style={[
                styles.typeBadge,
                isRadiology && { backgroundColor: colors.lightTeal },
              ]}
            >
              <Text
                style={[
                  styles.typeBadgeText,
                  isRadiology && { color: colors.primary },
                ]}
              >
                {isRadiology ? 'RADIOLOGY SCAN' : 'DOCTOR APPOINTMENT'}
              </Text>
            </View>
            {item.tokenNumber && (
              <View style={styles.tokenBadge}>
                <Text style={styles.tokenBadgeText}>Token: {item.tokenNumber}</Text>
              </View>
            )}
          </View>

          <Text style={styles.doctorName}>{item.doctor?.name}</Text>
          <Text style={styles.specialty} numberOfLines={1}>
            {item.doctor?.specialty}
          </Text>

          {item.doctor?.clinicName ? (
            <View style={styles.clinicRow}>
              <Ionicons name="location-outline" size={13} color="#0284C7" />
              <Text style={styles.clinicText} numberOfLines={1}>
                {item.doctor.clinicName} • {item.doctor.clinicArea || 'Mysore'}
              </Text>
            </View>
          ) : null}

          <Text style={styles.date}>
            <Ionicons name="time-outline" size={12} color="#78909C" /> {item.day ? `${item.day}, ` : ''}{item.date} • {item.time}
          </Text>

          <View style={styles.statusRow}>
            <Ionicons
              name={
                item.status === 'Cancelled'
                  ? 'close-circle'
                  : item.status === 'Rescheduled'
                  ? 'calendar'
                  : 'checkmark-circle'
              }
              size={15}
              color={
                item.status === 'Cancelled'
                  ? '#DC2626'
                  : item.status === 'Rescheduled'
                  ? colors.primary
                  : '#2E7D32'
              }
            />
            <Text
              style={[
                styles.status,
                item.status === 'Cancelled' && { color: '#DC2626' },
                item.status === 'Rescheduled' && { color: colors.primary },
              ]}
            >
              {item.status}
            </Text>
            {item.paidAmount && (
              <Text
                style={[
                  styles.paidAmountText,
                  item.status === 'Cancelled' && { color: '#64748B', textDecorationLine: 'line-through' },
                ]}
              >
                • ₹{item.paidAmount} {item.status === 'Cancelled' ? 'Refunded' : 'Paid'}
              </Text>
            )}
          </View>

          <View style={styles.cardActionsRow}>
            {item.status !== 'Cancelled' ? (
              <>
                <TouchableOpacity
                  style={styles.cardDirectionBtn}
                  onPress={() => {
                    const address = item.doctor?.clinicAddress || item.doctor?.clinicName || 'Clinic, Mysore';
                    const lat = item.doctor?.latitude || 12.2858;
                    const lng = item.doctor?.longitude || 76.6341;
                    const mapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}&query=${encodeURIComponent(address)}`;
                    if (Platform.OS === 'web' && typeof window !== 'undefined') {
                      window.open(mapsUrl, '_blank');
                    } else {
                      Linking.openURL(mapsUrl);
                    }
                  }}
                  activeOpacity={0.8}
                >
                  <Ionicons name="navigate" size={12} color="#0284C7" />
                  <Text style={styles.cardDirectionText}>Directions</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.cardRescheduleBtn}
                  onPress={() => {
                    if (isRadiology && item.details) {
                      navigation.navigate('RadiologyOrderSuccess', {
                        booking: item.details,
                      });
                    } else {
                      navigation.navigate('BookingDetails', {
                        appointment: item,
                      });
                    }
                  }}
                  activeOpacity={0.8}
                >
                  <Ionicons name="calendar-outline" size={12} color={colors.primary} />
                  <Text style={styles.cardRescheduleText}>Reschedule / Cancel</Text>
                </TouchableOpacity>
              </>
            ) : (
              <>
                <TouchableOpacity
                  style={[styles.cardDirectionBtn, { backgroundColor: colors.lightTeal }]}
                  onPress={() => navigation.navigate('DoctorList')}
                  activeOpacity={0.8}
                >
                  <Ionicons name="refresh" size={12} color={colors.primary} />
                  <Text style={[styles.cardDirectionText, { color: colors.primary }]}>Rebook</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.cardRescheduleBtn}
                  onPress={() => {
                    navigation.navigate('BookingDetails', {
                      appointment: item,
                    });
                  }}
                  activeOpacity={0.8}
                >
                  <Ionicons name="eye-outline" size={12} color="#64748B" />
                  <Text style={[styles.cardRescheduleText, { color: '#64748B' }]}>View Details</Text>
                </TouchableOpacity>
              </>
            )}

            <View style={styles.viewBadge}>
              <Text style={styles.viewDetailsText}>Details ›</Text>
            </View>
          </View>
        </View>

        <Ionicons name="chevron-forward" size={18} color="#90A4AE" style={{ alignSelf: 'center' }} />
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
          activeOpacity={0.8}
        >
          <Ionicons name="arrow-back" size={22} color="#263238" />
        </TouchableOpacity>

        <Text style={styles.title}>My Appointments</Text>
        <View style={styles.headerSpace} />
      </View>

      {/* FILTER TABS */}
      <View style={styles.tabBar}>
        {['All', 'Radiology Scans', 'Doctor Visits'].map((tab) => {
          const isSelected = selectedTab === tab;
          return (
            <TouchableOpacity
              key={tab}
              style={[styles.tabBtn, isSelected && styles.tabBtnActive]}
              onPress={() => setSelectedTab(tab)}
            >
              <Text style={[styles.tabBtnText, isSelected && styles.tabBtnTextActive]}>
                {tab}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {filteredAppointments.length === 0 ? (
        <View style={styles.empty}>
          <Ionicons name="calendar-outline" size={60} color="#90A4AE" />
          <Text style={styles.emptyTitle}>No Appointments Found</Text>
          <Text style={styles.emptySubtitle}>
            Your scheduled scan appointments and doctor visits will appear here.
          </Text>

          <View style={styles.emptyActionRow}>
            <TouchableOpacity
              style={styles.findButton}
              onPress={() => navigation.navigate('RadiologyLabs')}
            >
              <Ionicons name="scan-outline" size={16} color="#FFFFFF" />
              <Text style={styles.findButtonText}>Book Radiology Scan</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.findButton, { backgroundColor: '#1976D2' }]}
              onPress={() => navigation.navigate('DoctorList')}
            >
              <Ionicons name="person-outline" size={16} color="#FFFFFF" />
              <Text style={styles.findButtonText}>Find Doctor</Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : (
        <FlatList
          data={filteredAppointments}
          keyExtractor={(item) => item.id}
          renderItem={renderAppointment}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },

  header: {
    height: 60,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },

  backButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },

  title: {
    fontSize: 17,
    fontWeight: '800',
    color: '#263238',
  },

  headerSpace: {
    width: 40,
  },

  tabBar: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#FFFFFF',
    gap: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  tabBtn: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: '#F1F5F9',
  },
  tabBtnActive: {
    backgroundColor: colors.primary,
  },
  tabBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textSecondary,
  },
  tabBtnTextActive: {
    color: '#FFFFFF',
  },

  list: {
    padding: 16,
    paddingBottom: 40,
  },

  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },

  iconContainer: {
    width: 50,
    height: 50,
    borderRadius: 14,
    backgroundColor: '#E3F2FD',
    alignItems: 'center',
    justifyContent: 'center',
  },

  info: {
    flex: 1,
    marginLeft: 12,
    marginRight: 6,
  },

  topBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  typeBadge: {
    backgroundColor: '#E3F2FD',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  typeBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#1976D2',
    letterSpacing: 0.3,
  },
  tokenBadge: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  tokenBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#D97706',
  },

  doctorName: {
    fontSize: 14,
    fontWeight: '800',
    color: '#263238',
  },

  specialty: {
    fontSize: 11,
    color: colors.primary,
    marginTop: 2,
    fontWeight: '600',
  },

  date: {
    fontSize: 11,
    color: '#78909C',
    marginTop: 5,
  },

  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 5,
  },

  status: {
    color: '#2E7D32',
    fontSize: 11,
    fontWeight: '700',
    marginLeft: 4,
  },
  paidAmountText: {
    color: '#059669',
    fontSize: 11,
    fontWeight: '700',
    marginLeft: 6,
  },

  clinicRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  clinicText: {
    fontSize: 11,
    color: '#0284C7',
    fontWeight: '600',
  },

  cardActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 8,
    paddingTop: 6,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  cardDirectionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E0F2FE',
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 8,
    gap: 4,
  },
  cardDirectionText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#0284C7',
  },
  cardRescheduleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.lightTeal,
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 8,
    gap: 4,
  },
  cardRescheduleText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.primary,
  },
  viewBadge: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 7,
    paddingVertical: 4,
    borderRadius: 6,
  },
  viewDetailsText: {
    fontSize: 10.5,
    fontWeight: '700',
    color: '#475569',
  },

  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 30,
  },

  emptyTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#263238',
    marginTop: 14,
  },

  emptySubtitle: {
    fontSize: 12,
    color: '#78909C',
    textAlign: 'center',
    marginTop: 6,
    lineHeight: 17,
  },

  emptyActionRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 20,
  },
  findButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },

  findButtonText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 12,
  },
});

export default BookingsScreen;