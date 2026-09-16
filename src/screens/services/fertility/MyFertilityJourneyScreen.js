import React from 'react';
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
import { samplePatientJourneys } from '../../../data/fertilityData';
import WebFooter from '../../../components/web/WebFooter';

const MyFertilityJourneyScreen = ({ navigation }) => {
  const { width } = useWindowDimensions();
  const isDesktopWeb = Platform.OS === 'web' && width >= 992;

  const iuiJourney = samplePatientJourneys.iui;
  const ivfJourney = samplePatientJourneys.ivf;

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
          <Text style={styles.headerTitle}>My Fertility Journey</Text>
          <Text style={styles.headerSubtitle}>Active Cycles, Appointments & Care Dossier</Text>
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
        {/* Active Cycles Section */}
        <Text style={styles.sectionHeading}>Active Assisted Cycles</Text>

        {/* Active IUI Card */}
        <TouchableOpacity
          style={styles.cycleCard}
          onPress={() => navigation.navigate('IUIJourney')}
          activeOpacity={0.9}
        >
          <View style={styles.cycleTopRow}>
            <View style={styles.tagPill}>
              <View style={styles.dot} />
              <Text style={styles.tagText}>CYCLE IN PROGRESS</Text>
            </View>
            <Text style={styles.cycleType}>IUI Protocol</Text>
          </View>

          <Text style={styles.cycleTitle}>IUI Natural / Mild Stimulation Cycle</Text>
          <Text style={styles.cycleDoctor}>
            Treating Specialist: {iuiJourney.doctorName} ({iuiJourney.clinicName.split(' - ')[0]})
          </Text>

          <View style={styles.cycleMilestoneBox}>
            <Ionicons name="calendar-outline" size={15} color="#E11D48" />
            <Text style={styles.cycleMilestoneText}>
              Current: Cycle Day {iuiJourney.cycleDay} • Pre-Trigger Scan & hCG Due Tonight
            </Text>
          </View>

          <View style={styles.cycleFooter}>
            <Text style={styles.openTrackerText}>Open Daily Protocol Tracker</Text>
            <Ionicons name="arrow-forward" size={15} color="#E11D48" />
          </View>
        </TouchableOpacity>

        {/* Active IVF Card */}
        <TouchableOpacity
          style={styles.cycleCard}
          onPress={() => navigation.navigate('IVFJourney')}
          activeOpacity={0.9}
        >
          <View style={styles.cycleTopRow}>
            <View style={[styles.tagPill, { backgroundColor: '#EFF6FF', borderColor: '#BFDBFE' }]}>
              <View style={[styles.dot, { backgroundColor: '#2563EB' }]} />
              <Text style={[styles.tagText, { color: '#2563EB' }]}>SCHEDULED CYCLE</Text>
            </View>
            <Text style={styles.cycleType}>IVF / ICSI Protocol</Text>
          </View>

          <Text style={styles.cycleTitle}>Advanced ICSI with Blastocyst Culture</Text>
          <Text style={styles.cycleDoctor}>
            Lab Director: Dr. Priya V. Shenoy • ISO-5 Modular Cleanroom
          </Text>

          <View style={[styles.cycleMilestoneBox, { backgroundColor: '#F0F9FF', borderColor: '#BAE6FD' }]}>
            <Ionicons name="flask-outline" size={15} color="#0284C7" />
            <Text style={[styles.cycleMilestoneText, { color: '#0369A1' }]}>
              Stage 1: Ovarian Stimulation Monitoring (Day 9)
            </Text>
          </View>

          <View style={styles.cycleFooter}>
            <Text style={styles.openTrackerText}>Open IVF Stage Visualizer</Text>
            <Ionicons name="arrow-forward" size={15} color="#E11D48" />
          </View>
        </TouchableOpacity>

        {/* Quick Access Tiles */}
        <Text style={[styles.sectionHeading, { marginTop: 14 }]}>Patient Tools & Vault</Text>
        <View style={styles.toolsGrid}>
          <TouchableOpacity
            style={styles.toolTile}
            onPress={() => navigation.navigate('FertilityRecords')}
            activeOpacity={0.85}
          >
            <View style={[styles.toolIconCircle, { backgroundColor: '#EFF6FF' }]}>
              <Ionicons name="folder" size={20} color="#2563EB" />
            </View>
            <Text style={styles.toolTitle}>Clinical Vault</Text>
            <Text style={styles.toolSub}>5 Scans & Semen reports</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.toolTile}
            onPress={() => navigation.navigate('FertilityCoordinator')}
            activeOpacity={0.85}
          >
            <View style={[styles.toolIconCircle, { backgroundColor: '#F0FDF4' }]}>
              <Ionicons name="people" size={20} color="#059669" />
            </View>
            <Text style={styles.toolTitle}>Care Coordinator</Text>
            <Text style={styles.toolSub}>Nurse Swathi Nair</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.toolTile}
            onPress={() => navigation.navigate('SecondOpinion')}
            activeOpacity={0.85}
          >
            <View style={[styles.toolIconCircle, { backgroundColor: '#FAF5FF' }]}>
              <Ionicons name="medkit" size={20} color="#7C3AED" />
            </View>
            <Text style={styles.toolTitle}>Second Opinion</Text>
            <Text style={styles.toolSub}>Senior IVF panel</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.toolTile}
            onPress={() => navigation.navigate('FertilityInsurance')}
            activeOpacity={0.85}
          >
            <View style={[styles.toolIconCircle, { backgroundColor: '#FFFBEB' }]}>
              <Ionicons name="card" size={20} color="#D97706" />
            </View>
            <Text style={styles.toolTitle}>Insurance & EMI</Text>
            <Text style={styles.toolSub}>Cashless TPA desk</Text>
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
    fontSize: 14,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 10,
  },
  cycleCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    marginBottom: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  cycleTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  tagPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#059669',
  },
  tagText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#059669',
    letterSpacing: 0.3,
  },
  cycleType: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748B',
  },
  cycleTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
  },
  cycleDoctor: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
    marginBottom: 10,
  },
  cycleMilestoneBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FFF1F2',
    padding: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#FECDD3',
    marginBottom: 12,
  },
  cycleMilestoneText: {
    fontSize: 11,
    color: '#9F1239',
    fontWeight: '600',
    flex: 1,
  },
  cycleFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F8FAFC',
  },
  openTrackerText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#E11D48',
  },
  toolsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  toolTile: {
    width: '48%',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  toolIconCircle: {
    width: 38,
    height: 38,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  toolTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0F172A',
  },
  toolSub: {
    fontSize: 10,
    color: '#64748B',
    marginTop: 2,
  },
});

export default MyFertilityJourneyScreen;
