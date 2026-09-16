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
import { fertilityTreatments, emiPlans } from '../../../data/fertilityData';
import { PackageCard } from '../../../components/fertility';
import { showAlert } from '../../../utils/alert';
import WebFooter from '../../../components/web/WebFooter';

const IVFPackageScreen = ({ navigation }) => {
  const { width } = useWindowDimensions();
  const isDesktopWeb = Platform.OS === 'web' && width >= 992;

  const [selectedPackage, setSelectedPackage] = useState(fertilityTreatments[1]); // IVF
  const [selectedTenure, setSelectedTenure] = useState(18);

  const calculateMonthly = (price, tenure) => {
    return Math.round(price / tenure);
  };

  const monthlyEmi = calculateMonthly(selectedPackage.price, selectedTenure);

  const handleApplyEmi = () => {
    showAlert(
      'EMI Pre-Approval Initiated! 💳',
      `Your 0% EMI financing application for "${selectedPackage.title}" at ₹${monthlyEmi.toLocaleString(
        'en-IN'
      )}/mo for ${selectedTenure} months has been pre-approved with zero documentation charges. Our financial counselor will call you within 15 minutes.`
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
          <Text style={styles.headerTitle}>IVF Packages & 0% EMI</Text>
          <Text style={styles.headerSubtitle}>Transparent Pricing with Zero Hidden Fees</Text>
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
        {/* Package Selector Cards */}
        <Text style={styles.sectionHeading}>Choose Treatment Package</Text>
        <View style={styles.packageList}>
          {fertilityTreatments.slice(1, 4).map((pkg) => (
            <PackageCard
              key={pkg.id}
              pkg={pkg}
              onPress={() => setSelectedPackage(pkg)}
              onCalculateEmi={() => setSelectedPackage(pkg)}
            />
          ))}
        </View>

        {/* Dynamic 0% EMI Calculator Card */}
        <View style={styles.calcCard}>
          <View style={styles.calcHeaderRow}>
            <View style={styles.calcIconWrap}>
              <Ionicons name="calculator-outline" size={22} color="#059669" />
            </View>
            <View style={styles.calcHeaderInfo}>
              <Text style={styles.calcTitle}>0% Interest EMI Calculator</Text>
              <Text style={styles.calcSub}>
                Selected: {selectedPackage.title} (₹{selectedPackage.price.toLocaleString('en-IN')})
              </Text>
            </View>
          </View>

          {/* Tenure Buttons */}
          <Text style={styles.tenureLabel}>Select Repayment Tenure (0% Interest):</Text>
          <View style={styles.tenureRow}>
            {emiPlans.map((plan) => (
              <TouchableOpacity
                key={plan.tenureMonths}
                style={[
                  styles.tenureBtn,
                  selectedTenure === plan.tenureMonths && styles.tenureBtnActive,
                ]}
                onPress={() => setSelectedTenure(plan.tenureMonths)}
                activeOpacity={0.8}
              >
                <Text
                  style={[
                    styles.tenureMonthsText,
                    selectedTenure === plan.tenureMonths && styles.tenureMonthsTextActive,
                  ]}
                >
                  {plan.tenureMonths} Mos
                </Text>
                <Text
                  style={[
                    styles.zeroFeeText,
                    selectedTenure === plan.tenureMonths && styles.zeroFeeTextActive,
                  ]}
                >
                  0% Rate
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Output Monthly Box */}
          <View style={styles.outputBox}>
            <View>
              <Text style={styles.outputLabel}>Monthly Installment</Text>
              <Text style={styles.outputEmi}>₹{monthlyEmi.toLocaleString('en-IN')}/month</Text>
            </View>
            <View style={styles.processingBadge}>
              <Text style={styles.processingText}>Processing Fee: ₹0</Text>
            </View>
          </View>

          <TouchableOpacity
            style={styles.applyEmiBtn}
            onPress={handleApplyEmi}
            activeOpacity={0.85}
          >
            <Ionicons name="flash-outline" size={16} color="#FFFFFF" />
            <Text style={styles.applyEmiBtnText}>Instant Pre-Approval in 15 Mins</Text>
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
  sectionHeading: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 12,
  },
  packageList: {
    marginBottom: 10,
  },
  calcCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 18,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  calcHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 14,
  },
  calcIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#ECFDF5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  calcHeaderInfo: {
    flex: 1,
  },
  calcTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
  },
  calcSub: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
  },
  tenureLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#334155',
    marginBottom: 8,
  },
  tenureRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 14,
  },
  tenureBtn: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: 'center',
  },
  tenureBtnActive: {
    backgroundColor: '#0F172A',
    borderColor: '#0F172A',
  },
  tenureMonthsText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#334155',
  },
  tenureMonthsTextActive: {
    color: '#FFFFFF',
  },
  zeroFeeText: {
    fontSize: 10,
    color: '#059669',
    fontWeight: '700',
    marginTop: 2,
  },
  zeroFeeTextActive: {
    color: '#86EFAC',
  },
  outputBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F0FDF4',
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#BBF7D0',
    marginBottom: 16,
  },
  outputLabel: {
    fontSize: 11,
    color: '#166534',
    fontWeight: '600',
  },
  outputEmi: {
    fontSize: 20,
    fontWeight: '900',
    color: '#14532D',
    marginTop: 2,
  },
  processingBadge: {
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  processingText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#15803D',
  },
  applyEmiBtn: {
    backgroundColor: '#059669',
    paddingVertical: 13,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  applyEmiBtnText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#FFFFFF',
  },
});

export default IVFPackageScreen;
