import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const FertilityRecordCard = ({ record, onView, onDownload }) => {
  if (!record) return null;

  const getTypeIcon = (type) => {
    switch (type) {
      case 'Ultrasound Report':
        return 'pulse-outline';
      case 'Semen Analysis':
        return 'fitness-outline';
      case 'Blood Test / Hormone':
        return 'flask-outline';
      case 'Prescription & Protocol':
        return 'bandage-outline';
      case 'Billing & Invoice':
        return 'receipt-outline';
      default:
        return 'document-text-outline';
    }
  };

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View style={styles.iconCircle}>
          <Ionicons name={getTypeIcon(record.type)} size={18} color="#E11D48" />
        </View>

        <View style={styles.headerInfo}>
          <Text style={styles.title} numberOfLines={1}>
            {record.title}
          </Text>
          <Text style={styles.subInfo}>
            {record.type} • {record.date}
          </Text>
        </View>

        <Text style={styles.sizeText}>{record.fileSize}</Text>
      </View>

      <Text style={styles.summaryText}>{record.summary}</Text>

      {record.tags && record.tags.length > 0 && (
        <View style={styles.tagsRow}>
          {record.tags.map((tag, i) => (
            <View key={i} style={styles.tagPill}>
              <Text style={styles.tagText}>{tag}</Text>
            </View>
          ))}
        </View>
      )}

      <View style={styles.footerRow}>
        <Text style={styles.clinicNote} numberOfLines={1}>
          By: {record.doctor} ({record.clinic})
        </Text>

        <View style={styles.btnRow}>
          {onDownload && (
            <TouchableOpacity
              style={styles.iconBtn}
              onPress={() => onDownload(record)}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Ionicons name="download-outline" size={16} color="#475569" />
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={styles.viewBtn}
            onPress={() => onView && onView(record)}
            activeOpacity={0.85}
          >
            <Text style={styles.viewBtnText}>View Report</Text>
            <Ionicons name="eye-outline" size={13} color="#E11D48" />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 8,
  },
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#FFF1F2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerInfo: {
    flex: 1,
  },
  title: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0F172A',
  },
  subInfo: {
    fontSize: 10,
    color: '#64748B',
    marginTop: 2,
  },
  sizeText: {
    fontSize: 10,
    color: '#94A3B8',
    fontWeight: '600',
  },
  summaryText: {
    fontSize: 11,
    color: '#475569',
    lineHeight: 16,
    marginBottom: 8,
  },
  tagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 10,
  },
  tagPill: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 4,
  },
  tagText: {
    fontSize: 10,
    color: '#475569',
    fontWeight: '600',
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#F8FAFC',
  },
  clinicNote: {
    fontSize: 10,
    color: '#64748B',
    flex: 1,
  },
  btnRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  iconBtn: {
    padding: 4,
  },
  viewBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FFF1F2',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
  },
  viewBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#E11D48',
  },
});

export default FertilityRecordCard;
