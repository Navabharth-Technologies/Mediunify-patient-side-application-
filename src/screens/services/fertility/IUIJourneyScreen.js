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

const IUIJourneyScreen = ({ navigation }) => {
  const { width } = useWindowDimensions();
  const isDesktopWeb = Platform.OS === 'web' && width >= 992;

  const journey = samplePatientJourneys.iui;
  const [activeStageIndex, setActiveStageIndex] = useState(journey.currentStageIndex);

  const selectedStage = journey.stages[activeStageIndex] || journey.stages[0];

  const handleStageAction = (stage) => {
    showAlert(
      'Milestone Updated',
      `You marked "${stage.title}" check-in as acknowledged. Your care coordinator has been notified.`
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
          <Text style={styles.headerTitle}>IUI Journey Tracker</Text>
          <Text style={styles.headerSubtitle}>
            Cycle Day {journey.cycleDay} • {journey.doctorName}
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
        {/* Active Journey Status Card */}
        <View style={styles.heroStatusCard}>
          <View style={styles.heroTopRow}>
            <View style={styles.activePill}>
              <View style={styles.pulseDot} />
              <Text style={styles.activePillText}>ACTIVE IUI CYCLE</Text>
            </View>
            <Text style={styles.cycleStartDate}>Started {journey.cycleStartDate}</Text>
          </View>

          <Text style={styles.cycleDayLarge}>Cycle Day {journey.cycleDay}</Text>
          <Text style={styles.cycleDaySub}>
            Stage: {selectedStage.title.split(' - ')[1] || selectedStage.title}
          </Text>

          {/* Trigger Alert Box */}
          <View style={styles.triggerAlertBox}>
            <Ionicons name="alarm" size={20} color="#E11D48" />
            <View style={styles.triggerTextCol}>
              <Text style={styles.triggerHead}>Ovulation Trigger Tonight!</Text>
              <Text style={styles.triggerBody}>
                Administer Inj Ovidrel 250mcg strictly at 09:00 PM tonight. Your partner should provide sample on Thursday 08:00 AM.
              </Text>
            </View>
          </View>
        </View>

        {/* Selected Stage Detail Card */}
        <TreatmentStageCard
          stage={selectedStage}
          onActionPress={handleStageAction}
          actionLabel="Acknowledge & Confirm Completed"
        />

        {/* Milestone Timeline */}
        <View style={styles.timelineSection}>
          <Text style={styles.sectionHeading}>IUI Cycle Milestones</Text>
          <TreatmentJourneyTimeline
            stages={journey.stages}
            currentStageIndex={journey.currentStageIndex}
            onSelectStage={(stage, index) => setActiveStageIndex(index)}
          />
        </View>

        {/* Quick Links Row */}
        <View style={styles.linksRow}>
          <TouchableOpacity
            style={styles.linkCard}
            onPress={() => navigation.navigate('FertilityRecords')}
            activeOpacity={0.8}
          >
            <Ionicons name="folder-outline" size={20} color="#0284C7" />
            <Text style={styles.linkCardTitle}>Follicle Scans</Text>
            <Text style={styles.linkCardSub}>View TVS ultrasound reports</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.linkCard}
            onPress={() => navigation.navigate('FertilityAI')}
            activeOpacity={0.8}
          >
            <Ionicons name="sparkles-outline" size={20} color="#7C3AED" />
            <Text style={styles.linkCardTitle}>Ask Fertility AI</Text>
            <Text style={styles.linkCardSub}>IUI diet & trigger tips</Text>
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
  heroStatusCard: {
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
  heroTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  activePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  pulseDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#059669',
  },
  activePillText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#059669',
    letterSpacing: 0.3,
  },
  cycleStartDate: {
    fontSize: 11,
    color: '#64748B',
  },
  cycleDayLarge: {
    fontSize: 22,
    fontWeight: '900',
    color: '#0F172A',
  },
  cycleDaySub: {
    fontSize: 12,
    color: '#E11D48',
    fontWeight: '600',
    marginTop: 2,
    marginBottom: 12,
  },
  triggerAlertBox: {
    flexDirection: 'row',
    gap: 10,
    backgroundColor: '#FFF1F2',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FECDD3',
  },
  triggerTextCol: {
    flex: 1,
  },
  triggerHead: {
    fontSize: 12,
    fontWeight: '800',
    color: '#9F1239',
  },
  triggerBody: {
    fontSize: 11,
    color: '#4C0519',
    marginTop: 2,
    lineHeight: 16,
  },
  timelineSection: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    marginBottom: 14,
  },
  sectionHeading: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 10,
  },
  linksRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  linkCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  linkCardTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0F172A',
    marginTop: 6,
  },
  linkCardSub: {
    fontSize: 10,
    color: '#64748B',
    marginTop: 2,
  },
});

export default IUIJourneyScreen;
