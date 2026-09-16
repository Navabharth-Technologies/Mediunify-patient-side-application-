import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Image,
  Platform,
  useWindowDimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { fertilitySpecialists } from '../../../data/fertilityData';
import { DocumentUploadCard, StatusBadge } from '../../../components/fertility';
import { showAlert } from '../../../utils/alert';
import WebFooter from '../../../components/web/WebFooter';

const SecondOpinionScreen = ({ navigation }) => {
  const { width } = useWindowDimensions();
  const isDesktopWeb = Platform.OS === 'web' && width >= 992;

  const [activeTab, setActiveTab] = useState('new'); // 'new' | 'status'
  const [selectedSpecialist, setSelectedSpecialist] = useState(fertilitySpecialists[0]);
  const [patientName, setPatientName] = useState('Ananya Sharma');
  const [priorFailuresCount, setPriorFailuresCount] = useState('2');
  const [primaryQuery, setPrimaryQuery] = useState(
    'Had 2 failed IVF cycles at a private clinic with poor Day-3 cleavage. Seeking advice on blastocyst extended culture vs donor backup.'
  );

  const [uploadedReports, setUploadedReports] = useState([
    { id: '1', name: 'Previous_IVF_Discharge_Summary.pdf', size: '2.1 MB' },
    { id: '2', name: 'Embryology_Day3_Photo_Card.jpg', size: '1.4 MB' },
  ]);

  const [activeCase, setActiveCase] = useState({
    caseId: 'SEC-IVF-9941',
    status: 'in_progress',
    statusLabel: 'Under Specialist Review',
    specialistName: 'Dr. Priya V. Shenoy',
    clinic: 'Nova IVF & Fertility Care Centre',
    submittedDate: '14 Sept 2026',
    estimatedDelivery: 'Tomorrow, by 05:00 PM',
    clinicalMilestones: [
      { step: 'Dossier & Scans Verified by Embryologist', done: true },
      { step: 'Senior Specialist Protocol Re-evaluation', done: true },
      { step: 'Video Case Review with Couple Scheduled', done: false, date: 'Tomorrow 04:00 PM' },
      { step: 'Signed Written Consensus & Recommendations', done: false },
    ],
  });

  const handleAttachReport = () => {
    const newDoc = {
      id: Date.now().toString(),
      name: `Past_Cycle_Report_${Date.now().toString().slice(-4)}.pdf`,
      size: '1.7 MB',
    };
    setUploadedReports([...uploadedReports, newDoc]);
    showAlert('Uploaded', `${newDoc.name} attached to case file.`);
  };

  const handleSubmitSecondOpinion = () => {
    if (!patientName.trim() || !primaryQuery.trim()) {
      showAlert('Required', 'Please enter your name and case summary notes.');
      return;
    }

    const newCaseId = `SEC-IVF-${Math.floor(1000 + Math.random() * 9000)}`;
    setActiveCase({
      caseId: newCaseId,
      status: 'pending',
      statusLabel: 'Case File Received',
      specialistName: selectedSpecialist.name,
      clinic: selectedSpecialist.clinicName,
      submittedDate: 'Today',
      estimatedDelivery: 'Within 24-36 Hours',
      clinicalMilestones: [
        { step: 'Dossier & Scans Verified by Embryologist', done: true },
        { step: 'Senior Specialist Protocol Re-evaluation', done: false },
        { step: 'Video Case Review with Couple', done: false },
        { step: 'Signed Written Consensus & Recommendations', done: false },
      ],
    });

    setActiveTab('status');
    showAlert(
      'Case Dossier Submitted! 📋',
      `Your IVF second opinion file #${newCaseId} has been sent to ${selectedSpecialist.name}. The panel will review your previous stimulation logs and embryology photos.`
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backBtn}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Ionicons name="arrow-back" size={22} color="#0F172A" />
        </TouchableOpacity>
        <View style={styles.headerTitleWrap}>
          <Text style={styles.headerTitle}>Fertility Second Opinion</Text>
          <Text style={styles.headerSubtitle}>Independent Expert Case Review</Text>
        </View>
      </View>

      {/* Tabs */}
      <View style={styles.subHeaderTabs}>
        <TouchableOpacity
          style={[styles.subTab, activeTab === 'new' && styles.subTabActive]}
          onPress={() => setActiveTab('new')}
        >
          <Ionicons
            name="document-text-outline"
            size={15}
            color={activeTab === 'new' ? '#E11D48' : '#64748B'}
          />
          <Text style={[styles.subTabText, activeTab === 'new' && styles.subTabTextActive]}>
            Request Review
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.subTab, activeTab === 'status' && styles.subTabActive]}
          onPress={() => setActiveTab('status')}
        >
          <Ionicons
            name="hourglass-outline"
            size={15}
            color={activeTab === 'status' ? '#E11D48' : '#64748B'}
          />
          <Text style={[styles.subTabText, activeTab === 'status' && styles.subTabTextActive]}>
            Active Case Status
          </Text>
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
        {activeTab === 'new' ? (
          <>
            {/* Why Second Opinion Matters */}
            <View style={styles.introCard}>
              <Ionicons name="bulb-outline" size={24} color="#E11D48" />
              <View style={styles.introCol}>
                <Text style={styles.introTitle}>When to seek an independent review:</Text>
                <Text style={styles.introBody}>
                  • After 1 or more failed IVF / ICSI cycles{'\n'}
                  • Poor embryo cleavage or blastocyst arrest{'\n'}
                  • Low ovarian response or recurrent implantation failure{'\n'}
                  • Before undergoing donor egg / donor sperm treatments
                </Text>
              </View>
            </View>

            {/* Select Reviewing Specialist */}
            <Text style={styles.sectionHeading}>Select Reviewing Senior Director</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.docRow}>
              {fertilitySpecialists.slice(0, 4).map((doc) => {
                const isSelected = selectedSpecialist.id === doc.id;
                return (
                  <TouchableOpacity
                    key={doc.id}
                    style={[styles.docChipCard, isSelected && styles.docChipCardActive]}
                    onPress={() => setSelectedSpecialist(doc)}
                    activeOpacity={0.85}
                  >
                    <Image source={{ uri: doc.image }} style={styles.docThumb} />
                    <Text style={styles.docChipName} numberOfLines={1}>
                      {doc.name}
                    </Text>
                    <Text style={styles.docChipSpec} numberOfLines={1}>
                      {doc.specialty.split('&')[0]}
                    </Text>
                    <View style={styles.feeTag}>
                      <Text style={styles.feeTagText}>Review Fee: ₹{doc.fee + 400}</Text>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            {/* Form */}
            <View style={styles.formCard}>
              <Text style={styles.formHeading}>Case History & Query Details</Text>

              <Text style={styles.inputLabel}>Patient Name</Text>
              <TextInput
                style={styles.input}
                value={patientName}
                onChangeText={setPatientName}
                placeholder="Full name"
                placeholderTextColor="#94A3B8"
              />

              <Text style={styles.inputLabel}>Number of Prior Failed Cycles</Text>
              <TextInput
                style={styles.input}
                value={priorFailuresCount}
                onChangeText={setPriorFailuresCount}
                keyboardType="numeric"
                placeholder="e.g. 2"
                placeholderTextColor="#94A3B8"
              />

              <Text style={styles.inputLabel}>Detailed Case Background & Specific Questions *</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={primaryQuery}
                onChangeText={setPrimaryQuery}
                multiline
                numberOfLines={4}
                placeholder="Describe stimulation drugs used, egg count, embryo grades, and specific points you want the expert to evaluate..."
                placeholderTextColor="#94A3B8"
              />

              {/* Upload Past Summaries */}
              <View style={{ marginTop: 14 }}>
                <DocumentUploadCard
                  title="Upload Past IVF Summaries & Photos"
                  subtitle="Discharge cards, stimulation charts, embryology lab sheets, semen CASA"
                  onPick={handleAttachReport}
                />

                {uploadedReports.map((d) => (
                  <View key={d.id} style={styles.reportRow}>
                    <Ionicons name="document-attach" size={16} color="#E11D48" />
                    <Text style={styles.reportName} numberOfLines={1}>
                      {d.name} ({d.size})
                    </Text>
                    <TouchableOpacity
                      onPress={() =>
                        setUploadedReports(uploadedReports.filter((item) => item.id !== d.id))
                      }
                    >
                      <Ionicons name="close-circle" size={18} color="#94A3B8" />
                    </TouchableOpacity>
                  </View>
                ))}
              </View>

              <TouchableOpacity
                style={styles.submitBtn}
                onPress={handleSubmitSecondOpinion}
                activeOpacity={0.85}
              >
                <Ionicons name="checkmark-circle-outline" size={18} color="#FFFFFF" />
                <Text style={styles.submitBtnText}>
                  Submit Dossier to {selectedSpecialist.name}
                </Text>
              </TouchableOpacity>
            </View>
          </>
        ) : (
          /* ACTIVE CASE STATUS VIEW */
          <View style={styles.statusViewWrap}>
            <View style={styles.statusHeaderCard}>
              <View style={styles.statusTopRow}>
                <Text style={styles.caseIdText}>Case #{activeCase.caseId}</Text>
                <StatusBadge status={activeCase.status} label={activeCase.statusLabel} />
              </View>

              <Text style={styles.caseDoctor}>Reviewing: {activeCase.specialistName}</Text>
              <Text style={styles.caseClinic}>{activeCase.clinic}</Text>

              <View style={styles.etaBox}>
                <Ionicons name="time" size={16} color="#0284C7" />
                <Text style={styles.etaText}>
                  Expected Video Review & Report: {activeCase.estimatedDelivery}
                </Text>
              </View>
            </View>

            <View style={styles.milestonesCard}>
              <Text style={styles.milestonesHeading}>Review Workflow Milestones</Text>
              {activeCase.clinicalMilestones.map((m, idx) => (
                <View key={idx} style={styles.mRow}>
                  <Ionicons
                    name={m.done ? 'checkmark-circle' : 'ellipse-outline'}
                    size={20}
                    color={m.done ? '#059669' : '#CBD5E1'}
                  />
                  <View style={styles.mInfo}>
                    <Text style={[styles.mStepText, m.done && styles.mStepDone]}>
                      {m.step}
                    </Text>
                    {m.date && <Text style={styles.mDateText}>{m.date}</Text>}
                  </View>
                </View>
              ))}
            </View>

            <TouchableOpacity
              style={styles.chatCoordinatorBtn}
              onPress={() => navigation.navigate('FertilityCoordinator')}
              activeOpacity={0.85}
            >
              <Ionicons name="chatbubbles-outline" size={16} color="#FFFFFF" />
              <Text style={styles.chatCoordinatorBtnText}>Message Care Coordinator</Text>
            </TouchableOpacity>
          </View>
        )}

        {isDesktopWeb && <WebFooter navigation={navigation} />}
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
  subHeaderTabs: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    paddingHorizontal: 16,
  },
  subTab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  subTabActive: {
    borderBottomColor: '#E11D48',
  },
  subTabText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748B',
  },
  subTabTextActive: {
    color: '#E11D48',
    fontWeight: '800',
  },
  scrollArea: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  desktopContainer: {
    maxWidth: 900,
    width: '100%',
    alignSelf: 'center',
    paddingHorizontal: 24,
  },
  introCard: {
    flexDirection: 'row',
    backgroundColor: '#FFF1F2',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#FECDD3',
    gap: 12,
    marginBottom: 16,
  },
  introCol: {
    flex: 1,
  },
  introTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#9F1239',
    marginBottom: 4,
  },
  introBody: {
    fontSize: 11,
    color: '#4C0519',
    lineHeight: 18,
  },
  sectionHeading: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 10,
  },
  docRow: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  docChipCard: {
    width: 140,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    alignItems: 'center',
    marginRight: 10,
  },
  docChipCardActive: {
    borderColor: '#E11D48',
    backgroundColor: '#FFF1F2',
  },
  docThumb: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#F1F5F9',
    marginBottom: 6,
  },
  docChipName: {
    fontSize: 12,
    fontWeight: '800',
    color: '#0F172A',
    textAlign: 'center',
  },
  docChipSpec: {
    fontSize: 10,
    color: '#64748B',
    marginTop: 2,
    textAlign: 'center',
  },
  feeTag: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginTop: 6,
  },
  feeTagText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#334155',
  },
  formCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    marginBottom: 20,
  },
  formHeading: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 12,
  },
  inputLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#334155',
    marginBottom: 6,
    marginTop: 10,
  },
  input: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 9,
    fontSize: 13,
    color: '#0F172A',
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  reportRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#F8FAFC',
    padding: 10,
    borderRadius: 8,
    marginTop: 6,
  },
  reportName: {
    fontSize: 11,
    color: '#1E293B',
    flex: 1,
  },
  submitBtn: {
    backgroundColor: '#E11D48',
    paddingVertical: 13,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 18,
  },
  submitBtnText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 13,
  },
  statusViewWrap: {
    gap: 14,
  },
  statusHeaderCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  statusTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  caseIdText: {
    fontSize: 15,
    fontWeight: '900',
    color: '#0F172A',
  },
  caseDoctor: {
    fontSize: 14,
    fontWeight: '800',
    color: '#E11D48',
  },
  caseClinic: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  etaBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#F0F9FF',
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#BAE6FD',
    marginTop: 12,
  },
  etaText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#0369A1',
  },
  milestonesCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    gap: 12,
  },
  milestonesHeading: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 4,
  },
  mRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  mInfo: {
    flex: 1,
  },
  mStepText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0F172A',
  },
  mStepDone: {
    color: '#059669',
  },
  mDateText: {
    fontSize: 10,
    color: '#64748B',
    marginTop: 2,
  },
  chatCoordinatorBtn: {
    backgroundColor: '#0F172A',
    paddingVertical: 13,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  chatCoordinatorBtnText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 13,
  },
});

export default SecondOpinionScreen;
