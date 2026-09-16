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
import { samplePatientJourneys } from '../../../data/fertilityData';
import { TreatmentJourneyTimeline, TreatmentStageCard } from '../../../components/fertility';
import { showAlert } from '../../../utils/alert';
import WebFooter from '../../../components/web/WebFooter';

const IVFJourneyScreen = ({ navigation }) => {
  const { width } = useWindowDimensions();
  const isDesktopWeb = Platform.OS === 'web' && width >= 992;

  const journey = samplePatientJourneys.ivf;
  const [activeStageIndex, setActiveStageIndex] = useState(journey.currentStageIndex);

  const selectedStage = journey.stages[activeStageIndex] || journey.stages[0];

  const handleStageChecklistUpdate = (stage) => {
    showAlert(
      'Protocol Checklist Saved',
      `Your daily checklist for "${stage.title}" has been synced with your embryology care team.`
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
          <Text style={styles.headerTitle}>IVF & ICSI Journey</Text>
          <Text style={styles.headerSubtitle}>
            {journey.currentDay} • {journey.doctorName}
          </Text>
        </View>
        <TouchableOpacity
          style={styles.coordinatorBtn}
          onPress={() => navigation.navigate('FertilityCoordinator')}
        >
          <Ionicons name="chatbubbles-outline" size={18} color="#E11D48" />
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
        {/* Top Status Card */}
        <View style={styles.statusCard}>
          <View style={styles.statusBadgeRow}>
            <View style={styles.pulsePill}>
              <View style={styles.pulseDot} />
              <Text style={styles.pulseText}>STIMULATION CYCLE ACTIVE</Text>
            </View>
            <Text style={styles.protocolText}>{journey.protocol}</Text>
          </View>

          <Text style={styles.currentStageHeading}>
            Stage {activeStageIndex + 1}: {selectedStage.title.split(': ')[1] || selectedStage.title}
          </Text>
          <Text style={styles.statusSub}>{selectedStage.status}</Text>

          {/* Progress Bar */}
          <View style={styles.progressContainer}>
            <View style={styles.progressBg}>
              <View
                style={[
                  styles.progressBar,
                  { width: `${selectedStage.progressPercent || 85}%` },
                ]}
              />
            </View>
            <Text style={styles.progressLabel}>
              {selectedStage.progressPercent || 85}% Completed in Current Stage
            </Text>
          </View>
        </View>

        {/* Selected Stage Interactive Card */}
        <TreatmentStageCard
          stage={selectedStage}
          onActionPress={handleStageChecklistUpdate}
          actionLabel="Update & Sync Daily Milestones"
        />

        {/* 6-Stage Timeline Visualizer */}
        <View style={styles.timelineCard}>
          <Text style={styles.timelineHeading}>IVF Protocol Milestones</Text>
          <TreatmentJourneyTimeline
            stages={journey.stages}
            currentStageIndex={journey.currentStageIndex}
            onSelectStage={(stage, index) => setActiveStageIndex(index)}
          />
        </View>

        {/* Quick Help & Vault Grid */}
        <View style={styles.quickGrid}>
          <TouchableOpacity
            style={styles.gridBox}
            onPress={() => navigation.navigate('FertilityRecords')}
            activeOpacity={0.8}
          >
            <Ionicons name="folder-outline" size={20} color="#0284C7" />
            <Text style={styles.gridTitle}>Embryology Records</Text>
            <Text style={styles.gridSub}>View blastocyst photos & reports</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.gridBox}
            onPress={() => navigation.navigate('SecondOpinion')}
            activeOpacity={0.8}
          >
            <Ionicons name="medical-outline" size={20} color="#7C3AED" />
            <Text style={styles.gridTitle}>Second Opinion</Text>
            <Text style={styles.gridSub}>Request senior specialist review</Text>
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
  coordinatorBtn: {
    padding: 6,
    borderRadius: 8,
    backgroundColor: '#FFF1F2',
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
  statusCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 18,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    marginBottom: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  statusBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  pulsePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FFF1F2',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  pulseDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#E11D48',
  },
  pulseText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#BE123C',
    letterSpacing: 0.3,
  },
  protocolText: {
    fontSize: 10,
    color: '#64748B',
    fontWeight: '500',
    maxWidth: 180,
    textAlign: 'right',
  },
  currentStageHeading: {
    fontSize: 18,
    fontWeight: '900',
    color: '#0F172A',
  },
  statusSub: {
    fontSize: 12,
    color: '#E11D48',
    fontWeight: '700',
    marginTop: 2,
    marginBottom: 12,
  },
  progressContainer: {
    marginTop: 4,
  },
  progressBg: {
    height: 8,
    backgroundColor: '#F1F5F9',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#E11D48',
    borderRadius: 4,
  },
  progressLabel: {
    fontSize: 10,
    color: '#64748B',
    marginTop: 6,
    fontWeight: '600',
  },
  timelineCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    marginBottom: 14,
  },
  timelineHeading: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 10,
  },
  quickGrid: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  gridBox: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  gridTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0F172A',
    marginTop: 6,
  },
  gridSub: {
    fontSize: 10,
    color: '#64748B',
    marginTop: 2,
  },
});

export default IVFJourneyScreen;
