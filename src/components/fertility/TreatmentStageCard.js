import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import StatusBadge from './StatusBadge';

const TreatmentStageCard = ({
  stage,
  onActionPress,
  actionLabel = 'Mark Done / Update',
}) => {
  if (!stage) return null;

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.stageTitle}>{stage.title}</Text>
          {stage.subtitle && <Text style={styles.stageSubtitle}>{stage.subtitle}</Text>}
        </View>
        <StatusBadge
          status={stage.completed ? 'completed' : stage.isCurrent ? 'active' : 'pending'}
          label={stage.status || (stage.completed ? 'Completed' : stage.isCurrent ? 'Current' : 'Upcoming')}
        />
      </View>

      {stage.doctorNotes && (
        <View style={styles.noteSection}>
          <View style={styles.noteHeader}>
            <Ionicons name="medkit-outline" size={14} color="#E11D48" />
            <Text style={styles.noteTitle}>Clinician Instructions</Text>
          </View>
          <Text style={styles.noteBody}>{stage.doctorNotes}</Text>
        </View>
      )}

      {stage.dailyChecklist && stage.dailyChecklist.length > 0 && (
        <View style={styles.checklistSection}>
          <Text style={styles.checklistTitle}>Daily Milestones & Medications</Text>
          {stage.dailyChecklist.map((item, idx) => (
            <View key={idx} style={styles.checkItem}>
              <Ionicons
                name={item.done ? 'checkmark-circle' : 'ellipse-outline'}
                size={16}
                color={item.done ? '#059669' : '#94A3B8'}
              />
              <Text style={[styles.checkText, item.done && styles.checkTextDone]}>
                {item.item}
              </Text>
            </View>
          ))}
        </View>
      )}

      {stage.medicines && stage.medicines.length > 0 && (
        <View style={styles.medsSection}>
          <Text style={styles.checklistTitle}>Prescribed Medications</Text>
          {stage.medicines.map((med, idx) => (
            <View key={idx} style={styles.medItem}>
              <Ionicons name="bandage-outline" size={13} color="#7C3AED" />
              <Text style={styles.medText}>{med}</Text>
            </View>
          ))}
        </View>
      )}

      {stage.nextAppointment && (
        <View style={styles.appointmentBanner}>
          <Ionicons name="calendar" size={15} color="#0284C7" />
          <View style={styles.appointmentCol}>
            <Text style={styles.appointmentLabel}>Upcoming Appointment</Text>
            <Text style={styles.appointmentVal}>{stage.nextAppointment}</Text>
          </View>
        </View>
      )}

      {onActionPress && (
        <TouchableOpacity
          style={styles.actionBtn}
          onPress={() => onActionPress(stage)}
          activeOpacity={0.85}
        >
          <Text style={styles.actionBtnText}>{actionLabel}</Text>
          <Ionicons name="chevron-forward" size={14} color="#FFFFFF" />
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 8,
    marginBottom: 12,
  },
  headerLeft: {
    flex: 1,
  },
  stageTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
  },
  stageSubtitle: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
  },
  noteSection: {
    backgroundColor: '#FFF1F2',
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: '#FECDD3',
    marginBottom: 12,
  },
  noteHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  noteTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#9F1239',
  },
  noteBody: {
    fontSize: 12,
    color: '#4C0519',
    lineHeight: 18,
  },
  checklistSection: {
    marginBottom: 12,
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    padding: 12,
  },
  checklistTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#334155',
    marginBottom: 8,
  },
  checkItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  checkText: {
    fontSize: 12,
    color: '#1E293B',
    flex: 1,
  },
  checkTextDone: {
    textDecorationLine: 'line-through',
    color: '#94A3B8',
  },
  medsSection: {
    marginBottom: 12,
    backgroundColor: '#F5F3FF',
    borderRadius: 10,
    padding: 12,
  },
  medItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  medText: {
    fontSize: 12,
    color: '#5B21B6',
    fontWeight: '500',
  },
  appointmentBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#F0F9FF',
    padding: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#BAE6FD',
    marginBottom: 12,
  },
  appointmentCol: {
    flex: 1,
  },
  appointmentLabel: {
    fontSize: 10,
    color: '#0369A1',
    fontWeight: '600',
  },
  appointmentVal: {
    fontSize: 12,
    color: '#0C4A6E',
    fontWeight: '700',
  },
  actionBtn: {
    backgroundColor: '#E11D48',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  actionBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 13,
  },
});

export default TreatmentStageCard;
