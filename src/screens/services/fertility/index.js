/**
 * Fertility & IVF screens barrel export
 * Stub implementations — replace each with the full screen when ready.
 */
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const makeStub = (title) => ({ navigation }) => (
  <SafeAreaView edges={['top', 'left', 'right']} style={styles.container}>
    <View style={styles.card}>
      <Text style={styles.emoji}>•</Text>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.subtitle}>This section is coming soon.</Text>
      <TouchableOpacity style={styles.btn} onPress={() => navigation.goBack()}>
        <Text style={styles.btnText}>Go Back</Text>
      </TouchableOpacity>
    </View>
  </SafeAreaView>
);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC', justifyContent: 'center', alignItems: 'center' },
  card: { backgroundColor: '#FFFFFF', borderRadius: 20, padding: 32, alignItems: 'center', maxWidth: 360, width: '90%', shadowColor: '#0F172A', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.08, shadowRadius: 24, elevation: 6 },
  emoji: { fontSize: 48, marginBottom: 16 },
  title: { fontSize: 20, fontWeight: '800', color: '#0F172A', textAlign: 'center', marginBottom: 8 },
  subtitle: { fontSize: 14, color: '#64748B', textAlign: 'center', marginBottom: 24 },
  btn: { backgroundColor: '#00B894', borderRadius: 10, paddingHorizontal: 24, paddingVertical: 12 },
  btnText: { fontSize: 14, fontWeight: '700', color: '#FFFFFF' },
});

export const FertilityIvfScreen           = makeStub('Fertility & IVF');
export const FertilitySpecialistsScreen   = makeStub('Fertility Specialists');
export const FertilityDoctorProfileScreen = makeStub('Fertility Doctor Profile');
export const FertilityClinicsScreen       = makeStub('Fertility Clinics');
export const FertilityClinicProfileScreen = makeStub('Clinic Profile');
export const CompareClinicsScreen         = makeStub('Compare Clinics');
export const FertilityCareRequestScreen   = makeStub('Fertility Care Request');
export const FertilityConsentScreen       = makeStub('Consent & Agreement');
export const FertilityTestsScreen         = makeStub('Fertility Tests');
export const FertilityTestDetailsScreen   = makeStub('Test Details');
export const IUIJourneyScreen             = makeStub('IUI Journey');
export const IVFJourneyScreen             = makeStub('IVF Journey');
export const TreatmentDetailsScreen       = makeStub('Treatment Details');
export const IVFPackageScreen             = makeStub('IVF Packages');
export const SecondOpinionScreen          = makeStub('Second Opinion');
export const MyFertilityJourneyScreen     = makeStub('My Fertility Journey');
export const FertilityRecordsScreen       = makeStub('Fertility Records');
export const FertilityInsuranceScreen     = makeStub('Fertility Insurance');
export const FertilityCoordinatorScreen   = makeStub('Fertility Coordinator');
export const FertilityNotificationsScreen = makeStub('Fertility Notifications');
export const FertilityAIScreen            = makeStub('Fertility AI Assistant');
