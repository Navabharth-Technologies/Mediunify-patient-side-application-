import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  Alert,
  StatusBar,
  Linking,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import colors from '../../theme/colors';

const SurgeryQuoteRequestScreen = ({ route, navigation }) => {
  const { hospital, surgery } = route.params || {};

  // Form State
  const [patientName, setPatientName] = useState('Hemanth Kumar');
  const [patientAge, setPatientAge] = useState('32');
  const [patientGender, setPatientGender] = useState('Male');
  const [patientPhone, setPatientPhone] = useState('+91 98765 43210');
  const [preferredDate, setPreferredDate] = useState('Within this week');
  const [hasInsurance, setHasInsurance] = useState('yes'); // 'yes' | 'no'
  const [insuranceProvider, setInsuranceProvider] = useState('Star Health Insurance');
  const [uploadedReport, setUploadedReport] = useState(null);
  const [medicalNotes, setMedicalNotes] = useState('');

  // Success Modal
  const [successModalVisible, setSuccessModalVisible] = useState(false);
  const [generatedRequestId, setGeneratedRequestId] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const datesOptions = [
    'Immediate (Next 24-48 Hrs)',
    'Within this week',
    'Next 1-2 weeks',
    'Just Inquiring / Planning',
  ];

  const handleUploadReport = () => {
    Alert.alert(
      'Upload Doctor Prescription / Scan',
      'Choose source to attach prescription, ultrasound, or CT scan report for the hospital surgical desk to review:',
      [
        {
          text: 'Take Photo (Camera)',
          onPress: () => {
            setUploadedReport({
              name: 'Dr_Prescription_Scan_Slip.jpg',
              size: '1.8 MB',
            });
          },
        },
        {
          text: 'Choose from Gallery',
          onPress: () => {
            setUploadedReport({
              name: 'Abdomen_Ultrasound_Report.pdf',
              size: '2.4 MB',
            });
          },
        },
        { text: 'Cancel', style: 'cancel' },
      ]
    );
  };

  const handleSubmitQuote = async () => {
    if (!patientName.trim() || !patientPhone.trim()) {
      Alert.alert('Required Fields', 'Please enter patient name and contact phone number.');
      return;
    }

    try {
      setSubmitting(true);
      const reqId = `SURG-REQ-${Math.floor(100000 + Math.random() * 900000)}`;
      setGeneratedRequestId(reqId);

      const quoteObject = {
        id: reqId,
        type: 'Surgery Quote Request',
        surgeryId: surgery?.id,
        surgeryName: surgery?.name || 'Surgical Procedure',
        hospitalId: hospital?.id,
        hospitalName: hospital?.name || 'Surgical Hospital',
        hospitalArea: hospital?.area || 'Mysore',
        patientName,
        patientAge,
        patientGender,
        patientPhone,
        preferredDate,
        hasInsurance: hasInsurance === 'yes',
        insuranceProvider: hasInsurance === 'yes' ? insuranceProvider : 'Self-Pay Package',
        uploadedReport: uploadedReport?.name || null,
        medicalNotes,
        status: 'Under Review by Hospital Desk',
        submittedAt: new Date().toISOString(),
        indicativeEstimate: surgery?.indicativeEstimate || 'Quote Pending Review',
      };

      // Save to AsyncStorage
      const existingQuotes = await AsyncStorage.getItem('@unnathi_surgery_requests');
      const quoteList = existingQuotes ? JSON.parse(existingQuotes) : [];
      quoteList.unshift(quoteObject);
      await AsyncStorage.setItem('@unnathi_surgery_requests', JSON.stringify(quoteList));

      // Save to main appointments list as well
      const existingAppts = await AsyncStorage.getItem('@unnathi_appointments');
      const apptList = existingAppts ? JSON.parse(existingAppts) : [];
      apptList.unshift({
        id: reqId,
        type: 'Surgery Quote Request',
        doctor: { name: hospital?.name, specialty: surgery?.categoryLabel },
        date: preferredDate,
        time: 'Quote Under Review',
        paymentStatus: 'Quote Pending',
        paidAmount: 0,
      });
      await AsyncStorage.setItem('@unnathi_appointments', JSON.stringify(apptList));

      setSubmitting(false);
      setSuccessModalVisible(true);
    } catch (e) {
      console.log('Error saving quote request:', e);
      setSubmitting(false);
      Alert.alert('Submission Error', 'Could not send quote request. Please try again.');
    }
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
          <Ionicons name="arrow-back" size={22} color={colors.secondary} />
        </TouchableOpacity>

        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Request Surgery Price Quote</Text>
          <Text style={styles.headerSubtitle}>Hospital Estimate & Insurance Pre-Approval</Text>
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* SELECTED PROCEDURE SUMMARY CARD */}
        <View style={styles.selectedSurgeryCard}>
          <View style={styles.selectedBadgeRow}>
            <View style={styles.selectedCategoryBadge}>
              <Text style={styles.selectedCategoryText}>
                {surgery?.categoryLabel || 'Surgical Procedure'}
              </Text>
            </View>
            <View style={styles.selectedStayBadge}>
              <Ionicons name="bed" size={11} color={colors.secondary} />
              <Text style={styles.selectedStayText}>{surgery?.stayRequired}</Text>
            </View>
          </View>

          <Text style={styles.selectedSurgeryTitle}>{surgery?.name}</Text>
          <Text style={styles.selectedHospitalName}>🏥 {hospital?.name}</Text>
          <Text style={styles.selectedHospitalArea}>{hospital?.address}</Text>

          <View style={styles.techniqueBanner}>
            <Ionicons name="sparkles" size={13} color={colors.primary} />
            <Text style={styles.techniqueText}>Technique: {surgery?.technique}</Text>
          </View>
        </View>

        {/* SECTION: PATIENT INFORMATION */}
        <Text style={styles.formSectionTitle}>1. Patient Details</Text>
        <View style={styles.formCard}>
          <Text style={styles.inputLabel}>Patient Full Name</Text>
          <TextInput
            style={styles.input}
            value={patientName}
            onChangeText={setPatientName}
            placeholder="Enter patient full name"
          />

          <View style={styles.formRow}>
            <View style={{ flex: 1, marginRight: 8 }}>
              <Text style={styles.inputLabel}>Age</Text>
              <TextInput
                style={styles.input}
                value={patientAge}
                onChangeText={setPatientAge}
                keyboardType="numeric"
                placeholder="Age"
              />
            </View>

            <View style={{ flex: 1, marginLeft: 8 }}>
              <Text style={styles.inputLabel}>Gender</Text>
              <View style={styles.genderRow}>
                {['Male', 'Female'].map((g) => (
                  <TouchableOpacity
                    key={g}
                    style={[
                      styles.genderPill,
                      patientGender === g && styles.genderPillActive,
                    ]}
                    onPress={() => setPatientGender(g)}
                  >
                    <Text
                      style={[
                        styles.genderPillText,
                        patientGender === g && styles.genderPillTextActive,
                      ]}
                    >
                      {g}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </View>

          <Text style={styles.inputLabel}>Contact Phone Number</Text>
          <TextInput
            style={styles.input}
            value={patientPhone}
            onChangeText={setPatientPhone}
            keyboardType="phone-pad"
            placeholder="Mobile number for quote SMS & WhatsApp"
          />
        </View>

        {/* SECTION: PREFERRED TIMELINE */}
        <Text style={styles.formSectionTitle}>2. Preferred Admission Timeline</Text>
        <View style={styles.formCard}>
          {datesOptions.map((d) => {
            const isSelected = preferredDate === d;
            return (
              <TouchableOpacity
                key={d}
                style={[styles.dateOptionRow, isSelected && styles.dateOptionRowActive]}
                onPress={() => setPreferredDate(d)}
              >
                <View
                  style={[
                    styles.radioOuter,
                    isSelected && { borderColor: colors.primary },
                  ]}
                >
                  {isSelected && <View style={styles.radioInner} />}
                </View>
                <Text
                  style={[
                    styles.dateOptionText,
                    isSelected && styles.dateOptionTextActive,
                  ]}
                >
                  {d}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* SECTION: INSURANCE & PAYMENT OPTION */}
        <Text style={styles.formSectionTitle}>3. Health Insurance & Cashless TPA</Text>
        <View style={styles.formCard}>
          <Text style={styles.inputLabel}>Do you have Health Insurance / Mediclaim?</Text>
          <View style={styles.insuranceChoiceRow}>
            <TouchableOpacity
              style={[
                styles.insuranceChoiceBtn,
                hasInsurance === 'yes' && styles.insuranceChoiceBtnActive,
              ]}
              onPress={() => setHasInsurance('yes')}
            >
              <Ionicons
                name="shield-checkmark"
                size={16}
                color={hasInsurance === 'yes' ? colors.primary : colors.textSecondary}
              />
              <Text
                style={[
                  styles.insuranceChoiceText,
                  hasInsurance === 'yes' && styles.insuranceChoiceTextActive,
                ]}
              >
                Yes, Cashless TPA
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.insuranceChoiceBtn,
                hasInsurance === 'no' && styles.insuranceChoiceBtnActive,
              ]}
              onPress={() => setHasInsurance('no')}
            >
              <Ionicons
                name="wallet-outline"
                size={16}
                color={hasInsurance === 'no' ? colors.secondary : colors.textSecondary}
              />
              <Text
                style={[
                  styles.insuranceChoiceText,
                  hasInsurance === 'no' && styles.insuranceChoiceTextActive,
                ]}
              >
                No, Self-Pay Package
              </Text>
            </TouchableOpacity>
          </View>

          {hasInsurance === 'yes' && (
            <View style={{ marginTop: 10 }}>
              <Text style={styles.inputLabel}>Insurance Provider / TPA Name</Text>
              <TextInput
                style={styles.input}
                value={insuranceProvider}
                onChangeText={setInsuranceProvider}
                placeholder="e.g. Star Health, HDFC ERGO, Medi Assist"
              />
            </View>
          )}
        </View>

        {/* SECTION: UPLOAD PRESCRIPTION OR SCAN */}
        <Text style={styles.formSectionTitle}>
          4. Attach Prescription or Scan Report (Optional)
        </Text>
        <View style={styles.formCard}>
          {uploadedReport ? (
            <View style={styles.uploadedFileRow}>
              <Ionicons name="document-attach" size={24} color={colors.primary} />
              <View style={{ flex: 1, marginLeft: 8 }}>
                <Text style={styles.uploadedFileName}>{uploadedReport.name}</Text>
                <Text style={styles.uploadedFileSize}>{uploadedReport.size} • Attached</Text>
              </View>
              <TouchableOpacity onPress={() => setUploadedReport(null)}>
                <Ionicons name="trash-outline" size={18} color={colors.coral} />
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity
              style={styles.uploadDottedBox}
              activeOpacity={0.8}
              onPress={handleUploadReport}
            >
              <Ionicons name="cloud-upload-outline" size={28} color={colors.primary} />
              <Text style={styles.uploadDottedTitle}>Upload Doctor's Advice Slip / Scan</Text>
              <Text style={styles.uploadDottedSub}>
                Helps hospital surgical desk give exact package quote & pre-authorization
              </Text>
            </TouchableOpacity>
          )}

          <Text style={[styles.inputLabel, { marginTop: 12 }]}>
            Additional Medical Notes / Symptoms
          </Text>
          <TextInput
            style={[styles.input, { height: 60, textAlignVertical: 'top', paddingTop: 8 }]}
            multiline
            value={medicalNotes}
            onChangeText={setMedicalNotes}
            placeholder="e.g. Existing diabetes, severe gallbladder pain, previous surgeries..."
          />
        </View>

        {/* SUBMIT BUTTON */}
        <TouchableOpacity
          style={styles.submitBtn}
          activeOpacity={0.88}
          onPress={handleSubmitQuote}
          disabled={submitting}
        >
          <Text style={styles.submitBtnText}>
            {submitting ? 'Sending Request to Hospital...' : 'Send Surgery Quote Request'}
          </Text>
          <Ionicons name="arrow-forward" size={16} color="#FFFFFF" />
        </TouchableOpacity>
      </ScrollView>

      {/* ==================================================
          QUOTE REQUEST CONFIRMATION MODAL
      ================================================== */}
      <Modal
        visible={successModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setSuccessModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.successCard}>
            <View style={styles.successIconCircle}>
              <Ionicons name="checkmark-done" size={32} color="#FFFFFF" />
            </View>

            <Text style={styles.successTitle}>Surgery Quote Request Sent!</Text>
            <Text style={styles.successSub}>
              Your request has been forwarded to the Surgical Care Desk at{' '}
              <Text style={{ fontWeight: '800', color: colors.secondary }}>
                {hospital?.name}
              </Text>
              .
            </Text>

            {/* REQUEST META CARD */}
            <View style={styles.quoteSummaryBox}>
              <View style={styles.quoteSummaryRow}>
                <Text style={styles.quoteSummaryLabel}>Request ID:</Text>
                <Text style={styles.quoteSummaryVal}>{generatedRequestId}</Text>
              </View>
              <View style={styles.quoteSummaryRow}>
                <Text style={styles.quoteSummaryLabel}>Procedure:</Text>
                <Text style={styles.quoteSummaryVal} numberOfLines={1}>
                  {surgery?.name}
                </Text>
              </View>
              <View style={styles.quoteSummaryRow}>
                <Text style={styles.quoteSummaryLabel}>Hospital:</Text>
                <Text style={styles.quoteSummaryVal}>{hospital?.name}</Text>
              </View>
              <View style={styles.quoteSummaryRow}>
                <Text style={styles.quoteSummaryLabel}>Status:</Text>
                <View style={styles.quoteStatusPill}>
                  <Text style={styles.quoteStatusPillText}>Under Review by Hospital Desk</Text>
                </View>
              </View>
            </View>

            {/* NEXT STEPS BANNER */}
            <View style={styles.nextStepsBanner}>
              <Ionicons name="time-outline" size={18} color={colors.primary} />
              <Text style={styles.nextStepsText}>
                The hospital surgical desk will review your details and send your customized cost estimate and TPA pre-authorization details via notification & SMS.
              </Text>
            </View>

            {/* ACTION BUTTONS */}
            <TouchableOpacity
              style={styles.modalPrimaryBtn}
              onPress={() => {
                setSuccessModalVisible(false);
                navigation.navigate('Bookings');
              }}
            >
              <Text style={styles.modalPrimaryBtnText}>View in My Bookings & Quotes</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.modalCallBtn}
              onPress={() => {
                setSuccessModalVisible(false);
                Linking.openURL(`tel:${hospital?.phone}`);
              }}
            >
              <Ionicons name="call" size={14} color={colors.secondary} />
              <Text style={styles.modalCallBtnText}>Call Hospital Desk Directly</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

// ==================================================
// STYLES
// ==================================================

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },

  // HEADER
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerCenter: {
    flex: 1,
    marginLeft: 12,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.secondary,
  },
  headerSubtitle: {
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: 1,
  },

  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },

  // SELECTED SURGERY CARD
  selectedSurgeryCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1.5,
    borderColor: colors.lightTeal,
    marginBottom: 16,
  },
  selectedBadgeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  selectedCategoryBadge: {
    backgroundColor: colors.lightTeal,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  selectedCategoryText: {
    fontSize: 10,
    fontWeight: '800',
    color: colors.primary,
  },
  selectedStayBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 6,
    gap: 4,
  },
  selectedStayText: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.secondary,
  },
  selectedSurgeryTitle: {
    fontSize: 15,
    fontWeight: '900',
    color: colors.secondary,
    lineHeight: 20,
    marginBottom: 4,
  },
  selectedHospitalName: {
    fontSize: 13,
    fontWeight: '800',
    color: colors.primary,
  },
  selectedHospitalArea: {
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: 1,
  },
  techniqueBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 5,
    marginTop: 8,
    gap: 4,
  },
  techniqueText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.text,
  },

  // FORM SECTION
  formSectionTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: colors.secondary,
    marginBottom: 8,
  },
  formCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.secondary,
    marginBottom: 4,
  },
  input: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 10,
    paddingHorizontal: 12,
    height: 42,
    fontSize: 13,
    color: colors.text,
    marginBottom: 10,
  },
  formRow: {
    flexDirection: 'row',
  },
  genderRow: {
    flexDirection: 'row',
    gap: 6,
  },
  genderPill: {
    flex: 1,
    height: 42,
    borderRadius: 10,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  genderPillActive: {
    backgroundColor: colors.lightTeal,
    borderColor: colors.primary,
  },
  genderPillText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textSecondary,
  },
  genderPillTextActive: {
    color: colors.primary,
  },

  // DATE OPTIONS
  dateOptionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 9,
    paddingHorizontal: 8,
    borderRadius: 8,
    marginBottom: 4,
  },
  dateOptionRowActive: {
    backgroundColor: '#EFF6FF',
  },
  radioOuter: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 1.5,
    borderColor: '#94A3B8',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  radioInner: {
    width: 9,
    height: 9,
    borderRadius: 4.5,
    backgroundColor: colors.primary,
  },
  dateOptionText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.text,
  },
  dateOptionTextActive: {
    fontWeight: '800',
    color: colors.secondary,
  },

  // INSURANCE CHOICE
  insuranceChoiceRow: {
    flexDirection: 'row',
    gap: 8,
  },
  insuranceChoiceBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 10,
    paddingVertical: 10,
    gap: 5,
  },
  insuranceChoiceBtnActive: {
    backgroundColor: colors.lightTeal,
    borderColor: colors.primary,
  },
  insuranceChoiceText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textSecondary,
  },
  insuranceChoiceTextActive: {
    color: colors.primary,
    fontWeight: '800',
  },

  // UPLOAD
  uploadDottedBox: {
    borderWidth: 1.5,
    borderColor: colors.primary,
    borderStyle: 'dashed',
    borderRadius: 12,
    backgroundColor: colors.lightTeal,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  uploadDottedTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.secondary,
    marginTop: 6,
  },
  uploadDottedSub: {
    fontSize: 10,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: 2,
  },
  uploadedFileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ECFDF5',
    borderRadius: 10,
    padding: 10,
  },
  uploadedFileName: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.secondary,
  },
  uploadedFileSize: {
    fontSize: 10,
    color: '#059669',
    marginTop: 1,
  },

  submitBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    paddingVertical: 14,
    borderRadius: 14,
    gap: 8,
    marginTop: 8,
  },
  submitBtnText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#FFFFFF',
  },

  // SUCCESS MODAL
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
    justifyContent: 'flex-end',
  },
  successCard: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    paddingBottom: 30,
    alignItems: 'center',
  },
  successIconCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#059669',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  successTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: colors.secondary,
  },
  successSub: {
    fontSize: 12,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: 4,
    lineHeight: 17,
  },
  quoteSummaryBox: {
    width: '100%',
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 12,
    marginVertical: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 6,
  },
  quoteSummaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  quoteSummaryLabel: {
    fontSize: 11,
    color: colors.textSecondary,
  },
  quoteSummaryVal: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.secondary,
    maxWidth: '65%',
  },
  quoteStatusPill: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  quoteStatusPillText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#D97706',
  },
  nextStepsBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EFF6FF',
    borderRadius: 10,
    padding: 10,
    marginBottom: 16,
    gap: 8,
  },
  nextStepsText: {
    flex: 1,
    fontSize: 11,
    color: colors.secondary,
    lineHeight: 15,
  },
  modalPrimaryBtn: {
    width: '100%',
    backgroundColor: colors.primary,
    paddingVertical: 13,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 8,
  },
  modalPrimaryBtnText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  modalCallBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    gap: 6,
  },
  modalCallBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.secondary,
  },
});

export default SurgeryQuoteRequestScreen;
