import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import StatusBadge from './StatusBadge';

const CareRequestCard = ({ request, onPress, onCancel }) => {
  if (!request) return null;

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={() => onPress && onPress(request)}
      activeOpacity={0.9}
    >
      <View style={styles.header}>
        <View>
          <Text style={styles.reqIdText}>Request #{request.id}</Text>
          <Text style={styles.dateText}>{request.date || 'Submitted Recently'}</Text>
        </View>
        <StatusBadge
          status={request.status || 'pending'}
          label={request.statusLabel || request.status || 'Under Review'}
        />
      </View>

      <View style={styles.body}>
        <View style={styles.infoRow}>
          <Ionicons name="people-outline" size={15} color="#64748B" />
          <Text style={styles.coupleText} numberOfLines={1}>
            {request.partnerName || 'Ananya & Ramesh'}
          </Text>
        </View>

        <View style={styles.infoRow}>
          <Ionicons name="business-outline" size={15} color="#64748B" />
          <Text style={styles.clinicText} numberOfLines={1}>
            {request.clinicName || 'Nova IVF Fertility Mysuru'}
          </Text>
        </View>

        {request.consultMode && (
          <View style={styles.infoRow}>
            <Ionicons name="videocam-outline" size={15} color="#64748B" />
            <Text style={styles.modeText}>{request.consultMode}</Text>
          </View>
        )}
      </View>

      <View style={styles.footer}>
        <View style={styles.stepCountWrap}>
          <Ionicons name="document-text-outline" size={13} color="#059669" />
          <Text style={styles.docCountText}>
            {request.documentsCount || 2} Documents Attached
          </Text>
        </View>

        <View style={styles.actionsRow}>
          {onCancel && (
            <TouchableOpacity
              style={styles.cancelBtn}
              onPress={() => onCancel(request)}
              activeOpacity={0.8}
            >
              <Text style={styles.cancelText}>Withdraw</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity
            style={styles.viewBtn}
            onPress={() => onPress && onPress(request)}
            activeOpacity={0.85}
          >
            <Text style={styles.viewBtnText}>View Summary</Text>
            <Ionicons name="arrow-forward" size={13} color="#E11D48" />
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
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
    borderBottomWidth: 1,
    borderBottomColor: '#F8FAFC',
    paddingBottom: 10,
    marginBottom: 10,
  },
  reqIdText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0F172A',
  },
  dateText: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
  },
  body: {
    gap: 6,
    marginBottom: 12,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  coupleText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1E293B',
  },
  clinicText: {
    fontSize: 12,
    color: '#475569',
  },
  modeText: {
    fontSize: 12,
    color: '#0284C7',
    fontWeight: '600',
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  stepCountWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  docCountText: {
    fontSize: 11,
    color: '#059669',
    fontWeight: '600',
  },
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  cancelBtn: {
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  cancelText: {
    fontSize: 12,
    color: '#94A3B8',
    fontWeight: '600',
  },
  viewBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  viewBtnText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#E11D48',
  },
});

export default CareRequestCard;
