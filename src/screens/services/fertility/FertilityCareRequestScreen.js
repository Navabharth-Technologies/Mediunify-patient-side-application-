import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Platform,
  useWindowDimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { partnerFertilityCenters, fertilitySpecialists } from '../../../data/fertilityData';
import { ProgressTracker, DocumentUploadCard } from '../../../components/fertility';
import { showAlert } from '../../../utils/alert';
import WebFooter from '../../../components/web/WebFooter';

const STEP_LABELS = ['Couple', 'History', 'Documents', 'Clinic', 'Review'];

const CONDITIONS = [
  'PCOS / PCOD',
  'Low AMH / Low Reserve',
  'Male Factor / Low Motility',
  'Tubal Blockage',
  'Endometriosis / Adenomyosis',
  'Recurrent Pregnancy Loss',
  'Previous Failed IUI/IVF',
  'Unexplained Infertility',
];

const FertilityCareRequestScreen = ({ navigation, route }) => {
  const { width } = useWindowDimensions();
  const isDesktopWeb = Platform.OS === 'web' && width >= 992;

  const preselectedClinic = route?.params?.preferredClinic || partnerFertilityCenters[0];

  const [step, setStep] = useState(1);

  // Step 1: Couple Info
  const [patientName, setPatientName] = useState('Ananya Sharma');
  const [patientAge, setPatientAge] = useState('29');
  const [partnerName, setPartnerName] = useState('Ramesh Sharma');
  const [partnerAge, setPartnerAge] = useState('32');
  const [contactPhone, setContactPhone] = useState('+91 98450 12345');
  const [email, setEmail] = useState('ananya.sharma@example.com');
  const [yearsTrying, setYearsTrying] = useState('2');

  // Step 2: Medical History
  const [selectedConditions, setSelectedConditions] = useState(['PCOS / PCOD']);
  const [previousIuiCycles, setPreviousIuiCycles] = useState('1');
  const [previousIvfCycles, setPreviousIvfCycles] = useState('0');
  const [notes, setNotes] = useState('Trying naturally for 2 years with irregular cycles.');

  // Step 3: Documents
  const [docs, setDocs] = useState([
    { id: '1', name: 'Pelvic_Ultrasound_Scan.pdf', size: '2.4 MB' },
    { id: '2', name: 'Semen_Analysis_CASA.pdf', size: '1.2 MB' },
  ]);

  // Step 4: Clinic & Mode
  const [selectedClinic, setSelectedClinic] = useState(preselectedClinic);
  const [selectedDoctor, setSelectedDoctor] = useState(fertilitySpecialists[0]);
  const [consultMode, setConsultMode] = useState('In-Clinic'); // 'In-Clinic' | 'Video Consult'

  const toggleCondition = (cond) => {
    if (selectedConditions.includes(cond)) {
      setSelectedConditions(selectedConditions.filter((c) => c !== cond));
    } else {
      setSelectedConditions([...selectedConditions, cond]);
    }
  };

  const handlePickDocument = (docType) => {
    const newDoc = {
      id: Date.now().toString(),
      name: `${docType}_Report_${Date.now().toString().slice(-4)}.pdf`,
      size: '1.5 MB',
    };
    setDocs([...docs, newDoc]);
    showAlert('Attached', `${newDoc.name} has been added to your encrypted care dossier.`);
  };

  const handleRemoveDoc = (id) => {
    setDocs(docs.filter((d) => d.id !== id));
  };

  const handleNextStep = () => {
    if (step === 1) {
      if (!patientName.trim() || !contactPhone.trim() || !patientAge.trim()) {
        showAlert('Required', 'Please fill in patient name, age, and phone number.');
        return;
      }
    }
    if (step < 5) {
      setStep(step + 1);
    } else {
      // Step 5 Review -> Proceed to Consent Screen
      const careRequestPayload = {
        id: `CR-${Date.now().toString().slice(-6)}`,
        patientName,
        partnerName,
        patientAge,
        partnerAge,
        contactPhone,
        email,
        yearsTrying,
        selectedConditions,
        previousIuiCycles,
        previousIvfCycles,
        notes,
        documents: docs,
        clinic: selectedClinic,
        doctor: selectedDoctor,
        consultMode,
      };
      navigation.navigate('FertilityConsent', { careRequest: careRequestPayload });
    }
  };

  const handlePrevStep = () => {
    if (step > 1) {
      setStep(step - 1);
    } else {
      navigation.goBack();
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={handlePrevStep}
          style={styles.backBtn}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Ionicons name="arrow-back" size={22} color="#0F172A" />
        </TouchableOpacity>
        <View style={styles.headerTitleWrap}>
          <Text style={styles.headerTitle}>Fertility Care Request</Text>
          <Text style={styles.headerSubtitle}>
            Step {step} of 5: {STEP_LABELS[step - 1]}
          </Text>
        </View>
      </View>

      {/* Progress Bar */}
      <View style={styles.progressWrap}>
        <ProgressTracker
          currentStep={step}
          totalSteps={5}
          stepLabels={STEP_LABELS}
          activeColor="#E11D48"
        />
      </View>

      <ScrollView
        style={styles.scrollArea}
        contentContainerStyle={[
          styles.scrollContent,
          isDesktopWeb && styles.desktopContainer,
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* ============================================================
            STEP 1: PATIENT & COUPLE INFORMATION
        ============================================================ */}
        {step === 1 && (
          <View style={styles.stepCard}>
            <Text style={styles.stepHeading}>Patient & Couple Information</Text>
            <Text style={styles.stepSubtext}>
              All personal details are stored in your encrypted, HIPAA-compliant patient vault.
            </Text>

            <Text style={styles.inputLabel}>Female Partner / Primary Patient Name *</Text>
            <TextInput
              style={styles.input}
              value={patientName}
              onChangeText={setPatientName}
              placeholder="Full name"
              placeholderTextColor="#94A3B8"
            />

            <View style={styles.twoColRow}>
              <View style={styles.colHalf}>
                <Text style={styles.inputLabel}>Age (Female) *</Text>
                <TextInput
                  style={styles.input}
                  value={patientAge}
                  onChangeText={setPatientAge}
                  keyboardType="numeric"
                  placeholder="e.g. 29"
                  placeholderTextColor="#94A3B8"
                />
              </View>
              <View style={styles.colHalf}>
                <Text style={styles.inputLabel}>Years Married / Trying</Text>
                <TextInput
                  style={styles.input}
                  value={yearsTrying}
                  onChangeText={setYearsTrying}
                  keyboardType="numeric"
                  placeholder="e.g. 2"
                  placeholderTextColor="#94A3B8"
                />
              </View>
            </View>

            <Text style={styles.inputLabel}>Male Partner Name</Text>
            <TextInput
              style={styles.input}
              value={partnerName}
              onChangeText={setPartnerName}
              placeholder="Partner full name"
              placeholderTextColor="#94A3B8"
            />

            <View style={styles.twoColRow}>
              <View style={styles.colHalf}>
                <Text style={styles.inputLabel}>Age (Male)</Text>
                <TextInput
                  style={styles.input}
                  value={partnerAge}
                  onChangeText={setPartnerAge}
                  keyboardType="numeric"
                  placeholder="e.g. 32"
                  placeholderTextColor="#94A3B8"
                />
              </View>
              <View style={styles.colHalf}>
                <Text style={styles.inputLabel}>Confidential Mobile *</Text>
                <TextInput
                  style={styles.input}
                  value={contactPhone}
                  onChangeText={setContactPhone}
                  keyboardType="phone-pad"
                  placeholder="10-digit number"
                  placeholderTextColor="#94A3B8"
                />
              </View>
            </View>

            <Text style={styles.inputLabel}>Email Address</Text>
            <TextInput
              style={styles.input}
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              placeholder="name@example.com"
              placeholderTextColor="#94A3B8"
            />
          </View>
        )}

        {/* ============================================================
            STEP 2: MEDICAL HISTORY
        ============================================================ */}
        {step === 2 && (
          <View style={styles.stepCard}>
            <Text style={styles.stepHeading}>Fertility History & Diagnoses</Text>
            <Text style={styles.stepSubtext}>
              Select any existing conditions or previous treatments to help specialists customize your protocol.
            </Text>

            <Text style={styles.inputLabel}>Known Conditions / Diagnoses:</Text>
            <View style={styles.conditionChipsRow}>
              {CONDITIONS.map((cond) => {
                const isSelected = selectedConditions.includes(cond);
                return (
                  <TouchableOpacity
                    key={cond}
                    style={[
                      styles.conditionChip,
                      isSelected && styles.conditionChipActive,
                    ]}
                    onPress={() => toggleCondition(cond)}
                    activeOpacity={0.8}
                  >
                    <Ionicons
                      name={isSelected ? 'checkmark-circle' : 'add-circle-outline'}
                      size={15}
                      color={isSelected ? '#FFFFFF' : '#64748B'}
                    />
                    <Text
                      style={[
                        styles.conditionChipText,
                        isSelected && styles.conditionChipTextActive,
                      ]}
                    >
                      {cond}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <View style={styles.twoColRow}>
              <View style={styles.colHalf}>
                <Text style={styles.inputLabel}>Previous IUI Cycles</Text>
                <TextInput
                  style={styles.input}
                  value={previousIuiCycles}
                  onChangeText={setPreviousIuiCycles}
                  keyboardType="numeric"
                  placeholder="0"
                  placeholderTextColor="#94A3B8"
                />
              </View>
              <View style={styles.colHalf}>
                <Text style={styles.inputLabel}>Previous IVF Cycles</Text>
                <TextInput
                  style={styles.input}
                  value={previousIvfCycles}
                  onChangeText={setPreviousIvfCycles}
                  keyboardType="numeric"
                  placeholder="0"
                  placeholderTextColor="#94A3B8"
                />
              </View>
            </View>

            <Text style={styles.inputLabel}>Doctor Notes & Context</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={notes}
              onChangeText={setNotes}
              multiline
              numberOfLines={4}
              placeholder="Describe cycle regularity, surgeries, medications, or specific queries..."
              placeholderTextColor="#94A3B8"
            />
          </View>
        )}

        {/* ============================================================
            STEP 3: DOCUMENT UPLOAD
        ============================================================ */}
        {step === 3 && (
          <View style={styles.stepCard}>
            <Text style={styles.stepHeading}>Prior Reports & Investigations</Text>
            <Text style={styles.stepSubtext}>
              Upload existing ultrasound scans, semen analysis, or hormone panels for faster review.
            </Text>

            <DocumentUploadCard
              title="Pelvic Ultrasound / HSG Scans"
              subtitle="Transvaginal sonography, uterine cavity or tubal patency reports"
              onPick={() => handlePickDocument('Ultrasound')}
            />

            <DocumentUploadCard
              title="Semen Analysis CASA / DFI"
              subtitle="Male factor evaluation, motility & Kruger morphology tests"
              onPick={() => handlePickDocument('Semen_Analysis')}
            />

            <DocumentUploadCard
              title="Hormonal Profile (AMH, FSH, LH)"
              subtitle="Day 2/3 blood tests or thyroid panel"
              onPick={() => handlePickDocument('Hormones')}
            />

            {docs.length > 0 && (
              <View style={styles.attachedBox}>
                <Text style={styles.attachedTitle}>
                  Attached Documents ({docs.length})
                </Text>
                {docs.map((d) => (
                  <View key={d.id} style={styles.attachedItem}>
                    <Ionicons name="document-attach" size={16} color="#E11D48" />
                    <Text style={styles.attachedName} numberOfLines={1}>
                      {d.name} ({d.size})
                    </Text>
                    <TouchableOpacity onPress={() => handleRemoveDoc(d.id)}>
                      <Ionicons name="close-circle" size={18} color="#94A3B8" />
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            )}
          </View>
        )}

        {/* ============================================================
            STEP 4: CLINIC & DOCTOR SELECTION
        ============================================================ */}
        {step === 4 && (
          <View style={styles.stepCard}>
            <Text style={styles.stepHeading}>Preferred Centre & Consultation Mode</Text>
            <Text style={styles.stepSubtext}>
              Choose your primary fertility hospital and consultation format.
            </Text>

            <Text style={styles.inputLabel}>Consultation Mode</Text>
            <View style={styles.modeToggleRow}>
              <TouchableOpacity
                style={[styles.modeBtn, consultMode === 'In-Clinic' && styles.modeBtnActive]}
                onPress={() => setConsultMode('In-Clinic')}
              >
                <Ionicons
                  name="business-outline"
                  size={16}
                  color={consultMode === 'In-Clinic' ? '#E11D48' : '#64748B'}
                />
                <Text
                  style={[
                    styles.modeBtnText,
                    consultMode === 'In-Clinic' && styles.modeBtnTextActive,
                  ]}
                >
                  In-Clinic Consultation
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modeBtn, consultMode === 'Video Consult' && styles.modeBtnActive]}
                onPress={() => setConsultMode('Video Consult')}
              >
                <Ionicons
                  name="videocam-outline"
                  size={16}
                  color={consultMode === 'Video Consult' ? '#E11D48' : '#64748B'}
                />
                <Text
                  style={[
                    styles.modeBtnText,
                    consultMode === 'Video Consult' && styles.modeBtnTextActive,
                  ]}
                >
                  Private Video Call
                </Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.inputLabel}>Select Primary Clinic</Text>
            <View style={styles.clinicPickerWrap}>
              {partnerFertilityCenters.map((clinic) => (
                <TouchableOpacity
                  key={clinic.id}
                  style={[
                    styles.clinicOption,
                    selectedClinic.id === clinic.id && styles.clinicOptionActive,
                  ]}
                  onPress={() => setSelectedClinic(clinic)}
                  activeOpacity={0.8}
                >
                  <Ionicons
                    name={selectedClinic.id === clinic.id ? 'radio-button-on' : 'radio-button-off'}
                    size={18}
                    color={selectedClinic.id === clinic.id ? '#E11D48' : '#94A3B8'}
                  />
                  <View style={styles.clinicOptInfo}>
                    <Text style={styles.clinicOptName}>{clinic.name}</Text>
                    <Text style={styles.clinicOptLoc}>{clinic.address}</Text>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {/* ============================================================
            STEP 5: REVIEW CARE REQUEST
        ============================================================ */}
        {step === 5 && (
          <View style={styles.stepCard}>
            <Text style={styles.stepHeading}>Review Your Care Dossier</Text>
            <Text style={styles.stepSubtext}>
              Please verify your submitted clinical profile before proceeding to statutory consent.
            </Text>

            <View style={styles.reviewBox}>
              <View style={styles.reviewHeaderRow}>
                <Text style={styles.reviewSectionTitle}>Patient Profile</Text>
                <TouchableOpacity onPress={() => setStep(1)}>
                  <Text style={styles.editBtnText}>Edit</Text>
                </TouchableOpacity>
              </View>
              <Text style={styles.reviewVal}>
                {patientName} ({patientAge} Yrs) & {partnerName} ({partnerAge} Yrs)
              </Text>
              <Text style={styles.reviewValSub}>
                📞 {contactPhone} • ✉️ {email}
              </Text>
              <Text style={styles.reviewValSub}>
                Married / Trying: {yearsTrying} Years
              </Text>
            </View>

            <View style={styles.reviewBox}>
              <View style={styles.reviewHeaderRow}>
                <Text style={styles.reviewSectionTitle}>Medical History</Text>
                <TouchableOpacity onPress={() => setStep(2)}>
                  <Text style={styles.editBtnText}>Edit</Text>
                </TouchableOpacity>
              </View>
              <Text style={styles.reviewVal}>
                Conditions: {selectedConditions.join(', ') || 'None declared'}
              </Text>
              <Text style={styles.reviewValSub}>
                Previous Cycles: {previousIuiCycles} IUI • {previousIvfCycles} IVF
              </Text>
              {notes ? (
                <Text style={styles.reviewValSub}>Notes: "{notes}"</Text>
              ) : null}
            </View>

            <View style={styles.reviewBox}>
              <View style={styles.reviewHeaderRow}>
                <Text style={styles.reviewSectionTitle}>Preferred Centre & Mode</Text>
                <TouchableOpacity onPress={() => setStep(4)}>
                  <Text style={styles.editBtnText}>Edit</Text>
                </TouchableOpacity>
              </View>
              <Text style={styles.reviewVal}>{selectedClinic.name}</Text>
              <Text style={styles.reviewValSub}>
                Mode: {consultMode} • Attached Files: {docs.length}
              </Text>
            </View>
          </View>
        )}

        {/* Action Button Row */}
        <View style={styles.actionBtnRow}>
          {step > 1 && (
            <TouchableOpacity
              style={styles.prevBtn}
              onPress={handlePrevStep}
              activeOpacity={0.8}
            >
              <Text style={styles.prevBtnText}>Previous</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={styles.nextBtn}
            onPress={handleNextStep}
            activeOpacity={0.85}
          >
            <Text style={styles.nextBtnText}>
              {step === 5 ? 'Proceed to Consent & Sign →' : 'Continue'}
            </Text>
          </TouchableOpacity>
        </View>

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
  progressWrap: {
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  scrollArea: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  desktopContainer: {
    maxWidth: 800,
    width: '100%',
    alignSelf: 'center',
    paddingHorizontal: 24,
  },
  stepCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 18,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    marginBottom: 16,
  },
  stepHeading: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 4,
  },
  stepSubtext: {
    fontSize: 12,
    color: '#64748B',
    lineHeight: 18,
    marginBottom: 16,
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
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 13,
    color: '#0F172A',
  },
  twoColRow: {
    flexDirection: 'row',
    gap: 10,
  },
  colHalf: {
    flex: 1,
  },
  conditionChipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 8,
  },
  conditionChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
  },
  conditionChipActive: {
    backgroundColor: '#E11D48',
    borderColor: '#E11D48',
  },
  conditionChipText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#475569',
  },
  conditionChipTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  attachedBox: {
    marginTop: 14,
    backgroundColor: '#FFF1F2',
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#FECDD3',
  },
  attachedTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: '#9F1239',
    marginBottom: 8,
  },
  attachedItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  attachedName: {
    fontSize: 12,
    color: '#0F172A',
    flex: 1,
  },
  modeToggleRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 14,
  },
  modeBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    paddingVertical: 12,
    borderRadius: 10,
  },
  modeBtnActive: {
    backgroundColor: '#FFF1F2',
    borderColor: '#E11D48',
  },
  modeBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
  },
  modeBtnTextActive: {
    color: '#E11D48',
    fontWeight: '700',
  },
  clinicPickerWrap: {
    gap: 8,
  },
  clinicOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 12,
    borderRadius: 12,
  },
  clinicOptionActive: {
    backgroundColor: '#FFF1F2',
    borderColor: '#FECDD3',
  },
  clinicOptInfo: {
    flex: 1,
  },
  clinicOptName: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
  },
  clinicOptLoc: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
  },
  reviewBox: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
  },
  reviewHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  reviewSectionTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: '#0F172A',
  },
  editBtnText: {
    fontSize: 11,
    color: '#E11D48',
    fontWeight: '700',
  },
  reviewVal: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1E293B',
  },
  reviewValSub: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
  },
  actionBtnRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 4,
  },
  prevBtn: {
    flex: 1,
    backgroundColor: '#F1F5F9',
    paddingVertical: 13,
    borderRadius: 12,
    alignItems: 'center',
  },
  prevBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#475569',
  },
  nextBtn: {
    flex: 2,
    backgroundColor: '#E11D48',
    paddingVertical: 13,
    borderRadius: 12,
    alignItems: 'center',
  },
  nextBtnText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#FFFFFF',
  },
});

export default FertilityCareRequestScreen;
