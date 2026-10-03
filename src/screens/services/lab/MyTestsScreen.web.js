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
  useWindowDimensions,
  ActivityIndicator,
  Platform,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import WebFooter from '../../../components/web/WebFooter';
import PaginationBar from '../../../components/web/PaginationBar';
import PatientPageBanner from '../../../components/web/PatientPageBanner';
import {
  getActivePatient,
  getPatientFamilyMembers,
  addPatientFamilyMember,
  getBookedTests,
  saveBookedTests,
  getTestReports,
  saveTestReports,
  formatAddressString,
  formatSafeText,
  sortAppointmentList,
} from '../../../data/patientDashboardData';
import {
  DIAGNOSTIC_CENTRES,
  getGoogleMapsDirectionsUrl,
} from '../../../data/labTestData';

const VIEW_MODES = [
  { id: 'all_appts', label: 'All Tests & Scans', icon: 'apps' },
  { id: 'lab', label: 'Lab Tests', icon: 'flask' },
  { id: 'packages', label: 'Lab Packages', icon: 'medkit' },
  { id: 'radiology', label: 'Radiology', icon: 'scan' },
  { id: 'reports', label: 'Completed Reports', icon: 'document-text' },
];

const MODALITY_FILTERS = [
  'All Appointments (Lab & Radiology)',
  'Radiology & Scans (MRI, CT, X-Ray, USG)',
  'Pathology & Blood Tests',
];

const STATUS_FILTERS = [
  'All Status',
  'Active & Confirmed',
  'Completed',
  'Cancelled',
];

const SORT_OPTIONS = [
  { id: 'upcoming', label: 'Upcoming First', icon: 'calendar-outline' },
  { id: 'latest_booked', label: 'Latest Booked', icon: 'time-outline' },
  { id: 'oldest_booked', label: 'Oldest Booked', icon: 'archive-outline' },
  { id: 'date_asc', label: 'Appointment Date: Earliest First', icon: 'arrow-up-circle-outline' },
  { id: 'date_desc', label: 'Appointment Date: Latest First', icon: 'arrow-down-circle-outline' },
];

export const isRadiologyBooking = (item) => {
  if (!item) return false;
  if (item.bookingType === 'Radiology') return true;
  const m = `${item.bookingType || ''} ${item.modality || ''} ${item.testCategory || ''} ${item.category || ''} ${item.categoryLabel || ''} ${item.type || ''} ${item.modalityType || ''} ${item.department || ''} ${item.testName || ''}`.toLowerCase();
  return (
    m.includes('radio') ||
    m.includes('scan') ||
    m.includes('mri') ||
    m.includes('ct ') ||
    m.includes('ct-') ||
    m.includes('computed tom') ||
    m.includes('x-ray') ||
    m.includes('xray') ||
    m.includes('usg') ||
    m.includes('ultrasound') ||
    m.includes('sonography') ||
    m.includes('mammograph') ||
    m.includes('dexa') ||
    m.includes('ecg') ||
    m.includes('echo')
  );
};

export const isLabPackageBooking = (item) => {
  if (!item || isRadiologyBooking(item)) return false;
  if (item.bookingType === 'Lab Package') return true;
  const m = `${item.bookingType || ''} ${item.testCategory || ''} ${item.category || ''} ${item.categoryLabel || ''} ${item.testName || ''}`.toLowerCase();
  return m.includes('package') || m.includes('checkup') || m.includes('profile') || item.isPackage || item.testsCount > 1;
};

export const isLabTestBooking = (item) => {
  if (!item || isRadiologyBooking(item)) return false;
  return !isLabPackageBooking(item);
};

export const isLabBooking = (item) => {
  return !isRadiologyBooking(item);
};

export const getBookingTypeLabel = (item) => {
  if (isRadiologyBooking(item)) return 'Radiology';
  if (isLabPackageBooking(item)) return 'Lab Package';
  return 'Lab Test';
};

const RESCHEDULE_DATES = [
  'Tomorrow, Oct 01, 2026',
  'Friday, Oct 02, 2026',
  'Saturday, Oct 03, 2026',
  'Monday, Oct 05, 2026',
];

const RESCHEDULE_SLOTS = [
  'Morning Slot (08:30 AM - 09:30 AM)',
  'Morning Slot (10:30 AM - 11:30 AM)',
  'Afternoon Slot (02:00 PM - 03:00 PM)',
  'Evening Slot (05:00 PM - 06:00 PM)',
];

const FAMILY_RELATIONS = ['Spouse', 'Son', 'Daughter', 'Father', 'Mother', 'Brother', 'Sister', 'Other'];

const MyTestsScreenWeb = ({ navigation, route }) => {
  const { width } = useWindowDimensions();
  const isDesktop = width >= 1024;
  const isTablet = width >= 768 && width < 1024;

  const [patient, setPatient] = useState(null);
  const [familyMembers, setFamilyMembers] = useState([]);
  const [bookedTests, setBookedTests] = useState([]);
  const [testReports, setTestReports] = useState([]);
  const [loading, setLoading] = useState(true);

  // Active view switcher (defaults to all appointments so both lab & radiology appear immediately)
  const initialMode = route?.params?.initialTab || (route?.params?.tab === 'radiology' ? 'radiology' : route?.params?.tab === 'lab' ? 'lab' : route?.params?.tab === 'packages' ? 'packages' : route?.params?.tab === 'reports' ? 'reports' : 'all_appts');
  const [viewMode, setViewMode] = useState(initialMode); // 'all_appts' | 'lab' | 'packages' | 'radiology' | 'reports'
  const [selectedFamilyMember, setSelectedFamilyMember] = useState('all');
  const [selectedModality, setSelectedModality] = useState('All Appointments (Lab & Radiology)');
  const [selectedStatus, setSelectedStatus] = useState('All Status');
  const [sortBy, setSortBy] = useState('upcoming');
  const [searchQuery, setSearchQuery] = useState('');

  // Pagination states (8 items per page)
  const ITEMS_PER_PAGE = 8;
  const [bookedPage, setBookedPage] = useState(1);
  const [reportsPage, setReportsPage] = useState(1);

  // Modals
  const [viewingDetails, setViewingDetails] = useState(null); // Full Test / Scan Details Modal
  const [viewingReport, setViewingReport] = useState(null); // Diagnostic & Radiology Report Viewer
  const [viewingSlip, setViewingSlip] = useState(null); // Digital Booking Pass / QR Slip
  const [reschedulingTest, setReschedulingTest] = useState(null); // Reschedule Modal
  const [cancellingTest, setCancellingTest] = useState(null); // Cancel Booking Modal
  const [isAddMemberModalOpen, setIsAddMemberModalOpen] = useState(false); // Add Family Member Modal

  // Add Family Member Form State
  const [newMemberName, setNewMemberName] = useState('');
  const [newMemberRelation, setNewMemberRelation] = useState(FAMILY_RELATIONS[0]);
  const [newMemberAge, setNewMemberAge] = useState('');
  const [newMemberGender, setNewMemberGender] = useState('Female');
  const [newMemberPhone, setNewMemberPhone] = useState('');

  // Reschedule Form State
  const [selectedRescheduleDate, setSelectedRescheduleDate] = useState(RESCHEDULE_DATES[0]);
  const [selectedRescheduleSlot, setSelectedRescheduleSlot] = useState(RESCHEDULE_SLOTS[1]);

  // Toast
  const [toastMessage, setToastMessage] = useState('');
  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 4500);
  };

  useEffect(() => {
    loadData();

    const unsubscribe = navigation?.addListener ? navigation.addListener('focus', () => {
      loadData();
    }) : null;

    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      window.addEventListener('focus', loadData);
      return () => {
        if (unsubscribe) unsubscribe();
        window.removeEventListener('focus', loadData);
      };
    }

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [navigation]);

  useEffect(() => {
    if (route?.params?.initialTab) {
      setViewMode(route.params.initialTab);
    } else if (route?.params?.tab) {
      setViewMode(route.params.tab);
    }
    loadData();
  }, [route?.params]);

  const loadData = async () => {
    setLoading(true);
    try {
      const p = await getActivePatient();
      setPatient(p);
      const fam = await getPatientFamilyMembers();
      setFamilyMembers(fam);
      const booked = await getBookedTests();
      setBookedTests(booked);
      const reports = await getTestReports();
      setTestReports(reports);
    } catch (e) {
      console.warn('Error loading tests data:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveFamilyMember = async () => {
    if (!newMemberName.trim()) {
      showToast('Please enter the family member’s name.');
      return;
    }
    const updated = await addPatientFamilyMember({
      name: newMemberName.trim(),
      relation: newMemberRelation,
      age: newMemberAge || '28',
      gender: newMemberGender,
      phone: newMemberPhone,
    });
    if (updated) {
      setFamilyMembers(updated);
      setIsAddMemberModalOpen(false);
      setNewMemberName('');
      setNewMemberAge('');
      setNewMemberPhone('');
      showToast(`${newMemberName.trim()} (${newMemberRelation}) added to family profiles!`);
      const booked = await getBookedTests();
      setBookedTests(booked);
      const reports = await getTestReports();
      setTestReports(reports);
    }
  };

  // Family member display object
  const activeMemberObj = useMemo(() => {
    if (selectedFamilyMember === 'all') return null;
    return familyMembers.find((m) => m.id === selectedFamilyMember);
  }, [familyMembers, selectedFamilyMember]);

  // Overall Lab vs Radiology appointment breakdown
  const appointmentBreakdown = useMemo(() => {
    let rad = 0;
    let labTests = 0;
    let labPackages = 0;
    bookedTests.forEach((t) => {
      if (isRadiologyBooking(t)) {
        rad++;
      } else if (isLabPackageBooking(t)) {
        labPackages++;
      } else {
        labTests++;
      }
    });
    return { rad, labTests, labPackages, lab: labTests + labPackages, total: bookedTests.length };
  }, [bookedTests]);

  // Filter Booked Tests (All Lab and Radiology Appointments)
  const filteredBookedTests = useMemo(() => {
    return bookedTests.filter((item) => {
      const isRad = isRadiologyBooking(item);
      const isPkg = isLabPackageBooking(item);
      const isLab = !isRad;

      // Primary tab filtering
      if (viewMode === 'lab' && !isLabTestBooking(item)) return false;
      if (viewMode === 'packages' && !isPkg) return false;
      if (viewMode === 'radiology' && !isRad) return false;
      if (viewMode === 'reports') return false;

      // Family member filter
      if (selectedFamilyMember !== 'all') {
        const matchesId = item.patientId === selectedFamilyMember;
        const matchesName = activeMemberObj && (
          (item.patientName || '').toLowerCase().includes(activeMemberObj.name?.toLowerCase()) ||
          (item.familyMemberName || '').toLowerCase().includes(activeMemberObj.name?.toLowerCase()) ||
          (item.patientName || '').toLowerCase().includes(activeMemberObj.relation?.toLowerCase())
        );
        if (!matchesId && !matchesName) return false;
      }

      // Modality filter
      if (selectedModality !== 'All Appointments (Lab & Radiology)' && selectedModality !== 'All Modalities') {
        if (selectedModality.includes('Radiology') && !isRad) return false;
        if (selectedModality.includes('Pathology') && !isLab) return false;
      }

      // Status filter
      if (selectedStatus !== 'All Status') {
        const s = (item.status || '').toLowerCase();
        if (selectedStatus === 'Active & Confirmed') {
          if (s.includes('cancel') || s.includes('complete')) return false;
        } else if (selectedStatus === 'Completed') {
          if (!s.includes('complete')) return false;
        } else if (selectedStatus === 'Cancelled') {
          if (!s.includes('cancel')) return false;
        }
      }

      // Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const name = (item.testName || '').toLowerCase();
        const center = (item.centerName || '').toLowerCase();
        const ref = (item.bookingRef || '').toLowerCase();
        const pName = (item.patientName || '').toLowerCase();
        const mod = (item.modality || '').toLowerCase();
        const type = (item.modalityType || '').toLowerCase();
        return name.includes(q) || center.includes(q) || ref.includes(q) || pName.includes(q) || mod.includes(q) || type.includes(q);
      }

      return true;
    });
  }, [bookedTests, viewMode, selectedFamilyMember, selectedModality, selectedStatus, searchQuery, activeMemberObj]);

  // Sort Booked Tests according to selected sort option (Default: Upcoming First)
  const sortedBookedTests = useMemo(() => {
    return sortAppointmentList(filteredBookedTests, sortBy);
  }, [filteredBookedTests, sortBy]);

  // Filter & Sort Completed Reports
  const filteredReports = useMemo(() => {
    const list = testReports.filter((item) => {
      // Family member filter
      if (selectedFamilyMember !== 'all') {
        const matchesId = item.patientId === selectedFamilyMember;
        const matchesName = activeMemberObj && (
          (item.patientName || '').toLowerCase().includes(activeMemberObj.name?.toLowerCase()) ||
          (item.patientName || '').toLowerCase().includes(activeMemberObj.relation?.toLowerCase())
        );
        if (!matchesId && !matchesName) return false;
      }

      // Modality filter
      if (selectedModality !== 'All Appointments (Lab & Radiology)' && selectedModality !== 'All Modalities') {
        const itemMod = `${item.modality || ''} ${item.category || ''} ${item.testCategory || ''} ${item.type || ''}`.toLowerCase();
        if (selectedModality.includes('Radiology') && !itemMod.includes('radio') && !itemMod.includes('scan') && !itemMod.includes('mri') && !itemMod.includes('ct') && !itemMod.includes('x-ray') && !itemMod.includes('usg') && !itemMod.includes('ultrasound')) return false;
        if (selectedModality.includes('Pathology') && !itemMod.includes('patholog') && !itemMod.includes('blood') && !itemMod.includes('lab') && !itemMod.includes('sample')) return false;
      }

      // Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const name = (item.testName || '').toLowerCase();
        const lab = (item.labName || '').toLowerCase();
        const pName = (item.patientName || '').toLowerCase();
        return name.includes(q) || lab.includes(q) || pName.includes(q);
      }

      return true;
    });

    return sortAppointmentList(list, sortBy);
  }, [testReports, selectedFamilyMember, selectedModality, searchQuery, activeMemberObj, sortBy]);

  // Reset pagination when filters, tabs, search or sort change
  useEffect(() => {
    setBookedPage(1);
    setReportsPage(1);
  }, [selectedFamilyMember, selectedModality, selectedStatus, searchQuery, viewMode, sortBy]);

  // Slice paginated lists (8 items per page)
  const paginatedBookedTests = useMemo(() => {
    const startIndex = (bookedPage - 1) * ITEMS_PER_PAGE;
    return sortedBookedTests.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [sortedBookedTests, bookedPage]);

  const paginatedReports = useMemo(() => {
    const startIndex = (reportsPage - 1) * ITEMS_PER_PAGE;
    return filteredReports.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [filteredReports, reportsPage]);

  // Handle Open Directions in Maps
  const handleOpenDirections = (test) => {
    if (!test) return;
    const cName = typeof test?.centerName === 'object' ? test.centerName?.name : test?.centerName;
    const matchedCentre = DIAGNOSTIC_CENTRES?.find(
      (c) =>
        c.name?.toLowerCase() === cName?.toLowerCase() ||
        c.id === test?.centerId ||
        c.name?.toLowerCase() === test?.diagnosticCentre?.name?.toLowerCase()
    );
    if (matchedCentre) {
      const mapsUrl = getGoogleMapsDirectionsUrl(matchedCentre);
      if (Platform.OS === 'web' && typeof window !== 'undefined') {
        window.open(mapsUrl, '_blank', 'noopener,noreferrer');
      } else {
        Linking.openURL(mapsUrl);
      }
      return;
    }

    const rawDest = test.address || test.centerName || test.location || test.providerAddress || '';
    const destination = (typeof rawDest === 'object' ? formatAddressString(rawDest) : String(rawDest || '')).trim();
    if (destination) {
      const query = encodeURIComponent(destination);
      const mapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${query}`;
      if (Platform.OS === 'web' && typeof window !== 'undefined') {
        window.open(mapsUrl, '_blank', 'noopener,noreferrer');
      } else {
        Linking.openURL(mapsUrl);
      }
    } else {
      showToast('Location details not available for this booking.');
    }
  };

  // Handle Reschedule
  const handleConfirmReschedule = async () => {
    if (!reschedulingTest) return;
    const updated = bookedTests.map((t) => {
      if (t.id === reschedulingTest.id) {
        return {
          ...t,
          appointmentDate: selectedRescheduleDate,
          timeSlot: selectedRescheduleSlot,
          status: 'Slot Confirmed (Rescheduled)',
        };
      }
      return t;
    });
    setBookedTests(updated);
    await saveBookedTests(updated);
    showToast(`Test slot rescheduled to ${selectedRescheduleDate} (${selectedRescheduleSlot})`);
    setReschedulingTest(null);
  };

  // Handle Cancel
  const handleConfirmCancel = async () => {
    if (!cancellingTest) return;
    const updated = bookedTests.map((t) => {
      if (t.id === cancellingTest.id) {
        return {
          ...t,
          status: 'Cancelled',
          paymentStatus: `Refund Initiated (₹${t.price})`,
        };
      }
      return t;
    });
    setBookedTests(updated);
    await saveBookedTests(updated);
    showToast(`Booking cancelled. Refund of ₹${cancellingTest.price} initiated to source account.`);
    setCancellingTest(null);
  };

  const handleDownloadReport = (report) => {
    showToast(`Downloading certified diagnostic report for ${report.testName}... (PDF)`);
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
            <Text style={styles.breadcrumbActive}>My Tests & Diagnostic Scans</Text>
          </View>
        </View>

        {/* Page Hero Banner */}
        <View style={styles.innerContainer}>
          <PatientPageBanner
            title="My Tests & Radiology Scans"
            subtitle="Track your active booked tests in real time, view diagnostic scans (MRI, CT, X-Ray, Ultrasound), and download certified doctor-verified laboratory reports."
            badgeText="CENTRAL DIAGNOSTICS & RADIOLOGY VAULT"
            badgeIcon="scan-circle"
            iconName="flask"
            theme="aqua"
            pills={[
              {
                label: `Active Bookings: ${appointmentBreakdown.total}`,
                bgColor: '#DCFCE7',
                borderColor: '#86EFAC',
                textColor: '#166534',
                icon: 'checkmark-circle',
              },
              {
                label: `Verified Reports: ${testReports.length}`,
                bgColor: '#E0F2FE',
                borderColor: '#BAE6FD',
                textColor: '#0369A1',
                icon: 'document-text-outline',
              },
            ]}
            rightContent={
              <View style={{ flexDirection: 'row', gap: 10, flexWrap: 'wrap' }}>
                <TouchableOpacity
                  style={styles.bookTestBtn}
                  onPress={() => navigation?.navigate('LabTests')}
                  activeOpacity={0.85}
                >
                  <Ionicons name="flask" size={16} color="#FFFFFF" style={{ marginRight: 6 }} />
                  <Text style={styles.bookTestBtnText}>Book Lab Test</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.bookTestBtn, { backgroundColor: '#1E3A8A', boxShadow: '0 4px 14px rgba(30, 58, 138, 0.35)' }]}
                  onPress={() => navigation?.navigate('Radiology')}
                  activeOpacity={0.85}
                >
                  <Ionicons name="scan" size={16} color="#FFFFFF" style={{ marginRight: 6 }} />
                  <Text style={styles.bookTestBtnText}>Book Radiology Scan</Text>
                </TouchableOpacity>
              </View>
            }
          />
        </View>

        <View style={[styles.innerContainer, { paddingTop: 6, paddingBottom: 60 }]}>

          {/* =========================================================
              VIEW MODE SWITCHER (Booked Tests Now vs. Completed Reports)
          ========================================================= */}
          <View style={styles.viewModeSwitcher}>
            {VIEW_MODES.map((mode) => {
              const active = viewMode === mode.id;
              const count =
                mode.id === 'all_appts'
                  ? appointmentBreakdown.total
                  : mode.id === 'lab'
                  ? appointmentBreakdown.labTests
                  : mode.id === 'packages'
                  ? appointmentBreakdown.labPackages
                  : mode.id === 'radiology'
                  ? appointmentBreakdown.rad
                  : testReports.length;

              return (
                <TouchableOpacity
                  key={mode.id}
                  style={[styles.viewModeBtn, active && styles.viewModeBtnActive]}
                  onPress={() => {
                    setViewMode(mode.id);
                    if (mode.id === 'lab' || mode.id === 'radiology') {
                      setSelectedModality('All Appointments (Lab & Radiology)');
                    }
                  }}
                  activeOpacity={0.8}
                >
                  <Ionicons
                    name={mode.icon}
                    size={16}
                    color={active ? '#FFFFFF' : '#475569'}
                    style={{ marginRight: 6 }}
                  />
                  <Text style={[styles.viewModeBtnText, active && styles.viewModeBtnTextActive]}>
                    {mode.label}
                  </Text>
                  <View style={[styles.viewModeBadge, active && styles.viewModeBadgeActive]}>
                    <Text style={[styles.viewModeBadgeText, active && styles.viewModeBadgeTextActive]}>
                      {count}
                    </Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* =========================================================
              FAMILY MEMBER FILTER ROW
          ========================================================= */}
          <View style={styles.familyFilterCard}>
            <View style={styles.familyFilterHeader}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Ionicons name="people" size={17} color="#00B894" />
                <Text style={styles.familyFilterTitle}>Filter by Patient / Family Member:</Text>
              </View>
              <Text style={styles.familyFilterSubtitle}>Select a family member to see only their booked tests and scan records</Text>
            </View>

            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.familyPillsRow}>
              {/* All Members Option */}
              <TouchableOpacity
                style={[styles.familyPill, selectedFamilyMember === 'all' && styles.familyPillActive]}
                onPress={() => setSelectedFamilyMember('all')}
                activeOpacity={0.8}
              >
                <View style={[styles.familyAvatar, selectedFamilyMember === 'all' && styles.familyAvatarActive]}>
                  <Ionicons name="people-outline" size={14} color={selectedFamilyMember === 'all' ? '#FFFFFF' : '#64748B'} />
                </View>
                <Text style={[styles.familyPillText, selectedFamilyMember === 'all' && styles.familyPillTextActive]}>
                  All Members ({bookedTests.length + testReports.length})
                </Text>
              </TouchableOpacity>

              {/* Individual Family Members */}
              {familyMembers.map((member) => {
                const bookedCount = bookedTests.filter((r) => r.patientId === member.id && r.status !== 'Cancelled').length;
                const rptCount = testReports.filter((r) => r.patientId === member.id).length;
                const total = bookedCount + rptCount;
                const isSelected = selectedFamilyMember === member.id;
                return (
                  <TouchableOpacity
                    key={member.id}
                    style={[styles.familyPill, isSelected && styles.familyPillActive]}
                    onPress={() => setSelectedFamilyMember(member.id)}
                    activeOpacity={0.8}
                  >
                    <View style={[styles.familyAvatar, isSelected && styles.familyAvatarActive]}>
                      <Text style={[styles.familyAvatarInitial, isSelected && { color: '#FFFFFF' }]}>
                        {member.name.charAt(0)}
                      </Text>
                    </View>
                    <View>
                      <Text style={[styles.familyPillText, isSelected && styles.familyPillTextActive]}>
                        {member.name}
                      </Text>
                      <Text style={[styles.familyPillSubtext, isSelected && { color: '#E6F8F4' }]}>
                        {member.relation} • {total} {total === 1 ? 'test' : 'tests'}
                      </Text>
                    </View>
                  </TouchableOpacity>
                );
              })}

              {/* Add Family Member Button */}
              <TouchableOpacity
                style={styles.addMemberPill}
                onPress={() => setIsAddMemberModalOpen(true)}
                activeOpacity={0.8}
              >
                <Ionicons name="add-circle" size={16} color="#00B894" />
                <Text style={styles.addMemberPillText}>+ Add Member</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>

          {/* =========================================================
              SECONDARY CONTROLS: SEARCH & MODALITY FILTERS
          ========================================================= */}
          <View style={styles.secondaryControlsCard}>
            {/* Search Input */}
            <View style={styles.searchBar}>
              <Ionicons name="search-outline" size={18} color="#64748B" style={{ marginRight: 8 }} />
              <TextInput
                style={styles.searchInput}
                placeholder="Search tests (MRI, CT Scan, X-Ray, Blood, CBC, Lipid...) or diagnostic centre..."
                placeholderTextColor="#94A3B8"
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
              {searchQuery ? (
                <TouchableOpacity onPress={() => setSearchQuery('')} style={{ padding: 4 }}>
                  <Ionicons name="close-circle" size={16} color="#94A3B8" />
                </TouchableOpacity>
              ) : null}
            </View>

            {/* Filter Chips: Modality and Status */}
            <View style={{ gap: 8 }}>
              {/* Modality Chips */}
              <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
                <Text style={{ fontSize: 11, fontWeight: '700', color: '#64748B', marginRight: 4 }}>MODALITY:</Text>
                {MODALITY_FILTERS.map((mod) => {
                  const isSel = selectedModality === mod;
                  return (
                    <TouchableOpacity
                      key={mod}
                      style={[styles.smallFilterChip, isSel && styles.smallFilterChipActive]}
                      onPress={() => setSelectedModality(mod)}
                    >
                      <Ionicons
                        name={mod.includes('Radiology') ? 'scan-outline' : mod.includes('Pathology') ? 'flask-outline' : 'layers-outline'}
                        size={13}
                        color={isSel ? '#FFFFFF' : '#475569'}
                        style={{ marginRight: 4 }}
                      />
                      <Text style={[styles.smallFilterChipText, isSel && styles.smallFilterChipTextActive]}>
                        {mod}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* Status Chips */}
              <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap', alignItems: 'center', paddingTop: 4 }}>
                <Text style={{ fontSize: 11, fontWeight: '700', color: '#64748B', marginRight: 4 }}>STATUS:</Text>
                {STATUS_FILTERS.map((st) => {
                  const isSel = selectedStatus === st;
                  return (
                    <TouchableOpacity
                      key={st}
                      style={[styles.smallFilterChip, isSel && { backgroundColor: '#00B894', borderColor: '#00B894' }]}
                      onPress={() => setSelectedStatus(st)}
                    >
                      <Ionicons
                        name={st === 'Completed' ? 'checkmark-circle-outline' : st === 'Cancelled' ? 'close-circle-outline' : 'time-outline'}
                        size={12}
                        color={isSel ? '#FFFFFF' : '#475569'}
                        style={{ marginRight: 4 }}
                      />
                      <Text style={[styles.smallFilterChipText, isSel && styles.smallFilterChipTextActive]}>
                        {st}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* Sort By Chips */}
              <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap', alignItems: 'center', paddingTop: 4 }}>
                <Text style={{ fontSize: 11, fontWeight: '700', color: '#64748B', marginRight: 4 }}>SORT BY:</Text>
                {SORT_OPTIONS.map((opt) => {
                  const isSel = sortBy === opt.id;
                  return (
                    <TouchableOpacity
                      key={opt.id}
                      style={[styles.smallFilterChip, isSel && styles.smallSortChipActive]}
                      onPress={() => setSortBy(opt.id)}
                      activeOpacity={0.8}
                    >
                      <Ionicons
                        name={opt.icon}
                        size={12}
                        color={isSel ? '#FFFFFF' : '#475569'}
                        style={{ marginRight: 4 }}
                      />
                      <Text style={[styles.smallFilterChipText, isSel && styles.smallFilterChipTextActive]}>
                        {opt.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          </View>

          {/* =========================================================
              MAIN CONTENT: BOOKED TESTS NOW (ACTIVE)
          ========================================================= */}
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#00B894" />
              <Text style={styles.loadingText}>Loading diagnostic records and scheduled appointments...</Text>
            </View>
          ) : (
            <View style={{ gap: 28 }}>
              {/* SECTION 1: LAB & RADIOLOGY APPOINTMENTS */}
              {viewMode !== 'reports' && (
                <View style={{ gap: 14 }}>
                  <View style={styles.sectionHeaderRow}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                      <View style={[styles.pulseDot, viewMode === 'lab' && { backgroundColor: '#00B894' }, viewMode === 'radiology' && { backgroundColor: '#00C2CB' }]} />
                      <Text style={styles.sectionTitle}>
                        {viewMode === 'lab'
                          ? 'My Lab Test Appointments (Pathology & Blood Tests)'
                          : viewMode === 'radiology'
                          ? 'My Radiology Scan Appointments (MRI, CT, X-Ray, USG)'
                          : 'All Diagnostic Test Appointments (Lab & Radiology)'}
                      </Text>
                    </View>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                      {viewMode === 'all_appts' ? (
                        <>
                          <View style={[styles.countBadgePill, { backgroundColor: '#E0F7FA', borderColor: '#80DEEA' }]}>
                            <Ionicons name="scan" size={12} color="#00C2CB" style={{ marginRight: 4 }} />
                            <Text style={[styles.countBadgePillText, { color: '#00838F' }]}>{appointmentBreakdown.rad} Radiology</Text>
                          </View>
                          <View style={[styles.countBadgePill, { backgroundColor: '#E6F8F4', borderColor: '#A7F3D0' }]}>
                            <Ionicons name="flask" size={12} color="#00B894" style={{ marginRight: 4 }} />
                            <Text style={[styles.countBadgePillText, { color: '#00B894' }]}>{appointmentBreakdown.lab} Pathology</Text>
                          </View>
                        </>
                      ) : (
                        <View
                          style={[
                            styles.countBadgePill,
                            viewMode === 'lab'
                              ? { backgroundColor: '#E6F8F4', borderColor: '#A7F3D0' }
                              : { backgroundColor: '#E0F7FA', borderColor: '#80DEEA' },
                          ]}
                        >
                          <Ionicons
                            name={viewMode === 'lab' ? 'flask' : 'scan'}
                            size={12}
                            color={viewMode === 'lab' ? '#00B894' : '#00C2CB'}
                            style={{ marginRight: 4 }}
                          />
                          <Text style={[styles.countBadgePillText, { color: viewMode === 'lab' ? '#00B894' : '#00838F' }]}>
                            {viewMode === 'lab' ? `${appointmentBreakdown.lab} Pathology Bookings` : `${appointmentBreakdown.rad} Radiology Scans`}
                          </Text>
                        </View>
                      )}
                      <Text style={styles.sectionSubtitle}>
                        {sortedBookedTests.length} {sortedBookedTests.length === 1 ? 'booking' : 'bookings'}
                      </Text>
                    </View>
                  </View>

                  {sortedBookedTests.length === 0 ? (
                    <View style={styles.emptyBookedCard}>
                      <Ionicons
                        name={viewMode === 'lab' ? 'flask-outline' : viewMode === 'radiology' ? 'scan-outline' : 'calendar-outline'}
                        size={36}
                        color="#94A3B8"
                      />
                      <Text style={styles.emptyBookedTitle}>
                        {viewMode === 'lab'
                          ? 'No active lab test appointments'
                          : viewMode === 'radiology'
                          ? 'No active radiology scan appointments'
                          : 'No active test bookings'}
                      </Text>
                      <Text style={styles.emptyBookedDesc}>
                        {viewMode === 'lab'
                          ? 'You do not currently have any pending laboratory or blood tests booked under this filter.'
                          : viewMode === 'radiology'
                          ? 'You do not currently have any pending radiology or imaging scans booked under this filter.'
                          : 'You do not currently have any pending laboratory or radiology tests booked under this filter.'}
                      </Text>
                      <TouchableOpacity
                        style={[styles.bookTestBtn, { marginTop: 12, backgroundColor: viewMode === 'radiology' ? '#1E3A8A' : '#00B894' }]}
                        onPress={() => navigation?.navigate(viewMode === 'radiology' ? 'Radiology' : 'LabTests')}
                      >
                        <Text style={styles.bookTestBtnText}>
                          {viewMode === 'radiology' ? 'Book a Radiology Scan Now' : 'Book a Lab Test Now'}
                        </Text>
                      </TouchableOpacity>
                    </View>
                  ) : (
                    paginatedBookedTests.map((test) => {
                      const bType = getBookingTypeLabel(test);
                      const isRadiology = bType === 'Radiology';
                      const isPackage = bType === 'Lab Package';
                      const isHome = test.testType === 'Home Sample Collection';
                      const isCancelled = (test.status || '').toLowerCase() === 'cancelled';

                      return (
                        <View key={test.id} style={styles.bookedCard}>
                          {/* Top Row: Type Badge + Booking Ref + Live Status */}
                          <View style={styles.bookedTopRow}>
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                              {/* Prominent Booking Type Badge */}
                              <View
                                style={[
                                  styles.modalityBadge,
                                  {
                                    backgroundColor: isRadiology ? '#E0F7FA' : isPackage ? '#EFF6FF' : '#E6F8F4',
                                    borderColor: isRadiology ? '#80DEEA' : isPackage ? '#BFDBFE' : '#A7F3D0',
                                  },
                                ]}
                              >
                                <Ionicons
                                  name={isRadiology ? 'scan' : isPackage ? 'medkit' : 'flask'}
                                  size={13}
                                  color={isRadiology ? '#00C2CB' : isPackage ? '#1E3A8A' : '#00B894'}
                                  style={{ marginRight: 4 }}
                                />
                                <Text
                                  style={[
                                    styles.modalityBadgeText,
                                    { color: isRadiology ? '#00838F' : isPackage ? '#1E3A8A' : '#00B894', fontWeight: '800' },
                                  ]}
                                >
                                  {bType}
                                </Text>
                              </View>

                              {/* Booking ID */}
                              <Text style={styles.bookingRefText}>Booking ID: {test.bookingRef || test.id}</Text>
                            </View>

                            {/* Service Relevant Status Pill */}
                            <View style={[styles.liveStatusBadge, isCancelled && styles.liveStatusCancelled]}>
                              <View style={[styles.statusIndicatorDot, isCancelled && { backgroundColor: '#FF7F50' }]} />
                              <Text style={[styles.liveStatusText, isCancelled && { color: '#FF7F50' }]}>
                                {test.status}
                              </Text>
                            </View>
                          </View>

                          {/* Main Row: Test Name, Centre, Schedule */}
                          <View style={styles.bookedMainRow}>
                            <View style={{ flex: 1 }}>
                              <Text style={styles.bookedTestName}>{test.testName}</Text>

                              {/* Category / Modality subtitle */}
                              <Text style={styles.testCategorySubText}>
                                Type: {bType} • {test.categoryLabel || test.testCategory || test.modality || 'Diagnostics'}
                              </Text>

                              {/* Centre & Department */}
                              <View style={styles.centreRow}>
                                <Ionicons name="business" size={15} color="#1E3A8A" style={{ marginRight: 6 }} />
                                <Text style={styles.centreNameText}>
                                  {typeof test.centerName === 'object' ? (test.centerName?.name || 'Diagnostic Centre') : String(test.centerName || 'Diagnostic Centre')} • <Text style={{ color: '#64748B' }}>{typeof test.department === 'object' ? '' : String(test.department || '')}</Text>
                                </Text>
                              </View>

                              {/* Appointment Type & Location */}
                              <View style={styles.locationRow}>
                                <Ionicons
                                  name={isHome ? 'home-outline' : 'location-outline'}
                                  size={14}
                                  color={isHome ? '#00B894' : '#64748B'}
                                  style={{ marginRight: 4 }}
                                />
                                <Text style={styles.locationText}>{formatAddressString(test.address || test.location)}</Text>
                                {!isHome && (
                                  <TouchableOpacity
                                    style={styles.inlineGetDirectionsBtn}
                                    onPress={() => handleOpenDirections(test)}
                                    activeOpacity={0.8}
                                    accessibilityRole="button"
                                    accessibilityLabel="Get Directions"
                                  >
                                    <Ionicons name="navigate" size={12} color="#0D9488" style={{ marginRight: 4 }} />
                                    <Text style={styles.inlineGetDirectionsBtnText}>Get Directions</Text>
                                  </TouchableOpacity>
                                )}
                              </View>

                              {/* Instructions Notice */}
                              {test.instructions && (
                                <View style={styles.prepNoticeBox}>
                                  <Ionicons name="alert-circle" size={14} color="#D97706" style={{ marginRight: 6 }} />
                                  <Text style={styles.prepNoticeText}>{test.instructions}</Text>
                                </View>
                              )}

                              {/* Live Phlebotomist Assigned Callout (for home collections) */}
                              {test.phlebotomist && !isCancelled && (
                                <View style={styles.phlebotomistBox}>
                                  <View style={styles.phlebAvatar}>
                                    <Ionicons name="bicycle" size={18} color="#00B894" />
                                  </View>
                                  <View style={{ flex: 1 }}>
                                    <Text style={styles.phlebTitle}>
                                      Phlebotomist En Route: <Text style={{ fontWeight: '800' }}>{test.phlebotomist.name}</Text>
                                    </Text>
                                    <Text style={styles.phlebEta}>
                                      Estimated Arrival: {test.phlebotomist.eta} • Vehicle: {test.phlebotomist.vehicle}
                                    </Text>
                                  </View>
                                  <TouchableOpacity
                                    style={styles.callPhlebBtn}
                                    onPress={() => showToast(`Calling Phlebotomist ${test.phlebotomist.name} at ${test.phlebotomist.phone}...`)}
                                  >
                                    <Ionicons name="call" size={13} color="#FFFFFF" style={{ marginRight: 4 }} />
                                    <Text style={styles.callPhlebBtnText}>Call</Text>
                                  </TouchableOpacity>
                                </View>
                              )}
                            </View>

                            {/* Schedule & Price Box */}
                            <View style={styles.bookedScheduleBox}>
                              <View style={styles.slotCard}>
                                <Text style={styles.slotDateLabel}>APPOINTMENT SLOT</Text>
                                <Text style={styles.slotDateText}>{test.appointmentDate || test.formattedDate || test.date}</Text>
                                <Text style={styles.slotTimeText}>{test.timeSlot}</Text>
                              </View>

                              <View style={styles.pricePill}>
                                <Text style={styles.priceAmount}>₹{test.price || test.paidAmount || 0}</Text>
                                <Text style={styles.paymentStatusText}>{test.paymentStatus}</Text>
                              </View>

                              <View style={styles.patientInfoPill}>
                                <Ionicons name="person" size={11} color="#1E3A8A" style={{ marginRight: 4 }} />
                                <Text style={styles.patientInfoPillText}>
                                  {test.patientName} {test.familyMemberName ? `(${test.familyMemberName})` : ''} ({test.gender?.charAt(0) || 'M'}, {test.age || 28}y)
                                </Text>
                              </View>
                            </View>
                          </View>

                          {/* Footer Action Buttons */}
                          <View style={styles.bookedActionsRow}>
                            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                              <Ionicons name="shield-checkmark" size={14} color="#00B894" style={{ marginRight: 4 }} />
                              <Text style={styles.doctorPrescText}>{test.doctorPrescription || 'Diagnostic Specialist Referral'}</Text>
                            </View>

                            <View style={styles.actionButtonsGroup}>
                              {/* Primary View Details Button */}
                              <TouchableOpacity
                                style={[styles.viewSlipBtn, { backgroundColor: '#1E3A8A', borderColor: '#1E3A8A' }]}
                                onPress={() => setViewingDetails(test)}
                                activeOpacity={0.8}
                              >
                                <Ionicons name="information-circle-outline" size={14} color="#FFFFFF" style={{ marginRight: 4 }} />
                                <Text style={[styles.viewSlipBtnText, { color: '#FFFFFF', fontWeight: '700' }]}>View Details</Text>
                              </TouchableOpacity>

                              {/* Appointment Pass */}
                              <TouchableOpacity
                                style={[styles.viewSlipBtn, { backgroundColor: '#EFF6FF', borderColor: '#BFDBFE' }]}
                                onPress={() => setViewingSlip(test)}
                                activeOpacity={0.8}
                              >
                                <Ionicons name="receipt-outline" size={14} color="#1E3A8A" style={{ marginRight: 4 }} />
                                <Text style={[styles.viewSlipBtnText, { color: '#1E3A8A' }]}>Appointment Pass</Text>
                              </TouchableOpacity>

                              {/* Directions */}
                              <TouchableOpacity
                                style={[
                                  styles.viewSlipBtn,
                                  !isHome && { backgroundColor: '#F0FDFA', borderColor: '#99F6E4' },
                                ]}
                                onPress={() => handleOpenDirections(test)}
                                activeOpacity={0.8}
                              >
                                <Ionicons
                                  name="navigate"
                                  size={14}
                                  color={!isHome ? '#0D9488' : '#1E3A8A'}
                                  style={{ marginRight: 4 }}
                                />
                                <Text
                                  style={[
                                    styles.viewSlipBtnText,
                                    !isHome && { color: '#0D9488', fontWeight: '700' },
                                  ]}
                                >
                                  Get Directions
                                </Text>
                              </TouchableOpacity>

                              {/* Reschedule */}
                              {!isCancelled && test.status !== 'Completed' && test.canReschedule && (
                                <TouchableOpacity
                                  style={styles.rescheduleBtn}
                                  onPress={() => setReschedulingTest(test)}
                                  activeOpacity={0.8}
                                >
                                  <Ionicons name="time-outline" size={14} color="#475569" style={{ marginRight: 4 }} />
                                  <Text style={styles.rescheduleBtnText}>Reschedule</Text>
                                </TouchableOpacity>
                              )}

                              {/* Cancel */}
                              {!isCancelled && test.status !== 'Completed' && test.canCancel && (
                                <TouchableOpacity
                                  style={styles.cancelBookingBtn}
                                  onPress={() => setCancellingTest(test)}
                                  activeOpacity={0.8}
                                >
                                  <Text style={styles.cancelBookingBtnText}>Cancel</Text>
                                </TouchableOpacity>
                              )}
                            </View>
                          </View>
                        </View>
                      );
                    })
                  )}

                  {sortedBookedTests.length > 0 && (
                    <PaginationBar
                      currentPage={bookedPage}
                      totalItems={sortedBookedTests.length}
                      pageSize={ITEMS_PER_PAGE}
                      onPageChange={setBookedPage}
                      itemLabel="booked tests"
                    />
                  )}
                </View>
              )}

              {/* SECTION 2: COMPLETED TEST REPORTS (RADIOLOGY & PATHOLOGY) */}
              {(viewMode === 'reports' || viewMode === 'all_appts') && (
                <View style={{ gap: 14 }}>
                  <View style={styles.sectionHeaderRow}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                      <Ionicons name="checkmark-done-circle" size={20} color="#00B894" />
                      <Text style={styles.sectionTitle}>Completed Test & Radiology Reports</Text>
                    </View>
                    <Text style={styles.sectionSubtitle}>
                      {filteredReports.length} certified diagnostic {filteredReports.length === 1 ? 'report' : 'reports'} available
                    </Text>
                  </View>

                  {filteredReports.length === 0 ? (
                    <View style={styles.emptyBookedCard}>
                      <Ionicons name="flask-outline" size={36} color="#94A3B8" />
                      <Text style={styles.emptyBookedTitle}>No test reports found</Text>
                      <Text style={styles.emptyBookedDesc}>
                        No clinical or radiology test reports match your current filter selection.
                      </Text>
                    </View>
                  ) : (
                    paginatedReports.map((report) => {
                      const isReady = report.reportAvailable;
                      const isRadiology = report.category === 'Radiology & Scans';

                      return (
                        <View key={report.id} style={styles.reportCard}>
                          {/* Top Row: Category + Availability Badge */}
                          <View style={styles.reportTopRow}>
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                              <View
                                style={[
                                  styles.categoryBadge,
                                  {
                                    backgroundColor: isRadiology ? '#E0F7FA' : '#EFF6FF',
                                    borderColor: isRadiology ? '#80DEEA' : '#BFDBFE',
                                  },
                                ]}
                              >
                                <Ionicons
                                  name={isRadiology ? 'scan-outline' : 'flask-outline'}
                                  size={13}
                                  color={isRadiology ? '#00C2CB' : '#1E3A8A'}
                                  style={{ marginRight: 4 }}
                                />
                                <Text style={[styles.categoryBadgeTitle, { color: isRadiology ? '#00838F' : '#1E3A8A' }]}>
                                  {report.category} • {report.modalityType || 'Diagnostic'}
                                </Text>
                              </View>
                              <Text style={styles.bookingRefText}>{report.id}</Text>
                            </View>

                            {isReady ? (
                              <View style={styles.readyBadge}>
                                <Ionicons name="checkmark-circle" size={13} color="#00B894" style={{ marginRight: 4 }} />
                                <Text style={styles.readyBadgeText}>Verified Report Ready</Text>
                              </View>
                            ) : (
                              <View style={styles.pendingBadge}>
                                <Ionicons name="hourglass-outline" size={13} color="#D97706" style={{ marginRight: 4 }} />
                                <Text style={styles.pendingBadgeText}>Sample In Analysis • Pending</Text>
                              </View>
                            )}
                          </View>

                          {/* Main Content */}
                          <View style={styles.reportMainContent}>
                            <View style={{ flex: 1 }}>
                              <Text style={styles.testName}>{report.testName}</Text>
                              <View style={styles.labRow}>
                                <Ionicons name="business-outline" size={14} color="#64748B" style={{ marginRight: 4 }} />
                                <Text style={styles.labName}>{report.labName}</Text>
                              </View>

                              {/* Patient & Sample Details */}
                              <View style={styles.metaRow}>
                                <View style={styles.patientTag}>
                                  <Ionicons name="person" size={12} color="#1E3A8A" style={{ marginRight: 4 }} />
                                  <Text style={styles.patientTagText}>Patient: {report.patientName}</Text>
                                </View>
                                <Text style={styles.sampleTypeText}>Modality: {report.sampleType}</Text>
                              </View>

                              {/* Clinical Impression / Notes Preview */}
                              {(report.impression || report.doctorNotes) && (
                                <View style={styles.impressionPreviewBox}>
                                  <Text style={styles.impressionLabel}>
                                    {isRadiology ? 'Radiological Impression:' : 'Pathologist Remark:'}
                                  </Text>
                                  <Text style={styles.impressionText}>{report.impression || report.doctorNotes}</Text>
                                </View>
                              )}
                            </View>

                            {/* Dates Pillar */}
                            <View style={styles.datesPillar}>
                              <View style={styles.dateItem}>
                                <Text style={styles.dateLabel}>Test Conducted:</Text>
                                <Text style={styles.dateValue}>{report.testDate}</Text>
                              </View>
                              <View style={styles.dateItem}>
                                <Text style={styles.dateLabel}>Report Issued:</Text>
                                <Text style={[styles.dateValue, isReady && { color: '#00B894', fontWeight: '800' }]}>
                                  {report.reportDate}
                                </Text>
                              </View>
                              {report.fileSize !== 'Processing' && (
                                <Text style={styles.fileSizeText}>{report.fileSize}</Text>
                              )}
                            </View>
                          </View>

                          {/* Biomarker Highlights Preview */}
                          {report.parameters && report.parameters.length > 0 && (
                            <View style={styles.parametersPreviewWrap}>
                              <Text style={styles.parametersTitle}>
                                {isRadiology ? 'Key Anatomical Findings:' : 'Biomarker Highlights:'}
                              </Text>
                              <View style={styles.parametersGrid}>
                                {report.parameters.slice(0, 4).map((p, idx) => (
                                  <View key={idx} style={styles.paramPill}>
                                    <Text style={styles.paramName}>{p.name}:</Text>
                                    <Text style={styles.paramValue}>
                                      {' '}{p.value} {p.unit}
                                    </Text>
                                  </View>
                                ))}
                                {report.parameters.length > 4 && (
                                  <Text style={styles.moreParamsText}>+{report.parameters.length - 4} more parameters</Text>
                                )}
                              </View>
                            </View>
                          )}

                          {/* Actions Row */}
                          <View style={styles.reportActionsRow}>
                            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                              <Ionicons name="shield-checkmark" size={14} color="#00B894" style={{ marginRight: 6 }} />
                              <Text style={styles.accreditationText}>NABL & AERB / ICMR Accredited Diagnostic Wing</Text>
                            </View>

                            <View style={styles.buttonsGroup}>
                              {isReady ? (
                                <>
                                  <TouchableOpacity
                                    style={styles.viewReportBtn}
                                    onPress={() => setViewingReport(report)}
                                    activeOpacity={0.8}
                                  >
                                    <Ionicons name="eye-outline" size={14} color="#1E3A8A" style={{ marginRight: 4 }} />
                                    <Text style={styles.viewReportBtnText}>
                                      {isRadiology ? 'View Report & Film' : 'View Report'}
                                    </Text>
                                  </TouchableOpacity>

                                  <TouchableOpacity
                                    style={styles.downloadReportBtn}
                                    onPress={() => handleDownloadReport(report)}
                                    activeOpacity={0.8}
                                  >
                                    <Ionicons name="cloud-download-outline" size={14} color="#FFFFFF" style={{ marginRight: 4 }} />
                                    <Text style={styles.downloadReportBtnText}>Download PDF</Text>
                                  </TouchableOpacity>
                                </>
                              ) : (
                                <View style={styles.processingIndicator}>
                                  <Ionicons name="sync" size={14} color="#D97706" style={{ marginRight: 6 }} />
                                  <Text style={styles.processingIndicatorText}>Sample In Analysis • Expected Today</Text>
                                </View>
                              )}
                            </View>
                          </View>
                        </View>
                      );
                    })
                  )}

                  {filteredReports.length > 0 && (
                    <PaginationBar
                      currentPage={reportsPage}
                      totalItems={filteredReports.length}
                      pageSize={ITEMS_PER_PAGE}
                      onPageChange={setReportsPage}
                      itemLabel="diagnostic reports"
                    />
                  )}
                </View>
              )}
            </View>
          )}
        </View>

        <WebFooter navigation={navigation} />
      </ScrollView>

      {/* =========================================================
          MODAL 1: VIEW DIAGNOSTIC & RADIOLOGY REPORT
      ========================================================= */}
      <Modal visible={Boolean(viewingReport)} transparent animationType="fade" onRequestClose={() => setViewingReport(null)}>
        <View style={styles.modalBackdrop}>
          <View style={styles.reportModalBox}>
            {/* Header */}
            <View style={styles.reportModalHeader}>
              <View>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Text style={styles.reportModalLogo}>Medi</Text>
                  <Text style={[styles.reportModalLogo, { color: '#00B894' }]}>Unify</Text>
                  <Text style={{ fontSize: 13, color: '#94A3B8' }}>• Clinical Diagnostics & Radiology</Text>
                </View>
                <Text style={styles.reportModalTitle}>{viewingReport?.testName}</Text>
                <Text style={styles.reportModalLab}>{viewingReport?.labName}</Text>
              </View>
              <TouchableOpacity onPress={() => setViewingReport(null)} style={styles.modalCloseIcon}>
                <Ionicons name="close" size={22} color="#64748B" />
              </TouchableOpacity>
            </View>

            <ScrollView style={{ maxHeight: 520 }} showsVerticalScrollIndicator={false}>
              <View style={styles.reportModalBody}>
                {/* Patient Header Box */}
                <View style={styles.patientReportCard}>
                  <View style={styles.patientCol}>
                    <Text style={styles.prLabel}>PATIENT NAME</Text>
                    <Text style={styles.prValue}>{viewingReport?.patientName}</Text>
                  </View>
                  <View style={styles.patientCol}>
                    <Text style={styles.prLabel}>TEST DATE</Text>
                    <Text style={styles.prValue}>{viewingReport?.testDate}</Text>
                  </View>
                  <View style={styles.patientCol}>
                    <Text style={styles.prLabel}>REPORT DATE</Text>
                    <Text style={styles.prValue}>{viewingReport?.reportDate}</Text>
                  </View>
                  <View style={styles.patientCol}>
                    <Text style={styles.prLabel}>MODALITY</Text>
                    <Text style={styles.prValue}>{viewingReport?.sampleType}</Text>
                  </View>
                </View>

                {/* If Radiology: Detailed Findings and Impression */}
                {viewingReport?.findings && (
                  <View style={styles.radiologySection}>
                    <Text style={styles.tableHeading}>ANATOMICAL FINDINGS & EVALUATION</Text>
                    <View style={styles.findingsBox}>
                      <Text style={styles.findingsText}>{viewingReport.findings}</Text>
                    </View>
                  </View>
                )}

                {/* Parameters Table */}
                {viewingReport?.parameters && viewingReport.parameters.length > 0 && (
                  <>
                    <Text style={styles.tableHeading}>
                      {viewingReport?.category === 'Radiology & Scans'
                        ? 'MEASURED PARAMETERS & ANATOMICAL INDICES'
                        : 'TEST PARAMETERS & BIOLOGICAL REFERENCE RANGES'}
                    </Text>
                    <View style={styles.tableWrap}>
                      <View style={styles.tableHeaderRow}>
                        <Text style={[styles.tableHCol, { flex: 2 }]}>Investigation Test</Text>
                        <Text style={[styles.tableHCol, { flex: 1.5, textAlign: 'center' }]}>Observed Result</Text>
                        <Text style={[styles.tableHCol, { flex: 1.5, textAlign: 'center' }]}>Reference Range</Text>
                        <Text style={[styles.tableHCol, { flex: 1, textAlign: 'right' }]}>Flag</Text>
                      </View>

                      {viewingReport.parameters.map((param, idx) => (
                        <View key={idx} style={[styles.tableDataRow, idx % 2 === 1 && { backgroundColor: '#F8FAFC' }]}>
                          <Text style={[styles.tableDCol, { flex: 2, fontWeight: '700', color: '#0F172A' }]}>
                            {param.name}
                          </Text>
                          <Text style={[styles.tableDCol, { flex: 1.5, textAlign: 'center', fontWeight: '800', color: '#1E3A8A' }]}>
                            {param.value} <Text style={{ fontSize: 11, fontWeight: '400', color: '#64748B' }}>{param.unit}</Text>
                          </Text>
                          <Text style={[styles.tableDCol, { flex: 1.5, textAlign: 'center', color: '#64748B' }]}>
                            {param.normalRange || '—'}
                          </Text>
                          <View style={{ flex: 1, alignItems: 'flex-end' }}>
                            <View
                              style={[
                                styles.flagBadge,
                                param.status === 'Normal' ? styles.flagNormal : styles.flagHigh,
                              ]}
                            >
                              <Text
                                style={[
                                  styles.flagBadgeText,
                                  param.status === 'Normal' ? { color: '#00B894' } : { color: '#D97706' },
                                ]}
                              >
                                {param.status || 'Normal'}
                              </Text>
                            </View>
                          </View>
                        </View>
                      ))}
                    </View>
                  </>
                )}

                {/* Impression Box */}
                {(viewingReport?.impression || viewingReport?.doctorNotes) && (
                  <View style={styles.doctorNotesBox}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
                      <Ionicons name="document-text" size={15} color="#00B894" style={{ marginRight: 6 }} />
                      <Text style={styles.notesTitle}>
                        {viewingReport?.category === 'Radiology & Scans'
                          ? 'Radiologist Impression & Summary:'
                          : 'Pathologist Clinical Remark:'}
                      </Text>
                    </View>
                    <Text style={styles.notesBody}>{viewingReport.impression || viewingReport.doctorNotes}</Text>
                  </View>
                )}

                {/* Security Seal */}
                <View style={styles.signStampRow}>
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <Ionicons name="shield-checkmark" size={18} color="#00B894" style={{ marginRight: 6 }} />
                    <Text style={styles.stampText}>
                      Digitally Verified by Chief Radiologist / Pathologist • NABL ISO 15189 Certified
                    </Text>
                  </View>
                </View>
              </View>
            </ScrollView>

            <View style={styles.modalFooter}>
              <TouchableOpacity style={styles.modalCancelBtn} onPress={() => setViewingReport(null)}>
                <Text style={styles.modalCancelBtnText}>Close</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalPrimaryBtn}
                onPress={() => {
                  handleDownloadReport(viewingReport);
                  setViewingReport(null);
                }}
              >
                <Ionicons name="download-outline" size={15} color="#FFFFFF" style={{ marginRight: 6 }} />
                <Text style={styles.modalPrimaryBtnText}>Download PDF</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* =========================================================
          MODAL 0: VIEW COMPLETE BOOKING DETAILS
      ========================================================= */}
      <Modal visible={Boolean(viewingDetails)} transparent animationType="fade" onRequestClose={() => setViewingDetails(null)}>
        <View style={styles.modalBackdrop}>
          <View style={styles.detailsModalBox}>
            {/* Modal Header */}
            <View style={styles.detailsModalHeader}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                <View
                  style={[
                    styles.detailsModalIconWrap,
                    {
                      backgroundColor:
                        getBookingTypeLabel(viewingDetails) === 'Radiology'
                          ? '#F3E8FF'
                          : getBookingTypeLabel(viewingDetails) === 'Lab Package'
                          ? '#E0F2FE'
                          : '#E6F8F4',
                    },
                  ]}
                >
                  <Ionicons
                    name={
                      getBookingTypeLabel(viewingDetails) === 'Radiology'
                        ? 'scan'
                        : getBookingTypeLabel(viewingDetails) === 'Lab Package'
                        ? 'medkit'
                        : 'flask'
                    }
                    size={22}
                    color={
                      getBookingTypeLabel(viewingDetails) === 'Radiology'
                        ? '#00C2CB'
                        : getBookingTypeLabel(viewingDetails) === 'Lab Package'
                        ? '#1E3A8A'
                        : '#00B894'
                    }
                  />
                </View>
                <View>
                  <Text style={styles.detailsModalHeading}>Booking Details & Status</Text>
                  <Text style={styles.detailsModalSub}>
                    Booking ID: <Text style={{ fontWeight: '800', color: '#1E3A8A' }}>{viewingDetails?.bookingRef || viewingDetails?.id}</Text>
                  </Text>
                </View>
              </View>

              <TouchableOpacity onPress={() => setViewingDetails(null)} style={styles.modalCloseIcon}>
                <Ionicons name="close" size={22} color="#64748B" />
              </TouchableOpacity>
            </View>

            {/* Modal Content Scroll */}
            <ScrollView style={styles.detailsModalBody} showsVerticalScrollIndicator={true}>
              {/* Hero Banner */}
              <View style={styles.detailsHeroCard}>
                <View style={styles.detailsHeroTopRow}>
                  <View
                    style={[
                      styles.serviceTypeBadge,
                      {
                        backgroundColor:
                          getBookingTypeLabel(viewingDetails) === 'Radiology'
                            ? '#E0F7FA'
                            : getBookingTypeLabel(viewingDetails) === 'Lab Package'
                            ? '#EFF6FF'
                            : '#E6F8F4',
                        borderColor:
                          getBookingTypeLabel(viewingDetails) === 'Radiology'
                            ? '#80DEEA'
                            : getBookingTypeLabel(viewingDetails) === 'Lab Package'
                            ? '#BFDBFE'
                            : '#A7F3D0',
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.serviceTypeBadgeText,
                        {
                          color:
                            getBookingTypeLabel(viewingDetails) === 'Radiology'
                              ? '#00838F'
                              : getBookingTypeLabel(viewingDetails) === 'Lab Package'
                              ? '#1E3A8A'
                              : '#00B894',
                        },
                      ]}
                    >
                      {getBookingTypeLabel(viewingDetails)}
                    </Text>
                  </View>

                  <View
                    style={[
                      styles.detailsStatusPill,
                      viewingDetails?.status === 'Cancelled' && { backgroundColor: '#FFF2ED', borderColor: '#FFD7C7' },
                    ]}
                  >
                    <View
                      style={[
                        styles.statusIndicatorDot,
                        viewingDetails?.status === 'Cancelled' && { backgroundColor: '#FF7F50' },
                      ]}
                    />
                    <Text
                      style={[
                        styles.detailsStatusText,
                        viewingDetails?.status === 'Cancelled' && { color: '#FF7F50' },
                      ]}
                    >
                      {viewingDetails?.status}
                    </Text>
                  </View>
                </View>

                <Text style={styles.detailsTestName}>{viewingDetails?.testName}</Text>
                <Text style={styles.detailsCategoryText}>
                  Category: {viewingDetails?.categoryLabel || viewingDetails?.testCategory || viewingDetails?.modality || 'Clinical Diagnostics'} • {viewingDetails?.testType || 'Centre Visit'}
                </Text>
              </View>

              {/* Patient & Family Member Grid */}
              <View style={styles.detailsSectionBox}>
                <View style={styles.detailsSectionHeaderRow}>
                  <Ionicons name="person-circle-outline" size={18} color="#1E3A8A" />
                  <Text style={styles.detailsSectionHeading}>Patient & Family Member Information</Text>
                </View>
                <View style={styles.detailsGrid2Col}>
                  <View style={styles.detailsGridCell}>
                    <Text style={styles.detailsCellLabel}>PATIENT NAME</Text>
                    <Text style={styles.detailsCellVal}>{viewingDetails?.patientName}</Text>
                  </View>
                  <View style={styles.detailsGridCell}>
                    <Text style={styles.detailsCellLabel}>BOOKED FOR</Text>
                    <Text style={[styles.detailsCellVal, { color: viewingDetails?.familyMemberName ? '#00B894' : '#0F172A' }]}>
                      {viewingDetails?.familyMemberName ? `${viewingDetails.familyMemberName} (Family Member)` : 'Primary Patient (Self)'}
                    </Text>
                  </View>
                  <View style={styles.detailsGridCell}>
                    <Text style={styles.detailsCellLabel}>AGE & GENDER</Text>
                    <Text style={styles.detailsCellVal}>
                      {viewingDetails?.age || viewingDetails?.patientAge || 28} Years • {viewingDetails?.gender || viewingDetails?.patientGender || 'Male'}
                    </Text>
                  </View>
                  <View style={styles.detailsGridCell}>
                    <Text style={styles.detailsCellLabel}>REGISTERED PHONE</Text>
                    <Text style={styles.detailsCellVal}>{viewingDetails?.contactPhone || viewingDetails?.patientPhone || '+91 98450 12345'}</Text>
                  </View>
                </View>
              </View>

              {/* Schedule & Center Details */}
              <View style={styles.detailsSectionBox}>
                <View style={styles.detailsSectionHeaderRow}>
                  <Ionicons name="calendar-outline" size={18} color="#1E3A8A" />
                  <Text style={styles.detailsSectionHeading}>Appointment & Center Details</Text>
                </View>
                <View style={styles.detailsGrid2Col}>
                  <View style={styles.detailsGridCell}>
                    <Text style={styles.detailsCellLabel}>APPOINTMENT DATE</Text>
                    <Text style={[styles.detailsCellVal, { color: '#1E3A8A', fontWeight: '800' }]}>
                      {viewingDetails?.appointmentDate || viewingDetails?.formattedDate || viewingDetails?.date}
                    </Text>
                  </View>
                  <View style={styles.detailsGridCell}>
                    <Text style={styles.detailsCellLabel}>TIME SLOT</Text>
                    <Text style={[styles.detailsCellVal, { color: '#1E3A8A', fontWeight: '800' }]}>
                      {viewingDetails?.timeSlot}
                    </Text>
                  </View>
                  <View style={[styles.detailsGridCell, { width: '100%' }]}>
                    <Text style={styles.detailsCellLabel}>LAB / HOSPITAL / CENTRE</Text>
                    <Text style={styles.detailsCellVal}>
                      {typeof viewingDetails?.centerName === 'object' ? (viewingDetails?.centerName?.name || 'Diagnostic Centre') : String(viewingDetails?.centerName || viewingDetails?.providerName || 'Diagnostic Centre')}
                    </Text>
                  </View>
                  <View style={[styles.detailsGridCell, { width: '100%' }]}>
                    <Text style={styles.detailsCellLabel}>LOCATION / ADDRESS</Text>
                    <Text style={styles.detailsCellVal}>
                      {formatAddressString(viewingDetails?.address || viewingDetails?.location || viewingDetails?.providerAddress)}
                    </Text>
                    {viewingDetails?.testType !== 'Home Sample Collection' && (
                      <TouchableOpacity
                        style={styles.detailsDirectionsBtn}
                        onPress={() => handleOpenDirections(viewingDetails)}
                        activeOpacity={0.8}
                      >
                        <Ionicons name="navigate" size={14} color="#FFFFFF" style={{ marginRight: 6 }} />
                        <Text style={styles.detailsDirectionsBtnText}>Get Directions in Google Maps</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
              </View>

              {/* Billing & Payment Details */}
              <View style={styles.detailsSectionBox}>
                <View style={styles.detailsSectionHeaderRow}>
                  <Ionicons name="card-outline" size={18} color="#1E3A8A" />
                  <Text style={styles.detailsSectionHeading}>Payment & Booking Identification</Text>
                </View>
                <View style={styles.detailsGrid2Col}>
                  <View style={styles.detailsGridCell}>
                    <Text style={styles.detailsCellLabel}>BOOKING ID / REF</Text>
                    <Text style={[styles.detailsCellVal, { fontFamily: 'monospace', fontWeight: '800', color: '#1E3A8A' }]}>
                      {viewingDetails?.bookingRef || viewingDetails?.id}
                    </Text>
                  </View>
                  <View style={styles.detailsGridCell}>
                    <Text style={styles.detailsCellLabel}>BOOKING DATE</Text>
                    <Text style={styles.detailsCellVal}>{viewingDetails?.bookingDate || '28 Sep 2026'}</Text>
                  </View>
                  <View style={styles.detailsGridCell}>
                    <Text style={styles.detailsCellLabel}>TOTAL PRICE</Text>
                    <Text style={[styles.detailsCellVal, { fontSize: 16, fontWeight: '900', color: '#0F172A' }]}>
                      ₹{viewingDetails?.price || viewingDetails?.paidAmount || 0}
                    </Text>
                  </View>
                  <View style={styles.detailsGridCell}>
                    <Text style={styles.detailsCellLabel}>PAYMENT STATUS</Text>
                    <Text style={[styles.detailsCellVal, { color: '#00B894', fontWeight: '800' }]}>
                      {viewingDetails?.paymentStatus}
                    </Text>
                  </View>
                </View>
              </View>

              {/* Specific Clinical Instructions (Service specific: Lab vs Radiology) */}
              <View style={[styles.detailsSectionBox, { backgroundColor: getBookingTypeLabel(viewingDetails) === 'Radiology' ? '#E0F7FA' : '#F0FDF4' }]}>
                <View style={styles.detailsSectionHeaderRow}>
                  <Ionicons
                    name={getBookingTypeLabel(viewingDetails) === 'Radiology' ? 'medkit-outline' : 'flask-outline'}
                    size={18}
                    color={getBookingTypeLabel(viewingDetails) === 'Radiology' ? '#00C2CB' : '#00B894'}
                  />
                  <Text
                    style={[
                      styles.detailsSectionHeading,
                      { color: getBookingTypeLabel(viewingDetails) === 'Radiology' ? '#00838F' : '#166534' },
                    ]}
                  >
                    {getBookingTypeLabel(viewingDetails) === 'Radiology' ? 'Radiology Scan Instructions' : 'Pathology Collection Guidelines'}
                  </Text>
                </View>

                {getBookingTypeLabel(viewingDetails) === 'Radiology' ? (
                  <View style={{ gap: 6 }}>
                    <Text style={styles.detailsPrepText}>
                      • <Text style={{ fontWeight: '700' }}>Preparation:</Text> {viewingDetails?.instructions || 'Wear comfortable loose clothing without metal fasteners or jewelry.'}
                    </Text>
                    <Text style={styles.detailsPrepText}>
                      • <Text style={{ fontWeight: '700' }}>Scan Facility:</Text> Report to the Radiology Reception at {typeof viewingDetails?.centerName === 'object' ? viewingDetails?.centerName?.name : String(viewingDetails?.centerName || viewingDetails?.providerName || 'Radiology Diagnostic Centre')} 15 minutes before slot time.
                    </Text>
                    <Text style={styles.detailsPrepText}>
                      • <Text style={{ fontWeight: '700' }}>Prescription:</Text> {viewingDetails?.doctorPrescription || 'Carry doctor referral note and any past imaging films/CDs.'}
                    </Text>
                  </View>
                ) : (
                  <View style={{ gap: 6 }}>
                    <Text style={styles.detailsPrepText}>
                      • <Text style={{ fontWeight: '700' }}>Collection Mode:</Text> {viewingDetails?.testType === 'Home Sample Collection' ? 'Home Sample Collection (Phlebotomist Visit)' : 'Diagnostic Centre Visit'}
                    </Text>
                    <Text style={styles.detailsPrepText}>
                      • <Text style={{ fontWeight: '700' }}>Fasting Instructions:</Text> {viewingDetails?.instructions || 'Fasting of 10-12 hours required prior to sample collection. Water is permitted.'}
                    </Text>
                    {viewingDetails?.phlebotomist && (
                      <Text style={styles.detailsPrepText}>
                        • <Text style={{ fontWeight: '700' }}>Assigned Phlebotomist:</Text> {viewingDetails.phlebotomist.name} ({viewingDetails.phlebotomist.phone}) • Vehicle: {viewingDetails.phlebotomist.vehicle} (ETA: {viewingDetails.phlebotomist.eta})
                      </Text>
                    )}
                    <Text style={styles.detailsPrepText}>
                      • <Text style={{ fontWeight: '700' }}>Referral Slip:</Text> {viewingDetails?.doctorPrescription || 'Diagnostic Laboratory Screening Referral'}
                    </Text>
                  </View>
                )}
              </View>
            </ScrollView>

            {/* Modal Footer Actions */}
            <View style={styles.detailsModalFooter}>
              <TouchableOpacity
                style={styles.detailsSecondaryBtn}
                onPress={() => {
                  const item = viewingDetails;
                  setViewingDetails(null);
                  setViewingSlip(item);
                }}
              >
                <Ionicons name="receipt-outline" size={15} color="#1E3A8A" style={{ marginRight: 4 }} />
                <Text style={styles.detailsSecondaryBtnText}>Appointment Pass</Text>
              </TouchableOpacity>

              {viewingDetails?.status !== 'Cancelled' && viewingDetails?.status !== 'Completed' && viewingDetails?.canReschedule && (
                <TouchableOpacity
                  style={styles.detailsRescheduleBtn}
                  onPress={() => {
                    const item = viewingDetails;
                    setViewingDetails(null);
                    setReschedulingTest(item);
                  }}
                >
                  <Ionicons name="time-outline" size={15} color="#475569" style={{ marginRight: 4 }} />
                  <Text style={styles.detailsRescheduleBtnText}>Reschedule</Text>
                </TouchableOpacity>
              )}

              {viewingDetails?.status !== 'Cancelled' && viewingDetails?.status !== 'Completed' && viewingDetails?.canCancel && (
                <TouchableOpacity
                  style={styles.detailsCancelBtn}
                  onPress={() => {
                    const item = viewingDetails;
                    setViewingDetails(null);
                    setCancellingTest(item);
                  }}
                >
                  <Text style={styles.detailsCancelBtnText}>Cancel</Text>
                </TouchableOpacity>
              )}

              <TouchableOpacity style={styles.modalCancelBtn} onPress={() => setViewingDetails(null)}>
                <Text style={styles.modalCancelBtnText}>Close</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* =========================================================
          MODAL 2: VIEW BOOKING SLIP & QR PASS
      ========================================================= */}
      <Modal visible={Boolean(viewingSlip)} transparent animationType="fade" onRequestClose={() => setViewingSlip(null)}>
        <View style={styles.modalBackdrop}>
          <View style={styles.slipModalBox}>
            <View style={styles.slipHeader}>
              <View>
                <Text style={styles.slipBadge}>OFFICIAL BOOKING PASS</Text>
                <Text style={styles.slipTitle}>{viewingSlip?.testName}</Text>
                <Text style={styles.slipSub}>
                  {typeof viewingSlip?.centerName === 'object' ? (viewingSlip.centerName?.name || 'Diagnostic Centre') : String(viewingSlip?.centerName || '')}
                </Text>
              </View>
              <TouchableOpacity onPress={() => setViewingSlip(null)} style={styles.modalCloseIcon}>
                <Ionicons name="close" size={20} color="#64748B" />
              </TouchableOpacity>
            </View>

            <View style={styles.slipBody}>
              {/* QR Code graphic */}
              <View style={styles.qrContainer}>
                <View style={styles.qrMockBox}>
                  <Ionicons name="qr-code" size={120} color="#0F172A" />
                </View>
                <Text style={styles.qrCodeText}>SCAN FOR EXPRESS CENTRE CHECK-IN</Text>
                <Text style={styles.qrRefText}>{viewingSlip?.bookingRef}</Text>
              </View>

              {/* Booking Details Grid */}
              <View style={styles.slipGrid}>
                <View style={styles.slipGridItem}>
                  <Text style={styles.slipGridLabel}>PATIENT</Text>
                  <Text style={styles.slipGridVal}>{viewingSlip?.patientName}</Text>
                </View>
                <View style={styles.slipGridItem}>
                  <Text style={styles.slipGridLabel}>APPOINTMENT DATE</Text>
                  <Text style={styles.slipGridVal}>{viewingSlip?.appointmentDate}</Text>
                </View>
                <View style={styles.slipGridItem}>
                  <Text style={styles.slipGridLabel}>TIME SLOT</Text>
                  <Text style={styles.slipGridVal}>{viewingSlip?.timeSlot}</Text>
                </View>
                <View style={styles.slipGridItem}>
                  <Text style={styles.slipGridLabel}>PAYMENT STATUS</Text>
                  <Text style={[styles.slipGridVal, { color: '#00B894' }]}>{viewingSlip?.paymentStatus}</Text>
                </View>
              </View>

              {/* Instructions */}
              <View style={styles.slipNotice}>
                <Ionicons name="information-circle" size={15} color="#1E3A8A" style={{ marginRight: 6 }} />
                <Text style={styles.slipNoticeText}>
                  Please arrive 15 minutes before your slot. Present this QR pass at the MediUnify reception desk.
                </Text>
              </View>

              {viewingSlip?.testType !== 'Home Sample Collection' && (
                <TouchableOpacity
                  style={styles.detailsDirectionsBtn}
                  onPress={() => handleOpenDirections(viewingSlip)}
                  activeOpacity={0.8}
                >
                  <Ionicons name="navigate" size={14} color="#FFFFFF" style={{ marginRight: 6 }} />
                  <Text style={styles.detailsDirectionsBtnText}>Get Location Directions to Lab</Text>
                </TouchableOpacity>
              )}
            </View>

            <View style={styles.modalFooter}>
              <TouchableOpacity style={styles.modalCancelBtn} onPress={() => setViewingSlip(null)}>
                <Text style={styles.modalCancelBtnText}>Close</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalPrimaryBtn}
                onPress={() => {
                  showToast(`Booking pass saved to device downloads.`);
                  setViewingSlip(null);
                }}
              >
                <Ionicons name="arrow-down-circle" size={15} color="#FFFFFF" style={{ marginRight: 6 }} />
                <Text style={styles.modalPrimaryBtnText}>Save Pass (PDF)</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* =========================================================
          MODAL 3: RESCHEDULE TEST SLOT
      ========================================================= */}
      <Modal visible={Boolean(reschedulingTest)} transparent animationType="fade" onRequestClose={() => setReschedulingTest(null)}>
        <View style={styles.modalBackdrop}>
          <View style={styles.rescheduleModalBox}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>Reschedule Test Slot</Text>
                <Text style={styles.modalSubtitle}>{reschedulingTest?.testName}</Text>
              </View>
              <TouchableOpacity onPress={() => setReschedulingTest(null)} style={styles.modalCloseIcon}>
                <Ionicons name="close" size={20} color="#64748B" />
              </TouchableOpacity>
            </View>

            <View style={{ padding: 20 }}>
              <Text style={styles.rescheduleSectionTitle}>SELECT NEW DATE:</Text>
              <View style={{ gap: 8, marginBottom: 16 }}>
                {RESCHEDULE_DATES.map((d) => (
                  <TouchableOpacity
                    key={d}
                    style={[styles.rescheduleOption, selectedRescheduleDate === d && styles.rescheduleOptionActive]}
                    onPress={() => setSelectedRescheduleDate(d)}
                  >
                    <Ionicons
                      name={selectedRescheduleDate === d ? 'radio-button-on' : 'radio-button-off'}
                      size={17}
                      color={selectedRescheduleDate === d ? '#00B894' : '#64748B'}
                      style={{ marginRight: 8 }}
                    />
                    <Text style={[styles.rescheduleOptionText, selectedRescheduleDate === d && { fontWeight: '700', color: '#0F172A' }]}>
                      {d}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.rescheduleSectionTitle}>SELECT TIME SLOT:</Text>
              <View style={{ gap: 8, marginBottom: 14 }}>
                {RESCHEDULE_SLOTS.map((s) => (
                  <TouchableOpacity
                    key={s}
                    style={[styles.rescheduleOption, selectedRescheduleSlot === s && styles.rescheduleOptionActive]}
                    onPress={() => setSelectedRescheduleSlot(s)}
                  >
                    <Ionicons
                      name={selectedRescheduleSlot === s ? 'radio-button-on' : 'radio-button-off'}
                      size={17}
                      color={selectedRescheduleSlot === s ? '#00B894' : '#64748B'}
                      style={{ marginRight: 8 }}
                    />
                    <Text style={[styles.rescheduleOptionText, selectedRescheduleSlot === s && { fontWeight: '700', color: '#0F172A' }]}>
                      {s}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.modalFooter}>
              <TouchableOpacity style={styles.modalCancelBtn} onPress={() => setReschedulingTest(null)}>
                <Text style={styles.modalCancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalPrimaryBtn} onPress={handleConfirmReschedule}>
                <Ionicons name="checkmark" size={15} color="#FFFFFF" style={{ marginRight: 6 }} />
                <Text style={styles.modalPrimaryBtnText}>Confirm Slot</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* =========================================================
          MODAL 4: CANCEL TEST BOOKING
      ========================================================= */}
      <Modal visible={Boolean(cancellingTest)} transparent animationType="fade" onRequestClose={() => setCancellingTest(null)}>
        <View style={styles.modalBackdrop}>
          <View style={styles.cancelModalBox}>
            <View style={{ alignItems: 'center', marginBottom: 16 }}>
              <View style={styles.alertCircle}>
                <Ionicons name="warning-outline" size={36} color="#FF7F50" />
              </View>
              <Text style={styles.cancelModalTitle}>Cancel Test Booking?</Text>
              <Text style={styles.cancelModalSubtitle}>
                Are you sure you want to cancel {cancellingTest?.testName}?
              </Text>
            </View>

            <View style={styles.refundNoticeBox}>
              <Ionicons name="cash-outline" size={16} color="#00B894" style={{ marginRight: 8 }} />
              <Text style={styles.refundNoticeText}>
                Full refund of ₹{cancellingTest?.price} will be credited to your original payment method within 2-4 business hours.
              </Text>
            </View>

            <View style={styles.modalFooter}>
              <TouchableOpacity style={styles.modalCancelBtn} onPress={() => setCancellingTest(null)}>
                <Text style={styles.modalCancelBtnText}>Keep Booking</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalPrimaryBtn, { backgroundColor: '#FF7F50' }]}
                onPress={handleConfirmCancel}
              >
                <Text style={styles.modalPrimaryBtnText}>Yes, Cancel Booking</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* =========================================================
          MODAL 5: ADD REAL FAMILY MEMBER
      ========================================================= */}
      <Modal visible={isAddMemberModalOpen} transparent animationType="fade" onRequestClose={() => setIsAddMemberModalOpen(false)}>
        <View style={styles.modalBackdrop}>
          <View style={styles.rescheduleModalBox}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>Add Family Member</Text>
                <Text style={styles.modalSubtitle}>Link your real family dependent for tests, scans, and reports</Text>
              </View>
              <TouchableOpacity onPress={() => setIsAddMemberModalOpen(false)} style={styles.modalCloseIcon}>
                <Ionicons name="close" size={20} color="#64748B" />
              </TouchableOpacity>
            </View>

            <View style={[styles.modalBody, { gap: 14 }]}>
              <View>
                <Text style={styles.slotLabel}>Full Legal Name *</Text>
                <TextInput
                  style={styles.modalInputText}
                  placeholder="e.g. Kavitha, Suresh, Aryan..."
                  placeholderTextColor="#94A3B8"
                  value={newMemberName}
                  onChangeText={setNewMemberName}
                />
              </View>

              <View>
                <Text style={styles.slotLabel}>Relationship *</Text>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                  {FAMILY_RELATIONS.map((rel) => {
                    const isSel = newMemberRelation === rel;
                    return (
                      <TouchableOpacity
                        key={rel}
                        style={[styles.relationPill, isSel && styles.relationPillActive]}
                        onPress={() => setNewMemberRelation(rel)}
                      >
                        <Text style={[styles.relationPillText, isSel && styles.relationPillTextActive]}>{rel}</Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>

              <View style={{ flexDirection: 'row', gap: 12 }}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.slotLabel}>Age (Years)</Text>
                  <TextInput
                    style={styles.modalInputText}
                    placeholder="e.g. 32"
                    placeholderTextColor="#94A3B8"
                    keyboardType="numeric"
                    value={newMemberAge}
                    onChangeText={setNewMemberAge}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.slotLabel}>Gender</Text>
                  <View style={{ flexDirection: 'row', gap: 6, marginTop: 4 }}>
                    {['Female', 'Male', 'Other'].map((g) => (
                      <TouchableOpacity
                        key={g}
                        style={[styles.genderMiniBtn, newMemberGender === g && styles.genderMiniBtnActive]}
                        onPress={() => setNewMemberGender(g)}
                      >
                        <Text style={[styles.genderMiniText, newMemberGender === g && styles.genderMiniTextActive]}>{g}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              </View>

              <View>
                <Text style={styles.slotLabel}>Phone Number (Optional)</Text>
                <TextInput
                  style={styles.modalInputText}
                  placeholder="+91 98XXX XXXXX"
                  placeholderTextColor="#94A3B8"
                  keyboardType="phone-pad"
                  value={newMemberPhone}
                  onChangeText={setNewMemberPhone}
                />
              </View>
            </View>

            <View style={styles.modalFooter}>
              <TouchableOpacity style={styles.modalCancelBtn} onPress={() => setIsAddMemberModalOpen(false)}>
                <Text style={styles.modalCancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalPrimaryBtn} onPress={handleSaveFamilyMember}>
                <Text style={styles.modalPrimaryBtnText}>Save Family Member</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

export default MyTestsScreenWeb;

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
    color: '#0F172A',
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
  labBadgePill: {
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
  bookTestBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#00B894',
    paddingHorizontal: 18,
    paddingVertical: 11,
    borderRadius: 10,
    boxShadow: '0 4px 14px rgba(0, 184, 148, 0.4)',
  },
  bookTestBtnText: {
    color: '#FFFFFF',
    fontSize: 13.5,
    fontWeight: '800',
  },
  // View Mode Switcher
  viewModeSwitcher: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 6,
    marginBottom: 16,
    gap: 8,
    flexWrap: 'wrap',
  },
  viewModeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  viewModeBtnActive: {
    backgroundColor: '#1E3A8A',
    borderColor: '#1E3A8A',
  },
  viewModeBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#334155',
  },
  viewModeBtnTextActive: {
    color: '#FFFFFF',
  },
  viewModeBadge: {
    marginLeft: 8,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
    backgroundColor: '#E2E8F0',
  },
  viewModeBadgeActive: {
    backgroundColor: '#3B82F6',
  },
  viewModeBadgeText: {
    fontSize: 11.5,
    fontWeight: '800',
    color: '#475569',
  },
  viewModeBadgeTextActive: {
    color: '#FFFFFF',
  },
  // Family Filter Card Styles
  familyFilterCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 16,
    marginBottom: 16,
    boxShadow: '0 2px 8px rgba(15,23,42,0.04)',
  },
  familyFilterHeader: {
    marginBottom: 12,
  },
  familyFilterTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0F172A',
  },
  familyFilterSubtitle: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  familyPillsRow: {
    flexDirection: 'row',
    gap: 10,
    paddingBottom: 4,
  },
  familyPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 24,
    backgroundColor: '#F8FAFC',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
  },
  familyPillActive: {
    backgroundColor: '#00B894',
    borderColor: '#00B894',
  },
  familyAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  familyAvatarActive: {
    backgroundColor: 'rgba(255,255,255,0.25)',
  },
  familyAvatarInitial: {
    fontSize: 12,
    fontWeight: '800',
    color: '#1E3A8A',
  },
  familyPillText: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#1E293B',
  },
  familyPillTextActive: {
    color: '#FFFFFF',
  },
  familyPillSubtext: {
    fontSize: 11,
    color: '#64748B',
  },
  // Secondary Controls Card
  secondaryControlsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 14,
    marginBottom: 20,
    gap: 12,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 12,
    height: 40,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    color: '#0F172A',
    outlineStyle: 'none',
  },
  smallFilterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  smallFilterChipActive: {
    backgroundColor: '#1E3A8A',
    borderColor: '#1E3A8A',
  },
  smallSortChipActive: {
    backgroundColor: '#0369A1',
    borderColor: '#0369A1',
  },
  smallFilterChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#475569',
  },
  smallFilterChipTextActive: {
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
  // Section Headers
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 4,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#0F172A',
  },
  sectionSubtitle: {
    fontSize: 12.5,
    color: '#64748B',
  },
  countBadgePill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
    borderWidth: 1,
  },
  countBadgePillText: {
    fontSize: 11,
    fontWeight: '700',
  },
  pulseDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#00B894',
  },
  // Empty Booked Card
  emptyBookedCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyBookedTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
    marginTop: 8,
    marginBottom: 4,
  },
  emptyBookedDesc: {
    fontSize: 12.5,
    color: '#64748B',
    textAlign: 'center',
    maxWidth: 420,
  },
  // Booked Test Card
  bookedCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 18,
    boxShadow: '0 2px 12px rgba(15,23,42,0.05)',
  },
  bookedTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    marginBottom: 12,
  },
  modalityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
  },
  modalityBadgeText: {
    fontSize: 11.5,
    fontWeight: '700',
  },
  bookingRefText: {
    fontSize: 11.5,
    fontFamily: 'monospace',
    color: '#64748B',
  },
  liveStatusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0FDF4',
    borderWidth: 1,
    borderColor: '#BBF7D0',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
    gap: 5,
  },
  liveStatusCancelled: {
    backgroundColor: '#FFF2ED',
    borderColor: '#FFD7C7',
  },
  statusIndicatorDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#00B894',
  },
  liveStatusText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#00B894',
  },
  bookedMainRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: 16,
    marginBottom: 14,
  },
  bookedTestName: {
    fontSize: 16.5,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 4,
  },
  centreRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  centreNameText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1E3A8A',
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    flexWrap: 'wrap',
    gap: 6,
  },
  locationText: {
    fontSize: 12,
    color: '#64748B',
  },
  inlineGetDirectionsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0FDFA',
    borderWidth: 1,
    borderColor: '#99F6E4',
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 6,
    marginLeft: 6,
  },
  inlineGetDirectionsBtnText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#0D9488',
  },
  detailsDirectionsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0D9488',
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 8,
    marginTop: 8,
  },
  detailsDirectionsBtnText: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  prepNoticeBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFBEB',
    borderWidth: 1,
    borderColor: '#FDE68A',
    borderRadius: 6,
    padding: 8,
    marginTop: 4,
  },
  prepNoticeText: {
    fontSize: 12,
    color: '#92400E',
    fontWeight: '500',
    flex: 1,
  },
  phlebotomistBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0FDF4',
    borderWidth: 1,
    borderColor: '#BBF7D0',
    borderRadius: 8,
    padding: 10,
    marginTop: 8,
    gap: 10,
  },
  phlebAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#E6F8F4',
    alignItems: 'center',
    justifyContent: 'center',
  },
  phlebTitle: {
    fontSize: 12.5,
    color: '#0F172A',
  },
  phlebEta: {
    fontSize: 11.5,
    color: '#00B894',
    fontWeight: '600',
  },
  callPhlebBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#00B894',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
  },
  callPhlebBtnText: {
    color: '#FFFFFF',
    fontSize: 11.5,
    fontWeight: '700',
  },
  bookedScheduleBox: {
    alignItems: 'flex-end',
    gap: 6,
  },
  slotCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 12,
    paddingVertical: 8,
    alignItems: 'flex-end',
  },
  slotDateLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: '#64748B',
    letterSpacing: 0.5,
  },
  slotDateText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0F172A',
  },
  slotTimeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1E3A8A',
  },
  pricePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  priceAmount: {
    fontSize: 15,
    fontWeight: '900',
    color: '#0F172A',
  },
  paymentStatusText: {
    fontSize: 11.5,
    fontWeight: '600',
    color: '#00B894',
  },
  patientInfoPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  patientInfoPillText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#1E40AF',
  },
  bookedActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    flexWrap: 'wrap',
    gap: 10,
  },
  doctorPrescText: {
    fontSize: 12,
    color: '#64748B',
  },
  actionButtonsGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  viewSlipBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#BFDBFE',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  viewSlipBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1E3A8A',
  },
  rescheduleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  rescheduleBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#475569',
  },
  cancelBookingBtn: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: '#FFF2ED',
    borderWidth: 1,
    borderColor: '#FFD8CC',
  },
  cancelBookingBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FF7F50',
  },
  // Completed Report Card
  reportCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 18,
    boxShadow: '0 2px 10px rgba(15,23,42,0.04)',
  },
  reportTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    marginBottom: 12,
  },
  categoryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
  },
  categoryBadgeTitle: {
    fontSize: 11.5,
    fontWeight: '700',
  },
  readyBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0FDF4',
    borderWidth: 1,
    borderColor: '#BBF7D0',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  readyBadgeText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#00B894',
  },
  pendingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFBEB',
    borderWidth: 1,
    borderColor: '#FDE68A',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  pendingBadgeText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#D97706',
  },
  reportMainContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: 16,
    marginBottom: 12,
  },
  testName: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 4,
  },
  labRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  labName: {
    fontSize: 13,
    fontWeight: '600',
    color: '#475569',
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flexWrap: 'wrap',
    marginBottom: 6,
  },
  patientTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  patientTagText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#1E3A8A',
  },
  sampleTypeText: {
    fontSize: 12,
    color: '#64748B',
  },
  impressionPreviewBox: {
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 10,
    marginTop: 6,
  },
  impressionLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: '#334155',
    textTransform: 'uppercase',
    marginBottom: 2,
  },
  impressionText: {
    fontSize: 12.5,
    color: '#0F172A',
    lineHeight: 18,
    fontWeight: '500',
  },
  datesPillar: {
    alignItems: 'flex-end',
    gap: 4,
  },
  dateItem: {
    flexDirection: 'row',
    gap: 4,
  },
  dateLabel: {
    fontSize: 12,
    color: '#64748B',
  },
  dateValue: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0F172A',
  },
  fileSizeText: {
    fontSize: 11.5,
    color: '#64748B',
    marginTop: 4,
  },
  parametersPreviewWrap: {
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
    padding: 10,
    marginBottom: 12,
  },
  parametersTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: '#475569',
    textTransform: 'uppercase',
    marginBottom: 6,
  },
  parametersGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    alignItems: 'center',
  },
  paramPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  paramName: {
    fontSize: 11.5,
    fontWeight: '600',
    color: '#475569',
  },
  paramValue: {
    fontSize: 11.5,
    fontWeight: '800',
    color: '#0F172A',
  },
  moreParamsText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#00B894',
  },
  reportActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    flexWrap: 'wrap',
    gap: 10,
  },
  accreditationText: {
    fontSize: 11.5,
    color: '#64748B',
  },
  buttonsGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  viewReportBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#BFDBFE',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 6,
  },
  viewReportBtnText: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#1E3A8A',
  },
  downloadReportBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#00B894',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 6,
  },
  downloadReportBtnText: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  processingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFBEB',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
  },
  processingIndicatorText: {
    fontSize: 12,
    color: '#D97706',
    fontWeight: '600',
  },
  // Modal Common Styles
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  reportModalBox: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    width: '100%',
    maxWidth: 720,
    boxShadow: '0 25px 50px rgba(0,0,0,0.25)',
    overflow: 'hidden',
  },
  reportModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    backgroundColor: '#F8FAFC',
  },
  reportModalLogo: {
    fontSize: 15,
    fontWeight: '900',
    color: '#1E3A8A',
  },
  reportModalTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#0F172A',
    marginTop: 2,
  },
  reportModalLab: {
    fontSize: 12,
    color: '#64748B',
  },
  modalCloseIcon: {
    padding: 4,
  },
  reportModalBody: {
    padding: 20,
  },
  patientReportCard: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 12,
    marginBottom: 16,
    gap: 12,
  },
  patientCol: {
    minWidth: 120,
  },
  prLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: '#64748B',
    marginBottom: 2,
  },
  prValue: {
    fontSize: 12.5,
    fontWeight: '700',
    color: '#0F172A',
  },
  radiologySection: {
    marginBottom: 16,
  },
  findingsBox: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 8,
    padding: 12,
  },
  findingsText: {
    fontSize: 13,
    color: '#334155',
    lineHeight: 20,
  },
  tableHeading: {
    fontSize: 11,
    fontWeight: '800',
    color: '#1E3A8A',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  tableWrap: {
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 8,
    overflow: 'hidden',
    marginBottom: 16,
  },
  tableHeaderRow: {
    flexDirection: 'row',
    backgroundColor: '#F1F5F9',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#CBD5E1',
  },
  tableHCol: {
    fontSize: 11.5,
    fontWeight: '800',
    color: '#475569',
  },
  tableDataRow: {
    flexDirection: 'row',
    paddingVertical: 9,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    alignItems: 'center',
  },
  tableDCol: {
    fontSize: 12.5,
  },
  flagBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
  },
  flagNormal: {
    backgroundColor: '#F0FDF4',
  },
  flagHigh: {
    backgroundColor: '#FEF3C7',
  },
  flagBadgeText: {
    fontSize: 11,
    fontWeight: '800',
  },
  doctorNotesBox: {
    backgroundColor: '#F0FDF4',
    borderWidth: 1,
    borderColor: '#BBF7D0',
    borderRadius: 8,
    padding: 12,
    marginBottom: 14,
  },
  notesTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: '#065F46',
  },
  notesBody: {
    fontSize: 12.5,
    color: '#065F46',
    lineHeight: 18,
    fontWeight: '500',
  },
  signStampRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 8,
  },
  stampText: {
    fontSize: 11,
    color: '#00B894',
    fontWeight: '700',
  },
  modalFooter: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
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
  // Slip Modal Box
  slipModalBox: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    width: '100%',
    maxWidth: 480,
    boxShadow: '0 25px 50px rgba(0,0,0,0.25)',
    overflow: 'hidden',
  },
  slipHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    backgroundColor: '#F8FAFC',
  },
  slipBadge: {
    fontSize: 10,
    fontWeight: '900',
    color: '#00B894',
    letterSpacing: 0.5,
  },
  slipTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
    marginTop: 2,
  },
  slipSub: {
    fontSize: 12,
    color: '#64748B',
  },
  slipBody: {
    padding: 20,
    alignItems: 'center',
  },
  qrContainer: {
    alignItems: 'center',
    marginBottom: 18,
  },
  qrMockBox: {
    padding: 12,
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#0F172A',
    borderRadius: 12,
    marginBottom: 8,
  },
  qrCodeText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#1E3A8A',
    letterSpacing: 0.5,
  },
  qrRefText: {
    fontSize: 13,
    fontFamily: 'monospace',
    fontWeight: '700',
    color: '#64748B',
    marginTop: 2,
  },
  slipGrid: {
    width: '100%',
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 12,
    gap: 8,
    marginBottom: 14,
  },
  slipGridItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  slipGridLabel: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '700',
  },
  slipGridVal: {
    fontSize: 12,
    fontWeight: '800',
    color: '#0F172A',
  },
  slipNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EFF6FF',
    borderRadius: 6,
    padding: 10,
  },
  slipNoticeText: {
    fontSize: 11.5,
    color: '#1E40AF',
    flex: 1,
  },
  // Reschedule & Cancel Modals
  rescheduleModalBox: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    width: '100%',
    maxWidth: 500,
    overflow: 'hidden',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    backgroundColor: '#F8FAFC',
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#0F172A',
  },
  modalSubtitle: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  rescheduleSectionTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: '#475569',
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  rescheduleOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    backgroundColor: '#F8FAFC',
  },
  rescheduleOptionActive: {
    borderColor: '#00B894',
    backgroundColor: '#F0FDF4',
  },
  rescheduleOptionText: {
    fontSize: 13,
    color: '#334155',
  },
  cancelModalBox: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    width: '100%',
    maxWidth: 440,
    padding: 20,
  },
  alertCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#FFF2ED',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  cancelModalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
  },
  cancelModalSubtitle: {
    fontSize: 13,
    color: '#64748B',
    textAlign: 'center',
    marginTop: 4,
  },
  refundNoticeBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0FDF4',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#BBF7D0',
    padding: 12,
    marginBottom: 20,
  },
  refundNoticeText: {
    fontSize: 12,
    color: '#065F46',
    flex: 1,
  },
  addMemberPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: '#A7F3D0',
    backgroundColor: '#F0FDF4',
  },
  addMemberPillText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#059669',
  },
  modalInputText: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 13.5,
    color: '#0F172A',
    marginTop: 6,
  },
  relationPill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    backgroundColor: '#F8FAFC',
  },
  relationPillActive: {
    borderColor: '#00B894',
    backgroundColor: '#E6F8F4',
  },
  relationPillText: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '600',
  },
  relationPillTextActive: {
    color: '#00B894',
    fontWeight: '700',
  },
  genderMiniBtn: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    backgroundColor: '#F8FAFC',
    alignItems: 'center',
  },
  genderMiniBtnActive: {
    borderColor: '#00B894',
    backgroundColor: '#E6F8F4',
  },
  genderMiniText: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '600',
  },
  genderMiniTextActive: {
    color: '#00B894',
    fontWeight: '700',
  },
  testCategorySubText: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '600',
    marginTop: 2,
    marginBottom: 6,
  },
  detailsModalBox: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    width: '100%',
    maxWidth: 680,
    maxHeight: '90%',
    boxShadow: '0 25px 50px rgba(0,0,0,0.25)',
    overflow: 'hidden',
    flexDirection: 'column',
  },
  detailsModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 22,
    paddingVertical: 18,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    backgroundColor: '#F8FAFC',
  },
  detailsModalIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  detailsModalHeading: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
  },
  detailsModalSub: {
    fontSize: 13,
    color: '#64748B',
    marginTop: 2,
  },
  detailsModalBody: {
    padding: 22,
  },
  detailsHeroCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 16,
    marginBottom: 16,
  },
  detailsHeroTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
    flexWrap: 'wrap',
    gap: 8,
  },
  serviceTypeBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
  },
  serviceTypeBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  detailsStatusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#DCFCE7',
    borderWidth: 1,
    borderColor: '#86EFAC',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  detailsStatusText: {
    fontSize: 11.5,
    fontWeight: '800',
    color: '#15803D',
  },
  detailsTestName: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 4,
  },
  detailsCategoryText: {
    fontSize: 12.5,
    color: '#64748B',
    fontWeight: '500',
  },
  detailsSectionBox: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 14,
    marginBottom: 14,
  },
  detailsSectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    paddingBottom: 8,
  },
  detailsSectionHeading: {
    fontSize: 12.5,
    fontWeight: '800',
    color: '#1E3A8A',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  detailsGrid2Col: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  detailsGridCell: {
    width: '48%',
    minWidth: 180,
  },
  detailsCellLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: '#94A3B8',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  detailsCellVal: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
  },
  detailsPrepText: {
    fontSize: 12.5,
    lineHeight: 18,
    color: '#334155',
  },
  detailsModalFooter: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 10,
    paddingHorizontal: 22,
    paddingVertical: 14,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    backgroundColor: '#F8FAFC',
  },
  detailsSecondaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#BFDBFE',
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 8,
  },
  detailsSecondaryBtnText: {
    color: '#1E3A8A',
    fontSize: 12.5,
    fontWeight: '700',
  },
  detailsRescheduleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 8,
  },
  detailsRescheduleBtnText: {
    color: '#334155',
    fontSize: 12.5,
    fontWeight: '700',
  },
  detailsCancelBtn: {
    backgroundColor: '#FFF2ED',
    borderWidth: 1,
    borderColor: '#FFD7C7',
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 8,
  },
  detailsCancelBtnText: {
    color: '#FF7F50',
    fontSize: 12.5,
    fontWeight: '700',
  },
});
