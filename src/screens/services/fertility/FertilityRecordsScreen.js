import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  Platform,
  useWindowDimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { sampleFertilityRecords } from '../../../data/fertilityData';
import { FertilityRecordCard, EmptyState, DocumentUploadCard } from '../../../components/fertility';
import { showAlert } from '../../../utils/alert';
import WebFooter from '../../../components/web/WebFooter';

const RECORD_TYPES = [
  'All',
  'Ultrasound Report',
  'Semen Analysis',
  'Blood Test / Hormone',
  'Prescription & Protocol',
  'Billing & Invoice',
];

const FertilityRecordsScreen = ({ navigation }) => {
  const { width } = useWindowDimensions();
  const isDesktopWeb = Platform.OS === 'web' && width >= 992;

  const [records, setRecords] = useState(sampleFertilityRecords);
  const [search, setSearch] = useState('');
  const [selectedType, setSelectedType] = useState('All');
  const [activeRecordModal, setActiveRecordModal] = useState(null);
  const [uploadModalVisible, setUploadModalVisible] = useState(false);
  const [newDocTitle, setNewDocTitle] = useState('');

  const filteredRecords = useMemo(() => {
    return records.filter((r) => {
      const q = search.trim().toLowerCase();
      const matchQuery =
        !q ||
        r.title.toLowerCase().includes(q) ||
        r.doctor.toLowerCase().includes(q) ||
        r.summary.toLowerCase().includes(q) ||
        r.tags.some((t) => t.toLowerCase().includes(q));

      const matchType = selectedType === 'All' || r.type === selectedType;

      return matchQuery && matchType;
    });
  }, [records, search, selectedType]);

  const handleUploadNewRecord = () => {
    if (!newDocTitle.trim()) {
      showAlert('Required', 'Please enter a title for your document.');
      return;
    }

    const newRecord = {
      id: `rec-${Date.now()}`,
      title: newDocTitle.trim(),
      type: 'Ultrasound Report',
      date: 'Today',
      doctor: 'Uploaded by Patient',
      clinic: 'Personal Health Locker',
      fileSize: '1.5 MB',
      summary: 'Patient uploaded file securely stored in HIPAA vault.',
      tags: ['Uploaded', 'Patient Vault'],
    };

    setRecords([newRecord, ...records]);
    setNewDocTitle('');
    setUploadModalVisible(false);
    showAlert('Success', 'Your clinical record has been stored in your encrypted vault.');
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.navigate('FertilityIvf')}
          style={styles.backBtn}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Ionicons name="arrow-back" size={22} color="#0F172A" />
        </TouchableOpacity>
        <View style={styles.headerTitleWrap}>
          <Text style={styles.headerTitle}>Fertility Health Records</Text>
          <Text style={styles.headerSubtitle}>
            {records.length} Encrypted Clinical Reports & Scans
          </Text>
        </View>
        <TouchableOpacity
          style={styles.uploadBtn}
          onPress={() => setUploadModalVisible(true)}
        >
          <Ionicons name="cloud-upload-outline" size={18} color="#E11D48" />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollArea}
        contentContainerStyle={[
          styles.scrollContent,
          isDesktopWeb && styles.desktopContainer,
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Search Bar */}
        <View style={styles.searchBarWrap}>
          <Ionicons name="search-outline" size={18} color="#64748B" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search scans, AFC, CASA semen, AMH, prescriptions..."
            value={search}
            onChangeText={setSearch}
            placeholderTextColor="#94A3B8"
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => setSearch('')}>
              <Ionicons name="close-circle" size={18} color="#94A3B8" />
            </TouchableOpacity>
          )}
        </View>

        {/* Record Type Filter Pills */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.typeChipsRow}
        >
          {RECORD_TYPES.map((type) => (
            <TouchableOpacity
              key={type}
              style={[
                styles.typeChip,
                selectedType === type && styles.typeChipActive,
              ]}
              onPress={() => setSelectedType(type)}
              activeOpacity={0.8}
            >
              <Text
                style={[
                  styles.typeChipText,
                  selectedType === type && styles.typeChipTextActive,
                ]}
              >
                {type}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Vault Notice */}
        <View style={styles.vaultNotice}>
          <Ionicons name="lock-closed" size={16} color="#059669" />
          <Text style={styles.vaultNoticeText}>
            256-Bit Encrypted HIPAA Vault. Accessible only to you and your treating clinicians.
          </Text>
        </View>

        {/* Records List */}
        <View style={[styles.listWrap, isDesktopWeb && styles.desktopGrid]}>
          {filteredRecords.length > 0 ? (
            filteredRecords.map((record) => (
              <View key={record.id} style={isDesktopWeb ? styles.gridCol : null}>
                <FertilityRecordCard
                  record={record}
                  onView={(r) => setActiveRecordModal(r)}
                  onDownload={(r) =>
                    showAlert('Download Started', `Downloading "${r.title}.pdf" to your device storage.`)
                  }
                />
              </View>
            ))
          ) : (
            <EmptyState
              icon="document-outline"
              title="No records match your filter"
              subtitle="Clear filters or upload past reports directly."
              actionLabel="Reset Search"
              onAction={() => {
                setSearch('');
                setSelectedType('All');
              }}
            />
          )}
        </View>

        {isDesktopWeb && <WebFooter navigation={navigation} />}
      </ScrollView>

      {/* Record Preview Modal */}
      <Modal
        visible={!!activeRecordModal}
        transparent
        animationType="slide"
        onRequestClose={() => setActiveRecordModal(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, isDesktopWeb && { maxWidth: 540 }]}>
            <View style={styles.modalHeader}>
              <View style={{ flex: 1 }}>
                <Text style={styles.modalTitle} numberOfLines={1}>
                  {activeRecordModal?.title}
                </Text>
                <Text style={styles.modalSub}>
                  {activeRecordModal?.type} • {activeRecordModal?.date}
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => setActiveRecordModal(null)}
                style={styles.modalCloseBtn}
              >
                <Ionicons name="close" size={20} color="#64748B" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
              <View style={styles.reportViewerPlaceholder}>
                <Ionicons name="document-text" size={48} color="#E11D48" />
                <Text style={styles.viewerTitle}>Confidential Diagnostic PDF Report</Text>
                <Text style={styles.viewerSub}>
                  Clinician: {activeRecordModal?.doctor} ({activeRecordModal?.clinic})
                </Text>
              </View>

              <View style={styles.findingsBox}>
                <Text style={styles.findingsTitle}>Key Diagnostic Findings & Summary:</Text>
                <Text style={styles.findingsBody}>{activeRecordModal?.summary}</Text>
              </View>

              <View style={styles.tagsContainer}>
                {activeRecordModal?.tags.map((t, idx) => (
                  <View key={idx} style={styles.modalTag}>
                    <Text style={styles.modalTagText}>{t}</Text>
                  </View>
                ))}
              </View>

              <TouchableOpacity
                style={styles.downloadFullBtn}
                onPress={() => {
                  showAlert('Download', `Downloading ${activeRecordModal?.title}...`);
                  setActiveRecordModal(null);
                }}
                activeOpacity={0.85}
              >
                <Ionicons name="download" size={16} color="#FFFFFF" />
                <Text style={styles.downloadFullBtnText}>Download Full Report PDF</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Upload New Document Modal */}
      <Modal
        visible={uploadModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setUploadModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, isDesktopWeb && { maxWidth: 500 }]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Upload Clinical Document</Text>
              <TouchableOpacity
                onPress={() => setUploadModalVisible(false)}
                style={styles.modalCloseBtn}
              >
                <Ionicons name="close" size={20} color="#64748B" />
              </TouchableOpacity>
            </View>

            <View style={styles.modalBody}>
              <Text style={styles.inputLabel}>Document Title / Description *</Text>
              <TextInput
                style={styles.modalInput}
                value={newDocTitle}
                onChangeText={setNewDocTitle}
                placeholder="e.g. Day 2 Hormone Profile or HSG X-Ray"
                placeholderTextColor="#94A3B8"
              />

              <DocumentUploadCard
                title="Select File to Upload"
                subtitle="PDF, JPG, PNG up to 10MB"
                onPick={() => showAlert('File Attached', 'Document selected from storage.')}
              />

              <TouchableOpacity
                style={styles.saveDocBtn}
                onPress={handleUploadNewRecord}
                activeOpacity={0.85}
              >
                <Text style={styles.saveDocBtnText}>Save to Vault</Text>
              </TouchableOpacity>
            </View>
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
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    gap: 12,
  },
  backBtn: {
    padding: 6,
    borderRadius: 8,
    backgroundColor: '#F8FAFC',
  },
  headerTitleWrap: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#0F172A',
  },
  headerSubtitle: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
  },
  uploadBtn: {
    padding: 6,
    borderRadius: 8,
    backgroundColor: '#FFF1F2',
  },
  scrollArea: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  desktopContainer: {
    maxWidth: 1000,
    width: '100%',
    alignSelf: 'center',
    paddingHorizontal: 24,
  },
  searchBarWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 10,
    marginBottom: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    color: '#0F172A',
    padding: 0,
  },
  typeChipsRow: {
    flexDirection: 'row',
    marginBottom: 14,
  },
  typeChip: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 8,
  },
  typeChipActive: {
    backgroundColor: '#E11D48',
    borderColor: '#E11D48',
  },
  typeChipText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#475569',
  },
  typeChipTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  vaultNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#ECFDF5',
    padding: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#A7F3D0',
    marginBottom: 14,
  },
  vaultNoticeText: {
    fontSize: 11,
    color: '#065F46',
    fontWeight: '600',
    flex: 1,
  },
  listWrap: {
    marginTop: 2,
  },
  desktopGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -8,
  },
  gridCol: {
    width: '50%',
    paddingHorizontal: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '85%',
    width: '100%',
    alignSelf: 'center',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
  },
  modalSub: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
  },
  modalCloseBtn: {
    padding: 6,
  },
  modalBody: {
    padding: 20,
  },
  reportViewerPlaceholder: {
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 16,
  },
  viewerTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0F172A',
    marginTop: 10,
  },
  viewerSub: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
  },
  findingsBox: {
    backgroundColor: '#FFF1F2',
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FECDD3',
    marginBottom: 14,
  },
  findingsTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: '#9F1239',
    marginBottom: 4,
  },
  findingsBody: {
    fontSize: 12,
    color: '#4C0519',
    lineHeight: 18,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 18,
  },
  modalTag: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  modalTagText: {
    fontSize: 11,
    color: '#475569',
    fontWeight: '600',
  },
  downloadFullBtn: {
    backgroundColor: '#E11D48',
    paddingVertical: 13,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 20,
  },
  downloadFullBtnText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 13,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#334155',
    marginBottom: 6,
  },
  modalInput: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 13,
    color: '#0F172A',
    marginBottom: 12,
  },
  saveDocBtn: {
    backgroundColor: '#E11D48',
    paddingVertical: 13,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 20,
  },
  saveDocBtnText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 13,
  },
});

export default FertilityRecordsScreen;
