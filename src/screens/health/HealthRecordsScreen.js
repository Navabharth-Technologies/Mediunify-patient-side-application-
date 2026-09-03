import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Alert,
  Platform,
  StatusBar,
  Modal,
  TextInput,
  Share,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import colors from '../../theme/colors';

const HealthRecordsScreen = ({ navigation }) => {
  // State
  const [selectedPatient, setSelectedPatient] = useState('all');
  const [selectedTab, setSelectedTab] = useState('all'); // all, labs, rx, scans, bills
  const [searchQuery, setSearchQuery] = useState('');
  const [uploadModalVisible, setUploadModalVisible] = useState(false);
  const [viewDocModalVisible, setViewDocModalVisible] = useState(false);
  const [activeDoc, setActiveDoc] = useState(null);
  const [toastMessage, setToastMessage] = useState(null);

  const familyMembers = [
    { id: 'all', name: 'All Records', count: 12 },
    { id: 'self', name: 'Self (Hemanth)', count: 6 },
    { id: 'sneha', name: 'Sneha (Spouse)', count: 3 },
    { id: 'suresh', name: 'Suresh (Father)', count: 2 },
    { id: 'aarav', name: 'Aarav (Son)', count: 1 },
  ];

  const filterTabs = [
    { id: 'all', label: 'All Files', icon: 'documents' },
    { id: 'labs', label: 'Lab Tests', icon: 'flask' },
    { id: 'rx', label: 'Prescriptions', icon: 'medkit' },
    { id: 'scans', label: '3T Scans', icon: 'scan' },
    { id: 'bills', label: 'Invoices', icon: 'receipt' },
  ];

  const allRecords = [
    {
      id: 'rec-1',
      title: 'Complete Blood Count (CBC) & ESR',
      category: 'labs',
      patient: 'self',
      patientName: 'Hemanth Gowda',
      facility: 'Suburban Diagnostic Center, Mysore',
      doctor: 'Dr. Rajesh Sharma (MD)',
      date: '28 Aug 2026',
      fileSize: '1.8 MB PDF',
      status: 'Normal',
      statusColor: '#059669',
      statusBg: '#ECFDF5',
      icon: 'flask',
      iconColor: '#0284C7',
      iconBg: '#E0F2FE',
      summary: 'Hemoglobin: 14.5 g/dL (Normal) • Platelets: 240,000 /mcL • WBC: 6,800 /mcL.',
    },
    {
      id: 'rec-2',
      title: 'Brain 3T MRI & Diffusion Scan',
      category: 'scans',
      patient: 'suresh',
      patientName: 'Suresh Kumar (Father)',
      facility: 'Unnathi Advanced 3T MRI & Scan Center',
      doctor: 'Dr. Anand Verma (Radiologist)',
      date: '25 Aug 2026',
      fileSize: '14.2 MB DICOM/PDF',
      status: 'Doctor Reviewed',
      statusColor: '#7C3AED',
      statusBg: '#F5F3FF',
      icon: 'radio',
      iconColor: '#7C3AED',
      iconBg: '#EDE9FE',
      summary: 'No acute intracranial hemorrhage or infarct. Age-related normal cerebral findings.',
    },
    {
      id: 'rec-3',
      title: 'Cardiology Rx - Telmisartan & Atorvastatin',
      category: 'rx',
      patient: 'self',
      patientName: 'Hemanth Gowda',
      facility: 'Apollo Cardiology Clinic',
      doctor: 'Dr. Rajesh Sharma, MD DM (Cardio)',
      date: '20 Aug 2026',
      fileSize: '840 KB PDF',
      status: 'Active Refill',
      statusColor: '#0D9488',
      statusBg: '#F0FDFA',
      icon: 'document-text',
      iconColor: '#0D9488',
      iconBg: '#CCFBF1',
      summary: 'Telmisartan 40mg (1-0-0) After Breakfast • Atorvastatin 10mg (0-0-1) After Dinner.',
    },
    {
      id: 'rec-4',
      title: 'HbA1c & Fasting Plasma Glucose',
      category: 'labs',
      patient: 'self',
      patientName: 'Hemanth Gowda',
      facility: 'Thyrocare Home Sample Lab',
      doctor: 'Dr. Anita Desai (Endocrinologist)',
      date: '15 Aug 2026',
      fileSize: '1.2 MB PDF',
      status: 'Optimal 5.6%',
      statusColor: '#059669',
      statusBg: '#ECFDF5',
      icon: 'water',
      iconColor: '#059669',
      iconBg: '#D1FAE5',
      summary: 'HbA1c: 5.6% (Non-Diabetic Range) • Fasting Blood Sugar: 98 mg/dL.',
    },
    {
      id: 'rec-5',
      title: 'Pediatric Vaccine Chart & Record',
      category: 'rx',
      patient: 'aarav',
      patientName: 'Aarav (Son)',
      facility: 'Rainbow Children Hospital',
      doctor: 'Dr. Ananya Rao (Pediatrician)',
      date: '10 Aug 2026',
      fileSize: '2.4 MB PDF',
      status: 'Up to Date',
      statusColor: '#2563EB',
      statusBg: '#EFF6FF',
      icon: 'medkit',
      iconColor: '#2563EB',
      iconBg: '#DBEAFE',
      summary: 'MMR Dose 2 administered. Next scheduled vaccine: Typhoid Booster at 2 Years.',
    },
    {
      id: 'rec-6',
      title: 'Pharmacy Order Bill & GST Receipt',
      category: 'bills',
      patient: 'self',
      patientName: 'Hemanth Gowda',
      facility: 'MediUnify Online Pharmacy',
      doctor: 'Prescription Verified Order #UNC10245',
      date: '05 Aug 2026',
      fileSize: '450 KB PDF',
      status: 'Paid ₹1,240',
      statusColor: '#D97706',
      statusBg: '#FEF3C7',
      icon: 'receipt',
      iconColor: '#EA580C',
      iconBg: '#FFEDD5',
      summary: 'GST Invoice #INV-883492 • Delivered to Kuvempunagar, Mysore • 20% Discount Applied.',
    },
  ];

  const filteredRecords = allRecords.filter((rec) => {
    const matchesPatient = selectedPatient === 'all' || rec.patient === selectedPatient;
    const matchesTab = selectedTab === 'all' || rec.category === selectedTab;
    const matchesSearch =
      searchQuery.trim() === '' ||
      rec.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      rec.doctor.toLowerCase().includes(searchQuery.toLowerCase()) ||
      rec.facility.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesPatient && matchesTab && matchesSearch;
  });

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 2500);
  };

  const handleShareDoc = async (doc) => {
    try {
      await Share.share({
        title: doc.title,
        message: `📄 MediUnify Verified Health Record:\n${doc.title}\nPatient: ${doc.patientName}\nDate: ${doc.date}\nDoctor: ${doc.doctor}\nView PDF: https://hemanthgowdatn2003.github.io/mediunify-patient/`,
      });
    } catch (e) {
      console.log('Share error:', e);
    }
  };

  const openDocViewer = (doc) => {
    setActiveDoc(doc);
    setViewDocModalVisible(true);
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* TOP APP BAR */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => navigation.goBack()}
          activeOpacity={0.8}
        >
          <Ionicons name="arrow-back" size={20} color="#1E293B" />
        </TouchableOpacity>

        <View style={styles.headerTitleWrap}>
          <Text style={styles.headerBadge}>ABDM DIGITAL VAULT</Text>
          <Text style={styles.headerTitle}>Health Records</Text>
        </View>

        <TouchableOpacity
          style={styles.uploadHeaderBtn}
          onPress={() => setUploadModalVisible(true)}
          activeOpacity={0.85}
        >
          <Ionicons name="cloud-upload" size={16} color="#FFFFFF" />
          <Text style={styles.uploadHeaderBtnText}>Upload</Text>
        </TouchableOpacity>
      </View>

      {/* TOAST NOTIFICATION */}
      {toastMessage && (
        <View style={styles.toastCard}>
          <Ionicons name="checkmark-circle" size={16} color="#34D399" />
          <Text style={styles.toastText}>{toastMessage}</Text>
        </View>
      )}

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* ==========================================
            SECURITY HERO BANNER
        ========================================== */}
        <View style={styles.heroBanner}>
          <View style={styles.heroOrb1} />
          <View style={styles.heroOrb2} />

          <View style={styles.heroTopRow}>
            <View style={styles.abdmBadge}>
              <Ionicons name="shield-checkmark" size={12} color="#2DD4BF" />
              <Text style={styles.abdmBadgeText}>ABHA LINKED • 256-BIT ENCRYPTED</Text>
            </View>
            <View style={styles.heroRecordsPill}>
              <Text style={styles.heroRecordsPillText}>{allRecords.length} Documents</Text>
            </View>
          </View>

          <Text style={styles.heroTitle}>Centralized Health Locker</Text>
          <Text style={styles.heroSubtitle}>
            Prescriptions, 3T scans & lab reports available anytime for doctors and consultations.
          </Text>

          {/* METRICS ROW */}
          <View style={styles.heroMetricsRow}>
            <View style={styles.heroMetric}>
              <Text style={styles.heroMetricValue}>3</Text>
              <Text style={styles.heroMetricLabel}>Prescriptions</Text>
            </View>
            <View style={styles.heroMetricDivider} />
            <View style={styles.heroMetric}>
              <Text style={styles.heroMetricValue}>5</Text>
              <Text style={styles.heroMetricLabel}>Lab Reports</Text>
            </View>
            <View style={styles.heroMetricDivider} />
            <View style={styles.heroMetric}>
              <Text style={styles.heroMetricValue}>2</Text>
              <Text style={styles.heroMetricLabel}>3T Scans</Text>
            </View>
            <View style={styles.heroMetricDivider} />
            <View style={styles.heroMetric}>
              <Text style={styles.heroMetricValue}>100%</Text>
              <Text style={styles.heroMetricLabel}>Digital Sync</Text>
            </View>
          </View>
        </View>

        {/* ==========================================
            QUICK CATEGORY SHORTCUTS (4 HUBS)
        ========================================== */}
        <View style={styles.shortcutsGrid}>
          <TouchableOpacity
            style={[styles.shortcutCard, { backgroundColor: '#F0FDFA', borderColor: '#CCFBF1' }]}
            onPress={() => navigation.navigate('Prescriptions')}
            activeOpacity={0.88}
          >
            <View style={[styles.shortcutIcon, { backgroundColor: '#CCFBF1' }]}>
              <Ionicons name="medkit" size={20} color="#0F766E" />
            </View>
            <Text style={styles.shortcutTitle}>Doctor Rx</Text>
            <Text style={styles.shortcutSub}>3 Prescriptions ›</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.shortcutCard, { backgroundColor: '#EFF6FF', borderColor: '#DBEAFE' }]}
            onPress={() => navigation.navigate('Reports')}
            activeOpacity={0.88}
          >
            <View style={[styles.shortcutIcon, { backgroundColor: '#DBEAFE' }]}>
              <Ionicons name="flask" size={20} color="#1D4ED8" />
            </View>
            <Text style={styles.shortcutTitle}>Lab Reports</Text>
            <Text style={styles.shortcutSub}>4 Blood Tests ›</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.shortcutCard, { backgroundColor: '#FAF5FF', borderColor: '#F3E8FF' }]}
            onPress={() => navigation.navigate('Reports')}
            activeOpacity={0.88}
          >
            <View style={[styles.shortcutIcon, { backgroundColor: '#F3E8FF' }]}>
              <Ionicons name="scan" size={20} color="#7E22CE" />
            </View>
            <Text style={styles.shortcutTitle}>3T Scans</Text>
            <Text style={styles.shortcutSub}>MRI / CT Scans ›</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.shortcutCard, { backgroundColor: '#FEF2F2', borderColor: '#FEE2E2' }]}
            onPress={() => navigation.navigate('HealthMonitor')}
            activeOpacity={0.88}
          >
            <View style={[styles.shortcutIcon, { backgroundColor: '#FEE2E2' }]}>
              <Ionicons name="pulse" size={20} color="#B91C1C" />
            </View>
            <Text style={styles.shortcutTitle}>Vitals Log</Text>
            <Text style={styles.shortcutSub}>Sugar & BP ›</Text>
          </TouchableOpacity>
        </View>

        {/* ==========================================
            SEARCH BAR
        ========================================== */}
        <View style={styles.searchBar}>
          <Ionicons name="search" size={18} color="#94A3B8" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search records by test, doctor or lab..."
            placeholderTextColor="#94A3B8"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={18} color="#94A3B8" />
            </TouchableOpacity>
          )}
        </View>

        {/* ==========================================
            PATIENT SWITCHER CHIPS
        ========================================== */}
        <View style={styles.sectionRow}>
          <Text style={styles.sectionTitle}>Filter by Patient</Text>
        </View>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.horizontalChips}
        >
          {familyMembers.map((fam) => (
            <TouchableOpacity
              key={fam.id}
              style={[
                styles.patientChip,
                selectedPatient === fam.id && styles.patientChipActive,
              ]}
              onPress={() => setSelectedPatient(fam.id)}
              activeOpacity={0.8}
            >
              <Ionicons
                name={fam.id === 'all' ? 'people' : 'person'}
                size={14}
                color={selectedPatient === fam.id ? '#FFFFFF' : '#475569'}
              />
              <Text
                style={[
                  styles.patientChipText,
                  selectedPatient === fam.id && styles.patientChipTextActive,
                ]}
              >
                {fam.name}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* ==========================================
            CATEGORY FILTER TABS
        ========================================== */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.horizontalTabs}
        >
          {filterTabs.map((tab) => (
            <TouchableOpacity
              key={tab.id}
              style={[
                styles.filterTab,
                selectedTab === tab.id && styles.filterTabActive,
              ]}
              onPress={() => setSelectedTab(tab.id)}
              activeOpacity={0.8}
            >
              <Ionicons
                name={tab.icon}
                size={14}
                color={selectedTab === tab.id ? '#0F766E' : '#64748B'}
              />
              <Text
                style={[
                  styles.filterTabText,
                  selectedTab === tab.id && styles.filterTabTextActive,
                ]}
              >
                {tab.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* ==========================================
            DOCUMENTS LIST
        ========================================== */}
        <View style={styles.sectionRow}>
          <Text style={styles.sectionTitle}>
            Saved Documents ({filteredRecords.length})
          </Text>
          <TouchableOpacity onPress={() => setUploadModalVisible(true)}>
            <Text style={styles.sectionActionText}>+ Add New</Text>
          </TouchableOpacity>
        </View>

        {filteredRecords.length === 0 ? (
          <View style={styles.emptyCard}>
            <Ionicons name="folder-open-outline" size={44} color="#CBD5E1" />
            <Text style={styles.emptyTitle}>No health records found</Text>
            <Text style={styles.emptySub}>
              Try adjusting your search query or upload a new medical document.
            </Text>
            <TouchableOpacity
              style={styles.emptyUploadBtn}
              onPress={() => setUploadModalVisible(true)}
            >
              <Text style={styles.emptyUploadBtnText}>+ Upload Health Document</Text>
            </TouchableOpacity>
          </View>
        ) : (
          filteredRecords.map((doc) => (
            <View key={doc.id} style={styles.recordCard}>
              <View style={styles.recordHeader}>
                <View style={[styles.recordIconCircle, { backgroundColor: doc.iconBg }]}>
                  <Ionicons name={doc.icon} size={20} color={doc.iconColor} />
                </View>

                <View style={styles.recordTitleWrap}>
                  <View style={styles.patientBadgeRow}>
                    <Text style={styles.patientBadgeText}>👤 {doc.patientName}</Text>
                  </View>
                  <Text style={styles.recordTitle}>{doc.title}</Text>
                  <Text style={styles.recordDoctor}>👨‍⚕️ {doc.doctor}</Text>
                  <Text style={styles.recordFacility}>🏥 {doc.facility}</Text>
                </View>

                <View style={[styles.statusBadge, { backgroundColor: doc.statusBg }]}>
                  <Text style={[styles.statusBadgeText, { color: doc.statusColor }]}>
                    {doc.status}
                  </Text>
                </View>
              </View>

              {/* SUMMARY SNIPPET */}
              <View style={styles.summarySnippet}>
                <Ionicons name="information-circle" size={14} color="#0F766E" />
                <Text style={styles.summarySnippetText} numberOfLines={2}>
                  {doc.summary}
                </Text>
              </View>

              {/* CARD FOOTER */}
              <View style={styles.recordFooter}>
                <View style={styles.metaRow}>
                  <Ionicons name="calendar-outline" size={13} color="#94A3B8" />
                  <Text style={styles.metaText}>{doc.date}</Text>
                  <Text style={styles.metaDot}>•</Text>
                  <Ionicons name="document-outline" size={13} color="#94A3B8" />
                  <Text style={styles.metaText}>{doc.fileSize}</Text>
                </View>

                <View style={styles.cardActionsRow}>
                  <TouchableOpacity
                    style={styles.shareBtn}
                    onPress={() => handleShareDoc(doc)}
                    activeOpacity={0.8}
                  >
                    <Ionicons name="share-social-outline" size={16} color="#0F766E" />
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.viewDocBtn}
                    onPress={() => openDocViewer(doc)}
                    activeOpacity={0.85}
                  >
                    <Ionicons name="eye-outline" size={14} color="#FFFFFF" />
                    <Text style={styles.viewDocBtnText}>View PDF</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          ))
        )}

        <View style={{ height: 50 }} />
      </ScrollView>

      {/* ==========================================
          UPLOAD HEALTH DOCUMENT MODAL
      ========================================== */}
      <Modal
        visible={uploadModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setUploadModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTag}>DIGITAL HEALTH LOCKER</Text>
                <Text style={styles.modalTitle}>Upload Medical Document</Text>
              </View>
              <TouchableOpacity
                style={styles.modalCloseBtn}
                onPress={() => setUploadModalVisible(false)}
              >
                <Ionicons name="close" size={20} color="#64748B" />
              </TouchableOpacity>
            </View>

            <Text style={styles.modalSubtitle}>
              Select document type to securely encrypt and sync with your ABHA ID.
            </Text>

            <TouchableOpacity
              style={styles.uploadOptionCard}
              onPress={() => {
                setUploadModalVisible(false);
                showToast('Camera Scanner ready. Capture prescription.');
                navigation.navigate('Prescriptions');
              }}
              activeOpacity={0.85}
            >
              <View style={[styles.uploadOptionIcon, { backgroundColor: '#F0FDFA' }]}>
                <Ionicons name="camera" size={22} color="#0F766E" />
              </View>
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={styles.uploadOptionTitle}>Scan with Camera</Text>
                <Text style={styles.uploadOptionSub}>
                  Take a photo of physical prescription or doctor slip
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color="#CBD5E1" />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.uploadOptionCard}
              onPress={() => {
                setUploadModalVisible(false);
                showToast('Device file picker opened.');
                navigation.navigate('Reports');
              }}
              activeOpacity={0.85}
            >
              <View style={[styles.uploadOptionIcon, { backgroundColor: '#EFF6FF' }]}>
                <Ionicons name="document-attach" size={22} color="#2563EB" />
              </View>
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={styles.uploadOptionTitle}>Upload PDF or Image File</Text>
                <Text style={styles.uploadOptionSub}>
                  Choose CBC, MRI, CT scan or lab PDF from your phone
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color="#CBD5E1" />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.uploadOptionCard}
              onPress={() => {
                setUploadModalVisible(false);
                showToast('Auto-syncing diagnostic lab reports via OTP.');
              }}
              activeOpacity={0.85}
            >
              <View style={[styles.uploadOptionIcon, { backgroundColor: '#FAF5FF' }]}>
                <Ionicons name="cloud-download" size={22} color="#9333EA" />
              </View>
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={styles.uploadOptionTitle}>Auto-Fetch from Hospital/Lab</Text>
                <Text style={styles.uploadOptionSub}>
                  Sync reports automatically using your Registered Mobile No.
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color="#CBD5E1" />
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* ==========================================
          VIEW DOCUMENT PREVIEW MODAL
      ========================================== */}
      <Modal
        visible={viewDocModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setViewDocModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.viewDocModalContent}>
            {activeDoc && (
              <>
                <View style={styles.modalHeader}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.modalTag}>VERIFIED REPORT PREVIEW</Text>
                    <Text style={styles.modalTitle} numberOfLines={1}>
                      {activeDoc.title}
                    </Text>
                  </View>
                  <TouchableOpacity
                    style={styles.modalCloseBtn}
                    onPress={() => setViewDocModalVisible(false)}
                  >
                    <Ionicons name="close" size={20} color="#64748B" />
                  </TouchableOpacity>
                </View>

                {/* SIMULATED PDF VIEW */}
                <View style={styles.pdfPreviewBox}>
                  <Ionicons name="document-text" size={48} color="#0F766E" />
                  <Text style={styles.pdfPreviewName}>{activeDoc.title}</Text>
                  <Text style={styles.pdfPreviewMeta}>
                    {activeDoc.facility} • {activeDoc.date}
                  </Text>
                  <View style={styles.pdfStamp}>
                    <Ionicons name="shield-checkmark" size={14} color="#059669" />
                    <Text style={styles.pdfStampText}>ABDM Digitally Signed</Text>
                  </View>
                  <Text style={styles.pdfSummaryBoxText}>{activeDoc.summary}</Text>
                </View>

                {/* MODAL ACTIONS */}
                <View style={styles.pdfModalActions}>
                  <TouchableOpacity
                    style={styles.downloadModalBtn}
                    onPress={() => {
                      setViewDocModalVisible(false);
                      showToast('Document downloaded to device storage.');
                    }}
                    activeOpacity={0.88}
                  >
                    <Ionicons name="download-outline" size={16} color="#0F766E" />
                    <Text style={styles.downloadModalBtnText}>Download PDF</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.shareModalBtn}
                    onPress={() => {
                      setViewDocModalVisible(false);
                      handleShareDoc(activeDoc);
                    }}
                    activeOpacity={0.88}
                  >
                    <Ionicons name="share-social-outline" size={16} color="#FFFFFF" />
                    <Text style={styles.shareModalBtnText}>Share Record</Text>
                  </TouchableOpacity>
                </View>
              </>
            )}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

export default HealthRecordsScreen;

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
    paddingTop: Platform.OS === 'android' ? 14 : 10,
    paddingBottom: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitleWrap: {
    alignItems: 'center',
  },
  headerBadge: {
    fontSize: 9.5,
    fontWeight: '800',
    color: '#0F766E',
    letterSpacing: 0.6,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: '#0F172A',
  },
  uploadHeaderBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0F766E',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
    gap: 5,
  },
  uploadHeaderBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
  },

  // TOAST
  toastCard: {
    position: 'absolute',
    top: 70,
    alignSelf: 'center',
    zIndex: 999,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#064E3B',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 24,
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
  toastText: {
    color: '#FFFFFF',
    fontSize: 12.5,
    fontWeight: '700',
  },

  scrollContent: {
    paddingBottom: 40,
  },

  // HERO BANNER
  heroBanner: {
    backgroundColor: '#0F766E',
    marginHorizontal: 16,
    marginTop: 14,
    borderRadius: 22,
    padding: 18,
    overflow: 'hidden',
    position: 'relative',
    shadowColor: '#0F766E',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.22,
    shadowRadius: 10,
    elevation: 6,
  },
  heroOrb1: {
    position: 'absolute',
    top: -30,
    right: -20,
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
  heroOrb2: {
    position: 'absolute',
    bottom: -30,
    left: -20,
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  heroTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  abdmBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.18)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    gap: 4,
  },
  abdmBadgeText: {
    fontSize: 9.5,
    fontWeight: '800',
    color: '#CCFBF1',
    letterSpacing: 0.5,
  },
  heroRecordsPill: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 9,
    paddingVertical: 3,
    borderRadius: 12,
  },
  heroRecordsPillText: {
    fontSize: 10.5,
    fontWeight: '900',
    color: '#0F766E',
  },
  heroTitle: {
    fontSize: 19,
    fontWeight: '900',
    color: '#FFFFFF',
    marginTop: 12,
  },
  heroSubtitle: {
    fontSize: 12,
    color: '#E6FFFA',
    marginTop: 3,
    lineHeight: 17,
  },

  // HERO METRICS
  heroMetricsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.15)',
    marginTop: 14,
    borderRadius: 14,
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  heroMetric: {
    alignItems: 'center',
    flex: 1,
  },
  heroMetricValue: {
    fontSize: 15,
    fontWeight: '900',
    color: '#FFFFFF',
  },
  heroMetricLabel: {
    fontSize: 10,
    color: '#CCFBF1',
    marginTop: 1,
    fontWeight: '600',
  },
  heroMetricDivider: {
    width: 1,
    height: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },

  // SHORTCUTS GRID
  shortcutsGrid: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginTop: 14,
    gap: 8,
  },
  shortcutCard: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 6,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: 'center',
  },
  shortcutIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  shortcutTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: '#0F172A',
  },
  shortcutSub: {
    fontSize: 9.5,
    fontWeight: '700',
    color: '#64748B',
    marginTop: 2,
  },

  // SEARCH BAR
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginTop: 14,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    color: '#0F172A',
    fontWeight: '500',
  },

  // SECTION ROW
  sectionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 18,
    marginTop: 18,
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '900',
    color: '#0F172A',
  },
  sectionActionText: {
    fontSize: 12.5,
    fontWeight: '800',
    color: '#0F766E',
  },

  // PATIENT CHIPS
  horizontalChips: {
    paddingHorizontal: 16,
    gap: 8,
  },
  patientChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 6,
  },
  patientChipActive: {
    backgroundColor: '#0F766E',
    borderColor: '#0F766E',
  },
  patientChipText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#475569',
  },
  patientChipTextActive: {
    color: '#FFFFFF',
  },

  // FILTER TABS
  horizontalTabs: {
    paddingHorizontal: 16,
    marginTop: 10,
    gap: 8,
  },
  filterTab: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 5,
  },
  filterTabActive: {
    backgroundColor: '#CCFBF1',
    borderColor: '#99F6E4',
  },
  filterTabText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#64748B',
  },
  filterTabTextActive: {
    color: '#0F766E',
    fontWeight: '800',
  },

  // RECORD CARD
  recordCard: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginTop: 10,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    padding: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  recordHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  recordIconCircle: {
    width: 42,
    height: 42,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  recordTitleWrap: {
    flex: 1,
    marginLeft: 12,
  },
  patientBadgeRow: {
    marginBottom: 2,
  },
  patientBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#0F766E',
  },
  recordTitle: {
    fontSize: 14,
    fontWeight: '900',
    color: '#0F172A',
  },
  recordDoctor: {
    fontSize: 11.5,
    color: '#475569',
    marginTop: 2,
    fontWeight: '600',
  },
  recordFacility: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 1,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  statusBadgeText: {
    fontSize: 10,
    fontWeight: '800',
  },

  // SUMMARY SNIPPET
  summarySnippet: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0FDFA',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    marginTop: 10,
    gap: 6,
  },
  summarySnippetText: {
    fontSize: 11,
    color: '#0F766E',
    fontWeight: '600',
    flex: 1,
  },

  // FOOTER
  recordFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#F8FAFC',
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    fontSize: 11,
    color: '#94A3B8',
    fontWeight: '600',
  },
  metaDot: {
    color: '#CBD5E1',
    marginHorizontal: 2,
  },
  cardActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  shareBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F0FDFA',
    alignItems: 'center',
    justifyContent: 'center',
  },
  viewDocBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0F766E',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 14,
    gap: 4,
  },
  viewDocBtnText: {
    color: '#FFFFFF',
    fontSize: 11.5,
    fontWeight: '800',
  },

  // EMPTY STATE
  emptyCard: {
    alignItems: 'center',
    padding: 30,
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginTop: 14,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#334155',
    marginTop: 10,
  },
  emptySub: {
    fontSize: 12,
    color: '#64748B',
    textAlign: 'center',
    marginTop: 4,
    marginBottom: 14,
  },
  emptyUploadBtn: {
    backgroundColor: '#0F766E',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 16,
  },
  emptyUploadBtnText: {
    color: '#FFFFFF',
    fontSize: 12.5,
    fontWeight: '800',
  },

  // MODALS
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.7)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 6,
  },
  modalTag: {
    fontSize: 9.5,
    fontWeight: '800',
    color: '#0F766E',
    letterSpacing: 0.5,
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '900',
    color: '#0F172A',
    marginTop: 2,
  },
  modalSubtitle: {
    fontSize: 12,
    color: '#64748B',
    marginBottom: 16,
  },
  modalCloseBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  uploadOptionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 10,
  },
  uploadOptionIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  uploadOptionTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0F172A',
  },
  uploadOptionSub: {
    fontSize: 11.5,
    color: '#64748B',
    marginTop: 2,
  },

  // VIEW DOC MODAL
  viewDocModalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    margin: 20,
    padding: 20,
  },
  pdfPreviewBox: {
    backgroundColor: '#F8FAFC',
    borderRadius: 18,
    padding: 20,
    alignItems: 'center',
    marginVertical: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  pdfPreviewName: {
    fontSize: 14,
    fontWeight: '900',
    color: '#0F172A',
    marginTop: 10,
    textAlign: 'center',
  },
  pdfPreviewMeta: {
    fontSize: 11.5,
    color: '#64748B',
    marginTop: 3,
  },
  pdfStamp: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    marginTop: 8,
    gap: 4,
  },
  pdfStampText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#059669',
  },
  pdfSummaryBoxText: {
    fontSize: 11.5,
    color: '#334155',
    backgroundColor: '#FFFFFF',
    padding: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    marginTop: 12,
    lineHeight: 16,
    width: '100%',
  },
  pdfModalActions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 6,
  },
  downloadModalBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F0FDFA',
    paddingVertical: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#CCFBF1',
    gap: 6,
  },
  downloadModalBtnText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0F766E',
  },
  shareModalBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0F766E',
    paddingVertical: 12,
    borderRadius: 14,
    gap: 6,
  },
  shareModalBtnText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#FFFFFF',
  },
});