import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  Image,
  Platform,
  Linking,
  useWindowDimensions,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import WebFooter from '../../../components/web/WebFooter';
import PaginationBar from '../../../components/web/PaginationBar';
import PatientPageBanner from '../../../components/web/PatientPageBanner';
import { showAlert } from '../../../utils/alert';
import { isGuestUser } from '../../../utils/authHelper';
import {
  getActivePatient,
  getPatientFamilyMembers,
  matchAppointmentToAccount,
  getPhysicalAppointments,
  savePhysicalAppointments,
} from '../../../data/patientDashboardData';
import {
  getSlotStatus,
  validateAndBookSlot,
  cancelBookedSlot,
  subscribeToSlotChanges,
} from '../../../services/slotBookingService';
import {
  getUserTimezone,
  getLocalDateString,
  addDaysToDate,
  formatAppointmentDateLabel,
  formatAppointmentDateTimeLabel,
  formatBookingDateLabel,
  getAppointmentDynamicStatus,
  getStatusBadgeConfig,
} from '../../../utils/appointmentDateUtils';

const STATUS_FILTERS = ['All', 'Upcoming', 'Today', 'Completed', 'Cancelled', 'Rescheduled'];
const ITEMS_PER_PAGE = 4;

export const renderSafeAddress = (addr) => {
  if (!addr) return '';
  if (typeof addr === 'string') return addr;
  if (typeof addr === 'object') {
    const parts = [
      addr.addressLine || addr.line1 || addr.address || addr.street,
      addr.landmark,
      addr.city,
      addr.state,
      addr.pincode ? `${addr.pincode}` : null,
    ].filter(Boolean);
    if (parts.length > 0) return parts.join(', ');
    if (addr.name) return addr.name;
    try {
      const vals = Object.values(addr).filter((v) => typeof v === 'string' && v.trim().length > 0);
      return vals.join(', ') || 'Kuvempunagar, Mysuru';
    } catch (e) {
      return 'Kuvempunagar, Mysuru';
    }
  }
  return String(addr);
};

export const renderSafeText = (val, fallback = '') => {
  if (val === null || val === undefined) return fallback;
  if (typeof val === 'string') return val;
  if (typeof val === 'number') return String(val);
  if (typeof val === 'object') {
    if (val.addressLine || val.street || val.city) {
      return renderSafeAddress(val);
    }
    if (val.name) return String(val.name);
    if (val.label) return String(val.label);
    if (val.title) return String(val.title);
    try {
      const vals = Object.values(val).filter((v) => typeof v === 'string' && v.trim().length > 0);
      return vals.join(', ') || fallback;
    } catch (e) {
      return fallback;
    }
  }
  return String(val);
};

const MyAppointmentsScreenWeb = ({ navigation, route }) => {
  const { width } = useWindowDimensions();
  const isDesktop = width >= 1024;
  const isTablet = width >= 768 && width < 1024;

  const [patient, setPatient] = useState(null);
  const [familyMembers, setFamilyMembers] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isGuestMode, setIsGuestMode] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('All');
  const [currentPage, setCurrentPage] = useState(1);

  // Modal States
  const [activeModal, setActiveModal] = useState(null); // 'details' | 'reschedule' | 'cancel' | 'directions' | 'contact' | null
  const [selectedAppt, setSelectedAppt] = useState(null);

  // Real-time Clock & Auto-Rollover State
  const [currentTime, setCurrentTime] = useState(() => new Date());

  useEffect(() => {
    // 1. Tick every 30 seconds to catch slot transitions in real time
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 30000);

    // 2. Exact midnight trigger to automatically rollover Today/Tomorrow/Past at 00:00:01
    const now = new Date();
    const nextMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 0, 0, 1);
    const msUntilMidnight = nextMidnight.getTime() - now.getTime();

    const midnightTimeout = setTimeout(() => {
      setCurrentTime(new Date());
      loadData();
    }, msUntilMidnight);

    return () => {
      clearInterval(interval);
      clearTimeout(midnightTimeout);
    };
  }, []);

  // Dynamic reschedule dates (Tomorrow + next 5 days) using user's local timezone
  const rescheduleDatesList = useMemo(() => {
    const list = [];
    for (let i = 1; i <= 6; i++) {
      list.push(getLocalDateString(addDaysToDate(currentTime, i)));
    }
    return list;
  }, [currentTime]);

  // Reschedule Form State
  const [newDate, setNewDate] = useState(() => {
    return getLocalDateString(addDaysToDate(new Date(), 1));
  });
  const [newTimeSlot, setNewTimeSlot] = useState('11:30 AM (Morning Slot)');
  const [rescheduleReason, setRescheduleReason] = useState('Work schedule conflict');

  // Real-time slot update ticker
  const [, setSlotTick] = useState(0);
  useEffect(() => {
    const unsub = subscribeToSlotChanges(() => {
      setSlotTick((t) => t + 1);
    });
    return unsub;
  }, []);

  // Cancel Form State
  const [cancelReason, setCancelReason] = useState('Personal reasons / schedule clash');
  const [cancelRemarks, setCancelRemarks] = useState('');

  // Toast / notification
  const [toastMessage, setToastMessage] = useState('');

  const handleOpenDirections = (appt) => {
    if (!appt) return;
    if (appt.directionsUrl) {
      Linking.openURL(appt.directionsUrl);
      return;
    }
    let destination = '';
    if (appt.latitude && appt.longitude) {
      destination = `${appt.latitude},${appt.longitude}`;
    } else if (appt.address) {
      const facility = appt.facilityName || appt.providerName || appt.centerName || '';
      const addr = renderSafeAddress(appt.address);
      destination = encodeURIComponent(`${facility ? facility + ', ' : ''}${addr}`);
    } else {
      const full = [appt.facilityName || appt.providerName || appt.centerName, appt.city].filter(Boolean).join(', ');
      destination = encodeURIComponent(full || 'Diagnostic Centre');
    }
    Linking.openURL(`https://www.google.com/maps/dir/?api=1&destination=${destination}`);
  };

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 4000);
  };

  useEffect(() => {
    loadData();

    // 1. Navigation focus listener - updates automatically when returning to page
    const unsubscribeFocus = navigation?.addListener ? navigation.addListener('focus', () => {
      loadData();
    }) : null;

    // 2. Storage & custom event listeners for real-time auto-refresh without manual refresh
    const handleStorageChange = (e) => {
      if (!e || !e.key || e.key.includes('appointment')) {
        loadData();
      }
    };
    const handleApptUpdate = () => {
      loadData();
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('storage', handleStorageChange);
      window.addEventListener('mediunify_appointments_updated', handleApptUpdate);
    }

    return () => {
      if (unsubscribeFocus) unsubscribeFocus();
      if (typeof window !== 'undefined') {
        window.removeEventListener('storage', handleStorageChange);
        window.removeEventListener('mediunify_appointments_updated', handleApptUpdate);
      }
    };
  }, [navigation]);

  useEffect(() => {
    setCurrentPage(1);
  }, [selectedStatus, searchQuery]);

  const loadData = async () => {
    setLoading(true);
    try {
      const p = await getActivePatient();
      setPatient(p);
      const fam = await getPatientFamilyMembers();
      setFamilyMembers(fam);
      const appts = await getPhysicalAppointments();
      setAppointments(appts);
    } catch (e) {
      console.warn('Error loading appointments:', e);
    } finally {
      setLoading(false);
    }
  };

  // Dynamically calculated status counts from actual appointment data
  const statusCounts = useMemo(() => {
    const counts = {
      All: 0,
      Upcoming: 0,
      Today: 0,
      Completed: 0,
      Cancelled: 0,
      Rescheduled: 0,
    };

    const physicalOnly = appointments.filter((item) => {
      if (item.serviceType?.toLowerCase().includes('video') || item.type?.toLowerCase().includes('video')) {
        return false;
      }
      if (patient && Array.isArray(familyMembers) && familyMembers.length > 0) {
        const match = matchAppointmentToAccount(item, patient, familyMembers);
        if (!match) return false;
      }
      return true;
    });

    counts.All = physicalOnly.length;

    physicalOnly.forEach((appt) => {
      const dynamicStatus = getAppointmentDynamicStatus(appt, currentTime);
      if (dynamicStatus === 'Cancelled') {
        counts.Cancelled += 1;
      } else if (dynamicStatus === 'Completed') {
        counts.Completed += 1;
      } else if (dynamicStatus === 'Rescheduled') {
        counts.Rescheduled += 1;
        counts.Upcoming += 1;
      } else if (dynamicStatus === 'Today') {
        counts.Today += 1;
        counts.Upcoming += 1;
      } else if (dynamicStatus === 'Upcoming') {
        counts.Upcoming += 1;
      }
    });

    return counts;
  }, [appointments, currentTime, patient, familyMembers]);

  // Filtered Appointments (Strict Security Filtering for Logged-In User + Linked Family Members)
  const filteredAppointments = useMemo(() => {
    return appointments.filter((item) => {
      // Exclude video calls if any leaked
      if (item.serviceType?.toLowerCase().includes('video') || item.type?.toLowerCase().includes('video')) {
        return false;
      }

      // Security check: verify this appointment strictly belongs to user or linked family member
      if (patient && Array.isArray(familyMembers) && familyMembers.length > 0) {
        const match = matchAppointmentToAccount(item, patient, familyMembers);
        if (!match) return false;
      }

      const dynamicStatus = getAppointmentDynamicStatus(item, currentTime);

      // Status filter
      if (selectedStatus !== 'All') {
        if (selectedStatus === 'Upcoming') {
          if (dynamicStatus !== 'Upcoming' && dynamicStatus !== 'Today' && dynamicStatus !== 'Rescheduled') {
            return false;
          }
        } else if (selectedStatus === 'Today') {
          if (dynamicStatus !== 'Today') {
            return false;
          }
        } else if (selectedStatus === 'Completed') {
          if (dynamicStatus !== 'Completed') {
            return false;
          }
        } else if (selectedStatus === 'Cancelled') {
          if (dynamicStatus !== 'Cancelled') {
            return false;
          }
        } else if (selectedStatus === 'Rescheduled') {
          if (dynamicStatus !== 'Rescheduled') {
            return false;
          }
        }
      }

      // Search query (doctor, facility, department, ID, patient name)
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const docName = (item.doctor?.name || '').toLowerCase();
        const facility = (item.facilityName || '').toLowerCase();
        const dept = (item.department || '').toLowerCase();
        const id = (item.id || '').toLowerCase();
        const city = (item.location || '').toLowerCase();
        const ptName = (typeof item.patient === 'string' ? item.patient : (item.patient?.name || item.patientName || '')).toLowerCase();
        return docName.includes(q) || facility.includes(q) || dept.includes(q) || id.includes(q) || city.includes(q) || ptName.includes(q);
      }

      return true;
    });
  }, [appointments, selectedStatus, searchQuery, patient, familyMembers, currentTime]);

  // Paginated Appointments (3-5 items per page)
  const paginatedAppointments = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredAppointments.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredAppointments, currentPage]);

  // Handle Cancel Appointment
  const handleConfirmCancel = async () => {
    if (!selectedAppt) return;

    cancelBookedSlot({
      date: selectedAppt.date,
      time: selectedAppt.time || selectedAppt.timeSlot,
      serviceType: selectedAppt.type || 'doctor',
      providerId: selectedAppt.doctor?.id || selectedAppt.doctor?.name || selectedAppt.facilityName || selectedAppt.clinicName,
    });

    const updated = appointments.map((a) => {
      if (a.id === selectedAppt.id) {
        const payStr = String(a.paymentStatus || '');
        const refundMsg = payStr.includes('Paid') ? `Refund Processing (₹${a.amount || 650})` : 'Payment Cancelled';
        return {
          ...a,
          status: 'Cancelled',
          isCancelled: true,
          isUpcoming: false,
          cancelReason: cancelReason + (cancelRemarks ? `: ${cancelRemarks}` : ''),
          cancelledAt: new Date().toISOString(),
          paymentStatus: refundMsg,
          address: renderSafeAddress(a.address),
        };
      }
      return a;
    });
    setAppointments(updated);
    await savePhysicalAppointments(updated);
    setActiveModal(null);
    showToast(`Appointment ${selectedAppt.id} cancelled successfully.`);
  };

  // Handle Reschedule Appointment
  const handleConfirmReschedule = async () => {
    if (!selectedAppt) return;

    const targetTime = newTimeSlot.split(' ')[0] + ' ' + newTimeSlot.split(' ')[1];
    const sType = selectedAppt.type || 'doctor';
    const pId = selectedAppt.doctor?.id || selectedAppt.doctor?.name || selectedAppt.facilityName || selectedAppt.clinicName;

    const slotValidation = await validateAndBookSlot({
      date: newDate,
      time: targetTime,
      serviceType: sType,
      providerId: pId,
      bookingDetails: {
        appointmentId: selectedAppt.id,
        patientName: selectedAppt.patientName,
      },
    });

    if (!slotValidation.success) {
      showToast(slotValidation.message || 'This slot is no longer available. Please select another time.');
      return;
    }

    cancelBookedSlot({
      date: selectedAppt.date,
      time: selectedAppt.time || selectedAppt.timeSlot,
      serviceType: sType,
      providerId: pId,
    });

    const updated = appointments.map((a) => {
      if (a.id === selectedAppt.id) {
        return {
          ...a,
          date: newDate,
          formattedDate: newDate,
          time: targetTime,
          timeSlot: newTimeSlot,
          timezone: getUserTimezone(),
          status: 'Rescheduled',
          isRescheduled: true,
          isUpcoming: true,
          rescheduledAt: new Date().toISOString(),
          instructions: `Rescheduled to ${formatAppointmentDateTimeLabel(newDate, targetTime, currentTime)}. Reason: ${rescheduleReason}`,
        };
      }
      return a;
    });
    setAppointments(updated);
    await savePhysicalAppointments(updated);
    setActiveModal(null);
    showToast(`Appointment ${selectedAppt.id} rescheduled to ${formatAppointmentDateTimeLabel(newDate, targetTime, currentTime)}.`);
  };

  const getStatusBadgeStyle = (status) => {
    return getStatusBadgeConfig(status);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Notification Toast */}
      {toastMessage ? (
        <View style={styles.toastContainer}>
          <Ionicons name="checkmark-circle" size={18} color="#FFFFFF" />
          <Text style={styles.toastText}>{toastMessage}</Text>
        </View>
      ) : null}

      <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={true}>
        {/* Breadcrumb Bar */}
        <View style={styles.breadcrumbBar}>
          <View style={[styles.innerContainer, styles.breadcrumbContent]}>
            <TouchableOpacity onPress={() => navigation?.navigate('Home')} activeOpacity={0.7} style={styles.breadcrumbItem}>
              <Ionicons name="home-outline" size={14} color="#64748B" />
              <Text style={styles.breadcrumbText}>Home</Text>
            </TouchableOpacity>
            <Ionicons name="chevron-forward" size={12} color="#94A3B8" />
            <Text style={styles.breadcrumbActive}>My Physical Appointments</Text>
          </View>
        </View>

        {/* Page Hero Banner */}
        <View style={styles.innerContainer}>
          <PatientPageBanner
            onBack={() => navigation?.canGoBack?.() ? navigation.goBack() : navigation?.navigate('Home')}
            title="My Appointments"
            subtitle={
              <Text style={styles.pageSubtitle}>
                Manage your physical walk-in visits at hospitals, partner clinics, and diagnostic centres. (Online video consultations are managed under{' '}
                <Text
                  style={{ color: '#008B94', fontWeight: '700', cursor: 'pointer' }}
                  onPress={() => navigation?.navigate('MyOnlineConsultations')}
                >
                  My Online Consultations
                </Text>
                ).
              </Text>
            }
            badgeText="IN-PERSON VISITS • CLINICS & HOSPITALS"
            badgeIcon="business"
            iconName="calendar"
            theme="teal"
            pills={[
              {
                label: `Upcoming: ${statusCounts.Upcoming} Visits`,
                bgColor: '#ECFDF5',
                borderColor: '#A7F3D0',
                textColor: '#008B94',
                icon: 'checkmark-circle',
              },
              {
                label: `Today: ${statusCounts.Today}`,
                bgColor: '#EFF6FF',
                borderColor: '#BFDBFE',
                textColor: '#1E3A8A',
                icon: 'today-outline',
              },
              {
                label: `Completed: ${statusCounts.Completed}`,
                bgColor: '#EBF8E7',
                borderColor: '#C2EDB7',
                textColor: '#15803D',
                icon: 'time-outline',
              },
            ]}
            rightContent={
              <TouchableOpacity
                style={styles.bookDoctorBtn}
                onPress={() => navigation?.navigate('DoctorList')}
                activeOpacity={0.85}
              >
                <Ionicons name="add-circle-outline" size={17} color="#FFFFFF" style={{ marginRight: 6 }} />
                <Text style={styles.bookDoctorBtnText}>Book In-Clinic Visit</Text>
              </TouchableOpacity>
            }
          />
        </View>

        <View style={[styles.innerContainer, { paddingTop: 6, paddingBottom: 60 }]}>

          {/* Search & Filter Controls */}
          <View style={styles.controlsCard}>
            {/* Search Input */}
            <View style={styles.searchBar}>
              <Ionicons name="search-outline" size={18} color="#64748B" style={{ marginRight: 8 }} />
              <TextInput
                style={styles.searchInput}
                placeholder="Search by clinic, hospital, doctor name, department, or appointment ID..."
                placeholderTextColor="#94A3B8"
                value={searchQuery}
                onChangeText={setSearchQuery}
                clearButtonMode="while-editing"
              />
              {searchQuery ? (
                <TouchableOpacity onPress={() => setSearchQuery('')} style={{ padding: 4 }}>
                  <Ionicons name="close-circle" size={16} color="#94A3B8" />
                </TouchableOpacity>
              ) : null}
            </View>

            {/* Status Filter Chips */}
            <View style={styles.filterChipRow}>
              {STATUS_FILTERS.map((status) => {
                const count = statusCounts[status] ?? 0;
                const active = selectedStatus === status;
                return (
                  <TouchableOpacity
                    key={status}
                    accessibilityRole="button"
                    style={[styles.filterChip, active && styles.filterChipActive]}
                    onPress={() => {
                      setSelectedStatus(status);
                      setCurrentPage(1);
                    }}
                    onClick={() => {
                      setSelectedStatus(status);
                      setCurrentPage(1);
                    }}
                    activeOpacity={0.75}
                  >
                    <Text style={[styles.filterChipText, active && styles.filterChipTextActive]}>
                      {status} ({count})
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* Appointments List */}
          {isGuestMode ? (
            <View style={styles.emptyCard}>
              <View style={[styles.emptyIconCircle, { backgroundColor: '#E6F8F4' }]}>
                <Ionicons name="calendar-outline" size={42} color="#00B894" />
              </View>
              <Text style={styles.emptyTitle}>Login to view your appointments</Text>
              <Text style={styles.emptyDesc}>
                Please sign in to access your upcoming consultations, in-clinic visits, and medical prescriptions.
              </Text>
              <TouchableOpacity
                style={[styles.bookDoctorBtn, { marginTop: 18, alignSelf: 'center', paddingHorizontal: 32 }]}
                onPress={() => {
                  if (Platform.OS === 'web' && typeof window !== 'undefined') {
                    window.dispatchEvent(new CustomEvent('open-auth-modal'));
                  }
                  navigation?.navigate('Login', { openAuthModal: true });
                }}
                activeOpacity={0.85}
              >
                <Ionicons name="log-in-outline" size={18} color="#FFFFFF" style={{ marginRight: 6 }} />
                <Text style={styles.bookDoctorBtnText}>Login</Text>
              </TouchableOpacity>
            </View>
          ) : loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#00B894" />
              <Text style={styles.loadingText}>Fetching your physical appointments...</Text>
            </View>
          ) : filteredAppointments.length === 0 ? (
            <View style={styles.emptyCard}>
              <View style={styles.emptyIconCircle}>
                <Ionicons name="calendar-outline" size={42} color="#94A3B8" />
              </View>
              <Text style={styles.emptyTitle}>No appointments found for you or your family members.</Text>
              <Text style={styles.emptyDesc}>
                {searchQuery || selectedStatus !== 'All'
                  ? 'No physical visits match your search criteria. Try resetting filters.'
                  : 'Appointments booked by you or for your linked family members will appear here.'}
              </Text>
              <View style={{ flexDirection: 'row', gap: 12, marginTop: 16 }}>
                {(searchQuery || selectedStatus !== 'All') && (
                  <TouchableOpacity
                    style={styles.resetFilterBtn}
                    onPress={() => {
                      setSearchQuery('');
                      setSelectedStatus('All');
                    }}
                  >
                    <Text style={styles.resetFilterBtnText}>Clear Filters</Text>
                  </TouchableOpacity>
                )}
                <TouchableOpacity
                  style={styles.bookDoctorBtn}
                  onPress={() => navigation?.navigate('DoctorList')}
                  activeOpacity={0.85}
                >
                  <Ionicons name="add-circle-outline" size={18} color="#FFFFFF" style={{ marginRight: 6 }} />
                  <Text style={styles.bookDoctorBtnText}>Book In-Clinic Visit</Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <View style={styles.appointmentList}>
              {paginatedAppointments.map((appt) => {
                const dynamicStatus = getAppointmentDynamicStatus(appt, currentTime);
                const badge = getStatusBadgeConfig(dynamicStatus);
                const isUpcomingVisit = dynamicStatus === 'Upcoming' || dynamicStatus === 'Today' || dynamicStatus === 'Rescheduled';
                const dynamicDateTimeLabel = formatAppointmentDateTimeLabel(appt.date, appt.time, currentTime);
                const bookingDateLabel = formatBookingDateLabel(appt.bookingDate);

                return (
                  <View key={appt.id} style={[styles.apptCard, isUpcomingVisit && styles.apptCardHighlight]}>
                    {/* Top Status Header */}
                    <View style={styles.cardTopRow}>
                      <View style={styles.idBadgeGroup}>
                        <Text style={styles.apptIdText}>{appt.id}</Text>
                        <View style={styles.typeBadge}>
                          <Ionicons name="business-outline" size={12} color="#1E3A8A" style={{ marginRight: 4 }} />
                          <Text style={styles.typeBadgeText}>{appt.serviceType}</Text>
                        </View>
                      </View>

                      <View style={[styles.statusBadge, { backgroundColor: badge.bg, borderColor: badge.border }]}>
                        <Ionicons name={badge.icon} size={14} color={badge.text} style={{ marginRight: 4 }} />
                        <Text style={[styles.statusBadgeText, { color: badge.text }]}>{dynamicStatus}</Text>
                      </View>
                    </View>

                    {/* Facility & Doctor Info */}
                    <View style={styles.cardMainRow}>
                      {appt.doctor?.image ? (
                        <Image source={{ uri: appt.doctor.image }} style={styles.doctorImg} />
                      ) : (
                        <View style={styles.facilityAvatar}>
                          <Ionicons name="medical" size={24} color="#00B894" />
                        </View>
                      )}

                      <View style={{ flex: 1 }}>
                        <Text style={styles.facilityName}>{appt.facilityName}</Text>
                        {appt.doctor?.name && (
                          <Text style={styles.doctorName}>
                            {appt.doctor.name}{' '}
                            <Text style={styles.doctorSpecialty}>• {appt.doctor.specialty}</Text>
                          </Text>
                        )}
                        <Text style={styles.departmentName}>{appt.department}</Text>

                        {/* Location / Address */}
                        <View style={styles.addressRow}>
                          <Ionicons name="location-outline" size={14} color="#64748B" style={{ marginRight: 4, marginTop: 1 }} />
                          <Text style={styles.addressText} numberOfLines={2}>
                            {renderSafeAddress(appt.address)}
                          </Text>
                        </View>
                      </View>

                      {/* Prominent Date & Time Pillar */}
                      <View style={[styles.dateTimePillar, isUpcomingVisit && styles.dateTimePillarUpcoming]}>
                        <View style={styles.dateRow}>
                          <Ionicons name="calendar" size={16} color={isUpcomingVisit ? '#00B894' : '#1E3A8A'} style={{ marginRight: 6 }} />
                          <Text style={[styles.dateText, isUpcomingVisit && { color: '#00B894' }]}>{dynamicDateTimeLabel}</Text>
                        </View>
                        <View style={styles.timeRow}>
                          <Ionicons name="time-outline" size={15} color="#475569" style={{ marginRight: 6 }} />
                          <Text style={styles.timeText}>{appt.timeSlot || appt.time}</Text>
                        </View>
                        <View style={styles.paymentPill}>
                          <Text style={styles.paymentPillText}>{appt.paymentStatus}</Text>
                        </View>
                      </View>
                    </View>

                    {/* Patient & Instructions banner */}
                    <View style={styles.patientMetaRow}>
                      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                        <Ionicons name="person-outline" size={13} color="#64748B" style={{ marginRight: 4 }} />
                        <Text style={styles.patientMetaText}>
                          Patient:{' '}
                          <Text style={{ fontWeight: '700', color: '#0F172A' }}>
                            {typeof appt.patient === 'string'
                              ? appt.patient
                              : (appt.patient?.name || appt.patientName || patient?.name || 'Hemanth Gowda')}
                          </Text>
                        </Text>
                      </View>
                      <Text style={styles.bookingDateText}>Booked on: {bookingDateLabel}</Text>
                    </View>

                    {/* Action Buttons Row */}
                    <View style={styles.actionBtnRow}>
                      <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap' }}>
                        <TouchableOpacity
                          style={styles.detailsBtn}
                          onPress={() => {
                            setSelectedAppt(appt);
                            setActiveModal('details');
                          }}
                          activeOpacity={0.8}
                        >
                          <Ionicons name="document-text-outline" size={15} color="#1E3A8A" style={{ marginRight: 4 }} />
                          <Text style={styles.detailsBtnText}>View Details</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                          style={styles.directionsBtn}
                          onPress={() => {
                            setSelectedAppt(appt);
                            setActiveModal('directions');
                          }}
                          activeOpacity={0.8}
                        >
                          <Ionicons name="navigate-outline" size={15} color="#00B894" style={{ marginRight: 4 }} />
                          <Text style={styles.directionsBtnText}>Get Directions</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                          style={styles.contactBtn}
                          onPress={() => {
                            setSelectedAppt(appt);
                            setActiveModal('contact');
                          }}
                          activeOpacity={0.8}
                        >
                          <Ionicons name="call-outline" size={14} color="#64748B" style={{ marginRight: 4 }} />
                          <Text style={styles.contactBtnText}>Contact Centre</Text>
                        </TouchableOpacity>
                      </View>

                      {/* Reschedule & Cancel actions (available for active/upcoming) */}
                      {isUpcomingVisit && (
                        <View style={{ flexDirection: 'row', gap: 8 }}>
                          <TouchableOpacity
                            style={styles.rescheduleBtn}
                            onPress={() => {
                              setSelectedAppt(appt);
                              setActiveModal('reschedule');
                            }}
                            activeOpacity={0.8}
                          >
                            <Ionicons name="calendar-outline" size={14} color="#D97706" style={{ marginRight: 4 }} />
                            <Text style={styles.rescheduleBtnText}>Reschedule</Text>
                          </TouchableOpacity>

                          <TouchableOpacity
                            style={styles.cancelBtn}
                            onPress={() => {
                              setSelectedAppt(appt);
                              setActiveModal('cancel');
                            }}
                            activeOpacity={0.8}
                          >
                            <Ionicons name="close-circle-outline" size={14} color="#EF4444" style={{ marginRight: 4 }} />
                            <Text style={styles.cancelBtnText}>Cancel</Text>
                          </TouchableOpacity>
                        </View>
                      )}
                    </View>
                  </View>
                );
              })}

              <PaginationBar
                currentPage={currentPage}
                totalItems={filteredAppointments.length}
                pageSize={ITEMS_PER_PAGE}
                onPageChange={setCurrentPage}
                itemLabel="appointments"
              />
            </View>
          )}
        </View>

        <WebFooter navigation={navigation} />
      </ScrollView>

      {/* =========================================================
          MODALS
      ========================================================= */}

      {/* 1. VIEW DETAILS MODAL */}
      <Modal visible={activeModal === 'details'} transparent animationType="fade" onRequestClose={() => setActiveModal(null)}>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalBox}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>Appointment Slip</Text>
                <Text style={styles.modalSubtitle}>ID: {selectedAppt?.id}</Text>
              </View>
              <TouchableOpacity onPress={() => setActiveModal(null)} style={styles.modalCloseIcon}>
                <Ionicons name="close" size={20} color="#64748B" />
              </TouchableOpacity>
            </View>

            <ScrollView style={{ maxHeight: 480 }} showsVerticalScrollIndicator={false}>
              <View style={styles.modalContent}>
                {/* Status Callout */}
                <View style={[styles.modalStatusBanner, { backgroundColor: getStatusBadgeConfig(getAppointmentDynamicStatus(selectedAppt, currentTime)).bg }]}>
                  <Ionicons
                    name={getStatusBadgeConfig(getAppointmentDynamicStatus(selectedAppt, currentTime)).icon}
                    size={20}
                    color={getStatusBadgeConfig(getAppointmentDynamicStatus(selectedAppt, currentTime)).text}
                  />
                  <View style={{ marginLeft: 10, flex: 1 }}>
                    <Text style={{ fontWeight: '700', color: getStatusBadgeConfig(getAppointmentDynamicStatus(selectedAppt, currentTime)).text }}>
                      Status: {getAppointmentDynamicStatus(selectedAppt, currentTime)}
                    </Text>
                    <Text style={{ fontSize: 12, color: '#475569' }}>Payment: {selectedAppt?.paymentStatus}</Text>
                  </View>
                </View>

                {/* Patient Information */}
                <Text style={styles.modalSectionHeading}>Patient Details</Text>
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Patient Name:</Text>
                  <Text style={styles.infoVal}>
                    {typeof selectedAppt?.patient === 'string'
                      ? selectedAppt.patient
                      : (selectedAppt?.patient?.name || selectedAppt?.patientName || patient?.name || 'Hemanth Gowda')}
                  </Text>
                </View>
                {selectedAppt?.patient?.relation && selectedAppt.patient.relation.toLowerCase() !== 'self' && (
                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Relationship:</Text>
                    <Text style={styles.infoVal}>{selectedAppt.patient.relation}</Text>
                  </View>
                )}
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Age & Gender:</Text>
                  <Text style={styles.infoVal}>{selectedAppt?.patient?.age || selectedAppt?.age || 28} Yrs, {selectedAppt?.patient?.gender || selectedAppt?.gender || 'Male'}</Text>
                </View>
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Visit Reason:</Text>
                  <Text style={styles.infoVal}>{renderSafeText(selectedAppt?.patient?.reason || selectedAppt?.reason, 'Routine Health Consultation')}</Text>
                </View>

                {/* Facility Details */}
                <Text style={[styles.modalSectionHeading, { marginTop: 14 }]}>Clinic / Hospital Details</Text>
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Facility:</Text>
                  <Text style={styles.infoVal}>{renderSafeText(selectedAppt?.facilityName, 'MediUnify Partner Clinic')}</Text>
                </View>
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Department:</Text>
                  <Text style={styles.infoVal}>{renderSafeText(selectedAppt?.department, 'Specialist Care')}</Text>
                </View>
                {selectedAppt?.doctor?.name && (
                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Doctor:</Text>
                    <Text style={styles.infoVal}>{selectedAppt.doctor.name} ({selectedAppt.doctor.specialty})</Text>
                  </View>
                )}
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Address:</Text>
                  <Text style={styles.infoVal}>{renderSafeAddress(selectedAppt?.address)}</Text>
                </View>

                {/* Date & Time */}
                <Text style={[styles.modalSectionHeading, { marginTop: 14 }]}>Appointment Slot</Text>
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Scheduled Date:</Text>
                  <Text style={[styles.infoVal, { fontWeight: '700', color: '#00B894' }]}>
                    {formatAppointmentDateTimeLabel(selectedAppt?.date, selectedAppt?.time, currentTime)}
                  </Text>
                </View>
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Time Slot:</Text>
                  <Text style={styles.infoVal}>{selectedAppt?.timeSlot || selectedAppt?.time}</Text>
                </View>
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Booked on:</Text>
                  <Text style={styles.infoVal}>{formatBookingDateLabel(selectedAppt?.bookingDate)}</Text>
                </View>
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Timezone:</Text>
                  <Text style={styles.infoVal}>{selectedAppt?.timezone || getUserTimezone()}</Text>
                </View>

                {/* Preparation Instructions */}
                {selectedAppt?.instructions && (
                  <View style={styles.instructionsBox}>
                    <Ionicons name="information-circle" size={18} color="#0369A1" style={{ marginRight: 6 }} />
                    <Text style={styles.instructionsText}>{selectedAppt.instructions}</Text>
                  </View>
                )}
              </View>
            </ScrollView>

            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={styles.modalPrimaryBtn}
                onPress={() => {
                  setActiveModal(null);
                  showToast('Appointment slip ready for print.');
                }}
              >
                <Ionicons name="print-outline" size={16} color="#FFFFFF" style={{ marginRight: 6 }} />
                <Text style={styles.modalPrimaryBtnText}>Print / Download Slip</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* 2. RESCHEDULE MODAL */}
      <Modal visible={activeModal === 'reschedule'} transparent animationType="fade" onRequestClose={() => setActiveModal(null)}>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalBox}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>Reschedule Appointment</Text>
                <Text style={styles.modalSubtitle}>
                  Current: {formatAppointmentDateTimeLabel(selectedAppt?.date, selectedAppt?.time, currentTime)}
                </Text>
              </View>
              <TouchableOpacity onPress={() => setActiveModal(null)} style={styles.modalCloseIcon}>
                <Ionicons name="close" size={20} color="#64748B" />
              </TouchableOpacity>
            </View>

            <View style={styles.modalContent}>
              <Text style={styles.inputLabel}>Select New Date</Text>
              <View style={styles.datePickerRow}>
                {rescheduleDatesList.map((d) => (
                  <TouchableOpacity
                    key={d}
                    style={[styles.dateChoiceBtn, newDate === d && styles.dateChoiceBtnActive]}
                    onPress={() => setNewDate(d)}
                  >
                    <Text style={[styles.dateChoiceText, newDate === d && styles.dateChoiceTextActive]}>
                      {formatAppointmentDateLabel(d, currentTime)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={[styles.inputLabel, { marginTop: 14 }]}>Select Available Slot</Text>
              <View style={{ gap: 8 }}>
                {[
                  '10:00 AM (Morning Slot)',
                  '11:30 AM (Morning Slot)',
                  '02:30 PM (Afternoon Slot)',
                  '04:45 PM (Evening Slot)',
                ].map((s) => {
                  const sTime = s.split(' ')[0] + ' ' + s.split(' ')[1];
                  const slotStatus = getSlotStatus({
                    date: newDate,
                    time: sTime,
                    serviceType: selectedAppt?.type || 'doctor',
                    providerId: selectedAppt?.doctor?.id || selectedAppt?.doctor?.name || selectedAppt?.facilityName || selectedAppt?.clinicName,
                  });
                  const isAvailable = slotStatus.available;
                  const isSelected = newTimeSlot === s;
                  return (
                    <TouchableOpacity
                      key={s}
                      style={[
                        styles.slotChoiceBtn,
                        isSelected && styles.slotChoiceBtnActive,
                        !isAvailable && { opacity: 0.55, backgroundColor: '#F8FAFC', borderColor: '#E2E8F0' },
                      ]}
                      disabled={!isAvailable}
                      onPress={() => setNewTimeSlot(s)}
                    >
                      <Ionicons
                        name={isSelected ? 'radio-button-on' : 'radio-button-off'}
                        size={16}
                        color={isSelected ? '#00B894' : isAvailable ? '#94A3B8' : '#CBD5E1'}
                        style={{ marginRight: 8 }}
                      />
                      <Text
                        style={[
                          styles.slotChoiceText,
                          isSelected && { color: '#00B894', fontWeight: '700' },
                          !isAvailable && { color: '#94A3B8', textDecorationLine: 'line-through' },
                        ]}
                      >
                        {s}
                      </Text>
                      {!isAvailable && (
                        <View style={{ backgroundColor: '#FEE2E2', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, marginLeft: 'auto' }}>
                          <Text style={{ fontSize: 9, fontWeight: '700', color: '#DC2626', textTransform: 'uppercase' }}>
                            {slotStatus.status === 'PASSED' ? 'Passed' : 'Booked'}
                          </Text>
                        </View>
                      )}
                    </TouchableOpacity>
                  );
                })}
              </View>

              <Text style={[styles.inputLabel, { marginTop: 14 }]}>Reason for Rescheduling</Text>
              <TextInput
                style={styles.modalInput}
                value={rescheduleReason}
                onChangeText={setRescheduleReason}
                placeholder="e.g. Schedule clash, unwell, doctor advice..."
                placeholderTextColor="#94A3B8"
              />
            </View>

            <View style={styles.modalFooter}>
              <TouchableOpacity style={styles.modalCancelBtn} onPress={() => setActiveModal(null)}>
                <Text style={styles.modalCancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalPrimaryBtn} onPress={handleConfirmReschedule}>
                <Text style={styles.modalPrimaryBtnText}>Confirm Reschedule</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* 3. CANCEL APPOINTMENT MODAL */}
      <Modal visible={activeModal === 'cancel'} transparent animationType="fade" onRequestClose={() => setActiveModal(null)}>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalBox}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={[styles.modalTitle, { color: '#EF4444' }]}>Cancel In-Person Visit</Text>
                <Text style={styles.modalSubtitle}>ID: {selectedAppt?.id}</Text>
              </View>
              <TouchableOpacity onPress={() => setActiveModal(null)} style={styles.modalCloseIcon}>
                <Ionicons name="close" size={20} color="#64748B" />
              </TouchableOpacity>
            </View>

            <View style={styles.modalContent}>
              <View style={styles.alertWarning}>
                <Ionicons name="alert-circle" size={18} color="#D97706" style={{ marginRight: 8 }} />
                <Text style={styles.alertWarningText}>
                  Any online consultation fee paid will be automatically refunded to your original payment method within 2-4 business days.
                </Text>
              </View>

              <Text style={styles.inputLabel}>Reason for Cancellation</Text>
              {[
                'Personal reasons / schedule clash',
                'Patient recovered / symptoms resolved',
                'Doctor recommended different test/visit',
                'Booked another date or facility',
              ].map((r) => (
                <TouchableOpacity
                  key={r}
                  style={[styles.slotChoiceBtn, cancelReason === r && styles.slotChoiceBtnActive]}
                  onPress={() => setCancelReason(r)}
                >
                  <Ionicons
                    name={cancelReason === r ? 'radio-button-on' : 'radio-button-off'}
                    size={16}
                    color={cancelReason === r ? '#EF4444' : '#94A3B8'}
                    style={{ marginRight: 8 }}
                  />
                  <Text style={[styles.slotChoiceText, cancelReason === r && { color: '#EF4444', fontWeight: '700' }]}>
                    {r}
                  </Text>
                </TouchableOpacity>
              ))}

              <Text style={[styles.inputLabel, { marginTop: 12 }]}>Additional Remarks (Optional)</Text>
              <TextInput
                style={[styles.modalInput, { height: 60 }]}
                value={cancelRemarks}
                onChangeText={setCancelRemarks}
                placeholder="Optional notes for hospital administration..."
                placeholderTextColor="#94A3B8"
                multiline
              />
            </View>

            <View style={styles.modalFooter}>
              <TouchableOpacity style={styles.modalCancelBtn} onPress={() => setActiveModal(null)}>
                <Text style={styles.modalCancelBtnText}>Keep Appointment</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.modalPrimaryBtn, { backgroundColor: '#EF4444' }]} onPress={handleConfirmCancel}>
                <Text style={styles.modalPrimaryBtnText}>Yes, Cancel Appointment</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* 4. DIRECTIONS MODAL */}
      <Modal visible={activeModal === 'directions'} transparent animationType="fade" onRequestClose={() => setActiveModal(null)}>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalBox}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>Facility Location & Navigation</Text>
                <Text style={styles.modalSubtitle}>{selectedAppt?.facilityName}</Text>
              </View>
              <TouchableOpacity onPress={() => setActiveModal(null)} style={styles.modalCloseIcon}>
                <Ionicons name="close" size={20} color="#64748B" />
              </TouchableOpacity>
            </View>

            <View style={styles.modalContent}>
              <View style={styles.mapPreviewBox}>
                <Ionicons name="map" size={40} color="#00B894" />
                <Text style={{ fontWeight: '700', color: '#1E3A8A', marginTop: 8 }}>
                  {renderSafeText(selectedAppt?.facilityName, 'Medical Centre')}
                </Text>
                <Text style={{ fontSize: 12, color: '#64748B', textAlign: 'center', marginTop: 4, paddingHorizontal: 20 }}>
                  {renderSafeAddress(selectedAppt?.address)}
                </Text>
                <View style={styles.distanceBadge}>
                  <Ionicons name="navigate" size={12} color="#00B894" style={{ marginRight: 4 }} />
                  <Text style={{ fontSize: 11, fontWeight: '700', color: '#00B894' }}>Approx 4.8 km from your saved address</Text>
                </View>
              </View>

              <Text style={{ fontSize: 12, color: '#64748B', marginTop: 12 }}>
                Parking: On-site multi-level parking available for patients. Show your appointment token for priority barrier access.
              </Text>
            </View>

            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={styles.modalPrimaryBtn}
                onPress={() => {
                  handleOpenDirections(selectedAppt);
                }}
              >
                <Ionicons name="open-outline" size={16} color="#FFFFFF" style={{ marginRight: 6 }} />
                <Text style={styles.modalPrimaryBtnText}>Open in Google Maps</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* 5. CONTACT CENTRE MODAL */}
      <Modal visible={activeModal === 'contact'} transparent animationType="fade" onRequestClose={() => setActiveModal(null)}>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalBox}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>Contact Centre</Text>
                <Text style={styles.modalSubtitle}>{selectedAppt?.facilityName}</Text>
              </View>
              <TouchableOpacity onPress={() => setActiveModal(null)} style={styles.modalCloseIcon}>
                <Ionicons name="close" size={20} color="#64748B" />
              </TouchableOpacity>
            </View>

            <View style={styles.modalContent}>
              <View style={styles.contactItem}>
                <View style={styles.contactIconWrap}>
                  <Ionicons name="call" size={20} color="#00B894" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.contactTitle}>Front Desk & Appointments Desk</Text>
                  <Text style={styles.contactSubtitle}>{selectedAppt?.phone || '+91 80 4342 0100'}</Text>
                  <Text style={{ fontSize: 11, color: '#94A3B8' }}>Available 7:00 AM - 9:00 PM</Text>
                </View>
                <TouchableOpacity
                  style={styles.callNowBtn}
                  onPress={() => Linking.openURL(`tel:${selectedAppt?.phone || '+918043420100'}`)}
                >
                  <Text style={styles.callNowBtnText}>Call Now</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.contactItem}>
                <View style={[styles.contactIconWrap, { backgroundColor: '#DCFCE7' }]}>
                  <Ionicons name="logo-whatsapp" size={20} color="#16A34A" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.contactTitle}>WhatsApp Care Concierge</Text>
                  <Text style={styles.contactSubtitle}>Instant route directions & parking assistance</Text>
                  <Text style={{ fontSize: 11, color: '#94A3B8' }}>Automated AI & Human Support</Text>
                </View>
                <TouchableOpacity
                  style={[styles.callNowBtn, { backgroundColor: '#16A34A' }]}
                  onPress={() => Linking.openURL('https://wa.me/918043420100')}
                >
                  <Text style={styles.callNowBtnText}>Chat</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

export default MyAppointmentsScreenWeb;

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#E8F1F8',
    backgroundImage: 'linear-gradient(180deg, #E6F0F7 0%, #EBF4FA 35%, #F0F6FA 100%)',
  },
  scrollContent: {
    flexGrow: 1,
    backgroundColor: 'transparent',
  },
  innerContainer: {
    maxWidth: 1200,
    width: '100%',
    alignSelf: 'center',
    paddingHorizontal: 16,
  },
  breadcrumbBar: {
    backgroundColor: 'transparent',
    borderBottomWidth: 0,
    paddingTop: 16,
    paddingBottom: 4,
  },
  breadcrumbContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  breadcrumbItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  breadcrumbText: {
    fontSize: 12.5,
    color: '#64748B',
    fontWeight: '500',
  },
  breadcrumbActive: {
    fontSize: 12.5,
    color: '#0C3B6B',
    fontWeight: '700',
  },
  toastContainer: {
    position: 'absolute',
    top: 60,
    alignSelf: 'center',
    zIndex: 9999,
    backgroundColor: '#0F172A',
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 30,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    boxShadow: '0 8px 24px rgba(0,0,0,0.18)',
  },
  toastText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
  },
  heroSection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: 20,
    marginTop: 8,
    marginBottom: 18,
  },
  categoryBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  hospitalBadgePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#D1FAE5',
    paddingHorizontal: 10,
    paddingVertical: 4.5,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  categoryBadgeText: {
    fontSize: 11.5,
    fontWeight: '800',
    color: '#00B894',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  pageTitle: {
    fontSize: 30,
    fontWeight: '900',
    color: '#0C3B6B',
    letterSpacing: -0.6,
  },
  pageSubtitle: {
    fontSize: 13.5,
    color: '#475569',
    marginTop: 6,
    maxWidth: 680,
    lineHeight: 20,
  },
  statsPill: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CCEAE4',
    borderRadius: 14,
    paddingHorizontal: 20,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 18,
    boxShadow: '0 2px 10px rgba(12, 59, 107, 0.06)',
  },
  statCol: {
    alignItems: 'center',
  },
  statNum: {
    fontSize: 22,
    fontWeight: '900',
    color: '#00B894',
  },
  statLabel: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#64748B',
  },
  statDivider: {
    width: 1,
    height: 30,
    backgroundColor: '#E2E8F0',
  },
  controlsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 14,
    marginBottom: 20,
    gap: 12,
    boxShadow: '0 2px 8px rgba(15,23,42,0.03)',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 12,
    height: 42,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    color: '#0F172A',
    outlineStyle: 'none',
  },
  filterChipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    alignItems: 'center',
  },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    cursor: 'pointer',
    userSelect: 'none',
  },
  filterChipActive: {
    backgroundColor: '#00B894',
    borderColor: '#00B894',
  },
  filterChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#475569',
    userSelect: 'none',
  },
  filterChipTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  loadingContainer: {
    paddingVertical: 60,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    fontWeight: '600',
    color: '#64748B',
  },
  emptyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyIconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 6,
  },
  emptyDesc: {
    fontSize: 13.5,
    color: '#64748B',
    textAlign: 'center',
    maxWidth: 440,
    lineHeight: 20,
  },
  resetFilterBtn: {
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    backgroundColor: '#FFFFFF',
  },
  resetFilterBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#475569',
  },
  bookDoctorBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#00B894',
    paddingHorizontal: 18,
    paddingVertical: 9,
    borderRadius: 8,
  },
  bookDoctorBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  appointmentList: {
    gap: 16,
  },
  apptCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 18,
    boxShadow: '0 2px 10px rgba(15,23,42,0.04)',
    transition: 'all 0.2s ease',
  },
  apptCardHighlight: {
    borderColor: '#A7F3D0',
    borderLeftWidth: 4,
    borderLeftColor: '#00B894',
  },
  cardTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    marginBottom: 14,
  },
  idBadgeGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  apptIdText: {
    fontSize: 12.5,
    fontWeight: '800',
    color: '#1E3A8A',
    fontFamily: 'monospace',
  },
  typeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  typeBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#3730A3',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    borderWidth: 1,
  },
  statusBadgeText: {
    fontSize: 11.5,
    fontWeight: '700',
  },
  cardMainRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 16,
    flexWrap: 'wrap',
  },
  facilityAvatar: {
    width: 52,
    height: 52,
    borderRadius: 10,
    backgroundColor: '#E6F8F4',
    alignItems: 'center',
    justifyContent: 'center',
  },
  doctorImg: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#E2E8F0',
  },
  facilityName: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
  },
  doctorName: {
    fontSize: 13.5,
    fontWeight: '700',
    color: '#1E3A8A',
    marginTop: 2,
  },
  doctorSpecialty: {
    fontWeight: '500',
    color: '#64748B',
  },
  departmentName: {
    fontSize: 12,
    fontWeight: '600',
    color: '#00B894',
    marginTop: 2,
  },
  addressRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginTop: 6,
    maxWidth: 500,
  },
  addressText: {
    fontSize: 12,
    color: '#64748B',
    lineHeight: 16,
  },
  dateTimePillar: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 10,
    padding: 12,
    minWidth: 200,
    alignItems: 'flex-start',
    gap: 4,
  },
  dateTimePillarUpcoming: {
    backgroundColor: '#F0FDF4',
    borderColor: '#BBF7D0',
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dateText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#1E3A8A',
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  timeText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#334155',
  },
  paymentPill: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    marginTop: 4,
  },
  paymentPillText: {
    fontSize: 10.5,
    fontWeight: '600',
    color: '#475569',
  },
  patientMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginTop: 14,
  },
  patientMetaText: {
    fontSize: 12,
    color: '#64748B',
  },
  bookingDateText: {
    fontSize: 11,
    color: '#94A3B8',
  },
  actionBtnRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  detailsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#BFDBFE',
    backgroundColor: '#EFF6FF',
  },
  detailsBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1E3A8A',
  },
  directionsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#A7F3D0',
    backgroundColor: '#E6F8F4',
  },
  directionsBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#00B894',
  },
  contactBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    backgroundColor: '#FFFFFF',
  },
  contactBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#475569',
  },
  rescheduleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#FDE68A',
    backgroundColor: '#FEF3C7',
  },
  rescheduleBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#D97706',
  },
  cancelBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#FECACA',
    backgroundColor: '#FEE2E2',
  },
  cancelBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#EF4444',
  },
  // Modal Styles
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  modalBox: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    width: '100%',
    maxWidth: 540,
    boxShadow: '0 20px 40px rgba(0,0,0,0.2)',
    overflow: 'hidden',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
  },
  modalSubtitle: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  modalCloseIcon: {
    padding: 4,
  },
  modalContent: {
    padding: 20,
  },
  modalStatusBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  modalSectionHeading: {
    fontSize: 13,
    fontWeight: '800',
    color: '#1E3A8A',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  infoLabel: {
    fontSize: 13,
    color: '#64748B',
  },
  infoVal: {
    fontSize: 13,
    fontWeight: '600',
    color: '#0F172A',
    maxWidth: 320,
    textAlign: 'right',
  },
  instructionsBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#F0F9FF',
    borderWidth: 1,
    borderColor: '#BAE6FD',
    borderRadius: 8,
    padding: 10,
    marginTop: 14,
  },
  instructionsText: {
    flex: 1,
    fontSize: 12,
    color: '#0369A1',
    lineHeight: 16,
  },
  modalFooter: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    backgroundColor: '#F8FAFC',
  },
  modalPrimaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#00B894',
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 8,
  },
  modalPrimaryBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  modalCancelBtn: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    backgroundColor: '#FFFFFF',
  },
  modalCancelBtnText: {
    color: '#475569',
    fontSize: 13,
    fontWeight: '600',
  },
  inputLabel: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#334155',
    marginBottom: 6,
  },
  datePickerRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 10,
  },
  dateChoiceBtn: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
  },
  dateChoiceBtnActive: {
    backgroundColor: '#00B894',
    borderColor: '#00B894',
  },
  dateChoiceText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#475569',
  },
  dateChoiceTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  slotChoiceBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    backgroundColor: '#F8FAFC',
  },
  slotChoiceBtnActive: {
    borderColor: '#A7F3D0',
    backgroundColor: '#E6F8F4',
  },
  slotChoiceText: {
    fontSize: 13,
    color: '#334155',
  },
  modalInput: {
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 8,
    padding: 10,
    fontSize: 13,
    color: '#0F172A',
    outlineStyle: 'none',
  },
  alertWarning: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#FFFBEB',
    borderWidth: 1,
    borderColor: '#FDE68A',
    borderRadius: 8,
    padding: 10,
    marginBottom: 14,
  },
  alertWarningText: {
    flex: 1,
    fontSize: 12,
    color: '#92400E',
    lineHeight: 16,
  },
  mapPreviewBox: {
    backgroundColor: '#F0FDF4',
    borderWidth: 1,
    borderColor: '#BBF7D0',
    borderRadius: 12,
    padding: 24,
    alignItems: 'center',
  },
  distanceBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    marginTop: 12,
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 10,
  },
  contactIconWrap: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#E6F8F4',
    alignItems: 'center',
    justifyContent: 'center',
  },
  contactTitle: {
    fontSize: 13.5,
    fontWeight: '700',
    color: '#0F172A',
  },
  contactSubtitle: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 1,
  },
  callNowBtn: {
    backgroundColor: '#00B894',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  callNowBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
});
