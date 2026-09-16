import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Platform,
  useWindowDimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ConsentItem } from '../../../components/fertility';
import { showAlert } from '../../../utils/alert';
import WebFooter from '../../../components/web/WebFooter';

const CONSENT_ITEMS = [
  {
    id: 'art-act-compliance',
    title: 'Assisted Reproductive Technology (ART) Act 2021 Compliance',
    summary: 'I confirm that all provided marital, identity, and clinical information is authentic under the Indian ART (Regulation) Act, 2021.',
    legalNotice: 'Pursuant to Sections 21-27 of the ART (Regulation) Act 2021, gamete handling, embryology documentation, and identity verification are maintained under strict statutory audits with mandatory national registry reporting.',
    required: true,
  },
  {
    id: 'confidential-vault',
    title: 'Confidential Medical Records & Embryology Lab Sharing',
    summary: 'I authorize MediUnify and the treating embryology team to review my uploaded diagnostic reports, scans, and semen analyses solely for treatment evaluation.',
    legalNotice: 'Patient health records are encrypted at rest with AES-256 and accessible strictly on a need-to-know basis by authorized clinicians and certified embryologists.',
    required: true,
  },
  {
    id: 'genetic-counseling',
    title: 'Pre-Treatment Clinical & Genetic Counseling Acknowledgment',
    summary: 'I acknowledge that an initial specialist consult will explain procedure probabilities, multi-fetal risks, and alternative options prior to invasive interventions.',
    legalNotice: 'Informed consent is continuous throughout stimulation, oocyte pick-up, cryopreservation, and transfer protocols. You maintain the right to withdraw or postpone consent at any pre-procedure juncture.',
    required: true,
  },
  {
    id: 'teleconsult-terms',
    title: 'Digital Care Coordination & Tele-Health Protocol',
    summary: 'I consent to receive medication alerts, scan schedule updates, and lab reports via verified SMS, WhatsApp, and encrypted app notifications.',
    legalNotice: 'Emergency queries must be addressed to the 24x7 hospital helpline. Tele-health check-ins supplement but do not replace mandatory in-person ultrasound tracking visits.',
    required: false,
  },
];

const FertilityConsentScreen = ({ navigation, route }) => {
  const { width } = useWindowDimensions();
  const isDesktopWeb = Platform.OS === 'web' && width >= 992;

  const careRequest = route?.params?.careRequest || {};

  const [consents, setConsents] = useState({
    'art-act-compliance': true,
    'confidential-vault': true,
    'genetic-counseling': false,
    'teleconsult-terms': true,
  });

  const [digitalSignConfirmed, setDigitalSignConfirmed] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [referenceId, setReferenceId] = useState('');

  const toggleConsent = (id, val) => {
    setConsents((prev) => ({ ...prev, [id]: val }));
  };

  const handleFinalSubmit = () => {
    // Validate required consents
    const missingRequired = CONSENT_ITEMS.filter(
      (item) => item.required && !consents[item.id]
    );

    if (missingRequired.length > 0) {
      showAlert(
        'Consent Required',
        `Please check and agree to: "${missingRequired[0].title}" to proceed in compliance with statutory clinical guidelines.`
      );
      return;
    }

    if (!digitalSignConfirmed) {
      showAlert(
        'Signature Confirmation',
        'Please tick the digital signature confirmation checkbox at the bottom.'
      );
      return;
    }

    const generatedRef = `ART-MYS-${Math.floor(100000 + Math.random() * 900000)}`;
    setReferenceId(generatedRef);
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.successContainer}>
          <View style={styles.successIconCircle}>
            <Ionicons name="checkmark-circle" size={56} color="#059669" />
          </View>
          <Text style={styles.successHeading}>Care Dossier & Consent Submitted!</Text>
          <Text style={styles.successRefText}>Token Ref: {referenceId}</Text>
          <Text style={styles.successDesc}>
            Your confidential file has been securely routed to the senior reproductive endocrinology team at{' '}
            <Text style={{ fontWeight: '800' }}>
              {careRequest.clinic?.name || 'Nova IVF Fertility Centre'}
            </Text>
            . Your care coordinator will verify your documents and send your schedule confirmation within 2 hours.
          </Text>

          <View style={styles.successSummaryBox}>
            <View style={styles.successRow}>
              <Text style={styles.successRowLabel}>Primary Patient:</Text>
              <Text style={styles.successRowVal}>{careRequest.patientName || 'Ananya Sharma'}</Text>
            </View>
            <View style={styles.successRow}>
              <Text style={styles.successRowLabel}>Consultation Format:</Text>
              <Text style={styles.successRowVal}>{careRequest.consultMode || 'In-Clinic'}</Text>
            </View>
            <View style={styles.successRow}>
              <Text style={styles.successRowLabel}>Assigned Coordinator:</Text>
              <Text style={styles.successRowVal}>Swathi R. Nair (Care Buddy)</Text>
            </View>
          </View>

          <View style={styles.successBtnRow}>
            <TouchableOpacity
              style={styles.trackerBtn}
              onPress={() => navigation.navigate('IVFJourney')}
              activeOpacity={0.85}
            >
              <Ionicons name="pulse-outline" size={16} color="#FFFFFF" />
              <Text style={styles.trackerBtnText}>View Treatment Tracker</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.homeBtn}
              onPress={() => navigation.navigate('FertilityIvf')}
              activeOpacity={0.85}
            >
              <Text style={styles.homeBtnText}>Return to Fertility Hub</Text>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    );
  }

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
          <Text style={styles.headerTitle}>Informed Consent & Sharing</Text>
          <Text style={styles.headerSubtitle}>ICMR & ART Act 2021 Guidelines</Text>
        </View>
      </View>

      <ScrollView
        style={styles.scrollArea}
        contentContainerStyle={[
          styles.scrollContent,
          isDesktopWeb && styles.desktopContainer,
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.complianceNotice}>
          <Ionicons name="shield-checkmark" size={22} color="#059669" />
          <View style={styles.complianceCol}>
            <Text style={styles.complianceTitle}>Statutory ART Medical Consent</Text>
            <Text style={styles.complianceBody}>
              Indian assisted reproductive guidelines require documented informed consent prior to clinical file intake. Please review and acknowledge the terms below.
            </Text>
          </View>
        </View>

        {/* Consent Items */}
        {CONSENT_ITEMS.map((item) => (
          <ConsentItem
            key={item.id}
            id={item.id}
            title={item.title}
            summary={item.summary}
            legalNotice={item.legalNotice}
            required={item.required}
            isChecked={!!consents[item.id]}
            onToggle={toggleConsent}
          />
        ))}

        {/* Digital Signature Confirmation Checkbox */}
        <TouchableOpacity
          style={styles.signCard}
          onPress={() => setDigitalSignConfirmed(!digitalSignConfirmed)}
          activeOpacity={0.8}
        >
          <Ionicons
            name={digitalSignConfirmed ? 'checkbox' : 'square-outline'}
            size={22}
            color={digitalSignConfirmed ? '#E11D48' : '#94A3B8'}
          />
          <View style={styles.signTextCol}>
            <Text style={styles.signTitle}>Digital Patient Confirmation</Text>
            <Text style={styles.signSub}>
              I confirm that I am {careRequest.patientName || 'the authorized patient'}, and by ticking this box, I electronically sign and validate this clinical care request.
            </Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.submitBtn, !digitalSignConfirmed && styles.submitBtnDisabled]}
          onPress={handleFinalSubmit}
          activeOpacity={0.85}
        >
          <Ionicons name="lock-closed" size={16} color="#FFFFFF" />
          <Text style={styles.submitBtnText}>Submit Care Request & Dossier</Text>
        </TouchableOpacity>

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
  complianceNotice: {
    flexDirection: 'row',
    backgroundColor: '#ECFDF5',
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#A7F3D0',
    gap: 12,
    marginBottom: 16,
  },
  complianceCol: {
    flex: 1,
  },
  complianceTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#065F46',
  },
  complianceBody: {
    fontSize: 11,
    color: '#047857',
    marginTop: 3,
    lineHeight: 16,
  },
  signCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    gap: 12,
    marginTop: 8,
    marginBottom: 20,
  },
  signTextCol: {
    flex: 1,
  },
  signTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0F172A',
  },
  signSub: {
    fontSize: 11,
    color: '#475569',
    marginTop: 2,
    lineHeight: 16,
  },
  submitBtn: {
    backgroundColor: '#E11D48',
    paddingVertical: 14,
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    shadowColor: '#E11D48',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 3,
  },
  submitBtnDisabled: {
    opacity: 0.6,
  },
  submitBtnText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 14,
  },
  successContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  successIconCircle: {
    width: 84,
    height: 84,
    borderRadius: 42,
    backgroundColor: '#ECFDF5',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  successHeading: {
    fontSize: 20,
    fontWeight: '900',
    color: '#0F172A',
    textAlign: 'center',
    marginBottom: 6,
  },
  successRefText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#E11D48',
    backgroundColor: '#FFF1F2',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    marginBottom: 14,
  },
  successDesc: {
    fontSize: 13,
    color: '#475569',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 20,
    maxWidth: 480,
  },
  successSummaryBox: {
    width: '100%',
    maxWidth: 480,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 8,
    marginBottom: 24,
  },
  successRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  successRowLabel: {
    fontSize: 12,
    color: '#64748B',
  },
  successRowVal: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0F172A',
  },
  successBtnRow: {
    width: '100%',
    maxWidth: 480,
    gap: 10,
  },
  trackerBtn: {
    backgroundColor: '#E11D48',
    paddingVertical: 13,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  trackerBtnText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 13,
  },
  homeBtn: {
    backgroundColor: '#F1F5F9',
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  homeBtnText: {
    color: '#475569',
    fontWeight: '700',
    fontSize: 13,
  },
});

export default FertilityConsentScreen;
