import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const TreatmentJourneyTimeline = ({
  stages = [],
  currentStageIndex = 0,
  onSelectStage,
  activeColor = '#E11D48',
}) => {
  if (!stages || stages.length === 0) return null;

  return (
    <View style={styles.container}>
      {stages.map((stage, index) => {
        const isCompleted = stage.completed || index < currentStageIndex;
        const isCurrent = index === currentStageIndex || stage.isCurrent;
        const isLast = index === stages.length - 1;

        return (
          <TouchableOpacity
            key={stage.id || index}
            style={styles.stageItemRow}
            onPress={() => onSelectStage && onSelectStage(stage, index)}
            activeOpacity={0.8}
          >
            {/* Timeline Left Column (Node + Line) */}
            <View style={styles.leftTimelineCol}>
              <View
                style={[
                  styles.nodeCircle,
                  isCompleted && { backgroundColor: '#059669', borderColor: '#059669' },
                  isCurrent && { backgroundColor: '#FFFFFF', borderColor: activeColor, borderWidth: 3 },
                ]}
              >
                {isCompleted ? (
                  <Ionicons name="checkmark" size={12} color="#FFFFFF" />
                ) : isCurrent ? (
                  <View style={[styles.innerCurrentDot, { backgroundColor: activeColor }]} />
                ) : (
                  <Text style={styles.nodeIndexText}>{index + 1}</Text>
                )}
              </View>
              {!isLast && (
                <View
                  style={[
                    styles.verticalLine,
                    isCompleted && { backgroundColor: '#059669' },
                  ]}
                />
              )}
            </View>

            {/* Timeline Right Content Card */}
            <View
              style={[
                styles.contentBox,
                isCurrent && { borderColor: activeColor, backgroundColor: '#FFF1F2' },
              ]}
            >
              <View style={styles.contentHeader}>
                <Text
                  style={[
                    styles.stageTitle,
                    isCurrent && { color: activeColor, fontWeight: '800' },
                  ]}
                >
                  {stage.title}
                </Text>
                {stage.date && <Text style={styles.stageDate}>{stage.date}</Text>}
              </View>

              {stage.subtitle && (
                <Text style={styles.stageSubtitle}>{stage.subtitle}</Text>
              )}

              {stage.description && (
                <Text style={styles.stageDesc} numberOfLines={2}>
                  {stage.description}
                </Text>
              )}

              {isCurrent && stage.doctorNote && (
                <View style={styles.currentNoteBox}>
                  <Ionicons name="chatbox-ellipses-outline" size={13} color={activeColor} />
                  <Text style={styles.currentNoteText} numberOfLines={2}>
                    {stage.doctorNote}
                  </Text>
                </View>
              )}
            </View>
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingVertical: 8,
  },
  stageItemRow: {
    flexDirection: 'row',
    marginBottom: 6,
  },
  leftTimelineCol: {
    alignItems: 'center',
    width: 36,
    marginRight: 8,
  },
  nodeCircle: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#F1F5F9',
    borderColor: '#CBD5E1',
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
  },
  innerCurrentDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  nodeIndexText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748B',
  },
  verticalLine: {
    width: 2,
    flex: 1,
    backgroundColor: '#E2E8F0',
    marginVertical: 4,
  },
  contentBox: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    marginBottom: 10,
  },
  contentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 6,
  },
  stageTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
    flex: 1,
  },
  stageDate: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '500',
  },
  stageSubtitle: {
    fontSize: 11,
    color: '#E11D48',
    fontWeight: '600',
    marginTop: 2,
  },
  stageDesc: {
    fontSize: 11,
    color: '#475569',
    marginTop: 4,
    lineHeight: 16,
  },
  currentNoteBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
    marginTop: 8,
    backgroundColor: '#FFFFFF',
    padding: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FECDD3',
  },
  currentNoteText: {
    fontSize: 11,
    color: '#9F1239',
    flex: 1,
    fontWeight: '500',
  },
});

export default TreatmentJourneyTimeline;
