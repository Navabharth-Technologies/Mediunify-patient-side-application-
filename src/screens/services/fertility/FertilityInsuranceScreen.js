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
import { fertilityInsuranceDetails } from '../../../data/fertilityData';
import { showAlert } from '../../../utils/alert';
import WebFooter from '../../../components/web/WebFooter';

const FertilityInsuranceScreen = ({ navigation }) => {
  const { width } = useWindowDimensions();
  const isDesktopWeb = Platform.OS === 'web' && width >= 992;

  const [insurerName, setInsurerName] = useState('Star Health');
  const [policyNumber, setPolicyNumber] = useState('');
  const [patientName, setPatientName] = useState('Ananya Sharma');
  const [phone, setPhone] = useState('+91 98450 12345');

  const handleCheckEligibility = () => {
    if (!policyNumber.trim()) {
      showAlert('Required', 'Please enter your Health Insurance Policy Number or TPA Card ID.');
      return;
    }

    showAlert(
      'Claim Eligibility Initiated! 📑',
      `Our hospital cashless desk has forwarded Policy #${policyNumber} (${insurerName}) for pre-authorization check. We will notify you of approved OPD/IPD coverage limits in 30 minutes.`
    );
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
          <Text style={styles.headerTitle}>Fertility Insurance & Financing</Text>
          <Text style={styles.headerSubtitle}>Cashless TPAs & 0% Interest EMI</Text>
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
        {/* Intro Banner */}
        <View style={styles.bannerCard}>
          <View style={styles.bannerIconWrap}>
            <Ionicons name="shield-checkmark" size={24} color="#059669" />
          </View>
          <View style={styles.bannerInfo}>
            <Text style={styles.bannerTitle}>Infertility Health Coverage in India</Text>
            <Text style={styles.bannerBody}>
              Under updated IRDAI directives, diagnostic evaluations and day-care surgical interventions are increasingly covered. Transparent 0% EMI ensures zero upfront financial stress.
            </Text>
          </View>
        </View>

        {/* Coverage Guidelines Bullets */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Key Coverage Highlights</Text>
          <View style={styles.bulletList}>
            {fertilityInsuranceDetails.bulletPoints.map((pt, idx) => (
              <View key={idx} style={styles.bulletRow}>
                <Ionicons name="checkmark-circle" size={16} color="#059669" />
                <Text style={styles.bulletText}>{pt}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Partner TPAs & Insurers */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Partner Cashless Insurers & TPAs</Text>
          <View style={styles.tpaList}>
            {fertilityInsuranceDetails.partnerTPAs.map((tpa, idx) => (
              <View key={idx} style={styles.tpaItem}>
                <View style={styles.tpaIconWrap}>
                  <Ionicons name="business-outline" size={18} color="#E11D48" />
                </View>
                <View style={styles.tpaInfo}>
                  <Text style={styles.tpaName}>{tpa.name}</Text>
                  <Text style={styles.tpaLimit}>{tpa.maxLimit}</Text>
                </View>
                <View style={styles.tpaBadge}>
                  <Text style={styles.tpaBadgeText}>{tpa.status}</Text>
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* Cashless Verification Form */}
        <View style={styles.formCard}>
          <Text style={styles.formTitle}>Check Cashless Policy Eligibility</Text>
          <Text style={styles.formSub}>
            Submit your policy card details for a free, confidential coverage audit by our billing desk.
          </Text>

          <Text style={styles.inputLabel}>Insurance Provider / TPA Name</Text>
          <TextInput
            style={styles.input}
            value={insurerName}
            onChangeText={setInsurerName}
            placeholder="e.g. Star Health, HDFC ERGO, ICICI Lombard"
            placeholderTextColor="#94A3B8"
          />

          <Text style={styles.inputLabel}>Policy Number / TPA Member ID *</Text>
          <TextInput
            style={styles.input}
            value={policyNumber}
            onChangeText={setPolicyNumber}
            placeholder="Enter policy number"
            placeholderTextColor="#94A3B8"
          />

          <View style={styles.twoColRow}>
            <View style={styles.colHalf}>
              <Text style={styles.inputLabel}>Patient Name</Text>
              <TextInput
                style={styles.input}
                value={patientName}
                onChangeText={setPatientName}
                placeholder="Full name"
                placeholderTextColor="#94A3B8"
              />
            </View>
            <View style={styles.colHalf}>
              <Text style={styles.inputLabel}>Contact Phone</Text>
              <TextInput
                style={styles.input}
                value={phone}
                onChangeText={setPhone}
                keyboardType="phone-pad"
                placeholder="10-digit phone"
                placeholderTextColor="#94A3B8"
              />
            </View>
          </View>

          <TouchableOpacity
            style={styles.checkBtn}
            onPress={handleCheckEligibility}
            activeOpacity={0.85}
          >
            <Ionicons name="search-outline" size={16} color="#FFFFFF" />
            <Text style={styles.checkBtnText}>Verify Cashless Coverage</Text>
          </TouchableOpacity>
        </View>

        {/* 0% EMI Quick Link */}
        <TouchableOpacity
          style={styles.emiBanner}
          onPress={() => navigation.navigate('IVFPackage')}
          activeOpacity={0.85}
        >
          <Ionicons name="calculator-outline" size={24} color="#059669" />
          <View style={{ flex: 1 }}>
            <Text style={styles.emiBannerTitle}>Explore 0% Interest EMI Calculator</Text>
            <Text style={styles.emiBannerSub}>
              Split treatment into 6, 12, 18, or 24 months with zero interest.
            </Text>
          </View>
          <Ionicons name="arrow-forward" size={18} color="#059669" />
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
    fontSize: 16,
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
    maxWidth: 900,
    width: '100%',
    alignSelf: 'center',
    paddingHorizontal: 24,
  },
  bannerCard: {
    flexDirection: 'row',
    backgroundColor: '#ECFDF5',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#A7F3D0',
    gap: 12,
    marginBottom: 16,
  },
  bannerIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bannerInfo: {
    flex: 1,
  },
  bannerTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#065F46',
  },
  bannerBody: {
    fontSize: 12,
    color: '#047857',
    marginTop: 4,
    lineHeight: 18,
  },
  sectionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 12,
  },
  bulletList: {
    gap: 10,
  },
  bulletRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  bulletText: {
    fontSize: 12,
    color: '#334155',
    flex: 1,
    lineHeight: 17,
  },
  tpaList: {
    gap: 10,
  },
  tpaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    padding: 12,
    borderRadius: 12,
    gap: 10,
  },
  tpaIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: '#FFF1F2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  tpaInfo: {
    flex: 1,
  },
  tpaName: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0F172A',
  },
  tpaLimit: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
  },
  tpaBadge: {
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  tpaBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#2563EB',
  },
  formCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    marginBottom: 16,
  },
  formTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
  },
  formSub: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
    marginBottom: 12,
    lineHeight: 16,
  },
  inputLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#334155',
    marginBottom: 6,
    marginTop: 8,
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
  twoColRow: {
    flexDirection: 'row',
    gap: 10,
  },
  colHalf: {
    flex: 1,
  },
  checkBtn: {
    backgroundColor: '#E11D48',
    paddingVertical: 12,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 16,
  },
  checkBtnText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 13,
  },
  emiBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#F0FDF4',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#BBF7D0',
    marginBottom: 20,
  },
  emiBannerTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#166534',
  },
  emiBannerSub: {
    fontSize: 11,
    color: '#15803D',
    marginTop: 2,
  },
});

export default FertilityInsuranceScreen;
